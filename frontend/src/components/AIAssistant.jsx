import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../utils/api';
import {
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaSpinner,
  FaLightbulb,
  FaChartBar,
  FaMoneyBillWave,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaComment,
  FaUserFriends,
  FaCalendarAlt,
} from 'react-icons/fa';

const AIAssistant = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'assistant',
      content: 'Hello! I\'m Kora AI Assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [suggestions, setSuggestions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch suggestions
  const { data: suggestionsData } = useQuery({
    queryKey: ['aiSuggestions', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/ai/schools/${user?.schoolId}/suggestions`);
      return response.data;
    },
    enabled: !!user?.schoolId && isOpen,
  });

  // Process query mutation
  const processQueryMutation = useMutation({
    mutationFn: async (query) => {
      const response = await api.post(`/ai/schools/${user?.schoolId}/query`, {
        query
      });
      return response.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: data.data.response,
          timestamp: new Date()
        }
      ]);
      setIsProcessing(false);
      queryClient.invalidateQueries(['aiHistory', user?.schoolId]);
    },
    onError: (error) => {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: error.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          error: true
        }
      ]);
      setIsProcessing(false);
    }
  });

  useEffect(() => {
    if (suggestionsData?.data) {
      setSuggestions(suggestionsData.data);
    }
  }, [suggestionsData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() || isProcessing) return;

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: 'user',
        content: message,
        timestamp: new Date()
      }
    ]);

    setIsProcessing(true);
    await processQueryMutation.mutateAsync(message);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getIcon = (iconName) => {
    const icons = {
      FaMoneyBillWave: FaMoneyBillWave,
      FaChartBar: FaChartBar,
      FaExclamationTriangle: FaExclamationTriangle,
      FaUserGraduate: FaUserGraduate,
      FaFileAlt: FaFileAlt,
      FaComment: FaComment,
      FaUserFriends: FaUserFriends,
      FaCalendarAlt: FaCalendarAlt,
    };
    const Icon = icons[iconName] || FaLightbulb;
    return Icon;
  };

  const handleSuggestionClick = (suggestion) => {
    const text = suggestion.text.replace(/^"|"$/g, '');
    setMessage(text);
    setTimeout(() => handleSendMessage(), 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-kora-primary/10 flex items-center justify-center">
              <FaRobot className="text-kora-primary text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Kora AI Assistant</h3>
              <p className="text-xs text-gray-500">
                {user?.role === 'school_admin' ? 'Admin' : user?.role === 'teacher' ? 'Teacher' : 'Parent'} • Powered by OpenAI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px] max-h-[400px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.type === 'user'
                    ? 'bg-kora-primary text-white'
                    : msg.error
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.type === 'assistant' && !msg.error && (
                  <FaRobot className="inline mr-2 text-kora-primary" />
                )}
                <span className="whitespace-pre-wrap text-sm">{msg.content}</span>
                <div className={`text-[10px] mt-1 ${msg.type === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                <FaSpinner className="animate-spin text-kora-primary" />
                <span className="text-gray-500 text-sm">Processing your request...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && messages.length < 3 && (
          <div className="px-6 pb-2">
            <p className="text-xs text-gray-400 mb-2">Suggested queries for you:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => {
                const Icon = getIcon(suggestion.icon);
                return (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition-colors flex items-center gap-1"
                  >
                    <Icon className="text-xs" />
                    {suggestion.text.replace(/^"|"$/g, '')}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your school..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary text-sm"
              disabled={isProcessing}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isProcessing}
              className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaPaperPlane />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Press Enter to send • AI responses are generated based on your school's real data
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;