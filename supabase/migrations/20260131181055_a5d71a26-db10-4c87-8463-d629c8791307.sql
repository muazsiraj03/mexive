-- Create social links table
CREATE TABLE public.social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Link',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active social links"
  ON public.social_links FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage social links"
  ON public.social_links FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_social_links_updated_at
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default social links
INSERT INTO public.social_links (platform, url, icon, sort_order) VALUES
  ('Facebook', '#', 'Facebook', 1),
  ('Twitter', '#', 'Twitter', 2),
  ('Instagram', '#', 'Instagram', 3),
  ('LinkedIn', '#', 'Linkedin', 4),
  ('YouTube', '#', 'Youtube', 5);