import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaMapMarker,
  FaGlobe,
  FaUserGraduate,
  FaBook,
  FaClipboardList,
  FaFileUpload,
  FaUpload,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaPlus,
  FaTrash,
  FaUserFriends,
  FaHeart,
  FaIdCard,
  FaBirthdayCake,
  FaFlag,
  FaVenusMars,
  FaHome,
  FaUniversity,
} from 'react-icons/fa';

const StudentRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const [newParent, setNewParent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: 'guardian',
    address: '',
    occupation: '',
    employer: '',
    isPrimaryContact: false
  });

  const [formData, setFormData] = useState({
    // Personal Details
    firstName: '',
    middleName: '',
    lastName: '',
      studentEmail: '',      
  studentPassword: '' ,   
    gender: 'male',
    dateOfBirth: '',
    nationality: 'Nigeria',
    stateOfOrigin: '',
    localGovernment: '',
    religion: '',
    bloodGroup: '',
    genotype: '',
    previousSchool: '',
    transferStatus: 'none',
    // Academic Information
    admissionSession: '',
    admissionTerm: '',
    currentSession: '',
    classId: '',
    currentArm: '',
    studentStatus: 'active',
    boardingStatus: 'day',
    house: '',
    club: '',
    sport: '',
    electiveSubjects: [],
    // Medical Information
    medicalConditions: '',
    allergies: '',
    disabilities: '',
    medications: '',
    doctorName: '',
    hospital: '',
    emergencyInstructions: ''
  });
  const isSubmittingRef = useRef(false);

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/classes`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/subjects`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch existing parents
  const { data: parentsData } = useQuery({
    queryKey: ['parents', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/parents/schools/${user?.schoolId}/parents`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const existingParents = parentsData?.data || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const normalizeParent = (parent) => ({
    id: parent?.id ?? parent?.parent_id ?? `${(parent?.firstName || parent?.first_name || 'parent')}-${(parent?.phone || parent?.last_name || Date.now())}-${Math.random()}`,
    firstName: parent?.firstName ?? parent?.first_name ?? '',
    lastName: parent?.lastName ?? parent?.last_name ?? '',
    email: parent?.email ?? '',
    phone: parent?.phone ?? '',
    relationship: parent?.relationship ?? 'guardian',
    address: parent?.address ?? '',
    occupation: parent?.occupation ?? '',
    employer: parent?.employer ?? '',
    isPrimaryContact: Boolean(parent?.isPrimaryContact ?? parent?.is_primary_contact ?? false),
  });

  const getParentKey = (parent) => {
    const normalized = normalizeParent(parent);
    if (normalized.id) return `id:${normalized.id}`;
    return `name:${normalized.firstName}:${normalized.lastName}:${normalized.phone}`;
  };

  const handleAddParent = () => {
    if (!newParent.firstName || !newParent.lastName || !newParent.phone) {
      toast.error('Please fill in parent name and phone');
      return;
    }

    const parentToAdd = normalizeParent({
      ...newParent,
      id: `new-${Date.now()}-${Math.random()}`
    });

    setParents(prev => {
      const exists = prev.some(p => getParentKey(p) === getParentKey(parentToAdd));
      if (exists) return prev;
      return [...prev, parentToAdd];
    });

    setNewParent({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      relationship: 'guardian',
      address: '',
      occupation: '',
      employer: '',
      isPrimaryContact: false
    });
  };

  const handleRemoveParent = (index) => {
    setParents(parents.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      file: file,
      category: 'other',
      fileSize: file.size,
      fileType: file.type
    }));
    setDocuments(prev => [...prev, ...newDocs]);
  };

  const handleRemoveDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      // If FormData (multipart), send as multipart; do NOT force Content-Type header
      if (data instanceof FormData) {
        console.log('registerMutation: sending multipart FormData', { files: data.getAll('files')?.length });
        // Let the browser set Content-Type with boundary by removing any Content-Type header
        const response = await api.post(`/student-registration/schools/${user?.schoolId}/students/register`, data, {
          headers: { 'Content-Type': undefined }
        });
        return response.data;
      }

      const response = await api.post(`/student-registration/schools/${user?.schoolId}/students/register`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setLoading(false);
      isSubmittingRef.current = false;
      toast.success('Student registered successfully!');
      queryClient.invalidateQueries(['students', user?.schoolId]);
      navigate('/school/students');
    },
    onError: (error) => {
      setLoading(false);
      isSubmittingRef.current = false;
      toast.error(error.response?.data?.message || 'Failed to register student');
    }
  });

  const handleSubmit = () => {
    console.log('handleSubmit called', { formData, parents, documents });
    if (isSubmittingRef.current) {
      console.log('Submission already in progress, ignoring duplicate click');
      return;
    }
    isSubmittingRef.current = true;
    setLoading(true);
    // Client-side age validation
    const calculateAge = (dob) => {
      if (!dob) return null;
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    };

    const age = calculateAge(formData.dateOfBirth);
    console.log('Calculated age:', age);
    if (age === null || Number.isNaN(age)) {
      setErrors(prev => ({ ...prev, dateOfBirth: 'Please provide a valid date of birth' }));
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }
    if (age < 3) {
      setErrors(prev => ({ ...prev, dateOfBirth: 'Student age must be between 3 and 25 years' }));
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    const dobISO = (() => {
      try {
        const d = new Date(formData.dateOfBirth);
        if (Number.isNaN(d.getTime())) return formData.dateOfBirth;
        return d.toISOString().slice(0, 10);
      } catch (e) {
        return formData.dateOfBirth;
      }
    })();

    const submitData = {
      ...formData,
      dateOfBirth: dobISO,
       studentEmail: formData.studentEmail,    // ← ADD THIS
  studentPassword: formData.studentPassword,  // ← ADD THIS
      parents: parents.map(p => ({
        id: p.id || null,
        firstName: p.firstName || p.first_name || '',
        lastName: p.lastName || p.last_name || '',
        email: p.email || '',
        phone: p.phone || '',
        relationship: p.relationship || 'guardian',
        address: p.address || '',
        occupation: p.occupation || '',
        employer: p.employer || '',
        isPrimaryContact: !!p.isPrimaryContact,
      })),
      // documents will be uploaded separately after creating the student
    };

    // include computed age for backend convenience
    submitData.age = age;
    // clear field errors and submit
    setErrors({});

    // Build FormData for single multipart request (form fields + files)
    let form;
    try {
      console.log('Submitting submitData preview', submitData);
      form = new FormData();
      Object.entries(submitData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === 'object') {
          try {
            form.append(key, JSON.stringify(value));
          } catch (jsonErr) {
            console.error('Failed to stringify field', key, jsonErr);
            form.append(key, String(value));
          }
        } else {
          form.append(key, String(value));
        }
      });

      console.log('FormData built, appending files count:', documents.length);
      // Append files
      documents.forEach((doc) => {
        if (doc && doc.file) {
          form.append('files', doc.file, doc.name || doc.file.name);
        }
      });
    } catch (err) {
      console.error('Error building FormData:', err);
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    try {
      console.log('About to call registerMutation.mutate', { filesCount: documents.length });
      registerMutation.mutate(form);
      console.log('registerMutation.mutate called');
    } catch (err) {
      console.error('Mutate error:', err);
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleNextStep = () => {
    // basic validation for step 1 required fields (inline errors)
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      if (dob > new Date()) newErrors.dateOfBirth = 'Date of birth cannot be in the future';
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep(prev => prev + 1);
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => Math.max(1, prev - 1));

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Personal Details</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
          {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
          {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Student Email (for login)
    </label>
    <input
      type="email"
      name="studentEmail"
      value={formData.studentEmail}
      onChange={handleChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
      placeholder="student@example.com"
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Student Password (for login)
    </label>
    <input
      type="text"
      name="studentPassword"
      value={formData.studentPassword}
      onChange={handleChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
      placeholder="Temporary password"
    />
  </div>
</div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
          {errors.dateOfBirth && <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            placeholder="Nigeria"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State of Origin</label>
          <input
            type="text"
            name="stateOfOrigin"
            value={formData.stateOfOrigin}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Local Government Area</label>
          <input
            type="text"
            name="localGovernment"
            value={formData.localGovernment}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Religion (Optional)</label>
          <input
            type="text"
            name="religion"
            value={formData.religion}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
          <select
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="">Select</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Genotype (Optional)</label>
        <input
          type="text"
          name="genotype"
          value={formData.genotype}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          placeholder="e.g., AA, AS, SS"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Previous School</label>
        <input
          type="text"
          name="previousSchool"
          value={formData.previousSchool}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Status</label>
        <select
          name="transferStatus"
          value={formData.transferStatus}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
        >
          <option value="none">None</option>
          <option value="internal">Internal Transfer</option>
          <option value="external">External Transfer</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleNextStep}
          className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          disabled={!formData.firstName.trim() || !formData.lastName.trim() || !formData.dateOfBirth}
        >
          Next <FaArrowRight />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Academic Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admission Session</label>
          <input
            type="text"
            name="admissionSession"
            value={formData.admissionSession}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            placeholder="e.g., 2025/2026"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admission Term</label>
          <input
            type="text"
            name="admissionTerm"
            value={formData.admissionTerm}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            placeholder="e.g., First Term"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Class *</label>
          <select
            name="classId"
            value={formData.classId}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Arm</label>
          <input
            type="text"
            name="currentArm"
            value={formData.currentArm}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            placeholder="e.g., A, B, C"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Student Status</label>
          <select
            name="studentStatus"
            value={formData.studentStatus}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="suspended">Suspended</option>
            <option value="deceased">Deceased</option>
            <option value="transferred">Transferred</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boarding Status</label>
          <select
            name="boardingStatus"
            value={formData.boardingStatus}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="day">Day Student</option>
            <option value="boarding">Boarding Student</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">House</label>
          <input
            type="text"
            name="house"
            value={formData.house}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            placeholder="e.g., Blue House"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
          <input
            type="text"
            name="club"
            value={formData.club}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
          <input
            type="text"
            name="sport"
            value={formData.sport}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Elective Subjects</label>
          <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
            {subjects.map(subject => (
              <label key={subject.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.electiveSubjects.includes(subject.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      electiveSubjects: checked
                        ? [...prev.electiveSubjects, subject.id]
                        : prev.electiveSubjects.filter(id => id !== subject.id)
                    }));
                  }}
                  className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                />
                <span className="text-sm text-gray-700">{subject.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <FaArrowLeft /> Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          disabled={!formData.classId}
        >
          Next <FaArrowRight />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Medical Information</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
        <textarea
          name="medicalConditions"
          value={formData.medicalConditions}
          onChange={handleChange}
          rows="2"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          placeholder="Any existing medical conditions..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
        <textarea
          name="allergies"
          value={formData.allergies}
          onChange={handleChange}
          rows="2"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          placeholder="Any allergies..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Disabilities</label>
        <textarea
          name="disabilities"
          value={formData.disabilities}
          onChange={handleChange}
          rows="2"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          placeholder="Any disabilities..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Medications</label>
        <textarea
          name="medications"
          value={formData.medications}
          onChange={handleChange}
          rows="2"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          placeholder="Current medications..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor's Name</label>
          <input
            type="text"
            name="doctorName"
            value={formData.doctorName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
          <input
            type="text"
            name="hospital"
            value={formData.hospital}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Instructions</label>
        <textarea
          name="emergencyInstructions"
          value={formData.emergencyInstructions}
          onChange={handleChange}
          rows="2"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          placeholder="Special instructions for emergencies..."
        />
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <FaArrowLeft /> Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          Next <FaArrowRight />
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Parent / Guardian Details</h3>

      {/* Existing Parents */}
      {existingParents.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Existing Parents</label>
          <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
            {existingParents.map(parent => (
              <label key={parent.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parents.some(p => getParentKey(p) === getParentKey(parent))}
                  onChange={() => {
                    const selectedParent = normalizeParent(parent);

                    setParents(prev => {
                      const matchKey = getParentKey(selectedParent);
                      const exists = prev.some(p => getParentKey(p) === matchKey);

                      if (exists) {
                        return prev.filter(p => getParentKey(p) !== matchKey);
                      }

                      return [...prev, selectedParent];
                    });
                  }}
                  className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                />
                <span className="text-sm text-gray-700">
                  {parent.first_name} {parent.last_name} ({parent.relationship})
                </span>
                <span className="text-xs text-gray-400">{parent.phone}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Add New Parent */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-3">Add New Parent</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <input
              type="text"
              placeholder="First Name *"
              value={newParent.firstName}
              onChange={(e) => setNewParent({ ...newParent, firstName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Last Name *"
              value={newParent.lastName}
              onChange={(e) => setNewParent({ ...newParent, lastName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Phone *"
              value={newParent.phone}
              onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Email"
              value={newParent.email}
              onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            />
          </div>
          <div>
            <select
              value={newParent.relationship}
              onChange={(e) => setNewParent({ ...newParent, relationship: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Occupation"
              value={newParent.occupation}
              onChange={(e) => setNewParent({ ...newParent, occupation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            />
          </div>
        </div>
        <div className="mt-3">
          <input
            type="text"
            placeholder="Address"
            value={newParent.address}
            onChange={(e) => setNewParent({ ...newParent, address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newParent.isPrimaryContact}
              onChange={(e) => setNewParent({ ...newParent, isPrimaryContact: e.target.checked })}
              className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
            />
            <span className="text-sm text-gray-700">Primary Contact</span>
          </label>
          <button
            type="button"
            onClick={handleAddParent}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaPlus /> Add Parent
          </button>
        </div>
      </div>

      {/* Added Parents List */}
      {parents.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Added Parents ({parents.length})</h4>
          {parents.map((parent, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-1">
              <div>
                <span className="font-medium">{parent.firstName} {parent.lastName}</span>
                <span className="text-sm text-gray-500 ml-2">{parent.relationship}</span>
                <span className="text-sm text-gray-400 ml-2">{parent.phone}</span>
                {parent.isPrimaryContact && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full ml-2">Primary</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveParent(index)}
                className="text-red-500 hover:text-red-600"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <FaArrowLeft /> Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          Next <FaArrowRight />
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Documents</h3>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <FaUpload className="text-4xl text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">Upload documents (PDF, Word, Images)</p>
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="mt-2 px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary"
        >
          Select Files
        </button>
      </div>

      {documents.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Uploaded Documents ({documents.length})</h4>
          {documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-1">
              <div className="flex items-center gap-3">
                <FaFileUpload className="text-kora-primary" />
                <span className="text-sm">{doc.name}</span>
                <span className="text-xs text-gray-400">{(doc.fileSize / 1024).toFixed(1)} KB</span>
                <select
                  value={doc.category}
                  onChange={(e) => {
                    const newDocs = [...documents];
                    newDocs[index].category = e.target.value;
                    setDocuments(newDocs);
                  }}
                  className="text-xs px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="birth_certificate">Birth Certificate</option>
                  <option value="previous_results">Previous Results</option>
                  <option value="transfer_letter">Transfer Letter</option>
                  <option value="admission_letter">Admission Letter</option>
                  <option value="passport">Passport</option>
                  <option value="parent_id">Parent ID</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDocument(index)}
                className="text-red-500 hover:text-red-600"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <FaArrowLeft /> Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || registerMutation.isLoading}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
        >
          {loading || registerMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
          Register Student
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Registration</h1>
        <p className="text-gray-500 mt-1">Register a new student with complete details</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {['Personal', 'Academic', 'Medical', 'Parents', 'Documents'].map((label, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step > index ? 'bg-green-500' : step === index + 1 ? 'bg-kora-primary' : 'bg-gray-300'} text-white text-sm font-medium`}>
              {step > index ? <FaCheck /> : index + 1}
            </div>
            <span className={`ml-2 text-sm ${step >= index + 1 ? 'text-gray-700' : 'text-gray-400'}`}>
              {label}
            </span>
            {index < 4 && <div className={`w-12 h-0.5 mx-2 ${step > index ? 'bg-green-500' : 'bg-gray-300'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
};

export default StudentRegistration;