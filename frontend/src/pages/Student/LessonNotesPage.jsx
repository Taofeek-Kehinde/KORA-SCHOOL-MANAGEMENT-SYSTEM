import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { FaSpinner, FaFileAlt, FaEye, FaTimes } from 'react-icons/fa';

const LessonNotesPage = () => {
  const { user } = useAuth();
  const [selectedNote, setSelectedNote] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['studentLessonNotes', user?.studentId],
    queryFn: async () => {
      const response = await api.get(`/lesson-notes/students/${user?.studentId}/lesson-notes`);
      return response.data;
    },
    enabled: !!user?.studentId,
  });

  const lessonNotes = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Lesson Notes</h1>
        <p className="text-gray-500 mt-1">Click on any lesson note to view full details</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {lessonNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FaFileAlt className="text-4xl mx-auto mb-2 text-gray-300" />
            No lesson notes available
          </div>
        ) : (
          <div className="space-y-3">
            {lessonNotes.map((note) => (
              <div 
                key={note.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg cursor-pointer"
                onClick={() => {
                  setSelectedNote(note);
                  setShowModal(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-lg">{note.topic}</p>
                    <p className="text-sm text-gray-500">
                      {note.subject_name || 'No subject'} • {note.teacher_name || 'No teacher'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Week {note.week_number || 'N/A'} • 
                      {new Date(note.date || note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="ml-4 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
                    <FaEye className="inline mr-1" /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Popup Wrapper with custom page offsets */}
      {showModal && selectedNote && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm pt-20 pb-6 md:py-10">
          
          {/* Main Card Container with calculation limits to prevent clipping header */}
          <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-3xl w-full flex flex-col h-[85vh] sm:h-auto max-h-[80vh] sm:max-h-[calc(100vh-140px)] shadow-2xl overflow-hidden transition-all duration-300">
            
            {/* Header Area */}
            <div className="flex items-start justify-between p-5 md:p-6 border-b border-gray-100 flex-shrink-0 bg-white">
              <div className="pr-4">
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 line-clamp-1">{selectedNote.topic || 'No Topic Title'}</h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                  <span>{selectedNote.subject_name || 'No subject'}</span>
                  <span className="text-gray-300">•</span>
                  <span>{selectedNote.teacher_name || 'No teacher'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Week {selectedNote.week_number || 'N/A'}</span>
                  <span className="text-gray-300">•</span>
                  <span className="whitespace-nowrap">{new Date(selectedNote.date || selectedNote.created_at).toLocaleDateString()}</span>
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <FaTimes className="text-base md:text-lg" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 bg-white custom-scrollbar">
              {selectedNote.objectives && (
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-gray-800 text-xs tracking-wider uppercase">Objectives</h4>
                  <p className="text-gray-600 whitespace-pre-wrap mt-2 text-sm leading-relaxed">{selectedNote.objectives}</p>
                </div>
              )}

              {selectedNote.previous_knowledge && (
                <div>
                  <h4 className="font-bold text-gray-700 text-xs tracking-wider uppercase">Previous Knowledge</h4>
                  <p className="text-gray-600 whitespace-pre-wrap mt-1.5 text-sm leading-relaxed">{selectedNote.previous_knowledge}</p>
                </div>
              )}

              {selectedNote.teaching_aids && (
                <div>
                  <h4 className="font-bold text-gray-700 text-xs tracking-wider uppercase">Teaching Aids</h4>
                  <p className="text-gray-600 whitespace-pre-wrap mt-1.5 text-sm leading-relaxed">{selectedNote.teaching_aids}</p>
                </div>
              )}

              {selectedNote.lesson_development && (
                <div>
                  <h4 className="font-bold text-gray-700 text-xs tracking-wider uppercase">Lesson Development</h4>
                  <p className="text-gray-600 whitespace-pre-wrap mt-1.5 text-sm leading-relaxed">{selectedNote.lesson_development}</p>
                </div>
              )}

              {selectedNote.evaluation && (
                <div>
                  <h4 className="font-bold text-gray-700 text-xs tracking-wider uppercase">Evaluation</h4>
                  <p className="text-gray-600 whitespace-pre-wrap mt-1.5 text-sm leading-relaxed">{selectedNote.evaluation}</p>
                </div>
              )}

              {selectedNote.assignment && (
                <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-50">
                  <h4 className="font-bold text-blue-900 text-xs tracking-wider uppercase">Assignment</h4>
                  <p className="text-gray-700 whitespace-pre-wrap mt-2 text-sm leading-relaxed">{selectedNote.assignment}</p>
                </div>
              )}
            </div>

            {/* Footer Row */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button 
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonNotesPage;
