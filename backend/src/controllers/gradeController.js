const { supabaseAdmin } = require('../config/supabase');
const auditService = require('../services/auditService');

class GradeController {
  // =============================================
  // UPDATE GRADE - Log: Teacher edited result
  // =============================================
  async updateGrade(req, res) {
    try {
      const { gradeId } = req.params;
      const { ca1, ca2, ca3, exam, remark } = req.body;
      const { user } = req;

      // Get old values
      const { data: oldGrade, error: fetchError } = await supabaseAdmin
        .from('grades')
        .select('*')
        .eq('id', gradeId)
        .single();

      if (fetchError) throw fetchError;

      // Update grade
      const updateData = {};
      if (ca1 !== undefined) updateData.ca1 = ca1;
      if (ca2 !== undefined) updateData.ca2 = ca2;
      if (ca3 !== undefined) updateData.ca3 = ca3;
      if (exam !== undefined) updateData.exam = exam;
      if (remark !== undefined) updateData.remark = remark;
      updateData.updated_at = new Date();

      const { data: updatedGrade, error } = await supabaseAdmin
        .from('grades')
        .update(updateData)
        .eq('id', gradeId)
        .select()
        .single();

      if (error) throw error;

      // LOG: Teacher edited result
      await auditService.logTeacherEditedResult(
        oldGrade.school_id,
        user.id,
        {
          gradeId: gradeId,
          oldValues: {
            ca1: oldGrade.ca1,
            ca2: oldGrade.ca2,
            ca3: oldGrade.ca3,
            exam: oldGrade.exam,
            remark: oldGrade.remark
          },
          newValues: updateData
        },
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        status: 'success',
        message: 'Grade updated successfully',
        data: updatedGrade
      });
    } catch (error) {
      console.error('Update Grade Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update grade',
        error: error.message
      });
    }
  }
}