import pandas as pd
from prophet import Prophet
from statistics import mean

class AnalyticsEngine:

    def __init__(self, prescriptions_df):
        self.df = prescriptions_df

    def sales_summary(self):
        if self.df.empty:
            return []

        summary = (
            self.df.groupby("brand_name")
            .agg(total_units=("quantity", "sum"),
                 total_revenue=("sale_amount", "sum"))
            .reset_index()
        )
        return summary.to_dict(orient="records")

    def detect_trend(self):
        if self.df.empty:
            return "no_data"

        monthly = self.df.groupby("month")["sale_amount"].sum().tolist()
        if len(monthly) < 2:
            return "stable"

        return "growth" if monthly[-1] > mean(monthly[:-1]) else "decline"

    def forecast_sales(self, months=6):
        if self.df.empty:
            return []

        prophet_df = self.df.groupby("month")["sale_amount"].sum().reset_index()
        prophet_df.columns = ["ds", "y"]

        model = Prophet()
        model.fit(prophet_df)

        future = model.make_future_dataframe(periods=months, freq="M")
        forecast = model.predict(future)

        return forecast[["ds", "yhat"]].tail(months).to_dict(orient="records")
