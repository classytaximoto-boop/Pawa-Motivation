# Générer un APK Android depuis GitHub

BOOST est déjà une PWA complète (manifest + service worker). La méthode la
plus fiable pour en faire un vrai APK Android est un **TWA (Trusted Web
Activity)** via Bubblewrap — c'est l'outil officiel de Google, pas un
wrapper tiers. Le TWA charge la PWA depuis une URL HTTPS réelle en plein
écran (aucune barre de navigateur visible).

Deux workflows GitHub Actions sont déjà en place dans
`.github/workflows/` : un pour publier la PWA, un pour générer l'APK.

## Étape 1 — Pousser le projet sur GitHub

```bash
cd boost
git init
git add .
git commit -m "BOOST — projet initial"
git branch -M main
git remote add origin https://github.com/<ton-user>/<ton-repo>.git
git push -u origin main
```

## Étape 2 — Activer GitHub Pages

Dans le repo GitHub : **Settings → Pages → Source → "GitHub Actions"**
(pas "Deploy from a branch"). C'est tout — le workflow
`deploy-pages.yml` se déclenche automatiquement à chaque push sur `main`
et publie le contenu de `dist/`.

Une fois le workflow terminé (onglet **Actions**), l'URL de ta PWA
apparaît dans Settings → Pages, du type :
```
https://<ton-user>.github.io/<ton-repo>/
```
Vérifie que cette URL s'ouvre bien dans un navigateur avant de continuer.

## Étape 3 — Lancer le build de l'APK

Dans le repo GitHub : onglet **Actions → "Générer l'APK Android (TWA)" →
Run workflow**. Colle l'URL de l'étape 2 dans le champ `pwa_url` (avec le
`/` final), puis lance.

Le workflow :
1. installe Bubblewrap (CLI officielle Google TWA),
2. lit le `manifest.webmanifest` de ta PWA en ligne pour configurer
   automatiquement nom, icônes, couleurs de l'app Android,
3. génère et **signe automatiquement** un APK de test avec une clé générée
   à la volée (suffisant pour installer sur un téléphone ou tester —
   **pas** suffisant pour publier sur le Play Store, voir plus bas).

## Étape 4 — Récupérer l'APK

Une fois le workflow terminé, ouvre le run correspondant dans l'onglet
**Actions** → en bas de la page, section **Artifacts** → télécharge
`boost-apk` (fichier `.zip` contenant l'APK). Transfère-le sur un
téléphone Android et installe-le (il faudra autoriser "sources inconnues"
dans les réglages Android, comme pour tout APK hors Play Store).

## Pour publier sur le Google Play Store (optionnel, plus tard)

Ce que le workflow génère aujourd'hui suffit pour tester sur un appareil,
mais pas pour publier sur le Play Store, qui exige :
- une clé de signature **stable** que tu gardes précieusement (perdue =
  impossible de mettre à jour l'app plus tard) — à générer une seule fois
  avec `keytool`, puis à fournir à Bubblewrap au lieu de le laisser en
  générer une nouvelle à chaque run,
- un fichier `assetlinks.json` déposé sur ton domaine
  (`https://.../.well-known/assetlinks.json`) pour prouver au téléphone que
  tu contrôles à la fois le site et l'app (obligatoire pour un TWA "propre"
  sans barre d'adresse visible),
- un compte développeur Google Play (payant, une fois).

C'est une étape ultérieure — pas nécessaire pour simplement tester l'app
sur ton téléphone ou la partager de main à main.

## Limite à connaître

Un TWA a besoin d'ouvrir l'URL en ligne au premier lancement pour valider
la relation avec ton domaine — ensuite, comme toute PWA, le service worker
prend le relai et l'app fonctionne offline normalement (c'est déjà tout
l'esprit de BOOST). Il faut juste que `https://<ton-user>.github.io/...`
reste accessible sur le long terme — GitHub Pages est gratuit et stable
pour ça, aucune action récurrente nécessaire une fois configuré.
