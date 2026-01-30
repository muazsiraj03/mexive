-- Create storage policies for file reviews folder
-- Allow authenticated users to upload their own review files
CREATE POLICY "Users can upload review files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'generation-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'reviews'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to view their own review files
CREATE POLICY "Users can view own review files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'generation-images'
  AND (storage.foldername(name))[1] = 'reviews'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own review files
CREATE POLICY "Users can delete own review files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'generation-images'
  AND (storage.foldername(name))[1] = 'reviews'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read access for review images (needed for AI analysis)
CREATE POLICY "Public read access for review files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'generation-images'
  AND (storage.foldername(name))[1] = 'reviews'
);