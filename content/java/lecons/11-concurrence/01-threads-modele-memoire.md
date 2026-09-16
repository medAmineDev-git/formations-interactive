---
id: threads-modele-memoire
chapitre: concurrence
ordre: 1
titre: "Threads et modèle mémoire"
termes:
  - terme: Processus vs thread
    definition: "Un **processus** a son propre espace mémoire isolé (donné par l'OS). Un **thread** (fil d'exécution) vit à l'intérieur d'un processus : plusieurs threads d'un même processus partagent le tas et les variables statiques, mais chacun a sa **propre pile d'appels** et son propre compteur d'instruction."
  - terme: "Runnable"
    definition: "Interface fonctionnelle (`void run()`) qui décrit **ce qu'il faut exécuter**, indépendamment de **comment** ça s'exécute. Préférée à l'héritage de `Thread` : elle sépare la tâche du mécanisme d'exécution, et une classe qui implémente `Runnable` peut encore hériter d'autre chose."
  - terme: "join()"
    definition: "Méthode qui **bloque** le thread appelant jusqu'à ce que le thread cible se termine (ou jusqu'à l'expiration d'un délai optionnel). Sert à attendre le résultat d'un traitement lancé en parallèle avant de continuer."
  - terme: Thread démon (daemon)
    definition: "Thread marqué via `setDaemon(true)` **avant** son démarrage, qui ne bloque pas l'arrêt de la JVM : quand il ne reste plus que des threads démons vivants, la JVM se termine sans les attendre. Utilisé pour des tâches d'arrière-plan (nettoyage, supervision), jamais pour un traitement dont le résultat doit être garanti."
  - terme: Interruption
    definition: "Mécanisme **coopératif** de demande d'arrêt : `thread.interrupt()` positionne un indicateur et réveille le thread s'il est bloqué dans `sleep`, `wait` ou `join`, en levant `InterruptedException`. Rien n'oblige le thread ciblé à s'arrêter — il doit vérifier et réagir lui-même."
  - terme: Condition de concurrence (race condition)
    definition: "Situation où le résultat d'un programme dépend de l'**ordre d'entrelacement**, non déterministe, des instructions de plusieurs threads accédant à un état partagé. Le code peut sembler fonctionner en test et produire un résultat faux en production, de façon intermittente."
  - terme: Relation happens-before
    definition: "Garantie du modèle mémoire Java : si une action A « happens-before » une action B, alors les effets de A (écritures mémoire) sont **visibles** pour B. Sans une telle relation entre deux threads, rien ne garantit qu'un thread voie les écritures faites par un autre, ni dans quel ordre."
quiz:
  - question: "Que peut afficher ce programme à l'exécution (deux threads incrémentent 100 000 fois un compteur partagé non protégé) ?"
    code: |
      class Compteur { int valeur = 0; }
      Compteur c = new Compteur();
      Runnable incrementer = () -> {
          for (int i = 0; i < 100_000; i++) {
              c.valeur++;
          }
      };
      Thread t1 = new Thread(incrementer);
      Thread t2 = new Thread(incrementer);
      t1.start(); t2.start();
      t1.join(); t2.join();
      System.out.println(c.valeur);
    choix:
      - "Toujours exactement 200000"
      - "Une valeur inférieure ou égale à 200000, différente selon les exécutions, car valeur++ n'est pas une opération atomique"
      - "Une InterruptedException est levée car les deux threads accèdent au même champ"
      - "Une erreur de compilation, car valeur n'est pas final"
    reponse: 1
    explication: "valeur++ se décompose en trois étapes (lire, ajouter 1, écrire) : si les deux threads lisent la même valeur avant que l'un des deux n'écrive, une incrémentation est perdue. Le résultat est donc généralement inférieur à 200000, et varie d'une exécution à l'autre — c'est la signature d'une condition de concurrence, pas une erreur qui se voit à la compilation."
  - question: "Pourquoi préfère-t-on généralement implémenter Runnable plutôt qu'hériter de Thread pour définir une tâche ?"
    choix:
      - "Runnable s'exécute plus vite que Thread au moment du démarrage"
      - "Hériter de Thread empêche d'hériter d'une autre classe (pas d'héritage multiple) et mélange la tâche avec le mécanisme d'exécution, alors que Runnable sépare les deux et reste réutilisable avec un ExecutorService"
      - "Thread ne permet pas de lever d'exception vérifiée dans run()"
      - "Runnable est thread-safe par défaut, contrairement à Thread"
    reponse: 1
    explication: "Java n'autorisant pas l'héritage multiple, une classe qui hérite de Thread ne peut hériter de rien d'autre. Runnable décrit uniquement le travail à faire ; la même tâche peut ensuite être exécutée par un Thread, mais aussi soumise à un ExecutorService — ce qui devient la norme dès qu'on gère plusieurs tâches (voir la leçon sur les exécuteurs)."
  - question: "Quelle est la bonne façon de réagir à une InterruptedException capturée au milieu d'un traitement qu'on ne peut pas arrêter immédiatement ?"
    code: |
      void traiter() {
          try {
              etapeLongue();
          } catch (InterruptedException e) {
              // que faire ici ?
          }
      }
    choix:
      - "Ne rien faire dans le catch : l'exception a déjà été gérée en étant attrapée"
      - "Relancer une RuntimeException générique pour signaler le problème à l'appelant"
      - "Soit propager l'interruption (relancer, ou envelopper dans une exception non vérifiée), soit, si on ne peut pas propager immédiatement, restaurer le statut avec Thread.currentThread().interrupt() pour que le code appelant puisse encore le détecter"
      - "Appeler Thread.currentThread().stop() pour arrêter proprement le thread courant"
    reponse: 2
    explication: "Capturer InterruptedException efface le statut d'interruption du thread. Ignorer l'exception (catch vide) fait perdre l'information et empêche tout code appelant de savoir qu'une interruption a eu lieu. La bonne pratique est de propager l'interruption, ou à défaut de restaurer l'indicateur via Thread.currentThread().interrupt(). Thread.stop() est de toute façon totalement neutralisée depuis longtemps et ne doit plus être utilisée."
---

## Essentiel

Un **processus** a son propre espace mémoire ; les **threads** d'un même processus le partagent (tas, champs statiques), mais chacun a sa propre pile. Un thread permet d'exécuter du code **en parallèle** du reste du programme.

```java
Runnable tache = () -> System.out.println("Traitement en cours : " + Thread.currentThread().getName());
Thread t = new Thread(tache);
t.start(); // démarre un nouveau thread : appeler run() directement n'en crée aucun
t.join();  // attend la fin de t avant de continuer
```

On préfère implémenter **`Runnable`** plutôt qu'hériter de `Thread` : ça sépare la tâche du mécanisme d'exécution, ça n'empêche pas d'hériter d'autre chose, et le même `Runnable` peut plus tard être soumis à un `ExecutorService` sans rien changer.

Un thread **démon** (`setDaemon(true)`) ne retient pas la JVM en vie. L'**interruption** (`interrupt()`) est une simple demande, coopérative : le thread ciblé doit la vérifier (ou se faire réveiller par une `InterruptedException` s'il est en `sleep`/`wait`/`join`) et décider comment réagir — rien ne l'arrête de force.

Le piège central de la concurrence : deux threads qui lisent et écrivent le même état partagé sans coordination produisent une **condition de concurrence** (race condition). Même une instruction aussi simple que `compteur++` n'est pas atomique : elle lit, ajoute 1, puis réécrit, en trois étapes séparées où un autre thread peut s'intercaler.

## Détail

### Le cycle de vie d'un thread

`Thread.getState()` renvoie l'un des états de l'énumération `Thread.State` :

| État | Signification |
|---|---|
| `NEW` | Créé (`new Thread(...)`), pas encore démarré |
| `RUNNABLE` | Démarré, en cours d'exécution ou prêt à l'être (attend son tour sur un cœur) |
| `BLOCKED` | Attend d'acquérir un verrou (`synchronized`) détenu par un autre thread |
| `WAITING` / `TIMED_WAITING` | En attente explicite (`wait()`, `join()`, `sleep()`, verrou avec délai) |
| `TERMINATED` | `run()` est terminé, le thread ne peut pas redémarrer |

Un thread `TERMINATED` est définitif : appeler `start()` une seconde fois sur le même objet `Thread` lève `IllegalThreadStateException`.

### Exemple 1 — Créer et démarrer un thread

```java
class TraitementCommande implements Runnable {
    private final int idCommande;
    TraitementCommande(int idCommande) { this.idCommande = idCommande; }

    @Override
    public void run() {
        System.out.println("Traitement de la commande #" + idCommande
            + " par " + Thread.currentThread().getName());
    }
}

Thread t = new Thread(new TraitementCommande(42), "worker-1");
t.start();
```

Appeler `t.run()` au lieu de `t.start()` exécuterait ce code **sur le thread courant**, sans créer de nouveau thread — une erreur fréquente qui ne provoque ni erreur de compilation ni exception, seulement l'absence de parallélisme.

### Exemple 2 — join() pour attendre un résultat

```java
int[] resultat = new int[1];
Thread calcul = new Thread(() -> resultat[0] = calculerTotalStock());
calcul.start();
calcul.join(); // le thread principal attend ici
System.out.println("Total : " + resultat[0]); // sûr : calcul est terminé
```

Sans `join()`, rien ne garantit que `calcul` ait fini avant la lecture de `resultat[0]` : le thread principal pourrait continuer immédiatement après `start()`.

### Exemple 3 — Interruption coopérative

```java
Thread surveillance = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        try {
            verifierNouvellesCommandes();
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // restaure le statut avant de sortir
            break;
        }
    }
    System.out.println("Surveillance arrêtée proprement");
});
surveillance.start();
// ... plus tard ...
surveillance.interrupt(); // demande d'arrêt, pas un arrêt forcé
```

`Thread.sleep()` lève `InterruptedException` **et efface le statut d'interruption** en même temps : si on ne le restaure pas (ou qu'on ne propage pas l'exception), le code appelant ne peut plus jamais savoir qu'une interruption a eu lieu.

### Visibilité, réordonnancement et happens-before

Deux problèmes distincts menacent un état partagé entre threads, au-delà de la seule atomicité :

- **Visibilité** : sans coordination explicite, rien ne garantit qu'un thread voie une écriture faite par un autre thread « à temps » — le compilateur, le processeur et le cache de chaque cœur peuvent retarder la propagation d'une valeur.
- **Réordonnancement** : le compilateur et le processeur sont autorisés à réordonner des instructions indépendantes tant que le résultat *observé par un seul thread* reste identique — ce qui peut surprendre un autre thread qui observe cet ordre.

Le modèle mémoire Java (JLS chapitre 17) définit précisément quand ces problèmes **ne se posent pas**, via la relation **happens-before** : si l'action A happens-before l'action B, tous les effets de A sont garantis visibles pour B. `Thread.start()` happens-before toute action du thread démarré ; la fin d'un thread happens-before le retour de `join()` sur ce thread. En dehors de ces relations garanties (et de celles apportées par `synchronized`, `volatile` et les classes de `java.util.concurrent`, voir la leçon suivante), aucune visibilité n'est garantie entre threads.

### Thread.stop() et consorts : un piège historique

`Thread.stop()`, `suspend()` et `resume()` existent dans l'API depuis les débuts de Java mais sont dépréciées depuis JDK 1.2 : arrêter un thread de force pouvait le faire libérer ses verrous en laissant un objet partagé dans un état incohérent, visible par d'autres threads. Depuis JDK 20, `stop()` a été re-spécifiée pour lever systématiquement `UnsupportedOperationException`, puis **entièrement supprimée en JDK 26** : le code qui l'appelle ne compile plus, et un binaire ancien lève `NoSuchMethodError`. La bonne pratique reste, et a toujours été, l'**interruption coopérative** ou l'annulation via les outils de `java.util.concurrent` (voir la leçon sur les exécuteurs).

### Pièges courants

> **Appeler `run()` au lieu de `start()`.** Ça compile et s'exécute sans erreur, mais tout se passe sur le thread appelant, sans aucun parallélisme. Toujours démarrer via `start()`.

> **Avaler une `InterruptedException` dans un `catch` vide.** Le statut d'interruption est perdu, et rien ne permet plus à l'appelant de savoir qu'une demande d'arrêt a eu lieu. Restaurer le statut (`Thread.currentThread().interrupt()`) si on ne peut pas propager l'exception immédiatement.

> **Croire qu'un test qui passe prouve l'absence de condition de concurrence.** L'entrelacement des threads dépend du système, de la charge, du nombre de cœurs : un bug de concurrence peut rester invisible pendant des mois en test et apparaître seulement en production sous charge.

### À retenir

- Les threads d'un même processus partagent le tas et les champs statiques, mais ont chacun leur propre pile.
- `Runnable` sépare la tâche de son exécution ; on le préfère à l'héritage de `Thread`.
- `join()` attend la fin d'un thread ; l'interruption (`interrupt()`) est une simple demande coopérative, jamais un arrêt forcé.
- `compteur++` n'est pas atomique (lecture, ajout, écriture) : sans synchronisation, un accès concurrent produit une condition de concurrence non déterministe.
- La relation **happens-before** définit précisément quand une écriture d'un thread est garantie visible par un autre ; en dehors d'elle, aucune visibilité n'est garantie. `Thread.stop()` est sans effet depuis JDK 20 et supprimée depuis JDK 26.
