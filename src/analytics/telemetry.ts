/**
 * Centralized Telemetry & Event Tracking Service
 * Integrates all modules with the Business Intelligence Engine
 */
import { createClient } from "@/lib/supabase/client";
import { logAuditAction, AuditLogEntry } from "@/security/audit";

export interface TelemetryEvent {
  module: "crm" | "ai" | "marketing" | "billing" | "system";
  action: string;
  userId?: string;
  organizationId?: string;
  metadata: Record<string, any>;
  severity?: "info" | "warning" | "critical";
}

/**
 * Tracks a business event, logs it to audit trails, and triggers alerts if necessary
 */
export async function trackEvent(event: TelemetryEvent) {
  try {
    const supabase = createClient();
    
    // 1. Log to the centralized activity_logs table for audit trail
    const auditEntry: AuditLogEntry = {
      userId: event.userId,
      organizationId: event.organizationId,
      action: event.action as any,
      module: event.module,
      details: event.metadata,
      status: "SUCCESS",
    };
    await logAuditAction(auditEntry);

    // 2. Insert into the system_health_snapshots or metrics if it is a system health event
    if (event.module === "system" && event.action === "HEALTH_SNAPSHOT") {
      await supabase.from("system_health_snapshots").insert([
        {
          db_status: event.metadata.dbStatus,
          db_latency_ms: event.metadata.dbLatencyMs,
          ai_status: event.metadata.aiStatus,
          ai_latency_ms: event.metadata.aiLatencyMs,
          cpu_usage: event.metadata.cpuUsage,
          memory_usage: event.metadata.memoryUsage,
          storage_used_bytes: event.metadata.storageUsed,
          error_rate: event.metadata.errorRate,
          created_at: new Date().toISOString(),
        }
      ]);
    }

    // 3. Trigger alert notifications if the event is critical (e.g. AI failure, payment delay)
    if (event.severity === "critical") {
      await supabase.from("admin_notifications").insert([
        {
          title: `CRITICAL: ${event.action}`,
          message: event.metadata.message || "A critical system event occurred.",
          severity: "critical",
          category: event.module,
          is_read: false,
          created_at: new Date().toISOString(),
        }
      ]);
    }

  } catch (error) {
    console.error("Telemetry tracking failed:", error);
  }
}
