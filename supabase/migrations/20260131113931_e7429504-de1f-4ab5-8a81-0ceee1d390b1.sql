-- Create upgrade_requests table for manual payment verification
CREATE TABLE public.upgrade_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_name TEXT NOT NULL,
    requested_credits INTEGER,
    requested_price_cents INTEGER,
    transaction_id TEXT,
    payment_date DATE,
    sender_name TEXT,
    sender_account TEXT,
    payment_proof_url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own requests
CREATE POLICY "Users can create own upgrade requests"
ON public.upgrade_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own upgrade requests"
ON public.upgrade_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all requests
CREATE POLICY "Admins can manage all upgrade requests"
ON public.upgrade_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_upgrade_requests_updated_at
BEFORE UPDATE ON public.upgrade_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default bank details settings
INSERT INTO public.system_settings (key, value) VALUES 
('bank_name', 'Your Bank Name'),
('bank_account_name', 'Account Holder Name'),
('bank_account_number', '1234567890'),
('bank_branch', 'Main Branch'),
('bank_swift_code', ''),
('payment_instructions', 'Please transfer the exact amount and use your email as reference.')
ON CONFLICT (key) DO NOTHING;