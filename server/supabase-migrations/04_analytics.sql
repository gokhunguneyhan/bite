-- Analytics: per-summary tracking for admin dashboard
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS summary_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID REFERENCES summaries(id) ON DELETE SET NULL,
  video_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  video_duration_seconds INT,
  video_language TEXT DEFAULT 'en',
  source_platform TEXT DEFAULT 'youtube',
  processing_time_ms INT,
  token_usage_input INT DEFAULT 0,
  token_usage_output INT DEFAULT 0,
  token_usage_total INT DEFAULT 0,
  token_cache_read INT DEFAULT 0,
  token_cache_creation INT DEFAULT 0,
  estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
  output_word_count INT DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_type TEXT CHECK (error_type IN (
    'network_timeout', 'video_unavailable', 'no_captions',
    'unsupported_language', 'content_policy', 'token_limit_exceeded',
    'rate_limited', 'parse_error', 'unknown'
  )),
  error_message TEXT,
  retry_count INT DEFAULT 0,
  was_cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON summary_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON summary_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_status ON summary_analytics(status);
CREATE INDEX IF NOT EXISTS idx_analytics_video_id ON summary_analytics(video_id);

-- RLS: only admins can read analytics
ALTER TABLE summary_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_select_admin" ON summary_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Service role can insert (server-side)
CREATE POLICY "analytics_insert_service" ON summary_analytics
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- VIEWS for dashboard performance
-- ============================================================

-- Category distribution with cost
CREATE OR REPLACE VIEW v_category_distribution AS
SELECT
  s.category,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) AS percentage,
  ROUND(AVG(a.video_duration_seconds)::numeric, 0) AS avg_duration_seconds,
  ROUND(AVG(a.estimated_cost_usd)::numeric, 4) AS avg_cost,
  ROUND(SUM(a.estimated_cost_usd)::numeric, 4) AS total_cost
FROM summary_analytics a
JOIN summaries s ON s.id = a.summary_id
WHERE a.status = 'success' AND a.summary_id IS NOT NULL
GROUP BY s.category
ORDER BY count DESC;

-- Success / failure with error taxonomy
CREATE OR REPLACE VIEW v_success_failure AS
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'success') AS success_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failure_count,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'success') * 100.0 / NULLIF(COUNT(*), 0), 1
  ) AS success_rate
FROM summary_analytics;

CREATE OR REPLACE VIEW v_error_taxonomy AS
SELECT
  error_type,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) AS percentage
FROM summary_analytics
WHERE status = 'failed' AND error_type IS NOT NULL
GROUP BY error_type
ORDER BY count DESC;

-- Processing performance (percentiles)
CREATE OR REPLACE VIEW v_processing_performance AS
SELECT
  ROUND(AVG(processing_time_ms)::numeric, 0) AS avg_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time_ms) AS p50_ms,
  PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY processing_time_ms) AS p90_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY processing_time_ms) AS p99_ms,
  ROUND(AVG(retry_count)::numeric, 2) AS avg_retry_count,
  COUNT(*) AS total_processed
FROM summary_analytics
WHERE status = 'success' AND processing_time_ms IS NOT NULL;

-- Volume over time (daily)
CREATE OR REPLACE VIEW v_volume_daily AS
SELECT
  DATE(created_at) AS day,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'success') AS success,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed
FROM summary_analytics
GROUP BY DATE(created_at)
ORDER BY day DESC;

-- Volume by hour of day
CREATE OR REPLACE VIEW v_volume_hourly AS
SELECT
  EXTRACT(HOUR FROM created_at) AS hour,
  COUNT(*) AS count
FROM summary_analytics
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- Volume by day of week (0=Sun, 6=Sat)
CREATE OR REPLACE VIEW v_volume_day_of_week AS
SELECT
  EXTRACT(DOW FROM created_at) AS dow,
  COUNT(*) AS count
FROM summary_analytics
GROUP BY EXTRACT(DOW FROM created_at)
ORDER BY dow;

-- Cost tracking by duration bucket
CREATE OR REPLACE VIEW v_cost_by_duration AS
SELECT
  CASE
    WHEN video_duration_seconds < 300 THEN '0-5 min'
    WHEN video_duration_seconds < 900 THEN '5-15 min'
    WHEN video_duration_seconds < 1800 THEN '15-30 min'
    WHEN video_duration_seconds < 3600 THEN '30-60 min'
    ELSE '60+ min'
  END AS duration_bucket,
  COUNT(*) AS count,
  ROUND(AVG(estimated_cost_usd)::numeric, 4) AS avg_cost,
  ROUND(SUM(estimated_cost_usd)::numeric, 4) AS total_cost
FROM summary_analytics
WHERE status = 'success'
GROUP BY duration_bucket
ORDER BY MIN(video_duration_seconds);

-- Summary characteristics
CREATE OR REPLACE VIEW v_summary_characteristics AS
SELECT
  ROUND(AVG(output_word_count)::numeric, 0) AS avg_word_count,
  COUNT(DISTINCT video_language) AS language_count,
  COUNT(DISTINCT source_platform) AS platform_count
FROM summary_analytics
WHERE status = 'success';

-- Language distribution
CREATE OR REPLACE VIEW v_language_distribution AS
SELECT
  video_language AS language,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) AS percentage
FROM summary_analytics
WHERE status = 'success'
GROUP BY video_language
ORDER BY count DESC;

-- User cohorts: summaries per user histogram
CREATE OR REPLACE VIEW v_user_histogram AS
SELECT
  CASE
    WHEN cnt = 1 THEN '1'
    WHEN cnt BETWEEN 2 AND 5 THEN '2-5'
    WHEN cnt BETWEEN 6 AND 10 THEN '6-10'
    WHEN cnt BETWEEN 11 AND 25 THEN '11-25'
    ELSE '26+'
  END AS bucket,
  COUNT(*) AS user_count
FROM (
  SELECT user_id, COUNT(*) AS cnt
  FROM summary_analytics
  WHERE status = 'success'
  GROUP BY user_id
) sub
GROUP BY bucket
ORDER BY MIN(cnt);

-- Failed sessions log (for admin table)
CREATE OR REPLACE VIEW v_failed_sessions AS
SELECT
  a.id,
  a.video_id,
  a.error_type,
  a.error_message,
  a.user_id,
  a.created_at,
  a.processing_time_ms
FROM summary_analytics a
WHERE a.status = 'failed'
ORDER BY a.created_at DESC;
