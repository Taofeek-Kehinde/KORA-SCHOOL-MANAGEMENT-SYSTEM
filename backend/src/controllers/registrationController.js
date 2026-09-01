const { supabaseAdmin } = require('../config/supabase');

class RegistrationController {
  // =============================================
  // ENTER SCHOOL DETAILS
  // =============================================
  async enterSchoolDetails(req, res) {
    try {
      console.log('=== REGISTRATION REQUEST RECEIVED ===');
      console.log('Body:', req.body);

      const {
        schoolName,
        schoolEmail,
        phoneNumber,
        country,
        state,
        city,
        schoolAddress,
        schoolType,
        schoolLogo,
        adminFullName,
        adminEmail,
        adminPhone,
        website,
        registrationNumber,
        principalName,
        vicePrincipalName
      } = req.body;

      // Validate required fields
      if (!schoolName || !schoolEmail || !phoneNumber || !adminFullName || !adminEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'School name, email, phone, and admin details are required'
        });
      }

      // Check if school exists
      const { data: existingSchool } = await supabaseAdmin
        .from('schools')
        .select('id')
        .eq('email', schoolEmail)
        .single();

      if (existingSchool) {
        return res.status(400).json({
          status: 'error',
          message: 'School with this email already exists'
        });
      }

      // Create registration request
      const { data: registration, error: regError } = await supabaseAdmin
        .from('school_registration_requests')
        .insert({
          school_name: schoolName,
          school_email: schoolEmail,
          phone_number: phoneNumber,
          country: country || 'Nigeria',
          state: state || '',
          city: city || '',
          school_address: schoolAddress || '',
          school_type: schoolType || 'private',
          school_logo_url: schoolLogo || null,
          website: website || '',
          registration_number: registrationNumber || '',
          principal_name: principalName || '',
          vice_principal_name: vicePrincipalName || '',
          admin_full_name: adminFullName,
          admin_email: adminEmail,
          admin_phone: adminPhone || '',
          status: 'pending',
          created_at: new Date()
        })
        .select()
        .single();

      if (regError) {
        console.error('Registration error:', regError);
        return res.status(500).json({
          status: 'error',
          message: 'Database error: ' + regError.message
        });
      }

      console.log('Registration created:', registration.id);

      res.status(201).json({
        status: 'success',
        message: 'School details saved successfully!',
        data: {
          registration_id: registration.id,
          school_name: registration.school_name,
          admin_email: registration.admin_email
        }
      });
    } catch (error) {
      console.error('ERROR:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to save school details: ' + error.message
      });
    }
  }

  // =============================================
  // VERIFY EMAIL
  // =============================================
  async verifyEmail(req, res) {
    try {
      const { registrationId, token } = req.body;

      if (!registrationId || !token) {
        return res.status(400).json({
          status: 'error',
          message: 'Registration ID and token are required'
        });
      }

      const { data: registration, error: regError } = await supabaseAdmin
        .from('school_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        return res.status(404).json({
          status: 'error',
          message: 'Registration not found'
        });
      }

      if (registration.email_verified) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already verified'
        });
      }

      await supabaseAdmin
        .from('school_registration_requests')
        .update({
          email_verified: true,
          updated_at: new Date()
        })
        .eq('id', registrationId);

      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully',
        data: {
          registration_id: registrationId,
          email_verified: true
        }
      });
    } catch (error) {
      console.error('Verify Email Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to verify email: ' + error.message
      });
    }
  }

  // =============================================
  // VERIFY PHONE
  // =============================================
  async verifyPhone(req, res) {
    try {
      const { registrationId, code } = req.body;

      if (!registrationId || !code) {
        return res.status(400).json({
          status: 'error',
          message: 'Registration ID and verification code are required'
        });
      }

      const { data: registration, error: regError } = await supabaseAdmin
        .from('school_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        return res.status(404).json({
          status: 'error',
          message: 'Registration not found'
        });
      }

      if (registration.phone_verified) {
        return res.status(400).json({
          status: 'error',
          message: 'Phone already verified'
        });
      }

      await supabaseAdmin
        .from('school_registration_requests')
        .update({
          phone_verified: true,
          updated_at: new Date()
        })
        .eq('id', registrationId);

      res.status(200).json({
        status: 'success',
        message: 'Phone verified successfully',
        data: {
          registration_id: registrationId,
          phone_verified: true
        }
      });
    } catch (error) {
      console.error('Verify Phone Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to verify phone: ' + error.message
      });
    }
  }

  // =============================================
  // RESEND EMAIL
  // =============================================
  async resendEmailVerification(req, res) {
    try {
      const { registrationId } = req.body;

      if (!registrationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Registration ID is required'
        });
      }

      const { data: registration, error: regError } = await supabaseAdmin
        .from('school_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        return res.status(404).json({
          status: 'error',
          message: 'Registration not found'
        });
      }

      const newToken = Math.random().toString(36).slice(-32);

      await supabaseAdmin
        .from('school_registration_requests')
        .update({
          email_verification_token: newToken,
          email_verification_sent_at: new Date()
        })
        .eq('id', registrationId);

      res.status(200).json({
        status: 'success',
        message: 'Verification email resent successfully',
        data: {
          registration_id: registrationId
        }
      });
    } catch (error) {
      console.error('Resend Email Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to resend email: ' + error.message
      });
    }
  }

  // =============================================
  // RESEND PHONE
  // =============================================
  async resendPhoneVerification(req, res) {
    try {
      const { registrationId } = req.body;

      if (!registrationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Registration ID is required'
        });
      }

      const { data: registration, error: regError } = await supabaseAdmin
        .from('school_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        return res.status(404).json({
          status: 'error',
          message: 'Registration not found'
        });
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();

      await supabaseAdmin
        .from('school_registration_requests')
        .update({
          phone_verification_token: newCode,
          phone_verification_sent_at: new Date()
        })
        .eq('id', registrationId);

      res.status(200).json({
        status: 'success',
        message: 'Verification code resent successfully',
        data: {
          registration_id: registrationId
        }
      });
    } catch (error) {
      console.error('Resend Phone Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to resend code: ' + error.message
      });
    }
  }

  // =============================================
  // SUBMIT FOR REVIEW
  // =============================================
  async submitForReview(req, res) {
    try {
      const { registrationId } = req.body;

      if (!registrationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Registration ID is required'
        });
      }

      const { data: registration, error: regError } = await supabaseAdmin
        .from('school_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        return res.status(404).json({
          status: 'error',
          message: 'Registration not found'
        });
      }

      await supabaseAdmin
        .from('school_registration_requests')
        .update({
          status: 'under_review',
          updated_at: new Date()
        })
        .eq('id', registrationId);

      res.status(200).json({
        status: 'success',
        message: 'Registration submitted for review',
        data: {
          registration_id: registrationId,
          status: 'under_review'
        }
      });
    } catch (error) {
      console.error('Submit Review Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to submit for review: ' + error.message
      });
    }
  }

  // =============================================
  // APPROVE REGISTRATION
  // =============================================
  async approveRegistration(req, res) {
    try {
      const { registrationId } = req.params;

      const { data: registration, error: regError } = await supabaseAdmin
        .from('school_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        return res.status(404).json({
          status: 'error',
          message: 'Registration not found'
        });
      }

      await supabaseAdmin
        .from('school_registration_requests')
        .update({
          status: 'approved',
          approved_at: new Date()
        })
        .eq('id', registrationId);

      res.status(200).json({
        status: 'success',
        message: 'Registration approved',
        data: {
          registration_id: registrationId
        }
      });
    } catch (error) {
      console.error('Approve Registration Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to approve registration: ' + error.message
      });
    }
  }

  // =============================================
  // REJECT REGISTRATION
  // =============================================
  async rejectRegistration(req, res) {
    try {
      const { registrationId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          status: 'error',
          message: 'Rejection reason is required'
        });
      }

      const { data: registration, error: regError } = await supabaseAdmin
        .from('school_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        return res.status(404).json({
          status: 'error',
          message: 'Registration not found'
        });
      }

      await supabaseAdmin
        .from('school_registration_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date()
        })
        .eq('id', registrationId);

      res.status(200).json({
        status: 'success',
        message: 'Registration rejected',
        data: {
          registration_id: registrationId
        }
      });
    } catch (error) {
      console.error('Reject Registration Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to reject registration: ' + error.message
      });
    }
  }

  // =============================================
  // START REGISTRATION
  // =============================================
  async startRegistration(req, res) {
    try {
      res.status(200).json({
        status: 'success',
        message: 'Registration started',
        data: {
          registration_id: `REG-${Date.now()}`,
          next_step: 'enter_details'
        }
      });
    } catch (error) {
      console.error('Start Registration Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to start registration: ' + error.message
      });
    }
  }

  // =============================================
  // SCHOOL PROFILE METHODS
  // =============================================
  async configureSchoolProfile(req, res) {
    try {
      const { schoolId } = req.params;
      const updateData = req.body;

      const { data: school, error } = await supabaseAdmin
        .from('schools')
        .update(updateData)
        .eq('id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'School profile updated successfully',
        data: school
      });
    } catch (error) {
      console.error('Configure School Profile Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update school profile: ' + error.message
      });
    }
  }

  async getSchoolProfile(req, res) {
    try {
      const { schoolId } = req.params;

      const { data: school, error } = await supabaseAdmin
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: school
      });
    } catch (error) {
      console.error('Get School Profile Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch school profile: ' + error.message
      });
    }
  }
}

module.exports = new RegistrationController();