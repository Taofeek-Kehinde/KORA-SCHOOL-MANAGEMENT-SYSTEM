import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { FaSpinner, FaDownload, FaUsers, FaChartBar, FaBook, FaTrophy, FaExclamationTriangle } from 'react-icons/fa';
import StatCard from '../../components/StatCard';

const AcademicReports = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('class_performance');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-structure/schools/${user?.schoolId}/classes`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['departments', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-structure/schools/${user?.schoolId}/departments`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch class performance
  const { data: classPerformance, isLoading: classLoading } = useQuery({
    queryKey: ['classPerformance', user?.schoolId, selectedClass],
    queryFn: async () => {
      if (!selectedClass) return { data: null };
      const response = await api.get(`/academic-reports/schools/${user?.schoolId}/class-performance`, {
        params: { classId: selectedClass }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!selectedClass,
  });

  // Fetch department performance
  const { data: departmentPerformance, isLoading: deptLoading } = useQuery({
    queryKey: ['departmentPerformance', user?.schoolId, selectedDepartment],
    queryFn: async () => {
      if (!selectedDepartment) return { data: null };
      const response = await api.get(`/academic-reports/schools/${user?.schoolId}/department-performance`, {
        params: { departmentId: selectedDepartment }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!selectedDepartment,
  });

  // Fetch subject enrollment
  const { data: subjectEnrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['subjectEnrollment', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-reports/schools/${user?.schoolId}/subject-enrollment`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const classes = classesData?.data || [];
  const departments = departmentsData?.data || [];

  const handleExport = () => {
    window.print();
  };

  const reportTypes = [
    { value: 'class_performance', label: 'Class Performance' },
    { value: 'department_performance', label: 'Department Performance' },
    { value: 'subject_enrollment', label: 'Subject Enrollment' },
    { value: 'teacher_workload', label: 'Teacher Workload' }
  ];

  const classData = classPerformance?.data;
  const deptData = departmentPerformance?.data;
  const enrollmentData = subjectEnrollment?.data;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Academic Reports</h1>
          <p className="text-gray-500 mt-1">Analyze academic performance</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0">
          <FaDownload /> Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
            {reportTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {reportType === 'class_performance' && (
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {reportType === 'department_performance' && (
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Class Performance */}
      {reportType === 'class_performance' && classLoading && (
        <div className="flex items-center justify-center py-12"><FaSpinner className="animate-spin text-3xl text-kora-primary" /></div>
      )}

      {reportType === 'class_performance' && classData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FaUsers} title="Students" value={classData.total_students || 0} color="blue" />
            <StatCard icon={FaChartBar} title="Attendance Rate" value={`${classData.attendance_rate || 0}%`} color="green" />
            <StatCard icon={FaChartBar} title="Class Average" value={`${classData.class_average || 0}%`} color="yellow" />
            <StatCard icon={FaTrophy} title="Best Student" value={classData.best_student?.name || 'N/A'} color="purple" />
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject Performance</h3>
            {classData.subject_performance?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {classData.subject_performance.map((grade, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{grade.students?.first_name} {grade.students?.last_name}</td>
                        <td className="px-4 py-3">{grade.subjects?.name || 'N/A'}</td>
                        <td className="px-4 py-3 font-bold">{grade.total}</td>
                        <td className="px-4 py-3">{grade.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No grade data available</p>
            )}
          </div>
        </div>
      )}

      {/* Department Performance */}
      {reportType === 'department_performance' && deptLoading && (
        <div className="flex items-center justify-center py-12"><FaSpinner className="animate-spin text-3xl text-kora-primary" /></div>
      )}

      {reportType === 'department_performance' && deptData && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Average: {deptData.department_average || 0}%</h3>
          {deptData.subjects?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deptData.subjects.map(subject => (
                <div key={subject.subject_id} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-800">{subject.subject_name}</p>
                  <p className="text-sm text-gray-500">Average: {subject.average_score}%</p>
                  <p className="text-sm text-gray-500">Students: {subject.student_count}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No subject data available</p>
          )}
        </div>
      )}

      {/* Subject Enrollment */}
      {reportType === 'subject_enrollment' && enrollmentLoading && (
        <div className="flex items-center justify-center py-12"><FaSpinner className="animate-spin text-3xl text-kora-primary" /></div>
      )}

      {reportType === 'subject_enrollment' && enrollmentData && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject Enrollment</h3>
          {enrollmentData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Classes</th>
                    <th className="px-4 py-3">Teachers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {enrollmentData.map(subject => (
                    <tr key={subject.subject_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{subject.subject_name}</td>
                      <td className="px-4 py-3">{subject.subject_code}</td>
                      <td className="px-4 py-3">{subject.class_count}</td>
                      <td className="px-4 py-3">{subject.teacher_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No subject enrollment data</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AcademicReports;