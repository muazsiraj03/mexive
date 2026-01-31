-- Create function to increment bonus credits for a user
CREATE OR REPLACE FUNCTION public.increment_bonus_credits(p_user_id UUID, p_credits INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.subscriptions
    SET 
        bonus_credits = bonus_credits + p_credits,
        credits_remaining = credits_remaining + p_credits
    WHERE user_id = p_user_id;
END;
$$;