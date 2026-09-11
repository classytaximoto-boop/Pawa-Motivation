# BOOST — Become the person you want to be

Coach personnel numérique : motivation, objectifs, projets, progression quotidienne.
PWA offline-first, installable, sans dépendance IA sur les fonctions essentielles.

## Statut

🟢 **Prompt 1 livré** — Architecture, navigation, écran Home/Boost fonctionnel.
🔲 Objectifs, Projets, Money, Family, Mind, Notes, Secret, Media, Profile — écrans placeholder en attente des prompts suivants.

## Stack

- Vite (vanilla JS, aucun framework — léger et rapide)
- `vite-plugin-pwa` pour le manifest + service worker (offline-first)
- CSS natif avec design tokens (`src/styles/tokens.css`)
- Persistance locale via `localStorage` (remplaçable par IndexedDB plus tard)
- Aucune dépendance réseau requise pour fonctionner

## Développement

```bash
npm install
npm run dev       # serveur de dev, http://localhost:5173
npm run build      # build de production dans dist/
npm run preview    # prévisualiser le build
```

## Structure

```
src/
  components/   composants réutilisables (header, bottom nav...)
  screens/      un fichier par écran de la navigation
  styles/       tokens.css (palette/typo), base.css, layout.css, components.css
  utils/        store.js (état + persistance), router.js, icons.js
  data/         navigation.js, quotes.js — données statiques offline
public/
  icons/        icônes PWA (192/512)
```

## Design

- **Palette** : fond quasi noir (`--bg-void`), accent braise `#FF6B35` (action/boost),
  accent acier `#3D9BE9` (discipline/données).
- **Typographie** : Space Grotesk (titres), Inter (corps), JetBrains Mono (statistiques/XP).
- **Élément signature** : le bouton "BOOST ME" — un dial circulaire façon allumage,
  pas un simple bouton pilule.

## Architecture des données

`src/utils/store.js` centralise l'état (utilisateur, humeur, missions du jour, XP, streak...)
et persiste automatiquement en `localStorage`. Aucun appel réseau. Prêt à être étendu module
par module (Objectifs, Projets, Money...) sans dépendance à l'IA pour les fonctions essentielles,
conformément au cahier des charges.

## Prochaines étapes

Chaque module de la navigation (`Objectifs`, `Projets`, `Money`, `Family`, `Mind`, `Notes`,
`Secret`, `Media`, `Profile`) sera développé dans un prompt dédié et remplacera son écran
`ComingSoon` actuel dans `src/main.js`.
