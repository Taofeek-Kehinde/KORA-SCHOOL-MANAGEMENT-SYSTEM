const { supabaseAdmin } = require('../config/supabase');

class CurriculumController {
  // =============================================
  // GET ALL CURRICULA
  // =============================================
  getCurricula = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { data, error } = await supabaseAdmin
        .from('curricula')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Curricula Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get curricula', error: error.message });
    }
  };

  // =============================================
  // CREATE CURRICULUM
  // =============================================
  createCurriculum = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { name, curriculumType, description } = req.body;

      if (!name) {
        return res.status(400).json({ status: 'error', message: 'Curriculum name is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('curricula')
        .insert({
          school_id: schoolId,
          name,
          curriculum_type: curriculumType || 'custom',
          description: description || '',
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Curriculum created successfully', data });
    } catch (error) {
      console.error('Create Curriculum Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create curriculum', error: error.message });
    }
  };

  // =============================================
  // UPDATE CURRICULUM
  // =============================================
  updateCurriculum = async (req, res) => {
    try {
      const { schoolId, curriculumId } = req.params;
      const { name, curriculumType, description, isActive } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (curriculumType !== undefined) updateData.curriculum_type = curriculumType;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('curricula')
        .update(updateData)
        .eq('id', curriculumId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'Curriculum updated successfully', data });
    } catch (error) {
      console.error('Update Curriculum Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update curriculum', error: error.message });
    }
  };

  // =============================================
  // DELETE CURRICULUM
  // =============================================
  deleteCurriculum = async (req, res) => {
    try {
      const { schoolId, curriculumId } = req.params;
      const { error } = await supabaseAdmin
        .from('curricula')
        .delete()
        .eq('id', curriculumId)
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'Curriculum deleted successfully' });
    } catch (error) {
      console.error('Delete Curriculum Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete curriculum', error: error.message });
    }
  };

  // =============================================
  // GET CURRICULUM TOPICS
  // =============================================
  getCurriculumTopics = async (req, res) => {
    try {
      const { curriculumId } = req.params;
      const { subjectId, classId } = req.query;

      let query = supabaseAdmin
        .from('curriculum_topics')
        .select(`
          *,
          subjects!subject_id(id, name, code),
          classes!class_id(id, name)
        `)
        .eq('curriculum_id', curriculumId);

      if (subjectId) query = query.eq('subject_id', subjectId);
      if (classId) query = query.eq('class_id', classId);

      const { data, error } = await query.order('week_number', { ascending: true });
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Curriculum Topics Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get curriculum topics', error: error.message });
    }
  };

  // =============================================
  // ADD CURRICULUM TOPIC
  // =============================================
  addCurriculumTopic = async (req, res) => {
    try {
      const { curriculumId } = req.params;
      const { adminId } = req.user;
      const { subjectId, classId, weekNumber, topic, learningObjectives, learningOutcomes, assessmentMethods } = req.body;

      if (!subjectId || !classId || !weekNumber || !topic) {
        return res.status(400).json({ status: 'error', message: 'Subject, class, week number, and topic are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('curriculum_topics')
        .insert({
          curriculum_id: curriculumId,
          subject_id: subjectId,
          class_id: classId,
          week_number: weekNumber,
          topic,
          learning_objectives: learningObjectives || '',
          learning_outcomes: learningOutcomes || '',
          assessment_methods: assessmentMethods || '',
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Curriculum topic added successfully', data });
    } catch (error) {
      console.error('Add Curriculum Topic Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to add curriculum topic', error: error.message });
    }
  };

  // =============================================
  // UPDATE CURRICULUM TOPIC
  // =============================================
  updateCurriculumTopic = async (req, res) => {
    try {
      const { curriculumId, topicId } = req.params;
      const { weekNumber, topic, learningObjectives, learningOutcomes, assessmentMethods } = req.body;

      const updateData = {};
      if (weekNumber !== undefined) updateData.week_number = weekNumber;
      if (topic !== undefined) updateData.topic = topic;
      if (learningObjectives !== undefined) updateData.learning_objectives = learningObjectives;
      if (learningOutcomes !== undefined) updateData.learning_outcomes = learningOutcomes;
      if (assessmentMethods !== undefined) updateData.assessment_methods = assessmentMethods;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('curriculum_topics')
        .update(updateData)
        .eq('id', topicId)
        .eq('curriculum_id', curriculumId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'Curriculum topic updated successfully', data });
    } catch (error) {
      console.error('Update Curriculum Topic Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update curriculum topic', error: error.message });
    }
  };

  // =============================================
  // DELETE CURRICULUM TOPIC
  // =============================================
  deleteCurriculumTopic = async (req, res) => {
    try {
      const { curriculumId, topicId } = req.params;
      const { error } = await supabaseAdmin
        .from('curriculum_topics')
        .delete()
        .eq('id', topicId)
        .eq('curriculum_id', curriculumId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'Curriculum topic deleted successfully' });
    } catch (error) {
      console.error('Delete Curriculum Topic Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete curriculum topic', error: error.message });
    }
  };
}

module.exports = new CurriculumController();