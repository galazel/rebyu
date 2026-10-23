-- Pending/failed kinds are audit records, not charged AI uses.
ALTER TABLE ai_generation_usage ADD COLUMN IF NOT EXISTS provider_conversation_id varchar(128);
ALTER TABLE ai_generation_usage ADD COLUMN IF NOT EXISTS provider_agent_id varchar(128);
ALTER TABLE ai_generation_usage ADD COLUMN IF NOT EXISTS provider_verified boolean;
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_pending
    ON ai_generation_usage (kind, created_at)
    WHERE provider_verified = false AND provider_conversation_id IS NOT NULL;
