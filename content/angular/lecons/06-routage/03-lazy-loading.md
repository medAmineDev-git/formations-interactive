---
id: lazy-loading
chapitre: routage
ordre: 3
titre: "Chargement différé des routes"
termes:
  - terme: "loadComponent"
    definition: "Propriété d'une route qui remplace `component` : au lieu d'un composant importé statiquement, elle prend une fonction renvoyant un `import()` dynamique. Le composant n'est téléchargé que lorsque la route est visitée."
  - terme: "loadChildren"
    definition: "Équivalent de `loadComponent` pour un **groupe** de routes : la fonction renvoie l'import d'un fichier qui exporte un tableau `Routes`. Tout le sous-arbre (composants compris) est chargé en une fois, au premier accès."
  - terme: "import() dynamique"
    definition: "Syntaxe JavaScript standard qui renvoie une `Promise` résolvant vers le module demandé, au lieu de l'inclure immédiatement dans le fichier courant. C'est ce mécanisme, pas une API propre à Angular, que le bundler utilise pour découper le code."
  - terme: "chunk (bundle différé)"
    definition: "Fichier JavaScript séparé, généré au build, qui contient le code d'une route (ou d'un groupe de routes) chargée paresseusement. Le navigateur ne le télécharge que si l'utilisateur visite la route correspondante."
  - terme: "withPreloading()"
    definition: "Fonctionnalité de `provideRouter()` qui déclenche, après le chargement initial de l'application, le téléchargement en arrière-plan des chunks des routes différées, selon une stratégie donnée."
  - terme: PreloadAllModules
    definition: "Stratégie de préchargement fournie par Angular : une fois l'application chargée et inactive, elle télécharge **tous** les chunks des routes en `loadComponent` / `loadChildren`, pour que les navigations suivantes soient instantanées."
quiz:
  - question: "Quelle est la différence pratique entre ces deux routes ?"
    code: |
      { path: 'produits', component: ListeProduits }

      { path: 'admin', loadComponent: () => import('./admin/admin').then(m => m.Admin) }
    choix:
      - "Aucune, Angular optimise automatiquement les deux de la même façon au build"
      - "`ListeProduits` fait partie du bundle initial téléchargé au chargement de l'app ; `Admin` est dans un chunk séparé, téléchargé seulement en visitant `/admin`"
      - "`loadComponent` ne fonctionne qu'avec des composants qui n'ont pas de dépendances"
      - "`component` charge le composant plus vite car il n'y a pas d'import à résoudre"
    reponse: 1
    explication: "`component` est un import statique : le composant (et toutes ses dépendances) est inclus dans le bundle principal, téléchargé dès le premier chargement de l'app. `loadComponent`, avec son `import()` dynamique, isole le composant dans un chunk séparé que le navigateur ne télécharge qu'au moment de visiter la route, réduisant le bundle initial."
  - question: "Un fichier de routes importe un composant en haut du fichier ET l'utilise aussi via `loadComponent` plus bas. Quel est l'effet sur le découpage du bundle ?"
    code: |
      import { Admin } from './admin/admin'; // import statique en haut du fichier

      export const routes: Routes = [
        { path: 'admin', loadComponent: () => import('./admin/admin').then(m => m.Admin) },
      ];
    choix:
      - "Aucun effet, `loadComponent` force toujours un chunk séparé"
      - "Angular affiche une erreur au build : un composant ne peut pas être importé deux fois"
      - "L'import statique en haut du fichier inclut déjà `Admin` dans le bundle principal : le découpage prévu par `loadComponent` est annulé"
      - "Le composant est chargé deux fois, une fois dans chaque bundle"
    reponse: 2
    explication: "Le bundler suit tous les imports statiques d'un fichier, même s'ils ne sont pas utilisés directement dans ce fichier-là. Un import statique de `Admin` ailleurs dans l'application suffit à l'inclure dans le bundle principal, rendant le `loadComponent` inutile : c'est un piège fréquent, à vérifier dans la sortie de `ng build`."
  - question: "Que fait `provideRouter(routes, withPreloading(PreloadAllModules))` ?"
    choix:
      - "Il désactive le chargement différé et charge tout immédiatement, comme sans `loadComponent`"
      - "Il télécharge tous les chunks des routes différées dès le premier accès à la route, jamais avant"
      - "Une fois l'application initiale chargée, il télécharge en arrière-plan les chunks de toutes les routes différées, pour accélérer les navigations suivantes"
      - "Il précharge uniquement les données (`resolver`), pas le code des composants"
    reponse: 2
    explication: "Le chargement différé réduit le bundle initial, mais introduit un léger délai au moment de visiter une route pour la première fois. `withPreloading(PreloadAllModules)` combine les deux avantages : un premier chargement rapide, puis un préchargement discret des autres chunks pendant que l'utilisateur consulte la page, sans bloquer le rendu initial."
---

## Essentiel

`loadComponent` et `loadChildren` chargent une partie de l'application **paresseusement** : le code n'est téléchargé qu'au moment où l'utilisateur visite la route, au lieu d'être inclus dans le bundle initial.

```ts
export const routes: Routes = [
  { path: 'produits', component: ListeProduits }, // chargé immédiatement

  {
    path: 'admin',
    loadComponent: () => import('./admin/admin').then((m) => m.Admin),
  }, // chargé seulement en visitant /admin
];
```

Pour un **groupe** de routes (une fonctionnalité entière), `loadChildren` pointe vers un fichier qui exporte son propre tableau `Routes` :

```ts
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
}
```

```ts
// admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  { path: '', component: TableauDeBord },
  { path: 'produits', component: GestionProduits },
];
```

Au build, chaque `import()` dynamique devient un **chunk** séparé. L'effet est visible dans la sortie de `ng build` : le bundle initial (`main.js`) est plus léger, et chaque route différée apparaît comme un fichier à part. C'est le principal levier pour garder un temps de chargement initial raisonnable dans une application qui grossit.

## Détail

### Pourquoi c'est utile

Sans chargement différé, tout le code de l'application — y compris l'espace admin qu'un client ne visitera jamais, ou le tunnel de paiement qu'il ne voit qu'une fois — fait partie du bundle initial. Plus l'application grossit, plus ce bundle grossit, et plus le premier affichage est lent. Le découpage par fonctionnalité résout ce problème : chaque fonctionnalité devient un chunk téléchargé à la demande.

### Exemple 1 — Découper par fonctionnalité

```ts
// app.routes.ts
export const routes: Routes = [
  { path: '', component: Accueil }, // page d'accueil : chargée immédiatement

  {
    path: 'produits',
    loadChildren: () => import('./produits/produits.routes').then((m) => m.PRODUITS_ROUTES),
  },
  {
    path: 'compte',
    loadChildren: () => import('./compte/compte.routes').then((m) => m.COMPTE_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
];
```

Chaque fonctionnalité (`produits`, `compte`, `admin`) devient un chunk indépendant. Un visiteur qui ne fait que consulter le catalogue ne télécharge jamais le code de l'espace admin.

### Exemple 2 — Précharger après le chargement initial

```ts
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withPreloading(PreloadAllModules))],
};
```

Avec `PreloadAllModules`, l'application affiche d'abord le strict nécessaire, puis télécharge en arrière-plan les chunks des autres routes pendant que l'utilisateur navigue. Résultat : premier chargement rapide, et navigations suivantes déjà prêtes, sans le délai habituel du chargement différé.

### Exemple 3 — Vérifier le découpage réel

```bash
ng build
```

```text
Initial chunk files   | Names         |  Raw size
main-XXXX.js          | main          |  180.42 kB
polyfills-XXXX.js     | polyfills     |   34.61 kB

Lazy chunk files      | Names           |  Raw size
chunk-ABCD.js          | produits-routes |   42.10 kB
chunk-EFGH.js          | compte-routes   |   28.77 kB
chunk-IJKL.js          | admin-routes    |   65.33 kB
```

La sortie de `ng build` distingue les chunks « Initial » (bundle de départ) des chunks « Lazy » (chargés à la demande). C'est le seul moyen fiable de vérifier qu'une route est vraiment découpée : un `loadComponent` mal utilisé peut se retrouver, malgré tout, dans le chunk initial.

### `loadComponent` / `loadChildren` vs `@defer`

Les deux mécanismes chargent du code paresseusement, mais à des niveaux différents :

| | Granularité | Déclenché par |
|---|---|---|
| `loadComponent` / `loadChildren` | Une **route entière** | La navigation vers cette route |
| `@defer` (bloc de template) | Un **fragment de template**, à l'intérieur d'une route déjà chargée | Un déclencheur choisi (`on viewport`, `on interaction`...) |

`@defer` permet de différer, par exemple, un widget d'avis clients au milieu d'une fiche produit déjà affichée, sans attendre une navigation. Il est traité en détail dans le chapitre performance (niveau intermédiaire).

### Pièges courants

> **Laisser un import statique du composant ailleurs dans le fichier.** Si le composant ciblé par `loadComponent` est aussi importé statiquement (directement ou via un autre import du même fichier), le bundler l'inclut dans le bundle principal : le découpage prévu ne se produit pas, sans erreur ni avertissement visible en développement.

> **Précharger trop agressivement une très grosse application.** `PreloadAllModules` télécharge à terme tout le code de l'application, exactement comme sans chargement différé — seulement décalé dans le temps. Pour une application avec de nombreuses fonctionnalités rarement visitées (ex. back-office peu utilisé), une stratégie personnalisée (implémentant l'interface `PreloadingStrategy`) qui ne précharge que certaines routes est parfois préférable.

> **Ne jamais vérifier la sortie de `ng build`.** Le chargement différé se configure facilement mais se casse tout aussi facilement (import oublié, ré-export qui entraîne tout un module). Seule la lecture des tailles de chunks confirme que le découpage a l'effet recherché.

### À retenir

- `loadComponent` (un composant) et `loadChildren` (un groupe de routes) remplacent `component` pour charger du code à la demande, via un `import()` dynamique.
- Chaque route différée devient un chunk séparé, visible dans la sortie de `ng build` (« Lazy chunk files »).
- `withPreloading(PreloadAllModules)` télécharge les chunks différés en arrière-plan après le chargement initial, pour accélérer les navigations suivantes.
- `@defer` diffère un fragment de template à l'intérieur d'une route déjà chargée ; `loadComponent`/`loadChildren` diffèrent une route entière.
- Un import statique oublié ailleurs dans le code peut annuler silencieusement un découpage prévu : toujours vérifier la sortie du build.
