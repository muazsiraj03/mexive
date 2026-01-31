-- Seed default pricing plans
INSERT INTO public.pricing_config (plan_name, display_name, price_cents, credits, period, features, is_popular, is_active, is_unlimited, sort_order, tools_access, daily_credit_reset)
VALUES 
  ('free', 'Free', 0, 2, '', ARRAY['2 credits/day', 'Limited metadata generation', 'Limited Image to Prompt generation'], false, true, false, 0, ARRAY['metadata-generator'], true),
  ('starter', 'Starter', 499, 2000, 'month', ARRAY['2,000 credits/month', 'All tools access', 'Priority support', 'Batch processing'], true, true, false, 1, ARRAY['metadata-generator', 'image-to-prompt', 'file-reviewer'], false),
  ('pro', 'Pro', 999, 5000, 'month', ARRAY['5,000 credits/month', 'All tools access', 'Special support', 'Batch processing', 'Training presets'], false, true, false, 2, ARRAY['metadata-generator', 'image-to-prompt', 'file-reviewer'], false)
ON CONFLICT DO NOTHING;

-- Seed default credit tiers for starter and pro plans
INSERT INTO public.credit_tiers (plan_name, credits, price_cents, sort_order, is_active)
VALUES 
  ('starter', 2000, 499, 0, true),
  ('pro', 5000, 999, 0, true)
ON CONFLICT DO NOTHING;