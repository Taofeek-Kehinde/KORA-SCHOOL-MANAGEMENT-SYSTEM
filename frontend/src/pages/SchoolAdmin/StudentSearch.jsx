import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  FaSearch,
  FaUser,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaMapMarker,
  FaGraduationCap,
  FaBuilding,
  FaClock,
  FaHome,
  FaBus,
  FaBed,
  FaCamera,
  FaBarcode,
  FaTimes,
  FaSpinner,
  FaUserGraduate,
  FaChalkboard,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

const StudentSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [classId, setClassId] = useState('');
  const [houseId, setHouseId] = useState('');
  const [hostelId, setHostelId] = useState('');
  const [routeId, setRouteId] = useState('');

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/classes`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch search results
  const { data: searchData, isLoading, refetch } = useQuery({
    queryKey: ['studentSearch', user?.schoolId, searchTerm, searchBy, classId],
    queryFn: async () => {
      if (!searchTerm && !classId) return { data: [] };
      const response = await api.get(`/search/schools/${user?.schoolId}/students/search`, {
        params: {
          query: searchTerm,
          searchBy,
          classId: classId || undefined,
          limit: 50
        }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const students = searchData?.data || [];
  const classes = classesData?.data || [];

  const searchOptions = [
    { value: 'name', label: 'Name', icon: FaUser },
    { value: 'admission_number', label: 'Admission Number', icon: FaIdCard },
    { value: 'student_id', label: 'Student ID', icon: FaUserGraduate },
    { value: 'parent_name', label: 'Parent Name', icon: FaHome },
    { value: 'parent_phone', label: 'Parent Phone', icon: FaPhone },
    { value: 'class', label: 'Class', icon: FaChalkboard },
    { value: 'house', label: 'House', icon: FaHome },
    { value: 'hostel', label: 'Hostel', icon: FaBed },
    { value: 'bus_route', label: 'Bus Route', icon: FaBus },
    { value: 'barcode', label: 'Barcode', icon: FaBarcode },
    { value: 'qr_code', label: 'QR Code', icon: FaCamera },
  ];

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedStudent(null);
  };

  const getStudentInitials = (student) => {
    return `${student.first_name?.charAt(0) || ''}${student.last_name?.charAt(0) || ''}`.toUpperCase();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'withdrawn':
        return 'bg-red-100 text-red-800';
      case 'graduated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Find Students</h1>
          <p className="text-gray-500 mt-1">Search for students by name, admission number, parent, class, and more</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => setShowScanner(!showScanner)}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaCamera />
            Scan QR/Barcode
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              showFilters ? 'bg-kora-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaFilter />
            Filters
            {showFilters ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary text-lg"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            {searchOptions.map(option => {
              const Icon = option.icon;
              return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              );
            })}
          </select>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary text-sm"
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setClassId('');
                setHouseId('');
                setHostelId('');
                setRouteId('');
              }}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="animate-spin text-3xl text-kora-primary" />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaUserGraduate className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm ? 'No students found' : 'Start typing to search'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try a different name, admission number, or parent name'
              : 'Search by name, admission number, parent phone, class, and more'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              onClick={() => handleStudentClick(student)}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-kora-primary/10 flex items-center justify-center text-kora-primary font-bold text-lg flex-shrink-0">
                  {getStudentInitials(student)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate">
                    {student.first_name} {student.last_name}
                  </h4>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <FaIdCard className="text-xs" />
                    {student.admission_number}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <FaGraduationCap className="text-gray-400" />
                  {student.classes?.name || 'No Class'}
                </p>
                <p className="flex items-center gap-2">
                  <FaMapMarker className="text-gray-400" />
                  {student.campuses?.name || 'No Campus'}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(student.student_status)}`}>
                    {student.student_status || 'active'}
                  </span>
                  {student.house && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {student.house}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Student Details</h3>
                <p className="text-sm text-gray-500">{selectedStudent.admission_number}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-kora-primary/10 flex items-center justify-center text-kora-primary text-2xl font-bold">
                  {getStudentInitials(selectedStudent)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h2>
                  <p className="text-gray-500">{selectedStudent.gender} • {selectedStudent.age} years</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium">{selectedStudent.classes?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Campus</p>
                  <p className="font-medium">{selectedStudent.campuses?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">House</p>
                  <p className="font-medium">{selectedStudent.house || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium capitalize">{selectedStudent.student_status || 'active'}</p>
                </div>
                {selectedStudent.email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedStudent.email}</p>
                  </div>
                )}
                {selectedStudent.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedStudent.phone}</p>
                  </div>
                )}
              </div>

              {/* Parents */}
              {selectedStudent.parents?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-800 mb-3">Parents / Guardians</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedStudent.parents.map((parentLink, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3">
                        <p className="font-medium text-gray-800">
                          {parentLink.parents?.first_name} {parentLink.parents?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{parentLink.relationship}</p>
                        {parentLink.parents?.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <FaPhone className="text-xs" /> {parentLink.parents.phone}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate(`/school/students/${selectedStudent.id}/edit`)}
                  className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary"
                >
                  Edit Student
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Scan QR / Barcode</h3>
              <button onClick={() => setShowScanner(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>
            <div className="text-center py-8">
              <FaCamera className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Camera integration coming soon</p>
              <p className="text-xs text-gray-400 mt-2">Use the search bar to enter barcode/QR code manually</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSearch;