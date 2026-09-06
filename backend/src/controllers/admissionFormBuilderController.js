const { supabaseAdmin } = require('../config/supabase');

class AdmissionFormBuilderController {
  // =============================================
  // 1. GET ADMISSION FORM SETTINGS
  // =============================================
  getFormSettings = async (req, res) => {
    try {
      const { schoolId } = req.params;

      // Try to get existing settings
      const { data, error } = await supabaseAdmin
        .from('admission_settings')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default
      if (!data) {
        const { data: newSettings, error: createError } = await supabaseAdmin
          .from('admission_settings')
          .insert({
            school_id: schoolId,
            form_fields: [],
            acceptance_fee_enabled: false,
            acceptance_fee_amount: 0,
            entrance_exam_enabled: false,
            interview_enabled: false,
            capacity_quotas: {},
            max_applications_per_parent: 5
          })
          .select()
          .single();

        if (createError) throw createError;
        return res.status(200).json({ status: 'success', data: newSettings });
      }

      res.status(200).json({ status: 'success', data });
    } catch (error) {
      console.error('Get Form Settings Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get form settings', error: error.message });
    }
  };

  // =============================================
  // 2. UPDATE ADMISSION FORM SETTINGS
  // =============================================
  updateFormSettings = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const {
        formFields,
        acceptanceFeeEnabled,
        acceptanceFeeAmount,
        entranceExamEnabled,
        interviewEnabled,
        capacityQuotas,
        maxApplicationsPerParent,
        deadlineDate
      } = req.body;

      // Get existing settings
      const { data: existing } = await supabaseAdmin
        .from('admission_settings')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabaseAdmin
          .from('admission_settings')
          .update({
            form_fields: formFields || existing.form_fields,
            acceptance_fee_enabled: acceptanceFeeEnabled !== undefined ? acceptanceFeeEnabled : existing.acceptance_fee_enabled,
            acceptance_fee_amount: acceptanceFeeAmount !== undefined ? acceptanceFeeAmount : existing.acceptance_fee_amount,
            entrance_exam_enabled: entranceExamEnabled !== undefined ? entranceExamEnabled : existing.entrance_exam_enabled,
            interview_enabled: interviewEnabled !== undefined ? interviewEnabled : existing.interview_enabled,
            capacity_quotas: capacityQuotas || existing.capacity_quotas,
            max_applications_per_parent: maxApplicationsPerParent || existing.max_applications_per_parent,
            deadline_date: deadlineDate || existing.deadline_date,
            updated_at: new Date()
          })
          .eq('school_id', schoolId)
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json({ status: 'success', message: 'Form settings updated successfully', data });
      } else {
        // Create new
        const { data, error } = await supabaseAdmin
          .from('admission_settings')
          .insert({
            school_id: schoolId,
            form_fields: formFields || [],
            acceptance_fee_enabled: acceptanceFeeEnabled || false,
            acceptance_fee_amount: acceptanceFeeAmount || 0,
            entrance_exam_enabled: entranceExamEnabled || false,
            interview_enabled: interviewEnabled || false,
            capacity_quotas: capacityQuotas || {},
            max_applications_per_parent: maxApplicationsPerParent || 5,
            deadline_date: deadlineDate || null,
            updated_at: new Date()
          })
          .select()
          .single();

        if (error) throw error;

        res.status(201).json({ status: 'success', message: 'Form settings created successfully', data });
      }
    } catch (error) {
      console.error('Update Form Settings Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update form settings', error: error.message });
    }
  };
}

module.exports = new AdmissionFormBuilderController();