const { supabaseAdmin } = require('../config/supabase');

class SubscriptionConfigController {
  // =============================================
  // SUBSCRIPTION CONFIGURATION
  // =============================================

  // Get school subscription configuration
  async getSchoolConfig(req, res) {
    try {
      const { schoolId } = req.params;

      const { data: config, error } = await supabaseAdmin
        .from('schools')
        .select(`
          id,
          name,
          price_per_student,
          billing_frequency,
          academic_session,
          current_term,
          trial_start_date,
          trial_end_date,
          grace_period_days,
          discount_percentage,
          coupon_code,
          promo_campaign_id,
          renewal_reminder_days,
          late_payment_days,
          auto_suspend_after_days,
          manual_suspension,
          auto_reactivate,
          subscription_status,
          subscription_start_date,
          subscription_end_date,
          subscription_plans!subscription_plan_id(*)
        `)
        .eq('id', schoolId)
        .single();

      if (error) throw error;

      // Get active students count
      const { count: studentCount, error: countError } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (countError) throw countError;

      // Get pending invoices
      const { count: pendingInvoices, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('status', 'pending');

      if (invoiceError) throw invoiceError;

      // Calculate estimated bill
      const estimatedBill = (studentCount || 0) * (config.price_per_student || 0);

      res.status(200).json({
        status: 'success',
        data: {
          ...config,
          active_students: studentCount || 0,
          pending_invoices: pendingInvoices || 0,
          estimated_bill: estimatedBill
        }
      });
    } catch (error) {
      console.error('Get Config Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch subscription configuration',
        error: error.message
      });
    }
  }

  // Update subscription configuration
  async updateSubscriptionConfig(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        pricePerStudent,
        billingFrequency,
        academicSession,
        currentTerm,
        trialStartDate,
        trialEndDate,
        gracePeriodDays,
        discountPercentage,
        couponCode,
        promoCampaignId,
        renewalReminderDays,
        latePaymentDays,
        autoSuspendAfterDays,
        manualSuspension,
        autoReactivate
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (pricePerStudent !== undefined) updateData.price_per_student = pricePerStudent;
      if (billingFrequency !== undefined) updateData.billing_frequency = billingFrequency;
      if (academicSession !== undefined) updateData.academic_session = academicSession;
      if (currentTerm !== undefined) updateData.current_term = currentTerm;
      if (trialStartDate !== undefined) updateData.trial_start_date = trialStartDate;
      if (trialEndDate !== undefined) updateData.trial_end_date = trialEndDate;
      if (gracePeriodDays !== undefined) updateData.grace_period_days = gracePeriodDays;
      if (discountPercentage !== undefined) updateData.discount_percentage = discountPercentage;
      if (couponCode !== undefined) updateData.coupon_code = couponCode;
      if (promoCampaignId !== undefined) updateData.promo_campaign_id = promoCampaignId;
      if (renewalReminderDays !== undefined) updateData.renewal_reminder_days = renewalReminderDays;
      if (latePaymentDays !== undefined) updateData.late_payment_days = latePaymentDays;
      if (autoSuspendAfterDays !== undefined) updateData.auto_suspend_after_days = autoSuspendAfterDays;
      if (manualSuspension !== undefined) updateData.manual_suspension = manualSuspension;
      if (autoReactivate !== undefined) updateData.auto_reactivate = autoReactivate;
      updateData.updated_at = new Date();

      const { data: config, error } = await supabaseAdmin
        .from('schools')
        .update(updateData)
        .eq('id', schoolId)
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'UPDATE_SUBSCRIPTION_CONFIG',
          entity_type: 'school',
          entity_id: schoolId,
          new_values: updateData
        });

      res.status(200).json({
        status: 'success',
        message: 'Subscription configuration updated successfully',
        data: config
      });
    } catch (error) {
      console.error('Update Config Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update subscription configuration',
        error: error.message
      });
    }
  }

  // =============================================
  // BILLING WORKFLOW (Pages 7-8)
  // =============================================

  // Generate invoice for school
  async generateInvoice(req, res) {
    try {
      const { schoolId } = req.params;
      const { studentIds, customAmount, dueDate, description } = req.body;
      const { adminId } = req.user;

      // Get school configuration
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select('price_per_student, name, email')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;

      // Get students
      let students;
      if (studentIds && studentIds.length > 0) {
        const { data, error } = await supabaseAdmin
          .from('students')
          .select('id, first_name, last_name, admission_number, class_id')
          .in('id', studentIds)
          .eq('is_active', true);

        if (error) throw error;
        students = data;
      } else {
        // Generate for all active students
        const { data, error } = await supabaseAdmin
          .from('students')
          .select('id, first_name, last_name, admission_number, class_id')
          .eq('school_id', schoolId)
          .eq('is_active', true);

        if (error) throw error;
        students = data;
      }

      if (!students || students.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No active students found for invoice generation'
        });
      }

      // Calculate amount per student
      const amountPerStudent = customAmount || school.price_per_student || 800;
      const totalAmount = students.length * amountPerStudent;

      // Generate invoices for each student
      const invoices = [];
      for (const student of students) {
        const { data: invoice, error: invError } = await supabaseAdmin
          .from('invoices')
          .insert({
            school_id: schoolId,
            student_id: student.id,
            amount: amountPerStudent,
            total_amount: amountPerStudent,
            due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'pending',
            items: [{ 
              description: description || 'Tuition Fee', 
              amount: amountPerStudent,
              student_name: `${student.first_name} ${student.last_name}`,
              admission_number: student.admission_number
            }],
            metadata: { 
              generated_by: adminId, 
              bulk_generation: true,
              student_count: students.length,
              total_amount: totalAmount
            },
            created_by: adminId,
            created_at: new Date()
          })
          .select()
          .single();

        if (invError) throw invError;
        invoices.push(invoice);
      }

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'GENERATE_INVOICE_BULK',
          entity_type: 'invoice',
          entity_id: invoices[0]?.id,
          new_values: { 
            student_count: students.length,
            total_amount: totalAmount,
            per_student: amountPerStudent
          }
        });

      // Create subscription transaction record
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
            student_count: students.length
          },
          created_at: new Date()
        })
        .select()
        .single();

      if (transError) throw transError;

      // Send notification (email/SMS)
      await this.sendInvoiceNotifications(school, invoices, totalAmount);

      res.status(201).json({
        status: 'success',
        message: `${invoices.length} invoices generated successfully`,
        data: {
          invoices,
          transaction,
          summary: {
            total_invoices: invoices.length,
            total_amount: totalAmount,
            per_student: amountPerStudent,
            due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      });
    } catch (error) {
      console.error('Generate Invoice Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate invoices',
        error: error.message
      });
    }
  }

  // Process payment for invoice
  async processPayment(req, res) {
    try {
      const { invoiceId } = req.params;
      const { paymentMethod, reference, amount } = req.body;
      const { adminId } = req.user;

      // Get invoice
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .select(`
          *,
          schools!school_id(name, email),
          students!student_id(first_name, last_name, admission_number)
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      if (invoice.status === 'paid') {
        return res.status(400).json({
          status: 'error',
          message: 'Invoice is already paid'
        });
      }

      // Update invoice
      const { data: updatedInvoice, error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({
          status: 'paid',
          paid_amount: amount || invoice.total_amount,
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

      // Generate receipt
      const receipt = await this.generateReceipt(invoice);

      // Update school subscription if fully paid
      await this.checkAndActivateSubscription(invoice.school_id);

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: invoice.school_id,
          user_id: adminId,
          action: 'PROCESS_PAYMENT',
          entity_type: 'invoice',
          entity_id: invoiceId,
          new_values: { 
            payment_method: paymentMethod,
            reference: reference,
            amount: amount || invoice.total_amount
          }
        });

      res.status(200).json({
        status: 'success',
        message: 'Payment processed successfully',
        data: {
          invoice: updatedInvoice,
          transaction,
          receipt
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

  // Helper: Send invoice notifications
  async sendInvoiceNotifications(school, invoices, totalAmount) {
    try {
      // Email notification
      // SMS notification
      // Dashboard notification

      // Create in-app notifications
      for (const invoice of invoices) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            school_id: school.id,
            user_id: invoice.created_by,
            title: 'New Invoice Generated',
            message: `An invoice of ₦${invoice.total_amount} has been generated for ${school.name}`,
            type: 'in_app',
            link: `/invoices/${invoice.id}`,
            created_at: new Date()
          });
      }

      // Update notification stats
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

      return true;
    } catch (error) {
      console.error('Send Notifications Error:', error);
      return false;
    }
  }

  // Helper: Generate receipt
  async generateReceipt(invoice) {
    const receiptData = {
      receipt_number: `RCP-${Date.now()}`,
      invoice_number: invoice.invoice_number,
      school_name: invoice.schools?.name || 'Unknown School',
      student_name: invoice.students ? 
        `${invoice.students.first_name} ${invoice.students.last_name}` : 
        'Unknown Student',
      admission_number: invoice.students?.admission_number || 'N/A',
      amount: invoice.total_amount,
      paid_amount: invoice.paid_amount || invoice.total_amount,
      payment_method: invoice.payment_method,
      payment_reference: invoice.payment_reference,
      paid_at: invoice.paid_at,
      generated_at: new Date()
    };

    // Store receipt
    await supabaseAdmin
      .from('documents')
      .insert({
        school_id: invoice.school_id,
        user_id: invoice.created_by,
        student_id: invoice.student_id,
        name: `Receipt-${invoice.invoice_number}`,
        file_url: `/receipts/${receiptData.receipt_number}.pdf`,
        file_type: 'application/pdf',
        description: `Payment receipt for invoice ${invoice.invoice_number}`,
        category: 'receipt',
        uploaded_at: new Date()
      });

    return receiptData;
  }

  // Helper: Check and activate subscription
  async checkAndActivateSubscription(schoolId) {
    try {
      // Check if all invoices are paid
      const { data: pendingInvoices, error } = await supabaseAdmin
        .from('invoices')
        .select('id')
        .eq('school_id', schoolId)
        .eq('status', 'pending');

      if (error) throw error;

      if (!pendingInvoices || pendingInvoices.length === 0) {
        // All invoices paid - activate subscription
        await supabaseAdmin
          .from('schools')
          .update({
            subscription_status: 'active',
            subscription_start_date: new Date(),
            subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            updated_at: new Date()
          })
          .eq('id', schoolId);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Check Subscription Error:', error);
      return false;
    }
  }

  // =============================================
  // BILLING WORKFLOW - AUTOMATED TASKS
  // =============================================

  // Run billing automation (cron job)
  async runBillingAutomation(req, res) {
    try {
      const results = {
        invoices_generated: 0,
        reminders_sent: 0,
        suspensions_processed: 0,
        reactivations_processed: 0,
        errors: []
      };

      // 1. Generate invoices for schools due for billing
      const { data: schoolsDue, error: dueError } = await supabaseAdmin
        .from('schools')
        .select('id, name, price_per_student, billing_frequency, subscription_end_date')
        .eq('subscription_status', 'active')
        .or(`subscription_end_date.lt.${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)},subscription_end_date.is.null`);

      if (dueError) throw dueError;

      for (const school of schoolsDue || []) {
        try {
          // Generate invoice
          const { data: students, error: studentError } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('school_id', school.id)
            .eq('is_active', true);

          if (studentError) throw studentError;

          if (students && students.length > 0) {
            const studentIds = students.map(s => s.id);
            await this.generateInvoice(
              { params: { schoolId: school.id }, body: { studentIds }, user: { adminId: 'system' } },
              { status: () => ({ json: () => {} }) }
            );
            results.invoices_generated += students.length;
          }
        } catch (error) {
          results.errors.push({ school: school.name, error: error.message });
        }
      }

      // 2. Send renewal reminders
      const { data: schoolsForReminder, error: reminderError } = await supabaseAdmin
        .from('schools')
        .select('id, name, email, renewal_reminder_days, subscription_end_date')
        .eq('subscription_status', 'active')
        .where('subscription_end_date', '<=', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        .where('subscription_end_date', '>=', new Date());

      if (reminderError) throw reminderError;

      for (const school of schoolsForReminder || []) {
        await this.sendRenewalReminder(school);
        results.reminders_sent += 1;
      }

      // 3. Process automatic suspensions
      const { data: schoolsForSuspension, error: suspendError } = await supabaseAdmin
        .from('schools')
        .select('id, name, auto_suspend_after_days, subscription_end_date')
        .eq('subscription_status', 'active')
        .eq('automatic_suspension', true)
        .where('subscription_end_date', '<=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

      if (suspendError) throw suspendError;

      for (const school of schoolsForSuspension || []) {
        await supabaseAdmin
          .from('schools')
          .update({
            subscription_status: 'suspended',
            suspended_at: new Date(),
            suspension_reason: 'Automatic suspension due to expired subscription',
            updated_at: new Date()
          })
          .eq('id', school.id);

        results.suspensions_processed += 1;
      }

      // 4. Process automatic reactivations
      const { data: schoolsForReactivation, error: reactivateError } = await supabaseAdmin
        .from('schools')
        .select('id, name, auto_reactivate')
        .eq('subscription_status', 'suspended')
        .eq('auto_reactivate', true);

      if (reactivateError) throw reactivateError;

      for (const school of schoolsForReactivation || []) {
        // Check if all invoices are paid
        const { data: pendingInvoices, error: pendingError } = await supabaseAdmin
          .from('invoices')
          .select('id')
          .eq('school_id', school.id)
          .eq('status', 'pending');

        if (pendingError) throw pendingError;

        if (!pendingInvoices || pendingInvoices.length === 0) {
          await supabaseAdmin
            .from('schools')
            .update({
              subscription_status: 'active',
              suspended_at: null,
              suspension_reason: null,
              updated_at: new Date()
            })
            .eq('id', school.id);

          results.reactivations_processed += 1;
        }
      }

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          action: 'BILLING_AUTOMATION_RUN',
          entity_type: 'system',
          new_values: results
        });

      res.status(200).json({
        status: 'success',
        message: 'Billing automation completed',
        data: results
      });
    } catch (error) {
      console.error('Billing Automation Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to run billing automation',
        error: error.message
      });
    }
  }

  // Send renewal reminder
  async sendRenewalReminder(school) {
    try {
      const daysUntilRenewal = Math.ceil(
        (new Date(school.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24)
      );

      await supabaseAdmin
        .from('notifications')
        .insert({
          school_id: school.id,
          title: 'Subscription Renewal Reminder',
          message: `Your subscription will renew in ${daysUntilRenewal} days. Please ensure payment is made to avoid interruption.`,
          type: 'email',
          created_at: new Date()
        });

      // Also send SMS if configured
      return true;
    } catch (error) {
      console.error('Send Reminder Error:', error);
      return false;
    }
  }

  // Get billing summary for school
  async getBillingSummary(req, res) {
    try {
      const { schoolId } = req.params;

      // Get school info
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select('name, price_per_student, billing_frequency, subscription_status')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;

      // Get active students count
      const { count: studentCount, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (studentError) throw studentError;

      // Get invoice summary
      const { data: invoices, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .select('status, total_amount')
        .eq('school_id', schoolId);

      if (invoiceError) throw invoiceError;

      const summary = {
        total_students: studentCount || 0,
        price_per_student: school.price_per_student || 0,
        billing_frequency: school.billing_frequency || 'monthly',
        subscription_status: school.subscription_status || 'pending',
        estimated_monthly_bill: (studentCount || 0) * (school.price_per_student || 0),
        invoices: {
          total: invoices?.length || 0,
          paid: invoices?.filter(i => i.status === 'paid').length || 0,
          pending: invoices?.filter(i => i.status === 'pending').length || 0,
          overdue: invoices?.filter(i => i.status === 'overdue').length || 0,
          total_amount: invoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0,
          paid_amount: invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0) || 0,
          pending_amount: invoices?.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total_amount, 0) || 0
        }
      };

      res.status(200).json({
        status: 'success',
        data: summary
      });
    } catch (error) {
      console.error('Billing Summary Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch billing summary',
        error: error.message
      });
    }
  }
}

module.exports = new SubscriptionConfigController();