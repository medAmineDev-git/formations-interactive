---
id: ssr-bases
chapitre: ssr
ordre: 1
titre: "Le rendu côté serveur : principes et mise en place"
termes:
  - terme: SSR (Server-Side Rendering)
    definition: "Rendu de l'application sur un serveur Node, à **chaque requête** : le serveur exécute Angular, produit le HTML correspondant à l'état courant, et l'envoie déjà rempli au navigateur — avant même que le JavaScript de l'application soit téléchargé."
  - terme: CSR (Client-Side Rendering)
    definition: "Mode par défaut d'une application Angular sans SSR : le navigateur télécharge une page HTML quasiment vide, puis exécute le JavaScript de l'application pour générer tout le contenu. Le premier affichage attend la fin du téléchargement et de l'exécution du bundle."
  - terme: "SSG (Static Site Generation) / Prérendu"
    definition: "Rendu effectué **une seule fois, au moment du build**, pour une liste de routes connues à l'avance : le résultat est un fichier HTML statique par route, servable sans serveur Node à l'exécution. Voir `RenderMode.Prerender` (leçon 4)."
  - terme: "provideServerRendering()"
    definition: "Fonction de `@angular/ssr` à ajouter aux providers de la configuration serveur de l'application pour activer le rendu côté serveur. S'utilise typiquement avec `withRoutes(serverRoutes)` pour préciser le mode de rendu de chaque route."
  - terme: "BootstrapContext"
    definition: "Type introduit en Angular 21 : `bootstrapApplication()` reçoit désormais, côté serveur, un troisième argument de ce type dans `main.server.ts`. Un schematic de migration automatique adapte ce fichier lors d'un `ng update` vers v21."
  - terme: "PLATFORM_ID / isPlatformBrowser()"
    definition: "`PLATFORM_ID` (jeton d'injection de `@angular/core`) identifie la plateforme d'exécution courante ; `isPlatformBrowser(platformId)` (de `@angular/common`) renvoie `true` uniquement si le code s'exécute dans un navigateur, permettant d'éviter d'exécuter du code dépendant de `window`/`document` côté serveur."
  - terme: "ServerRoute / RenderMode"
    definition: "`ServerRoute` (dans `app.routes.server.ts`) associe un chemin à un `RenderMode` (`Server`, `Client` ou `Prerender`), et peut fixer des en-têtes ou un code de statut HTTP (`headers`, `status`) pour cette route."
quiz:
  - question: "Ce service est utilisé aussi bien côté serveur (SSR) que côté client. Que se passe-t-il lors du rendu côté serveur ?"
    code: |
      @Injectable({ providedIn: 'root' })
      export class PreferencesService {
        theme = localStorage.getItem('theme') ?? 'clair';
      }
    choix:
      - "Angular ignore silencieusement l'initialisation du champ côté serveur"
      - "Le rendu serveur échoue : `localStorage` n'existe pas dans l'environnement Node qui exécute le rendu"
      - "Angular fournit automatiquement une implémentation vide de `localStorage` côté serveur"
      - "Le code s'exécute normalement, `localStorage` étant standardisé indépendamment du navigateur"
    reponse: 1
    explication: "Le serveur qui produit le rendu SSR est un processus Node : les API du navigateur (`window`, `document`, `localStorage`…) n'y existent tout simplement pas. Un accès direct, non protégé, fait planter le rendu serveur. Il faut passer par `isPlatformBrowser(inject(PLATFORM_ID))` avant d'y accéder, ou déplacer ce code dans un hook exécuté seulement côté client (`afterNextRender`)."
  - question: "Une fiche produit affiche un stock mis à jour en temps réel et doit être indexée par les moteurs de recherche. Quel mode de rendu choisir plutôt qu'un prérendu (SSG) au build ?"
    choix:
      - "SSR : le HTML est régénéré à chaque requête, donc toujours à jour, tout en restant immédiatement disponible pour le robot d'indexation"
      - "SSG, en relançant le build toutes les minutes pour actualiser le stock"
      - "CSR : le stock est de toute façon rechargé côté client via une requête HTTP après le premier affichage"
      - "Peu importe le choix, les trois modes produisent un HTML strictement identique"
    reponse: 0
    explication: "Le prérendu (SSG) fige les données au moment du build : inadapté à une donnée qui change en continu comme un stock. Le SSR régénère le HTML à chaque requête, donc avec des données fraîches, tout en offrant à un robot d'indexation un contenu déjà présent dans la réponse HTML, contrairement au CSR pur."
  - question: "Que change concrètement l'introduction de `BootstrapContext` (Angular 21) dans `main.server.ts` ?"
    choix:
      - "Elle supprime le besoin de `provideServerRendering()`"
      - "`bootstrapApplication()` reçoit un troisième argument de ce type côté serveur ; un schematic migre automatiquement le fichier lors d'un `ng update` vers v21"
      - "Elle remplace `isPlatformBrowser()` pour tout code sensible à la plateforme"
      - "Elle rend `PLATFORM_ID` obsolète dans toute l'application"
    reponse: 1
    explication: "`BootstrapContext` est un changement ciblé sur la signature de `bootstrapApplication()` côté serveur (troisième argument), migré automatiquement par un schematic. Elle ne touche ni `provideServerRendering()`, ni `PLATFORM_ID`/`isPlatformBrowser()`, qui restent les outils pour du code conditionnel à la plateforme ailleurs dans l'application."
---

## Essentiel

Le **SSR** (Server-Side Rendering) fait exécuter Angular une première fois sur un serveur Node, à chaque requête, pour produire du HTML déjà rempli — au lieu du HTML quasiment vide envoyé en **CSR** (Client-Side Rendering), qui attend le téléchargement et l'exécution du JavaScript pour afficher quoi que ce soit. Deux bénéfices concrets : un premier affichage plus rapide, surtout sur un réseau lent ou un appareil peu puissant, et un contenu directement présent dans la réponse HTML pour les robots d'indexation qui n'exécutent pas (ou mal) le JavaScript.

Le SSR se distingue du **prérendu** (SSG) : le SSR régénère le HTML à chaque requête (données à jour, mais un serveur Node à faire tourner), le prérendu le fait une seule fois au build (rapide et sans serveur à l'exécution, mais des données figées). Le choix se fait page par page (approfondi en leçon 4).

Mise en place : `ng new --ssr` pour un nouveau projet, ou `ng add @angular/ssr` sur un projet existant. Cela génère `main.server.ts`, `server.ts` et `app.config.server.ts`, et ajoute `provideServerRendering()` aux providers serveur.

```ts
// app.config.server.ts
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

Côté serveur, `window` et `document` n'existent pas : tout code qui y accède directement doit être protégé avec `isPlatformBrowser(inject(PLATFORM_ID))`, ou déplacé dans `afterNextRender()`.

## Détail

### Pourquoi c'est utile

Sans SSR, un moteur de recherche (ou un aperçu de lien partagé sur un réseau social) qui ne prend pas la peine d'exécuter le JavaScript de la page ne voit rien d'exploitable dans le HTML initial. Les principaux robots modernes savent exécuter du JavaScript, mais de façon plus coûteuse, moins fiable et pas systématique selon les robots — le SSR retire cette incertitude en livrant le contenu directement dans le HTML.

Sur un réseau lent ou un appareil bas de gamme, l'écart entre CSR et SSR se ressent aussi côté utilisateur humain : avec CSR, l'écran reste vide (ou affiche un simple spinner) jusqu'à ce que le bundle JavaScript soit téléchargé, parsé et exécuté ; avec SSR, du contenu utile est visible dès la réponse HTML, avant même que l'application Angular ne prenne le relais côté client (ce relais, l'**hydratation**, fait l'objet de la leçon suivante).

### Exemple 1 — Mise en place sur un projet existant

```bash
ng add @angular/ssr
```

La commande installe `@angular/ssr`, génère `server.ts` (le serveur Node, typiquement Express), `main.server.ts` (le point d'entrée du bootstrap côté serveur) et `app.config.server.ts` (les providers spécifiques au serveur), et adapte `angular.json` pour produire, au build, un bundle serveur en plus du bundle navigateur habituel.

### Exemple 2 — `main.server.ts` et `BootstrapContext` (nouveauté v21)

```ts
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
```

Avant Angular 21, `bootstrapApplication()` ne prenait que le composant racine et la configuration côté serveur. En v21, un troisième paramètre de type `BootstrapContext` est transmis à chaque rendu serveur ; un schematic de migration automatique met à jour ce fichier lors d'un `ng update` vers Angular 21, sans intervention manuelle dans le cas courant.

### Exemple 3 — Code sensible à la plateforme

```ts
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SuiviVisiteService {
  private platformId = inject(PLATFORM_ID);

  enregistrerVisite(produitId: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('dernier-produit-vu', produitId);
    }
  }
}
```

`isPlatformBrowser()` reste l'outil classique pour ce genre de branchement conditionnel dans un service. Pour du code purement lié au DOM dans un composant (mesurer un élément, initialiser une librairie tierce), `afterNextRender()` est souvent préférable : il ne s'exécute que côté client, après le rendu, sans avoir besoin d'un test de plateforme explicite dans le corps du composant.

### CSR, SSR et SSG comparés

| | CSR | SSR | SSG / Prérendu |
|---|---|---|---|
| Moment du rendu HTML | Dans le navigateur, après le JS | À chaque requête, sur un serveur Node | Une seule fois, au build |
| Premier affichage | Attend le téléchargement + l'exécution du JS | Rapide : HTML déjà présent | Le plus rapide : fichier statique |
| Fraîcheur des données | Toujours à jour (côté client) | À jour à chaque requête | Figées au moment du build |
| Infrastructure requise | Aucune (fichiers statiques, CDN) | Serveur Node à héberger et à faire monter en charge | Aucune à l'exécution |
| Adapté à | Interfaces très interactives, contenu privé (tableau de bord) | Contenu qui change souvent et doit être indexé (fiche produit avec stock) | Contenu stable entre deux builds (page « À propos », catalogue peu volatile) |

### Pièges courants

> **Accéder directement à `window`/`document` dans le constructeur ou un champ de classe.** Le rendu serveur s'exécute dans Node : ce code plante immédiatement le rendu de la page concernée (`ReferenceError: window is not defined` ou équivalent). Protéger l'accès avec `isPlatformBrowser()`, ou le déplacer dans `afterNextRender()`.

> **Croire que le SSR est gratuit.** Contrairement au CSR pur (fichiers statiques servis par un CDN) ou au SSG (aucun coût à l'exécution), le SSR exige un serveur Node à héberger, surveiller et faire monter en charge : chaque requête déclenche un rendu côté serveur, ce qui consomme du CPU et ajoute une latence propre au serveur (à distinguer du temps de téléchargement du bundle côté client). Un choix à faire page par page, pas par défaut sur toute l'application.

> **Confondre SSR et SSG.** Les deux produisent du HTML avant que le navigateur n'exécute quoi que ce soit, mais à des moments très différents : le SSG fige les données au build (rien à héberger ensuite), le SSR les régénère à chaque requête (données fraîches, mais un serveur à faire tourner en continu).

### À retenir

- Le SSR exécute Angular sur un serveur Node à chaque requête pour produire du HTML déjà rempli, contrairement au CSR (rendu entièrement côté navigateur) et au SSG (rendu unique, au build).
- Bénéfices principaux : premier affichage plus rapide (réseaux lents, appareils peu puissants) et contenu directement exploitable par les robots d'indexation.
- `ng new --ssr` / `ng add @angular/ssr` génèrent `main.server.ts`, `server.ts`, `app.config.server.ts` et branchent `provideServerRendering()`.
- Côté serveur, `window`/`document` n'existent pas : protéger l'accès avec `isPlatformBrowser(inject(PLATFORM_ID))`, ou préférer `afterNextRender()` pour du code purement client.
- `BootstrapContext` (nouveauté v21) est un troisième argument désormais transmis à `bootstrapApplication()` dans `main.server.ts`, migré automatiquement par un schematic — il ne remplace ni `provideServerRendering()`, ni `isPlatformBrowser()`.
- Le SSR a un coût d'infrastructure réel (serveur à héberger, charge par requête, temps de réponse à surveiller) : un choix à assumer, pas un interrupteur à activer partout par défaut.
