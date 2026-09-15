---
id: config-discovery
chapitre: microservices
ordre: 2
titre: "Configuration centralisée et découverte de services"
termes:
  - terme: spring-cloud-dependencies (BOM)
    definition: "Bill of Materials Maven qui fixe les versions cohérentes de **tous** les modules Spring Cloud (Config, Eureka, LoadBalancer, Gateway…). Chaque version du BOM cible une plage de versions compatibles de Spring Boot : il faut toujours vérifier la compatibilité avant de monter de version, plutôt que de choisir les versions des modules une par une."
  - terme: "@EnableConfigServer"
    definition: "Annotation posée sur la classe principale d'un service dédié qui active le Config Server : une API HTTP qui sert des fichiers de configuration, typiquement lus depuis un **dépôt Git**, à tous les autres services au démarrage."
  - terme: "spring.config.import=configserver:"
    definition: "Propriété côté client (avec la dépendance `spring-cloud-starter-config`) qui indique où trouver le Config Server. Spring Boot récupère la configuration **avant** de terminer son propre démarrage, en la fusionnant avec les fichiers locaux (`application.yml`)."
  - terme: "@RefreshScope"
    definition: "Annotation posée sur un bean (souvent un `@ConfigurationProperties` ou un `@Component`) pour qu'il soit **recréé** — et non simplement relu — au prochain rafraîchissement de configuration, avec les nouvelles valeurs."
  - terme: Eureka
    definition: "Serveur de **découverte de services** de Netflix, intégré à Spring Cloud. Chaque instance de service s'y **enregistre** au démarrage (nom logique + adresse) et interroge le registre pour trouver les autres services, au lieu d'utiliser des adresses en dur."
  - terme: Spring Cloud LoadBalancer
    definition: "Mécanisme de répartition de charge **côté client** : avant d'appeler un service, le client interroge le registre de découverte pour obtenir la liste de ses instances et en choisit une (round-robin par défaut). Remplace Netflix Ribbon, retiré de Spring Cloud."
  - terme: "@LoadBalanced"
    definition: "Annotation posée sur un bean `RestClient.Builder`, `WebClient.Builder` (ou historiquement `RestTemplate`) pour que les requêtes utilisant un **nom de service logique** comme hôte (`http://service-catalogue/...`) soient résolues via Spring Cloud LoadBalancer plutôt qu'un DNS classique."
quiz:
  - question: "Que fait cette propriété côté client ?"
    code: |
      spring.application.name=service-commandes
      spring.config.import=configserver:http://localhost:8888
    choix:
      - "Elle démarre un Config Server local sur le port 8888"
      - "Au démarrage, l'application va chercher sa configuration auprès du Config Server à cette adresse, en plus de ses fichiers locaux"
      - "Elle active la découverte de services Eureka"
      - "Elle n'a aucun effet sans l'annotation @EnableConfigServer sur ce même service"
    reponse: 1
    explication: "spring.config.import=configserver:... déclare un Config Server comme source de configuration supplémentaire : l'application (identifiée par spring.application.name) récupère ses propriétés depuis ce serveur, typiquement issues d'un fichier nommé service-commandes.yml dans le dépôt Git configuré côté serveur. @EnableConfigServer, lui, se met sur le service qui héberge le Config Server, pas sur ses clients."
  - question: "Un bean @ConfigurationProperties n'est PAS annoté @RefreshScope. Après un appel à /actuator/refresh suite à un changement dans le dépôt Git de configuration, que se passe-t-il ?"
    choix:
      - "Le bean est automatiquement recréé avec les nouvelles valeurs, @RefreshScope n'est utile que pour les @Value"
      - "Le bean garde les valeurs qu'il avait à sa création : /actuator/refresh ne recrée que les beans marqués @RefreshScope"
      - "L'application refuse de démarrer au prochain redémarrage"
      - "Une exception est levée au moment de l'appel à /actuator/refresh"
    reponse: 1
    explication: "/actuator/refresh republie les propriétés mises à jour dans le contexte, mais seuls les beans annotés @RefreshScope sont détruits puis recréés pour en tenir compte — via un proxy qui redirige vers une nouvelle instance. Un bean ordinaire, même basé sur @ConfigurationProperties, garde les valeurs lues à son instanciation initiale tant qu'il n'est pas dans un scope de rafraîchissement."
  - question: "À quoi sert @LoadBalanced sur un WebClient.Builder dans un service qui utilise Eureka ?"
    choix:
      - "À chiffrer automatiquement les appels HTTP sortants"
      - "À résoudre un nom de service logique (ex. http://service-catalogue) en interrogeant le registre Eureka, puis à choisir une instance parmi celles disponibles"
      - "À mettre en cache les réponses des appels précédents"
      - "À activer automatiquement un circuit breaker sur chaque appel"
    reponse: 1
    explication: "Sans @LoadBalanced, http://service-catalogue serait résolu comme un nom DNS classique, qui n'existe pas. Avec @LoadBalanced, Spring Cloud LoadBalancer intercepte la requête, interroge le client de découverte (Eureka ici) pour la liste des instances enregistrées sous ce nom, et en sélectionne une — sans lien avec le chiffrement ni la résilience, qui sont des préoccupations séparées (Resilience4j)."
---

## Essentiel

Dans un système à plusieurs services, deux problèmes reviennent tout le temps : **où est la configuration** de chaque service, et **où sont** les autres services. Spring Cloud répond aux deux, en s'appuyant sur son BOM `spring-cloud-dependencies` pour garder toutes ses briques (Config, Eureka, LoadBalancer…) à des versions cohérentes entre elles **et** compatibles avec la version de Spring Boot utilisée — à vérifier avant toute montée de version.

**Configuration centralisée** avec le Config Server : un service dédié expose la configuration de tous les autres, lue depuis un dépôt Git.

```java
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication { ... }
```

```properties
# Chaque client déclare, via spring.application.name, quel fichier lui correspond dans le dépôt
spring.application.name=service-commandes
spring.config.import=configserver:http://localhost:8888
```

**Découverte de services** avec Eureka : chaque instance s'enregistre au démarrage, et les appels entre services utilisent un nom logique plutôt qu'une adresse en dur, résolu côté client avec Spring Cloud LoadBalancer :

```java
@Bean
@LoadBalanced
RestClient.Builder restClientBuilder() {
    return RestClient.builder();
}
```

```java
restClientBuilder.build().get().uri("http://service-catalogue/produits/{id}", id) ...
```

## Détail

### Le Config Server, pas à pas

Le serveur lit un dépôt Git et sert son contenu par HTTP :

```yaml
# application.yml du Config Server
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/mon-org/config-repo
          default-label: main
```

Le dépôt contient un fichier par service (`service-commandes.yml`, `service-catalogue.yml`) et éventuellement un `application.yml` partagé par tous. Le client interroge `GET /{application}/{profile}` (ex. `/service-commandes/prod`) et fusionne le résultat avec sa configuration locale, cette dernière restant généralement prioritaire pour ce qui est spécifique à l'instance.

### Exemple 1 — Rafraîchir la configuration sans redémarrer

```java
@Component
@RefreshScope
public class LimiteCommandeConfig {

    @Value("${commande.montant-max}")
    private double montantMax;

    public double getMontantMax() {
        return montantMax;
    }
}
```

Après une modification de `commande.montant-max` dans le dépôt Git, un appel `POST /actuator/refresh` sur l'instance (endpoint à exposer via `management.endpoints.web.exposure.include=refresh`) recrée ce bean avec la nouvelle valeur — sans redéploiement. Pour diffuser ce rafraîchissement à toutes les instances d'un coup plutôt qu'une par une, Spring Cloud Bus s'appuie sur un broker de messages (Kafka ou RabbitMQ) pour propager l'événement.

### Exemple 2 — Serveur et client Eureka

```java
// Le serveur de découverte, une application à part
@SpringBootApplication
@EnableEurekaServer
public class DiscoveryServerApplication { ... }
```

```yaml
# eureka-server : il ne s'enregistre pas lui-même
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
```

Côté client, ajouter `spring-cloud-starter-netflix-eureka-client` suffit en général à enregistrer le service : aucune annotation n'est nécessaire. L'ancienne `@EnableEurekaClient`, qu'on voit encore dans de vieux tutoriels, a d'ailleurs été supprimée des versions de Spring Cloud compatibles Spring Boot 3 (`@EnableDiscoveryClient`, plus générique, existe toujours mais reste facultative).

```yaml
spring:
  application:
    name: service-commandes
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

### Exemple 3 — Appel entre services par nom logique

```java
@Configuration
public class ClientConfig {

    @Bean
    @LoadBalanced
    WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}

@Service
public class CommandeService {

    private final WebClient webClient;

    public CommandeService(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    public Mono<Produit> recupererProduit(Long id) {
        return webClient.get()
                .uri("http://service-catalogue/produits/{id}", id)
                .retrieve()
                .bodyToMono(Produit.class);
    }
}
```

`service-catalogue` n'est pas un nom DNS : Spring Cloud LoadBalancer l'intercepte, consulte le registre Eureka pour la liste des instances enregistrées sous ce nom, et en choisit une (round-robin par défaut). Le support de `@LoadBalanced` sur `RestClient.Builder` suit le même principe et a été ajouté plus récemment que sur `RestTemplate`/`WebClient.Builder` : vérifier la version de Spring Cloud utilisée si ce client est choisi.

### Alternatives avec Kubernetes

Sur Kubernetes, une partie de ces problèmes est déjà résolue par la plateforme, et beaucoup d'équipes s'appuient dessus plutôt que sur Config Server et Eureka :

- **Configuration** : `ConfigMap` et `Secret`, montés comme variables d'environnement ou fichiers dans le conteneur, au lieu d'un Config Server dédié.
- **Découverte** : chaque `Service` Kubernetes expose un nom DNS stable (résolu par le DNS interne du cluster) qui pointe vers les pods disponibles — un `RestClient`/`WebClient` classique suffit, sans `@LoadBalanced` ni client Eureka.

Le projet Spring Cloud Kubernetes propose aussi une intégration plus fine (lecture des `ConfigMap` comme source `PropertySource` Spring, par exemple) pour qui veut garder les abstractions Spring Cloud tout en tournant sur Kubernetes.

### Pièges courants

> **Oublier que le BOM ne suffit pas à garantir la compatibilité avec Spring Boot.** Chaque version du train `spring-cloud-dependencies` cible une plage précise de versions de Spring Boot 3.x. Monter Spring Boot sans vérifier la matrice de compatibilité officielle est une source fréquente d'erreurs de démarrage difficiles à diagnostiquer.

> **Configuration sensible en clair dans le dépôt Git du Config Server.** Un dépôt de configuration doit rester aussi protégé qu'un dépôt de secrets : préférer le chiffrement supporté par Config Server ou déléguer les secrets à un coffre dédié (Vault…) plutôt que de tout committer en clair.

> **Confondre `/actuator/refresh` et un vrai redémarrage.** Seuls les beans `@RefreshScope` (ou les mécanismes qui en dépendent, comme certains pools de connexions rechargeables) tiennent compte du changement. Une configuration lue une fois dans un champ statique ou dans le constructeur d'un bean ordinaire ne bougera pas.

### À retenir

- `spring-cloud-dependencies` (BOM) fixe des versions cohérentes entre modules Spring Cloud, compatibles avec une plage de versions Spring Boot précise — à vérifier avant de monter en version.
- Config Server centralise la configuration (souvent depuis Git) ; le client la récupère via `spring.config.import=configserver:...`.
- `@RefreshScope` + `/actuator/refresh` permettent de recharger la configuration sans redémarrer, seulement pour les beans concernés.
- Eureka fait s'enregistrer et se découvrir les services par nom logique ; `@LoadBalanced` fait résoudre ce nom côté client via Spring Cloud LoadBalancer.
- Sur Kubernetes, `ConfigMap`/`Secret` et le DNS des `Service` couvrent souvent les mêmes besoins nativement, sans Config Server ni Eureka.
