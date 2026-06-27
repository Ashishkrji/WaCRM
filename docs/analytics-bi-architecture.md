# Analytics & Business Intelligence Platform — Architecture

## Overview

The WaCRM BI Platform provides a full-stack analytics engine with daily KPI snapshots, AI-generated insights, anomaly detection, multi-module analytics, and CSV/JSON report exports.

## File Structure

```
src/
├── lib/
│   └── analytics/
│       ├── bi-engine.ts       # KPI computation, insights, anomaly detection, forecasting
│       ├── queries.ts         # Module-specific query functions
│       └── report-builder.ts  # CSV/JSON export engine
├── app/
│   └── api/
│       └── analytics/
│           ├── bi/route.ts       # Snapshot fetch/recompute
│           ├── executive/route.ts # Executive dashboard bundle
│           ├── sales/route.ts    # Sales + forecast
│           ├── ai-usage/route.ts # AI cost tracking
│           ├── alerts/route.ts   # Alert rules + events
│           └── reports/route.ts  # Report CRUD + export
├── components/
│   └── analytics/
│       ├── executive-dashboard.tsx # Full executive view
│       ├── sales-analytics.tsx     # Sales pipeline UI
│       ├── ai-analytics.tsx        # AI provider breakdown
│       ├── kpi-card.tsx            # Reusable KPI card
│       ├── alert-manager.tsx       # Alert rule management
│       └── report-builder.tsx      # Report export UI
└── app/(dashboard)/
    └── analytics/
        ├── page.tsx           # Legacy analytics + BI nav
        ├── executive/page.tsx # Executive BI dashboard
        ├── sales/page.tsx     # Sales analytics
        ├── customers/page.tsx # Customer analytics
        ├── employees/page.tsx # Employee leaderboard
        ├── ai-usage/page.tsx  # AI usage & cost
        ├── marketing/page.tsx # Marketing campaigns
        └── reports/page.tsx   # Reports & alerts
```

## Database Schema

Tables added in `029_analytics_bi_schema.sql`:

| Table | Purpose |
|-------|---------|
| `analytics_snapshots` | Daily KPI aggregation per user |
| `analytics_alerts` | Configurable alert rules |
| `analytics_alert_events` | Alert trigger history |
| `bi_reports` | Saved report configurations |
| `kpi_targets` | User-defined KPI goals |
| `cost_tracking` | Daily AI token and cost records |
| `ai_insights` | AI-generated business insights |

## Analytics Modules

### Sales Analytics
- Pipeline value, won deals, conversion rate
- Revenue by month (chart-ready)
- Deals by pipeline stage
- Top services by revenue
- Lead sources

### Customer Analytics
- Total customers, active/inactive breakdown
- Retention rate, churn rate
- By industry and country distribution
- Average response time

### Employee Analytics
- Performance leaderboard
- Deals won per agent
- Revenue generated per agent
- Tasks completed
- Composite performance score (0–100)

### AI Usage Analytics
- Total requests, tokens, cost USD
- Average latency, success rate
- Breakdown by provider (NVIDIA, OpenAI, etc.)
- Breakdown by model
- Daily usage bar chart

### Marketing Analytics
- Total broadcasts, recipients
- Delivery rate, read rate, reply rate
- Per-campaign metrics table

### Financial Analytics
- Total revenue, pending payments, overdue
- Average invoice value
- Revenue by month

## BI Engine Features

### Daily Snapshots
`computeDailySnapshot(userId)` aggregates all CRM data into a single daily row in `analytics_snapshots`. Called nightly by the cron job.

### Executive Dashboard Bundle
`getExecutiveDashboardData(userId)` fetches a pre-built data bundle with today's KPIs, 7-day trends, pipeline stats, AI performance, and workflow execution metrics.

### AI Insights (NVIDIA NIM)
`generateAndStoreInsights(userId)` calls NVIDIA LLaMA to analyze the last 30 days of snapshots and generates 3–5 actionable insights stored in `ai_insights`.

### Anomaly Detection
`detectAnomaliesAndAlert(userId)` evaluates all active alert rules against today's snapshot and creates `analytics_alert_events` when thresholds are exceeded.

### Forecasting
`forecastMetric(userId, metric, horizonDays)` uses linear regression on historical snapshots to forecast any metric for the next N days.

## Alert System

Alert rules support:
- **Metrics**: revenue, new_leads, won_deals, ai_cost_usd, workflow_success_rate, avg_response_time_seconds
- **Operators**: gt, lt, gte, lte, eq, neq
- **Severity**: critical, warning, info
- **Cooldown**: minimum minutes between repeat alerts
- **Channels**: dashboard, whatsapp, email

## Report Exports

Reports support two formats:
- **JSON**: Raw structured data returned in API response
- **CSV**: File download with automatic column flattening

Report types: sales, customers, employees, ai, marketing, financial, custom

## Cost Tracking

Every AI API call should POST to `/api/analytics/ai-usage` with:
```json
{
  "provider": "nvidia",
  "model": "nvidia/llama-3.1-nemotron-70b-instruct",
  "prompt_tokens": 512,
  "completion_tokens": 256,
  "latency_ms": 1200,
  "success": true
}
```

Cost is auto-estimated based on per-provider pricing and aggregated daily.
