const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

// =============================================
// SUBSCRIPTION PLANS
// =============================================
router.get('/plans', subscriptionController.getPlans);
router.post('/plans', subscriptionController.createPlan);
router.put('/plans/:planId', subscriptionController.updatePlan);
router.delete('/plans/:planId', subscriptionController.deletePlan);

// =============================================
// COUPONS
// =============================================
router.get('/coupons', subscriptionController.getCoupons);
router.post('/coupons', subscriptionController.createCoupon);
router.put('/coupons/:couponId', subscriptionController.updateCoupon);
router.delete('/coupons/:couponId', subscriptionController.deleteCoupon);

// =============================================
// PROMO CAMPAIGNS
// =============================================
router.get('/promo-campaigns', subscriptionController.getPromoCampaigns);
router.post('/promo-campaigns', subscriptionController.createPromoCampaign);
router.put('/promo-campaigns/:campaignId', subscriptionController.updatePromoCampaign);
router.delete('/promo-campaigns/:campaignId', subscriptionController.deletePromoCampaign);

module.exports = router;