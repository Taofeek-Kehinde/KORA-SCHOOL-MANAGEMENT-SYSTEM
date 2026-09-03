import React from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaUserCircle } from 'react-icons/fa';

const Header = ({ user, onAIOpen }) => {
  const displayName =
    user?.displayName ||
    user?.fullName ||
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    'User';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between overflow-hidden">
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-lg font-semibold whitespace-nowrap truncate">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <button onClick={onAIOpen} className="p-2 rounded hover:bg-gray-100">
          <FaBell />
        </button>
        <Link to="#" className="flex items-center gap-2 min-w-0">
          <FaUserCircle className="flex-shrink-0" />
          <span className="hidden sm:inline truncate max-w-[120px]">{displayName}</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;