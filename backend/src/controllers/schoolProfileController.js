const { supabaseAdmin } = require('../config/supabase');
const storageService = require('../services/storageService');

class SchoolProfileController {
  // =============================================
  // GET SCHOOL PROFILE
  // =============================================
  async getProfile(req, res) {
    try {
      const { schoolId } = req.params;

      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select(`
          *,
          campuses(*),
          departments(*),
          documents!documents_school_id_fkey(
            id,
            name,
            file_url,
            file_type,
            file_size,
            description,
            category,
            uploaded_at
          )
        `)
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;

      // Get counts
      const { count: studentCount } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      const { count: teacherCount } = await supabaseAdmin
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      const { count: classCount } = await supabaseAdmin
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      res.status(200).json({
        status: 'success',
        data: {
          ...school,
          stats: {
            students: studentCount || 0,
            teachers: teacherCount || 0,
            classes: classCount || 0
          }
        }
      });
    } catch (error) {
      console.error('Get Profile Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch school profile',
        error: error.message
      });
    }
  }

  // =============================================
  // UPDATE SCHOOL PROFILE (Pages 11-12)
  // =============================================
  async updateProfile(req, res) {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const {
        // Basic Info
        name,
        email,
        phone,
        address,
        website,
        schoolType,
        registrationNumber,
        
        // Leadership
        principalName,
        vicePrincipalName,
        
        // School Identity
        motto,
        vision,
        mission,
        anthem,
        
        // Branding
        schoolColours,
        signature,
        reportCardDesign,
        
        // Social Media
        socialMedia,
        
        // Location
        gpsLocation,
        
        // Academic
        academicSession,
        currentTerm,
        timezone,
        currency,
        
        // Multi-Campus
        campuses,
        
        // White Label
        whiteLabel,
        
        // Documents
        documents
      } = req.body;

      // Build update data
      const updateData = {};
      
      // Basic Info
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (website !== undefined) updateData.website = website;
      if (schoolType !== undefined) updateData.school_type = schoolType;
      if (registrationNumber !== undefined) updateData.registration_number = registrationNumber;
      
      // Leadership
      if (principalName !== undefined) updateData.principal_name = principalName;
      if (vicePrincipalName !== undefined) updateData.vice_principal_name = vicePrincipalName;
      
      // School Identity
      if (motto !== undefined) updateData.motto = motto;
      if (vision !== undefined) updateData.vision = vision;
      if (mission !== undefined) updateData.mission = mission;
      if (anthem !== undefined) updateData.anthem = anthem;
      
      // Branding
      if (schoolColours !== undefined) updateData.school_colours = schoolColours;
      if (signature !== undefined) updateData.signature_url = signature;
      if (reportCardDesign !== undefined) updateData.report_card_design = reportCardDesign;
      
      // Social Media
      if (socialMedia !== undefined) updateData.social_media = socialMedia;
      
      // Location
      if (gpsLocation !== undefined) updateData.gps_location = gpsLocation;
      
      // Academic
      if (academicSession !== undefined) updateData.academic_session = academicSession;
      if (currentTerm !== undefined) updateData.current_term = currentTerm;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (currency !== undefined) updateData.currency = currency;
      
      // White Label
      if (whiteLabel !== undefined) {
        updateData.white_label_config = {
          custom_domain: whiteLabel.customDomain || null,
          custom_logo: whiteLabel.customLogo || null,
          custom_colours: whiteLabel.customColours || null,
          custom_login_page: whiteLabel.customLoginPage || null
        };
      }

      updateData.updated_at = new Date();

      // Update school
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .update(updateData)
        .eq('id', schoolId)
        .select()
        .single();

      if (schoolError) throw schoolError;

      // Handle Multi-Campus (Page 13)
      if (campuses !== undefined) {
        // Delete existing campuses
        await supabaseAdmin
          .from('campuses')
          .delete()
          .eq('school_id', schoolId);

        // Create new campuses
        for (const campus of campuses) {
          await supabaseAdmin
            .from('campuses')
            .insert({
              school_id: schoolId,
              name: campus.name,
              address: campus.address || '',
              phone: campus.phone || '',
              email: campus.email || '',
              principal_name: campus.principalName || '',
              is_main_campus: campus.isMain || false,
              is_active: true,
              created_by: adminId
            });
        }
      }

      // Handle Documents
      if (documents !== undefined) {
        for (const doc of documents) {
          if (doc.id) {
            // Update existing document
            await supabaseAdmin
              .from('documents')
              .update({
                name: doc.name,
                description: doc.description || '',
                updated_at: new Date()
              })
              .eq('id', doc.id)
              .eq('school_id', schoolId);
          } else if (doc.fileUrl) {
            // Create new document
            await supabaseAdmin
              .from('documents')
              .insert({
                school_id: schoolId,
                name: doc.name,
                file_url: doc.fileUrl,
                file_type: doc.fileType || 'application/pdf',
                file_size: doc.fileSize || 0,
                description: doc.description || '',
                category: doc.category || 'school_document',
                uploaded_by: adminId,
                uploaded_at: new Date()
              });
          }
        }
      }

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'UPDATE_SCHOOL_PROFILE',
          entity_type: 'school',
          entity_id: schoolId,
          new_values: updateData
        });

      res.status(200).json({
        status: 'success',
        message: 'School profile updated successfully',
        data: school
      });
    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update school profile',
        error: error.message
      });
    }
  }

  // =============================================
  // UPLOAD SCHOOL DOCUMENT
  // =============================================
  async uploadDocument(req, res) {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { name, category, description } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
      }

      // Upload to storage
      const fileUrl = await storageService.uploadSchoolDocument(
        file,
        schoolId,
        category || 'school_document'
      );

      // Save to database
      const { data: document, error: docError } = await supabaseAdmin
        .from('documents')
        .insert({
          school_id: schoolId,
          name: name || file.originalname,
          file_url: fileUrl,
          file_type: file.mimetype,
          file_size: file.size,
          description: description || '',
          category: category || 'school_document',
          uploaded_by: adminId,
          uploaded_at: new Date()
        })
        .select()
        .single();

      if (docError) throw docError;

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
  // DELETE SCHOOL DOCUMENT
  // =============================================
  async deleteDocument(req, res) {
    try {
      const { schoolId, documentId } = req.params;
      const { adminId } = req.user;

      const { data: document, error: fetchError } = await supabaseAdmin
        .from('documents')
        .select('file_url')
        .eq('id', documentId)
        .eq('school_id', schoolId)
        .single();

      if (fetchError || !document) {
        return res.status(404).json({
          status: 'error',
          message: 'Document not found'
        });
      }

      // Delete from storage
      await storageService.deleteFile(document.file_url);

      // Delete from database
      await supabaseAdmin
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('school_id', schoolId);

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'DELETE_DOCUMENT',
          entity_type: 'document',
          entity_id: documentId
        });

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

  // =============================================
  // GET SCHOOL STATS
  // =============================================
  async getSchoolStats(req, res) {
    try {
      const { schoolId } = req.params;

      const [
        { count: students },
        { count: teachers },
        { count: staff },
        { count: parents },
        { count: classes },
        { count: subjects },
        { count: activeStudents },
        { count: pendingInvoices }
      ] = await Promise.all([
        supabaseAdmin.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabaseAdmin.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
        supabaseAdmin.from('staff').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
        supabaseAdmin.from('parents').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabaseAdmin.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
        supabaseAdmin.from('subjects').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabaseAdmin.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
        supabaseAdmin.from('invoices').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'pending')
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          students: students || 0,
          teachers: teachers || 0,
          staff: staff || 0,
          parents: parents || 0,
          classes: classes || 0,
          subjects: subjects || 0,
          activeStudents: activeStudents || 0,
          pendingInvoices: pendingInvoices || 0
        }
      });
    } catch (error) {
      console.error('Get School Stats Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch school statistics',
        error: error.message
      });
    }
  }
}

module.exports = new SchoolProfileController();