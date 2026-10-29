import type { OpticalInspectionResult } from "../types/academic";

/** Seuils du contrôle local (avant tout appel IA). */
export const BLUR_VARIANCE_MIN = 30;
export const BRIGHTNESS_MIN = 45;

/** Décide si une photo doit être refusée d'après la netteté (variance du laplacien) et la luminosité moyenne (0-255). */
export function evaluateSharpness(variance: number, brightness: number) {
  const blurry = variance < BLUR_VARIANCE_MIN;
  const dark = brightness < BRIGHTNESS_MIN;
  return { blurry, dark, rejected: blurry || dark };
}

export function sharpnessFromGray(gray: Float32Array, w: number, h: number) {
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  let bright = 0;
  for (let i = 0; i < gray.length; i++) bright += gray[i];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = gray[i - w] + gray[i + w] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  const mean = n ? sum / n : 0;
  return {
    variance: n ? sumSq / n - mean * mean : 0,
    brightness: gray.length ? bright / gray.length : 0,
  };
}

export async function measureLocalSharpness(
  dataUrl: string,
): Promise<{ rejected: boolean; result: OpticalInspectionResult }> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const w = 600;
  const h = Math.max(1, Math.round((img.height / img.width) * w));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { rejected: false, result: null as unknown as OpticalInspectionResult };
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  const { variance, brightness } = sharpnessFromGray(gray, w, h);
  const verdict = evaluateSharpness(variance, brightness);
  const score = Math.max(0, Math.min(100, Math.round((variance / (BLUR_VARIANCE_MIN * 4)) * 100)));
  return {
    rejected: verdict.rejected,
    result: {
      isReadable: !verdict.rejected,
      clarityScore: score,
      lightingStatus: verdict.dark ? "TOO_DARK" : "OPTIMAL",
      focusStatus: verdict.blurry ? "BLURRY" : "SHARP",
      framingStatus: "COMPLETE",
      detectedPreview: "",
      feedbackMessage: verdict.blurry
        ? "Votre photo est trop floue pour être corrigée sans erreur. Merci de reprendre une photo nette de l'épreuve."
        : "Votre photo est trop sombre pour lire l'énoncé. Merci de reprendre la photo avec plus de lumière.",
      actionableTips: [
        "Posez la feuille à plat et tenez le téléphone bien immobile.",
        "Touchez l'écran sur le texte pour faire la mise au point avant de photographier.",
        "Placez-vous près d'une fenêtre ou d'une lampe, sans reflet sur la feuille.",
      ],
    },
  };
}
