import { apiClient, withFallback } from "./apiClient";
import { mockDashboardService } from "./mock/mockService";
import type { DashboardStats, Document, SystemTelemetry, AuditLog } from "@/lib/types";

export const dashboardService = {
  getStats: (): Promise<{ stats: DashboardStats; recent_documents: Document[] }> =>
    withFallback(
      async () => {
        const { data } = await apiClient.get("/dashboard");
        return data;
      },
      () => mockDashboardService.getStats()
    ),

  getTelemetry: (): Promise<SystemTelemetry> =>
    withFallback(
      async () => {
        const { data } = await apiClient.get<SystemTelemetry>("/system/telemetry");
        return data;
      },
      () => mockDashboardService.getTelemetry()
    ),

  getAuditLogs: (): Promise<AuditLog[]> =>
    withFallback(
      async () => {
        const { data } = await apiClient.get<AuditLog[]>("/system/audit-logs");
        return data;
      },
      () => mockDashboardService.getAuditLogs()
    ),
};
