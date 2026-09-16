---
id: executors-futures
chapitre: concurrence
ordre: 3
titre: "Exécuteurs et résultats asynchrones"
termes:
  - terme: ExecutorService
    definition: "Abstraction de haut niveau pour exécuter des tâches (`Runnable`, `Callable<T>`) sur un pool de threads géré, sans créer les threads soi-même. Fournit `submit` (renvoie un `Future`), `invokeAll`, et un arrêt contrôlé (`shutdown`, `shutdownNow`)."
  - terme: "Future<T>"
    definition: "Représente le résultat futur d'une tâche soumise. `get()` **bloque** jusqu'à disponibilité du résultat (ou lève l'exception survenue dans la tâche, enveloppée dans `ExecutionException`) ; `get(delai, unite)` évite un blocage indéfini ; `cancel(boolean)` tente d'annuler la tâche."
  - terme: "submit vs execute"
    definition: "`execute(Runnable)` (interface `Executor`) lance une tâche sans rien renvoyer : une exception non capturée y est perdue dans le gestionnaire d'exceptions par défaut du thread. `submit(...)` (interface `ExecutorService`) renvoie toujours un `Future`, qui capture le résultat **ou** l'exception — récupérable seulement en appelant `get()`."
  - terme: "shutdown / shutdownNow / awaitTermination"
    definition: "`shutdown()` refuse les nouvelles tâches mais laisse terminer celles en cours et en attente. `shutdownNow()` tente d'interrompre les tâches en cours et renvoie celles qui n'ont pas démarré. `awaitTermination(delai, unite)` bloque jusqu'à l'arrêt effectif ou l'expiration du délai — l'arrêt propre standard enchaîne `shutdown()` puis `awaitTermination()`, avec `shutdownNow()` en repli."
  - terme: ScheduledExecutorService
    definition: "Variante d'`ExecutorService` qui planifie l'exécution différée ou périodique de tâches : `schedule` (une fois, après un délai), `scheduleAtFixedRate` (période fixe entre débuts), `scheduleWithFixedDelay` (délai fixe entre la fin d'une exécution et le début de la suivante)."
  - terme: CompletableFuture
    definition: "`Future` enrichi qui se compose sans bloquer : `thenApply` transforme le résultat, `thenCompose` l'enchaîne avec un autre `CompletableFuture` (évite l'imbrication), `thenCombine` combine deux résultats indépendants, `allOf`/`anyOf` attendent plusieurs futures, `exceptionally`/`handle` traitent les erreurs sans bloquer sur `get()`."
  - terme: Dimensionnement d'un pool
    definition: "Pour des tâches **limitées par le processeur** (calcul), une taille proche du nombre de cœurs disponibles (`Runtime.getRuntime().availableProcessors()`) maximise le débit sans sur-solliciter le CPU. Pour des tâches **limitées par les entrées/sorties** (attente réseau, disque), un pool bien plus grand que le nombre de cœurs reste utile, car les threads passent le plus clair de leur temps bloqués, pas à calculer."
quiz:
  - question: "Que se passe-t-il si la tâche soumise ici lève une exception et que le Future renvoyé n'est jamais interrogé ?"
    code: |
      ExecutorService executeur = Executors.newFixedThreadPool(4);
      executeur.submit(() -> {
          throw new IllegalStateException("stock introuvable");
      });
      // ... le programme continue sans jamais appeler get() sur le Future renvoyé
    choix:
      - "L'exception remonte automatiquement et fait planter le programme principal"
      - "L'exception est silencieusement capturée dans le Future et n'apparaît jamais nulle part : il faut appeler get() (ou handle/exceptionally avec CompletableFuture) pour la découvrir"
      - "Le pool de threads s'arrête immédiatement dès qu'une tâche lève une exception"
      - "Une seconde tentative automatique est faite par l'ExecutorService"
    reponse: 1
    explication: "submit() capture toute exception de la tâche dans le Future plutôt que de la laisser remonter. Si personne n'appelle get() (qui la relancerait enveloppée dans une ExecutionException), l'erreur est perdue en silence — un piège classique, contrairement à execute() où l'exception atteint au moins le gestionnaire d'exceptions non capturées du thread."
  - question: "Quelle est la différence entre shutdown() et shutdownNow() sur un ExecutorService ?"
    choix:
      - "shutdown() attend la fin des tâches en cours et en file d'attente avant de refuser toute nouvelle tâche ; shutdownNow() tente d'interrompre les tâches en cours et renvoie celles qui n'ont pas démarré, sans garantie qu'elles s'arrêtent effectivement"
      - "Les deux méthodes sont strictement équivalentes, shutdownNow() est simplement l'ancien nom"
      - "shutdown() arrête tout instantanément, shutdownNow() attend la fin de toutes les tâches"
      - "shutdownNow() supprime le pool de threads de la mémoire immédiatement, shutdown() attend le ramasse-miettes"
    reponse: 0
    explication: "shutdown() est l'arrêt propre : les tâches déjà en file terminent normalement, seules les nouvelles soumissions sont refusées. shutdownNow() tente d'interrompre les threads en cours d'exécution (via Thread.interrupt(), donc sans garantie si la tâche n'y réagit pas) et renvoie la liste des tâches encore en attente n'ayant jamais démarré."
  - question: "Pourquoi thenCompose est-il préférable à thenApply quand la fonction appelée renvoie elle-même un CompletableFuture ?"
    code: |
      CompletableFuture<Stock> f = CompletableFuture
          .supplyAsync(() -> chargerCommande(id))
          .thenApply(commande -> chargerStockAsync(commande)); // chargerStockAsync renvoie CompletableFuture<Stock>
      // f est en réalité de type CompletableFuture<CompletableFuture<Stock>>
    choix:
      - "thenApply et thenCompose sont interchangeables dans tous les cas, sans aucune différence"
      - "thenApply(f) attend le résultat de f de façon bloquante, thenCompose(f) ne bloque jamais"
      - "thenApply enveloppe le résultat dans un CompletableFuture imbriqué (CompletableFuture<CompletableFuture<Stock>>) quand la fonction renvoie déjà un CompletableFuture ; thenCompose aplatit ce résultat en un seul niveau (CompletableFuture<Stock>)"
      - "thenCompose ne peut être utilisé qu'avec des Callable, jamais avec des Supplier"
    reponse: 2
    explication: "thenApply applique une fonction T -> U ; si U est lui-même un CompletableFuture<Stock>, le résultat final est imbriqué (CompletableFuture<CompletableFuture<Stock>>), rarement ce qu'on veut. thenCompose attend une fonction T -> CompletableFuture<U> et aplatit le résultat en CompletableFuture<U> — c'est l'équivalent de flatMap pour les CompletableFuture, à utiliser dès qu'on enchaîne un appel qui est lui-même asynchrone."
---

## Essentiel

Créer un `Thread` à la main pour chaque tâche est coûteux (création, mémoire) et ne dimensionne pas le nombre de threads simultanés : sous forte charge, rien n'empêche d'en créer des milliers. Un `ExecutorService` gère un **pool** de threads réutilisés et une **file d'attente** de tâches.

```java
ExecutorService executeur = Executors.newFixedThreadPool(4);
Future<Integer> resultat = executeur.submit(() -> calculerTotalCommande(id)); // Callable<Integer>
int total = resultat.get(5, TimeUnit.SECONDS); // bloque, avec un délai maximal
executeur.shutdown();
```

`submit()` renvoie toujours un `Future` (contrairement à `execute()`, qui ne renvoie rien) : une exception dans la tâche y est **capturée**, invisible tant que personne n'appelle `get()`. Dimensionner un pool dépend du type de tâche : proche du nombre de cœurs pour du calcul, bien plus large pour des tâches qui attendent (réseau, disque).

`CompletableFuture` permet de composer des traitements asynchrones sans bloquer sur `get()` à chaque étape :

```java
CompletableFuture
    .supplyAsync(() -> chargerCommande(id))
    .thenApply(Commande::total)
    .exceptionally(ex -> 0)
    .thenAccept(total -> System.out.println("Total : " + total));
```

Arrêter un `ExecutorService` proprement demande un enchaînement explicite : `shutdown()`, puis `awaitTermination()`, avec `shutdownNow()` en dernier recours.

## Détail

### Dimensionner un pool

- **Tâches limitées par le processeur** (calcul pur, transformation en mémoire) : une taille proche de `Runtime.getRuntime().availableProcessors()` (parfois +1) maximise le débit ; plus de threads que de cœurs n'accélère rien et ajoute du changement de contexte.
- **Tâches limitées par les entrées/sorties** (appel réseau, lecture disque, requête base de données) : les threads passent le plus clair de leur temps bloqués, pas à calculer — un pool nettement plus grand que le nombre de cœurs reste utile, car le CPU serait sinon sous-utilisé pendant les attentes. (Les threads virtuels, voir la dernière leçon de ce chapitre, changent radicalement la donne pour ce second cas.)

### Exemple 1 — Les fabriques d'Executors

```java
ExecutorService fixe = Executors.newFixedThreadPool(8);        // taille bornée, fixe
ExecutorService unique = Executors.newSingleThreadExecutor();   // une tâche à la fois, en ordre
ExecutorService cache = Executors.newCachedThreadPool();        // crée des threads à la demande, les réutilise
```

`newCachedThreadPool()` n'a **pas de limite de taille** : sous une charge en rafale, il peut créer un thread par tâche soumise, jusqu'à épuiser la mémoire. À réserver à des tâches courtes et peu nombreuses, ou remplacer par un pool borné explicite (`new ThreadPoolExecutor(...)`) en production.

### Exemple 2 — submit, Future et invokeAll

```java
List<Callable<Produit>> taches = idsProduits.stream()
    .map(id -> (Callable<Produit>) () -> chargerProduit(id))
    .toList();

List<Future<Produit>> futures = executeur.invokeAll(taches); // bloque jusqu'à ce que TOUTES terminent
for (Future<Produit> f : futures) {
    Produit p = f.get(); // ne bloque plus ici : invokeAll a déjà attendu
}
```

`invokeAll` attend la fin de toutes les tâches avant de renvoyer la liste des `Future` (déjà tous terminés). `Future.cancel(true)` tente d'interrompre une tâche en cours ; `cancel(false)` ne l'annule que si elle n'a pas encore démarré.

### Exemple 3 — Arrêt propre d'un ExecutorService

```java
executeur.shutdown(); // refuse les nouvelles tâches, laisse finir les en-cours
try {
    if (!executeur.awaitTermination(30, TimeUnit.SECONDS)) {
        executeur.shutdownNow(); // force l'interruption si ça traîne trop
    }
} catch (InterruptedException e) {
    executeur.shutdownNow();
    Thread.currentThread().interrupt();
}
```

Ce triptyque (`shutdown` → `awaitTermination` → `shutdownNow` en repli) est le schéma standard : il laisse une chance aux tâches en cours de se terminer proprement, sans risquer un arrêt qui ne se termine jamais si une tâche est bloquée indéfiniment.

### Exemple 4 — CompletableFuture : enchaîner sans bloquer

```java
CompletableFuture<Void> pipeline = CompletableFuture
    .supplyAsync(() -> chargerCommande(id), executeur)      // exécuteur explicite : ne pas monopoliser le pool commun
    .thenCompose(commande -> verifierStockAsync(commande))   // enchaîne un autre CompletableFuture, sans imbrication
    .thenCombine(chargerRemiseAsync(id), (commande, remise) -> appliquerRemise(commande, remise))
    .exceptionally(ex -> { journaliserErreur(ex); return null; })
    .thenAccept(commande -> notifierClient(commande));

CompletableFuture<Void> global = CompletableFuture.allOf(pipeline, autrePipeline);
global.join(); // équivalent bloquant de get(), sans exception vérifiée
```

`handle((resultat, exception) -> ...)` reçoit toujours les deux (l'un des deux étant `null`), utile pour un traitement uniforme succès/échec. Sans exécuteur précisé, `supplyAsync`/`thenApply`/... s'exécutent sur le pool commun `ForkJoinPool.commonPool()`, **partagé par toute la JVM** (y compris les streams parallèles) : y placer une tâche bloquante (appel réseau lent) peut affamer d'autres traitements qui en dépendent ailleurs dans l'application — préférer un exécuteur dédié pour ce type de tâche.

### ScheduledExecutorService

```java
ScheduledExecutorService planificateur = Executors.newScheduledThreadPool(2);
planificateur.scheduleAtFixedRate(this::verifierStockBas, 0, 15, TimeUnit.MINUTES);
```

`scheduleAtFixedRate` déclenche une nouvelle exécution toutes les 15 minutes **à partir du début** de la précédente (rattrapage si une exécution dépasse) ; `scheduleWithFixedDelay` attend 15 minutes **après la fin** de la précédente avant de relancer — plus sûr si la durée d'exécution est variable.

### Pièges courants

> **Exception avalée dans un `Future` jamais consulté.** `submit()` capture toute exception dans le `Future` ; sans `get()` (ou `exceptionally`/`handle` pour un `CompletableFuture`), elle disparaît silencieusement. Toujours consulter le résultat, même juste pour vérifier l'absence d'erreur.

> **Appeler `get()` sans délai.** `future.get()` bloque **indéfiniment** si la tâche ne se termine jamais. Préférer `get(delai, unite)` dans du code qui doit rester réactif.

> **Oublier `shutdown()`.** Un `ExecutorService` dont les threads ne sont pas démons empêche la JVM de s'arrêter tant qu'il n'a pas été explicitement fermé.

### À retenir

- Un `ExecutorService` gère la création et la réutilisation des threads : on ne crée plus de `Thread` à la main pour chaque tâche.
- `submit()` renvoie un `Future` qui capture résultat et exception ; `execute()` ne renvoie rien.
- Dimensionner un pool selon le type de tâche : proche du nombre de cœurs pour du calcul, plus large pour de l'attente d'entrées/sorties.
- `CompletableFuture` compose des traitements asynchrones sans bloquer : `thenApply` transforme, `thenCompose` enchaîne un autre futur (aplati), `thenCombine` combine deux résultats indépendants, `exceptionally`/`handle` gèrent les erreurs.
- Arrêt propre : `shutdown()` puis `awaitTermination()`, avec `shutdownNow()` en dernier recours.
