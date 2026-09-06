const { supabaseAdmin } = require('../config/supabase');

class AdmissionController {
  // =============================================
  // 1. CREATE ADMISSION APPLICATION (Parent)
  // =============================================
  createApplication = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const userId = req.user.id;
      const {
        studentFirstName,
        studentLastName,
        studentMiddleName,
        dateOfBirth,
        gender,
        nationality,
        stateOfOrigin,
        localGovernment,
        residentialAddress,
        previousSchool,
        classApplyingFor,
        passportUrl,
        parentName,
        parentRelationship,
        parentPhone,
        parentEmail,
        parentOccupation,
        parentEmployer,
        parentAddress,
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone
      } = req.body;

      // Validate required fields
      if (!studentFirstName || !studentLastName || !parentName || !parentPhone) {
        return res.status(400).json({ status: 'error', message: 'Student name, parent name, and parent phone are required' });
      }

      // Generate unique application number
      const appNumber = `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const { data, error } = await supabaseAdmin
        .from('admission_applications')
        .insert({
          school_id: schoolId,
          application_number: appNumber,
          applicant_user_id: userId,
          student_first_name: studentFirstName,
          student_last_name: studentLastName,
          student_middle_name: studentMiddleName || '',
          date_of_birth: dateOfBirth,
          gender: gender || '',
          nationality: nationality || 'Nigeria',
          state_of_origin: stateOfOrigin || '',
          local_government: localGovernment || '',
          residential_address: residentialAddress || '',
          previous_school: previousSchool || '',
          class_applying_for: classApplyingFor || null,
          passport_url: passportUrl || '',
          parent_name: parentName,
          parent_relationship: parentRelationship || 'guardian',
          parent_phone: parentPhone,
          parent_email: parentEmail || '',
          parent_occupation: parentOccupation || '',
          parent_employer: parentEmployer || '',
          parent_address: parentAddress || '',
          emergency_contact_name: emergencyContactName || '',
          emergency_contact_relationship: emergencyContactRelationship || '',
          emergency_contact_phone: emergencyContactPhone || '',
          status: 'submitted',
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Create status history
      await supabaseAdmin
        .from('admission_status_history')
        .insert({
          application_id: data.id,
          previous_status: 'draft',
          new_status: 'submitted',
          changed_by: userId,
          changed_at: new Date()
        });

      res.status(201).json({
        status: 'success',
        message: 'Application submitted successfully',
        data
      });
    } catch (error) {
      console.error('Create Application Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to submit application', error: error.message });
    }
  };

  // =============================================
  // 2. GET ALL APPLICATIONS (Admission Officer)
  // =============================================
  getApplications = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { status, classId, search, limit = 50, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('admission_applications')
        .select(`
          *,
          classes!class_applying_for(id, name, level),
          users!applicant_user_id(full_name, email)
        `, { count: 'exact' })
        .eq('school_id', schoolId);

      if (status) {
        query = query.eq('status', status);
      }

      if (classId) {
        query = query.eq('class_applying_for', classId);
      }

      if (search) {
        query = query.or(`application_number.ilike.%${search}%,student_first_name.ilike.%${search}%,student_last_name.ilike.%${search}%,parent_name.ilike.%${search}%,parent_email.ilike.%${search}%,parent_phone.ilike.%${search}%`);
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
      console.error('Get Applications Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get applications', error: error.message });
    }
  };

  // =============================================
  // 3. GET APPLICATION BY ID
  // =============================================
  getApplicationById = async (req, res) => {
    try {
      const { schoolId, applicationId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('admission_applications')
        .select(`
          *,
          classes!class_applying_for(id, name, level),
          documents:admission_documents(*),
          status_history:admission_status_history(*)
        `)
        .eq('id', applicationId)
        .eq('school_id', schoolId)
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', data });
    } catch (error) {
      console.error('Get Application Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get application', error: error.message });
    }
  };

  // =============================================
  // 4. UPDATE APPLICATION STATUS
  // =============================================
  // =============================================
// UPDATE APPLICATION STATUS
// =============================================


    updateApplicationStatus = async (req, res) => {
    try {
      const { schoolId, applicationId } = req.params;
      const adminId = req.user.id;
      const { status, reason } = req.body;

      const { data: currentApp, error: fetchError } = await supabaseAdmin
        .from('admission_applications')
        .select('*')
        .eq('id', applicationId)
        .eq('school_id', schoolId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabaseAdmin
        .from('admission_applications')
        .update({
          status,
          reviewed_by: adminId,
          reviewed_at: new Date(),
          rejected_reason: reason || null,
          updated_at: new Date()
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;

      await supabaseAdmin
        .from('admission_status_history')
        .insert({
          application_id: applicationId,
          previous_status: currentApp?.status,
          new_status: status,
          changed_by: adminId,
          reason: reason || '',
          changed_at: new Date()
        });

      const statusMessages = {
        'under_review': 'Your application is now under review.',
        'awaiting_documents': 'We need additional documents from you.',
        'awaiting_exam': 'You have been scheduled for an entrance examination.',
        'awaiting_interview': 'You have been scheduled for an interview.',
        'approved': 'Congratulations! Your child has been APPROVED for admission! ',
        'rejected': 'We regret to inform you that your application was not successful.',
        'enrolled': 'Your child has been successfully enrolled! ',
        'waitlist': 'Your application has been placed on the waitlist.'
      };

          // ✅ Notify the applicant directly — no fragile parents-table lookup
      console.log('🔔 NOTIFICATION DEBUG: applicant_user_id =', currentApp.applicant_user_id);

            if (currentApp.applicant_user_id) {
        const { error: notifError } = await supabaseAdmin
          .from('notifications')
          .insert({
            school_id: schoolId,
            user_id: currentApp.applicant_user_id,
            title: 'Admission Status Update',
            message: statusMessages[status] || `Status changed to ${status}`,
            type: 'in_app',
            category: 'admission',
            is_read: false,
            created_at: new Date()
          });

        if (notifError) {
          console.error('Notification insert error:', notifError);
        }
      } else {
        console.warn('No applicant_user_id on application, skipping notification');
      
      }

      if (currentApp.parent_email) {
        try {
          const emailService = require('../services/emailService');
          await emailService.sendEmail({
            to: currentApp.parent_email,
            subject: 'Admission Status Update',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Admission Status Update</h2>
                <p>Dear ${currentApp.parent_name},</p>
                <p>${statusMessages[status] || `Status changed to ${status}`}</p>
                <p>Application Number: ${currentApp.application_number}</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>
            `
          });
        } catch (emailErr) {
          console.error('Email send error:', emailErr);
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Application status updated successfully',
        data
      });
    } catch (error) {
      console.error('Update Status Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update status', error: error.message });
    }
  };
  // =============================================
  // 5. UPLOAD DOCUMENT
  // =============================================
  uploadDocument = async (req, res) => {
    try {
      const { schoolId, applicationId } = req.params;
     const userId = req.user.id;
      const { documentType, fileUrl, fileName, fileSize } = req.body;

      const { data, error } = await supabaseAdmin
        .from('admission_documents')
        .insert({
          application_id: applicationId,
          document_type: documentType,
          file_url: fileUrl || '',
          file_name: fileName || '',
          file_size: fileSize || 0,
          uploaded_by: userId,
          uploaded_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        status: 'success',
        message: 'Document uploaded successfully',
        data
      });
    } catch (error) {
      console.error('Upload Document Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to upload document', error: error.message });
    }
  };

  // =============================================
  // 6. GET ADMISSION DASHBOARD STATS
  // =============================================
  getDashboardStats = async (req, res) => {
    try {
      const { schoolId } = req.params;

      const { data: allApps, error } = await supabaseAdmin
        .from('admission_applications')
        .select('*')
        .eq('school_id', schoolId);

      if (error) throw error;

      const stats = {
        total: allApps?.length || 0,
        pending: allApps?.filter(a => a.status === 'submitted' || a.status === 'under_review').length || 0,
        approved: allApps?.filter(a => a.status === 'approved').length || 0,
        rejected: allApps?.filter(a => a.status === 'rejected').length || 0,
        awaiting_interview: allApps?.filter(a => a.status === 'awaiting_interview').length || 0,
        awaiting_exam: allApps?.filter(a => a.status === 'awaiting_exam').length || 0,
        enrolled: allApps?.filter(a => a.status === 'enrolled').length || 0,
        acceptance_fee_paid: allApps?.filter(a => a.acceptance_fee_paid).length || 0
      };

      res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
      console.error('Get Dashboard Stats Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get dashboard stats', error: error.message });
    }
  };

  // =============================================
  // 7. GET PARENT'S APPLICATIONS
  // =============================================
  getMyApplications = async (req, res) => {
    try {
      const userId = req.user.id;

      const { data, error } = await supabaseAdmin
        .from('admission_applications')
        .select(`
          *,
          classes!class_applying_for(id, name, level),
          documents:admission_documents(*),
          status_history:admission_status_history(*)
        `)
        .eq('applicant_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get My Applications Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get applications', error: error.message });
    }
  };

  // =============================================
  // 8. DELETE APPLICATION (Parent - only if draft/submitted)
  // =============================================
  deleteApplication = async (req, res) => {
    try {
      const { schoolId, applicationId } = req.params;
      const userId = req.user.id;

      // Check if application belongs to user
      const { data: app, error: fetchError } = await supabaseAdmin
        .from('admission_applications')
        .select('status, applicant_user_id')
        .eq('id', applicationId)
        .eq('school_id', schoolId)
        .single();

      if (fetchError) throw fetchError;

      if (app.applicant_user_id !== userId) {
        return res.status(403).json({ status: 'error', message: 'Not authorized to delete this application' });
      }

      if (app.status === 'approved' || app.status === 'enrolled') {
        return res.status(400).json({ status: 'error', message: 'Cannot delete approved or enrolled applications' });
      }

      const { error } = await supabaseAdmin
        .from('admission_applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Application deleted successfully'
      });
    } catch (error) {
      console.error('Delete Application Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete application', error: error.message });
    }
  };
}

module.exports = new AdmissionController();