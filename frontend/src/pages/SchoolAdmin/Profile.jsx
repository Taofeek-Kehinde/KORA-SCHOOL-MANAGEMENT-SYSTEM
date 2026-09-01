import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarker,
  FaUser,
  FaSchool,
  FaLink,
  FaUserTie,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaImage,
  FaUpload,
  FaSave,
  FaSpinner,
  FaEdit,
  FaPlus,
  FaTrash,
  FaCheck,
  FaTimes,
  FaEye,
  FaLocationArrow,
  FaMapPin,
  FaClock,
  FaMoneyBillWave,
  FaFileUpload,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaPalette,
  FaUsers,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUniversity,
  FaCalendarAlt,
  FaCalendarTimes,
} from 'react-icons/fa';

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [campuses, setCampuses] = useState([]);
  const [newCampus, setNewCampus] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    principalName: '',
    isMain: false
  });
  const [socialMedia, setSocialMedia] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    linkedin: ''
  });
  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [academicCalendar, setAcademicCalendar] = useState({
    startDate: '',
    endDate: '',
    holidays: [],
    events: []
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    schoolType: '',
    registrationNumber: '',
    principalName: '',
    vicePrincipalName: '',
    motto: '',
    vision: '',
    mission: '',
    anthem: '',
    schoolColours: { primary: '#4F46E5', secondary: '#7C3AED', accent: '#10B981' },
    signature: '',
    reportCardDesign: { template: 'default', showLogo: true, showMotto: true },
    socialMedia: {},
    gpsLocation: { lat: '', lng: '' },
    academicSession: '',
    currentTerm: '',
    timezone: 'Africa/Lagos',
    currency: 'NGN',
    whiteLabel: {
      customDomain: '',
      customLogo: '',
      customColours: { primary: '', secondary: '' },
      customLoginPage: false
    }
  });

  // Fetch school profile - FIXED: use profileData instead of data
  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['schoolProfile', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) return { data: {} };
      const response = await api.get(`/profile/schools/${user?.schoolId}/profile`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch school stats
  const { data: statsData } = useQuery({
    queryKey: ['schoolStats', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) return { data: {} };
      const response = await api.get(`/profile/schools/${user?.schoolId}/stats`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  useEffect(() => {
    if (profileData?.data) {
      const school = profileData.data;
      setFormData({
        name: school.name || '',
        email: school.email || '',
        phone: school.phone || '',
        address: school.address || '',
        website: school.website || '',
        schoolType: school.school_type || '',
        registrationNumber: school.registration_number || '',
        principalName: school.principal_name || '',
        vicePrincipalName: school.vice_principal_name || '',
        motto: school.motto || '',
        vision: school.vision || '',
        mission: school.mission || '',
        anthem: school.anthem || '',
        schoolColours: school.school_colours || { primary: '#4F46E5', secondary: '#7C3AED', accent: '#10B981' },
        signature: school.signature_url || '',
        reportCardDesign: school.report_card_design || { template: 'default', showLogo: true, showMotto: true },
        socialMedia: school.social_media || {},
        gpsLocation: school.gps_location || { lat: '', lng: '' },
        academicSession: school.academic_session || '',
        currentTerm: school.current_term || '',
        timezone: school.timezone || 'Africa/Lagos',
        currency: school.currency || 'NGN',
        whiteLabel: school.white_label_config || { customDomain: '', customLogo: '', customColours: {}, customLoginPage: false }
      });
      setLogoPreview(school.logo_url);
      setCampuses(school.campuses || []);
      setDocuments(school.documents || []);
      setSocialMedia(school.social_media || {});
      setAcademicCalendar({
        startDate: school.academic_calendar?.startDate || '',
        endDate: school.academic_calendar?.endDate || '',
        holidays: school.academic_calendar?.holidays || [],
        events: school.academic_calendar?.events || []
      });
    }
  }, [profileData]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/profile/schools/${user?.schoolId}/profile`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('School profile updated successfully');
      queryClient.invalidateQueries(['schoolProfile', user?.schoolId]);
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('category', data.category);
      formData.append('description', data.description || '');
      formData.append('file', data.file);
      
      const response = await api.post(`/profile/schools/${user?.schoolId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries(['schoolProfile', user?.schoolId]);
      setNewDocument(null);
      setDocFile(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    }
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId) => {
      const response = await api.delete(`/profile/schools/${user?.schoolId}/documents/${documentId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries(['schoolProfile', user?.schoolId]);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleColourChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      schoolColours: { ...prev.schoolColours, [name]: value }
    }));
  };

  const handleSocialMediaChange = (e) => {
    const { name, value } = e.target;
    setSocialMedia(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocFile(file);
      setNewDocument({
        name: file.name,
        category: 'school_document',
        description: '',
        file: file
      });
    }
  };

  const handleAddCampus = () => {
    if (!newCampus.name) {
      toast.error('Campus name is required');
      return;
    }
    setCampuses(prev => [...prev, { ...newCampus, isMain: prev.length === 0 }]);
    setNewCampus({ name: '', address: '', phone: '', email: '', principalName: '', isMain: false });
  };

  const handleRemoveCampus = (index) => {
    setCampuses(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetMainCampus = (index) => {
    setCampuses(prev => prev.map((c, i) => ({ ...c, isMain: i === index })));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          gpsLocation: {
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString()
          }
        }));
        setShowMap(true);
        toast.success('Location captured successfully');
        setGpsLoading(false);
      },
      (error) => {
        console.error('GPS Error:', error);
        toast.error('Failed to get location. Please enter manually.');
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      socialMedia: socialMedia,
      campuses: campuses,
      documents: documents,
      logo: logoFile ? logoPreview : undefined,
    };

    updateProfileMutation.mutate(submitData);
  };

  const handleUploadDocument = () => {
    if (!newDocument || !docFile) {
      toast.error('Please select a file');
      return;
    }
    uploadDocumentMutation.mutate(newDocument);
  };

  const handleDeleteDocument = (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const school = profileData?.data || {};
  const stats = statsData?.data || {};
  const isLoadingProfile = isLoading || updateProfileMutation.isLoading;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FaBuilding },
    { id: 'identity', label: 'Identity', icon: FaSchool },
    { id: 'branding', label: 'Branding', icon: FaPalette },
    { id: 'academic', label: 'Academic', icon: FaCalendarAlt },
    { id: 'social', label: 'Social Media', icon: FaLink },
    { id: 'location', label: 'Location', icon: FaMapMarker },
    { id: 'campuses', label: 'Campuses', icon: FaUniversity },
    { id: 'documents', label: 'Documents', icon: FaFileUpload },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kora-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">School Profile</h1>
          <p className="text-gray-500 mt-1">Manage your school's information and branding</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
            >
              <FaEdit />
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  refetch();
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={updateProfileMutation.isLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                {updateProfileMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <FaUserGraduate className="text-kora-primary text-2xl mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{stats.students || 0}</p>
          <p className="text-xs text-gray-500">Students</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <FaChalkboardTeacher className="text-kora-primary text-2xl mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{stats.teachers || 0}</p>
          <p className="text-xs text-gray-500">Teachers</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <FaBuilding className="text-kora-primary text-2xl mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{stats.classes || 0}</p>
          <p className="text-xs text-gray-500">Classes</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <FaUsers className="text-kora-primary text-2xl mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{stats.parents || 0}</p>
          <p className="text-xs text-gray-500">Parents</p>
        </div>
      </div>

      {/* Tabs - Keep the existing JSX for tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-kora-primary text-kora-primary font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="text-sm" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="https://www.yourschool.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Type</label>
                  <select
                    name="schoolType"
                    value={formData.schoolType}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                  >
                    <option value="">Select Type</option>
                    <option value="nursery">Nursery School</option>
                    <option value="primary">Primary School</option>
                    <option value="junior_secondary">Junior Secondary School</option>
                    <option value="senior_secondary">Senior Secondary School</option>
                    <option value="combined">Combined Primary & Secondary</option>
                    <option value="faith_based">Faith-Based School</option>
                    <option value="international">International School</option>
                    <option value="government">Government School</option>
                    <option value="private">Private School</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="RC123456"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows="2"
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="123 Education Street, City, State"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Identity Tab */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Principal Name</label>
                  <input
                    type="text"
                    name="principalName"
                    value={formData.principalName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="Dr. John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vice Principal Name</label>
                  <input
                    type="text"
                    name="vicePrincipalName"
                    value={formData.vicePrincipalName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="Mrs. Jane Doe"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Motto</label>
                  <input
                    type="text"
                    name="motto"
                    value={formData.motto}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="Excellence in Education"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vision</label>
                  <textarea
                    name="vision"
                    value={formData.vision}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows="2"
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="Our vision for the school..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mission</label>
                  <textarea
                    name="mission"
                    value={formData.mission}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows="2"
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="Our mission statement..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Anthem</label>
                  <textarea
                    name="anthem"
                    value={formData.anthem}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows="4"
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="School anthem lyrics..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => isEditing && fileInputRef.current.click()}
                    className={`w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${isEditing ? 'cursor-pointer hover:border-kora-primary' : ''} transition-colors`}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="School Logo" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <div className="text-center text-gray-400">
                        <FaUpload className="text-3xl mx-auto" />
                        <span className="text-xs">Upload Logo</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={!isEditing}
                  />
                  <div className="text-sm text-gray-500">
                    <p>Recommended: Square image (500x500)</p>
                    <p>Max size: 2MB</p>
                    <p>Formats: JPG, PNG, SVG</p>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Colour</label>
                    <input
                      type="color"
                      name="primary"
                      value={formData.schoolColours?.primary || '#4F46E5'}
                      onChange={handleColourChange}
                      disabled={!isEditing}
                      className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Colour</label>
                    <input
                      type="color"
                      name="secondary"
                      value={formData.schoolColours?.secondary || '#7C3AED'}
                      onChange={handleColourChange}
                      disabled={!isEditing}
                      className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accent Colour</label>
                    <input
                      type="color"
                      name="accent"
                      value={formData.schoolColours?.accent || '#10B981'}
                      onChange={handleColourChange}
                      disabled={!isEditing}
                      className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Signature URL</label>
                    <input
                      type="text"
                      name="signature"
                      value={formData.signature}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="Signature image URL"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Report Card Design</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                    <select
                      name="template"
                      value={formData.reportCardDesign?.template || 'default'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reportCardDesign: { ...prev.reportCardDesign, template: e.target.value }
                      }))}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    >
                      <option value="default">Default</option>
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.reportCardDesign?.showLogo !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reportCardDesign: { ...prev.reportCardDesign, showLogo: e.target.checked }
                        }))}
                        disabled={!isEditing}
                        className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                      />
                      <span className="text-sm text-gray-700">Show Logo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.reportCardDesign?.showMotto !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reportCardDesign: { ...prev.reportCardDesign, showMotto: e.target.checked }
                        }))}
                        disabled={!isEditing}
                        className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                      />
                      <span className="text-sm text-gray-700">Show Motto</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Tab */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session</label>
                  <input
                    type="text"
                    name="academicSession"
                    value={formData.academicSession}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="e.g., 2025/2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Term</label>
                  <select
                    name="currentTerm"
                    value={formData.currentTerm}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                  >
                    <option value="">Select Term</option>
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaCalendarAlt className="inline mr-1" />
                    Academic Calendar Start
                  </label>
                  <input
                    type="date"
                    value={academicCalendar.startDate}
                    onChange={(e) => setAcademicCalendar(prev => ({ ...prev, startDate: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaCalendarTimes className="inline mr-1" />
                    Academic Calendar End
                  </label>
                  <input
                    type="date"
                    value={academicCalendar.endDate}
                    onChange={(e) => setAcademicCalendar(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaCalendarAlt className="text-kora-primary" />
                    Term Holidays & Events
                  </h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Holiday/Event Name"
                        id="eventName"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                      />
                      <input
                        type="date"
                        id="eventDate"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const name = document.getElementById('eventName').value;
                          const date = document.getElementById('eventDate').value;
                          if (name && date) {
                            setAcademicCalendar(prev => ({
                              ...prev,
                              events: [...(prev.events || []), { name, date, type: 'event' }]
                            }));
                            document.getElementById('eventName').value = '';
                            document.getElementById('eventDate').value = '';
                          }
                        }}
                        className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary"
                      >
                        Add Event
                      </button>
                    </div>
                  </div>
                  {academicCalendar.events && academicCalendar.events.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {academicCalendar.events.map((event, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{event.name}</span>
                            <span className="text-sm text-gray-500 ml-2">{event.date}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAcademicCalendar(prev => ({
                              ...prev,
                              events: prev.events.filter((_, i) => i !== index)
                            }))}
                            className="text-red-500 hover:text-red-600"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaFacebook className="text-blue-600" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={socialMedia.facebook || ''}
                    onChange={handleSocialMediaChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="https://facebook.com/your-school"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaTwitter className="text-blue-400" />
                    Twitter / X
                  </label>
                  <input
                    type="url"
                    name="twitter"
                    value={socialMedia.twitter || ''}
                    onChange={handleSocialMediaChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="https://twitter.com/your-school"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaInstagram className="text-pink-600" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={socialMedia.instagram || ''}
                    onChange={handleSocialMediaChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="https://instagram.com/your-school"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaYoutube className="text-red-600" />
                    YouTube
                  </label>
                  <input
                    type="url"
                    name="youtube"
                    value={socialMedia.youtube || ''}
                    onChange={handleSocialMediaChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="https://youtube.com/your-school"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaLink className="text-gray-500" />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={socialMedia.linkedin || ''}
                    onChange={handleSocialMediaChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="https://linkedin.com/company/your-school"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={!isEditing || gpsLoading}
                  className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
                >
                  {gpsLoading ? <FaSpinner className="animate-spin" /> : <FaLocationArrow />}
                  {gpsLoading ? 'Getting Location...' : 'Get Current Location'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  disabled={!isEditing}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <FaMapPin />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </button>
                <span className="text-xs text-gray-400">
                  {formData.gpsLocation?.lat && formData.gpsLocation?.lng 
                    ? 'Location captured' 
                    : 'No location set'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={formData.gpsLocation?.lat || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      gpsLocation: { ...prev.gpsLocation, lat: e.target.value }
                    }))}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="6.5244"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={formData.gpsLocation?.lng || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      gpsLocation: { ...prev.gpsLocation, lng: e.target.value }
                    }))}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="3.3792"
                  />
                </div>
              </div>

              {showMap && formData.gpsLocation?.lat && formData.gpsLocation?.lng && (
                <div className="mt-4 rounded-lg overflow-hidden border border-gray-300 h-64 relative">
                  <iframe
                    title="School Location"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(formData.gpsLocation.lng) - 0.01}%2C${parseFloat(formData.gpsLocation.lat) - 0.01}%2C${parseFloat(formData.gpsLocation.lng) + 0.01}%2C${parseFloat(formData.gpsLocation.lat) + 0.01}&layer=mapnik&marker=${formData.gpsLocation.lat}%2C${formData.gpsLocation.lng}`}
                    allowFullScreen
                  />
                  <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded-lg text-xs text-gray-600 flex items-center gap-2">
                    <FaMapPin className="text-red-500" />
                    {formData.gpsLocation.lat}, {formData.gpsLocation.lng}
                  </div>
                </div>
              )}

              {!formData.gpsLocation?.lat && !formData.gpsLocation?.lng && (
                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-400 text-sm">
                  <FaMapMarker className="text-2xl mx-auto mb-2 text-gray-300" />
                  No location set. Click "Get Current Location" or enter coordinates manually.
                </div>
              )}
            </div>
          )}

          {/* Campuses Tab */}
          {activeTab === 'campuses' && (
            <div className="space-y-6">
              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Campus Name *"
                    value={newCampus.name}
                    onChange={(e) => setNewCampus(prev => ({ ...prev, name: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newCampus.address}
                    onChange={(e) => setNewCampus(prev => ({ ...prev, address: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={newCampus.phone}
                    onChange={(e) => setNewCampus(prev => ({ ...prev, phone: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddCampus}
                    className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center justify-center gap-2"
                  >
                    <FaPlus />
                    Add Campus
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {campuses.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">
                    No campuses added yet. Click "Add Campus" to create one.
                  </p>
                ) : (
                  campuses.map((campus, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{campus.name}</p>
                          {campus.isMain && (
                            <span className="text-xs bg-kora-primary/10 text-kora-primary px-2 py-0.5 rounded-full font-medium">
                              Main Campus
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{campus.address}</p>
                        <p className="text-sm text-gray-500">{campus.phone}</p>
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetMainCampus(index)}
                            className="text-blue-500 hover:text-blue-600 text-sm"
                            title="Set as Main Campus"
                          >
                            <FaCheck />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCampus(index)}
                            className="text-red-500 hover:text-red-600"
                            title="Remove Campus"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {isEditing && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={docInputRef}
                    type="file"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => docInputRef.current.click()}
                      className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
                    >
                      <FaUpload />
                      Select File
                    </button>
                    {newDocument && (
                      <span className="text-sm text-gray-600">
                        {newDocument.name}
                      </span>
                    )}
                    <select
                      value={newDocument?.category || 'school_document'}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, category: e.target.value }))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    >
                      <option value="school_document">General</option>
                      <option value="policy">Policy Document</option>
                      <option value="curriculum">Curriculum</option>
                      <option value="financial">Financial Report</option>
                      <option value="staff">Staff Document</option>
                      <option value="student">Student Document</option>
                      <option value="other">Other</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleUploadDocument}
                      disabled={!newDocument || uploadDocumentMutation.isLoading}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploadDocumentMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                      Upload
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Supported: PDF, Word, Excel, Images (Max: 10MB)
                  </p>
                </div>
              )}

              {documents.length > 0 && (
                <div className="space-y-4">
                  {['school_document', 'policy', 'curriculum', 'financial', 'staff', 'student', 'other'].map((category) => {
                    const filteredDocs = documents.filter(d => d.category === category);
                    if (filteredDocs.length === 0) return null;
                    
                    const categoryLabels = {
                      school_document: 'General Documents',
                      policy: 'Policy Documents',
                      curriculum: 'Curriculum',
                      financial: 'Financial Reports',
                      staff: 'Staff Documents',
                      student: 'Student Documents',
                      other: 'Other Documents'
                    };

                    return (
                      <div key={category}>
                        <h4 className="font-medium text-gray-700 mb-2">{categoryLabels[category]}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filteredDocs.map((doc) => (
                            <div key={doc.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  {doc.file_type?.includes('pdf') ? (
                                    <FaFilePdf className="text-red-500 text-2xl" />
                                  ) : doc.file_type?.includes('image') ? (
                                    <FaFileImage className="text-blue-500 text-2xl" />
                                  ) : (
                                    <FaFileAlt className="text-gray-500 text-2xl" />
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-800 text-sm">{doc.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.uploaded_at).toLocaleDateString()}
                                    </p>
                                    <a
                                      href={doc.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-kora-primary hover:underline flex items-center gap-1"
                                    >
                                      <FaEye className="text-xs" />
                                      View
                                    </a>
                                  </div>
                                </div>
                                {isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    disabled={deleteDocumentMutation.isLoading}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {documents.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">
                  No documents uploaded yet. Click "Select File" to upload.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;