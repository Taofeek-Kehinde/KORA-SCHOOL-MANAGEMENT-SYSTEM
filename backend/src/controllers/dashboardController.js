const { supabaseAdmin } = require('../config/supabase');

class DashboardController {
  // =============================================
  // SCHOOL DASHBOARD - Each school gets its own portal
  // =============================================
  


     // =============================================
// GET SCHOOL DASHBOARD - FIXED (No joins)
// =============================================
async getSchoolDashboard(req, res) {
  try {
    const { schoolId } = req.params;
    const { user } = req;

    // Verify school access
    if (user.role !== 'super_admin' && user.schoolId !== schoolId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Get school information
   const { data: school, error: schoolError } = await supabaseAdmin
  .from('schools')
  .select('name, logo_url, motto, school_colours, subscription_status, academic_session, current_term')
  .eq('id', schoolId)
  .single();

if (schoolError) throw schoolError;

    // Get student statistics - SIMPLE COUNT (no join)
   const { count: totalStudents, error: studentError } = await supabaseAdmin
  .from('students')
  .select('id', { count: 'exact', head: true })
  .eq('school_id', schoolId)
  .eq('is_active', true);

if (studentError) throw studentError;

    // Get teacher statistics
    const { count: totalTeachers, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (teacherError) throw teacherError;

    // Get staff statistics
    const { count: totalStaff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (staffError) throw staffError;

    // Get parent statistics
    const { count: totalParents, error: parentError } = await supabaseAdmin
      .from('parents')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId);

    if (parentError) throw parentError;

    // Get class statistics
    const { count: totalClasses, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (classError) throw classError;

    // Get subject statistics
    const { count: totalSubjects, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId);

    if (subjectError) throw subjectError;

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const { count: todayPresent, error: todayError } = await supabaseAdmin
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('date', today)
      .eq('status', 'present');

    if (todayError) throw todayError;

    // Get pending invoices
    const { count: pendingInvoices, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'pending');

    if (invoiceError) throw invoiceError;

    // Get revenue summary
    const { data: revenueData, error: revenueError } = await supabaseAdmin
      .from('subscription_transactions')
      .select('amount, status, created_at')
      .eq('school_id', schoolId);

    if (revenueError) throw revenueError;

    const totalRevenue = revenueData
      ?.filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const monthlyRevenue = revenueData
      ?.filter(t => {
        const date = new Date(t.created_at);
        const now = new Date();
        return t.status === 'completed' && 
               date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    // Get class distribution - SIMPLE (no join)
    const { data: students, error: distError } = await supabaseAdmin
      .from('students')
      .select('class_id')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (distError) throw distError;

    const classDistributionData = {};
    students?.forEach(s => {
      const name = s.class_id || 'Unassigned';
      classDistributionData[name] = (classDistributionData[name] || 0) + 1;
    });

    // Get gender distribution
    const { data: genderData, error: genderError } = await supabaseAdmin
      .from('students')
      .select('gender')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (genderError) throw genderError;

    const genderDistribution = {
      male: genderData?.filter(s => s.gender === 'male').length || 0,
      female: genderData?.filter(s => s.gender === 'female').length || 0,
      other: genderData?.filter(s => s.gender === 'other').length || 0
    };

    // Get recent activities
    const { data: recentActivities, error: activityError } = await supabaseAdmin
      .from('audit_logs')
      .select(`
        id,
        action,
        entity_type,
        created_at,
        users!user_id(full_name, email)
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) throw activityError;

    res.status(200).json({
      status: 'success',
      data: {
        school: {
          id: school.id,
          name: school.name,
          logo_url: school.logo_url,
          motto: school.motto,
          colours: school.school_colours,
          subscription_status: school.subscription_status,
          academic_session: school.academic_session,
          current_term: school.current_term
        },
        stats: {
          total_students: totalStudents || 0,
          total_teachers: totalTeachers || 0,
          total_staff: totalStaff || 0,
          total_parents: totalParents || 0,
          total_classes: totalClasses || 0,
          total_subjects: totalSubjects || 0,
          today_attendance: todayPresent || 0,
          pending_invoices: pendingInvoices || 0,
          total_revenue: totalRevenue,
          monthly_revenue: monthlyRevenue
        },
        charts: {
          class_distribution: Object.entries(classDistributionData).map(([name, value]) => ({
            name: name === 'Unassigned' ? 'Unassigned' : `Class ${name}`,
            value
          })),
          gender_distribution: genderDistribution
        },
        recent_activities: recentActivities || []
      }
    });
  } catch (error) {
    console.error('School Dashboard Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
}     

  // =============================================
  // CONSOLIDATED REPORTS FOR MULTI-CAMPUS
  // =============================================
 // =============================================
// CONSOLIDATED REPORT - FIXED
// =============================================
async getConsolidatedReport(req, res) {
  try {
    const { schoolId } = req.params;
    const { period = 'current' } = req.query;
    const { user } = req;

    // Verify school access
    if (user.role !== 'super_admin' && user.schoolId !== schoolId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Get school info
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('name, logo_url, motto, school_colours')
      .eq('id', schoolId)
      .single();

    if (schoolError) throw schoolError;

    // Get all campuses
    const { data: campuses, error: campusError } = await supabaseAdmin
      .from('campuses')
      .select('id, name, address, principal_name, is_main_campus')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (campusError) throw campusError;

    const report = {
      school: {
        id: school.id,
        name: school.name,
        logo_url: school.logo_url,
        motto: school.motto,
        colours: school.school_colours
      },
      generated_at: new Date(),
      period: period,
      campuses: [],
      totals: {
        students: 0,
        teachers: 0,
        staff: 0,
        classes: 0,
        attendance: 0,
        revenue: 0,
        fees_collected: 0
      }
    };

    // Get data for each campus
    for (const campus of campuses || []) {
      // Get student count - SIMPLE QUERY
      const { count: students, error: sError } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('campus_id', campus.id)
        .eq('is_active', true);

      if (sError) {
        console.error('Student count error:', sError);
        // Continue with 0
      }

      // Get teacher count
      const { count: teachers, error: tError } = await supabaseAdmin
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('campus_id', campus.id)
        .eq('is_active', true);

      if (tError) {
        console.error('Teacher count error:', tError);
      }

      // Get staff count
      const { count: staff, error: stError } = await supabaseAdmin
        .from('staff')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('campus_id', campus.id)
        .eq('is_active', true);

      if (stError) {
        console.error('Staff count error:', stError);
      }

      // Get class count
      const { count: classes, error: cError } = await supabaseAdmin
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('campus_id', campus.id)
        .eq('is_active', true);

      if (cError) {
        console.error('Class count error:', cError);
      }

      // Get attendance (last 30 days)
      const { count: attendance, error: aError } = await supabaseAdmin
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('campus_id', campus.id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .eq('status', 'present');

      if (aError) {
        console.error('Attendance count error:', aError);
      }

      // Get revenue
      const { data: invoices, error: rError } = await supabaseAdmin
        .from('invoices')
        .select('total_amount')
        .eq('school_id', schoolId)
        .eq('campus_id', campus.id)
        .eq('status', 'paid');

      if (rError) {
        console.error('Revenue error:', rError);
      }

      const revenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Get fees collected
      const { data: fees, error: fError } = await supabaseAdmin
        .from('fees')
        .select('amount')
        .eq('school_id', schoolId)
        .eq('campus_id', campus.id);

      if (fError) {
        console.error('Fees error:', fError);
      }

      const feesCollected = fees?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;

      const campusData = {
        id: campus.id,
        name: campus.name,
        address: campus.address,
        principal_name: campus.principal_name,
        is_main_campus: campus.is_main_campus,
        stats: {
          students: students || 0,
          teachers: teachers || 0,
          staff: staff || 0,
          classes: classes || 0,
          attendance: attendance || 0,
          revenue: revenue,
          fees_collected: feesCollected
        }
      };

      report.campuses.push(campusData);
      
      // Add to totals
      report.totals.students += campusData.stats.students;
      report.totals.teachers += campusData.stats.teachers;
      report.totals.staff += campusData.stats.staff;
      report.totals.classes += campusData.stats.classes;
      report.totals.attendance += campusData.stats.attendance;
      report.totals.revenue += campusData.stats.revenue;
      report.totals.fees_collected += campusData.stats.fees_collected;
    }

    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    console.error('Consolidated Report Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate consolidated report',
      error: error.message
    });
  }
}

  // =============================================
  // GET SCHOOL STATS (Quick summary)
  // =============================================
  async getSchoolStats(req, res) {
    try {
      const { schoolId } = req.params;
      const { user } = req;

      if (user.role !== 'super_admin' && user.schoolId !== schoolId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      const [
        { count: students },
        { count: teachers },
        { count: staff },
        { count: parents },
        { count: classes },
        { count: subjects },
        { count: activeStudents }
      ] = await Promise.all([
        supabaseAdmin.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabaseAdmin.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
        supabaseAdmin.from('staff').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
        supabaseAdmin.from('parents').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabaseAdmin.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
        supabaseAdmin.from('subjects').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabaseAdmin.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true)
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          students: students || 0,
          teachers: teachers || 0,
          staff: staff || 0,
          parents: parents || 0,
          classes: classes || 0,
          subjects: subjects || 0,
          active_students: activeStudents || 0
        }
      });
    } catch (error) {
      console.error('Get School Stats Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch school statistics',
        error: error.message
      });
    }
  }

  // =============================================
  // SCHOOL ONLY MANAGING THEIR OWN DATA - RLS already handles this
  // This endpoint is for frontend to check permissions
  // =============================================
  async checkSchoolAccess(req, res) {
    try {
      const { schoolId } = req.params;
      const { user } = req;

      const hasAccess = user.role === 'super_admin' || user.schoolId === schoolId;

      res.status(200).json({
        status: 'success',
        data: {
          has_access: hasAccess,
          school_id: schoolId,
          user_school_id: user.schoolId,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Check School Access Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check access',
        error: error.message
      });
    }
  }
}

module.exports = new DashboardController();