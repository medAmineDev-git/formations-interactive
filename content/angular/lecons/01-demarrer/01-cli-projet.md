---
id: cli-projet
chapitre: demarrer
ordre: 1
titre: "Le CLI et la structure d'un projet"
termes:
  - terme: Angular CLI
    definition: "Outil en ligne de commande officiel (`ng`) pour créer, développer, tester et construire un projet Angular. Il s'installe globalement (`npm install -g @angular/cli`) ou s'utilise via `npx`."
  - terme: "ng new"
    definition: "Commande qui crée un nouveau workspace Angular. Elle pose quelques questions interactives (feuille de style, SSR, tests unitaires...) puis génère un projet prêt à l'emploi, standalone par défaut."
  - terme: bootstrapApplication
    definition: "Fonction (`@angular/platform-browser`) qui démarre une application **standalone** à partir d'un composant racine et d'une configuration, sans passer par un `NgModule` racine."
  - terme: "app.config.ts / ApplicationConfig"
    definition: "Fichier qui centralise la configuration de l'application : la liste des **providers** globaux (routeur, client HTTP, détection de changements...). Remplace le rôle que jouait `AppModule` avant l'approche standalone."
  - terme: angular.json
    definition: "Fichier de configuration du workspace CLI. Il décrit, pour chaque projet, comment le construire, le servir et le tester (builder utilisé, options, budgets de taille...)."
  - terme: "@angular/build:application"
    definition: "**Builder** par défaut d'un projet Angular récent : **esbuild** pour la construction (`ng build`), **Vite** pour le serveur de développement (`ng serve`). Remplace l'ancien builder basé sur Webpack."
  - terme: "ng generate (ng g)"
    definition: "Commande qui génère du code à partir de schematics : composant, service, directive, pipe, garde de route... Respecte automatiquement les conventions du projet."
quiz:
  - question: "Après `ng generate component produits/produit-card`, quel est le nom du fichier TypeScript créé, en Angular 21 ?"
    choix:
      - "produits/produit-card.component.ts"
      - "produits/produit-card.ts"
      - "produits/ProduitCard.ts"
      - "produits/produit-card/index.ts"
    reponse: 1
    explication: "Le style guide actuel supprime le suffixe de type dans le nom de fichier : un composant nommé `ProduitCard` donne le fichier `produit-card.ts` (accompagné de `produit-card.html`, `produit-card.css` et `produit-card.spec.ts`), pas `produit-card.component.ts`."
  - question: "Où déclare-t-on les providers globaux d'une application Angular 21 générée par le CLI (routeur, client HTTP...) ?"
    choix:
      - "Dans `angular.json`"
      - "Dans `app.config.ts`, via la liste `providers` de l'`ApplicationConfig`"
      - "Dans `index.html`"
      - "Dans un `AppModule` généré automatiquement"
    reponse: 1
    explication: "`app.config.ts` exporte un objet `ApplicationConfig` dont la propriété `providers` regroupe toute la configuration transverse. `main.ts` le passe à `bootstrapApplication`. Aucun `AppModule` n'est généré par défaut : les projets Angular récents sont standalone."
  - question: "Quel est le builder utilisé par défaut pour `ng build` et `ng serve` dans un projet Angular 21 fraîchement généré ?"
    choix:
      - "`@angular-devkit/build-angular:browser`, basé sur Webpack"
      - "`@angular/build:application`, basé sur esbuild (build) et Vite (serveur de dev)"
      - "Un builder personnalisé à écrire soi-même"
      - "`ts-node`, qui exécute directement le TypeScript"
    reponse: 1
    explication: "Ce builder est celui référencé dans `angular.json` d'un nouveau projet. Il assemble l'application avec esbuild pour la construction et s'appuie sur Vite pour le serveur de développement rapide de `ng serve`."
---

## Essentiel

Le **CLI Angular** (`ng`) est l'outil officiel pour créer et faire évoluer un projet. `ng new ma-boutique` crée un projet complet en posant quelques questions (feuille de style, SSR, tests unitaires...). Le résultat est une application **standalone** : pas de `NgModule` racine, tout démarre depuis `main.ts`.

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

`bootstrapApplication` prend le composant racine (`App`) et une **configuration** qui regroupe tous les providers de l'application : routeur, client HTTP, détection de changements...

```ts
// app.config.ts
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
  ],
};
```

Le fichier `angular.json` décrit, pour chaque projet du workspace, comment le construire, le servir et le tester. Commandes courantes : `ng serve` (serveur de développement), `ng build` (construction de production), `ng generate` (générer du code). Le builder par défaut, `@angular/build:application`, s'appuie sur **esbuild** pour la construction et **Vite** pour `ng serve` — rapide, sans configuration à écrire.

## Détail

### Comment ça marche

Un projet généré par `ng new` a la structure suivante (organisation simplifiée) :

```text
ma-boutique/
├── angular.json          # configuration du workspace (builders, options)
├── package.json
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── app.ts         # composant racine
│   │   ├── app.html
│   │   ├── app.css
│   │   ├── app.config.ts  # providers de l'application
│   │   └── app.routes.ts  # routes de l'application (si routage choisi)
│   ├── index.html
│   ├── main.ts             # point d'entrée, appelle bootstrapApplication
│   ├── styles.css          # styles globaux
│   └── public/              # fichiers statiques (images, favicon...)
```

Le style guide officiel recommande une **organisation par fonctionnalité** plutôt que par type de fichier : pas de dossiers globaux `components/`, `services/`, `directives/` à la racine. On regroupe plutôt les fichiers d'une même fonctionnalité (ex. `produits/`, `panier/`) dans un même dossier.

### Exemple 1 — Générer un composant avec le CLI

```bash
ng generate component produits/produit-card
# ou en abrégé :
ng g c produits/produit-card
```

Fichiers créés :

```text
src/app/produits/produit-card/
├── produit-card.ts        # pas de suffixe « .component » dans le nom de fichier
├── produit-card.html
├── produit-card.css
└── produit-card.spec.ts
```

La classe TypeScript s'appelle `ProduitCard` et le sélecteur généré est `app-produit-card` (le préfixe `app` vient de la configuration du workspace). Seul le **nom de fichier** perd son suffixe de type ; le nom de la classe reste explicite.

### Exemple 2 — Ajouter des providers dans `app.config.ts`

```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth-interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

Chaque nouvelle fonctionnalité transverse (routage, HTTP, animations...) s'ajoute ici sous forme de provider, au lieu d'un `imports` de `NgModule` comme avant l'approche standalone.

### Exemple 3 — Commandes CLI courantes

| Commande | Rôle |
|---|---|
| `ng serve` | Démarre le serveur de développement (rechargement à chaud) |
| `ng build` | Construit l'application (configuration `production` par défaut) |
| `ng test` | Lance les tests unitaires |
| `ng generate component nom` | Génère un composant (`ng g c` en abrégé) |
| `ng generate service nom` | Génère un service (`ng g s`) |
| `ng add <paquet>` | Installe et configure une librairie tierce (schematics d'intégration) |
| `ng update` | Met à jour Angular et ses dépendances, avec migrations automatiques |

### Pièges courants

> **Chercher un `webpack.config.js` à personnaliser.** Le builder par défaut (`@angular/build:application`) repose sur esbuild et Vite, pas sur Webpack : il n'y a pas de fichier de configuration Webpack à éditer directement. Les options de build se règlent dans `angular.json`, ou via un builder personnalisé pour des besoins avancés.

> **Utiliser `ng build --prod`.** Ce drapeau n'existe plus depuis longtemps dans le CLI Angular. `ng build` construit déjà avec la configuration `production` par défaut ; pour une build de développement, utiliser `ng build --configuration development`.

> **Renommer manuellement un fichier généré en `produit-card.component.ts`.** Ce n'est pas une erreur technique (Angular ne se soucie pas du nom de fichier), mais ça s'écarte du style guide actuel, qui recommande justement l'inverse pour des noms de fichiers plus courts et cohérents entre projets.

### À retenir

- Le CLI (`ng`) crée, sert, teste et construit un projet Angular.
- `ng new` génère un projet **standalone** : `main.ts` appelle `bootstrapApplication(App, appConfig)`, sans `NgModule` racine.
- `app.config.ts` centralise les providers globaux de l'application.
- `angular.json` configure les builders et options par projet ; le builder par défaut est `@angular/build:application` (esbuild + Vite).
- Le style guide actuel supprime le suffixe de type dans les noms de fichiers (`produit-card.ts`, pas `produit-card.component.ts`) et recommande une organisation par fonctionnalité.
