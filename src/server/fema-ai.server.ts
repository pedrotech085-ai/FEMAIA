/**
 * Fema — logique IA côté serveur (portée depuis l'ancien serveur Express).
 * Les appels passent par Lovable AI (modèles Gemini) avec une chaîne de repli multi-modèles.
 */

export const Type = {
  OBJECT: "object",
  STRING: "string",
  INTEGER: "integer",
  NUMBER: "number",
  BOOLEAN: "boolean",
  ARRAY: "array",
} as const;

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
type GenParams = {
  contents: string | { parts: Part[] };
  config?: {
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: unknown;
  };
};

export interface Request {
  body: unknown;
}
export interface Response {
  status(code: number): Response;
  json(data: unknown): void;
}
export type Handler = (req: Request, res: Response) => Promise<void>;

import { GoogleGenAI } from "@google/genai";

let genAiInstance: GoogleGenAI | null = null;
function getGenAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAiInstance) {
    genAiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiInstance;
}

const DIRECT_GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

class GatewayError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiDirect(model: string, params: GenParams): Promise<string> {
  const ai = getGenAi();
  if (!ai) throw new GatewayError(500, "Service IA non configuré (clé GEMINI_API_KEY requise).");

  let contents:
    string | Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
  if (typeof params.contents === "string") {
    contents = params.contents;
  } else {
    contents = params.contents.parts.map((p) => {
      if ("text" in p) return { text: p.text };
      return {
        inlineData: {
          mimeType: p.inlineData.mimeType,
          data: p.inlineData.data,
        },
      };
    });
  }

  const config: Record<string, unknown> = {};
  if (params.config?.systemInstruction) {
    config.systemInstruction = params.config.systemInstruction;
  }
  if (params.config?.responseMimeType) {
    config.responseMimeType = params.config.responseMimeType;
  }
  if (params.config?.responseSchema) {
    config.responseSchema = params.config.responseSchema;
  }

  const res = await ai.models.generateContent({
    model,
    contents,
    config,
  });

  const text = res.text;
  if (!text) throw new GatewayError(502, "Réponse IA vide.");
  return text;
}

/** Chaîne de résilience : bascule sur le modèle suivant en cas de pic de charge (429 / 5xx). */
async function generateWithResilience(_ai: unknown, params: GenParams): Promise<{ text: string }> {
  let lastError: unknown = null;

  for (let i = 0; i < DIRECT_GEMINI_MODELS.length; i++) {
    try {
      return { text: await callGeminiDirect(DIRECT_GEMINI_MODELS[i], params) };
    } catch (err) {
      lastError = err;
      if (i < DIRECT_GEMINI_MODELS.length - 1) {
        await sleep(500 * (i + 1));
        continue;
      }
    }
  }

  throw lastError || new GatewayError(500, "Échec de génération IA.");
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const status = err instanceof GatewayError ? err.status : 500;
  if (status === 402)
    return {
      status,
      message: "Crédits IA épuisés. Rechargez les crédits de l'espace de travail pour continuer.",
    };
  if (status === 429)
    return {
      status,
      message: "Trop de demandes en ce moment. Patientez quelques instants avant de relancer.",
    };
  if (status === 403) return { status, message: "Accès au service IA refusé pour cette requête." };
  if (status >= 500 && status !== 502)
    return {
      status: 503,
      message:
        "Le service d'analyse IA connaît une forte affluence momentanée. Relancez dans quelques secondes.",
    };
  if (err instanceof SyntaxError)
    return {
      status: 502,
      message: "La réponse IA était mal formée. Veuillez relancer la requête.",
    };
  return {
    status: status || 500,
    message: "Une erreur est survenue lors du traitement IA. Veuillez réessayer.",
  };
}

/**
 * Chaîne de résilience multi-modèles approuvée :
 * Si un modèle subit un pic temporaire de charge (503 UNAVAILABLE / 429),
 * le serveur bascule automatiquement et immédiatement sur le modèle suivant.
 */

interface ProfilePayload {
  firstName: string;
  status: "SECONDARY" | "UNIVERSITY";
  gradeLevel?: string;
  secondaryTrack?: string;
  universityName?: string;
  facultyCode?: string;
  universityLevel?: string;
  specialty?: string;
  academicGoal?: string;
}

type TierCode = "FREE" | "BASIC" | "PRO" | "MASTER";

/**
 * Répare les séquences LaTeX à simple antislash (\frac, \theta, \begin, \alpha, \int, \neq...)
 * fréquemment émises par les LLM dans les chaînes JSON, évitant à la fois les SyntaxError JSON.parse
 * et la transformation accidentelle de \f, \b, \t, \r en caractères de contrôle ASCII.
 */
function sanitizeLatexInJsonStrings(rawJson: string): string {
  const latexControlPrefixes =
    /^(?:frac|forall|flat|fbox|beta|begin|binom|bar|bf|Big|big|bm|boxed|bullet|backslash|theta|times|text|textbf|textit|textrm|tan|tanh|tau|to|tilde|triangle|top|tfrac|right|rightarrow|Rightarrow|rho|rm|rangle|rceil|rfloor|neq|nabla|nmid|nleq|ngeq|nwarrow|nearrow)/;

  let out = "";
  let inString = false;
  let i = 0;

  while (i < rawJson.length) {
    const ch = rawJson[i];

    if (!inString) {
      if (ch === '"') {
        inString = true;
      }
      out += ch;
      i++;
      continue;
    }

    // À l'intérieur d'une chaîne JSON
    if (ch === '"') {
      inString = false;
      out += ch;
      i++;
      continue;
    }

    if (ch === "\\") {
      const next = rawJson[i + 1];
      if (next === undefined) {
        out += "\\\\";
        i++;
        continue;
      }

      // Échappements JSON structurels déjà doublés ou standards : \\, \", \/
      if (next === "\\" || next === '"' || next === "/") {
        out += ch + next;
        i += 2;
        continue;
      }

      // Séquence Unicode JSON valide : \uXXXX
      if (next === "u" && /^[0-9a-fA-F]{4}$/.test(rawJson.slice(i + 2, i + 6))) {
        out += rawJson.slice(i, i + 6);
        i += 6;
        continue;
      }

      // Détection des commandes LaTeX commençant par f, b, t, r ou n (\frac, \begin, \theta, \text, \right, \neq...)
      if (next === "f" || next === "b" || next === "t" || next === "r" || next === "n") {
        const upcoming = rawJson.slice(i + 1, i + 14);
        if (latexControlPrefixes.test(upcoming)) {
          out += "\\\\" + next;
          i += 2;
          continue;
        }
        // Sinon, c'est un vrai saut de ligne \n ou tabulation \t valide en JSON
        out += ch + next;
        i += 2;
        continue;
      }

      // Tout autre caractère après '\' (\alpha, \sqrt, \int, \sum, \, , \{, etc.) est invalide en JSON brut : on double l'antislash
      out += "\\\\" + next;
      i += 2;
      continue;
    }

    // Caractères de contrôle littéraux non échappés dans une chaîne JSON
    const code = ch.charCodeAt(0);
    if (code < 0x20) {
      if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      i++;
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

function safeParseJson<T>(rawText: string | undefined): T {
  const cleaned = (rawText || "{}")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const sanitized = sanitizeLatexInJsonStrings(cleaned);
  try {
    return JSON.parse(sanitized) as T;
  } catch {
    return JSON.parse(cleaned) as T;
  }
}

/**
 * Construit une instruction pédagogique sur mesure adaptée aux programmes scolaires
 * et universitaires du Bénin et d'Afrique de l'Ouest (LMD CAMES, SYSCOHADA, OHADA).
 */
function buildPedagogicalSystemInstruction(
  profile: ProfilePayload,
  subjectName: string,
  tier: TierCode,
): string {
  const learnerIdentity =
    profile.status === "SECONDARY"
      ? `Élève du secondaire (Collège/Lycée) en classe de ${profile.gradeLevel || "Terminale"}${
          profile.secondaryTrack ? ` (${profile.secondaryTrack})` : ""
        }`
      : `Étudiant universitaire en ${profile.universityLevel || "Licence 1"}${
          profile.universityName ? ` à ${profile.universityName}` : ""
        }${profile.facultyCode ? ` (${profile.facultyCode})` : ""}, filière ${
          profile.specialty || "Sciences"
        }`;

  const pedagogicalCalibration =
    profile.status === "SECONDARY"
      ? `CALIBRATION PÉDAGOGIQUE (ENSEIGNEMENT SECONDAIRE — ${profile.gradeLevel || "Secondaire"}) :
- Adapte strictement le vocabulaire, les théorèmes et les méthodes au programme officiel de la classe de ${profile.gradeLevel} (système éducatif francophone / Bénin / Afrique de l'Ouest : BEPC, Baccalauréat séries A, B, C, D, E, F, G).
- N'utilise JAMAIS d'outils hors-programme pour cette classe.
- Détaille chaque étape intermédiaire avec clarté et bienveillance comme un excellent professeur encadrant son élève.`
      : `CALIBRATION PÉDAGOGIQUE (ENSEIGNEMENT SUPÉRIEUR LMD / CAMES — ${profile.universityLevel} · ${profile.specialty}) :
- Adopte la rigueur académique et formelle des universités du Bénin et de l'espace CAMES (${profile.universityName || "UAC / UP / UNSTIM / UNA"}).
- En Sciences & Ingénierie (MIA, PC, EPAC, IFRI, UNSTIM, IMSP) : vérifie systématiquement les hypothèses des théorèmes, utilise le formalisme mathématique/physique exact et structure rigoureusement les démonstrations ou algorithmes.
- En Économie, Gestion & Droit (FASEG, ENEAM, IUT, FADESP, EPES) : applique rigoureusement les normes **SYSCOHADA révisé** en comptabilité/finance, les **Actes uniformes OHADA** en droit des affaires, et le cadre monétaire **UEMOA / BCEAO** lorsqu'il est pertinent.`;

  let tierDepthInstruction = "";
  if (tier === "FREE" || tier === "BASIC") {
    tierDepthInstruction = `NIVEAU D'ANALYSE (${tier}) :
- Fournis un corrigé type complet, clair, rigoureux et parfaitement structuré de bout en bout.
- Utilise Markdown pour la structure et LaTeX ($...$ en ligne, $$...$$ en bloc) pour toutes les formules mathématiques, physiques, chimiques ou économiques.`;
  } else if (tier === "PRO") {
    tierDepthInstruction = `NIVEAU D'ANALYSE RENFORCÉ (MODE PRO) :
- Fournis un corrigé type exhaustif avec une LOGIQUE DE CORRECTION RENFORCÉE.
- Justifie chaque transition logique, explicite les théorèmes/propriétés sous-jacents et mentionne une méthode alternative lorsqu'elle existe.
- Renseigne impérativement 'proMethodNotes' avec : 1) L'idée directrice du sujet, 2) Les pièges classiques sanctionnés aux partiels/examens, 3) Le barème indicatif point par point.`;
  } else {
    tierDepthInstruction = `NIVEAU D'ANALYSE MAXIMAL (MODE MASTER) :
- Performance académique maximale : analyse ultra-poussée, rigueur irréprochable, mise en perspective théorique approfondie et conseils de rédaction d'excellence.
- Renseigne 'proMethodNotes' avec une analyse critique de jury, les subtilités théoriques et les astuces de vérification rapide.
- Génère impérativement dans 'practiceExercises' 3 exercices d'entraînement SUR MESURE de difficulté progressive (Consolidation, Approfondissement, Sujet de partiel/concours) ciblant exactement l'Unité d'Enseignement ${subjectName}, chacun avec un indice et son corrigé complet en Markdown/LaTeX.`;
  }

  return `Tu es Fema, professeur agrégé et directeur d'études universitaires d'élite spécialisé dans l'enseignement de : ${subjectName}.
Profil de l'apprenant : ${profile.firstName || "Apprenant"} — ${learnerIdentity}.
${profile.academicGoal ? `Objectif déclaré : ${profile.academicGoal}.` : ""}

${pedagogicalCalibration}

${tierDepthInstruction}

RÈGLES DE FORMATAGE MATHÉMATIQUE & RÉDACTIONNEL :
- Rédige intégralement en français impeccable.
- Encadre systématiquement les expressions mathématiques/scientifiques en LaTeX standard : $x^2 + 1$ pour les formules courtes en ligne et $$\\int_0^1 f(x)\\,\\mathrm{d}x$$ pour les équations longues, fractions développées, matrices ou systèmes (afin d'assurer une lecture parfaite sur écran mobile).
- Dans les chaînes JSON, échappe correctement les antislashs LaTeX (ex. \\\\frac, \\\\sqrt, \\\\text) et évite les caractères accentués directement en mode mathématique hors de \\\\text{...}.
- Structure tes démonstrations avec des titres clairs (### Question 1, ### Analyse, ### Conclusion) sans préfixes mécaniques type "//".`;
}

const handlers: Record<string, Handler> = {};
const app = {
  post(path: string, h: Handler) {
    handlers[path] = h;
  },
};

/**
 * 1. CONTRÔLE DE QUALITÉ OPTIQUE DE L'IMAGE (GEMINI VISION)
 */
app.post("/api/exam/inspect-image", async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, subjectName } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      subjectName?: string;
    };

    if (!imageBase64 || !mimeType) {
      res.status(400).json({ error: "Aucune image fournie pour l'inspection optique." });
      return;
    }

    const ai = null;
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");

    const response = await generateWithResilience(ai, {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `Analyse rigoureusement la qualité optique et la lisibilité de cette photographie d'épreuve scolaire ou universitaire (Matière / UE : ${
              subjectName || "Générale"
            }).
Critères stricts de REJET (isReadable = false) :
1. L'image est floue (flou de mise au point ou flou de bougé) rendant des chiffres, exposants, indices ou mots incertains.
2. L'image est trop sombre, sous-exposée ou présente un reflet aveuglant qui masque une partie de l'énoncé.
3. L'image ne contient aucun texte/exercice académique exploitable ou est gravement tronquée.

Si l'image est nette, bien éclairée et que l'énoncé est intégralement déchiffrable sans deviner les symboles, renvoie isReadable = true.
Réponds exclusivement en JSON valide en français.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isReadable: {
              type: Type.BOOLEAN,
              description:
                "True uniquement si l'épreuve est nette, bien éclairée et lisible sans ambiguïté.",
            },
            clarityScore: {
              type: Type.INTEGER,
              description: "Indice de netteté et lisibilité optique de 0 à 100.",
            },
            lightingStatus: {
              type: Type.STRING,
              description: "OPTIMAL, TOO_DARK, ou OVEREXPOSED",
            },
            focusStatus: {
              type: Type.STRING,
              description: "SHARP, BLURRY, ou MOTION_BLUR",
            },
            framingStatus: {
              type: Type.STRING,
              description: "COMPLETE, CROPPED, ou NO_DOCUMENT",
            },
            detectedPreview: {
              type: Type.STRING,
              description:
                "Court aperçu (1-2 phrases) du sujet détecté si lisible, ou description du problème visuel.",
            },
            feedbackMessage: {
              type: Type.STRING,
              description:
                "Message interactif adressé à l'apprenant en français : confirmation de netteté OU refus clair demandant de reprendre une photo plus nette.",
            },
            actionableTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 à 3 conseils concrets de prise de vue si l'image est refusée.",
            },
          },
          required: [
            "isReadable",
            "clarityScore",
            "lightingStatus",
            "focusStatus",
            "framingStatus",
            "detectedPreview",
            "feedbackMessage",
            "actionableTips",
          ],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    res.json(parsed);
  } catch (err) {
    const formatted = formatGeminiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

/**
 * 2. TRAITEMENT ET CORRECTION RIGOUREUSE D'ÉPREUVE
 */
app.post("/api/exam/solve", async (req: Request, res: Response) => {
  try {
    const {
      profile,
      subjectName,
      tier = "FREE",
      examText,
      imageBase64,
      mimeType,
      additionalNotes,
    } = req.body as {
      profile: ProfilePayload;
      subjectName: string;
      tier: TierCode;
      examText?: string;
      imageBase64?: string;
      mimeType?: string;
      additionalNotes?: string;
    };

    if (!profile || !subjectName) {
      res.status(400).json({ error: "Profil utilisateur et matière requis." });
      return;
    }

    if (!examText?.trim() && !imageBase64) {
      res.status(400).json({
        error: "Veuillez fournir une photo d'épreuve ou saisir un énoncé.",
      });
      return;
    }

    const ai = null;
    const systemInstruction = buildPedagogicalSystemInstruction(profile, subjectName, tier);

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (imageBase64 && mimeType) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    const promptLines = [
      `Matière / Unité d'Enseignement : ${subjectName}.`,
      examText?.trim() ? `Énoncé saisi par l'apprenant :\n${examText.trim()}` : "",
      additionalNotes?.trim() ? `Précisions particulières :\n${additionalNotes.trim()}` : "",
      `Traite cette épreuve de bout en bout. Rédige une correction type complète, rigoureuse, structurée question par question, parfaitement adaptée au profil exact de l'apprenant, avec formules LaTeX ($...$ et $$...$$).`,
      tier === "MASTER"
        ? `Mode Master actif : remplis 'proMethodNotes' avec une analyse approfondie ET génère exactement 3 exercices d'entraînement sur mesure dans 'practiceExercises' avec leurs corrigés complets.`
        : tier === "PRO"
          ? `Mode Pro actif : remplis 'proMethodNotes' avec la logique de correction renforcée, les pièges classiques et le barème détaillé. Laisse 'practiceExercises' vide [].`
          : `Laisse 'proMethodNotes' vide ("") et 'practiceExercises' sous forme de tableau vide [].`,
    ]
      .filter(Boolean)
      .join("\n\n");

    parts.push({ text: promptLines });

    const response = await generateWithResilience(ai, {
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            estimatedDuration: { type: Type.STRING },
            difficultyLabel: { type: Type.STRING },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            statementSummary: { type: Type.STRING },
            correctionMarkdown: { type: Type.STRING },
            proMethodNotes: { type: Type.STRING },
            practiceExercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  statementMarkdown: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  solutionMarkdown: { type: Type.STRING },
                },
                required: ["title", "difficulty", "statementMarkdown", "hint", "solutionMarkdown"],
              },
            },
          },
          required: [
            "title",
            "estimatedDuration",
            "difficultyLabel",
            "keyConcepts",
            "statementSummary",
            "correctionMarkdown",
            "proMethodNotes",
            "practiceExercises",
          ],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    res.json(parsed);
  } catch (err) {
    const formatted = formatGeminiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

/**
 * 3. MODULE DE RÉVISION : GÉNÉRATION DE FICHES DE NOTES SYNTHÉTIQUES
 */
app.post("/api/revision/sheet", async (req: Request, res: Response) => {
  try {
    const {
      profile,
      subjectName,
      topic,
      tier = "FREE",
    } = req.body as {
      profile: ProfilePayload;
      subjectName: string;
      topic: string;
      tier?: TierCode;
    };

    if (!profile || !subjectName || !topic?.trim()) {
      res.status(400).json({ error: "Profil, matière et thème du chapitre requis." });
      return;
    }

    const ai = null;
    const systemInstruction = buildPedagogicalSystemInstruction(profile, subjectName, tier);

    const response = await generateWithResilience(ai, {
      contents: `Conçois une fiche de révision synthétique, dense, ultra-claire et prête pour les examens/partiels sur le thème suivant : "${topic.trim()}" en ${subjectName}.
Adapte rigoureusement le contenu, les formules (LaTeX $...$ et $$...$$) et les exemples au profil exact de l'apprenant.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            coreDefinitionsMarkdown: { type: Type.STRING },
            formulasAndTheoremsMarkdown: { type: Type.STRING },
            methodStepsMarkdown: { type: Type.STRING },
            examPitfalls: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            retentionChecklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "title",
            "executiveSummary",
            "coreDefinitionsMarkdown",
            "formulasAndTheoremsMarkdown",
            "methodStepsMarkdown",
            "examPitfalls",
            "retentionChecklist",
          ],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    res.json(parsed);
  } catch (err) {
    const formatted = formatGeminiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

/**
 * 4. MODULE DE RÉVISION : MINI-QUIZ INTERACTIFS SUR MESURE
 */
app.post("/api/revision/quiz", async (req: Request, res: Response) => {
  try {
    const {
      profile,
      subjectName,
      topic,
      questionCount = 5,
    } = req.body as {
      profile: ProfilePayload;
      subjectName: string;
      topic: string;
      questionCount?: number;
    };

    if (!profile || !subjectName || !topic?.trim()) {
      res.status(400).json({ error: "Profil, matière et sujet du quiz requis." });
      return;
    }

    const safeCount = Math.min(Math.max(Number(questionCount) || 5, 3), 8);
    const ai = null;
    const systemInstruction = buildPedagogicalSystemInstruction(profile, subjectName, "PRO");

    const response = await generateWithResilience(ai, {
      contents: `Génère un mini-quiz interactif exigeant et formateur de ${safeCount} questions à choix unique sur le thème "${topic.trim()}" en ${subjectName}.
Chaque question doit comporter exactement 4 propositions plausibles, l'indice exact de la bonne réponse (0 à 3), et une explication pédagogique détaillée en Markdown/LaTeX.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            calibratedLevelLabel: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionMarkdown: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  targetedSkill: { type: Type.STRING },
                  explanationMarkdown: { type: Type.STRING },
                },
                required: [
                  "questionMarkdown",
                  "options",
                  "correctIndex",
                  "targetedSkill",
                  "explanationMarkdown",
                ],
              },
            },
          },
          required: ["title", "calibratedLevelLabel", "questions"],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    res.json(parsed);
  } catch (err) {
    const formatted = formatGeminiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

// Analyse des erreurs récurrentes + plan de révision (réservé au Mode Master)
app.post("/api/revision/error-analysis", async (req, res) => {
  try {
    const {
      profile,
      subjectName,
      tier,
      exercisesText,
      pastCorrections = [],
    } = req.body as {
      profile: ProfilePayload;
      subjectName: string;
      tier: TierCode;
      exercisesText: string;
      pastCorrections?: Array<{ title: string; summary: string }>;
    };
    if (tier !== "MASTER") {
      res.status(403).json({ error: "Fonction réservée au Mode Master." });
      return;
    }
    if (!profile || !subjectName || !exercisesText?.trim()) {
      res.status(400).json({ error: "Collez au moins un exercice corrigé à analyser." });
      return;
    }
    const history = (pastCorrections || [])
      .slice(0, 10)
      .map(
        (c, i) => `${i + 1}. ${String(c.title).slice(0, 120)} — ${String(c.summary).slice(0, 300)}`,
      )
      .join("\n");
    const response = await generateWithResilience(null, {
      contents: `Voici des exercices corrigés fournis par l'élève en ${subjectName} (ses réponses et les corrections reçues) :
"""
${exercisesText.trim().slice(0, 20000)}
"""
${history ? `Épreuves déjà corrigées sur la plateforme :\n${history}\n` : ""}
Repère les erreurs RÉCURRENTES (même type d'erreur qui revient), explique leur cause probable, puis construis un plan de révision personnalisé sur 2 à 4 semaines, concret et progressif. Utilise Markdown/LaTeX dans les explications.`,
      config: {
        systemInstruction: buildPedagogicalSystemInstruction(profile, subjectName, "MASTER"),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            recurringErrors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  cause: { type: Type.STRING },
                  exampleMarkdown: { type: Type.STRING },
                  fixMarkdown: { type: Type.STRING },
                },
                required: ["label", "frequency", "cause", "exampleMarkdown", "fixMarkdown"],
              },
            },
            plan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  period: { type: Type.STRING },
                  goal: { type: Type.STRING },
                  tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["period", "goal", "tasks"],
              },
            },
          },
          required: ["overview", "recurringErrors", "plan"],
        },
      },
    });
    res.json(safeParseJson(response.text));
  } catch (err) {
    const formatted = formatGeminiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

/**
 * Questions sur un PDF de cours importé : réponses explicatives fondées sur son contenu.
 */
app.post("/api/course/ask", async (req: Request, res: Response) => {
  try {
    const {
      pdfBase64,
      fileName,
      question,
      history = [],
      subjectName,
      tier = "FREE",
    } = req.body as {
      pdfBase64: string;
      fileName?: string;
      question: string;
      history?: Array<{ role: "user" | "assistant"; text: string }>;
      subjectName?: string;
      tier?: TierCode;
    };
    if (!pdfBase64 || !question?.trim()) {
      res.status(400).json({ error: "Importez un PDF et saisissez une question." });
      return;
    }
    if (pdfBase64.length > 14_000_000) {
      res.status(400).json({ error: "PDF trop volumineux (10 Mo maximum)." });
      return;
    }
    const past = history
      .slice(-6)
      .map(
        (m) => `${m.role === "user" ? "Étudiant" : "Fema IA"} : ${String(m.text).slice(0, 2000)}`,
      )
      .join("\n\n");
    const depth =
      tier === "MASTER" || tier === "PRO"
        ? "Donne une explication approfondie, avec exemples et pièges fréquents."
        : "Donne une explication claire et concise.";
    const response = await generateWithResilience(null, {
      contents: {
        parts: [
          { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
          {
            text: `${past ? `Échanges précédents :\n${past}\n\n` : ""}Question de l'étudiant : ${question.trim()}`,
          },
        ],
      },
      config: {
        systemInstruction: `Tu es Fema IA, tuteur pédagogique${subjectName ? ` en ${subjectName}` : ""}. Le document joint (${fileName || "cours.pdf"}) est le cours de l'étudiant.
Réponds en français, en t'appuyant UNIQUEMENT sur le contenu de ce PDF : cite la section ou la page concernée quand c'est possible.
Si la réponse n'est pas dans le document, dis-le clairement puis donne une brève piste générale en précisant qu'elle ne vient pas du cours.
${depth}
Utilise Markdown et LaTeX ($...$ en ligne, $$...$$ en bloc) pour les formules.`,
      },
    });
    res.json({ answer: response.text });
  } catch (err) {
    const formatted = formatGeminiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

export { handlers };
