import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaSpinner, FaCheck, FaUsers, FaSave } from 'react-icons/fa';

const TeacherGrades = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [grades, setGrades] = useState([]);

  // ✅ Fetch assigned classes
  const { data: classesData } = useQuery({
    queryKey: ['assignedClasses', user?.teacherId],
    queryFn: async () => {
      if (!user?.teacherId) return { data: [] };
      const response = await api.get(`/teachers/teachers/${user?.teacherId}/classes`);
      return response.data;
    },
    enabled: !!user?.teacherId,
  });

  const assignedClasses = classesData?.data || [];

  // ✅ Fetch assessments
  const { data: assessmentsData, refetch } = useQuery({
    queryKey: ['teacherAssessments', user?.schoolId, selectedClass, selectedSubject],
    queryFn: async () => {
      if (!selectedClass || !selectedSubject) return { data: [] };
      const response = await api.get(`/teachers/schools/${user.schoolId}/assessments`, {
        params: { classId: selectedClass, subjectId: selectedSubject }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!selectedClass && !!selectedSubject,
  });

  // ✅ Update assessments
  const updateAssessmentsMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/teachers/schools/${user.schoolId}/assessments`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      setGrades([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update assessments');
    }
  });

  const students = assessmentsData?.data || [];

  const handleScoreChange = (studentId, field, value) => {
    setGrades(prev => {
      const existing = prev.find(g => g.studentId === studentId);
      if (existing) {
        return prev.map(g => g.studentId === studentId ? { ...g, [field]: value } : g);
      }
      return [...prev, { studentId, classId: selectedClass, subjectId: selectedSubject, [field]: value }];
    });
  };

  const handleSubmit = () => {
    if (grades.length === 0) {
      toast.error('No grades to save');
      return;
    }
    updateAssessmentsMutation.mutate({
      assessments: grades,
      classId: selectedClass,
      subjectId: selectedSubject
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Assessments</h1>
        <p className="text-gray-500 mt-1">Enter and update marks for student assessments</p>
      </div>

      {/* Class and Subject Selectors */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="">Select a class</option>
              {assignedClasses.map((item) => (
                <option key={item.id} value={item.class_id}>
                  {item.classes?.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="">Select a subject</option>
              {assignedClasses
                .filter(item => item.class_id === selectedClass)
                .map((item) => (
                  <option key={item.subject_id} value={item.subject_id}>
                    {item.subjects?.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Assessment Table */}
      {selectedClass && selectedSubject && (
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">CA1</th>
                    <th className="px-4 py-3">CA2</th>
                    <th className="px-4 py-3">CA3</th>
                    <th className="px-4 py-3">Exam</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{student.admission_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={grades.find(g => g.studentId === student.id)?.ca1 || ''}
                          onChange={(e) => handleScoreChange(student.id, 'ca1', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-kora-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={grades.find(g => g.studentId === student.id)?.ca2 || ''}
                          onChange={(e) => handleScoreChange(student.id, 'ca2', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-kora-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={grades.find(g => g.studentId === student.id)?.ca3 || ''}
                          onChange={(e) => handleScoreChange(student.id, 'ca3', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-kora-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={grades.find(g => g.studentId === student.id)?.exam || ''}
                          onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-kora-primary"
                        />
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {(() => {
                          const g = grades.find(g => g.studentId === student.id);
                          const total = (parseInt(g?.ca1) || 0) + (parseInt(g?.ca2) || 0) + (parseInt(g?.ca3) || 0) + (parseInt(g?.exam) || 0);
                          return total || '-';
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {students.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={updateAssessmentsMutation.isLoading}
                className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
              >
                {updateAssessmentsMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                Save Assessments
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherGrades;