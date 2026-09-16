---
id: rxjs-signaux
chapitre: rxjs
ordre: 4
titre: Passerelles entre RxJS et les signaux
termes:
  - terme: "toSignal()"
    definition: "Fonction de `@angular/core/rxjs-interop` qui convertit un observable en `Signal<T>` en lecture seule : elle s'abonne dans le contexte d'injection courant et se désabonne automatiquement à sa destruction (sauf `manualCleanup: true`)."
  - terme: requireSync
    definition: "Option de `toSignal()` qui affirme que l'observable source émet **immédiatement** une valeur de façon synchrone à l'abonnement (typique d'un flux basé sur un `BehaviorSubject`). Si c'est le cas, le signal renvoyé est typé `Signal<T>` (jamais `undefined`) ; si l'observable n'émet pas de façon synchrone, la garantie ne peut pas être honorée."
  - terme: "toObservable()"
    definition: "Fonction inverse de `toSignal()` : convertit un signal en `Observable<T>`, qui émet la valeur courante puis chaque nouvelle valeur du signal. Utile pour réinjecter un signal dans une chaîne d'opérateurs RxJS (`debounceTime`, `switchMap`…)."
  - terme: Désabonnement automatique
    definition: "Comportement par défaut de `toSignal()` : l'abonnement à l'observable source est coupé automatiquement quand le contexte d'injection (composant, service) est détruit, sans code de nettoyage à écrire. L'option `manualCleanup: true` désactive ce comportement pour un cas où l'observable doit continuer à vivre au-delà."
  - terme: "rxResource() (expérimental)"
    definition: "Variante de `resource()` (`@angular/core/rxjs-interop`), qui accepte un champ `stream` renvoyant un **Observable** plutôt qu'un `loader` basé sur une Promise. **Expérimentale en Angular 21**, comme `resource()` et `httpResource()`."
  - terme: Recherche réactive
    definition: "Motif courant combinant un `signal()` d'entrée, `toObservable()` pour repasser dans le monde RxJS, `debounceTime`/`distinctUntilChanged`/`switchMap` pour la logique de requête, puis `toSignal()` pour ressortir un résultat consommable directement dans le template."
quiz:
  - question: "Que vaut resultat() juste après cette ligne, avant que l'observable ait émis quoi que ce soit ?"
    code: |
      const resultat = toSignal(this.http.get<Produit[]>('/api/produits'));
      console.log(resultat()); // ?
    choix:
      - "undefined : sans initialValue ni requireSync, le signal démarre à undefined tant que l'observable n'a pas émis"
      - "Un tableau vide [] par défaut"
      - "Une exception est levée, car toSignal() exige toujours une valeur initiale explicite"
      - "null, comme pour toute variable non initialisée en TypeScript"
    reponse: 0
    explication: "Sans initialValue ni requireSync: true, le type renvoyé est Signal<T | undefined> et la valeur de départ est undefined, le temps que l'observable HTTP (asynchrone par nature) émette sa première réponse. Utiliser resultat() directement sans vérifier undefined avant la première émission (ex. resultat().length) provoquerait une erreur d'accès à une propriété d'un objet non défini."
  - question: "Pourquoi requireSync: true est-il sûr avec un observable dérivé d'un BehaviorSubject, mais risqué avec this.http.get(...) ?"
    choix:
      - "Parce qu'un BehaviorSubject émet toujours immédiatement sa valeur courante dès l'abonnement (émission synchrone), alors qu'une requête HTTP répond toujours de façon asynchrone, donc jamais de façon synchrone à l'abonnement"
      - "requireSync: true ne fonctionne qu'avec des observables créés par of()"
      - "C'est l'inverse : requireSync: true est fait spécifiquement pour les appels HTTP"
      - "Il n'y a aucune différence, requireSync: true fonctionne de façon identique dans les deux cas"
    reponse: 0
    explication: "requireSync: true affirme au compilateur que l'observable produira une valeur dès l'abonnement, ce qui permet de typer le signal sans undefined. Un BehaviorSubject (ou son asObservable()) tient cette promesse par construction. Un appel HTTP est par nature asynchrone : il ne peut jamais émettre de façon synchrone, donc combiner requireSync: true avec this.http.get(...) est incorrect et peut provoquer une erreur au moment de la création du signal."
  - question: "Quel est le statut de rxResource() en Angular 21 ?"
    choix:
      - "Stable, comme toSignal() et toObservable()"
      - "Expérimental, comme resource() et httpResource() dont elle partage le même statut"
      - "Dépréciée au profit de httpResource()"
      - "Elle n'existe pas encore en Angular 21, prévue pour Angular 22"
    reponse: 1
    explication: "rxResource() (@angular/core/rxjs-interop) est une variante de resource() avec un chargeur basé sur RxJS (champ stream renvoyant un Observable au lieu d'un loader basé sur une Promise). Comme resource() et httpResource(), elle est explicitement marquée expérimentale dans la documentation versionnée d'Angular 21 — sa stabilisation suit le même calendrier que le reste de la famille resource()."
    lecon: rxjs-signaux
---

## Essentiel

`toSignal()` (`@angular/core/rxjs-interop`) convertit un observable en signal en lecture seule. C'est la façade la plus courante pour afficher un flux RxJS dans un template sans `AsyncPipe` ni `subscribe()` manuel :

```ts
import { toSignal } from '@angular/core/rxjs-interop';

produits = toSignal(this.http.get<Produit[]>('/api/produits'), { initialValue: [] });
```

Sans `initialValue`, le signal démarre à `undefined` (type `Signal<T | undefined>`) tant que l'observable n'a pas émis. `requireSync: true` promet une émission **synchrone** dès l'abonnement (typique d'un flux dérivé d'un `BehaviorSubject`) ; le signal est alors typé sans `undefined` — mais l'utiliser sur un observable asynchrone (comme une requête HTTP) est incorrect. `toSignal()` se désabonne automatiquement à la destruction du contexte d'injection, sans code de nettoyage à écrire.

`toObservable()` fait l'inverse : transforme un signal en `Observable<T>`, pour le réinjecter dans une chaîne d'opérateurs RxJS.

```ts
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

motCle = signal('');

resultats = toSignal(
  toObservable(this.motCle).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((terme) => this.http.get<Produit[]>(`/api/produits?q=${terme}`)),
  ),
  { initialValue: [] },
);
```

Règle simple pour choisir : un **signal** pour de l'état lu de façon synchrone dans un template (`computed()`, `effect()` inclus) ; un **observable** dès qu'il faut composer dans le temps — débouncer, annuler, combiner plusieurs sources, réagir à un événement répété.

**Important pour un projet en Angular 21 :** `rxResource()` (la variante de `resource()` basée sur RxJS) existe déjà dans `@angular/core/rxjs-interop`, mais elle est **expérimentale**, comme `resource()` et `httpResource()`. À manier avec la même prudence : utilisable pour essayer, pas encore recommandée comme socle de production sans accepter un risque de changement d'API avant sa stabilisation.

## Détail

### Comment ça marche

`toSignal()` crée un signal, puis s'abonne à l'observable **dans le contexte d'injection courant** : chaque `next()` de l'observable met le signal à jour. La désinscription se fait automatiquement via le `DestroyRef` du contexte (comme `takeUntilDestroyed()`), sauf si `manualCleanup: true` est passé — dans ce cas, il faut gérer soi-même la fin de vie de l'abonnement. `toObservable()` fait l'inverse : il observe le signal avec un `effect()` interne et pousse chaque nouvelle valeur lue dans un observable.

### Exemple 1 — toSignal() avec valeur initiale

```ts
@Component({ selector: 'app-liste-commandes' })
export class ListeCommandes {
  private http = inject(HttpClient);

  commandes = toSignal(
    this.http.get<Commande[]>('/api/commandes'),
    { initialValue: [] as Commande[] },
  );
}
```

```html
@for (commande of commandes(); track commande.id) {
  <app-ligne-commande [commande]="commande" />
}
```

`initialValue` évite tout `undefined` : le template peut directement itérer sur `commandes()` dès le premier rendu, sans vérification préalable.

### Exemple 2 — requireSync avec un flux garanti synchrone

```ts
@Injectable({ providedIn: 'root' })
export class SessionService {
  private utilisateurSubject = new BehaviorSubject<Utilisateur | null>(null);
  utilisateur$ = this.utilisateurSubject.asObservable();
}

// dans un composant
private session = inject(SessionService);
utilisateur = toSignal(this.session.utilisateur$, { requireSync: true });
// utilisateur : Signal<Utilisateur | null>, jamais Signal<Utilisateur | null | undefined>
```

`BehaviorSubject` garantit une émission immédiate à l'abonnement (sa valeur courante) : `requireSync: true` est donc sûr ici, et évite d'ajouter `undefined` au type du signal en plus du `null` déjà présent dans l'état applicatif.

### Exemple 3 — Recherche réactive : signal en entrée, signal en sortie

```ts
@Component({ selector: 'app-recherche-produits' })
export class RechercheProduits {
  private http = inject(HttpClient);

  motCle = signal('');

  resultats = toSignal(
    toObservable(this.motCle).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((terme) =>
        terme.trim().length === 0
          ? of([])
          : this.http.get<Produit[]>(`/api/produits?q=${terme}`),
      ),
    ),
    { initialValue: [] as Produit[] },
  );
}
```

Le composant n'expose que des signaux (`motCle`, `resultats`) : la logique RxJS (débounce, annulation via `switchMap`) reste un détail d'implémentation interne, invisible du template comme des autres composants.

### Exemple 4 — rxResource() : aperçu (expérimental)

```ts
import { rxResource } from '@angular/core/rxjs-interop';

produitId = signal(1);

produit = rxResource({
  params: () => ({ id: produitId() }),
  stream: ({ params }) => this.http.get<Produit>(`/api/produits/${params.id}`),
});

// produit.value() / produit.isLoading() / produit.error() / produit.status()
```

`rxResource()` reprend l'interface de `resource()` (signaux `value()`, `status()`, `isLoading()`, `error()`, méthode `reload()`) mais avec un champ `stream` renvoyant un **Observable** au lieu d'un `loader` basé sur une Promise — pratique pour réutiliser des opérateurs RxJS existants (`catchError`, `retry`…) dans le flux de chargement. Comme `resource()` et `httpResource()`, elle est **expérimentale en Angular 21** : son contrat peut encore évoluer avant sa stabilisation.

### Tableau de décision — signal ou observable ?

| Besoin | Signal | Observable |
|---|---|---|
| État lu directement dans un template, `computed()`, `effect()` | ✅ | À convertir via `toSignal()` |
| Événement répété (clic, WebSocket, minuteur) | ❌ (pas de notion de flux dans le temps) | ✅ |
| Annulation d'un traitement en cours (recherche, requête obsolète) | ❌ | ✅ (`switchMap`, opérateurs) |
| Combiner/synchroniser plusieurs sources asynchrones ponctuelles | Limité | ✅ (`forkJoin`, `combineLatest`) |
| Valeur affichée dans le template sans logique de composition | ✅, le plus direct | Possible via `AsyncPipe`, plus verbeux |

### Pièges courants

> **Lire un signal issu de `toSignal()` sans `initialValue` ni `requireSync`, en supposant qu'il a toujours une valeur.** Le type `Signal<T | undefined>` existe précisément parce que l'observable n'a peut-être pas encore émis. Appeler `.length` ou une propriété directement sur le résultat avant la première émission provoque une erreur d'exécution — vérifier `undefined`, fournir `initialValue`, ou n'utiliser `requireSync: true` que si l'émission synchrone est garantie.

> **Combiner `requireSync: true` avec un observable asynchrone par nature (HTTP, minuteur).** Ces flux n'émettent jamais de façon synchrone à l'abonnement : la promesse que fait `requireSync` ne peut pas être honorée, et l'application se retrouve dans un état incohérent au démarrage.

> **Recréer `toObservable()` à chaque appel plutôt que de le garder en champ.** Appeler `toObservable(this.motCle)` à plusieurs endroits crée plusieurs observables indépendants, chacun avec son propre effet interne de suivi du signal. Le motif recommandé est de créer l'observable **une seule fois** (champ de classe ou variable locale au constructeur), puis de le réutiliser dans le `pipe()`.

### À retenir

- `toSignal()` convertit un observable en signal en lecture seule, avec désabonnement automatique à la destruction du contexte.
- Sans `initialValue`, le signal démarre à `undefined` ; `requireSync: true` ne convient qu'à un flux garanti synchrone (ex. `BehaviorSubject`), jamais à un appel HTTP.
- `toObservable()` fait l'inverse : un signal devient un observable, réutilisable avec les opérateurs RxJS.
- Le motif « recherche réactive » (`toObservable` → `debounceTime`/`switchMap` → `toSignal`) permet de garder une interface 100 % signaux tout en profitant des opérateurs RxJS en interne.
- `rxResource()` existe en Angular 21 (`@angular/core/rxjs-interop`, champ `stream`), mais reste **expérimentale**, au même titre que `resource()` et `httpResource()`.
