-- Schedule daily cleanup at 3 AM UTC
SELECT cron.schedule(
  'cleanup-old-generations-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cznvtcvzotilcxajcflw.supabase.co/functions/v1/cleanup-old-generations',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bnZ0Y3Z6b3RpbGN4YWpjZmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTE4MDMsImV4cCI6MjA4NTE4NzgwM30.aI8P_LWwg7ak7fw6MIG51dBlF-yfq-xYf0i57WF4nHQ"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);