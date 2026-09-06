const { supabaseAdmin } = require('../config/supabase');

class AssessmentController {
  // =============================================
  // GET CA COMPONENTS
  // =============================================
  getCAComponents = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { data, error } = await supabaseAdmin
        .from('ca_components')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get CA Components Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get CA components', error: error.message });
    }
  };

  // =============================================
  // CREATE CA COMPONENT
  // =============================================
  createCAComponent = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { name, weightPercentage } = req.body;

      if (!name) {
        return res.status(400).json({ status: 'error', message: 'Component name is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('ca_components')
        .insert({
          school_id: schoolId,
          name,
          weight_percentage: weightPercentage || 10,
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'CA component created successfully', data });
    } catch (error) {
      console.error('Create CA Component Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create CA component', error: error.message });
    }
  };

  // =============================================
  // UPDATE CA COMPONENT
  // =============================================
  updateCAComponent = async (req, res) => {
    try {
      const { schoolId, componentId } = req.params;
      const { name, weightPercentage, isActive } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (weightPercentage !== undefined) updateData.weight_percentage = weightPercentage;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('ca_components')
        .update(updateData)
        .eq('id', componentId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'CA component updated successfully', data });
    } catch (error) {
      console.error('Update CA Component Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update CA component', error: error.message });
    }
  };

  // =============================================
  // DELETE CA COMPONENT
  // =============================================
  deleteCAComponent = async (req, res) => {
    try {
      const { schoolId, componentId } = req.params;
      const { error } = await supabaseAdmin
        .from('ca_components')
        .delete()
        .eq('id', componentId)
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'CA component deleted successfully' });
    } catch (error) {
      console.error('Delete CA Component Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete CA component', error: error.message });
    }
  };

  // =============================================
  // ENTER CA SCORES
  // =============================================
  enterCAScores = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { scores } = req.body;

      if (!scores || !Array.isArray(scores) || scores.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Scores are required' });
      }

      const results = { success: [], failed: [] };
      for (const record of scores) {
        try {
          const { data, error } = await supabaseAdmin
            .from('ca_scores')
            .insert({
              school_id: schoolId,
              student_id: record.studentId,
              subject_id: record.subjectId,
              class_id: record.classId,
              term_id: record.termId,
              ca_component_id: record.caComponentId,
              score: record.score || 0,
              recorded_by: adminId,
              status: 'pending',
              created_at: new Date()
            })
            .select()
            .single();

          if (error) throw error;
          results.success.push(data);
        } catch (error) {
          results.failed.push({ student_id: record.studentId, error: error.message });
        }
      }

      res.status(201).json({ status: 'success', message: `Entered ${results.success.length} scores`, data: results });
    } catch (error) {
      console.error('Enter CA Scores Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to enter scores', error: error.message });
    }
  };

  // =============================================
  // GET CA SCORES FOR CLASS
  // =============================================
  getCAScores = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { classId, subjectId, termId } = req.query;

      let query = supabaseAdmin
        .from('ca_scores')
        .select(`
          *,
          students!student_id(first_name, last_name, admission_number),
          subjects!subject_id(id, name, code),
          ca_components!ca_component_id(id, name, weight_percentage)
        `)
        .eq('school_id', schoolId);

      if (classId) query = query.eq('class_id', classId);
      if (subjectId) query = query.eq('subject_id', subjectId);
      if (termId) query = query.eq('term_id', termId);

      const { data, error } = await query;
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get CA Scores Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get CA scores', error: error.message });
    }
  };

  // =============================================
  // CALCULATE FINAL SCORE
  // =============================================
  calculateFinalScore = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { studentId, subjectId, termId } = req.body;

      // Get CA components
      const { data: components } = await supabaseAdmin
        .from('ca_components')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      // Get scores
      const { data: scores } = await supabaseAdmin
        .from('ca_scores')
        .select('*')
        .eq('school_id', schoolId)
        .eq('student_id', studentId)
        .eq('subject_id', subjectId)
        .eq('term_id', termId);

      // Calculate weighted score
      let totalWeighted = 0;
      let totalWeight = 0;

      for (const component of components || []) {
        const componentScore = scores?.find(s => s.ca_component_id === component.id);
        const score = componentScore?.score || 0;
        totalWeighted += (score / 100) * component.weight_percentage;
        totalWeight += component.weight_percentage;
      }

      const finalScore = totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) : 0;

      res.status(200).json({ status: 'success', data: { final_score: finalScore } });
    } catch (error) {
      console.error('Calculate Final Score Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to calculate final score', error: error.message });
    }
  };
}

module.exports = new AssessmentController();