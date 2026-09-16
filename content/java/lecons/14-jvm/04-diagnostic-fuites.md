---
id: diagnostic-fuites
chapitre: jvm-memoire
ordre: 4
titre: "Diagnostiquer une fuite mémoire"
termes:
  - terme: Fuite mémoire (Java)
    definition: "En Java, une fuite n'est **pas** de la mémoire non libérée au sens C/C++ : c'est de la mémoire occupée par des objets encore **atteignables** (donc que le GC ne peut pas collecter) mais que l'application n'utilise plus réellement. Le symptôme est une croissance progressive de l'occupation du tas qui ne redescend jamais complètement, même après une collecte majeure."
  - terme: Écouteur non retiré (listener leak)
    definition: "Un objet s'enregistre comme écouteur (`addListener`, `addPropertyChangeListener`...) auprès d'un composant à longue durée de vie, mais n'est jamais désenregistré (`removeListener`). Le composant à longue durée de vie retient alors indéfiniment une référence vers l'objet, l'empêchant d'être collecté même après qu'il n'a plus d'utilité."
  - terme: ThreadLocal non nettoyé
    definition: "Un `ThreadLocal` associe une valeur à un thread donné. Avec un pool de threads (`ExecutorService`), les threads sont **réutilisés** indéfiniment : une valeur posée via `set()` et jamais retirée via `remove()` reste attachée au thread bien après la fin de la tâche qui l'a créée, et s'accumule à chaque nouvelle tâche qui en pose une différente."
  - terme: Classe interne non statique
    definition: "Une classe interne non statique garde implicitement une référence vers son instance englobante (`Outer.this`). Une instance de cette classe interne encore atteignable (par exemple stockée dans une collection à longue durée de vie) retient donc **toute** l'instance englobante en vie, même si celle-ci semble par ailleurs inutilisée."
  - terme: jcmd
    definition: "Outil de diagnostic en ligne de commande qui envoie des commandes à une JVM en cours d'exécution via son PID : histogramme de classes (`GC.class_histogram`), capture d'un instantané du tas (`GC.heap_dump`), état du tas (`GC.heap_info`), pilotage de JDK Flight Recorder (`JFR.start`), et bien d'autres. Recommandé en priorité par rapport aux outils historiques comme `jmap`."
  - terme: JDK Flight Recorder (JFR) et Mission Control
    definition: "JFR est un enregistreur d'événements intégré à la JVM (surcoût très faible, activable même en production) qui capture allocations, pauses GC, threads, I/O... sur une période donnée. **JDK Mission Control** (JMC) est l'outil graphique qui ouvre ces enregistrements pour les analyser : tendances d'allocation, objets qui grossissent, threads bloqués."
  - terme: Instantané du tas (heap dump)
    definition: "Capture complète, à un instant donné, de tous les objets présents sur le tas et de leurs références entre eux (fichier au format `.hprof`). Analysé avec un outil qui calcule la **taille retenue** (retained size) de chaque objet et le **chemin vers les racines** (path to GC roots) : la chaîne de références qui explique pourquoi un objet suspect n'est pas collecté."
quiz:
  - question: "Un service Spring enregistre un écouteur auprès d'un bus d'événements applicatif à la création de chaque requête, mais ne le retire jamais. Que se passe-t-il après plusieurs milliers de requêtes ?"
    code: |
      class GestionnaireRequete {
          GestionnaireRequete(BusEvenements bus) {
              bus.addListener(this::surEvenement); // jamais retiré
          }
      }
    choix:
      - "Rien : la JVM détecte automatiquement les écouteurs inutilisés et les retire"
      - "Le bus d'événements, à longue durée de vie, accumule une référence vers chaque GestionnaireRequete créé ; ces objets restent atteignables indéfiniment et ne sont jamais collectés, même après la fin de la requête correspondante — une fuite mémoire classique"
      - "Une StackOverflowError, car chaque écouteur ajoute un niveau d'appel à la pile"
      - "Le bus d'événements refuse automatiquement les doublons d'écouteurs après un certain nombre d'enregistrements"
    reponse: 1
    explication: "C'est le schéma classique de fuite par écouteur non retiré : le bus d'événements vit bien plus longtemps que chaque GestionnaireRequete, donc sa liste interne d'écouteurs devient une racine qui retient tous les gestionnaires créés depuis le démarrage, même longtemps après que leur requête est terminée. La correction est de retirer l'écouteur (removeListener) à la fin du cycle de vie de l'objet, ou d'utiliser une référence faible côté bus."
  - question: "Un ExecutorService avec un pool de threads fixe exécute des tâches qui posent une valeur dans un ThreadLocal sans jamais appeler remove(). Pourquoi est-ce un problème plus subtil qu'une simple variable locale oubliée ?"
    choix:
      - "Ce n'est pas un problème : chaque tâche a son propre thread, donc sa propre copie du ThreadLocal, automatiquement nettoyée à la fin de la tâche"
      - "Les threads d'un pool sont réutilisés entre les tâches : la valeur posée par une tâche reste attachée au thread bien après sa fin, et peut être lue par erreur par une tâche suivante, en plus de s'accumuler en mémoire au fil des exécutions"
      - "ThreadLocal ne peut être utilisé qu'avec un seul thread à la fois, donc ce code ne compile pas"
      - "Le problème ne concerne que les threads virtuels, pas les threads de plateforme d'un pool"
    reponse: 1
    explication: "Avec un pool à durée de vie longue, le thread physique persiste bien au-delà d'une tâche individuelle : sans remove(), la valeur du ThreadLocal reste attachée à ce thread et peut fuiter vers la tâche suivante qui le réutilise, en plus de retenir en mémoire des objets potentiellement volumineux. La bonne pratique est d'appeler systématiquement remove() dans un bloc finally à la fin de la tâche."
  - question: "Quelle est la première étape d'une démarche de diagnostic face à une suspicion de fuite mémoire en production ?"
    choix:
      - "Redémarrer immédiatement l'application pour éviter l'OutOfMemoryError, sans investiguer davantage"
      - "Confirmer la tendance réelle (croissance progressive et persistante de l'occupation du tas, pas un simple pic ponctuel absorbé par le GC), par exemple via jstat ou un suivi -Xlog:gc dans le temps, avant de capturer un instantané du tas à analyser"
      - "Capturer immédiatement un thread dump, car les fuites mémoire sont toujours causées par un blocage de threads"
      - "Augmenter -Xmx au maximum disponible pour éliminer le risque, sans chercher la cause"
    reponse: 1
    explication: "Avant de plonger dans un heap dump, il faut confirmer qu'il s'agit bien d'une tendance de fond (l'occupation après collecte majeure augmente dans le temps) et non d'un simple pic de charge normal que le GC absorbe. Une fois la tendance confirmée, comparer plusieurs instantanés du tas pris à des moments différents permet d'identifier les objets dont le nombre croît anormalement, puis de remonter leur chemin vers les racines qui les retiennent."
---

## Essentiel

En Java, une **fuite mémoire** n'est pas de la mémoire "perdue" comme en C : ce sont des objets encore **atteignables**, donc que le ramasse-miettes ne peut légitimement pas collecter, mais que l'application n'utilise plus réellement. Le symptôme typique : l'occupation du tas après chaque collecte majeure augmente progressivement dans le temps, sans jamais redescendre — jusqu'à `OutOfMemoryError: Java heap space`.

```java
class Cache {
    private static final Map<String, byte[]> DONNEES = new HashMap<>(); // jamais purgée
    static void ajouter(String cle, byte[] valeur) { DONNEES.put(cle, valeur); }
}
```

Causes classiques : un **cache sans éviction** qui grossit indéfiniment, un **écouteur jamais retiré** auprès d'un composant à longue durée de vie, un `ThreadLocal` **non nettoyé** dans un pool de threads réutilisés, une **classe interne non statique** qui retient implicitement son instance englobante, ou une simple **collection statique** qui n'est jamais purgée.

Outils de diagnostic : `jcmd` (histogramme de classes, capture d'instantané du tas), `jstat` (suivi de l'activité du GC dans le temps), JDK Flight Recorder et **JDK Mission Control** pour une analyse fine avec un surcoût minime, et l'analyse d'un **instantané du tas** (heap dump) pour retrouver le **chemin vers les racines** qui retient les objets suspects.

## Détail

### Comment ça marche

Le principe de diagnostic est toujours le même : confirmer une vraie tendance de croissance (pas un pic ponctuel normal), identifier les objets dont le **nombre** ou la **taille retenue** croît anormalement, puis remonter la chaîne de références qui les maintient artificiellement vivants jusqu'à trouver la racine responsable.

### Exemple 1 — Cache sans éviction

```java
class CacheProduits {
    private static final Map<Long, Produit> CACHE = new HashMap<>();

    static Produit charger(Long id, Supplier<Produit> chargement) {
        return CACHE.computeIfAbsent(id, k -> chargement.get()); // ne rétrécit jamais
    }
}
```

Correction : borner explicitement la taille (par exemple avec un `LinkedHashMap` en mode LRU avec `removeEldestEntry`), fixer une expiration, ou utiliser une bibliothèque de cache dédiée avec politique d'éviction — jamais une simple `Map` qui ne fait que grossir.

### Exemple 2 — Écouteur jamais retiré

```java
class TableauDeBord {
    TableauDeBord(BusEvenements bus) {
        bus.addListener(this::rafraichir); // enregistré, jamais retiré
    }
}
```

Le `BusEvenements`, à longue durée de vie, retient indéfiniment chaque `TableauDeBord` créé. Correction : retirer l'écouteur explicitement à la fin du cycle de vie (`removeListener` dans une méthode `fermer()` ou `close()`), ou, quand le cycle de vie exact est difficile à suivre, enregistrer une référence faible côté bus.

### Exemple 3 — ThreadLocal dans un pool

```java
class ContexteRequete {
    private static final ThreadLocal<Utilisateur> COURANT = new ThreadLocal<>();

    static void demarrer(Utilisateur u) { COURANT.set(u); }
    static Utilisateur courant() { return COURANT.get(); }
    static void terminer() { COURANT.remove(); } // indispensable avec un pool de threads
}
```

Sans `terminer()` appelé systématiquement (idéalement dans un `finally`), chaque thread du pool accumule des références vers d'anciens `Utilisateur` bien après la fin de leur requête — et une tâche suivante réutilisant le même thread peut même lire, par erreur, la valeur laissée par la précédente.

### Exemple 4 — Classe interne non statique

```java
class RapportVolumineux {
    private final byte[] donneesEnormes = new byte[50_000_000];

    class Export { // classe interne NON statique : garde une référence implicite vers RapportVolumineux.this
        void generer() { /* ... */ }
    }
}

List<RapportVolumineux.Export> exportsEnAttente = new ArrayList<>(); // stockage à longue durée de vie
```

Chaque `Export` stocké dans `exportsEnAttente` retient tout son `RapportVolumineux` englobant — y compris ses 50 Mo de données — même si seul l'export lui-même est censé être utile. Correction : rendre la classe interne `static` dès qu'elle n'a pas besoin d'accéder à l'instance englobante.

### Symptômes et démarche de diagnostic

| Symptôme observé | Ce qu'il suggère |
|---|---|
| Occupation du tas après GC majeur qui augmente régulièrement | Fuite mémoire probable, pas un simple pic de charge |
| Fréquence des collectes qui augmente, mémoire libérée par collecte qui diminue | Le GC travaille de plus en plus pour de moins en moins de résultat |
| `OutOfMemoryError: Java heap space` récurrente après une durée de fonctionnement croissante | Confirmation d'une fuite (par opposition à un tas simplement sous-dimensionné dès le départ) |

Démarche pas à pas : confirmer la tendance dans le temps (`jstat -gcutil <pid> 5s`, ou suivi de `-Xlog:gc` sur plusieurs heures) ; capturer un premier instantané du tas avec `jcmd <pid> GC.heap_dump dump1.hprof` ; laisser tourner, puis capturer un second instantané (`dump2.hprof`) ; comparer les deux (croissance du nombre d'instances par classe, via un histogramme ou un outil d'analyse) ; pour les classes suspectes, retrouver le **chemin vers les racines** (path to GC roots) qui explique pourquoi elles restent atteignables ; corriger la référence responsable ; revalider avec un nouveau suivi dans le temps.

```bash
jcmd <pid> GC.class_histogram        # nombre d'instances et taille par classe, rapide
jcmd <pid> GC.heap_dump rapport.hprof # instantané complet à analyser avec un outil dédié
jstat -gcutil <pid> 5000              # occupation des générations toutes les 5 secondes
jcmd <pid> JFR.start duration=300s filename=diag.jfr  # enregistrement pour Mission Control
```

### Pièges courants

> **Confondre un pic de charge normal avec une fuite.** Un tas qui se remplit puis se vide correctement après un pic de trafic n'est pas une fuite. Le vrai signal est l'occupation **résiduelle après collecte majeure** qui progresse dans le temps, pas l'occupation instantanée.

> **Analyser un seul instantané du tas isolément.** Un unique heap dump montre un état à un instant donné, pas une évolution. Comparer au moins deux instantanés pris à des moments différents est ce qui révèle réellement quelles classes grossissent anormalement.

> **Oublier que le chemin vers les racines est l'information clé, pas juste la taille de l'objet.** Savoir qu'un objet de 50 Mo existe encore ne dit pas pourquoi il n'est pas collecté. C'est le chemin de références qui le relie à une racine (souvent un champ statique, un écouteur, ou un `ThreadLocal`) qui identifie le vrai coupable à corriger.

### À retenir

- Une fuite Java, c'est de la mémoire **atteignable mais inutile** — jamais un défaut de libération manuelle comme en C.
- Causes classiques : cache sans éviction, écouteur non retiré, `ThreadLocal` non nettoyé dans un pool, classe interne non statique, collection statique qui grossit.
- Symptôme fiable : croissance progressive de l'occupation résiduelle après collecte majeure, pas un pic ponctuel.
- `jcmd` (histogramme, heap dump), `jstat` (suivi dans le temps) et JDK Flight Recorder / Mission Control sont les outils de référence, à préférer aux outils historiques comme `jmap`.
- La démarche efficace compare plusieurs instantanés dans le temps et remonte le **chemin vers les racines** de l'objet suspect, plutôt que d'analyser un dump isolé.
