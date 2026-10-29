import { supabase } from "@/integrations/supabase/client";
import type { QuotaSnapshot } from "@/lib/quota";
import {
  ExamCorrectionPayload,
  OpticalInspectionResult,
  QuizPayload,
  RevisionSheetPayload,
  SubscriptionTier,
  UserProfile,
} from "../types/academic";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const { data: sess } = await supabase.auth
    .getSession()
    .catch(() => ({ data: { session: null } }));
  const token = sess?.session?.access_token;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (typeof window !== "undefined" && url !== "/api/quota") {
    window.dispatchEvent(new CustomEvent("fema:quota-changed"));
    if (data?.quotaExceeded) {
      window.dispatchEvent(new CustomEvent("fema:quota-exceeded", { detail: data }));
    }
  }
  if (!response.ok) {
    throw new Error(data?.error || `Erreur serveur (${response.status}). Veuillez réessayer.`);
  }
  return data as T;
}

export async function inspectExamImage(params: {
  imageBase64: string;
  mimeType: string;
  subjectName: string;
}): Promise<OpticalInspectionResult> {
  return postJson<OpticalInspectionResult>("/api/exam/inspect-image", params);
}

export async function solveExamRequest(params: {
  profile: UserProfile;
  subjectName: string;
  tier: SubscriptionTier;
  examText?: string;
  imageBase64?: string;
  mimeType?: string;
  additionalNotes?: string;
}): Promise<ExamCorrectionPayload> {
  return postJson<ExamCorrectionPayload>("/api/exam/solve", params);
}

export async function generateRevisionSheetRequest(params: {
  profile: UserProfile;
  subjectName: string;
  topic: string;
  tier: SubscriptionTier;
}): Promise<RevisionSheetPayload> {
  return postJson<RevisionSheetPayload>("/api/revision/sheet", params);
}

export async function generateQuizRequest(params: {
  profile: UserProfile;
  subjectName: string;
  topic: string;
  questionCount?: number;
}): Promise<QuizPayload> {
  return postJson<QuizPayload>("/api/revision/quiz", params);
}

export interface ErrorAnalysisPayload {
  overview: string;
  recurringErrors: Array<{
    label: string;
    frequency: string;
    cause: string;
    exampleMarkdown: string;
    fixMarkdown: string;
  }>;
  plan: Array<{ period: string; goal: string; tasks: string[] }>;
}

export async function analyzeErrorsRequest(params: {
  profile: UserProfile;
  subjectName: string;
  tier: SubscriptionTier;
  exercisesText: string;
  pastCorrections: Array<{ title: string; summary: string }>;
}): Promise<ErrorAnalysisPayload> {
  return postJson<ErrorAnalysisPayload>("/api/revision/error-analysis", params);
}

/**
 * Normalise et compresse une image (caméra Android ou fichier haute définition)
 * jusqu'à 1700px max pour garantir un transfert rapide tout en préservant la netteté des symboles LaTeX/manuscrits.
 */
export function normalizeImageFile(file: File): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    // URL objet : évite de charger toute la photo HD en mémoire (plantages sur téléphone)
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "Format de photo non reconnu (ex. HEIC). Réessayez en JPG/PNG ou réglez l'appareil photo en « Le plus compatible ».",
        ),
      );
    };
    img.onload = () => {
      const maxDim = 1700;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Impossible de traiter cette photo."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.9), mimeType: "image/jpeg" });
    };
    img.src = objectUrl;
  });
}

/**
 * Convertit une URL d'image locale en Data URL Base64, avec option de dégradation optique
 * (flou + sous-exposition) pour démontrer en direct le contrôle qualité Gemini Vision sur PC.
 */
export function createOpticalSampleFromUrl(
  imageUrl: string,
  degradeOpticalQuality: boolean,
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => reject(new Error("Impossible de charger l'échantillon optique."));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const targetWidth = degradeOpticalQuality ? 640 : Math.min(img.width, 1500);
      const scale = targetWidth / img.width;
      canvas.width = targetWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Contexte graphique indisponible."));
        return;
      }

      if (degradeOpticalQuality) {
        ctx.filter = "blur(9px) brightness(0.28) contrast(0.65)";
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (degradeOpticalQuality) {
        ctx.filter = "none";
        ctx.fillStyle = "rgba(8, 12, 24, 0.55)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const dataUrl = canvas.toDataURL("image/jpeg", degradeOpticalQuality ? 0.45 : 0.92);
      resolve({ dataUrl, mimeType: "image/jpeg" });
    };
    img.src = imageUrl;
  });
}

export async function fetchMyQuota(): Promise<QuotaSnapshot> {
  return postJson<QuotaSnapshot>("/api/quota", {});
}

export async function activateSubscription(tier: string, txRef: string): Promise<QuotaSnapshot> {
  return postJson<QuotaSnapshot>("/api/subscription/activate", { tier, txRef });
}

export async function askCoursePdfRequest(params: {
  pdfBase64: string;
  fileName: string;
  question: string;
  history: Array<{ role: "user" | "assistant"; text: string }>;
  subjectName: string;
}): Promise<{ answer: string }> {
  return postJson<{ answer: string }>("/api/course/ask", params);
}
