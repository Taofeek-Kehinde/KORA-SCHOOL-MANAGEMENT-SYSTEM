const { supabaseAdmin } = require('../config/supabase');
const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');

class IDCardController {
  // =============================================
  // GET ID CARD DATA
  // =============================================
  getIDCardData = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { studentId } = req.query;

      // Get student info
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(first_name, last_name, phone, email)
          )
        `)
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single();

      if (studentError) throw studentError;

      // Get school info
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select('name, logo_url, address, phone, email, motto')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;

      // Get emergency contact
      const emergencyContact = student.parents?.find(p => p.is_primary_contact) || student.parents?.[0];

      res.status(200).json({
        status: 'success',
        data: {
          student: {
            id: student.id,
            firstName: student.first_name,
            lastName: student.last_name,
            middleName: student.middle_name || '',
            admissionNumber: student.admission_number,
            photo: student.passport_url || '',
            class: student.classes || {},
            campus: student.campuses || {},
            boardingStatus: student.boarding_status,
            dateOfBirth: student.date_of_birth,
            gender: student.gender,
            house: student.house || '',
            emergencyContact: emergencyContact ? {
              name: `${emergencyContact.parents?.first_name} ${emergencyContact.parents?.last_name}`,
              phone: emergencyContact.parents?.phone || '',
              relationship: emergencyContact.relationship || ''
            } : null
          },
          school: {
            name: school.name,
            logo: school.logo_url || '',
            address: school.address || '',
            phone: school.phone || '',
            email: school.email || '',
            motto: school.motto || ''
          }
        }
      });
    } catch (error) {
      console.error('Get ID Card Data Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get ID card data',
        error: error.message
      });
    }
  };

  // =============================================
  // GENERATE BARCODE
  // =============================================
  generateBarcode = async (req, res) => {
    try {
      const { studentId } = req.params;
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('admission_number')
        .eq('id', studentId)
        .single();

      if (!student) {
        return res.status(404).json({
          status: 'error',
          message: 'Student not found'
        });
      }

      const canvas = createCanvas(200, 100);
      JsBarcode(canvas, student.admission_number, {
        format: 'CODE128',
        width: 2,
        height: 40,
        displayValue: true
      });

      const buffer = canvas.toBuffer('image/png');
      
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } catch (error) {
      console.error('Generate Barcode Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate barcode',
        error: error.message
      });
    }
  };

  // =============================================
  // GENERATE QR CODE
  // =============================================
  generateQRCode = async (req, res) => {
    try {
      const { studentId } = req.params;
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id, admission_number')
        .eq('id', studentId)
        .single();

      if (!student) {
        return res.status(404).json({
          status: 'error',
          message: 'Student not found'
        });
      }

      const qrData = JSON.stringify({
        studentId: student.id,
        admissionNumber: student.admission_number,
        type: 'student_id'
      });

      const qrCode = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      res.status(200).json({
        status: 'success',
        data: {
          qr_code: qrCode
        }
      });
    } catch (error) {
      console.error('Generate QR Code Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate QR code',
        error: error.message
      });
    }
  };

  // =============================================
  // GENERATE FULL ID CARD (HTML)
  // =============================================
  generateIDCard = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { studentId } = req.query;

      // Get student info
      const { data: student } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(first_name, last_name, phone, email)
          )
        `)
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single();

      // Get school info
      const { data: school } = await supabaseAdmin
        .from('schools')
        .select('name, logo_url, address, phone, email, motto')
        .eq('id', schoolId)
        .single();

      // Get emergency contact
      const emergencyContact = student.parents?.find(p => p.is_primary_contact) || student.parents?.[0];

      // Generate QR code
      const qrData = JSON.stringify({
        studentId: student.id,
        admissionNumber: student.admission_number,
        type: 'student_id'
      });
      const qrCode = await QRCode.toDataURL(qrData, { width: 150, margin: 2 });

      // Build HTML
      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; background: #f0f0f0; padding: 20px; }
    .id-card {
      width: 340px;
      height: 215px;
      background: linear-gradient(135deg, ${school.school_colours?.primary || '#4F46E5'} 0%, ${school.school_colours?.secondary || '#7C3AED'} 100%);
      border-radius: 15px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .card-header {
      background: rgba(255,255,255,0.95);
      padding: 10px 15px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 2px solid ${school.school_colours?.primary || '#4F46E5'};
    }
    .school-logo {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }
    .school-name {
      font-size: 14px;
      font-weight: bold;
      color: #333;
    }
    .school-motto {
      font-size: 10px;
      color: #666;
      font-style: italic;
    }
    .card-body {
      padding: 12px 15px;
      display: flex;
      gap: 12px;
    }
    .student-photo {
      width: 80px;
      height: 95px;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid white;
      background: #e0e0e0;
    }
    .student-info {
      flex: 1;
    }
    .student-name {
      font-size: 16px;
      font-weight: bold;
      color: white;
      margin-bottom: 3px;
    }
    .info-row {
      font-size: 11px;
      color: rgba(255,255,255,0.9);
      margin-bottom: 2px;
    }
    .info-label {
      opacity: 0.7;
    }
    .card-footer {
      background: rgba(255,255,255,0.95);
      padding: 8px 15px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 2px solid ${school.school_colours?.primary || '#4F46E5'};
    }
    .qr-code {
      width: 60px;
      height: 60px;
    }
    .barcode {
      width: 120px;
      height: 40px;
    }
    .emergency {
      font-size: 9px;
      color: #666;
    }
    .card-id {
      font-size: 10px;
      color: #999;
      text-align: center;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="id-card">
    <div class="card-header">
      ${school.logo_url ? `<img src="${school.logo_url}" class="school-logo">` : ''}
      <div>
        <div class="school-name">${school.name}</div>
        <div class="school-motto">${school.motto || ''}</div>
      </div>
    </div>
    <div class="card-body">
      ${student.passport_url ? `<img src="${student.passport_url}" class="student-photo">` : '<div class="student-photo"></div>'}
      <div class="student-info">
        <div class="student-name">${student.first_name} ${student.last_name}</div>
        <div class="info-row"><span class="info-label">Admission:</span> ${student.admission_number}</div>
        <div class="info-row"><span class="info-label">Class:</span> ${student.classes?.name || 'N/A'}</div>
        <div class="info-row"><span class="info-label">Gender:</span> ${student.gender}</div>
        <div class="info-row"><span class="info-label">DOB:</span> ${new Date(student.date_of_birth).toLocaleDateString()}</div>
        ${student.house ? `<div class="info-row"><span class="info-label">House:</span> ${student.house}</div>` : ''}
        ${student.boarding_status === 'boarding' ? '<div class="info-row"><span class="info-label">Boarding</span></div>' : ''}
      </div>
    </div>
    <div class="card-footer">
      <div>
        <img class="qr-code" src="${qrCode}">
      </div>
      <div>
        <div class="emergency">
          <strong>Emergency:</strong>
          ${emergencyContact?.parents?.phone || 'N/A'}
        </div>
        <div class="card-id">ID: ${student.id.slice(0, 8).toUpperCase()}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Generate ID Card Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate ID card',
        error: error.message
      });
    }
  };
}

module.exports = new IDCardController();