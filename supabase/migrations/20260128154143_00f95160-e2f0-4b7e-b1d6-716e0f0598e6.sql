-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  credits INTEGER NOT NULL DEFAULT 10,
  total_credits INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create generations table
CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on generations
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Generations RLS policies
CREATE POLICY "Users can view own generations"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON public.generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations"
  ON public.generations FOR DELETE
  USING (auth.uid() = user_id);

-- Create generation_marketplaces table
CREATE TABLE public.generation_marketplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  marketplace_name TEXT NOT NULL,
  title TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}'
);

-- Enable RLS on generation_marketplaces
ALTER TABLE public.generation_marketplaces ENABLE ROW LEVEL SECURITY;

-- Generation marketplaces RLS policies (access through generation ownership)
CREATE POLICY "Users can view own generation marketplaces"
  ON public.generation_marketplaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.generations
      WHERE generations.id = generation_marketplaces.generation_id
      AND generations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own generation marketplaces"
  ON public.generation_marketplaces FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.generations
      WHERE generations.id = generation_marketplaces.generation_id
      AND generations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own generation marketplaces"
  ON public.generation_marketplaces FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.generations
      WHERE generations.id = generation_marketplaces.generation_id
      AND generations.user_id = auth.uid()
    )
  );

-- Create storage bucket for generation images
INSERT INTO storage.buckets (id, name, public)
VALUES ('generation-images', 'generation-images', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'generation-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view generation images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generation-images');

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'generation-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();