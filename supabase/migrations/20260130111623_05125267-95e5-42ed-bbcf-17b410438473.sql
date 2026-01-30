-- Create file_reviews table
CREATE TABLE public.file_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 0,
  verdict TEXT NOT NULL DEFAULT 'pending',
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  marketplace_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.file_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user data isolation
CREATE POLICY "Users can view own file reviews"
  ON public.file_reviews
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own file reviews"
  ON public.file_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own file reviews"
  ON public.file_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for efficient queries
CREATE INDEX idx_file_reviews_user_id ON public.file_reviews(user_id);
CREATE INDEX idx_file_reviews_created_at ON public.file_reviews(created_at DESC);
CREATE INDEX idx_file_reviews_verdict ON public.file_reviews(verdict);