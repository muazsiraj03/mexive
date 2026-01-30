-- Create table for file reviewer training configuration (admin only)
CREATE TABLE public.file_reviewer_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Rejection reasons configuration
  rejection_reasons jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Marketplace-specific rules
  marketplace_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Scoring weights per category
  scoring_weights jsonb NOT NULL DEFAULT '{"visual_quality": 25, "technical": 30, "content": 25, "commercial": 20}'::jsonb,
  
  -- General settings
  pass_threshold integer NOT NULL DEFAULT 70,
  warning_threshold integer NOT NULL DEFAULT 50,
  
  -- Active status
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.file_reviewer_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage the config
CREATE POLICY "Admins can manage file reviewer config"
ON public.file_reviewer_config
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can read active config (needed for the edge function)
CREATE POLICY "Anyone can read active config"
ON public.file_reviewer_config
FOR SELECT
USING (is_active = true);

-- Trigger to update updated_at
CREATE TRIGGER update_file_reviewer_config_updated_at
BEFORE UPDATE ON public.file_reviewer_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.file_reviewer_config (rejection_reasons, marketplace_rules, scoring_weights) VALUES (
  '{
    "raster": {
      "VISUALLY_POOR": {"message": "Image is visually unappealing", "severity": "high", "category": "visual_quality", "enabled": true},
      "NOT_REALISTIC": {"message": "Image does not look realistic", "severity": "high", "category": "visual_quality", "enabled": true},
      "HUMAN_ANATOMY_ISSUES": {"message": "Human anatomy issues detected (hands, feet, face)", "severity": "high", "category": "content", "enabled": true},
      "IMAGE_QUALITY_POOR": {"message": "Poor image quality (noise, pixels, broken details)", "severity": "high", "category": "technical", "enabled": true},
      "BLUR_DETECTED": {"message": "Image appears blurry or out of focus", "severity": "high", "category": "technical", "enabled": true},
      "LOW_RESOLUTION": {"message": "Resolution is below 4MP", "severity": "medium", "category": "technical", "enabled": true},
      "WATERMARK_DETECTED": {"message": "Logo or watermark detected", "severity": "high", "category": "content", "enabled": true},
      "SUBJECT_ISSUES": {"message": "Subject is damaged, half-cut, or unclear", "severity": "high", "category": "content", "enabled": true},
      "OVER_EDITED": {"message": "Image is over-edited or over-detailed", "severity": "medium", "category": "visual_quality", "enabled": true},
      "NOT_STOCK_USABLE": {"message": "Not suitable for stock usage", "severity": "high", "category": "commercial", "enabled": true}
    },
    "svg": {
      "SHAPE_BROKEN": {"message": "Shapes are broken or distorted", "severity": "high", "category": "technical", "enabled": true},
      "MESSY_PATHS": {"message": "Anchor points or paths are messy", "severity": "medium", "category": "technical", "enabled": true},
      "UNNECESSARY_DETAIL": {"message": "Too many unnecessary details", "severity": "low", "category": "visual_quality", "enabled": true},
      "INCONSISTENT_STROKES": {"message": "Stroke or fill is inconsistent", "severity": "medium", "category": "technical", "enabled": true},
      "ZOOM_QUALITY_POOR": {"message": "Design is not clean when zoomed", "severity": "medium", "category": "technical", "enabled": true},
      "TEXT_NOT_OUTLINED": {"message": "Text is not converted to outlines", "severity": "high", "category": "technical", "enabled": true},
      "ICON_NOT_CLEAR": {"message": "Icon or illustration is unclear", "severity": "medium", "category": "visual_quality", "enabled": true},
      "NOT_COMMERCIAL_FRIENDLY": {"message": "Not suitable for commercial use", "severity": "high", "category": "commercial", "enabled": true}
    },
    "eps": {
      "FILE_ERROR": {"message": "File opens with errors", "severity": "high", "category": "technical", "enabled": true},
      "CLIPPED_ARTWORK": {"message": "Artwork is clipped or broken", "severity": "high", "category": "technical", "enabled": true},
      "EXCESSIVE_ANCHORS": {"message": "Too many anchor points", "severity": "medium", "category": "technical", "enabled": true},
      "STROKE_NOT_EXPANDED": {"message": "Strokes are not expanded", "severity": "medium", "category": "technical", "enabled": true},
      "RASTER_EMBEDDED": {"message": "Raster elements are embedded", "severity": "high", "category": "technical", "enabled": true},
      "HIDDEN_OBJECTS": {"message": "Unnecessary hidden objects detected", "severity": "low", "category": "technical", "enabled": true},
      "OVER_COMPLEX": {"message": "Design is overly complex", "severity": "medium", "category": "visual_quality", "enabled": true},
      "NOT_PRINT_READY": {"message": "Not clean or print-ready", "severity": "high", "category": "commercial", "enabled": true}
    },
    "ai": {
      "FILE_CORRUPTED": {"message": "File is corrupted or wont open", "severity": "high", "category": "technical", "enabled": true},
      "LINKED_IMAGE_MISSING": {"message": "Linked images are missing", "severity": "high", "category": "technical", "enabled": true},
      "HIDDEN_LAYERS": {"message": "Hidden layers or junk objects present", "severity": "low", "category": "technical", "enabled": true},
      "TEXT_NOT_OUTLINED": {"message": "Text is not outlined", "severity": "high", "category": "technical", "enabled": true},
      "ARTBOARD_MESSY": {"message": "Artboard is messy", "severity": "medium", "category": "technical", "enabled": true},
      "UNNECESSARY_EFFECTS": {"message": "Unnecessary effects applied", "severity": "low", "category": "visual_quality", "enabled": true},
      "NOT_CLEAN_VECTOR": {"message": "Not a clean vector", "severity": "medium", "category": "technical", "enabled": true},
      "NOT_STOCK_USABLE": {"message": "Not suitable for stock usage", "severity": "high", "category": "commercial", "enabled": true}
    },
    "video": {
      "VIDEO_QUALITY_POOR": {"message": "Video quality is poor", "severity": "high", "category": "technical", "enabled": true},
      "SHAKY_FOOTAGE": {"message": "Footage is shaky or unstable", "severity": "high", "category": "technical", "enabled": true},
      "BLUR_NOISE": {"message": "Too much blur or noise", "severity": "medium", "category": "technical", "enabled": true},
      "INCONSISTENT_LIGHTING": {"message": "Lighting is inconsistent", "severity": "medium", "category": "visual_quality", "enabled": true},
      "SUBJECT_NOT_CLEAR": {"message": "Subject is not clear", "severity": "high", "category": "content", "enabled": true},
      "UNREALISTIC_MOTION": {"message": "Motion appears unrealistic or fake", "severity": "high", "category": "visual_quality", "enabled": true},
      "WATERMARK_DETECTED": {"message": "Logo or watermark detected", "severity": "high", "category": "content", "enabled": true},
      "NOT_STOCK_USABLE": {"message": "Not suitable for stock use", "severity": "high", "category": "commercial", "enabled": true}
    }
  }'::jsonb,
  '{
    "Adobe Stock": {
      "min_resolution": 4000000,
      "min_dimension": 1600,
      "allowed_formats": ["jpg", "jpeg", "png", "svg", "eps", "ai", "mp4", "mov"],
      "notes": "Requires 4MP minimum, editorial content needs proper labeling"
    },
    "Freepik": {
      "min_resolution": 2000000,
      "min_dimension": 1200,
      "allowed_formats": ["jpg", "jpeg", "png", "svg", "eps", "ai", "psd"],
      "notes": "More lenient on resolution, vectors preferred"
    },
    "Shutterstock": {
      "min_resolution": 4000000,
      "min_dimension": 1500,
      "allowed_formats": ["jpg", "jpeg", "png", "eps", "ai", "mp4", "mov"],
      "notes": "Strict technical quality requirements"
    }
  }'::jsonb,
  '{"visual_quality": 25, "technical": 30, "content": 25, "commercial": 20}'::jsonb
);