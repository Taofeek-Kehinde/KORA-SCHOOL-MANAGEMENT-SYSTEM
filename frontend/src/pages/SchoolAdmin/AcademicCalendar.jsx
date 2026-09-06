import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaCalendarAlt, FaCheck, FaTimes } from 'react-icons/fa';

const AcademicCalendar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', eventType: 'general', startDate: '', endDate: '', description: '' });

  // Fetch calendar events
  const { data: eventsData, refetch } = useQuery({
    queryKey: ['calendarEvents', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-calendar/schools/${user?.schoolId}/calendar`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const events = eventsData?.data || [];

  // Create event
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/academic-calendar/schools/${user?.schoolId}/calendar`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Event created successfully');
      setShowModal(false);
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create event')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate) {
      toast.error('Title and start date are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const eventTypeColors = {
    'general': 'bg-blue-100 text-blue-800',
    'holiday': 'bg-green-100 text-green-800',
    'exam': 'bg-purple-100 text-purple-800',
    'meeting': 'bg-yellow-100 text-yellow-800',
    'sports': 'bg-orange-100 text-orange-800',
    'graduation': 'bg-pink-100 text-pink-800'
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Academic Calendar</h1>
          <p className="text-gray-500 mt-1">Manage school events and holidays</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0">
          <FaPlus /> Add Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events</h3>
          <p className="text-gray-500">Click "Add Event" to add your first event</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A'}
                    {event.end_date && event.end_date !== event.start_date ? ` - ${new Date(event.end_date).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-800'}`}>
                  {event.event_type}
                </span>
              </div>
              {event.description && <p className="text-sm text-gray-600 mt-2">{event.description}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Event" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Event Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <select value={formData.eventType} onChange={(e) => setFormData({ ...formData, eventType: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3">
              <option value="general">General</option>
              <option value="holiday">Holiday</option>
              <option value="exam">Examination</option>
              <option value="meeting">Meeting</option>
              <option value="sports">Sports</option>
              <option value="graduation">Graduation</option>
            </select>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" required />
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <button type="submit" className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg">Create Event</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-xl max-w-md w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FaTimes /></button>
      </div>
      {children}
    </div>
  </div>
);

export default AcademicCalendar;