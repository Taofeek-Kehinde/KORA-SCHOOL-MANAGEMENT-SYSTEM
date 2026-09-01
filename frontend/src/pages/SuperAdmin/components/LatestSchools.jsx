import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FaSchool, FaCheckCircle, FaClock, FaTimesCircle, FaBuilding } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const LatestSchools = ({ schools }) => {
  const getStatusBadge = (status, isApproved) => {
    if (!isApproved) {
      return { color: 'bg-yellow-100 text-yellow-800', icon: FaClock, label: 'Pending' };
    }
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-800', icon: FaCheckCircle, label: 'Active' };
      case 'trial':
        return { color: 'bg-blue-100 text-blue-800', icon: FaClock, label: 'Trial' };
      case 'suspended':
        return { color: 'bg-red-100 text-red-800', icon: FaTimesCircle, label: 'Suspended' };
      case 'expired':
        return { color: 'bg-gray-100 text-gray-800', icon: FaTimesCircle, label: 'Expired' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: FaClock, label: status || 'Unknown' };
    }
  };

  if (!schools || schools.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaSchool className="text-kora-primary" />
          Latest Registered Schools
        </h3>
        <div className="text-center py-8 text-gray-500">
          <FaBuilding className="text-4xl mx-auto mb-2 text-gray-300" />
          <p>No schools registered yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaSchool className="text-kora-primary" />
          Latest Registered Schools
        </h3>
        <Link to="/admin/schools" className="text-sm text-kora-primary hover:underline">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="pb-3">School</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 hidden md:table-cell">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {schools.map((school) => {
              const StatusBadge = getStatusBadge(school.subscription_status, school.is_approved);
              const StatusIcon = StatusBadge.icon;
              
              return (
                <tr key={school.id}>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-kora-primary/10 flex items-center justify-center flex-shrink-0">
                        <FaSchool className="text-kora-primary text-sm" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{school.name}</p>
                        <p className="text-xs text-gray-500">{school.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${StatusBadge.color}`}>
                      <StatusIcon className="mr-1 text-xs" />
                      {StatusBadge.label}
                    </span>
                  </td>
                  <td className="py-3 hidden md:table-cell text-sm text-gray-500">
                    {formatDistanceToNow(new Date(school.created_at), { addSuffix: true })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LatestSchools;