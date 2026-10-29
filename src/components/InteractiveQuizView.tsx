import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { formatProfileSummary, getSuggestedTopics } from "../constants/curriculum";
import { generateQuizRequest } from "../services/api";
import { QuizRecord, SubjectSpace, UserProfile } from "../types/academic";
import { MathMarkdown } from "./MathMarkdown";

interface InteractiveQuizViewProps {
  profile: UserProfile;
  activeSubject: SubjectSpace;
  quizzesForSubject: QuizRecord[];
  prefillTopic?: string;
  onClearPrefill: () => void;
  onQuizCreated: (quiz: QuizRecord) => void;
  onQuizCompleted: (quizId: string, score: number) => void;
  canGenerate?: () => boolean;
}

export function InteractiveQuizView({
  profile,
  activeSubject,
  quizzesForSubject: rawQuizzes,
  prefillTopic,
  onClearPrefill,
  onQuizCreated,
  onQuizCompleted,
  canGenerate,
}: InteractiveQuizViewProps) {
  // Ignore les quiz mal formés (sans questions) pour éviter un écran blanc.
  const quizzesForSubject = (rawQuizzes || []).filter(
    (q) => q && Array.isArray(q.questions) && q.questions.length > 0,
  );
  const [topicInput, setTopicInput] = useState(prefillTopic || "");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [activeQuizId, setActiveQuizId] = useState<string | null>(quizzesForSubject[0]?.id || null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [validatedQuestions, setValidatedQuestions] = useState<Record<number, boolean>>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (prefillTopic) {
      setTopicInput(prefillTopic);
      onClearPrefill();
    }
  }, [prefillTopic, onClearPrefill]);

  useEffect(() => {
    const first = quizzesForSubject[0] || null;
    setActiveQuizId(first?.id || null);
    resetQuizSession();
  }, [activeSubject.id]);

  const resetQuizSession = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setValidatedQuestions({});
    setIsFinished(false);
  };

  const suggestions = getSuggestedTopics(activeSubject, profile);
  const activeQuiz = quizzesForSubject.find((q) => q.id === activeQuizId) || null;

  const handleCreateQuiz = async (customTopic?: string) => {
    const finalTopic = (customTopic ?? topicInput).trim();
    if (!finalTopic) {
      setErrorMsg("Veuillez indiquer un thème pour générer le mini-quiz.");
      return;
    }
    if (canGenerate && !canGenerate()) return;

    setErrorMsg("");
    setIsGenerating(true);
    try {
      const payload = await generateQuizRequest({
        profile,
        subjectName: activeSubject.name,
        topic: finalTopic,
        questionCount,
      });

      if (!payload || !Array.isArray(payload.questions) || payload.questions.length === 0) {
        throw new Error("Le quiz reçu est incomplet. Veuillez réessayer.");
      }

      const newRecord: QuizRecord = {
        ...payload,
        id: "quiz-" + Date.now(),
        subjectId: activeSubject.id,
        subjectName: activeSubject.name,
        topic: finalTopic,
        createdAt: new Date().toISOString(),
      };

      onQuizCreated(newRecord);
      setActiveQuizId(newRecord.id);
      resetQuizSession();
      setTopicInput("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Impossible de générer ce mini-quiz.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidateCurrent = () => {
    if (selectedAnswers[currentIndex] === undefined) return;
    setValidatedQuestions((prev) => ({ ...prev, [currentIndex]: true }));
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentIndex + 1 < activeQuiz.questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      const totalCorrect = activeQuiz.questions.reduce((acc, q, idx) => {
        return acc + (selectedAnswers[idx] === q.correctIndex ? 1 : 0);
      }, 0);
      setIsFinished(true);
      onQuizCompleted(activeQuiz.id, totalCorrect);
    }
  };

  const currentQuestion = activeQuiz?.questions[currentIndex];
  const isCurrentValidated = Boolean(validatedQuestions[currentIndex]);
  const chosenOption = selectedAnswers[currentIndex];

  const computedScore = activeQuiz
    ? activeQuiz.questions.reduce(
        (acc, q, idx) => acc + (selectedAnswers[idx] === q.correctIndex ? 1 : 0),
        0,
      )
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-xs text-slate-500">
            Module d&apos;évaluation formative · Mini-quiz interactifs
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-950 tracking-tight">
            Entraînement actif — {activeSubject.name}
          </h1>
        </div>
        <div className="text-xs text-slate-600">
          Questions calibrées sur{" "}
          <strong className="font-semibold text-slate-900">{formatProfileSummary(profile)}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start min-w-0">
        {/* Colonne gauche : Paramétrage du mini-quiz + Historique */}
        <section className="lg:col-span-4 min-w-0 w-full max-w-full space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-950">
              Générer un mini-quiz ciblé
            </h2>

            <div className="space-y-2">
              <label htmlFor="quiz-topic" className="block text-xs font-medium text-slate-700">
                Sujet ou chapitre à évaluer
              </label>
              <input
                id="quiz-topic"
                type="text"
                value={topicInput}
                onChange={(e) => {
                  setTopicInput(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateQuiz();
                  }
                }}
                placeholder="Ex. Suites géométriques, Lois de Kepler, Décolonisation..."
                className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-700">Nombre de questions</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/70">
                {[3, 5, 7].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`min-h-[38px] rounded-lg text-xs font-mono tabular-nums font-semibold transition-colors whitespace-nowrap ${
                      questionCount === count
                        ? "bg-white text-slate-950 shadow-xs"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    {count} quest.
                  </button>
                ))}
              </div>
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
              onClick={() => handleCreateQuiz()}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Conception du quiz en cours...</span>
                </>
              ) : (
                <span>Démarrer le mini-quiz</span>
              )}
            </button>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="block text-xs text-slate-500">
                Lancement rapide sur votre programme :
              </span>
              <div className="flex flex-col gap-1.5">
                {suggestions.revisionTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => {
                      setTopicInput(topic);
                      handleCreateQuiz(topic);
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-blue-700 text-left text-xs font-medium text-slate-800 transition-colors truncate"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {quizzesForSubject.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="font-display text-sm font-semibold text-slate-950">
                Sessions précédentes ({quizzesForSubject.length})
              </h3>
              <div className="divide-y divide-slate-100">
                {quizzesForSubject.map((quiz) => {
                  const active = activeQuiz?.id === quiz.id;
                  return (
                    <button
                      key={quiz.id}
                      type="button"
                      onClick={() => {
                        setActiveQuizId(quiz.id);
                        resetQuizSession();
                      }}
                      className={`w-full py-3 px-2.5 text-left rounded-lg transition-colors flex items-center justify-between gap-3 ${
                        active ? "bg-slate-950 text-white" : "hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold truncate">
                          {quiz.title}
                        </div>
                        <div
                          className={`text-[11px] truncate ${
                            active ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {quiz.questions.length} questions
                        </div>
                      </div>
                      {quiz.score !== undefined && (
                        <span
                          className={`text-xs font-mono tabular-nums shrink-0 ${
                            active ? "text-blue-300" : "text-slate-600"
                          }`}
                        >
                          {quiz.score}/{quiz.questions.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Colonne droite : Scène interactive de résolution du quiz */}
        <section className="lg:col-span-8 min-w-0 w-full max-w-full">
          {isGenerating ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-3 text-blue-700 text-sm font-medium">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>Élaboration des questions et distracteurs pédagogiques...</span>
              </div>
              <div className="space-y-3">
                <div className="h-6 w-3/4 rounded bg-slate-100" />
                <div className="h-14 w-full rounded-xl bg-slate-50 border border-slate-100" />
                <div className="h-14 w-full rounded-xl bg-slate-50 border border-slate-100" />
                <div className="h-14 w-full rounded-xl bg-slate-50 border border-slate-100" />
              </div>
            </div>
          ) : activeQuiz && isFinished ? (
            <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-8 md:p-10 space-y-6">
              <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">
                    Bilan de session · {activeQuiz.calibratedLevelLabel}
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">
                    {activeQuiz.title}
                  </h2>
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-semibold tabular-nums text-slate-950">
                  {computedScore} / {activeQuiz.questions.length}
                </div>
              </div>

              <div className="space-y-4">
                {activeQuiz.questions.map((q, idx) => {
                  const userChoice = selectedAnswers[idx];
                  const isCorrect = userChoice === q.correctIndex;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 p-4 sm:p-5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono tabular-nums text-slate-500">
                          Question {idx + 1} · {q.targetedSkill}
                        </span>
                        {isCorrect ? (
                          <span className="flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Exact</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-semibold text-red-700">
                            <XCircle className="w-4 h-4" />
                            <span>À retravailler</span>
                          </span>
                        )}
                      </div>
                      <MathMarkdown content={q.questionMarkdown} compact />
                      <div className="text-xs text-slate-700 pt-1">
                        <strong>Réponse attendue :</strong>{" "}
                        <MathMarkdown content={q.options[q.correctIndex] || ""} inline />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetQuizSession}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Recommencer ce quiz</span>
                </button>
              </div>
            </div>
          ) : activeQuiz && currentQuestion ? (
            <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-6">
              {/* Barre de progression et métadonnées */}
              <div className="space-y-3 border-b border-slate-200 pb-5">
                <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                  <span className="truncate">
                    {activeQuiz.title} · {currentQuestion.targetedSkill}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                    Question {currentIndex + 1} / {activeQuiz.questions.length}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-700 transition-transform origin-left"
                    style={{
                      transform: `scaleX(${(currentIndex + 1) / activeQuiz.questions.length})`,
                    }}
                  />
                </div>
              </div>

              {/* Énoncé de la question */}
              <div className="py-1">
                <MathMarkdown content={currentQuestion.questionMarkdown} />
              </div>

              {/* Propositions de réponse (cibles tactiles >= 48px) */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = chosenOption === optIdx;
                  const isCorrectOption = optIdx === currentQuestion.correctIndex;

                  let containerClasses =
                    "border-slate-200 bg-white hover:border-slate-300 text-slate-900";
                  if (!isCurrentValidated && isSelected) {
                    containerClasses = "border-blue-700 bg-blue-50/60 text-slate-950";
                  } else if (isCurrentValidated) {
                    if (isCorrectOption) {
                      containerClasses = "border-emerald-600 bg-emerald-50/70 text-slate-950";
                    } else if (isSelected && !isCorrectOption) {
                      containerClasses = "border-red-500 bg-red-50/70 text-slate-950";
                    } else {
                      containerClasses = "border-slate-200 bg-slate-50/50 text-slate-500";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isCurrentValidated}
                      onClick={() =>
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [currentIndex]: optIdx,
                        }))
                      }
                      className={`w-full min-h-[52px] rounded-xl border p-4 text-left transition-colors flex items-start justify-between gap-3 ${containerClasses}`}
                    >
                      <span className="flex items-start gap-3 min-w-0">
                        <span className="font-mono text-xs font-semibold text-slate-500 mt-0.5 shrink-0">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span className="min-w-0">
                          <MathMarkdown content={opt} inline />
                        </span>
                      </span>

                      {isCurrentValidated && isCorrectOption && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Exact</span>
                        </span>
                      )}
                      {isCurrentValidated && isSelected && !isCorrectOption && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-700 whitespace-nowrap shrink-0">
                          <XCircle className="w-4 h-4" />
                          <span>Incorrect</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explication pédagogique immédiate après validation */}
              {isCurrentValidated && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                  <div className="text-xs font-semibold text-slate-950">
                    Justification pédagogique détaillée
                  </div>
                  <MathMarkdown content={currentQuestion.explanationMarkdown} compact />
                </div>
              )}

              {/* Actions de contrôle */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                {!isCurrentValidated ? (
                  <button
                    type="button"
                    disabled={chosenOption === undefined}
                    onClick={handleValidateCurrent}
                    className="min-h-[46px] px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    Valider ma réponse
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="min-h-[46px] px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>
                      {currentIndex + 1 < activeQuiz.questions.length
                        ? "Question suivante"
                        : "Voir mon bilan complet"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 mx-auto flex items-center justify-center text-slate-700">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-slate-950">
                Lancez un mini-quiz interactif en {activeSubject.name}
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Chaque question est générée selon votre classe ou spécialité universitaire, avec
                formules LaTeX et démonstration immédiate.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
