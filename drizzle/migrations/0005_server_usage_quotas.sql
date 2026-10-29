ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'BASIC';
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'PRO';

CREATE TABLE IF NOT EXISTS public.usage_counters (
  user_id uuid NOT NULL,
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

-- Limites mensuelles par abonnement (identiques pour chaque type d'usage)
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
  SELECT COALESCE((SELECT CASE WHEN expires_at IS NOT NULL AND expires_at < now() THEN 'FREE' ELSE tier::text END
                   FROM public.subscriptions WHERE user_id = _uid), 'FREE')
$$;

CREATE OR REPLACE FUNCTION public.consume_quota(_kind text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _month text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  _tier text; _limit integer; _used integer;
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

CREATE OR REPLACE FUNCTION public.refund_quota(_kind text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.usage_counters SET used = GREATEST(used - 1, 0), updated_at = now()
  WHERE user_id = auth.uid() AND usage_month = to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM') AND kind = _kind;
$$;

CREATE OR REPLACE FUNCTION public.get_my_quota()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'tier', public.current_tier(auth.uid()),
    'limit', public.plan_limit(public.current_tier(auth.uid())),
    'month', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM'),
    'used', COALESCE((SELECT jsonb_object_agg(kind, used) FROM public.usage_counters
                      WHERE user_id = auth.uid() AND usage_month = to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM')), '{}'::jsonb))
$$;

REVOKE ALL ON FUNCTION public.consume_quota(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refund_quota(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_quota() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_quota(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_quota(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_quota() TO authenticated;