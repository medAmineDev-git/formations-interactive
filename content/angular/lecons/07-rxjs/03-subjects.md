---
id: subjects
chapitre: rxjs
ordre: 3
titre: "Subject, BehaviorSubject et partage de flux"
termes:
  - terme: Subject
    definition: "Un observable qui est **aussi** un Observer : il expose `next()`, `error()` et `complete()` pour émettre des valeurs manuellement, en plus de `subscribe()`. Contrairement à un observable froid, il est **multidiffusé** (chaud) : tous les abonnés reçoivent les mêmes valeurs, émises après leur abonnement."
  - terme: "next() / error() / complete()"
    definition: "Les trois méthodes qu'un Subject expose pour piloter son flux : `next(valeur)` émet une valeur à tous les abonnés actuels, `error(e)` termine le flux en erreur, `complete()` le termine normalement. Après `error()` ou `complete()`, plus aucune valeur ne sera émise."
  - terme: BehaviorSubject
    definition: "Un Subject qui exige une **valeur initiale** à la création et retient toujours sa **dernière valeur**. Tout nouvel abonné la reçoit immédiatement à l'abonnement, même s'il arrive après les émissions précédentes. Accessible aussi de façon synchrone via `getValue()`."
  - terme: ReplaySubject
    definition: "Un Subject qui **rejoue** aux nouveaux abonnés un certain nombre de valeurs passées (`new ReplaySubject(n)`), au lieu de la seule dernière comme `BehaviorSubject`. Ne demande pas de valeur initiale : tant qu'aucun `next()` n'a eu lieu, un nouvel abonné ne reçoit rien."
  - terme: "asObservable()"
    definition: "Méthode qui renvoie une **vue en lecture seule** d'un Subject : le type `Observable<T>` obtenu expose `subscribe()` mais pas `next()`/`error()`/`complete()`. Pratique standard pour exposer un flux depuis un service sans laisser le code appelant l'émettre lui-même."
  - terme: Multicast (multidiffusion)
    definition: "Comportement où une seule exécution du producteur est **partagée** entre plusieurs abonnés (par opposition à un observable froid, où chaque abonnement relance une exécution séparée). Les Subjects sont nativement multidiffusés."
  - terme: "shareReplay()"
    definition: "Opérateur qui transforme un observable froid en un flux multidiffusé qui **rejoue** ses dernières valeurs (`shareReplay(1)` = la dernière) à tout nouvel abonné, tout en ne gardant qu'**une seule** exécution partagée du producteur d'origine."
quiz:
  - question: "Que reçoit le deuxième abonné dans ce code ?"
    code: |
      const panier$ = new BehaviorSubject<LigneCommande[]>([]);

      panier$.next([{ produit: 'Clavier', quantite: 1 }]);

      panier$.subscribe(lignes => console.log('abonné tardif', lignes));
    choix:
      - "Rien : il faut s'abonner avant le premier next() pour recevoir quelque chose"
      - "Immédiatement la dernière valeur connue, soit [{ produit: 'Clavier', quantite: 1 }], même s'il s'est abonné après le next()"
      - "Une erreur, car BehaviorSubject interdit de s'abonner après un next()"
      - "Uniquement le tableau vide initial fourni à la création"
    reponse: 1
    explication: "C'est la caractéristique qui distingue BehaviorSubject d'un Subject simple : il retient toujours sa dernière valeur et la redonne immédiatement à tout nouvel abonné, même arrivé après coup. Un Subject simple, lui, n'aurait rien donné à cet abonné tardif — seules les valeurs émises après son abonnement lui seraient parvenues."
  - question: "Pourquoi exposer panier$ = this.panierSubject.asObservable() plutôt que directement this.panierSubject depuis un service ?"
    choix:
      - "asObservable() est plus performant, car il évite un abonnement supplémentaire"
      - "Exposer le Subject brut permettrait à n'importe quel code appelant d'appeler next()/error()/complete() lui-même, contournant la logique du service ; asObservable() ne conserve que subscribe(), imposant que toute émission passe par les méthodes du service"
      - "asObservable() transforme le Subject en BehaviorSubject automatiquement"
      - "C'est purement stylistique, les deux sont strictement équivalents à l'exécution"
    reponse: 1
    explication: "C'est une question d'encapsulation : sans asObservable(), n'importe quel composant qui reçoit panierSubject pourrait appeler panierSubject.next(...) directement, en contournant complètement la logique métier du service (validation, calculs, persistance). asObservable() expose un type Observable<T> qui ne propose que subscribe() — les mutations ne peuvent plus passer que par les méthodes publiques du service (ajouterLigne(), viderPanier()…)."
  - question: "Quel est le piège classique de shareReplay() sans précaution particulière sur un flux HTTP qui ne se termine jamais (par exemple un WebSocket) ?"
    choix:
      - "shareReplay() ne fonctionne tout simplement pas sur un flux qui ne se termine pas"
      - "Le comportement par défaut (refCount à false) garde l'abonnement au flux source actif même quand plus aucun abonné n'écoute, ce qui peut retenir des ressources indéfiniment (fuite mémoire, connexion jamais fermée)"
      - "shareReplay() force le flux à se terminer après la première valeur"
      - "shareReplay() ne peut être utilisé que sur des observables déjà chauds"
    reponse: 1
    explication: "Sans configurer refCount (via la forme `shareReplay({ bufferSize, refCount: true })`), l'abonnement au flux source n'est jamais coupé automatiquement, même si tous les abonnés se sont désabonnés. Sur un flux qui ne se termine pas de lui-même, ça peut maintenir une connexion ou un abonnement ouvert indéfiniment. refCount:true corrige ça en désabonnant du flux source quand le dernier abonné se retire."
    lecon: subjects
---

## Essentiel

Un `Subject` est à la fois un observable et un Observer : il a `subscribe()` **et** `next()`/`error()`/`complete()`. Contrairement aux observables froids vus jusqu'ici, il est **multidiffusé** : tous les abonnés partagent les mêmes émissions.

```ts
const evenements = new Subject<string>();

evenements.subscribe(e => console.log('A reçoit', e));
evenements.next('commande créée'); // A reçoit "commande créée"

evenements.subscribe(e => console.log('B reçoit', e));
evenements.next('commande expédiée'); // A et B reçoivent tous les deux
```

Un abonné qui arrive **après** un `next()` rate cette valeur — sauf avec deux variantes :

- `BehaviorSubject<T>` exige une valeur initiale et redonne toujours sa **dernière** valeur à tout nouvel abonné, même tardif.
- `ReplaySubject<T>(n)` rejoue les `n` **dernières** valeurs à tout nouvel abonné.

Depuis un service, on expose presque toujours un Subject via `asObservable()` : le type obtenu (`Observable<T>`) ne garde que `subscribe()`, pas `next()` — le code appelant ne peut pas émettre à la place du service.

```ts
@Injectable({ providedIn: 'root' })
export class PanierService {
  private panierSubject = new BehaviorSubject<LigneCommande[]>([]);
  panier$ = this.panierSubject.asObservable(); // lecture seule pour l'extérieur

  ajouterLigne(ligne: LigneCommande) {
    this.panierSubject.next([...this.panierSubject.value, ligne]);
  }
}
```

En Angular 21, ce motif de `BehaviorSubject` de service pour de l'**état** (une valeur courante, lue de façon synchrone) est souvent avantageusement remplacé par un `signal()` : plus simple à lire dans un template (pas de `| async`), pas de question de valeur initiale, et compatible nativement avec `computed()`/`effect()`. RxJS reste pertinent pour l'**événement**/le **flux** qui traverse le service (voir la prochaine leçon sur les passerelles entre les deux mondes).

## Détail

### Chaud contre froid, à nouveau

Un observable froid (vu dans la première leçon) exécute son producteur séparément pour chaque abonné. Un Subject est **chaud** : il n'a pas de « producteur » propre, il ne fait que retransmettre ce qu'on lui envoie via `next()` à tous les abonnés actuels. C'est ce qui permet à plusieurs parties de l'application d'écouter le **même** flux d'événements, plutôt que de déclencher chacune leur propre exécution indépendante.

### Exemple 1 — Panier partagé avec BehaviorSubject

```ts
@Injectable({ providedIn: 'root' })
export class PanierService {
  private lignesSubject = new BehaviorSubject<LigneCommande[]>([]);
  lignes$ = this.lignesSubject.asObservable();

  get lignesActuelles(): LigneCommande[] {
    return this.lignesSubject.value; // lecture synchrone, sans subscribe()
  }

  ajouterLigne(ligne: LigneCommande) {
    this.lignesSubject.next([...this.lignesActuelles, ligne]);
  }

  viderPanier() {
    this.lignesSubject.next([]);
  }
}
```

Deux composants qui s'abonnent à `lignes$` — l'icône panier dans l'en-tête et la page panier elle-même — reçoivent toujours le même état, synchronisé automatiquement dès qu'un `next()` a lieu.

### Exemple 2 — Journal d'événements récents avec ReplaySubject

```ts
@Injectable({ providedIn: 'root' })
export class JournalCommandesService {
  private evenementsSubject = new ReplaySubject<EvenementCommande>(5); // les 5 derniers
  evenements$ = this.evenementsSubject.asObservable();

  publier(evenement: EvenementCommande) {
    this.evenementsSubject.next(evenement);
  }
}
```

Un composant « historique récent » qui s'abonne après coup (par exemple un panneau ouvert tardivement par l'utilisateur) reçoit immédiatement les 5 derniers événements déjà publiés, sans avoir eu besoin d'être présent au moment où ils se sont produits.

### Exemple 3 — shareReplay() pour éviter des requêtes HTTP dupliquées

```ts
@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private categories$ = this.http.get<Categorie[]>('/api/categories').pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  obtenirCategories() {
    return this.categories$; // même flux partagé pour tous les appelants
  }
}
```

Sans `shareReplay()`, chaque composant qui appelle `obtenirCategories()` et s'y abonne déclencherait sa **propre** requête HTTP (observable froid). Avec `shareReplay({ bufferSize: 1, refCount: true })`, une seule requête est faite ; les abonnés suivants reçoivent la dernière réponse mise en cache. `refCount: true` désabonne du flux source (et donc libère le cache) quand plus personne n'écoute — sans ça, l'abonnement resterait actif indéfiniment.

### Comparaison Subject / BehaviorSubject / ReplaySubject

| | `Subject` | `BehaviorSubject` | `ReplaySubject` |
|---|---|---|---|
| Valeur initiale requise | Non | **Oui** | Non |
| Ce que reçoit un abonné tardif | Rien (seulement le futur) | La **dernière** valeur, immédiatement | Les **n dernières** valeurs, immédiatement |
| Lecture synchrone de la valeur courante | Non | `getValue()` / `.value` | Non |
| Cas d'usage typique | Événement ponctuel (notification, action) | État courant partagé (panier, utilisateur connecté) | Historique récent (journal, derniers messages) |

### Pièges courants

> **Exposer le Subject brut au lieu d'un `asObservable()`.** Un composant qui reçoit directement le `BehaviorSubject` du service peut appeler `.next()` lui-même, en contournant toute la logique métier (validation, effets de bord). Toujours exposer `panier$ = this.panierSubject.asObservable()`, jamais `this.panierSubject` directement.

> **Confondre `Subject` et `BehaviorSubject` pour de l'état.** Utiliser un `Subject` simple pour représenter un état courant (statut de connexion, filtre actif) fait qu'un composant qui s'abonne après coup ne reçoit rien tant qu'un nouveau `next()` n'a pas lieu — il affiche un état vide ou obsolète. Dès qu'il faut une « dernière valeur connue », `BehaviorSubject` est le bon choix.

> **Utiliser `shareReplay()` sans `refCount: true` sur un flux qui ne se termine jamais.** Le comportement par défaut garde l'abonnement au flux source actif même sans abonné restant, ce qui peut retenir une connexion ou une ressource indéfiniment. `shareReplay({ bufferSize: 1, refCount: true })` referme le flux source quand le dernier abonné se désabonne.

### À retenir

- Un `Subject` est chaud et multidiffusé : `next()`/`error()`/`complete()` pour émettre, `subscribe()` pour écouter — tous les abonnés partagent le même flux.
- `BehaviorSubject` retient sa dernière valeur (valeur initiale obligatoire) ; `ReplaySubject` rejoue les `n` dernières.
- `asObservable()` expose un flux en lecture seule : c'est la pratique standard pour un service.
- `shareReplay()` partage une seule exécution d'un observable froid entre plusieurs abonnés ; `refCount: true` évite la fuite mémoire sur un flux qui ne se termine pas.
- Pour de l'**état** simple lu de façon synchrone, un `signal()` remplace aujourd'hui avantageusement un `BehaviorSubject` de service ; RxJS reste préférable pour un **flux**/**événement** composé avec des opérateurs.
