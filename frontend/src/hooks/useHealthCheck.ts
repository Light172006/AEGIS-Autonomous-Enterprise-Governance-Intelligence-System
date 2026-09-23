"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/apiClient";
import type { HealthResponse } from "@/lib/types";

export type GatewayStatus = "online" | "offline" | "checking";

export interface ExtendedHealthResponse extends HealthResponse {
  gateway?: string;
}

export function useHealthCheck(intervalMs = 30000) {
  const [status, setStatus] = useState<GatewayStatus>("checking");
  const [version, setVersion] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const response = await apiClient.get<ExtendedHealthResponse>("/health", {
        timeout: 4000,
      });
      if (
        response.data &&
        (response.data.status === "ok" || response.data.gateway === "online")
      ) {
        setStatus("online");
        setVersion(response.data.version || "1.0.0");
      } else {
        setStatus("offline");
      }
    } catch {
      setStatus("offline");
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkHealth();
    if (intervalMs > 0) {
      const timer = setInterval(checkHealth, intervalMs);
      return () => clearInterval(timer);
    }
  }, [checkHealth, intervalMs]);

  return { status, version, lastChecked, checkHealth };
}
