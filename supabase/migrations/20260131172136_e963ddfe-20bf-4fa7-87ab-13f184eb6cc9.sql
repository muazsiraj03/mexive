-- Create comparisons table for landing page comparison section
CREATE TABLE public.comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aspect TEXT NOT NULL,
  manual_value TEXT NOT NULL,
  ai_value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active comparisons"
ON public.comparisons
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage comparisons"
ON public.comparisons
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'::app_role
));

-- Create trigger for updated_at
CREATE TRIGGER update_comparisons_updated_at
BEFORE UPDATE ON public.comparisons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();