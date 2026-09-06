import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import { FaTimes, FaSpinner, FaCheck, FaChalkboard } from 'react-icons/fa';

const TeacherModal = ({ teacher, schoolId, onClose, onSuccess }) => {
  const isEditing = !!teacher;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
  });

  // assignments: [{ classId, subjectId }]
  const [assignments, setAssignments] = useState([]);

  const { data: classesData } = useQuery({
    queryKey: ['classes', schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${schoolId}/classes`);
      return response.data;
    },
    enabled: !!schoolId,
  });
  const classes = classesData?.data || [];

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${schoolId}/subjects`);
      return response.data;
    },
    enabled: !!schoolId,
  });
  const subjects = subjectsData?.data || [];

  useEffect(() => {
    if (teacher) {
      setFormData({
        firstName: teacher.first_name || '',
        lastName: teacher.last_name || '',
        email: teacher.email || '',
        password: '',
        phone: teacher.phone || '',
        specialization: teacher.specialization || '',
      });
      // classAssignments comes from getAllTeachers (see backend change below)
      setAssignments(teacher.classAssignments || []);
    }
  }, [teacher]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isClassChecked = (classId) => assignments.some(a => a.classId === classId);
  const getSubjectFor = (classId) => assignments.find(a => a.classId === classId)?.subjectId || '';

  const handleClassToggle = (classId) => {
    setAssignments(prev =>
      prev.some(a => a.classId === classId)
        ? prev.filter(a => a.classId !== classId)
        : [...prev, { classId, subjectId: '' }]
    );
  };

  const handleSubjectChange = (classId, subjectId) => {
    setAssignments(prev =>
      prev.map(a => a.classId === classId ? { ...a, subjectId } : a)
    );
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/teachers/schools/${schoolId}/teachers`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Teacher created! Temp Password: ${data.data.temp_password}`);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/teachers/schools/${schoolId}/teachers/${teacher.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Teacher updated successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update teacher');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('First name, last name, and email are required');
      return;
    }
    if (!isEditing && !formData.password) {
      toast.error('Password is required for new teacher');
      return;
    }
    const missingSubject = assignments.some(a => !a.subjectId);
    if (missingSubject) {
      toast.error('Please select a subject for every assigned class');
      return;
    }

    const payload = { ...formData, classAssignments: assignments };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Edit Teacher' : 'Add Teacher'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="text" name="password" value={formData.password} onChange={handleChange} required={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="Set a temporary password"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input
                type="text" name="specialization" value={formData.specialization} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="e.g., Mathematics, English, Science"
              />
            </div>

            {/* Class + Subject Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FaChalkboard className="text-kora-primary" />
                Assign to Classes
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {classes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">No classes available</p>
                ) : (
                  classes.map((cls) => (
                    <div key={cls.id} className="p-1">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded p-1">
                        <input
                          type="checkbox"
                          checked={isClassChecked(cls.id)}
                          onChange={() => handleClassToggle(cls.id)}
                          className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                        />
                        <span className="text-sm text-gray-700">{cls.name}</span>
                      </label>
                      {isClassChecked(cls.id) && (
                        <select
                          value={getSubjectFor(cls.id)}
                          onChange={(e) => handleSubjectChange(cls.id, e.target.value)}
                          className="mt-1 ml-6 w-[calc(100%-1.5rem)] px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-kora-primary"
                        >
                          <option value="">Select subject *</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button
              type="submit" disabled={isLoading}
              className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              {isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherModal;