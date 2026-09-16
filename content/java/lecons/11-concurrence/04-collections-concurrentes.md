---
id: collections-concurrentes
chapitre: concurrence
ordre: 4
titre: "Collections concurrentes"
termes:
  - terme: ConcurrentHashMap
    definition: "Implémentation thread-safe de `Map` conçue pour un accès concurrent performant : les écritures ne verrouillent qu'une petite partie de la structure interne (pas la table entière), les lectures ne verrouillent généralement pas du tout, et l'itération est **faiblement cohérente** (elle ne lève jamais `ConcurrentModificationException`, mais peut ou non refléter des modifications faites pendant son parcours)."
  - terme: "compute / merge / putIfAbsent"
    definition: "Opérations **atomiques** de `ConcurrentHashMap` (et de `Map` en général depuis Java 8) qui combinent lecture et écriture en une seule étape indivisible : `putIfAbsent` n'insère que si la clé est absente, `compute` recalcule une valeur à partir de l'ancienne, `merge` combine l'ancienne valeur avec une nouvelle via une fonction. Indispensables pour éviter une lecture puis écriture séparées, qui resteraient une condition de concurrence même sur une map thread-safe."
  - terme: CopyOnWriteArrayList
    definition: "Implémentation de `List` thread-safe qui recopie **tout le tableau interne** à chaque écriture (`add`, `remove`, `set`). Les lectures et l'itération n'ont besoin d'aucun verrou et ne lèvent jamais `ConcurrentModificationException`. Adaptée aux cas très majoritairement en lecture, avec des écritures rares (ex. : liste d'écouteurs d'événements)."
  - terme: BlockingQueue
    definition: "File qui **bloque** le producteur quand elle est pleine (`put`) et le consommateur quand elle est vide (`take`), sans boucle d'attente active à écrire soi-même. `ArrayBlockingQueue` a une capacité fixe (tableau) ; `LinkedBlockingQueue` peut être bornée ou non (liste chaînée). Base naturelle du schéma producteur/consommateur."
  - terme: "Collections.synchronizedXxx"
    definition: "Enveloppe une collection ordinaire (`ArrayList`, `HashMap`…) pour synchroniser chaque appel de méthode individuellement. Protège les opérations **unitaires**, mais pas les séquences de plusieurs appels (vérifier-puis-agir) ni l'**itération**, qui doit être placée manuellement dans un bloc `synchronized` sur la collection."
  - terme: CountDownLatch
    definition: "Compteur à **usage unique** : des threads appellent `await()` pour attendre que le compteur atteigne zéro, d'autres appellent `countDown()` pour le décrémenter. Une fois à zéro, il le reste : le latch ne se réinitialise jamais."
  - terme: Semaphore
    definition: "Compte un nombre limité de **permis** (`acquire()`/`release()`) : sert à limiter le nombre de threads accédant simultanément à une ressource (pool de connexions, appels à un service externe), contrairement à un verrou qui n'en autorise qu'un seul."
quiz:
  - question: "Pourquoi ce code reste-t-il une condition de concurrence, alors que la Map utilisée est un ConcurrentHashMap ?"
    code: |
      ConcurrentHashMap<String, Integer> vues = new ConcurrentHashMap<>();
      // Plusieurs threads exécutent concurremment :
      Integer actuel = vues.get(produitId);
      if (actuel == null) {
          vues.put(produitId, 1);
      } else {
          vues.put(produitId, actuel + 1);
      }
    choix:
      - "ConcurrentHashMap ne peut pas contenir de valeurs Integer, seulement des types primitifs"
      - "get() puis put() forment deux appels séparés, non atomiques ensemble : deux threads peuvent lire la même valeur avant qu'aucun n'écrive, et une incrémentation est perdue — merge() ou compute() est nécessaire pour rendre la séquence lire-modifier-écrire atomique"
      - "Ce code lève systématiquement une ConcurrentModificationException"
      - "ConcurrentHashMap interdit d'appeler put() après un get() sur la même clé"
    reponse: 1
    explication: "ConcurrentHashMap rend chaque appel individuel (get, put) thread-safe, mais ne protège pas une séquence de plusieurs appels : c'est un piège très courant. vues.merge(produitId, 1, Integer::sum) exécute la lecture, le calcul et l'écriture comme une seule opération atomique, sans cette fenêtre de vulnérabilité."
  - question: "Dans quel contexte CopyOnWriteArrayList est-il le bon choix, plutôt qu'une simple synchronizedList ?"
    choix:
      - "Quand la liste est modifiée en permanence par de nombreux threads simultanément"
      - "Quand les lectures et l'itération sont très fréquentes, et les écritures rares (ex. : liste d'écouteurs d'événements enregistrés une fois au démarrage), car chaque écriture recopie tout le tableau interne"
      - "Quand la liste doit rester triée en permanence après chaque insertion"
      - "Quand on veut économiser de la mémoire par rapport à une ArrayList classique"
    reponse: 1
    explication: "CopyOnWriteArrayList paie le prix fort à l'écriture (copie complète du tableau à chaque add/remove/set) pour offrir des lectures et une itération sans aucun verrou, jamais de ConcurrentModificationException. C'est un excellent choix quand les écritures sont rares, et un très mauvais choix si la liste change souvent — chaque écriture y devient alors coûteuse en O(n)."
  - question: "Que se passe-t-il si un thread itère une Collections.synchronizedList sans bloc synchronized explicite, pendant qu'un autre thread la modifie ?"
    code: |
      List<String> liste = Collections.synchronizedList(new ArrayList<>());
      // Thread A :
      for (String s : liste) {
          traiter(s);
      }
      // Thread B, en parallèle :
      liste.add("nouvel élément");
    choix:
      - "Aucun risque : synchronizedList rend l'itération elle-même thread-safe automatiquement"
      - "L'itération peut lever une ConcurrentModificationException, car chaque appel individuel (next(), add()) est synchronisé séparément mais pas la boucle entière : il faut englober le for-each dans synchronized (liste) { ... }"
      - "La boucle for-each se met en pause automatiquement pendant l'appel à add()"
      - "liste.add() est bloqué tant que le for-each n'est pas terminé"
    reponse: 1
    explication: "Collections.synchronizedList synchronise chaque méthode individuellement, pas une séquence d'appels comme une itération complète. La documentation de la méthode l'indique explicitement : il faut entourer manuellement toute itération d'un bloc synchronized (liste) { for (...) { ... } } pour éviter une ConcurrentModificationException si la liste est modifiée pendant le parcours."
---

## Essentiel

Une `HashMap` (ou `ArrayList`) partagée entre threads sans synchronisation est dangereuse : au mieux une `ConcurrentModificationException` en itération, au pire une **structure interne corrompue** en cas d'écritures concurrentes non protégées (résultats incohérents, voire boucle infinie historiquement documentée sur d'anciennes versions de `HashMap`).

`java.util.concurrent` fournit des collections pensées pour l'accès concurrent, pas de simples enveloppes synchronisées :

```java
Map<String, Integer> vues = new ConcurrentHashMap<>();
vues.merge("produit-42", 1, Integer::sum); // lire + additionner + écrire, atomiquement

List<Runnable> ecouteurs = new CopyOnWriteArrayList<>(); // beaucoup de lectures, peu d'écritures

BlockingQueue<Commande> aTraiter = new LinkedBlockingQueue<>(100); // producteur/consommateur
```

`ConcurrentHashMap` ne verrouille qu'une petite partie de sa structure à l'écriture (jamais la table entière) et son itération est **faiblement cohérente** : jamais d'exception, mais aucune garantie de voir ou non une modification concurrente. Ses opérations `compute`/`merge`/`putIfAbsent` combinent lecture et écriture en une seule étape atomique — indispensable, car un `get()` suivi d'un `put()` séparé resterait une condition de concurrence même sur une map thread-safe.

`Collections.synchronizedList`/`synchronizedMap` protègent chaque appel **individuel**, mais jamais une séquence de plusieurs appels ni une itération, qui doit rester encadrée manuellement par un bloc `synchronized`.

## Détail

### Pourquoi une HashMap partagée est dangereuse

`HashMap` n'offre **aucune** garantie en environnement concurrent : deux `put()` simultanés peuvent corrompre la structure interne (listes chaînées de collision mal reliées), un `get()` concurrent à un redimensionnement peut boucler ou renvoyer un résultat incohérent, et l'itération lève `ConcurrentModificationException` dès qu'une modification structurelle est détectée pendant le parcours — y compris depuis le thread qui itère lui-même, si elle ne passe pas par l'itérateur.

### Exemple 1 — ConcurrentHashMap : compute, merge, putIfAbsent

```java
ConcurrentHashMap<String, AtomicInteger> compteurVues = new ConcurrentHashMap<>();

void enregistrerVue(String produitId) {
    compteurVues.computeIfAbsent(produitId, id -> new AtomicInteger())
                .incrementAndGet();
}

// Alternative avec merge, sans objet mutable :
ConcurrentHashMap<String, Integer> vues = new ConcurrentHashMap<>();
void compterVue(String produitId) {
    vues.merge(produitId, 1, Integer::sum); // atomique : crée ou additionne
}
```

`putIfAbsent(cle, valeur)` n'écrase jamais une valeur existante — contrairement à `put()`, qui écrase toujours. C'est la version atomique du motif « insérer seulement si absent », qui serait autrement une condition de concurrence (`containsKey` puis `put` séparés).

### Exemple 2 — CopyOnWriteArrayList pour un cas lecture-dominante

```java
private final List<Consumer<Commande>> ecouteurs = new CopyOnWriteArrayList<>();

public void surNouvelleCommande(Consumer<Commande> ecouteur) {
    ecouteurs.add(ecouteur); // rare : recopie tout le tableau interne
}

public void notifier(Commande commande) {
    for (Consumer<Commande> ecouteur : ecouteurs) { // fréquent : aucun verrou, jamais de CME
        ecouteur.accept(commande);
    }
}
```

Chaque `add()`/`remove()` recopie l'intégralité du tableau interne (coût O(n)) : rentable seulement quand les écritures sont rares face aux lectures. Utilisée à mauvais escient (beaucoup d'écritures), elle est bien plus lente qu'une liste synchronisée classique.

### Exemple 3 — BlockingQueue et le schéma producteur/consommateur

```java
BlockingQueue<Commande> file = new ArrayBlockingQueue<>(50); // capacité fixe

// Producteur :
void soumettre(Commande c) throws InterruptedException {
    file.put(c); // bloque si la file est pleine, jusqu'à de la place
}

// Consommateur :
void traiterEnBoucle() throws InterruptedException {
    while (!Thread.currentThread().isInterrupted()) {
        Commande c = file.take(); // bloque si la file est vide, jusqu'à un élément
        traiter(c);
    }
}
```

`put()`/`take()` bloquent sans boucle d'attente active à écrire ; `offer()`/`poll()` existent en variantes non bloquantes (ou avec délai). Une capacité bornée (`ArrayBlockingQueue`, ou `LinkedBlockingQueue` avec capacité) protège contre une file qui grossirait indéfiniment si les producteurs sont plus rapides que les consommateurs.

### Exemple 4 — Collections.synchronizedXxx : ce qu'il faut encore faire soi-même

```java
List<String> liste = Collections.synchronizedList(new ArrayList<>());

synchronized (liste) {           // obligatoire pour une itération sûre
    for (String s : liste) {
        traiter(s);
    }
}
```

Sans ce bloc `synchronized` explicite autour de l'itération, un autre thread peut modifier la liste pendant le parcours et provoquer `ConcurrentModificationException` — `synchronizedList` ne protège que chaque appel de méthode pris isolément, jamais une séquence de plusieurs appels ni une boucle complète.

### Outils de synchronisation

```java
CountDownLatch demarrage = new CountDownLatch(1);
// Chaque worker attend le signal de départ :
demarrage.await();
// Le thread principal donne le signal, une seule fois :
demarrage.countDown();

Semaphore connexionsDisponibles = new Semaphore(10); // 10 accès simultanés max
connexionsDisponibles.acquire();
try {
    appelerServiceExterne();
} finally {
    connexionsDisponibles.release();
}
```

`CountDownLatch` est à **usage unique** : une fois à zéro, il ne se réinitialise jamais (créer un nouveau latch pour un nouveau cycle). `CyclicBarrier` s'en distingue : il attend qu'un nombre fixe de threads arrivent tous à un point donné (`await()`), puis se **réinitialise automatiquement** pour le tour suivant — utile pour synchroniser des étapes répétées d'un calcul parallèle. `Semaphore` limite un nombre d'accès concurrents à une ressource, plutôt que de n'en autoriser qu'un seul comme un verrou classique.

### Choisir la bonne structure

| Besoin | Structure |
|---|---|
| Map partagée à forte concurrence | `ConcurrentHashMap` |
| Liste très majoritairement lue, rarement modifiée | `CopyOnWriteArrayList` |
| Liste modifiée fréquemment par plusieurs threads | `Collections.synchronizedList` (avec itération protégée), ou repenser le design |
| Producteur(s)/consommateur(s) | `BlockingQueue` (`ArrayBlockingQueue` bornée, `LinkedBlockingQueue`) |
| Attendre qu'un ensemble de tâches se termine une fois | `CountDownLatch` |
| Synchroniser des threads à des étapes répétées | `CyclicBarrier` |
| Limiter l'accès concurrent à une ressource | `Semaphore` |

### Pièges courants

> **Enchaîner `get()` puis `put()` sur un `ConcurrentHashMap` en pensant que la map étant thread-safe, la séquence l'est aussi.** Chaque appel est atomique individuellement, pas la séquence des deux. Utiliser `compute`, `merge` ou `putIfAbsent` pour rendre l'ensemble atomique.

> **Itérer une `Collections.synchronizedXxx` sans bloc `synchronized` autour de la boucle.** La javadoc le précise explicitement : sans ce bloc, une modification concurrente pendant l'itération peut lever `ConcurrentModificationException`.

> **Confondre `CountDownLatch` et `CyclicBarrier`.** Le premier est à usage unique (ne se réinitialise jamais) ; le second se réinitialise automatiquement après chaque tour complet, pour des synchronisations répétées.

### À retenir

- Une `HashMap`/`ArrayList` partagée sans protection peut corrompre sa structure interne, pas seulement lever une exception.
- `ConcurrentHashMap` verrouille finement (jamais la table entière) et offre des opérations atomiques (`compute`, `merge`, `putIfAbsent`) indispensables pour éviter une séquence lire-puis-écrire non protégée.
- `CopyOnWriteArrayList` : lectures sans verrou, écritures coûteuses (copie complète) — réservé aux cas très majoritairement en lecture.
- `BlockingQueue` structure naturellement un schéma producteur/consommateur, sans boucle d'attente active.
- `Collections.synchronizedXxx` protège chaque appel individuel, jamais une itération complète ni une séquence de plusieurs opérations : `CountDownLatch`, `CyclicBarrier` et `Semaphore` couvrent des besoins de coordination que les collections seules ne résolvent pas.
