import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FaBook, FaChalkboardTeacher, FaUsers, FaCalendarAlt } from 'react-icons/fa';

const teacherClasses = [
  { name: 'Grade 7 - Science', students: 32, period: 'Mon/Wed/Fri' },
  { name: 'Grade 8 - Biology', students: 28, period: 'Tue/Thu' },
  { name: 'Grade 9 - Chemistry', students: 30, period: 'Mon/Tue/Thu' },
];

const TeacherDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.displayName || user?.fullName || 'Teacher'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Assigned Classes</p>
              <p className="text-2xl font-bold text-gray-800">{teacherClasses.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><FaBook /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Students</p>
              <p className="text-2xl font-bold text-gray-800">{teacherClasses.reduce((sum, item) => sum + item.students, 0)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg text-green-600"><FaUsers /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Attendance</p>
              <p className="text-2xl font-bold text-gray-800">Ready</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600"><FaCalendarAlt /></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Assigned Classes</h2>
          <span className="text-sm text-gray-500">Current term</span>
        </div>

        <div className="space-y-3">
          {teacherClasses.map((item) => (
            <div key={item.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><FaChalkboardTeacher /></div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.period}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">{item.students} students</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
