---
id: structure-projet
chapitre: architecture
ordre: 1
titre: "Organiser un projet Angular"
termes:
  - terme: Organisation par fonctionnalité
    definition: "Principe du style guide officiel : regrouper les fichiers par domaine métier (`panier/`, `catalogue/`) plutôt que par type technique (`components/`, `services/`). Chaque dossier de fonctionnalité contient tout ce qu'il faut pour cette fonctionnalité."
  - terme: "core (dossier)"
    definition: "Convention d'équipe répandue, **non prescrite telle quelle** par le style guide officiel : dossier pour les services transverses instanciés une seule fois pour toute l'application (authentification, intercepteurs HTTP, configuration)."
  - terme: "shared (dossier)"
    definition: "Convention d'équipe répandue pour les éléments réutilisés par plusieurs fonctionnalités sans logique métier propre : composants de présentation génériques, pipes, directives utilitaires."
  - terme: "features (dossier)"
    definition: "Convention d'équipe répandue : un sous-dossier par fonctionnalité métier de l'application, chacun autonome (composants, services, modèles, routes propres à cette fonctionnalité)."
  - terme: Fichier de routes de fonctionnalité
    definition: "Fichier (ex. `panier.routes.ts`) qui exporte un tableau `Routes` propre à une fonctionnalité, chargé par `loadChildren` depuis les routes racine. Convention de nommage répandue, pas un nom imposé par Angular."
  - terme: Barrel
    definition: "Fichier `index.ts` qui ré-exporte le contenu d'un dossier (`export * from './produit.service'`) pour simplifier les imports. Concept JavaScript/TypeScript général, pas une recommandation du style guide Angular."
  - terme: Un concept par fichier
    definition: "Principe du style guide officiel : un fichier ne doit contenir qu'une seule responsabilité claire, nommée d'après son contenu. Évite les fichiers `helpers.ts` ou `utils.ts` qui accumulent du code sans lien."
quiz:
  - question: "Un projet a cette structure : `src/app/components/`, `src/app/services/`, `src/app/directives/`, chacun avec des dizaines de fichiers sans rapport entre eux. Que recommande le style guide officiel d'Angular ?"
    choix:
      - "Rien à changer : regrouper par type de fichier est la structure recommandée pour les gros projets"
      - "Réorganiser par fonctionnalité ou thème métier, en évitant les dossiers génériques comme components, services ou directives"
      - "Fusionner tous les fichiers dans un seul dossier app/ à plat"
      - "Créer un NgModule par type de fichier pour mieux les isoler"
    reponse: 1
    explication: "Le style guide v21 est explicite : « Organize your project into subdirectories based on the features of your application » et déconseille les dossiers par type technique (components, directives, services). Avec des dossiers par type, retrouver tout ce qui concerne une fonctionnalité (panier, catalogue…) oblige à naviguer dans plusieurs dossiers sans rapport apparent."
  - question: "Une classe de composant s'appelle `PanierResume`. D'après le style guide actuel, quel nom de fichier est correct ?"
    choix:
      - "panier-resume.ts"
      - "panier-resume.component.ts"
      - "PanierResume.ts"
      - "panier_resume.ts"
    reponse: 0
    explication: "Le style guide donne l'exemple exact d'un composant nommé UserProfile dont le fichier est user-profile.ts, sans suffixe .component. Le nom de fichier est le kebab-case du nom de classe, sans underscore ni casse d'origine conservée."
  - question: "Deux fonctionnalités `catalogue/` et `panier/` s'exposent chacune via un barrel `index.ts`. `panier` importe un type depuis le barrel de `catalogue`, et `catalogue` importe une fonction depuis le barrel de `panier` pour afficher un badge « déjà au panier ». Quel est le risque principal ?"
    choix:
      - "Aucun : les barrels sont justement faits pour ce genre d'import croisé"
      - "Une dépendance circulaire entre les deux fonctionnalités, masquée par les barrels et parfois difficile à diagnostiquer (erreurs d'ordre d'initialisation, valeurs `undefined` inattendues)"
      - "Angular refuse de compiler dès qu'un barrel est utilisé deux fois"
      - "Le bundle final double de taille automatiquement"
    reponse: 1
    explication: "Deux fonctionnalités qui s'importent l'une l'autre, même indirectement via un barrel, créent un cycle. Le barrel ne cause pas le cycle mais le rend plus facile à créer sans s'en rendre compte, et plus difficile à repérer dans le code puisque l'import pointe vers un dossier plutôt qu'un fichier précis. La solution est de faire remonter la dépendance commune (ici, un type ou un service) vers shared, plutôt que de faire dépendre deux fonctionnalités l'une de l'autre."
---

## Essentiel

Le style guide officiel d'Angular (v21) recommande d'organiser le code **par fonctionnalité**, pas par type technique. Concrètement : éviter des dossiers globaux `components/`, `services/`, `directives/` qui mélangent des dizaines de fonctionnalités sans rapport, et préférer un dossier par domaine métier (`panier/`, `catalogue/`, `compte-client/`), chacun regroupant ses propres composants, services et modèles.

```
src/app/
  panier/
    panier.routes.ts
    panier-page.ts
    panier-page.html
    panier.service.ts
    panier.model.ts
  catalogue/
    catalogue.routes.ts
    catalogue-page.ts
    produit-carte.ts
    produit.service.ts
```

Autre changement du style guide actuel : les fichiers de composant n'ont plus besoin du suffixe `.component.ts`. Une classe `ProduitCarte` se met dans `produit-carte.ts`, avec `produit-carte.html` et `produit-carte.css` à côté — mêmes noms de base, extensions différentes. Les tests gardent le suffixe `.spec.ts`.

Beaucoup d'équipes ajoutent à cette base deux dossiers transverses : `core/` pour ce qui est instancié une seule fois pour toute l'application (authentification, intercepteurs), et `shared/` pour ce qui est réutilisé par plusieurs fonctionnalités sans porter de logique métier (un composant de bouton, un pipe de formatage). **Ce découpage `core` / `shared` / `features` est une convention d'équipe très répandue, pas un nom ou une structure imposée par le style guide Angular** — celui-ci ne va pas jusqu'à prescrire ces noms de dossiers précis, seulement le principe d'organisation par fonctionnalité.

## Détail

### Pourquoi c'est utile

Avec une organisation par type technique, comprendre ou modifier une fonctionnalité oblige à ouvrir plusieurs dossiers sans lien apparent entre eux, et à deviner quels fichiers de `services/` ou `components/` concernent vraiment le panier. Avec une organisation par fonctionnalité, tout ce qui concerne le panier est à un seul endroit : plus facile à retrouver, à faire évoluer, et à supprimer proprement si la fonctionnalité disparaît.

### Exemple 1 — Structure complète d'un projet boutique

```
src/
  app/
    core/
      auth/
        auth.service.ts
        auth.guard.ts
      http/
        gestion-erreurs.interceptor.ts
    shared/
      ui/
        bouton-charge.ts
        carte.ts
      pipes/
        devise.ts
    features/
      catalogue/
        catalogue.routes.ts
        catalogue-page.ts
        produit-carte.ts
        produit.service.ts
        produit.model.ts
      panier/
        panier.routes.ts
        panier-page.ts
        panier.service.ts
        panier.model.ts
    app.routes.ts
    app.config.ts
  main.ts
```

`core` ne contient que des services transverses fournis en `providedIn: 'root'`, jamais de composants d'affichage. `shared` ne contient que des éléments sans dépendance à une fonctionnalité précise : un `ProduitCarte` qui connaît le modèle `Produit` du catalogue n'a pas sa place dans `shared`, mais un `BoutonCharge` générique, oui.

### Exemple 2 — Un fichier de routes par fonctionnalité

```ts
// features/panier/panier.routes.ts
import { Routes } from '@angular/router';

export const PANIER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./panier-page').then((m) => m.PanierPage) },
  { path: 'validation', loadComponent: () => import('./validation-page').then((m) => m.ValidationPage) },
];
```

```ts
// app.routes.ts
export const routes: Routes = [
  { path: 'panier', loadChildren: () => import('./features/panier/panier.routes').then((m) => m.PANIER_ROUTES) },
];
```

Chaque fonctionnalité expose ses propres routes, chargées en différé (lazy-loading) depuis les routes racine. Le détail du lazy-loading avec `loadChildren` est couvert dans la leçon « Chargement différé » du chapitre Routage.

### Exemple 3 — Nommage : avant / après le style guide actuel

| Élément | Ancienne convention | Convention actuelle du style guide |
|---|---|---|
| Composant `ProduitCarte` | `produit-carte.component.ts` | `produit-carte.ts` |
| Test du composant | `produit-carte.component.spec.ts` | `produit-carte.spec.ts` |
| Template associé | `produit-carte.component.html` | `produit-carte.html` |

Point à connaître : cette suppression du suffixe est documentée explicitement pour les **composants**. Le schematic `ng generate service`, lui, continue en Angular 21 de générer un fichier suffixé `.service.ts` par défaut (ex. `panier.service.ts`) — la CLI n'a pas encore été alignée sur le même principe pour tous les types de fichiers. En pratique, beaucoup de projets restent sur `panier.service.ts` pour les services par cohérence avec ce que la CLI génère, et adoptent le nom sans suffixe surtout pour les composants.

### Limites de dépendances entre dossiers

Convention d'équipe répandue (pas une règle imposée par Angular) pour garder une architecture lisible en grandissant :

- `shared` ne dépend de rien d'autre que d'autres fichiers de `shared` — jamais d'une fonctionnalité précise.
- `features/x` peut dépendre de `core` et `shared`, jamais directement de `features/y`. Si deux fonctionnalités ont vraiment besoin de partager quelque chose, ce quelque chose monte dans `shared` (ou `core` s'il s'agit d'un service transverse).
- `core` ne dépend d'aucune fonctionnalité et ne contient pas de composants d'affichage — seulement des services et des guards transverses.

### Pièges courants

> **Transformer `shared` en fourre-tout.** Un dossier `shared` qui accumule des composants qui ne sont en réalité utilisés que par une seule fonctionnalité perd son intérêt : il faut alors chercher dans deux endroits pour comprendre une fonctionnalité. Un élément déplacé dans `shared` doit être réellement utilisé (ou clairement destiné à l'être) par au moins deux fonctionnalités différentes.

> **Créer des dépendances circulaires entre fonctionnalités.** Une fonctionnalité qui importe directement un fichier d'une autre fonctionnalité (même sans barrel) crée un couplage qui rend chaque fonctionnalité plus difficile à faire évoluer ou à retirer isolément. Si le besoin est réel, faire remonter l'élément partagé dans `shared`.

> **Multiplier les barrels `index.ts` dans toute l'arborescence.** Un barrel par dossier semble pratique pour raccourcir les imports, mais il complique le suivi des dépendances réelles (l'import pointe vers un dossier, pas un fichier), peut ralentir la compilation sur de gros projets et favorise justement les dépendances circulaires accidentelles décrites plus haut. Un barrel ciblé, au niveau d'une fonctionnalité qui expose volontairement une petite API publique, reste défendable ; un barrel systématique à chaque niveau de dossier l'est moins.

### À retenir

- Organiser **par fonctionnalité**, pas par type de fichier : c'est la recommandation du style guide officiel, contrairement aux dossiers globaux `components/`, `services/`.
- Fichiers de composant sans suffixe de type (`produit-carte.ts`), tests en `.spec.ts` : convention actuelle documentée pour les composants ; la CLI garde encore le suffixe `.service.ts` pour les services générés.
- `core` / `shared` / `features` est une convention d'équipe répandue et utile, pas une structure imposée par Angular.
- Une fonctionnalité ne doit pas dépendre directement d'une autre fonctionnalité : faire remonter le commun dans `shared` ou `core`.
- Les barrels simplifient les imports mais masquent les dépendances réelles : à utiliser avec parcimonie, pas systématiquement.
