const { supabaseAdmin } = require('../config/supabase');
const storageService = require('../services/storageService');
const bcrypt = require('bcryptjs');
const studentNotificationService = require('../services/studentNotificationService');


class StudentRegistrationController {
  constructor() {
    this.calculateAge = this.calculateAge.bind(this);
    this.addHistory = this.addHistory.bind(this);
    this.getStudents = this.getStudents.bind(this);
    this.getStudentById = this.getStudentById.bind(this);
    this.registerStudent = this.registerStudent.bind(this);
    this.updateStudent = this.updateStudent.bind(this);
    this.deleteStudent = this.deleteStudent.bind(this);
    this.getStudentHistory = this.getStudentHistory.bind(this);
    this.uploadStudentDocument = this.uploadStudentDocument.bind(this);
    this.deleteStudentDocument = this.deleteStudentDocument.bind(this);
  }
  // =============================================
  // HELPER: Calculate Age
  // =============================================
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // =============================================
  // HELPER: Add to Student History
  // =============================================
  async addHistory(studentId, eventType, description, values, userId) {
    try {
      await supabaseAdmin
        .from('student_history')
        .insert({
          student_id: studentId,
          event_type: eventType,
          event_description: description,
          old_values: values?.old || null,
          new_values: values?.new || null,
          created_by: userId,
          created_at: new Date()
        });
      return true;
    } catch (error) {
      console.error('Add History Error:', error);
      return false;
    }
  }

  // =============================================
  // GET ALL STUDENTS
  // =============================================
  async getStudents(req, res) {
    try {
      const { schoolId } = req.params;
      const { search, classId, status, limit = 100, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          parents:student_parents(
            parents!parent_id(
              id,
              first_name,
              last_name,
              email,
              phone,
              relationship
            )
          ),
          documents:student_documents(*)
        `)
        .eq('school_id', schoolId);

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_number.ilike.%${search}%,student_id.ilike.%${search}%`);
      }

      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (status) {
        query = query.eq('student_status', status);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: count
        }
      });
    } catch (error) {
      console.error('Get Students Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch students',
        error: error.message
      });
    }
  }

  // =============================================
  // GET STUDENT BY ID
  // =============================================
  async getStudentById(req, res) {
    try {
      const { schoolId, studentId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          parents:student_parents(
            parents!parent_id(
              id,
              first_name,
              last_name,
              email,
              phone,
              relationship,
              address,
              occupation,
              employer,
              is_primary_contact
            )
          ),
          documents:student_documents(*),
          history:student_history(*)
        `)
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      console.error('Get Student Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch student',
        error: error.message
      });
    }
  }

  async registerStudent(req, res) {
  try {
    const { schoolId } = req.params;
    const { adminId } = req.user;

    console.log('=== REGISTER STUDENT ===');
    console.log('School ID:', schoolId);
    console.log('Admin ID:', adminId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // ✅ ADD studentEmail and studentPassword here
    const {
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      nationality,
      stateOfOrigin,
      localGovernment,
      religion,
      bloodGroup,
      genotype,
      passport,
      birthCertificate,
      previousSchool,
      transferStatus,
      admissionSession,
      admissionTerm,
      currentSession,
      classId,
      currentArm,
      studentStatus,
      boardingStatus,
      house,
      club,
      sport,
      electiveSubjects,
      medicalConditions,
      allergies,
      disabilities,
      medications,
      doctorName,
      hospital,
      emergencyInstructions,
      parents,
      documents,
      studentEmail,      // ✅ ADD THIS
      studentPassword    // ✅ ADD THIS
    } = req.body;

    // Parse JSON-string fields
    let parsedElectiveSubjects = electiveSubjects;
    if (typeof parsedElectiveSubjects === 'string') {
      try { parsedElectiveSubjects = JSON.parse(parsedElectiveSubjects); } 
      catch (e) { parsedElectiveSubjects = []; }
    }

    let parsedParents = parents;
    if (typeof parsedParents === 'string') {
      try { parsedParents = JSON.parse(parsedParents); } 
      catch (e) { parsedParents = []; }
    }

    // Validation
    if (!firstName || !lastName || !gender || !dateOfBirth || !classId) {
      return res.status(400).json({
        status: 'error',
        message: 'First name, last name, gender, date of birth, and class are required'
      });
    }

    // Generate admission number
    let admissionNumber = req.body.admissionNumber;
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
    const age = this.calculateAge(dateOfBirth);

    // After student is created and parents are linked
// Send notification to parents
try {
  const { data: school } = await supabaseAdmin
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .single();

  await studentNotificationService.notifyStudentAdmitted({
    schoolId,
    school,
    student,
    adminName: 'School Admin'
  });
} catch (notifError) {
  console.error('Send admission notification error:', notifError);
}

    // =============================================
    // STEP 1: CREATE STUDENT
    // =============================================
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        school_id: schoolId,
        first_name: firstName,
        middle_name: middleName || '',
        last_name: lastName,
        gender: gender,
        date_of_birth: dateOfBirth,
        age: age,
        nationality: nationality || '',
        state_of_origin: stateOfOrigin || '',
        local_government: localGovernment || '',
        religion: religion || '',
        blood_group: bloodGroup || '',
        genotype: genotype || '',
        passport_url: passport || null,
        birth_certificate_url: birthCertificate || null,
        previous_school: previousSchool || '',
        transfer_status: transferStatus || 'none',
        admission_number: admissionNumber,
        admission_session: admissionSession || '',
        admission_term: admissionTerm || '',
        current_session: currentSession || '',
        class_id: classId,
        current_arm: currentArm || '',
        student_status: studentStatus || 'active',
        boarding_status: boardingStatus || 'day',
        house: house || '',
        club: club || '',
        sport: sport || '',
        elective_subjects: parsedElectiveSubjects || [],
        medical_conditions: medicalConditions || '',
        allergies: allergies || '',
        disabilities: disabilities || '',
        medications: medications || '',
        doctor_name: doctorName || '',
        hospital: hospital || '',
        emergency_instructions: emergencyInstructions || '',
        admission_date: new Date(),
        is_active: true,
        created_by: adminId,
        created_at: new Date()
      })
      .select()
      .single();

    if (studentError) {
      console.error('Student insert error:', studentError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to insert student: ' + studentError.message
      });
    }

    console.log('Student created with ID:', student.id);

    // =============================================
    // STEP 1.5: CREATE STUDENT LOGIN (USER ACCOUNT)
    // =============================================
    if (studentEmail && studentPassword) {
      console.log('Creating student login for:', studentEmail);
      
      const hashedPassword = await bcrypt.hash(studentPassword, 10);
      
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email: studentEmail,
          password_hash: hashedPassword,
          full_name: `${firstName} ${lastName}`,
          role: 'student',
          school_id: schoolId,
          is_active: true,
          is_verified: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (userError) {
        console.error('User creation error:', userError);
      } else {
        console.log('User created with ID:', user.id);
        
        // Link student to user
        await supabaseAdmin
          .from('students')
          .update({ user_id: user.id })
          .eq('id', student.id);
        
        // Link user to student
        await supabaseAdmin
          .from('users')
          .update({ student_id: student.id })
          .eq('id', user.id);
      }
    }

    // =============================================
    // STEP 2: LINK PARENTS
    // =============================================
    if (parsedParents && parsedParents.length > 0) {
      console.log('Linking parents:', parsedParents.length);
      for (const parent of parsedParents) {
        try {
          const firstName = parent.firstName || parent.first_name || '';
          const lastName = parent.lastName || parent.last_name || '';
          const relationship = parent.relationship || 'guardian';
          const isPrimaryContact = !!(parent.isPrimaryContact ?? parent.is_primary_contact ?? false);

          let parentId = parent.id || null;

          if (!parentId) {
            if (!firstName && !lastName && !parent.phone) {
              console.warn('Skipping invalid parent payload:', parent);
              continue;
            }

            const { data: newParent, error: parentError } = await supabaseAdmin
              .from('parents')
              .insert({
                school_id: schoolId,
                first_name: firstName,
                last_name: lastName,
                email: parent.email || '',
                phone: parent.phone || '',
                relationship,
                address: parent.address || '',
                occupation: parent.occupation || '',
                employer: parent.employer || '',
                is_primary_contact: isPrimaryContact,
                is_active: true,
                created_by: adminId,
                created_at: new Date()
              })
              .select()
              .single();

            if (parentError) {
              console.error('Parent insert error:', parentError);
              continue;
            }
            parentId = newParent.id;
          }

          await supabaseAdmin
            .from('student_parents')
            .insert({
              student_id: student.id,
              parent_id: parentId,
              is_primary_contact: isPrimaryContact,
              created_at: new Date()
            });
        } catch (parentError) {
          console.error('Parent processing error:', parentError);
        }
      }
    }

    // =============================================
    // STEP 3: ADD DOCUMENTS
    // =============================================
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const publicUrl = await storageService.uploadSchoolDocument(file, schoolId, 'student_documents');
          await supabaseAdmin
            .from('student_documents')
            .insert({
              student_id: student.id,
              name: file.originalname,
              file_url: publicUrl || '',
              file_type: file.mimetype || '',
              file_size: file.size || 0,
              category: 'other',
              uploaded_by: adminId,
              uploaded_at: new Date()
            });
        } catch (docError) {
          console.error('File upload processing error:', docError);
        }
      }
    }

    if (documents && Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        try {
          await supabaseAdmin
            .from('student_documents')
            .insert({
              student_id: student.id,
              name: doc.name,
              file_url: doc.fileUrl || '',
              file_type: doc.fileType || '',
              file_size: doc.fileSize || 0,
              category: doc.category || 'other',
              description: doc.description || '',
              uploaded_by: adminId,
              uploaded_at: new Date()
            });
        } catch (docError) {
          console.error('Document processing error:', docError);
        }
      }
    }

    // =============================================
    // STEP 4: ADD STUDENT HISTORY
    // =============================================
    await this.addHistory(
      student.id,
      'ADMISSION',
      `Student ${firstName} ${lastName} admitted with admission number ${admissionNumber}`,
      { admission_number: admissionNumber, class: classId },
      adminId
    );

    // =============================================
    // STEP 5: CREATE AUDIT LOG
    // =============================================
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        school_id: schoolId,
        user_id: adminId,
        action: 'REGISTER_STUDENT',
        entity_type: 'student',
        entity_id: student.id,
        new_values: {
          firstName,
          lastName,
          admission_number: admissionNumber,
          class: classId
        }
      });

    console.log('Student registration complete!');

    res.status(201).json({
      status: 'success',
      message: studentEmail ? `Student registered. Login created for ${studentEmail}` : 'Student registered successfully',
      data: {
        ...student,
        loginCreated: !!studentEmail
      }
    });
  } catch (error) {
    console.error('Register Student Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register student: ' + error.message
    });
  }
}
  // =============================================
  // UPDATE STUDENT
  // =============================================
  async updateStudent(req, res) {
    try {
      const { schoolId, studentId } = req.params;
      const { adminId } = req.user;
      const updateData = req.body;

      const { data: currentStudent, error: fetchError } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single();

      if (fetchError) throw fetchError;

      const mappedData = {};
      const fieldMap = {
        firstName: 'first_name',
        middleName: 'middle_name',
        lastName: 'last_name',
        gender: 'gender',
        dateOfBirth: 'date_of_birth',
        nationality: 'nationality',
        stateOfOrigin: 'state_of_origin',
        localGovernment: 'local_government',
        religion: 'religion',
        bloodGroup: 'blood_group',
        genotype: 'genotype',
        passport: 'passport_url',
        birthCertificate: 'birth_certificate_url',
        previousSchool: 'previous_school',
        transferStatus: 'transfer_status',
        admissionSession: 'admission_session',
        admissionTerm: 'admission_term',
        currentSession: 'current_session',
        classId: 'class_id',
        currentArm: 'current_arm',
        studentStatus: 'student_status',
        boardingStatus: 'boarding_status',
        house: 'house',
        club: 'club',
        sport: 'sport',
        electiveSubjects: 'elective_subjects',
        medicalConditions: 'medical_conditions',
        allergies: 'allergies',
        disabilities: 'disabilities',
        medications: 'medications',
        doctorName: 'doctor_name',
        hospital: 'hospital',
        emergencyInstructions: 'emergency_instructions'
      };

      for (const [key, value] of Object.entries(updateData)) {
        if (fieldMap[key] && value !== undefined) {
          mappedData[fieldMap[key]] = value;
        }
      }

      if (mappedData.date_of_birth) {
        mappedData.age = this.calculateAge(mappedData.date_of_birth);
      }

      mappedData.updated_at = new Date();

      const { data: student, error } = await supabaseAdmin
        .from('students')
        .update(mappedData)
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      const significantFields = ['class_id', 'student_status', 'boarding_status', 'house', 'club'];
      for (const field of significantFields) {
        if (mappedData[field] && mappedData[field] !== currentStudent[field]) {
          await this.addHistory(
            studentId,
            'UPDATE',
            `${field.replace('_', ' ')} changed from ${currentStudent[field] || 'N/A'} to ${mappedData[field]}`,
            { old: currentStudent[field], new: mappedData[field] },
            adminId
          );
        }
      }

      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'UPDATE_STUDENT',
          entity_type: 'student',
          entity_id: studentId,
          new_values: mappedData
        });

      res.status(200).json({
        status: 'success',
        message: 'Student updated successfully',
        data: student
      });
    } catch (error) {
      console.error('Update Student Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update student',
        error: error.message
      });
    }
  }

  // =============================================
  // DELETE STUDENT
  // =============================================
  async deleteStudent(req, res) {
    try {
      const { schoolId, studentId } = req.params;
      const { adminId } = req.user;

      const { data: student, error } = await supabaseAdmin
        .from('students')
        .update({
          is_active: false,
          student_status: 'withdrawn',
          withdrawal_date: new Date(),
          withdrawal_approved_by: adminId,
          updated_at: new Date()
        })
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      await this.addHistory(
        studentId,
        'WITHDRAWAL',
        `Student withdrawn on ${new Date().toLocaleDateString()}`,
        { status: 'withdrawn' },
        adminId
      );

      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'DELETE_STUDENT',
          entity_type: 'student',
          entity_id: studentId
        });

      res.status(200).json({
        status: 'success',
        message: 'Student withdrawn successfully',
        data: student
      });
    } catch (error) {
      console.error('Delete Student Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete student',
        error: error.message
      });
    }
  }

  // =============================================
  // GET STUDENT HISTORY
  // =============================================
  async getStudentHistory(req, res) {
    try {
      const { schoolId, studentId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('student_history')
        .select(`
          *,
          users!created_by(full_name, email)
        `)
        .eq('student_id', studentId)
        .order('event_date', { ascending: false });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || []
      });
    } catch (error) {
      console.error('Get Student History Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch student history',
        error: error.message
      });
    }
  }

  // =============================================
  // UPLOAD STUDENT DOCUMENT
  // =============================================
  async uploadStudentDocument(req, res) {
    try {
      const { schoolId, studentId } = req.params;
      const { name, category, description } = req.body;
      const { adminId } = req.user;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
      }

      const { data: document, error } = await supabaseAdmin
        .from('student_documents')
        .insert({
          student_id: studentId,
          name: name || file.originalname,
          file_url: file.buffer.toString('base64'),
          file_type: file.mimetype,
          file_size: file.size,
          category: category || 'other',
          description: description || '',
          uploaded_by: adminId,
          uploaded_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        status: 'success',
        message: 'Document uploaded successfully',
        data: document
      });
    } catch (error) {
      console.error('Upload Document Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to upload document',
        error: error.message
      });
    }
  }

  // =============================================
  // DELETE STUDENT DOCUMENT
  // =============================================
  async deleteStudentDocument(req, res) {
    try {
      const { schoolId, studentId, documentId } = req.params;
      const { adminId } = req.user;

      const { error } = await supabaseAdmin
        .from('student_documents')
        .delete()
        .eq('id', documentId)
        .eq('student_id', studentId);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Delete Document Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }
}

module.exports = new StudentRegistrationController();