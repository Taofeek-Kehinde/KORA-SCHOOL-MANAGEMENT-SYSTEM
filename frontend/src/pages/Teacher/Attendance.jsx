import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaSpinner, FaCheck, FaUsers } from 'react-icons/fa';

const TeacherAttendance = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [attendance, setAttendance] = useState([]);

  // ✅ Fetch assigned classes
  const { data: classesData } = useQuery({
    queryKey: ['assignedClasses', user?.teacherId],
    queryFn: async () => {
      const response = await api.get(`/teachers/teachers/${user?.teacherId}/classes`);
      return response.data;
    },
    enabled: !!user?.teacherId,
  });

  const assignedClasses = classesData?.data || [];

  // ✅ Fetch students in selected class
  const { data: studentsData } = useQuery({
    queryKey: ['classStudents', user?.teacherId, selectedClass],
    queryFn: async () => {
      if (!selectedClass) return { data: [] };
      const response = await api.get(`/teachers/teachers/${user?.teacherId}/students`, {
        params: { classId: selectedClass }
      });
      return response.data;
    },
    enabled: !!user?.teacherId && !!selectedClass,
  });

  const students = studentsData?.data || [];

  // ✅ Update attendance
  const updateAttendanceMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/teachers/schools/${user?.schoolId}/attendance`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setAttendance([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update attendance');
    }
  });

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => {
      const existing = prev.find(a => a.studentId === studentId);
      if (existing) {
        return prev.map(a => a.studentId === studentId ? { ...a, status } : a);
      }
      return [...prev, { studentId, status, classId: selectedClass }];
    });
  };

  const handleSubmit = () => {
    if (attendance.length === 0) {
      toast.error('No attendance records to save');
      return;
    }
    updateAttendanceMutation.mutate({
      attendance,
      classId: selectedClass
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Attendance</h1>
        <p className="text-gray-500 mt-1">Update class attendance for your assigned students</p>
      </div>

      {/* Class Selector - ONLY assigned classes */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
        >
          <option value="">Select an assigned class</option>
          {assignedClasses.map((item) => (
            <option key={item.id} value={item.class_id}>
              {item.classes?.name} - {item.subjects?.name}
            </option>
          ))}
        </select>
      </div>

      {/* Students List */}
      {selectedClass && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Students ({students.length})</h3>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaUsers className="text-4xl mx-auto mb-2 text-gray-300" />
              No students in this class
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {students.map((student) => (
                <div key={student.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{student.first_name} {student.last_name}</p>
                    <p className="text-xs text-gray-500">{student.admission_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={attendance.find(a => a.studentId === student.id)?.status || 'present'}
                      onChange={(e) => handleStatusChange(student.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {students.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={updateAttendanceMutation.isLoading}
                className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
              >
                {updateAttendanceMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                Save Attendance
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;