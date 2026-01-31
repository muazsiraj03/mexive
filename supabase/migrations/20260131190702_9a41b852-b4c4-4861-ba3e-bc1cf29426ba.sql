-- Insert admin notification email setting
INSERT INTO public.system_settings (key, value)
VALUES ('admin_notification_email', '')
ON CONFLICT (key) DO NOTHING;