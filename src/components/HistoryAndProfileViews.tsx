import React, { useState } from "react";
import { ArrowUpRight, FileText, RotateCcw, Search, Sliders, User, X } from "lucide-react";
import { FREE_MONTHLY_LIMIT, PRICING_PLANS, formatProfileSummary } from "../constants/curriculum";
import {
  BillingState,
  ExamCorrectionRecord,
  SubjectSpace,
  SubscriptionTier,
  UserProfile,
} from "../types/academic";
import { canDownloadPdf, downloadCorrectionPdf } from "../services/pdfExport";

interface HistoryViewProps {
  records: ExamCorrectionRecord[];
  subjects: SubjectSpace[];
  activeSubjectId: string;
  tier: SubscriptionTier;
  onOpenCorrection: (record: ExamCorrectionRecord) => void;
}

export function HistoryView({
  records,
  subjects,
  activeSubjectId,
  tier,
  onOpenCorrection,
}: HistoryViewProps) {
  const [filterMode, setFilterMode] = useState<"ACTIVE" | "ALL">("ACTIVE");
  const [query, setQuery] = useState("");

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);

  const visibleRecords = records.filter((rec) => {
    const matchesSubject = filterMode === "ALL" || rec.subjectId === activeSubjectId;
    const matchesQuery =
      !query.trim() ||
      rec.title.toLowerCase().includes(query.toLowerCase()) ||
      rec.subjectName.toLowerCase().includes(query.toLowerCase());
    return matchesSubject && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-xs text-slate-500">Archives locales des épreuves traitées</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-950 tracking-tight">
            Historique des corrections ({visibleRecords.length})
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/70">
            <button
              type="button"
              onClick={() => setFilterMode("ACTIVE")}
              className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filterMode === "ACTIVE"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              {activeSubject?.name || "Matière active"}
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("ALL")}
              className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filterMode === "ALL"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Toutes les matières
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un corrigé..."
              className="min-h-[38px] rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-1.5 text-xs sm:text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {visibleRecords.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-2.5">
          <div className="w-11 h-11 rounded-2xl border border-slate-200 bg-slate-50 mx-auto flex items-center justify-center text-slate-600">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="font-display text-lg font-semibold text-slate-950">
            Aucune épreuve archivée dans cette vue
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Chaque épreuve corrigée par photo ou saisie texte est conservée automatiquement ici pour
            vos révisions.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="divide-y divide-slate-100">
            {visibleRecords.map((rec) => (
              <div key={rec.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onOpenCorrection(rec)}
                  className="flex-1 min-w-0 min-h-[64px] px-5 sm:px-6 py-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="font-display text-sm sm:text-base font-semibold text-slate-950 truncate">
                      {rec.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span>{rec.subjectName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{rec.profileSnapshot}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {new Date(rec.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-700 shrink-0">
                    <span className="hidden sm:inline">Consulter</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => downloadCorrectionPdf(rec)}
                  disabled={!canDownloadPdf(tier)}
                  title={
                    canDownloadPdf(tier) ? "Télécharger en PDF" : "Réservé aux modes Pro et Master"
                  }
                  className="mr-4 shrink-0 min-h-[36px] px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:hover:bg-transparent flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {canDownloadPdf(tier) ? "PDF" : "PDF · Pro"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ProfileDrawerProps {
  isOpen: boolean;
  profile: UserProfile;
  billing: BillingState;
  totalSolvedCount: number;
  totalSheetsCount: number;
  onClose: () => void;
  onReconfigureProfile: () => void;
  onOpenPricing: () => void;
  onResetMonthlyQuotaDemo: () => void;
}

export function ProfileDrawer({
  isOpen,
  profile,
  billing,
  totalSolvedCount,
  totalSheetsCount,
  onClose,
  onReconfigureProfile,
  onOpenPricing,
  onResetMonthlyQuotaDemo,
}: ProfileDrawerProps) {
  if (!isOpen) return null;

  const plan = PRICING_PLANS.find((p) => p.tier === billing.tier) || PRICING_PLANS[0];
  const remainingFree = Math.max(0, FREE_MONTHLY_LIMIT - billing.monthlyExamsUsed);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-drawer-title"
        className="w-full max-w-md bg-white h-full border-l border-slate-200 flex flex-col justify-between overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-blue-700" />
              <h2
                id="profile-drawer-title"
                className="font-display text-lg font-semibold text-slate-950"
              >
                Compte, Profil &amp; Quotas
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le panneau de profil"
              className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-950"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Identité & Statut académique */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Profil actif</span>
              <button
                type="button"
                onClick={onReconfigureProfile}
                className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Reconfigurer</span>
              </button>
            </div>
            <div>
              <div className="font-display text-lg font-semibold text-slate-950">
                {profile.firstName}
              </div>
              <div className="text-xs sm:text-sm text-slate-700 mt-0.5">
                {formatProfileSummary(profile)}
              </div>
              {profile.academicGoal && (
                <div className="text-xs text-slate-500 mt-1.5">
                  Objectif : {profile.academicGoal}
                </div>
              )}
            </div>
          </div>

          {/* État du forfait & Quotas mensuels */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Forfait &amp; Quotas</span>
              <span className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                {plan.priceXof.toLocaleString("fr-FR")} XOF / mois
              </span>
            </div>

            <div className="font-display text-base font-semibold text-slate-950">{plan.name}</div>

            {billing.tier === SubscriptionTier.FREE ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-700">
                  <span>Épreuves utilisées ce mois</span>
                  <span>
                    {billing.monthlyExamsUsed} / {FREE_MONTHLY_LIMIT} (reste {remainingFree})
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-700 transition-transform origin-left"
                    style={{
                      transform: `scaleX(${Math.min(
                        1,
                        billing.monthlyExamsUsed / FREE_MONTHLY_LIMIT,
                      )})`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-700 font-medium">
                Accès illimité actif ({billing.monthlyExamsUsed} épreuves corrigées ce mois).
              </p>
            )}

            {billing.lastTransactionRef && (
              <div className="text-[11px] font-mono tabular-nums text-slate-500">
                Dernière réf. : {billing.lastTransactionRef} ({billing.paymentMethodLabel})
              </div>
            )}

            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPricing();
                }}
                className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap"
              >
                Changer de palier tarifaire
              </button>
              {billing.tier === SubscriptionTier.FREE && billing.monthlyExamsUsed > 0 && (
                <button
                  type="button"
                  onClick={onResetMonthlyQuotaDemo}
                  title="Réinitialiser le compteur mensuel de démonstration"
                  className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser quota</span>
                </button>
              )}
            </div>
          </div>

          {/* Bilan synthétique d'activité */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="font-display text-2xl font-bold tabular-nums text-slate-950">
                {totalSolvedCount}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Épreuves corrigées</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="font-display text-2xl font-bold tabular-nums text-slate-950">
                {totalSheetsCount}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Fiches synthétiques</div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 text-xs text-slate-500">
          Profil et sessions sauvegardés localement sur votre appareil.
        </div>
      </div>
    </div>
  );
}
