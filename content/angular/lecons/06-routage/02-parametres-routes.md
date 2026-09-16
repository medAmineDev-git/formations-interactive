---
id: parametres-routes
chapitre: routage
ordre: 2
titre: "Paramètres de route et données"
termes:
  - terme: "Paramètre de chemin (`:id`)"
    definition: "Segment variable d'une route, préfixé par `:` dans le `path` (ex. `produits/:id`). Sa valeur fait partie de l'URL elle-même, contrairement à un paramètre de requête."
  - terme: "Paramètre de requête (query param)"
    definition: "Valeur ajoutée à la fin de l'URL après un `?`, sous forme `cle=valeur` (ex. `?tri=prix&page=2`). Sert à des critères optionnels (filtre, tri, pagination) qui ne changent pas la route elle-même."
  - terme: ActivatedRoute
    definition: "Service injectable qui expose les informations de la route **actuellement affichée** : `paramMap`, `queryParamMap`, `data`, `fragment`... S'injecte avec `inject(ActivatedRoute)`."
  - terme: "paramMap et queryParamMap"
    definition: "Observables exposés par `ActivatedRoute`, qui émettent une nouvelle valeur à chaque changement de paramètre. `paramMap.get('id')` lit un paramètre de chemin ; `queryParamMap.get('tri')` lit un paramètre de requête."
  - terme: "withComponentInputBinding()"
    definition: "Fonctionnalité de `provideRouter()` qui lie automatiquement les paramètres de route (chemin, requête, data résolue) aux propriétés `input()` du composant routé, portant le même nom. Évite de passer par `ActivatedRoute` pour les cas simples."
  - terme: fragment
    definition: "Partie de l'URL après `#` (ex. `/produits/12#avis`), généralement utilisée pour faire défiler la page jusqu'à une section précise. Accessible via `ActivatedRoute.fragment`."
  - terme: "data (propriété de route)"
    definition: "Objet statique attaché à une définition de route dans le tableau `Routes` (ex. `{ path: 'admin', data: { titre: 'Administration' } }`), lisible via `ActivatedRoute.data` ou l'input binding."
quiz:
  - question: "La route est `{ path: 'produits/:id', component: FicheProduit }`. Le composant lit l'id avec `route.snapshot.paramMap.get('id')` dans `ngOnInit`. L'utilisateur passe de `/produits/1` à `/produits/2` via un `routerLink` sur la même page (sans revenir à la liste). Que se passe-t-il ?"
    code: |
      export class FicheProduit implements OnInit {
        private route = inject(ActivatedRoute);
        id = '';

        ngOnInit() {
          this.id = this.route.snapshot.paramMap.get('id') ?? '';
        }
      }
    choix:
      - "`id` se met à jour automatiquement, Angular détecte le changement de paramètre"
      - "Angular détruit et recrée `FicheProduit`, donc `ngOnInit` s'exécute de nouveau avec le bon id"
      - "`id` reste bloqué sur `'1'` : Angular réutilise la même instance du composant, `ngOnInit` ne se relance pas"
      - "Une erreur est levée car deux routes ne peuvent pas partager le même composant"
    reponse: 2
    explication: "Quand seule la valeur d'un paramètre change sur une route déjà affichée, Angular réutilise l'instance du composant par défaut : `ngOnInit` (et donc la lecture du `snapshot`) ne se relance pas. Il faut s'abonner à `paramMap` (Observable) ou utiliser l'input binding, qui se mettent à jour à chaque navigation."
  - question: "Que faut-il ajouter pour que `id = input<string>()` reçoive automatiquement la valeur du paramètre `:id` de la route ?"
    choix:
      - "Rien, c'est automatique dès qu'un `input()` porte le même nom qu'un paramètre"
      - "`provideRouter(routes, withComponentInputBinding())` dans `app.config.ts`"
      - "Ajouter `@Input() id!: string;` en plus du `input()`"
      - "Appeler manuellement `route.paramMap.subscribe()` dans le constructeur"
    reponse: 1
    explication: "L'input binding automatique n'est pas activé par défaut : il faut passer la fonctionnalité `withComponentInputBinding()` à `provideRouter()`. Une fois activée, tout `input()` dont le nom correspond à un paramètre de chemin, de requête ou à une clé de `data` est rempli automatiquement, y compris à chaque changement."
  - question: "Quelle est la différence entre un paramètre de chemin (`:id`) et un paramètre de requête (`?tri=prix`) ?"
    choix:
      - "Aucune, ce sont deux syntaxes équivalentes pour la même chose"
      - "Le paramètre de chemin identifie généralement la ressource affichée par la route ; le paramètre de requête sert à des critères optionnels comme le tri ou la pagination"
      - "Le paramètre de requête ne peut contenir que des nombres"
      - "Le paramètre de chemin n'est disponible que via `queryParamMap`"
    reponse: 1
    explication: "Un paramètre de chemin fait partie de la structure de l'URL et désigne en général la ressource elle-même (`/produits/12` = le produit 12). Un paramètre de requête est optionnel et ne change pas quelle route correspond : `/produits?tri=prix` et `/produits?tri=nom` correspondent à la même route `produits`, avec un critère différent."
---

## Essentiel

Une route peut contenir des **paramètres de chemin**, préfixés par `:` dans le `path` :

```ts
{ path: 'produits/:id', component: FicheProduit }
```

```html
<a [routerLink]="['/produits', produit.id]">{{ produit.nom }}</a>
```

Dans `FicheProduit`, deux façons de lire `id`. La façon **recommandée en Angular 21** : activer `withComponentInputBinding()` sur `provideRouter()`, puis déclarer un `input()` du même nom que le paramètre.

```ts
// app.config.ts
providers: [provideRouter(routes, withComponentInputBinding())],
```

```ts
// fiche-produit.ts
export class FicheProduit {
  id = input.required<string>(); // rempli automatiquement par le routeur
}
```

Sans cette fonctionnalité, on injecte `ActivatedRoute` et on lit `paramMap` :

```ts
private route = inject(ActivatedRoute);
id = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))));
```

Les **paramètres de requête** (`?tri=prix`), eux, s'ajoutent après un `?` et ne changent pas la route sélectionnée ; ils se lisent avec `queryParamMap` (ou un `input()` du même nom, avec l'input binding). Le **fragment** (`#avis`) se lit avec `ActivatedRoute.fragment`.

## Détail

### Comment ça marche

Le routeur découpe l'URL en trois parties : le **chemin** (correspond au `path` de la route, fournit les paramètres `:xxx`), les **paramètres de requête** (après `?`) et le **fragment** (après `#`). Ces trois parties sont exposées par `ActivatedRoute` sous forme d'Observables, qui émettent une nouvelle valeur à chaque navigation, même quand Angular réutilise la même instance de composant.

### Exemple 1 — Lire un paramètre avec `ActivatedRoute`

```ts
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({ selector: 'app-fiche-produit', templateUrl: './fiche-produit.html' })
export class FicheProduit {
  private route = inject(ActivatedRoute);

  id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
  );
}
```

`toSignal` convertit l'Observable `paramMap` en signal : le template peut lire `id()` normalement, et la valeur se met à jour à chaque navigation, y compris entre deux fiches produit consécutives.

### Exemple 2 — Input binding automatique (recommandé)

```ts
// app.routes.ts
export const routes: Routes = [
  { path: 'produits/:id', component: FicheProduit },
];

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withComponentInputBinding())],
};
```

```ts
// fiche-produit.ts
import { Component, input } from '@angular/core';

@Component({ selector: 'app-fiche-produit', templateUrl: './fiche-produit.html' })
export class FicheProduit {
  id = input.required<string>(); // ':id' du chemin
}
```

Avec `withComponentInputBinding()`, plus besoin d'injecter `ActivatedRoute` pour les cas simples : le routeur remplit directement `id` à chaque navigation, exactement comme n'importe quel autre `input()`. Cela fonctionne aussi pour les paramètres de requête et les clés de `data`.

### Exemple 3 — Paramètres de requête, fragment et `navigate`

```ts
// Naviguer avec des query params et un fragment
this.router.navigate(['/produits'], {
  queryParams: { tri: 'prix', page: 1 },
  fragment: 'liste',
});
// → /produits?tri=prix&page=1#liste
```

```ts
// Les lire dans le composant cible
private route = inject(ActivatedRoute);

tri = toSignal(
  this.route.queryParamMap.pipe(map((params) => params.get('tri') ?? 'nom')),
);
```

`navigate` accepte aussi une option `state`, pour transmettre des données **qui n'apparaissent pas dans l'URL** (par exemple, l'objet produit déjà chargé, pour éviter un second appel HTTP) :

```ts
this.router.navigate(['/panier'], { state: { origine: 'fiche-produit' } });
```

### Exemple 4 — Donnée statique attachée à une route

```ts
export const routes: Routes = [
  {
    path: 'admin',
    component: Administration,
    data: { titre: 'Espace administrateur' },
  },
];
```

```ts
titre = input<string>(''); // rempli avec la clé 'titre' de data, via withComponentInputBinding()
```

### Snapshot, Observable ou input binding ?

| Approche | Se met à jour sans recréer le composant | Nécessite `ActivatedRoute` |
|---|---|---|
| `route.snapshot.paramMap.get(...)` | ❌ | Oui |
| `route.paramMap` (Observable / signal via `toSignal`) | ✅ | Oui |
| `input()` + `withComponentInputBinding()` | ✅ | Non |

### Pièges courants

> **Lire le `snapshot` dans `ngOnInit` pour un composant navigué « en interne ».** Si l'utilisateur reste sur le même composant en changeant seulement le paramètre (ex. deux fiches produit successives), `ngOnInit` ne se relance pas et le `snapshot` reste figé sur la première valeur. Préférez `paramMap` (Observable) ou l'input binding, tous deux réactifs.

> **Activer l'input binding et s'étonner que rien ne se remplisse.** `withComponentInputBinding()` doit être passé explicitement à `provideRouter()` — il n'est pas actif par défaut. Sans lui, un `input()` du même nom qu'un paramètre reste simplement à sa valeur par défaut.

> **Confondre `paramMap` et `queryParamMap`.** `paramMap` lit les segments du chemin (`:id`), `queryParamMap` lit ce qui suit le `?`. Chercher un paramètre de requête dans `paramMap` renvoie toujours `null`.

### À retenir

- Un paramètre de chemin (`:id`) fait partie de l'URL et identifie en général la ressource affichée.
- `withComponentInputBinding()` (sur `provideRouter()`) lie automatiquement paramètres de chemin, de requête et `data` à des `input()` du même nom — approche recommandée pour les cas simples.
- Sans input binding, `ActivatedRoute.paramMap` / `queryParamMap` (Observables, convertibles en signaux avec `toSignal`) restent réactifs, contrairement au `snapshot`.
- Les paramètres de requête et le fragment se passent à `navigate()` via les options `queryParams` et `fragment` ; l'option `state` transmet des données hors de l'URL.
