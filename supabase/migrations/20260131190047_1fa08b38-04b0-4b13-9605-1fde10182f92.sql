-- Insert WhatsApp number setting
INSERT INTO public.system_settings (key, value)
VALUES ('whatsapp_number', '')
ON CONFLICT (key) DO NOTHING;