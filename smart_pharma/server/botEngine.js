const { db } = require('./database');

/**
 * Core AI Logic Engine
 * Processes natural language queries and returns structured answers from the DB.
 * @param {string} query - The user's input text
 * @returns {Promise<{answer: string, action: string|null}>}
 */
const processQuery = async (query) => {
    if (!query) return { answer: "I didn't catch that. Could you repeat?", action: null };

    const lower = query.toLowerCase();
    let answer = "I'm not sure about that. Try asking about 'expiry', 'sales', 'stock', or a specific medicine name.";
    let action = null;

    try {
        // --- INTENT 1: EXPIRY / ALERTS ---
        if (lower.includes('expir') || lower.includes('alert') || lower.includes('critical')) {
            const row = await new Promise(resolve => {
                db.get("SELECT COUNT(*) as c FROM drugs WHERE date(expDate) < date('now', '+30 days')", (err, r) => resolve(r));
            });
            const count = row?.c || 0;
            answer = `🔴 Critical Alert: You have ${count} medicines expiring within the next 30 days.`;
            action = "Check 'Alerts' page to return or discount items.";
        }

        // --- INTENT 2: SALES / PROFIT ---
        else if (lower.includes('sales') || lower.includes('profit') || lower.includes('revenue') || lower.includes('sold')) {
            console.log("BotEngine: Processing Sales Intent...");
            const row = await new Promise(resolve => {
                db.get(`
                    SELECT 
                        count(*) as tx, 
                        SUM(d.sellPrice) as rev, 
                        SUM(d.sellPrice - d.purchasePrice) as prof 
                    FROM prescriptions p JOIN drugs d ON p.NDC = d.NDC
                `, (err, r) => {
                    if (err) console.error("BotEngine SQL Error:", err);
                    resolve(r);
                });
            });
            console.log("BotEngine: Sales Data Retreived:", row);

            const revenue = row?.rev || 0;
            const profit = row?.prof || 0;
            const tx = row?.tx || 0;

            answer = `💰 Financial Overview:\nTotal Revenue: Rs. ${revenue.toFixed(2)}\nNet Profit: Rs. ${profit.toFixed(2)}\nBased on ${tx} prescription transactions.`;
            action = "View 'Sales & Profit' for detailed trends.";
        }

        // --- INTENT 3: LOW STOCK / RESTOCK ---
        else if (lower.includes('stock') || lower.includes('restock') || lower.includes('shortage')) {
            const row = await new Promise(resolve => {
                db.get("SELECT COUNT(*) as c FROM drugs WHERE dosage < 20", (err, r) => resolve(r));
            });
            const count = row?.c || 0;
            answer = `⚠️ Stock Alert: ${count} items are running low (based on dosage/stock levels < 20).`;
            if (count > 0) action = "Go to 'Inventory' > 'Restock Needed' filter.";
            else action = "Inventory looks healthy.";
        }

        // --- INTENT 4: SUPPLIERS ---
        else if (lower.includes('supplier') || lower.includes('distributor')) {
            const row = await new Promise(resolve => {
                db.get("SELECT COUNT(*) as c FROM suppliers", (err, r) => resolve(r));
            });
            answer = `You have ${row?.c || 0} registered suppliers in the database.`;
            action = "Manage partners in 'Suppliers' tab.";
        }

        // --- INTENT 5: CONVERSATION / SMALL TALK ---
        else if (lower.match(/\b(hi|hello|hey|greetings|morning|afternoon|evening)\b/)) {
            answer = "Hello! 👋 I'm your Smart Pharma AI, now on WhatsApp! I can help with Inventory, Sales, and Medicine checks.";
        }
        else if (lower.includes('who are you') || lower.includes('what are you')) {
            answer = "I am the Smart Pharma Assistant. I help you manage your pharmacy inventory and insights directly from chat.";
        }
        else if (lower.includes('what can you do') || lower.includes('help')) {
            answer = "Ask me things like:\n- 'Expiring medicines?'\n- 'Total sales?'\n- 'Low stock items?'\n- 'Details of Paracetamol'";
            action = "Try asking: 'Which medicines are expiring?'";
        }
        else if (lower.includes('thank')) {
            answer = "You're welcome! Happy to help.";
        }
        else if (lower.includes('how are you')) {
            answer = "I'm online and ready to serve!";
        }

        // --- INTENT 6: SPECIFIC MEDICINE LOOKUP (Fallback) ---
        else {
            const cleanQuery = lower.replace('details', '').replace('about', '').replace('show', '').replace('of', '').trim();
            if (cleanQuery.length > 2) {
                const drug = await new Promise(resolve => {
                    db.get("SELECT * FROM drugs WHERE brandName LIKE ? OR genericName LIKE ?", [`%${cleanQuery}%`, `%${cleanQuery}%`], (err, r) => resolve(r));
                });

                if (drug) {
                    answer = `💊 **${drug.brandName}** (${drug.genericName})\n• Expiry: ${drug.expDate}\n• Price: ₹${drug.sellPrice}\n• Stock: ${drug.stock || drug.dosage || 'N/A'}`;
                    action = "Click 'Edit' in Inventory to update.";
                }
            }
        }

        return { answer, action };

    } catch (err) {
        console.error("Bot Logic Error:", err);
        return { answer: "I encountered a database error.", action: null };
    }
};

module.exports = { processQuery };
