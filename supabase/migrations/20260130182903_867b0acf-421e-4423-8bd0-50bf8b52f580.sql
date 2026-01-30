-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily credit reset cron job to run at midnight UTC
SELECT cron.schedule(
  'daily-credit-reset',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://cznvtcvzotilcxajcflw.supabase.co/functions/v1/daily-credit-reset',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bnZ0Y3Z6b3RpbGN4YWpjZmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTE4MDMsImV4cCI6MjA4NTE4NzgwM30.aI8P_LWwg7ak1fw6MIG51dBlF-yfq-xYf0i57WF4nHQ"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);