const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');

class AccountantController {
  // =============================================
  // GET ALL ACCOUNTANTS
  // =============================================
  getAccountants = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { search, limit = 100, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('accountants')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
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
      console.error('Get Accountants Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch accountants',
        error: error.message
      });
    }
  };

  // =============================================
  // CREATE ACCOUNTANT
  // =============================================
  createAccountant = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { firstName, lastName, email, password, phone, position = 'Accountant', department = 'Finance' } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ status: 'error', message: 'Email, first name, last name, and password are required' });
      }

      const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', email).single();
      if (existingUser) return res.status(400).json({ status: 'error', message: 'User with this email already exists' });

      const { data: existingAccountant } = await supabaseAdmin.from('accountants').select('id').eq('email', email).single();
      if (existingAccountant) return res.status(400).json({ status: 'error', message: 'Accountant with this email already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email, password_hash: hashedPassword, full_name: `${firstName} ${lastName}`,
          phone: phone || '', role: 'accountant', school_id: schoolId,
          is_active: true, is_verified: true, created_by: adminId, created_at: new Date()
        })
        .select()
        .single();

      if (userError) throw userError;

      const { data: accountant, error: accountantError } = await supabaseAdmin
        .from('accountants')
        .insert({
          school_id: schoolId, user_id: user.id, first_name: firstName, last_name: lastName,
          email, phone: phone || '', position, department, is_active: true, created_by: adminId, created_at: new Date()
        })
        .select()
        .single();

      if (accountantError) throw accountantError;

      await supabaseAdmin.from('users').update({ accountant_id: accountant.id }).eq('id', user.id);

      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId, user_id: adminId, action: 'CREATE_ACCOUNTANT',
          entity_type: 'accountant', entity_id: accountant.id,
          new_values: { email, firstName, lastName, position }
        });

      res.status(201).json({ status: 'success', message: 'Accountant created successfully', data: { accountant, user, temp_password: password } });
    } catch (error) {
      console.error('Create Accountant Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create accountant', error: error.message });
    }
  };

  // =============================================
  // UPDATE ACCOUNTANT
  // =============================================
  updateAccountant = async (req, res) => {
    try {
      const { schoolId, accountantId } = req.params;
      const { adminId } = req.user;
      const { firstName, lastName, email, phone, position, department, isActive } = req.body;

      const { data: accountant, error: fetchError } = await supabaseAdmin
        .from('accountants').select('*').eq('id', accountantId).eq('school_id', schoolId).single();

      if (fetchError) throw fetchError;

      const updateData = {};
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (position !== undefined) updateData.position = position;
      if (department !== undefined) updateData.department = department;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data: updatedAccountant, error: updateError } = await supabaseAdmin
        .from('accountants').update(updateData).eq('id', accountantId).select().single();

      if (updateError) throw updateError;

      if (accountant.user_id) {
        const userUpdate = {};
        if (email) userUpdate.email = email;
        if (firstName || lastName) userUpdate.full_name = `${firstName || accountant.first_name} ${lastName || accountant.last_name}`;
        if (phone) userUpdate.phone = phone;
        userUpdate.updated_at = new Date();

        await supabaseAdmin.from('users').update(userUpdate).eq('id', accountant.user_id);
      }

      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId, user_id: adminId, action: 'UPDATE_ACCOUNTANT',
          entity_type: 'accountant', entity_id: accountantId, new_values: updateData
        });

      res.status(200).json({ status: 'success', message: 'Accountant updated successfully', data: updatedAccountant });
    } catch (error) {
      console.error('Update Accountant Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update accountant', error: error.message });
    }
  };

  // =============================================
  // DELETE ACCOUNTANT
  // =============================================
  deleteAccountant = async (req, res) => {
    try {
      const { schoolId, accountantId } = req.params;
      const { adminId } = req.user;

      const { data: accountant } = await supabaseAdmin
        .from('accountants').select('user_id').eq('id', accountantId).eq('school_id', schoolId).single();

      await supabaseAdmin.from('accountants').update({ is_active: false, updated_at: new Date() }).eq('id', accountantId).eq('school_id', schoolId);

      if (accountant?.user_id) {
        await supabaseAdmin.from('users').update({ is_active: false }).eq('id', accountant.user_id);
      }

      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId, user_id: adminId, action: 'DELETE_ACCOUNTANT',
          entity_type: 'accountant', entity_id: accountantId
        });

      res.status(200).json({ status: 'success', message: 'Accountant deleted successfully' });
    } catch (error) {
      console.error('Delete Accountant Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete accountant', error: error.message });
    }
  };

  // =============================================
  // GET ACCOUNTANT DASHBOARD
  // =============================================
  getDashboard = async (req, res) => {
    try {
      const { schoolId } = req.params;

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

      const { data: recentPayments } = await supabaseAdmin
        .from('invoices')
        .select(`*, students!student_id(first_name, last_name, admission_number)`)
        .eq('school_id', schoolId)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(10);

      const { data: outstandingStudents } = await supabaseAdmin
        .from('invoices')
        .select(`*, students!student_id(first_name, last_name, admission_number, classes!class_id(name))`)
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
      res.status(500).json({ status: 'error', message: 'Failed to get accountant dashboard', error: error.message });
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
        .select(`*, students!student_id(first_name, last_name, admission_number, classes!class_id(id, name))`, { count: 'exact' })
        .eq('school_id', schoolId);

      if (status) query = query.eq('status', status);

      if (search) query = query.or(`invoice_number.ilike.%${search}%,students.first_name.ilike.%${search}%,students.last_name.ilike.%${search}%,students.admission_number.ilike.%${search}%`);

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({ status: 'success', data: data || [], pagination: { limit: parseInt(limit), offset: parseInt(offset), total: count || 0 } });
    } catch (error) {
      console.error('Get Invoices Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get invoices', error: error.message });
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

      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .select(`*, students!student_id(first_name, last_name, admission_number), schools!school_id(name)`)
        .eq('id', invoiceId)
        .eq('school_id', schoolId)
        .single();

      if (invoiceError) throw invoiceError;

      if (invoice.status === 'paid') {
        return res.status(400).json({ status: 'error', message: 'Invoice is already paid' });
      }

      const paidAmount = amount || invoice.total_amount;
      const { data: updatedInvoice, error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({ status: 'paid', paid_amount: paidAmount, payment_method: paymentMethod, payment_reference: reference, paid_at: new Date(), updated_at: new Date() })
        .eq('id', invoiceId)
        .select()
        .single();

      if (updateError) throw updateError;

      const { data: paymentRecord, error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          school_id: schoolId, invoice_id: invoiceId, student_id: invoice.student_id,
          amount: paidAmount, payment_method: paymentMethod, reference: reference || `PAY-${Date.now()}`,
          payment_date: new Date(), recorded_by: adminId, status: 'completed', created_at: new Date()
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId, user_id: adminId, action: 'RECORD_PAYMENT',
          entity_type: 'invoice', entity_id: invoiceId,
          new_values: { amount: paidAmount, payment_method: paymentMethod, reference: reference }
        });

      res.status(200).json({ status: 'success', message: 'Payment recorded successfully', data: { invoice: updatedInvoice, payment: paymentRecord } });
    } catch (error) {
      console.error('Process Payment Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to process payment', error: error.message });
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
        .select(`*, students!student_id(first_name, last_name, admission_number), invoices!invoice_id(invoice_number, total_amount)`, { count: 'exact' })
        .eq('school_id', schoolId)
        .order('payment_date', { ascending: false });

      if (search) query = query.or(`reference.ilike.%${search}%,students.first_name.ilike.%${search}%,students.last_name.ilike.%${search}%,students.admission_number.ilike.%${search}%`);

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({ status: 'success', data: data || [], pagination: { limit: parseInt(limit), offset: parseInt(offset), total: count || 0 } });
    } catch (error) {
      console.error('Get Payment History Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get payment history', error: error.message });
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
        .select(`*, students!student_id(first_name, last_name, admission_number, classes!class_id(id, name), parents:student_parents(parents!parent_id(first_name, last_name, phone, email)))`, { count: 'exact' })
        .eq('school_id', schoolId)
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true });

      if (search) query = query.or(`invoice_number.ilike.%${search}%,students.first_name.ilike.%${search}%,students.last_name.ilike.%${search}%,students.admission_number.ilike.%${search}%`);

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({ status: 'success', data: data || [], pagination: { limit: parseInt(limit), offset: parseInt(offset), total: count || 0 } });
    } catch (error) {
      console.error('Get Outstanding Fees Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get outstanding fees', error: error.message });
    }
  };

  // =============================================
  // GET FINANCIAL REPORT
  // =============================================
  getFinancialReport = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { period = 'month' } = req.query;

      const { data: payments } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('school_id', schoolId)
        .eq('status', 'completed');

      const { data: invoices } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('school_id', schoolId);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthlyPayments = payments?.filter(p => new Date(p.payment_date) >= startOfMonth) || [];
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalOutstanding = (invoices || [])
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, i) => sum + (i.total_amount - (i.paid_amount || 0)), 0);

      const paymentMethods = {};
      payments?.forEach(p => {
        const method = p.payment_method || 'unknown';
        if (!paymentMethods[method]) paymentMethods[method] = { count: 0, amount: 0 };
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
      res.status(500).json({ status: 'error', message: 'Failed to get financial report', error: error.message });
    }
  };
}

module.exports = new AccountantController();