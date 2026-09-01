const { supabaseAdmin } = require('../config/supabase');

class SubscriptionController {
  // Get all subscription plans
  async getPlans(req, res) {
    try {
      const { active_only = 'true' } = req.query;

      let query = supabaseAdmin
        .from('subscription_plans')
        .select('*');

      if (active_only === 'true') {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query
        .order('price_per_student', { ascending: true });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || []
      });
    } catch (error) {
      console.error('Get Plans Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch subscription plans',
        error: error.message
      });
    }
  }

  // Create subscription plan
  async createPlan(req, res) {
    try {
      const {
        name,
        description,
        pricePerStudent,
        billingFrequency,
        freeTrialDays,
        gracePeriodDays,
        features
      } = req.body;
      const { adminId } = req.user;

      // Validation
      if (!name || !pricePerStudent || !billingFrequency) {
        return res.status(400).json({
          status: 'error',
          message: 'Name, price per student, and billing frequency are required'
        });
      }

      const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .insert({
          name,
          description: description || '',
          price_per_student: pricePerStudent,
          billing_frequency: billingFrequency,
          free_trial_days: freeTrialDays || 14,
          grace_period_days: gracePeriodDays || 7,
          features: features || {},
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'CREATE_SUBSCRIPTION_PLAN',
          entity_type: 'subscription_plan',
          entity_id: data.id,
          new_values: { name, pricePerStudent, billingFrequency }
        });

      res.status(201).json({
        status: 'success',
        message: 'Subscription plan created successfully',
        data
      });
    } catch (error) {
      console.error('Create Plan Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create subscription plan',
        error: error.message
      });
    }
  }

  // Update subscription plan
  async updatePlan(req, res) {
    try {
      const { planId } = req.params;
      const {
        name,
        description,
        pricePerStudent,
        billingFrequency,
        freeTrialDays,
        gracePeriodDays,
        features,
        isActive
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (pricePerStudent !== undefined) updateData.price_per_student = pricePerStudent;
      if (billingFrequency !== undefined) updateData.billing_frequency = billingFrequency;
      if (freeTrialDays !== undefined) updateData.free_trial_days = freeTrialDays;
      if (gracePeriodDays !== undefined) updateData.grace_period_days = gracePeriodDays;
      if (features !== undefined) updateData.features = features;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .update(updateData)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'UPDATE_SUBSCRIPTION_PLAN',
          entity_type: 'subscription_plan',
          entity_id: planId,
          new_values: updateData
        });

      res.status(200).json({
        status: 'success',
        message: 'Subscription plan updated successfully',
        data
      });
    } catch (error) {
      console.error('Update Plan Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update subscription plan',
        error: error.message
      });
    }
  }

  // Delete subscription plan
  async deletePlan(req, res) {
    try {
      const { planId } = req.params;
      const { adminId } = req.user;

      // Check if plan is in use
      const { data: schoolsUsingPlan, error: checkError } = await supabaseAdmin
        .from('schools')
        .select('id, name')
        .eq('subscription_plan_id', planId)
        .limit(1);

      if (checkError) throw checkError;

      if (schoolsUsingPlan && schoolsUsingPlan.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete plan. It is currently assigned to schools.',
          data: schoolsUsingPlan
        });
      }

      const { error } = await supabaseAdmin
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DELETE_SUBSCRIPTION_PLAN',
          entity_type: 'subscription_plan',
          entity_id: planId,
          new_values: { deleted: true }
        });

      res.status(200).json({
        status: 'success',
        message: 'Subscription plan deleted successfully'
      });
    } catch (error) {
      console.error('Delete Plan Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete subscription plan',
        error: error.message
      });
    }
  }

  // =============================================
  // COUPON MANAGEMENT
  // =============================================

  // Get all coupons
  async getCoupons(req, res) {
    try {
      const { active_only = 'false' } = req.query;

      let query = supabaseAdmin
        .from('coupons')
        .select('*, schools!school_id(name)');

      if (active_only === 'true') {
        query = query.eq('is_active', true)
          .gte('valid_until', new Date().toISOString().split('T')[0]);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || []
      });
    } catch (error) {
      console.error('Get Coupons Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch coupons',
        error: error.message
      });
    }
  }

  // Create coupon
  async createCoupon(req, res) {
    try {
      const {
        schoolId,
        code,
        discountPercentage,
        description,
        validFrom,
        validUntil,
        maxUses
      } = req.body;
      const { adminId } = req.user;

      // Validation
      if (!code || !discountPercentage || !validFrom || !validUntil) {
        return res.status(400).json({
          status: 'error',
          message: 'Code, discount percentage, valid from, and valid until are required'
        });
      }

      // Check if code exists
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('coupons')
        .select('id')
        .eq('code', code.toUpperCase())
        .single();

      if (existing) {
        return res.status(400).json({
          status: 'error',
          message: 'Coupon code already exists'
        });
      }

      const { data, error } = await supabaseAdmin
        .from('coupons')
        .insert({
          school_id: schoolId || null,
          code: code.toUpperCase(),
          discount_percentage: discountPercentage,
          description: description || '',
          valid_from: validFrom,
          valid_until: validUntil,
          max_uses: maxUses || null,
          used_count: 0,
          is_active: true,
          created_at: new Date(),
          created_by: adminId
        })
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'CREATE_COUPON',
          entity_type: 'coupon',
          entity_id: data.id,
          new_values: { code, discountPercentage, validFrom, validUntil }
        });

      res.status(201).json({
        status: 'success',
        message: 'Coupon created successfully',
        data
      });
    } catch (error) {
      console.error('Create Coupon Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create coupon',
        error: error.message
      });
    }
  }

  // Update coupon
  async updateCoupon(req, res) {
    try {
      const { couponId } = req.params;
      const {
        discountPercentage,
        description,
        validFrom,
        validUntil,
        maxUses,
        isActive
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (discountPercentage !== undefined) updateData.discount_percentage = discountPercentage;
      if (description !== undefined) updateData.description = description;
      if (validFrom !== undefined) updateData.valid_from = validFrom;
      if (validUntil !== undefined) updateData.valid_until = validUntil;
      if (maxUses !== undefined) updateData.max_uses = maxUses;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('coupons')
        .update(updateData)
        .eq('id', couponId)
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'UPDATE_COUPON',
          entity_type: 'coupon',
          entity_id: couponId,
          new_values: updateData
        });

      res.status(200).json({
        status: 'success',
        message: 'Coupon updated successfully',
        data
      });
    } catch (error) {
      console.error('Update Coupon Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update coupon',
        error: error.message
      });
    }
  }

  // Delete coupon
  async deleteCoupon(req, res) {
    try {
      const { couponId } = req.params;
      const { adminId } = req.user;

      const { error } = await supabaseAdmin
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DELETE_COUPON',
          entity_type: 'coupon',
          entity_id: couponId,
          new_values: { deleted: true }
        });

      res.status(200).json({
        status: 'success',
        message: 'Coupon deleted successfully'
      });
    } catch (error) {
      console.error('Delete Coupon Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete coupon',
        error: error.message
      });
    }
  }

  // =============================================
  // PROMO CAMPAIGN MANAGEMENT
  // =============================================

  // Get all promo campaigns
  async getPromoCampaigns(req, res) {
    try {
      const { active_only = 'false' } = req.query;

      let query = supabaseAdmin
        .from('promo_campaigns')
        .select('*');

      if (active_only === 'true') {
        query = query.eq('is_active', true)
          .gte('valid_until', new Date().toISOString().split('T')[0]);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get usage count for each campaign
      const campaignsWithUsage = await Promise.all((data || []).map(async (campaign) => {
        const { count, error: countError } = await supabaseAdmin
          .from('schools')
          .select('id', { count: 'exact', head: true })
          .eq('promo_campaign_id', campaign.id);

        return {
          ...campaign,
          used_count: count || 0
        };
      }));

      res.status(200).json({
        status: 'success',
        data: campaignsWithUsage || []
      });
    } catch (error) {
      console.error('Get Promo Campaigns Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch promo campaigns',
        error: error.message
      });
    }
  }

  // Create promo campaign
  async createPromoCampaign(req, res) {
    try {
      const {
        name,
        description,
        discountPercentage,
        validFrom,
        validUntil,
        targetSchoolTypes,
        maxSchools
      } = req.body;
      const { adminId } = req.user;

      // Validation
      if (!name || !discountPercentage || !validFrom || !validUntil) {
        return res.status(400).json({
          status: 'error',
          message: 'Name, discount percentage, valid from, and valid until are required'
        });
      }

      const { data, error } = await supabaseAdmin
        .from('promo_campaigns')
        .insert({
          name,
          description: description || '',
          discount_percentage: discountPercentage,
          valid_from: validFrom,
          valid_until: validUntil,
          target_school_types: targetSchoolTypes || [],
          max_schools: maxSchools || null,
          used_count: 0,
          is_active: true,
          created_at: new Date(),
          created_by: adminId
        })
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'CREATE_PROMO_CAMPAIGN',
          entity_type: 'promo_campaign',
          entity_id: data.id,
          new_values: { name, discountPercentage, validFrom, validUntil }
        });

      res.status(201).json({
        status: 'success',
        message: 'Promo campaign created successfully',
        data
      });
    } catch (error) {
      console.error('Create Promo Campaign Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create promo campaign',
        error: error.message
      });
    }
  }

  // Update promo campaign
  async updatePromoCampaign(req, res) {
    try {
      const { campaignId } = req.params;
      const {
        name,
        description,
        discountPercentage,
        validFrom,
        validUntil,
        targetSchoolTypes,
        maxSchools,
        isActive
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (discountPercentage !== undefined) updateData.discount_percentage = discountPercentage;
      if (validFrom !== undefined) updateData.valid_from = validFrom;
      if (validUntil !== undefined) updateData.valid_until = validUntil;
      if (targetSchoolTypes !== undefined) updateData.target_school_types = targetSchoolTypes;
      if (maxSchools !== undefined) updateData.max_schools = maxSchools;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('promo_campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'UPDATE_PROMO_CAMPAIGN',
          entity_type: 'promo_campaign',
          entity_id: campaignId,
          new_values: updateData
        });

      res.status(200).json({
        status: 'success',
        message: 'Promo campaign updated successfully',
        data
      });
    } catch (error) {
      console.error('Update Promo Campaign Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update promo campaign',
        error: error.message
      });
    }
  }

  // Delete promo campaign
  async deletePromoCampaign(req, res) {
    try {
      const { campaignId } = req.params;
      const { adminId } = req.user;

      // Check if campaign is in use
      const { data: schoolsUsing, error: checkError } = await supabaseAdmin
        .from('schools')
        .select('id, name')
        .eq('promo_campaign_id', campaignId)
        .limit(1);

      if (checkError) throw checkError;

      if (schoolsUsing && schoolsUsing.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete campaign. It is currently assigned to schools.',
          data: schoolsUsing
        });
      }

      const { error } = await supabaseAdmin
        .from('promo_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DELETE_PROMO_CAMPAIGN',
          entity_type: 'promo_campaign',
          entity_id: campaignId,
          new_values: { deleted: true }
        });

      res.status(200).json({
        status: 'success',
        message: 'Promo campaign deleted successfully'
      });
    } catch (error) {
      console.error('Delete Promo Campaign Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete promo campaign',
        error: error.message
      });
    }
  }
}

module.exports = new SubscriptionController();