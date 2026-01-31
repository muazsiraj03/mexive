-- Create landing_stats table for the stats bar
CREATE TABLE public.landing_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_stats ENABLE ROW LEVEL SECURITY;

-- Public can view active stats
CREATE POLICY "Active stats are viewable by everyone"
ON public.landing_stats
FOR SELECT
USING (is_active = true);

-- Admins can manage all stats
CREATE POLICY "Admins can manage landing stats"
ON public.landing_stats
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_landing_stats_updated_at
BEFORE UPDATE ON public.landing_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default stats
INSERT INTO public.landing_stats (label, value, sort_order) VALUES
('Active Users', '10K+', 1),
('Images Processed', '2M+', 2),
('Acceptance Rate', '95%', 3),
('User Rating', '4.9/5', 4);