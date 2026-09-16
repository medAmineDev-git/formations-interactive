---
id: focus-routage
chapitre: angular-a11y
ordre: 2
titre: "Focus, titre de page et navigation"
termes:
  - terme: "Title (route.title)"
    definition: "Service `Title` (`@angular/platform-browser`) qui change le titre `<title>` du document. Combiné à la propriété `title` d'une route, il met à jour ce titre automatiquement à chaque navigation — la première chose qu'un lecteur d'écran annonce sur une page correctement structurée."
  - terme: Lien d'évitement
    definition: "Lien placé en tout premier dans le DOM (« Aller au contenu »), visible seulement au focus clavier, qui saute la navigation répétée d'en-tête pour atteindre directement le contenu principal. Se pose une seule fois dans le composant racine, pas par route."
  - terme: FocusMonitor
    definition: "Service `@angular/cdk/a11y` qui observe **comment** un élément reçoit le focus (souris, clavier, tactile, programmatique) via `monitor()`, et pose des classes CSS (`cdk-focused`, `cdk-keyboard-focused`…) permettant de ne styler le focus visible que pour la navigation clavier."
  - terme: "FocusTrap / cdkTrapFocus"
    definition: "`cdkTrapFocus` est la directive déclarative pour confiner le Tab dans un conteneur (une modale). `FocusTrapFactory` (`@angular/cdk/a11y`) en est l'équivalent impératif : créer et détruire un piège à focus sur un élément construit dynamiquement (ex. via l'overlay CDK), hors d'un template statique."
  - terme: Restitution du focus
    definition: "Replacer le focus clavier sur l'élément qui a déclenché une action (ouverture d'une modale, d'un menu) une fois cette action terminée — sans ça, le focus retombe au début du document ou disparaît, et l'utilisateur clavier perd son point de repère."
  - terme: "withViewTransitions"
    definition: "Fonctionnalité du routeur Angular (*developer preview*) qui anime la transition entre deux vues via l'API `document.startViewTransition`. Purement visuelle : elle ne gère ni le focus ni les préférences de mouvement réduit, à traiter séparément."
quiz:
  - question: "Une application définit `title` sur chaque route et laisse le routeur mettre à jour `<title>` automatiquement à chaque navigation. Est-ce suffisant pour qu'un utilisateur de lecteur d'écran perçoive le changement de page ?"
    choix:
      - "Oui, totalement : changer `<title>` redéclenche l'annonce automatique de la page comme un rechargement classique"
      - "Non, `<title>` seul ne suffit pas : sans rechargement de document, rien ne force un lecteur d'écran à relire le titre — il faut aussi déplacer le focus vers le contenu de la nouvelle vue (ex. son titre `<h1>`) pour que quelque chose soit effectivement annoncé"
      - "Non, il faut désactiver complètement le routeur Angular et recharger la page à chaque navigation"
      - "Oui, mais uniquement si la route utilise `loadComponent` pour le lazy-loading"
    reponse: 1
    explication: "Mettre à jour `<title>` reste indispensable (onglet du navigateur, historique, certains lecteurs d'écran le lisent à l'ouverture d'une page), mais dans une SPA sans rechargement, ce changement seul ne déclenche pas d'annonce vocale immédiate. Il faut combiner `title` de route avec un déplacement de focus explicite vers le contenu de la nouvelle vue pour que le changement soit réellement perçu."
  - question: "Où doit se trouver le lien d'évitement (« Aller au contenu ») dans une application Angular avec plusieurs routes ?"
    choix:
      - "Dans le template de chaque composant de page, juste avant le `<h1>`"
      - "Dans le composant racine (`AppComponent`), une seule fois, avant la navigation — pas répété dans chaque vue routée"
      - "Uniquement dans le `index.html`, en dehors de l'application Angular"
      - "Il n'a pas de sens dans une application monopage, puisqu'il n'y a qu'une seule page HTML"
    reponse: 1
    explication: "Le lien d'évitement cible l'en-tête et la navigation, qui restent affichés sur toutes les routes : il se place donc une seule fois dans le gabarit racine, pas répété par vue. Le mettre dans chaque page routée le dupliquerait sans raison ; le sortir d'Angular (`index.html`) l'empêcherait de cibler dynamiquement le contenu rendu par le routeur."
  - question: "Quelle est la différence pratique entre `cdkTrapFocus` et `FocusTrapFactory` ?"
    choix:
      - "Aucune : ce sont deux noms pour la même API"
      - "`cdkTrapFocus` est une directive à poser dans un template statique ; `FocusTrapFactory` est l'équivalent impératif, utile quand le conteneur à piéger est créé dynamiquement (ex. via l'overlay CDK) et n'existe pas comme élément de template fixe"
      - "`cdkTrapFocus` fonctionne uniquement en mode zoneless, `FocusTrapFactory` uniquement avec Zone.js"
      - "`FocusTrapFactory` est dépréciée au profit de `cdkTrapFocus`"
    reponse: 1
    explication: "Les deux s'appuient sur le même mécanisme de confinement du Tab. `cdkTrapFocus` convient dès que l'élément à piéger existe dans un template (le cas le plus courant, une modale déclarée avec `@if`). `FocusTrapFactory` (méthode `create()`/`destroy()`) s'utilise quand le conteneur est construit par du code, par exemple une superposition créée dynamiquement avec l'overlay CDK, sans directive de template à poser dessus."
---

## Essentiel

Par défaut, un changement de route Angular ne fait **rien** pour un utilisateur de lecteur d'écran : pas de rechargement de document, donc aucune des annonces automatiques d'une navigation classique (nouveau titre lu, focus remis au début de la page). Deux choses sont à gérer explicitement à chaque navigation : le **titre** du document et le **focus** clavier.

```ts
export const routes: Routes = [
  { path: 'catalogue', title: 'Catalogue — Ma Boutique', loadComponent: () => import('./catalogue/catalogue').then(m => m.Catalogue) },
  { path: 'panier', title: 'Mon panier — Ma Boutique', loadComponent: () => import('./panier/panier').then(m => m.Panier) },
];
```

La propriété `title` d'une route met à jour `<title>` via le service `Title` sans code supplémentaire. Ça reste nécessaire mais pas suffisant : sans document rechargé, rien ne force une annonce vocale de ce nouveau titre. Il faut en complément déplacer le focus vers le contenu de la nouvelle vue — typiquement son `<h1>`, rendu focusable par script avec `tabindex="-1"` s'il ne l'est pas nativement.

Deux autres besoins reviennent régulièrement dans une application Angular : un **lien d'évitement** (« Aller au contenu ») posé une seule fois dans le composant racine, pour sauter l'en-tête répété sur chaque page ; et la **restitution du focus** après une action temporaire (ouvrir puis fermer une modale, un menu) vers l'élément qui l'a déclenchée — sans ça, le focus se perd au premier plan du document.

Le module `@angular/cdk/a11y` fournit les briques : `FocusMonitor` pour observer comment un élément reçoit le focus, `FocusTrap`/`cdkTrapFocus` pour le confiner dans une modale.

## Détail

### Comment ça marche

Le routeur Angular ne touche ni au focus, ni à l'annonce vocale : il remplace un fragment de DOM et met à jour l'URL et (si configuré) `<title>`. Tout le reste — décider où va le focus, ce qui doit être annoncé — relève du code applicatif. La stratégie la plus robuste consiste à centraliser cette logique à un seul endroit (un service écoutant les événements du routeur), plutôt que de la répéter dans chaque composant de page.

### Exemple 1 — Un service central pour le titre et le focus, à chaque navigation

```ts
import { effect, ElementRef, inject, Injectable, signal } from '@angular/core';
import { Event, NavigationEnd, Router, Title } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoutageAccessible {
  private router = inject(Router);
  private titreDocument = inject(Title);
  cibleFocus = signal<ElementRef<HTMLElement> | null>(null);

  demarrer() {
    this.router.events
      .pipe(filter((e: Event): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        // Title est déjà à jour ici grâce à `title` sur la route active.
        this.cibleFocus()?.nativeElement.focus();
      });
  }
}
```

```html
<!-- app.html -->
<a class="lien-evitement" href="#contenu-principal">Aller au contenu</a>
<app-en-tete />
<main id="contenu-principal" tabindex="-1" #contenuPrincipal>
  <router-outlet />
</main>
```

```ts
// app.ts
constructor() {
  const routage = inject(RoutageAccessible);
  routage.cibleFocus.set(this.contenuPrincipal());
  routage.demarrer();
}
```

Le focus revient systématiquement sur `<main>` après chaque navigation, quelle que soit la page routée à l'intérieur. C'est un choix simple et robuste ; certaines équipes préfèrent cibler le `<h1>` de la nouvelle vue pour un contexte plus précis, au prix d'une coordination avec chaque composant de page.

### Exemple 2 — Restituer le focus après une modale, avec `FocusMonitor`

```ts
import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({ /* ... */ })
export class FicheProduit {
  private focusMonitor = inject(FocusMonitor);
  private declencheur: HTMLElement | null = null;
  boutonAvis = viewChild.required<ElementRef<HTMLElement>>('boutonAvis');

  ouvrirAvis(origine: HTMLElement) {
    this.declencheur = origine;
    this.avisOuvert.set(true);
  }

  fermerAvis() {
    this.avisOuvert.set(false);
    this.declencheur?.focus(); // le focus revient exactement là où l'utilisateur était
    this.declencheur = null;
  }
}
```

`FocusMonitor.monitor(element)` (non montré ici) permettrait en plus de distinguer un focus arrivé au clavier d'un focus arrivé à la souris, pour n'afficher un contour de focus marqué que dans le premier cas — utile pour un composant qui gère lui-même son style de focus plutôt que de compter sur `:focus-visible` du navigateur.

### Exemple 3 — `FocusTrapFactory` pour un conteneur créé dynamiquement

```ts
import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

@Component({ /* ... */ })
export class SuperpositionPanier {
  private focusTrapFactory = inject(FocusTrapFactory);
  private trap?: FocusTrap;
  conteneur = viewChild.required<ElementRef<HTMLElement>>('conteneur');

  ouvrir() {
    this.trap = this.focusTrapFactory.create(this.conteneur().nativeElement);
    this.trap.focusInitialElementWhenReady();
  }

  fermer() {
    this.trap?.destroy();
  }
}
```

À réserver aux cas où l'élément à piéger n'est pas un template statique sur lequel poser `cdkTrapFocus` — par exemple un panneau inséré via l'overlay CDK. Dans le cas courant d'une modale déclarée avec `@if` dans un template, `cdkTrapFocus` (directive déclarative, voir leçon 3) demande moins de code.

### `withViewTransitions` et mouvement réduit

```ts
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withViewTransitions())],
};
```

```css
/* Respecter la préférence système, indépendamment d'Angular */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

`withViewTransitions()` (fonctionnalité du routeur en *developer preview*) anime la transition visuelle entre deux vues via `document.startViewTransition`. C'est purement esthétique : elle n'a aucun effet sur le focus ni sur les annonces vocales, et ne désactive rien automatiquement pour les utilisateurs ayant activé « mouvement réduit » côté système. C'est au CSS de l'application de respecter `prefers-reduced-motion`, comme pour n'importe quelle animation web — Angular ne le fait pas à sa place.

### Pièges courants

> **Mettre à jour `<title>` et considérer le sujet clos.** `title` sur la route est nécessaire mais, sans rechargement de document, ne suffit pas à provoquer une annonce vocale. Le focus doit être déplacé en complément.

> **Oublier de restituer le focus à la fermeture d'une modale ou d'un menu.** `cdkTrapFocus`/`FocusTrap` empêchent le focus de s'échapper **pendant** que le panneau est ouvert, mais ne s'occupent pas de où il va **après** la fermeture — c'est au code applicatif de le renvoyer vers le déclencheur.

> **Cibler le focus sur un élément qui vient de disparaître.** Après suppression d'une ligne dans une liste (ex. un article du panier) régénérée par `@for`, l'élément qui avait le focus n'existe plus : le focus retombe silencieusement sur `<body>`. Il faut le rediriger explicitement (ligne suivante, message vide, ou conteneur de la liste) plutôt que de laisser le navigateur décider.

### À retenir

- Un changement de route Angular ne déclenche aucune annonce automatique : `title` sur la route met à jour `<title>`, mais seul un déplacement de focus explicite rend le changement perceptible.
- Centraliser la logique titre + focus dans un service unique plutôt que de la répéter dans chaque composant de page.
- Le lien d'évitement se pose une seule fois, dans le composant racine.
- `cdkTrapFocus` (déclaratif, template statique) et `FocusTrapFactory` (impératif, élément créé dynamiquement) confinent le focus ; restituer le focus au déclencheur reste une responsabilité séparée, à la charge de l'application.
- `withViewTransitions` est purement visuel : respecter `prefers-reduced-motion` reste une responsabilité CSS de l'application, pas un comportement fourni par le routeur.
