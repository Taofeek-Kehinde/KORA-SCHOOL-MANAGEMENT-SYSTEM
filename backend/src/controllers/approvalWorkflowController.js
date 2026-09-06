const { supabaseAdmin } = require('../config/supabase');

class ApprovalWorkflowController {
  // =============================================
  // GET APPROVAL WORKFLOWS
  // =============================================
  getApprovalWorkflows = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { data, error } = await supabaseAdmin
        .from('approval_workflows')
        .select('*')
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Approval Workflows Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get approval workflows', error: error.message });
    }
  };

  // =============================================
  // CONFIGURE APPROVAL WORKFLOW
  // =============================================
// =============================================
// CONFIGURE APPROVAL WORKFLOW (Fixed)
// =============================================
configureApprovalWorkflow = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { adminId } = req.user;
    const { workflowType, stages, isEnabled } = req.body;

    if (!workflowType) {
      return res.status(400).json({ status: 'error', message: 'Workflow type is required' });
    }

    // First, check if workflow exists
    const { data: existing } = await supabaseAdmin
      .from('approval_workflows')
      .select('*')
      .eq('school_id', schoolId)
      .eq('workflow_type', workflowType)
      .maybeSingle();

    if (existing) {
      // Update existing workflow
      const { data, error } = await supabaseAdmin
        .from('approval_workflows')
        .update({
          stages: stages || [],
          is_enabled: isEnabled !== undefined ? isEnabled : existing.is_enabled,
          updated_at: new Date()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ status: 'success', message: 'Approval workflow updated successfully', data });
    }

    // Create new workflow
    const { data, error } = await supabaseAdmin
      .from('approval_workflows')
      .insert({
        school_id: schoolId,
        workflow_type: workflowType,
        stages: stages || [],
        is_enabled: isEnabled !== undefined ? isEnabled : true,
        created_by: adminId,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ status: 'success', message: 'Approval workflow created successfully', data });
  } catch (error) {
    console.error('Configure Approval Workflow Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to configure approval workflow', error: error.message });
  }
};

  // =============================================
  // GET APPROVAL RECORDS
  // =============================================
  getApprovalRecords = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { workflowType, entityId, status } = req.query;

      let query = supabaseAdmin
        .from('approval_records')
        .select('*')
        .eq('school_id', schoolId);

      if (workflowType) query = query.eq('workflow_type', workflowType);
      if (entityId) query = query.eq('entity_id', entityId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Approval Records Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get approval records', error: error.message });
    }
  };

  // =============================================
  // SUBMIT FOR APPROVAL
  // =============================================
  submitForApproval = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { workflowType, entityId, stage } = req.body;

      if (!workflowType || !entityId || !stage) {
        return res.status(400).json({ status: 'error', message: 'Workflow type, entity ID, and stage are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('approval_records')
        .insert({
          school_id: schoolId,
          workflow_type: workflowType,
          entity_id: entityId,
          stage,
          status: 'pending',
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Submitted for approval', data });
    } catch (error) {
      console.error('Submit For Approval Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to submit for approval', error: error.message });
    }
  };

  // =============================================
  // PROCESS APPROVAL
  // =============================================
  processApproval = async (req, res) => {
    try {
      const { schoolId, approvalId } = req.params;
      const { adminId } = req.user;
      const { approve, comment } = req.body;

      const status = approve ? 'approved' : 'rejected';

      const { data, error } = await supabaseAdmin
        .from('approval_records')
        .update({
          status,
          reviewed_by: adminId,
          comment: comment || '',
          reviewed_at: new Date()
        })
        .eq('id', approvalId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: `Approval ${status}`, data });
    } catch (error) {
      console.error('Process Approval Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to process approval', error: error.message });
    }
  };
}

module.exports = new ApprovalWorkflowController();