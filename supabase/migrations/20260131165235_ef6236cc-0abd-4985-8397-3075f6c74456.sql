-- Create FAQs table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Public can view active FAQs
CREATE POLICY "Active FAQs are viewable by everyone"
ON public.faqs
FOR SELECT
USING (is_active = true);

-- Admins can manage all FAQs
CREATE POLICY "Admins can manage FAQs"
ON public.faqs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default FAQs
INSERT INTO public.faqs (question, answer, sort_order) VALUES
('What AI tools does MetaGen offer?', 'MetaGen provides three powerful AI tools: Metadata Generator for creating marketplace-ready titles, descriptions, and keywords; Image to Prompt for reverse-engineering image prompts; and File Reviewer for checking images against marketplace requirements before submission.', 1),
('How many credits does each tool use?', 'Each tool uses 1 credit per image processed. The Metadata Generator uses 1 credit per image for up to 3 marketplaces simultaneously. Image to Prompt and File Reviewer each use 1 credit per image. Batch processing multiple images will use 1 credit per image in the batch.', 2),
('Is the metadata accepted by Adobe Stock / Freepik / Shutterstock?', 'Yes! Our Metadata Generator follows each marketplace''s specific formatting rules, character limits, and keyword guidelines. This significantly increases acceptance rates compared to manually written metadata. We support Adobe Stock, Shutterstock, Freepik, and more.', 3),
('How accurate is the Image to Prompt feature?', 'Our Image to Prompt tool uses advanced AI to analyze visual elements, style, composition, and mood. It generates detailed prompts that capture the essence of your images, making it perfect for recreating successful styles or understanding what makes images sell.', 4),
('What does the File Reviewer check for?', 'The File Reviewer analyzes technical quality (resolution, noise, artifacts), composition, commercial viability, and marketplace-specific requirements. It provides a detailed report with pass/warning/fail status and actionable suggestions for improvement.', 5),
('How many images can I process at once?', 'You can batch process up to 10 images at a time with the Metadata Generator. Other tools currently support single-image processing for optimal quality. Processing time is typically 5-10 seconds per image.', 6),
('What happens when credits run out?', 'When you run out of credits, you can purchase more through our credit packs or upgrade to a subscription plan. Your account, history, and settings remain intact. We''ll notify you when credits are running low.', 7),
('Can I cancel my subscription anytime?', 'Absolutely. You can cancel your subscription at any time with no cancellation fees. Your access continues until the end of your billing period, and any remaining credits can still be used.', 8),
('Do you store my images?', 'Images are only temporarily stored during processing and are automatically deleted within 24 hours. We never use your images for training or any purpose other than generating your results. Your creative work remains yours.', 9);