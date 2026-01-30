-- Add logo size and alignment settings
INSERT INTO system_settings (key, value, description)
VALUES 
  ('logo_size', '"medium"', 'Logo display size: small, medium, large'),
  ('logo_alignment', '"left"', 'Logo alignment: left, center, right')
ON CONFLICT (key) DO NOTHING;