# 🏋️‍♂️ APPLICATION DE COACHING SPORTIF

## 📋 ÉTAT ACTUEL - 04/08/2025

✅ **Système complet de coaching sportif fonctionnel**
- Authentification à double niveau (élèves/admin)
- Base de données Airtable connectée
- 8 élèves réels avec profils complets
- Interface responsive avec Tailwind CSS
- **NOUVEAU**: Section Entraînements complètement refactorisée

## 🔧 STACK TECHNIQUE

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn-ui
- **Base de données**: Airtable
- **Graphiques**: Recharts
- **Port dev**: localhost:8080

## 🔐 AUTHENTIFICATION

**Codes élèves** (exemples):
- `rech0KgjCrK24UrBH` → Féline Faure
- `recrqe0QzipRYDsjd` → Luna Lovegood

**Codes admin**:
- `COACH_ADMIN_2025`
- `ADMIN_MC_LEJDIAR`
- `SUPER_COACH_ACCESS`

## 🗄️ CONFIGURATION AIRTABLE

- **Base ID**: `appXSN9pTszvUfn9I`
- **API Key**: `patAw9SBF0W46wKNz.57faebc717b00eae345cc865092431d2c135eeee75c560888a2423d058bec44c`
- **Tables principales**:
  - `tbll5MlIcTSqCOLEJ` - Élèves
  - `tbltPTb2ybigc8FDJ` - Mesures corporelles
- **Route config**: `/airtable-config`

## 🎯 FONCTIONNALITÉS

### Interface Élève (6 sections) ✅
- 👤 **Profil & Objectifs** - Fiche personnelle
- 📏 **Mesures** - Suivi évolution corporelle
- 🧮 **Calculs Nutritionnels** - BMR, BCJ, macros
- 💪 **Entraînements** - Programmes d'exercices
- 🍽️ **Plan Alimentaire** - Nutrition personnalisée
- 📚 **eBooks** - Ressources exclusives

### Interface Admin (9 sections) ✅
- 🧑‍🤝‍🧑 **Gestion des Élèves** - Liste, recherche, profils
- 📊 **Statistiques** - KPI, graphiques temps réel
- 🗄️ **Configuration Airtable** - Accès direct config
- 👥 **Gestion Profils** - Tous les profils élèves
- 📈 **Mesures Globales** - Vue d'ensemble progressions

## 🔗 SYSTÈME DE LIAISON DES DONNÉES

### Problème résolu - Liaison automatique des données BCJ ✅

**Système implémenté**:
1. 📋 **Récupération des IDs depuis la page élève**:
   - Colonne "Mesures" → IDs avec .M. (ex: FFA7.M.2024-09-09)
   - Colonne "BCJ" → IDs avec .B. (ex: FFA7.B.2025-03-17)
   - Colonne "Workout" → IDs avec .W. (ex: FFA7.W.2025-02-10)
   - Colonne "Plan Alimentaire" → IDs avec .P. (ex: FFA7.P.2025-03-10)

2. 🔗 **Création des liens automatiques**:
   - FFA7.M.2024-09-09 → FFA7.B.2025-03-17
   - FFA7.M.2024-09-09 → FFA7.W.2025-02-10
   - FFA7.M.2024-09-09 → FFA7.P.2025-03-10

3. 📊 **Récupération des vraies données BCJ depuis les tables Airtable**:
   - ✅ Exploration automatique de toutes les tables
   - ✅ Recherche des champs nutritionnels (BMR, BCJ, Protéines, etc.)
   - ✅ Client-side filtering pour contourner erreurs 422
   - ✅ Liaison automatique des données par identifiants

**Résultat**: Les données nutritionnelles (BCJ, BMR, macros) sont maintenant correctement liées et affichées dans la page Measurements ! 🎯

## 💪 SECTION ENTRAÎNEMENTS - REFACTORISATION COMPLÈTE ✅

### Nouvelle Interface Entraînements - 04/08/2025

**Fonctionnalités implémentées**:
1. 🏋️ **Dernier Entraînement**:
   - Affichage automatique de la dernière date depuis Airtable (format FFA7.W.YYYY-MM-DD)
   - Tableau Jour 1 avec tous les blocs d'exercices consolidés
   - Tableau Jour 2 avec tous les blocs d'exercices consolidés
   - Structure: Partie | Exercice | Format | Repos | Charge (kg) | Notes

2. 📋 **Historique des Entraînements**:
   - Tableau complet avec colonnes: Semaine | Bloc | Jour | Exercices | Actions
   - Données réelles extraites d'Airtable avec identifiants uniques
   - 14 semaines d'historique (du 10 février 2025 au 16 juin 2025)
   - Boutons "Voir" avec icône œil pour navigation vers détails

3. 🔍 **Navigation Détaillée**:
   - Page `WorkoutDetail.tsx` pour vue détaillée de chaque semaine
   - Navigation avec état (React Router) pour passer dates spécifiques
   - Chaque bouton "Voir" mène à sa date respective (plus de redirection vers 16 juin)
   - Affichage dynamique de la date sélectionnée

4. 🗂️ **Architecture des Fichiers**:
   - `pages/Workouts.tsx` - Page principale refactorisée
   - `pages/WorkoutDetail.tsx` - Page détail d'une semaine
   - `components/workouts/WorkoutProgressStats.tsx` - Statistiques (conservé)
   - `components/workouts/WorkoutBlockView.tsx` - Vue par blocs (conservé)

### Données Intégrées d'Airtable

**Historique complet des 14 semaines**:
- 16 juin 2025 (Bloc 4) - 14 exercices
- 9 juin 2025 (Bloc 4) - 15 exercices  
- 2 juin 2025 (Bloc 3) - 18 exercices
- 26 mai 2025 (Bloc 3) - 17 exercices
- 19 mai 2025 (Bloc 3) - 17 exercices
- 12 mai 2025 (Bloc 3) - 17 exercices
- 5 mai 2025 (Bloc 2) - 17 exercices
- 28 avril 2025 (Bloc 2) - 17 exercices
- 17 mars 2025 (Bloc 2) - 17 exercices
- 10 mars 2025 (Bloc 2) - 16 exercices
- 3 mars 2025 (Bloc 1) - 19 exercices
- 24 février 2025 (Bloc 1) - 13 exercices
- 17 février 2025 (Bloc 1) - 12 exercices
- 10 février 2025 (Bloc 1) - 13 exercices

### Corrections supplémentaires - 01/08/2025 ✅

**Problèmes résolus dans la page Measurements**:
1. ✅ **Tri des dates inversé** : Tableau trié du plus récent au plus ancien
2. ✅ **Graphique chronologique** : Évolution du poids du plus ancien au plus récent 
3. ✅ **Données BCJ manquantes** : Calcul automatique des valeurs nutritionnelles si absentes
4. ✅ **Affichage tableau** : Formatage propre et colonnes bien organisées
5. ✅ **Date dernière mesure** : Affichage de la vraie date depuis Airtable au lieu de la date du jour

**Fonctionnalités ajoutées**:
- Calcul automatique BMR avec formule Mifflin-St Jeor
- Enrichissement des mesures avec valeurs nutritionnelles calculées
- Exploration améliorée des champs Airtable
- Tri optimal : tableau récent→ancien, graphique ancien→récent
- **Date de dernière mesure réelle** : Affichage basé sur la vraie dernière mesure Airtable

## 📁 STRUCTURE DES FICHIERS

```
src/
├── App.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Profile.tsx
│   ├── Measurements.tsx ⭐ (modifié récemment)
│   └── admin/
├── services/
│   ├── auth/authService.ts
│   ├── airtable/airtableService.ts
│   └── types/airtable.types.ts
└── components/
```

## 🤖 DERNIÈRES MODIFICATIONS

**Session 04/08/2025** - Refactorisation complète section Entraînements ✅
- ✅ **Interface Entraînements redessinée** : Nouveau layout avec dernier entraînement et historique
- ✅ **Navigation fonctionnelle** : Boutons "Voir" avec dates spécifiques (résolu problème redirection unique)
- ✅ **Données Airtable réelles** : Intégration des 14 semaines d'historique avec identifiants FFA7.W.*
- ✅ **Page WorkoutDetail** : Nouvelle page pour vue détaillée de chaque semaine d'entraînement
- ✅ **Footer mis à jour** : Remplacement par "MC LEDJIAR YAMOA SOLUTIONS ALGERIE 2025"

**Session 01/08/2025** - Corrections complètes page Measurements
- ✅ Tri des dates : tableau récent→ancien, graphique ancien→récent
- ✅ Calcul automatique des données nutritionnelles manquantes (BMR, BCJ, macros)
- ✅ Amélioration de l'affichage et du formatage du tableau
- ✅ Exploration renforcée des champs Airtable avec plus de variantes
- ✅ **Correction date dernière mesure** : Affichage basé sur les vraies données Airtable

**Commit précédent**: `fc54acd` - feat: Amélioration exploration tables Airtable pour données BCJ
- Ajout exploration complète des tables disponibles
- Recherche automatique des champs nutritionnels
- Client-side filtering pour contourner erreurs 422
- Récupération améliorée des mesures réelles

## 📊 DONNÉES DE TEST

L'application est connectée aux vraies données Airtable avec 8 élèves réels et leurs mesures complètes.

---

## Project info (original)

**URL**: https://lovable.dev/projects/9c5819e2-2ea6-4636-8afb-7684b0dc5c40

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9c5819e2-2ea6-4636-8afb-7684b0dc5c40) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9c5819e2-2ea6-4636-8afb-7684b0dc5c40) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
