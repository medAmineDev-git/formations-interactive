---
id: zones-memoire
chapitre: jvm-memoire
ordre: 2
titre: "Les zones mémoire"
termes:
  - terme: Tas (heap)
    definition: "Zone mémoire **partagée** entre tous les threads, où vivent tous les objets et tableaux créés avec `new`. C'est la zone gérée par le ramasse-miettes, dimensionnée par `-Xms` (taille initiale) et `-Xmx` (taille maximale)."
  - terme: Pile (stack)
    definition: "Zone mémoire propre à **chaque thread**, composée d'un empilement de *frames* (une par appel de méthode) contenant variables locales, paramètres et résultats intermédiaires. Une récursion trop profonde ou infinie épuise cette pile et lève `StackOverflowError` ; sa taille se règle avec `-Xss`."
  - terme: Métaspace
    definition: "Zone de mémoire **native** (hors tas) où la JVM stocke les métadonnées des classes chargées (structure, méthodes, pool de constantes). A remplacé la **PermGen** (Permanent Generation) depuis Java 8. Par défaut sans limite fixe (contrainte par la mémoire native disponible) sauf si `-XX:MaxMetaspaceSize` est précisé."
  - terme: Mémoire hors tas (direct buffers)
    definition: "Mémoire native allouée en dehors du tas Java, typiquement via `ByteBuffer.allocateDirect()`, utile pour les I/O car elle évite une copie supplémentaire entre le tas et le système d'exploitation. Sa taille est plafonnée par `-XX:MaxDirectMemorySize` et sa libération dépend indirectement du ramasse-miettes (via un `Cleaner`), pas directement de l'objet `ByteBuffer` lui-même."
  - terme: Référence faible (WeakReference)
    definition: "Référence qui n'empêche **pas** le ramasse-miettes de collecter l'objet visé : dès qu'aucune référence **forte** ne subsiste, l'objet est éligible à la collecte, même si des `WeakReference` pointent encore vers lui. Utilisée par `WeakHashMap` pour des caches dont les clés peuvent disparaître sans fuite."
  - terme: Référence douce (SoftReference)
    definition: "Référence collectée seulement en cas de **pression mémoire** (avant de lever `OutOfMemoryError`), contrairement à une référence faible qui peut être collectée dès le prochain cycle de GC. Adaptée aux caches qu'on veut conserver le plus longtemps possible sans risquer l'OOM."
  - terme: En-têtes d'objet compacts
    definition: "Optimisation (JEP 519, finalisée en **JDK 25**) qui réduit l'en-tête présent sur chaque objet Java de 96–128 bits (12 à 16 octets) à 64 bits (8 octets), en fusionnant mark word et pointeur de classe. Activable via `-XX:+UseCompactObjectHeaders` en JDK 25 ; devient le comportement **par défaut** à partir de JDK 27 (JEP 534)."
quiz:
  - question: "Une méthode s'appelle elle-même sans condition d'arrêt. Quelle erreur se produit, et dans quelle zone mémoire ?"
    code: |
      static long compter(long n) {
          return compter(n + 1); // pas de condition d'arrêt
      }
    choix:
      - "OutOfMemoryError: Java heap space, car chaque appel crée un objet sur le tas"
      - "StackOverflowError, car chaque appel empile une nouvelle frame sur la pile du thread jusqu'à épuiser l'espace qui lui est alloué"
      - "Le programme boucle indéfiniment sans jamais lever d'erreur"
      - "NoClassDefFoundError, car la classe ne peut plus être réinitialisée"
    reponse: 1
    explication: "Chaque appel récursif empile une nouvelle frame (variables locales, adresse de retour) sur la pile du thread courant, une zone de taille fixe par thread. Sans condition d'arrêt, la pile s'épuise et la JVM lève StackOverflowError bien avant que le tas ne soit concerné — cette récursion ne crée d'ailleurs aucun objet."
  - question: "Quelle est la différence entre SoftReference et WeakReference ?"
    choix:
      - "Ce sont deux noms pour le même mécanisme, l'un déprécié au profit de l'autre"
      - "Une SoftReference n'est collectée qu'en cas de pression mémoire réelle, juste avant un possible OutOfMemoryError ; une WeakReference peut être collectée dès le cycle de GC suivant, sans lien avec la pression mémoire"
      - "WeakReference ne fonctionne qu'avec les types primitifs autoboxés"
      - "SoftReference empêche totalement la collecte de l'objet référencé, WeakReference l'autorise"
    reponse: 1
    explication: "Les deux laissent l'objet éligible à la collecte dès qu'il n'a plus de référence forte, mais avec des politiques différentes : SoftReference est un choix classique pour un cache qu'on veut garder tant que la mémoire le permet, alors que WeakReference (utilisée par WeakHashMap) est collectée beaucoup plus tôt, dès qu'aucune référence forte ne subsiste."
  - question: "Une application accumule des objets dans une Map statique jamais vidée. Quel message d'erreur est le plus probable après une longue exécution, et pourquoi pas un autre ?"
    choix:
      - "OutOfMemoryError: Metaspace, car les objets métier sont stockés dans les métadonnées de classe"
      - "OutOfMemoryError: Java heap space, car les objets métier accumulés dans la Map vivent sur le tas et restent atteignables via la référence statique, donc jamais collectés"
      - "StackOverflowError, car la pile grossit avec le nombre d'objets stockés"
      - "OutOfMemoryError: Direct buffer memory, car toute Map utilise de la mémoire hors tas par défaut"
    reponse: 1
    explication: "Une Map statique jamais vidée retient ses entrées indéfiniment : les objets métier qu'elle contient restent atteignables depuis une racine (le champ statique), donc jamais éligibles au ramasse-miettes. C'est le tas qui déborde, pas le métaspace (réservé aux métadonnées de classes) ni la pile (liée aux appels de méthode, pas au nombre d'objets vivants)."
---

## Essentiel

La JVM répartit la mémoire en plusieurs zones aux rôles distincts. Le **tas** (heap) est partagé entre tous les threads et contient tous les objets créés avec `new` : c'est la zone gérée par le ramasse-miettes, dimensionnée par `-Xms` (taille initiale) et `-Xmx` (taille maximale). La **pile** (stack) est propre à chaque thread : elle empile une *frame* par appel de méthode (variables locales, résultats intermédiaires) et se règle avec `-Xss`.

```java
static long recursion(long n) { return recursion(n + 1); } // StackOverflowError : pile épuisée
```

Le **métaspace** stocke les métadonnées des classes chargées, en mémoire **native** (hors tas) — il a remplacé la PermGen depuis Java 8. Le **cache de code** stocke le code natif produit par le compilateur JIT. Les **direct buffers** (`ByteBuffer.allocateDirect`) vivent aussi hors tas, utiles pour les I/O.

Java distingue plusieurs niveaux de référence : **forte** (le cas par défaut, empêche toute collecte), **douce** (`SoftReference`, collectée seulement sous pression mémoire), **faible** (`WeakReference`, collectée dès que plus aucune référence forte ne subsiste — base de `WeakHashMap`), et **fantôme** (`PhantomReference`, utilisée pour déclencher une action après collecte, via une `ReferenceQueue`).

Chaque zone a son propre message `OutOfMemoryError` : `Java heap space`, `Metaspace`, `Direct buffer memory`... le message oriente directement le diagnostic.

## Détail

### Comment ça marche

Tas et métaspace grandissent avec l'application ; la pile de chaque thread a une taille fixée au démarrage du thread. Un objet créé sur le tas reste vivant tant qu'il est **atteignable** depuis une racine (variable locale sur une pile, champ statique, référence JNI) — voir la leçon suivante sur le ramasse-miettes pour le détail de cet algorithme.

### Exemple 1 — Tas vs pile

```java
class Commande {
    private final int quantite; // vit sur le tas, dans l'objet Commande
    Commande(int quantite) { this.quantite = quantite; }
}

void traiter() {
    int compteurLocal = 0;           // vit sur la pile de ce thread (variable locale primitive)
    Commande c = new Commande(3);     // la référence "c" vit sur la pile, l'objet Commande sur le tas
}
```

La variable `compteurLocal` (primitif) et la référence `c` disparaissent dès la sortie de `traiter()`, avec la frame de la pile. L'objet `Commande` lui-même reste sur le tas jusqu'à ce que le ramasse-miettes constate qu'il n'est plus atteignable.

### Exemple 2 — Métaspace et son prédécesseur

```bash
# Limiter le métaspace pour éviter qu'une explosion de classes générées dynamiquement
# (proxies, frameworks, classes générées à chaud) ne consomme toute la mémoire native
java -XX:MaxMetaspaceSize=256m -jar application.jar
```

Avant Java 8, ces métadonnées vivaient dans la **PermGen**, une zone de taille fixe à l'intérieur du tas, source fréquente d'`OutOfMemoryError: PermGen space` avec les frameworks générant beaucoup de classes à la volée. Le métaspace, en mémoire native et extensible, a supprimé cette limite rigide — au prix d'un risque de consommer trop de mémoire système si on ne le plafonne pas explicitement.

### Exemple 3 — Références faibles et douces

```java
// Cache "best effort" : les entrées disparaissent sous pression mémoire, pas de fuite
Map<String, SoftReference<byte[]>> cacheImages = new HashMap<>();

void ajouter(String cle, byte[] image) {
    cacheImages.put(cle, new SoftReference<>(image));
}

byte[] lire(String cle) {
    SoftReference<byte[]> ref = cacheImages.get(cle);
    return (ref != null) ? ref.get() : null; // null si le GC l'a déjà collectée
}
```

```java
// WeakHashMap : les entrées disparaissent dès que la clé n'est plus référencée ailleurs
Map<Configuration, Statistiques> parConfig = new WeakHashMap<>();
```

`ref.get()` peut renvoyer `null` à tout moment si l'objet a été collecté entre-temps : le code appelant doit toujours vérifier ce cas, contrairement à une référence forte classique.

### Exemple 4 — Direct buffers

```java
ByteBuffer direct = ByteBuffer.allocateDirect(1024 * 1024); // 1 Mo hors tas
// Utile pour les I/O : le système d'exploitation lit/écrit directement ce buffer,
// sans copie intermédiaire vers/depuis le tas Java.
```

Ce buffer n'est **pas** compté dans `-Xmx` : sa taille est plafonnée séparément par `-XX:MaxDirectMemorySize`. Sa mémoire native n'est libérée qu'indirectement, quand l'objet `ByteBuffer` lui-même (petit, sur le tas) est collecté et qu'un `Cleaner` associé libère la mémoire native correspondante — un usage intensif de buffers directs peut donc saturer la mémoire native bien avant que le tas ne semble sous pression.

### Les quatre niveaux de référence

| Type | Collecté quand | Usage typique |
|---|---|---|
| Forte (défaut) | Jamais tant qu'atteignable | Cas général |
| Douce (`SoftReference`) | Sous pression mémoire, avant OOM | Cache à privilégier tant que la mémoire le permet |
| Faible (`WeakReference`) | Dès le prochain cycle de GC, si plus de référence forte | `WeakHashMap`, caches sans influence sur la durée de vie des clés |
| Fantôme (`PhantomReference`) | Après finalisation, `get()` renvoie toujours `null` | Déclencher une action de nettoyage post-collecte via une `ReferenceQueue`, alternative moderne à `finalize()` |

### Les variantes d'OutOfMemoryError

| Message | Zone concernée | Cause typique |
|---|---|---|
| `Java heap space` | Tas | Trop d'objets encore atteignables (fuite, ou tas sous-dimensionné) |
| `GC overhead limit exceeded` | Tas | Le GC tourne presque en continu pour très peu de mémoire libérée |
| `Metaspace` | Métaspace | Trop de classes chargées (souvent : classes générées dynamiquement sans limite) |
| `Direct buffer memory` | Hors tas | Buffers directs non libérés, au-delà de `-XX:MaxDirectMemorySize` |
| `Unable to create new native thread` | Mémoire native du système | Trop de threads créés pour la mémoire ou les limites OS disponibles |

### Pièges courants

> **Croire que -Xmx limite toute la mémoire du processus Java.** `-Xmx` ne borne que le tas. Métaspace, piles de threads et buffers directs consomment de la mémoire **en plus**, souvent hors du contrôle de `-Xmx` — un conteneur dimensionné uniquement sur `-Xmx` peut donc être tué par manque de mémoire (OOM killer) alors que le tas Java n'est pas plein.

> **Utiliser SoftReference comme un cache LRU classique.** La JVM peut collecter toutes les références douces d'un coup sous forte pression mémoire, sans notion d'ordre d'accès : ce n'est pas un algorithme d'éviction prévisible, seulement un filet de sécurité contre l'OOM.

> **Oublier qu'un ByteBuffer direct n'est pas gratuit à créer.** L'allocation native est plus coûteuse qu'une allocation sur le tas ; en créer et en abandonner en boucle (sans pool) peut saturer la mémoire native avant même que le tas ne montre le moindre signe de tension.

### À retenir

- Tas partagé (`-Xmx`/`-Xms`) pour les objets ; pile par thread (`-Xss`) pour les appels de méthode et variables locales, avec `StackOverflowError` en cas de dépassement.
- Le métaspace (mémoire native) a remplacé la PermGen (dans le tas) depuis Java 8, supprimant sa limite fixe historique.
- Les direct buffers vivent hors tas, échappent à `-Xmx`, et se plafonnent avec `-XX:MaxDirectMemorySize`.
- Quatre niveaux de référence : forte, douce (pression mémoire), faible (dès le GC suivant), fantôme (nettoyage post-collecte).
- Le message précis d'`OutOfMemoryError` (`Java heap space`, `Metaspace`, `Direct buffer memory`...) indique directement quelle zone est en cause.
