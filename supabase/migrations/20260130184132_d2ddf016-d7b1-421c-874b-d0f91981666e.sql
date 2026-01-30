-- Insert system settings for branding and SEO
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('app_name', '"MetaGen"', 'Application name displayed throughout the app'),
  ('browser_title', '"MetaGen - AI Metadata Generator"', 'Browser tab title'),
  ('favicon_url', '""', 'Custom favicon URL'),
  ('meta_description', '"Generate optimized metadata for your stock images and videos with AI"', 'SEO meta description'),
  ('meta_keywords', '"metadata generator, stock photography, AI, keywords, SEO"', 'SEO meta keywords'),
  ('og_image_url', '""', 'Open Graph image URL for social sharing'),
  ('footer_text', '"© 2025 MetaGen. All rights reserved."', 'Footer copyright text'),
  ('support_email', '"support@metagen.com"', 'Support email address')
ON CONFLICT (key) DO NOTHING;