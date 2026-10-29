/**
 * Modèles de données centraux de l'écosystème éducatif Fema.
 * Intègre l'architecture LMD des universités du Bénin et d'Afrique de l'Ouest.
 */

export enum AcademicStatus {
  SECONDARY = "SECONDARY",
  UNIVERSITY = "UNIVERSITY",
}

export enum SubscriptionTier {
  FREE = "FREE",
  BASIC = "BASIC",
  PRO = "PRO",
  MASTER = "MASTER",
}

export enum WorkspaceTab {
  EXAMS = "EXAMS",
  SHEETS = "SHEETS",
  QUIZ = "QUIZ",
  COURSE = "COURSE",
  HISTORY = "HISTORY",
  ERRORS = "ERRORS",
  PRICING = "PRICING",
}

export type AcademicDomainPole =
  | "MIA_INFO"
  | "PHYSIQUE_CHIMIE"
  | "INGENIERIE_POLYTECH"
  | "ECO_GESTION_FASEG"
  | "DROIT_ADMIN"
  | "SANTE_BIO"
  | "AGRO_EAU"
  | "LETTRES_HUMAINES";

export interface UserProfile {
  firstName: string;
  status: AcademicStatus;
  /** Renseigné si status === SECONDARY (ex: 6ème, 3ème, Terminale) */
  gradeLevel?: string;
  /** Série au lycée béninois / ouest-africain (ex: Série C, Série D, Série G2, Série A2) */
  secondaryTrack?: string;
  /** Identifiant de l'université béninoise (ex: uac, up, unstim, una, epes) */
  universityId?: string;
  /** Nom complet de l'université (ex: UAC — Université d'Abomey-Calavi) */
  universityName?: string;
  /** Identifiant de l'entité/filière (ex: uac-fast-mia, uac-faseg-eco) */
  programId?: string;
  /** Sigle de la faculté ou école (ex: FAST, FASEG, EPAC, IFRI, ENEAM, ENSTP) */
  facultyCode?: string;
  /** Pôle disciplinaire permettant de filtrer strictement les matières du domaine */
  domainPole?: AcademicDomainPole;
  /** Niveau LMD (ex: Licence 1, Licence 2, Master 1...) */
  universityLevel?: string;
  /** Intitulé complet de la filière (ex: FAST — MIA : Mathématiques et Informatique Appliquées) */
  specialty?: string;
  /** Objectif pédagogique déclaré */
  academicGoal?: string;
  createdAt: string;
}

export interface SubjectSpace {
  id: string;
  name: string;
  shortCode: string;
  domainSubtitle: string;
  domainPole?: AcademicDomainPole | "SECONDARY";
  isCustom?: boolean;
}

export interface OpticalInspectionResult {
  isReadable: boolean;
  clarityScore: number;
  lightingStatus: "OPTIMAL" | "TOO_DARK" | "OVEREXPOSED" | string;
  focusStatus: "SHARP" | "BLURRY" | "MOTION_BLUR" | string;
  framingStatus: "COMPLETE" | "CROPPED" | "NO_DOCUMENT" | string;
  detectedPreview: string;
  feedbackMessage: string;
  actionableTips: string[];
}

export interface PracticeExercise {
  title: string;
  difficulty: string;
  statementMarkdown: string;
  hint: string;
  solutionMarkdown: string;
}

export interface ExamCorrectionPayload {
  title: string;
  estimatedDuration: string;
  difficultyLabel: string;
  keyConcepts: string[];
  statementSummary: string;
  correctionMarkdown: string;
  proMethodNotes: string;
  practiceExercises: PracticeExercise[];
}

export interface ExamCorrectionRecord extends ExamCorrectionPayload {
  id: string;
  subjectId: string;
  subjectName: string;
  tierAtCreation: SubscriptionTier;
  profileSnapshot: string;
  sourceMode: "IMAGE" | "TEXT";
  opticalScore?: number;
  createdAt: string;
}

export interface RevisionSheetPayload {
  title: string;
  executiveSummary: string;
  coreDefinitionsMarkdown: string;
  formulasAndTheoremsMarkdown: string;
  methodStepsMarkdown: string;
  examPitfalls: string[];
  retentionChecklist: string[];
}

export interface RevisionSheetRecord extends RevisionSheetPayload {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  profileSnapshot: string;
  createdAt: string;
}

export interface QuizQuestion {
  questionMarkdown: string;
  options: string[];
  correctIndex: number;
  targetedSkill: string;
  explanationMarkdown: string;
}

export interface QuizPayload {
  title: string;
  calibratedLevelLabel: string;
  questions: QuizQuestion[];
}

export interface QuizRecord extends QuizPayload {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  score?: number;
  completedAt?: string;
  createdAt: string;
}

export interface BillingState {
  tier: SubscriptionTier;
  monthlyExamsUsed: number;
  billingCycleMonth: string;
  lastTransactionRef?: string;
  paymentMethodLabel?: string;
}

export interface PricingPlanDefinition {
  tier: SubscriptionTier;
  name: string;
  audienceLabel: string;
  priceXof: number;
  quotaLabel: string;
  monthlyLimit: number | null;
  pedagogicalEngineLabel: string;
  features: string[];
  highlighted?: boolean;
}
