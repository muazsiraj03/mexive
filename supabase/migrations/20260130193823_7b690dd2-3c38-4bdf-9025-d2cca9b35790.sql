-- Create generations table for metadata generator
CREATE TABLE public.generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    batch_id UUID,
    image_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Create generation batches table
CREATE TABLE public.generation_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_batches ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint for batch_id
ALTER TABLE public.generations 
    ADD CONSTRAINT fk_generations_batch 
    FOREIGN KEY (batch_id) 
    REFERENCES public.generation_batches(id) 
    ON DELETE SET NULL;

-- Create generation marketplaces table
CREATE TABLE public.generation_marketplaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id UUID REFERENCES public.generations(id) ON DELETE CASCADE NOT NULL,
    marketplace_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_marketplaces ENABLE ROW LEVEL SECURITY;

-- Drop and recreate file_reviewer_config with proper structure
DROP TABLE IF EXISTS public.file_reviewer_config CASCADE;

CREATE TABLE public.file_reviewer_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rejection_reasons JSONB NOT NULL DEFAULT '{}',
    marketplace_rules JSONB NOT NULL DEFAULT '{}',
    scoring_weights JSONB NOT NULL DEFAULT '{"visual_quality": 30, "technical": 30, "content": 25, "commercial": 15}',
    pass_threshold INTEGER NOT NULL DEFAULT 70,
    warning_threshold INTEGER NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.file_reviewer_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generations
CREATE POLICY "Users can view own generations" ON public.generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations" ON public.generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON public.generations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON public.generations
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for generation_batches
CREATE POLICY "Users can view own batches" ON public.generation_batches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own batches" ON public.generation_batches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own batches" ON public.generation_batches
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for generation_marketplaces (inherit from generations)
CREATE POLICY "Users can view own marketplace data" ON public.generation_marketplaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.generations g 
            WHERE g.id = generation_id AND g.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create marketplace data for own generations" ON public.generation_marketplaces
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.generations g 
            WHERE g.id = generation_id AND g.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update marketplace data for own generations" ON public.generation_marketplaces
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.generations g 
            WHERE g.id = generation_id AND g.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete marketplace data for own generations" ON public.generation_marketplaces
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.generations g 
            WHERE g.id = generation_id AND g.user_id = auth.uid()
        )
    );

-- RLS Policies for file_reviewer_config
CREATE POLICY "File reviewer config is viewable by everyone" ON public.file_reviewer_config
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage file reviewer config" ON public.file_reviewer_config
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for file_reviewer_config updated_at
CREATE TRIGGER update_file_reviewer_config_updated_at
    BEFORE UPDATE ON public.file_reviewer_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default file reviewer config
INSERT INTO public.file_reviewer_config (
    rejection_reasons,
    marketplace_rules,
    scoring_weights,
    pass_threshold,
    warning_threshold
) VALUES (
    '{
        "image": {
            "LOW_RESOLUTION": {"message": "Image resolution too low", "severity": "high", "category": "Technical", "enabled": true},
            "OVER_SHARPENED": {"message": "Image appears over-sharpened", "severity": "medium", "category": "Quality", "enabled": true},
            "NOISE_VISIBLE": {"message": "Visible noise or grain", "severity": "medium", "category": "Quality", "enabled": true},
            "WATERMARK": {"message": "Watermark detected", "severity": "high", "category": "Legal", "enabled": true}
        },
        "video": {
            "LOW_RESOLUTION": {"message": "Video resolution too low", "severity": "high", "category": "Technical", "enabled": true},
            "UNSTABLE": {"message": "Shaky or unstable footage", "severity": "medium", "category": "Quality", "enabled": true}
        },
        "vector": {
            "RASTER_ELEMENTS": {"message": "Contains raster elements", "severity": "high", "category": "Technical", "enabled": true}
        }
    }'::jsonb,
    '{
        "Adobe Stock": {"min_resolution": 4, "min_dimension": 2000, "allowed_formats": ["jpg", "jpeg", "png", "eps", "svg", "mp4", "mov"], "notes": "Minimum 4MP for images"},
        "Shutterstock": {"min_resolution": 4, "min_dimension": 1920, "allowed_formats": ["jpg", "jpeg", "png", "eps", "svg", "mp4", "mov"], "notes": "Minimum 4MP, 1920px video"},
        "Freepik": {"min_resolution": 3, "min_dimension": 1500, "allowed_formats": ["jpg", "jpeg", "png", "eps", "svg", "ai", "psd"], "notes": "Accepts PSD and AI files"}
    }'::jsonb,
    '{"visual_quality": 30, "technical": 30, "content": 25, "commercial": 15}'::jsonb,
    70,
    50
);

-- Create storage bucket for generation images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generation-images', 'generation-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for generation-images bucket
CREATE POLICY "Anyone can view generation images" ON storage.objects
    FOR SELECT USING (bucket_id = 'generation-images');

CREATE POLICY "Authenticated users can upload generation images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'generation-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own generation images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'generation-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own generation images" ON storage.objects
    FOR DELETE USING (bucket_id = 'generation-images' AND auth.uid()::text = (storage.foldername(name))[1]);