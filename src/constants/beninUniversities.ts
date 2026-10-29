import { AcademicDomainPole, SubjectSpace } from "../types/academic";

export interface BeninUniversityProgram {
  id: string;
  facultyCode: string;
  facultyFullName: string;
  filiereName: string;
  domainPole: AcademicDomainPole;
  description: string;
  subjects: SubjectSpace[];
}

export interface BeninUniversity {
  id: string;
  shortName: string;
  fullName: string;
  cities: string;
  type: "PUBLIQUE" | "PRIVEE_AGREEE";
  programs: BeninUniversityProgram[];
}

/**
 * Référentiel complet des universités nationales publiques et établissements privés agréés (EPES)
 * de la République du Bénin (UAC, UP, UNSTIM, UNA, UCAO, Pigier, ESGIS, HECM, Les Cours Sonou, EPITECH)
 * avec leurs facultés/écoles et les Unités d'Enseignement (matières) strictement rattachées à chaque filière.
 */
export const BENIN_UNIVERSITIES: BeninUniversity[] = [
  {
    id: "uac",
    shortName: "UAC",
    fullName: "Université d'Abomey-Calavi",
    cities: "Abomey-Calavi · Cotonou · Dangbo · Porto-Novo",
    type: "PUBLIQUE",
    programs: [
      {
        id: "uac-fast-mia",
        facultyCode: "FAST",
        facultyFullName: "Faculté des Sciences et Techniques",
        filiereName: "MIA — Mathématiques et Informatique Appliquées",
        domainPole: "MIA_INFO",
        description:
          "Tronc commun et spécialisation combinant mathématiques pures/appliquées, algorithmique et informatique scientifique.",
        subjects: [
          {
            id: "ue-analyse-math",
            name: "Analyse Mathématique",
            shortCode: "ANA",
            domainSubtitle:
              "Suites, séries, calcul différentiel, intégrales et équations différentielles",
            domainPole: "MIA_INFO",
          },
          {
            id: "ue-algebre",
            name: "Algèbre Linéaire & Générale",
            shortCode: "ALG",
            domainSubtitle:
              "Espaces vectoriels, matrices, réduction des endomorphismes et structures",
            domainPole: "MIA_INFO",
          },
          {
            id: "ue-algo-prog",
            name: "Algorithmique & Programmation",
            shortCode: "ALGO",
            domainSubtitle:
              "Structures de données, complexité, langage C, Python et bases de données",
            domainPole: "MIA_INFO",
          },
          {
            id: "ue-proba-stat",
            name: "Probabilités & Statistique",
            shortCode: "PROB",
            domainSubtitle:
              "Calcul des probabilités, variables aléatoires, estimation et recherche opérationnelle",
            domainPole: "MIA_INFO",
          },
          {
            id: "ue-physique-mia",
            name: "Physique & Mécanique (MIA)",
            shortCode: "PHYS",
            domainSubtitle: "Mécanique du point, électrocinétique et optique géométrique pour MIA",
            domainPole: "PHYSIQUE_CHIMIE",
          },
        ],
      },
      {
        id: "uac-fast-pc",
        facultyCode: "FAST",
        facultyFullName: "Faculté des Sciences et Techniques",
        filiereName: "PC — Physique-Chimie (Sciences Physiques & Chimiques)",
        domainPole: "PHYSIQUE_CHIMIE",
        description:
          "Formation fondamentale en physique mécanique, électromagnétisme, thermodynamique et chimie générale/organique.",
        subjects: [
          {
            id: "ue-mecanique-phys",
            name: "Mécanique du Point & du Solide",
            shortCode: "MECA",
            domainSubtitle:
              "Cinématique, dynamique newtonienne, oscillateurs et mécanique analytique",
            domainPole: "PHYSIQUE_CHIMIE",
          },
          {
            id: "ue-electromag",
            name: "Électromagnétisme & Optique",
            shortCode: "EMAG",
            domainSubtitle:
              "Électrostatique, magnétostatique, équations de Maxwell, électrocinétique et optique",
            domainPole: "PHYSIQUE_CHIMIE",
          },
          {
            id: "ue-thermo-quant",
            name: "Thermodynamique & Physique Quantique",
            shortCode: "THERM",
            domainSubtitle:
              "Principes thermodynamiques, transferts thermiques, physique atomique et quantique",
            domainPole: "PHYSIQUE_CHIMIE",
          },
          {
            id: "ue-chimie-gen-orga",
            name: "Chimie Générale & Organique",
            shortCode: "CHIM",
            domainSubtitle:
              "Atomistique, thermochimie, cinétique, chimie des solutions et mécanismes organiques",
            domainPole: "PHYSIQUE_CHIMIE",
          },
          {
            id: "ue-math-phys",
            name: "Mathématiques pour la Physique",
            shortCode: "MPHY",
            domainSubtitle:
              "Analyse vectorielle, opérateurs différentiels, séries de Fourier et matrices",
            domainPole: "MIA_INFO",
          },
        ],
      },
      {
        id: "uac-faseg-eco",
        facultyCode: "FASEG",
        facultyFullName: "Faculté des Sciences Économiques et de Gestion",
        filiereName: "Sciences Économiques (Analyse & Politique Économiques)",
        domainPole: "ECO_GESTION_FASEG",
        description:
          "Analyse micro et macroéconomique, économétrie, mathématiques appliquées à l'économie et développement (espace UEMOA).",
        subjects: [
          {
            id: "ue-microeconomie",
            name: "Microéconomie",
            shortCode: "MICRO",
            domainSubtitle:
              "Théorie du consommateur, du producteur, équilibre général et concurrence",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "ue-macroeconomie",
            name: "Macroéconomie & Comptabilité Nationale",
            shortCode: "MACRO",
            domainSubtitle:
              "Modèle IS-LM, politiques monétaires BCEAO/budgétaires, croissance et agrégats",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "ue-stat-econometrie",
            name: "Statistique & Économétrie",
            shortCode: "ECTR",
            domainSubtitle:
              "Statistique descriptive/inférentielle, régression linéaire MCO et tests d'hypothèses",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "ue-math-eco",
            name: "Mathématiques pour Économistes",
            shortCode: "MECO",
            domainSubtitle:
              "Optimisation sous contrainte (Lagrange), algèbre matricielle et mathématiques financières",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "ue-compta-gen",
            name: "Comptabilité Générale SYSCOHADA",
            shortCode: "COMPT",
            domainSubtitle:
              "Opérations courantes, amortissements, provisions et états financiers OHADA",
            domainPole: "ECO_GESTION_FASEG",
          },
        ],
      },
      {
        id: "uac-faseg-gestion",
        facultyCode: "FASEG",
        facultyFullName: "Faculté des Sciences Économiques et de Gestion",
        filiereName: "Sciences de Gestion (Finance, Comptabilité, Marketing, GRH)",
        domainPole: "ECO_GESTION_FASEG",
        description:
          "Comptabilité SYSCOHADA révisé, analyse financière, contrôle de gestion, fiscalité béninoise et management.",
        subjects: [
          {
            id: "ue-compta-syscohada",
            name: "Comptabilité Financière SYSCOHADA",
            shortCode: "SYSCO",
            domainSubtitle:
              "Comptabilité générale, comptabilité des sociétés et travaux de fin d'exercice",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "ue-compta-analytique",
            name: "Comptabilité Analytique & Contrôle de Gestion",
            shortCode: "CACG",
            domainSubtitle:
              "Coûts complets, coûts partiels, seuil de rentabilité et gestion budgétaire",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "ue-analyse-fin",
            name: "Gestion Financière & Maths Financières",
            shortCode: "FIN",
            domainSubtitle:
              "Diagnostic financier, VAN/TRI, annuités, emprunts indivis et choix d'investissement",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "ue-droit-fiscalite",
            name: "Fiscalité & Droit des Affaires OHADA",
            shortCode: "OHADA",
            domainSubtitle:
              "Impôts au Bénin (TVA, IS, IBA), actes uniformes OHADA et droit du travail",
            domainPole: "DROIT_ADMIN",
          },
          {
            id: "ue-stat-ro-gestion",
            name: "Statistique & Recherche Opérationnelle",
            shortCode: "RO",
            domainSubtitle:
              "Programmation linéaire, graphes PERT/ordonnancement et probabilités de gestion",
            domainPole: "ECO_GESTION_FASEG",
          },
        ],
      },
      {
        id: "uac-ifri",
        facultyCode: "IFRI",
        facultyFullName: "Institut de Formation et de Recherche en Informatique",
        filiereName: "Génie Logiciel, Sécurité Informatique, IA & Internet/Multimédia",
        domainPole: "MIA_INFO",
        description:
          "Ingénierie logicielle, cybersécurité, architecture réseaux, intelligence artificielle et systèmes d'information.",
        subjects: [
          {
            id: "ue-ifri-algo",
            name: "Algorithmique & Génie Logiciel",
            shortCode: "GL",
            domainSubtitle:
              "POO (Java/C++/Python), structures de données avancées, UML et design patterns",
            domainPole: "MIA_INFO",
          },
          {
            id: "ue-ifri-bdd",
            name: "Bases de Données & Systèmes d'Information",
            shortCode: "BDD",
            domainSubtitle:
              "Modélisation relationnelle, algèbre relationnelle, SQL/PL-SQL et NoSQL",
            domainPole: "MIA_INFO",
          },
          {
            id: "ue-ifri-reseaux",
            name: "Réseaux, Systèmes Linux & Cybersécurité",
            shortCode: "SEC",
            domainSubtitle:
              "Modèle OSI/TCP-IP, routage, administration système, cryptographie et sécurité",
            domainPole: "MIA_INFO",
          },
          {
            id: "ue-ifri-math",
            name: "Mathématiques Discrètes & Logique",
            shortCode: "MDISC",
            domainSubtitle:
              "Théorie des graphes, arithmétique modulaire, algèbre linéaire et probabilités",
            domainPole: "MIA_INFO",
          },
        ],
      },
      {
        id: "uac-epac",
        facultyCode: "EPAC",
        facultyFullName: "École Polytechnique d'Abomey-Calavi",
        filiereName:
          "Génie Civil, Génie Électrique, Génie Mécanique, Informatique & Télécoms, Génie Chimique-Bio",
        domainPole: "INGENIERIE_POLYTECH",
        description:
          "Formation d'ingénieurs et d'analystes technologues dans les filières industrielles, civiles et biologiques.",
        subjects: [
          {
            id: "ue-epac-rdm",
            name: "Résistance des Matériaux (RDM) & Structures",
            shortCode: "RDM",
            domainSubtitle:
              "Torseurs d'efforts, flexion, torsion, béton armé et mécanique des milieux continus",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "ue-epac-elec",
            name: "Électrotechnique, Électronique & Automatique",
            shortCode: "ELEC",
            domainSubtitle:
              "Circuits triphasés, machines électriques, asservissements et traitement du signal",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "ue-epac-thermo",
            name: "Thermodynamique & Mécanique des Fluides",
            shortCode: "FLUID",
            domainSubtitle:
              "Écoulements, théorème de Bernoulli, pertes de charge et machines thermiques",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "ue-epac-math",
            name: "Mathématiques de l'Ingénieur",
            shortCode: "MING",
            domainSubtitle:
              "Transformées de Laplace/Fourier, équations aux dérivées partielles et analyse numérique",
            domainPole: "MIA_INFO",
          },
        ],
      },
      {
        id: "uac-eneam",
        facultyCode: "ENEAM",
        facultyFullName: "École Nationale d'Économie Appliquée et de Management",
        filiereName:
          "Statistique, Planification, Banque-Finance, Comptabilité, Transport-Logistique & IG",
        domainPole: "ECO_GESTION_FASEG",
        description:
          "Filières professionnalisantes en gestion financière, statistique appliquée, informatique de gestion et logistique.",
        subjects: [
          {
            id: "ue-eneam-compta",
            name: "Comptabilité & Audit SYSCOHADA",
            shortCode: "AUDIT",
            domainSubtitle:
              "États financiers SYSCOHADA, comptabilité des sociétés et contrôle interne",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "ue-eneam-banque",
            name: "Finance d'Entreprise, Banque & Assurance",
            shortCode: "BANQ",
            domainSubtitle:
              "Mathématiques financières, techniques bancaires, analyse du risque crédit et actuariat",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "ue-eneam-stat",
            name: "Statistique Appliquée & Planification",
            shortCode: "STAT",
            domainSubtitle:
              "Théorie des sondages, indices statistiques, économétrie et évaluation de projets",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "ue-eneam-ro",
            name: "Recherche Opérationnelle & Logistique",
            shortCode: "LOG",
            domainSubtitle:
              "Gestion des stocks, programmation linéaire Simplexe et chaînes d'approvisionnement",
            domainPole: "ECO_GESTION_FASEG",
          },
        ],
      },
      {
        id: "uac-fast-cbg",
        facultyCode: "FAST",
        facultyFullName: "Faculté des Sciences et Techniques",
        filiereName: "SVT / CBG / BBM — Biologie, Biochimie, Microbiologie & Géologie",
        domainPole: "SANTE_BIO",
        description:
          "Sciences de la vie et de la terre, biochimie-biologie moléculaire (BBM), physiologie et géosciences.",
        subjects: [
          {
            id: "ue-bio-cell",
            name: "Biologie Cellulaire, Moléculaire & Génétique",
            shortCode: "BIOC",
            domainSubtitle: "Réplication, transcription, génétique mendélienne et formelle",
            domainPole: "SANTE_BIO",
          },
          {
            id: "ue-biochimie",
            name: "Biochimie Structurale & Métabolique",
            shortCode: "BCHM",
            domainSubtitle:
              "Glucides, lipides, protéines, enzymologie Michaelis-Menten et bioénergétique",
            domainPole: "SANTE_BIO",
          },
          {
            id: "ue-chimie-bio",
            name: "Chimie Organique & Analytique",
            shortCode: "CORG",
            domainSubtitle:
              "Stéréochimie, réactivité des fonctions organiques et équilibres en solution",
            domainPole: "PHYSIQUE_CHIMIE",
          },
          {
            id: "ue-microbio-geol",
            name: "Microbiologie, Physiologie & Géologie",
            shortCode: "SVT",
            domainSubtitle:
              "Bactériologie, immunologie, physiologie animale/végétale et géodynamique",
            domainPole: "SANTE_BIO",
          },
        ],
      },
      {
        id: "uac-fss",
        facultyCode: "FSS",
        facultyFullName: "Faculté des Sciences de la Santé (Cotonou)",
        filiereName: "Médecine Générale, Pharmacie, Kinésithérapie & Sciences Biomédicales",
        domainPole: "SANTE_BIO",
        description:
          "Études médicales, pharmaceutiques et paramédicales : anatomie, biophysique, biochimie et sémiologie.",
        subjects: [
          {
            id: "ue-fss-anat",
            name: "Anatomie, Histologie & Physiologie",
            shortCode: "ANAT",
            domainSubtitle:
              "Anatomie descriptive/fonctionnelle, physiologie cardiovasculaire, rénale et nerveuse",
            domainPole: "SANTE_BIO",
          },
          {
            id: "ue-fss-biophys",
            name: "Biophysique & Biochimie Médicale",
            shortCode: "BPHY",
            domainSubtitle:
              "Équilibre acido-basique, hémodynamique, rayonnements ionisants et métabolisme",
            domainPole: "SANTE_BIO",
          },
          {
            id: "ue-fss-pharma",
            name: "Pharmacologie, Microbiologie & Sémiologie",
            shortCode: "PHAR",
            domainSubtitle:
              "Pharmacocinétique, bactériologie-virologie, parasitologie et raisonnement clinique",
            domainPole: "SANTE_BIO",
          },
          {
            id: "ue-fss-biostat",
            name: "Biostatistique & Santé Publique",
            shortCode: "BSTAT",
            domainSubtitle:
              "Tests statistiques médicaux, indicateurs épidémiologiques et essais cliniques",
            domainPole: "SANTE_BIO",
          },
        ],
      },
      {
        id: "uac-fadesp-ena",
        facultyCode: "FADESP / ENA",
        facultyFullName:
          "Faculté de Droit et de Science Politique & École Nationale d'Administration",
        filiereName: "Droit Privé, Droit Public, Sciences Politiques, Diplomatie & Magistrature",
        domainPole: "DROIT_ADMIN",
        description:
          "Méthodologie juridique (cas pratique, commentaire d'arrêt, dissertation), droit béninois et droit OHADA.",
        subjects: [
          {
            id: "ue-droit-civil",
            name: "Droit Civil & Droit des Obligations",
            shortCode: "CIVIL",
            domainSubtitle:
              "Droit des personnes, famille, contrats, responsabilité civile et sûretés",
            domainPole: "DROIT_ADMIN",
          },
          {
            id: "ue-droit-public",
            name: "Droit Constitutionnel & Administratif",
            shortCode: "PUBL",
            domainSubtitle:
              "Régimes politiques, Constitution du Bénin, contentieux administratif et finances publiques",
            domainPole: "DROIT_ADMIN",
          },
          {
            id: "ue-droit-ohada",
            name: "Droit Commercial & Sociétés OHADA",
            shortCode: "OHADA",
            domainSubtitle:
              "Actes uniformes OHADA, droit commercial général, sociétés et procédures collectives",
            domainPole: "DROIT_ADMIN",
          },
          {
            id: "ue-droit-penal",
            name: "Droit Pénal & Science Politique",
            shortCode: "PENAL",
            domainSubtitle:
              "Droit pénal général/spécial, procédure pénale et relations internationales",
            domainPole: "DROIT_ADMIN",
          },
        ],
      },
      {
        id: "uac-fsa-ine",
        facultyCode: "FSA / INE",
        facultyFullName: "Faculté des Sciences Agronomiques & Institut National de l'Eau",
        filiereName: "Sciences Agronomiques, Agroalimentaire, Hydrologie & Génie de l'Eau",
        domainPole: "AGRO_EAU",
        description:
          "Ingénierie agronomique, production végétale/animale, gestion des eaux, assainissement et biométrie.",
        subjects: [
          {
            id: "ue-fsa-agro",
            name: "Agronomie, Pédologie & Physiologie Végétale",
            shortCode: "AGRO",
            domainSubtitle:
              "Sciences du sol, nutrition minérale, phytotechnie et amélioration génétique",
            domainPole: "AGRO_EAU",
          },
          {
            id: "ue-ine-hydro",
            name: "Hydraulique, Hydrologie & Assainissement",
            shortCode: "HYDR",
            domainSubtitle:
              "Mécanique des fluides, écoulements à surface libre, hydrogéologie et traitement des eaux",
            domainPole: "AGRO_EAU",
          },
          {
            id: "ue-fsa-biochim",
            name: "Biochimie & Technologie Alimentaire",
            shortCode: "TECH",
            domainSubtitle:
              "Conservation, microbiologie alimentaire, chimie analytique et nutrition",
            domainPole: "SANTE_BIO",
          },
          {
            id: "ue-fsa-biometrie",
            name: "Biométrie, Statistique & Économie Rurale",
            shortCode: "BIOM",
            domainSubtitle:
              "Plans d'expériences agricoles (ANOVA), régression et gestion des exploitations",
            domainPole: "AGRO_EAU",
          },
        ],
      },
      {
        id: "uac-imsp",
        facultyCode: "IMSP Dangbo",
        facultyFullName: "Institut de Mathématiques et de Sciences Physiques",
        filiereName:
          "Classes Préparatoires (MPSI), Mathématiques Pures, Physique Théorique & Data Science",
        domainPole: "MIA_INFO",
        description:
          "Pôle d'excellence régional en classes préparatoires scientifiques, mathématiques fondamentales et physique théorique.",
        subjects: [
          {
            id: "ue-imsp-algebre",
            name: "Algèbre Supérieure & Topologie",
            shortCode: "TOPO",
            domainSubtitle:
              "Groupes, anneaux, espaces métriques/normés, compacité et algèbre bilinéaire",
            domainPole: "MIA_INFO",
          },
          {
            id: "ue-imsp-analyse",
            name: "Analyse Fonctionnelle & EDP",
            shortCode: "EDP",
            domainSubtitle:
              "Intégration de Lebesgue, espaces de Hilbert, séries entières et calcul différentiel",
            domainPole: "MIA_INFO",
          },
          {
            id: "ue-imsp-phys",
            name: "Physique Théorique & Mécanique Analytique",
            shortCode: "PTH",
            domainSubtitle:
              "Lagrangien, Hamiltonien, électrodynamique classique, relativité et mécanique quantique",
            domainPole: "PHYSIQUE_CHIMIE",
          },
          {
            id: "ue-imsp-info",
            name: "Calcul Scientifique & Apprentissage Statistique",
            shortCode: "DATA",
            domainSubtitle:
              "Analyse numérique, Python scientifique, optimisation convexe et probabilités",
            domainPole: "MIA_INFO",
          },
        ],
      },
      {
        id: "uac-fllac-fashs",
        facultyCode: "FLLAC / FASHS / ENSTIC",
        facultyFullName: "Lettres, Langues, Sciences Humaines, Géographie & Journalisme",
        filiereName:
          "Géographie (DGAT), Histoire, Sociologie, Psychologie, Lettres, Anglais & Communication",
        domainPole: "LETTRES_HUMAINES",
        description:
          "Sciences humaines et sociales, aménagement du territoire, études littéraires, linguistique et médias.",
        subjects: [
          {
            id: "ue-fashs-geo",
            name: "Géographie, SIG & Aménagement du Territoire",
            shortCode: "DGAT",
            domainSubtitle:
              "Géomorphologie, climatologie, géographie urbaine/rurale et cartographie",
            domainPole: "LETTRES_HUMAINES",
          },
          {
            id: "ue-fashs-socio",
            name: "Sociologie, Anthropologie & Méthodologie",
            shortCode: "SOCIO",
            domainSubtitle:
              "Enquêtes quantitatives/qualitatives, théories sociologiques et psychologie sociale",
            domainPole: "LETTRES_HUMAINES",
          },
          {
            id: "ue-fllac-lettres",
            name: "Lettres, Linguistique & Communication (ENSTIC)",
            shortCode: "LITT",
            domainSubtitle:
              "Analyse littéraire, phonétique/syntaxe, sémiologie et rédaction journalistique",
            domainPole: "LETTRES_HUMAINES",
          },
          {
            id: "ue-fashs-hist",
            name: "Histoire Africaine & Relations Internationales",
            shortCode: "HIST",
            domainSubtitle:
              "Histoire précoloniale/contemporaine, épistémologie et géopolitique ouest-africaine",
            domainPole: "LETTRES_HUMAINES",
          },
        ],
      },
    ],
  },
  {
    id: "up",
    shortName: "UP Parakou",
    fullName: "Université de Parakou",
    cities: "Parakou · Tchaourou",
    type: "PUBLIQUE",
    programs: [
      {
        id: "up-faseg",
        facultyCode: "FASEG-UP",
        facultyFullName: "Faculté des Sciences Économiques et de Gestion (Parakou)",
        filiereName: "Analyse Économique, Économie Agricole, Finance-Comptabilité & Gestion",
        domainPole: "ECO_GESTION_FASEG",
        description:
          "Formation en sciences économiques et de gestion adaptée aux enjeux économiques et financiers ouest-africains.",
        subjects: [
          {
            id: "up-micro",
            name: "Microéconomie & Macroéconomie",
            shortCode: "ECO",
            domainSubtitle:
              "Équilibre des marchés, politiques macroéconomiques et économie du développement",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "up-compta",
            name: "Comptabilité SYSCOHADA & Analyse Financière",
            shortCode: "COMPT",
            domainSubtitle:
              "Comptabilité générale, analytique, gestion budgétaire et diagnostic financier",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "up-quant",
            name: "Mathématiques, Statistique & Économétrie",
            shortCode: "QUANT",
            domainSubtitle:
              "Algèbre, optimisation, probabilités, régression linéaire et mathématiques financières",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "up-droit-fisc",
            name: "Fiscalité & Droit des Affaires OHADA",
            shortCode: "FISC",
            domainSubtitle: "Droit commercial OHADA, fiscalité des entreprises et management",
            domainPole: "DROIT_ADMIN",
          },
        ],
      },
      {
        id: "up-iut",
        facultyCode: "IUT Parakou",
        facultyFullName: "Institut Universitaire de Technologie de Parakou",
        filiereName:
          "Informatique de Gestion (IG), Gestion des Banques (GB), Gestion Commerciale (GC) & GE",
        domainPole: "MIA_INFO",
        description:
          "Licences et Masters professionnels combinant informatique appliquée, systèmes d'information, banque et gestion.",
        subjects: [
          {
            id: "up-iut-ig",
            name: "Algorithmique, Programmation & Bases de Données",
            shortCode: "INFO",
            domainSubtitle: "Merise/UML, SQL, développement d'applications et architecture réseau",
            domainPole: "MIA_INFO",
          },
          {
            id: "up-iut-compta",
            name: "Comptabilité Générale & des Sociétés SYSCOHADA",
            shortCode: "SYSCO",
            domainSubtitle:
              "Opérations comptables, amortissements, bilan et comptabilité analytique",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "up-iut-banque",
            name: "Techniques Bancaires & Maths Financières",
            shortCode: "BANQ",
            domainSubtitle:
              "Intérêts composés, escompte, crédits bancaires, rentabilité et gestion financière",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "up-iut-ro",
            name: "Statistique & Recherche Opérationnelle",
            shortCode: "STAT",
            domainSubtitle:
              "Statistique descriptive, probabilités, graphes et programmation linéaire",
            domainPole: "MIA_INFO",
          },
        ],
      },
      {
        id: "up-enspd",
        facultyCode: "ENSPD",
        facultyFullName: "École Nationale de Statistique, de Planification et de Démographie",
        filiereName: "Statistique Appliquée, Planification du Développement & Démographie",
        domainPole: "MIA_INFO",
        description:
          "Ingénierie statistique, analyse démographique, économétrie et modélisation quantitative.",
        subjects: [
          {
            id: "enspd-proba",
            name: "Probabilités & Statistique Mathématique",
            shortCode: "STAT",
            domainSubtitle:
              "Lois de probabilité, estimation, tests paramétriques/non-paramétriques et sondages",
            domainPole: "MIA_INFO",
          },
          {
            id: "enspd-demo",
            name: "Analyse Démographique & Séries Temporelles",
            shortCode: "DEMO",
            domainSubtitle:
              "Tables de mortalité, fécondité, diagramme de Lexis, projections et économétrie",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "enspd-math",
            name: "Analyse & Algèbre Matricielle",
            shortCode: "MATH",
            domainSubtitle:
              "Calcul matriciel, réduction, intégrales multiples et analyse numérique sous R/Python",
            domainPole: "MIA_INFO",
          },
          {
            id: "enspd-plan",
            name: "Macroéconomie & Planification de Projets",
            shortCode: "PLAN",
            domainSubtitle: "Comptabilité nationale, suivi-évaluation et planification économique",
            domainPole: "ECO_GESTION_FASEG",
          },
        ],
      },
      {
        id: "up-fm-ifsio-enatse",
        facultyCode: "FM / IFSIO / ENATSE",
        facultyFullName: "Faculté de Médecine, Soins Infirmiers/Obstétricaux & Santé Publique",
        filiereName:
          "Médecine Humaine, Soins Infirmiers, Obstétrique & Surveillance Épidémiologique",
        domainPole: "SANTE_BIO",
        description: "Sciences médicales, cliniques, infirmières et surveillance épidémiologique.",
        subjects: [
          {
            id: "up-med-anat",
            name: "Anatomie, Physiologie & Sémiologie",
            shortCode: "MED",
            domainSubtitle: "Physiologie des grandes fonctions, anatomie clinique et pathologies",
            domainPole: "SANTE_BIO",
          },
          {
            id: "up-med-bio",
            name: "Biochimie, Biophysique & Microbiologie",
            shortCode: "BIOM",
            domainSubtitle:
              "Enzymologie, équilibre hydro-électrolytique, bactériologie et parasitologie",
            domainPole: "SANTE_BIO",
          },
          {
            id: "up-med-epidemio",
            name: "Épidémiologie & Biostatistique (ENATSE)",
            shortCode: "EPID",
            domainSubtitle:
              "Taux d'incidence/prévalence, risque relatif, odds ratio et enquêtes sanitaires",
            domainPole: "SANTE_BIO",
          },
        ],
      },
      {
        id: "up-fa",
        facultyCode: "FA Parakou",
        facultyFullName: "Faculté d'Agronomie de Parakou",
        filiereName: "Production Végétale, Production Animale, Forêts & Économie/Sociologie Rurale",
        domainPole: "AGRO_EAU",
        description:
          "Sciences agronomiques tropicales, zootechnie, gestion des ressources naturelles et agroéconomie.",
        subjects: [
          {
            id: "up-fa-phyto",
            name: "Agronomie, Pédologie & Phytotechnie",
            shortCode: "AGRO",
            domainSubtitle:
              "Fertilité des sols, physiologie végétale, protection des cultures et sylviculture",
            domainPole: "AGRO_EAU",
          },
          {
            id: "up-fa-zoo",
            name: "Zootechnie, Génétique & Biochimie",
            shortCode: "ZOO",
            domainSubtitle: "Alimentation animale, amélioration génétique et chimie du vivant",
            domainPole: "SANTE_BIO",
          },
          {
            id: "up-fa-biom",
            name: "Biométrie, Statistique & Économie Rurale",
            shortCode: "BIOM",
            domainSubtitle:
              "Expérimentation agricole, statistique appliquée et gestion d'exploitation",
            domainPole: "AGRO_EAU",
          },
        ],
      },
      {
        id: "up-fdsp",
        facultyCode: "FDSP Parakou",
        facultyFullName: "Faculté de Droit et de Science Politique",
        filiereName: "Droit Privé, Droit Public & Science Politique",
        domainPole: "DROIT_ADMIN",
        description: "Formation juridique et politiste fondamentale.",
        subjects: [
          {
            id: "up-droit-priv",
            name: "Droit Civil & Droit des Affaires OHADA",
            shortCode: "PRIV",
            domainSubtitle:
              "Obligations, contrats, responsabilité civile et droit commercial OHADA",
            domainPole: "DROIT_ADMIN",
          },
          {
            id: "up-droit-pub",
            name: "Droit Constitutionnel & Administratif",
            shortCode: "PUBL",
            domainSubtitle:
              "Théorie de l'État, action administrative, finances publiques et relations internationales",
            domainPole: "DROIT_ADMIN",
          },
          {
            id: "up-droit-penal",
            name: "Droit Pénal & Méthodologie Juridique",
            shortCode: "METH",
            domainSubtitle:
              "Commentaire d'arrêt, cas pratique, dissertation juridique et procédure",
            domainPole: "DROIT_ADMIN",
          },
        ],
      },
      {
        id: "up-flash",
        facultyCode: "FLASH Parakou",
        facultyFullName: "Faculté des Lettres, Arts et Sciences Humaines",
        filiereName: "Géographie, Sociologie-Anthropologie, Lettres Modernes, Anglais & Espagnol",
        domainPole: "LETTRES_HUMAINES",
        description: "Sciences humaines, aménagement régional, langues et littératures.",
        subjects: [
          {
            id: "up-flash-geo",
            name: "Géographie & Aménagement du Territoire",
            shortCode: "GEO",
            domainSubtitle:
              "Climatologie, géographie humaine, dynamiques territoriales et cartographie",
            domainPole: "LETTRES_HUMAINES",
          },
          {
            id: "up-flash-socio",
            name: "Sociologie-Anthropologie & Enquêtes",
            shortCode: "SOC",
            domainSubtitle:
              "Méthodes de recherche sociale, anthropologie du développement et démographie",
            domainPole: "LETTRES_HUMAINES",
          },
          {
            id: "up-flash-lang",
            name: "Lettres, Linguistique & Études Anglophones",
            shortCode: "LANG",
            domainSubtitle:
              "Grammaire avancée, traduction, commentaire composé et dissertation littéraire",
            domainPole: "LETTRES_HUMAINES",
          },
        ],
      },
    ],
  },
  {
    id: "unstim",
    shortName: "UNSTIM Abomey",
    fullName: "Université Nationale des Sciences, Technologies, Ingénierie et Mathématiques",
    cities: "Abomey · Lokossa · Natitingou · Dassa-Zoumé",
    type: "PUBLIQUE",
    programs: [
      {
        id: "unstim-inspei-ensgmm",
        facultyCode: "INSPEI / ENSGMM",
        facultyFullName:
          "Classes Préparatoires Ingénieur & Génie Mathématique et Modélisation (Abomey)",
        filiereName: "Prépa Ingénieur, Génie Mathématique, Modélisation & Calcul Scientifique",
        domainPole: "MIA_INFO",
        description:
          "Classes préparatoires aux études d'ingénieur et cycle d'ingénieur en modélisation mathématique et simulation numérique.",
        subjects: [
          {
            id: "unstim-analyse",
            name: "Analyse & Équations Différentielles",
            shortCode: "ANA",
            domainSubtitle:
              "Suites et séries de fonctions, intégrales à paramètre, EDP et analyse numérique",
            domainPole: "MIA_INFO",
          },
          {
            id: "unstim-algebre",
            name: "Algèbre Linéaire, Bilinéaire & Optimisation",
            shortCode: "ALG",
            domainSubtitle:
              "Diagonalisation, espaces euclidiens, calcul matriciel et optimisation numérique",
            domainPole: "MIA_INFO",
          },
          {
            id: "unstim-phys-prepa",
            name: "Physique Générale & Sciences de l'Ingénieur",
            shortCode: "PHYS",
            domainSubtitle:
              "Mécanique du solide, électromagnétisme, thermodynamique et optique ondulatoire",
            domainPole: "PHYSIQUE_CHIMIE",
          },
          {
            id: "unstim-info-sci",
            name: "Informatique & Programmation Scientifique",
            shortCode: "PROG",
            domainSubtitle:
              "Algorithmique, Python/C++, simulation numérique et structures de données",
            domainPole: "MIA_INFO",
          },
        ],
      },
      {
        id: "unstim-enstp",
        facultyCode: "ENSTP Abomey",
        facultyFullName: "École Nationale Supérieure des Travaux Publics",
        filiereName: "Génie Civil, Bâtiment & TP, Géomatique, Topographie & Urbanisme",
        domainPole: "INGENIERIE_POLYTECH",
        description:
          "Ingénierie des infrastructures, calcul de structures, géotechnique, hydraulique et topographie.",
        subjects: [
          {
            id: "enstp-rdm",
            name: "Résistance des Matériaux (RDM) & Béton Armé",
            shortCode: "RDM",
            domainSubtitle:
              "Statique, poutres isostatiques/hyperstatiques, Eurocodes/BAEL et charpente métallique",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "enstp-geotech",
            name: "Mécanique des Sols, Géotechnique & Hydraulique",
            shortCode: "GEOT",
            domainSubtitle:
              "Fondations, poussée des terres, compactage, hydraulique routière et urbaine",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "enstp-topo",
            name: "Topographie, Géodésie & Géomatique",
            shortCode: "TOPO",
            domainSubtitle:
              "Nivellement, polygonation, calculs topométriques, télédétection et SIG",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "enstp-math",
            name: "Mathématiques & Physique Appliquées",
            shortCode: "MATH",
            domainSubtitle:
              "Calcul matriciel, calcul intégral, géométrie dans l'espace et mécanique",
            domainPole: "MIA_INFO",
          },
        ],
      },
      {
        id: "unstim-insti-ensgep",
        facultyCode: "INSTI Lokossa / ENSGEP",
        facultyFullName:
          "Institut National Supérieur de Technologie Industrielle & Génie Énergétique",
        filiereName:
          "Génie Électrique, Informatique Industrielle, Génie Mécanique, Énergies Renouvelables & Télécoms",
        domainPole: "INGENIERIE_POLYTECH",
        description:
          "Technologies industrielles à Lokossa et Abomey : électrotechnique, maintenance, froid/climatisation et télécoms.",
        subjects: [
          {
            id: "insti-elec",
            name: "Électrotechnique & Électronique de Puissance",
            shortCode: "ELEC",
            domainSubtitle:
              "Réseaux électriques, transformateurs, moteurs asynchrones et convertisseurs statiques",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "insti-auto",
            name: "Automatique, Informatique Industrielle & Télécoms",
            shortCode: "AUTO",
            domainSubtitle:
              "Grafcet/API, microcontrôleurs, systèmes asservis, traitement du signal et réseaux",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "insti-thermo",
            name: "Thermodynamique, Froid & Génie Mécanique",
            shortCode: "MECA",
            domainSubtitle:
              "Cycles frigorifiques, transfert thermique, solaire photovoltaïque et construction mécanique",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "insti-math",
            name: "Mathématiques & Sciences Physiques (STI)",
            shortCode: "MPHY",
            domainSubtitle:
              "Nombres complexes, transformée de Laplace, équations différentielles et électricité",
            domainPole: "PHYSIQUE_CHIMIE",
          },
        ],
      },
      {
        id: "unstim-fast-nati",
        facultyCode: "FAST / ENS Natitingou",
        facultyFullName:
          "Faculté des Sciences et Techniques & École Normale Supérieure de Natitingou",
        filiereName: "Mathématiques-Informatique (MI) & Physique-Chimie (PC)",
        domainPole: "PHYSIQUE_CHIMIE",
        description:
          "Licences scientifiques fondamentales et formation des enseignants en sciences exactes.",
        subjects: [
          {
            id: "nati-math",
            name: "Analyse & Algèbre (MI / PC)",
            shortCode: "MATH",
            domainSubtitle:
              "Analyse réelle, algèbre linéaire, géométrie affine/euclidienne et probabilités",
            domainPole: "MIA_INFO",
          },
          {
            id: "nati-phys",
            name: "Physique : Mécanique, Électricité & Optique",
            shortCode: "PHYS",
            domainSubtitle: "Lois de Newton, électromagnétisme, thermodynamique et ondes",
            domainPole: "PHYSIQUE_CHIMIE",
          },
          {
            id: "nati-chim",
            name: "Chimie Générale, Minérale & Organique",
            shortCode: "CHIM",
            domainSubtitle:
              "Structure de la matière, équilibres ioniques, oxydoréduction et chimie organique",
            domainPole: "PHYSIQUE_CHIMIE",
          },
          {
            id: "nati-info",
            name: "Algorithmique & Informatique Scientifique",
            shortCode: "INFO",
            domainSubtitle: "Algorithmique fondamentale, programmation structurée et logique",
            domainPole: "MIA_INFO",
          },
        ],
      },
      {
        id: "unstim-ensbba",
        facultyCode: "ENSBBA Dassa",
        facultyFullName: "École Nationale Supérieure des Biosciences et Biotechnologies Appliquées",
        filiereName:
          "Biotechnologies Appliquées, Génie Biologique, Analyses Biomédicales & Nutrition",
        domainPole: "SANTE_BIO",
        description:
          "Biosciences appliquées à la santé, à l'industrie pharmaceutique et à l'agroalimentaire.",
        subjects: [
          {
            id: "ensbba-bioch",
            name: "Biochimie, Enzymologie & Biologie Moléculaire",
            shortCode: "BCHM",
            domainSubtitle: "Cinétique enzymatique, génie génétique, PCR et métabolisme cellulaire",
            domainPole: "SANTE_BIO",
          },
          {
            id: "ensbba-micro",
            name: "Microbiologie, Immunologie & Génie Fermentaire",
            shortCode: "MICR",
            domainSubtitle:
              "Bactériologie appliquée, bioréacteurs, contrôle qualité et immunologie",
            domainPole: "SANTE_BIO",
          },
          {
            id: "ensbba-chim",
            name: "Chimie Analytique, Organique & Biostatistique",
            shortCode: "CHIM",
            domainSubtitle:
              "Spectrophotométrie, chromatographie, chimie des solutions et biostatistique",
            domainPole: "PHYSIQUE_CHIMIE",
          },
        ],
      },
    ],
  },
  {
    id: "una",
    shortName: "UNA Agriculture",
    fullName: "Université Nationale d'Agriculture",
    cities: "Porto-Novo · Sakété · Kétou · Adjohoun",
    type: "PUBLIQUE",
    programs: [
      {
        id: "una-egr",
        facultyCode: "EGR Kétou",
        facultyFullName: "École de Génie Rural",
        filiereName:
          "Agroéquipement, Infrastructures Rurales, Assainissement & Énergies Renouvelables",
        domainPole: "INGENIERIE_POLYTECH",
        description:
          "Ingénierie rurale, hydraulique agricole, constructions rurales et mécanisation.",
        subjects: [
          {
            id: "una-hydr",
            name: "Hydraulique Agricole, Irrigation & Hydrologie",
            shortCode: "HYDR",
            domainSubtitle:
              "Écoulements en conduite/canaux, dimensionnement des réseaux d'irrigation et drainage",
            domainPole: "AGRO_EAU",
          },
          {
            id: "una-rdm",
            name: "RDM, Constructions Rurales & Machinisme",
            shortCode: "RDM",
            domainSubtitle:
              "Résistance des matériaux, mécanique des sols, moteurs thermiques et agroéquipements",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "una-math-phys",
            name: "Mathématiques, Physique & Topographie",
            shortCode: "MATH",
            domainSubtitle:
              "Calcul différentiel, thermodynamique, électrotechnique et levés topographiques",
            domainPole: "MIA_INFO",
          },
        ],
      },
      {
        id: "una-eapa",
        facultyCode: "EAPA Porto-Novo",
        facultyFullName: "École d'Agrobusiness et de Politiques Agricoles",
        filiereName:
          "Finance Agricole, Agrobusiness, Gestion des Exploitations & Politiques Agricoles",
        domainPole: "ECO_GESTION_FASEG",
        description:
          "Économie agricole, gestion financière des entreprises agroalimentaires, marketing et projets.",
        subjects: [
          {
            id: "eapa-eco",
            name: "Microéconomie & Économie Agricole",
            shortCode: "AECO",
            domainSubtitle:
              "Fonction de production agricole, formation des prix, filières et politiques agricoles",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "eapa-fin",
            name: "Comptabilité SYSCOHADA & Finance Agricole",
            shortCode: "FINA",
            domainSubtitle:
              "Comptabilité d'exploitation, rentabilité des projets agropastoraux et crédit agricole",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "eapa-stat",
            name: "Statistique, Biométrie & Économétrie",
            shortCode: "STAT",
            domainSubtitle: "Enquêtes agricoles, régression, probabilités et analyse de données",
            domainPole: "ECO_GESTION_FASEG",
          },
        ],
      },
      {
        id: "una-agro-bio",
        facultyCode: "EGPVS / EGESE / ESTCTPA / EAq / EForT",
        facultyFullName:
          "Écoles de Production Végétale, Élevage, Transformation Alimentaire, Aquaculture & Foresterie",
        filiereName:
          "Semences & Cultures, Zootechnie, Agroalimentaire & Nutrition, Halieutique, Foresterie",
        domainPole: "AGRO_EAU",
        description:
          "Sciences agronomiques, transformation alimentaire (Sakété), aquaculture (Adjohoun) et foresterie tropicale.",
        subjects: [
          {
            id: "una-prod-veg",
            name: "Agronomie, Génétique & Physiologie Végétale/Animale",
            shortCode: "AGRO",
            domainSubtitle:
              "Pédologie, amélioration génétique, phytopathologie, zootechnie et aquaculture",
            domainPole: "AGRO_EAU",
          },
          {
            id: "una-alim",
            name: "Biochimie, Microbiologie & Génie Alimentaire",
            shortCode: "ALIM",
            domainSubtitle:
              "Procédés de conservation, contrôle qualité physico-chimique et nutrition humaine",
            domainPole: "SANTE_BIO",
          },
          {
            id: "una-biom",
            name: "Biométrie, Plans d'Expériences & Chimie",
            shortCode: "BIOM",
            domainSubtitle:
              "Statistique expérimentale (ANOVA), chimie organique/analytique et écologie forestière",
            domainPole: "AGRO_EAU",
          },
        ],
      },
    ],
  },
  {
    id: "epes-benin",
    shortName: "EPES Agréés (UCAO, Pigier, ESGIS, HECM...)",
    fullName: "Établissements Privés d'Enseignement Supérieur Agréés du Bénin",
    cities: "Cotonou · Abomey-Calavi · Porto-Novo · Parakou",
    type: "PRIVEE_AGREEE",
    programs: [
      {
        id: "epes-info-gl",
        facultyCode: "ESGIS / EPITECH / UCAO / Pigier / Sonou",
        facultyFullName: "Pôle Sciences Informatiques, Réseaux & Génie Logiciel",
        filiereName:
          "Systèmes Informatiques & Logiciels (SIL), Réseaux-Télécoms, Cybersécurité & IA",
        domainPole: "MIA_INFO",
        description:
          "Licences et Masters homologués MESRS en architecture logicielle, réseaux informatiques et intelligence artificielle.",
        subjects: [
          {
            id: "epes-algo",
            name: "Algorithmique, C/Java/Python & Génie Logiciel",
            shortCode: "DEV",
            domainSubtitle:
              "Structures de données, POO, développement Web/Mobile et conception UML/Merise",
            domainPole: "MIA_INFO",
          },
          {
            id: "epes-bdd",
            name: "Bases de Données SQL & Systèmes d'Exploitation",
            shortCode: "BDD",
            domainSubtitle:
              "SGBD relationnels, requêtes avancées, administration Linux/Windows Server",
            domainPole: "MIA_INFO",
          },
          {
            id: "epes-res",
            name: "Réseaux Informatiques, Télécoms & Sécurité",
            shortCode: "RES",
            domainSubtitle: "Adressage IP, routage/commutation, sécurité des systèmes et cloud",
            domainPole: "MIA_INFO",
          },
          {
            id: "epes-math",
            name: "Mathématiques pour l'Informatique & RO",
            shortCode: "MATH",
            domainSubtitle:
              "Algèbre linéaire, arithmétique, logique booléenne, graphes et probabilités",
            domainPole: "MIA_INFO",
          },
        ],
      },
      {
        id: "epes-compta-fin",
        facultyCode: "Pigier / HECM / UCAO / ESGIS / Sonou",
        facultyFullName: "Pôle Sciences de Gestion, Finance, Comptabilité & Audit",
        filiereName: "Comptabilité-Contrôle-Audit (CCA), Banque-Finance, Marketing & Logistique",
        domainPole: "ECO_GESTION_FASEG",
        description:
          "Formations agréées aux normes SYSCOHADA révisé, finance d'entreprise, banque et management.",
        subjects: [
          {
            id: "epes-sysco",
            name: "Comptabilité Générale & des Sociétés SYSCOHADA",
            shortCode: "SYSCO",
            domainSubtitle:
              "Enregistrements comptables, opérations d'inventaire, fusion/consolidation et audit",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "epes-fin",
            name: "Analyse Financière, Banque & Maths Financières",
            shortCode: "FIN",
            domainSubtitle:
              "Équilibre financier, CAF, choix d'investissement, emprunts et opérations bancaires",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "epes-cacg",
            name: "Comptabilité Analytique, Budget & Fiscalité",
            shortCode: "CACG",
            domainSubtitle:
              "Calcul des coûts, écarts budgétaires, fiscalité béninoise et droit OHADA",
            domainPole: "ECO_GESTION_FASEG",
          },
          {
            id: "epes-eco-stat",
            name: "Économie Générale, Statistique & RO",
            shortCode: "STAT",
            domainSubtitle:
              "Micro/Macroéconomie, probabilités, programmation linéaire et gestion des stocks",
            domainPole: "ECO_GESTION_FASEG",
          },
        ],
      },
      {
        id: "epes-genie-indus",
        facultyCode: "UCAO / ESGIS / Faucon",
        facultyFullName: "Pôle Sciences de l'Ingénieur, Électronique & Génie Civil",
        filiereName: "Génie Électrique & Informatique Industrielle, Génie Civil & Électromécanique",
        domainPole: "INGENIERIE_POLYTECH",
        description: "Filières technologiques et polytechniques privées agréées.",
        subjects: [
          {
            id: "epes-elec",
            name: "Électrotechnique, Électronique & Automatique",
            shortCode: "ELEC",
            domainSubtitle:
              "Circuits électriques, électronique analogique/numérique et systèmes automatisés",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "epes-gc",
            name: "Résistance des Matériaux (RDM) & Génie Civil",
            shortCode: "RDM",
            domainSubtitle:
              "Statique appliquée, dimensionnement béton armé et mécanique des fluides",
            domainPole: "INGENIERIE_POLYTECH",
          },
          {
            id: "epes-ming",
            name: "Mathématiques & Physique de l'Ingénieur",
            shortCode: "MING",
            domainSubtitle:
              "Analyse, algèbre matricielle, équations différentielles et thermodynamique",
            domainPole: "PHYSIQUE_CHIMIE",
          },
        ],
      },
      {
        id: "epes-droit-ri",
        facultyCode: "UCAO / Cours Sonou / HECM",
        facultyFullName: "Pôle Sciences Juridiques, Politiques & Communication",
        filiereName:
          "Droit des Affaires et Carrières Judiciaires, Relations Internationales & Communication",
        domainPole: "DROIT_ADMIN",
        description: "Droit privé, droit OHADA, diplomatie et communication d'entreprise.",
        subjects: [
          {
            id: "epes-droit-aff",
            name: "Droit Civil & Droit des Affaires OHADA",
            shortCode: "OHADA",
            domainSubtitle:
              "Droit des contrats, sociétés commerciales OHADA, droit bancaire et social",
            domainPole: "DROIT_ADMIN",
          },
          {
            id: "epes-droit-pub",
            name: "Droit Public, Pénal & Relations Internationales",
            shortCode: "PUBL",
            domainSubtitle:
              "Droit constitutionnel, administratif, organisations internationales et géopolitique",
            domainPole: "DROIT_ADMIN",
          },
        ],
      },
    ],
  },
];

/**
 * Retourne des Unités d'Enseignement complémentaires cohérentes avec le pôle universitaire de l'étudiant
 * lorsqu'il clique sur "+ Autre UE / matière" (aucune matière hors-domaine).
 */
export function getExtensibleUniversitySubjectsForPole(
  pole: AcademicDomainPole | undefined,
): Array<{ name: string; shortCode: string; domainSubtitle: string }> {
  switch (pole) {
    case "MIA_INFO":
      return [
        {
          name: "Topologie & Calcul Différentiel",
          shortCode: "TOPO",
          domainSubtitle:
            "Espaces métriques, espaces vectoriels normés et théorème d'inversion locale",
        },
        {
          name: "Recherche Opérationnelle & Graphes",
          shortCode: "RO",
          domainSubtitle: "Algorithme de Dijkstra, flots, Simplexe et dualité",
        },
        {
          name: "Compilation, Automates & Langages Formels",
          shortCode: "AUTO",
          domainSubtitle: "Expressions régulières, automates finis et grammaires hors-contexte",
        },
        {
          name: "Intelligence Artificielle & Machine Learning",
          shortCode: "IA",
          domainSubtitle: "Régression, classification, réseaux de neurones et optimisation",
        },
      ];
    case "PHYSIQUE_CHIMIE":
      return [
        {
          name: "Physique Nucléaire & Atomique",
          shortCode: "NUCL",
          domainSubtitle:
            "Radioactivité, réactions nucléaires, énergie de liaison et spectroscopie",
        },
        {
          name: "Cristallographie & Chimie du Solide",
          shortCode: "CRIS",
          domainSubtitle: "Mailles cristallines, réseaux de Bravais, diffraction X et liaisons",
        },
        {
          name: "Ondes, Vibrations & Acoustique",
          shortCode: "ONDE",
          domainSubtitle: "Oscillateurs couplés, équation de d'Alembert et dispersion",
        },
        {
          name: "Cinétique Chimique & Électrochimie",
          shortCode: "CINE",
          domainSubtitle: "Lois de vitesse, catalyse, relation de Nernst et diagrammes E-pH",
        },
      ];
    case "ECO_GESTION_FASEG":
      return [
        {
          name: "Économie Monétaire & Bancaire (UEMOA)",
          shortCode: "MON",
          domainSubtitle: "Création monétaire, politique de la BCEAO et marchés financiers BRVM",
        },
        {
          name: "Comptabilité des Sociétés & Consolidation",
          shortCode: "CSOC",
          domainSubtitle:
            "Constitution, affectation du résultat, augmentation de capital (SYSCOHADA)",
        },
        {
          name: "Économie Internationale & Développement",
          shortCode: "EINT",
          domainSubtitle: "Avantages comparatifs, balance des paiements et commerce extérieur",
        },
        {
          name: "Gestion des Ressources Humaines & Marketing",
          shortCode: "MKG",
          domainSubtitle: "Stratégie marketing, comportement du consommateur et gestion de la paie",
        },
      ];
    case "INGENIERIE_POLYTECH":
      return [
        {
          name: "Béton Armé & Construction Métallique",
          shortCode: "BA",
          domainSubtitle: "Dimensionnement aux états limites (ELU/ELS), ferraillage et portiques",
        },
        {
          name: "Transferts Thermiques & Énergies Solaire/Éolienne",
          shortCode: "ENER",
          domainSubtitle: "Conduction, convection, rayonnement et dimensionnement photovoltaïque",
        },
        {
          name: "Traitement du Signal & Systèmes Embarqués",
          shortCode: "SIG",
          domainSubtitle: "Échantillonnage de Shannon, filtrage numérique et microcontrôleurs",
        },
        {
          name: "Dessin Technique & Construction Mécanique",
          shortCode: "CMEC",
          domainSubtitle: "Liaisons mécaniques, engrenages, roulements et cotation fonctionnelle",
        },
      ];
    case "SANTE_BIO":
      return [
        {
          name: "Immunologie & Hématologie",
          shortCode: "IMMU",
          domainSubtitle: "Réponse immunitaire innée/adaptative, groupes sanguins et hémostase",
        },
        {
          name: "Parasitologie, Mycologie & Virologie",
          shortCode: "PARA",
          domainSubtitle: "Paludisme, cycles parasitaires, diagnostic biologique et antiviraux",
        },
        {
          name: "Chimie Thérapeutique & Galénique",
          shortCode: "GALE",
          domainSubtitle:
            "Formulation des médicaments, biodisponibilité et relations structure-activité",
        },
      ];
    case "AGRO_EAU":
      return [
        {
          name: "Systèmes d'Information Géographique (SIG) & Télédétection",
          shortCode: "SIG",
          domainSubtitle: "Cartographie numérique des bassins versants et parcelles agricoles",
        },
        {
          name: "Écologie Forestière & Gestion de la Faune",
          shortCode: "FOR",
          domainSubtitle: "Dendrométrie, inventaire forestier et conservation de la biodiversité",
        },
        {
          name: "Génie des Procédés Agroalimentaires",
          shortCode: "GPA",
          domainSubtitle: "Séchage, pasteurisation, fermentation et bilans matière/énergie",
        },
      ];
    case "DROIT_ADMIN":
      return [
        {
          name: "Finances Publiques & Droit Fiscal Béninois",
          shortCode: "FPUB",
          domainSubtitle:
            "Loi de finances LOLF, exécution budgétaire et contrôle de la Cour des Comptes",
        },
        {
          name: "Droit du Travail & Sécurité Sociale",
          shortCode: "SOC",
          domainSubtitle: "Contrat de travail, licenciement, conventions collectives et CNSS",
        },
        {
          name: "Droit International Public & CEDEAO/UEMOA",
          shortCode: "DIP",
          domainSubtitle:
            "Traités internationaux, droit communautaire africain et juridictions régionales",
        },
      ];
    default:
      return [
        {
          name: "Méthodologie de Rédaction Universitaire & Mémoire",
          shortCode: "METH",
          domainSubtitle: "Problématisation, revue de littérature, normes CAMES et soutenance",
        },
        {
          name: "Anglais Scientifique & Professionnel",
          shortCode: "ENG",
          domainSubtitle: "Lecture d'articles académiques, terminologie spécialisée et rédaction",
        },
      ];
  }
}

/**
 * Déduit automatiquement des matières universitaires cohérentes si l'étudiant saisit
 * manuellement une filière libre (sans jamais injecter Histoire-Géographie hors domaine).
 */
export function inferSubjectsFromCustomSpecialty(specialtyText: string): {
  pole: AcademicDomainPole;
  subjects: SubjectSpace[];
} {
  const lower = specialtyText.toLowerCase();

  if (
    lower.includes("éco") ||
    lower.includes("eco") ||
    lower.includes("faseg") ||
    lower.includes("compta") ||
    lower.includes("finan") ||
    lower.includes("banq") ||
    lower.includes("gest") ||
    lower.includes("audit") ||
    lower.includes("market")
  ) {
    return {
      pole: "ECO_GESTION_FASEG",
      subjects: BENIN_UNIVERSITIES[0].programs[2].subjects,
    };
  }

  if (lower.includes("phys") || lower.includes("chim")) {
    return {
      pole: "PHYSIQUE_CHIMIE",
      subjects: BENIN_UNIVERSITIES[0].programs[1].subjects,
    };
  }

  if (
    lower.includes("génie") ||
    lower.includes("genie") ||
    lower.includes("civil") ||
    lower.includes("élec") ||
    lower.includes("elec") ||
    lower.includes("méca") ||
    lower.includes("meca") ||
    lower.includes("tp") ||
    lower.includes("énerg") ||
    lower.includes("energ") ||
    lower.includes("topo")
  ) {
    return {
      pole: "INGENIERIE_POLYTECH",
      subjects: BENIN_UNIVERSITIES[0].programs[5].subjects,
    };
  }

  if (
    lower.includes("méd") ||
    lower.includes("med") ||
    lower.includes("santé") ||
    lower.includes("pharma") ||
    lower.includes("infirm") ||
    lower.includes("bio")
  ) {
    return {
      pole: "SANTE_BIO",
      subjects: BENIN_UNIVERSITIES[0].programs[8].subjects,
    };
  }

  if (
    lower.includes("agro") ||
    lower.includes("eau") ||
    lower.includes("forêt") ||
    lower.includes("aqua") ||
    lower.includes("élevage")
  ) {
    return {
      pole: "AGRO_EAU",
      subjects: BENIN_UNIVERSITIES[0].programs[10].subjects,
    };
  }

  if (
    lower.includes("droit") ||
    lower.includes("jurid") ||
    lower.includes("polit") ||
    lower.includes("admin") ||
    lower.includes("diplom")
  ) {
    return {
      pole: "DROIT_ADMIN",
      subjects: BENIN_UNIVERSITIES[0].programs[9].subjects,
    };
  }

  if (
    lower.includes("hist") ||
    lower.includes("géo") ||
    lower.includes("geo") ||
    lower.includes("socio") ||
    lower.includes("lettre") ||
    lower.includes("lang") ||
    lower.includes("journal")
  ) {
    return {
      pole: "LETTRES_HUMAINES",
      subjects: BENIN_UNIVERSITIES[0].programs[12].subjects,
    };
  }

  // Par défaut pour Sciences / Math / Info / Stat / Actuariat
  return {
    pole: "MIA_INFO",
    subjects: BENIN_UNIVERSITIES[0].programs[0].subjects,
  };
}
