import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaSpinner, FaCheck, FaUsers, FaSave, FaPlus, FaTrash } from 'react-icons/fa';

const Assessments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [scores, setScores] = useState([]);

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-structure/schools/${user?.schoolId}/classes`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/subjects/schools/${user?.schoolId}/subjects`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch terms
  const { data: termsData } = useQuery({
    queryKey: ['terms', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-structure/schools/${user?.schoolId}/terms`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch CA components
  const { data: caComponentsData } = useQuery({
    queryKey: ['caComponents', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/assessments/schools/${user?.schoolId}/ca-components`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch students in class
  const { data: studentsData } = useQuery({
    queryKey: ['classStudents', user?.schoolId, selectedClass],
    queryFn: async () => {
      if (!selectedClass) return { data: [] };
      const response = await api.get(`/students/schools/${user?.schoolId}/students`, {
        params: { classId: selectedClass }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!selectedClass,
  });

  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const terms = termsData?.data || [];
  const caComponents = caComponentsData?.data || [];
  const students = studentsData?.data || [];

  // Enter scores
  const enterScoresMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/assessments/schools/${user?.schoolId}/ca-scores`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Scores entered successfully');
      setScores([]);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to enter scores')
  });

  const handleScoreChange = (studentId, caComponentId, value) => {
    setScores(prev => {
      const existing = prev.find(s => s.studentId === studentId && s.caComponentId === caComponentId);
      if (existing) {
        return prev.map(s => s.studentId === studentId && s.caComponentId === caComponentId ? { ...s, score: value } : s);
      }
      return [...prev, { studentId, subjectId: selectedSubject, classId: selectedClass, termId: selectedTerm, caComponentId, score: value }];
    });
  };

  const handleSubmit = () => {
    if (scores.length === 0) {
      toast.error('No scores to save');
      return;
    }
    enterScoresMutation.mutate({ scores });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Continuous Assessment</h1>
        <p className="text-gray-500 mt-1">Enter CA scores for students</p>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">Select Term</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Scores Table */}
      {selectedClass && selectedSubject && selectedTerm && (
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
                    {caComponents.map(comp => (
                      <th key={comp.id} className="px-4 py-3 text-center">{comp.name} ({comp.weight_percentage}%)</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{student.first_name} {student.last_name}</p>
                        <p className="text-xs text-gray-500">{student.admission_number}</p>
                      </td>
                      {caComponents.map(comp => (
                        <td key={comp.id} className="px-4 py-3">
                          <input
                            type="number"
                            value={scores.find(s => s.studentId === student.id && s.caComponentId === comp.id)?.score || ''}
                            onChange={(e) => handleScoreChange(student.id, comp.id, e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-kora-primary"
                            min="0"
                            max="100"
                          />
                        </td>
                      ))}
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
                disabled={enterScoresMutation.isLoading}
                className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
              >
                {enterScoresMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                Save Scores
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Assessments;