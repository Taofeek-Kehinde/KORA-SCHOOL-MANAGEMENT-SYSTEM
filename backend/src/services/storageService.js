const { supabaseAdmin } = require('../config/supabase');

class StorageService {
  async uploadSchoolLogo(base64Image, schoolName) {
    try {
      if (!base64Image) return null;

      // Check if it's already a URL
      if (base64Image.startsWith('http')) {
        return base64Image;
      }

      // Check if it's a valid base64 image
      const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        // If not base64, return as is (it might be a URL)
        return base64Image;
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const mimeType = matches[1];

      // Generate filename
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const fileName = `logos/${schoolName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${fileExtension}`;

      // Upload to Supabase storage
      const { error } = await supabaseAdmin.storage
        .from('school-logos')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true
        });

      if (error) {
        console.error('Storage upload error:', error);
        // Fallback: return base64 if upload fails
        return base64Image;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('school-logos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload School Logo Error:', error);
      // Return base64 as fallback
      return base64Image;
    }
  }

  async uploadSchoolDocument(file, schoolId, category) {
    try {
      const fileName = `documents/${schoolId}/${category}/${Date.now()}-${file.originalname}`;

      const { error } = await supabaseAdmin.storage
        .from('school-documents')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) {
        console.error('Storage upload error:', error);
        return null;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('school-documents')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload School Document Error:', error);
      return null;
    }
  }

  async deleteFile(fileUrl) {
    try {
      if (!fileUrl) return false;

      // Extract path from URL
      const path = fileUrl.split('/').pop();
      
      const { error } = await supabaseAdmin.storage
        .from('school-logos')
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Delete File Error:', error);
      return false;
    }
  }
}

module.exports = new StorageService();