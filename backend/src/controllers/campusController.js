const { supabaseAdmin } = require('../config/supabase');

class CampusController {
  // =============================================
  // GET ALL CAMPUSES FOR A SCHOOL
  // =============================================
  async getCampuses(req, res) {
    try {
      const { schoolId } = req.params;

      const { data: campuses, error } = await supabaseAdmin
        .from('campuses')
        .select(`
          *,
          students:students(count),
          teachers:teachers(count),
          staff:staff(count),
          classes:classes(count)
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('is_main_campus', { ascending: false });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: campuses || []
      });
    } catch (error) {
      console.error('Get Campuses Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch campuses',
        error: error.message
      });
    }
  }

  // =============================================
  // GET SINGLE CAMPUS
  // =============================================
  async getCampus(req, res) {
    try {
      const { schoolId, campusId } = req.params;

      const { data: campus, error } = await supabaseAdmin
        .from('campuses')
        .select(`
          *,
          students:students(*),
          teachers:teachers(*),
          staff:staff(*),
          classes:classes(*),
          timetables:timetables(*)
        `)
        .eq('id', campusId)
        .eq('school_id', schoolId)
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: campus
      });
    } catch (error) {
      console.error('Get Campus Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch campus',
        error: error.message
      });
    }
  }

  // =============================================
  // CREATE CAMPUS
  // =============================================
  async createCampus(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        name,
        address,
        phone,
        email,
        principalName,
        isMainCampus
      } = req.body;
      const { adminId } = req.user;

      if (!name) {
        return res.status(400).json({
          status: 'error',
          message: 'Campus name is required'
        });
      }

      // Check if campus name already exists for this school
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('campuses')
        .select('id')
        .eq('school_id', schoolId)
        .eq('name', name)
        .single();

      if (existing) {
        return res.status(400).json({
          status: 'error',
          message: 'Campus with this name already exists'
        });
      }

      // If this is the first campus or isMainCampus is true, set as main
      const { count, error: countError } = await supabaseAdmin
        .from('campuses')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId);

      if (countError) throw countError;

      const isMain = isMainCampus || count === 0;

      // If setting as main, unset other main campuses
      if (isMain) {
        await supabaseAdmin
          .from('campuses')
          .update({ is_main_campus: false })
          .eq('school_id', schoolId);
      }

      const { data: campus, error } = await supabaseAdmin
        .from('campuses')
        .insert({
          school_id: schoolId,
          name,
          address: address || '',
          phone: phone || '',
          email: email || '',
          principal_name: principalName || '',
          is_main_campus: isMain,
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'CREATE_CAMPUS',
          entity_type: 'campus',
          entity_id: campus.id,
          new_values: { name, is_main: isMain }
        });

      res.status(201).json({
        status: 'success',
        message: 'Campus created successfully',
        data: campus
      });
    } catch (error) {
      console.error('Create Campus Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create campus',
        error: error.message
      });
    }
  }

  // =============================================
  // UPDATE CAMPUS
  // =============================================
  async updateCampus(req, res) {
    try {
      const { schoolId, campusId } = req.params;
      const {
        name,
        address,
        phone,
        email,
        principalName,
        isMainCampus,
        isActive
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (principalName !== undefined) updateData.principal_name = principalName;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      // Handle main campus setting
      if (isMainCampus === true) {
        // Unset all other main campuses
        await supabaseAdmin
          .from('campuses')
          .update({ is_main_campus: false })
          .eq('school_id', schoolId)
          .neq('id', campusId);
        updateData.is_main_campus = true;
      } else if (isMainCampus === false) {
        updateData.is_main_campus = false;
      }

      const { data: campus, error } = await supabaseAdmin
        .from('campuses')
        .update(updateData)
        .eq('id', campusId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'UPDATE_CAMPUS',
          entity_type: 'campus',
          entity_id: campusId,
          new_values: updateData
        });

      res.status(200).json({
        status: 'success',
        message: 'Campus updated successfully',
        data: campus
      });
    } catch (error) {
      console.error('Update Campus Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update campus',
        error: error.message
      });
    }
  }

  // =============================================
  // DELETE CAMPUS
  // =============================================
  async deleteCampus(req, res) {
    try {
      const { schoolId, campusId } = req.params;
      const { adminId } = req.user;

      // Check if campus has students
      const { count: studentCount, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('campus_id', campusId)
        .eq('is_active', true);

      if (studentError) throw studentError;

      if (studentCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot delete campus. ${studentCount} students are assigned to this campus.`
        });
      }

      // Check if campus has teachers
      const { count: teacherCount, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('campus_id', campusId)
        .eq('is_active', true);

      if (teacherError) throw teacherError;

      if (teacherCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot delete campus. ${teacherCount} teachers are assigned to this campus.`
        });
      }

      // Check if campus is main
      const { data: campus, error: campusError } = await supabaseAdmin
        .from('campuses')
        .select('is_main_campus')
        .eq('id', campusId)
        .eq('school_id', schoolId)
        .single();

      if (campusError) throw campusError;

      if (campus.is_main_campus) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete the main campus. Please set another campus as main first.'
        });
      }

      // Soft delete - set inactive
      const { error } = await supabaseAdmin
        .from('campuses')
        .update({
          is_active: false,
          updated_at: new Date()
        })
        .eq('id', campusId)
        .eq('school_id', schoolId);

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'DELETE_CAMPUS',
          entity_type: 'campus',
          entity_id: campusId,
          new_values: { deleted: true }
        });

      res.status(200).json({
        status: 'success',
        message: 'Campus deleted successfully'
      });
    } catch (error) {
      console.error('Delete Campus Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete campus',
        error: error.message
      });
    }
  }

  // =============================================
  // CONSOLIDATED REPORTS ACROSS ALL CAMPUSES
  // =============================================
  async getConsolidatedReport(req, res) {
    try {
      const { schoolId } = req.params;
      const { period } = req.query;

      // Get all campuses for this school
      const { data: campuses, error: campusError } = await supabaseAdmin
        .from('campuses')
        .select('id, name')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (campusError) throw campusError;

      // Get consolidated data
      const report = {
        school_id: schoolId,
        generated_at: new Date(),
        period: period || 'current',
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

      for (const campus of campuses) {
        // Get student count
        const { count: students, error: sError } = await supabaseAdmin
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('campus_id', campus.id)
          .eq('is_active', true);

        if (sError) throw sError;

        // Get teacher count
        const { count: teachers, error: tError } = await supabaseAdmin
          .from('teachers')
          .select('id', { count: 'exact', head: true })
          .eq('campus_id', campus.id)
          .eq('is_active', true);

        if (tError) throw tError;

        // Get staff count
        const { count: staff, error: stError } = await supabaseAdmin
          .from('staff')
          .select('id', { count: 'exact', head: true })
          .eq('campus_id', campus.id)
          .eq('is_active', true);

        if (stError) throw stError;

        // Get class count
        const { count: classes, error: cError } = await supabaseAdmin
          .from('classes')
          .select('id', { count: 'exact', head: true })
          .eq('campus_id', campus.id)
          .eq('is_active', true);

        if (cError) throw cError;

        // Get attendance (last 30 days)
        const { count: attendance, error: aError } = await supabaseAdmin
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('campus_id', campus.id)
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .eq('status', 'present');

        if (aError) throw aError;

        // Get revenue from invoices
        const { data: invoices, error: rError } = await supabaseAdmin
          .from('invoices')
          .select('total_amount')
          .eq('campus_id', campus.id)
          .eq('status', 'paid');

        if (rError) throw rError;

        const revenue = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

        // Get fees collected
        const { data: fees, error: fError } = await supabaseAdmin
          .from('fees')
          .select('amount')
          .eq('campus_id', campus.id);

        if (fError) throw fError;

        const feesCollected = fees?.reduce((sum, fee) => sum + fee.amount, 0) || 0;

        const campusData = {
          id: campus.id,
          name: campus.name,
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
  // GET CAMPUS REPORT
  // =============================================
  async getCampusReport(req, res) {
    try {
      const { schoolId, campusId } = req.params;

      const { data: campus, error: campusError } = await supabaseAdmin
        .from('campuses')
        .select('*')
        .eq('id', campusId)
        .eq('school_id', schoolId)
        .single();

      if (campusError) throw campusError;

      // Get all data for this campus
      const [
        students,
        teachers,
        staff,
        classes,
        attendance,
        invoices,
        fees,
        timetables
      ] = await Promise.all([
        supabaseAdmin.from('students').select('*').eq('campus_id', campusId).eq('is_active', true),
        supabaseAdmin.from('teachers').select('*').eq('campus_id', campusId).eq('is_active', true),
        supabaseAdmin.from('staff').select('*').eq('campus_id', campusId).eq('is_active', true),
        supabaseAdmin.from('classes').select('*').eq('campus_id', campusId).eq('is_active', true),
        supabaseAdmin.from('attendance').select('*').eq('campus_id', campusId).gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        supabaseAdmin.from('invoices').select('*').eq('campus_id', campusId),
        supabaseAdmin.from('fees').select('*').eq('campus_id', campusId),
        supabaseAdmin.from('timetables').select('*').eq('campus_id', campusId)
      ]);

      const report = {
        campus,
        students: students.data || [],
        teachers: teachers.data || [],
        staff: staff.data || [],
        classes: classes.data || [],
        attendance: attendance.data || [],
        invoices: invoices.data || [],
        fees: fees.data || [],
        timetables: timetables.data || [],
        stats: {
          total_students: students.data?.length || 0,
          total_teachers: teachers.data?.length || 0,
          total_staff: staff.data?.length || 0,
          total_classes: classes.data?.length || 0,
          total_attendance: attendance.data?.length || 0,
          total_invoices: invoices.data?.length || 0,
          total_fees: fees.data?.length || 0,
          total_timetables: timetables.data?.length || 0
        }
      };

      res.status(200).json({
        status: 'success',
        data: report
      });
    } catch (error) {
      console.error('Get Campus Report Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch campus report',
        error: error.message
      });
    }
  }
}

module.exports = new CampusController();