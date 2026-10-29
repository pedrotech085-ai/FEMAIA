-- ==============================================================================
-- FEMA IA — SCRIPT D'INITIALISATION COMPLET DE LA BASE DE DONNÉES SUPABASE
-- Copiez et collez l'intégralité de ce script dans :
-- Dashboard Supabase > SQL Editor > New query > Run
-- ==============================================================================

-- 1. Types énumérés
DO $t$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $t$;
DO $t$ BEGIN CREATE TYPE public.subscription_tier AS ENUM ('FREE', 'BASIC', 'PRO', 'PREMIUM', 'MASTER'); EXCEPTION WHEN duplicate_object THEN NULL; END $t$;

-- 2. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  first_name text,
  academic_status text,
  grade_level text,
  secondary_track text,
  university_id text,
  university_name text,
  program_id text,
  faculty_code text,
  domain_pole text,
  university_level text,
  specialty text,
  academic_goal text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Rôles utilisateurs
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.role() <> 'service_role' THEN
    NEW.is_blocked := OLD.is_blocked;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS profiles_protect ON public.profiles;
CREATE TRIGGER profiles_protect BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_fields();

-- 4. Abonnements
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.subscription_tier NOT NULL DEFAULT 'FREE',
  monthly_exams_used integer NOT NULL DEFAULT 0,
  usage_month text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own subscription" ON public.subscriptions;
CREATE POLICY "Users read own subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Historique des corrections d'épreuves
CREATE TABLE IF NOT EXISTS public.exam_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id text,
  subject_name text NOT NULL,
  source_mode text NOT NULL,
  tier_at_creation text,
  optical_score numeric,
  title text,
  correction jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exam_corrections_user_idx ON public.exam_corrections (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.exam_corrections TO authenticated;
GRANT ALL ON public.exam_corrections TO service_role;
ALTER TABLE public.exam_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own corrections" ON public.exam_corrections;
CREATE POLICY "Users read own corrections" ON public.exam_corrections FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own corrections" ON public.exam_corrections;
CREATE POLICY "Users insert own corrections" ON public.exam_corrections FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own corrections" ON public.exam_corrections;
CREATE POLICY "Users delete own corrections" ON public.exam_corrections FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 6. Trigger automatique à la création de compte Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  INSERT INTO public.subscriptions (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Table des consentements (Conditions d'utilisation)
CREATE TABLE IF NOT EXISTS public.consents (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own consent" ON public.consents;
CREATE POLICY "Users read own consent" ON public.consents FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own consent" ON public.consents;
CREATE POLICY "Users insert own consent" ON public.consents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own consent" ON public.consents;
CREATE POLICY "Users update own consent" ON public.consents FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 8. Table des compteurs de quotas mensuels
CREATE TABLE IF NOT EXISTS public.usage_counters (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_month text NOT NULL,
  kind text NOT NULL,
  used integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, usage_month, kind)
);
GRANT SELECT ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own usage" ON public.usage_counters;
CREATE POLICY "Users read own usage" ON public.usage_counters FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 9. Fonctions de calcul des quotas et de gestion
CREATE OR REPLACE FUNCTION public.plan_limit(_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _tier
    WHEN 'BASIC' THEN 30
    WHEN 'PRO' THEN 100
    WHEN 'PREMIUM' THEN 100
    WHEN 'MASTER' THEN 300
    ELSE 2 END
$$;

CREATE OR REPLACE FUNCTION public.current_tier(_uid uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT CASE WHEN expires_at IS NOT NULL AND expires_at < now() THEN 'FREE' ELSE tier::text END
     FROM public.subscriptions WHERE user_id = _uid),
    'FREE'
  )
$$;

CREATE OR REPLACE FUNCTION public.consume_quota(_kind text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _month text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  _tier text;
  _limit integer;
  _used integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _kind NOT IN ('exam','sheet','quiz','pdf_question') THEN RAISE EXCEPTION 'invalid kind'; END IF;
  _tier := public.current_tier(_uid);
  _limit := public.plan_limit(_tier);
  INSERT INTO public.usage_counters (user_id, usage_month, kind, used)
    VALUES (_uid, _month, _kind, 0) ON CONFLICT DO NOTHING;
  SELECT used INTO _used FROM public.usage_counters
    WHERE user_id = _uid AND usage_month = _month AND kind = _kind FOR UPDATE;
  IF _used >= _limit THEN
    RETURN jsonb_build_object('allowed', false, 'tier', _tier, 'used', _used, 'limit', _limit);
  END IF;
  UPDATE public.usage_counters SET used = used + 1, updated_at = now()
    WHERE user_id = _uid AND usage_month = _month AND kind = _kind;
  RETURN jsonb_build_object('allowed', true, 'tier', _tier, 'used', _used + 1, 'limit', _limit);
END $$;

CREATE OR REPLACE FUNCTION public.get_my_quota()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'tier', public.current_tier(auth.uid()),
    'limit', public.plan_limit(public.current_tier(auth.uid())),
    'month', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM'),
    'used', COALESCE((SELECT jsonb_object_agg(kind, used) FROM public.usage_counters
                      WHERE user_id = auth.uid() AND usage_month = to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM')), '{}'::jsonb))
$$;

CREATE OR REPLACE FUNCTION public.refund_quota_for(_uid uuid, _kind text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.usage_counters SET used = GREATEST(used - 1, 0), updated_at = now()
  WHERE user_id = _uid AND usage_month = to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM') AND kind = _kind;
$$;

REVOKE ALL ON FUNCTION public.consume_quota(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_quota() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refund_quota_for(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_quota(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_quota() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_quota_for(uuid, text) TO service_role;
