const { supabaseAdmin } = require('../config/supabase');

class WhiteLabelController {
  // =============================================
  // GET WHITE LABEL CONFIGURATION
  // =============================================
  async getWhiteLabelConfig(req, res) {
    try {
      const { schoolId } = req.params;

      const { data: school, error } = await supabaseAdmin
        .from('schools')
        .select('white_label_config, logo_url, school_colours, name, website')
        .eq('id', schoolId)
        .single();

      if (error) throw error;

      const config = school.white_label_config || {
        custom_domain: null,
        custom_logo: null,
        custom_colours: {
          primary: school.school_colours?.primary || '#4F46E5',
          secondary: school.school_colours?.secondary || '#7C3AED'
        },
        custom_login_page: false,
        use_school_logo: true,
        custom_login_page_html: null
      };

      res.status(200).json({
        status: 'success',
        data: {
          ...config,
          school_name: school.name,
          school_website: school.website,
          default_logo: school.logo_url,
          default_colours: school.school_colours
        }
      });
    } catch (error) {
      console.error('Get White Label Config Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch white label configuration',
        error: error.message
      });
    }
  }

  // =============================================
  // UPDATE WHITE LABEL CONFIGURATION
  // =============================================
  async updateWhiteLabelConfig(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        customDomain,
        customLogo,
        customColours,
        customLoginPage,
        useSchoolLogo,
        customLoginPageHtml
      } = req.body;
      const { adminId } = req.user;

      // Get current config
      const { data: school, error: fetchError } = await supabaseAdmin
        .from('schools')
        .select('white_label_config')
        .eq('id', schoolId)
        .single();

      if (fetchError) throw fetchError;

      const currentConfig = school.white_label_config || {};

      const updatedConfig = {
        ...currentConfig,
        custom_domain: customDomain !== undefined ? customDomain : currentConfig.custom_domain,
        custom_logo: customLogo !== undefined ? customLogo : currentConfig.custom_logo,
        custom_colours: customColours !== undefined ? customColours : currentConfig.custom_colours,
        custom_login_page: customLoginPage !== undefined ? customLoginPage : currentConfig.custom_login_page,
        use_school_logo: useSchoolLogo !== undefined ? useSchoolLogo : currentConfig.use_school_logo,
        custom_login_page_html: customLoginPageHtml !== undefined ? customLoginPageHtml : currentConfig.custom_login_page_html
      };

      const { data: updatedSchool, error } = await supabaseAdmin
        .from('schools')
        .update({
          white_label_config: updatedConfig,
          updated_at: new Date()
        })
        .eq('id', schoolId)
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'UPDATE_WHITE_LABEL',
          entity_type: 'school',
          entity_id: schoolId,
          new_values: { white_label_config: updatedConfig }
        });

      res.status(200).json({
        status: 'success',
        message: 'White label configuration updated successfully',
        data: updatedConfig
      });
    } catch (error) {
      console.error('Update White Label Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update white label configuration',
        error: error.message
      });
    }
  }

  // =============================================
  // GET CUSTOM DOMAIN STATUS
  // =============================================
  async checkCustomDomain(req, res) {
    try {
      const { schoolId } = req.params;

      const { data: school, error } = await supabaseAdmin
        .from('schools')
        .select('white_label_config, name, website')
        .eq('id', schoolId)
        .single();

      if (error) throw error;

      const config = school.white_label_config || {};
      const customDomain = config.custom_domain;

      let status = 'not_configured';
      let message = 'No custom domain configured';
      let verificationSteps = [];

      if (customDomain) {
        // Check if domain format is valid
        const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        const isValidFormat = domainRegex.test(customDomain);

        if (!isValidFormat) {
          status = 'invalid';
          message = 'Invalid domain format. Please enter a valid domain (e.g., portal.yourschool.com)';
          verificationSteps = [
            'Enter a valid domain name (e.g., portal.yourschool.com)',
            'Domain should not contain http:// or https://',
            'Domain should have at least one dot (.)'
          ];
        } else {
          // In production, you would verify DNS records here
          // For demo, we'll simulate verification
          status = 'pending_verification';
          message = 'Domain pending verification. Please add the following DNS records:';
          
          // Generate DNS verification records
          const verificationToken = Buffer.from(schoolId).toString('base64').slice(0, 32);
          
          verificationSteps = [
            {
              type: 'TXT',
              name: `_kora-verify.${customDomain}`,
              value: `kora-verify=${verificationToken}`,
              description: 'Add this TXT record to verify domain ownership'
            },
            {
              type: 'CNAME',
              name: `www.${customDomain}`,
              value: 'kora-platform.com',
              description: 'Point your domain to Kora platform'
            },
            {
              type: 'CNAME',
              name: customDomain,
              value: 'kora-platform.com',
              description: 'Point your domain to Kora platform'
            }
          ];

          // If domain is already verified (simulated)
          if (config.domain_verified) {
            status = 'active';
            message = 'Custom domain is active and verified!';
            verificationSteps = [
              {
                type: 'SUCCESS',
                name: customDomain,
                value: 'Verified',
                description: 'Domain is properly configured and active'
              }
            ];
          }
        }
      }

      res.status(200).json({
        status: 'success',
        data: {
          school_name: school.name,
          school_website: school.website,
          custom_domain: customDomain || null,
          status,
          message,
          verification_steps: verificationSteps,
          default_domain: `${school.name.toLowerCase().replace(/\s+/g, '')}.kora.com`,
          domain_status: {
            is_configured: !!customDomain,
            is_verified: config.domain_verified || false,
            can_activate: isValidFormat && customDomain
          }
        }
      });
    } catch (error) {
      console.error('Check Custom Domain Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check custom domain',
        error: error.message
      });
    }
  }

  // =============================================
  // VERIFY CUSTOM DOMAIN
  // =============================================
  async verifyCustomDomain(req, res) {
    try {
      const { schoolId } = req.params;
      const { domain } = req.body;
      const { adminId } = req.user;

      if (!domain) {
        return res.status(400).json({
          status: 'error',
          message: 'Domain is required for verification'
        });
      }

      // Get school config
      const { data: school, error: fetchError } = await supabaseAdmin
        .from('schools')
        .select('white_label_config')
        .eq('id', schoolId)
        .single();

      if (fetchError) throw fetchError;

      const config = school.white_label_config || {};

      // In production, you would actually verify DNS records here
      // For demo, we'll simulate verification
      const isVerified = domain === config.custom_domain;

      if (!isVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'Domain does not match configured custom domain',
          data: {
            configured_domain: config.custom_domain,
            provided_domain: domain
          }
        });
      }

      // Update config with verified status
      const updatedConfig = {
        ...config,
        domain_verified: true,
        domain_verified_at: new Date()
      };

      await supabaseAdmin
        .from('schools')
        .update({
          white_label_config: updatedConfig,
          updated_at: new Date()
        })
        .eq('id', schoolId);

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'VERIFY_CUSTOM_DOMAIN',
          entity_type: 'school',
          entity_id: schoolId,
          new_values: { domain, verified: true }
        });

      res.status(200).json({
        status: 'success',
        message: 'Custom domain verified successfully!',
        data: {
          domain,
          verified: true,
          verified_at: new Date()
        }
      });
    } catch (error) {
      console.error('Verify Custom Domain Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to verify custom domain',
        error: error.message
      });
    }
  }

  // =============================================
  // GENERATE CUSTOM LOGIN PAGE
  // =============================================
  async generateCustomLoginPage(req, res) {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;

      const { data: school, error } = await supabaseAdmin
        .from('schools')
        .select('name, logo_url, school_colours, white_label_config, website')
        .eq('id', schoolId)
        .single();

      if (error) throw error;

      const config = school.white_label_config || {};
      const colours = config.custom_colours || school.school_colours || {
        primary: '#4F46E5',
        secondary: '#7C3AED'
      };
      const logo = config.custom_logo || school.logo_url || '';
      const customDomain = config.custom_domain || '';
      const baseUrl = customDomain ? `https://${customDomain}` : `${process.env.FRONTEND_URL}`;

      // Generate complete custom login page HTML
      const loginPageHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${school.name} - Login</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, ${colours.primary}22 0%, ${colours.secondary}22 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .login-container {
            background: white;
            border-radius: 24px;
            box-shadow: 0 25px 60px rgba(0,0,0,0.12);
            padding: 48px 40px;
            max-width: 420px;
            width: 100%;
            transition: all 0.3s ease;
        }
        .login-container:hover {
            box-shadow: 0 30px 70px rgba(0,0,0,0.15);
        }
        .login-header {
            text-align: center;
            margin-bottom: 32px;
        }
        .login-header .logo-container {
            width: 100px;
            height: 100px;
            margin: 0 auto 16px;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            border: 2px solid ${colours.primary}22;
        }
        .login-header .logo-container img {
            max-width: 80%;
            max-height: 80%;
            object-fit: contain;
        }
        .login-header .logo-placeholder {
            width: 100px;
            height: 100px;
            margin: 0 auto 16px;
            border-radius: 50%;
            background: ${colours.primary};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: 700;
            color: white;
        }
        .login-header h1 {
            color: ${colours.primary};
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .login-header p {
            color: #6b7280;
            font-size: 14px;
            margin-top: 4px;
            font-weight: 400;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 6px;
        }
        .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 14px;
            transition: border-color 0.2s, box-shadow 0.2s;
            outline: none;
            font-family: 'Inter', sans-serif;
        }
        .form-group input:focus {
            border-color: ${colours.primary};
            box-shadow: 0 0 0 4px ${colours.primary}22;
        }
        .form-group input::placeholder {
            color: #9ca3af;
        }
        .btn-login {
            width: 100%;
            padding: 14px;
            background: ${colours.primary};
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .btn-login:hover {
            background: ${colours.secondary};
            transform: translateY(-1px);
            box-shadow: 0 4px 12px ${colours.primary}44;
        }
        .btn-login:active {
            transform: translateY(0);
        }
        .login-footer {
            text-align: center;
            margin-top: 24px;
            font-size: 13px;
            color: #9ca3af;
        }
        .login-footer a {
            color: ${colours.primary};
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
        }
        .login-footer a:hover {
            color: ${colours.secondary};
            text-decoration: underline;
        }
        .login-footer .divider {
            margin: 0 8px;
            color: #d1d5db;
        }
        .login-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 13px;
            margin-bottom: 16px;
            display: none;
        }
        .login-success {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #16a34a;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 13px;
            margin-bottom: 16px;
            display: none;
        }
        .powered-by {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            color: #d1d5db;
        }
        .powered-by a {
            color: #9ca3af;
            text-decoration: none;
        }
        .powered-by a:hover {
            color: ${colours.primary};
        }
        @media (max-width: 480px) {
            .login-container {
                padding: 32px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            ${logo ? `
            <div class="logo-container">
                <img src="${logo}" alt="${school.name}">
            </div>
            ` : `
            <div class="logo-placeholder">
                ${school.name.charAt(0)}
            </div>
            `}
            <h1>${school.name}</h1>
            <p>School Management System</p>
        </div>

        <div id="errorMessage" class="login-error"></div>
        <div id="successMessage" class="login-success"></div>

        <form id="loginForm" action="${baseUrl}/api/auth/login" method="POST">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email"
                    placeholder="Enter your email" 
                    required
                    autocomplete="email"
                >
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password"
                    placeholder="Enter your password" 
                    required
                    autocomplete="current-password"
                >
            </div>
            <button type="submit" class="btn-login">Sign In</button>
        </form>

        <div class="login-footer">
            <a href="${baseUrl}/forgot-password">Forgot password?</a>
            <span class="divider">•</span>
            <a href="${baseUrl}/register-school">Create account</a>
        </div>

        <div class="powered-by">
            Powered by <a href="https://kora.com">Kora School Management</a>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('errorMessage');
            const successDiv = document.getElementById('successMessage');
            
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            
            if (!email || !password) {
                errorDiv.textContent = 'Please enter both email and password.';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Submit to login endpoint
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    successDiv.textContent = 'Login successful! Redirecting...';
                    successDiv.style.display = 'block';
                    setTimeout(function() {
                        window.location.href = '/dashboard';
                    }, 1000);
                } else {
                    errorDiv.textContent = data.message || 'Invalid email or password.';
                    errorDiv.style.display = 'block';
                }
            })
            .catch(error => {
                errorDiv.textContent = 'An error occurred. Please try again.';
                errorDiv.style.display = 'block';
            });
        });
    </script>
</body>
</html>
      `;

      // Store the custom login page HTML in the database
      await supabaseAdmin
        .from('schools')
        .update({
          white_label_config: {
            ...config,
            custom_login_page: true,
            custom_login_page_html: loginPageHTML,
            login_page_generated_at: new Date()
          },
          updated_at: new Date()
        })
        .eq('id', schoolId);

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'GENERATE_CUSTOM_LOGIN',
          entity_type: 'school',
          entity_id: schoolId,
          new_values: { generated: true, has_logo: !!logo }
        });

      const previewUrl = `/custom-login/${schoolId}`;

      res.status(200).json({
        status: 'success',
        message: 'Custom login page generated successfully',
        data: {
          html: loginPageHTML,
          preview_url: previewUrl,
          school_name: school.name,
          colours: colours,
          logo_url: logo,
          custom_domain: customDomain || null
        }
      });
    } catch (error) {
      console.error('Generate Custom Login Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate custom login page',
        error: error.message
      });
    }
  }

  // =============================================
  // GET CUSTOM LOGIN PAGE (for preview)
  // =============================================
  async getCustomLoginPage(req, res) {
    try {
      const { schoolId } = req.params;

      const { data: school, error } = await supabaseAdmin
        .from('schools')
        .select('white_label_config, name, logo_url, school_colours')
        .eq('id', schoolId)
        .single();

      if (error) throw error;

      const config = school.white_label_config || {};
      const html = config.custom_login_page_html;

      if (!html) {
        return res.status(404).json({
          status: 'error',
          message: 'Custom login page not found. Please generate one first.'
        });
      }

      // If custom domain is configured, redirect to custom domain
      const customDomain = config.custom_domain;
      if (customDomain && config.domain_verified) {
        return res.redirect(`https://${customDomain}/login`);
      }

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Get Custom Login Page Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get custom login page',
        error: error.message
      });
    }
  }

  

  // =============================================
  // DELETE CUSTOM LOGIN PAGE
  // =============================================
  async deleteCustomLoginPage(req, res) {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;

      // Get current config
      const { data: school, error: fetchError } = await supabaseAdmin
        .from('schools')
        .select('white_label_config')
        .eq('id', schoolId)
        .single();

      if (fetchError) throw fetchError;

      const config = school.white_label_config || {};
      
      // Remove custom login page HTML
      const updatedConfig = {
        ...config,
        custom_login_page: false,
        custom_login_page_html: null,
        login_page_generated_at: null
      };

      await supabaseAdmin
        .from('schools')
        .update({
          white_label_config: updatedConfig,
          updated_at: new Date()
        })
        .eq('id', schoolId);

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'DELETE_CUSTOM_LOGIN',
          entity_type: 'school',
          entity_id: schoolId,
          new_values: { deleted: true }
        });

      res.status(200).json({
        status: 'success',
        message: 'Custom login page deleted successfully'
      });
    } catch (error) {
      console.error('Delete Custom Login Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete custom login page',
        error: error.message
      });
    }
  }

  // =============================================
  // GET SCHOOL BY CUSTOM DOMAIN
  // =============================================
  async getSchoolByDomain(req, res) {
    try {
      const { domain } = req.params;

      // Find school with matching custom domain
      const { data: schools, error } = await supabaseAdmin
        .from('schools')
        .select('id, name, white_label_config, logo_url, school_colours')
        .eq('white_label_config->>custom_domain', domain)
        .eq('white_label_config->>domain_verified', true)
        .limit(1);

      if (error) throw error;

      if (!schools || schools.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No school found for this domain'
        });
      }

      const school = schools[0];
      const config = school.white_label_config || {};

      res.status(200).json({
        status: 'success',
        data: {
          school_id: school.id,
          school_name: school.name,
          logo_url: config.custom_logo || school.logo_url,
          colours: config.custom_colours || school.school_colours || {
            primary: '#4F46E5',
            secondary: '#7C3AED'
          },
          has_custom_login: config.custom_login_page || false,
          login_page_url: `/custom-login/${school.id}`
        }
      });
    } catch (error) {
      console.error('Get School By Domain Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch school by domain',
        error: error.message
      });
    }
  }
}

module.exports = new WhiteLabelController();