const { supabaseAdmin } = require('../config/supabase');
const { OpenAI } = require('openai');

class AIController {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // =============================================
  // AI ASSISTANT - MAIN QUERY HANDLER
  // =============================================
  async processQuery(req, res) {
    try {
      const { schoolId } = req.params;
      const { query } = req.body;
      const { user } = req;

      if (!query) {
        return res.status(400).json({
          status: 'error',
          message: 'Query is required'
        });
      }

      // Get school context with real data
      const schoolContext = await this.getSchoolContext(schoolId, user);

      // Determine query type
      const queryType = this.determineQueryType(query);

      // Process based on role and query type with real data
      let response;
      switch (user.role) {
        case 'school_admin':
          response = await this.processAdminQuery(query, schoolContext, queryType, schoolId);
          break;
        case 'teacher':
          response = await this.processTeacherQuery(query, schoolContext, queryType, schoolId);
          break;
        case 'parent':
          response = await this.processParentQuery(query, schoolContext, user, queryType, schoolId);
          break;
        default:
          response = await this.processGeneralQuery(query, schoolContext);
      }

      // Save query to database
      await supabaseAdmin
        .from('ai_queries')
        .insert({
          school_id: schoolId,
          user_id: user.id,
          query: query,
          response: response,
          context: { role: user.role, queryType },
          is_successful: true,
          created_at: new Date()
        });

      res.status(200).json({
        status: 'success',
        data: {
          query,
          response,
          query_type: queryType,
          role: user.role
        }
      });
    } catch (error) {
      console.error('AI Query Error:', error);
      
      await supabaseAdmin
        .from('ai_queries')
        .insert({
          school_id: req.params.schoolId,
          user_id: req.user.id,
          query: req.body.query,
          response: 'Error processing query',
          context: { error: error.message },
          is_successful: false,
          created_at: new Date()
        });

      res.status(500).json({
        status: 'error',
        message: 'Failed to process AI query',
        error: error.message
      });
    }
  }

  // =============================================
  // SCHOOL ADMIN QUERIES
  // =============================================
  async processAdminQuery(query, context, queryType, schoolId) {
    // Get real data based on query type
    let data = {};
    
    if (queryType === 'unpaid_fees') {
      data = await this.getUnpaidFeesData(schoolId);
    } else if (queryType === 'attendance_report') {
      data = await this.getAttendanceReportData(schoolId);
    } else if (queryType === 'at_risk_students') {
      data = await this.getAtRiskStudentsData(schoolId);
    }

    const systemPrompt = `
      You are Kora AI Assistant for school administrators.
      School: ${context.school}
      Academic Session: ${context.academic_session}
      Current Term: ${context.current_term}
      
      Real Data:
      ${JSON.stringify(data, null, 2)}
      
      Provide helpful, concise, and actionable responses using the real data provided.
      Format your response with clear sections, bullet points, and actionable insights.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Error:', error);
      return this.getFallbackResponse(query, queryType, 'admin', data);
    }
  }

  // =============================================
  // TEACHER QUERIES
  // =============================================
  async processTeacherQuery(query, context, queryType, schoolId) {
    let data = {};
    
    if (queryType === 'generate_cbt') {
      data = await this.getCBTData(schoolId);
    } else if (queryType === 'report_card_comments') {
      data = await this.getReportCardData(schoolId);
    }

    const systemPrompt = `
      You are Kora AI Assistant for teachers.
      School: ${context.school}
      Current Term: ${context.current_term}
      
      ${queryType === 'generate_cbt' ? `
        Generate CBT (Computer Based Test) questions based on the subject and class.
        Create questions with 4 options (A, B, C, D) and indicate the correct answer.
        Format each question as:
        Q1: [Question]
        A) [Option A]
        B) [Option B]
        C) [Option C]
        D) [Option D]
        Answer: [Correct Option]
      ` : `
        Draft report card comments based on student performance data.
        Provide personalized comments for each student.
        Include strengths, areas for improvement, and recommendations.
      `}
      
      Real Data:
      ${JSON.stringify(data, null, 2)}
      
      Provide helpful, practical responses using the real data.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Error:', error);
      return this.getFallbackResponse(query, queryType, 'teacher', data);
    }
  }

  // =============================================
  // PARENT QUERIES
  // =============================================
  async processParentQuery(query, context, user, queryType, schoolId) {
    let data = {};
    
    if (queryType === 'child_attendance') {
      data = await this.getChildAttendanceData(schoolId, user.id);
    } else if (queryType === 'payment_history') {
      data = await this.getPaymentHistoryData(schoolId, user.id);
    }

    const systemPrompt = `
      You are Kora AI Assistant for parents.
      School: ${context.school}
      
      Real Data about your child(ren):
      ${JSON.stringify(data, null, 2)}
      
      ${queryType === 'child_attendance' ? `
        Provide a summary of the child's attendance.
        Include:
        - Total days present
        - Total days absent
        - Attendance rate
        - Any patterns or concerns
        - Suggestions for improvement
      ` : `
        Provide a summary of payment history.
        Include:
        - Total paid
        - Any outstanding balances
        - Payment dates
        - Next payment due date
      `}
      
      Be supportive, family-friendly, and easy to understand.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 600,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Error:', error);
      return this.getFallbackResponse(query, queryType, 'parent', data);
    }
  }

  // =============================================
  // GENERAL QUERY
  // =============================================
  async processGeneralQuery(query, context) {
    const systemPrompt = `
      You are Kora AI Assistant.
      School: ${context.school}
      
      Provide helpful information about the school management system.
      You can help with:
      - Student information
      - Attendance tracking
      - Fee management
      - Reports and analytics
      - Teacher and staff management
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Error:', error);
      return 'I am here to help you with school management tasks. Please ask me a question about students, attendance, fees, or reports.';
    }
  }

  // =============================================
  // DATA FETCHING METHODS - REAL DATA
  // =============================================

  // 1. Get Unpaid Fees Data
  async getUnpaidFeesData(schoolId) {
    try {
      // Get students with unpaid fees
      const { data: students, error } = await supabaseAdmin
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          admission_number,
          class_id,
          classes!class_id(name),
          invoices!invoices_student_id_fkey(
            id,
            total_amount,
            status,
            due_date
          )
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (error) throw error;

      // Filter students with unpaid invoices
      const unpaidStudents = students.filter(s => 
        s.invoices && s.invoices.some(i => i.status === 'pending')
      );

      return {
        total_students: students.length,
        unpaid_students: unpaidStudents.length,
        unpaid_list: unpaidStudents.map(s => ({
          name: `${s.first_name} ${s.last_name}`,
          admission: s.admission_number,
          class: s.classes?.name || 'N/A',
          outstanding: s.invoices
            .filter(i => i.status === 'pending')
            .reduce((sum, i) => sum + i.total_amount, 0)
        })),
        total_outstanding: unpaidStudents.reduce((sum, s) => 
          sum + s.invoices
            .filter(i => i.status === 'pending')
            .reduce((acc, i) => acc + i.total_amount, 0), 0
        )
      };
    } catch (error) {
      console.error('Get Unpaid Fees Error:', error);
      return { error: error.message };
    }
  }

  // 2. Get Attendance Report Data
  async getAttendanceReportData(schoolId) {
    try {
      const currentDate = new Date();
      const startOfTerm = new Date(currentDate);
      startOfTerm.setMonth(startOfTerm.getMonth() - 3);

      const { data: attendance, error } = await supabaseAdmin
        .from('attendance')
        .select(`
          id,
          date,
          status,
          student_id,
          students!student_id(
            first_name,
            last_name,
            admission_number,
            class_id,
            classes!class_id(name)
          )
        `)
        .eq('school_id', schoolId)
        .gte('date', startOfTerm)
        .lte('date', currentDate);

      if (error) throw error;

      // Calculate statistics
      const totalRecords = attendance.length;
      const present = attendance.filter(a => a.status === 'present').length;
      const absent = attendance.filter(a => a.status === 'absent').length;
      const late = attendance.filter(a => a.status === 'late').length;
      const excused = attendance.filter(a => a.status === 'excused').length;

      // Group by class
      const classStats = {};
      attendance.forEach(a => {
        const className = a.students?.classes?.name || 'Unknown';
        if (!classStats[className]) {
          classStats[className] = { present: 0, absent: 0, late: 0, excused: 0 };
        }
        classStats[className][a.status]++;
      });

      return {
        period: `${startOfTerm.toLocaleDateString()} to ${currentDate.toLocaleDateString()}`,
        total_records: totalRecords,
        present,
        absent,
        late,
        excused,
        attendance_rate: totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0,
        by_class: classStats
      };
    } catch (error) {
      console.error('Get Attendance Report Error:', error);
      return { error: error.message };
    }
  }

  // 3. Get At-Risk Students Data
  async getAtRiskStudentsData(schoolId) {
    try {
      const currentDate = new Date();
      const startOfTerm = new Date(currentDate);
      startOfTerm.setMonth(startOfTerm.getMonth() - 3);

      const { data: attendance, error } = await supabaseAdmin
        .from('attendance')
        .select(`
          id,
          status,
          student_id,
          students!student_id(
            id,
            first_name,
            last_name,
            admission_number,
            class_id,
            classes!class_id(name)
          )
        `)
        .eq('school_id', schoolId)
        .gte('date', startOfTerm)
        .lte('date', currentDate);

      if (error) throw error;

      // Calculate attendance per student
      const studentAttendance = {};
      attendance.forEach(a => {
        if (!studentAttendance[a.student_id]) {
          studentAttendance[a.student_id] = {
            student: a.students,
            present: 0,
            absent: 0,
            total: 0
          };
        }
        studentAttendance[a.student_id][a.status]++;
        studentAttendance[a.student_id].total++;
      });

      // Identify at-risk students (attendance rate < 70%)
      const atRiskStudents = Object.values(studentAttendance)
        .filter(s => s.total > 0 && (s.present / s.total) < 0.7)
        .map(s => ({
          name: `${s.student.first_name} ${s.student.last_name}`,
          admission: s.student.admission_number,
          class: s.student.classes?.name || 'N/A',
          attendance_rate: Math.round((s.present / s.total) * 100),
          total_days: s.total,
          absent_days: s.absent,
          risk_level: (s.present / s.total) < 0.5 ? 'High' : 'Medium'
        }))
        .sort((a, b) => a.attendance_rate - b.attendance_rate);

      return {
        total_students: Object.keys(studentAttendance).length,
        at_risk_students: atRiskStudents.length,
        students: atRiskStudents
      };
    } catch (error) {
      console.error('Get At-Risk Students Error:', error);
      return { error: error.message };
    }
  }

  // 4. Get CBT Data
  async getCBTData(schoolId) {
    try {
      // Get subjects and classes
      const { data: subjects, error } = await supabaseAdmin
        .from('subjects')
        .select('id, name, code')
        .eq('school_id', schoolId)
        .limit(10);

      if (error) throw error;

      const { data: classes, classError } = await supabaseAdmin
        .from('classes')
        .select('id, name, level')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .limit(10);

      if (classError) throw classError;

      return {
        subjects: subjects || [],
        classes: classes || [],
        school_id: schoolId
      };
    } catch (error) {
      console.error('Get CBT Data Error:', error);
      return { error: error.message };
    }
  }

  // 5. Get Report Card Data
  async getReportCardData(schoolId) {
    try {
      const { data: grades, error } = await supabaseAdmin
        .from('grades')
        .select(`
          id,
          ca1,
          ca2,
          ca3,
          exam,
          total,
          grade,
          remark,
          student_id,
          students!student_id(
            first_name,
            last_name,
            admission_number,
            class_id,
            classes!class_id(name)
          ),
          subjects!subject_id(name, code)
        `)
        .eq('school_id', schoolId)
        .limit(20);

      if (error) throw error;

      return {
        grades: grades || [],
        total_students: [...new Set(grades.map(g => g.student_id))].length
      };
    } catch (error) {
      console.error('Get Report Card Data Error:', error);
      return { error: error.message };
    }
  }

  // 6. Get Child Attendance Data
  async getChildAttendanceData(schoolId, parentUserId) {
    try {
      // Get parent's children
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('parents')
        .select('id')
        .eq('user_id', parentUserId)
        .single();

      if (parentError) throw parentError;

      const { data: studentParents, error: spError } = await supabaseAdmin
        .from('student_parents')
        .select('student_id')
        .eq('parent_id', parent.id);

      if (spError) throw spError;

      const studentIds = studentParents.map(sp => sp.student_id);

      if (studentIds.length === 0) {
        return { message: 'No children found for this parent' };
      }

      const currentDate = new Date();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      const { data: attendance, error } = await supabaseAdmin
        .from('attendance')
        .select(`
          id,
          date,
          status,
          student_id,
          students!student_id(
            first_name,
            last_name,
            admission_number,
            class_id,
            classes!class_id(name)
          )
        `)
        .in('student_id', studentIds)
        .gte('date', startOfWeek)
        .lte('date', currentDate)
        .eq('school_id', schoolId);

      if (error) throw error;

      // Group by student
      const childAttendance = {};
      attendance.forEach(a => {
        const name = `${a.students.first_name} ${a.students.last_name}`;
        if (!childAttendance[name]) {
          childAttendance[name] = {
            student_id: a.student_id,
            name: name,
            class: a.students.classes?.name || 'N/A',
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
            dates: []
          };
        }
        childAttendance[name][a.status]++;
        childAttendance[name].total++;
        childAttendance[name].dates.push({
          date: a.date,
          status: a.status
        });
      });

      return {
        children: Object.values(childAttendance),
        period: `Last 7 days (${startOfWeek.toLocaleDateString()} - ${currentDate.toLocaleDateString()})`
      };
    } catch (error) {
      console.error('Get Child Attendance Error:', error);
      return { error: error.message };
    }
  }

  // 7. Get Payment History Data
  async getPaymentHistoryData(schoolId, parentUserId) {
    try {
      // Get parent's children
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('parents')
        .select('id')
        .eq('user_id', parentUserId)
        .single();

      if (parentError) throw parentError;

      const { data: studentParents, error: spError } = await supabaseAdmin
        .from('student_parents')
        .select('student_id')
        .eq('parent_id', parent.id);

      if (spError) throw spError;

      const studentIds = studentParents.map(sp => sp.student_id);

      if (studentIds.length === 0) {
        return { message: 'No children found for this parent' };
      }

      const { data: invoices, error } = await supabaseAdmin
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount,
          total_amount,
          paid_amount,
          status,
          due_date,
          paid_at,
          items,
          student_id,
          students!student_id(
            first_name,
            last_name,
            admission_number
          )
        `)
        .in('student_id', studentIds)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate summary
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(i => i.status === 'paid');
      const pendingInvoices = invoices.filter(i => i.status === 'pending');
      const totalPaid = paidInvoices.reduce((sum, i) => sum + (i.paid_amount || i.total_amount), 0);
      const totalPending = pendingInvoices.reduce((sum, i) => sum + (i.total_amount - (i.paid_amount || 0)), 0);

      return {
        invoices: invoices.map(i => ({
          invoice_number: i.invoice_number,
          student: `${i.students.first_name} ${i.students.last_name}`,
          amount: i.total_amount,
          paid_amount: i.paid_amount || 0,
          status: i.status,
          due_date: i.due_date,
          paid_at: i.paid_at,
          items: i.items
        })),
        summary: {
          total_invoices: totalInvoices,
          paid: paidInvoices.length,
          pending: pendingInvoices.length,
          total_paid: totalPaid,
          total_pending: totalPending
        }
      };
    } catch (error) {
      console.error('Get Payment History Error:', error);
      return { error: error.message };
    }
  }

  // =============================================
  // GET SCHOOL CONTEXT
  // =============================================
  async getSchoolContext(schoolId, user) {
    try {
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select('name, academic_session, current_term')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;

      const { count: studentCount } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      const { count: teacherCount } = await supabaseAdmin
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      const { count: classCount } = await supabaseAdmin
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      return {
        school: school.name,
        academic_session: school.academic_session || 'Current Session',
        current_term: school.current_term || 'Current Term',
        stats: {
          students: studentCount || 0,
          teachers: teacherCount || 0,
          classes: classCount || 0
        },
        user: {
          name: user.fullName,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Get School Context Error:', error);
      return { school: 'Unknown', stats: {} };
    }
  }

  // =============================================
  // DETERMINE QUERY TYPE
  // =============================================
  determineQueryType(query) {
    const lowerQuery = query.toLowerCase();
    
    // School Admin queries
    if (lowerQuery.includes('unpaid') || lowerQuery.includes('fee') || lowerQuery.includes('payment')) {
      return 'unpaid_fees';
    }
    if (lowerQuery.includes('attendance report') || lowerQuery.includes('attendance summary')) {
      return 'attendance_report';
    }
    if (lowerQuery.includes('risk') || lowerQuery.includes('at risk') || lowerQuery.includes('attendance risk')) {
      return 'at_risk_students';
    }
    
    // Teacher queries
    if (lowerQuery.includes('cbt') || lowerQuery.includes('questions') || lowerQuery.includes('generate') && lowerQuery.includes('mathematics')) {
      return 'generate_cbt';
    }
    if (lowerQuery.includes('report card') || lowerQuery.includes('comments') || lowerQuery.includes('draft comment')) {
      return 'report_card_comments';
    }
    
    // Parent queries
    if (lowerQuery.includes('child absent') || lowerQuery.includes('my child absent') || lowerQuery.includes('why is my child absent')) {
      return 'child_attendance';
    }
    if (lowerQuery.includes('payment history') || lowerQuery.includes('fee history') || lowerQuery.includes('my child payment')) {
      return 'payment_history';
    }
    
    // General
    if (lowerQuery.includes('student') || lowerQuery.includes('class') || lowerQuery.includes('teacher')) {
      return 'enquiry';
    }
    
    return 'general';
  }

  // =============================================
  // FALLBACK RESPONSES
  // =============================================
  getFallbackResponse(query, queryType, role, data) {
    const fallbacks = {
      unpaid_fees: `Based on the real data, there are ${data.unpaid_students || 0} students with unpaid fees totaling ₦${data.total_outstanding?.toLocaleString() || 0}. Would you like me to generate a detailed fee report or send payment reminders?`,
      attendance_report: `The attendance rate is ${data.attendance_rate || 0}% with ${data.present || 0} present and ${data.absent || 0} absent. I can generate a detailed attendance report by class or student.`,
      at_risk_students: `There are ${data.at_risk_students || 0} students identified as at-risk based on attendance. The highest risk students are: ${data.students?.slice(0, 3).map(s => s.name).join(', ') || 'None identified'}.`,
      generate_cbt: `I can generate CBT questions for your class. Please specify the subject, class, and number of questions needed.`,
      report_card_comments: `I can draft report card comments for your students. Please provide the student names or select a class.`,
      child_attendance: `Your child's attendance: ${data.children?.map(c => `${c.name}: ${c.present}/${c.total} days present (${Math.round((c.present/c.total)*100)}%)`).join(', ') || 'No attendance records found'}.`,
      payment_history: `Payment summary: ₦${data.summary?.total_paid?.toLocaleString() || 0} paid, ₦${data.summary?.total_pending?.toLocaleString() || 0} pending.`,
      general: `I am Kora AI Assistant. How can I help you with your school management tasks today?`
    };

    return fallbacks[queryType] || fallbacks.general;
  }

  // =============================================
  // GET QUERY HISTORY
  // =============================================
  async getQueryHistory(req, res) {
    try {
      const { schoolId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const { data, error, count } = await supabaseAdmin
        .from('ai_queries')
        .select('*', { count: 'exact' })
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: count
        }
      });
    } catch (error) {
      console.error('Get Query History Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch query history',
        error: error.message
      });
    }
  }

  // =============================================
  // GET AI SUGGESTIONS
  // =============================================
  async getSuggestions(req, res) {
    try {
      const { role } = req.user;

      const suggestions = {
        school_admin: [
          {
            icon: 'FaMoneyBillWave',
            text: '"Show me students with unpaid fees"',
            description: 'View all students with outstanding fees'
          },
          {
            icon: 'FaChartBar',
            text: '"Generate this term\'s attendance report"',
            description: 'Create a comprehensive attendance report'
          },
          {
            icon: 'FaExclamationTriangle',
            text: '"Which students are at risk based on attendance?"',
            description: 'Identify students with poor attendance'
          }
        ],
        teacher: [
          {
            icon: 'FaFileAlt',
            text: '"Generate 20 Mathematics CBT questions for JSS2"',
            description: 'Create exam questions for your class'
          },
          {
            icon: 'FaComment',
            text: '"Draft comments for this report card"',
            description: 'Generate report card comments'
          }
        ],
        parent: [
          {
            icon: 'FaUserFriends',
            text: '"Why is my child absent this week?"',
            description: 'Check your child\'s attendance'
          },
          {
            icon: 'FaMoneyBillWave',
            text: '"Show my child\'s payment history"',
            description: 'View fee payment records'
          }
        ]
      };

      res.status(200).json({
        status: 'success',
        data: suggestions[role] || suggestions.school_admin
      });
    } catch (error) {
      console.error('Get Suggestions Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch suggestions',
        error: error.message
      });
    }
  }
}

module.exports = new AIController();