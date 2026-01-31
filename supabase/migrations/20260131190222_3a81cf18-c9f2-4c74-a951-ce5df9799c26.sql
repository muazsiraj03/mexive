-- Insert response time setting
INSERT INTO public.system_settings (key, value)
VALUES ('response_time', 'Usually within 24 hours')
ON CONFLICT (key) DO NOTHING;