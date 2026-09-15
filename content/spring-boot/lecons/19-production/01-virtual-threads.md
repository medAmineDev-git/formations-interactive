---
id: virtual-threads
chapitre: production
ordre: 1
titre: "Les virtual threads (Java 21)"
termes:
  - terme: Thread plateforme (platform thread)
    definition: "Un thread Java classique, mappé **un pour un** sur un thread du système d'exploitation. Sa pile occupe typiquement plusieurs centaines de Ko à quelques Mo, et sa création passe par un appel système coûteux : une JVM ne peut en maintenir que quelques milliers en parallèle."
  - terme: Thread virtuel (virtual thread)
    definition: "Un thread léger géré par la **JVM** (Java 21, JEP 444), et non par l'OS. Des millions peuvent coexister. Il s'exécute en étant **monté** sur un thread plateforme (son *carrier*) seulement pendant qu'il calcule, et **démonté** dès qu'il bloque sur une opération d'E/S, libérant le carrier pour un autre thread virtuel."
  - terme: Carrier thread
    definition: "Le thread plateforme qui exécute effectivement le code d'un thread virtuel à un instant donné. Les carriers proviennent d'un pool interne géré par la JVM (un `ForkJoinPool` en mode *work-stealing*), dont la taille par défaut vaut le nombre de cœurs disponibles."
  - terme: "spring.threads.virtual.enabled"
    definition: "Propriété (Spring Boot 3.2+, nécessite Java 21) qui bascule sur les threads virtuels les exécuteurs par défaut de l'application : le pool de traitement des requêtes du serveur web embarqué, ainsi que les exécuteurs par défaut de `@Async` et `@Scheduled` quand aucun `Executor`/`TaskScheduler` personnalisé n'est déclaré."
  - terme: Épinglage (pinning)
    definition: "Situation où un thread virtuel **reste attaché** à son carrier pendant un blocage, au lieu d'être démonté. Le carrier ne peut alors servir aucun autre thread virtuel tant que le blocage dure. Cas le plus courant : un bloc ou une méthode `synchronized` qui bloque sur une opération d'E/S."
  - terme: ThreadLocal
    definition: "Mécanisme de stockage par thread. Il reste utilisable avec les threads virtuels, mais un usage massif (un `ThreadLocal` volumineux, par exemple) coûte plus cher : des millions de threads virtuels de courte durée peuvent créer autant de copies. `ScopedValue`, une alternative immuable introduite en aperçu par le JDK, vise à limiter ce coût — encore peu répandue en pratique."
  - terme: "-Djdk.tracePinnedThreads"
    definition: "Option JVM de diagnostic (`=full` ou `=short`) qui affiche la pile d'appel à chaque épinglage détecté, utile pour localiser les blocs `synchronized` problématiques en développement."
quiz:
  - question: "Cette méthode tourne sur un thread virtuel et effectue un appel réseau bloquant de 500 ms. Que se passe-t-il pendant cet appel ?"
    code: |
      public synchronized void reserverStock(Long produitId) {
          reponse = clientHttp.appellerServiceExterne(produitId); // bloquant, ~500 ms
          ...
      }
    choix:
      - "Le thread virtuel est démonté : le carrier thread est libéré pour exécuter d'autres threads virtuels pendant l'attente"
      - "Le thread virtuel reste épinglé à son carrier pendant tout l'appel : le carrier ne peut servir aucun autre thread virtuel durant ce temps"
      - "L'appel réseau est automatiquement transformé en appel asynchrone non bloquant"
      - "Une exception est levée : `synchronized` est interdit sur un thread virtuel"
    reponse: 1
    explication: "Le mot-clé `synchronized` empêche le démontage du thread virtuel (pinning), même si le blocage vient d'une opération d'E/S normalement démontable. Le carrier reste occupé pendant les 500 ms : sous forte charge, cela réduit fortement le nombre de requêtes traitées en parallèle. Le code reste correct, seul l'avantage des threads virtuels disparaît localement."
  - question: "Qu'active concrètement `spring.threads.virtual.enabled=true` (Spring Boot 3.2+, Java 21) ?"
    choix:
      - "Uniquement le pool de threads du serveur web embarqué"
      - "Les threads virtuels pour le serveur web embarqué, ainsi que les exécuteurs par défaut de `@Async` et `@Scheduled`"
      - "Un ramasse-miettes spécifique, optimisé pour les threads virtuels"
      - "Le remplacement automatique de tous les `ThreadLocal` par des `ScopedValue`"
    reponse: 1
    explication: "La propriété bascule les exécuteurs par défaut fournis par Spring Boot — pas seulement le serveur web. Un `Executor` ou `TaskScheduler` défini explicitement par l'application (un `@Bean` personnalisé) n'est pas concerné automatiquement : il continue d'utiliser ce qui a été configuré."
  - question: "Un traitement effectue un calcul CPU intensif (redimensionnement d'image) sur un thread virtuel au lieu d'un thread plateforme classique. Quel gain attendre ?"
    choix:
      - "Un gain important, car les threads virtuels exécutent le code plus vite"
      - "Aucun gain notable : les threads virtuels augmentent la concurrence sur les tâches qui bloquent (E/S), pas la vitesse d'exécution du code CPU-bound"
      - "Un gain proportionnel au nombre de threads virtuels créés"
      - "Une dégradation, car chaque thread virtuel consomme un cœur dédié"
    reponse: 1
    explication: "Les threads virtuels ne rendent pas le CPU plus rapide : un calcul intensif utilise le carrier thread du début à la fin, exactement comme un thread plateforme. Leur intérêt est de permettre à un très grand nombre de tâches **bloquantes** (appels réseau, base de données, fichiers) de progresser sans monopoliser un thread OS coûteux chacune."
---

## Essentiel

Un **thread plateforme** classique coûte cher : pile mémoire de plusieurs centaines de Ko, appel système à la création, quelques milliers possibles au maximum par JVM. C'est la limite structurelle du modèle « un thread par requête » utilisé historiquement par Tomcat : sous forte charge avec des appels bloquants (base de données, appels HTTP), le pool de threads sature avant le CPU.

Un **thread virtuel** (Java 21, JEP 444) est géré par la JVM plutôt que par l'OS. Il est **monté** sur un thread plateforme (le *carrier*) pendant qu'il exécute du code, et **démonté** dès qu'il bloque sur une opération d'E/S — le carrier est alors libre de servir un autre thread virtuel. Des millions de threads virtuels peuvent ainsi coexister.

```yaml
spring:
  threads:
    virtual:
      enabled: true   # Spring Boot 3.2+, nécessite Java 21
```

Cette propriété fait passer le pool de requêtes du serveur web embarqué (et les exécuteurs par défaut de `@Async`/`@Scheduled`) sur des threads virtuels : chaque requête reçoit son propre thread virtuel « jetable », sans les limites de dimensionnement d'un pool classique.

**Ce que les threads virtuels n'apportent pas** : aucun gain sur du calcul CPU-bound (compression, sérialisation lourde, boucles intensives) — là, le nombre de cœurs reste la limite. Leur intérêt est réservé aux charges **I/O-bound** où les threads passent le plus clair de leur temps à attendre.

## Détail

### Pourquoi ça aide les applications I/O-bound

Dans une application classique (thread plateforme par requête), un appel à la base de données ou à un service externe **bloque le thread** pendant toute la durée de l'attente. Avec quelques centaines de threads disponibles dans un pool, la capacité de traitement simultané est plafonnée bien avant que le CPU ne soit saturé — la ressource rare est le nombre de threads, pas la puissance de calcul.

Avec les threads virtuels, un blocage d'E/S **démonte** le thread virtuel de son carrier : le carrier redevient disponible pour un autre thread virtuel pendant l'attente. Le nombre de threads virtuels en cours ne dépend plus du nombre de cœurs mais du nombre de tâches en attente, ce qui peut monter à plusieurs dizaines de milliers sans effondrer la JVM.

### Exemple 1 — Activer les virtual threads pour le serveur web

```yaml
spring:
  threads:
    virtual:
      enabled: true
```

```properties
# équivalent en properties
spring.threads.virtual.enabled=true
```

Sans configuration supplémentaire, Tomcat (ou l'implémentation de serveur utilisée) traite chaque requête sur un thread virtuel dédié plutôt que sur un thread emprunté à un pool borné.

### Exemple 2 — @Async avec les threads virtuels

```java
@Service
public class NotificationService {

    @Async
    public void envoyerEmail(String destinataire) {
        // appel réseau bloquant vers le serveur SMTP
        clientSmtp.envoyer(destinataire);
    }
}
```

Avec `spring.threads.virtual.enabled=true` et aucun `Executor` personnalisé déclaré, cette méthode s'exécute sur un thread virtuel : plus besoin de dimensionner soigneusement `corePoolSize`/`maxPoolSize` pour absorber les pics, puisque chaque appel reçoit son propre thread virtuel jetable.

### Exemple 3 — Détecter un épinglage en développement

```bash
java -Djdk.tracePinnedThreads=full -jar mon-app.jar
```

Cette option affiche, dans les logs, la pile d'appel de chaque épinglage détecté — typiquement un bloc `synchronized` autour d'un appel bloquant. Utile pour auditer du code existant avant de basculer en production.

### Exemple 4 — Remplacer un synchronized problématique

```java
// Avant : épingle le thread virtuel pendant l'appel réseau
public synchronized Reponse appeler(Requete r) {
    return clientHttp.envoyer(r); // bloquant
}

// Après : java.util.concurrent.locks.ReentrantLock ne provoque pas d'épinglage
private final ReentrantLock verrou = new ReentrantLock();

public Reponse appeler(Requete r) {
    verrou.lock();
    try {
        return clientHttp.envoyer(r);
    } finally {
        verrou.unlock();
    }
}
```

Remplacer `synchronized` par un `Lock` explicite (`ReentrantLock`) évite l'épinglage : un thread virtuel qui attend sur un `Lock` peut être démonté normalement. Cette limitation de `synchronized` a été levée à partir du **JDK 24** (JEP 491) : sur un JDK 24 ou plus récent, un thread virtuel bloqué dans un bloc `synchronized` peut être démonté. Sur Java 21, qui reste la version LTS la plus répandue avec Spring Boot 3, le piège est bien réel.

### Threads plateforme vs threads virtuels

| | Thread plateforme | Thread virtuel |
|---|---|---|
| Géré par | le système d'exploitation | la JVM |
| Coût de création | élevé (appel système, pile réservée) | très faible |
| Nombre maximal réaliste | quelques milliers | plusieurs millions |
| Comportement au blocage E/S | reste occupé, ne libère rien | démonté, libère le carrier |
| Gain sur du calcul CPU-bound | — | aucun |
| Sensible à `synchronized` bloquant | non (déjà bloqué de toute façon) | oui (épinglage) |

### Pièges courants

> **Dimensionner le pool de connexions à la base comme avant.** Les threads virtuels lèvent la limite côté application, pas côté ressources externes. Si HikariCP est toujours configuré avec 10 connexions maximum, 10 000 threads virtuels qui tentent d'interroger la base se retrouveront simplement en file d'attente pour obtenir une connexion : le goulot d'étranglement se déplace, il ne disparaît pas.

> **Garder de vieux blocs `synchronized` autour d'appels bloquants.** C'est le piège le plus insidieux : le code fonctionne, aucune erreur n'apparaît, mais l'épinglage annule silencieusement une partie du bénéfice attendu sous charge. `-Djdk.tracePinnedThreads` permet de les repérer avant la mise en production.

> **Réutiliser un pool de threads virtuels à taille fixe « par précaution ».** Un `Executors.newFixedThreadPool(200)` avec des threads virtuels n'a pas de sens : cela réintroduit artificiellement la limite qu'on cherchait à supprimer. Utiliser `Executors.newVirtualThreadPerTaskExecutor()` (un thread virtuel par tâche, sans limite de pool) et laisser les ressources réellement limitées (connexions, appels externes) imposer leur propre contrôle de flux.

### À retenir

- Les threads virtuels aident les charges **I/O-bound** (attente réseau, base de données) en démontant le thread virtuel pendant un blocage ; ils n'accélèrent pas le calcul **CPU-bound**.
- `spring.threads.virtual.enabled=true` (Spring Boot 3.2+, Java 21) bascule le serveur web et les exécuteurs par défaut de `@Async`/`@Scheduled`.
- `synchronized` autour d'un appel bloquant **épingle** le thread virtuel à son carrier : préférer `ReentrantLock` dans le code chaud.
- Les ressources externes limitées (pool de connexions JDBC, quotas d'API) restent le vrai goulot d'étranglement : ne pas oublier de les redimensionner ou de les protéger.
- Ne pas remettre un pool de threads virtuels à taille fixe : `newVirtualThreadPerTaskExecutor()` est fait pour être utilisé sans limite artificielle.
