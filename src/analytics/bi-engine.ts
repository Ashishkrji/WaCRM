/**
 * Business Intelligence & Analytics Engine
 * Calculates KPIs, generates trends, and forecasts business performance.
 */

export interface BusinessKPIs {
  leadConversionRate: number;
  revenueGrowth: number;
  averageDealSize: number;
  customerRetentionRate: number;
  aiAccuracy: number;
  averageResponseTimeSec: number;
}

export interface ForecastData {
  period: string;
  projectedRevenue: number;
  projectedLeads: number;
  confidenceScore: number;
}

/**
 * Calculates standard CRM KPIs from raw inputs
 */
export function calculateKPIs(data: {
  totalLeads: number;
  convertedLeads: number;
  currentPeriodRevenue: number;
  previousPeriodRevenue: number;
  totalDeals: number;
  activeCustomers: number;
  totalCustomers: number;
  successfulAIRequests: number;
  totalAIRequests: number;
  totalResponseTimeSec: number;
  totalResponseCount: number;
}): BusinessKPIs {
  const leadConversionRate = data.totalLeads > 0 
    ? (data.convertedLeads / data.totalLeads) * 100 
    : 0;

  const revenueGrowth = data.previousPeriodRevenue > 0 
    ? ((data.currentPeriodRevenue - data.previousPeriodRevenue) / data.previousPeriodRevenue) * 100 
    : 0;

  const averageDealSize = data.totalDeals > 0 
    ? data.currentPeriodRevenue / data.totalDeals 
    : 0;

  const customerRetentionRate = data.totalCustomers > 0 
    ? (data.activeCustomers / data.totalCustomers) * 100 
    : 0;

  const aiAccuracy = data.totalAIRequests > 0 
    ? (data.successfulAIRequests / data.totalAIRequests) * 100 
    : 0;

  const averageResponseTimeSec = data.totalResponseCount > 0 
    ? data.totalResponseTimeSec / data.totalResponseCount 
    : 0;

  return {
    leadConversionRate: parseFloat(leadConversionRate.toFixed(2)),
    revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
    averageDealSize: parseFloat(averageDealSize.toFixed(2)),
    customerRetentionRate: parseFloat(customerRetentionRate.toFixed(2)),
    aiAccuracy: parseFloat(aiAccuracy.toFixed(2)),
    averageResponseTimeSec: parseFloat(averageResponseTimeSec.toFixed(2)),
  };
}

/**
 * Forecasts future revenue and lead volume using a simple linear regression model
 */
export function forecastFuturePerformance(historicalRevenue: number[], historicalLeads: number[]): ForecastData {
  const n = historicalRevenue.length;
  if (n < 2) {
    return {
      period: "Next Month",
      projectedRevenue: historicalRevenue[0] || 0,
      projectedLeads: historicalLeads[0] || 0,
      confidenceScore: 50,
    };
  }

  // Linear Regression for Revenue
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += historicalRevenue[i];
    sumXY += i * historicalRevenue[i];
    sumXX += i * i;
  }
  const slopeRev = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const interceptRev = (sumY - slopeRev * sumX) / n;
  const projectedRevenue = slopeRev * n + interceptRev;

  // Linear Regression for Leads
  let sumYLeads = 0, sumXYLeads = 0;
  for (let i = 0; i < n; i++) {
    sumYLeads += historicalLeads[i];
    sumXYLeads += i * historicalLeads[i];
  }
  const slopeLeads = (n * sumXYLeads - sumX * sumYLeads) / (n * sumXX - sumX * sumX);
  const interceptLeads = (sumYLeads - slopeLeads * sumX) / n;
  const projectedLeads = slopeLeads * n + interceptLeads;

  return {
    period: `Month ${n + 1}`,
    projectedRevenue: Math.max(0, parseFloat(projectedRevenue.toFixed(2))),
    projectedLeads: Math.max(0, Math.round(projectedLeads)),
    confidenceScore: Math.min(95, Math.max(40, 100 - (n * 2))), // Simple heuristic for confidence
  };
}

/**
 * Generates AI-powered business insights based on current metrics
 */
export function generateAIInsights(kpis: BusinessKPIs, currentRevenue: number, previousRevenue: number): string[] {
  const insights: string[] = [];

  if (currentRevenue < previousRevenue) {
    insights.push("Revenue has decreased this week. Recommend reviewing high-value sales pipelines.");
  } else {
    insights.push("Revenue is trending upwards. Marketing campaign ROI is positive.");
  }

  if (kpis.leadConversionRate < 10) {
    insights.push("Lead conversion rate is below target (10%). Consider sales follow-up automation.");
  }

  if (kpis.averageResponseTimeSec > 300) {
    insights.push("Average response time has exceeded 5 minutes. Employee workload might be high.");
  }

  if (kpis.aiAccuracy > 90) {
    insights.push("AI agent response accuracy is high. Ready to increase auto-reply delegation.");
  }

  return insights;
}
