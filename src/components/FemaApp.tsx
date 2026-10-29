import femaLogo from "@/assets/fema-ia-logo.png.asset.json";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  BookOpen,
  MessageSquareText,
  CreditCard,
  FileCheck2,
  HelpCircle,
  Target,
} from "lucide-react";
import { SECONDARY_DEFAULT_SUBJECTS, getDefaultSubjectsForProfile } from "../constants/curriculum";
import { ExamWorkspace } from "./ExamWorkspace";
import { HistoryView, ProfileDrawer } from "./HistoryAndProfileViews";
import { InteractiveQuizView } from "./InteractiveQuizView";
import { OnboardingGate } from "./OnboardingGate";
import { CheckoutModal, PricingSection } from "./PricingSectionAndModal";
import { UpgradePopup } from "./UpgradePopup";
import { QUOTA_LABELS, type QuotaKind } from "@/lib/quota";
import { QuotaPanel } from "./QuotaPanel";
import { CoursePdfView } from "./CoursePdfView";
import { ErrorAnalysisView } from "./ErrorAnalysisView";
import { RevisionSheetsView } from "./RevisionSheetsView";
import { SubjectBar } from "./SubjectBar";
import { SignOutButton } from "./AuthGate";
import {
  loadProfileFromCloud,
  saveCorrectionToCloud,
  saveProfileToCloud,
} from "../services/cloudSync";
import {
  AcademicStatus,
  BillingState,
  ExamCorrectionRecord,
  PricingPlanDefinition,
  QuizRecord,
  RevisionSheetRecord,
  SubjectSpace,
  SubscriptionTier,
  UserProfile,
  WorkspaceTab,
} from "../types/academic";

const STORAGE_KEYS = {
  PROFILE: "fema_educ_profile_v2",
  SUBJECTS: "fema_educ_subjects_v2",
  BILLING: "fema_educ_billing_v1",
  EXAMS: "fema_educ_exams_v1",
  SHEETS: "fema_educ_sheets_v1",
  QUIZZES: "fema_educ_quizzes_v1",
};

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Assure que si un étudiant universitaire est déjà connecté, ses matières correspondent
 * strictement aux Unités d'Enseignement de sa filière (sans Histoire-Géographie hors domaine).
 */
function initializeSubjectsForProfile(savedProfile: UserProfile | null): SubjectSpace[] {
  const defaultForProfile = getDefaultSubjectsForProfile(savedProfile);
  const stored = readStorage<SubjectSpace[] | null>(STORAGE_KEYS.SUBJECTS, null);

  if (!stored || stored.length === 0) {
    return defaultForProfile;
  }

  if (
    savedProfile?.status === AcademicStatus.UNIVERSITY &&
    savedProfile.domainPole !== "LETTRES_HUMAINES"
  ) {
    const hasOutOfDomainSecondary = stored.some(
      (s) =>
        !s.isCustom &&
        (s.id === "histoire-geographie" || s.id === "sec-hist-geo" || s.domainPole === "SECONDARY"),
    );
    if (hasOutOfDomainSecondary) {
      const customKept = stored.filter((s) => s.isCustom);
      return [...defaultForProfile, ...customKept];
    }
  }

  return stored;
}

export default function App() {
  // 1. Profil utilisateur (obligatoire avant l'accès complet)
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const v2 = readStorage<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
    if (v2) return v2;
    return readStorage<UserProfile | null>("fema_educ_profile_v1", null);
  });
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [cloudChecked, setCloudChecked] = useState<boolean>(!!profile);

  // Nouvel appareil : récupérer le profil enregistré dans la base
  useEffect(() => {
    if (profile) return;
    loadProfileFromCloud()
      .then((p) => {
        if (p) {
          setProfile(p);
          const domainSubjects = getDefaultSubjectsForProfile(p);
          setSubjects(domainSubjects);
          if (domainSubjects[0]) setActiveSubjectId(domainSubjects[0].id);
        }
      })
      .finally(() => setCloudChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Matières / UE strictement alignées sur le profil et la filière
  const [subjects, setSubjects] = useState<SubjectSpace[]>(() =>
    initializeSubjectsForProfile(profile),
  );
  const [activeSubjectId, setActiveSubjectId] = useState<string>(
    () => initializeSubjectsForProfile(profile)[0]?.id || SECONDARY_DEFAULT_SUBJECTS[0].id,
  );

  // 3. Modèle économique & quotas mensuels
  const [billing, setBilling] = useState<BillingState>(() => {
    const currentMonth = getCurrentYearMonth();
    const saved = readStorage<BillingState>(STORAGE_KEYS.BILLING, {
      tier: SubscriptionTier.FREE,
      monthlyExamsUsed: 0,
      billingCycleMonth: currentMonth,
    });
    if (saved.billingCycleMonth !== currentMonth) {
      return {
        ...saved,
        monthlyExamsUsed: 0,
        billingCycleMonth: currentMonth,
      };
    }
    return saved;
  });

  // 4. Données pédagogiques persistantes par matière / UE
  const [examRecords, setExamRecords] = useState<ExamCorrectionRecord[]>(() =>
    readStorage<ExamCorrectionRecord[]>(STORAGE_KEYS.EXAMS, []),
  );
  const [sheetRecords, setSheetRecords] = useState<RevisionSheetRecord[]>(() =>
    readStorage<RevisionSheetRecord[]>(STORAGE_KEYS.SHEETS, []),
  );
  const [quizRecords, setQuizRecords] = useState<QuizRecord[]>(() =>
    readStorage<QuizRecord[]>(STORAGE_KEYS.QUIZZES, []),
  );

  // 5. Navigation & Fenêtres contextuelles
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(WorkspaceTab.EXAMS);
  const [selectedExamOverride, setSelectedExamOverride] = useState<ExamCorrectionRecord | null>(
    null,
  );
  const [prefillSheetTopic, setPrefillSheetTopic] = useState<string>("");
  const [prefillQuizTopic, setPrefillQuizTopic] = useState<string>("");
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const [checkoutTargetPlan, setCheckoutTargetPlan] = useState<PricingPlanDefinition | null>(null);

  // Quotas mensuels vérifiés côté serveur : popup d'abonnement quand la limite est atteinte
  const [quotaPopup, setQuotaPopup] = useState<string | null>(null);
  useEffect(() => {
    const onExceeded = (e: Event) => {
      const d = (e as CustomEvent).detail as { kind?: QuotaKind; used?: number; limit?: number };
      const label = d.kind ? QUOTA_LABELS[d.kind].toLowerCase() : "utilisations";
      setQuotaPopup(`Vous avez utilisé vos ${d.limit ?? ""} ${label} de ce mois.`);
    };
    window.addEventListener("fema:quota-exceeded", onExceeded);
    return () => window.removeEventListener("fema:quota-exceeded", onExceeded);
  }, []);

  // Synchronisation automatique vers localStorage
  useEffect(() => {
    if (profile) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BILLING, JSON.stringify(billing));
  }, [billing]);

  // Le serveur fait foi pour l'abonnement : on aligne l'affichage local dessus.
  useEffect(() => {
    import("@/services/api").then(({ fetchMyQuota }) =>
      fetchMyQuota()
        .then((q) => {
          const t = (q as { tier?: string }).tier;
          if (t)
            setBilling((prev) =>
              prev.tier === t ? prev : { ...prev, tier: t as SubscriptionTier },
            );
        })
        .catch(() => {}),
    );
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(examRecords));
  }, [examRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHEETS, JSON.stringify(sheetRecords));
  }, [sheetRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizRecords));
  }, [quizRecords]);

  const activeSubject = useMemo(
    () =>
      subjects.find((s) => s.id === activeSubjectId) ||
      subjects[0] ||
      SECONDARY_DEFAULT_SUBJECTS[0],
    [subjects, activeSubjectId],
  );

  const latestCorrectionForSubject = useMemo(() => {
    if (selectedExamOverride && selectedExamOverride.subjectId === activeSubject.id) {
      return selectedExamOverride;
    }
    return examRecords.find((r) => r.subjectId === activeSubject.id) || null;
  }, [examRecords, activeSubject.id, selectedExamOverride]);

  const sheetsForSubject = useMemo(
    () => sheetRecords.filter((s) => s.subjectId === activeSubject.id),
    [sheetRecords, activeSubject.id],
  );

  const quizzesForSubject = useMemo(
    () => quizRecords.filter((q) => q.subjectId === activeSubject.id),
    [quizRecords, activeSubject.id],
  );

  const clearSheetPrefill = useCallback(() => setPrefillSheetTopic(""), []);
  const clearQuizPrefill = useCallback(() => setPrefillQuizTopic(""), []);

  /**
   * Lorsqu'un apprenant configure ou modifie son profil (ex. inscription en FAST MIA, FASEG, EPAC ou Lycée),
   * les onglets de matières sont automatiquement mis à jour avec les UE exactes de son domaine.
   */
  const handleSaveProfile = (saved: UserProfile) => {
    const domainSubjects = getDefaultSubjectsForProfile(saved);
    setProfile(saved);
    void saveProfileToCloud(saved);
    setSubjects(domainSubjects);
    if (domainSubjects[0]) {
      setActiveSubjectId(domainSubjects[0].id);
    }
    setSelectedExamOverride(null);
    setIsEditingProfile(false);
  };

  if (!cloudChecked) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!profile || isEditingProfile) {
    return (
      <OnboardingGate
        initialProfile={profile}
        onSaveProfile={handleSaveProfile}
        onCancelEdit={profile ? () => setIsEditingProfile(false) : undefined}
      />
    );
  }

  const handleAddSubject = (newSubj: SubjectSpace) => {
    setSubjects((prev) => [...prev, newSubj]);
    setActiveSubjectId(newSubj.id);
    setSelectedExamOverride(null);
  };

  const handleRemoveCustomSubject = (id: string) => {
    setSubjects((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (activeSubjectId === id && remaining[0]) {
        setActiveSubjectId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleExamSolved = (record: ExamCorrectionRecord) => {
    setExamRecords((prev) => [record, ...prev]);
    void saveCorrectionToCloud(record);
    setSelectedExamOverride(record);
    setBilling((prev) => ({
      ...prev,
      monthlyExamsUsed: prev.monthlyExamsUsed + 1,
    }));
  };

  const handleConfirmTierUpgrade = (
    newTier: SubscriptionTier,
    methodLabel: string,
    txRef: string,
  ) => {
    setBilling((prev) => ({
      ...prev,
      tier: newTier,
      lastTransactionRef: txRef,
      paymentMethodLabel: methodLabel,
    }));
    import("@/services/api").then(({ activateSubscription }) =>
      activateSubscription(newTier, txRef)
        .then(() => window.dispatchEvent(new CustomEvent("fema:quota-changed")))
        .catch(() => {}),
    );
  };

  const navItems: Array<{
    tab: WorkspaceTab;
    label: string;
    mobileLabel: string;
    icon: typeof FileCheck2;
  }> = [
    {
      tab: WorkspaceTab.EXAMS,
      label: "Épreuves",
      mobileLabel: "Épreuves",
      icon: FileCheck2,
    },
    {
      tab: WorkspaceTab.SHEETS,
      label: "Fiches",
      mobileLabel: "Fiches",
      icon: BookOpen,
    },
    {
      tab: WorkspaceTab.QUIZ,
      label: "Quiz",
      mobileLabel: "Quiz",
      icon: HelpCircle,
    },
    {
      tab: WorkspaceTab.COURSE,
      label: "Mes cours PDF",
      mobileLabel: "Cours",
      icon: MessageSquareText,
    },
    {
      tab: WorkspaceTab.HISTORY,
      label: "Historique",
      mobileLabel: "Archives",
      icon: Archive,
    },
    {
      tab: WorkspaceTab.ERRORS,
      label: "Mes erreurs",
      mobileLabel: "Erreurs",
      icon: Target,
    },
    {
      tab: WorkspaceTab.PRICING,
      label: "Tarifs",
      mobileLabel: "Tarifs",
      icon: CreditCard,
    },
  ];

  return (
    <div className="min-h-screen w-full max-w-full bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* TOP BAR CONTRACT : 1 ligne stricte, 3 zones séparées par gap-8 */}
      <header className="sticky top-0 z-30 h-11 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => setActiveTab(WorkspaceTab.EXAMS)}
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <img
            src={femaLogo.url}
            alt="Fema IA"
            className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg object-cover"
          />
          <span translate="no" className="notranslate">
            Fema IA
          </span>
        </button>

        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? "border-blue-700 text-slate-950 font-semibold"
                    : "border-transparent hover:text-slate-950 hover:border-slate-300"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsProfileDrawerOpen(true)}
            className="min-h-[36px] sm:min-h-[40px] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            Profil &amp; Quotas
          </button>
        </div>
      </header>

      <SubjectBar
        subjects={subjects}
        activeSubjectId={activeSubject.id}
        onSelectSubject={(id) => {
          setActiveSubjectId(id);
          setSelectedExamOverride(null);
        }}
        onAddSubject={handleAddSubject}
        onRemoveCustomSubject={handleRemoveCustomSubject}
        profile={profile}
        billing={billing}
        onOpenProfile={() => setIsProfileDrawerOpen(true)}
        onOpenPricing={() => setActiveTab(WorkspaceTab.PRICING)}
      />

      {quotaPopup && (
        <UpgradePopup
          message={quotaPopup}
          onClose={() => setQuotaPopup(null)}
          onChoose={(plan) => {
            setQuotaPopup(null);
            setCheckoutTargetPlan(plan);
            setActiveTab(WorkspaceTab.PRICING);
          }}
        />
      )}

      <main className="flex-1 max-w-7xl w-full min-w-0 mx-auto px-4 sm:px-8 py-5 sm:py-8 pb-20 md:pb-12">
        <QuotaPanel onUpgrade={() => setActiveTab(WorkspaceTab.PRICING)} />

        {activeTab === WorkspaceTab.COURSE && <CoursePdfView subjectName={activeSubject.name} />}

        {activeTab === WorkspaceTab.EXAMS && (
          <ExamWorkspace
            profile={profile}
            activeSubject={activeSubject}
            billing={billing}
            latestCorrectionForSubject={latestCorrectionForSubject}
            onExamSolved={handleExamSolved}
            onOpenPricing={() => setActiveTab(WorkspaceTab.PRICING)}
            onJumpToSheetFromTopic={(topic) => {
              setPrefillSheetTopic(topic);
              setActiveTab(WorkspaceTab.SHEETS);
            }}
            onJumpToQuizFromTopic={(topic) => {
              setPrefillQuizTopic(topic);
              setActiveTab(WorkspaceTab.QUIZ);
            }}
          />
        )}

        {activeTab === WorkspaceTab.SHEETS && (
          <RevisionSheetsView
            profile={profile}
            activeSubject={activeSubject}
            billing={billing}
            sheetsForSubject={sheetsForSubject}
            prefillTopic={prefillSheetTopic}
            onClearPrefill={clearSheetPrefill}
            onSheetCreated={(sheet) => setSheetRecords((prev) => [sheet, ...prev])}
            onLaunchQuizFromSheet={(topic) => {
              setPrefillQuizTopic(topic);
              setActiveTab(WorkspaceTab.QUIZ);
            }}
          />
        )}

        {activeTab === WorkspaceTab.QUIZ && (
          <InteractiveQuizView
            profile={profile}
            activeSubject={activeSubject}
            quizzesForSubject={quizzesForSubject}
            prefillTopic={prefillQuizTopic}
            onClearPrefill={clearQuizPrefill}
            onQuizCreated={(quiz) => setQuizRecords((prev) => [quiz, ...prev])}
            onQuizCompleted={(quizId, score) =>
              setQuizRecords((prev) =>
                prev.map((q) =>
                  q.id === quizId ? { ...q, score, completedAt: new Date().toISOString() } : q,
                ),
              )
            }
          />
        )}

        {activeTab === WorkspaceTab.HISTORY && (
          <HistoryView
            records={examRecords}
            subjects={subjects}
            activeSubjectId={activeSubject.id}
            tier={billing.tier}
            onOpenCorrection={(rec) => {
              setActiveSubjectId(rec.subjectId);
              setSelectedExamOverride(rec);
              setActiveTab(WorkspaceTab.EXAMS);
            }}
          />
        )}

        {activeTab === WorkspaceTab.ERRORS && (
          <ErrorAnalysisView
            billing={billing}
            profile={profile}
            activeSubject={activeSubject}
            records={examRecords}
            onOpenPricing={() => setActiveTab(WorkspaceTab.PRICING)}
          />
        )}

        {activeTab === WorkspaceTab.PRICING && (
          <PricingSection
            billing={billing}
            onSelectTierForCheckout={(plan) => setCheckoutTargetPlan(plan)}
          />
        )}
      </main>

      <footer className="hidden md:block border-t border-slate-200 bg-white py-5 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500">
          <span>
            <span translate="no" className="notranslate">
              Fema
            </span>{" "}
            — Collèges, Lycées &amp; Universités du Bénin (UAC · UP · UNSTIM · UNA · EPES)
          </span>
          <span>Photos &amp; PDF · Formules LaTeX · Normes LMD / SYSCOHADA / OHADA</span>
          <SignOutButton />
        </div>
      </footer>

      <nav
        aria-label="Navigation mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-12 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => setActiveTab(item.tab)}
              className={`h-full min-h-[44px] flex flex-col items-center justify-center transition-colors ${
                isActive ? "text-blue-700" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>

      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        profile={profile}
        billing={billing}
        totalSolvedCount={examRecords.length}
        totalSheetsCount={sheetRecords.length}
        onClose={() => setIsProfileDrawerOpen(false)}
        onReconfigureProfile={() => {
          setIsProfileDrawerOpen(false);
          setIsEditingProfile(true);
        }}
        onOpenPricing={() => setActiveTab(WorkspaceTab.PRICING)}
        onResetMonthlyQuotaDemo={() => setBilling((prev) => ({ ...prev, monthlyExamsUsed: 0 }))}
      />

      <CheckoutModal
        targetPlan={checkoutTargetPlan}
        onClose={() => setCheckoutTargetPlan(null)}
        onConfirmUpgrade={handleConfirmTierUpgrade}
      />
    </div>
  );
}
