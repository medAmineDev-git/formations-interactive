---
id: ngrx-signalstore
chapitre: etat
ordre: 3
titre: "NgRx SignalStore (aperçu)"
termes:
  - terme: "signalStore()"
    definition: "Fonction du package `@ngrx/signals` qui construit un store en combinant des **features** (`withState`, `withComputed`, `withMethods`…). Elle renvoie une classe injectable : à fournir (`providers`) avant de l'injecter, ou à créer directement avec `{ providedIn: 'root' }`."
  - terme: "withState()"
    definition: "Feature qui ajoute des tranches d'état au store à partir d'un objet initial. Un signal est créé automatiquement pour chaque propriété (et pour les propriétés imbriquées, en `DeepSignal`)."
  - terme: "withComputed()"
    definition: "Feature qui ajoute des signaux dérivés (`Signal<T>`) au store, calculés à partir de l'état et des propriétés déjà définies par les features précédentes."
  - terme: "withMethods()"
    definition: "Feature qui ajoute des méthodes au store (mise à jour d'état, effets de bord synchrones ou asynchrones). Sa fonction fabrique reçoit l'instance du store et s'exécute dans le contexte d'injection : `inject()` y est utilisable."
  - terme: "patchState()"
    definition: "Fonction pour modifier l'état d'un store : `patchState(store, partiel)` ou `patchState(store, etat => partiel)`. Par défaut, l'état est **protégé** : seul le code du store lui-même (dans `withMethods`) peut l'appeler, pas un composant consommateur."
  - terme: "withHooks()"
    definition: "Feature pour exécuter du code à l'initialisation (`onInit`) ou à la destruction (`onDestroy`) du store — par exemple démarrer un chargement initial ou nettoyer une souscription."
  - terme: NgRx Store (classique)
    definition: "La librairie NgRx historique, basée sur des **actions**, des **reducers** purs, des **effects** (side effects en RxJS) et des **selectors** — le pattern Redux appliqué à Angular. Plus structurée et outillée que SignalStore, mais avec davantage de code de structure (« boilerplate »)."
quiz:
  - question: "Dans ce store NgRx SignalStore, quelle est la bonne façon d'ajouter une méthode `ajouter()` qui modifie `lignes` ?"
    code: |
      export const PanierStore = signalStore(
        { providedIn: 'root' },
        withState({ lignes: [] as LigneCommande[] }),
      );
    choix:
      - "Injecter `PanierStore` dans un composant, puis appeler `store.lignes.set([...])` directement depuis le composant"
      - "Ajouter `withMethods((store) => ({ ajouter(ligne: LigneCommande) { patchState(store, (state) => ({ lignes: [...state.lignes, ligne] })); } }))` à la définition du store"
      - "Réassigner directement `PanierStore.lignes = [...]` depuis n'importe où"
      - "Appeler `store.withState({ lignes: [...] })` après la création du store"
    reponse: 1
    explication: "La façon idiomatique d'ajouter un comportement à un SignalStore est `withMethods()`, en modifiant l'état via `patchState(store, ...)` à l'intérieur du store. Par défaut, l'état d'un SignalStore est protégé : un composant consommateur ne peut ni écrire les signaux d'état directement, ni appeler `patchState()` depuis l'extérieur — seules les méthodes exposées par `withMethods()` le peuvent."
  - question: "Une équipe a une simple liste de favoris, modifiée par un seul composant, sans logique complexe. Faut-il introduire NgRx SignalStore ?"
    choix:
      - "Oui, systématiquement : toute gestion d'état dans Angular 21 doit passer par NgRx SignalStore"
      - "Pas nécessairement : un service `providedIn: 'root'` avec un `WritableSignal` privé et un `computed()` suffit largement pour ce cas ; NgRx apporte surtout de la valeur quand plusieurs équipes ou fonctionnalités partagent des conventions communes de gestion d'état"
      - "Non, NgRx ne fonctionne qu'avec des formulaires réactifs"
      - "Oui, car un service à signaux ne peut pas exposer de valeurs calculées"
    reponse: 1
    explication: "NgRx SignalStore (comme le NgRx Store classique) a du sens quand la structure imposée, les outils de développement ou des conventions d'équipe partagées apportent une vraie valeur — typiquement sur un état complexe ou partagé par plusieurs équipes. Pour un état simple et local à une fonctionnalité, un service à signaux (leçon précédente) est souvent suffisant et plus direct."
  - question: "Quelle affirmation décrit correctement la relation entre `@ngrx/signals` (SignalStore) et le NgRx Store classique (actions/reducers/effects) ?"
    choix:
      - "SignalStore est une nouvelle syntaxe pour écrire des reducers : il faut toujours définir des actions avec `createAction`"
      - "Ce sont deux approches distinctes dans l'écosystème NgRx : SignalStore construit un store directement avec state/computed/methods à base de signaux, sans passer par des actions ni des reducers, alors que le Store classique suit le pattern Redux (actions dispatchées, reducers purs, effects, selectors)"
      - "SignalStore remplace complètement le NgRx Store classique depuis Angular 21, qui est désormais supprimé"
      - "Le NgRx Store classique ne peut être utilisé qu'avec des composants basés sur des décorateurs, jamais avec des signaux"
    reponse: 1
    explication: "SignalStore et le Store classique coexistent dans l'écosystème NgRx : ce sont deux façons différentes de structurer l'état, à choisir selon le besoin (SignalStore est plus direct et à base de signaux ; le Store classique impose le pattern Redux complet avec ses outils, comme le Redux DevTools et le time-travel debugging)."
---

## Essentiel

Un service à signaux (leçon précédente) couvre la plupart des besoins d'état. **NgRx SignalStore** (package `@ngrx/signals`) devient intéressant quand on veut une **structure imposée** et cohérente entre plusieurs fonctionnalités ou équipes, avec des outils de développement associés — pas parce qu'un service maison serait insuffisant en soi.

Un SignalStore se construit en combinant des **features** :

```ts
import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

type PanierState = {
  lignes: LigneCommande[];
};

export const PanierStore = signalStore(
  { providedIn: 'root' },
  withState<PanierState>({ lignes: [] }),
  withComputed(({ lignes }) => ({
    total: computed(() => lignes().reduce((s, l) => s + l.prix * l.quantite, 0)),
  })),
  withMethods((store) => ({
    ajouter(ligne: LigneCommande): void {
      patchState(store, (state) => ({ lignes: [...state.lignes, ligne] }));
    },
  })),
);
```

- `withState()` crée un signal par tranche d'état (`store.lignes`).
- `withComputed()` ajoute des valeurs dérivées (`store.total`).
- `withMethods()` ajoute des méthodes ; elles modifient l'état avec `patchState()`.

Par défaut, l'état est **protégé** : un composant ne peut lire que les signaux exposés, jamais appeler `patchState()` lui-même — toute modification passe par une méthode du store.

## Détail

### Ce que NgRx apporte face à un service maison

Un service à signaux fait très bien le travail pour un état isolé. NgRx SignalStore devient utile quand :

- plusieurs équipes doivent gérer l'état de façon **cohérente** (même vocabulaire, mêmes conventions : `withState`/`withComputed`/`withMethods` partout) ;
- on veut profiter des **outils de développement** de l'écosystème NgRx ;
- l'état est complexe (nombreuses tranches, logique de mise à jour partagée) et bénéficie de composer des « features » réutilisables entre plusieurs stores.

En contrepartie : une dépendance supplémentaire, une convention à apprendre, et un léger surcoût de structure pour un état trivial.

### Exemple 1 — Store complet : panier avec état, calculs et méthodes

```ts
import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

interface LigneCommande {
  produitId: string;
  prix: number;
  quantite: number;
}

type PanierState = {
  lignes: LigneCommande[];
};

export const PanierStore = signalStore(
  { providedIn: 'root' },
  withState<PanierState>({ lignes: [] }),
  withComputed(({ lignes }) => ({
    nombreArticles: computed(() => lignes().reduce((n, l) => n + l.quantite, 0)),
    total: computed(() => lignes().reduce((s, l) => s + l.prix * l.quantite, 0)),
  })),
  withMethods((store) => ({
    ajouter(ligne: LigneCommande): void {
      patchState(store, (state) => ({ lignes: [...state.lignes, ligne] }));
    },
    retirer(produitId: string): void {
      patchState(store, (state) => ({
        lignes: state.lignes.filter((l) => l.produitId !== produitId),
      }));
    },
  })),
);
```

Utilisation dans un composant, identique à un service classique :

```ts
@Component({
  selector: 'app-panier',
  template: `
    <p>{{ store.nombreArticles() }} article(s) — {{ store.total() }} €</p>
  `,
})
export class Panier {
  readonly store = inject(PanierStore);
}
```

### Exemple 2 — Charger des produits en asynchrone

`withMethods()` peut aussi exposer des méthodes asynchrones basées sur une `Promise` :

```ts
withMethods((store, produitsService = inject(ProduitsService)) => ({
  async charger(): Promise<void> {
    patchState(store, { chargement: true });
    const produits = await produitsService.getTous();
    patchState(store, { produits, chargement: false });
  },
}))
```

Pour des cas plus riches (annulation, `debounce` sur une recherche), NgRx fournit `rxMethod()` (package `@ngrx/signals/rxjs-interop`), qui accepte un pipeline RxJS complet — utile notamment pour un filtre de catalogue tapé au clavier.

### Exemple 3 — Cycle de vie avec `withHooks()`

```ts
withHooks({
  onInit(store) {
    store.charger(); // déclenche le chargement initial dès la création du store
  },
  onDestroy(store) {
    console.log('dernier état du panier', store.lignes());
  },
})
```

`onInit` s'exécute dans le contexte d'injection du store (donc `inject()` y est utilisable), ce qui permet d'y déclencher un chargement initial sans passer par le constructeur d'un composant.

### NgRx Store classique : le pattern Redux

Le **NgRx Store** historique (`@ngrx/store`, `@ngrx/effects`) reste disponible et largement utilisé, mais suit une approche différente : un état global immuable, modifié uniquement via des **actions** dispatchées et traitées par des **reducers** purs ; les effets de bord (appels HTTP, navigation) sont isolés dans des **effects** RxJS ; les valeurs dérivées passent par des **selectors** mémorisés. Cette structure impose davantage de fichiers et de code de câblage (boilerplate) qu'un SignalStore, en échange d'une discipline stricte et d'un outillage mature (Redux DevTools, time-travel debugging).

### SignalStore contre Store classique — quand choisir quoi

| | Service à signaux | NgRx SignalStore | NgRx Store classique |
|---|---|---|---|
| Dépendance | Aucune | `@ngrx/signals` | `@ngrx/store` + `@ngrx/effects` |
| Structure imposée | Non | Légère (features) | Forte (actions/reducers/effects) |
| Code de câblage | Minimal | Faible | Élevé |
| Bon pour | État simple à moyen, local à une fonctionnalité | État partagé par une équipe, besoin de conventions communes | État global complexe, grande équipe, outillage avancé |

### Pièges courants

> **Croire que `@ngrx/signals` impose des actions et des reducers.** SignalStore ne fait pas partie du pattern Redux : pas d'actions, pas de reducers. C'est une API différente, à base de signaux, dans le même écosystème NgRx que le Store classique — les deux coexistent et se choisissent séparément.

> **Appeler `patchState()` depuis un composant consommateur.** Par défaut (`protectedState` à `true`, valeur recommandée), seules les méthodes définies dans `withMethods()` peuvent modifier l'état. Un composant qui tente `patchState(store, {...})` directement se heurte à une erreur de typage : la modification doit passer par une méthode exposée par le store.

> **Introduire NgRx pour un état trivial.** Une simple valeur partagée par un seul composant ne justifie pas la dépendance et la convention supplémentaires : un service à signaux (leçon précédente) reste souvent le bon choix par défaut.

### À retenir

- `signalStore()` compose des **features** : `withState()` (état), `withComputed()` (dérivés), `withMethods()` (comportement), `withHooks()` (cycle de vie).
- L'état est modifié via `patchState()`, uniquement depuis l'intérieur du store par défaut.
- Le NgRx Store classique (actions/reducers/effects/selectors) reste une option distincte, plus structurée mais plus verbeuse.
- NgRx apporte de la valeur pour un état complexe ou partagé par une équipe ; un état simple se contente souvent d'un service à signaux.
- Vérifier la compatibilité des versions avant d'adopter NgRx : la ligne `@ngrx/signals` compatible avec Angular 21 dépend d'`@angular/core ^21.0.0`.
