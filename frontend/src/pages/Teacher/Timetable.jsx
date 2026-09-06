import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaPlus, FaTrash, FaSpinner, FaSave, FaClock } from 'react-icons/fa';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = ['00', '15', '30', '45'];

const splitTime = (time) => {
  const [h, m] = (time || '08:00').split(':');
  return { h: h || '08', m: m || '00' };
};

const TimeSelect = ({ value, onChange }) => {
  const { h, m } = splitTime(value);
  return (
    <div className="flex items-center gap-1">
      <select
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${m}`)}
        className="px-2 py-2 border border-gray-300 rounded-lg"
      >
        {hours.map(hh => <option key={hh} value={hh}>{hh}</option>)}
      </select>
      <span>:</span>
      <select
        value={m}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        className="px-2 py-2 border border-gray-300 rounded-lg"
      >
        {minutes.map(mm => <option key={mm} value={mm}>{mm}</option>)}
      </select>
    </div>
  );
};

const Timetable = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [entries, setEntries] = useState([]);
  const [loadedForClass, setLoadedForClass] = useState('');

  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/classes`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/subjects`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const { data: timetableData, refetch } = useQuery({
    queryKey: ['timetable', user?.schoolId, selectedClass],
    queryFn: async () => {
      if (!selectedClass) return { data: [] };
      const response = await api.get(`/timetable/schools/${user?.schoolId}/timetable`, {
        params: { classId: selectedClass }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!selectedClass,
  });

  useEffect(() => {
    if (!selectedClass || !timetableData) return;
    if (loadedForClass === selectedClass) return;

    const existingPeriods = (timetableData.data || []).flatMap(day =>
      (day.periods || []).map(p => ({
        day: p.day_of_week,
        subjectId: p.subject_id || '',
        startTime: (p.start_time || '08:00').slice(0, 5),
        endTime: (p.end_time || '09:00').slice(0, 5),
      }))
    );

    setEntries(existingPeriods);
    setLoadedForClass(selectedClass);
  }, [selectedClass, timetableData, loadedForClass]);

  const saveTimetableMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/timetable/schools/${user?.schoolId}/timetable`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Timetable saved successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save timetable');
    }
  });

  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setEntries([]);
    setLoadedForClass('');
  };

  const addEntry = () => {
    setEntries(prev => [
      ...prev,
      { day: 'Monday', subjectId: '', startTime: '08:00', endTime: '09:00' }
    ]);
  };

  const removeEntry = (index) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateEntry = (index, field, value) => {
    setEntries(prev => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  };

  const handleSave = () => {
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }
    if (entries.length === 0) {
      toast.error('Please add at least one entry');
      return;
    }
    if (!user?.teacherId) {
      toast.error('Unable to identify your teacher account. Please log out and back in.');
      return;
    }
    const missingSubject = entries.some(e => !e.subjectId);
    if (missingSubject) {
      toast.error('Please select a subject for every period');
      return;
    }

    const entriesWithTeacher = entries.map(entry => ({
      ...entry,
      teacherId: user.teacherId
    }));

    saveTimetableMutation.mutate({
      classId: selectedClass,
      entries: entriesWithTeacher
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Timetable</h1>
          <p className="text-gray-500 mt-1">Set timetable for your class</p>
        </div>
        <button
          onClick={addEntry}
          disabled={!selectedClass}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0 disabled:opacity-50"
        >
          <FaPlus />
          Add Period
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
        <select
          value={selectedClass}
          onChange={(e) => handleClassChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
        >
          <option value="">Select a class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Timetable Entries</h3>

          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaClock className="text-4xl mx-auto mb-2 text-gray-300" />
              No timetable entries. Click "Add Period" to start.
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div key={index} className="flex flex-col md:flex-row md:items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <select
                    value={entry.day}
                    onChange={(e) => updateEntry(index, 'day', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg md:w-36"
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select
                    value={entry.subjectId}
                    onChange={(e) => updateEntry(index, 'subjectId', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg md:w-40"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Start</span>
                    <TimeSelect
                      value={entry.startTime}
                      onChange={(val) => updateEntry(index, 'startTime', val)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">End</span>
                    <TimeSelect
                      value={entry.endTime}
                      onChange={(val) => updateEntry(index, 'endTime', val)}
                    />
                  </div>

                  <button
                    onClick={() => removeEntry(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg self-start md:self-auto"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}

          {entries.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saveTimetableMutation.isLoading}
              className="mt-4 px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
            >
              {saveTimetableMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
              Save Timetable
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Timetable;