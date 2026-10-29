import { useState } from "react";
import { Lock, RefreshCw, Target } from "lucide-react";
import { MathMarkdown } from "./MathMarkdown";
import { analyzeErrorsRequest, ErrorAnalysisPayload } from "../services/api";
import {
  BillingState,
  ExamCorrectionRecord,
  SubjectSpace,
  SubscriptionTier,
  UserProfile,
} from "../types/academic";

interface Props {
  billing: BillingState;
  profile: UserProfile;
  activeSubject: SubjectSpace;
  records: ExamCorrectionRecord[];
  onOpenPricing: () => void;
}

export function ErrorAnalysisView({
  billing,
  profile,
  activeSubject,
  records,
  onOpenPricing,
}: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ErrorAnalysisPayload | null>(null);
  const isMaster = billing.tier === SubscriptionTier.MASTER;

  if (!isMaster) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-6 space-y-3 max-w-2xl">
        <div className="flex items-center gap-2 font-semibold text-amber-950">
          <Lock className="w-4 h-4" /> Analyse des erreurs — réservée au Mode Master
        </div>
        <p className="text-sm text-amber-900">
          Fournissez vos exercices corrigés : l&apos;IA repère vos erreurs récurrentes et crée votre
          plan de révision personnalisé.
        </p>
        <button
          type="button"
          onClick={onOpenPricing}
          className="min-h-[44px] px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold"
        >
          Passer au Mode Master (1 000 XOF / mois)
        </button>
      </div>
    );
  }

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const past = records
        .filter((r) => r.subjectId === activeSubject.id)
        .slice(0, 10)
        .map((r) => ({ title: r.title, summary: r.statementSummary }));
      setResult(
        await analyzeErrorsRequest({
          profile,
          subjectName: activeSubject.name,
          tier: billing.tier,
          exercisesText: text,
          pastCorrections: past,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 space-y-1">
        <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-700" /> Mes erreurs récurrentes ·{" "}
          {activeSubject.name}
        </h2>
        <p className="text-xs text-slate-500">
          Collez vos exercices corrigés (votre réponse + la correction du professeur). L&apos;IA
          repère les erreurs qui reviennent et prépare votre plan de révision.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder="Exercice 1 : ... Ma réponse : ... Correction : ..."
        className="w-full rounded-xl border border-slate-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
      <button
        type="button"
        disabled={loading || !text.trim()}
        onClick={run}
        className="min-h-[48px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-sm font-semibold flex items-center gap-2"
      >
        {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
        {loading ? "Analyse en cours..." : "Analyser mes erreurs"}
      </button>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {result && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <MathMarkdown content={result.overview} />
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-950">Erreurs récurrentes</h3>
            {result.recurringErrors.map((er, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-slate-950">{er.label}</span>
                  <span className="text-xs font-mono text-red-700">{er.frequency}</span>
                </div>
                <p className="text-sm text-slate-600">Cause : {er.cause}</p>
                <MathMarkdown
                  content={`**Exemple :** ${er.exampleMarkdown}\n\n**À retenir :** ${er.fixMarkdown}`}
                />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-950">Plan de révision personnalisé</h3>
            {result.plan.map((step, i) => (
              <div key={i} className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
                <div className="font-semibold text-slate-950">
                  {step.period} — {step.goal}
                </div>
                <ul className="list-disc pl-5 mt-2 text-sm text-slate-700 space-y-1">
                  {step.tasks.map((t, j) => (
                    <li key={j}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
