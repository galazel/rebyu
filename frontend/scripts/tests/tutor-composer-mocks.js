export function useLearnerEntitlements() { return { isFree: false, isLoading: false } }
export function useAiUsage() { return { bucket: () => null, refresh() {} } }
export function isBucketExhausted() { return false }
export function bucketRatio() { return 0 }
export function AiLimitNotice() { return null }
export function AiUsageRing() { return null }
export function AiUsageBars() { return null }
export function AiUsageSummary() { return null }
export function AiUsageBreakdown() { return null }
export const AI_USAGE_QUERY_KEY = ['fixture-ai-usage']
