-- Add display_name column to generations table
ALTER TABLE public.generations
ADD COLUMN display_name text;

-- Add RLS policy to allow users to update their own generations
CREATE POLICY "Users can update own generations"
ON public.generations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);