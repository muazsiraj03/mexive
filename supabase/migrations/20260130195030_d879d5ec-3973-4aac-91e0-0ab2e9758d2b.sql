-- Add admin role to user Muaz
INSERT INTO public.user_roles (user_id, role)
VALUES ('e62b7735-cdba-4ebe-a702-226ef8633e09', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;