-- Add tool column to features table
ALTER TABLE public.features 
ADD COLUMN tool TEXT NOT NULL DEFAULT 'metadata-generator';

-- Update existing features to be for all tools (we'll use 'all' for general features)
UPDATE public.features SET tool = 'all';

-- Insert some default tool-specific features
INSERT INTO public.features (tool, icon, title, description, sort_order) VALUES
('metadata-generator', 'Tags', 'Smart Keyword Generation', 'AI generates relevant, high-ranking keywords optimized for each marketplace.', 0),
('metadata-generator', 'Globe', 'Multi-Marketplace Support', 'One upload, metadata for Adobe Stock, Shutterstock, Freepik, and more.', 1),
('metadata-generator', 'Zap', 'Bulk Processing', 'Process hundreds of images at once with consistent quality.', 2),
('image-to-prompt', 'Sparkles', 'Detailed Prompts', 'Get comprehensive prompts that capture every detail of your image.', 0),
('image-to-prompt', 'Palette', 'Style Detection', 'AI identifies art styles, lighting, composition, and color palettes.', 1),
('image-to-prompt', 'Layers', 'Multiple Formats', 'Prompts optimized for Midjourney, DALL-E, Stable Diffusion, and more.', 2),
('file-reviewer', 'Shield', 'Quality Analysis', 'Comprehensive technical and aesthetic quality scoring.', 0),
('file-reviewer', 'AlertCircle', 'Issue Detection', 'Identifies problems before marketplace rejection.', 1),
('file-reviewer', 'CheckCircle', 'Actionable Feedback', 'Clear suggestions to improve acceptance rates.', 2);