import React, { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { PRICING_PLANS } from "../constants/curriculum";
import { BillingState, PricingPlanDefinition, SubscriptionTier } from "../types/academic";

interface PricingSectionProps {
  billing: BillingState;
  onSelectTierForCheckout: (plan: PricingPlanDefinition) => void;
}

export function PricingSection({ billing, onSelectTierForCheckout }: PricingSectionProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-xs text-slate-500">
            Modèle économique accessible · Tarification mensuelle transparente
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-950 tracking-tight">
            Paliers tarifaires &amp; Puissance de correction
          </h1>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-600">
          Devise : Franc CFA (XOF) · Sans engagement
        </div>
      </div>

      {/* Grille des 4 paliers (Gratuit, Basique 500 XOF, Pro 800 XOF, Master 1000 XOF) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {PRICING_PLANS.map((plan) => {
          const isCurrent = billing.tier === plan.tier;
          const isHighlighted = Boolean(plan.highlighted);

          return (
            <div
              key={plan.tier}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-colors ${
                isHighlighted ? "border-blue-700 bg-white" : "border-slate-200 bg-white"
              }`}
            >
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">{plan.audienceLabel}</span>
                    {isHighlighted && (
                      <span className="text-xs font-semibold text-blue-700">Recommandé</span>
                    )}
                  </div>
                  <h2 className="font-display text-xl font-semibold text-slate-950">{plan.name}</h2>
                </div>

                <div className="pb-4 border-b border-slate-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-bold tabular-nums text-slate-950">
                      {plan.priceXof.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-sm font-mono font-semibold text-slate-700">XOF</span>
                    <span className="text-xs text-slate-500">/ mois</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-600 mt-1.5">
                    {plan.quotaLabel}
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => onSelectTierForCheckout(plan)}
                  className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    isCurrent
                      ? "bg-slate-100 text-slate-500 cursor-default"
                      : isHighlighted
                        ? "bg-blue-700 hover:bg-blue-800 text-white"
                        : "bg-slate-950 hover:bg-slate-800 text-white"
                  }`}
                >
                  {isCurrent
                    ? "Forfait actuellement actif"
                    : plan.priceXof === 0
                      ? "Revenir au mode Gratuit"
                      : `Choisir ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrice comparative synthétique en chiffres tabulaires */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-display text-base font-semibold text-slate-950">
            Comparatif technique des moteurs pédagogiques par palier
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm tabular-nums">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-6 font-semibold">Capacité</th>
                <th className="py-3 px-4 font-semibold">Gratuit (0 XOF)</th>
                <th className="py-3 px-4 font-semibold">Basique (500 XOF)</th>
                <th className="py-3 px-4 font-semibold">Pro (800 XOF)</th>
                <th className="py-3 px-4 font-semibold">Master (1 000 XOF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              <tr>
                <td className="py-3 px-6 font-medium">Quota d&apos;épreuves</td>
                <td className="py-3 px-4 font-mono">2 / mois</td>
                <td className="py-3 px-4 font-mono">Illimité</td>
                <td className="py-3 px-4 font-mono">Illimité</td>
                <td className="py-3 px-4 font-mono">Illimité</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-medium">Qualité d&apos;analyse</td>
                <td className="py-3 px-4">Moyennement performante</td>
                <td className="py-3 px-4">Bonne</td>
                <td className="py-3 px-4">Bonne</td>
                <td className="py-3 px-4">Bonne</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-medium">Logique renforcée &amp; barème détaillé</td>
                <td className="py-3 px-4 text-slate-400">—</td>
                <td className="py-3 px-4 text-slate-400">—</td>
                <td className="py-3 px-4 font-semibold text-blue-700">Activé</td>
                <td className="py-3 px-4 font-semibold text-blue-700">Activé + Jury</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-medium">
                  Exercices d&apos;entraînement générés sur mesure
                </td>
                <td className="py-3 px-4 text-slate-400">—</td>
                <td className="py-3 px-4 text-slate-400">—</td>
                <td className="py-3 px-4 text-slate-400">—</td>
                <td className="py-3 px-4 font-semibold text-emerald-700">3 exercices / épreuve</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface CheckoutModalProps {
  targetPlan: PricingPlanDefinition | null;
  onClose: () => void;
  onConfirmUpgrade: (tier: SubscriptionTier, methodLabel: string, txRef: string) => void;
}

type PaymentChannel = "MOBILE_MONEY" | "CARD";

const MOBILE_OPERATORS = ["Wave Mobile Money", "Orange Money", "MTN MoMo", "Moov Money"];

/**
 * Tunnel de souscription web simulé (Mobile Money XOF & Carte Bancaire)
 * permettant de tester intégralement les changements de paliers dans l'application.
 */
export function CheckoutModal({ targetPlan, onClose, onConfirmUpgrade }: CheckoutModalProps) {
  const [channel, setChannel] = useState<PaymentChannel>("MOBILE_MONEY");
  const [operator, setOperator] = useState<string>(MOBILE_OPERATORS[0]);
  const [phoneInput, setPhoneInput] = useState<string>("+225 07 48 12 90");
  const [cardHolder, setCardHolder] = useState<string>("ETUDIANT Fema");
  const [cardNumber, setCardNumber] = useState<string>("4532 •••• •••• 8841");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  useEffect(() => {
    setConfirmedRef(null);
    setIsProcessing(false);
  }, [targetPlan]);

  if (!targetPlan) return null;

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const txRef = "KRN-" + Math.floor(100000 + Math.random() * 900000).toString();
      const methodLabel =
        targetPlan.priceXof === 0
          ? "Changement sans frais"
          : channel === "MOBILE_MONEY"
            ? operator
            : "Carte Bancaire";

      setIsProcessing(false);
      setConfirmedRef(txRef);
      onConfirmUpgrade(targetPlan.tier, methodLabel, txRef);
    }, 650);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">Simulation de tunnel de paiement Web</p>
            <h2
              id="checkout-modal-title"
              className="font-display text-lg font-semibold text-slate-950"
            >
              Activation — {targetPlan.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre de souscription"
            className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-950"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedRef ? (
          <div className="p-6 sm:p-8 space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl font-semibold text-slate-950">
                {targetPlan.name} activé immédiatement
              </h3>
              <p className="text-sm text-slate-600">
                Vos nouveaux paramètres pédagogiques et quotas sont opérationnels sur toutes vos
                matières.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono tabular-nums text-slate-700 flex items-center justify-between">
              <span>Référence transaction : {confirmedRef}</span>
              <span>{targetPlan.priceXof.toLocaleString("fr-FR")} XOF</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold"
            >
              Retourner à mon atelier d&apos;étude
            </button>
          </div>
        ) : (
          <form onSubmit={handleSimulatePayment} className="p-6 space-y-5">
            {/* Récapitulatif tarifaire */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-950">{targetPlan.name}</div>
                <div className="text-xs text-slate-600">{targetPlan.pedagogicalEngineLabel}</div>
              </div>
              <div className="text-right font-mono tabular-nums shrink-0">
                <div className="text-lg font-bold text-slate-950">
                  {targetPlan.priceXof.toLocaleString("fr-FR")} XOF
                </div>
                <div className="text-[11px] text-slate-500">Mensuel</div>
              </div>
            </div>

            {targetPlan.priceXof > 0 && (
              <>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => setChannel("MOBILE_MONEY")}
                    className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap ${
                      channel === "MOBILE_MONEY"
                        ? "bg-white text-slate-950 shadow-xs"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile Money (XOF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("CARD")}
                    className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap ${
                      channel === "CARD"
                        ? "bg-white text-slate-950 shadow-xs"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Carte Bancaire</span>
                  </button>
                </div>

                {channel === "MOBILE_MONEY" ? (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2">
                      {MOBILE_OPERATORS.map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setOperator(op)}
                          className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-medium text-left transition-colors truncate ${
                            operator === op
                              ? "border-blue-700 bg-blue-50/60 text-slate-950 font-semibold"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="momo-phone"
                        className="block text-xs font-medium text-slate-700"
                      >
                        Numéro Mobile Money (simulation web)
                      </label>
                      <input
                        id="momo-phone"
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 font-mono text-sm tabular-nums text-slate-950 focus:border-blue-700 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="card-holder"
                        className="block text-xs font-medium text-slate-700"
                      >
                        Titulaire de la carte
                      </label>
                      <input
                        id="card-holder"
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-950 focus:border-blue-700 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="card-num"
                        className="block text-xs font-medium text-slate-700"
                      >
                        Numéro de carte (mode démonstration)
                      </label>
                      <input
                        id="card-num"
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 font-mono text-sm tabular-nums text-slate-950 focus:border-blue-700 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Simulation de paiement instantanée : aucun débit réel effectué.</span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validation de la transaction...</span>
                </>
              ) : (
                <span>
                  {targetPlan.priceXof === 0
                    ? "Confirmer le passage au Mode Gratuit"
                    : `Simuler le règlement de ${targetPlan.priceXof.toLocaleString("fr-FR")} XOF`}
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
