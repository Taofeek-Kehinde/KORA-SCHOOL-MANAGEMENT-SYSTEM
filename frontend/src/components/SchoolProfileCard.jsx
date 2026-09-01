import React from 'react';
import { FaSchool, FaMapMarker, FaGlobe, FaPhone, FaEnvelope, FaCalendarAlt, FaBook } from 'react-icons/fa';

const SchoolProfileCard = ({ school }) => {
  if (!school || !school.name) {
    return null;
  }

  const colours = school.colours || { primary: '#4F46E5', secondary: '#7C3AED' };

  return (
    <div
      className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4"
      style={{ borderLeftColor: colours.primary }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {school.logo_url ? (
            <img
              src={school.logo_url}
              alt={school.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: colours.primary }}
            >
              {school.name.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{school.name}</h2>
            {school.motto && (
              <p className="text-sm text-gray-500 italic">"{school.motto}"</p>
            )}
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
              {school.academic_session && (
                <span className="flex items-center gap-1">
                  <FaCalendarAlt className="text-xs" />
                  {school.academic_session}
                </span>
              )}
              {school.current_term && (
                <span className="flex items-center gap-1">
                  <FaBook className="text-xs" />
                  {school.current_term}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  school.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                  school.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' :
                  school.subscription_status === 'suspended' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {school.subscription_status || 'Pending'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Colour preview */}
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="text-center">
            <div
              className="w-10 h-10 rounded-lg border border-gray-200"
              style={{ backgroundColor: colours.primary }}
            />
            <span className="text-xs text-gray-500">Primary</span>
          </div>
          <div className="text-center">
            <div
              className="w-10 h-10 rounded-lg border border-gray-200"
              style={{ backgroundColor: colours.secondary }}
            />
            <span className="text-xs text-gray-500">Secondary</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolProfileCard;