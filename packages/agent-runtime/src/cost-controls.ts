export interface UsageWindow {
  workspaceId: string;
  periodStartIso: string;
  periodEndIso: string;
  tokensUsed: number;
  runsCreated: number;
}

export interface QuotaPolicy {
  maxTokensPerPeriod: number;
  maxRunsPerPeriod: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reasons: string[];
  remainingTokens: number;
  remainingRuns: number;
}

export const DEFAULT_QUOTA_POLICY: QuotaPolicy = {
  maxTokensPerPeriod: 1_000_000,
  maxRunsPerPeriod: 1_000
};

export function evaluateQuota(window: UsageWindow, policy: QuotaPolicy = DEFAULT_QUOTA_POLICY): QuotaCheckResult {
  const remainingTokens = Math.max(0, policy.maxTokensPerPeriod - window.tokensUsed);
  const remainingRuns = Math.max(0, policy.maxRunsPerPeriod - window.runsCreated);
  const reasons: string[] = [];

  if (window.tokensUsed >= policy.maxTokensPerPeriod) {
    reasons.push("token_quota_exceeded");
  }
  if (window.runsCreated >= policy.maxRunsPerPeriod) {
    reasons.push("run_quota_exceeded");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    remainingTokens,
    remainingRuns
  };
}

export interface RateLimitPolicy {
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitWindow {
  requestCount: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function evaluateRateLimit(window: RateLimitWindow, policy: RateLimitPolicy): RateLimitResult {
  if (window.requestCount < policy.maxRequests) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return {
    allowed: false,
    retryAfterSeconds: policy.windowSeconds
  };
}

