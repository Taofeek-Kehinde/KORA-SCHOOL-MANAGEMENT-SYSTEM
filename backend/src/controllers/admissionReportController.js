const { supabaseAdmin } = require('../config/supabase');

class AdmissionReportController {
  // =============================================
  // 1. GET ADMISSION REPORTS
  // =============================================
  getReports = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { reportType, dateFrom, dateTo } = req.query;

      let query = supabaseAdmin
        .from('admission_applications')
        .select('*')
        .eq('school_id', schoolId);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data: applications, error } = await query;
      if (error) throw error;

      const apps = applications || [];
      let report = {};

      // Overview report
      if (reportType === 'overview') {
        report = {
          total_applications: apps.length,
          approved: apps.filter(a => a.status === 'approved').length,
          rejected: apps.filter(a => a.status === 'rejected').length,
          pending: apps.filter(a => a.status === 'submitted' || a.status === 'under_review').length,
          enrolled: apps.filter(a => a.status === 'enrolled').length,
          waitlist: apps.filter(a => a.status === 'waitlist').length,
          awaiting_interview: apps.filter(a => a.status === 'awaiting_interview').length,
          awaiting_exam: apps.filter(a => a.status === 'awaiting_exam').length,
          conversion_rate: apps.length > 0 ? Math.round((apps.filter(a => a.status === 'enrolled').length / apps.length) * 100) : 0
        };
      }
      // Applications by Class
      else if (reportType === 'by_class') {
        const classCounts = {};
        apps.forEach(app => {
          const className = app.class_applying_for?.toString() || 'Unassigned';
          if (!classCounts[className]) classCounts[className] = 0;
          classCounts[className]++;
        });
        report = { by_class: classCounts };
      }
      // Applications by Gender
      else if (reportType === 'by_gender') {
        const genderCounts = { male: 0, female: 0, other: 0 };
        apps.forEach(app => {
          if (app.gender === 'male') genderCounts.male++;
          else if (app.gender === 'female') genderCounts.female++;
          else genderCounts.other++;
        });
        report = { by_gender: genderCounts };
      }
      // Applications by Location
      else if (reportType === 'by_location') {
        const stateCounts = {};
        apps.forEach(app => {
          const state = app.state_of_origin || 'Unknown';
          if (!stateCounts[state]) stateCounts[state] = 0;
          stateCounts[state]++;
        });
        report = { by_location: stateCounts };
      }
      // Revenue Report
      else if (reportType === 'revenue') {
        const totalRevenue = apps.reduce((sum, app) => sum + (app.acceptance_fee_amount || 0), 0);
        const paidRevenue = apps.filter(a => a.acceptance_fee_paid).reduce((sum, app) => sum + (app.acceptance_fee_amount || 0), 0);
        report = {
          total_revenue: totalRevenue,
          paid_revenue: paidRevenue,
          outstanding_revenue: totalRevenue - paidRevenue,
          fee_paid_count: apps.filter(a => a.acceptance_fee_paid).length,
          fee_pending_count: apps.filter(a => !a.acceptance_fee_paid && a.acceptance_fee_amount > 0).length
        };
      }
      // Default: return all applications
      else {
        report = {
          total_applications: apps.length,
          applications: apps
        };
      }

      res.status(200).json({ status: 'success', data: report });
    } catch (error) {
      console.error('Get Reports Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get reports', error: error.message });
    }
  };

  // =============================================
  // 2. GET CAPACITY QUOTAS STATUS
  // =============================================
  getCapacityStatus = async (req, res) => {
    try {
      const { schoolId } = req.params;

      // Get settings
      const { data: settings } = await supabaseAdmin
        .from('admission_settings')
        .select('capacity_quotas')
        .eq('school_id', schoolId)
        .single();

      const quotas = settings?.capacity_quotas || {};

      // Get enrolled count per class
      const { data: enrolled } = await supabaseAdmin
        .from('admission_applications')
        .select('class_applying_for')
        .eq('school_id', schoolId)
        .eq('status', 'enrolled');

      const enrolledCounts = {};
      (enrolled || []).forEach(app => {
        const classId = app.class_applying_for?.toString();
        if (classId) {
          if (!enrolledCounts[classId]) enrolledCounts[classId] = 0;
          enrolledCounts[classId]++;
        }
      });

      // Build capacity status
      const capacityStatus = {};
      Object.entries(quotas).forEach(([classId, max]) => {
        const current = enrolledCounts[classId] || 0;
        capacityStatus[classId] = {
          capacity: max,
          enrolled: current,
          remaining: Math.max(0, max - current),
          is_full: current >= max
        };
      });

      res.status(200).json({ status: 'success', data: capacityStatus });
    } catch (error) {
      console.error('Get Capacity Status Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get capacity status', error: error.message });
    }
  };

  // =============================================
  // 3. GET ADMISSION TRENDS (Monthly)
  // =============================================
  getAdmissionTrends = async (req, res) => {
    try {
      const { schoolId } = req.params;

      const { data: applications, error } = await supabaseAdmin
        .from('admission_applications')
        .select('created_at, status')
        .eq('school_id', schoolId);

      if (error) throw error;

      const monthlyData = {};
      (applications || []).forEach(app => {
        const date = new Date(app.created_at);
        const month = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, approved: 0, enrolled: 0 };
        }
        monthlyData[month].total++;
        if (app.status === 'approved') monthlyData[month].approved++;
        if (app.status === 'enrolled') monthlyData[month].enrolled++;
      });

      res.status(200).json({ status: 'success', data: monthlyData });
    } catch (error) {
      console.error('Get Admission Trends Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get admission trends', error: error.message });
    }
  };
}

module.exports = new AdmissionReportController();