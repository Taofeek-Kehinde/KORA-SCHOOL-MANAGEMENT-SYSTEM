const { supabaseAdmin } = require('../config/supabase');

class StudentLifecycleController {
  // =============================================
  // GET LIFECYCLE DASHBOARD (Summary)
  // =============================================
  getLifecycleDashboard = async (req, res) => {
    try {
      const { schoolId } = req.params;

      const { data: students } = await supabaseAdmin
        .from('students')
        .select('lifecycle_stage')
        .eq('school_id', schoolId);

      const stageCounts = {};
      (students || []).forEach(student => {
        const stage = student.lifecycle_stage || 'application';
        if (!stageCounts[stage]) stageCounts[stage] = 0;
        stageCounts[stage]++;
      });

      const { data: recentEvents } = await supabaseAdmin
        .from('student_lifecycle_events')
        .select(`
          *,
          students!student_id(first_name, last_name, admission_number),
          users!created_by(full_name)
        `)
        .eq('students.school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(10);

      res.status(200).json({
        status: 'success',
        data: {
          stage_counts: stageCounts,
          total_students: (students || []).length,
          recent_events: recentEvents || []
        }
      });
    } catch (error) {
      console.error('Get Lifecycle Dashboard Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get lifecycle dashboard', error: error.message });
    }
  };

  // =============================================
  // GET STUDENTS BY STAGE
  // =============================================
  getStudentsByStage = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { stage, search, limit = 50, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name)
        `, { count: 'exact' })
        .eq('school_id', schoolId);

      if (stage) query = query.eq('lifecycle_stage', stage);

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_number.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || [],
        pagination: { limit: parseInt(limit), offset: parseInt(offset), total: count || 0 }
      });
    } catch (error) {
      console.error('Get Students By Stage Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get students by stage', error: error.message });
    }
  };

  // =============================================
  // UPDATE LIFECYCLE STAGE
  // =============================================
  updateLifecycleStage = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { studentId, newStage, notes, metadata } = req.body;

      if (!studentId || !newStage) {
        return res.status(400).json({ status: 'error', message: 'Student ID and new stage are required' });
      }

      const { data: student } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single();

      const { data: updatedStudent } = await supabaseAdmin
        .from('students')
        .update({ lifecycle_stage: newStage, updated_at: new Date() })
        .eq('id', studentId)
        .select()
        .single();

      // Record lifecycle event
      await supabaseAdmin
        .from('student_lifecycle_events')
        .insert({
          student_id: studentId,
          previous_stage: student?.lifecycle_stage || null,
          new_stage: newStage,
          notes: notes || '',
          metadata: metadata || {},
          created_by: adminId,
          created_at: new Date()
        });

      // Update lifecycle table
      await supabaseAdmin
        .from('student_lifecycle')
        .upsert({
          student_id: studentId,
          current_stage: newStage,
          stage_updated_at: new Date(),
          updated_by: adminId
        }, { onConflict: 'student_id' });

      res.status(200).json({
        status: 'success',
        message: `Student lifecycle updated to ${newStage}`,
        data: { student: updatedStudent, previous_stage: student?.lifecycle_stage, new_stage: newStage }
      });
    } catch (error) {
      console.error('Update Lifecycle Stage Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update lifecycle stage', error: error.message });
    }
  };

  // =============================================
  // GET STUDENT LIFECYCLE STATUS
  // =============================================
  getLifecycleStatus = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { studentId } = req.query;

      const { data: student } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name)
        `)
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single();

      const { data: lifecycleHistory } = await supabaseAdmin
        .from('student_lifecycle_events')
        .select(`
          *,
          users!created_by(full_name)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      res.status(200).json({
        status: 'success',
        data: {
          student,
          lifecycle_history: lifecycleHistory || []
        }
      });
    } catch (error) {
      console.error('Get Lifecycle Status Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get lifecycle status', error: error.message });
    }
  };
}

module.exports = new StudentLifecycleController();