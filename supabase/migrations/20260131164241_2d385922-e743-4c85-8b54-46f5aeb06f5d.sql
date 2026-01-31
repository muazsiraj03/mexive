-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  tool TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public can view active testimonials
CREATE POLICY "Active testimonials are viewable by everyone"
ON public.testimonials
FOR SELECT
USING (is_active = true);

-- Admins can manage all testimonials
CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default testimonials
INSERT INTO public.testimonials (name, role, avatar_url, rating, content, tool, sort_order) VALUES
('Sarah Mitchell', 'Stock Photographer', '', 5, 'MetaGen has completely transformed my workflow. I used to spend hours writing metadata for each image. Now I upload a batch and have perfect, marketplace-ready metadata in minutes.', 'Metadata Generator', 1),
('David Chen', 'Digital Artist', '', 5, 'The Image to Prompt feature is incredible for recreating styles. I can analyze my best-selling images and understand exactly what prompts would recreate that success.', 'Image to Prompt', 2),
('Emma Rodriguez', 'Product Photographer', '', 5, 'The File Reviewer has been a game-changer for my workflow. I catch issues before submission and my acceptance rate has improved dramatically.', 'File Reviewer', 3),
('Michael Park', 'Stock Contributor', '', 5, 'I was getting so many rejections before using the File Reviewer. Now I catch issues before submission and my acceptance rate has gone from 60% to over 95%.', 'File Reviewer', 4),
('Lisa Thompson', 'Freelance Illustrator', '', 5, 'Finally, a tool that understands stock marketplace requirements! The AI-generated keywords are spot-on and my images are getting discovered way more often.', 'Metadata Generator', 5),
('James Wilson', 'Nature Photographer', '', 5, 'The multi-marketplace support is a game-changer. I submit to Adobe Stock, Shutterstock, and Freepik, and MetaGen formats everything correctly for each platform.', 'Metadata Generator', 6);