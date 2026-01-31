-- Add tool column to comparisons table
ALTER TABLE public.comparisons 
ADD COLUMN tool TEXT NOT NULL DEFAULT 'metadata-generator';