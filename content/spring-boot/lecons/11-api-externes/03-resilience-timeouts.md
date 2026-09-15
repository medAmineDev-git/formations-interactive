---
id: resilience-timeouts
chapitre: api-externes
ordre: 3
titre: "Timeouts, reprises et résilience"
termes:
  - terme: "Timeout de connexion / Timeout de lecture"
    definition: "Le **timeout de connexion** limite le temps d'attente pour établir la connexion TCP avec le serveur distant. Le **timeout de lecture** limite le temps d'attente entre deux paquets de la réponse, une fois la connexion établie. Les deux doivent être bornés : sans eux, un appel peut rester bloqué **indéfiniment**, en attente d'un serveur distant lent ou injoignable."
  - terme: ClientHttpRequestFactory
    definition: "Interface qui fabrique les requêtes HTTP sous-jacentes utilisées par `RestClient` (et `RestTemplate`). C'est sur elle que se configurent les timeouts, puisque ni `RestClient` ni `RestClient.Builder` n'exposent de méthode `timeout(...)` directement."
  - terme: "SimpleClientHttpRequestFactory / JdkClientHttpRequestFactory"
    definition: "Deux implémentations fournies par Spring. `SimpleClientHttpRequestFactory` s'appuie sur `HttpURLConnection` du JDK et expose `setConnectTimeout(int)` / `setReadTimeout(int)` en millisecondes. `JdkClientHttpRequestFactory` (Spring Framework 6.1+) s'appuie sur `java.net.http.HttpClient` : le timeout de connexion se règle en construisant le `HttpClient` avec `HttpClient.newBuilder().connectTimeout(Duration...)`, le timeout de lecture avec `setReadTimeout(Duration)` sur la factory."
  - terme: "spring-retry / @EnableRetry"
    definition: "Spring Retry est un **projet séparé** de Spring Framework (dépendance `spring-retry`, plus `spring-boot-starter-aop` car il repose sur des proxies AOP). `@EnableRetry`, sur une classe `@Configuration`, active le mécanisme dans l'application."
  - terme: "@Retryable"
    definition: "Posée sur une méthode, relance automatiquement son exécution si elle lève une exception listée. `maxAttempts` fixe le nombre total de tentatives (la première incluse), `backoff` définit le délai entre deux tentatives."
  - terme: "@Backoff"
    definition: "Décrit le délai entre deux tentatives d'un `@Retryable` : `delay` (délai initial en ms), et optionnellement `multiplier` pour un **backoff exponentiel** (le délai est multiplié à chaque nouvel essai) et `maxDelay` pour le plafonner."
  - terme: "@Recover"
    definition: "Méthode appelée quand toutes les tentatives d'un `@Retryable` ont échoué, pour fournir une valeur de repli ou lever une exception métier plutôt que l'exception technique d'origine. Sa signature doit commencer par le type d'exception à récupérer, suivi des mêmes paramètres que la méthode `@Retryable`."
  - terme: "Circuit breaker"
    definition: "Mécanisme qui, après un nombre d'échecs consécutifs vers un service distant, **arrête temporairement** d'essayer de l'appeler (il « ouvre le circuit ») pour ne pas aggraver la situation ni bloquer des threads sur un service déjà en difficulté. Contrairement à une reprise, qui réagit à un échec ponctuel, le circuit breaker réagit à une **tendance**. Vu ici en introduction seulement ; **Resilience4j** est détaillé au niveau avancé."
quiz:
  - question: "Pourquoi faut-il distinguer timeout de connexion et timeout de lecture plutôt que d'en fixer un seul ?"
    choix:
      - "C'est purement une question de nommage, les deux ont le même effet"
      - "Ils protègent contre deux problèmes différents : un serveur injoignable (connexion) et un serveur qui répond trop lentement une fois connecté (lecture)"
      - "Le timeout de connexion ne s'applique qu'aux requêtes GET"
      - "Seul le timeout de lecture est nécessaire, la connexion échoue toujours immédiatement si le serveur est injoignable"
    reponse: 1
    explication: "Un serveur peut être injoignable (réseau, pare-feu, service arrêté) : c'est le timeout de connexion qui protège contre une attente indéfinie dans cette phase. Une fois connecté, un serveur peut être lent à répondre (base de données surchargée côté serveur distant, par exemple) : c'est le timeout de lecture qui borne cette seconde attente, potentiellement plus longue."
  - question: "Cette méthode est retentée après un échec. Combien de tentatives au maximum, et avec quel délai entre elles ?"
    code: |
      @Retryable(
          retryFor = ApiIndisponibleException.class,
          maxAttempts = 4,
          backoff = @Backoff(delay = 500, multiplier = 2)
      )
      public Produit appellerApiExterne(Long id) { ... }
    choix:
      - "4 tentatives, toutes espacées de 500 ms"
      - "4 tentatives au total (1 initiale + 3 reprises), avec des délais de 500 ms, puis 1000 ms, puis 2000 ms"
      - "3 tentatives, avec un délai fixe de 500 ms multiplié par 2 secondes"
      - "Une seule tentative, `maxAttempts` ne s'applique qu'aux erreurs 5xx"
    reponse: 1
    explication: "`maxAttempts = 4` compte l'appel initial. `multiplier = 2` fait doubler le délai à chaque nouvel essai (backoff exponentiel) : 500 ms, puis 1000 ms, puis 2000 ms entre les 4 tentatives."
  - question: "Pour quel type d'appel une reprise automatique (`@Retryable`) est-elle risquée sans précaution particulière ?"
    choix:
      - "Un GET qui récupère un produit par son identifiant"
      - "Un POST qui crée une nouvelle commande, sans mécanisme d'idempotence"
      - "Un GET qui liste les produits d'une catégorie"
      - "Un appel qui échoue avec une erreur réseau transitoire (connexion refusée)"
    reponse: 1
    explication: "Un GET est par nature idempotent : le rejouer ne crée aucun effet de bord. Un POST de création, lui, peut créer plusieurs commandes si la première tentative a en réalité réussi côté serveur mais que la réponse s'est perdue en chemin. Les reprises automatiques doivent être réservées aux opérations idempotentes, ou s'appuyer sur une clé d'idempotence côté serveur."
---

## Essentiel

Un appel réseau peut échouer de façon **transitoire** : un pic de latence, un redémarrage du service distant, une coupure réseau momentanée. Deux réflexes protègent contre ces situations : borner le temps d'attente (**timeouts**), et retenter automatiquement l'appel dans certains cas (**reprises**).

Sans timeout explicite, un appel peut attendre indéfiniment. On les configure via une `ClientHttpRequestFactory` :

```java
@Bean
public RestClient produitApiClient(RestClient.Builder builder) {
    var factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(2_000); // 2 s pour établir la connexion
    factory.setReadTimeout(5_000);    // 5 s pour recevoir la réponse

    return builder
            .baseUrl("https://api.exemple.com")
            .requestFactory(factory)
            .build();
}
```

Pour les reprises, **Spring Retry** (dépendance séparée `spring-retry` + `spring-boot-starter-aop`) évite d'écrire une boucle manuelle :

```java
@Retryable(retryFor = ApiIndisponibleException.class, maxAttempts = 3,
           backoff = @Backoff(delay = 500, multiplier = 2))
public Produit appelerApi(Long id) {
    return restClient.get().uri("/produits/{id}", id).retrieve().body(Produit.class);
}

@Recover
public Produit repli(ApiIndisponibleException e, Long id) {
    return Produit.indisponible(); // valeur de repli après épuisement des tentatives
}
```

Règle importante : ne retenter que des opérations **idempotentes** (rejouables sans effet de bord, comme un GET) et des erreurs **transitoires** (timeout, 5xx, connexion refusée) — jamais une erreur 4xx, qui a peu de chances de disparaître au prochain essai.

## Détail

### Pourquoi c'est utile

Une application qui appelle un service externe hérite de sa fiabilité, sauf si elle s'en protège. Sans timeout, un service distant lent peut immobiliser des threads de l'application appelante jusqu'à épuiser son pool de threads — la lenteur d'un service se propage alors à toute l'application. Sans reprise, une erreur transitoire d'une fraction de seconde remonte inutilement jusqu'à l'utilisateur final.

### Exemple 1 — Timeouts avec `SimpleClientHttpRequestFactory`

```java
SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
factory.setConnectTimeout(2_000); // millisecondes
factory.setReadTimeout(5_000);

RestClient restClient = RestClient.builder()
        .requestFactory(factory)
        .build();
```

`SimpleClientHttpRequestFactory` s'appuie sur `HttpURLConnection`, présent dans le JDK depuis toujours : c'est le choix le plus simple pour un besoin standard.

### Exemple 2 — Timeouts avec `JdkClientHttpRequestFactory`

```java
HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2)) // timeout de connexion : sur le HttpClient
        .build();

JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
factory.setReadTimeout(Duration.ofSeconds(5)); // timeout de lecture : sur la factory

RestClient restClient = RestClient.builder()
        .requestFactory(factory)
        .build();
```

`JdkClientHttpRequestFactory` (Spring Framework 6.1+) s'appuie sur `java.net.http.HttpClient`, le client HTTP du JDK (Java 11+), qui gère HTTP/2 nativement. Le timeout de connexion se configure à la construction du `HttpClient` (il ne peut plus être modifié après), le timeout de lecture directement sur la factory.

### Exemple 3 — Ne retenter que les erreurs transitoires

```java
@Retryable(
        retryFor = { ApiIndisponibleException.class, ResourceAccessException.class },
        noRetryFor = HttpClientErrorException.class, // pas de reprise sur une erreur 4xx
        maxAttempts = 3,
        backoff = @Backoff(delay = 300, multiplier = 2, maxDelay = 3_000)
)
public Produit appelerApi(Long id) {
    return restClient.get().uri("/produits/{id}", id).retrieve().body(Produit.class);
}
```

`retryFor` liste les exceptions qui déclenchent une reprise (typiquement des timeouts ou des erreurs 5xx traduites en exception métier), `noRetryFor` exclut explicitement les erreurs qui ne se résoudront pas en réessayant (un 400 restera un 400). `maxDelay` évite qu'un backoff exponentiel ne finisse par attendre des minutes entières.

### Exemple 4 — Repli avec `@Recover`

```java
@Retryable(retryFor = ApiIndisponibleException.class, maxAttempts = 3)
public List<Avis> recupererAvis(Long produitId) {
    return restClient.get().uri("/avis/{id}", produitId)
            .retrieve()
            .body(new ParameterizedTypeReference<List<Avis>>() {});
}

@Recover
public List<Avis> recupererAvisApresEchec(ApiIndisponibleException e, Long produitId) {
    return List.of(); // page produit affichée sans les avis plutôt qu'une erreur
}
```

`@Recover` reçoit d'abord l'exception, puis les **mêmes paramètres** que la méthode d'origine. Elle permet de dégrader le service (afficher la page sans les avis) plutôt que de faire échouer toute la requête utilisateur pour un service secondaire indisponible.

### Timeout, reprise, circuit breaker : trois protections complémentaires

| | Rôle | Réagit à |
|---|---|---|
| Timeout | Borner l'attente d'un appel | Un appel individuel trop lent |
| Reprise (Spring Retry) | Absorber un échec ponctuel | Une erreur isolée et transitoire |
| Circuit breaker | Arrêter d'appeler un service en difficulté | Une **série** d'échecs, pour éviter d'aggraver la situation |

Les timeouts et les reprises se combinent naturellement : sans timeout, une reprise peut multiplier des attentes déjà longues. Le circuit breaker (Resilience4j, entre autres) va plus loin : après un certain taux d'échecs, il cesse temporairement d'appeler le service défaillant (renvoyant directement une valeur de repli), le temps de lui laisser une chance de se rétablir. Ce mécanisme est détaillé plus loin dans le parcours (niveau avancé).

### Pièges courants

> **Ne configurer aucun timeout.** C'est le piège le plus coûteux en production : sans lui, un service distant qui ne répond plus peut, appel après appel, épuiser le pool de threads de l'application appelante — une panne externe devient alors une panne interne.

> **Retenter un POST non idempotent sans précaution.** Si la première tentative a en réalité réussi côté serveur (mais que la réponse s'est perdue), la relancer peut dupliquer une création. Les API bien conçues exposent une clé d'idempotence pour ce cas ; à défaut, ne pas retenter automatiquement les opérations d'écriture.

> **Un backoff sans `multiplier` ni `maxDelay` sur un service en panne prolongée.** Un délai fixe de 500 ms répété des dizaines de fois ajoute une charge inutile sur un service déjà en difficulté, sans réel bénéfice. Le backoff exponentiel espace les tentatives à mesure qu'elles échouent.

### À retenir

- Toujours configurer un timeout de connexion **et** un timeout de lecture, via une `ClientHttpRequestFactory` passée au `RestClient.Builder`.
- Spring Retry (`spring-retry` + AOP, `@EnableRetry`) évite d'écrire une boucle de reprise à la main.
- `@Retryable` (avec `maxAttempts`, `backoff`) déclenche la reprise ; `@Recover` fournit un repli après épuisement des tentatives.
- Ne retenter que des opérations idempotentes, et seulement sur des erreurs transitoires (jamais une erreur 4xx).
- Le circuit breaker (Resilience4j) complète la reprise pour les pannes prolongées ; il est détaillé au niveau avancé.
