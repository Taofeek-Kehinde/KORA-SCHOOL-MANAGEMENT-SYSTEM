import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import html2canvas from 'html2canvas';
import {
  FaSearch,
  FaPrint,
  FaDownload,
  FaIdCard,
  FaUser,
  FaGraduationCap,
  FaBuilding,
  FaPhone,
  FaBarcode,
  FaQrcode,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaPalette,
  FaImage,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

const IDCard = () => {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cardLayout, setCardLayout] = useState('horizontal');
  const [showSettings, setShowSettings] = useState(false);
  const printRef = useRef(null);

  // Fetch students for search
  const { data: studentsData } = useQuery({
    queryKey: ['students', user?.schoolId, searchTerm],
    queryFn: async () => {
      const response = await api.get(`/students/schools/${user?.schoolId}/students`, {
        params: { search: searchTerm || undefined, limit: 50 }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch ID card data
  const { data: cardData, isLoading, refetch } = useQuery({
    queryKey: ['idCardData', user?.schoolId, selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return { data: null };
      const response = await api.get(`/id-card/schools/${user?.schoolId}/data`, {
        params: { studentId: selectedStudentId }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!selectedStudentId,
  });

  // Fetch QR code
  const { data: qrData } = useQuery({
    queryKey: ['qrCode', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return { data: null };
      const response = await api.get(`/id-card/students/${selectedStudentId}/qrcode`);
      return response.data;
    },
    enabled: !!selectedStudentId,
  });

  const students = studentsData?.data || [];
  const card = cardData?.data;

  const buildExportMarkup = () => {
    if (!card) return '';

    const schoolName = card.school?.name || 'School';
    const schoolMotto = card.school?.motto || '';
    const student = card.student || {};
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
    const schoolLogo = card.school?.logo;
    const studentPhoto = student.photo;
    const qrImage = qrData?.data?.qr_code;

    const studentPhotoMarkup = studentPhoto
      ? `<img src="${studentPhoto}" alt="Student" style="width: 96px; height: 112px; object-fit: cover; border-radius: 12px; border: 2px solid #e5e7eb; background: #f3f4f6;" />`
      : `<div style="width: 96px; height: 112px; border-radius: 12px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 48px;">👤</div>`;

    const schoolLogoMarkup = schoolLogo
      ? `<img src="${schoolLogo}" alt="School Logo" style="width: 48px; height: 48px; border-radius: 999px; object-fit: contain; background: #ffffff; padding: 4px;" />`
      : `<div style="width: 48px; height: 48px; border-radius: 999px; background: #ffffff; display: flex; align-items: center; justify-content: center; color: #2563eb; font-weight: 700; font-size: 20px;">S</div>`;

    const emergencyContact = student.emergencyContact || {};
    const barcodeText = student.admissionNumber || 'ID';

    return `
      <div style="width: 420px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.12); font-family: Arial, sans-serif; color: #111827;">
        <div style="background: linear-gradient(90deg, #2563eb 0%, #4f46e5 100%); padding: 16px; display: flex; align-items: center; gap: 12px;">
          ${schoolLogoMarkup}
          <div>
            <div style="color: #ffffff; font-size: 18px; font-weight: 700; line-height: 1.2;">${schoolName}</div>
            <div style="color: rgba(255,255,255,0.8); font-size: 11px; font-style: italic; margin-top: 4px;">${schoolMotto}</div>
          </div>
        </div>

        <div style="display: flex; gap: 16px; padding: 16px; background: #ffffff;">
          <div>${studentPhotoMarkup}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 8px;">${fullName}</div>
            <div style="font-size: 13px; color: #4b5563; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span>🎓</span>
              <span>${student.class?.name || 'N/A'}</span>
            </div>
            <div style="font-size: 13px; color: #4b5563; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span>🆔</span>
              <span>${student.admissionNumber || 'N/A'}</span>
            </div>
            <div style="font-size: 12px; color: #6b7280;">${student.gender || 'N/A'} • ${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
            ${student.house ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">House: ${student.house}</div>` : ''}
            ${student.boardingStatus === 'boarding' ? `<div style="display: inline-block; background: #dbeafe; color: #1d4ed8; border-radius: 999px; font-size: 11px; padding: 4px 8px; margin-top: 8px;">Boarding</div>` : ''}
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 12px 16px;">
          <div style="background: #ffffff; border-radius: 8px; padding: 4px; display: flex; align-items: center; justify-content: center;">
            ${qrImage ? `<img src="${qrImage}" alt="QR Code" style="width: 56px; height: 56px; display: block;" />` : `<div style="width: 56px; height: 56px; background: #e5e7eb; border-radius: 8px;"></div>`}
          </div>

          <div style="text-align: center; flex: 1; margin: 0 12px;">
            <div style="font-family: monospace; font-size: 11px; color: #4b5563; letter-spacing: 1px;">${barcodeText}</div>
            <div style="height: 24px; width: 120px; margin: 6px auto 0; border-radius: 6px; background: linear-gradient(90deg, #d1d5db 0%, #e5e7eb 50%, #d1d5db 100%);"></div>
          </div>

          <div style="text-align: right; max-width: 128px;">
            <div style="font-size: 10px; color: #6b7280; margin-bottom: 2px;">Emergency Contact</div>
            ${emergencyContact.name ? `
              <div style="font-size: 12px; color: #111827; font-weight: 700;">${emergencyContact.name}</div>
              <div style="font-size: 11px; color: #4b5563; margin-top: 2px;">📞 ${emergencyContact.phone || 'N/A'}</div>
            ` : `<div style="font-size: 12px; color: #9ca3af;">N/A</div>`}
          </div>
        </div>
      </div>
    `;
  };

  const captureCard = async () => {
    if (!card) return null;

    const exportNode = document.createElement('div');
    exportNode.innerHTML = buildExportMarkup();
    exportNode.style.position = 'fixed';
    exportNode.style.left = '-9999px';
    exportNode.style.top = '-9999px';
    exportNode.style.zIndex = '999999';
    exportNode.style.pointerEvents = 'none';
    document.body.appendChild(exportNode);

    try {
      const canvas = await html2canvas(exportNode, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      return canvas;
    } finally {
      exportNode.remove();
    }
  };

  const handlePrint = async () => {
    try {
      const canvas = await captureCard();
      if (!canvas) {
        toast.error('No student card to print.');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow pop-ups to print the ID card.');
        return;
      }

      const imageUrl = canvas.toDataURL('image/png');
      printWindow.document.write(`
        <html>
          <head>
            <title>ID Card</title>
            <style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; background: #f3f4f6; }
              img { max-width: 100%; height: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" alt="Student ID Card" />
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.focus(), 250);
      setTimeout(() => printWindow.print(), 500);
    } catch (error) {
      console.error('Print failed:', error);
      toast.error('Unable to print ID card right now.');
    }
  };

  const handleDownload = async () => {
    try {
      const canvas = await captureCard();
      if (!canvas) {
        toast.error('No student card to download.');
        return;
      }

      const link = document.createElement('a');
      const fileName = `${card?.student?.firstName || 'student'}-${card?.student?.lastName || 'id-card'}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('ID card downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Unable to download ID card.');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student ID Card</h1>
          <p className="text-gray-500 mt-1">Generate and print student ID cards</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              showSettings ? 'bg-kora-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaPalette />
            Layout Settings
            {showSettings ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!selectedStudentId}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
          >
            <FaPrint />
            Print Card
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!selectedStudentId}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FaDownload />
            Download PNG
          </button>
        </div>
      </div>

      {/* Layout Settings */}
      {showSettings && (
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-3">Card Layout Settings</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={cardLayout === 'horizontal'}
                onChange={() => setCardLayout('horizontal')}
                className="w-4 h-4 text-kora-primary"
              />
              <span className="text-sm">Horizontal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={cardLayout === 'vertical'}
                onChange={() => setCardLayout('vertical')}
                className="w-4 h-4 text-kora-primary"
              />
              <span className="text-sm">Vertical</span>
            </label>
          </div>
        </div>
      )}

      {/* Student Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or admission number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
        {students.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                  selectedStudentId === student.id ? 'bg-kora-primary/10' : ''
                }`}
              >
                <div>
                  <p className="font-medium text-gray-800">{student.first_name} {student.last_name}</p>
                  <p className="text-xs text-gray-500">{student.admission_number} • {student.classes?.name}</p>
                </div>
                {selectedStudentId === student.id && <FaCheck className="text-green-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ID Card Preview */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="animate-spin text-3xl text-kora-primary" />
        </div>
      )}

      {!selectedStudentId && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaIdCard className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Student</h3>
          <p className="text-gray-500">Search and select a student to generate their ID card</p>
        </div>
      )}

      {card && (
        <div className="bg-white rounded-xl shadow-md p-8">
          <div ref={printRef}>
            {/* ID Card */}
            <div className="mx-auto max-w-md">
              <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex items-center gap-3">
                  {card.school.logo ? (
                    <img src={card.school.logo} alt="School Logo" className="w-12 h-12 rounded-full bg-white object-contain p-1" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                      <FaBuilding className="text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold text-lg">{card.school.name}</h3>
                    <p className="text-blue-100 text-xs italic">{card.school.motto}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="bg-white p-4 flex gap-4">
                  {/* Student Photo */}
                  {card.student.photo ? (
                    <img src={card.student.photo} alt="Student" className="w-24 h-28 rounded-lg object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-24 h-28 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FaUser className="text-gray-300 text-4xl" />
                    </div>
                  )}

                  {/* Student Info */}
                  <div className="flex-1">
                    <h4 className="text-gray-800 font-bold text-lg">
                      {card.student.firstName} {card.student.lastName}
                    </h4>
                    <div className="mt-1 text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <FaGraduationCap className="text-gray-400" />
                        {card.student.class?.name || 'N/A'}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaIdCard className="text-gray-400" />
                        {card.student.admissionNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {card.student.gender} • {card.student.dateOfBirth ? new Date(card.student.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </p>
                      {card.student.house && (
                        <p className="text-xs text-gray-500">House: {card.student.house}</p>
                      )}
                      {card.student.boardingStatus === 'boarding' && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                          Boarding
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50 border-t border-gray-200 p-3 flex items-center justify-between">
                  {/* QR Code */}
                  <div className="bg-white rounded p-1">
                    {qrData?.data?.qr_code && (
                      <img src={qrData.data.qr_code} alt="QR Code" className="w-16 h-16" />
                    )}
                  </div>

                  {/* Barcode area */}
                  <div className="text-center">
                    <div className="font-mono text-xs text-gray-600">
                      {card.student.admissionNumber}
                    </div>
                    {/* Barcode would be rendered here */}
                    <div className="h-6 bg-gray-200 rounded mt-1 w-32 mx-auto"></div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Emergency Contact</p>
                    {card.student.emergencyContact ? (
                      <>
                        <p className="text-sm font-medium text-gray-800">
                          {card.student.emergencyContact.name}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center justify-end gap-1">
                          <FaPhone className="text-gray-400" />
                          {card.student.emergencyContact.phone}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">N/A</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
            >
              <FaPrint />
              Print Card
            </button>
            <button
              onClick={handleDownload}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <FaDownload />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDCard;