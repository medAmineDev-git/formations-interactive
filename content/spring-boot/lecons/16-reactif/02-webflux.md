---
id: webflux
chapitre: reactif
ordre: 2
titre: "Spring WebFlux : contrôleurs réactifs"
termes:
  - terme: spring-boot-starter-webflux
    definition: "Starter qui embarque Spring WebFlux et, par défaut, **Netty** comme serveur embarqué (au lieu de Tomcat pour `spring-boot-starter-web`). Netty est asynchrone et non bloquant par nature, ce qui en fait le complément naturel de WebFlux."
  - terme: Contrôleur annoté réactif
    definition: "Un `@RestController` classique dont les méthodes renvoient `Mono<T>` ou `Flux<T>` au lieu de `T` ou `List<T>`. Spring WebFlux s'abonne lui-même au résultat : le développeur ne fait jamais `block()` ni `subscribe()` dans le contrôleur."
  - terme: "RouterFunction / HandlerFunction"
    definition: "Style **fonctionnel** de routage, alternative aux annotations : un `RouterFunction` associe des routes (méthode HTTP, chemin) à des `HandlerFunction`, des méthodes qui reçoivent une `ServerRequest` et renvoient un `Mono<ServerResponse>`."
  - terme: WebClient
    definition: "Client HTTP réactif et non bloquant de Spring, successeur de `RestTemplate` (désormais en mode maintenance). Chaque appel renvoie un `Mono<T>` ou `Flux<T>` qui ne déclenche la requête qu'à l'abonnement."
  - terme: Server-Sent Events (SSE)
    definition: "Protocole HTTP simple pour un flux d'événements du serveur vers le client, dans un sens (contrairement aux WebSockets). Un contrôleur WebFlux qui renvoie un `Flux<T>` avec `MediaType.TEXT_EVENT_STREAM_VALUE` produit un flux SSE nativement."
  - terme: Event loop
    definition: "Petit nombre de threads (généralement autant que de cœurs CPU) qui traitent toutes les requêtes de Netty en les enchaînant sans jamais attendre bloquant sur elles. Un appel bloquant exécuté sur ce thread gèle toutes les requêtes qu'il gère en parallèle."
  - terme: "Netty vs Tomcat"
    definition: "Tomcat (utilisé par Spring MVC) alloue un thread par requête et bloque dessus pendant les I/O. Netty (utilisé par WebFlux) traite les requêtes sur un petit pool de threads non bloquants, orchestré autour d'une boucle d'événements."
quiz:
  - question: "Un projet a `spring-boot-starter-web` **et** `spring-boot-starter-webflux` dans son `pom.xml`. Quel serveur Spring Boot démarre-t-il ?"
    choix:
      - "WebFlux sur Netty, car il est prioritaire"
      - "Spring MVC sur Tomcat : en présence des deux starters, Spring Boot choisit le mode servlet"
      - "Le démarrage échoue avec une erreur de configuration ambiguë"
      - "Les deux serveurs démarrent en parallèle, sur des ports différents"
    reponse: 1
    explication: "Quand les deux starters sont présents, l'auto-configuration de Spring Boot privilégie Spring MVC (mode servlet), en partant du principe que WebFlux a été ajouté involontairement (par exemple via `WebClient`, présent dans le starter WebFlux mais utilisable seul). Pour forcer WebFlux, il faut retirer `spring-boot-starter-web` ou positionner explicitement `spring.main.web-application-type=reactive`."
  - question: "Pourquoi ce code de contrôleur WebFlux est-il problématique ?"
    code: |
      @GetMapping("/produits/{id}")
      public Mono<Produit> getProduit(@PathVariable Long id) {
          Produit produit = magasinLegacy.chargerBloquant(id); // appel JDBC, 50 ms
          return Mono.just(produit);
      }
    choix:
      - "`Mono.just()` n'accepte pas d'objet déjà construit"
      - "L'appel bloquant s'exécute directement sur le thread de l'event loop Netty avant même la création du Mono"
      - "Le code ne compile pas car `@PathVariable` n'existe pas en WebFlux"
      - "Rien : `Mono.just()` rend automatiquement l'appel non bloquant"
    reponse: 1
    explication: "`magasinLegacy.chargerBloquant(id)` s'exécute avant la construction du `Mono`, donc sur le thread appelant — un des quelques threads de l'event loop. Sous charge, ces 50 ms bloquantes répétées épuisent rapidement la capacité du serveur. Il faudrait au minimum `Mono.fromCallable(() -> magasinLegacy.chargerBloquant(id)).subscribeOn(Schedulers.boundedElastic())`, ou idéalement un accès réactif de bout en bout."
  - question: "Quelle annotation ou quel réglage permet à un endpoint WebFlux de produire un flux Server-Sent Events ?"
    choix:
      - "`@GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)` sur une méthode qui renvoie un `Flux<T>`"
      - "`@EnableSse` sur la classe de configuration"
      - "Il faut obligatoirement passer par un `RouterFunction`, les contrôleurs annotés ne supportent pas SSE"
      - "`@Async` combiné à `@GetMapping`"
    reponse: 0
    explication: "Un contrôleur annoté renvoyant un `Flux<T>` avec `produces = MediaType.TEXT_EVENT_STREAM_VALUE` (ou `\"text/event-stream\"`) produit nativement un flux SSE : chaque élément émis par le `Flux` est poussé au client au fur et à mesure. Le style fonctionnel le permet aussi, mais ce n'est pas une obligation."
---

## Essentiel

**Spring WebFlux** est l'équivalent réactif de Spring MVC. Il s'active avec `spring-boot-starter-webflux`, qui embarque **Netty** comme serveur par défaut (au lieu de Tomcat). Les contrôleurs s'écrivent avec les mêmes annotations que Spring MVC, mais renvoient `Mono`/`Flux` :

```java
@RestController
@RequestMapping("/commandes")
public class CommandeController {

    private final CommandeRepository repository;

    public CommandeController(CommandeRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/{id}")
    public Mono<Commande> parId(@PathVariable Long id) {
        return repository.findById(id);
    }

    @GetMapping
    public Flux<Commande> toutes() {
        return repository.findAll();
    }
}
```

WebFlux s'abonne lui-même au `Mono`/`Flux` renvoyé : le développeur n'appelle jamais `subscribe()` ni `block()` dans un contrôleur. Il existe aussi un style **fonctionnel**, avec des `RouterFunction`, comme alternative aux annotations.

Pour appeler une API externe de façon réactive, `WebClient` remplace `RestTemplate` (en mode maintenance depuis Spring 5) :

```java
Mono<Produit> produit = webClient.get()
        .uri("/produits/{id}", id)
        .retrieve()
        .bodyToMono(Produit.class);
```

Règle d'or : ne **jamais bloquer** le thread de l'event loop Netty — un appel JDBC classique, un `Thread.sleep()` ou un `block()` dedans dégrade toute l'application sous charge.

## Détail

### Comment Spring Boot choisit le mode servlet ou réactif

Au démarrage, Spring Boot regarde les dépendances présentes pour choisir le type d'application web (`spring.main.web-application-type`) :

- Seulement `spring-boot-starter-web` → mode **servlet** (Tomcat, Spring MVC).
- Seulement `spring-boot-starter-webflux` → mode **reactive** (Netty, WebFlux).
- **Les deux présents** → mode **servlet** par défaut. C'est un cas fréquent car `WebClient` est fourni par le starter WebFlux et peut être ajouté à un projet MVC juste pour ce client, sans intention de basculer en réactif.

On peut forcer le mode explicitement :

```properties
spring.main.web-application-type=reactive
```

### Exemple 1 — Endpoints fonctionnels avec RouterFunction

```java
@Configuration
public class RoutesCommande {

    @Bean
    public RouterFunction<ServerResponse> routes(CommandeHandler handler) {
        return RouterFunctions.route()
                .GET("/commandes/{id}", handler::parId)
                .GET("/commandes", handler::toutes)
                .POST("/commandes", handler::creer)
                .build();
    }
}

@Component
public class CommandeHandler {

    private final CommandeRepository repository;

    public CommandeHandler(CommandeRepository repository) {
        this.repository = repository;
    }

    public Mono<ServerResponse> parId(ServerRequest requete) {
        Long id = Long.valueOf(requete.pathVariable("id"));
        return repository.findById(id)
                .flatMap(commande -> ServerResponse.ok().bodyValue(commande))
                .switchIfEmpty(ServerResponse.notFound().build());
    }

    public Mono<ServerResponse> toutes(ServerRequest requete) {
        return ServerResponse.ok().body(repository.findAll(), Commande.class);
    }
}
```

Le style fonctionnel sépare explicitement le routage (`RouterFunction`) de la logique (`HandlerFunction`), sans magie d'annotations : plus verbeux, mais le flux d'exécution est entièrement lisible dans le code.

### Exemple 2 — WebClient, au-delà du cas simple

```java
@Bean
public WebClient webClientProduits(WebClient.Builder builder) {
    return builder
            .baseUrl("https://api.exemple.com")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
}

public Mono<Produit> recupererProduit(Long id) {
    return webClient.get()
            .uri("/produits/{id}", id)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError,
                      response -> Mono.error(new ProduitIntrouvableException(id)))
            .bodyToMono(Produit.class)
            .timeout(Duration.ofSeconds(3));
}
```

`WebClient` est lui-même construit de façon paresseuse : aucune requête HTTP ne part tant que le `Mono` renvoyé n'est pas consommé — par un contrôleur WebFlux, un `subscribe()` explicite, ou un `block()` en dehors du contexte réactif.

### Exemple 3 — Streaming avec Server-Sent Events

```java
@GetMapping(value = "/notifications", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<Notification> flux() {
    return notificationService.ecouter() // Flux infini, alimenté par un système d'événements
            .doOnCancel(() -> log.info("Client déconnecté du flux de notifications"));
}
```

Le client HTTP (navigateur ou un autre `WebClient`) reçoit chaque élément dès qu'il est émis, sans attendre la fin du flux — utile pour des notifications, une barre de progression ou tout flux long. `Flux.interval(Duration)` combiné à un autre `Flux` permet aussi de construire un flux de démonstration à intervalle régulier.

### MVC vs WebFlux, en un coup d'œil

| | Spring MVC | Spring WebFlux |
|---|---|---|
| Serveur par défaut | Tomcat | Netty |
| Modèle de threads | Un thread par requête, bloquant | Peu de threads, event loop, non bloquant |
| Type de retour | `T`, `ResponseEntity<T>`, `List<T>` | `Mono<T>`, `Flux<T>` |
| Client HTTP | `RestTemplate` (maintenance), `RestClient` | `WebClient` |
| Accès aux données | JDBC, JPA (bloquants) | R2DBC (réactif) |
| Style de routage | Annotations (`@GetMapping`…) | Annotations, ou fonctionnel (`RouterFunction`) |

### Pièges courants

> **Les deux starters (web et webflux) dans le même projet.** Spring Boot démarre alors en mode servlet, silencieusement — pas d'erreur, mais les contrôleurs `Mono`/`Flux` tournent quand même sur Tomcat, sans le bénéfice de Netty. Symptôme typique : confusion sur pourquoi « WebFlux » ne semble apporter aucun gain de performance.

> **Bloquer dans un `flatMap` ou un `map`.** Une lambda passée à un opérateur Reactor s'exécute sur le thread courant de la chaîne, potentiellement l'event loop. Un appel JDBC, un `Thread.sleep()`, ou même un simple accès disque synchrone y sont tout aussi problématiques que dans le corps direct du contrôleur.

> **Mélanger accès de données bloquant et réactif sans le savoir.** Une dépendance transitive vers `spring-boot-starter-data-jpa` dans un projet WebFlux fonctionne (JPA n'a pas connaissance de Reactor), mais chaque appel repository bloque l'event loop. Aucune erreur au démarrage ; seulement une dégradation de performance sous charge, difficile à diagnostiquer sans profiler les threads.

### À retenir

- `spring-boot-starter-webflux` : Netty par défaut, contrôleurs qui renvoient `Mono`/`Flux`.
- Web + WebFlux ensemble → Spring Boot choisit le mode servlet par défaut.
- `RouterFunction`/`HandlerFunction` : style fonctionnel, alternative aux annotations.
- `WebClient` remplace `RestTemplate` (maintenance) pour les appels HTTP réactifs.
- Un `Flux<T>` avec `produces = "text/event-stream"` diffuse du Server-Sent Events nativement.
- Aucun appel bloquant sur le thread de l'event loop, sous peine de dégrader toute l'application.
