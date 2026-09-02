const { supabaseAdmin } = require('../config/supabase');

class AccountantController {
  // =============================================
  // GET ACCOUNTANT DASHBOARD
  // =============================================
  getDashboard = async (req, res) => {
    try {
      const { schoolId } = req.params;

      // Get fee summary
      const { data: invoices } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('school_id', schoolId);

      const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];
      const pendingInvoices = invoices?.filter(i => i.status === 'pending') || [];
      const overdueInvoices = invoices?.filter(i => i.status === 'overdue') || [];

      const totalAmount = invoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0;
      const totalPaid = paidInvoices.reduce((sum, i) => sum + (i.paid_amount || i.total_amount), 0);
      const totalPending = pendingInvoices.reduce((sum, i) => sum + i.total_amount, 0);
      const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.total_amount, 0);

      // Get recent payments
      const { data: recentPayments } = await supabaseAdmin
        .from('invoices')
        .select(`
          *,
          students!student_id(first_name, last_name, admission_number)
        `)
        .eq('school_id', schoolId)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(10);

      // Get outstanding students
      const { data: outstandingStudents } = await supabaseAdmin
        .from('invoices')
        .select(`
          *,
          students!student_id(first_name, last_name, admission_number, classes!class_id(name))
        `)
        .eq('school_id', schoolId)
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(10);

      res.status(200).json({
        status: 'success',
        data: {
          summary: {
            total_invoices: invoices?.length || 0,
            paid_invoices: paidInvoices.length,
            pending_invoices: pendingInvoices.length,
            overdue_invoices: overdueInvoices.length,
            total_amount: totalAmount,
            total_paid: totalPaid,
            total_pending: totalPending,
            total_overdue: totalOverdue
          },
          recent_payments: recentPayments || [],
          outstanding_students: outstandingStudents || []
        }
      });
    } catch (error) {
      console.error('Accountant Dashboard Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get accountant dashboard',
        error: error.message
      });
    }
  };

  // =============================================
  // GET ALL INVOICES
  // =============================================
  getInvoices = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { status, search, limit = 50, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('invoices')
        .select(`
          *,
          students!student_id(
            first_name, last_name, admission_number,
            classes!class_id(id, name)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId);

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`invoice_number.ilike.%${search}%,students.first_name.ilike.%${search}%,students.last_name.ilike.%${search}%,students.admission_number.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: count || 0
        }
      });
    } catch (error) {
      console.error('Get Invoices Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get invoices',
        error: error.message
      });
    }
  };

  // =============================================
  // PROCESS PAYMENT
  // =============================================
  processPayment = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { invoiceId, paymentMethod, reference, amount } = req.body;

      // Get invoice
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .select(`
          *,
          students!student_id(first_name, last_name, admission_number),
          schools!school_id(name)
        `)
        .eq('id', invoiceId)
        .eq('school_id', schoolId)
        .single();

      if (invoiceError) throw invoiceError;

      if (invoice.status === 'paid') {
        return res.status(400).json({
          status: 'error',
          message: 'Invoice is already paid'
        });
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

      // Create payment record
      const { data: paymentRecord, error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          school_id: schoolId,
          invoice_id: invoiceId,
          student_id: invoice.student_id,
          amount: paidAmount,
          payment_method: paymentMethod,
          reference: reference || `PAY-${Date.now()}`,
          payment_date: new Date(),
          recorded_by: adminId,
          status: 'completed',
          created_at: new Date()
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'RECORD_PAYMENT',
          entity_type: 'invoice',
          entity_id: invoiceId,
          new_values: {
            amount: paidAmount,
            payment_method: paymentMethod,
            reference: reference
          }
        });

      res.status(200).json({
        status: 'success',
        message: 'Payment recorded successfully',
        data: {
          invoice: updatedInvoice,
          payment: paymentRecord
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
  };

  // =============================================
  // GET PAYMENT HISTORY
  // =============================================
  getPaymentHistory = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { search, limit = 50, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('payments')
        .select(`
          *,
          students!student_id(first_name, last_name, admission_number),
          invoices!invoice_id(invoice_number, total_amount)
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .order('payment_date', { ascending: false });

      if (search) {
        query = query.or(`reference.ilike.%${search}%,students.first_name.ilike.%${search}%,students.last_name.ilike.%${search}%,students.admission_number.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: count || 0
        }
      });
    } catch (error) {
      console.error('Get Payment History Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get payment history',
        error: error.message
      });
    }
  };

  // =============================================
  // GET OUTSTANDING FEES
  // =============================================
  getOutstandingFees = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { search, limit = 50, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('invoices')
        .select(`
          *,
          students!student_id(
            first_name, last_name, admission_number,
            classes!class_id(id, name),
            parents:student_parents(
              parents!parent_id(first_name, last_name, phone, email)
            )
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true });

      if (search) {
        query = query.or(`invoice_number.ilike.%${search}%,students.first_name.ilike.%${search}%,students.last_name.ilike.%${search}%,students.admission_number.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: count || 0
        }
      });
    } catch (error) {
      console.error('Get Outstanding Fees Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get outstanding fees',
        error: error.message
      });
    }
  };

  // =============================================
  // GET FINANCIAL REPORT
  // =============================================
  getFinancialReport = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { period = 'month' } = req.query;

      // Get all payments
      const { data: payments } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('school_id', schoolId)
        .eq('status', 'completed');

      // Get all invoices
      const { data: invoices } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('school_id', schoolId);

      // Calculate summary
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthlyPayments = payments?.filter(p => new Date(p.payment_date) >= startOfMonth) || [];
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalOutstanding = (invoices || [])
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, i) => sum + (i.total_amount - (i.paid_amount || 0)), 0);

      // Payment by method
      const paymentMethods = {};
      payments?.forEach(p => {
        const method = p.payment_method || 'unknown';
        if (!paymentMethods[method]) {
          paymentMethods[method] = { count: 0, amount: 0 };
        }
        paymentMethods[method].count++;
        paymentMethods[method].amount += p.amount;
      });

      res.status(200).json({
        status: 'success',
        data: {
          summary: {
            total_revenue: totalRevenue,
            monthly_revenue: monthlyRevenue,
            total_outstanding: totalOutstanding,
            total_payments: payments?.length || 0,
            monthly_payments: monthlyPayments.length
          },
          payment_methods: paymentMethods,
          recent_payments: payments?.slice(0, 10) || []
        }
      });
    } catch (error) {
      console.error('Get Financial Report Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get financial report',
        error: error.message
      });
    }
  };
}

module.exports = new AccountantController();