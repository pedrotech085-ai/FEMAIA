import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  FREE_MONTHLY_LIMIT,
  PRICING_PLANS,
  formatProfileSummary,
  getExtensiblePresetsForProfile,
} from "../constants/curriculum";
import {
  AcademicStatus,
  BillingState,
  SubjectSpace,
  SubscriptionTier,
  UserProfile,
} from "../types/academic";

interface SubjectBarProps {
  subjects: SubjectSpace[];
  activeSubjectId: string;
  onSelectSubject: (id: string) => void;
  onAddSubject: (subject: SubjectSpace) => void;
  onRemoveCustomSubject: (id: string) => void;
  profile: UserProfile;
  billing: BillingState;
  onOpenProfile: () => void;
  onOpenPricing: () => void;
}

export function SubjectBar({
  subjects,
  activeSubjectId,
  onSelectSubject,
  onAddSubject,
  onRemoveCustomSubject,
  profile,
  billing,
  onOpenProfile,
  onOpenPricing,
}: SubjectBarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customSubtitle, setCustomSubtitle] = useState("");

  const currentPlan = PRICING_PLANS.find((p) => p.tier === billing.tier) || PRICING_PLANS[0];
  const remainingFree = Math.max(0, FREE_MONTHLY_LIMIT - billing.monthlyExamsUsed);

  const isUniversity = profile.status === AcademicStatus.UNIVERSITY;
  const domainPresets = getExtensiblePresetsForProfile(profile);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed) return;
    const slug =
      trimmed
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now().toString().slice(-4);

    onAddSubject({
      id: slug,
      name: trimmed,
      shortCode: trimmed.slice(0, 5).toUpperCase(),
      domainSubtitle:
        customSubtitle.trim() ||
        (isUniversity ? "Unité d'Enseignement spécialisée" : "Session disciplinaire personnalisée"),
      domainPole: profile.domainPole,
      isCustom: true,
    });
    setCustomName("");
    setCustomSubtitle("");
    setIsAdding(false);
  };

  const handleQuickPreset = (preset: {
    name: string;
    shortCode: string;
    domainSubtitle: string;
  }) => {
    const existing = subjects.find((s) => s.name.toLowerCase() === preset.name.toLowerCase());
    if (existing) {
      onSelectSubject(existing.id);
      setIsAdding(false);
      return;
    }
    const id = preset.shortCode.toLowerCase() + "-" + Date.now().toString().slice(-4);
    onAddSubject({
      id,
      name: preset.name,
      shortCode: preset.shortCode,
      domainSubtitle: preset.domainSubtitle,
      domainPole: profile.domainPole,
      isCustom: true,
    });
    setIsAdding(false);
  };

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 space-y-3">
        {/* Bandeau minimaliste Compte / Profil & Quotas */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <span className="font-semibold text-slate-950">{profile.firstName}</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="truncate">{formatProfileSummary(profile)}</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <button
              type="button"
              onClick={onOpenProfile}
              className="text-blue-700 hover:underline font-medium whitespace-nowrap shrink-0"
            >
              Changer de filière / profil
            </button>
          </div>

          <div className="flex items-center gap-x-2.5 text-xs font-mono tabular-nums shrink-0">
            <span className="text-slate-700 font-medium">{currentPlan.name}</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            {billing.tier === SubscriptionTier.FREE && (
              <span
                className={remainingFree === 0 ? "text-red-700 font-semibold" : "text-slate-600"}
              >
                Quota : {remainingFree} / {FREE_MONTHLY_LIMIT} restant{remainingFree > 1 ? "s" : ""}
              </span>
            )}
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <button
              type="button"
              onClick={onOpenPricing}
              className="font-sans font-semibold text-slate-900 hover:text-blue-700 underline underline-offset-2 whitespace-nowrap shrink-0"
            >
              {billing.tier === SubscriptionTier.MASTER ? "Gérer l'offre" : "Passer au supérieur"}
            </button>
          </div>
        </div>

        {/* Sélecteur horizontal des UE / matières du domaine + Espace extensible */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0">
            {subjects.map((subj) => {
              const isActive = subj.id === activeSubjectId;
              return (
                <div key={subj.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onSelectSubject(subj.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-slate-950 text-white shadow-xs"
                        : "text-slate-700 hover:text-slate-950 hover:bg-white/60"
                    }`}
                  >
                    {subj.name}
                  </button>
                  {subj.isCustom && isActive && (
                    <button
                      type="button"
                      onClick={() => onRemoveCustomSubject(subj.id)}
                      title={`Retirer ${subj.name}`}
                      aria-label={`Retirer ${subj.name}`}
                      className="ml-0.5 p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsAdding((prev) => !prev)}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-700 text-xs sm:text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isUniversity ? "Autre UE du domaine" : "Autre matière"}</span>
          </button>
        </div>

        {/* Tiroir extensible proposant uniquement des UE cohérentes avec la filière */}
        {isAdding && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-950">
                  {isUniversity
                    ? "Ajouter une Unité d'Enseignement (UE) de votre filière"
                    : "Ajouter une matière complémentaire"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isUniversity
                    ? "Suggestions strictement issues de votre domaine universitaire ou saisie d'une UE spécifique de votre maquette."
                    : "Sélectionnez une discipline suggérée ou créez un espace personnalisé."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900"
                aria-label="Fermer l'ajout de matière"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {domainPresets.map((preset) => (
                <button
                  key={preset.shortCode + preset.name}
                  type="button"
                  onClick={() => handleQuickPreset(preset)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-blue-700 text-xs font-medium text-slate-800 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0"
                >
                  + {preset.name}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleCreateCustom}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1"
            >
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={
                  isUniversity
                    ? "Intitulé exact de l'UE (ex. Topologie Générale, Fiscalité Béninoise, Béton Précontraint...)"
                    : "Nom de la matière (ex. Espagnol, Allemand, Économie Familiale...)"
                }
                className="sm:col-span-5 min-h-[42px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-950 focus:border-blue-700 focus:outline-none"
              />
              <input
                type="text"
                value={customSubtitle}
                onChange={(e) => setCustomSubtitle(e.target.value)}
                placeholder="Précision du programme (optionnel)"
                className="sm:col-span-5 min-h-[42px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-950 focus:border-blue-700 focus:outline-none"
              />
              <button
                type="submit"
                className="sm:col-span-2 min-h-[42px] px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Ajouter
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
