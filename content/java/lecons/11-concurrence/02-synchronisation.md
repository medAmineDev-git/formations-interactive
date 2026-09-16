---
id: synchronisation
chapitre: concurrence
ordre: 2
titre: "Synchroniser correctement"
termes:
  - terme: "synchronized"
    definition: "Mot-clé qui garantit l'**exclusion mutuelle** : un seul thread à la fois peut exécuter un bloc protégé par le même verrou (moniteur). Applicable à une méthode entière (verrou sur `this`, ou sur la classe pour une méthode statique) ou à un bloc explicite (`synchronized (objet) { ... }`). Le verrou est **réentrant** : un thread qui le détient déjà peut le reprendre sans se bloquer lui-même."
  - terme: "volatile"
    definition: "Modificateur de champ qui garantit la **visibilité** immédiate des écritures entre threads et empêche certains réordonnancements autour du champ (via une relation happens-before entre écriture et lecture). Il ne rend **pas** atomique une opération composée comme `x++` : il ne remplace pas `synchronized` ni les classes atomiques pour ça."
  - terme: "AtomicInteger / compareAndSet"
    definition: "`AtomicInteger`, `AtomicLong`, `AtomicReference`… offrent des opérations atomiques sans verrou explicite, basées sur l'instruction processeur **CAS** (compare-and-swap) : `compareAndSet(attendu, nouveau)` ne remplace la valeur que si elle vaut encore `attendu`, et renvoie un booléen. `LongAdder` répartit les compteurs sur plusieurs cases internes pour réduire la contention sous forte charge, au prix d'une lecture (`sum()`) un peu plus coûteuse."
  - terme: ReentrantLock
    definition: "Implémentation explicite de `Lock` (package `java.util.concurrent.locks`), plus flexible que `synchronized` : verrouillage **interruptible**, `tryLock()` avec délai pour éviter un blocage indéfini, verrou **équitable** en option (FIFO), et une ou plusieurs `Condition` associées pour un `wait`/`notify` plus précis. Doit toujours être libéré dans un bloc `finally`."
  - terme: ReadWriteLock
    definition: "Verrou qui distingue lectures et écritures : plusieurs threads peuvent détenir simultanément le **verrou de lecture** tant qu'aucun thread ne détient le **verrou d'écriture** (exclusif). Utile quand les lectures sont très majoritaires face aux écritures."
  - terme: Interblocage (deadlock)
    definition: "Blocage définitif où deux threads (ou plus) attendent chacun un verrou détenu par l'autre, sans qu'aucun ne puisse jamais avancer. Se prévient en acquérant les verrous **toujours dans le même ordre**, ou en utilisant `tryLock()` avec un délai pour abandonner et réessayer plutôt que d'attendre indéfiniment."
quiz:
  - question: "Que garantit exactement volatile sur un champ int partagé entre threads ?"
    code: |
      class Etat {
          volatile boolean pret = false;
          int compteur = 0;
      }
      // Thread A :
      etat.compteur++;
      etat.pret = true;
      // Thread B :
      if (etat.pret) {
          System.out.println(etat.compteur);
      }
    choix:
      - "volatile rend l'incrémentation de compteur atomique, donc le programme est totalement sûr"
      - "volatile garantit la visibilité de l'écriture sur pret et, grâce à happens-before, que si B voit pret == true, B voit aussi la valeur à jour de compteur écrite avant par A — mais compteur lui-même n'est protégé par aucune atomicité s'il est modifié par plusieurs threads"
      - "volatile n'a aucun effet ici car compteur n'est pas lui-même volatile"
      - "Ce code lève une IllegalMonitorStateException car compteur est modifié hors d'un bloc synchronized"
    reponse: 1
    explication: "volatile sur pret crée une relation happens-before entre l'écriture de A et la lecture de B : tout ce que A a écrit avant d'écrire pret=true (y compris compteur) devient visible pour B dès qu'il lit pret==true. Ce motif (drapeau volatile publiant un état préparé) est valide pour un seul écrivain ; volatile seul ne rendrait pas compteur++ atomique si plusieurs threads l'incrémentaient concurremment."
  - question: "Deux threads transfèrent de l'argent entre deux comptes, chacun en verrouillant d'abord le compte source puis le compte destination. Quel risque ce code présente-t-il ?"
    code: |
      void transferer(Compte source, Compte dest, int montant) {
          synchronized (source) {
              synchronized (dest) {
                  source.debiter(montant);
                  dest.crediter(montant);
              }
          }
      }
      // Thread 1 : transferer(compteA, compteB, 100);
      // Thread 2 : transferer(compteB, compteA, 50);
    choix:
      - "Une NullPointerException systématique"
      - "Un interblocage possible : le thread 1 peut détenir le verrou de compteA en attendant compteB pendant que le thread 2 détient compteB en attendant compteA"
      - "Aucun risque : synchronized empêche toujours les interblocages automatiquement"
      - "Une perte silencieuse d'argent, mais jamais de blocage"
    reponse: 1
    explication: "Les deux threads verrouillent les comptes dans un ordre opposé (source puis dest, mais source/dest sont inversés entre les deux appels) : c'est le schéma classique d'interblocage. La parade consiste à toujours verrouiller les verrous dans un ordre global cohérent (par exemple par identifiant de compte croissant), ou à utiliser tryLock() avec un délai pour se désister et réessayer si l'ordre ne peut pas être garanti."
  - question: "Pourquoi faut-il toujours libérer un ReentrantLock dans un bloc finally ?"
    code: |
      lock.lock();
      traiterCommande(); // peut lever une exception
      lock.unlock();
    choix:
      - "Ce n'est pas nécessaire : le verrou se libère automatiquement à la fin de la méthode"
      - "Si traiterCommande() lève une exception, lock.unlock() n'est jamais exécuté et le verrou reste détenu indéfiniment, bloquant tous les autres threads qui l'attendent"
      - "finally n'a d'effet que pour les verrous synchronized, pas pour ReentrantLock"
      - "Le verrou se libère automatiquement au bout de 30 secondes par défaut"
    reponse: 1
    explication: "Contrairement à synchronized, dont la libération est garantie par le compilateur même en cas d'exception, ReentrantLock est un objet ordinaire : rien ne libère lock.unlock() automatiquement. Le schéma correct est lock.lock() suivi immédiatement d'un try { ... } finally { lock.unlock(); }, pour garantir la libération quel que soit le chemin de sortie."
---

## Essentiel

`synchronized` garantit qu'**un seul thread à la fois** exécute le code protégé par le même verrou (le moniteur associé à un objet). Il est **réentrant** : un thread qui détient déjà le verrou peut le reprendre (appel récursif, appel d'une autre méthode synchronisée sur le même objet) sans se bloquer.

```java
class Compteur {
    private int valeur = 0;
    public synchronized void incrementer() { valeur++; }       // verrou sur this
    public synchronized int lire() { return valeur; }           // même verrou : cohérent
}
```

`volatile` garantit la **visibilité** d'un champ entre threads (et un ordre via happens-before), mais **pas l'atomicité** : `volatile int x; x++;` reste une opération en trois étapes, tout aussi cassable qu'avant. Pour un compteur partagé, les classes **atomiques** (`AtomicInteger`, `LongAdder`) offrent des opérations réellement atomiques sans verrou explicite, via `compareAndSet`.

`ReentrantLock` (et son cousin `ReadWriteLock`) offre plus de contrôle que `synchronized` : `tryLock()` avec délai, verrou équitable, interruption possible en attente — au prix de devoir gérer soi-même la libération, **toujours** dans un `finally`.

Le risque à connaître : l'**interblocage** (deadlock), quand deux threads attendent chacun un verrou que l'autre détient. La meilleure parade reste souvent d'éviter le partage mutable : préférer des objets **immuables** ou confinés à un seul thread plutôt que d'ajouter des verrous.

## Détail

### Comment fonctionne synchronized

Chaque objet Java possède un moniteur implicite. `synchronized (obj) { ... }` acquiert ce moniteur avant d'entrer dans le bloc et le libère en le quittant — normalement **ou** par exception, sans code supplémentaire à écrire. Une méthode d'instance `synchronized` équivaut à englober son corps dans `synchronized (this) { ... }` ; une méthode statique `synchronized` verrouille l'objet `Class` correspondant (`MaClasse.class`), partagé par toutes les instances.

### Exemple 1 — Méthode vs bloc, et réentrance

```java
class Stock {
    private int quantite = 0;
    private final Object verrou = new Object();

    public void ajouter(int n) {
        synchronized (verrou) {          // bloc : ne protège que ce qui doit l'être
            quantite += n;
        }
        journaliser(n); // hors du verrou : pas besoin d'exclusion mutuelle ici
    }

    public synchronized void reinitialiser() { // méthode : verrou sur this
        quantite = 0;
        ajouterHistorique(); // synchronized aussi -> réentrance, pas de blocage
    }
    private synchronized void ajouterHistorique() { /* ... */ }
}
```

Utiliser un objet **dédié** comme verrou (`verrou`) plutôt que `this` évite qu'un code externe puisse accidentellement se synchroniser sur le même objet et créer une contention imprévue.

### Exemple 2 — Ce que volatile garantit (et ne garantit pas)

```java
class ConfigurationService {
    private volatile boolean actif = true; // lu par plusieurs threads, écrit par un seul

    public void arreter() { actif = false; }           // écriture visible immédiatement
    public boolean estActif() { return actif; }          // lecture toujours à jour
}
```

Ce motif (drapeau `volatile` à un seul écrivain, plusieurs lecteurs) est le cas d'usage typique de `volatile`. Il échoue dès qu'un champ est **modifié** par plusieurs threads via une opération composée (`compteur++`, `liste.add(x)` sur un champ non thread-safe) : `volatile` n'ajoute alors aucune protection contre l'entrelacement des trois étapes lecture/calcul/écriture.

### Exemple 3 — Classes atomiques

```java
class CompteurVues {
    private final AtomicInteger vues = new AtomicInteger(0);

    public void enregistrerVue() { vues.incrementAndGet(); } // atomique, sans verrou

    public boolean reinitialiserSiDepasse(int seuil) {
        int actuel = vues.get();
        return actuel > seuil && vues.compareAndSet(actuel, 0); // échoue si actuel a changé entretemps
    }
}
```

`compareAndSet` échoue silencieusement (renvoie `false`) si la valeur a changé entre la lecture et l'écriture — au code appelant de décider de réessayer ou non. Pour un compteur à très forte contention (beaucoup de threads qui incrémentent en continu), `LongAdder` est généralement plus performant qu'`AtomicLong` : il répartit les incréments sur plusieurs cases internes pour réduire les collisions entre cœurs, mais `sum()` doit re-agréger ces cases (donc plus coûteux qu'un simple `get()`).

### Exemple 4 — ReentrantLock, tryLock et ReadWriteLock

```java
private final ReentrantLock verrou = new ReentrantLock();

public void miseAJourCritique() {
    verrou.lock();
    try {
        // section critique
    } finally {
        verrou.unlock(); // toujours dans finally
    }
}

public boolean tenterMiseAJour() {
    if (!verrou.tryLock()) {
        return false; // n'attend pas : évite de bloquer indéfiniment
    }
    try {
        // section critique
        return true;
    } finally {
        verrou.unlock();
    }
}
```

```java
private final ReadWriteLock rw = new ReentrantReadWriteLock();

public Produit lire(String id) {
    rw.readLock().lock();
    try { return catalogue.get(id); } finally { rw.readLock().unlock(); }
}

public void ecrire(String id, Produit p) {
    rw.writeLock().lock();
    try { catalogue.put(id, p); } finally { rw.writeLock().unlock(); }
}
```

### synchronized vs ReentrantLock

| | `synchronized` | `ReentrantLock` |
|---|---|---|
| Libération en cas d'exception | Automatique | Manuelle (`finally` obligatoire) |
| Attente avec délai (`tryLock`) | Non | Oui |
| Interruption pendant l'attente | Non | Oui (`lockInterruptibly()`) |
| Verrou équitable (FIFO) | Non | Oui, en option |
| Plusieurs conditions d'attente | Non (un seul `wait`/`notify` implicite) | Oui (plusieurs `Condition`) |
| Simplicité de lecture | Meilleure | Plus verbeux |

Par défaut, `synchronized` reste le bon choix : plus simple, moins d'erreurs possibles. `ReentrantLock` se justifie quand on a besoin de `tryLock`, d'interruption, ou de plusieurs conditions.

### Interblocage, famine, livelock

Un **interblocage** survient quand des threads attendent circulairement les verrous détenus par les autres. Parades : verrouiller toujours dans le **même ordre** (par exemple, trier deux comptes par identifiant avant de les verrouiller), ou utiliser `tryLock()` avec délai pour se désister et réessayer plutôt que d'attendre indéfiniment.

La **famine** (starvation) survient quand un thread n'obtient jamais le verrou parce que d'autres le lui « passent devant » en permanence — un verrou équitable (`new ReentrantLock(true)`) la réduit, au prix d'un débit global plus faible. Le **livelock** est proche du deadlock, mais les threads restent actifs (par exemple, chacun cède poliment la place à l'autre en boucle) sans jamais progresser réellement.

### Pièges courants

> **Croire que volatile rend `x++` atomique.** `volatile` garantit la visibilité, pas l'atomicité d'une opération composée. Pour un compteur partagé, utiliser une classe atomique ou `synchronized`.

> **Oublier `finally` après `lock.lock()`.** Sans lui, une exception dans la section critique laisse le verrou détenu indéfiniment : tous les threads qui l'attendent restent bloqués pour toujours.

> **Verrouiller dans un ordre différent selon les threads.** C'est la cause la plus fréquente d'interblocage. Fixer un ordre global (par exemple, par identifiant croissant) élimine le risque, quel que soit l'ordre des paramètres passés à la méthode.

### À retenir

- `synchronized` assure l'exclusion mutuelle et est réentrant ; verrouiller le moins de code possible réduit la contention.
- `volatile` garantit la visibilité et un ordre (happens-before), jamais l'atomicité d'une opération composée.
- Les classes atomiques (`AtomicInteger`, `LongAdder`) offrent des opérations atomiques sans verrou explicite, via compare-and-swap.
- `ReentrantLock` apporte `tryLock`, l'interruption et l'équité, au prix d'une libération manuelle — toujours dans un `finally`.
- L'interblocage se prévient en fixant un ordre global de verrouillage ; l'immuabilité et le confinement à un seul thread restent les meilleures parades, avant même de penser à ajouter un verrou.
