const { supabaseAdmin } = require('../config/supabase');

class SchemeOfWorkController {
  // =============================================
  // GET SCHEMES OF WORK
  // =============================================
  getSchemesOfWork = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { teacherId, subjectId, classId, termId, status } = req.query;

      let query = supabaseAdmin
        .from('schemes_of_work')
        .select(`
          *,
          subjects!subject_id(id, name, code),
          classes!class_id(id, name),
          terms:academic_terms!term_id(id, name),
          teachers!teacher_id(first_name, last_name)
        `)
        .eq('school_id', schoolId);

      if (teacherId) query = query.eq('teacher_id', teacherId);
      if (subjectId) query = query.eq('subject_id', subjectId);
      if (classId) query = query.eq('class_id', classId);
      if (termId) query = query.eq('term_id', termId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query.order('week_number', { ascending: true });
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Schemes of Work Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get schemes of work', error: error.message });
    }
  };

  // =============================================
  // CREATE SCHEME OF WORK
  // =============================================
  createSchemeOfWork = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { subjectId, classId, termId, weekNumber, topic, learningObjectives, teachingMaterials, teachingMethod, assessmentMethod, homework } = req.body;

      if (!subjectId || !classId || !termId || !weekNumber || !topic) {
        return res.status(400).json({ status: 'error', message: 'Subject, class, term, week number, and topic are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('schemes_of_work')
        .insert({
          school_id: schoolId,
          subject_id: subjectId,
          class_id: classId,
          term_id: termId,
          teacher_id: adminId,
          week_number: weekNumber,
          topic,
          learning_objectives: learningObjectives || '',
          teaching_materials: teachingMaterials || '',
          teaching_method: teachingMethod || '',
          assessment_method: assessmentMethod || '',
          homework: homework || '',
          status: 'pending',
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Scheme of work created successfully', data });
    } catch (error) {
      console.error('Create Scheme of Work Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create scheme of work', error: error.message });
    }
  };

  // =============================================
  // UPDATE SCHEME OF WORK
  // =============================================
  updateSchemeOfWork = async (req, res) => {
    try {
      const { schoolId, schemeId } = req.params;
      const { weekNumber, topic, learningObjectives, teachingMaterials, teachingMethod, assessmentMethod, homework } = req.body;

      const updateData = {};
      if (weekNumber !== undefined) updateData.week_number = weekNumber;
      if (topic !== undefined) updateData.topic = topic;
      if (learningObjectives !== undefined) updateData.learning_objectives = learningObjectives;
      if (teachingMaterials !== undefined) updateData.teaching_materials = teachingMaterials;
      if (teachingMethod !== undefined) updateData.teaching_method = teachingMethod;
      if (assessmentMethod !== undefined) updateData.assessment_method = assessmentMethod;
      if (homework !== undefined) updateData.homework = homework;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('schemes_of_work')
        .update(updateData)
        .eq('id', schemeId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'Scheme of work updated successfully', data });
    } catch (error) {
      console.error('Update Scheme of Work Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update scheme of work', error: error.message });
    }
  };

  // =============================================
  // DELETE SCHEME OF WORK
  // =============================================
  deleteSchemeOfWork = async (req, res) => {
    try {
      const { schoolId, schemeId } = req.params;
      const { error } = await supabaseAdmin
        .from('schemes_of_work')
        .delete()
        .eq('id', schemeId)
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'Scheme of work deleted successfully' });
    } catch (error) {
      console.error('Delete Scheme of Work Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete scheme of work', error: error.message });
    }
  };

  // =============================================
  // APPROVE SCHEME OF WORK (HOD)
  // =============================================
  approveSchemeOfWork = async (req, res) => {
    try {
      const { schoolId, schemeId } = req.params;
      const { adminId } = req.user;
      const { approve, comment } = req.body;

      const status = approve ? 'approved' : 'rejected';

      const { data, error } = await supabaseAdmin
        .from('schemes_of_work')
        .update({
          status,
          hod_reviewed_by: adminId,
          hod_reviewed_at: new Date(),
          hod_comment: comment || '',
          updated_at: new Date()
        })
        .eq('id', schemeId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: `Scheme of work ${status}`, data });
    } catch (error) {
      console.error('Approve Scheme of Work Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to approve scheme of work', error: error.message });
    }
  };

  // =============================================
  // GET PENDING SCHEMES OF WORK
  // =============================================
  getPendingSchemesOfWork = async (req, res) => {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('schemes_of_work')
        .select(`
          *,
          subjects!subject_id(id, name, code),
          classes!class_id(id, name),
          terms:academic_terms!term_id(id, name),
          teachers!teacher_id(first_name, last_name)
        `)
        .eq('school_id', schoolId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Pending Schemes of Work Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get pending schemes of work', error: error.message });
    }
  };
}

module.exports = new SchemeOfWorkController();