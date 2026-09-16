---
id: operateurs
chapitre: rxjs
ordre: 2
titre: Les opérateurs essentiels
termes:
  - terme: "pipe()"
    definition: "Méthode d'un observable qui enchaîne une suite d'opérateurs, chacun recevant le flux transformé par le précédent et renvoyant un nouvel observable. Ne modifie jamais l'observable d'origine (immuable)."
  - terme: "map() et filter()"
    definition: "`map()` transforme chaque valeur émise (comme `Array.prototype.map`) ; `filter()` ne laisse passer que les valeurs qui satisfont un prédicat (comme `Array.prototype.filter`). Les deux opérateurs les plus élémentaires pour transformer un flux."
  - terme: "debounceTime() et distinctUntilChanged()"
    definition: "`debounceTime(ms)` attend un silence de `ms` millisecondes avant de laisser passer la dernière valeur (utile pour une recherche au fil de la frappe). `distinctUntilChanged()` ignore une valeur identique à la précédente, évitant un travail redondant."
  - terme: "catchError() et retry()"
    definition: "`catchError()` intercepte une erreur du flux et permet de la remplacer par un observable de repli (ou de la relancer). `retry(n)` réabonne automatiquement au flux source jusqu'à `n` fois en cas d'erreur, avant de laisser l'erreur passer."
  - terme: "finalize()"
    definition: "Exécute une fonction quand le flux se termine, **que ce soit par succès (`complete`), par erreur, ou par désabonnement** — l'équivalent d'un `finally` pour un observable. Utile pour arrêter un indicateur de chargement dans tous les cas."
  - terme: "combineLatest() et forkJoin()"
    definition: "`combineLatest([a$, b$])` recombine la dernière valeur de chaque flux à chaque émission de l'un d'eux (tant que tous ont émis au moins une fois). `forkJoin([a$, b$])` attend que **tous** les flux se terminent et n'émet qu'**une seule fois**, avec la dernière valeur de chacun."
  - terme: "switchMap(), mergeMap(), concatMap(), exhaustMap()"
    definition: "Les quatre opérateurs d'aplatissement (« flattening ») : chacun reçoit une valeur et la transforme en un nouvel observable interne, mais ils diffèrent sur **ce qu'ils font des observables internes en cours** quand une nouvelle valeur arrive (voir le tableau comparatif)."
quiz:
  - question: "Un champ de recherche déclenche cette chaîne. Que se passe-t-il si l'utilisateur tape \"c\", puis \"ca\" avant que la requête pour \"c\" ait répondu ?"
    code: |
      motCle$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(terme => this.http.get<Produit[]>(`/api/produits?q=${terme}`)),
      ).subscribe(resultats => this.resultats.set(resultats));
    choix:
      - "Les deux requêtes (\"c\" et \"ca\") s'exécutent, et les résultats des deux s'affichent l'un après l'autre"
      - "switchMap() annule l'observable interne encore en cours (la requête pour \"c\") dès que \"ca\" produit une nouvelle valeur ; seul le résultat de \"ca\" sera pris en compte"
      - "Une erreur est levée car deux requêtes HTTP ne peuvent pas être actives en même temps"
      - "debounceTime(300) empêche complètement la deuxième frappe d'être prise en compte"
    reponse: 1
    explication: "switchMap() « bascule » (switch) vers le nouvel observable interne à chaque nouvelle valeur, en désabonnant l'observable interne précédent s'il n'a pas fini — ici, ça annule la requête HTTP pour \"c\" en cours. C'est exactement ce qu'on veut pour une recherche : seul le dernier résultat pertinent doit s'afficher, jamais une réponse obsolète qui arriverait en retard."
  - question: "Pourquoi utiliser exhaustMap() plutôt que switchMap() pour un bouton « Enregistrer » cliqué plusieurs fois rapidement ?"
    choix:
      - "exhaustMap() ignore complètement tous les clics et n'envoie jamais la requête"
      - "exhaustMap() ignore les nouveaux clics tant que la requête d'enregistrement en cours n'est pas terminée, évitant d'envoyer plusieurs requêtes de sauvegarde en parallèle pour le même clic"
      - "exhaustMap() est simplement un synonyme plus rapide de switchMap()"
      - "exhaustMap() met les clics en file d'attente et les exécute un par un, dans l'ordre"
    reponse: 1
    explication: "exhaustMap() ignore toute nouvelle valeur tant que l'observable interne en cours n'est pas terminé — c'est le comportement recherché pour un double-clic accidentel sur « Enregistrer » : la première requête part, les clics suivants pendant qu'elle est en vol sont ignorés. Mettre les clics en file (traiter chacun dans l'ordre, sans en perdre) est le rôle de concatMap(), pas d'exhaustMap()."
  - question: "Une page doit afficher le détail d'une commande ET les informations du client associé, chacun via un appel HTTP séparé, avant de tout afficher d'un coup. Quel opérateur choisir ?"
    choix:
      - "combineLatest(), pour recombiner les deux flux à chaque émission"
      - "forkJoin(), car les deux appels HTTP se terminent chacun après une seule émission, et on veut attendre que les deux soient prêts avant d'afficher quoi que ce soit"
      - "switchMap(), pour enchaîner les deux appels l'un après l'autre"
      - "exhaustMap(), pour ignorer le deuxième appel si le premier n'est pas terminé"
    reponse: 1
    explication: "forkJoin() est fait pour ce cas : plusieurs observables qui se terminent chacun (typiquement des requêtes HTTP), dont on veut la dernière valeur de chacun, **une seule fois**, une fois que tous sont terminés. combineLatest() convient à des flux qui continuent d'émettre dans le temps (ex. deux signaux convertis en observables), pas à des appels HTTP ponctuels."
    lecon: operateurs
---

## Essentiel

`pipe()` enchaîne des **opérateurs** : chacun reçoit le flux transformé par le précédent et renvoie un nouvel observable, sans jamais modifier l'original.

```ts
produits$.pipe(
  filter(p => p.enStock),
  map(p => p.nom),
  tap(nom => console.log('produit disponible :', nom)),
);
```

Pour une recherche au fil de la frappe, le trio `debounceTime` + `distinctUntilChanged` + `switchMap` est quasi systématique : attendre une pause dans la frappe, ignorer les termes identiques, puis lancer la requête en annulant la précédente si elle est encore en vol.

```ts
motCle$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(terme => this.http.get<Produit[]>(`/api/produits?q=${terme}`)),
);
```

Pour une requête HTTP robuste : `retry()` pour retenter automatiquement, `catchError()` pour intercepter une erreur définitive et fournir un résultat de repli, `finalize()` pour arrêter un indicateur de chargement dans tous les cas (succès **ou** erreur).

`combineLatest()` et `forkJoin()` combinent plusieurs flux : le premier recombine en continu, le second attend que tout se termine pour n'émettre qu'une fois.

Le choix le plus déterminant reste celui de l'opérateur d'aplatissement — `switchMap`, `mergeMap`, `concatMap` ou `exhaustMap` — détaillé plus bas : ils se ressemblent syntaxiquement mais produisent des comportements très différents selon ce qu'on veut faire des appels en cours.

## Détail

### Comment ça marche

Un opérateur RxJS est une fonction qui prend un observable en entrée et renvoie un observable en sortie — `pipe()` n'est qu'un enchaînement de ces fonctions. Rien ne s'exécute tant qu'il n'y a pas d'abonnement final : `produits$.pipe(map(...), filter(...))` ne fait rien tout seul, exactement comme l'observable de départ.

### Exemple 1 — Recherche produits robuste

```ts
this.motCle$
  .pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((terme) =>
      this.http.get<Produit[]>(`/api/produits?q=${terme}`).pipe(
        catchError(() => of([])), // en cas d'erreur, résultat vide plutôt qu'un flux cassé
      ),
    ),
  )
  .subscribe((resultats) => this.resultats.set(resultats));
```

`catchError()` est placé **à l'intérieur** du `switchMap()`, sur l'observable HTTP interne : une erreur sur une requête ne casse pas le flux principal `motCle$`, qui continue de fonctionner pour les prochaines recherches.

### Exemple 2 — Appel HTTP avec retry, catchError et finalize

```ts
chargement = signal(false);

chargerCommande(id: number) {
  this.chargement.set(true);

  this.http.get<Commande>(`/api/commandes/${id}`).pipe(
    retry(2),                         // jusqu'à 2 nouvelles tentatives en cas d'erreur
    catchError((erreur) => {
      this.messageErreur.set('Impossible de charger la commande.');
      return EMPTY;                   // flux vide : plus rien après une erreur définitive
    }),
    finalize(() => this.chargement.set(false)),
  ).subscribe((commande) => this.commande.set(commande));
}
```

`finalize()` s'exécute **toujours** — succès, erreur définitive après `retry`, ou désabonnement anticipé — ce qui en fait l'endroit fiable pour arrêter un indicateur de chargement, contrairement à un `.subscribe({ next, error })` où il faudrait dupliquer le même code dans les deux callbacks.

### Exemple 3 — combineLatest() contre forkJoin()

```ts
// combineLatest : recombine à chaque changement (flux continus)
combineLatest([panier$, tauxTVA$]).pipe(
  map(([panier, taux]) => calculerTotalTTC(panier, taux)),
).subscribe((total) => this.totalTTC.set(total));

// forkJoin : attend que tout se termine (appels ponctuels)
forkJoin({
  commande: this.http.get<Commande>(`/api/commandes/${id}`),
  client: this.http.get<Client>(`/api/clients/${clientId}`),
}).subscribe(({ commande, client }) => {
  this.commande.set(commande);
  this.client.set(client);
});
```

`combineLatest` convient à des flux qui vivent dans le temps (panier modifiable, taux de TVA reconfigurable). `forkJoin` convient à des appels ponctuels qu'on veut synchroniser : rien ne s'affiche tant que les deux requêtes ne sont pas terminées.

### Exemple 4 — Les quatre opérateurs d'aplatissement

```ts
// switchMap : annule l'appel précédent — recherche, filtre au fil de la frappe
motCle$.pipe(switchMap((q) => this.http.get(`/api/produits?q=${q}`)));

// mergeMap : lance tout en parallèle, sans annuler ni mettre en file
fichiersASynchroniser$.pipe(mergeMap((fichier) => this.uploaderFichier(fichier)));

// concatMap : met en file, exécute un par un dans l'ordre strict
lignesAAjouter$.pipe(concatMap((ligne) => this.http.post('/api/commandes/lignes', ligne)));

// exhaustMap : ignore les nouvelles valeurs tant que l'appel en cours n'est pas fini
clicEnregistrer$.pipe(exhaustMap(() => this.http.post('/api/commandes', this.commande())));
```

### Tableau comparatif — quel opérateur d'aplatissement choisir

| Opérateur | Que fait-il des appels en cours ? | Cas d'usage typique |
|---|---|---|
| `switchMap` | **Annule** l'observable interne précédent dès qu'une nouvelle valeur arrive | Recherche, filtre au fil de la frappe : seul le dernier résultat compte |
| `mergeMap` | Lance **tous** les observables internes en parallèle, sans annuler ni ordonner | Envois indépendants (upload de plusieurs fichiers) où l'ordre n'a pas d'importance |
| `concatMap` | **Met en file** : attend que l'observable interne précédent se termine avant de démarrer le suivant | Écritures qui doivent respecter un ordre strict (ajouter des lignes de commande une par une) |
| `exhaustMap` | **Ignore** toute nouvelle valeur tant que l'observable interne en cours n'est pas terminé | Double-clic sur « Enregistrer » / « Envoyer » : éviter les soumissions en double |

### Pièges courants

> **Utiliser `switchMap()` pour un envoi (POST) qui ne doit pas être annulé.** Annuler une requête HTTP en cours n'annule pas forcément la mutation déjà en train de s'exécuter côté serveur : pour un enregistrement, `exhaustMap()` (ignorer les clics en trop) ou `concatMap()` (mettre en file, sans rien perdre) sont presque toujours le bon choix, pas `switchMap()`.

> **Utiliser `mergeMap()` là où l'ordre des réponses compte.** `mergeMap()` lance tout en parallèle : rien ne garantit que les réponses reviennent dans l'ordre des requêtes. Si l'ordre importe (afficher les résultats de recherche dans l'ordre des frappes), `switchMap()` ou `concatMap()` conviennent, pas `mergeMap()`.

> **Empiler des `subscribe()` imbriqués au lieu d'enchaîner des opérateurs.** Appeler `subscribe()` à l'intérieur d'un autre `subscribe()` pour chaîner deux appels HTTP reproduit le « callback hell » que RxJS est censé éviter, et rend le désabonnement impossible à faire proprement. Un `switchMap()` ou `concatMap()` remplace toujours ce motif.

### À retenir

- `pipe()` enchaîne des opérateurs ; l'observable d'origine n'est jamais modifié.
- `debounceTime` + `distinctUntilChanged` + `switchMap` : le trio de la recherche au fil de la frappe.
- `catchError`, `retry`, `finalize` : la base d'une requête HTTP robuste — `finalize()` s'exécute dans tous les cas.
- `combineLatest()` pour des flux continus à recombiner ; `forkJoin()` pour des appels ponctuels à synchroniser une seule fois.
- Le choix entre `switchMap`, `mergeMap`, `concatMap` et `exhaustMap` dépend d'une seule question : que doit-il arriver à l'appel précédent quand un nouveau survient (annuler, paralléliser, mettre en file, ignorer) ?
