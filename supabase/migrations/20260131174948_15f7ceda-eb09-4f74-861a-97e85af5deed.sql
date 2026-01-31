-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  author_name TEXT NOT NULL DEFAULT 'Mexive Team',
  category TEXT NOT NULL DEFAULT 'Tips & Tricks',
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  read_time_minutes INTEGER NOT NULL DEFAULT 5,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can view published posts
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts
FOR SELECT
USING (is_published = true);

-- Admins can manage all posts
CREATE POLICY "Admins can manage blog posts"
ON public.blog_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for slug lookups
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);