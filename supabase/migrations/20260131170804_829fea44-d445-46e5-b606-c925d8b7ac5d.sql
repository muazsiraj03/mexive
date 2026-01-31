-- Create how_it_works table for dynamic tool-specific steps
CREATE TABLE public.how_it_works (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool TEXT NOT NULL DEFAULT 'metadata-generator',
  step_number TEXT NOT NULL DEFAULT '01',
  icon TEXT NOT NULL DEFAULT 'Upload',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.how_it_works ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active how_it_works" 
ON public.how_it_works 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage how_it_works" 
ON public.how_it_works 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'::app_role
));

-- Add trigger for updated_at
CREATE TRIGGER update_how_it_works_updated_at
BEFORE UPDATE ON public.how_it_works
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default steps for Metadata Generator
INSERT INTO public.how_it_works (tool, step_number, icon, title, description, sort_order) VALUES
('metadata-generator', '01', 'Upload', 'Upload Your Image', 'Single or bulk upload your images. Supports JPG, PNG, and other common formats.', 0),
('metadata-generator', '02', 'Cpu', 'AI Analyzes Content', 'Our AI identifies subjects, context, intent, and ensures marketplace compliance.', 1),
('metadata-generator', '03', 'FileCheck', 'Get Ready Metadata', 'Receive upload-ready titles, descriptions, and keywords for each marketplace.', 2);

-- Insert default steps for Image to Prompt
INSERT INTO public.how_it_works (tool, step_number, icon, title, description, sort_order) VALUES
('image-to-prompt', '01', 'ImagePlus', 'Upload Reference Image', 'Upload any image you want to recreate or use as inspiration.', 0),
('image-to-prompt', '02', 'Sparkles', 'AI Generates Prompt', 'Our AI analyzes the image and creates detailed, accurate prompts.', 1),
('image-to-prompt', '03', 'Copy', 'Copy & Use Anywhere', 'Use the generated prompts in Midjourney, DALL-E, Stable Diffusion, and more.', 2);

-- Insert default steps for File Reviewer
INSERT INTO public.how_it_works (tool, step_number, icon, title, description, sort_order) VALUES
('file-reviewer', '01', 'FileUp', 'Submit Your File', 'Upload your stock image or video for comprehensive analysis.', 0),
('file-reviewer', '02', 'Search', 'AI Reviews Quality', 'Our AI checks technical specs, composition, and marketplace requirements.', 1),
('file-reviewer', '03', 'ClipboardCheck', 'Get Detailed Report', 'Receive actionable feedback to improve acceptance rates.', 2);