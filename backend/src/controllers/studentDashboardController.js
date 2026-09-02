const { supabaseAdmin } = require('../config/supabase');

class StudentDashboardController {
  // =============================================
  // GET COMPLETE STUDENT DASHBOARD
  // =============================================
  async getStudentDashboard(req, res) {
    try {
      const { studentId } = req.params;
      const { user } = req;

      // Verify access
      if (!studentId) {
  return res.status(400).json({ status: 'error', message: 'Student ID is required' });
}
      // Get student basic info
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name)
        `)
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // =============================================
      // 1. PERSONAL INFORMATION
      // =============================================
      const personalInfo = {
        firstName: student.first_name,
        lastName: student.last_name,
        middleName: student.middle_name || '',
        gender: student.gender,
        dateOfBirth: student.date_of_birth,
        age: student.age,
        admissionNumber: student.admission_number,
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        nationality: student.nationality || '',
        stateOfOrigin: student.state_of_origin || '',
        localGovernment: student.local_government || '',
        religion: student.religion || '',
        bloodGroup: student.blood_group || '',
        genotype: student.genotype || '',
        passportUrl: student.passport_url,
        class: student.classes || {},
        campus: student.campuses || {},
        boardingStatus: student.boarding_status,
        // house: student.houses || {},
        studentStatus: student.student_status || 'active'
      };

      // =============================================
      // 2. ATTENDANCE SUMMARY
      // =============================================
      const today = new Date();
      const startOfTerm = new Date(today);
      startOfTerm.setMonth(startOfTerm.getMonth() - 3);

      const { data: attendanceData, error: attendanceError } = await supabaseAdmin
        .from('attendance')
        .select('date, status')
        .eq('student_id', studentId)
        .gte('date', startOfTerm.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0]);

      if (attendanceError) throw attendanceError;

      const attendanceSummary = {
        totalDays: attendanceData?.length || 0,
        present: attendanceData?.filter(a => a.status === 'present').length || 0,
        absent: attendanceData?.filter(a => a.status === 'absent').length || 0,
        late: attendanceData?.filter(a => a.status === 'late').length || 0,
        excused: attendanceData?.filter(a => a.status === 'excused').length || 0,
        attendanceRate: attendanceData?.length > 0 
          ? Math.round((attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100) 
          : 0,
        recentAttendance: attendanceData?.slice(0, 10) || []
      };

// 3. ACADEMIC PERFORMANCE
const { data: gradesData, error: gradesError } = await supabaseAdmin
  .from('grades')
  .select(`
    id,
    ca1, ca2, ca3, exam, total, grade, remark,
    subject_id,
    subjects!subject_id(id, name, code)
  `)
  .eq('student_id', studentId)
  .order('created_at', { ascending: false })
  .limit(30);

if (gradesError) throw gradesError;

const academicPerformance = {
  currentTerm: [],
  averageScore: 0,
  totalSubjects: (gradesData || []).length,
  subjects: (gradesData || []).map(g => ({
    subject: g.subjects?.name || 'Unknown',
    code: g.subjects?.code || '',
    ca1: g.ca1,
    ca2: g.ca2,
    ca3: g.ca3,
    exam: g.exam,
    total: g.total,
    grade: g.grade,
    remark: g.remark
  })),
  byTerm: {}
};

// Calculate average from ALL grades
const allTotals = academicPerformance.subjects
  .filter(s => s.total)
  .map(s => s.total);

if (allTotals.length > 0) {
  academicPerformance.averageScore = Math.round(
    allTotals.reduce((sum, t) => sum + t, 0) / allTotals.length
  );
}

      // =============================================
      // 4. OUTSTANDING FEES
      // =============================================
      const { data: invoicesData, error: invoicesError } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('student_id', studentId)
        .order('due_date', { ascending: true });

      if (invoicesError) throw invoicesError;

      const outstandingInvoices = invoicesData?.filter(i => i.status === 'pending' || i.status === 'overdue') || [];
      const paidInvoices = invoicesData?.filter(i => i.status === 'paid') || [];

      const outstandingFees = {
        totalOutstanding: outstandingInvoices.reduce((sum, inv) => sum + (inv.total_amount - (inv.paid_amount || 0)), 0),
        totalInvoices: invoicesData?.length || 0,
        totalPaid: paidInvoices.reduce((sum, inv) => sum + (inv.paid_amount || inv.total_amount), 0),
        invoices: outstandingInvoices.map(i => ({
          id: i.id,
          invoiceNumber: i.invoice_number,
          amount: i.total_amount,
          paidAmount: i.paid_amount || 0,
          balance: i.total_amount - (i.paid_amount || 0),
          dueDate: i.due_date,
          status: i.status,
          items: i.items || []
        }))
      };

      // =============================================
      // 5. PAYMENT HISTORY
      // =============================================
      const paymentHistory = {
        totalPaid: paidInvoices.reduce((sum, inv) => sum + (inv.paid_amount || inv.total_amount), 0),
        totalPayments: paidInvoices.length,
        payments: paidInvoices.map(i => ({
          id: i.id,
          invoiceNumber: i.invoice_number,
          amount: i.paid_amount || i.total_amount,
          paidAt: i.paid_at,
          paymentMethod: i.payment_method,
          reference: i.payment_reference
        }))
      };

      // =============================================
      // 6. MEDICAL ALERTS
      // =============================================
      const medicalAlerts = {
        conditions: student.medical_conditions || 'None',
        allergies: student.allergies || 'None',
        disabilities: student.disabilities || 'None',
        medications: student.medications || 'None',
        doctorName: student.doctor_name || '',
        hospital: student.hospital || '',
        emergencyInstructions: student.emergency_instructions || '',
        bloodGroup: student.blood_group || '',
        genotype: student.genotype || '',
        hasAlerts: !!(student.medical_conditions || student.allergies || student.disabilities || student.medications)
      };

      // =============================================
      // 7. BEHAVIOUR/DISCIPLINE RECORDS
      // =============================================
      const { data: behaviourData, error: behaviourError } = await supabaseAdmin
        .from('behaviour_records')
        .select(`
          id,
          behaviour_type,
          behaviour,
          action_taken,
          date,
          staff_id,
          staff!staff_id(first_name, last_name)
        `)
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(10);

      if (behaviourError) throw behaviourError;

      const behaviourRecords = {
        totalRecords: behaviourData?.length || 0,
        positive: behaviourData?.filter(b => b.behaviour_type === 'positive').length || 0,
        negative: behaviourData?.filter(b => b.behaviour_type === 'negative').length || 0,
        records: behaviourData?.map(b => ({
          id: b.id,
          type: b.behaviour_type,
          behaviour: b.behaviour,
          actionTaken: b.action_taken,
          date: b.date,
          staffName: b.staff ? `${b.staff.first_name} ${b.staff.last_name}` : ''
        })) || []
      };

      // =============================================
      // 8. HOMEWORK STATUS
      // =============================================
      const { data: homeworkData, error: homeworkError } = await supabaseAdmin
        .from('homework_assignments')
        .select(`
          id,
          title,
          description,
          subject_id,
          subjects!subject_id(name, code),
          assigned_date,
          due_date,
          status,
          submission_date,
          teacher_id,
          teachers!teacher_id(first_name, last_name)
        `)
        .eq('student_id', studentId)
        .order('due_date', { ascending: true });

      if (homeworkError) throw homeworkError;

      const homeworkStatus = {
        total: homeworkData?.length || 0,
        completed: homeworkData?.filter(h => h.status === 'submitted').length || 0,
        pending: homeworkData?.filter(h => h.status === 'pending').length || 0,
        overdue: homeworkData?.filter(h => h.status === 'overdue').length || 0,
        assignments: homeworkData?.map(h => ({
          id: h.id,
          title: h.title,
          description: h.description,
          subject: h.subjects?.name || 'Unknown',
          assignedDate: h.assigned_date,
          dueDate: h.due_date,
          status: h.status,
          submissionDate: h.submission_date,
          teacher: h.teachers ? `${h.teachers.first_name} ${h.teachers.last_name}` : ''
        })) || []
      };

      // =============================================
      // 9. CBT RESULTS
      // =============================================
      const { data: cbtData, error: cbtError } = await supabaseAdmin
        .from('cbt_results')
        .select(`
          id,
          score,
          total_questions,
          percentage,
          subject_id,
          subjects!subject_id(name, code),
          completed_at,
          time_taken
        `)
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (cbtError) throw cbtError;

      const cbtResults = {
        totalTests: cbtData?.length || 0,
        averageScore: cbtData?.length > 0 
          ? Math.round(cbtData.reduce((sum, c) => sum + (c.percentage || 0), 0) / cbtData.length) 
          : 0,
        tests: cbtData?.map(c => ({
          id: c.id,
          subject: c.subjects?.name || 'Unknown',
          score: c.score,
          totalQuestions: c.total_questions,
          percentage: c.percentage,
          completedAt: c.completed_at,
          timeTaken: c.time_taken
        })) || []
      };

      // =============================================
      // 10. CURRENT TIMETABLE
      // =============================================
      const { data: timetableData, error: timetableError } = await supabaseAdmin
        .from('timetable_entries')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          subject_id,
          subjects!subject_id(name, code),
          teacher_id,
          teachers!teacher_id(first_name, last_name)
        `)
        .eq('class_id', student.class_id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (timetableError) throw timetableError;

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timetable = daysOfWeek.map(day => ({
        day,
        periods: timetableData?.filter(t => t.day_of_week === day).map(t => ({
          id: t.id,
          startTime: t.start_time,
          endTime: t.end_time,
          subject: t.subjects?.name || 'Unknown',
          subjectCode: t.subjects?.code || '',
          teacher: t.teachers ? `${t.teachers.first_name} ${t.teachers.last_name}` : ''
        })) || []
      }));

      // =============================================
      // 11. PARENT DETAILS
      // =============================================
      const { data: parentData, error: parentError } = await supabaseAdmin
        .from('student_parents')
        .select(`
          is_primary_contact,
          parents!parent_id(
            id,
            first_name,
            last_name,
            email,
            phone,
            occupation,
            employer,
            address,
            relationship
          )
        `)
        .eq('student_id', studentId);

      if (parentError) throw parentError;

      const parentDetails = {
        parents: (parentData || []).map(p => ({
          id: p.parents?.id,
          firstName: p.parents?.first_name,
          lastName: p.parents?.last_name,
          email: p.parents?.email,
          phone: p.parents?.phone,
          occupation: p.parents?.occupation,
          employer: p.parents?.employer,
          address: p.parents?.address,
          relationship: p.parents?.relationship,
          isPrimaryContact: p.is_primary_contact
        }))
      };
      // =============================================
      // 12. HOSTEL INFORMATION
      // =============================================
      const { data: hostelData, error: hostelError } = await supabaseAdmin
        .from('hostel_assignments')
        .select(`
          id,
          room_number,
          bed_number,
          hostels!hostel_id(
            id,
            name,
            warden_name,
            warden_phone,
            capacity,
            address
          )
        `)
        .eq('student_id', studentId)
        .single();

      if (hostelError && hostelError.code !== 'PGRST116') throw hostelError;

      const hostelInfo = hostelData ? {
        hostelName: hostelData.hostels?.name || '',
        roomNumber: hostelData.room_number || '',
        bedNumber: hostelData.bed_number || '',
        wardenName: hostelData.hostels?.warden_name || '',
        wardenPhone: hostelData.hostels?.warden_phone || '',
        capacity: hostelData.hostels?.capacity,
        address: hostelData.hostels?.address
      } : null;

      // =============================================
      // 13. TRANSPORT ASSIGNMENT
      // =============================================
      const { data: transportData, error: transportError } = await supabaseAdmin
        .from('transport_assignments')
        .select(`
          id,
          pickup_point,
          dropoff_point,
          routes!route_id(
            id,
            name,
            driver_name,
            driver_phone,
            vehicle_number,
            capacity
          )
        `)
        .eq('student_id', studentId)
        .single();

      if (transportError && transportError.code !== 'PGRST116') throw transportError;

      const transportInfo = transportData ? {
        routeName: transportData.routes?.name || '',
        pickupPoint: transportData.pickup_point,
        dropoffPoint: transportData.dropoff_point,
        driverName: transportData.routes?.driver_name || '',
        driverPhone: transportData.routes?.driver_phone || '',
        vehicleNumber: transportData.routes?.vehicle_number || ''
      } : null;

      // =============================================
      // 14. LIBRARY LOANS
      // =============================================
      const { data: libraryData, error: libraryError } = await supabaseAdmin
        .from('library_loans')
        .select(`
          id,
          book_title,
          author,
          isbn,
          issue_date,
          due_date,
          return_date,
          status,
          fine_amount
        `)
        .eq('student_id', studentId)
        .order('issue_date', { ascending: false })
        .limit(10);

      if (libraryError) throw libraryError;

      const libraryLoans = {
        totalLoans: libraryData?.length || 0,
        activeLoans: libraryData?.filter(l => l.status === 'issued').length || 0,
        overdueLoans: libraryData?.filter(l => l.status === 'overdue').length || 0,
        totalFines: libraryData?.reduce((sum, l) => sum + (l.fine_amount || 0), 0) || 0,
        loans: libraryData?.map(l => ({
          id: l.id,
          bookTitle: l.book_title,
          author: l.author,
          isbn: l.isbn,
          issueDate: l.issue_date,
          dueDate: l.due_date,
          returnDate: l.return_date,
          status: l.status,
          fineAmount: l.fine_amount
        })) || []
      };

      // =============================================
      // 15. NOTIFICATIONS
      // =============================================
     // 15. NOTIFICATIONS
const { data: notificationsData, error: notifError } = await supabaseAdmin
  .from('notifications')
  .select('*')
  .or(`student_id.eq.${studentId},user_id.eq.${user?.id || 'none'}`)
  .order('created_at', { ascending: false })
  .limit(10);

if (notifError) throw notifError;

const notifications = (notificationsData || []).map(n => ({
  id: n.id,
  title: n.title,
  message: n.message,
  type: n.type,
  isRead: n.is_read,
  createdAt: n.created_at
}));
      // =============================================
      // RESPONSE
      // =============================================
      res.status(200).json({
        status: 'success',
        data: {
          student: {
            id: student.id,
            firstName: student.first_name,
            lastName: student.last_name,
            admissionNumber: student.admission_number,
            passportUrl: student.passport_url
          },
          personalInfo,
          attendanceSummary,
          academicPerformance,
          outstandingFees,
          paymentHistory,
          medicalAlerts,
          behaviourRecords,
          homeworkStatus,
          cbtResults,
          timetable,
          parentDetails,
          hostelInfo,
          transportInfo,
          libraryLoans,
          notifications
        }
      });
    } catch (error) {
      console.error('Student Dashboard Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch student dashboard',
        error: error.message
      });
    }
  }
}

module.exports = new StudentDashboardController();