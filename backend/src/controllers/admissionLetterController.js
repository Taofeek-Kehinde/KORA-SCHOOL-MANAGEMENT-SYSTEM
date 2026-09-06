const { supabaseAdmin } = require('../config/supabase');

class AdmissionLetterController {
  // =============================================
  // GENERATE ADMISSION LETTER
  // =============================================
  generateAdmissionLetter = async (req, res) => {
    try {
      const { schoolId, applicationId } = req.params;
      const { adminId } = req.user;
      const { letterType } = req.body;

      // Get application details
      const { data: application, error: appError } = await supabaseAdmin
        .from('admission_applications')
        .select(`
          *,
          schools!school_id(name, address, logo_url, motto),
          classes!class_applying_for(name)
        `)
        .eq('id', applicationId)
        .eq('school_id', schoolId)
        .single();

      if (appError) throw appError;

      // Generate letter content based on type
      let letterContent = '';

      if (letterType === 'admission' || !letterType) {
        letterContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              ${application.schools?.logo_url ? `<img src="${application.schools.logo_url}" style="width: 80px; height: 80px; object-fit: contain;" />` : ''}
              <h2 style="color: #333; margin: 10px 0;">${application.schools?.name || 'School'}</h2>
              <p style="color: #666; margin: 5px 0;">${application.schools?.address || ''}</p>
              <p style="color: #666; margin: 5px 0;"><em>${application.schools?.motto || ''}</em></p>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
              <h3 style="color: #333;">ADMISSION LETTER</h3>
              <p>Date: ${new Date().toLocaleDateString()}</p>
              <p>Dear ${application.parent_name},</p>
              <p>We are pleased to inform you that your child, <strong>${application.student_first_name} ${application.student_last_name}</strong>, has been offered admission into <strong>${application.classes?.name || 'our school'}</strong> for the upcoming academic session.</p>
              <p><strong>Application Number:</strong> ${application.application_number}</p>
              <p><strong>Class:</strong> ${application.classes?.name || 'N/A'}</p>
              <p>Please proceed with the following:</p>
              <ol>
                <li>Pay the acceptance fee</li>
                <li>Submit required documents</li>
                <li>Complete enrollment</li>
              </ol>
              <p>We look forward to welcoming your child to our school community.</p>
              <p style="margin-top: 30px;">Sincerely,<br/>School Administration</p>
            </div>
          </div>
        `;
      } else if (letterType === 'rejection') {
        letterContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Application Status: Not Admitted</h2>
            <p>Dear ${application.parent_name},</p>
            <p>Thank you for applying to ${application.schools?.name || 'our school'}.</p>
            <p>After careful consideration, we regret to inform you that your child's application (${application.application_number}) has not been successful.</p>
            <p>We encourage you to apply again in future admissions.</p>
            <p>Sincerely,<br/>School Administration</p>
          </div>
        `;
      } else if (letterType === 'waitlist') {
        letterContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Application Status: Waitlist</h2>
            <p>Dear ${application.parent_name},</p>
            <p>Your child's application (${application.application_number}) has been placed on our waitlist.</p>
            <p>We will contact you if a space becomes available.</p>
            <p>Sincerely,<br/>School Administration</p>
          </div>
        `;
      }

      // Save letter
      const { data: letter, error: letterError } = await supabaseAdmin
        .from('admission_letters')
        .insert({
          application_id: applicationId,
          letter_type: letterType || 'admission',
          content: letterContent,
          generated_by: adminId,
          generated_at: new Date()
        })
        .select()
        .single();

      if (letterError) throw letterError;

      res.status(201).json({ status: 'success', message: 'Admission letter generated successfully', data: letter });
    } catch (error) {
      console.error('Generate Letter Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to generate letter', error: error.message });
    }
  };

  // =============================================
  // GET APPLICATION LETTERS
  // =============================================
  getApplicationLetters = async (req, res) => {
    try {
      const { applicationId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('admission_letters')
        .select('*')
        .eq('application_id', applicationId)
        .order('generated_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Application Letters Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get letters', error: error.message });
    }
  };
}

module.exports = new AdmissionLetterController();