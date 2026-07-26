from src.chatbot.knowledge_base import knowledge_base
from src.analytics.analytics_engine import AnalyticsEngine
import re

engine = AnalyticsEngine(knowledge_base.prescriptions)


class ChatEngine:
    def __init__(self):
        self.intent_map = {
            "sales": ["sales", "sold", "revenue", "income", "turnover", "performance"],
            "predict_sales": ["predict", "prediction", "forecast", "next month", "future sales"],
            "trend": ["trend", "increasing", "decreasing", "growth", "demand"],
            "chart_sales": ["chart", "graph", "plot", "visual"],
            "low_stock": ["low stock", "running out", "shortage", "out of stock"]
        }

    # ---------------- INTENT DETECTION ----------------
    def detect_intent(self, message: str):
        msg = message.lower()
        scores = {}

        for intent, keywords in self.intent_map.items():
            scores[intent] = sum(
                1 for kw in keywords if re.search(rf"\b{re.escape(kw)}\b", msg)
            )

        best_intent = max(scores, key=scores.get)
        confidence = round(min(0.99, 0.6 + scores[best_intent] * 0.1), 2)

        return best_intent if scores[best_intent] > 0 else "sales", confidence

    # ---------------- RESPONSE ----------------
    def respond(self, message: str):
        intent, confidence = self.detect_intent(message)

        # SALES SUMMARY
        if intent == "sales":
            data = engine.sales_summary()
            if not data:
                return self.no_data(confidence)

            return {
                "intent": "sales",
                "confidence": confidence,
                "text": "\n".join(
                    f"• {d['drug']}: sold {d['units']} unit(s), revenue ${d['revenue']}"
                    for d in data
                ),
                "data": data
            }

        # PREDICTION
        if intent == "predict_sales":
            data = engine.predict_next_sales()
            if not data:
                return self.no_data(confidence)

            return {
                "intent": "predict_sales",
                "confidence": confidence,
                "text": "\n".join(
                    f"• {d['drug']}: expected {d['predicted_units']} unit(s)"
                    for d in data
                ),
                "data": data
            }

        # TREND
        if intent == "trend":
            trend = engine.detect_trend()
            if not trend:
                return self.no_data(confidence)

            return {
                "intent": "trend",
                "confidence": confidence,
                "text": f"📈 Demand trend is **{trend.upper()}** based on recent data.",
                "trend": trend
            }

        # CHART
        if intent == "chart_sales":
            data = engine.sales_summary()
            if not data:
                return self.no_data(confidence)

            return {
                "intent": "chart_sales",
                "confidence": confidence,
                "chart": {
                    "type": "bar",
                    "labels": [d["drug"] for d in data],
                    "values": [d["revenue"] for d in data]
                }
            }

        # LOW STOCK
        if intent == "low_stock":
            data = knowledge_base.low_stock()
            if not data:
                return self.no_data(confidence)

            return {
                "intent": "low_stock",
                "confidence": confidence,
                "text": "\n".join(
                    f"• {d['brand_name']} → {d['current_quantity']} units left"
                    for d in data
                ),
                "data": data
            }

        return self.no_data(confidence)

    def no_data(self, confidence):
        return {
            "confidence": confidence,
            "text": "📭 No data available for this request."
        }


chat_engine = ChatEngine()
