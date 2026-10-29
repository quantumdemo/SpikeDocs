-- Supabase Database Migration Script for SpikeDocs
-- Includes Profiles, Subscriptions, Daily Usage Tracking, Audit Logging & Admin Allowlist

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro_monthly', 'pro_yearly');

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Admin Allowlist Table (Only allow specific co-founder / admin emails)
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  email TEXT PRIMARY KEY,
  added_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_pro BOOLEAN DEFAULT FALSE NOT NULL,
  tier subscription_tier DEFAULT 'free'::subscription_tier NOT NULL,
  gateway TEXT CHECK (gateway IN ('stripe', 'paystack', 'manual')),
  subscription_id TEXT,
  customer_id TEXT,
  current_period_end TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Daily Usage Counter (Enforces 5 uploads/day for Free users)
CREATE TABLE IF NOT EXISTS public.daily_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  usage_date DATE DEFAULT CURRENT_DATE NOT NULL,
  upload_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, usage_date)
);

-- 5. Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

-- DB Check Constraint: Only emails in admin_allowlist can ever have is_admin = true
CREATE OR REPLACE FUNCTION check_admin_allowlist()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin = TRUE THEN
    IF NOT EXISTS (SELECT 1 FROM public.admin_allowlist WHERE email = NEW.email) THEN
      RAISE EXCEPTION 'Security Policy Error: Email % is not on the admin allowlist.', NEW.email;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER enforce_admin_allowlist_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION check_admin_allowlist();

-- Seed initial admin allowlist entries
INSERT INTO public.admin_allowlist (email, added_by)
VALUES
  ('admin@spikedocs.com', 'system_init'),
  ('cofounder@spikedocs.com', 'system_init')
ON CONFLICT (email) DO NOTHING;
