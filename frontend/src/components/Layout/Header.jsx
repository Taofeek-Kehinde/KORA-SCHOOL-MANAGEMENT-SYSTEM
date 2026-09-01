import React from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaUserCircle } from 'react-icons/fa';

const Header = ({ user, onAIOpen }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onAIOpen} className="p-2 rounded hover:bg-gray-100">
          <FaBell />
        </button>
        <Link to="#" className="flex items-center gap-2">
          <FaUserCircle /> <span className="hidden sm:inline">{user?.email}</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
