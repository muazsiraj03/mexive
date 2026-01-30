-- Add columns to store the selected credit tier on subscription requests
ALTER TABLE public.subscriptions 
ADD COLUMN requested_credits integer,
ADD COLUMN requested_price_cents integer;

-- Add comment for clarity
COMMENT ON COLUMN public.subscriptions.requested_credits IS 'The number of credits the user selected when requesting this subscription';
COMMENT ON COLUMN public.subscriptions.requested_price_cents IS 'The price in cents for the selected credit tier';