# Directives d'ingénierie du projet

## Règles architecturales

- Envelopper les marques visibles avec `translate="no"` et `notranslate`, y compris dans les exports d'impression, et déclarer correctement la langue du document pour respecter l'identité de marque.
- L'interface utilisateur vit dans `src/components/FemaApp.tsx` et s'exécute côté client (`ssr: false` sur `/`) avec persistance des données dans `localStorage`.
- Les appels IA s'exécutent côté serveur via `src/server/fema-ai.server.ts` (Google Gemini SDK direct), exposés via la route serveur splat `src/routes/api/$.ts`.
- `tsconfig` désactive `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` et `noPropertyAccessFromIndexSignature`.
- L'authentification utilise directement Supabase Auth dans `AuthGate`, complétée par un mode démonstration hors-ligne/invité pour le test local.
- Les exercices PDF sont transmis à l'IA en tant que pièces jointes documentaires (sans contrôle optique de netteté nécessaire).
