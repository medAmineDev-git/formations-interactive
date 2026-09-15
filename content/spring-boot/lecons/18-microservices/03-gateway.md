---
id: gateway
chapitre: microservices
ordre: 3
titre: "API Gateway avec Spring Cloud Gateway"
termes:
  - terme: API Gateway
    definition: "Point d'entrée **unique** d'un système de microservices, placé devant eux. Elle route chaque requête entrante vers le bon service, et centralise des préoccupations transverses (authentification, limitation de débit, en-têtes communs) pour éviter de les dupliquer dans chaque service."
  - terme: Route
    definition: "Unité de configuration de Spring Cloud Gateway : un identifiant, une destination (`uri`), une liste de **predicates** (conditions de correspondance) et une liste de **filters** (transformations appliquées si la route correspond)."
  - terme: Predicate
    definition: "Condition qui détermine si une requête entrante correspond à une route : chemin (`Path=`), méthode HTTP (`Method=`), en-tête (`Header=`)… Plusieurs predicates sur une même route sont combinés en **ET**."
  - terme: Filter (GatewayFilter)
    definition: "Transformation appliquée à la requête et/ou à la réponse d'une route qui correspond : ajouter un en-tête (`AddRequestHeader`), retirer un segment de chemin (`StripPrefix`), limiter le débit (`RequestRateLimiter`)… Se distingue d'un `GlobalFilter`, appliqué à **toutes** les routes."
  - terme: "uri: lb://"
    definition: "Schéma d'URI qui indique à Spring Cloud Gateway de résoudre la destination via un client de découverte de services (Eureka, par exemple) et Spring Cloud LoadBalancer, plutôt que vers une adresse fixe — `lb://service-catalogue` route vers une instance disponible de `service-catalogue`."
  - terme: RequestRateLimiter
    definition: "Filtre qui limite le débit de requêtes autorisées, en s'appuyant par défaut sur Redis (`RedisRateLimiter`, algorithme token bucket) et un `KeyResolver` qui détermine la clé de limitation (par utilisateur, par IP…)."
  - terme: TokenRelay
    definition: "Filtre qui **relaie** le jeton d'accès OAuth2 obtenu par la gateway vers les services en aval, pour qu'ils reçoivent l'identité de l'appelant sans que la gateway rejoue une authentification séparée. Nécessite que la gateway soit elle-même configurée comme client OAuth2."
quiz:
  - question: "Avec cette configuration, quelle requête part vers service-catalogue et sur quel chemin ?"
    code: |
      spring:
        cloud:
          gateway:
            routes:
              - id: catalogue
                uri: lb://service-catalogue
                predicates:
                  - Path=/api/catalogue/**
                filters:
                  - StripPrefix=1
    choix:
      - "GET /api/catalogue/produits/12 devient GET /catalogue/produits/12 sur service-catalogue"
      - "GET /api/catalogue/produits/12 devient GET /produits/12 sur service-catalogue"
      - "GET /api/catalogue/produits/12 est transmise telle quelle, avec /api/catalogue/produits/12"
      - "GET /catalogue/produits/12 devient GET /api/catalogue/produits/12"
    reponse: 1
    explication: "Le predicate Path=/api/catalogue/** fait correspondre la route. StripPrefix=1 retire le premier segment du chemin (/api) avant de transmettre la requête : il reste /catalogue/produits/12, envoyé vers service-catalogue. Pour obtenir /produits/12, il faudrait StripPrefix=2 (retirer /api et /catalogue)."
  - question: "Quelle est la bonne pratique concernant la logique métier dans une API Gateway ?"
    choix:
      - "La gateway est l'endroit idéal pour centraliser les règles métier communes à tous les services"
      - "La gateway doit rester limitée au routage et aux préoccupations transverses (authentification, débit, en-têtes) ; la logique métier reste dans les services"
      - "La logique métier doit être dupliquée entre la gateway et les services pour plus de robustesse"
      - "Cela dépend uniquement du nombre de services en aval"
    reponse: 1
    explication: "Mélanger logique métier et routage dans la gateway recrée un couplage fort et un goulot d'étranglement : elle devient un point de passage obligé pour tout changement métier, à l'opposé de l'autonomie recherchée avec des microservices. La gateway reste une brique d'infrastructure : routage, sécurité transverse, limitation de débit, observabilité."
  - question: "Pourquoi Spring Cloud Gateway est-il historiquement construit sur WebFlux plutôt que sur Spring MVC ?"
    choix:
      - "Parce que WebFlux est obligatoire pour tout projet Spring Cloud"
      - "Parce qu'une gateway gère un grand nombre de connexions concurrentes principalement en attente de réponses réseau, un scénario où le modèle non-bloquant évite de mobiliser un thread par requête en attente"
      - "Parce que Spring MVC ne permet pas de faire du routage HTTP"
      - "Parce que WebFlux est plus simple à configurer que Spring MVC"
    reponse: 1
    explication: "Une gateway passe le plus clair de son temps à attendre les réponses des services en aval : c'est le profil d'usage typique où un modèle non-bloquant (peu de threads, event loop) tire son épingle du jeu face à un thread par requête bloqué en attente. Une variante basée sur Spring MVC (servlet) existe plus récemment dans l'écosystème Spring Cloud Gateway, mais la version réactive reste la référence historique et la plus répandue."
---

## Essentiel

Une **API Gateway** est le point d'entrée unique d'un système de microservices : elle route les requêtes entrantes vers le bon service et centralise ce qui serait sinon dupliqué dans chacun (authentification, limitation de débit, en-têtes communs). Spring Cloud Gateway s'appuie sur trois notions :

- **Route** : un identifiant, une destination, des conditions et des filtres.
- **Predicate** : la condition de correspondance (chemin, méthode…).
- **Filter** : la transformation appliquée à la requête ou la réponse.

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: catalogue
          uri: lb://service-catalogue
          predicates:
            - Path=/api/catalogue/**
          filters:
            - StripPrefix=1
            - AddRequestHeader=X-Gateway-Source, gateway
```

`lb://service-catalogue` fait résoudre la destination via la découverte de services (Eureka) et Spring Cloud LoadBalancer, au lieu d'une adresse fixe. Spring Cloud Gateway est historiquement construit sur **WebFlux** (non bloquant) : profil d'usage adapté à une brique qui passe l'essentiel de son temps à attendre les réponses des services en aval.

La gateway doit rester une brique d'**infrastructure** : routage, sécurité transverse, limitation de débit. La logique métier reste dans les services.

## Détail

### Comment une requête est traitée

1. La requête entrante est comparée aux **predicates** de chaque route, dans l'ordre de déclaration.
2. La première route dont **tous** les predicates correspondent (combinaison en ET) est retenue.
3. Ses **filters** sont appliqués, dans l'ordre, à la requête (avant l'appel en aval) puis à la réponse (après).
4. La requête part vers la destination (`uri`), résolue directement ou via `lb://` et la découverte de services.

### Exemple 1 — Plusieurs routes et predicates combinés

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: commandes-lecture
          uri: lb://service-commandes
          predicates:
            - Path=/api/commandes/**
            - Method=GET
          filters:
            - StripPrefix=1

        - id: commandes-ecriture
          uri: lb://service-commandes
          predicates:
            - Path=/api/commandes/**
            - Method=POST,PUT,DELETE
          filters:
            - StripPrefix=1
            - AddRequestHeader=X-Trace-Origin, gateway
```

Deux routes différentes peuvent cibler le même chemin, distinguées par un second predicate (ici la méthode HTTP) — utile pour appliquer des filtres différents en lecture et en écriture.

### Exemple 2 — Limiter le débit avec RequestRateLimiter

```yaml
filters:
  - name: RequestRateLimiter
    args:
      redis-rate-limiter.replenishRate: 10   # jetons réapprovisionnés par seconde
      redis-rate-limiter.burstCapacity: 20   # capacité maximale (pic autorisé)
```

```java
@Bean
KeyResolver utilisateurKeyResolver() {
    // limite par adresse IP ; pourrait aussi lire un en-tête d'identité utilisateur
    return exchange -> Mono.just(
            exchange.getRequest().getRemoteAddress().getAddress().getHostAddress());
}
```

`RequestRateLimiter` s'appuie par défaut sur Redis (algorithme token bucket) : il faut la dépendance Redis réactive et un bean `KeyResolver` qui détermine la clé de limitation (par IP, par utilisateur authentifié…). Sans `KeyResolver` défini, aucune limite n'est appliquée.

### Exemple 3 — Relayer un jeton OAuth2 vers les services en aval

```yaml
filters:
  - TokenRelay=
```

Quand la gateway est elle-même configurée comme client OAuth2 (`spring-cloud-starter-security` avec la configuration OAuth2 client appropriée), le filtre `TokenRelay` transmet le jeton d'accès obtenu par la gateway aux services en aval, qui peuvent alors le valider comme n'importe quel jeton porteur — sans que chaque service ait à gérer une authentification séparée avec l'appelant original.

### Exemple 4 — Filtre personnalisé simple

```java
@Component
public class LogGatewayFilterFactory extends AbstractGatewayFilterFactory<Object> {

    private static final Logger log = LoggerFactory.getLogger(LogGatewayFilterFactory.class);

    @Override
    public GatewayFilter apply(Object config) {
        return (exchange, chain) -> {
            log.info("Requête entrante : {}", exchange.getRequest().getURI());
            return chain.filter(exchange);
        };
    }
}
```

Utile pour un besoin transverse non couvert par les filtres fournis (traçage personnalisé, en-tête calculé…), mais à garder simple : ce n'est pas l'endroit pour de la logique métier.

### Ce qu'on ne met pas dans la gateway

| À faire dans la gateway | À laisser dans les services |
|---|---|
| Routage vers le bon service | Règles métier (calcul de prix, validation de domaine…) |
| Authentification, relais de jeton | Autorisation fine par ressource métier |
| Limitation de débit globale | Logique de retry propre à un appel spécifique (Resilience4j côté appelant) |
| En-têtes communs, traçage | Accès aux données |

Concentrer la logique métier dans la gateway recrée un point de passage obligé pour tout changement, à l'opposé de l'autonomie de déploiement recherchée avec des microservices.

### Pièges courants

> **Confondre `StripPrefix` avec le nombre de segments à garder plutôt qu'à retirer.** `StripPrefix=1` retire le **premier** segment du chemin, pas le nombre de segments conservés. `/api/catalogue/produits/12` avec `StripPrefix=1` devient `/catalogue/produits/12`, pas `/produits/12`.

> **Route `lb://` sans dépendance ou configuration de découverte.** Si le client de découverte (Eureka, par exemple) n'est pas configuré, la résolution `lb://nom-service` échoue : la gateway ne peut trouver aucune instance et renvoie une erreur, même si le nom du service est correct.

> **Oublier qu'une gateway est un point de défaillance unique si elle n'est pas répliquée.** Comme tout le trafic la traverse, une seule instance de gateway sans redondance ni supervision devient le maillon le plus fragile du système, même si chaque microservice individuellement est résilient.

### À retenir

- Une route combine un identifiant, une destination, des **predicates** (condition, combinés en ET) et des **filters** (transformation).
- `uri: lb://nom-service` route vers une instance choisie via la découverte de services et Spring Cloud LoadBalancer.
- Spring Cloud Gateway est bâti sur WebFlux (non bloquant), adapté au profil « beaucoup de connexions en attente réseau » d'une gateway.
- `RequestRateLimiter` (avec Redis et un `KeyResolver`) limite le débit ; `TokenRelay` relaie un jeton OAuth2 vers les services en aval.
- La gateway reste une brique d'infrastructure : routage et préoccupations transverses, jamais la logique métier.
