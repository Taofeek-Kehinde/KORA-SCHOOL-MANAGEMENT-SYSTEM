const billingService = require('../services/billingService');
const { supabaseAdmin } = require('../config/supabase');

class BillingController {
  // =============================================
  // COMPLETE BILLING WORKFLOW (All 9 Steps)
  // =============================================
  async runFullBillingWorkflow(req, res) {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;

      // STEP 1: Calculate Bill
      const calculationResult = await billingService.calculateBill(schoolId);
      
      if (calculationResult.studentCount === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No active students found for billing'
        });
      }

      // STEP 2: Generate Invoice
      const invoiceResult = await billingService.generateInvoice(calculationResult);

      // Get school details for notifications
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;

      // STEP 3: Send Invoice Email
      const emailResult = await billingService.sendInvoiceEmail(
        {
          invoice_number: invoiceResult.invoices[0]?.invoice_number,
          total_amount: invoiceResult.summary.totalAmount,
          due_date: invoiceResult.summary.dueDate,
          student_count: invoiceResult.summary.studentCount,
          per_student: invoiceResult.summary.perStudent,
          invoice_id: invoiceResult.invoices[0]?.id
        },
        school
      );

      // STEP 4: Send Invoice SMS Reminder
      const smsResult = await billingService.sendInvoiceSMS(
        {
          invoice_number: invoiceResult.invoices[0]?.invoice_number,
          total_amount: invoiceResult.summary.totalAmount,
          due_date: invoiceResult.summary.dueDate
        },
        school
      );

      // STEP 5: Show Dashboard Notification
      const notificationResult = await billingService.sendDashboardNotification(
        {
          invoice_number: invoiceResult.invoices[0]?.invoice_number,
          total_amount: invoiceResult.summary.totalAmount,
          due_date: invoiceResult.summary.dueDate,
          invoice_id: invoiceResult.invoices[0]?.id
        },
        school
      );

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'FULL_BILLING_WORKFLOW',
          entity_type: 'school',
          entity_id: schoolId,
          new_values: {
            student_count: calculationResult.studentCount,
            total_amount: calculationResult.totalAmount,
            invoice_count: invoiceResult.summary.totalInvoices,
            steps_completed: ['calculate', 'generate', 'email', 'sms', 'notification']
          }
        });

      res.status(201).json({
        status: 'success',
        message: 'Billing workflow completed successfully',
        data: {
          calculation: calculationResult,
          invoices: invoiceResult.invoices,
          summary: invoiceResult.summary,
          notifications: {
            email: emailResult,
            sms: smsResult,
            dashboard: notificationResult
          },
          steps: {
            step1_calculate: 'completed',
            step2_generate_invoice: 'completed',
            step3_send_email: emailResult.success ? 'completed' : 'failed',
            step4_send_sms: smsResult.success ? 'completed' : 'failed',
            step5_dashboard_notification: notificationResult.success ? 'completed' : 'failed'
          }
        }
      });
    } catch (error) {
      console.error('Billing Workflow Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to run billing workflow',
        error: error.message
      });
    }
  }

  // =============================================
  // PROCESS PAYMENT (Steps 6-9)
  // =============================================
  async processPayment(req, res) {
    try {
      const { invoiceId } = req.params;
      const { paymentMethod, reference, amount } = req.body;
      const { adminId } = req.user;

      const result = await billingService.processPayment(invoiceId, {
        paymentMethod,
        reference,
        amount
      });

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: result.invoice.school_id,
          user_id: adminId,
          action: 'PROCESS_PAYMENT_FULL',
          entity_type: 'invoice',
          entity_id: invoiceId,
          new_values: {
            payment_method: paymentMethod,
            reference: reference,
            amount: amount || result.invoice.total_amount,
            steps_completed: ['payment', 'receipt', 'activation', 'renewal']
          }
        });

      res.status(200).json({
        status: 'success',
        message: 'Payment processed successfully',
        data: {
          invoice: result.invoice,
          transaction: result.transaction,
          receipt: result.receipt,
          subscription: {
            activated: result.subscriptionActivated.success,
            message: result.subscriptionActivated.message,
            pending_invoices: result.subscriptionActivated.pendingInvoices || 0
          },
          next_renewal: result.nextRenewal,
          steps: {
            step6_payment: 'completed',
            step7_receipt: 'completed',
            step8_activate: result.subscriptionActivated.success ? 'completed' : 'pending',
            step9_renewal: 'completed'
          }
        }
      });
    } catch (error) {
      console.error('Process Payment Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process payment',
        error: error.message
      });
    }
  }

  // =============================================
  // GET BILLING STATUS
  // =============================================
  async getBillingStatus(req, res) {
    try {
      const { schoolId } = req.params;

      // Get school billing info
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select('price_per_student, billing_frequency, subscription_status, subscription_end_date')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;

      // Get student count
      const { count: studentCount, error: countError } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (countError) throw countError;

      // Get invoice summary
      const { data: invoices, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .select('status, total_amount, paid_amount, due_date')
        .eq('school_id', schoolId);

      if (invoiceError) throw invoiceError;

      const totalInvoices = invoices?.length || 0;
      const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];
      const pendingInvoices = invoices?.filter(i => i.status === 'pending') || [];
      const overdueInvoices = invoices?.filter(i => i.status === 'overdue') || [];

      const totalAmount = invoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0;
      const paidAmount = paidInvoices.reduce((sum, i) => sum + i.total_amount, 0);
      const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total_amount, 0);

      res.status(200).json({
        status: 'success',
        data: {
          school: {
            name: school.name,
            price_per_student: school.price_per_student,
            billing_frequency: school.billing_frequency,
            subscription_status: school.subscription_status,
            subscription_end_date: school.subscription_end_date
          },
          students: {
            total: studentCount || 0,
            estimated_bill: (studentCount || 0) * (school.price_per_student || 0)
          },
          invoices: {
            total: totalInvoices,
            paid: paidInvoices.length,
            pending: pendingInvoices.length,
            overdue: overdueInvoices.length,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            pending_amount: pendingAmount
          },
          next_billing_date: school.subscription_end_date
        }
      });
    } catch (error) {
      console.error('Billing Status Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch billing status',
        error: error.message
      });
    }
  }
}

module.exports = new BillingController();