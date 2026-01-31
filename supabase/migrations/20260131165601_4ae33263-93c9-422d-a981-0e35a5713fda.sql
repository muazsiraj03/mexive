-- Create features table for landing page
CREATE TABLE public.features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icon TEXT NOT NULL DEFAULT 'Wand2',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- Public read access for active features
CREATE POLICY "Anyone can view active features"
ON public.features
FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage features"
ON public.features
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Insert default features
INSERT INTO public.features (icon, title, description, sort_order) VALUES
('Wand2', 'AI Metadata Generator', 'Generate optimized titles, descriptions & keywords for Adobe Stock, Freepik & Shutterstock.', 1),
('MessageSquareText', 'Image to Prompt', 'Extract detailed AI prompts from any image for Midjourney, DALL-E & Stable Diffusion.', 2),
('FileCheck', 'File Reviewer', 'AI-powered quality control against marketplace rejection standards before upload.', 3),
('Layers', 'Marketplace-Specific Output', 'Tailored formatting for Adobe Stock, Freepik, and Shutterstock requirements.', 4),
('Files', 'Bulk Processing', 'Process multiple images at once with batch queue and progress tracking.', 5),
('Download', 'SEO-Optimized Downloads', 'Download with embedded XMP metadata and SEO-friendly filenames.', 6),
('Coins', 'Flexible Pricing', 'Credit-based usage with monthly subscriptions and one-time top-up packs.', 7);

-- Create updated_at trigger
CREATE TRIGGER update_features_updated_at
BEFORE UPDATE ON public.features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();