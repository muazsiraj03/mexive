-- Allow users to insert their own referral code (for auto-generation)
CREATE POLICY "Users can insert own referral code" 
ON public.referral_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);