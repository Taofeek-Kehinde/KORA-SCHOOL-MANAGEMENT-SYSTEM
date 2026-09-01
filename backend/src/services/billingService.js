const { supabaseAdmin } = require('../config/supabase');
const emailService = require('./emailService');
const smsService = require('./smsService');
const notificationService = require('./notificationService');
const receiptService = require('./receiptService');

class BillingService {
  // =============================================
  // STEP 1: Calculate: Active Students × Price Per Student
  // =============================================
  async calculateBill(schoolId) {
    try {
      // Get school configuration
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select('price_per_student, billing_frequency, name, email')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;

      // Get active students count
      const { count: studentCount, error: countError } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (countError) throw countError;

      // Calculate bill
      const pricePerStudent = school.price_per_student || 800;
      const totalAmount = (studentCount || 0) * pricePerStudent;

      return {
        schoolId,
        schoolName: school.name,
        schoolEmail: school.email,
        studentCount: studentCount || 0,
        pricePerStudent,
        totalAmount,
        billingFrequency: school.billing_frequency || 'monthly',
        calculatedAt: new Date()
      };
    } catch (error) {
      console.error('Calculate Bill Error:', error);
      throw error;
    }
  }

  // =============================================
  // STEP 2: Generate Invoice Automatically
  // =============================================
  async generateInvoice(calculationResult) {
    try {
      const { schoolId, studentCount, pricePerStudent, totalAmount, schoolName } = calculationResult;

      if (studentCount === 0) {
        throw new Error('No active students found for invoice generation');
      }

      // Get all active students
      const { data: students, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id, first_name, last_name, admission_number, class_id')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (studentError) throw studentError;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days due date

      // Generate invoice for each student
      const invoices = [];
      for (const student of students) {
        const { data: invoice, error: invError } = await supabaseAdmin
          .from('invoices')
          .insert({
            school_id: schoolId,
            student_id: student.id,
            amount: pricePerStudent,
            total_amount: pricePerStudent,
            due_date: dueDate,
            status: 'pending',
            items: [{
              description: `Tuition Fee - ${schoolName}`,
              amount: pricePerStudent,
              student_name: `${student.first_name} ${student.last_name}`,
              admission_number: student.admission_number,
              term: new Date().toLocaleString('default', { month: 'long' })
            }],
            metadata: {
              generated_by: 'system',
              bulk_generation: true,
              student_count: students.length,
              total_amount: totalAmount,
              billing_frequency: calculationResult.billingFrequency
            },
            created_by: 'system',
            created_at: new Date()
          })
          .select()
          .single();

        if (invError) throw invError;
        invoices.push(invoice);
      }

      // Create subscription transaction
      const { data: transaction, error: transError } = await supabaseAdmin
        .from('subscription_transactions')
        .insert({
          school_id: schoolId,
          invoice_id: invoices[0]?.id,
          amount: totalAmount,
          status: 'pending',
          reference: `INV-${Date.now()}`,
          metadata: {
            invoice_count: invoices.length,
            student_count: students.length,
            generated_by: 'system'
          },
          created_at: new Date()
        })
        .select()
        .single();

      if (transError) throw transError;

      // Update school with new subscription end date
      const subscriptionEndDate = new Date();
      if (calculationResult.billingFrequency === 'monthly') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      } else if (calculationResult.billingFrequency === 'termly') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 4);
      } else if (calculationResult.billingFrequency === 'annually') {
        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
      }

      await supabaseAdmin
        .from('schools')
        .update({
          subscription_end_date: subscriptionEndDate,
          updated_at: new Date()
        })
        .eq('id', schoolId);

      return {
        invoices,
        transaction,
        summary: {
          totalInvoices: invoices.length,
          totalAmount: totalAmount,
          perStudent: pricePerStudent,
          dueDate: dueDate,
          studentCount: students.length
        }
      };
    } catch (error) {
      console.error('Generate Invoice Error:', error);
      throw error;
    }
  }

  // =============================================
  // STEP 3: Send Invoice via Email
  // =============================================
  async sendInvoiceEmail(invoiceData, school) {
    try {
      const emailContent = this.generateInvoiceEmail(invoiceData, school);
      
      // Send email using email service
      await emailService.sendEmail({
        to: school.email,
        subject: `Invoice #${invoiceData.invoice_number} - ${school.name}`,
        html: emailContent,
        attachments: [
          {
            filename: `invoice-${invoiceData.invoice_number}.pdf`,
            content: invoiceData.pdfContent || 'Invoice PDF content'
          }
        ]
      });

      // Log email sent
      await supabaseAdmin
        .from('notifications')
        .insert({
          school_id: school.id,
          title: 'Invoice Sent via Email',
          message: `Invoice #${invoiceData.invoice_number} has been sent to ${school.email}`,
          type: 'email',
          created_at: new Date()
        });

      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Send Invoice Email Error:', error);
      return { success: false, message: error.message };
    }
  }

  // =============================================
  // STEP 4: Send Invoice via SMS Reminder
  // =============================================
  async sendInvoiceSMS(invoiceData, school) {
    try {
      const smsContent = this.generateInvoiceSMS(invoiceData, school);
      
      // Send SMS using SMS service
      await smsService.sendSMS({
        to: school.phone,
        message: smsContent
      });

      // Log SMS sent
      await supabaseAdmin
        .from('notifications')
        .insert({
          school_id: school.id,
          title: 'Invoice SMS Reminder',
          message: `SMS reminder sent to ${school.phone}`,
          type: 'sms',
          created_at: new Date()
        });

      return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
      console.error('Send Invoice SMS Error:', error);
      return { success: false, message: error.message };
    }
  }

  // =============================================
  // STEP 5: Show Dashboard Notification
  // =============================================
  async sendDashboardNotification(invoiceData, school) {
    try {
      // Create in-app notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          school_id: school.id,
          user_id: school.admin_id,
          title: 'New Invoice Generated',
          message: `An invoice of ₦${invoiceData.total_amount.toLocaleString()} has been generated. Due date: ${new Date(invoiceData.due_date).toLocaleDateString()}`,
          type: 'in_app',
          link: `/invoices/${invoiceData.invoice_id}`,
          created_at: new Date()
        });

      // Update notification statistics
      await this.updateNotificationStats();

      return { success: true, message: 'Dashboard notification sent' };
    } catch (error) {
      console.error('Dashboard Notification Error:', error);
      return { success: false, message: error.message };
    }
  }

  // =============================================
  // STEP 6: Process School Payment
  // =============================================
  async processPayment(invoiceId, paymentData) {
    try {
      const { paymentMethod, reference, amount } = paymentData;

      // Get invoice
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .select(`
          *,
          schools!school_id(id, name, email, phone),
          students!student_id(first_name, last_name, admission_number)
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      if (invoice.status === 'paid') {
        throw new Error('Invoice is already paid');
      }

      // Update invoice
      const paidAmount = amount || invoice.total_amount;
      const { data: updatedInvoice, error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({
          status: 'paid',
          paid_amount: paidAmount,
          payment_method: paymentMethod,
          payment_reference: reference,
          paid_at: new Date(),
          updated_at: new Date()
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update subscription transaction
      const { data: transaction, error: transError } = await supabaseAdmin
        .from('subscription_transactions')
        .update({
          status: 'completed',
          payment_method: paymentMethod,
          reference: reference,
          payment_date: new Date()
        })
        .eq('invoice_id', invoiceId)
        .select()
        .single();

      if (transError) throw transError;

      // STEP 7: Generate Receipt
      const receipt = await this.generateReceipt(updatedInvoice, invoice);

      // STEP 8: Activate Subscription
      const subscriptionActivated = await this.activateSubscription(invoice.school_id);

      // STEP 9: Schedule Next Renewal
      const nextRenewal = await this.scheduleNextRenewal(invoice.school_id);

      return {
        invoice: updatedInvoice,
        transaction,
        receipt,
        subscriptionActivated,
        nextRenewal
      };
    } catch (error) {
      console.error('Process Payment Error:', error);
      throw error;
    }
  }

  // =============================================
  // STEP 7: Generate Receipt
  // =============================================
  async generateReceipt(invoice, originalInvoice) {
    try {
      const receiptData = {
        receipt_number: `RCP-${Date.now()}`,
        invoice_number: invoice.invoice_number,
        school_name: invoice.schools?.name || 'Unknown School',
        school_id: invoice.school_id,
        student_name: invoice.students ? 
          `${invoice.students.first_name} ${invoice.students.last_name}` : 
          'Unknown Student',
        admission_number: invoice.students?.admission_number || 'N/A',
        amount: invoice.total_amount,
        paid_amount: invoice.paid_amount || invoice.total_amount,
        payment_method: invoice.payment_method,
        payment_reference: invoice.payment_reference,
        paid_at: invoice.paid_at,
        items: invoice.items || [],
        generated_at: new Date()
      };

      // Generate PDF receipt (simplified - actual PDF generation would use pdfkit or similar)
      const pdfContent = this.generateReceiptPDF(receiptData);

      // Store receipt in documents
      const { data: document, error: docError } = await supabaseAdmin
        .from('documents')
        .insert({
          school_id: invoice.school_id,
          user_id: invoice.created_by,
          student_id: invoice.student_id,
          name: `Receipt-${invoice.invoice_number}`,
          file_url: `/receipts/${receiptData.receipt_number}`,
          file_type: 'application/pdf',
          description: `Payment receipt for invoice ${invoice.invoice_number}`,
          category: 'receipt',
          uploaded_at: new Date()
        })
        .select()
        .single();

      if (docError) throw docError;

      return {
        ...receiptData,
        document_id: document.id,
        pdf_content: pdfContent
      };
    } catch (error) {
      console.error('Generate Receipt Error:', error);
      throw error;
    }
  }

  // =============================================
  // STEP 8: Activate Subscription
  // =============================================
  async activateSubscription(schoolId) {
    try {
      // Check if all invoices are paid
      const { data: pendingInvoices, error: pendingError } = await supabaseAdmin
        .from('invoices')
        .select('id, status')
        .eq('school_id', schoolId)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      if (!pendingInvoices || pendingInvoices.length === 0) {
        // All invoices paid - activate subscription
        const { data: school, error: updateError } = await supabaseAdmin
          .from('schools')
          .update({
            subscription_status: 'active',
            subscription_start_date: new Date(),
            updated_at: new Date(),
            suspended_at: null,
            suspension_reason: null
          })
          .eq('id', schoolId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Log activation
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            school_id: schoolId,
            action: 'SUBSCRIPTION_ACTIVATED',
            entity_type: 'school',
            entity_id: schoolId,
            new_values: { 
              status: 'active',
              activated_at: new Date()
            }
          });

        return {
          success: true,
          message: 'Subscription activated successfully',
          school
        };
      }

      return {
        success: false,
        message: `${pendingInvoices.length} invoices still pending`,
        pendingInvoices: pendingInvoices.length
      };
    } catch (error) {
      console.error('Activate Subscription Error:', error);
      throw error;
    }
  }

  // =============================================
  // STEP 9: Schedule Next Renewal
  // =============================================
  async scheduleNextRenewal(schoolId) {
    try {
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select('billing_frequency, subscription_end_date')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;

      const nextRenewalDate = new Date();
      
      switch (school.billing_frequency) {
        case 'monthly':
          nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
          break;
        case 'termly':
          nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 4);
          break;
        case 'annually':
          nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
          break;
        default:
          nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
      }

      // Update school with new renewal date
      const { data: updatedSchool, error: updateError } = await supabaseAdmin
        .from('schools')
        .update({
          subscription_end_date: nextRenewalDate,
          updated_at: new Date()
        })
        .eq('id', schoolId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Schedule reminder
      await this.scheduleRenewalReminder(schoolId, nextRenewalDate);

      // Log renewal scheduling
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          action: 'RENEWAL_SCHEDULED',
          entity_type: 'school',
          entity_id: schoolId,
          new_values: { 
            next_renewal_date: nextRenewalDate,
            billing_frequency: school.billing_frequency
          }
        });

      return {
        success: true,
        nextRenewalDate,
        billingFrequency: school.billing_frequency
      };
    } catch (error) {
      console.error('Schedule Renewal Error:', error);
      throw error;
    }
  }

  // =============================================
  // HELPER FUNCTIONS
  // =============================================

  generateInvoiceEmail(invoiceData, school) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Invoice Generated</h2>
        <p>Dear ${school.name},</p>
        <p>An invoice has been generated for your school.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Invoice Number:</strong> ${invoiceData.invoice_number}</p>
          <p><strong>Amount:</strong> ₦${invoiceData.total_amount.toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoiceData.due_date).toLocaleDateString()}</p>
          <p><strong>Students:</strong> ${invoiceData.student_count}</p>
          <p><strong>Per Student:</strong> ₦${invoiceData.per_student}</p>
        </div>
        <p>Please login to your dashboard to view and pay the invoice.</p>
        <a href="${process.env.FRONTEND_URL}/invoices/${invoiceData.invoice_id}" 
           style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Invoice
        </a>
        <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
  }

  generateInvoiceSMS(invoiceData, school) {
    return `Kora School: Invoice ${invoiceData.invoice_number} generated. Amount: ₦${invoiceData.total_amount.toLocaleString()}. Due: ${new Date(invoiceData.due_date).toLocaleDateString()}. Login to pay.`;
  }

  generateReceiptPDF(receiptData) {
    // Simplified receipt content - actual PDF would be generated with pdfkit
    return `
      ======================================
      KORA SCHOOL MANAGEMENT SYSTEM
      PAYMENT RECEIPT
      ======================================
      Receipt Number: ${receiptData.receipt_number}
      Invoice Number: ${receiptData.invoice_number}
      Date: ${new Date(receiptData.generated_at).toLocaleDateString()}
      ======================================
      School: ${receiptData.school_name}
      Student: ${receiptData.student_name}
      Admission: ${receiptData.admission_number}
      ======================================
      Amount Paid: ₦${receiptData.paid_amount.toLocaleString()}
      Payment Method: ${receiptData.payment_method || 'N/A'}
      Reference: ${receiptData.payment_reference || 'N/A'}
      ======================================
      Thank you for your payment!
    `;
  }

  async updateNotificationStats() {
    await supabaseAdmin
      .from('system_health_logs')
      .update({
        notification_stats: {
          sent: 1,
          failed: 0,
          last_sent: new Date()
        }
      })
      .eq('id', 1);
  }

  async scheduleRenewalReminder(schoolId, renewalDate) {
    const reminderDays = [7, 3, 1];
    for (const days of reminderDays) {
      const reminderDate = new Date(renewalDate);
      reminderDate.setDate(reminderDate.getDate() - days);
      
      await supabaseAdmin
        .from('notifications')
        .insert({
          school_id: schoolId,
          title: `Renewal Reminder (${days} days)`,
          message: `Your subscription will renew in ${days} days on ${renewalDate.toLocaleDateString()}. Please ensure payment is ready.`,
          type: 'in_app',
          scheduled_at: reminderDate,
          created_at: new Date()
        });
    }
  }
}

module.exports = new BillingService();