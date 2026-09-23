// Re-export modular services to maintain clean architecture while preserving backwards compatibility
export { apiClient, withFallback } from "@/services/apiClient";
export { authService as authApi } from "@/services/authService";
export { dashboardService as dashboardApi } from "@/services/dashboardService";
export { documentService as documentsApi } from "@/services/documentService";
export { qaService as qaApi } from "@/services/qaService";
export { userService as usersApi } from "@/services/userService";

// System API delegating to dashboard service
import { dashboardService } from "@/services/dashboardService";
export const systemApi = {
  getTelemetry: () => dashboardService.getTelemetry(),
  getAuditLogs: () => dashboardService.getAuditLogs(),
};

// Re-export mock data for any specialized test references
export * from "@/services/mock/mockService";
