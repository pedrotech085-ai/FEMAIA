import { Lock, X } from "lucide-react";
import { PRICING_PLANS } from "@/constants/curriculum";
import { SubscriptionTier, type PricingPlanDefinition } from "@/types/academic";

export function UpgradePopup({
  message,
  onClose,
  onChoose,
}: {
  message: string;
  onClose: () => void;
  onChoose: (plan: PricingPlanDefinition) => void;
}) {
  const plans = PRICING_PLANS.filter((p) => p.tier !== SubscriptionTier.FREE);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 space-y-4 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Quota mensuel atteint
            </h2>
            <p className="text-sm text-muted-foreground">
              {message} Effectuez un abonnement supérieur pour continuer.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {plans.map((p) => (
            <button
              key={p.tier}
              type="button"
              onClick={() => onChoose(p)}
              className="rounded-xl border border-border bg-background p-3 text-left hover:border-primary"
            >
              <p className="text-sm font-semibold text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {p.priceXof.toLocaleString("fr-FR")} XOF / mois
              </p>
              <p className="mt-1 text-xs text-primary">{p.quotaLabel}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
