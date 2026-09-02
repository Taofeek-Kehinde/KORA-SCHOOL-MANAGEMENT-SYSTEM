const { supabaseAdmin } = require('../config/supabase');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');

class BulkImportController {
  // =============================================
  // UPLOAD AND PARSE FILE
  // =============================================
  uploadAndParse = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
      }

      // Parse Excel/CSV file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rows.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No data found in file'
        });
      }

      // Get existing admission numbers for duplicate detection
      const { data: existingStudents } = await supabaseAdmin
        .from('students')
        .select('admission_number')
        .eq('school_id', schoolId);

      const existingAdmissionNumbers = new Set(
        existingStudents?.map(s => s.admission_number) || []
      );

      // Validate and process rows
      const processedData = this.processRows(rows, existingAdmissionNumbers);

      res.status(200).json({
        status: 'success',
        data: {
          total_rows: rows.length,
          valid_rows: processedData.valid.length,
          invalid_rows: processedData.invalid.length,
          duplicate_rows: processedData.duplicates.length,
          valid: processedData.valid,
          invalid: processedData.invalid,
          duplicates: processedData.duplicates
        }
      });
    } catch (error) {
      console.error('Upload Parse Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to parse file',
        error: error.message
      });
    }
  };

  // =============================================
  // PROCESS AND VALIDATE ROWS
  // =============================================
  processRows = (rows, existingAdmissionNumbers) => {
    const valid = [];
    const invalid = [];
    const duplicates = [];

    const normalizeText = (value) => {
      if (value === null || value === undefined || value === '') return '';
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
      if (value instanceof Date) return value.toISOString().slice(0, 10);
      return String(value).trim();
    };

    const normalizeDate = (value) => {
      if (value === null || value === undefined || value === '') return '';

      if (value instanceof Date) return value.toISOString().slice(0, 10);

      if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        if (date && date.y) {
          const normalized = new Date(date.y, date.m - 1, date.d);
          return normalized.toISOString().slice(0, 10);
        }
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return '';

        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().slice(0, 10);
        }

        return trimmed;
      }

      return normalizeText(value);
    };

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of header row

      // Extract fields
      const firstName = normalizeText(row['First Name'] || row['firstName'] || row['first_name']);
      const lastName = normalizeText(row['Last Name'] || row['lastName'] || row['last_name']);
      const middleName = normalizeText(row['Middle Name'] || row['middleName'] || row['middle_name']);
      const gender = normalizeText(row['Gender'] || row['gender']).toLowerCase();
      const dateOfBirth = normalizeDate(row['Date of Birth'] || row['DOB'] || row['dateOfBirth'] || row['date_of_birth']);
      const admissionNumber = normalizeText(row['Admission Number'] || row['admissionNumber'] || row['admission_number']);
      const classId = normalizeText(row['Class ID'] || row['classId'] || row['class_id']);
      const email = normalizeText(row['Email'] || row['email']);
      const phone = normalizeText(row['Phone'] || row['phone']);
      const address = normalizeText(row['Address'] || row['address']);
      const house = normalizeText(row['House'] || row['house']);
      const club = normalizeText(row['Club'] || row['club']);
      const sport = normalizeText(row['Sport'] || row['sport']);
      const boardingStatus = normalizeText(row['Boarding Status'] || row['boardingStatus'] || row['boarding_status'] || 'day').toLowerCase();
      const studentStatus = normalizeText(row['Student Status'] || row['studentStatus'] || row['student_status'] || 'active').toLowerCase();
      const medicalConditions = normalizeText(row['Medical Conditions'] || row['medicalConditions'] || row['medical_conditions']);
      const allergies = normalizeText(row['Allergies'] || row['allergies']);
      const medications = normalizeText(row['Medications'] || row['medications']);

      // Validate required fields
      const errors = [];
      if (!firstName) errors.push('First Name is required');
      if (!lastName) errors.push('Last Name is required');
      if (!gender) errors.push('Gender is required');
      if (!dateOfBirth) errors.push('Date of Birth is required');

      // Validate gender
      if (gender && !['male', 'female', 'other'].includes(gender)) {
        errors.push(`Invalid gender: ${gender}`);
      }

      // Validate date of birth
      if (dateOfBirth) {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          errors.push(`Invalid date of birth: ${dateOfBirth}`);
        }
      }

      // Check for duplicates
      if (admissionNumber && existingAdmissionNumbers.has(admissionNumber)) {
        duplicates.push({
          row_number: rowNumber,
          data: row,
          error: `Duplicate admission number: ${admissionNumber}`
        });
        return;
      }

      // If invalid, add to invalid list
      if (errors.length > 0) {
        invalid.push({
          row_number: rowNumber,
          data: row,
          errors
        });
        return;
      }

      // Add to valid list
      valid.push({
        row_number: rowNumber,
        data: {
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
          gender,
          date_of_birth: dateOfBirth,
          admission_number: admissionNumber || `BULK-${Date.now()}-${index}`,
          class_id: classId || null,
          email,
          phone,
          address,
          house,
          club,
          sport,
          boarding_status: boardingStatus,
          student_status: studentStatus,
          medical_conditions: medicalConditions,
          allergies,
          medications,
          is_active: true
        }
      });
    });

    return { valid, invalid, duplicates };
  };

  // =============================================
  // PREVIEW DATA
  // =============================================
  previewData = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { valid, invalid, duplicates } = req.body;

      res.status(200).json({
        status: 'success',
        data: {
          total: valid.length,
          valid: valid.length,
          invalid: invalid.length,
          duplicates: duplicates.length,
          preview: valid.slice(0, 10),
          summary: {
            successful: valid.length,
            failed: invalid.length + duplicates.length
          }
        }
      });
    } catch (error) {
      console.error('Preview Data Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to preview data',
        error: error.message
      });
    }
  };

  // =============================================
  // IMPORT STUDENTS
  // =============================================
  importStudents = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { students } = req.body;

      if (!students || students.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No students to import'
        });
      }

      const results = {
        successful: [],
        failed: [],
        skipped: []
      };

      for (const student of students) {
        try {
          // Generate admission number if missing
          let admissionNumber = student.admission_number;
          if (!admissionNumber) {
            const year = new Date().getFullYear();
            const { count } = await supabaseAdmin
              .from('students')
              .select('id', { count: 'exact', head: true })
              .eq('school_id', schoolId);
            const sequence = String((count || 0) + 1).padStart(4, '0');
            admissionNumber = `${year}-${sequence}`;
          }

          // Calculate age
          const age = this.calculateAge(student.date_of_birth);

          // Insert student
          const { data: newStudent, error: insertError } = await supabaseAdmin
            .from('students')
            .insert({
              school_id: schoolId,
              first_name: student.first_name,
              last_name: student.last_name,
              middle_name: student.middle_name || '',
              gender: student.gender,
              date_of_birth: student.date_of_birth,
              age,
              admission_number: admissionNumber,
              class_id: student.class_id || null,
              email: student.email || '',
              phone: student.phone || '',
              address: student.address || '',
              house: student.house || '',
              club: student.club || '',
              sport: student.sport || '',
              boarding_status: student.boarding_status || 'day',
              student_status: student.student_status || 'active',
              medical_conditions: student.medical_conditions || '',
              allergies: student.allergies || '',
              medications: student.medications || '',
              is_active: true,
              created_by: adminId,
              created_at: new Date()
            })
            .select()
            .single();

          if (insertError) {
            results.failed.push({
              student: student,
              error: insertError.message
            });
            continue;
          }

          results.successful.push({
            student: newStudent,
            message: 'Student imported successfully'
          });
        } catch (error) {
          results.failed.push({
            student: student,
            error: error.message
          });
        }
      }

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'BULK_IMPORT_STUDENTS',
          entity_type: 'students',
          new_values: {
            total: students.length,
            successful: results.successful.length,
            failed: results.failed.length
          }
        });

      res.status(200).json({
        status: 'success',
        message: `Imported ${results.successful.length} students successfully`,
        data: {
          summary: {
            total: students.length,
            successful: results.successful.length,
            failed: results.failed.length
          },
          successful: results.successful,
          failed: results.failed
        }
      });
    } catch (error) {
      console.error('Import Students Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to import students',
        error: error.message
      });
    }
  };

  // =============================================
  // DOWNLOAD TEMPLATE
  // =============================================
  downloadTemplate = async (req, res) => {
    try {
      const template = [
        {
          'First Name': '',
          'Last Name': '',
          'Middle Name': '',
          'Gender': '',
          'Date of Birth': '',
          'Admission Number': '',
          'Class ID': '',
          'Email': '',
          'Phone': '',
          'Address': '',
          'House': '',
          'Club': '',
          'Sport': '',
          'Boarding Status': '',
          'Student Status': '',
          'Medical Conditions': '',
          'Allergies': '',
          'Medications': ''
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(template);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=student-import-template.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Download Template Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to download template',
        error: error.message
      });
    }
  };

  // =============================================
  // HELPER: Calculate Age
  // =============================================
  calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
}

module.exports = new BulkImportController();