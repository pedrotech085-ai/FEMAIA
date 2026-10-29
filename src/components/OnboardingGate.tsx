import femaLogo from "@/assets/fema-ia-logo.png.asset.json";
import React, { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Building2, GraduationCap, Sliders } from "lucide-react";
import {
  BENIN_UNIVERSITIES,
  inferSubjectsFromCustomSpecialty,
} from "../constants/beninUniversities";
import { SECONDARY_GRADES, SECONDARY_TRACKS, UNIVERSITY_LEVELS } from "../constants/curriculum";
import { AcademicStatus, UserProfile } from "../types/academic";
import atelierHeroAsset from "../assets/images/onboarding_academic_atelier_1792993000963.jpg.asset.json";
const atelierHeroImg = atelierHeroAsset.url;

interface OnboardingGateProps {
  initialProfile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => void;
  onCancelEdit?: () => void;
}

export function OnboardingGate({
  initialProfile,
  onSaveProfile,
  onCancelEdit,
}: OnboardingGateProps) {
  const [firstName, setFirstName] = useState(initialProfile?.firstName || "");
  const [status, setStatus] = useState<AcademicStatus>(
    initialProfile?.status || AcademicStatus.UNIVERSITY,
  );

  // Secondaire
  const [gradeLevel, setGradeLevel] = useState(initialProfile?.gradeLevel || "Terminale");
  const [secondaryTrack, setSecondaryTrack] = useState(
    initialProfile?.secondaryTrack || SECONDARY_TRACKS[1],
  );

  // Universités du Bénin
  const [universityId, setUniversityId] = useState(
    initialProfile?.universityId || BENIN_UNIVERSITIES[0].id,
  );
  const selectedUniversity = useMemo(
    () => BENIN_UNIVERSITIES.find((u) => u.id === universityId) || BENIN_UNIVERSITIES[0],
    [universityId],
  );

  const [programId, setProgramId] = useState(
    initialProfile?.programId || BENIN_UNIVERSITIES[0].programs[0].id,
  );

  const selectedProgram = useMemo(() => {
    return (
      selectedUniversity.programs.find((p) => p.id === programId) || selectedUniversity.programs[0]
    );
  }, [selectedUniversity, programId]);

  const [universityLevel, setUniversityLevel] = useState(
    initialProfile?.universityLevel || UNIVERSITY_LEVELS[0],
  );
  const [useCustomSpecialty, setUseCustomSpecialty] = useState(false);
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [academicGoal, setAcademicGoal] = useState(initialProfile?.academicGoal || "");
  const [imgError, setImgError] = useState(false);
  const [formError, setFormError] = useState("");

  const isLycée = ["Seconde", "Première", "Terminale"].includes(gradeLevel);

  const handleSelectUniversity = (newUnivId: string) => {
    setUniversityId(newUnivId);
    const univ = BENIN_UNIVERSITIES.find((u) => u.id === newUnivId);
    if (univ && univ.programs[0]) {
      setProgramId(univ.programs[0].id);
    }
  };

  // Aperçu en temps réel des Unités d'Enseignement qui seront attribuées à l'étudiant
  const previewSubjects = useMemo(() => {
    if (status === AcademicStatus.SECONDARY) {
      if (isLycée && secondaryTrack.includes("G2")) {
        return [
          "Comptabilité (SYSCOHADA)",
          "Mathématiques Générales & Financières",
          "Économie & Droit",
          "Français & Anglais",
        ];
      }
      return [
        "Mathématiques",
        "Physique, Chimie et Technologie (PCT)",
        "SVT",
        "Histoire-Géographie",
      ];
    }

    if (useCustomSpecialty && customSpecialty.trim()) {
      return inferSubjectsFromCustomSpecialty(customSpecialty).subjects.map((s) => s.name);
    }

    return selectedProgram.subjects.map((s) => s.name);
  }, [status, isLycée, secondaryTrack, useCustomSpecialty, customSpecialty, selectedProgram]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = firstName.trim();
    if (!trimmedName) {
      setFormError("Veuillez indiquer votre prénom ou matricule étudiant.");
      return;
    }

    if (status === AcademicStatus.UNIVERSITY && useCustomSpecialty && !customSpecialty.trim()) {
      setFormError("Veuillez préciser l'intitulé de votre filière.");
      return;
    }

    if (status === AcademicStatus.SECONDARY) {
      const secondaryProfile: UserProfile = {
        firstName: trimmedName,
        status: AcademicStatus.SECONDARY,
        gradeLevel,
        secondaryTrack: isLycée ? secondaryTrack : "Tronc commun (Collège 6ème – 3ème)",
        academicGoal: academicGoal.trim() || undefined,
        createdAt: initialProfile?.createdAt || new Date().toISOString(),
      };
      onSaveProfile(secondaryProfile);
      return;
    }

    const customInference = useCustomSpecialty
      ? inferSubjectsFromCustomSpecialty(customSpecialty.trim())
      : null;

    const universityProfile: UserProfile = {
      firstName: trimmedName,
      status: AcademicStatus.UNIVERSITY,
      universityId: selectedUniversity.id,
      universityName: `${selectedUniversity.shortName} — ${selectedUniversity.fullName}`,
      programId: useCustomSpecialty ? undefined : selectedProgram.id,
      facultyCode: useCustomSpecialty ? "Filière" : selectedProgram.facultyCode,
      domainPole: useCustomSpecialty ? customInference?.pole : selectedProgram.domainPole,
      universityLevel,
      specialty: useCustomSpecialty
        ? customSpecialty.trim()
        : `${selectedProgram.facultyCode} — ${selectedProgram.filiereName}`,
      academicGoal: academicGoal.trim() || undefined,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
    };

    onSaveProfile(universityProfile);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 bg-white px-5 sm:px-8 py-4 flex items-center justify-between gap-8">
        <span className="font-display text-xl font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 flex items-center gap-2">
          <img
            src={femaLogo.url}
            alt="Fema IA"
            className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg object-cover"
          />
          <span translate="no" className="notranslate">
            Fema IA
          </span>
        </span>
        <div className="hidden sm:block text-xs text-slate-500">
          Collèges, Lycées &amp; Universités du Bénin (UAC · UP · UNSTIM · UNA · EPES)
        </div>
        {onCancelEdit ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="min-h-[40px] px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-950 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Retour au tableau de bord
          </button>
        ) : (
          <span className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap shrink-0">
            Calibration initiale
          </span>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Colonne gauche : Aperçu en direct du programme et des UE exclusives de la filière */}
          <section className="lg:col-span-5 rounded-2xl overflow-hidden bg-slate-950 text-white flex flex-col justify-between border border-slate-900">
            <div className="relative h-52 sm:h-60 lg:h-64 w-full overflow-hidden bg-slate-900">
              {!imgError ? (
                <img
                  src={atelierHeroImg}
                  alt="Bureau d'étude académique avec instruments de géométrie et notes mathématiques"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover opacity-85"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-6">
                  <GraduationCap className="w-12 h-12 text-blue-300 opacity-80" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
              <div className="absolute bottom-5 left-6 right-6">
                <p className="text-xs text-slate-300 tracking-wide mb-1.5">
                  Système éducatif &amp; LMD Bénin / Afrique de l&apos;Ouest
                </p>
                <h1
                  className="font-display text-2xl sm:text-3xl font-semibold text-white leading-tight"
                  style={{ textWrap: "balance" }}
                >
                  Uniquement les matières de votre filière exacte.
                </h1>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-slate-300 tracking-[0.01em]">
                  <span translate="no" className="notranslate">
                    Fema
                  </span>{" "}
                  adapte automatiquement vos espaces de matières aux Unités d&apos;Enseignement (UE)
                  réelles de votre établissement (FAST MIA, PC, FASEG, EPAC, IFRI, ENEAM, UNSTIM,
                  UNA, UP...) et calibre ses démonstrations sur votre niveau exact.
                </p>
              </div>

              {/* Aperçu temps réel des UE attribuées */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-200">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    {status === AcademicStatus.UNIVERSITY
                      ? `UE retenues (${selectedProgram.facultyCode})`
                      : `Matières retenues (${gradeLevel})`}
                  </span>
                  <span className="font-mono tabular-nums text-blue-300">
                    {status === AcademicStatus.SECONDARY
                      ? gradeLevel
                      : universityLevel.split(" (")[0]}
                  </span>
                </div>

                <div className="h-px bg-slate-800" />

                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                  {previewSubjects.map((subjName, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-blue-400 tabular-nums">
                        0{idx + 1}.
                      </span>
                      <span className="truncate">{subjName}</span>
                    </li>
                  ))}
                </ul>

                {status === AcademicStatus.UNIVERSITY && !useCustomSpecialty && (
                  <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                    {selectedProgram.description}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Colonne droite : Formulaire de configuration */}
          <section className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-700">
                  Configuration obligatoire du profil
                </p>
                <h2
                  className="font-display text-2xl sm:text-3xl font-semibold text-slate-950 tracking-tight"
                  style={{ textWrap: "balance" }}
                >
                  Paramétrez votre cursus académique
                </h2>
              </div>

              {/* 01. Prénom */}
              <div className="space-y-2">
                <label
                  htmlFor="learner-name"
                  className="block text-sm font-semibold text-slate-900"
                >
                  01. Votre prénom ou identifiant
                </label>
                <input
                  id="learner-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (formError) setFormError("");
                  }}
                  placeholder="Ex. Sèna, Fifamè, Ulrich, Rachidi..."
                  className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 transition-colors"
                />
              </div>

              {/* 02. Statut principal */}
              <div className="space-y-2.5">
                <span className="block text-sm font-semibold text-slate-900">
                  02. Votre statut principal
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus(AcademicStatus.SECONDARY)}
                    className={`min-h-[66px] text-left rounded-xl border p-4 transition-colors flex items-start gap-3.5 ${
                      status === AcademicStatus.SECONDARY
                        ? "border-blue-700 bg-blue-50/60 text-slate-950"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <BookOpen
                      className={`w-5 h-5 mt-0.5 shrink-0 ${
                        status === AcademicStatus.SECONDARY ? "text-blue-700" : "text-slate-400"
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-sm text-slate-950">Collégien / Lycéen</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        6ème à la Terminale (BEPC, Séries A, B, C, D, E, F, G)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus(AcademicStatus.UNIVERSITY)}
                    className={`min-h-[66px] text-left rounded-xl border p-4 transition-colors flex items-start gap-3.5 ${
                      status === AcademicStatus.UNIVERSITY
                        ? "border-blue-700 bg-blue-50/60 text-slate-950"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <GraduationCap
                      className={`w-5 h-5 mt-0.5 shrink-0 ${
                        status === AcademicStatus.UNIVERSITY ? "text-blue-700" : "text-slate-400"
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-sm text-slate-950">
                        Étudiant Universitaire
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        UAC, UP Parakou, UNSTIM, UNA &amp; Universités agréées
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 03. Parcours conditionnel */}
              {status === AcademicStatus.SECONDARY ? (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <span className="block text-sm font-semibold text-slate-900">
                      03. Classe exacte
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {SECONDARY_GRADES.map((g) => {
                        const active = gradeLevel === g.value;
                        return (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => setGradeLevel(g.value)}
                            className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-left transition-colors ${
                              active
                                ? "border-blue-700 bg-slate-950 text-white"
                                : "border-slate-200 bg-slate-50/60 text-slate-800 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-sm font-semibold whitespace-nowrap">{g.value}</div>
                            <div
                              className={`text-[11px] truncate ${
                                active ? "text-slate-300" : "text-slate-500"
                              }`}
                            >
                              {g.cycle.split(" — ")[0]}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {isLycée && (
                    <div className="space-y-2">
                      <label
                        htmlFor="secondary-track"
                        className="block text-sm font-semibold text-slate-900"
                      >
                        Série au Lycée (Bénin / Afrique de l&apos;Ouest)
                      </label>
                      <select
                        id="secondary-track"
                        value={secondaryTrack}
                        onChange={(e) => setSecondaryTrack(e.target.value)}
                        className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 focus:border-blue-700 focus:outline-none"
                      >
                        {SECONDARY_TRACKS.filter((t) => !t.includes("Collège")).map((track) => (
                          <option key={track} value={track}>
                            {track}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Sélection de l'Université du Bénin */}
                  <div className="space-y-2.5">
                    <span className="block text-sm font-semibold text-slate-900">
                      03. Université ou pôle d&apos;enseignement supérieur au Bénin
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {BENIN_UNIVERSITIES.map((univ) => {
                        const active = universityId === univ.id;
                        return (
                          <button
                            key={univ.id}
                            type="button"
                            onClick={() => handleSelectUniversity(univ.id)}
                            className={`min-h-[54px] px-3.5 py-2.5 rounded-xl border text-left transition-colors flex items-start gap-2.5 ${
                              active
                                ? "border-blue-700 bg-slate-950 text-white"
                                : "border-slate-200 bg-slate-50/70 text-slate-800 hover:border-slate-300"
                            }`}
                          >
                            <Building2
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                active ? "text-blue-400" : "text-slate-400"
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-semibold truncate">
                                {univ.shortName}
                              </div>
                              <div
                                className={`text-[11px] truncate ${
                                  active ? "text-slate-300" : "text-slate-500"
                                }`}
                              >
                                {univ.cities}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sélection de la Faculté / École & Filière */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <label
                        htmlFor="benin-program"
                        className="text-sm font-semibold text-slate-900"
                      >
                        04. Faculté / École &amp; Filière ({selectedUniversity.shortName})
                      </label>
                      <button
                        type="button"
                        onClick={() => setUseCustomSpecialty((v) => !v)}
                        className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0"
                      >
                        {useCustomSpecialty
                          ? "Choisir une filière officielle"
                          : "Autre filière / école"}
                      </button>
                    </div>

                    {!useCustomSpecialty ? (
                      <select
                        id="benin-program"
                        value={selectedProgram.id}
                        onChange={(e) => setProgramId(e.target.value)}
                        className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-950 focus:border-blue-700 focus:outline-none"
                      >
                        {selectedUniversity.programs.map((prog) => (
                          <option key={prog.id} value={prog.id}>
                            [{prog.facultyCode}] {prog.filiereName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="benin-program"
                        type="text"
                        value={customSpecialty}
                        onChange={(e) => {
                          setCustomSpecialty(e.target.value);
                          if (formError) setFormError("");
                        }}
                        placeholder="Ex. Actuariat, Génie Maritime, Télécommunications, Finance Islamique..."
                        className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Niveau LMD */}
                  <div className="space-y-2">
                    <span className="block text-sm font-semibold text-slate-900">
                      05. Niveau d&apos;étude (Cycle LMD)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {UNIVERSITY_LEVELS.map((lvl) => {
                        const shortLabel = lvl.split(" (")[0];
                        const subLabel = lvl.includes("(")
                          ? lvl.split("(")[1]?.replace(")", "")
                          : "";
                        const active = universityLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setUniversityLevel(lvl)}
                            className={`min-h-[46px] px-3 py-2 rounded-xl border text-left transition-colors ${
                              active
                                ? "border-blue-700 bg-blue-50/70 text-slate-950"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                              {shortLabel}
                            </div>
                            {subLabel && (
                              <div className="text-[11px] text-slate-500 truncate">{subLabel}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Objectif optionnel */}
              <div className="space-y-1.5">
                <label
                  htmlFor="academic-goal"
                  className="block text-sm font-semibold text-slate-900"
                >
                  Objectif académique{" "}
                  <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <input
                  id="academic-goal"
                  type="text"
                  value={academicGoal}
                  onChange={(e) => setAcademicGoal(e.target.value)}
                  placeholder="Ex. Valider les UE du semestre avec mention, réussir les partiels ou le Bac..."
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
                />
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {formError}
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Vos matières seront configurées automatiquement sur votre domaine.
                </p>
                <button
                  type="submit"
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white text-sm font-semibold transition-all flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0"
                >
                  <span>Enregistrer et ouvrir mes matières</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
