---
id: reactor-bases
chapitre: reactif
ordre: 1
titre: "Programmation réactive : Mono et Flux"
termes:
  - terme: Reactive Streams
    definition: "Spécification standard de la JVM (interfaces `Publisher`, `Subscriber`, `Subscription`, `Processor`) pour le traitement asynchrone de flux de données avec **backpressure** — le consommateur contrôle le débit auquel le producteur lui envoie des éléments. Project Reactor, RxJava et Akka Streams l'implémentent."
  - terme: Mono<T>
    definition: "Publisher réactif de **0 ou 1** élément (ou une erreur). Remplace typiquement un `Optional<T>` ou un simple retour de méthode dans une chaîne asynchrone."
  - terme: Flux<T>
    definition: "Publisher réactif de **0 à N** éléments, potentiellement infini. Remplace typiquement une `List<T>` ou un flux de données continu (événements, lignes d'un fichier)."
  - terme: Backpressure
    definition: "Mécanisme par lequel l'abonné (`Subscriber`) signale au producteur **combien** d'éléments il est prêt à recevoir (`Subscription.request(n)`), pour éviter d'être submergé par un producteur plus rapide que lui."
  - terme: "Évaluation paresseuse (lazy)"
    definition: "Un `Mono` ou un `Flux` ne déclenche **aucun traitement** tant que personne ne s'y abonne. Il décrit une séquence d'opérations, pas un calcul déjà lancé — à la différence d'un `CompletableFuture`, déjà en cours d'exécution dès sa création."
  - terme: Scheduler
    definition: "Abstraction Reactor qui définit **sur quel thread (ou pool de threads)** s'exécute une partie de la chaîne. `Schedulers.boundedElastic()` est réservé au code bloquant ; `Schedulers.parallel()` au calcul intensif en CPU."
  - terme: StepVerifier
    definition: "Utilitaire de `reactor-test` qui s'abonne à un `Mono`/`Flux` et vérifie, étape par étape, les éléments émis, les erreurs et la complétion — l'équivalent d'une assertion pour du code réactif."
quiz:
  - question: "Que se passe-t-il quand on exécute ce code ?"
    code: |
      Mono<String> mono = Mono.fromCallable(() -> {
          System.out.println("Appel du fournisseur");
          return "résultat";
      });
      System.out.println("Après la création du Mono");
    choix:
      - "« Appel du fournisseur » puis « Après la création du Mono » s'affichent"
      - "Seul « Après la création du Mono » s'affiche : le `Mono` n'est jamais exécuté sans abonnement"
      - "Une exception est levée car `mono` n'est jamais utilisé"
      - "« Appel du fournisseur » s'affiche en tâche de fond, sur un autre thread"
    reponse: 1
    explication: "Un `Mono`/`Flux` décrit une séquence d'opérations, il ne l'exécute pas. Sans `subscribe()` (implicite dans WebFlux, explicite en test), le `Callable` n'est jamais invoqué : seul « Après la création du Mono » s'affiche. C'est l'évaluation paresseuse, un des pièges les plus fréquents pour qui découvre Reactor."
  - question: "Pourquoi ce code pose-t-il problème dans un contrôleur WebFlux ?"
    code: |
      @GetMapping("/rapport")
      public Mono<Rapport> genererRapport() {
          Rapport rapport = genererRapportSynchrone(); // appel JDBC bloquant, 200 ms
          return Mono.just(rapport);
      }
    choix:
      - "Aucun problème : `Mono.just()` rend l'appel asynchrone"
      - "L'appel bloquant s'exécute sur le thread de l'event loop Netty, qui gère aussi d'autres requêtes : il bloque tout le monde pendant 200 ms"
      - "Le code ne compile pas : `Mono.just()` attend un `Callable`"
      - "`genererRapportSynchrone()` ne sera jamais appelée"
    reponse: 1
    explication: "`genererRapportSynchrone()` s'exécute **avant** la construction du `Mono`, donc directement sur le thread appelant — dans WebFlux, un des quelques threads de l'event loop Netty. Un appel bloquant à cet endroit bloque ce thread, et avec lui toutes les autres requêtes qu'il traite. Il faudrait l'encapsuler dans `Mono.fromCallable(...).subscribeOn(Schedulers.boundedElastic())`, ou mieux, utiliser un client réactif."
  - question: "Quel opérateur choisir pour transformer un `Mono<Long>` (un identifiant de client) en `Mono<Client>` en appelant un repository réactif `Mono<Client> findById(Long id)` ?"
    choix:
      - "`map`, car il transforme un élément en un autre"
      - "`flatMap`, car la fonction de transformation renvoie elle-même un `Mono`"
      - "`zip`, car on combine deux flux"
      - "`then`, car on enchaîne deux étapes"
    reponse: 1
    explication: "`map(Function<T, R>)` transforme une valeur **synchrone** (`Long` → `Client`, par exemple). Ici la fonction renvoie un `Mono<Client>` : utiliser `map` produirait un `Mono<Mono<Client>>`. `flatMap(Function<T, Mono<R>>)` « aplatit » ce résultat en `Mono<Client>`. C'est l'erreur la plus fréquente en début d'apprentissage de Reactor."
---

## Essentiel

La programmation réactive gère des flux de données **asynchrones et non bloquants** : au lieu qu'un thread attende un résultat (I/O réseau, base de données), il se rend disponible pour autre chose et est notifié quand le résultat arrive. Objectif : servir beaucoup de requêtes concurrentes avec **peu de threads**, utile quand l'application passe le plus clair de son temps à attendre du réseau plutôt qu'à calculer.

Project Reactor (utilisé par Spring) propose deux types, tous deux implémentant l'interface standard `Publisher` de **Reactive Streams** :

```java
Mono<Client> client = clientRepository.findById(id);        // 0 ou 1 élément
Flux<Commande> commandes = commandeRepository.findAll();    // 0 à N éléments
```

On les manipule avec des opérateurs qui construisent un pipeline, sans jamais rien exécuter tant que personne ne s'abonne (`subscribe()`) :

```java
Mono<CommandeDto> resultat = commandeRepository.findById(id)
        .flatMap(commande -> clientRepository.findById(commande.getClientId())
                .map(client -> new CommandeDto(commande, client)))
        .switchIfEmpty(Mono.error(new CommandeIntrouvableException(id)))
        .onErrorResume(TimeoutException.class, e -> Mono.just(CommandeDto.parDefaut()));
```

Dans Spring WebFlux, le framework s'abonne lui-même à ce qu'un contrôleur renvoie. **Ne jamais appeler `block()`** dans ce contexte : ça reviendrait à attendre de façon bloquante sur un thread prévu pour ne jamais bloquer.

## Détail

### Pourquoi la programmation réactive

Un serveur Spring MVC classique alloue **un thread par requête**, bloqué pendant tout appel réseau (base de données, API externe). Avec un pool de 200 threads, 200 requêtes lentes suffisent à saturer le serveur, même si le CPU est presque inactif. Un modèle réactif utilise un petit nombre de threads (l'**event loop**) qui ne bloquent jamais : pendant qu'un appel réseau est en cours, ce thread traite d'autres requêtes. Le gain n'apparaît que sous **forte concurrence I/O** — un cas isolé, peu concurrent, n'en profite pas et gagne surtout en complexité.

### Exemple 1 — Créer et combiner des Mono/Flux

```java
Mono<String> vide = Mono.empty();
Mono<String> valeur = Mono.just("Paris");
Mono<String> paresseux = Mono.fromSupplier(() -> calculLent());
Flux<Integer> flux = Flux.just(1, 2, 3);
Flux<Integer> depuisListe = Flux.fromIterable(liste);

Mono<Client> client = clientRepository.findById(1L);
Mono<Adresse> adresse = adresseRepository.findByClientId(1L);

// Combiner deux Mono indépendants, exécutés en parallèle
Mono<FicheClient> fiche = Mono.zip(client, adresse)
        .map(tuple -> new FicheClient(tuple.getT1(), tuple.getT2()));
```

`Mono.zip` attend que **les deux** publishers émettent avant de continuer ; si l'un d'eux est vide, le résultat est vide (pas d'erreur).

### Exemple 2 — Les opérateurs les plus courants

```java
Flux<CommandeDto> commandesActives = commandeRepository.findAll()
        .filter(c -> c.getStatut() == Statut.ACTIVE)              // ne garde que certains éléments
        .map(CommandeDto::from)                                    // transformation synchrone 1:1
        .flatMap(dto -> enrichirAvecClient(dto))                   // transformation qui renvoie un Mono
        .doOnNext(dto -> log.debug("Commande enrichie : {}", dto)) // effet de bord, sans modifier le flux
        .onErrorResume(e -> {
            log.warn("Erreur d'enrichissement, valeur par défaut", e);
            return Mono.just(CommandeDto.parDefaut());
        });
```

`doOnNext`, `doOnError`, `doOnComplete`… ne changent jamais les données : ils servent uniquement à observer le flux (logs, métriques).

### Exemple 3 — Gérer l'absence de valeur et les erreurs

```java
public Mono<Client> trouverOuCreerInvite(Long id) {
    return clientRepository.findById(id)
            .switchIfEmpty(Mono.defer(() -> clientRepository.save(Client.invite())))
            .onErrorMap(DataAccessException.class, e -> new ServiceIndisponibleException(e))
            .timeout(Duration.ofSeconds(2));
}
```

`Mono.defer(...)` retarde la création du `Mono` de remplacement jusqu'au moment où il est réellement nécessaire — utile ici pour n'appeler `save()` que si `findById` est vraiment vide. `switchIfEmpty(Mono.just(...))` sans `defer` créerait l'objet de remplacement à chaque appel, même quand il n'est pas utilisé.

### Exemple 4 — Isoler le bloquant, puis tester avec StepVerifier

```java
public Mono<byte[]> genererPdf(Rapport rapport) {
    return Mono.fromCallable(() -> bibliothequeGenerationPdfBloquante(rapport))
            .subscribeOn(Schedulers.boundedElastic());
}

@Test
void doitPropagerUneErreurSiIntrouvable() {
    StepVerifier.create(clientService.trouver(999L))
            .expectError(ClientIntrouvableException.class)
            .verify();
}
```

`Schedulers.boundedElastic()` fournit un pool de threads dimensionné pour du **code bloquant hérité** (une librairie PDF, un driver JDBC classique) qu'on ne peut pas éviter. `subscribeOn` déplace l'exécution de toute la chaîne amont sur ce pool ; ce n'est qu'un contournement, le vrai objectif réactif restant de n'avoir **aucun** appel bloquant sur le chemin. `StepVerifier` (module `reactor-test`) s'abonne réellement au `Mono`/`Flux` testé : c'est le seul endroit légitime où l'exécution est déclenchée « à la main ».

### Mono vs Flux, en bref

| | `Mono<T>` | `Flux<T>` |
|---|---|---|
| Cardinalité | 0 ou 1 élément | 0 à N éléments (borné ou infini) |
| Équivalent impératif | `Optional<T>` / une valeur | `List<T>` / un flux d'événements |
| Cas typique | `findById`, un appel HTTP unique | `findAll`, un flux de messages, du streaming SSE |

### Pièges courants

> **Appeler `block()` dans un contexte réactif.** Ça fonctionne dans un `main()` ou un test isolé, mais dans un contrôleur WebFlux ou un `WebClient` chaîné, ça bloque un des rares threads de l'event loop — annulant tout l'intérêt du modèle, et pouvant mener à un blocage général sous charge. Reactor détecte certains cas et lève une `IllegalStateException` (*« block()/blockFirst()/blockLast() are blocking, which is not supported in thread… »*).

> **Confondre `map` et `flatMap`.** `map` transforme une valeur en une autre valeur. `flatMap` transforme une valeur en un **nouveau Publisher**, que Reactor s'abonne et « aplatit » pour vous. Utiliser `map` avec une fonction qui renvoie un `Mono` produit un `Mono<Mono<T>>`, généralement une erreur de compilation qui alerte immédiatement — mais l'inverse (utiliser `flatMap` là où `map` suffit) compile et fonctionne, juste avec une indirection inutile.

> **Écrire une chaîne d'opérateurs sans jamais s'y abonner.** En dehors de Spring WebFlux (qui s'abonne pour vous à ce que le contrôleur renvoie) ou d'un `StepVerifier`, un `Mono`/`Flux` construit et jamais utilisé (ni retourné, ni passé à `subscribe()`) ne produit strictement aucun effet — pas d'exception, juste rien ne se passe. Un `Mono` créé puis ignoré dans une méthode `void` est un bug silencieux classique.

### À retenir

- `Mono` (0 ou 1) et `Flux` (0 à N) sont des `Publisher` Reactive Streams : ils décrivent un traitement, ne l'exécutent qu'à l'abonnement.
- `map` pour une transformation synchrone, `flatMap` quand la fonction renvoie elle-même un `Mono`/`Flux`.
- `switchIfEmpty`, `onErrorResume`, `onErrorMap`, `timeout` gèrent l'absence de valeur et les erreurs sans `try/catch`.
- Ne jamais bloquer sur le chemin réactif ; isoler le code bloquant hérité avec `subscribeOn(Schedulers.boundedElastic())`.
- `StepVerifier` (module `reactor-test`) est l'outil standard pour tester un `Mono`/`Flux`.
