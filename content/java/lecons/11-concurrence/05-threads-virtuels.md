---
id: threads-virtuels
chapitre: concurrence
ordre: 5
titre: "Les threads virtuels"
termes:
  - terme: Thread de plateforme
    definition: "Thread « classique » (`new Thread(...)` avant Java 21, ou explicitement `Thread.ofPlatform()`), directement adossé à un thread du système d'exploitation. Sa pile réserve une mémoire significative dès sa création, et sa création comme son changement de contexte sont gérés par l'OS — coûteux, ce qui limite en pratique leur nombre à quelques milliers par JVM."
  - terme: Thread virtuel (virtual thread)
    definition: "Thread géré par la JVM elle-même, pas directement par l'OS : sa pile est stockée dans le tas et redimensionnée à la demande, et il ne consomme un thread OS (son **porteur**, carrier) que pendant qu'il exécute réellement du code. Finalisé par le **JEP 444**, en **Java 21**. Permet des millions de threads virtuels actifs simultanément dans une même JVM."
  - terme: Carrier (thread porteur)
    definition: "Thread de plateforme sur lequel un thread virtuel s'exécute momentanément. Quand un thread virtuel **bloque** sur une opération d'E/S standard (lecture réseau, fichier), la JVM le démonte de son carrier, qui devient libre d'exécuter un autre thread virtuel ; le thread virtuel **remonte** sur un carrier (pas forcément le même) une fois débloqué."
  - terme: Épinglage (pinning)
    definition: "Situation où un thread virtuel bloqué reste **attaché** à son carrier au lieu de le libérer, immobilisant ce thread OS. Historiquement provoqué par un blocage à l'intérieur d'un bloc ou d'une méthode `synchronized` ; ce cas précis a été éliminé par le **JEP 491** (« Synchronize Virtual Threads without Pinning »), livré en **Java 24** — un blocage à l'intérieur de code natif (JNI) continue en revanche d'épingler le thread virtuel."
  - terme: Valeurs de portée (scoped values)
    definition: "Alternative à `ThreadLocal` : une valeur immuable, liée le temps d'une portée d'exécution (`ScopedValue.where(...).run(...)`) et automatiquement propagée aux threads virtuels créés dans cette portée — sans le coût mémoire d'une copie par thread. Finalisées par le **JEP 506**, en **Java 25**."
  - terme: Concurrence structurée
    definition: "Modèle qui traite un groupe de sous-tâches lancées en parallèle comme **une seule unité de travail** : erreur ou annulation dans une sous-tâche se propage automatiquement aux autres, sans thread orphelin oublié. **Toujours en aperçu (preview) au 16/09/2026** — JEP 533, 7ᵉ aperçu livré en Java 27, nécessite `--enable-preview`. Une finalisation « sans changement » est proposée par le JEP 543, candidat pour Java 28, **pas encore livrée** : ne pas la présenter comme acquise."
quiz:
  - question: "Dans quelle version de Java les threads virtuels ont-ils été finalisés (sortis de l'aperçu, disponibles sans --enable-preview) ?"
    choix:
      - "Java 19, où ils sont apparus en aperçu pour la première fois"
      - "Java 21, via le JEP 444"
      - "Java 25, en même temps que les valeurs de portée"
      - "Ils sont encore en aperçu aujourd'hui, comme la concurrence structurée"
    reponse: 1
    explication: "Les threads virtuels sont apparus en aperçu dans les JEP 425 (Java 19) et 436 (Java 20), puis ont été finalisés par le JEP 444 en Java 21 : ils s'utilisent depuis sans --enable-preview. C'est un point à bien distinguer de la concurrence structurée, un autre apport du même projet (Loom), qui reste elle en aperçu."
  - question: "Pourquoi créer un pool borné de threads virtuels (newFixedThreadPool avec une factory de threads virtuels) est-il généralement une mauvaise idée ?"
    code: |
      ExecutorService mauvaisChoix = Executors.newFixedThreadPool(
          200, Thread.ofVirtual().factory()
      );
    choix:
      - "Ce code ne compile pas : ofVirtual().factory() ne peut pas être passé à newFixedThreadPool"
      - "Les threads virtuels ne peuvent pas être utilisés avec des ExecutorService"
      - "Le principe des threads virtuels est un thread par tâche, sans limite de pool à dimensionner : leur borner à 200 réintroduit artificiellement la contrainte de rareté (coût mémoire, changement de contexte OS) que les threads virtuels visent justement à supprimer"
      - "200 est toujours trop petit : il faut au minimum 10000 threads virtuels dans un pool pour un gain de performance"
    reponse: 2
    explication: "Les threads virtuels sont bon marché : l'idée est d'en créer un par tâche, via Executors.newVirtualThreadPerTaskExecutor() ou Thread.ofVirtual().start(...), sans les faire attendre dans une file derrière un nombre fixe de threads. Les borner artificiellement annule une grande partie de leur intérêt pour des tâches bloquantes sur des entrées/sorties."
  - question: "Quel est le statut exact de la concurrence structurée (structured concurrency) au 16 septembre 2026 ?"
    choix:
      - "Finalisée en Java 21, en même temps que les threads virtuels"
      - "Finalisée en Java 25, en même temps que les valeurs de portée"
      - "Toujours en aperçu (JEP 533, 7e aperçu livré en Java 27, nécessite --enable-preview) ; une finalisation est seulement proposée, sans être encore livrée, par le JEP 543 candidat pour Java 28"
      - "Retirée définitivement du JDK, comme les modèles de chaînes (string templates)"
    reponse: 2
    explication: "Contrairement aux threads virtuels (finalisés en Java 21) et aux valeurs de portée (finalisées en Java 25), la concurrence structurée reste en aperçu : JEP 533, 7e aperçu en Java 27, toujours soumis à --enable-preview. Le JEP 543, qui propose sa finalisation « sans changement » pour Java 28, n'a que le statut de candidat — rien n'est encore livré. Beaucoup de ressources en ligne datées d'avant 2026 mélangent à tort son statut avec celui des threads virtuels."
---

## Essentiel

Un thread de plateforme (« classique ») est directement adossé à un thread du système d'exploitation : sa pile réserve de la mémoire dès sa création, et l'OS gère son changement de contexte — coûteux, ce qui limite leur nombre à quelques milliers par JVM. Sous forte charge d'entrées/sorties (beaucoup d'appels réseau, par exemple), c'est souvent le nombre de threads disponibles, pas le CPU, qui devient le goulot d'étranglement.

Un **thread virtuel** est géré par la JVM : sa pile vit dans le tas, redimensionnée à la demande, et il n'occupe un thread OS (son **porteur**, ou carrier) que pendant qu'il exécute réellement du code. Dès qu'il bloque sur une opération d'E/S standard, il se démonte de son carrier, qui devient libre pour un autre thread virtuel. Résultat : des millions de threads virtuels actifs simultanément, chacun dédié à une seule tâche.

```java
Thread.ofVirtual().start(() -> traiterCommande(id));                 // un thread virtuel, directement

try (ExecutorService executeur = Executors.newVirtualThreadPerTaskExecutor()) {
    executeur.submit(() -> traiterCommande(id));                     // un thread virtuel par tâche soumise
}
```

Les threads virtuels ont été **finalisés en Java 21** (JEP 444). Ils ne changent rien aux règles de correction : une condition de concurrence sur un état partagé reste tout aussi réelle — ils résolvent un problème de **scalabilité** (combien de tâches bloquantes on peut traiter à la fois), pas de sûreté. La **concurrence structurée**, elle, est **encore en aperçu** en Java 27 (JEP 533) : ne jamais la présenter comme finalisée.

## Détail

### Le problème des threads de plateforme

Créer un thread de plateforme réserve une pile dont la taille par défaut se compte en centaines de kilo-octets, et sa création comme son changement de contexte passent par l'OS — coûteux à grande échelle. Pour une application qui traite énormément de requêtes bloquantes (attente réseau, base de données), le classique « pool de threads borné » devient vite le facteur limitant : au-delà d'un certain nombre de threads simultanés, on épuise la mémoire ou on sature le système bien avant de saturer le CPU, alors que ces threads passent le plus clair de leur temps à ne rien faire d'utile, juste à attendre.

### Créer un thread virtuel

```java
Thread t = Thread.ofVirtual().name("worker-", 0).start(() -> traiter());

Thread t2 = Thread.startVirtualThread(() -> traiter()); // raccourci équivalent

try (ExecutorService executeur = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Produit>> resultats = idsProduits.stream()
        .map(id -> executeur.submit(() -> chargerProduit(id)))
        .toList();
}
```

`newVirtualThreadPerTaskExecutor()` crée un **nouveau** thread virtuel pour chaque tâche soumise, sans file d'attente derrière un nombre fixe de threads : c'est le changement d'état d'esprit central. Là où un `ExecutorService` classique devait être dimensionné avec soin, ici le dimensionnement disparaît pour des tâches bloquantes — chaque tâche a son propre thread, bon marché.

### Ce qui change dans la façon d'écrire du code

Avec des threads de plateforme, une tâche bloquante (appel réseau) « gaspillait » un thread OS coûteux pendant toute l'attente, ce qui poussait à des architectures asynchrones complexes (callbacks, `CompletableFuture` en cascade) pour éviter d'en immobiliser trop. Avec des threads virtuels, du code **bloquant et séquentiel**, simple à lire, redevient un choix raisonnable même à grande échelle : le thread virtuel bloqué libère son carrier pendant l'attente, sans qu'aucune ligne de code n'ait besoin de le gérer explicitement.

### Épinglage (pinning) et son évolution récente

Un thread virtuel qui bloque **à l'intérieur d'un bloc `synchronized`** restait historiquement épinglé à son carrier : impossible de le démonter, car la JVM associait le moniteur au thread porteur plutôt qu'au thread virtuel lui-même. Un carrier bloqué de cette façon devenait indisponible pour tout autre thread virtuel — annulant une bonne partie du bénéfice pour du code qui utilise `synchronized`.

Le **JEP 491** (« Synchronize Virtual Threads without Pinning »), livré en **Java 24**, a supprimé ce cas : un thread virtuel qui bloque dans une section `synchronized` peut désormais se démonter de son carrier normalement, exactement comme avec un `ReentrantLock`. Il reste un cas d'épinglage non couvert : un blocage à l'intérieur de code natif (appel JNI) continue d'immobiliser le carrier, car la JVM ne peut pas démonter un thread virtuel au milieu d'une pile native.

### Ce qui ne change pas

Les threads virtuels résolvent un problème de **scalabilité**, pas de **correction**. Un compteur partagé sans synchronisation reste tout aussi faux avec des threads virtuels qu'avec des threads de plateforme ; `synchronized`, les classes atomiques et `ReentrantLock` (voir la leçon sur la synchronisation) restent nécessaires exactement de la même façon pour protéger un état mutable partagé.

### ThreadLocal et valeurs de portée

`ThreadLocal` pose un problème d'échelle avec des millions de threads virtuels : chaque thread (y compris chaque thread virtuel) porte sa propre copie, ce qui peut représenter une mémoire non négligeable si le `ThreadLocal` est utilisé massivement, et une `ThreadLocal` **héritable** copiée à chaque tâche ajoute encore ce coût.

Les **valeurs de portée** (`ScopedValue`), finalisées par le **JEP 506 en Java 25**, offrent une alternative pour le cas très courant d'une donnée censée rester **constante** le temps d'un traitement (identifiant de requête, contexte de sécurité) :

```java
static final ScopedValue<String> ID_REQUETE = ScopedValue.newInstance();

void traiterRequete(String id) {
    ScopedValue.where(ID_REQUETE, id).run(() -> traiterCommande());
}

void traiterCommande() {
    journaliser("Traitement pour la requête " + ID_REQUETE.get()); // lue, jamais modifiée
}
```

Une valeur de portée est **immuable** une fois liée, automatiquement propagée aux threads virtuels démarrés à l'intérieur du `run(...)`, et libérée dès la sortie de la portée — sans la copie par thread que `ThreadLocal` impose.

### Concurrence structurée : statut exact

La **concurrence structurée** vise à traiter un groupe de sous-tâches lancées en parallèle comme **une seule unité de travail** : si une sous-tâche échoue, les autres sont automatiquement annulées ; le code appelant attend explicitement la fin du groupe avant de continuer, avec une pile d'appels qui reste lisible (contrairement à des threads lancés indépendamment, où une erreur dans l'un peut être perdue sans jamais affecter les autres).

Au 16 septembre 2026, elle est **toujours en aperçu** : JEP 533, 7ᵉ aperçu, livré en Java 27, encore soumis à `--enable-preview`. Le JEP 543, qui propose sa finalisation « sans changement » pour Java 28, n'a que le statut de candidat — **rien n'est encore livré**. Elle ne doit donc jamais être présentée comme finalisée ou stable en production, à la différence des threads virtuels (Java 21) et des valeurs de portée (Java 25), les deux autres apports finalisés du même projet Loom.

### Quand les threads virtuels n'apportent rien

Pour du code **limité par le processeur** (calcul intensif, transformation en mémoire, sans attente d'E/S), les threads virtuels n'apportent aucun gain : il n'y a pas de blocage à masquer, et le nombre de cœurs disponibles reste la limite réelle, identique à des threads de plateforme. En créer un grand nombre pour ce type de travail ajoute même une charge de planification inutile — un pool dimensionné sur le nombre de cœurs (voir la leçon sur les exécuteurs) reste le bon outil pour du calcul pur.

### Pièges courants

> **Créer un pool borné de threads virtuels.** L'idée est un thread par tâche ; le borner artificiellement (`newFixedThreadPool(200, Thread.ofVirtual().factory())`) réintroduit la rareté que les threads virtuels visent à supprimer.

> **Présenter la concurrence structurée comme déjà finalisée.** Elle reste en aperçu (JEP 533, Java 27) et nécessite `--enable-preview` — une erreur fréquente qui mélange son statut avec celui, différent, des threads virtuels (finalisés depuis Java 21).

> **Espérer un gain de performance sur du calcul intensif.** Sans blocage d'E/S à masquer, les threads virtuels n'apportent rien face à un pool classique dimensionné sur le nombre de cœurs — et peuvent même nuire en multipliant les threads sans utilité.

### À retenir

- Un thread virtuel consomme un thread OS (carrier) seulement pendant qu'il exécute réellement du code ; il s'en démonte automatiquement en cas de blocage sur une E/S standard. Finalisés en **Java 21** (JEP 444).
- Le principe d'usage : un thread virtuel par tâche, sans pool borné — `Executors.newVirtualThreadPerTaskExecutor()`.
- L'épinglage sur `synchronized` a été supprimé en **Java 24** (JEP 491) ; il subsiste seulement pour du code natif.
- Les threads virtuels ne changent rien aux conditions de concurrence : `synchronized`, les classes atomiques et `ReentrantLock` restent nécessaires pour protéger un état partagé.
- Les **valeurs de portée** remplacent avantageusement `ThreadLocal` pour une donnée immuable propagée à des threads virtuels (finalisées en **Java 25**, JEP 506) ; la **concurrence structurée** reste **en aperçu** (JEP 533, Java 27), à ne jamais présenter comme finalisée.
