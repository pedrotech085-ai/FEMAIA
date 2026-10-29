/** Nombre d'éléments créés pendant le mois donné (format AAAA-MM). */
export function countThisMonth(records: Array<{ createdAt: string }>, yearMonth: string): number {
  return records.filter(
    (r) => typeof r.createdAt === "string" && r.createdAt.slice(0, 7) === yearMonth,
  ).length;
}

export type QuotaKind = "exam" | "sheet" | "quiz" | "pdf_question";

/** Routes IA soumises au quota mensuel, vérifié côté serveur. */
export const QUOTA_KIND_BY_PATH: Record<string, QuotaKind> = {
  "/api/exam/solve": "exam",
  "/api/revision/sheet": "sheet",
  "/api/revision/quiz": "quiz",
  "/api/course/ask": "pdf_question",
};

/** Limites mensuelles par abonnement (doivent rester identiques à public.plan_limit). */
export const PLAN_MONTHLY_LIMITS: Record<string, number> = {
  FREE: 2,
  BASIC: 30,
  PRO: 100,
  MASTER: 300,
};

export const QUOTA_LABELS: Record<QuotaKind, string> = {
  exam: "Épreuves corrigées",
  sheet: "Fiches de révision",
  quiz: "Quiz",
  pdf_question: "Questions sur PDF",
};

export interface QuotaSnapshot {
  tier: string;
  limit: number;
  month: string;
  used: Partial<Record<QuotaKind, number>>;
}

export function remaining(q: QuotaSnapshot, kind: QuotaKind): number {
  return Math.max(0, q.limit - (q.used[kind] ?? 0));
}
