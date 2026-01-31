-- Add website_url setting for configurable email links
INSERT INTO system_settings (key, value) 
VALUES ('website_url', 'https://mexive.lovable.app')
ON CONFLICT (key) DO NOTHING;