import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";
import { fetchMyQuota } from "../services/api";
import { QUOTA_LABELS, remaining, type QuotaKind, type QuotaSnapshot } from "@/lib/quota";

const TIER_NAMES: Record<string, string> = {
  FREE: "Mode Gratuit",
  BASIC: "Mode Basique",
  PRO: "Mode Pro",
  PREMIUM: "Mode Pro",
  MASTER: "Mode Master",
};
const KINDS: QuotaKind[] = ["exam", "sheet", "quiz", "pdf_question"];

/** Quota restant du mois, lu depuis le serveur (impossible à réinitialiser côté navigateur). */
export function QuotaPanel({ onUpgrade }: { onUpgrade: () => void }) {
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchMyQuota()
        .then((q) => alive && setQuota(q))
        .catch(() => undefined);
    load();
    window.addEventListener("fema:quota-changed", load);
    return () => {
      alive = false;
      window.removeEventListener("fema:quota-changed", load);
    };
  }, []);

  if (!quota) return null;

  return (
    <div className="mb-5 rounded-xl border border-border bg-card px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Gauge className="w-4 h-4 text-primary" />
        {TIER_NAMES[quota.tier] ?? quota.tier} — restant ce mois
      </div>
      {KINDS.map((k) => {
        const left = remaining(quota, k);
        return (
          <span
            key={k}
            className={`text-xs ${left === 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}
          >
            {QUOTA_LABELS[k]} : <strong>{left}</strong> / {quota.limit}
          </span>
        );
      })}
      {quota.tier !== "MASTER" && (
        <button
          type="button"
          onClick={onUpgrade}
          className="ml-auto text-xs font-semibold text-primary hover:underline"
        >
          Augmenter mes quotas
        </button>
      )}
    </div>
  );
}
