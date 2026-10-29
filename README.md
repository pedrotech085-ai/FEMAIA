# Fema IA — Atelier Académique

Application d'accompagnement académique et d'entraînement pour élèves et étudiants (corrections d'épreuves détaillées, fiches de révision de synthèse, quiz interactifs et analyse d'erreurs récurrentes).

## Développement en local (VS Code)

### Prérequis
- Node.js 20 ou 22
- npm

### Installation & Lancement

1. Cloner le projet :
```bash
git clone <url-du-depot>
cd femaai
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
Copiez `.env.example` en `.env` :
```bash
cp .env.example .env
```

Renseignez vos clés :
- `GEMINI_API_KEY` : Votre clé API Google Gemini pour les corrections d'exercices et de cours.
- `VITE_SUPABASE_URL` / `SUPABASE_URL` : L'URL de votre instance Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` : La clé anonyme/publique Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` : La clé de service role Supabase (côté serveur).

4. Démarrer le serveur de développement :
```bash
npm run dev
```
L'application est accessible sur [http://localhost:3000](http://localhost:3000).

## Commandes disponibles

- `npm run dev` : Démarre le serveur de développement Vite.
- `npm run build` : Compile l'application pour la production.
- `npm run test` : Lance la suite de tests unitaires (Vitest).
- `npm run lint` : Vérifie la qualité et le typage du code (ESLint).
- `npm run format` : Formate le code (Prettier).

## Déploiement

Le projet est conçu pour être déployé sur **Vercel** ou tout hébergeur Node.js moderne :
1. Connectez votre dépôt GitHub à votre tableau de bord Vercel.
2. Ajoutez les variables d'environnement définies dans `.env.example`.
3. Lancez le déploiement.
