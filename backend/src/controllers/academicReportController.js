const { supabaseAdmin } = require('../config/supabase');

class AcademicReportController {
  // =============================================
  // GET CLASS PERFORMANCE
  // =============================================
  getClassPerformance = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { classId, termId } = req.query;

      if (!classId) {
        return res.status(400).json({ status: 'error', message: 'Class ID is required' });
      }

      // Get students in class
      const { data: students, error: studentsError } = await supabaseAdmin
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .eq('class_id', classId)
        .eq('is_active', true);

      if (studentsError) {
        console.error('Students fetch error:', studentsError);
      }

      // Get attendance stats
      const { data: attendance, error: attendanceError } = await supabaseAdmin
        .from('attendance')
        .select('date, status')
        .eq('class_id', classId);

      if (attendanceError) {
        console.error('Attendance fetch error:', attendanceError);
      }

      // Get grades with student and subject info
      let grades = [];
      let gradesError = null;
      
      if (termId) {
        const { data, error } = await supabaseAdmin
          .from('grades')
          .select('student_id, subject_id, total, grade')
          .eq('class_id', classId)
          .eq('term_id', termId);
        
        if (error) {
          console.error('Grades fetch error:', error);
          gradesError = error;
        } else {
          grades = data || [];
        }
      }

      // Get subject names for grades
      let subjectMap = {};
      if (grades.length > 0) {
        const subjectIds = [...new Set(grades.map(g => g.subject_id).filter(Boolean))];
        if (subjectIds.length > 0) {
          const { data: subjects } = await supabaseAdmin
            .from('subjects')
            .select('id, name')
            .in('id', subjectIds);
          subjects?.forEach(s => { subjectMap[s.id] = s; });
        }
      }

      // Get student names
      const studentMap = {};
      (students || []).forEach(s => {
        studentMap[s.id] = `${s.first_name} ${s.last_name}`;
      });

      const totalStudents = students?.length || 0;
      const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = attendance?.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

      // Calculate student averages
      const studentAverages = {};
      (grades || []).forEach(g => {
        if (!studentAverages[g.student_id]) {
          studentAverages[g.student_id] = { total: 0, count: 0 };
        }
        studentAverages[g.student_id].total += g.total || 0;
        studentAverages[g.student_id].count++;
      });

      const classAverage = grades?.length > 0
        ? Math.round(grades.reduce((sum, g) => sum + (g.total || 0), 0) / grades.length)
        : 0;

      // Find best and lowest student
      let bestStudent = null;
      let lowestStudent = null;

      Object.entries(studentAverages).forEach(([studentId, data]) => {
        const avg = data.count > 0 ? Math.round(data.total / data.count) : 0;
        if (!bestStudent || avg > bestStudent.average) {
          bestStudent = { studentId, average: avg };
        }
        if (!lowestStudent || avg < lowestStudent.average) {
          lowestStudent = { studentId, average: avg };
        }
      });

      // Format subject performance with names
      const subjectPerformance = (grades || []).map(g => ({
        student_id: g.student_id,
        student_name: studentMap[g.student_id] || 'Unknown',
        subject_id: g.subject_id,
        subject_name: subjectMap[g.subject_id]?.name || 'Unknown',
        total: g.total || 0,
        grade: g.grade || 'N/A'
      }));

      const report = {
        class_id: classId,
        total_students: totalStudents,
        attendance_rate: attendanceRate,
        class_average: classAverage,
        best_student: bestStudent ? {
          id: bestStudent.studentId,
          name: studentMap[bestStudent.studentId] || 'Unknown',
          average: bestStudent.average
        } : null,
        lowest_student: lowestStudent ? {
          id: lowestStudent.studentId,
          name: studentMap[lowestStudent.studentId] || 'Unknown',
          average: lowestStudent.average
        } : null,
        subject_performance: subjectPerformance
      };

      res.status(200).json({ status: 'success', data: report });
    } catch (error) {
      console.error('Get Class Performance Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to get class performance', 
        error: error.message 
      });
    }
  };

  // =============================================
  // GET DEPARTMENT PERFORMANCE
  // =============================================
  getDepartmentPerformance = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { departmentId } = req.query;

      if (!departmentId) {
        return res.status(400).json({ status: 'error', message: 'Department ID is required' });
      }

      // Get subjects in department
      const { data: subjects, error: subjectsError } = await supabaseAdmin
        .from('subjects')
        .select('id, name, code')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      if (subjectsError) throw subjectsError;

      const subjectIds = subjects?.map(s => s.id) || [];
      let grades = [];
      
      if (subjectIds.length > 0) {
        const { data, error } = await supabaseAdmin
          .from('grades')
          .select('subject_id, total')
          .in('subject_id', subjectIds);
        
        if (!error) {
          grades = data || [];
        }
      }

      // Calculate subject averages
      const subjectPerformance = subjects?.map(subject => {
        const subjectGrades = grades.filter(g => g.subject_id === subject.id);
        const average = subjectGrades.length > 0
          ? Math.round(subjectGrades.reduce((sum, g) => sum + (g.total || 0), 0) / subjectGrades.length)
          : 0;
        return {
          subject_id: subject.id,
          subject_name: subject.name,
          subject_code: subject.code,
          student_count: subjectGrades.length,
          average_score: average
        };
      }) || [];

      const departmentAverage = subjectPerformance.length > 0
        ? Math.round(subjectPerformance.reduce((sum, s) => sum + s.average_score, 0) / subjectPerformance.length)
        : 0;

      res.status(200).json({
        status: 'success',
        data: {
          department_id: departmentId,
          department_average: departmentAverage,
          subjects: subjectPerformance
        }
      });
    } catch (error) {
      console.error('Get Department Performance Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to get department performance', 
        error: error.message 
      });
    }
  };

  // =============================================
  // GET SUBJECT ENROLLMENT
  // =============================================
  getSubjectEnrollment = async (req, res) => {
    try {
      const { schoolId } = req.params;

      // Get all subjects
      const { data: subjects, error: subjectsError } = await supabaseAdmin
        .from('subjects')
        .select('id, name, code')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (subjectsError) throw subjectsError;

      // Get teacher_subjects
      const { data: assignments, error: assignmentsError } = await supabaseAdmin
        .from('teacher_subjects')
        .select('subject_id, class_id')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      // Count enrollment per subject
      const enrollment = subjects?.map(subject => {
        const subjectAssignments = assignments?.filter(a => a.subject_id === subject.id) || [];
        const uniqueClasses = new Set(subjectAssignments.map(a => a.class_id)).size;
        return {
          subject_id: subject.id,
          subject_name: subject.name,
          subject_code: subject.code,
          class_count: uniqueClasses,
          teacher_count: subjectAssignments.length
        };
      }) || [];

      res.status(200).json({ status: 'success', data: enrollment });
    } catch (error) {
      console.error('Get Subject Enrollment Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to get subject enrollment', 
        error: error.message 
      });
    }
  };

  // =============================================
  // GET TEACHER WORKLOAD REPORT
  // =============================================
  getTeacherWorkloadReport = async (req, res) => {
    try {
      const { schoolId } = req.params;

      // Get teacher_subjects
      const { data: assignments, error: assignmentsError } = await supabaseAdmin
        .from('teacher_subjects')
        .select('teacher_id, subject_id, class_id')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      // Get all teachers
      const { data: teachers, error: teachersError } = await supabaseAdmin
        .from('teachers')
        .select('id, first_name, last_name')
        .eq('school_id', schoolId);

      if (teachersError) throw teachersError;

      // Get all subjects
      const { data: subjects, error: subjectsError } = await supabaseAdmin
        .from('subjects')
        .select('id, name, weekly_periods')
        .eq('school_id', schoolId);

      if (subjectsError) throw subjectsError;

      // Create lookup maps
      const teacherMap = {};
      (teachers || []).forEach(t => {
        teacherMap[t.id] = t;
      });

      const subjectMap = {};
      (subjects || []).forEach(s => {
        subjectMap[s.id] = s;
      });

      // Group by teacher
      const teacherWorkloads = {};
      (assignments || []).forEach(item => {
        const teacherId = item.teacher_id;
        if (!teacherWorkloads[teacherId]) {
          teacherWorkloads[teacherId] = {
            teacher_id: teacherId,
            teacher_name: teacherMap[teacherId] ? `${teacherMap[teacherId].first_name} ${teacherMap[teacherId].last_name}` : 'Unknown',
            subjects: [],
            classes: new Set(),
            total_weekly_periods: 0
          };
        }
        const subject = subjectMap[item.subject_id];
        teacherWorkloads[teacherId].subjects.push(subject?.name || 'Unknown');
        teacherWorkloads[teacherId].classes.add(item.class_id);
        teacherWorkloads[teacherId].total_weekly_periods += subject?.weekly_periods || 0;
      });

      const report = Object.values(teacherWorkloads).map(t => ({
        ...t,
        classes: t.classes.size,
        subject_count: t.subjects.length
      }));

      res.status(200).json({ status: 'success', data: report });
    } catch (error) {
      console.error('Get Teacher Workload Report Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to get teacher workload report', 
        error: error.message 
      });
    }
  };
}

module.exports = new AcademicReportController();