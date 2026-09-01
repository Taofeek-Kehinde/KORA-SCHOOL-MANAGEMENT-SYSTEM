class SMSService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.provider = process.env.SMS_PROVIDER || 'twilio';
    this.init();
  }

  init() {
    try {
      if (this.provider === 'twilio') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

        if (accountSid && authToken && phoneNumber) {
          const twilio = require('twilio');
          this.client = twilio(accountSid, authToken);
          this.fromNumber = phoneNumber;
          this.isConfigured = true;
          console.log(' SMS service configured (Twilio)');
        } else {
          console.log(' SMS service not configured. Add Twilio credentials to .env');
          this.isConfigured = false;
        }
      } else {
        console.log(` SMS provider "${this.provider}" not supported. Using development mode.`);
        this.isConfigured = false;
      }
    } catch (error) {
      console.error(' SMS service initialization error:', error.message);
      this.isConfigured = false;
    }
  }

  // =============================================
  // SEND SMS
  // =============================================
  async sendSMS({ to, message }) {
    try {
      if (!this.isConfigured) {
        console.log(` [DEV] SMS to: ${to}, Message: ${message}`);
        
        // Update notification stats
        await this.updateNotificationStats('sms', true);
        
        return { 
          success: true, 
          sid: `dev-${Date.now()}`,
          devMode: true 
        };
      }

      const result = await this.client.messages.create({
        body: message,
        to: to,
        from: this.fromNumber
      });

      // Update notification stats
      await this.updateNotificationStats('sms', true);

      return { 
        success: true, 
        sid: result.sid,
        devMode: false
      };
    } catch (error) {
      console.error(' SMS Error:', error);
      
      // Update notification stats (failed)
      await this.updateNotificationStats('sms', false);
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // =============================================
  // SEND VERIFICATION SMS
  // =============================================
  async sendVerificationSMS(phoneNumber, code) {
    const message = `Kora School: Your verification code is ${code}. Please enter this code to verify your phone number. This code expires in 10 minutes.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  // =============================================
  // SEND INVOICE SMS REMINDER
  // =============================================
  async sendInvoiceSMS(school, invoice) {
    const message = `Kora School: Invoice ${invoice.invoice_number} generated. Amount: ₦${invoice.total_amount?.toLocaleString()}. Due: ${new Date(invoice.due_date).toLocaleDateString()}. Login to pay.`;
    
    return this.sendSMS({
      to: school.phone,
      message
    });
  }

  // =============================================
  // SEND RENEWAL REMINDER SMS
  // =============================================
  async sendRenewalReminderSMS(school, daysUntilRenewal) {
    const message = `Kora School: Your subscription will renew in ${daysUntilRenewal} days. Please ensure payment is made to avoid interruption.`;
    
    return this.sendSMS({
      to: school.phone,
      message
    });
  }

  // =============================================
  // UPDATE NOTIFICATION STATS
  // =============================================
  async updateNotificationStats(type, success) {
    try {
      const { supabaseAdmin } = require('../config/supabase');
      
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

module.exports = new SMSService();