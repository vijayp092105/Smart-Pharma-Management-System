const { sequelize } = require('../config/database');
const { Drug, Prescription, SalesTransaction, Patient, Doctor } = require('../models');
const { successResponse, serverError } = require('../utils/response');
// Add this near the other requires at top of file
const { Op, col } = require('sequelize');


const analyticsService = require('../services/analyticsService');

class DashboardController {
  // Get dashboard summary data
  async getDashboardData(req, res) {
    try {
      const [
        totalDrugs,
        lowStockDrugs,
        expiringDrugs,
        totalPatients,
        totalDoctors,
        activePrescriptions,
        revenueSummary,
        salesTrend
      ] = await Promise.all([
        // Total drugs count
        Drug.count(),

        // Low stock drugs (< 20 units)
        Drug.count({
          where: sequelize.where(sequelize.col('current_quantity'), '<', 20)
        }),

        // Expiring drugs (next 30 days)
        Drug.count({
          where: sequelize.where(
            sequelize.col('expiry_date'),
            Op.between ? { [Op.between]: [new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] } : sequelize.literal('')
          )
        }),

        // Total patients
        Patient.count(),

        // Total doctors
        Doctor.count(),

        // Active prescriptions
        Prescription.count({
          where: {
            status: { [Op.in]: ['filled', 'picked_up'] }
          }
        }),

        // Revenue summary (includes recent sales)
        analyticsService.getRevenueSummary(),

        // Sales trend data (from analytics service)
        analyticsService.getSalesTrendData()
      ]);

      // Get top selling drugs via analytics service (uses correct DB columns)
      const topSellingRaw = await analyticsService.getTopSellingProducts(5);
      const topSellingDrugs = topSellingRaw.map(item => ({
        drugId: item.drugId,
        brandName: item.drug?.brandName || 'Unknown',
        genericName: item.drug?.genericName || '',
        totalSold: item.totalSold || 0,
        totalRevenue: item.totalRevenue || 0
      }));

      // Get prescriptions by doctor (this query uses DB-safe column names)
      const prescriptionsByDoctor = await Prescription.findAll({
        attributes: [
          'doctor_id',
          [sequelize.fn('COUNT', sequelize.col('Prescription.id')), 'prescriptionCount']
        ],
        include: [{
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'name']
        }],
        group: ['doctor_id', 'doctor.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('Prescription.id')), 'DESC']],
        limit: 8
      });

      // Get drug expiry timeline and drugs by category via controller methods (these call DB correctly)
      const expiryTimeline = await this.getExpiryTimelineData();
      const drugsByCategory = await this.getDrugsByCategory();

      const dashboardData = {
        summary: {
          totalDrugs,
          lowStockDrugs,
          expiringDrugs,
          totalPatients,
          totalDoctors,
          activePrescriptions,
          recentSales: revenueSummary.monthlyRevenue || 0
        },
        charts: {
          salesTrend,
          topSellingDrugs,
          prescriptionsByDoctor: prescriptionsByDoctor.map(item => ({
            doctorId: item.doctor_id,
            doctorName: item.doctor?.name || 'Unknown',
            prescriptionCount: item.dataValues.prescriptionCount || 0
          })),
          expiryTimeline,
          drugsByCategory
        },
        aiAnalysis: await this.getAIAnalysis()
      };

      return successResponse(res, dashboardData, 'Dashboard data fetched successfully');

    } catch (error) {
      return serverError(res, error);
    }
  }

  // Delegate sales trend calculation to analyticsService (keeps original mapping)
  async getSalesTrendData() {
    try {
      const rawTrend = await analyticsService.getSalesTrendData();
      const now = new Date();
      const months = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        const monthRecord = rawTrend.find(r => {
          const rMonth = new Date(r.month);
          return rMonth.getMonth() === date.getMonth() && rMonth.getFullYear() === date.getFullYear();
        });

        const actual = monthRecord ? (parseFloat(monthRecord.totalSales) || 0) : 0;
        const predicted = Math.round((actual * 1.1) * 100) / 100;
        months.push({
          month: monthName,
          actualSales: actual,
          predictedSales: predicted,
          trend: 0
        });
      }

      return months;
    } catch (err) {
      console.error('Error in getSalesTrendData:', err);
      const now = new Date();
      const fallback = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        fallback.push({ month: monthName, actualSales: 0, predictedSales: 0, trend: 0 });
      }
      return fallback;
    }
  }

  // ... keep existing getExpiryTimelineData, getDrugsByCategory, getAIAnalysis, getCategoryColor ...
  // (unchanged, they already used DB-safe column checks)

  // Get expiry timeline data (uses sequelize.col imported above)
  async getExpiryTimelineData() {
    const months = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const startDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);

      const expiringDrugs = await Drug.count({
        where: sequelize.where(col('expiry_date'), { [Op.between]: [startDate, endDate] })
      });

      const monthName = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      months.push({
        month: monthName,
        expireBy: expiringDrugs,
        wasted: Math.floor(expiringDrugs * 0.1),
        used: Math.floor(expiringDrugs * 0.7),
        efficiency: Math.floor(Math.random() * 20) + 70,
        status: expiringDrugs > 10 ? 'Needs Attention' : 'Good'
      });
    }

    return months;
  }


  // Get drugs by therapeutic category
  async getDrugsByCategory() {
    const drugs = await Drug.findAll();

    const categories = {
      'Cardiovascular': ['Lipitor', 'Zocor', 'Cozaar', 'Aldactone', 'Tenormin', 'Lasix'],
      'Analgesics': ['Motrin', 'Naprosyn', 'Tylenol'],
      'Antibiotics': ['Amoxil'],
      'Neurological': ['Neurontin', 'Ambien'],
      'Diabetes': ['Glucotrol'],
      'GI Disorders': ['Prilosec'],
      'Anti-inflammatory': ['Mobic'],
      'Other': ['Imdur', 'Plavix']
    };

    const categoryCounts = {};

    drugs.forEach(drug => {
      let categoryFound = false;
      Object.entries(categories).forEach(([category, drugNames]) => {
        if (drugNames.includes(drug.brand_name)) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          categoryFound = true;
        }
      });
      if (!categoryFound) {
        categoryCounts['Other'] = (categoryCounts['Other'] || 0) + 1;
      }
    });

    const pieData = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
      color: this.getCategoryColor(name)
    }));

    return pieData;
  }

  // Get AI analysis summary
  async getAIAnalysis() {
    const salesTrend = await this.getSalesTrendData();
    const totalSales = salesTrend.reduce((sum, item) => sum + item.actualSales, 0);

    return {
      totalSales: `$${(totalSales / 1000).toFixed(1)}K`,
      avgConfidence: `${Math.floor(Math.random() * 20) + 75}%`,
      growthRate: `${(Math.random() * 20 - 5).toFixed(1)}%`,
      peakMonth: (salesTrend.length ? salesTrend.reduce((max, item) => item.actualSales > max.actualSales ? item : max).month.split(' ')[0] : ''),
      recommendation: 'Continue current inventory strategy',
      alerts: [
        { type: 'warning', message: '5 drugs are low in stock', count: 5 },
        { type: 'critical', message: '3 drugs expiring next month', count: 3 },
        { type: 'info', message: 'Reorder suggestion: Amoxil, Lipitor', count: 2 }
      ]
    };
  }

  // Helper function for category colors
  getCategoryColor(category) {
    const colors = {
      'Cardiovascular': '#00B8A9',
      'Analgesics': '#4ECDC4',
      'Antibiotics': '#FF6B6B',
      'Neurological': '#FFD166',
      'Diabetes': '#06D6A0',
      'GI Disorders': '#118AB2',
      'Anti-inflammatory': '#EF476F',
      'Other': '#9CA3AF'
    };
    return colors[category] || '#6B7280';
  }
}

module.exports = new DashboardController();
