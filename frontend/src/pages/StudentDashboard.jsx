import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";  // ← Only keep this one
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarker, FaCalendarAlt, FaBook, 
  FaMoneyBillWave, FaCreditCard, FaHeart, FaExclamationTriangle, 
  FaCheckCircle, FaClock, FaGraduationCap, FaChalkboardTeacher, 
  FaUserFriends, FaBed, FaBus, FaBookOpen, FaBell, FaSpinner, 
  FaChartLine, FaFileAlt, FaHome, FaUsers, FaBuilding, FaGlobe, 
  FaFlag, FaBirthdayCake, FaVenusMars, FaIdCard, FaBriefcase, 
  FaChevronDown, FaChevronUp, FaArrowRight, FaSchool, FaUserGraduate, 
  FaChalkboard, FaTimesCircle  
} from "react-icons/fa";

// Components
import StatCard from "../components/StatCard";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [showAllHomework, setShowAllHomework] = useState(false);

  // =============================================
  // FETCH STUDENT DASHBOARD DATA
  // =============================================
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['studentDashboard', user?.studentId],
    queryFn: async () => {
      if (!user?.studentId) return { data: {} };
      const response = await api.get(`/student-dashboard/students/${user?.studentId}/dashboard`);
      return response.data;
    },
    enabled: !!user?.studentId,
    refetchInterval: 30000,
  });

  // =============================================
  // LOADING STATE
  // =============================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-kora-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  // =============================================
  // ERROR STATE
  // =============================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Failed to Load Dashboard</h3>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // =============================================
  // EXTRACT DATA
  // =============================================
  const dashboard = data?.data || {};
  const student = dashboard.student || {};
  const personalInfo = dashboard.personalInfo || {};
  const attendance = dashboard.attendanceSummary || {};
  const academic = dashboard.academicPerformance || {};
  const fees = dashboard.outstandingFees || {};
  const payments = dashboard.paymentHistory || {};
  const medical = dashboard.medicalAlerts || {};
  const behaviour = dashboard.behaviourRecords || {};
  const homework = dashboard.homeworkStatus || {};
  const cbt = dashboard.cbtResults || {};
  const timetable = dashboard.timetable || [];
  const parents = dashboard.parentDetails?.parents || [];
  const hostel = dashboard.hostelInfo || null;
  const transport = dashboard.transportInfo || null;
  const library = dashboard.libraryLoans || {};
  const notifications = dashboard.notifications || [];

  // Helpers
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade) => {
    if (grade === 'A') return 'text-green-600';
    if (grade === 'B') return 'text-blue-600';
    if (grade === 'C') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status) => {
    const colors = {
      'present': 'bg-green-100 text-green-800',
      'absent': 'bg-red-100 text-red-800',
      'late': 'bg-yellow-100 text-yellow-800',
      'excused': 'bg-blue-100 text-blue-800',
      'submitted': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'issued': 'bg-blue-100 text-blue-800',
      'returned': 'bg-green-100 text-green-800',
      'positive': 'bg-green-100 text-green-800',
      'negative': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaHome },
    { id: 'academics', label: 'Academics', icon: FaGraduationCap },
    { id: 'fees', label: 'Fees & Payments', icon: FaMoneyBillWave },
    { id: 'attendance', label: 'Attendance', icon: FaCalendarAlt },
    { id: 'timetable', label: 'Timetable', icon: FaClock },
    { id: 'homework', label: 'Homework', icon: FaBook },
    { id: 'parents', label: 'Parents', icon: FaUserFriends },
    { id: 'library', label: 'Library', icon: FaBookOpen },
  ];

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayTimetable = timetable.find(t => t.day === currentDay) || { periods: [] };

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FaCalendarAlt}
          title="Attendance Rate"
          value={`${attendance.attendanceRate || 0}%`}
          color="blue"
          subtitle={`${attendance.present || 0}/${attendance.totalDays || 0} days`}
        />
        <StatCard
          icon={FaGraduationCap}
          title="Average Score"
          value={`${academic.averageScore || 0}%`}
          color="green"
          subtitle={`${academic.currentTerm?.length || 0} subjects`}
        />
        <StatCard
          icon={FaMoneyBillWave}
          title="Outstanding Fees"
          value={formatCurrency(fees.totalOutstanding)}
          color="red"
          subtitle={`${fees.invoices?.length || 0} invoices`}
        />
        <StatCard
          icon={FaBook}
          title="Homework Pending"
          value={homework.pending || 0}
          color="yellow"
          subtitle={`${homework.total || 0} total`}
        />
      </div>

      {/* Alerts */}
      {(medical.hasAlerts || behaviour.negative > 0 || fees.totalOutstanding > 0 || library.overdueLoans > 0 || homework.overdue > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medical.hasAlerts && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
              <FaHeart className="text-red-500 mt-1" />
              <div>
                <p className="font-semibold text-red-700 text-sm">Medical Alert</p>
                <p className="text-xs text-red-600 mt-1">
                  {medical.conditions !== 'None' && `Conditions: ${medical.conditions}`}
                  {medical.allergies !== 'None' && `Allergies: ${medical.allergies}`}
                </p>
              </div>
            </div>
          )}
          {behaviour.negative > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
              <FaExclamationTriangle className="text-yellow-500 mt-1" />
              <div>
                <p className="font-semibold text-yellow-700 text-sm">Disciplinary Records</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {behaviour.negative} negative behaviour record(s)
                </p>
              </div>
            </div>
          )}
          {fees.totalOutstanding > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-3">
              <FaMoneyBillWave className="text-orange-500 mt-1" />
              <div>
                <p className="font-semibold text-orange-700 text-sm">Outstanding Fees</p>
                <p className="text-xs text-orange-600 mt-1">
                  {formatCurrency(fees.totalOutstanding)} due
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Today's Timetable */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaClock className="text-kora-primary" />
          Today's Timetable ({currentDay})
        </h3>
        {todayTimetable.periods.length > 0 ? (
          <div className="space-y-2">
            {todayTimetable.periods.map((period, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <div className="w-20 text-xs text-gray-500">
                  {period.startTime} - {period.endTime}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{period.subject}</p>
                  <p className="text-xs text-gray-500">{period.teacher}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">
            No classes today
          </div>
        )}
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaBell className="text-kora-primary" />
            Recent Notifications
          </h3>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notif) => (
              <div key={notif.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-800 text-sm">{notif.title}</p>
                  <span className="text-xs text-gray-400">{formatDate(notif.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Academics Tab
  const renderAcademics = () => (
    <div className="space-y-6">
      {/* Current Term Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FaGraduationCap}
          title="Average Score"
          value={`${academic.averageScore || 0}%`}
          color="green"
        />
        <StatCard
          icon={FaBook}
          title="Subjects"
          value={academic.totalSubjects || 0}
          color="blue"
        />
        <StatCard
          icon={FaChalkboard}
          title="Best Subject"
          value={academic.subjects?.length > 0 
            ? academic.subjects.reduce((best, s) => (s.total > best.total ? s : best), academic.subjects[0]).subject
            : 'N/A'}
          color="yellow"
        />
        <StatCard
          icon={FaChartLine}
          title="CBT Average"
          value={`${cbt.averageScore || 0}%`}
          color="purple"
          subtitle={`${cbt.totalTests || 0} tests`}
        />
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaBook className="text-kora-primary" />
          Subject Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3 text-center">CA1</th>
                <th className="px-4 py-3 text-center">CA2</th>
                <th className="px-4 py-3 text-center">CA3</th>
                <th className="px-4 py-3 text-center">Exam</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(showAllSubjects ? academic.subjects : academic.subjects.slice(0, 5)).map((subject, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{subject.subject}</td>
                  <td className="px-4 py-3 text-center">{subject.ca1}</td>
                  <td className="px-4 py-3 text-center">{subject.ca2}</td>
                  <td className="px-4 py-3 text-center">{subject.ca3}</td>
                  <td className="px-4 py-3 text-center">{subject.exam}</td>
                  <td className="px-4 py-3 text-center font-bold">{subject.total}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${getGradeColor(subject.grade)}`}>{subject.grade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {academic.subjects?.length > 5 && (
          <button
            onClick={() => setShowAllSubjects(!showAllSubjects)}
            className="mt-3 text-sm text-kora-primary hover:underline flex items-center gap-1"
          >
            {showAllSubjects ? 'Show Less' : `Show All (${academic.subjects.length})`}
            {showAllSubjects ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        )}
      </div>

      {/* CBT Results */}
      {cbt.tests?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaChartLine className="text-kora-primary" />
            CBT Results
          </h3>
          <div className="space-y-2">
            {cbt.tests.map((test) => (
              <div key={test.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-800">{test.subject}</p>
                  <p className="text-xs text-gray-500">{formatDate(test.completedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-kora-primary">{test.percentage}%</p>
                  <p className="text-xs text-gray-500">{test.score}/{test.totalQuestions}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Fees Tab
  const renderFees = () => (
    <div className="space-y-6">
      {/* Fee Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FaMoneyBillWave}
          title="Outstanding"
          value={formatCurrency(fees.totalOutstanding)}
          color="red"
        />
        <StatCard
          icon={FaCreditCard}
          title="Total Paid"
          value={formatCurrency(payments.totalPaid)}
          color="green"
          subtitle={`${payments.totalPayments || 0} payments`}
        />
        <StatCard
          icon={FaFileAlt}
          title="Invoices"
          value={fees.totalInvoices || 0}
          color="blue"
        />
        <StatCard
          icon={FaCheckCircle}
          title="Paid Invoices"
          value={payments.totalPayments || 0}
          color="emerald"
        />
      </div>

      {/* Outstanding Invoices */}
      {fees.invoices?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Outstanding Invoices</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fees.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoice.items?.[0]?.description || 'Tuition Fee'}
                    </td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(invoice.amount)}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(invoice.paidAmount)}</td>
                    <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(invoice.balance)}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(invoice.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.payments?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
          <div className="space-y-2">
            {payments.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <FaCreditCard className="text-green-500" />
                  <div>
                    <p className="font-medium text-gray-800">{payment.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{formatDate(payment.paidAt)} • {payment.paymentMethod}</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {fees.invoices?.length === 0 && payments.payments?.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          <FaMoneyBillWave className="text-4xl mx-auto mb-2 text-gray-300" />
          No fee records found
        </div>
      )}
    </div>
  );

  // Render Attendance Tab
  const renderAttendance = () => (
    <div className="space-y-6">
      {/* Attendance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={FaCalendarAlt}
          title="Total Days"
          value={attendance.totalDays || 0}
          color="blue"
        />
        <StatCard
          icon={FaCheckCircle}
          title="Present"
          value={attendance.present || 0}
          color="green"
        />
        <StatCard
          icon={FaTimesCircle}
          title="Absent"
          value={attendance.absent || 0}
          color="red"
        />
        <StatCard
          icon={FaClock}
          title="Late"
          value={attendance.late || 0}
          color="yellow"
        />
        <StatCard
          icon={FaExclamationTriangle}
          title="Excused"
          value={attendance.excused || 0}
          color="orange"
        />
      </div>

      {/* Attendance Rate */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Rate</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={attendance.attendanceRate >= 90 ? '#10B981' : attendance.attendanceRate >= 75 ? '#F59E0B' : '#EF4444'}
                strokeWidth="10"
                strokeDasharray={`${(attendance.attendanceRate || 0) * 2.83} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getAttendanceColor(attendance.attendanceRate)}`}>
                {attendance.attendanceRate || 0}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-gray-600">
              You have been present for <strong>{attendance.present || 0}</strong> out of <strong>{attendance.totalDays || 0}</strong> school days.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {attendance.attendanceRate >= 90 ? 'Excellent attendance! Keep it up!' :
               attendance.attendanceRate >= 75 ? 'Good attendance. Aim for 90% or above.' :
               'Your attendance needs improvement. Please attend school regularly.'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      {attendance.recentAttendance?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Attendance Records</h3>
          <div className="space-y-2">
            {attendance.recentAttendance.map((record, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-600">{formatDate(record.date)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Timetable Tab
  const renderTimetable = () => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FaClock className="text-kora-primary" />
        Weekly Timetable
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timetable.map((day) => (
          <div key={day.day} className={`border rounded-lg p-4 ${day.day === currentDay ? 'border-kora-primary bg-kora-primary/5' : 'border-gray-200'}`}>
            <h4 className={`font-semibold mb-3 ${day.day === currentDay ? 'text-kora-primary' : 'text-gray-800'}`}>
              {day.day}
              {day.day === currentDay && (
                <span className="ml-2 text-xs bg-kora-primary text-white px-2 py-0.5 rounded-full">Today</span>
              )}
            </h4>
            {day.periods.length > 0 ? (
              <div className="space-y-2">
                {day.periods.map((period, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-gray-400 w-20">
                      {period.startTime}-{period.endTime}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{period.subject}</p>
                      <p className="text-xs text-gray-500">{period.teacher}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No classes</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Render Homework Tab
  const renderHomework = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FaBook} title="Total" value={homework.total || 0} color="blue" />
        <StatCard icon={FaCheckCircle} title="Completed" value={homework.completed || 0} color="green" />
        <StatCard icon={FaClock} title="Pending" value={homework.pending || 0} color="yellow" />
        <StatCard icon={FaExclamationTriangle} title="Overdue" value={homework.overdue || 0} color="red" />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignments</h3>
        {homework.assignments?.length > 0 ? (
          <div className="space-y-3">
            {(showAllHomework ? homework.assignments : homework.assignments.slice(0, 5)).map((assignment) => (
              <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{assignment.title}</p>
                    <p className="text-xs text-gray-500">
                      {assignment.subject} • Due: {formatDate(assignment.dueDate)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </div>
                {assignment.description && (
                  <p className="text-sm text-gray-600 mt-2">{assignment.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No homework assigned
          </div>
        )}
        {homework.assignments?.length > 5 && (
          <button
            onClick={() => setShowAllHomework(!showAllHomework)}
            className="mt-3 text-sm text-kora-primary hover:underline flex items-center gap-1"
          >
            {showAllHomework ? 'Show Less' : `Show All (${homework.assignments.length})`}
            {showAllHomework ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        )}
      </div>
    </div>
  );

  // Render Parents Tab
  const renderParents = () => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FaUserFriends className="text-kora-primary" />
        Parent / Guardian Details
      </h3>
      {parents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parents.map((parent) => (
            <div key={parent.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-kora-primary/10 flex items-center justify-center">
                  <FaUser className="text-kora-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {parent.firstName} {parent.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{parent.relationship}</p>
                  {parent.isPrimaryContact && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Primary Contact
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <FaEnvelope className="text-gray-400" /> {parent.email || 'N/A'}
                </p>
                <p className="flex items-center gap-2">
                  <FaPhone className="text-gray-400" /> {parent.phone || 'N/A'}
                </p>
                {parent.occupation && (
                  <p className="flex items-center gap-2">
                    <FaBriefcase className="text-gray-400" /> {parent.occupation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No parent information available
        </div>
      )}

      {/* Hostel Info */}
      {hostel && (
        <div className="mt-6 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <FaBed className="text-kora-primary" />
            Hostel Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Hostel</p>
              <p className="font-medium">{hostel.hostelName}</p>
            </div>
            <div>
              <p className="text-gray-500">Room</p>
              <p className="font-medium">{hostel.roomNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Bed</p>
              <p className="font-medium">{hostel.bedNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Warden</p>
              <p className="font-medium">{hostel.wardenName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transport Info */}
      {transport && (
        <div className="mt-6 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <FaBus className="text-kora-primary" />
            Transport Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Route</p>
              <p className="font-medium">{transport.routeName}</p>
            </div>
            <div>
              <p className="text-gray-500">Pickup Point</p>
              <p className="font-medium">{transport.pickupPoint}</p>
            </div>
            <div>
              <p className="text-gray-500">Driver</p>
              <p className="font-medium">{transport.driverName}</p>
            </div>
            <div>
              <p className="text-gray-500">Vehicle</p>
              <p className="font-medium">{transport.vehicleNumber}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Library Tab
  const renderLibrary = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FaBookOpen} title="Total Loans" value={library.totalLoans || 0} color="blue" />
        <StatCard icon={FaBookOpen} title="Active" value={library.activeLoans || 0} color="green" />
        <StatCard icon={FaExclamationTriangle} title="Overdue" value={library.overdueLoans || 0} color="red" />
        <StatCard icon={FaMoneyBillWave} title="Fines" value={formatCurrency(library.totalFines)} color="yellow" />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Library Loans</h3>
        {library.loans?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Book</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {library.loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{loan.bookTitle}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{loan.author}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(loan.issueDate)}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(loan.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{loan.fineAmount ? formatCurrency(loan.fineAmount) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FaBookOpen className="text-4xl mx-auto mb-2 text-gray-300" />
            No library loans found
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'academics':
        return renderAcademics();
      case 'fees':
        return renderFees();
      case 'attendance':
        return renderAttendance();
      case 'timetable':
        return renderTimetable();
      case 'homework':
        return renderHomework();
      case 'parents':
        return renderParents();
      case 'library':
        return renderLibrary();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 min-w-0 overflow-x-clip">
      {/* Student Header */}
      {/* Student Header */}
<div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-kora-primary">
  <div className="flex flex-wrap items-center justify-between gap-4">
    
    {/* Student Info - Left */}
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-kora-primary/10 flex items-center justify-center text-kora-primary text-2xl font-bold flex-shrink-0">
        {personalInfo.firstName?.charAt(0) || 'S'}
        {personalInfo.lastName?.charAt(0) || ''}
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">
          {personalInfo.firstName} {personalInfo.lastName}
        </h2>
        <p className="text-gray-500 text-sm">
          {personalInfo.admissionNumber}
        </p>
        <div className="flex gap-3 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FaGraduationCap className="text-xs" />
            {personalInfo.class?.name || 'No Class'}
          </span>
          {personalInfo.campus?.name && (
            <span className="flex items-center gap-1">
              <FaBuilding className="text-xs" />
              {personalInfo.campus.name}
            </span>
          )}
        </div>
      </div>
    </div>
    
    {/* Stats - Right */}
    <div className="flex items-center gap-6">
      <div className="text-center">
        <div className={`text-2xl font-bold ${getAttendanceColor(attendance.attendanceRate)}`}>
          {attendance.attendanceRate || 0}%
        </div>
        <div className="text-xs text-gray-500">Attendance</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-kora-primary">
          {academic.averageScore || 0}%
        </div>
        <div className="text-xs text-gray-500">Average</div>
      </div>
      <div className="text-center">
        <div className={`text-2xl font-bold ${fees.totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {fees.totalOutstanding > 0 ? formatCurrency(fees.totalOutstanding) : 'Paid'}
        </div>
        <div className="text-xs text-gray-500">Fees</div>
      </div>
    </div>
  </div>
</div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden min-w-0">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-kora-primary text-kora-primary font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="text-sm" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;