DROP FUNCTION IF EXISTS public.refund_quota(text);
CREATE OR REPLACE FUNCTION public.refund_quota_for(_uid uuid, _kind text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.usage_counters SET used = GREATEST(used - 1, 0), updated_at = now()
  WHERE user_id = _uid AND usage_month = to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM') AND kind = _kind;
$$;
REVOKE ALL ON FUNCTION public.refund_quota_for(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_quota_for(uuid, text) TO service_role;