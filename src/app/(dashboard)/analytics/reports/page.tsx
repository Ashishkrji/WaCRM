"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  FileText, 
  Download, 
  Settings2, 
  Calendar,
  AlertTriangle,
  Mail,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsAndAlertsPage() {
  const [reportType, setReportType] = useState("daily");
  const [exportFormat, setExportFormat] = useState("csv");
  const [alertThresholds, setAlertThresholds] = useState({
    minRevenueDropPct: 15,
    maxAILatencyMs: 1500,
    maxAIFailureRatePct: 5,
  });

  const handleGenerateReport = () => {
    toast.success(`Generating ${reportType} report in ${exportFormat.toUpperCase()} format. Download starting...`);
    
    // Simulate generation and download trigger
    setTimeout(() => {
      // Create dummy file download
      const data = `Report Type,${reportType}\nGenerated At,${new Date().toISOString()}\nMetric,Value\nRevenue,125000\nLeads,450\nConversion Rate,12%\n`;
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `wacrm_${reportType}_report.${exportFormat}`);
      a.click();
      toast.success("Report downloaded successfully!");
    }, 1500);
  };

  const handleSaveAlerts = () => {
    toast.success("Alert thresholds updated successfully!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports & Alert Engine</h1>
        <p className="text-slate-400 text-sm">Generate corporate reports, configure alerts, and set up system anomaly thresholds.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Report Builder */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-550" /> Report Builder
          </h2>

          <div className="space-y-4">
            {/* Report Range */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Report Interval</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="daily">Daily Operational Summary</option>
                <option value="weekly">Weekly Business Performance</option>
                <option value="monthly">Monthly Financial & AI Overview</option>
                <option value="quarterly">Quarterly Executive Briefing</option>
              </select>
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Export Format</label>
              <div className="flex gap-4">
                {["csv", "json", "pdf"].map(fmt => (
                  <label key={fmt} className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value={fmt}
                      checked={exportFormat === fmt}
                      onChange={() => setExportFormat(fmt)}
                      className="accent-amber-500"
                    />
                    {fmt.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerateReport}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold gap-2"
            >
              <Download className="h-4 w-4" /> Export Report
            </Button>
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-550" /> Anomaly Alert Rules
          </h2>

          <div className="space-y-4">
            {/* Revenue drop */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Alert on Revenue Drop (%)
              </label>
              <input
                type="number"
                value={alertThresholds.minRevenueDropPct}
                onChange={(e) => setAlertThresholds(prev => ({ ...prev, minRevenueDropPct: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* AI Latency */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Alert on AI Latency Exceeding (ms)
              </label>
              <input
                type="number"
                value={alertThresholds.maxAILatencyMs}
                onChange={(e) => setAlertThresholds(prev => ({ ...prev, maxAILatencyMs: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* AI Failure rate */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Alert on AI Failure Rate Exceeding (%)
              </label>
              <input
                type="number"
                value={alertThresholds.maxAIFailureRatePct}
                onChange={(e) => setAlertThresholds(prev => ({ ...prev, maxAIFailureRatePct: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <Button
              onClick={handleSaveAlerts}
              className="w-full bg-slate-850 hover:bg-slate-800 text-white border border-slate-750 font-semibold"
            >
              Save Alert Rules
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
