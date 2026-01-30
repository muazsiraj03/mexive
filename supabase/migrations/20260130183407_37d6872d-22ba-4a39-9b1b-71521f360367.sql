-- Drop the existing restrictive admin policy
DROP POLICY IF EXISTS "Admins can manage pricing" ON public.pricing_config;

-- Create a new PERMISSIVE admin policy for all operations
CREATE POLICY "Admins can manage pricing"
ON public.pricing_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));