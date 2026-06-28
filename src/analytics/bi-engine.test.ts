import { describe, it, expect } from "vitest";
import { calculateKPIs, forecastFuturePerformance, generateAIInsights } from "./bi-engine";

describe("BI Engine Tests", () => {
  describe("calculateKPIs", () => {
    it("should calculate KPIs correctly with standard metrics", () => {
      const metrics = {
        totalLeads: 100,
        convertedLeads: 25,
        currentPeriodRevenue: 10000,
        previousPeriodRevenue: 8000,
        totalDeals: 5,
        activeCustomers: 80,
        totalCustomers: 100,
        successfulAIRequests: 90,
        totalAIRequests: 100,
        totalResponseTimeSec: 600,
        totalResponseCount: 10,
      };

      const kpis = calculateKPIs(metrics);

      expect(kpis.leadConversionRate).toBe(25.0);
      expect(kpis.revenueGrowth).toBe(25.0);
      expect(kpis.averageDealSize).toBe(2000.0);
      expect(kpis.customerRetentionRate).toBe(80.0);
      expect(kpis.aiAccuracy).toBe(90.0);
      expect(kpis.averageResponseTimeSec).toBe(60.0);
    });

    it("should handle division by zero safely", () => {
      const metrics = {
        totalLeads: 0,
        convertedLeads: 0,
        currentPeriodRevenue: 0,
        previousPeriodRevenue: 0,
        totalDeals: 0,
        activeCustomers: 0,
        totalCustomers: 0,
        successfulAIRequests: 0,
        totalAIRequests: 0,
        totalResponseTimeSec: 0,
        totalResponseCount: 0,
      };

      const kpis = calculateKPIs(metrics);

      expect(kpis.leadConversionRate).toBe(0);
      expect(kpis.revenueGrowth).toBe(0);
      expect(kpis.averageDealSize).toBe(0);
      expect(kpis.customerRetentionRate).toBe(0);
      expect(kpis.aiAccuracy).toBe(0);
      expect(kpis.averageResponseTimeSec).toBe(0);
    });
  });

  describe("forecastFuturePerformance", () => {
    it("should project future revenue and leads using historical trends", () => {
      const historicalRevenue = [1000, 2000, 3000, 4000];
      const historicalLeads = [10, 20, 30, 40];

      const forecast = forecastFuturePerformance(historicalRevenue, historicalLeads);

      expect(forecast.projectedRevenue).toBe(5000);
      expect(forecast.projectedLeads).toBe(50);
      expect(forecast.confidenceScore).toBeLessThan(100);
    });

    it("should fallback gracefully with insufficient data", () => {
      const forecast = forecastFuturePerformance([1000], [10]);
      expect(forecast.projectedRevenue).toBe(1000);
      expect(forecast.projectedLeads).toBe(10);
      expect(forecast.confidenceScore).toBe(50);
    });
  });

  describe("generateAIInsights", () => {
    it("should generate appropriate insights based on KPI triggers", () => {
      const kpis = {
        leadConversionRate: 5.0, // low
        revenueGrowth: -10.0,    // negative
        averageDealSize: 1000.0,
        customerRetentionRate: 90.0,
        aiAccuracy: 95.0,       // high
        averageResponseTimeSec: 400.0, // high
      };

      const insights = generateAIInsights(kpis, 9000, 10000);

      expect(insights).toContain("Revenue has decreased this week. Recommend reviewing high-value sales pipelines.");
      expect(insights).toContain("Lead conversion rate is below target (10%). Consider sales follow-up automation.");
      expect(insights).toContain("Average response time has exceeded 5 minutes. Employee workload might be high.");
      expect(insights).toContain("AI agent response accuracy is high. Ready to increase auto-reply delegation.");
    });
  });
});
