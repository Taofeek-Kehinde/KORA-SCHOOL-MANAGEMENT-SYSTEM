const { supabaseAdmin } = require('../config/supabase');

class WithdrawalController {
  // =============================================
  // GET STUDENT WITHDRAWAL DATA
  // =============================================
  getWithdrawalData = async (req, res) => {
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

      // Get withdrawal history
      const { data: withdrawalHistory } = await supabaseAdmin
        .from('withdrawal_history')
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
          withdrawal_history: withdrawalHistory || []
        }
      });
    } catch (error) {
      console.error('Get Withdrawal Data Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get withdrawal data',
        error: error.message
      });
    }
  };

  // =============================================
  // WITHDRAW STUDENT
  // =============================================
  withdrawStudent = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const {
        studentId,
        withdrawalDate,
        reason,
        withdrawalType = 'withdrawal', // 'withdrawal', 'expelled', 'left'
        notes
      } = req.body;

      if (!studentId) {
        return res.status(400).json({
          status: 'error',
          message: 'Student ID is required'
        });
      }

      if (!reason) {
        return res.status(400).json({
          status: 'error',
          message: 'Withdrawal reason is required'
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

      const normalizedStudentStatus = 'withdrawn';

      // Update student to inactive and lock future activities.
      // The database constraint only allows valid student_status values such as
      // 'active' and 'withdrawn'. The detailed type is stored separately in
      // withdrawal_history, so we keep the original reason label there.
      const { data: updatedStudent, error: updateError } = await supabaseAdmin
        .from('students')
        .update({
          is_active: false,
          student_status: normalizedStudentStatus,
          withdrawal_date: withdrawalDate || new Date(),
          withdrawal_reason: reason,
          withdrawal_approved_by: adminId,
          withdrawal_approved_at: new Date(),
          withdrawal_notes: notes || '',
          is_locked: true,
          updated_at: new Date()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Record withdrawal history
      const { data: withdrawalRecord, error: recordError } = await supabaseAdmin
        .from('withdrawal_history')
        .insert({
          student_id: studentId,
          withdrawal_date: withdrawalDate || new Date(),
          reason: reason,
          withdrawal_type: withdrawalType,
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
          action: 'WITHDRAW_STUDENT',
          entity_type: 'student',
          entity_id: studentId,
          new_values: {
            withdrawal_type: withdrawalType,
            withdrawal_date: withdrawalDate,
            reason: reason
          }
        });

      res.status(200).json({
        status: 'success',
        message: 'Student withdrawn successfully',
        data: {
          student: updatedStudent,
          withdrawal_record: withdrawalRecord
        }
      });
    } catch (error) {
      console.error('Withdraw Student Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to withdraw student',
        error: error.message
      });
    }
  };

  // =============================================
  // GET ALL WITHDRAWN STUDENTS
  // =============================================
  getWithdrawnStudents = async (req, res) => {
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
        .eq('is_active', false)
        .eq('student_status', 'withdrawn')
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
      console.error('Get Withdrawn Students Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get withdrawn students',
        error: error.message
      });
    }
  };

  // =============================================
  // REINSTATE STUDENT
  // =============================================
  reinstateStudent = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { studentId, classId } = req.body;

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

      // Update student to active
      const { data: updatedStudent, error: updateError } = await supabaseAdmin
        .from('students')
        .update({
          is_active: true,
          student_status: 'active',
          class_id: classId || currentStudent.class_id,
          withdrawal_date: null,
          withdrawal_reason: null,
          withdrawal_approved_by: null,
          withdrawal_approved_at: null,
          withdrawal_notes: null,
          is_locked: false,
          updated_at: new Date()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update withdrawal history
      await supabaseAdmin
        .from('withdrawal_history')
        .update({
          reinstated: true,
          reinstated_by: adminId,
          reinstated_at: new Date()
        })
        .eq('student_id', studentId)
        .eq('reinstated', false);

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'REINSTATE_STUDENT',
          entity_type: 'student',
          entity_id: studentId,
          new_values: {
            reinstated: true,
            class_id: classId || currentStudent.class_id
          }
        });

      res.status(200).json({
        status: 'success',
        message: 'Student reinstated successfully',
        data: updatedStudent
      });
    } catch (error) {
      console.error('Reinstate Student Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to reinstate student',
        error: error.message
      });
    }
  };
}

module.exports = new WithdrawalController();