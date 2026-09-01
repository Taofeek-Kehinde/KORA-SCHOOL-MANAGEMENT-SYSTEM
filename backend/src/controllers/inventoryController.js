const { supabaseAdmin } = require('../config/supabase');

class InventoryController {
  // Get inventory items
  async getInventory(req, res) {
    try {
      const { schoolId } = req.params;
      const { campusId, category, status, search } = req.query;

      let query = supabaseAdmin
        .from('inventory')
        .select('*, campuses!campus_id(name)')
        .eq('school_id', schoolId);

      if (campusId) {
        query = query.eq('campus_id', campusId);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || []
      });
    } catch (error) {
      console.error('Get Inventory Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch inventory',
        error: error.message
      });
    }
  }

  // Create inventory item
  async createInventoryItem(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        campusId,
        name,
        category,
        description,
        quantity,
        unitPrice,
        supplier,
        purchaseDate,
        expiryDate,
        location
      } = req.body;
      const { adminId } = req.user;

      if (!name || !campusId) {
        return res.status(400).json({
          status: 'error',
          message: 'Name and campus are required'
        });
      }

      const totalValue = (quantity || 0) * (unitPrice || 0);

      const { data, error } = await supabaseAdmin
        .from('inventory')
        .insert({
          school_id: schoolId,
          campus_id: campusId,
          name,
          category: category || '',
          description: description || '',
          quantity: quantity || 0,
          unit_price: unitPrice || 0,
          total_value: totalValue,
          supplier: supplier || '',
          purchase_date: purchaseDate || null,
          expiry_date: expiryDate || null,
          location: location || '',
          status: (quantity || 0) <= 0 ? 'out_of_stock' : 'available',
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'CREATE_INVENTORY',
          entity_type: 'inventory',
          entity_id: data.id,
          new_values: { name, campusId, quantity }
        });

      res.status(201).json({
        status: 'success',
        message: 'Inventory item created successfully',
        data
      });
    } catch (error) {
      console.error('Create Inventory Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create inventory item',
        error: error.message
      });
    }
  }

  // Update inventory item
  async updateInventoryItem(req, res) {
    try {
      const { schoolId, itemId } = req.params;
      const {
        campusId,
        name,
        category,
        description,
        quantity,
        unitPrice,
        supplier,
        purchaseDate,
        expiryDate,
        location,
        status
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (campusId !== undefined) updateData.campus_id = campusId;
      if (name !== undefined) updateData.name = name;
      if (category !== undefined) updateData.category = category;
      if (description !== undefined) updateData.description = description;
      if (quantity !== undefined) {
        updateData.quantity = quantity;
        updateData.status = quantity <= 0 ? 'out_of_stock' : 'available';
      }
      if (unitPrice !== undefined) {
        updateData.unit_price = unitPrice;
        updateData.total_value = (quantity || 0) * unitPrice;
      }
      if (supplier !== undefined) updateData.supplier = supplier;
      if (purchaseDate !== undefined) updateData.purchase_date = purchaseDate;
      if (expiryDate !== undefined) updateData.expiry_date = expiryDate;
      if (location !== undefined) updateData.location = location;
      if (status !== undefined) updateData.status = status;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('inventory')
        .update(updateData)
        .eq('id', itemId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'UPDATE_INVENTORY',
          entity_type: 'inventory',
          entity_id: itemId,
          new_values: updateData
        });

      res.status(200).json({
        status: 'success',
        message: 'Inventory item updated successfully',
        data
      });
    } catch (error) {
      console.error('Update Inventory Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update inventory item',
        error: error.message
      });
    }
  }

  // Delete inventory item
  async deleteInventoryItem(req, res) {
    try {
      const { schoolId, itemId } = req.params;
      const { adminId } = req.user;

      const { error } = await supabaseAdmin
        .from('inventory')
        .delete()
        .eq('id', itemId)
        .eq('school_id', schoolId);

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'DELETE_INVENTORY',
          entity_type: 'inventory',
          entity_id: itemId
        });

      res.status(200).json({
        status: 'success',
        message: 'Inventory item deleted successfully'
      });
    } catch (error) {
      console.error('Delete Inventory Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete inventory item',
        error: error.message
      });
    }
  }

  // Get inventory summary by campus
  async getInventorySummary(req, res) {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('inventory')
        .select('campus_id, quantity, unit_price, total_value, status')
        .eq('school_id', schoolId);

      if (error) throw error;

      // Group by campus
      const summary = data.reduce((acc, item) => {
        const campusId = item.campus_id || 'uncategorized';
        if (!acc[campusId]) {
          acc[campusId] = {
            total_items: 0,
            total_quantity: 0,
            total_value: 0,
            low_stock: 0,
            out_of_stock: 0
          };
        }
        acc[campusId].total_items += 1;
        acc[campusId].total_quantity += item.quantity || 0;
        acc[campusId].total_value += item.total_value || 0;
        if (item.status === 'low_stock') acc[campusId].low_stock += 1;
        if (item.status === 'out_of_stock') acc[campusId].out_of_stock += 1;
        return acc;
      }, {});

      res.status(200).json({
        status: 'success',
        data: summary
      });
    } catch (error) {
      console.error('Inventory Summary Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch inventory summary',
        error: error.message
      });
    }
  }
}

module.exports = new InventoryController();