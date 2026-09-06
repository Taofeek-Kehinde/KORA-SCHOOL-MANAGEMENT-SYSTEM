// backend/src/services/admissionIntegrationService.js
const { supabaseAdmin } = require('../config/supabase');
const notificationService = require('./notificationService');
const bcrypt = require('bcryptjs');

class AdmissionIntegrationService {
  // =============================================
  // 1. ENROLL APPROVED STUDENT (Auto-Create Student Profile)
  // =============================================
  async enrollStudent(schoolId, application) {
    try {
      // Check if student already exists
      const { data: existingStudent } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('admission_application_id', application.id)
        .single();

      if (existingStudent) {
        return { success: true, message: 'Student already enrolled', studentId: existingStudent.id };
      }

      // Generate admission number
      const year = new Date().getFullYear();
      const { count } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId);
      const admissionNumber = `${year}-${String((count || 0) + 1).padStart(4, '0')}`;

      // Create student record
      const { data: student, error } = await supabaseAdmin
        .from('students')
        .insert({
          school_id: schoolId,
          first_name: application.student_first_name,
          last_name: application.student_last_name,
          middle_name: application.student_middle_name || '',
          date_of_birth: application.date_of_birth,
          gender: application.gender,
          nationality: application.nationality || 'Nigeria',
          state_of_origin: application.state_of_origin || '',
          local_government: application.local_government || '',
          address: application.residential_address || '',
          previous_school: application.previous_school || '',
          class_id: application.class_applying_for,
          admission_number: admissionNumber,
          admission_application_id: application.id,
          is_active: true,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Link parent
      const { data: existingParent } = await supabaseAdmin
        .from('parents')
        .select('id')
        .eq('email', application.parent_email)
        .single();

      let parentId;
      if (existingParent) {
        parentId = existingParent.id;
      } else {
        // Create parent record
        const { data: parent, error: parentError } = await supabaseAdmin
          .from('parents')
          .insert({
            school_id: schoolId,
            first_name: application.parent_name.split(' ')[0] || 'Parent',
            last_name: application.parent_name.split(' ')[1] || '',
            email: application.parent_email || '',
            phone: application.parent_phone,
            relationship: application.parent_relationship || 'guardian',
            is_active: true,
            created_at: new Date()
          })
          .select()
          .single();

        if (parentError) throw parentError;
        parentId = parent.id;
      }

      // Link student to parent
      await supabaseAdmin
        .from('student_parents')
        .insert({
          student_id: student.id,
          parent_id: parentId,
          relationship: application.parent_relationship || 'guardian',
          is_primary_contact: true,
          created_at: new Date()
        });

      // Create parent user account if needed
      if (application.parent_email && !existingParent) {
        const tempPassword = Math.random().toString(36).slice(-8) + 'Kora@2025';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const { data: parentUser, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            email: application.parent_email,
            password_hash: hashedPassword,
            full_name: application.parent_name,
            phone: application.parent_phone,
            role: 'parent',
            school_id: schoolId,
            is_active: true,
            is_verified: true,
            created_at: new Date()
          })
          .select()
          .single();

        if (userError) throw userError;

        // Link parent to user
        await supabaseAdmin
          .from('parents')
          .update({ user_id: parentUser.id })
          .eq('id', parentId);

        // Send welcome email with credentials (via notification service)
        await notificationService.sendParentNotification(
          schoolId,
          parentId,
          'Welcome to Kora School',
          `Your parent portal has been created. Email: ${application.parent_email}, Temporary Password: ${tempPassword}`,
          'welcome'
        );
      }

      // Update application status to enrolled
      await supabaseAdmin
        .from('admission_applications')
        .update({
          status: 'enrolled',
          enrolled_date: new Date(),
          admission_number: admissionNumber
        })
        .eq('id', application.id);

      return {
        success: true,
        message: 'Student enrolled successfully',
        studentId: student.id,
        admissionNumber
      };
    } catch (error) {
      console.error('Enroll Student Error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // 2. NOTIFY STATUS CHANGE (Send to Parent & Student)
  // =============================================
  async notifyStatusChange(schoolId, applicationId, previousStatus, newStatus, reason = '') {
    try {
      // Get application details
      const { data: application } = await supabaseAdmin
        .from('admission_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (!application) return { success: false, error: 'Application not found' };

      // Get parent
      const { data: parent } = await supabaseAdmin
        .from('parents')
        .select('id, user_id, email')
        .eq('email', application.parent_email)
        .single();

      // Get student user (if exists)
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('user_id')
        .eq('admission_application_id', applicationId)
        .single();

      // Prepare notification message
      const statusMessages = {
        'submitted': 'Your application has been submitted successfully.',
        'under_review': 'Your application is now under review.',
        'awaiting_documents': 'We need additional documents from you.',
        'awaiting_exam': 'You have been scheduled for an entrance examination.',
        'awaiting_interview': 'You have been scheduled for an interview.',
        'approved': 'Congratulations! Your application has been approved.',
        'rejected': 'We regret to inform you that your application was not successful.',
        'enrolled': 'Your child has been successfully enrolled!',
        'waitlist': 'Your application has been placed on the waitlist.'
      };

      const message = `${statusMessages[newStatus] || `Status changed to ${newStatus}`} ${reason ? `Reason: ${reason}` : ''}`;

      // Send to parent
      if (parent?.user_id) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            school_id: schoolId,
            user_id: parent.user_id,
            title: 'Admission Status Update',
            message,
            type: 'admission_status',
            is_read: false,
            created_at: new Date()
          });
      }

      // Send to student
      if (student?.user_id) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            school_id: schoolId,
            user_id: student.user_id,
            title: 'Admission Status Update',
            message,
            type: 'admission_status',
            is_read: false,
            created_at: new Date()
          });
      }

      // Also send email if parent email exists
      if (application.parent_email) {
        const emailService = require('./emailService');
        await emailService.sendEmail({
          to: application.parent_email,
          subject: 'Admission Status Update',
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Admission Status Update</h2>
            <p>Dear ${application.parent_name},</p>
            <p>${message}</p>
            <p>Application Number: ${application.application_number}</p>
          </div>`
        });
      }

      return { success: true, message: 'Notifications sent successfully' };
    } catch (error) {
      console.error('Notify Status Change Error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // 3. PROCESS ACCEPTANCE FEE (Billing Integration)
  // =============================================
  async processAcceptanceFee(schoolId, applicationId, paymentData) {
    try {
      const { data: application } = await supabaseAdmin
        .from('admission_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (!application) return { success: false, error: 'Application not found' };

      // Get school settings
      const { data: settings } = await supabaseAdmin
        .from('admission_settings')
        .select('acceptance_fee_enabled, acceptance_fee_amount')
        .eq('school_id', schoolId)
        .single();

      if (!settings?.acceptance_fee_enabled) {
        return { success: true, message: 'Acceptance fee not enabled for this school' };
      }

      const feeAmount = settings.acceptance_fee_amount || 0;
      const paidAmount = paymentData.amount || feeAmount;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert({
          school_id: schoolId,
          invoice_number: `ACCFEE-${application.application_number}`,
          total_amount: feeAmount,
          paid_amount: 0,
          status: 'pending',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          student_id: application.student_id || null,
          items: [{ description: 'Acceptance Fee', amount: feeAmount }],
          created_at: new Date()
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Process payment if provided
      if (paymentData.paymentMethod) {
        const { data: payment, error: paymentError } = await supabaseAdmin
          .from('payments')
          .insert({
            school_id: schoolId,
            invoice_id: invoice.id,
            amount: paidAmount,
            payment_method: paymentData.paymentMethod,
            reference: paymentData.reference || `PAY-${Date.now()}`,
            payment_date: new Date(),
            status: 'completed',
            created_at: new Date()
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        // Update invoice
        await supabaseAdmin
          .from('invoices')
          .update({
            status: 'paid',
            paid_amount: paidAmount,
            paid_at: new Date()
          })
          .eq('id', invoice.id);

        // Update application
        await supabaseAdmin
          .from('admission_applications')
          .update({
            acceptance_fee_paid: true,
            acceptance_fee_amount: paidAmount,
            payment_status: 'paid',
            updated_at: new Date()
          })
          .eq('id', applicationId);

        return {
          success: true,
          message: 'Acceptance fee paid successfully',
          invoice,
          payment
        };
      }

      // If no payment yet, just create invoice
      return {
        success: true,
        message: 'Acceptance fee invoice created',
        invoice
      };
    } catch (error) {
      console.error('Process Acceptance Fee Error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // 4. GET PARENT'S CHILDREN (Parent Portal Integration)
  // =============================================
  async getParentChildren(parentId) {
    try {
      const { data: children, error } = await supabaseAdmin
        .from('student_parents')
        .select(`
          student_id,
          relationship,
          is_primary_contact,
          students!student_id(
            id,
            first_name,
            last_name,
            admission_number,
            date_of_birth,
            gender,
            class_id,
            classes!class_id(id, name),
            campus_id,
            campuses!campus_id(id, name)
          )
        `)
        .eq('parent_id', parentId);

      if (error) throw error;

      return {
        success: true,
        data: children?.map(c => ({
          id: c.students?.id,
          firstName: c.students?.first_name,
          lastName: c.students?.last_name,
          admissionNumber: c.students?.admission_number,
          dateOfBirth: c.students?.date_of_birth,
          gender: c.students?.gender,
          class: c.students?.classes || {},
          campus: c.students?.campuses || {},
          relationship: c.relationship,
          isPrimaryContact: c.is_primary_contact
        })) || []
      };
    } catch (error) {
      console.error('Get Parent Children Error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AdmissionIntegrationService();