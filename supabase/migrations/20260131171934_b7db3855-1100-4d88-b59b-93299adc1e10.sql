-- Create benefits table for dynamic tool-specific benefits
CREATE TABLE public.benefits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool TEXT NOT NULL DEFAULT 'metadata-generator',
  icon TEXT NOT NULL DEFAULT 'CheckCircle',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active benefits" 
ON public.benefits 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage benefits" 
ON public.benefits 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'::app_role
));

-- Add trigger for updated_at
CREATE TRIGGER update_benefits_updated_at
BEFORE UPDATE ON public.benefits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default benefits for Metadata Generator
INSERT INTO public.benefits (tool, icon, title, description, sort_order) VALUES
('metadata-generator', 'Clock', 'Faster Uploads', 'Save hours per batch with automated metadata generation', 0),
('metadata-generator', 'CheckCircle', 'Higher Acceptance Rate', 'Metadata that follows marketplace-specific guidelines', 1),
('metadata-generator', 'Search', 'SEO-Optimized Keywords', 'AI-selected keywords for maximum search visibility', 2),
('metadata-generator', 'Shield', 'No Keyword Stuffing', 'Clean, relevant tags that won''t trigger rejections', 3),
('metadata-generator', 'Globe', 'Multi-Marketplace Ready', 'One upload, optimized for all major platforms', 4);

-- Insert default benefits for Image to Prompt
INSERT INTO public.benefits (tool, icon, title, description, sort_order) VALUES
('image-to-prompt', 'Sparkles', 'Accurate Prompts', 'Get detailed prompts that capture every element of your image', 0),
('image-to-prompt', 'Palette', 'Style Detection', 'AI identifies art styles, lighting, and composition', 1),
('image-to-prompt', 'Layers', 'Multiple AI Platforms', 'Prompts optimized for Midjourney, DALL-E, and more', 2),
('image-to-prompt', 'Zap', 'Instant Results', 'Generate prompts in seconds, not minutes', 3),
('image-to-prompt', 'Copy', 'Easy to Use', 'Copy prompts with one click and use anywhere', 4);

-- Insert default benefits for File Reviewer
INSERT INTO public.benefits (tool, icon, title, description, sort_order) VALUES
('file-reviewer', 'Shield', 'Pre-Submission Check', 'Catch issues before marketplace rejection', 0),
('file-reviewer', 'Target', 'Technical Analysis', 'Resolution, noise, sharpness, and more checked', 1),
('file-reviewer', 'FileCheck', 'Compliance Scoring', 'Know your acceptance probability before uploading', 2),
('file-reviewer', 'AlertCircle', 'Issue Detection', 'Identifies problems that cause rejections', 3),
('file-reviewer', 'TrendingUp', 'Improve Quality', 'Actionable feedback to enhance your work', 4);