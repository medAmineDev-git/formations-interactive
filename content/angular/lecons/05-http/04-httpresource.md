---
id: httpresource
chapitre: http
ordre: 4
titre: "resource() et httpResource() : l'approche signaux (expérimental)"
termes:
  - terme: "resource()"
    definition: "Primitive d'Angular (`@angular/core`) qui relie un calcul asynchrone (`loader`) à des signaux réactifs (`params`) : le loader se relance automatiquement quand `params` change. **Expérimentale en Angular 21** : *« resource is experimental. It's ready for you to try, but it might change before it is stable »*."
  - terme: "httpResource()"
    definition: "Version de `resource()` spécialisée pour `HttpClient` (`@angular/common/http`) : elle prend une URL (ou une requête complète) réactive, envoie la requête via `HttpClient`, et expose la réponse sous forme de signaux. **Expérimentale depuis Angular 19.2**, toujours expérimentale en v21."
  - terme: Statut expérimental
    definition: "Signale une API stabilisée dans sa forme générale mais susceptible de changer avant sa version stable. `resource()` et `httpResource()` ne deviennent **stables qu'en Angular 22** : les utiliser en production en Angular 21 signifie accepter un risque de changement d'API lors d'une future montée de version."
  - terme: params (resource)
    definition: "Fonction réactive (comme un `computed`) qui produit la valeur transmise au `loader`. Quand les signaux qu'elle lit changent, `resource()` relance automatiquement le chargement avec les nouveaux paramètres."
  - terme: loader
    definition: "Fonction asynchrone appelée par `resource()` à chaque changement de `params`. Elle reçoit un objet contenant `params`, `previous` (état précédent) et `abortSignal` (pour annuler une requête devenue obsolète)."
  - terme: "value() / status() / isLoading() / error()"
    definition: "Signaux exposés par la ressource retournée : `value()` la dernière valeur reçue (ou `undefined`), `status()` un état parmi `idle`, `loading`, `reloading`, `resolved`, `error`, `local`, `isLoading()` un booléen pratique, `error()` la dernière erreur."
  - terme: "reload()"
    definition: "Méthode exposée par la ressource pour relancer le chargement manuellement, avec les mêmes paramètres — utile pour un bouton « Réessayer » après une erreur."
quiz:
  - question: "Quel est le statut de httpResource() en Angular 21 ?"
    choix:
      - "Stable depuis la version 19.2, comme HttpClient"
      - "Expérimental : l'API peut encore changer, la stabilisation est prévue en Angular 22"
      - "Developer preview, disponible uniquement derrière un flag de configuration"
      - "Dépréciée au profit de HttpClient combiné à toSignal()"
    reponse: 1
    explication: "httpResource() est explicitement marquée expérimentale dans la documentation versionnée d'Angular 21, disponible depuis la 19.2. De nombreux contenus en ligne la présentent comme stable, mais ils reflètent en réalité la documentation d'Angular 22, où resource() et httpResource() sont passés stables."
  - question: "Que fait ce code quand produitId change ?"
    code: |
      const produitId = signal(1);
      const produit = httpResource<Produit>(() => `/api/produits/${produitId()}`);
    choix:
      - "Rien : httpResource() ne lit la fonction qu'une seule fois, à la création"
      - "La ressource relance automatiquement une requête vers la nouvelle URL, et met à jour produit.value(), produit.status() et produit.isLoading() en conséquence"
      - "Une erreur de compilation, car httpResource() n'accepte pas de fonction réactive"
      - "Il faut appeler manuellement produit.reload() pour prendre en compte le nouvel identifiant"
    reponse: 1
    explication: "La fonction passée à httpResource() est réactive, comme un computed() : dès que produitId() change, l'URL recalculée change, et la ressource relance automatiquement le chargement. Les signaux value(), status() et isLoading() reflètent alors le nouvel état sans code supplémentaire."
  - question: "Une équipe hésite entre httpResource() et HttpClient + toSignal() pour un projet en production qui sortira dans deux mois, en Angular 21. Quel est l'argument le plus pertinent ?"
    choix:
      - "httpResource() est plus rapide à l'exécution que HttpClient"
      - "httpResource() étant expérimental en Angular 21, son API peut encore changer avant sa stabilisation en Angular 22 ; HttpClient + toSignal() repose sur des API stables"
      - "HttpClient + toSignal() ne fonctionne pas avec des URL dynamiques"
      - "Les deux approches sont strictement équivalentes, le choix n'a aucun impact"
    reponse: 1
    explication: "httpResource() simplifie beaucoup de code (état de chargement, erreurs, réactivité aux paramètres intégrés), mais reste expérimental en Angular 21 : son comportement ou sa signature peuvent évoluer avant la version stable annoncée en Angular 22. Pour un projet proche de la mise en production, s'appuyer sur des API stables (HttpClient, toSignal()) limite le risque de code à réécrire plus tard."
---

## Essentiel

`resource()` et `httpResource()` répondent à un problème récurrent avec `HttpClient` : relier une requête à un signal demande d'orchestrer soi-même le déclenchement (`toObservable` + `switchMap`), l'état de chargement et les erreurs. `httpResource()` intègre tout ça :

```ts
const produitId = signal(1);

const produit = httpResource<Produit>(() => `/api/produits/${produitId()}`);
```

Dès que `produitId` change, la ressource relance automatiquement la requête. Elle expose directement des signaux :

```ts
produit.value();      // Produit | undefined
produit.isLoading();  // boolean
produit.error();      // erreur éventuelle
produit.status();     // 'idle' | 'loading' | 'reloading' | 'resolved' | 'error' | 'local'
```

**Point important pour un projet réel : ces deux API sont marquées expérimentales dans la documentation d'Angular 21**, disponibles depuis la 19.0 (`resource()`) et la 19.2 (`httpResource()`). Une API expérimentale peut encore changer avant sa stabilisation, prévue en Angular 22. Beaucoup de contenus trouvés en ligne les présentent comme stables : ils décrivent en réalité la documentation d'Angular 22, pas celle de la 21.

Pour un besoin équivalent, l'alternative stable reste `HttpClient` combiné à `toSignal()` — plus verbeuse, mais bâtie sur des API qui ne changeront pas.

## Détail

### Le problème que ces API résolvent

Reproduire ce que fait `httpResource()` avec `HttpClient` seul demande d'assembler plusieurs pièces :

```ts
const produitId = signal(1);
const chargement = signal(false);
const erreur = signal<unknown>(null);

const produit = toSignal(
  toObservable(produitId).pipe(
    tap(() => { chargement.set(true); erreur.set(null); }),
    switchMap((id) =>
      this.http.get<Produit>(`/api/produits/${id}`).pipe(
        catchError((e) => { erreur.set(e); return of(undefined); }),
        finalize(() => chargement.set(false)),
      ),
    ),
  ),
);
```

`resource()`/`httpResource()` regroupent cette mécanique (réactivité, annulation de la requête précédente, état de chargement, erreur) derrière une seule primitive.

### Exemple 1 — `resource()` générique

```ts
import { resource, signal } from '@angular/core';

const produitId = signal(1);

const produitRessource = resource({
  params: () => ({ id: produitId() }),
  loader: async ({ params, abortSignal }) => {
    const reponse = await fetch(`/api/produits/${params.id}`, { signal: abortSignal });
    if (!reponse.ok) throw new Error(`Erreur ${reponse.status}`);
    return reponse.json() as Promise<Produit>;
  },
});
```

`params` est une fonction réactive, comme un `computed()` : elle recalcule sa valeur quand `produitId` change, et `resource()` relance alors le `loader` avec les nouveaux paramètres. `abortSignal` permet d'annuler la requête si les paramètres changent avant sa fin.

### Exemple 2 — `httpResource()` : la forme simple (URL)

```ts
import { httpResource } from '@angular/common/http';

const produitId = signal(1);

const produit = httpResource<Produit>(() => `/api/produits/${produitId()}`);
```

```html
@if (produit.isLoading()) {
  <app-spinner />
} @else if (produit.error()) {
  <p class="erreur">Impossible de charger le produit.</p>
  <button (click)="produit.reload()">Réessayer</button>
} @else if (produit.hasValue()) {
  <h2>{{ produit.value().nom }}</h2>
  <p>{{ produit.value().prix }} €</p>
}
```

`httpResource()` suppose par défaut une réponse **JSON**. Renvoyer `undefined` depuis la fonction réactive (par exemple tant qu'aucun `produitId` n'est sélectionné) suspend la ressource sans lancer de requête.

### Exemple 3 — `httpResource()` : la forme requête, avec paramètres

```ts
const filtreStatut = signal<'toutes' | 'en_cours' | 'livree'>('toutes');

const commandes = httpResource<Commande[]>(() => ({
  url: '/api/commandes',
  params: { statut: filtreStatut() },
}), { defaultValue: [] });
```

La forme « requête » (objet avec `url`, `params`, `headers`…) permet de composer une requête plus riche qu'une simple chaîne d'URL, tout en restant réactive. `defaultValue` évite de gérer `undefined` avant la première réponse.

### Comparaison avec `HttpClient` + `toSignal()`

| | `HttpClient` + `toSignal()` | `httpResource()` |
|---|---|---|
| Statut en Angular 21 | Stable | **Expérimental** |
| État de chargement | À construire soi-même | `isLoading()` intégré |
| Gestion des erreurs | `catchError` à écrire | `error()` intégré |
| Réactivité aux paramètres | `toObservable` + `switchMap` | Fonction réactive native (`params`) |
| Annulation de requête obsolète | `switchMap` | Gérée en interne |
| Recommandé pour un projet en production proche | Oui | À évaluer selon la tolérance au risque de changement d'API |

### Ce que « expérimental » implique pour un projet en production

Une API expérimentale suit encore les conventions de gestion de version sémantique d'Angular pour le reste du framework, mais son **contrat** (signature, options, nom des signaux exposés) peut évoluer d'une version mineure à l'autre sans respecter les mêmes garanties de stabilité qu'une API stable. Concrètement, pour une équipe qui envisage `httpResource()` en Angular 21 :

- Le code qui l'utilise devra probablement être ajusté lors de la montée vers Angular 22, même si l'idée générale reste la même.
- Le risque est plus faible qu'il n'y paraît pour un besoin de lecture simple (`GET` affiché avec état de chargement), plus élevé si l'application dépend de comportements fins (`previous`, `snapshot`, composition de plusieurs ressources).
- Rien n'empêche de l'essayer sur une fonctionnalité isolée pour se familiariser avec l'approche, tout en gardant `HttpClient` + `toSignal()` sur le cœur métier sensible.

### Pièges courants

> **Présenter `httpResource()` comme stable en Angular 21.** C'est une confusion fréquente, car le domaine générique `angular.dev` affiche par défaut la documentation de la version courante (v22, où ces API sont stables). La documentation versionnée `v21.angular.dev` est explicite : *« resource is experimental »*.

> **Oublier que la fonction passée à `httpResource()` doit être réactive.** Passer directement une chaîne (`httpResource<Produit>('/api/produits/1')`) au lieu d'une fonction (`() => '/api/produits/1'`) empêche toute réévaluation automatique lorsqu'un signal doit faire varier l'URL.

> **Ne pas gérer `undefined` sur `value()`.** Avant la première résolution, `value()` peut valoir `undefined` (sauf si `defaultValue` est fourni) : l'utiliser directement dans le template sans vérifier `hasValue()` ou `isLoading()` provoque une erreur d'accès à une propriété d'un objet non défini.

### À retenir

- `resource()`/`httpResource()` relient un calcul asynchrone à des signaux : `value()`, `status()`, `isLoading()`, `error()`, `reload()`.
- Les deux API sont **expérimentales en Angular 21** ; leur stabilisation est prévue en Angular 22.
- `httpResource()` accepte une URL réactive (`() => string`) ou une requête réactive (`() => ({ url, params, headers })`).
- Pour un besoin équivalent avec des API stables, la référence reste `HttpClient` combiné à `toSignal()`.
- Le choix entre les deux dépend de la tolérance au risque de changement d'API avant la version stable.
