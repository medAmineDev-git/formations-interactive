---
id: async
chapitre: cache-async
ordre: 2
titre: "Exécuter en arrière-plan avec @Async"
termes:
  - terme: "@EnableAsync"
    definition: "Annotation posée sur une classe `@Configuration` (ou la classe principale) qui active le traitement de `@Async`. Sans elle, `@Async` est **silencieusement ignorée** : la méthode s'exécute normalement, dans le thread appelant."
  - terme: "@Async"
    definition: "Posée sur une méthode, fait exécuter son corps dans un **autre thread**, fourni par un `Executor`. L'appelant récupère la main immédiatement. La méthode doit renvoyer `void`, `Future<T>`, `CompletableFuture<T>` (ou un `ListenableFuture`, obsolète), jamais un type métier direct que l'appelant attendrait de façon synchrone."
  - terme: ThreadPoolTaskExecutor
    definition: "Exécuteur basé sur un pool de threads, utilisé par défaut par `@Async`. Spring Boot en auto-configure un (bean `applicationTaskExecutor`) si aucun `Executor` n'est défini, configurable via les propriétés `spring.task.execution.pool.*` (`core-size`, `max-size`, `queue-capacity`…)."
  - terme: AsyncUncaughtExceptionHandler
    definition: "Interface pour traiter les exceptions levées par une méthode `@Async` qui renvoie `void` : comme l'appelant ne peut récupérer aucun résultat, ces exceptions ne remontent **jamais** à lui. Par défaut, elles sont seulement journalisées (`SimpleAsyncUncaughtExceptionHandler`) ; on peut fournir sa propre implémentation via `AsyncConfigurer`."
  - terme: Propagation du contexte
    definition: "La transaction en cours (liée au thread via `ThreadLocal`) et le contexte de sécurité (`SecurityContextHolder`, par défaut lui aussi lié au thread) **ne suivent pas** l'exécution dans le nouveau thread créé par `@Async`. Une méthode `@Transactional` appelée en asynchrone démarre donc sa **propre** transaction, indépendante de celle de l'appelant."
  - terme: Auto-invocation
    definition: "Comme `@Transactional` et `@Cacheable`, `@Async` repose sur un proxy : un appel interne (`this.methode()`) le contourne, et l'exécution reste **synchrone**, sans erreur ni avertissement."
  - terme: Threads virtuels (`spring.threads.virtual.enabled`)
    definition: "Depuis **Spring Boot 3.2**, avec **Java 21**, la propriété `spring.threads.virtual.enabled=true` fait remplacer les exécuteurs de tâches auto-configurés (dont celui utilisé par `@Async`) par un exécuteur qui crée un **thread virtuel** par tâche plutôt que de puiser dans un pool borné ; les propriétés de taille de pool (`spring.task.execution.pool.*`) n'ont alors plus d'effet."
quiz:
  - question: "Cette méthode `@Async` lève une exception. Que se passe-t-il côté appelant ?"
    code: |
      @Service
      public class NotificationService {

          @Async
          public void envoyerEmail(String destinataire) {
              throw new IllegalStateException("Serveur SMTP indisponible");
          }
      }

      // ailleurs
      notificationService.envoyerEmail("client@exemple.fr");
      System.out.println("Notification lancée");
    choix:
      - "\"Notification lancée\" ne s'affiche pas : l'exception remonte et interrompt l'appelant"
      - "\"Notification lancée\" s'affiche normalement ; l'exception est perdue pour l'appelant, seulement journalisée par défaut"
      - "L'application plante immédiatement"
      - "L'exception est automatiquement retentée trois fois avant d'être journalisée"
    reponse: 1
    explication: "La méthode renvoie `void` : il n'y a aucun objet (`Future`) par lequel une exception pourrait remonter à l'appelant, qui continue son exécution sans rien savoir de l'échec. Par défaut, `SimpleAsyncUncaughtExceptionHandler` journalise l'exception ; un `AsyncUncaughtExceptionHandler` personnalisé (via `AsyncConfigurer`) permet de faire davantage (alerte, compteur de métrique…)."
  - question: "Que renvoie `chercherPrixFournisseur` et comment l'appelant récupère-t-il le résultat sans bloquer ?"
    code: |
      @Async
      public CompletableFuture<BigDecimal> chercherPrixFournisseur(String reference) {
          BigDecimal prix = clientFournisseur.getPrix(reference); // appel lent
          return CompletableFuture.completedFuture(prix);
      }
    choix:
      - "Un `BigDecimal` directement ; l'appel reste bloquant malgré `@Async`"
      - "Un `CompletableFuture<BigDecimal>` ; l'appelant peut enchaîner avec `thenApply`/`thenAccept` ou combiner plusieurs appels sans bloquer"
      - "`void` ; le résultat est perdu"
      - "Un `Optional<BigDecimal>`, résolu de façon synchrone"
    reponse: 1
    explication: "Une méthode `@Async` qui doit renvoyer un résultat exploitable utilise `CompletableFuture<T>` (ou `Future<T>`). L'appelant récupère immédiatement l'objet `CompletableFuture`, sans attendre la fin du traitement, et choisit quand et comment consommer le résultat (`get()` bloquant, ou composition non bloquante avec `thenApply`, `thenCombine`…)."
  - question: "Le pool de threads auto-configuré par Spring Boot pour `@Async` se configure via quelles propriétés ?"
    choix:
      - "`spring.async.pool.*`"
      - "`spring.task.execution.pool.*` (`core-size`, `max-size`, `queue-capacity`…)"
      - "`spring.datasource.pool.*`"
      - "Il n'existe aucune propriété : il faut obligatoirement déclarer un bean `Executor` soi-même"
    reponse: 1
    explication: "Spring Boot auto-configure un `ThreadPoolTaskExecutor` utilisable par `@Async` sans configuration, réglable via `spring.task.execution.pool.core-size`, `max-size`, `queue-capacity`, ainsi que `spring.task.execution.thread-name-prefix`. Un bean `Executor` personnalisé (nommé et référencé via `@Async(\"monExecutor\")`) reste possible pour des besoins spécifiques, mais n'est pas obligatoire."
---

## Essentiel

`@Async` fait exécuter une méthode dans un autre thread : l'appelant récupère la main tout de suite, sans attendre la fin du traitement.

```java
@Configuration
@EnableAsync
public class AsyncConfig { }

@Service
public class NotificationService {

    @Async
    public void envoyerEmail(String destinataire) {
        // traitement lent, exécuté en arrière-plan
    }

    @Async
    public CompletableFuture<Boolean> envoyerEtConfirmer(String destinataire) {
        boolean succes = client.envoyer(destinataire);
        return CompletableFuture.completedFuture(succes);
    }
}
```

Une méthode `@Async` renvoie soit `void` (traitement « et oublie »), soit `CompletableFuture<T>` (ou `Future<T>`) pour transmettre un résultat à l'appelant sans le bloquer.

Points essentiels :

- Sans `Executor` défini, Spring Boot en auto-configure un (`ThreadPoolTaskExecutor`), réglable via `spring.task.execution.pool.*`.
- Une méthode `void` qui lève une exception : l'appelant **ne le sait jamais**. Seule une journalisation par défaut la signale.
- La **transaction** et le **contexte de sécurité** du thread appelant ne suivent pas automatiquement le nouveau thread.
- Comme `@Transactional`, `@Async` repose sur un **proxy** : l'auto-invocation (`this.methode()`) le contourne.

## Détail

### Comment ça marche

Au démarrage, Spring détecte les méthodes `@Async` et enveloppe le bean dans un proxy. Un appel externe passe par ce proxy, qui :

1. Soumet l'exécution du corps de la méthode à un `Executor` (un pool de threads).
2. Renvoie immédiatement la main à l'appelant — avec un `CompletableFuture` déjà créé (complété plus tard) si le type de retour le prévoit, ou immédiatement pour `void`.
3. Exécute le corps de la méthode dans un thread du pool, indépendamment du thread appelant.

### Exemple 1 — Méthode `void`, traitement « et oublie »

```java
@Service
public class AuditService {

    @Async
    public void tracerAction(String utilisateur, String action) {
        journalRepository.save(new EntreeJournal(utilisateur, action));
    }
}
```

Adapté à un traitement dont le résultat n'intéresse personne (journalisation, envoi de notification). Le risque : toute exception ici est perdue pour l'appelant (voir Pièges).

### Exemple 2 — `CompletableFuture` pour transmettre un résultat

```java
@Service
public class TarificationService {

    @Async
    public CompletableFuture<BigDecimal> calculerRemise(Commande commande) {
        BigDecimal remise = moteurRemise.calculer(commande); // traitement lent
        return CompletableFuture.completedFuture(remise);
    }
}

// appelant : lance plusieurs calculs en parallèle
CompletableFuture<BigDecimal> remiseA = service.calculerRemise(commandeA);
CompletableFuture<BigDecimal> remiseB = service.calculerRemise(commandeB);
CompletableFuture.allOf(remiseA, remiseB).join();
```

Chaque appel rend la main immédiatement : les deux calculs s'exécutent en parallèle, et l'appelant choisit quand attendre les résultats (`join()`, `get()`) ou les composer (`thenCombine`…).

### Exemple 3 — Un exécuteur nommé pour un traitement particulier

```java
@Bean(name = "exportExecutor")
public Executor exportExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(4);
    executor.setQueueCapacity(50);
    executor.setThreadNamePrefix("export-");
    executor.initialize();
    return executor;
}

@Async("exportExecutor")
public void genererExport(Long rapportId) { ... }
```

Utile pour isoler un traitement gourmand (export, génération de PDF) du pool par défaut partagé par le reste de l'application, avec ses propres limites de taille et de file d'attente.

### Exemple 4 — Gérer les exceptions d'une méthode `void`

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
            log.error("Échec asynchrone dans {} avec params {}", method, params, ex);
    }
}
```

Sans cette configuration, l'exception d'une méthode `void` est journalisée par le gestionnaire par défaut, sans plus de contexte métier ni possibilité d'alerte spécifique.

### fixedRate vs propriétés du pool par défaut

| Propriété | Rôle |
|---|---|
| `spring.task.execution.pool.core-size` | Nombre de threads maintenus en permanence |
| `spring.task.execution.pool.max-size` | Nombre maximal de threads en cas de forte charge |
| `spring.task.execution.pool.queue-capacity` | Taille de la file d'attente avant de créer des threads au-delà de `core-size` |
| `spring.task.execution.thread-name-prefix` | Préfixe des noms de threads (utile dans les logs) |
| `spring.threads.virtual.enabled` | Remplace ce pool par un exécuteur à threads virtuels (Java 21, Spring Boot 3.2+) |

### Pièges courants

> **Auto-invocation.** `this.envoyerEmail(...)` (ou un appel depuis une autre méthode du même bean) ne passe pas par le proxy : la méthode s'exécute **de façon synchrone**, sans passer en arrière-plan, sans erreur ni avertissement.

> **Exceptions perdues pour les méthodes `void`.** Sans `AsyncUncaughtExceptionHandler` personnalisé, un échec dans une méthode `void` `@Async` n'est visible que dans les logs, jamais remonté à l'appelant. Préférer `CompletableFuture<T>` dès que l'échec doit être détecté ou traité par l'appelant.

> **Compter sur la transaction ou le contexte de sécurité de l'appelant.** Le thread asynchrone n'hérite ni de la transaction en cours (une méthode `@Transactional` appelée en asynchrone ouvre sa propre transaction, sur une connexion différente) ni du `SecurityContextHolder` par défaut (stratégie `ThreadLocal`, non héritée). Si l'utilisateur authentifié doit être connu dans le traitement asynchrone, il faut le transmettre explicitement en paramètre, ou reconfigurer la stratégie de propagation du contexte de sécurité.

### À retenir

- `@Async` exécute une méthode dans un autre thread ; retour `void` (résultat non récupérable) ou `CompletableFuture<T>` (résultat récupérable sans bloquer).
- Spring Boot auto-configure un pool (`spring.task.execution.pool.*`) ; un exécuteur nommé isole un traitement particulier.
- Les exceptions d'une méthode `void` sont perdues pour l'appelant : journalisées par défaut, personnalisables via `AsyncConfigurer`.
- Transaction et contexte de sécurité ne suivent pas automatiquement le nouveau thread.
- Depuis Spring Boot 3.2 / Java 21, `spring.threads.virtual.enabled=true` remplace le pool borné par des threads virtuels créés à la demande.
