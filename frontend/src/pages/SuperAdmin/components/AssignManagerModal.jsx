import React, { useState } from 'react';
import { FaTimes, FaUser, FaEnvelope } from 'react-icons/fa';

const AssignManagerModal = ({ school, onClose, onAssign, isLoading }) => {
  const [managerId, setManagerId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!managerId) {
      toast.error('Please enter a manager ID');
      return;
    }
    onAssign(managerId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Assign Account Manager</h3>
            <p className="text-sm text-gray-500">{school?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaUser className="inline mr-1" />
              Manager ID
            </label>
            <input
              type="text"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              placeholder="Enter user ID of the manager"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the UUID of a user with super_admin or school_admin role
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50"
            >
              {isLoading ? 'Assigning...' : 'Assign Manager'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignManagerModal;