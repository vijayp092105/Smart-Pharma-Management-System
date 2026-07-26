import csv, os
from collections import defaultdict
from statistics import mean
import pandas as pd
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

class KnowledgeBase:
    def __init__(self):
        self.drugs = self._load("DRUGS.csv")
        self.prescriptions = self._load("PRESCRIPTIONS.csv")

    def _load(self, filename):
        path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(path):
            return pd.DataFrame()
        df = pd.read_csv(path)
        df["month"] = pd.to_datetime(df["transaction_date"]).dt.to_period("M").dt.to_timestamp()
        return df

    # ---------- SALES ----------
    def sales_summary(self):
        if not self.prescriptions:
            return []

        sales = defaultdict(lambda: {"units": 0, "revenue": 0.0})
        for p in self.prescriptions:
            drug = p.get("brand_name") or p.get("drug_name")
            qty = int(p.get("quantity", 0))
            revenue = float(p.get("sale_amount", 0))
            sales[drug]["units"] += qty
            sales[drug]["revenue"] += revenue

        return [
            {"drug": k, "units": v["units"], "revenue": round(v["revenue"], 2)}
            for k, v in sales.items()
        ]

    # ---------- PREDICTION ----------
    def predict_next_sales(self):
        data = self.sales_summary()
        if not data:
            return []

        avg_units = mean([d["units"] for d in data])
        return [
            {
                "drug": d["drug"],
                "predicted_units": round(d["units"] * 1.15),
                "trend": "up" if d["units"] > avg_units else "stable"
            }
            for d in data
        ]

    # ---------- LOW STOCK ----------
    def low_stock(self, threshold=20):
        return [
            d for d in self.drugs
            if int(d.get("current_quantity", 0)) < threshold
        ]

knowledge_base = KnowledgeBase()
