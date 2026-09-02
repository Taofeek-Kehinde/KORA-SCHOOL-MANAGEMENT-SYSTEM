const { supabaseAdmin } = require('../config/supabase');
const emailService = require('./emailService');
const smsService = require('./smsService');

class StudentNotificationService {
  // =============================================
  // GET PARENTS FOR A SPECIFIC STUDENT
  // =============================================
  getStudentParents = async (studentId) => {
    try {
      const { data: parentLinks, error } = await supabaseAdmin
        .from('student_parents')
        .select(`
          parent_id,
          relationship,
          is_primary_contact,
          parents!parent_id(
            id,
            first_name,
            last_name,
            email,
            phone,
            user_id
          )
        `)
        .eq('student_id', studentId);

      if (error) throw error;

      return parentLinks || [];
    } catch (error) {
      console.error('Get Student Parents Error:', error);
      return [];
    }
  };

  // =============================================
  // GET PARENT USER ID
  // =============================================
  getParentUserId = async (parentId) => {
    try {
      const { data: parent, error } = await supabaseAdmin
        .from('parents')
        .select('user_id')
        .eq('id', parentId)
        .single();

      if (error) return null;
      return parent.user_id;
    } catch (error) {
      console.error('Get Parent User ID Error:', error);
      return null;
    }
  };

  // =============================================
  // CREATE IN-APP NOTIFICATION FOR PARENT
  // =============================================
  createInAppNotification = async ({ schoolId, parentId, studentId, title, message, type = 'info' }) => {
    try {
      const parentUserId = await this.getParentUserId(parentId);
      
      if (!parentUserId) {
        console.log('Parent has no user account, skipping in-app notification');
        return { success: false, error: 'No user account' };
      }

      const { error } = await supabaseAdmin
        .from('notifications')
        .insert({
          school_id: schoolId,
          user_id: parentUserId,
          parent_id: parentId,
          student_id: studentId,
          title,
          message,
          type,
          is_read: false,
          created_at: new Date()
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Create In-App Notification Error:', error);
      return { success: false, error: error.message };
    }
  };

  // =============================================
  // SEND EMAIL TO PARENT
  // =============================================
  sendEmailToParent = async ({ schoolName, parentEmail, parentName, studentName, title, message }) => {
    try {
      if (!parentEmail) {
        return { success: false, error: 'No email' };
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0;">${schoolName}</h2>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0;">${title}</h3>
            <p style="color: #4b5563;">Dear ${parentName},</p>
            <p style="color: #4b5563;">${message}</p>
            <p style="color: #6b7280; margin-top: 20px;">
              This notification is for your child: <strong>${studentName}</strong>
            </p>
          </div>
        </div>
      `;

      return await emailService.sendEmail({
        to: parentEmail,
        subject: `${title} - ${schoolName}`,
        html
      });
    } catch (error) {
      console.error('Send Email To Parent Error:', error);
      return { success: false, error: error.message };
    }
  };

  // =============================================
  // SEND SMS TO PARENT
  // =============================================
  sendSMSToParent = async ({ parentPhone, parentName, studentName, title, message }) => {
    try {
      if (!parentPhone) {
        return { success: false, error: 'No phone' };
      }

      const smsMessage = `${title}: ${message} - Student: ${studentName}`;

      return await smsService.sendSMS({
        to: parentPhone,
        message: smsMessage
      });
    } catch (error) {
      console.error('Send SMS To Parent Error:', error);
      return { success: false, error: error.message };
    }
  };

  // =============================================
  // SEND ALL NOTIFICATIONS TO ALL PARENTS OF A STUDENT
  // =============================================
  notifyStudentParents = async ({ schoolId, schoolName, student, title, message, type = 'info', channels = ['in_app', 'email', 'sms'] }) => {
    try {
      const parents = await this.getStudentParents(student.id);
      
      const results = {
        total_parents: parents.length,
        in_app: { success: 0, failed: 0 },
        email: { success: 0, failed: 0 },
        sms: { success: 0, failed: 0 },
        notifications_sent: 0,
        errors: []
      };

      const studentName = `${student.first_name} ${student.last_name}`;

      for (const parentLink of parents) {
        const parent = parentLink.parents;
        if (!parent) continue;

        // In-App Notification
        if (channels.includes('in_app')) {
          const result = await this.createInAppNotification({
            schoolId,
            parentId: parent.id,
            studentId: student.id,
            title,
            message,
            type
          });
          
          if (result.success) {
            results.in_app.success++;
            results.notifications_sent++;
          } else {
            results.in_app.failed++;
            results.errors.push({ parent: parent.id, channel: 'in_app', error: result.error });
          }
        }

        // Email Notification
        if (channels.includes('email')) {
          const result = await this.sendEmailToParent({
            schoolName,
            parentEmail: parent.email,
            parentName: `${parent.first_name} ${parent.last_name}`,
            studentName,
            title,
            message
          });
          
          if (result.success) {
            results.email.success++;
            results.notifications_sent++;
          } else {
            results.email.failed++;
            results.errors.push({ parent: parent.id, channel: 'email', error: result.error });
          }
        }

        // SMS Notification
        if (channels.includes('sms')) {
          const result = await this.sendSMSToParent({
            parentPhone: parent.phone,
            parentName: `${parent.first_name} ${parent.last_name}`,
            studentName,
            title,
            message
          });
          
          if (result.success) {
            results.sms.success++;
            results.notifications_sent++;
          } else {
            results.sms.failed++;
            results.errors.push({ parent: parent.id, channel: 'sms', error: result.error });
          }
        }
      }

      console.log('Student Parent Notifications:', results);
      return results;
    } catch (error) {
      console.error('Notify Student Parents Error:', error);
      return {
        total_parents: 0,
        in_app: { success: 0, failed: 0 },
        email: { success: 0, failed: 0 },
        sms: { success: 0, failed: 0 },
        notifications_sent: 0,
        errors: [error.message]
      };
    }
  };

  // =============================================
  // NOTIFY STUDENT ADMITTED
  // =============================================
  notifyStudentAdmitted = async ({ schoolId, school, student, adminName }) => {
    const title = 'Student Admitted';
    const message = `Your child ${student.first_name} ${student.last_name} has been admitted to ${school.name}. Admission Number: ${student.admission_number}.`;

    return await this.notifyStudentParents({
      schoolId,
      schoolName: school.name,
      student,
      title,
      message,
      type: 'admission'
    });
  };

  // =============================================
  // NOTIFY STUDENT PROMOTED
  // =============================================
  notifyStudentPromoted = async ({ schoolId, school, student, fromClass, toClass }) => {
    const title = 'Student Promoted';
    const message = `Your child ${student.first_name} ${student.last_name} has been promoted from ${fromClass} to ${toClass}.`;

    return await this.notifyStudentParents({
      schoolId,
      schoolName: school.name,
      student,
      title,
      message,
      type: 'promotion'
    });
  };

  // =============================================
  // NOTIFY CLASS CHANGE
  // =============================================
  notifyClassChange = async ({ schoolId, school, student, fromClass, toClass }) => {
    const title = 'Class Change';
    const message = `Your child ${student.first_name} ${student.last_name} has been moved from ${fromClass} to ${toClass}.`;

    return await this.notifyStudentParents({
      schoolId,
      schoolName: school.name,
      student,
      title,
      message,
      type: 'class_change'
    });
  };

  // =============================================
  // NOTIFY PROFILE UPDATED
  // =============================================
  notifyProfileUpdated = async ({ schoolId, school, student, changes }) => {
    const title = 'Profile Updated';
    const message = `Your child ${student.first_name} ${student.last_name}'s profile has been updated. ${changes}`;

    return await this.notifyStudentParents({
      schoolId,
      schoolName: school.name,
      student,
      title,
      message,
      type: 'profile_update'
    });
  };

  // =============================================
  // NOTIFY RECORDS MODIFIED
  // =============================================
  notifyRecordsModified = async ({ schoolId, school, student, recordType, changes }) => {
    const title = `${recordType} Updated`;
    const message = `Your child ${student.first_name} ${student.last_name}'s ${recordType} has been updated. ${changes}`;

    return await this.notifyStudentParents({
      schoolId,
      schoolName: school.name,
      student,
      title,
      message,
      type: 'record_update'
    });
  };
}

module.exports = new StudentNotificationService();