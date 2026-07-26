// server/src/controllers/alertController.js
const { Op, col } = require('sequelize');
const { sequelize } = require('../config/database');
const { Drug, AlertHistory } = require('../models');
const alertsService = require('../services/alertsService'); // may be newly added
const { successResponse, serverError, errorResponse } = require('../utils/response');

class AlertController {
  /**
   * GET /api/alerts
   * Query params:
   *   type = 'low-stock' | 'expiry' | 'combined' (default 'combined')
   *   days = number (for expiry window)
   *   limit = number
   */
  async getAlerts(req, res) {
    try {
      const type = String(req.query.type || 'combined').toLowerCase();
      const limit = Math.max(1, parseInt(req.query.limit || '50', 10));
      const days = Math.max(1, parseInt(req.query.days || '30', 10));
      const threshold = req.query.threshold ? parseInt(req.query.threshold, 10) : null;

      // Use service if available, otherwise fallback to local checks
      const result = {};

      // Low stock
      if (type === 'low-stock' || type === 'combined') {
        if (alertsService && typeof alertsService.checkLowStock === 'function') {
          const low = await alertsService.checkLowStock(limit, threshold);
          result.lowStock = low.map(d => ({
            id: d.id,
            ndc: d.ndc,
            brandName: d.brand_name,
            genericName: d.generic_name,
            currentQuantity: d.current_quantity,
            minQuantity: d.min_quantity,
            supplier: d.supplier ? (d.supplier.name || 'Unknown') : 'Unknown',
            supplierPhone: d.supplier ? (d.supplier.phone || '') : '',
            expiryDate: d.expiry_date
          }));
        } else {
          // Fallback: Query DB directly
          const whereClause = threshold !== null
            ? { current_quantity: { [Op.lt]: threshold } }
            : sequelize.where(col('current_quantity'), '<', col('min_quantity'));

          const lowStockDrugs = await Drug.findAll({
            where: whereClause,
            include: [{ association: 'supplier', attributes: ['name', 'phone'] }],
            order: [[col('current_quantity'), 'ASC']],
            limit
          });

          result.lowStock = lowStockDrugs.map(d => ({
            id: d.id,
            ndc: d.ndc,
            brandName: d.brand_name,
            genericName: d.generic_name,
            currentQuantity: d.current_quantity,
            minQuantity: d.min_quantity,
            supplier: d.supplier?.name || 'Unknown',
            supplierPhone: d.supplier?.phone || '',
            expiryDate: d.expiry_date
          }));
        }
      }

      // Expiry
      if (type === 'expiry' || type === 'combined') {
        if (alertsService && typeof alertsService.checkExpiry === 'function') {
          const exp = await alertsService.checkExpiry(days, limit);
          result.expiry = exp.map(d => ({
            id: d.id,
            ndc: d.ndc,
            brandName: d.brand_name,
            genericName: d.generic_name,
            expiryDate: d.expiry_date,
            currentQuantity: d.current_quantity
          }));
        } else {
          const now = new Date();
          const future = new Date();
          future.setDate(now.getDate() + days);

          const expiringDrugs = await Drug.findAll({
            where: sequelize.where(col('expiry_date'), { [Op.between]: [now, future] }),
            order: [[col('expiry_date'), 'ASC']],
            limit
          });

          result.expiry = expiringDrugs.map(d => ({
            id: d.id,
            ndc: d.ndc,
            brandName: d.brand_name,
            genericName: d.generic_name,
            expiryDate: d.expiry_date,
            currentQuantity: d.current_quantity
          }));
        }
      }

      // Optionally enrich with existing alert history flags (could be added later)
      return successResponse(res, result, 'Alerts fetched successfully');
    } catch (err) {
      console.error('AlertController.getAlerts error:', err);
      return serverError(res, err);
    }
  }

  /**
   * GET /api/alerts/reorder-suggestions
   * Optional query: ?limit=20
   */
  async getReorderSuggestions(req, res) {
    try {
      const limit = Math.max(1, parseInt(req.query.limit || '20', 10));

      // Use service if available else fallback
      let lowStockDrugs;
      if (alertsService && typeof alertsService.checkLowStock === 'function') {
        lowStockDrugs = await alertsService.checkLowStock(limit, null);
      } else {
        lowStockDrugs = await Drug.findAll({
          where: sequelize.where(col('current_quantity'), '<', col('min_quantity')),
          include: [{ association: 'supplier', attributes: ['name', 'phone', 'address'] }],
          order: [[col('current_quantity'), 'ASC']],
          limit
        });
      }

      const suggestions = lowStockDrugs.map(drug => {
        const reorderQuantity = (drug.max_quantity || 0) - (drug.current_quantity || 0);
        return {
          drugId: drug.id,
          brandName: drug.brand_name,
          genericName: drug.generic_name,
          currentQuantity: drug.current_quantity,
          reorderQuantity,
          estimatedCost: reorderQuantity * (drug.purchase_price || 0),
          supplier: drug.supplier?.name || 'Unknown',
          supplierContact: drug.supplier?.phone || '',
          urgency: (drug.current_quantity || 0) < 10 ? 'URGENT' : 'SOON'
        };
      });

      return successResponse(res, suggestions, 'Reorder suggestions generated');
    } catch (err) {
      console.error('AlertController.getReorderSuggestions error:', err);
      return serverError(res, err);
    }
  }

  /**
   * POST /api/alerts/:alertId/resolve
   * Body: { actionTaken: 'reorder'|'ignore'|... }
   */
  async resolveAlert(req, res) {
    try {
      const { alertId } = req.params;
      const { actionTaken } = req.body || {};

      const alert = await AlertHistory.findByPk(alertId);
      if (!alert) return errorResponse(res, 'Alert not found', 404);

      alert.resolved = true;
      alert.updated_at = new Date();
      await alert.save();

      // If reorder, top-up the drug quantity
      if (actionTaken === 'reorder' && alert.drug_id) {
        const drug = await Drug.findByPk(alert.drug_id);
        if (drug) {
          drug.current_quantity = drug.max_quantity || drug.current_quantity;
          await drug.save();
        }
      }

      return successResponse(res, { alertId, resolved: true }, 'Alert resolved successfully');
    } catch (err) {
      console.error('AlertController.resolveAlert error:', err);
      return serverError(res, err);
    }
  }

  /**
   * GET /api/alerts/history
   * Query: ?type=low_stock&resolved=true&limit=50
   */
  async getAlertHistory(req, res) {
    try {
      const { type, resolved, limit = 50 } = req.query;
      const where = {};
      if (type) where.alert_type = type;
      if (resolved !== undefined) where.resolved = String(resolved) === 'true';

      const history = await AlertHistory.findAll({
        where,
        include: [{
          association: 'drug',
          attributes: ['brand_name', 'generic_name', 'ndc']
        }],
        limit: Math.min(500, parseInt(limit, 10)),
        order: [['created_at', 'DESC']]
      });

      // Map to clean format
      const data = history.map(h => ({
        id: h.id,
        alertType: h.alert_type,
        drugId: h.drug_id,
        message: h.message,
        severity: h.severity,
        sentToTelegram: !!h.sent_to_telegram,
        resolved: !!h.resolved,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
        drug: h.drug ? {
          brandName: h.drug.brand_name,
          genericName: h.drug.generic_name,
          ndc: h.drug.ndc
        } : null
      }));

      return successResponse(res, data, 'Alert history fetched successfully');
    } catch (err) {
      console.error('AlertController.getAlertHistory error:', err);
      return serverError(res, err);
    }
  }
}

module.exports = new AlertController();
