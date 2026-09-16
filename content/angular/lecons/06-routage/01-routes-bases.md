---
id: routes-bases
chapitre: routage
ordre: 1
titre: "Définir des routes"
termes:
  - terme: Routes
    definition: "Type Angular qui décrit un **tableau** d'objets route (`path`, `component`, `children`...). C'est ce tableau, généralement exporté depuis `app.routes.ts`, que l'on passe à `provideRouter()`."
  - terme: "provideRouter()"
    definition: "Fonction (`@angular/router`) qui active le routeur en fournissant ses providers à l'application. S'utilise dans la liste `providers` de `app.config.ts`, avec le tableau de routes en premier argument."
  - terme: "<router-outlet>"
    definition: "Directive qui marque, dans un template, l'endroit où le routeur affiche le composant correspondant à la route active. Une application a au moins un `<router-outlet>` dans son composant racine."
  - terme: routerLink
    definition: "Directive qui remplace `href` pour naviguer entre les routes **sans recharger la page**. Accepte une chaîne (`routerLink=\"/produits\"`) ou un tableau de segments (`[routerLink]=\"['/produits', produit.id]\"`)."
  - terme: routerLinkActive
    definition: "Directive qui ajoute une ou plusieurs classes CSS au lien quand sa route correspond à l'URL active. Utile pour mettre en évidence l'onglet de navigation courant."
  - terme: "redirectTo et pathMatch"
    definition: "`redirectTo` redirige une route vers une autre. `pathMatch: 'full'` précise que la redirection ne s'applique que si l'URL correspond **entièrement** au `path` (indispensable pour un `path: ''`, sinon toutes les URL correspondent au préfixe vide)."
  - terme: "Route « wildcard » (**)"
    definition: "Route dont le `path` vaut `**` : elle correspond à n'importe quelle URL non reconnue par les routes précédentes. Placée en dernier dans le tableau, elle sert de page « 404 »."
  - terme: "inject(Router)"
    definition: "Récupère le service `Router` pour naviguer **par code** (en dehors d'un `routerLink`), par exemple après la soumission d'un formulaire : `this.router.navigate(['/panier'])`."
quiz:
  - question: "Que se passe-t-il si la route `{ path: '', redirectTo: '/produits' }` est écrite sans `pathMatch: 'full'` ?"
    code: |
      export const routes: Routes = [
        { path: '', redirectTo: '/produits' },
        { path: 'produits', component: ListeProduits },
      ];
    choix:
      - "Rien de spécial, le comportement est identique avec ou sans `pathMatch`"
      - "Angular refuse de démarrer : `pathMatch` est obligatoire dès qu'il y a un `redirectTo`"
      - "Par défaut (`pathMatch: 'prefix'`), le chemin vide préfixe toutes les URL : la redirection s'applique tout le temps, y compris sur `/produits`"
      - "La redirection ne fonctionne que si l'utilisateur clique sur un `routerLink`"
    reponse: 2
    explication: "`pathMatch` vaut `'prefix'` par défaut : Angular vérifie que l'URL **commence** par le `path`. Un `path: ''` est un préfixe de toute URL, donc la redirection se déclenche systématiquement, y compris en boucle. `pathMatch: 'full'` exige une correspondance exacte, réservée au cas où l'URL est vraiment vide."
  - question: "Dans quel ordre faut-il placer ces trois routes pour qu'elles fonctionnent toutes ?"
    code: |
      { path: 'produits', component: ListeProduits }
      { path: '**', component: PageIntrouvable }
      { path: '', redirectTo: '/produits', pathMatch: 'full' }
    choix:
      - "L'ordre du tableau n'a aucune importance, Angular trie les routes par spécificité"
      - "`**` doit toujours être en premier pour être vérifié en priorité"
      - "`produits` et la redirection avant `**`, qui doit rester la dernière route du tableau"
      - "Il faut deux tableaux de routes séparés, un pour `**` et un pour les autres"
    reponse: 2
    explication: "Le routeur teste les routes **dans l'ordre** et s'arrête à la première qui correspond. `**` correspond à absolument tout : si elle est placée avant les autres, elle les rend inaccessibles. Elle doit donc toujours être en dernière position."
  - question: "Un composant a un bouton « Valider la commande » qui doit rediriger vers `/confirmation` après un appel HTTP réussi. Quelle est la bonne approche ?"
    choix:
      - "Ajouter un `routerLink` sur le bouton, il sera suivi une fois l'appel HTTP terminé"
      - "Injecter `Router` avec `inject(Router)` et appeler `this.router.navigate(['/confirmation'])` dans le callback de succès"
      - "Changer manuellement `window.location.href`"
      - "Mettre à jour une variable `currentRoute` liée au `<router-outlet>`"
    reponse: 1
    explication: "`routerLink` déclenche une navigation **au clic**, sans pouvoir attendre un résultat asynchrone. Pour naviguer après un traitement (ici la fin d'un appel HTTP), on injecte le service `Router` et on appelle `navigate()` par code, au bon moment. `window.location.href` fonctionnerait mais recharge toute l'application, ce que le routeur Angular évite justement."
---

## Essentiel

Le routeur Angular associe une **URL** à un **composant**. On décrit cette association dans un tableau `Routes`, généralement dans `app.routes.ts` :

```ts
// app.routes.ts
import { Routes } from '@angular/router';
import { ListeProduits } from './produits/liste-produits';
import { FicheProduit } from './produits/fiche-produit';
import { PageIntrouvable } from './page-introuvable';

export const routes: Routes = [
  { path: '', redirectTo: '/produits', pathMatch: 'full' },
  { path: 'produits', component: ListeProduits, title: 'Nos produits' },
  { path: 'produits/velo-01', component: FicheProduit },
  { path: '**', component: PageIntrouvable },
];
```

Ce tableau est activé avec `provideRouter()`, dans `app.config.ts` :

```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
```

Le composant racine place ensuite un `<router-outlet>` : c'est l'emplacement où le composant de la route active s'affiche.

```html
<!-- app.html -->
<nav>
  <a routerLink="/produits" routerLinkActive="actif">Produits</a>
</nav>
<router-outlet />
```

`routerLink` remplace `href` pour naviguer sans recharger la page. `routerLinkActive` ajoute une classe CSS au lien de la route active. Le routeur teste les routes **dans l'ordre** du tableau : la route `**` (wildcard), qui capte toute URL non reconnue, doit donc toujours être placée en dernier.

## Détail

### Comment ça marche

À chaque changement d'URL (clic sur un `routerLink`, saisie dans la barre d'adresse, boutons précédent/suivant du navigateur), le routeur :

1. Parcourt le tableau `Routes` dans l'ordre et retient la **première** route qui correspond.
2. Instancie le composant associé et l'affiche dans le `<router-outlet>` correspondant.
3. Met à jour l'URL du navigateur (sans recharger la page, sauf navigation initiale).

Le contenu du reste de l'application (barre de navigation, pied de page...) reste inchangé : seul ce qui se trouve dans le `<router-outlet>` change.

### Exemple 1 — Route par défaut et route 404

```ts
export const routes: Routes = [
  { path: '', redirectTo: '/produits', pathMatch: 'full' },
  { path: 'produits', component: ListeProduits },
  { path: 'panier', component: Panier },
  { path: '**', component: PageIntrouvable },
];
```

- `path: ''` avec `pathMatch: 'full'` : visiter la racine du site redirige vers `/produits`.
- `path: '**'` : toute URL qui ne correspond à aucune route précédente (ex. `/xyz`) affiche `PageIntrouvable`. Comme le routeur s'arrête à la première correspondance, cette route doit rester la **dernière** du tableau.

### Exemple 2 — Routes enfants et outlet imbriqué

Un espace client a plusieurs sous-pages qui partagent une mise en page commune (menu latéral) :

```ts
export const routes: Routes = [
  {
    path: 'compte',
    component: EspaceClient, // contient son propre <router-outlet>
    children: [
      { path: 'profil', component: Profil },
      { path: 'commandes', component: HistoriqueCommandes },
      { path: '', redirectTo: 'profil', pathMatch: 'full' },
    ],
  },
];
```

```html
<!-- espace-client.html -->
<aside>
  <a routerLink="profil">Profil</a>
  <a routerLink="commandes">Commandes</a>
</aside>
<router-outlet /> <!-- affiche Profil ou HistoriqueCommandes -->
```

`EspaceClient` possède son propre `<router-outlet>`, imbriqué dans celui du composant racine. `/compte/profil` affiche donc l'application avec, à l'intérieur, `EspaceClient`, qui affiche à son tour `Profil`.

### Exemple 3 — Navigation par code

```ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({ selector: 'app-panier', templateUrl: './panier.html' })
export class Panier {
  private router = inject(Router);
  private commandeService = inject(CommandeService);

  valider() {
    this.commandeService.valider().subscribe(() => {
      this.router.navigate(['/confirmation']);
    });
  }
}
```

`navigate()` accepte un tableau de segments, comme `routerLink`. C'est la méthode à utiliser quand la navigation dépend d'un résultat asynchrone (ici, la fin d'un appel au service), pas d'un simple clic.

### Exemple 4 — Titre de page

```ts
{ path: 'produits', component: ListeProduits, title: 'Nos produits — Ma Boutique' }
```

La propriété `title` d'une route met à jour automatiquement `document.title` lors de la navigation, sans code supplémentaire.

### Pièges courants

> **Oublier `pathMatch: 'full'` sur une redirection depuis `path: ''`.** Par défaut, `pathMatch` vaut `'prefix'` : le chemin vide préfixe **toutes** les URL, la redirection se déclenche donc systématiquement, y compris sur des routes qui n'ont rien à voir. Réservez `pathMatch: 'full'` aux redirections depuis la racine.

> **Placer la route `**` avant les autres.** Le routeur s'arrête à la première route qui correspond. Une route `**` en tête du tableau capte toutes les URL et rend les routes suivantes définitivement inaccessibles.

> **Oublier le `<router-outlet>`.** Sans lui, le routeur change bien l'URL et sélectionne la bonne route, mais aucun composant ne s'affiche nulle part : rien à l'écran, sans message d'erreur évident.

### À retenir

- Le tableau `Routes` associe des chemins à des composants ; `provideRouter(routes)` l'active dans `app.config.ts`.
- `<router-outlet>` marque où le composant de la route active s'affiche ; `routerLink` / `routerLinkActive` gèrent la navigation et l'état actif dans le template.
- L'ordre du tableau compte : la route `**` (page introuvable) doit toujours être en dernier.
- Les routes enfants (`children`) créent un `<router-outlet>` imbriqué, utile pour une mise en page partagée entre plusieurs sous-pages.
- `inject(Router)` puis `navigate()` permet de naviguer par code, par exemple après un appel HTTP réussi.
