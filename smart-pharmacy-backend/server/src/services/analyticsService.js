// server/src/services/analyticsService.js
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');
const { Drug, Prescription, SalesTransaction } = require('../models');

class AnalyticsService {

  /**
   * 📊 SALES TREND (last 12 months)
   */
  async getSalesTrendData() {
    const results = await SalesTransaction.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'month', col('transaction_date')), 'month'],
        [fn('SUM', col('sale_amount')), 'totalSales']
      ],
      group: [literal('month')],
      order: [literal('month ASC')],
    });

    return results.map(r => ({
      month: r.getDataValue('month'),
      totalSales: parseFloat(r.getDataValue('totalSales')) || 0
    }));
  }

  /**
   * 🔝 Top selling products (by revenue)
   * NOTE: order by the SUM("sale_amount") expression to avoid alias-case issues in Postgres.
   */
  async getTopSellingProducts(limit = 5) {
    const results = await SalesTransaction.findAll({
      attributes: [
        'drug_id',
        [fn('SUM', col('quantity_sold')), 'totalSold'],
        [fn('SUM', col('sale_amount')), 'totalRevenue']
      ],
      include: [
        {
          model: Drug,
          as: 'drug',
          attributes: ['id', 'brand_name', 'generic_name', 'ndc']
        }
      ],
      group: ['drug_id', 'drug.id'],
      // ORDER BY SUM("sale_amount") DESC — use literal with expression to avoid alias-case mismatch
      order: [sequelize.literal('SUM("sale_amount") DESC')],
      limit
    });

    return results.map(r => ({
      drugId: r.get('drug_id'),
      totalSold: parseInt(r.get('totalSold') || 0, 10),
      totalRevenue: parseFloat(r.get('totalRevenue') || 0),
      drug: r.get('drug') ? {
        id: r.get('drug').id,
        brandName: r.get('drug').brand_name,
        genericName: r.get('drug').generic_name,
        ndc: r.get('drug').ndc
      } : null
    }));
  }

  /**
   * 💰 REVENUE SUMMARY (current month + total)
   */
  async getRevenueSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalRevenue = await SalesTransaction.sum('sale_amount') || 0;

    const monthlyRevenue = await SalesTransaction.sum('sale_amount', {
      where: sequelize.where(col('transaction_date'), { [Op.gte]: startOfMonth })
    }) || 0;

    return { totalRevenue, monthlyRevenue };
  }

  /**
   * 📦 INVENTORY SUMMARY: low stock & expired stats
   */
  async getInventorySummary() {
    const now = new Date();

    const lowStock = await Drug.count({
      where: sequelize.where(col('current_quantity'), '<', col('min_quantity'))
    });

    const expired = await Drug.count({
      where: sequelize.where(col('expiry_date'), '<', now)
    });

    return { lowStock, expired };
  }

  /**
   * 🟠 LOW STOCK DETAIL LIST
   */
  async getLowStockDetails(limit = 10) {
    return await Drug.findAll({
      where: sequelize.where(col('current_quantity'), '<', col('min_quantity')),
      order: [[col('current_quantity'), 'ASC']],
      limit
    });
  }

  /**
   * 🔴 EXPIRY TIMELINE (next 12 months)
   */
  async getExpiryTimelineData() {
    const now = new Date();
    const future = new Date();
    future.setMonth(now.getMonth() + 12);

    const results = await Drug.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'month', col('expiry_date')), 'month'],
        [fn('COUNT', '*'), 'count']
      ],
      where: {
        expiry_date: { [Op.between]: [now, future] }
      },
      group: [literal('month')],
      order: [literal('month ASC')]
    });

    return results.map(r => ({
      month: r.getDataValue('month'),
      count: parseInt(r.getDataValue('count')) || 0
    }));
  }

  /**
   * 🧪 DRUGS BY CATEGORY (generic name grouping)
   */
  async getDrugsByCategory(limit = 10) {
    const results = await Drug.findAll({
      attributes: [
        'generic_name',
        [fn('COUNT', '*'), 'count']
      ],
      group: ['generic_name'],
      order: [[literal('count'), 'DESC']],
      limit
    });

    return results.map(r => ({
      genericName: r.getDataValue('generic_name'),
      count: parseInt(r.getDataValue('count')) || 0
    }));
  }

  /**
   * 🤖 BASIC AI-STYLE ANALYSIS (placeholder)
   */
  async getAIAnalysis() {
    return {
      summary: "Inventory levels are stable with some categories nearing low-stock. Sales patterns show moderate monthly growth.",
      confidence: 0.82
    };
  }
}

module.exports = new AnalyticsService();
