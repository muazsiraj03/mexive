-- Add storage policy for image-to-prompt uploads
CREATE POLICY "Users can upload prompt-gen images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generation-images' 
  AND (storage.foldername(name))[1] = 'prompt-gen'
);

-- Allow public read access for prompt-gen images (needed for edge function to access)
CREATE POLICY "Public read access for prompt-gen images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'generation-images'
  AND (storage.foldername(name))[1] = 'prompt-gen'
);

-- Allow users to delete their uploaded prompt-gen images
CREATE POLICY "Users can delete prompt-gen images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'generation-images'
  AND (storage.foldername(name))[1] = 'prompt-gen'
);