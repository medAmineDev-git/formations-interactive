---
id: erreurs-http
chapitre: http
ordre: 3
titre: Gérer les erreurs et les états de chargement
termes:
  - terme: HttpErrorResponse
    definition: "Objet reçu quand une requête `HttpClient` échoue (réseau ou statut HTTP d'erreur). Expose `status` (0 pour une erreur réseau, sinon le code HTTP), `statusText`, `error` (le corps de la réponse d'erreur) et `message`."
  - terme: catchError
    definition: "Opérateur RxJS qui intercepte une erreur dans un flux et permet de la remplacer par une valeur de repli, ou de la relancer sous une autre forme, avec `throwError(...)`."
  - terme: Erreur réseau vs erreur serveur
    definition: "Une erreur réseau (`status === 0`, ex. pas de connexion, CORS bloqué) n'a jamais atteint le serveur. Une erreur serveur (`status` 4xx ou 5xx) signifie que le serveur a répondu, mais avec un refus ou une panne. Les messages à afficher diffèrent."
  - terme: retry
    definition: "Opérateur RxJS qui **réessaie automatiquement** une requête ayant échoué, un nombre de fois donné. Pertinent pour une requête `GET` idempotente sur une erreur transitoire, dangereux sur une opération qui modifie des données (`POST`, `PATCH`)."
  - terme: "État de chargement (signal)"
    definition: "Représentation de l'avancement d'une requête sous forme de signal (`chargement`, `succes`, `erreur`), pour piloter l'affichage : spinner, contenu, ou message d'erreur."
  - terme: switchMap
    definition: "Opérateur RxJS qui, à chaque nouvelle valeur de la source, **annule** l'appel HTTP précédent en cours (s'il n'est pas terminé) et n'en garde que le dernier. Utile pour une recherche au fil de la frappe."
quiz:
  - question: "Que se passe-t-il quand /api/produits répond 404 avec ce code ?"
    code: |
      this.http.get<Produit[]>('/api/produits').pipe(
        catchError((erreur: HttpErrorResponse) => {
          console.error(erreur.message);
          return of([]);
        }),
      ).subscribe((produits) => this.produits.set(produits));
    choix:
      - "L'abonné reçoit une erreur, catchError ne change rien"
      - "L'abonné reçoit un tableau vide : catchError remplace l'erreur par une valeur de repli, le flux se termine normalement"
      - "L'application plante avec une exception non gérée"
      - "La requête est automatiquement relancée avant d'atteindre catchError"
    reponse: 1
    explication: "catchError intercepte l'erreur et retourne of([]), un nouvel Observable qui émet un tableau vide puis se termine. Pour l'abonné, tout se passe comme si la requête avait réussi avec ce résultat : this.produits.set([]) s'exécute normalement."
  - question: "Pourquoi ajouter retry(2) sur cette requête serait une mauvaise idée ?"
    code: |
      creerCommande(commande: NouvelleCommande): Observable<Commande> {
        return this.http.post<Commande>('/api/commandes', commande);
      }
    choix:
      - "retry() ne fonctionne que sur les requêtes GET, elle n'existe pas pour POST"
      - "POST n'est pas idempotent : réessayer automatiquement risque de créer plusieurs commandes identiques si le serveur a bien reçu la première tentative"
      - "retry() bloque le thread principal pendant les tentatives"
      - "Cela déclenche systématiquement une erreur CORS"
    reponse: 1
    explication: "retry() convient à des opérations idempotentes comme GET, où rejouer la requête ne change rien au résultat final. Sur un POST qui crée une ressource, un échec peut survenir après que le serveur a déjà traité la création : réessayer risque de dupliquer la commande."
  - question: "Quelle est la différence entre une erreur réseau et une erreur serveur dans un HttpErrorResponse ?"
    choix:
      - "Il n'y a aucune différence, les deux sont traitées de la même façon par catchError"
      - "Une erreur réseau a status égal à 0 (la requête n'a jamais atteint le serveur) ; une erreur serveur a un status HTTP 4xx ou 5xx (le serveur a répondu)"
      - "Une erreur réseau a toujours le status 500, une erreur serveur a toujours le status 400"
      - "Le status distingue les erreurs de validation des erreurs d'authentification uniquement"
    reponse: 1
    explication: "status === 0 signale que la requête n'a jamais atteint le serveur (pas de connexion, CORS bloqué...) : aucun code HTTP n'a été reçu. Un status 4xx ou 5xx signifie au contraire que le serveur a répondu, mais avec un refus (4xx) ou une panne (5xx). Le message affiché à l'utilisateur devrait distinguer les deux cas."
---

## Essentiel

Une requête `HttpClient` peut échouer pour deux raisons différentes : le réseau n'a pas atteint le serveur (`status === 0`, CORS bloqué, pas de connexion), ou le serveur a répondu avec un statut d'erreur (`404`, `400`, `500`…). Dans les deux cas, l'`Observable` émet une erreur de type `HttpErrorResponse`, à intercepter avec `catchError` :

```ts
chargerProduits(): Observable<Produit[]> {
  return this.http.get<Produit[]>('/api/produits').pipe(
    catchError((erreur: HttpErrorResponse) => {
      const message = erreur.status === 0
        ? 'Impossible de joindre le serveur.'
        : `Erreur ${erreur.status} : ${erreur.error?.message ?? 'inconnue'}`;
      return throwError(() => new Error(message));
    }),
  );
}
```

Pour piloter l'affichage, on modélise l'état d'un chargement avec des **signaux** plutôt que de tout mélanger dans un seul booléen : un état `chargement` / `succes` / `erreur` (ou équivalent) permet d'afficher un spinner, le contenu, ou un message adapté selon le cas.

`retry` réessaie automatiquement une requête en échec : pertinent sur un `GET` (opération sans effet de bord), risqué sur un `POST` qui crée une ressource — la première tentative a peut-être déjà réussi côté serveur malgré une réponse perdue.

Pour **annuler** une requête devenue inutile (l'utilisateur tape une nouvelle recherche avant que la précédente ait répondu), `switchMap` abandonne l'appel précédent dès qu'une nouvelle valeur source arrive.

## Détail

### Modéliser l'état d'une requête avec des signaux

```ts
interface EtatCatalogue {
  statut: 'chargement' | 'succes' | 'erreur';
  produits: Produit[];
  messageErreur: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProduitStore {
  private http = inject(HttpClient);
  private etatSignal = signal<EtatCatalogue>({
    statut: 'chargement',
    produits: [],
    messageErreur: null,
  });
  etat = this.etatSignal.asReadonly();

  charger() {
    this.etatSignal.set({ statut: 'chargement', produits: [], messageErreur: null });

    this.http.get<Produit[]>('/api/produits').pipe(
      catchError((erreur: HttpErrorResponse) => {
        this.etatSignal.set({
          statut: 'erreur',
          produits: [],
          messageErreur: this.messagePour(erreur),
        });
        return EMPTY;
      }),
    ).subscribe((produits) => {
      this.etatSignal.set({ statut: 'succes', produits, messageErreur: null });
    });
  }

  private messagePour(erreur: HttpErrorResponse): string {
    return erreur.status === 0
      ? 'Connexion impossible. Vérifiez votre réseau.'
      : `Le serveur a renvoyé une erreur (${erreur.status}).`;
  }
}
```

Le template n'a plus qu'à réagir au `statut` :

```html
@switch (etat().statut) {
  @case ('chargement') { <app-spinner /> }
  @case ('erreur') { <p class="erreur">{{ etat().messageErreur }}</p> }
  @case ('succes') {
    @for (produit of etat().produits; track produit.id) {
      <p>{{ produit.nom }}</p>
    }
  }
}
```

### Exemple 1 — Distinguer erreur réseau et erreur serveur

```ts
catchError((erreur: HttpErrorResponse) => {
  if (erreur.status === 0) {
    console.error('Erreur réseau', erreur.error);
    return throwError(() => new Error('Connexion au serveur impossible.'));
  }
  if (erreur.status === 404) {
    return throwError(() => new Error('Produit introuvable.'));
  }
  return throwError(() => new Error('Une erreur inattendue est survenue.'));
})
```

Renvoyer un message générique et technique (« Erreur 500 ») à l'utilisateur final est rarement utile ; autant traduire les cas connus en messages compréhensibles.

### Exemple 2 — `retry` sur une requête GET

```ts
chargerCatalogue(): Observable<Produit[]> {
  return this.http.get<Produit[]>('/api/produits').pipe(
    retry({ count: 2, delay: 500 }),
    catchError((erreur: HttpErrorResponse) => {
      return throwError(() => new Error('Le catalogue est momentanément indisponible.'));
    }),
  );
}
```

`retry` doit être placé **avant** `catchError` dans le `pipe` : il ne s'applique qu'aux tentatives, `catchError` intercepte l'échec final si toutes les tentatives ont échoué.

### Exemple 3 — Annuler une requête devenue obsolète

```ts
rechercheProduit = signal('');
resultats = toSignal(
  toObservable(this.rechercheProduit).pipe(
    debounceTime(300),
    switchMap((motCle) =>
      this.http.get<Produit[]>('/api/produits', { params: { q: motCle } }).pipe(
        catchError(() => of([])),
      ),
    ),
  ),
  { initialValue: [] },
);
```

Si l'utilisateur tape une nouvelle lettre avant que la requête précédente ait répondu, `switchMap` se désabonne de l'appel en cours : sa réponse, si elle arrive quand même, est ignorée. Sans cela, une réponse ancienne et lente pourrait écraser un résultat plus récent.

### Exemple 4 — Ne pas réessayer une opération qui modifie des données

```ts
validerCommande(commande: NouvelleCommande): Observable<Commande> {
  // Pas de retry() ici : un POST n'est pas idempotent.
  return this.http.post<Commande>('/api/commandes', commande).pipe(
    catchError((erreur: HttpErrorResponse) => {
      return throwError(() => new Error('La commande n\'a pas pu être enregistrée.'));
    }),
  );
}
```

Si un mécanisme de nouvelle tentative est vraiment nécessaire sur une écriture, il doit s'appuyer sur une garantie côté serveur (identifiant d'idempotence), pas sur un simple `retry()` côté client.

### Pièges courants

> **`catchError` qui avale l'erreur sans la relancer ni prévenir l'utilisateur.** Retourner `of(...)` sans mettre à jour un état « erreur » fait croire que tout s'est bien passé, alors que la donnée affichée est simplement vide ou par défaut.

> **`retry()` sur une opération d'écriture.** Rejouer un `POST` ou un `PATCH` après un échec réseau peut dupliquer une commande déjà enregistrée côté serveur, si seule la réponse s'est perdue.

> **Oublier d'annuler une recherche obsolète.** Sans `switchMap` (ou un désabonnement manuel), une réponse lente à une ancienne recherche peut arriver **après** une réponse plus récente et écraser le résultat affiché.

### À retenir

- `HttpErrorResponse.status` vaut `0` pour une erreur réseau, sinon c'est le code HTTP renvoyé par le serveur.
- `catchError` intercepte l'erreur ; utilisez `throwError(() => ...)` pour la relancer sous une forme utile à l'appelant.
- `retry` convient aux requêtes idempotentes (`GET`), pas aux opérations d'écriture (`POST`).
- Modéliser l'état d'une requête avec un signal (`chargement` / `succes` / `erreur`) simplifie le template.
- `switchMap` annule automatiquement une requête devenue obsolète (recherche au fil de la frappe).
