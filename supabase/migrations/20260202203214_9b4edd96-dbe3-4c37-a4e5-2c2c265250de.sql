-- Allow user_id to be NULL for global notifications
ALTER TABLE public.notifications 
ALTER COLUMN user_id DROP NOT NULL;

-- Add comment to clarify the behavior
COMMENT ON COLUMN public.notifications.user_id IS 'Target user ID. NULL for global notifications (is_global=true).';

-- Update RLS policies to handle global notifications
-- First, drop and recreate the select policy to include global notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own or global notifications" 
ON public.notifications 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR is_global = true
);