import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckSquare,
  Copy,
  HelpCircle,
  Plus,
  RefreshCw,
  Search,
  Square,
} from "lucide-react";
import { formatProfileSummary, getSuggestedTopics } from "../constants/curriculum";
import { generateRevisionSheetRequest } from "../services/api";
import { BillingState, RevisionSheetRecord, SubjectSpace, UserProfile } from "../types/academic";
import { MathMarkdown } from "./MathMarkdown";

interface RevisionSheetsViewProps {
  profile: UserProfile;
  activeSubject: SubjectSpace;
  billing: BillingState;
  sheetsForSubject: RevisionSheetRecord[];
  prefillTopic?: string;
  onClearPrefill: () => void;
  onSheetCreated: (sheet: RevisionSheetRecord) => void;
  onLaunchQuizFromSheet: (topic: string) => void;
  canGenerate?: () => boolean;
}

export function RevisionSheetsView({
  profile,
  activeSubject,
  billing,
  sheetsForSubject,
  prefillTopic,
  onClearPrefill,
  onSheetCreated,
  onLaunchQuizFromSheet,
  canGenerate,
}: RevisionSheetsViewProps) {
  const [topicInput, setTopicInput] = useState(prefillTopic || "");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(
    sheetsForSubject[0]?.id || null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (prefillTopic) {
      setTopicInput(prefillTopic);
      onClearPrefill();
    }
  }, [prefillTopic, onClearPrefill]);

  useEffect(() => {
    setSelectedSheetId(sheetsForSubject[0]?.id || null);
  }, [activeSubject.id]);

  const suggestions = getSuggestedTopics(activeSubject, profile);

  const filteredSheets = sheetsForSubject.filter(
    (s) =>
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.topic.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  const currentSheet =
    sheetsForSubject.find((s) => s.id === selectedSheetId) || filteredSheets[0] || null;

  const handleGenerate = async (customTopic?: string) => {
    const finalTopic = (customTopic ?? topicInput).trim();
    if (!finalTopic) {
      setErrorMsg("Veuillez saisir ou sélectionner un thème de chapitre.");
      return;
    }
    if (canGenerate && !canGenerate()) return;

    setErrorMsg("");
    setIsGenerating(true);
    try {
      const generated = await generateRevisionSheetRequest({
        profile,
        subjectName: activeSubject.name,
        topic: finalTopic,
        tier: billing.tier,
      });

      const record: RevisionSheetRecord = {
        ...generated,
        id: "sheet-" + Date.now(),
        subjectId: activeSubject.id,
        subjectName: activeSubject.name,
        topic: finalTopic,
        profileSnapshot: formatProfileSummary(profile),
        createdAt: new Date().toISOString(),
      };

      onSheetCreated(record);
      setSelectedSheetId(record.id);
      setTopicInput("");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Impossible de générer la fiche de synthèse.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySheet = async (sheet: RevisionSheetRecord) => {
    const fullText = `# ${sheet.title}\n\n${sheet.executiveSummary}\n\n## Définitions clés\n${sheet.coreDefinitionsMarkdown}\n\n## Formules & Théorèmes\n${sheet.formulasAndTheoremsMarkdown}\n\n## Méthode d'application\n${sheet.methodStepsMarkdown}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-xs text-slate-500">
            Module de révision · Fiches de notes synthétiques
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-950 tracking-tight">
            Classeur de synthèse — {activeSubject.name}
          </h1>
        </div>
        <div className="text-xs text-slate-600">
          Synthèses adaptées à{" "}
          <strong className="font-semibold text-slate-900">{formatProfileSummary(profile)}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start min-w-0">
        {/* Colonne gauche : Générateur + Classeur de fiches enregistrées */}
        <section className="lg:col-span-4 min-w-0 w-full max-w-full space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-950">
              Nouvelle fiche synthétique
            </h2>
            <div className="space-y-2">
              <label htmlFor="sheet-topic" className="block text-xs font-medium text-slate-700">
                Chapitre, théorème ou notion à synthétiser
              </label>
              <input
                id="sheet-topic"
                type="text"
                value={topicInput}
                onChange={(e) => {
                  setTopicInput(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="Ex. Intégration par parties, Loi de Gauss, Guerre froide..."
                className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleGenerate()}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthèse académique en cours...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Générer la fiche sur mesure</span>
                </>
              )}
            </button>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="block text-xs text-slate-500">Chapitres clés du programme :</span>
              <div className="flex flex-col gap-1.5">
                {suggestions.revisionTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => {
                      setTopicInput(topic);
                      handleGenerate(topic);
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-blue-700 text-left text-xs font-medium text-slate-800 transition-colors truncate"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Liste des fiches de la matière */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-slate-950">
                Mes fiches ({sheetsForSubject.length})
              </h3>
            </div>

            {sheetsForSubject.length > 1 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filtrer mes fiches..."
                  className="w-full min-h-[38px] rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>
            )}

            {filteredSheets.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Aucune fiche enregistrée pour {activeSubject.name}.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredSheets.map((sheet) => {
                  const active = currentSheet?.id === sheet.id;
                  return (
                    <button
                      key={sheet.id}
                      type="button"
                      onClick={() => setSelectedSheetId(sheet.id)}
                      className={`w-full py-3 px-2.5 text-left rounded-lg transition-colors ${
                        active ? "bg-slate-950 text-white" : "hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-semibold truncate">{sheet.title}</div>
                      <div
                        className={`text-[11px] mt-0.5 truncate ${
                          active ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {sheet.profileSnapshot}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Colonne droite : Affichage structuré de la fiche synthétique */}
        <section className="lg:col-span-8 min-w-0 w-full max-w-full">
          {isGenerating ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-3 text-blue-700 text-sm font-medium">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>Structuration des définitions, théorèmes et méthodes...</span>
              </div>
              <div className="space-y-3">
                <div className="h-6 w-2/3 rounded bg-slate-100" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-32 w-full rounded-xl bg-slate-50 border border-slate-100" />
              </div>
            </div>
          ) : currentSheet ? (
            <article className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-200">
              {/* En-tête de la fiche */}
              <div className="p-4 sm:p-6 md:p-8 space-y-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500">
                      {currentSheet.subjectName} · {currentSheet.profileSnapshot}
                    </div>
                    <h2 className="font-display text-2xl font-semibold text-slate-950">
                      {currentSheet.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopySheet(currentSheet)}
                      className="min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onLaunchQuizFromSheet(currentSheet.topic)}
                      className="min-h-[40px] px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Tester par mini-quiz</span>
                    </button>
                  </div>
                </div>

                <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed bg-slate-50 rounded-xl border border-slate-200/80 p-4">
                  {currentSheet.executiveSummary}
                </p>
              </div>

              {/* 01. Définitions clés */}
              <div className="p-4 sm:p-6 md:p-8 space-y-3 min-w-0 max-w-full">
                <div className="text-xs font-semibold text-blue-700">
                  01. Concepts structurants &amp; Définitions
                </div>
                <MathMarkdown content={currentSheet.coreDefinitionsMarkdown} />
              </div>

              {/* 02. Formules & Théorèmes */}
              <div className="p-4 sm:p-6 md:p-8 space-y-3 bg-slate-50/50 min-w-0 max-w-full">
                <div className="text-xs font-semibold text-blue-700">
                  02. Formules fondamentales, théorèmes &amp; repères
                </div>
                <MathMarkdown content={currentSheet.formulasAndTheoremsMarkdown} />
              </div>

              {/* 03. Méthode d'application */}
              <div className="p-4 sm:p-6 md:p-8 space-y-3 min-w-0 max-w-full">
                <div className="text-xs font-semibold text-blue-700">
                  03. Méthode type face à un sujet d&apos;examen
                </div>
                <MathMarkdown content={currentSheet.methodStepsMarkdown} />
              </div>

              {/* 04. Pièges fréquents & Auto-évaluation */}
              <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/40 min-w-0">
                <div className="space-y-2.5">
                  <h3 className="font-display text-sm font-semibold text-slate-950">
                    Erreurs classiques sanctionnées
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                    {currentSheet.examPitfalls.map((pitfall, idx) => (
                      <li key={idx}>{pitfall}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2.5">
                  <h3 className="font-display text-sm font-semibold text-slate-950">
                    Liste de maîtrise avant épreuve
                  </h3>
                  <div className="space-y-2">
                    {currentSheet.retentionChecklist.map((item, idx) => {
                      const key = `${currentSheet.id}-${idx}`;
                      const done = Boolean(checkedItems[key]);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setCheckedItems((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }))
                          }
                          className="w-full min-h-[38px] text-left flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 hover:text-slate-950"
                        >
                          {done ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span className={done ? "line-through text-slate-400" : ""}>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 mx-auto flex items-center justify-center text-slate-700">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-slate-950">
                Créez votre première fiche de révision en {activeSubject.name}
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Sélectionnez un chapitre suggéré à gauche ou saisissez le titre exact de votre cours
                pour obtenir une fiche prête à réviser avec formules LaTeX.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
