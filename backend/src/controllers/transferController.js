const { supabaseAdmin } = require('../config/supabase');
const studentNotificationService = require('../services/studentNotificationService');
class TransferController {
  // =============================================
  // GET TRANSFER DATA
  // =============================================
  getTransferData = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { studentId } = req.query;

      // Get student info - NO houses relationship
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

      // Get all classes
      const { data: classes } = await supabaseAdmin
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('level', { ascending: true });

      // Get all houses
      const { data: houses } = await supabaseAdmin
        .from('houses')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      // Get all campuses
      const { data: campuses } = await supabaseAdmin
        .from('campuses')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      // Get transfer history
      const { data: transferHistory } = await supabaseAdmin
        .from('transfer_history')
        .select(`
          *,
          from_class:classes!from_class_id(id, name),
          to_class:classes!to_class_id(id, name)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      res.status(200).json({
        status: 'success',
        data: {
          student,
          classes,
          houses,
          campuses,
          transfer_history: transferHistory || []
        }
      });
    } catch (error) {
      console.error('Get Transfer Data Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get transfer data',
        error: error.message
      });
    }
  };

  // =============================================
  // INTERNAL TRANSFER
  // =============================================
  internalTransfer = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const {
        studentId,
        transferType,
        fromClassId,
        toClassId,
        fromHouseId,
        toHouseId,
        fromCampusId,
        toCampusId,
        newBoardingStatus,
        reason
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

      // Build update data
      const updateData = {};
      const transferRecord = {
        student_id: studentId,
        transfer_type: 'internal',
        reason: reason || '',
        transferred_by: adminId,
        created_at: new Date()
      };

      if (transferType === 'class') {
        updateData.class_id = toClassId;
        transferRecord.from_class_id = fromClassId || currentStudent.class_id;
        transferRecord.to_class_id = toClassId;
        transferRecord.details = `Class transfer`;
      }

      if (transferType === 'house') {
        updateData.house = toHouseId;
        transferRecord.from_house_id = fromHouseId || currentStudent.house;
        transferRecord.to_house_id = toHouseId;
        transferRecord.details = `House transfer`;
      }

      if (transferType === 'status') {
        updateData.boarding_status = newBoardingStatus;
        transferRecord.details = `Status changed from ${currentStudent.boarding_status} to ${newBoardingStatus}`;
      }

      if (transferType === 'campus') {
        updateData.campus_id = toCampusId;
        transferRecord.from_campus_id = fromCampusId || currentStudent.campus_id;
        transferRecord.to_campus_id = toCampusId;
        transferRecord.details = `Campus transfer`;
      }

      // After transfer is complete
try {
  const { data: school } = await supabaseAdmin
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .single();

  const { data: fromClass } = await supabaseAdmin
    .from('classes')
    .select('name')
    .eq('id', fromClassId || currentStudent.class_id)
    .single();

  const { data: toClass } = await supabaseAdmin
    .from('classes')
    .select('name')
    .eq('id', toClassId)
    .single();

  if (transferType === 'class') {
    await studentNotificationService.notifyClassChange({
      schoolId,
      school,
      student: updatedStudent,
      fromClass: fromClass?.name || 'Previous Class',
      toClass: toClass?.name || 'New Class'
    });
  }
} catch (notifError) {
  console.error('Send transfer notification error:', notifError);
}

      // Update student
      const { data: updatedStudent, error: updateError } = await supabaseAdmin
        .from('students')
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Record transfer history
      await supabaseAdmin
        .from('transfer_history')
        .insert(transferRecord);

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'INTERNAL_TRANSFER',
          entity_type: 'student',
          entity_id: studentId,
          new_values: {
            transfer_type: transferType,
            ...updateData,
            reason: reason || ''
          }
        });

      res.status(200).json({
        status: 'success',
        message: 'Internal transfer completed successfully',
        data: {
          student: updatedStudent,
          transfer_type: transferType,
          details: transferRecord.details
        }
      });
    } catch (error) {
      console.error('Internal Transfer Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to complete internal transfer',
        error: error.message
      });
    }
  };

  // =============================================
  // EXTERNAL TRANSFER
  // =============================================
  externalTransfer = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const {
        studentId,
        transferDate,
        receivingSchool,
        receivingSchoolAddress,
        reason,
        transferType = 'transfer'
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

      const mappedStudentStatus = transferType === 'transfer' ? 'transferred' : transferType;

      // Update student to inactive
      const { data: updatedStudent, error: updateError } = await supabaseAdmin
        .from('students')
        .update({
          is_active: false,
          student_status: mappedStudentStatus,
          transfer_date: transferDate || new Date(),
          receiving_school: receivingSchool || '',
          receiving_school_address: receivingSchoolAddress || '',
          transfer_reason: reason || '',
          updated_at: new Date()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Record transfer history
      const { data: transferRecord, error: recordError } = await supabaseAdmin
        .from('transfer_history')
        .insert({
          student_id: studentId,
          transfer_type: 'external',
          transfer_date: transferDate || new Date(),
          receiving_school: receivingSchool || '',
          receiving_school_address: receivingSchoolAddress || '',
          reason: reason || '',
          status: 'completed',
          transferred_by: adminId,
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
          action: 'EXTERNAL_TRANSFER',
          entity_type: 'student',
          entity_id: studentId,
          new_values: {
            transfer_type: transferType,
            transfer_date: transferDate,
            receiving_school: receivingSchool,
            reason: reason
          }
        });

      res.status(200).json({
        status: 'success',
        message: `Student ${transferType} successfully`,
        data: {
          student: updatedStudent,
          transfer_record: transferRecord
        }
      });
    } catch (error) {
      console.error('External Transfer Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to complete external transfer',
        error: error.message
      });
    }
  };

  // =============================================
  // GET TRANSFER HISTORY
  // =============================================
  getTransferHistory = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { studentId } = req.query;

      let query = supabaseAdmin
        .from('transfer_history')
        .select(`
          *,
          students!student_id(
            id, first_name, last_name, admission_number,
            classes!class_id(id, name)
          ),
          from_class:classes!from_class_id(id, name),
          to_class:classes!to_class_id(id, name)
        `)
        .eq('students.school_id', schoolId)
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || [],
        pagination: {
          total: count || 0
        }
      });
    } catch (error) {
      console.error('Get Transfer History Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get transfer history',
        error: error.message
      });
    }
  };
}

module.exports = new TransferController();