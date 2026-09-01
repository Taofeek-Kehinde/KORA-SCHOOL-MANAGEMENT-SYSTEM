const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const auditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/logs/export', authorize('super_admin'), auditController.exportAuditLogs);


// =============================================
// GET AUDIT LOGS
// =============================================
router.get('/logs', authorize('super_admin'), async (req, res) => {
  try {
    const result = await auditService.getAuditLogs(req.query);
    
    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.error
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get Audit Logs Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});
router.get('/logs/statistics', authorize('super_admin'), auditController.getAuditStatistics);
router.get('/logs/export', authorize('super_admin'), auditController.exportAuditLogs);

// =============================================
// GET AUDIT STATISTICS
// =============================================
router.get('/logs/statistics', authorize('super_admin'), async (req, res) => {
  try {
    const { schoolId } = req.query;
    const result = await auditService.getAuditStatistics(schoolId);

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.error
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data
    });
  } catch (error) {
    console.error('Get Audit Statistics Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit statistics',
      error: error.message
    });
  }
});

// =============================================
// GET AUDIT LOGS BY SCHOOL
// =============================================
router.get('/schools/:schoolId/logs', authorize('school_admin', 'super_admin'), async (req, res) => {
  try {
    const { schoolId } = req.params;
    const result = await auditService.getAuditLogs({
      ...req.query,
      schoolId
    });

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.error
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get School Audit Logs Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch school audit logs',
      error: error.message
    });
  }
});

module.exports = router;