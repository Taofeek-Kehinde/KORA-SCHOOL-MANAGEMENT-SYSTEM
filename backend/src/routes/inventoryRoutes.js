const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/schools/:schoolId/inventory', authorize('school_admin', 'super_admin'), inventoryController.getInventory);
router.post('/schools/:schoolId/inventory', authorize('school_admin', 'super_admin'), inventoryController.createInventoryItem);
router.put('/schools/:schoolId/inventory/:itemId', authorize('school_admin', 'super_admin'), inventoryController.updateInventoryItem);
router.delete('/schools/:schoolId/inventory/:itemId', authorize('school_admin', 'super_admin'), inventoryController.deleteInventoryItem);
router.get('/schools/:schoolId/inventory/summary', authorize('school_admin', 'super_admin'), inventoryController.getInventorySummary);

module.exports = router;