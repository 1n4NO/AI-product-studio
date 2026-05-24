export interface FunnelMetricsInput {
  runsStarted: number;
  blueprintsGenerated: number;
  draftsGenerated: number;
  auditsPassed: number;
  exportsCompleted: number;
  totalDraftDurationMs: number;
}

export interface FunnelMetrics {
  blueprintConversionRate: number;
  draftConversionRate: number;
  auditPassRate: number;
  exportConversionRate: number;
  averageTimeToDraftMs: number;
}

function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export function computeFunnelMetrics(input: FunnelMetricsInput): FunnelMetrics {
  return {
    blueprintConversionRate: safeRate(input.blueprintsGenerated, input.runsStarted),
    draftConversionRate: safeRate(input.draftsGenerated, input.runsStarted),
    auditPassRate: safeRate(input.auditsPassed, input.draftsGenerated),
    exportConversionRate: safeRate(input.exportsCompleted, input.runsStarted),
    averageTimeToDraftMs: input.draftsGenerated > 0 ? Math.round(input.totalDraftDurationMs / input.draftsGenerated) : 0
  };
}

