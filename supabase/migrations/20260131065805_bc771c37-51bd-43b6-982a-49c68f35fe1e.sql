-- Add resend confirmation setting
INSERT INTO public.system_settings (key, value)
VALUES ('enable_resend_confirmation', 'true')
ON CONFLICT (key) DO NOTHING;