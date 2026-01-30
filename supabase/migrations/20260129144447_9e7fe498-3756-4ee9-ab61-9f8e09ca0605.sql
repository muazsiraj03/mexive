-- Allow users to update their own generation marketplaces (for editing keywords, title, description)
CREATE POLICY "Users can update own generation marketplaces"
ON public.generation_marketplaces
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM generations
  WHERE generations.id = generation_marketplaces.generation_id
    AND generations.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM generations
  WHERE generations.id = generation_marketplaces.generation_id
    AND generations.user_id = auth.uid()
));