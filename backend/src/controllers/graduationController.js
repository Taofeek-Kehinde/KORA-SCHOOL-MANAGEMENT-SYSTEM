const { supabaseAdmin } = require('../config/supabase');

class GraduationController {
  // =============================================
  // GET GRADUATION DATA
  // =============================================
  getGraduationData = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { studentId } = req.query;

      // Get student info
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name)
        `)
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single();

      if (studentError) throw studentError;

      // Get graduation history
      const { data: graduationHistory } = await supabaseAdmin
        .from('graduation_history')
        .select(`
          *,
          approved_by:users!approved_by(full_name, email)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      res.status(200).json({
        status: 'success',
        data: {
          student,
          graduation_history: graduationHistory || []
        }
      });
    } catch (error) {
      console.error('Get Graduation Data Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get graduation data',
        error: error.message
      });
    }
  };

  // =============================================
  // GRADUATE STUDENT
  // =============================================
  graduateStudent = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const {
        studentId,
        graduationDate,
        graduationType = 'graduated', // 'graduated', 'completed'
        certificateNumber,
        honors,
        notes
      } = req.body;

      if (!studentId) {
        return res.status(400).json({
          status: 'error',
          message: 'Student ID is required'
        });
      }

      // Get current student data
      const { data: currentStudent, error: fetchError } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single();

      if (fetchError) throw fetchError;

      if (!currentStudent.is_active) {
        return res.status(400).json({
          status: 'error',
          message: 'Student is already inactive'
        });
      }

      // Update student to graduated and archive
      const { data: updatedStudent, error: updateError } = await supabaseAdmin
        .from('students')
        .update({
          is_active: false,
          student_status: 'graduated',
          graduation_date: graduationDate || new Date(),
          graduation_type: graduationType,
          certificate_number: certificateNumber || '',
          honors: honors || '',
          graduation_notes: notes || '',
          is_archived: true,
          is_locked: true,
          updated_at: new Date()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Record graduation history
      const { data: graduationRecord, error: recordError } = await supabaseAdmin
        .from('graduation_history')
        .insert({
          student_id: studentId,
          graduation_date: graduationDate || new Date(),
          graduation_type: graduationType,
          certificate_number: certificateNumber || '',
          honors: honors || '',
          notes: notes || '',
          approved_by: adminId,
          approved_at: new Date(),
          created_at: new Date()
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'GRADUATE_STUDENT',
          entity_type: 'student',
          entity_id: studentId,
          new_values: {
            graduation_type: graduationType,
            graduation_date: graduationDate,
            certificate_number: certificateNumber
          }
        });

      res.status(200).json({
        status: 'success',
        message: 'Student graduated successfully',
        data: {
          student: updatedStudent,
          graduation_record: graduationRecord
        }
      });
    } catch (error) {
      console.error('Graduate Student Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to graduate student',
        error: error.message
      });
    }
  };

  // =============================================
  // GET ALL GRADUATED STUDENTS (ALUMNI)
  // =============================================
  getGraduatedStudents = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { search, limit = 50, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name)
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('student_status', 'graduated')
        .order('updated_at', { ascending: false });

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_number.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: count || 0
        }
      });
    } catch (error) {
      console.error('Get Graduated Students Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get graduated students',
        error: error.message
      });
    }
  };

  // =============================================
  // GET GRADUATION REPORT
  // =============================================
  getGraduationReport = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { sessionId, year } = req.query;

      // Get all graduated students
      const { data: graduatedStudents, error: studentError } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name)
        `)
        .eq('school_id', schoolId)
        .eq('student_status', 'graduated');

      if (studentError) throw studentError;

      // Get graduation history
      const { data: graduationHistory, error: historyError } = await supabaseAdmin
        .from('graduation_history')
        .select(`
          *,
          students!student_id(first_name, last_name, admission_number),
          approved_by:users!approved_by(full_name, email)
        `)
        .eq('students.school_id', schoolId);

      if (historyError) throw historyError;

      // Calculate summary
      const summary = {
        total_graduated: graduatedStudents.length,
        total_by_year: {},
        total_by_class: {}
      };

      // Group by year
      graduatedStudents.forEach(student => {
        const year = student.graduation_date ? new Date(student.graduation_date).getFullYear() : 'Unknown';
        if (!summary.total_by_year[year]) {
          summary.total_by_year[year] = 0;
        }
        summary.total_by_year[year]++;
      });

      // Group by class
      graduatedStudents.forEach(student => {
        const className = student.classes?.name || 'Unknown';
        if (!summary.total_by_class[className]) {
          summary.total_by_class[className] = 0;
        }
        summary.total_by_class[className]++;
      });

      res.status(200).json({
        status: 'success',
        data: {
          summary,
          graduated_students: graduatedStudents || [],
          graduation_history: graduationHistory || []
        }
      });
    } catch (error) {
      console.error('Get Graduation Report Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get graduation report',
        error: error.message
      });
    }
  };
}

module.exports = new GraduationController();