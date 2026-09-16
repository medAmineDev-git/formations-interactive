---
id: guards-resolvers
chapitre: routage
ordre: 4
titre: "Protéger et préparer une route"
termes:
  - terme: "CanActivateFn"
    definition: "Type d'un guard fonctionnel exécuté avant l'activation d'une route. Renvoie (ou résout en) `true` pour autoriser la navigation, `false` pour la bloquer, ou un `UrlTree` pour rediriger ailleurs."
  - terme: "CanMatchFn"
    definition: "Type d'un guard fonctionnel exécuté **avant même que la route soit sélectionnée**. S'il renvoie `false`, le routeur continue d'essayer les routes suivantes du tableau — utile pour faire correspondre deux routes différentes au même chemin selon une condition."
  - terme: "CanDeactivateFn"
    definition: "Type d'un guard fonctionnel exécuté avant de **quitter** une route déjà affichée. Reçoit le composant courant en premier paramètre ; sert typiquement à demander confirmation avant d'abandonner un formulaire non enregistré."
  - terme: UrlTree
    definition: "Représentation interne d'une URL, produite par `Router.createUrlTree()` ou `Router.parseUrl()`. Un guard qui renvoie un `UrlTree` déclenche une **redirection** vers cette URL, au lieu de simplement bloquer la navigation."
  - terme: "ResolveFn"
    definition: "Type d'un resolver fonctionnel qui précharge une donnée avant qu'une route ne s'active. La navigation **attend** que la valeur renvoyée (ou l'Observable/Promise) se termine avant d'afficher le composant."
  - terme: "inject() dans un guard ou un resolver"
    definition: "Les guards et resolvers fonctionnels sont de simples fonctions, exécutées dans le contexte d'injection du routeur : on y utilise `inject(MonService)` pour accéder aux services, exactement comme dans un constructeur de composant."
quiz:
  - question: "Que renvoie ce guard, et quel est l'effet si l'utilisateur n'est pas connecté ?"
    code: |
      export const authGuard: CanActivateFn = (route, state) => {
        const auth = inject(AuthService);
        const router = inject(Router);

        if (auth.estConnecte()) {
          return true;
        }
        return router.createUrlTree(['/connexion']);
      };
    choix:
      - "La navigation est simplement bloquée, l'URL ne change pas"
      - "Une exception est levée et l'application plante"
      - "L'utilisateur est redirigé vers `/connexion`, car le guard renvoie un `UrlTree`"
      - "L'utilisateur voit la page protégée, mais vide"
    reponse: 2
    explication: "Renvoyer `false` bloquerait simplement la navigation (l'utilisateur reste sur l'URL précédente). Renvoyer un `UrlTree`, produit ici par `router.createUrlTree(['/connexion'])`, déclenche au contraire une redirection explicite vers cette route : c'est la façon recommandée de rediriger un utilisateur non authentifié."
  - question: "Deux routes ont le même `path: 'produits'`, l'une avec `component: ListeProduitsBeta` protégée par un `CanMatchFn` qui vérifie un indicateur de fonctionnalité (feature flag), l'autre avec `component: ListeProduits` sans guard. Que se passe-t-il si le `CanMatchFn` renvoie `false` ?"
    choix:
      - "La navigation échoue avec une erreur, car deux routes partagent le même chemin"
      - "Le routeur passe à la route suivante qui correspond au chemin, ici `ListeProduits`"
      - "`CanMatchFn` se comporte comme `CanActivateFn` : l'utilisateur reste bloqué sur l'ancienne page"
      - "Les deux composants s'affichent en même temps"
    reponse: 1
    explication: "C'est la particularité de `CanMatchFn` par rapport à `CanActivateFn` : un refus ne bloque pas la navigation, il fait continuer la recherche dans le tableau de routes, comme si la route refusée n'existait pas. C'est le mécanisme adapté pour proposer deux implémentations d'une même URL selon une condition (rôle, feature flag...), sans dupliquer le chemin dans le code de navigation."
  - question: "Un `ResolveFn` appelle un service HTTP qui renvoie un Observable ne se terminant jamais (par exemple un flux temps réel oublié par erreur). Quel est l'effet sur la navigation ?"
    choix:
      - "La route s'affiche immédiatement avec une donnée vide, le resolver continue en arrière-plan"
      - "La navigation reste bloquée indéfiniment : le resolver attend que l'Observable se termine avant d'activer la route"
      - "Angular impose un délai maximal de 5 secondes puis abandonne automatiquement"
      - "Une erreur 404 s'affiche après quelques secondes"
    reponse: 1
    explication: "Un resolver **bloque** la navigation tant que l'Observable (ou la Promise) qu'il renvoie ne s'est pas terminé. Avec un flux qui n'émet jamais de complétion, la navigation reste bloquée sans limite de temps, sans indicateur visible pour l'utilisateur : c'est la principale limite des resolvers, à garder en tête avant de les préférer à un chargement dans le composant lui-même (avec un état de chargement visible)."
---

## Essentiel

Un **guard** décide si une navigation peut avoir lieu. En Angular 21, on écrit des guards **fonctionnels** — de simples fonctions, pas de classes :

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.estConnecte() || router.createUrlTree(['/connexion']);
};
```

```ts
{ path: 'compte', component: EspaceClient, canActivate: [authGuard] }
```

Un guard renvoie `true` (ou une valeur assimilable, `Observable<boolean>`/`Promise<boolean>`) pour autoriser, `false` pour bloquer, ou un `UrlTree` (via `router.createUrlTree(...)`) pour **rediriger**. `CanMatchFn` fonctionne différemment : un refus fait passer à la route suivante du tableau, plutôt que de bloquer la navigation — pratique pour choisir entre deux routes de même chemin.

Un **resolver** précharge une donnée **avant** que la route ne s'active :

```ts
export const produitResolver: ResolveFn<Produit> = (route) => {
  const produits = inject(ProduitService);
  return produits.chargerParId(route.paramMap.get('id')!);
};
```

```ts
{ path: 'produits/:id', component: FicheProduit, resolve: { produit: produitResolver } }
```

La navigation **attend** la fin du resolver : le composant s'affiche déjà avec sa donnée, sans état de chargement à gérer manuellement — mais l'utilisateur ne voit rien bouger pendant l'attente.

## Détail

### Comment ça marche

Avant chaque navigation, le routeur évalue les guards des routes concernées, dans un ordre précis (`canDeactivate` de la route quittée, puis `canMatch`, `canActivateChild`, `canActivate` des routes visées). Tous doivent réussir pour que la navigation continue. Les resolvers s'exécutent ensuite, une fois les guards passés, et la navigation n'active la route qu'une fois toutes leurs données obtenues.

### Exemple 1 — Guard d'authentification simple

```ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estConnecte()) {
    return true;
  }
  return router.createUrlTree(['/connexion']);
};
```

```ts
export const routes: Routes = [
  { path: 'compte', component: EspaceClient, canActivate: [authGuard] },
  {
    path: 'compte',
    component: EspaceClient,
    children: [{ path: 'commandes', component: HistoriqueCommandes }],
    canActivateChild: [authGuard], // protège aussi toutes les routes enfants
  },
];
```

`canActivateChild` applique le même guard à toutes les routes enfants, sans le répéter sur chacune.

### Exemple 2 — `CanMatchFn` pour choisir entre deux routes

```ts
export const catalogueBetaGuard: CanMatchFn = () => {
  const flags = inject(FeatureFlagsService);
  return flags.estActive('catalogue-beta');
};

export const routes: Routes = [
  { path: 'produits', component: ListeProduitsBeta, canMatch: [catalogueBetaGuard] },
  { path: 'produits', component: ListeProduits }, // route de repli
];
```

Si le drapeau `catalogue-beta` est désactivé, `canMatch` renvoie `false` : le routeur ignore la première route et essaie la suivante, qui a le même `path`. L'utilisateur navigue toujours vers `/produits`, sans jamais connaître l'existence de la bascule.

### Exemple 3 — Resolver et ses limites

```ts
export const produitResolver: ResolveFn<Produit> = (route) => {
  const produits = inject(ProduitService);
  const id = route.paramMap.get('id')!;
  return produits.chargerParId(id); // Observable<Produit>
};
```

```ts
{
  path: 'produits/:id',
  component: FicheProduit,
  resolve: { produit: produitResolver },
}
```

```ts
export class FicheProduit {
  produit = input.required<Produit>(); // avec withComponentInputBinding(), reçoit la clé 'produit'
}
```

Le resolver bloque la navigation jusqu'à ce que l'Observable se termine. C'est pratique pour éviter un état de chargement dans le composant, mais problématique si l'appel est lent : l'utilisateur reste sur l'ancienne page, sans indicateur, pendant l'attente. Pour un appel potentiellement long, charger la donnée directement dans le composant (avec un état de chargement visible, voir le chapitre HTTP) est souvent préférable.

### Exemple 4 — Guard « quitter sans enregistrer »

```ts
export const quitterSansEnregistrerGuard: CanDeactivateFn<FormulaireProduit> = (
  composant,
) => {
  if (!composant.aDesModificationsNonEnregistrees()) {
    return true;
  }
  return confirm('Des modifications ne sont pas enregistrées. Quitter quand même ?');
};
```

```ts
{
  path: 'produits/:id/modifier',
  component: FormulaireProduit,
  canDeactivate: [quitterSansEnregistrerGuard],
}
```

`CanDeactivateFn` reçoit le composant affiché comme premier paramètre : il peut donc interroger son état (ici, `aDesModificationsNonEnregistrees()`) avant d'autoriser ou non de quitter la route.

### Les guards en un coup d'œil

| Type | S'exécute | Un refus... |
|---|---|---|
| `CanActivateFn` | Avant d'activer une route | Bloque la navigation (ou redirige avec un `UrlTree`) |
| `CanActivateChildFn` | Avant d'activer une route **enfant** | Idem, appliqué à tous les enfants |
| `CanMatchFn` | Avant même de sélectionner la route | Fait essayer la route suivante du tableau |
| `CanDeactivateFn` | Avant de quitter la route affichée | Empêche de quitter la route actuelle |

### Pièges courants

> **Un `ResolveFn` qui n'émet jamais de complétion.** Un Observable qui reste ouvert (flux temps réel, oubli d'un `take(1)`) bloque la navigation indéfiniment, sans erreur visible. Toujours s'assurer que l'Observable d'un resolver se termine (`take(1)`, `firstValueFrom`, ou une Promise classique).

> **Un `CanDeactivateFn` qui renvoie toujours `true`.** Oublier de vérifier l'état réel du formulaire rend le guard inutile : il autorise systématiquement à quitter, même avec des modifications perdues. Le guard doit interroger une méthode du composant, pas une constante.

> **Confondre `CanActivateFn` et `CanMatchFn` pour un cas de repli.** Utiliser `canActivate` pour proposer une route alternative bloque simplement la navigation en cas de refus, sans jamais essayer l'autre route. Seul `canMatch` permet ce mécanisme de repli vers une route de même chemin.

### À retenir

- Guards et resolvers s'écrivent comme des **fonctions** (`CanActivateFn`, `CanMatchFn`, `CanDeactivateFn`, `ResolveFn`), avec `inject()` pour accéder aux services.
- Un guard renvoie `true`/`false`, ou un `UrlTree` (via `router.createUrlTree(...)`) pour rediriger explicitement.
- `CanMatchFn` se distingue des autres guards : un refus fait essayer la route suivante du tableau, au lieu de bloquer la navigation.
- Un resolver précharge une donnée et **bloque** la navigation jusqu'à ce qu'elle soit prête — pratique, mais risqué avec un appel lent ou un Observable qui ne se termine jamais.
- `CanDeactivateFn` protège contre une sortie accidentelle d'une page avec des modifications non enregistrées.
