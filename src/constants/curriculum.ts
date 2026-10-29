import {
  AcademicStatus,
  PricingPlanDefinition,
  SubjectSpace,
  SubscriptionTier,
  UserProfile,
} from "../types/academic";
import {
  BENIN_UNIVERSITIES,
  getExtensibleUniversitySubjectsForPole,
  inferSubjectsFromCustomSpecialty,
} from "./beninUniversities";

export const SECONDARY_GRADES = [
  { value: "6ème", cycle: "Collège — 1er cycle" },
  { value: "5ème", cycle: "Collège — 1er cycle" },
  { value: "4ème", cycle: "Collège — 1er cycle" },
  { value: "3ème", cycle: "Collège — BEPC" },
  { value: "Seconde", cycle: "Lycée — 2nd cycle" },
  { value: "Première", cycle: "Lycée — 2nd cycle" },
  { value: "Terminale", cycle: "Lycée — Baccalauréat" },
];

export const SECONDARY_TRACKS = [
  "Tronc commun (Collège 6ème – 3ème)",
  "Série D — Biologie, Géologie & Sciences",
  "Série C — Mathématiques & Sciences Physiques",
  "Série A1 / A2 — Lettres, Langues & Sciences Humaines",
  "Série B — Économie & Sciences Sociales",
  "Série G2 — Techniques Quantitatives de Gestion (Comptabilité)",
  "Série E / F1–F4 — Sciences & Techniques Industrielles",
];

export const UNIVERSITY_LEVELS = [
  "Licence 1 (L1 — Semestres 1 & 2)",
  "Licence 2 (L2 — Semestres 3 & 4)",
  "Licence 3 (L3 — Semestres 5 & 6)",
  "Master 1 (M1 — Maîtrise / Ingénieur 1)",
  "Master 2 (M2 — DEA / DESS / Ingénieur)",
  "Doctorat / Agrégation CAMES",
];

export const SECONDARY_DEFAULT_SUBJECTS: SubjectSpace[] = [
  {
    id: "sec-mathematiques",
    name: "Mathématiques",
    shortCode: "MATH",
    domainSubtitle: "Algèbre, analyse, géométrie et probabilités",
    domainPole: "SECONDARY",
  },
  {
    id: "sec-pct",
    name: "Physique, Chimie et Technologie (PCT)",
    shortCode: "PCT",
    domainSubtitle: "Mécanique, électricité, optique et réactions chimiques",
    domainPole: "SECONDARY",
  },
  {
    id: "sec-svt",
    name: "Sciences de la Vie et de la Terre (SVT)",
    shortCode: "SVT",
    domainSubtitle: "Biologie cellulaire, génétique, physiologie et géologie",
    domainPole: "SECONDARY",
  },
  {
    id: "sec-hist-geo",
    name: "Histoire-Géographie",
    shortCode: "H-GEO",
    domainSubtitle: "Dissertation, commentaire de documents et géographie du Bénin/Monde",
    domainPole: "SECONDARY",
  },
];

export const SECONDARY_EXTENSIBLE_PRESETS: Array<{
  name: string;
  shortCode: string;
  domainSubtitle: string;
}> = [
  {
    name: "Français & Expression Écrite",
    shortCode: "FR",
    domainSubtitle: "Résumé de texte, commentaire composé et dissertation littéraire",
  },
  {
    name: "Philosophie",
    shortCode: "PHILO",
    domainSubtitle: "Dissertation philosophique et explication méthodique de texte",
  },
  {
    name: "Comptabilité & Économie (Séries B / G2)",
    shortCode: "ECO-G2",
    domainSubtitle: "Opérations comptables SYSCOHADA, mathématiques financières et économie",
  },
  {
    name: "Anglais",
    shortCode: "ANG",
    domainSubtitle: "Compréhension écrite, grammaire et expression anglaise",
  },
];

/**
 * Détermine strictement les matières proposées selon le statut et la filière exacte :
 * - Collégien / Lycéen : matières du secondaire adaptées à la série.
 * - Étudiant Universitaire : UNIQUEMENT les Unités d'Enseignement (UE) de sa filière au Bénin
 *   (aucune matière scolaire hors-domaine comme Histoire-Géographie en MIA, PC ou FASEG).
 */
export function getDefaultSubjectsForProfile(profile: UserProfile | null): SubjectSpace[] {
  if (!profile || profile.status === AcademicStatus.SECONDARY) {
    if (profile?.secondaryTrack?.includes("G2")) {
      return [
        {
          id: "sec-g2-compta",
          name: "Comptabilité (SYSCOHADA)",
          shortCode: "COMPT",
          domainSubtitle: "Opérations courantes, inventaire et états financiers série G2",
          domainPole: "SECONDARY",
        },
        {
          id: "sec-g2-math",
          name: "Mathématiques Générales & Financières",
          shortCode: "MATH",
          domainSubtitle: "Intérêts simples/composés, escompte, suites et fonctions",
          domainPole: "SECONDARY",
        },
        {
          id: "sec-g2-eco",
          name: "Économie & Droit",
          shortCode: "ECO",
          domainSubtitle: "Économie générale, organisation des entreprises et droit",
          domainPole: "SECONDARY",
        },
        {
          id: "sec-fr",
          name: "Français & Anglais",
          shortCode: "FR",
          domainSubtitle: "Contraction de texte, correspondance commerciale et langue",
          domainPole: "SECONDARY",
        },
      ];
    }
    return SECONDARY_DEFAULT_SUBJECTS;
  }

  // Cas Étudiant Universitaire : recherche directe dans le référentiel des universités du Bénin
  if (profile.universityId && profile.programId) {
    const univ = BENIN_UNIVERSITIES.find((u) => u.id === profile.universityId);
    const prog = univ?.programs.find((p) => p.id === profile.programId);
    if (prog && prog.subjects.length > 0) {
      return prog.subjects;
    }
  }

  // Fallback intelligent si l'étudiant a saisi une filière libre personnalisée
  const inferred = inferSubjectsFromCustomSpecialty(profile.specialty || "MIA");
  return inferred.subjects;
}

export function getExtensiblePresetsForProfile(
  profile: UserProfile,
): Array<{ name: string; shortCode: string; domainSubtitle: string }> {
  if (profile.status === AcademicStatus.SECONDARY) {
    return SECONDARY_EXTENSIBLE_PRESETS;
  }
  return getExtensibleUniversitySubjectsForPole(profile.domainPole);
}

export const PRICING_PLANS: PricingPlanDefinition[] = [
  {
    tier: SubscriptionTier.FREE,
    name: "Mode Gratuit",
    audienceLabel: "Découverte mensuelle",
    priceXof: 0,
    quotaLabel: "2 de chaque / mois",
    monthlyLimit: 2,
    pedagogicalEngineLabel: "Rigueur standard adaptée au profil",
    features: [
      "Quota de 2 corrections d'épreuves par mois",
      "Analyse moyennement performante",
      "Corrigé type structuré en Markdown & LaTeX",
      "Fiches synthétiques et mini-quiz essentiels",
    ],
  },
  {
    tier: SubscriptionTier.BASIC,
    name: "Mode Basique",
    audienceLabel: "Pratique régulière sans limite",
    priceXof: 500,
    quotaLabel: "30 de chaque / mois",
    monthlyLimit: 30,
    pedagogicalEngineLabel: "Rigueur standard complète",
    features: [
      "30 épreuves, fiches, quiz et questions PDF par mois",
      "Scan caméra Android/PC & bonne analyse",
      "Corrigés intégraux étape par étape (LaTeX)",
      "Fiches de révision et quiz par matière",
    ],
  },
  {
    tier: SubscriptionTier.PRO,
    name: "Mode Pro",
    audienceLabel: "Préparation examens & partiels",
    priceXof: 800,
    quotaLabel: "100 de chaque / mois",
    monthlyLimit: 100,
    pedagogicalEngineLabel: "Raisonnement approfondi & barème",
    highlighted: true,
    features: [
      "100 épreuves, fiches, quiz et questions PDF par mois",
      "Logique de correction renforcée (justifications détaillées)",
      "Signalement des pièges classiques et erreurs fréquentes",
      "Barème indicatif et méthodes alternatives de résolution",
    ],
  },
  {
    tier: SubscriptionTier.MASTER,
    name: "Mode Master",
    audienceLabel: "Excellence académique maximale",
    priceXof: 1000,
    quotaLabel: "300 de chaque / mois",
    monthlyLimit: 300,
    pedagogicalEngineLabel: "Analyse ultra-poussée + 3 exercices générés",
    features: [
      "Performance maximale et analyse théorique ultra-poussée",
      "Commentaires critiques de niveau jury d'examen",
      "3 exercices d'entraînement sur mesure générés après chaque épreuve",
      "Corrigés détaillés inclus pour chaque exercice d'entraînement",
    ],
  },
];

export const FREE_MONTHLY_LIMIT = 2;

export function formatProfileSummary(profile: UserProfile): string {
  if (profile.status === AcademicStatus.SECONDARY) {
    const parts = ["Secondaire", profile.gradeLevel || "Terminale"];
    if (profile.secondaryTrack && !profile.secondaryTrack.includes("Tronc commun")) {
      parts.push(profile.secondaryTrack.split(" — ")[0]);
    }
    return parts.join(" · ");
  }

  const univShort = profile.universityName ? profile.universityName.split(" — ")[0] : "Université";
  const levelShort = profile.universityLevel?.split(" (")[0] || "Licence";
  const facPart = profile.facultyCode ? `${profile.facultyCode}` : "";
  const specShort = profile.specialty
    ? profile.specialty.split(" — ").pop() || profile.specialty
    : "Filière";

  return [univShort, facPart, levelShort, specShort].filter(Boolean).join(" · ");
}

/**
 * Génère des exemples d'épreuves et de thèmes de révision rigoureusement alignés
 * sur l'Unité d'Enseignement (matière) active et le profil (Collège/Lycée vs Universités du Bénin).
 */
export function getSuggestedTopics(
  subject: SubjectSpace,
  profile: UserProfile,
): {
  sampleExams: Array<{ label: string; statement: string }>;
  revisionTopics: string[];
} {
  const isUniv = profile.status === AcademicStatus.UNIVERSITY;
  const nameLower = subject.name.toLowerCase();

  // --- CAS ENSEIGNEMENT SUPÉRIEUR (UNIVERSITÉS DU BÉNIN : MIA, PC, FASEG, EPAC, IFRI, FSS, FADESP, UNA...) ---
  if (isUniv) {
    // 1. Algorithmique, Programmation, BDD & Réseaux (MIA, IFRI, IUT, INSTI, EPES)
    if (
      nameLower.includes("algo") ||
      nameLower.includes("programmation") ||
      nameLower.includes("logiciel") ||
      nameLower.includes("données") ||
      nameLower.includes("réseaux") ||
      nameLower.includes("informatique")
    ) {
      return {
        sampleExams: [
          {
            label: "Partiel MIA / IFRI — Algorithmique, Complexité & Arbres Binaires",
            statement: `On considère un arbre binaire de recherche (ABR) contenant $n$ clés entières distinctes.\n1. Définir formellement la propriété d'ordre d'un ABR et écrire l'algorithme récursif de recherche d'une clé $x$.\n2. Évaluer la complexité temporelle au meilleur cas et au pire cas en fonction de $n$.\n3. Écrire une fonction en C ou Python permettant de vérifier en temps $O(n)$ si un arbre binaire quelconque est un ABR valide.`,
          },
          {
            label: "Bases de Données Relationnelles — Algèbre Relationnelle & SQL",
            statement: `Soit le schéma relationnel d'une scolarité universitaire :\n- ETUDIANT(matricule, nom, prenom, filiere)\n- UE(code_ue, intitule, credits)\n- INSCRIPTION(#matricule, #code_ue, annee_acad, note_finale)\n\n1. Exprimer en algèbre relationnelle la liste des étudiants de la filière 'MIA' ayant validé (note_finale >= 10) l'UE 'ANA101'.\n2. Écrire en SQL la requête calculant la moyenne pondérée par les crédits de chaque étudiant pour l'année '2025-2026', triée par ordre décroissant.`,
          },
        ],
        revisionTopics: [
          "Complexité algorithmique, récursivité et algorithmes de tri",
          "Structures de données : listes chaînées, piles, files, arbres et graphes",
          "Modélisation Merise/UML, algèbre relationnelle et requêtes SQL",
          "Architecture TCP/IP, adressage sous-réseaux et sécurité des systèmes",
        ],
      };
    }

    // 2. Microéconomie, Macroéconomie & Économétrie (FASEG, ENEAM, EAPA)
    if (
      nameLower.includes("micro") ||
      nameLower.includes("macro") ||
      nameLower.includes("économ") ||
      nameLower.includes("econom")
    ) {
      return {
        sampleExams: [
          {
            label: "Partiel FASEG — Microéconomie : Optimum du consommateur (Lagrange)",
            statement: `Un consommateur dispose d'un revenu $R = 60\\,000\\text{ XOF}$ qu'il consacre entièrement à l'achat de deux biens $X$ et $Y$ aux prix unitaires $P_x = 1\\,000\\text{ XOF}$ et $P_y = 2\\,000\\text{ XOF}$. Sa fonction d'utilité est de type Cobb-Douglas : $$U(x, y) = x^{2/3} y^{1/3}$$\n1. Calculer les utilités marginales $Um_x$, $Um_y$ et interpréter le taux marginal de substitution $TMS_{y/x}$.\n2. Former le lagrangien et déterminer les fonctions de demande marshalliennes $x^*(P_x, P_y, R)$ et $y^*(P_x, P_y, R)$.\n3. Calculer les quantités optimales consommées, puis analyser l'effet de substitution et l'effet revenu (au sens de Slutsky) si $P_x$ passe à $1\\,500\\text{ XOF}$.`,
          },
          {
            label: "Macroéconomie FASEG — Équilibre IS-LM en économie ouverte",
            statement: `Dans une économie, on donne : $C = 0{,}8 Y_d + 120$, $I = 300 - 1500 i$, $G = 250$, $T = 0{,}25 Y$, offre réelle de monnaie $M/P = 400$ et demande de monnaie $L(Y, i) = 0{,}25 Y - 1000 i$.\n1. Établir les équations analytiques des courbes $IS$ et $LM$.\n2. Déterminer le revenu national d'équilibre $Y^*$ et le taux d'intérêt d'équilibre $i^*$.\n3. Évaluer l'effet d'éviction suite à une hausse des dépenses publiques $\\Delta G = +60$.`,
          },
        ],
        revisionTopics: [
          "Théorie du consommateur, du producteur et équilibre de marché (FASEG)",
          "Modèle IS-LM, multiplicateur keynésien et politique monétaire UEMOA",
          "Régression linéaire par Moindres Carrés Ordinaires (MCO) et tests de Student/Fisher",
          "Comptabilité nationale et tableau économique d'ensemble",
        ],
      };
    }

    // 3. Comptabilité SYSCOHADA, Finance, Banque & Gestion (FASEG, ENEAM, IUT, Pigier, HECM)
    if (
      nameLower.includes("compta") ||
      nameLower.includes("syscohada") ||
      nameLower.includes("finan") ||
      nameLower.includes("banq") ||
      nameLower.includes("audit")
    ) {
      return {
        sampleExams: [
          {
            label: "Examen SYSCOHADA Révisé — Amortissements, Cessions & Provisions",
            statement: `Une entreprise industrielle basée à Cotonou a acquis le 01/04/N-2 un équipement industriel pour $18\\,000\\,000\\text{ XOF HT}$ (TVA récupérable $18\\%$), amortissable linéairement sur 5 ans.\n1. Présenter le plan d'amortissement de l'immobilisation selon les règles du SYSCOHADA révisé.\n2. Le 30/09/N, ce matériel est cédé à crédit pour $8\\,500\\,000\\text{ XOF HT}$. Passer au journal toutes les écritures de régularisation et de cession au 30/09/N et au 31/12/N.`,
          },
          {
            label:
              "Gestion Financière — Choix d'investissement (VAN, TRI, Indice de profitabilité)",
            statement: `Une société étudie un projet d'investissement initial $I_0 = 25\\,000\\,000\\text{ XOF}$ amortissable linéairement sur 4 ans (valeur résiduelle nulle). Les chiffres d'affaires prévisionnels annuels sont de $18\\,000\\,000\\text{ XOF}$ avec des charges décaissables de $8\\,000\\,000\\text{ XOF/an}$. Taux d'impôt sur les sociétés : $30\\%$. Coût du capital : $10\\%$.\n1. Calculer les Capacités d'Autofinancement (CAF) d'exploitation sur les 4 années.\n2. Déterminer la Valeur Actuelle Nette (VAN) et conclure sur la rentabilité du projet.`,
          },
        ],
        revisionTopics: [
          "Opérations courantes et travaux de fin d'exercice (SYSCOHADA révisé)",
          "Comptabilité analytique : coûts complets, imputation rationnelle et seuil de rentabilité",
          "Mathématiques financières : intérêts composés, annuités et emprunts indivis",
          "Analyse financière : bilan fonctionnel, FRNG, BFR, Trésorerie nette et SIG",
        ],
      };
    }

    // 4. Génie Civil, RDM, Électrotechnique, Hydraulique (EPAC, ENSTP, INSTI, EGR)
    if (
      nameLower.includes("rdm") ||
      nameLower.includes("matériaux") ||
      nameLower.includes("électrotech") ||
      nameLower.includes("hydraul") ||
      nameLower.includes("topograph") ||
      nameLower.includes("sols") ||
      nameLower.includes("automatique")
    ) {
      return {
        sampleExams: [
          {
            label: "Partiel EPAC / ENSTP — Résistance des Matériaux (Poutre en flexion plane)",
            statement: `Une poutre droite horizontale $AB$ de longueur $L = 6\\text{ m}$ repose sur un appui simple en $A$ et un appui double en $B$. Elle supporte une charge uniformément répartie $q = 12\\text{ kN/m}$ sur toute sa travée ainsi qu'une force concentrée verticale $F = 24\\text{ kN}$ appliquée en son milieu $C$.\n1. Calculer les réactions d'appui en $A$ et $B$.\n2. Déterminer les équations de l'effort tranchant $T(x)$ et du moment fléchissant $M_f(x)$ le long de la poutre.\n3. Tracer les diagrammes correspondants et calculer la valeur du moment fléchissant maximal.`,
          },
          {
            label: "Électrotechnique INSTI / EPAC — Réseau triphasé équilibré",
            statement: `Une installation industrielle alimentée sous un réseau triphasé équilibré $230\\text{ V} / 400\\text{ V}$, $50\\text{ Hz}$, comporte un moteur asynchrone absorbant une puissance active $P = 15\\text{ kW}$ avec un facteur de puissance $\\cos\\varphi = 0{,}76$ arrière.\n1. Calculer la puissance réactive $Q$, la puissance apparente $S$ et l'intensité efficace $I$ en ligne.\n2. Déterminer la capacité $C$ des trois condensateurs montés en triangle permettant de relever le facteur de puissance à $\\cos\\varphi' = 0{,}93$.`,
          },
        ],
        revisionTopics: [
          "Torseur de cohésion, sollicitations simples et flexion des poutres (RDM)",
          "Systèmes triphasés équilibrés, machines électriques et électronique de puissance",
          "Mécanique des fluides : hydrostatique, équation de Bernoulli et pertes de charge",
          "Asservissements linéaires continus, transformée de Laplace et stabilité",
        ],
      };
    }

    // 5. Physique & Chimie universitaire (FAST PC, MIA, IMSP, Prépa INSPEI)
    if (
      nameLower.includes("physique") ||
      nameLower.includes("mécanique") ||
      nameLower.includes("électromag") ||
      nameLower.includes("thermo") ||
      nameLower.includes("chimie")
    ) {
      return {
        sampleExams: [
          {
            label: "Partiel FAST PC / MIA — Électromagnétisme & Théorème de Gauss",
            statement: `Une sphère de centre $O$ et de rayon $R$ porte une densité volumique de charge $\\rho(r) = \\rho_0 \\left(1 - \\frac{r}{R}\\right)$ pour $r \\le R$ et $\\rho(r) = 0$ pour $r > R$ ($\\rho_0 > 0$).\n1. Exprimer la charge totale $Q$ contenue dans la sphère.\n2. Étudier les symétries et invariances, puis déterminer le champ électrostatique $\\vec{E}(M)$ en tout point de l'espace.\n3. En déduire le potentiel électrostatique $V(r)$ en prenant $V(+\\infty) = 0$.`,
          },
          {
            label: "Chimie Générale & Cinétique — Ordre de réaction et loi d'Arrhenius",
            statement: `On étudie la décomposition thermique en phase gazeuse $2\\,\\text{N}_2\\text{O}_5(g) \\rightarrow 4\\,\\text{NO}_2(g) + \\text{O}_2(g)$ d'ordre global $1$, de constante de vitesse $k$.\n1. Établir la loi intégrée donnant la concentration $[\\text{N}_2\\text{O}_5](t)$ en fonction de $C_0$, $k$ et $t$, ainsi que l'expression du temps de demi-réaction $t_{1/2}$.\n2. À $T_1 = 300\\text{ K}$, $k_1 = 3{,}4 \\times 10^{-5}\\text{ s}^{-1}$ et à $T_2 = 320\\text{ K}$, $k_2 = 4{,}9 \\times 10^{-4}\\text{ s}^{-1}$. Calculer l'énergie d'activation $E_a$.`,
          },
        ],
        revisionTopics: [
          "Cinématique et dynamique du point matériel en référentiel galiléen et non galiléen",
          "Électrostatique, magnétostatique, induction et équations de Maxwell",
          "Premier et second principes de la thermodynamique, machines thermiques",
          "Atomistique, liaisons chimiques, équilibres en solution et mécanismes réactionnels",
        ],
      };
    }

    // 6. Biologie, Médecine, Biochimie, Agronomie (FSS, FAST CBG, ENSBBA, FSA, UNA)
    if (
      nameLower.includes("anat") ||
      nameLower.includes("bio") ||
      nameLower.includes("pharma") ||
      nameLower.includes("agro") ||
      nameLower.includes("épidémio") ||
      nameLower.includes("zoot")
    ) {
      return {
        sampleExams: [
          {
            label: "Examen FSS / FAST BBM — Cinétique enzymatique de Michaelis-Menten",
            statement: `Une enzyme catalyse la transformation d'un substrat $S$ en produit $P$ selon le schéma $E + S \\rightleftharpoons ES \\rightarrow E + P$.\n1. Énoncer l'hypothèse de l'état quasi-stationnaire de Briggs-Haldane et démontrer l'équation de Michaelis-Menten $$v_0 = \\frac{V_{\\max}[S]}{K_M + [S]}$$\n2. Donner la représentation linéaire de Lineweaver-Burk et expliquer comment différencier graphiquement une inhibition compétitive d'une inhibition non compétitive.`,
          },
          {
            label: "Biostatistique & Épidémiologie — Tests d'hypothèses et Risque Relatif",
            statement: `Lors d'une étude de cohorte menée auprès de $400$ sujets suivis pendant 2 ans ($200$ exposés à un facteur de risque et $200$ non-exposés), on observe $36$ cas de maladie chez les exposés contre $12$ cas chez les non-exposés.\n1. Construire le tableau de contingence $2 \\times 2$, calculer les incidences cumulées et le Risque Relatif ($RR$).\n2. Réaliser un test du $\\chi^2$ d'indépendance au seuil $\\alpha = 5\\%$ ($\\chi^2_{0{,}95; 1} = 3{,}84$) et conclure.`,
          },
        ],
        revisionTopics: [
          "Biochimie structurale, enzymologie et bioénergétique cellulaire",
          "Biologie moléculaire : réplication, transcription, traduction et génétique",
          "Physiologie des grandes fonctions et équilibre acido-basique (Henderson-Hasselbalch)",
          "Biostatistique, plans d'expériences (ANOVA) et indicateurs épidémiologiques",
        ],
      };
    }

    // 7. Droit Privé, Droit Public & OHADA (FADESP, FDSP, ENA)
    if (nameLower.includes("droit") || nameLower.includes("ohada") || nameLower.includes("pénal")) {
      return {
        sampleExams: [
          {
            label: "Partiel FADESP — Cas pratique en Droit des Obligations & Contrats",
            statement: `Cas pratique : M. Dossou, commerçant à Dantokpa, conclut par écrit avec la société TransBénin SA un contrat de livraison de marchandises périssables devant arriver impérativement le 15 novembre. En raison d'une panne mécanique due à un défaut d'entretien avéré du camion, la livraison n'intervient que le 22 novembre, entraînant la perte de $70\\%$ du stock.\nQualifiez juridiquement les faits, identifiez le problème de droit, exposez les conditions de mise en œuvre de la responsabilité contractuelle et appréciez la validité d'une éventuelle clause limitative de responsabilité.`,
          },
          {
            label:
              "Droit Constitutionnel — Séparation des pouvoirs et contrôle de constitutionnalité au Bénin",
            statement: `Sujet de dissertation juridique : « Le rôle du juge constitutionnel dans la garantie des droits fondamentaux et la régulation du fonctionnement des institutions en République du Bénin depuis la Constitution du 11 décembre 1990. »\nÉlaborez une introduction juridique complète (accroche, définitions, intérêt du sujet, problématique, annonce d'un plan binaire I / II) et le développement structuré.`,
          },
        ],
        revisionTopics: [
          "Méthodologie du cas pratique, du commentaire d'arrêt et de la dissertation juridique",
          "Théorie générale des obligations : formation du contrat, inexécution et responsabilité",
          "Acte uniforme OHADA relatif au droit commercial général et aux sociétés commerciales",
          "Droit constitutionnel béninois, actes administratifs unilatéraux et recours pour excès de pouvoir",
        ],
      };
    }

    // 8. Par défaut Universitaire : Mathématiques (Analyse, Algèbre, Probabilités — MIA / IMSP / Prépa)
    return {
      sampleExams: [
        {
          label: "Partiel FAST MIA — Algèbre Linéaire & Diagonalisation",
          statement: `Soit $A \\in \\mathcal{M}_3(\\mathbb{R})$ la matrice définie par :\n$$A = \\begin{pmatrix} 3 & -1 & 1 \\\\ 2 & 0 & 1 \\\\ 1 & -1 & 2 \\end{pmatrix}$$\n1. Calculer le polynôme caractéristique $\\chi_A(X)$ de $A$ et déterminer ses valeurs propres.\n2. Déterminer les sous-espaces propres associés et étudier si $A$ est diagonalisable dans $\\mathcal{M}_3(\\mathbb{R})$.\n3. Réduire $A$ (diagonalisation ou trigonalisation) et exprimer $A^n$ pour tout $n \\in \\mathbb{N}$.`,
        },
        {
          label: "Partiel Analyse L1/L2 — Développements limités, Séries & Intégrales impropres",
          statement: `1. Déterminer le développement limité à l'ordre $4$ au voisinage de $0$ de $f(x) = \\frac{\\ln(1 + x)}{\\cos(x)}$ et en déduire $\\lim_{x \\to 0} \\frac{f(x) - x + \\frac{x^2}{2}}{x^3}$.\n2. Étudier la convergence et calculer la valeur exacte de l'intégrale généralisée $$I = \\int_0^{+\\infty} \\frac{\\ln(1 + t^2)}{1 + t^2}\\,\\mathrm{d}t$$`,
        },
      ],
      revisionTopics: [
        "Suites numériques, développements limités de Taylor-Young et équivalents",
        "Espaces vectoriels, applications linéaires, déterminants et diagonalisation",
        "Séries numériques, séries entières et intégrales généralisées",
        "Espaces probabilisés, lois continues usuelles et théorème central limite",
      ],
    };
  }

  // --- CAS ENSEIGNEMENT SECONDAIRE (COLLÈGE & LYCÉE : 6ème à Terminale) ---
  const isCollege = ["6ème", "5ème", "4ème", "3ème"].includes(profile.gradeLevel || "");

  if (nameLower.includes("math")) {
    if (isCollege) {
      return {
        sampleExams: [
          {
            label: "Sujet type BEPC — Géométrie (Pythagore, Thalès & Trigonométrie)",
            statement: `Soit un triangle $ABC$ rectangle en $A$ tel que $AB = 6\\text{ cm}$ et $AC = 8\\text{ cm}$.\n1. Calculer la longueur $BC$.\n2. Soit $M \\in [AB]$ tel que $AM = 4{,}5\\text{ cm}$. La parallèle à $(BC)$ passant par $M$ coupe $[AC]$ en $N$. Calculer $AN$ et $MN$.\n3. Calculer $\\cos(\\widehat{ABC})$ et en déduire la mesure de l'angle au degré près.`,
          },
          {
            label: "Algèbre — Calcul littéral, factorisation et équations",
            statement: `On donne le polynôme $P(x) = (2x - 3)^2 - (2x - 3)(x + 4)$.\n1. Développer, réduire et ordonner $P(x)$ suivant les puissances décroissantes de $x$.\n2. Factoriser $P(x)$ puis résoudre dans $\\mathbb{R}$ l'équation $(2x - 3)(x - 7) = 0$.`,
          },
        ],
        revisionTopics: [
          "Propriétés de Thalès, théorème de Pythagore et trigonométrie",
          "Calcul littéral, factorisation, équations et inéquations dans R",
          "Applications affines, vecteurs et repérage dans le plan",
          "Statistique descriptive et géométrie dans l'espace (cône, pyramide)",
        ],
      };
    }
    return {
      sampleExams: [
        {
          label: "Sujet type Bac C / D — Fonction exponentielle, limites & calcul intégral",
          statement: `Soit $f$ la fonction définie sur $\\mathbb{R}$ par $f(x) = (2x + 1)e^{-x}$ et $(\\mathcal{C}_f)$ sa courbe représentative dans un repère orthonormé $(O; \\vec{i}, \\vec{j})$.\n1. Étudier les limites de $f$ en $-\\infty$ et $+\\infty$, ainsi que les branches infinies.\n2. Calculer $f'(x)$, étudier son signe et dresser le tableau de variations de $f$.\n3. À l'aide d'une intégration par parties, calculer l'aire du domaine délimité par $(\\mathcal{C}_f)$, l'axe des abscisses et les droites $x = 0$ et $x = 1$.`,
        },
        {
          label: "Nombres complexes, similitudes & probabilités",
          statement: `Dans le plan complexe muni d'un repère orthonormé direct $(O; \\vec{u}, \\vec{v})$, on donne les points $A$, $B$ et $C$ d'affixes respectives $z_A = 1 + i\\sqrt{3}$, $z_B = 2i$ et $z_C = -1 + i\\sqrt{3}$.\n1. Écrire $z_A$ et $z_B$ sous forme trigonométrique et exponentielle.\n2. Calculer le rapport $\\frac{z_C - z_B}{z_A - z_B}$ et en déduire la nature exacte du triangle $ABC$.`,
        },
      ],
      revisionTopics: [
        "Fonctions logarithme népérien, exponentielle et calcul intégral",
        "Nombres complexes et transformations du plan",
        "Suites numériques et dénombrement / probabilités",
        "Géométrie dans l'espace et équations différentielles linéaires",
      ],
    };
  }

  if (nameLower.includes("pct") || nameLower.includes("physique")) {
    return {
      sampleExams: [
        {
          label: "PCT — Dynamique du projectile dans le champ de pesanteur",
          statement: `Un solide ponctuel de masse $m = 200\\text{ g}$ est lancé depuis un point $O$ avec une vitesse initiale $\\vec{v}_0$ de valeur $v_0 = 15\\text{ m}\\cdot\\text{s}^{-1}$ faisant un angle $\\alpha = 30^\\circ$ avec l'horizontale ($g = 9{,}8\\text{ m}\\cdot\\text{s}^{-2}$).\n1. Établir les équations horaires du mouvement et l'équation cartésienne de la trajectoire.\n2. Calculer l'altitude maximale atteinte (flèche) et la portée horizontale du tir.`,
        },
        {
          label: "Chimie — Dosage acido-basique et pH des solutions aqueuses",
          statement: `On dose $V_a = 20\\text{ mL}$ d'une solution d'acide carboxylique $R\\text{-COOH}$ de concentration $C_a$ par une solution d'hydroxyde de sodium de concentration $C_b = 0{,}05\\text{ mol}\\cdot\\text{L}^{-1}$. L'équivalence est obtenue pour $V_{bE} = 16\\text{ mL}$.\n1. Écrire l'équation-bilan de la réaction de dosage et calculer $C_a$.\n2. À la demi-équivalence, le pH vaut $4{,}2$. En déduire le $\\text{p}K_a$ du couple acide/base.`,
        },
      ],
      revisionTopics: [
        "Cinématique, théorème du centre d'inertie et énergie mécanique",
        "Champs électrostatique et magnétique, induction et dipôles RLC",
        "Acides et bases en solution aqueuse, cinétique chimique et alcools/amines",
        "Ondes mécaniques, radioactivité et réactions nucléaires",
      ],
    };
  }

  if (nameLower.includes("svt")) {
    return {
      sampleExams: [
        {
          label: "SVT — Génétique formelle (Dihybridisme & Brassage chromosomique)",
          statement: `On croise deux lignées pures de drosophiles : l'une à ailes longues et corps gris, l'autre à ailes vestigiales et corps ébène. En $F_1$, tous les individus ont les ailes longues et le corps gris.\n1. Interpréter ce résultat et préciser la dominance des allèles.\n2. Un croisement-test d'une femelle $F_1$ avec un mâle double récessif donne : $41{,}5\\%$ [ailes longues, corps gris], $41{,}5\\%$ [ailes vestigiales, corps ébène], $8{,}5\\%$ [ailes longues, corps ébène] et $8{,}5\\%$ [ailes vestigiales, corps gris]. Démontrer si les gènes sont liés ou indépendants et expliquer par schémas le phénomène cytologique impliqué.`,
        },
      ],
      revisionTopics: [
        "Information génétique, synthèse des protéines et brassages méiotiques",
        "Physiologie nerveuse, contraction musculaire et régulation glycémique",
        "Immunologie : réponse immunitaire spécifique et dysfonctionnements (VIH)",
        "Reproduction humaine et mécanismes hormonaux",
      ],
    };
  }

  return {
    sampleExams: [
      {
        label: "Dissertation — Décolonisation en Afrique et affirmation des États",
        statement: `Sujet : « Les facteurs internes et externes de l'accession à l'indépendance des colonies d'Afrique noire francophone entre 1945 et 1960. »\nRédigez une introduction complète (contexte, problématique, annonce du plan), un développement structuré et une conclusion.`,
      },
    ],
    revisionTopics: [
      "Méthodologie de la dissertation et du commentaire de document",
      "Relations internationales de 1945 à nos jours et décolonisation africaine",
      "Géographie économique de la République du Bénin et de l'espace CEDEAO/UEMOA",
      "Mondialisation et grands pôles économiques mondiaux",
    ],
  };
}
