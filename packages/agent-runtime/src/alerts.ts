import type { SloBreach } from "./slo";

export type AlertChannel = "pager" | "slack" | "email";

export interface AlertMessage {
  id: string;
  createdAt: string;
  severity: "warning" | "critical";
  title: string;
  summary: string;
  runbookUrl?: string;
  tags: string[];
  metadata: Record<string, string>;
}

export interface AlertRouteDecision {
  channels: AlertChannel[];
}

export function createSloAlert(breach: SloBreach, context: { environment: string; service: string }): AlertMessage {
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    severity: breach.severity,
    title: `SLO breach: ${breach.indicator}`,
    summary: breach.message,
    runbookUrl: "docs/INCIDENT_RUNBOOK.md",
    tags: ["slo", breach.indicator, context.environment, context.service],
    metadata: {
      indicator: breach.indicator,
      observed: String(breach.observed),
      target: String(breach.target),
      environment: context.environment,
      service: context.service
    }
  };
}

export function routeAlert(alert: AlertMessage): AlertRouteDecision {
  if (alert.severity === "critical") {
    return { channels: ["pager", "slack", "email"] };
  }
  return { channels: ["slack"] };
}

