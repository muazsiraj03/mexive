-- Insert system settings for logo URLs if they don't exist
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('logo_light_mode', '""', 'Logo URL for light mode'),
  ('logo_dark_mode', '""', 'Logo URL for dark mode')
ON CONFLICT (key) DO NOTHING;

-- Create storage bucket for branding assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for branding bucket
CREATE POLICY "Admins can upload branding assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'branding' AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update branding assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'branding' AND 
  public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'branding' AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete branding assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'branding' AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view branding assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'branding');