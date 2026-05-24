export interface BudgetThresholdPolicy {
  warningPercent: number;
  highPercent: number;
  criticalPercent: number;
}

export interface BudgetUsage {
  used: number;
  limit: number;
}

export interface BudgetAlertEvaluation {
  percentUsed: number;
  level: "none" | "warning" | "high" | "critical";
  message: string;
}

export const DEFAULT_BUDGET_THRESHOLDS: BudgetThresholdPolicy = {
  warningPercent: 70,
  highPercent: 85,
  criticalPercent: 100
};

export function evaluateBudgetThresholds(
  usage: BudgetUsage,
  policy: BudgetThresholdPolicy = DEFAULT_BUDGET_THRESHOLDS
): BudgetAlertEvaluation {
  if (usage.limit <= 0) {
    return {
      percentUsed: 0,
      level: "none",
      message: "No budget limit configured"
    };
  }

  const percentUsed = (usage.used / usage.limit) * 100;

  if (percentUsed >= policy.criticalPercent) {
    return {
      percentUsed,
      level: "critical",
      message: `Budget exceeded: ${percentUsed.toFixed(2)}% used`
    };
  }
  if (percentUsed >= policy.highPercent) {
    return {
      percentUsed,
      level: "high",
      message: `Budget high usage: ${percentUsed.toFixed(2)}% used`
    };
  }
  if (percentUsed >= policy.warningPercent) {
    return {
      percentUsed,
      level: "warning",
      message: `Budget warning: ${percentUsed.toFixed(2)}% used`
    };
  }

  return {
    percentUsed,
    level: "none",
    message: `Budget healthy: ${percentUsed.toFixed(2)}% used`
  };
}

