---
id: resilience4j
chapitre: microservices
ordre: 4
titre: "Résilience : circuit breaker, retry et bulkhead"
termes:
  - terme: Panne en cascade
    definition: "Quand un service en aval devient lent ou indisponible, les appelants qui attendent sa réponse accumulent des requêtes en attente, épuisent leurs propres ressources (threads, connexions) et deviennent à leur tour indisponibles pour leurs propres appelants. Sans protection, la panne d'un seul service se propage à tout le système."
  - terme: "@CircuitBreaker"
    definition: "Annotation Resilience4j qui enveloppe un appel : au-delà d'un taux d'échec configuré, elle **coupe le circuit** (état OPEN) et bascule immédiatement vers une méthode de repli, sans même tenter l'appel, pendant une durée configurée."
  - terme: "États CLOSED, OPEN, HALF_OPEN"
    definition: "**CLOSED** : les appels passent normalement, les échecs sont comptabilisés. **OPEN** : les appels sont immédiatement rejetés (repli direct), aucun appel réel n'est tenté. **HALF_OPEN** : après le délai d'attente, un nombre limité d'appels est autorisé à titre de test ; leur résultat décide de revenir à CLOSED ou de rouvrir OPEN."
  - terme: Méthode de repli (fallbackMethod)
    definition: "Méthode appelée à la place de l'appel protégé quand celui-ci échoue ou que le circuit est ouvert. Signature attendue : **mêmes paramètres** que la méthode d'origine, avec en dernier paramètre optionnel un `Throwable` (ou un type plus précis), et le **même type de retour**."
  - terme: "@Retry"
    definition: "Réexécute automatiquement un appel qui a échoué, jusqu'à un nombre maximal de tentatives, avec un délai entre chaque tentative (fixe ou avec attente exponentielle)."
  - terme: "@Bulkhead"
    definition: "Limite le nombre d'appels **concurrents** vers une dépendance, pour qu'une dépendance lente n'épuise pas toutes les ressources (threads) disponibles au détriment des autres. Deux implémentations : `SEMAPHORE` (limite un compteur d'appels concurrents) et `THREADPOOL` (isole les appels dans un pool de threads dédié)."
  - terme: "@RateLimiter"
    definition: "Limite le nombre d'appels autorisés par unité de temps, indépendamment des échecs — utile pour respecter la limite imposée par une API externe, par exemple."
  - terme: "@TimeLimiter"
    definition: "Impose une durée maximale à un appel asynchrone (méthode renvoyant un `CompletableFuture`, ou un type réactif avec le module d'intégration Reactor) : au-delà, l'appel est considéré en échec, sans attendre indéfiniment."
quiz:
  - question: "Un circuit breaker Resilience4j passe de CLOSED à OPEN. Que se passe-t-il pour les appels suivants ?"
    choix:
      - "Ils sont tentés normalement, mais avec un délai supplémentaire"
      - "Ils sont immédiatement rejetés (repli direct), sans même essayer d'appeler le service en aval, jusqu'à la fin du délai d'attente configuré"
      - "Ils sont mis en file d'attente jusqu'à ce que le service en aval réponde"
      - "Un seul appel sur deux est tenté, les autres sont rejetés"
    reponse: 1
    explication: "En état OPEN, Resilience4j n'appelle plus du tout le service protégé : il bascule directement vers la méthode de repli. C'est le but du circuit breaker — éviter de continuer à solliciter (et attendre) un service déjà en difficulté. Après waitDurationInOpenState, le circuit passe en HALF_OPEN pour tester si le service s'est rétabli."
  - question: "Quelle méthode de repli correspond correctement à cet appel protégé ?"
    code: |
      @CircuitBreaker(name = "catalogue", fallbackMethod = "produitParDefaut")
      public Produit recupererProduit(Long id) {
          return catalogueClient.get().uri("/produits/{id}", id).retrieve().body(Produit.class);
      }
    choix:
      - "public Produit produitParDefaut() { ... }"
      - "public Produit produitParDefaut(Long id, Throwable t) { ... }"
      - "public String produitParDefaut(Long id, Throwable t) { ... }"
      - "public Produit produitParDefaut(Throwable t, Long id) { ... }"
    reponse: 1
    explication: "La méthode de repli doit reproduire les paramètres de la méthode d'origine (ici Long id), suivis d'un Throwable en dernière position, et renvoyer le même type (Produit). Une signature sans le paramètre id, avec un type de retour différent, ou avec l'ordre des paramètres inversé, ne sera pas reconnue par Resilience4j comme méthode de repli valide pour cette méthode."
  - question: "Pourquoi combiner @Retry et @CircuitBreaker demande-t-il de faire attention à l'ordre d'application des aspects ?"
    choix:
      - "Parce que les deux annotations sont incompatibles et ne peuvent jamais être utilisées ensemble"
      - "Parce que si Retry s'exécute à l'intérieur de CircuitBreaker, un circuit déjà ouvert empêche toute nouvelle tentative ; s'il s'exécute à l'extérieur, chaque tentative de Retry est comptée séparément par le circuit breaker"
      - "Parce que l'ordre n'a aucune incidence sur le comportement observé"
      - "Parce que Retry doit toujours être configuré avec un délai plus long que le circuit breaker"
    reponse: 1
    explication: "L'ordre des décorateurs change le comportement réel : avec Retry à l'extérieur du CircuitBreaker (l'ordre par défaut documenté par Resilience4j), chaque nouvelle tentative de Retry est un nouvel appel décoré par le CircuitBreaker, donc comptabilisée dans son taux d'échec — un Retry agressif peut ouvrir le circuit plus vite. Avec l'ordre inversé, un circuit déjà OPEN court-circuiterait immédiatement toutes les tentatives de Retry restantes."
---

## Essentiel

Dans un système de microservices, un service lent ou indisponible peut provoquer une **panne en cascade** : ses appelants attendent, épuisent leurs propres ressources, et deviennent à leur tour indisponibles. Resilience4j (avec le starter `io.github.resilience4j:resilience4j-spring-boot3`) protège les appels entre services avec des annotations posées sur les méthodes.

Le plus utilisé est le **circuit breaker**, à trois états : **CLOSED** (normal), **OPEN** (appels coupés, repli immédiat) et **HALF_OPEN** (test progressif du rétablissement).

```java
@Service
public class CatalogueClientService {

    @CircuitBreaker(name = "catalogue", fallbackMethod = "produitParDefaut")
    public Produit recupererProduit(Long id) {
        return catalogueClient.get().uri("/produits/{id}", id).retrieve().body(Produit.class);
    }

    private Produit produitParDefaut(Long id, Throwable t) {
        return Produit.indisponible(id);
    }
}
```

```yaml
resilience4j:
  circuitbreaker:
    instances:
      catalogue:
        failure-rate-threshold: 50          # % d'échecs qui ouvre le circuit
        sliding-window-size: 10             # nombre d'appels observés
        wait-duration-in-open-state: 10s    # avant de tester à nouveau
        permitted-number-of-calls-in-half-open-state: 3
```

La méthode de repli doit avoir **les mêmes paramètres**, plus un `Throwable` en dernier, et **le même type de retour**. D'autres annotations complètent le circuit breaker : `@Retry`, `@Bulkhead`, `@RateLimiter`, `@TimeLimiter` — chacune protège contre un problème différent, et leur **ordre d'application** compte.

## Détail

### Comment le circuit breaker décide d'ouvrir le circuit

```yaml
resilience4j:
  circuitbreaker:
    instances:
      catalogue:
        sliding-window-type: COUNT_BASED   # ou TIME_BASED
        sliding-window-size: 10
        minimum-number-of-calls: 5         # pas de décision avant ce minimum d'appels
        failure-rate-threshold: 50
        slow-call-duration-threshold: 2s   # un appel « lent » compte aussi comme un échec potentiel
        slow-call-rate-threshold: 100
        wait-duration-in-open-state: 10s
```

Sur une fenêtre glissante des `sliding-window-size` derniers appels (ou des appels des N dernières secondes, en mode `TIME_BASED`), si le taux d'échec (ou d'appels trop lents) dépasse le seuil, une fois le nombre minimal d'appels observés atteint, le circuit passe à OPEN.

### Exemple 1 — @Retry, avec attente entre les tentatives

```java
@Retry(name = "catalogue", fallbackMethod = "produitParDefaut")
public Produit recupererProduit(Long id) { ... }
```

```yaml
resilience4j:
  retry:
    instances:
      catalogue:
        max-attempts: 3
        wait-duration: 500ms
        retry-exceptions:
          - java.io.IOException
        ignore-exceptions:
          - com.boutique.ProduitIntrouvableException
```

`retry-exceptions` et `ignore-exceptions` évitent de réessayer une erreur qui ne se résoudra jamais toute seule (une ressource inexistante, par exemple) : seules les erreurs vraiment transitoires (réseau, timeout) méritent une nouvelle tentative.

### Exemple 2 — @Bulkhead pour isoler une dépendance lente

```java
@Bulkhead(name = "catalogue", type = Bulkhead.Type.THREADPOOL, fallbackMethod = "produitParDefaut")
public CompletableFuture<Produit> recupererProduitAsync(Long id) { ... }
```

```yaml
resilience4j:
  thread-pool-bulkhead:
    instances:
      catalogue:
        max-thread-pool-size: 10
        core-thread-pool-size: 5
        queue-capacity: 20
  bulkhead: # type SEMAPHORE (par défaut)
    instances:
      commandes:
        max-concurrent-calls: 20
```

Le type `THREADPOOL` isole les appels dans un pool dédié : une dépendance qui devient lente sature **son** pool, sans consommer les threads utilisés pour le reste de l'application. Le type `SEMAPHORE` (par défaut) est plus léger : il limite simplement le nombre d'appels concurrents sur le thread appelant, sans pool séparé.

### Exemple 3 — @RateLimiter et @TimeLimiter

```java
@RateLimiter(name = "catalogue")
public Produit rechercherProduit(String motCle) { ... }

@TimeLimiter(name = "catalogue", fallbackMethod = "produitParDefautAsync")
public CompletableFuture<Produit> recupererProduitAvecDelai(Long id) {
    return CompletableFuture.supplyAsync(() -> recupererProduit(id));
}
```

```yaml
resilience4j:
  ratelimiter:
    instances:
      catalogue:
        limit-for-period: 20     # appels autorisés
        limit-refresh-period: 1s # par période
        timeout-duration: 0
  timelimiter:
    instances:
      catalogue:
        timeout-duration: 2s
```

`@TimeLimiter` ne s'applique qu'à des méthodes **asynchrones** (`CompletableFuture`, ou un type réactif avec le module d'intégration adapté) : il ne peut pas imposer de délai sur un appel synchrone bloquant.

### L'ordre d'application des aspects

Quand plusieurs annotations décorent la même méthode, Resilience4j les applique comme des décorateurs imbriqués. L'ordre par défaut documenté, du plus extérieur au plus intérieur, est : **Retry → CircuitBreaker → RateLimiter → TimeLimiter → Bulkhead**. Chaque aspect expose une propriété d'ordre (par exemple `resilience4j.retry.retry-aspect-order`) pour le personnaliser si besoin.

Ce détail a un effet réel : avec Retry à l'extérieur du CircuitBreaker, chaque tentative de Retry est un nouvel appel décoré par le circuit breaker, donc comptée dans son taux d'échec — un Retry agressif peut faire ouvrir le circuit plus vite qu'attendu. Avec l'ordre inversé, un circuit déjà OPEN court-circuiterait immédiatement toutes les tentatives de Retry restantes, sans jamais les exécuter.

### Observer l'état via Actuator

Avec `spring-boot-starter-actuator` (et Micrometer sur le classpath), Resilience4j expose l'état et les métriques de ses instances : des endpoints dédiés listent l'état courant des circuit breakers et leurs derniers événements (transitions d'état, appels rejetés), et des métriques standard (nombre d'appels par résultat, état du circuit) sont disponibles via `/actuator/metrics` et exportables vers Prometheus. C'est la première chose à vérifier en cas de comportement inattendu : un circuit resté ouvert plus longtemps que prévu, ou un taux d'échec qui ne correspond pas à ce qui est observé côté application.

### Pièges courants

> **Configurer un `@CircuitBreaker` sans méthode de repli adaptée.** Sans `fallbackMethod`, une exception continue de remonter à l'appelant une fois le circuit ouvert — le circuit breaker protège la dépendance, mais pas automatiquement l'utilisateur final. Une méthode de repli qui renvoie une erreur générique vaut souvent mieux qu'une absence de repli.

> **Réessayer une erreur qui ne se résoudra jamais.** `@Retry` sans `ignore-exceptions` bien choisi peut retenter trois fois une erreur métier définitive (ressource inexistante, requête invalide), en ajoutant simplement de la latence sans aucune chance de succès.

> **Oublier que `@TimeLimiter` exige une méthode asynchrone.** Le poser sur une méthode qui renvoie directement un objet (pas un `CompletableFuture`) n'a pas l'effet attendu : il n'y a rien à interrompre, l'appel bloquant continue de bloquer le thread appelant jusqu'à son terme.

### À retenir

- Circuit breaker : CLOSED (normal) → OPEN (repli immédiat, aucun appel réel) → HALF_OPEN (test progressif) → retour à CLOSED ou OPEN.
- La méthode de repli reprend les paramètres d'origine, ajoute un `Throwable` en dernier, et renvoie le même type.
- `@Retry` pour les erreurs transitoires, `@Bulkhead` pour isoler la concurrence, `@RateLimiter` pour respecter un débit, `@TimeLimiter` pour borner un appel asynchrone.
- L'ordre des aspects (Retry, CircuitBreaker, RateLimiter, TimeLimiter, Bulkhead par défaut) change réellement le comportement combiné — à vérifier plutôt qu'à supposer.
- Actuator et Micrometer exposent l'état et les métriques de chaque instance : premier réflexe en cas de comportement inattendu.
