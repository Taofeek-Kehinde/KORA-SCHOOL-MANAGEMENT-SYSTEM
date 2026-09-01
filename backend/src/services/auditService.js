const { supabaseAdmin } = require('../config/supabase');

class AuditService {
  // =============================================
  // LOG ALL ACTIONS
  // =============================================
  async logAction(data) {
    try {
      const {
        schoolId,
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress,
        userAgent
      } = data;

      const logData = {
        school_id: schoolId || null,
        user_id: userId || null,
        action: action,
        entity_type: entityType,
        entity_id: entityId || null,
        old_values: oldValues || null,
        new_values: newValues || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        created_at: new Date()
      };

      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert(logData);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Audit Log Error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // SPECIFIC LOGGING METHODS
  // =============================================

  // 1. Log: Teacher edited result
  async logTeacherEditedResult(schoolId, userId, data, ipAddress, userAgent) {
    return this.logAction({
      schoolId,
      userId,
      action: 'TEACHER_EDITED_RESULT',
      entityType: 'grade',
      entityId: data.gradeId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      ipAddress,
      userAgent
    });
  }

  // 2. Log: Student deleted
  async logStudentDeleted(schoolId, userId, data, ipAddress, userAgent) {
    return this.logAction({
      schoolId,
      userId,
      action: 'STUDENT_DELETED',
      entityType: 'student',
      entityId: data.studentId,
      oldValues: data.studentData,
      newValues: { deleted: true, deleted_at: new Date() },
      ipAddress,
      userAgent
    });
  }

  // 3. Log: Payment approved
  async logPaymentApproved(schoolId, userId, data, ipAddress, userAgent) {
    return this.logAction({
      schoolId,
      userId,
      action: 'PAYMENT_APPROVED',
      entityType: 'payment',
      entityId: data.paymentId,
      oldValues: { status: 'pending' },
      newValues: { status: 'approved', approved_by: userId, approved_at: new Date() },
      ipAddress,
      userAgent
    });
  }

  // 4. Log: Attendance modified
  async logAttendanceModified(schoolId, userId, data, ipAddress, userAgent) {
    return this.logAction({
      schoolId,
      userId,
      action: 'ATTENDANCE_MODIFIED',
      entityType: 'attendance',
      entityId: data.attendanceId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      ipAddress,
      userAgent
    });
  }

  // 5. Log: Administrator changed settings
  async logAdminChangedSettings(schoolId, userId, data, ipAddress, userAgent) {
    return this.logAction({
      schoolId,
      userId,
      action: 'ADMIN_CHANGED_SETTINGS',
      entityType: 'settings',
      entityId: data.settingId || null,
      oldValues: data.oldValues,
      newValues: data.newValues,
      ipAddress,
      userAgent
    });
  }

  // 6. Log: Login failed
  async logLoginFailed(email, ipAddress, userAgent) {
    return this.logAction({
      schoolId: null,
      userId: null,
      action: 'LOGIN_FAILED',
      entityType: 'auth',
      entityId: null,
      oldValues: null,
      newValues: { email, failed_at: new Date() },
      ipAddress,
      userAgent
    });
  }

  // 7. Log: Password reset
  async logPasswordReset(schoolId, userId, data, ipAddress, userAgent) {
    return this.logAction({
      schoolId,
      userId,
      action: 'PASSWORD_RESET',
      entityType: 'user',
      entityId: data.userId,
      oldValues: { password_changed: true },
      newValues: { reset_at: new Date() },
      ipAddress,
      userAgent
    });
  }

  // =============================================
  // GET AUDIT LOGS WITH FILTERS
  // =============================================
  async getAuditLogs(filters = {}) {
    try {
      const {
        schoolId,
        userId,
        action,
        entityType,
        entityId,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      let query = supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          users:user_id(id, email, full_name, role),
          schools:school_id(id, name)
        `, { count: 'exact' });

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error, count } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: count
        }
      };
    } catch (error) {
      console.error('Get Audit Logs Error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // GET AUDIT STATISTICS
  // =============================================
  async getAuditStatistics(schoolId) {
    try {
      // Get total logs
      const { count: totalLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId);

      // Get logs by action
      const { data: actionData } = await supabaseAdmin
        .from('audit_logs')
        .select('action, count')
        .eq('school_id', schoolId)
        .groupBy('action');

      // Get logs by entity type
      const { data: entityData } = await supabaseAdmin
        .from('audit_logs')
        .select('entity_type, count')
        .eq('school_id', schoolId)
        .groupBy('entity_type');

      // Get logs by user
      const { data: userData } = await supabaseAdmin
        .from('audit_logs')
        .select('user_id, users(full_name, email), count')
        .eq('school_id', schoolId)
        .groupBy('user_id, users(full_name, email)')
        .limit(10);

      // Get last 24 hours
      const { count: last24Hours } = await supabaseAdmin
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000));

      return {
        success: true,
        data: {
          total_logs: totalLogs || 0,
          last_24_hours: last24Hours || 0,
          by_action: actionData || [],
          by_entity: entityData || [],
          top_users: userData || []
        }
      };
    } catch (error) {
      console.error('Get Audit Statistics Error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AuditService();