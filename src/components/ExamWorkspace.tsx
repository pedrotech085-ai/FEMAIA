import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Lock,
  RefreshCw,
  Send,
  Upload,
  X,
} from "lucide-react";
import {
  FREE_MONTHLY_LIMIT,
  PRICING_PLANS,
  formatProfileSummary,
  getSuggestedTopics,
} from "../constants/curriculum";
import { canDownloadPdf, downloadCorrectionPdf } from "../services/pdfExport";
import { inspectExamImage, normalizeImageFile, solveExamRequest } from "../services/api";
import {
  BillingState,
  ExamCorrectionRecord,
  OpticalInspectionResult,
  SubjectSpace,
  SubscriptionTier,
  UserProfile,
} from "../types/academic";
import { MathMarkdown } from "./MathMarkdown";
import { Download } from "lucide-react";
import { measureLocalSharpness } from "../services/sharpness";

interface ExamWorkspaceProps {
  profile: UserProfile;
  activeSubject: SubjectSpace;
  billing: BillingState;
  latestCorrectionForSubject: ExamCorrectionRecord | null;
  onExamSolved: (record: ExamCorrectionRecord) => void;
  onOpenPricing: () => void;
  onJumpToSheetFromTopic: (topic: string) => void;
  onJumpToQuizFromTopic: (topic: string) => void;
}

type InputMode = "IMAGE" | "TEXT";
type ProcessingStage = "IDLE" | "INSPECTING_IMAGE" | "SOLVING_EXAM";

export function ExamWorkspace({
  profile,
  activeSubject,
  billing,
  latestCorrectionForSubject,
  onExamSolved,
  onOpenPricing,
  onJumpToSheetFromTopic,
  onJumpToQuizFromTopic,
}: ExamWorkspaceProps) {
  const [inputMode, setInputMode] = useState<InputMode>("IMAGE");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [imageSourceLabel, setImageSourceLabel] = useState<string>("");

  const [examText, setExamText] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");

  const [stage, setStage] = useState<ProcessingStage>("IDLE");
  const [formatting, setFormatting] = useState(false);
  useEffect(() => {
    if (stage !== "SOLVING_EXAM") {
      setFormatting(false);
      return;
    }
    const t = setTimeout(() => setFormatting(true), 9000);
    return () => clearTimeout(t);
  }, [stage]);
  const progressStep = stage === "INSPECTING_IMAGE" ? 0 : formatting ? 2 : 1;
  const [inspectionResult, setInspectionResult] = useState<OpticalInspectionResult | null>(null);
  const [activeCorrection, setActiveCorrection] = useState<ExamCorrectionRecord | null>(
    latestCorrectionForSubject,
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // États des exercices Master dépliables
  const [openHints, setOpenHints] = useState<Record<number, boolean>>({});
  const [openSolutions, setOpenSolutions] = useState<Record<number, boolean>>({});

  // Caméra WebRTC directe + repli natif Android & sélecteur galerie distinct
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setActiveCorrection(latestCorrectionForSubject);
  }, [latestCorrectionForSubject, activeSubject.id]);

  // Attachement fiable du flux caméra au montage de l'élément <video> (React 19)
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraOpen]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const isQuotaReached =
    billing.tier === SubscriptionTier.FREE && billing.monthlyExamsUsed >= FREE_MONTHLY_LIMIT;

  const suggestions = getSuggestedTopics(activeSubject, profile);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const isTouchDevice = () =>
    typeof window !== "undefined" &&
    (window.matchMedia?.("(pointer: coarse)").matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

  const startCamera = async () => {
    setCameraError("");
    setErrorMessage("");

    // Sur téléphone : l'appareil photo natif est le plus fiable (mise au point, flash, HD).
    if (isTouchDevice() || !navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      nativeCameraInputRef.current?.click();
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })
        .catch(() => navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
      streamRef.current = mediaStream;
      setIsCameraOpen(true);
    } catch {
      setCameraError(
        "Accès à la caméra refusé ou indisponible. Autorisez la caméra dans votre navigateur, ou utilisez l'appareil photo natif.",
      );
    }
  };

  const captureFromCamera = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.videoWidth === 0) {
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        video.addEventListener("loadeddata", done, { once: true });
        setTimeout(done, 1500);
      });
    }
    if (video.videoWidth === 0) {
      setCameraError("La caméra n'est pas encore prête. Réessayez dans un instant.");
      return;
    }

    const canvas = document.createElement("canvas");
    const maxDim = 1700;
    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImageDataUrl(dataUrl);
    setImageMimeType("image/jpeg");
    setImageSourceLabel("Capture caméra directe");
    setInspectionResult(null);
    setErrorMessage("");
    stopCameraStream();
  };

  const MAX_PDF_BYTES = 10 * 1024 * 1024;

  const handleFileChosen = async (file: File | undefined) => {
    if (!file) return;
    setErrorMessage("");
    setCameraError("");
    setInspectionResult(null);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    try {
      if (isPdf) {
        if (file.size === 0) throw new Error("Ce PDF est vide.");
        if (file.size > MAX_PDF_BYTES) throw new Error("PDF trop volumineux (10 Mo maximum).");
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Impossible de lire ce PDF."));
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        });
        setImageDataUrl(dataUrl);
        setImageMimeType("application/pdf");
        setImageSourceLabel(file.name);
        setInputMode("IMAGE");
        return;
      }
      const normalized = await normalizeImageFile(file);
      setImageDataUrl(normalized.dataUrl);
      setImageMimeType(normalized.mimeType);
      setImageSourceLabel(file.name);
      setInputMode("IMAGE");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Impossible de traiter ce fichier.");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (
      droppedFile &&
      (droppedFile.type.startsWith("image/") || droppedFile.type === "application/pdf")
    ) {
      handleFileChosen(droppedFile);
    } else {
      setErrorMessage("Veuillez déposer une image (JPG, PNG, WEBP) ou un PDF.");
    }
  };

  const handleProcessExam = async () => {
    setErrorMessage("");

    if (isQuotaReached) {
      onOpenPricing();
      return;
    }

    if (inputMode === "IMAGE") {
      if (!imageDataUrl) {
        setErrorMessage("Veuillez prendre une photo ou importer l'image de votre épreuve.");
        return;
      }

      try {
        const isPdf = imageMimeType === "application/pdf";
        let inspection: OpticalInspectionResult | null = null;
        if (!isPdf) {
          // ÉTAPE 0 : contrôle local de netteté (gratuit, sans appel IA)
          setStage("INSPECTING_IMAGE");
          const local = await measureLocalSharpness(imageDataUrl);
          if (local.rejected) {
            setInspectionResult(local.result);
            setImageDataUrl(null);
            setStage("IDLE");
            return;
          }
          // ÉTAPE 1 : Contrôle de qualité de l'image par l'IA
          inspection = await inspectExamImage({
            imageBase64: imageDataUrl,
            mimeType: imageMimeType,
            subjectName: activeSubject.name,
          });
          setInspectionResult(inspection);

          // Si l'image est floue, sombre ou illisible : refus immédiat SANS consommer de quota
          if (!inspection.isReadable) {
            setImageDataUrl(null);
            setStage("IDLE");
            return;
          }
        }

        // ÉTAPE 2 : Résolution intégrale adaptée au profil et au palier
        setStage("SOLVING_EXAM");
        const solved = await solveExamRequest({
          profile,
          subjectName: activeSubject.name,
          tier: billing.tier,
          imageBase64: imageDataUrl,
          mimeType: imageMimeType,
          additionalNotes,
        });

        const record: ExamCorrectionRecord = {
          ...solved,
          id: "exam-" + Date.now(),
          subjectId: activeSubject.id,
          subjectName: activeSubject.name,
          tierAtCreation: billing.tier,
          profileSnapshot: formatProfileSummary(profile),
          sourceMode: "IMAGE",
          opticalScore: inspection?.clarityScore,
          createdAt: new Date().toISOString(),
        };

        setActiveCorrection(record);
        setOpenHints({});
        setOpenSolutions({});
        onExamSolved(record);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Erreur lors de l'analyse de l'épreuve.",
        );
      } finally {
        setStage("IDLE");
      }
      return;
    }

    // Mode TEXTE
    if (!examText.trim()) {
      setErrorMessage("Veuillez saisir ou coller l'énoncé de l'épreuve.");
      return;
    }

    try {
      setStage("SOLVING_EXAM");
      setInspectionResult(null);
      const solved = await solveExamRequest({
        profile,
        subjectName: activeSubject.name,
        tier: billing.tier,
        examText,
        additionalNotes,
      });

      const record: ExamCorrectionRecord = {
        ...solved,
        id: "exam-" + Date.now(),
        subjectId: activeSubject.id,
        subjectName: activeSubject.name,
        tierAtCreation: billing.tier,
        profileSnapshot: formatProfileSummary(profile),
        sourceMode: "TEXT",
        createdAt: new Date().toISOString(),
      };

      setActiveCorrection(record);
      setOpenHints({});
      setOpenSolutions({});
      onExamSolved(record);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erreur lors de la génération du corrigé.",
      );
    } finally {
      setStage("IDLE");
    }
  };

  const handleCopyMarkdown = async (record: ExamCorrectionRecord) => {
    try {
      await navigator.clipboard.writeText(record.correctionMarkdown);
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignorer silencieusement si le presse-papiers est restreint
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0 max-w-full">
      {/* Champs fichiers cachés séparés : Galerie/Fichiers vs Appareil photo natif mobile */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const chosen = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          handleFileChosen(chosen);
        }}
        className="hidden"
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => {
          const chosen = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          handleFileChosen(chosen);
        }}
        className="hidden"
      />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const chosen = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          handleFileChosen(chosen);
        }}
        className="hidden"
      />

      {/* En-tête de session disciplinaire */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4 sm:pb-5 min-w-0">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-slate-500 truncate">
            Session active · {activeSubject.domainSubtitle}
          </p>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-950 tracking-tight leading-snug break-words">
            Expédition &amp; Correction — {activeSubject.name}
          </h1>
        </div>
        <div className="text-xs text-slate-600 min-w-0 break-words">
          Pédagogie calibrée pour{" "}
          <strong className="font-semibold text-slate-900">{formatProfileSummary(profile)}</strong>
        </div>
      </div>

      {/* Grille principale : Atelier d'expédition (Gauche) + Scène d'inspection & Corrigé (Droite) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start min-w-0">
        {/* COLONNE GAUCHE (5/12) : Panneau d'envoi d'épreuve optimisé mobile */}
        <section className="lg:col-span-5 min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Sélecteur de mode d'acquisition (cibles tactiles >= 44px) */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-slate-100 border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setInputMode("IMAGE");
                setErrorMessage("");
              }}
              className={`min-h-[44px] px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap min-w-0 ${
                inputMode === "IMAGE"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span className="truncate">Photo / Caméra</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setInputMode("TEXT");
                setErrorMessage("");
              }}
              className={`min-h-[44px] px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap min-w-0 ${
                inputMode === "TEXT"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">Saisie de texte</span>
            </button>
          </div>

          {inputMode === "IMAGE" ? (
            <div className="space-y-4 sm:space-y-5">
              {/* Vue Caméra WebRTC active */}
              {isCameraOpen ? (
                <div className="rounded-xl overflow-hidden border border-slate-900 bg-slate-950 space-y-3.5 p-3 sm:p-4">
                  <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-3 sm:inset-4 border border-white/40 rounded-lg" />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-700 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={captureFromCamera}
                      className="min-h-[46px] flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap min-w-0"
                    >
                      <Camera className="w-4 h-4 shrink-0" />
                      <span className="truncate">Capturer l&apos;épreuve nette</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Zone de Glisser-Déposer ou Aperçu de l'image chargée */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`rounded-xl border border-dashed transition-colors p-4 sm:p-5 text-center ${
                      isDragging
                        ? "border-blue-700 bg-blue-50/50"
                        : "border-slate-300 bg-slate-50/70"
                    }`}
                  >
                    {imageDataUrl ? (
                      <div className="space-y-3.5 text-left">
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 max-h-60 min-h-[120px] flex items-center justify-center">
                          {imageMimeType === "application/pdf" ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-white">
                              <FileText className="w-10 h-10" />
                              <span className="text-xs font-semibold">Document PDF prêt</span>
                            </div>
                          ) : (
                            <img
                              src={imageDataUrl}
                              alt="Aperçu de la copie ou de l'épreuve à analyser"
                              referrerPolicy="no-referrer"
                              className="max-h-60 w-auto max-w-full object-contain"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setImageDataUrl(null);
                              setInspectionResult(null);
                            }}
                            aria-label="Supprimer l'image sélectionnée"
                            className="absolute top-2 right-2 min-h-[44px] min-w-[44px] rounded-xl bg-slate-950/85 text-white flex items-center justify-center hover:bg-slate-950 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
                          <span className="text-xs font-medium text-slate-800 truncate min-w-0">
                            {imageSourceLabel || "Image prête pour contrôle optique"}
                          </span>
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-blue-700 text-xs font-semibold text-blue-700 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                          >
                            <Upload className="w-3.5 h-3.5 shrink-0" />
                            <span>Remplacer l&apos;image</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 sm:py-3 space-y-4">
                        <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 mx-auto flex items-center justify-center text-slate-700">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-slate-900">
                            Photographiez ou importez votre épreuve
                          </p>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                            Éclairage uniforme, feuille bien à plat. La netteté est vérifiée avant
                            toute correction.
                          </p>
                        </div>
                        <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                          >
                            <Camera className="w-4 h-4 shrink-0" />
                            <span>Ouvrir la caméra</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:border-slate-400 text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                          >
                            <Upload className="w-4 h-4 shrink-0" />
                            <span>Importer un fichier</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {cameraError && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 space-y-2.5">
                      <p className="text-xs text-amber-900 leading-relaxed">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => nativeCameraInputRef.current?.click()}
                        className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Camera className="w-3.5 h-3.5 shrink-0" />
                        <span>Prendre une photo (appareil natif)</span>
                      </button>
                    </div>
                  )}

                  {/* Envoi d'un exercice au format PDF */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-red-700 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900">
                          Votre exercice est en PDF ?
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Envoyez le sujet PDF (10 Mo max), l&apos;IA le lit et le corrige
                          entièrement.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:border-blue-700 text-xs sm:text-sm font-semibold text-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>Importer un PDF</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="exam-statement"
                  className="block text-xs sm:text-sm font-semibold text-slate-800"
                >
                  Énoncé complet de l&apos;épreuve ou de l&apos;exercice
                </label>
                <textarea
                  id="exam-statement"
                  rows={7}
                  value={examText}
                  onChange={(e) => setExamText(e.target.value)}
                  placeholder="Collez ou saisissez votre sujet d'examen (les formules LaTeX comme f(x) = e^{-x} sont prises en charge)..."
                  className="w-full min-h-[176px] rounded-xl border border-slate-300 bg-white p-3.5 sm:p-4 text-base sm:text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15 focus:outline-none leading-relaxed resize-y"
                />
              </div>

              {/* Exemples calibrés sur le profil et la matière */}
              <div className="space-y-2">
                <span className="block text-xs text-slate-500">
                  Exemples calibrés pour votre niveau :
                </span>
                <div className="flex flex-col gap-2">
                  {suggestions.sampleExams.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setExamText(sample.statement)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-700 text-left text-xs sm:text-sm font-medium text-slate-800 transition-colors flex items-center justify-between gap-2.5 min-w-0"
                    >
                      <span className="truncate">{sample.label}</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Consigne complémentaire optionnelle avec respiration verticale nette */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label
              htmlFor="additional-notes"
              className="block text-xs sm:text-sm font-semibold text-slate-700"
            >
              Précision ou blocage particulier{" "}
              <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <input
              id="additional-notes"
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Ex. Détailler la question 2b ou l'intégration..."
              className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 sm:px-4 py-2.5 text-base sm:text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15 focus:outline-none"
            />
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-800 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="min-w-0 break-words">{errorMessage}</span>
            </div>
          )}

          {/* Alerte Quota Gratuit atteint ou Bouton Principal d'Expédition */}
          {isQuotaReached ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 space-y-3.5">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-950">
                    Quota mensuel atteint ({FREE_MONTHLY_LIMIT} / {FREE_MONTHLY_LIMIT} épreuves
                    utilisées)
                  </p>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Passez au Mode Basique (500 XOF/mois), Pro (800 XOF/mois) ou Master (1 000
                    XOF/mois) pour débloquer les corrections en illimité.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRICING_PLANS.filter((p) => p.tier !== SubscriptionTier.FREE).map((p) => (
                  <button
                    key={p.tier}
                    type="button"
                    onClick={onOpenPricing}
                    className="min-h-[48px] px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex flex-col items-center justify-center"
                  >
                    <span>{p.name}</span>
                    <span className="font-mono text-[11px] opacity-80">
                      {p.priceXof} XOF / mois
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={stage !== "IDLE"}
              onClick={handleProcessExam}
              className="w-full min-h-[48px] px-4 sm:px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-0"
            >
              {stage === "INSPECTING_IMAGE" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span className="truncate">Inspection optique en cours...</span>
                </>
              ) : stage === "SOLVING_EXAM" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span className="truncate">Rédaction du corrigé en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 shrink-0" />
                  {inputMode === "IMAGE" ? (
                    <>
                      <span className="truncate sm:hidden">
                        Vérifier &amp; corriger l&apos;épreuve
                      </span>
                      <span className="truncate hidden sm:inline">
                        Vérifier la netteté &amp; corriger l&apos;épreuve
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="truncate sm:hidden">Générer le corrigé type</span>
                      <span className="truncate hidden sm:inline">
                        Analyser &amp; générer le corrigé type
                      </span>
                    </>
                  )}
                </>
              )}
            </button>
          )}
        </section>

        {/* COLONNE DROITE (7/12) : Résultat du contrôle optique & Corrigé structuré sans débordement */}
        <section className="lg:col-span-7 min-w-0 w-full max-w-full space-y-5 sm:space-y-6">
          {/* CAS 1 : REJET OPTIQUE PAR GEMINI VISION (Image floue / sombre / illisible) */}
          {inspectionResult && !inspectionResult.isReadable && (
            <div
              role="alert"
              className="min-w-0 w-full max-w-full rounded-2xl border border-red-300 bg-white p-4 sm:p-6 md:p-8 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4 border-b border-red-100 pb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-700 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-red-700">
                      Contrôle qualité · Traitement refusé
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-semibold text-slate-950 mt-0.5 break-words">
                      Image trop floue, sombre ou illisible
                    </h2>
                  </div>
                </div>
                <div className="font-mono text-xs tabular-nums text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 shrink-0">
                  Netteté : {inspectionResult.clarityScore} / 100
                </div>
              </div>

              <p className="text-sm sm:text-[15px] text-slate-800 leading-relaxed break-words">
                {inspectionResult.feedbackMessage}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-slate-600">
                <span>Mise au point : {inspectionResult.focusStatus}</span>
                <span aria-hidden="true">·</span>
                <span>Éclairage : {inspectionResult.lightingStatus}</span>
                <span aria-hidden="true">·</span>
                <span>Quota préservé (0 épreuve débitée)</span>
              </div>

              {inspectionResult.actionableTips?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-900">
                    Recommandations pour reprendre votre photo :
                  </div>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                    {inspectionResult.actionableTips.map((tip, i) => (
                      <li key={i} className="break-words">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setInspectionResult(null);
                    startCamera();
                  }}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>Reprendre une photo nette</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:border-slate-400 text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>Choisir une autre image</span>
                </button>
              </div>
            </div>
          )}

          {/* CAS 2 : PIPELINE EN COURS D'EXÉCUTION (Squelette structuré) */}
          {stage !== "IDLE" && (
            <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-5">
              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-medium text-blue-700">
                    {`Étape ${progressStep + 1} sur 3`}
                  </div>
                  <h2 className="font-display text-base sm:text-xl font-semibold text-slate-950 break-words">
                    {stage === "INSPECTING_IMAGE"
                      ? "Analyse de la netteté, du contraste et de l'intégrité du sujet..."
                      : `Élaboration du corrigé type pour ${formatProfileSummary(profile)}...`}
                  </h2>
                </div>
                <RefreshCw className="w-5 h-5 text-blue-700 animate-spin shrink-0 mt-1 sm:mt-0" />
              </div>

              <ol className="space-y-2.5 pt-1">
                {[
                  "Analyse de l'image...",
                  "Résolution mathématique rigoureuse...",
                  "Mise en forme du corrigé (LaTeX/KaTeX)...",
                ].map((label, i) => {
                  const current = progressStep;
                  const skipped = inputMode === "TEXT" && i === 0;
                  const done = i < current || skipped;
                  const active = i === current;
                  return (
                    <li
                      key={label}
                      className={`flex items-center gap-3 text-sm ${active ? "text-slate-950 font-semibold" : done ? "text-emerald-700" : "text-slate-400"}`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : active ? (
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-blue-700" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span>
                        {skipped ? "Analyse optique (non requise pour un énoncé saisi)" : label}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <div className="space-y-3 pt-2">
                <div className="h-4 w-3/4 rounded bg-slate-100" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
                <div className="h-24 w-full rounded-xl bg-slate-50 border border-slate-100" />
              </div>
            </div>
          )}

          {/* CAS 3 : CORRIGÉ COMPLET STRUCTURÉ */}
          {stage === "IDLE" &&
            (!inspectionResult || inspectionResult.isReadable) &&
            activeCorrection && (
              <article
                data-print-area
                className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white overflow-hidden"
              >
                {/* En-tête éditorial du corrigé */}
                <div className="border-b border-slate-200 p-4 sm:p-6 md:p-8 space-y-4 min-w-0">
                  {activeCorrection.opticalScore !== undefined && (
                    <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Contrôle optique validé (Netteté{" "}
                        <span className="font-mono tabular-nums">
                          {activeCorrection.opticalScore}/100
                        </span>
                        )
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 sm:gap-4 min-w-0">
                    <div className="space-y-2 min-w-0">
                      <h2 className="font-display text-lg sm:text-2xl font-semibold text-slate-950 leading-snug break-words">
                        {activeCorrection.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span>{activeCorrection.subjectName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{activeCorrection.difficultyLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Durée : {activeCorrection.estimatedDuration}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="break-words">{activeCorrection.profileSnapshot}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 self-start shrink-0 no-print">
                      <button
                        type="button"
                        onClick={() =>
                          canDownloadPdf(billing.tier)
                            ? downloadCorrectionPdf(activeCorrection)
                            : onOpenPricing()
                        }
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        {canDownloadPdf(billing.tier) ? (
                          <Download className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>
                          {canDownloadPdf(billing.tier)
                            ? "Télécharger en PDF"
                            : "PDF · Pro & Master"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyMarkdown(activeCorrection)}
                        className="self-start min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 hover:text-slate-950 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        {copiedId === activeCorrection.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Corrigé copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 shrink-0" />
                            <span>Copier Markdown</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notions clés mobilisées (texte épuré avec séparateurs ·) */}
                  {activeCorrection.keyConcepts?.length > 0 && (
                    <div className="text-xs text-slate-600 pt-1 break-words">
                      <span className="font-semibold text-slate-900">Notions mobilisées : </span>
                      {activeCorrection.keyConcepts.join(" · ")}
                    </div>
                  )}

                  {/* Passerelles directes vers Fiches & Quiz sur ce sujet */}
                  <div className="pt-1 grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        onJumpToSheetFromTopic(
                          activeCorrection.keyConcepts?.[0] || activeCorrection.title,
                        )
                      }
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-medium text-slate-800 flex items-center justify-center sm:justify-start gap-2 transition-colors whitespace-nowrap min-w-0"
                    >
                      <BookOpen className="w-4 h-4 text-blue-700 shrink-0" />
                      <span className="truncate">Générer la fiche de révision associée</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onJumpToQuizFromTopic(
                          activeCorrection.keyConcepts?.[0] || activeCorrection.title,
                        )
                      }
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-medium text-slate-800 flex items-center justify-center sm:justify-start gap-2 transition-colors whitespace-nowrap min-w-0"
                    >
                      <HelpCircle className="w-4 h-4 text-blue-700 shrink-0" />
                      <span className="truncate">S&apos;entraîner par mini-quiz</span>
                    </button>
                  </div>
                </div>

                {/* Synthèse de l'énoncé détecté */}
                {activeCorrection.statementSummary && (
                  <div className="border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 md:px-8 py-4 space-y-1.5 min-w-0 max-w-full">
                    <div className="text-xs font-semibold text-slate-700">
                      Synthèse de l&apos;énoncé pris en charge
                    </div>
                    <MathMarkdown content={activeCorrection.statementSummary} compact />
                  </div>
                )}

                {/* Corps principal du corrigé type */}
                <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 min-w-0 max-w-full">
                  <div className="text-xs font-semibold text-blue-700">
                    01. Corrigé type intégral &amp; Démonstration
                  </div>
                  <MathMarkdown content={activeCorrection.correctionMarkdown} />
                </div>

                {/* Section PRO / MASTER : Logique de correction renforcée */}
                {activeCorrection.proMethodNotes ? (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-4 sm:p-6 md:p-8 space-y-4 min-w-0 max-w-full">
                    <div className="text-xs font-semibold text-blue-700">
                      02. Logique de correction renforcée, pièges &amp; barème (Mode{" "}
                      {activeCorrection.tierAtCreation === SubscriptionTier.MASTER
                        ? "Master"
                        : "Pro"}
                      )
                    </div>
                    <MathMarkdown content={activeCorrection.proMethodNotes} />
                  </div>
                ) : (
                  <div className="border-t border-slate-200 bg-slate-50/60 px-4 sm:px-6 md:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900">
                        Besoin de la logique de correction renforcée et des exercices sur mesure ?
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Le Mode Pro (800 XOF/mois) détaille les pièges de jury et le Mode Master (1
                        000 XOF/mois) génère 3 exercices ciblés.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenPricing}
                      className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:border-blue-700 text-xs font-semibold text-slate-900 hover:text-blue-700 transition-colors flex items-center justify-center whitespace-nowrap shrink-0"
                    >
                      Voir les paliers Pro &amp; Master
                    </button>
                  </div>
                )}

                {/* Section MASTER : Exercices d'entraînement sur mesure */}
                {activeCorrection.practiceExercises?.length > 0 && (
                  <div className="border-t border-slate-200 p-4 sm:p-6 md:p-8 space-y-5 min-w-0 max-w-full">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-blue-700">
                        03. Programme d&apos;entraînement sur mesure (Exclusivité Mode Master)
                      </div>
                      <h3 className="font-display text-base sm:text-lg font-semibold text-slate-950">
                        3 exercices progressifs générés à partir de cette épreuve
                      </h3>
                    </div>

                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden min-w-0 max-w-full">
                      {activeCorrection.practiceExercises.map((exo, idx) => {
                        const hintVisible = Boolean(openHints[idx]);
                        const solVisible = Boolean(openSolutions[idx]);
                        return (
                          <div
                            key={idx}
                            className="p-4 sm:p-5 bg-white space-y-3.5 min-w-0 max-w-full"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                              <h4 className="font-display text-sm sm:text-base font-semibold text-slate-950 break-words">
                                Exercice {idx + 1}. {exo.title}
                              </h4>
                              <span className="text-xs font-mono text-slate-500 shrink-0">
                                {exo.difficulty}
                              </span>
                            </div>

                            <MathMarkdown content={exo.statementMarkdown} compact />

                            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenHints((prev) => ({
                                    ...prev,
                                    [idx]: !prev[idx],
                                  }))
                                }
                                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-950 flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap shrink-0"
                              >
                                {hintVisible ? (
                                  <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span>Indice méthodologique</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setOpenSolutions((prev) => ({
                                    ...prev,
                                    [idx]: !prev[idx],
                                  }))
                                }
                                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap shrink-0"
                              >
                                {solVisible ? (
                                  <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span>
                                  {solVisible
                                    ? "Masquer le corrigé"
                                    : "Afficher le corrigé détaillé"}
                                </span>
                              </button>
                            </div>

                            {hintVisible && (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 min-w-0 max-w-full space-y-1">
                                <div className="font-semibold text-slate-900">
                                  Piste méthodologique
                                </div>
                                <MathMarkdown content={exo.hint} compact />
                              </div>
                            )}

                            {solVisible && (
                              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 space-y-2 min-w-0 max-w-full">
                                <div className="text-xs font-semibold text-slate-900">
                                  Solution détaillée
                                </div>
                                <MathMarkdown content={exo.solutionMarkdown} compact />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            )}

          {/* CAS 4 : ÉTAT VIDE INITIAL DE LA SESSION */}
          {stage === "IDLE" && !inspectionResult && !activeCorrection && (
            <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 mx-auto flex items-center justify-center text-slate-700">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h2 className="font-display text-lg sm:text-xl font-semibold text-slate-950 break-words">
                  Aucune épreuve corrigée en {activeSubject.name}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Photographiez votre sujet d&apos;examen ou collez un énoncé. L&apos;IA vérifiera
                  d&apos;abord la netteté de la prise de vue avant de rédiger un corrigé complet en
                  LaTeX.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode("TEXT");
                    if (suggestions.sampleExams[0]) {
                      setExamText(suggestions.sampleExams[0].statement);
                    }
                  }}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:border-blue-700 text-xs sm:text-sm font-semibold text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Charger un sujet type ({activeSubject.shortCode})
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
