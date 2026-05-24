export interface SloTargets {
  p95LatencyMs: number;
  successRate: number;
  availability: number;
}

export interface SloWindowMetrics {
  totalRequests: number;
  successfulRequests: number;
  availableRequests: number;
  p95LatencyMs: number;
}

export interface ComputedSloValues {
  successRate: number;
  availability: number;
  p95LatencyMs: number;
}

export interface SloBreach {
  indicator: "latency" | "success_rate" | "availability";
  observed: number;
  target: number;
  severity: "warning" | "critical";
  message: string;
}

export interface SloEvaluation {
  ok: boolean;
  values: ComputedSloValues;
  breaches: SloBreach[];
}

export const DEFAULT_SLO_TARGETS: SloTargets = {
  p95LatencyMs: 3000,
  successRate: 0.99,
  availability: 0.995
};

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
}

function classifySeverity(gap: number): "warning" | "critical" {
  return gap >= 0.02 ? "critical" : "warning";
}

export function evaluateSloWindow(
  metrics: SloWindowMetrics,
  targets: SloTargets = DEFAULT_SLO_TARGETS
): SloEvaluation {
  const values: ComputedSloValues = {
    successRate: ratio(metrics.successfulRequests, metrics.totalRequests),
    availability: ratio(metrics.availableRequests, metrics.totalRequests),
    p95LatencyMs: metrics.p95LatencyMs
  };

  const breaches: SloBreach[] = [];

  if (values.p95LatencyMs > targets.p95LatencyMs) {
    const ratioOver = (values.p95LatencyMs - targets.p95LatencyMs) / targets.p95LatencyMs;
    breaches.push({
      indicator: "latency",
      observed: values.p95LatencyMs,
      target: targets.p95LatencyMs,
      severity: ratioOver >= 0.25 ? "critical" : "warning",
      message: `P95 latency ${values.p95LatencyMs}ms exceeds target ${targets.p95LatencyMs}ms`
    });
  }

  if (values.successRate < targets.successRate) {
    const gap = targets.successRate - values.successRate;
    breaches.push({
      indicator: "success_rate",
      observed: values.successRate,
      target: targets.successRate,
      severity: classifySeverity(gap),
      message: `Success rate ${(values.successRate * 100).toFixed(2)}% is below target ${(targets.successRate * 100).toFixed(2)}%`
    });
  }

  if (values.availability < targets.availability) {
    const gap = targets.availability - values.availability;
    breaches.push({
      indicator: "availability",
      observed: values.availability,
      target: targets.availability,
      severity: classifySeverity(gap),
      message: `Availability ${(values.availability * 100).toFixed(2)}% is below target ${(targets.availability * 100).toFixed(2)}%`
    });
  }

  return {
    ok: breaches.length === 0,
    values,
    breaches
  };
}

