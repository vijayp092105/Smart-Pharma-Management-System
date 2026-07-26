const { successResponse, errorResponse, serverError } = require('../utils/response');
const { Op, Sequelize } = require('sequelize');
const {
  Drug,
  Doctor,
  Patient,
  SalesTransaction,
  ChatHistory
} = require('../models');

/* ---------------- UTIL ---------------- */

const normalize = s =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

const extractName = (message, keyword) => {
  const parts = message.split(keyword);
  return parts.length > 1 ? parts[1].trim() : null;
};

/* ---------------- CONTROLLER ---------------- */

class ChatController {

  /* ================= MAIN CHAT ================= */
  async processMessage(req, res) {
    try {
      const rawMessage = req.body?.message;
      if (!rawMessage) return errorResponse(res, 'Message required', 400);

      const message = normalize(rawMessage);
      let response = '';
      let intent = 'unknown';
      let confidence = 0.95;

      /* =================================================
         SALES / FORECAST
      ================================================= */
      if (/sale|selling|revenue|trend|demand/.test(message)) {
        const data = await this.getSalesSummary();
        response = data
          ? data.map(d =>
              `• ${d.brand}: sold ${d.units} unit(s), revenue $${d.revenue}`
            ).join('\n')
          : '📭 No data available.';
        intent = 'sales';
      }

      else if (/predict|forecast|future|next/.test(message)) {
        const data = await this.getSalesSummary();
        response = data
          ? data.map(d =>
              `• ${d.brand}: predicted revenue $${(d.revenue * 1.1).toFixed(2)}`
            ).join('\n') +
            `\n\n🔮 Prediction based on historical average`
          : '📭 No data available.';
        intent = 'prediction';
      }

      /* =================================================
         DRUG EXPIRY (SPECIFIC)
      ================================================= */
      else if (/expiry|expire/.test(message)) {
        const name = extractName(message, 'of');
        if (name) {
          const drug = await Drug.findOne({
            where: { brandName: { [Op.iLike]: `%${name}%` } }
          });
          response = drug
            ? `💊 ${drug.brandName} expires on ${drug.expiryDate}`
            : '📭 No data available.';
        } else {
          const soon = new Date();
          soon.setDate(soon.getDate() + 30);
          const drugs = await Drug.findAll({
            where: { expiryDate: { [Op.lt]: soon } },
            raw: true
          });
          response = drugs.length
            ? drugs.map(d =>
                `• ${d.brandName} → expires on ${d.expiryDate}`
              ).join('\n')
            : '📭 No data available.';
        }
        intent = 'expiry';
      }

      /* =================================================
         LOW STOCK
      ================================================= */
      else if (/low|running out|shortage|stock/.test(message)) {
        const drugs = await Drug.findAll({
          where: { currentQuantity: { [Op.lt]: 30 } },
          raw: true
        });
        response = drugs.length
          ? drugs.map(d =>
              `• ${d.brandName}: ${d.currentQuantity} units left`
            ).join('\n')
          : '📭 No data available.';
        intent = 'low_stock';
      }

      /* =================================================
         DOCTOR (LIST OR SPECIFIC)
      ================================================= */
      else if (/doctor/.test(message)) {
        const name = extractName(message, 'doctor');
        if (name) {
          const doctor = await Doctor.findOne({
            where: { name: { [Op.iLike]: `%${name}%` } }
          });
          response = doctor
            ? `👨‍⚕️ Dr. ${doctor.name}\n📞 Phone: ${doctor.phone || 'N/A'}\n📍 Address: ${doctor.address || 'N/A'}`
            : '📭 No data available.';
        } else {
          const doctors = await Doctor.findAll({ raw: true });
          response = doctors.length
            ? doctors.map(d => `• Dr. ${d.name}`).join('\n')
            : '📭 No doctor data available.';
        }
        intent = 'doctor';
      }

      /* =================================================
         PATIENT (LIST OR SPECIFIC)
      ================================================= */
      else if (/patient/.test(message)) {
        const name = extractName(message, 'patient');
        if (name) {
          const patient = await Patient.findOne({
            where: {
              [Op.or]: [
                { firstName: { [Op.iLike]: `%${name}%` } },
                { lastName: { [Op.iLike]: `%${name}%` } }
              ]
            }
          });
          response = patient
            ? `🧑 Patient: ${patient.firstName} ${patient.lastName}
🎂 DOB: ${patient.birthdate || 'N/A'}
📞 Phone: ${patient.phone || 'N/A'}
🏥 Insurance: ${patient.insurance || 'N/A'}`
            : '📭 No data available.';
        } else {
          const patients = await Patient.findAll({ raw: true });
          response = patients.length
            ? patients.map(p =>
                `• ${p.firstName} ${p.lastName}`
              ).join('\n')
            : '📭 No patient data available.';
        }
        intent = 'patient';
      }

      /* =================================================
         DRUG LIST
      ================================================= */
// 1️⃣ List ALL drug names
else if (/(drugs|drug list|all drugs)/i.test(message)) {
  const drugs = await Drug.findAll({ raw: true });

  response = drugs.length
    ? drugs.map(d => `• ${d.brandName}`).join('\n')
    : '📭 No drug data available.';

  intent = 'drug_list';
}


// 2️⃣ Detailed drug information
else if (/(drug details|drug info|details of drug)/i.test(message)) {
  const drugs = await Drug.findAll({ raw: true });

  response = drugs.length
    ? drugs.map(d =>
        `• ${d.brandName}
📅 Expiry: ${d.expiryDate}
💰 Price: $${d.sellingPrice ?? 'N/A'}`
      ).join('\n\n')
    : '📭 No drug data available.';

  intent = 'drug_details';
}

      /* =================================================
         GREETING
      ================================================= */
      else if (/hello|hi|hey/.test(message)) {
        response =
          "Hello! 👋 I'm your SmartPharma Assistant.\n\n" +
          "You can ask:\n" +
          "• Patient Details\n" +
          "• Doctor Details\n" +
          "• Expiry Queries\n" +
          "• Any Specific Queries\n" +
          "• Sales forecast";
        intent = 'greeting';
        confidence = 0.99;
      }

      /* =================================================
         FALLBACK
      ================================================= */
      else {
        response = '📭 No data available.';
        confidence = 0.4;
      }

      /* ---------- SAVE CHAT HISTORY ---------- */
      try {
        await ChatHistory.create({
          userMessage: rawMessage,
          assistantMessage: response,
          intent,
          confidenceScore: confidence
        });
      } catch {}

      return successResponse(res, { response, intent, confidence });

    } catch (err) {
      console.error(err);
      return serverError(res, err);
    }
  }

  /* ================= SALES SUMMARY ================= */
  async getSalesSummary() {
    const rows = await SalesTransaction.findAll({
      attributes: [
        [Sequelize.col('drug.brand_name'), 'brand'],
        [Sequelize.fn('SUM', Sequelize.col('quantity_sold')), 'units'],
        [Sequelize.fn('SUM', Sequelize.col('sale_amount')), 'revenue']
      ],
      include: [{ model: Drug, as: 'drug', attributes: [] }],
      group: ['drug.id', 'drug.brand_name'],
      raw: true
    });
    return rows.length ? rows : null;
  }

  /* ================= CHAT HISTORY ================= */
  async getChatHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit || 20, 10);
      const history = await ChatHistory.findAll({
        order: [['created_at', 'DESC']],
        limit
      });
      return successResponse(res, history, 'Chat history fetched');
    } catch (err) {
      return serverError(res, err);
    }
  }
}

module.exports = new ChatController();
