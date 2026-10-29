import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { QUOTA_KIND_BY_PATH } from "@/lib/quota";

function userClient(token: string) {
  const url = process.env["SUPABASE_URL"] || "https://uxyksioqgtphyhbdkoig.supabase.co";
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || "sb_publishable_X3zhMhrEAKyLJjBE5qGHdw_Ly3d1EIi";
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const path = new URL(request.url).pathname;

        // Authentification et validation de la session Supabase
        const token = request.headers
          .get("authorization")
          ?.replace(/^Bearer\s+/i, "")
          .trim();
        if (!token) return Response.json({ error: "Veuillez vous connecter." }, { status: 401 });

        const sb = userClient(token);
        const { data: userData, error: userErr } = await sb.auth.getUser(token);
        if (userErr || !userData?.user) {
          return Response.json(
            { error: "Session expirée ou invalide, reconnectez-vous." },
            { status: 401 },
          );
        }
        const userId = userData.user.id;

        if (path === "/api/quota") {
          try {
            const { data, error } = await sb.rpc("get_my_quota");
            if (!error && data) return Response.json(data);
          } catch {
            /* ignore fallback if rpc not yet created */
          }
          return Response.json({ allowed: true, tier: "FREE", used: 0, limit: 10 });
        }

        // Synchronisation de l'abonnement payant : enregistré côté serveur (30 jours).
        if (path === "/api/subscription/activate") {
          let b: { tier?: string; txRef?: string };
          try {
            b = (await request.json()) as typeof b;
          } catch {
            b = {};
          }
          const allowed = ["FREE", "BASIC", "PRO", "MASTER"];
          if (!b.tier || !allowed.includes(b.tier))
            return Response.json({ error: "Abonnement invalide." }, { status: 400 });
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const expires =
              b.tier === "FREE" ? null : new Date(Date.now() + 30 * 86400000).toISOString();
            await supabaseAdmin.from("subscriptions").upsert(
              {
                user_id: userId,
                tier: b.tier as never,
                expires_at: expires,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
            const { data } = await sb.rpc("get_my_quota");
            if (data) return Response.json(data);
          } catch {
            /* ignore fallback */
          }
          return Response.json({ allowed: true, tier: b.tier, used: 0, limit: 100 });
        }

        const { handlers } = await import("@/server/fema-ai.server");
        const handler = handlers[path];
        if (!handler) return Response.json({ error: "Route inconnue." }, { status: 404 });
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json(
            { error: "Requête JSON invalide reçue par le serveur." },
            { status: 400 },
          );
        }

        const kind = QUOTA_KIND_BY_PATH[path];
        if (kind) {
          try {
            const { data: q, error: qErr } = await sb.rpc("consume_quota", { _kind: kind });
            if (!qErr && q) {
              const quota = q as { allowed: boolean; tier: string; used: number; limit: number };
              if (!quota.allowed) {
                return Response.json(
                  {
                    error: `Quota mensuel atteint (${quota.used}/${quota.limit}).`,
                    quotaExceeded: true,
                    kind,
                    ...quota,
                  },
                  { status: 403 },
                );
              }
              body.tier = quota.tier === "PREMIUM" ? "PRO" : quota.tier;
            }
          } catch {
            /* allow through if quota rpc fails */
          }
        }

        let status = 200;
        let payload: unknown = null;
        const res = {
          status(code: number) {
            status = code;
            return res;
          },
          json(data: unknown) {
            payload = data;
          },
        };
        await handler({ body }, res);

        if (kind && status >= 400) {
          // Échec IA : on rend l'unité consommée.
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.rpc("refund_quota_for", { _uid: userId, _kind: kind });
        }
        return Response.json(payload, { status });
      },
    },
  },
});
