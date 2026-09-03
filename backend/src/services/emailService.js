const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.init();
  }

  init() {
    try {
      const host = process.env.SMTP_HOST;
      const port = parseInt(process.env.SMTP_PORT);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (host && user && pass) {
        this.transporter = nodemailer.createTransport({
          host: host,
          port: port || 587,
          secure: port === 465,
          auth: {
            user: user,
            pass: pass
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        this.isConfigured = true;
        console.log(' Email service configured successfully');
      } else {
        console.log(' Email service not configured. Add SMTP credentials to .env');
        this.isConfigured = false;
      }
    } catch (error) {
      console.error(' Email service initialization error:', error.message);
      this.isConfigured = false;
    }
  }

  // =============================================
  // SEND EMAIL
  // =============================================
  async sendEmail({ to, subject, html, text, attachments }) {
    try {
      if (!this.isConfigured) {
        console.log(` [DEV] Email to: ${to}, Subject: ${subject}`);
        console.log(` [DEV] Body: ${html || text}`);
        return { 
          success: true, 
          messageId: `dev-${Date.now()}`,
          devMode: true 
        };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html: html || text,
        text: text || html?.replace(/<[^>]*>/g, '') || '',
        attachments: attachments || []
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Update notification stats
      await this.updateNotificationStats('email', true);
      
      return { 
        success: true, 
        messageId: info.messageId,
        devMode: false
      };
    } catch (error) {
      console.error(' Email Error:', error);
      
      // Update notification stats (failed)
      await this.updateNotificationStats('email', false);
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // =============================================
  // SEND VERIFICATION EMAIL
  // =============================================
  async sendVerificationEmail(email, token, registrationId) {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}&id=${registrationId}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Kora School Management</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937;">Verify Your Email</h2>
          <p style="color: #4b5563;">Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px;">This link will expire in 24 hours.</p>
          <p style="color: #6b7280; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Kora School Management',
      html
    });
  }

  // =============================================
  // SEND PASSWORD RESET EMAIL
  // =============================================
  async sendPasswordResetCodeEmail(email, code) {
    const digits = Array.from(String(code || '000000'));
    const otpBlocks = digits.map((digit) => `
      <span style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:52px;border-radius:12px;border:1px solid #dbeafe;background:#ffffff;color:#111827;font-size:28px;font-weight:700;box-shadow:0 8px 20px rgba(79,70,229,0.08);margin:0 6px;">${digit}</span>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Kora School Management</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937;">Reset Your Password</h2>
          <p style="color: #4b5563;">Use the code below to continue with your password reset:</p>
          <div style="text-align: center; margin: 30px 0;">${otpBlocks}</div>
          <p style="color: #4b5563; text-align: center;">This code will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 12px; text-align: center;">If you didn’t request this, you can safely ignore this email.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Your Password Reset Code - Kora School Management',
      html
    });
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Kora School Management</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937;">Reset Your Password</h2>
          <p style="color: #4b5563;">Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px;">This link will expire in 1 hour.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Kora School Management',
      html
    });
  }

  // =============================================
  // SEND INVOICE EMAIL
  // =============================================
  async sendInvoiceEmail(school, invoice) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Kora School Management</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937;">Invoice Generated</h2>
          <p style="color: #4b5563;">Dear ${school.name},</p>
          <p style="color: #4b5563;">An invoice has been generated for your school.</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e5e7eb;">
            <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
            <p><strong>Amount:</strong> ₦${invoice.total_amount?.toLocaleString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${invoice.status}</p>
          </div>
          <p style="color: #4b5563;">Please login to your dashboard to view and pay the invoice.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL}/invoices/${invoice.id}" 
               style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Invoice
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: school.email,
      subject: `Invoice #${invoice.invoice_number} - ${school.name}`,
      html
    });
  }

  // =============================================
  // SEND APPROVAL EMAIL
  // =============================================
  async sendApprovalEmail(email, schoolName, password) {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #10B981; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Registration Approved!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937;">Congratulations!</h2>
          <p style="color: #4b5563;">Your school <strong>${schoolName}</strong> has been approved on Kora School Management System.</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e5e7eb;">
            <p><strong>Login Credentials:</strong></p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #f3f4f6; padding: 2px 8px; border-radius: 4px;">${password}</span></p>
            <p style="color: #ef4444; font-size: 12px;">Please change your password after first login.</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${loginUrl}" 
               style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login Now
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px;">You can now start setting up your school dashboard.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'School Registration Approved - Kora School Management',
      html
    });
  }

  // =============================================
  // UPDATE NOTIFICATION STATS
  // =============================================
  async updateNotificationStats(type, success) {
    try {
      const { supabaseAdmin } = require('../config/supabase');
      
      // Get current stats
      const { data: current, error: fetchError } = await supabaseAdmin
        .from('system_health_logs')
        .select('notification_stats')
        .order('logged_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Fetch stats error:', fetchError);
        return;
      }

      const currentStats = current?.notification_stats || { sent: 0, failed: 0 };
      const updatedStats = {
        sent: (currentStats.sent || 0) + (success ? 1 : 0),
        failed: (currentStats.failed || 0) + (success ? 0 : 1),
        last_sent: success ? new Date() : currentStats.last_sent,
        last_failed: !success ? new Date() : currentStats.last_failed
      };

      await supabaseAdmin
        .from('system_health_logs')
        .update({ notification_stats: updatedStats })
        .eq('logged_at', current?.logged_at || new Date());
    } catch (error) {
      console.error('Update stats error:', error);
    }
  }
}

module.exports = new EmailService();