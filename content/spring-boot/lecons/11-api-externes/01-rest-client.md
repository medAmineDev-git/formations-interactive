---
id: rest-client
chapitre: api-externes
ordre: 1
titre: "Appeler une API avec RestClient"
termes:
  - terme: RestClient
    definition: "Client HTTP synchrone introduit dans **Spring Framework 6.1** (Spring Boot 3.2). Il propose une API fluide inspirée de `WebClient`, mais bloquante : pas besoin de Project Reactor ni de `spring-webflux`."
  - terme: "RestClient.Builder"
    definition: "Bean **auto-configuré par Spring Boot** (depuis 3.2) : il suffit de l'injecter et d'appeler `.build()` pour obtenir un `RestClient` déjà relié aux convertisseurs JSON de l'application. Il est fourni en scope **prototype** : chaque injection reçoit une nouvelle instance de builder, pour éviter qu'une personnalisation (URL de base, en-têtes) faite à un endroit ne se propage ailleurs."
  - terme: retrieve()
    definition: "Déclenche l'appel HTTP et donne accès à la réponse : `.body(Class)` pour récupérer directement le corps désérialisé, ou `.toEntity(Class)` pour obtenir un `ResponseEntity` complet (statut, en-têtes, corps)."
  - terme: ParameterizedTypeReference
    definition: "Permet de décrire un type générique (ex. `List<Produit>`) là où une simple `Class` ne le peut pas, à cause de l'effacement de type (*type erasure*) en Java : `new ParameterizedTypeReference<List<Produit>>() {}`."
  - terme: "HttpClientErrorException / HttpServerErrorException"
    definition: "Exceptions levées **par défaut** par `retrieve()` quand la réponse a un code 4xx ou 5xx : `HttpClientErrorException` pour les erreurs client, `HttpServerErrorException` pour les erreurs serveur. Toutes deux héritent de `RestClientResponseException`, qui donne accès au statut et au corps de la réponse d'erreur."
  - terme: onStatus
    definition: "Méthode de `retrieve()` pour personnaliser la réaction à un statut donné, par exemple transformer une erreur 404 en exception métier plutôt que de laisser passer l'exception par défaut."
  - terme: "@HttpExchange"
    definition: "Annotation qui permet de décrire un client HTTP comme une simple **interface** (`@GetExchange`, `@PostExchange`…), sans écrire l'appel à la main. Spring génère l'implémentation via un `HttpServiceProxyFactory` adossé à un `RestClient` (ou un `WebClient`)."
  - terme: "RestTemplate / WebClient"
    definition: "`RestTemplate` est l'ancien client HTTP synchrone de Spring, en **mode maintenance** depuis Spring 5 : il continue de fonctionner mais ne reçoit plus de nouvelles fonctionnalités. `WebClient` est le client **réactif** (non bloquant, basé sur Project Reactor), utile dans une chaîne d'appels réactive ou à haute concurrence."
quiz:
  - question: "Que renvoie cet appel si l'API répond avec le JSON `[{\"id\":1,\"nom\":\"Clavier\"}]` ?"
    code: |
      List<Produit> produits = restClient.get()
              .uri("/produits")
              .retrieve()
              .body(new ParameterizedTypeReference<List<Produit>>() {});
    choix:
      - "Une erreur de compilation : `body()` n'accepte qu'une `Class`"
      - "Une `List<Produit>` correctement désérialisée"
      - "Un tableau `Produit[]`, à convertir ensuite en liste"
      - "`null`, car `retrieve()` ne fonctionne pas avec des listes"
    reponse: 1
    explication: "`ParameterizedTypeReference` décrit le type générique complet (`List<Produit>`), ce que `Class<Produit>` ne peut pas exprimer à cause de l'effacement de type. `body()` désérialise alors correctement la liste."
  - question: "Un appel `restClient.get().uri(\"/produits/999\").retrieve().body(Produit.class)` reçoit une réponse 404 Not Found. Que se passe-t-il, sans configuration particulière ?"
    choix:
      - "La méthode renvoie `null`"
      - "Une `HttpClientErrorException` (ou sa sous-classe `NotFound`) est levée"
      - "Une `HttpServerErrorException` est levée, car toute erreur HTTP est traitée comme une erreur serveur"
      - "La méthode renvoie un `Produit` vide"
    reponse: 1
    explication: "Par défaut, `retrieve()` lève une exception pour tout statut 4xx ou 5xx : `HttpClientErrorException` pour les codes 4xx (dont 404), `HttpServerErrorException` pour les 5xx. Pour un comportement différent (par exemple renvoyer `null` sur un 404), il faut le configurer explicitement avec `onStatus(...)`."
  - question: "Quelle affirmation sur `RestClient.Builder` est correcte ?"
    choix:
      - "Il faut le déclarer soi-même avec `@Bean`, Spring Boot ne fournit rien par défaut"
      - "Spring Boot l'auto-configure en scope singleton, une seule instance partagée par toute l'application"
      - "Spring Boot l'auto-configure en scope prototype : chaque injection reçoit une nouvelle instance de builder"
      - "Il n'existe que depuis Spring Boot 2.x, avant l'arrivée de `WebClient`"
    reponse: 2
    explication: "`RestClient` a été introduit dans Spring Framework 6.1 (Spring Boot 3.2). Spring Boot fournit un bean `RestClient.Builder` en scope prototype : on peut le personnaliser (URL de base, en-têtes) à un endroit sans affecter les autres injections du même bean."
---

## Essentiel

`RestClient` est le client HTTP synchrone de Spring, introduit en Spring Framework 6.1 (Spring Boot 3.2). Il reprend l'API fluide de `WebClient` mais reste **bloquant** : pas de dépendance à `spring-webflux`. C'est le choix par défaut pour appeler une API depuis une application Spring MVC classique.

Spring Boot auto-configure un bean `RestClient.Builder` : il suffit de l'injecter.

```java
@Service
public class ProduitApiClient {
    private final RestClient restClient;

    public ProduitApiClient(RestClient.Builder builder) {
        this.restClient = builder.baseUrl("https://api.exemple.com").build();
    }

    public Produit trouver(Long id) {
        return restClient.get()
                .uri("/produits/{id}", id)
                .retrieve()
                .body(Produit.class);
    }
}
```

`retrieve()` déclenche l'appel. `.body(Produit.class)` désérialise directement le JSON. Pour une liste, la simple `Class` ne suffit pas (effacement de type) : on utilise `ParameterizedTypeReference<List<Produit>>`.

Pour un POST avec un corps JSON :

```java
Produit cree = restClient.post()
        .uri("/produits")
        .contentType(MediaType.APPLICATION_JSON)
        .body(nouveauProduit)
        .retrieve()
        .body(Produit.class);
```

Par défaut, une réponse 4xx ou 5xx lève une exception (`HttpClientErrorException` / `HttpServerErrorException`) : pas besoin de vérifier le statut à la main.

## Détail

### Comment ça marche

`RestClient` s'utilise par une chaîne d'appels : méthode HTTP (`get()`, `post()`, `put()`, `delete()`…) → `uri(...)` → options éventuelles (en-têtes, type de contenu, corps) → `retrieve()` (déclenche l'appel) → extraction du résultat (`body(...)`, `toEntity(...)`, `toBodilessEntity()`).

Le `RestClient.Builder` auto-configuré par Spring Boot est déjà relié aux `HttpMessageConverter` de l'application (Jackson pour le JSON, notamment) : pas besoin de les redéclarer.

### Exemple 1 — `toEntity` pour accéder au statut et aux en-têtes

```java
ResponseEntity<Produit> reponse = restClient.get()
        .uri("/produits/{id}", id)
        .retrieve()
        .toEntity(Produit.class);

HttpStatusCode statut = reponse.getStatusCode();
Produit produit = reponse.getBody();
```

`body(Class)` suffit dans la majorité des cas ; `toEntity` devient utile quand le statut ou un en-tête (ex. `Location`, `ETag`) compte pour la suite du traitement.

### Exemple 2 — Récupérer une liste avec `ParameterizedTypeReference`

```java
List<Produit> produits = restClient.get()
        .uri("/produits?categorie={cat}", "informatique")
        .retrieve()
        .body(new ParameterizedTypeReference<List<Produit>>() {});
```

Java efface les types génériques à la compilation : sans `ParameterizedTypeReference`, Jackson ne saurait pas qu'il doit produire une `List<Produit>` plutôt qu'une `List<LinkedHashMap>`.

### Exemple 3 — Personnaliser la gestion des erreurs avec `onStatus`

```java
Produit produit = restClient.get()
        .uri("/produits/{id}", id)
        .retrieve()
        .onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
            throw new ProduitInexistantException(id);
        })
        .body(Produit.class);
```

Sans `onStatus`, un 404 aurait levé une `HttpClientErrorException.NotFound` générique. Ici, l'appelant reçoit une exception métier plus explicite, cohérente avec le reste de l'application.

### Exemple 4 — Client déclaratif avec `@HttpExchange`

Depuis Spring 6, on peut décrire un client HTTP comme une interface, sans écrire l'appel :

```java
public interface ProduitApi {
    @GetExchange("/produits/{id}")
    Produit trouver(@PathVariable Long id);

    @PostExchange("/produits")
    Produit creer(@RequestBody Produit produit);
}

@Configuration
public class ClientConfig {
    @Bean
    public ProduitApi produitApi(RestClient.Builder builder) {
        RestClient restClient = builder.baseUrl("https://api.exemple.com").build();
        HttpServiceProxyFactory factory = HttpServiceProxyFactory
                .builderFor(RestClientAdapter.create(restClient))
                .build();
        return factory.createClient(ProduitApi.class);
    }
}
```

Spring génère une implémentation qui appelle `RestClient` en coulisses. Utile pour un client avec plusieurs endpoints : le code d'appel disparaît, il ne reste que la signature de l'API. Le même mécanisme fonctionne avec `WebClient` via `WebClientAdapter`.

### RestTemplate, WebClient, RestClient

| | RestTemplate | WebClient | RestClient |
|---|---|---|---|
| Modèle | Synchrone (bloquant) | Réactif (non bloquant) | Synchrone (bloquant) |
| Dépendance | `spring-web` | `spring-webflux` | `spring-web` |
| API | Historique, moins fluide | Fluide (`Mono`/`Flux`) | Fluide, inspirée de `WebClient` |
| Statut | En maintenance depuis Spring 5 | Actif | Actif, recommandé pour du code bloquant |
| Depuis | Spring 3 | Spring 5 | Spring Framework 6.1 |

En résumé : dans une application MVC classique (Tomcat, threads bloquants), `RestClient` est aujourd'hui le premier choix pour du nouveau code. `WebClient` reste nécessaire dans une chaîne réactive (WebFlux) ou pour des appels concurrents nombreux et non bloquants. `RestTemplate` n'est pas à utiliser pour du nouveau code, mais reste présent dans beaucoup de bases existantes.

### Pièges courants

> **Injecter directement un `RestClient` au lieu du `Builder`.** Spring Boot n'auto-configure pas de bean `RestClient` prêt à l'emploi (il ne connaît pas l'URL de base à utiliser) : c'est le `RestClient.Builder` qui est auto-configuré. Il faut construire le `RestClient` soi-même, une seule fois, typiquement dans un `@Bean` ou le constructeur d'un service.

> **Oublier que les erreurs HTTP lèvent une exception par défaut.** Un code qui suppose qu'une réponse 404 renvoie simplement `null` plantera avec une `HttpClientErrorException.NotFound` non attrapée. Il faut soit l'attraper, soit la transformer avec `onStatus`.

> **Utiliser `Class<List<Produit>>`.** Ce type n'existe pas en Java (effacement de type) : le code ne compile même pas. C'est justement pour ce cas que `ParameterizedTypeReference` existe.

### À retenir

- `RestClient` (Spring 6.1+) : client HTTP synchrone à API fluide, alternative moderne à `RestTemplate`.
- Injecter `RestClient.Builder` (auto-configuré, scope prototype), construire le `RestClient` une fois avec `.build()`.
- `body(Class)` pour un objet simple, `ParameterizedTypeReference` pour une liste ou tout type générique.
- Par défaut, un 4xx/5xx lève `HttpClientErrorException`/`HttpServerErrorException` ; `onStatus` personnalise ce comportement.
- `@HttpExchange` et ses variantes (`@GetExchange`…) permettent de décrire un client comme une interface, au-dessus de `RestClient` ou `WebClient`.
