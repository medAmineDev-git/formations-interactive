---
id: logs-tracing
chapitre: observabilite
ordre: 3
titre: "Logs structurés et tracing distribué"
termes:
  - terme: SLF4J + Logback
    definition: "Combinaison utilisée par défaut dans tous les starters Spring Boot : SLF4J est la **façade** de logging (l'API que le code appelle), Logback en est l'**implémentation** par défaut (celle qui écrit réellement les lignes). On peut la remplacer par Log4j2 en excluant Logback du starter."
  - terme: logging.level.*
    definition: "Propriété pour fixer le niveau de log par package ou par classe, ex. `logging.level.com.boutique.commande=DEBUG`. Le niveau s'applique à ce package et à tous ses sous-packages, sauf niveau plus spécifique défini en dessous."
  - terme: MDC (Mapped Diagnostic Context)
    definition: "Contexte clé/valeur propre à chaque thread (`org.slf4j.MDC`), utilisé pour enrichir chaque ligne de log sans la répéter dans chaque appel (ex. un identifiant de requête). Micrometer Tracing y place automatiquement `traceId` et `spanId` pendant la durée d'un span."
  - terme: "Logs structurés (JSON)"
    definition: "Format de log où chaque ligne est un objet JSON (un champ par donnée) plutôt qu'une ligne de texte formatée, pour être indexé facilement par un outil comme Elasticsearch ou Loki. S'obtient nativement à partir de Spring Boot 3.4 (propriétés `logging.structured.format.*`) ou, sur des versions antérieures, via un encodeur Logback JSON tiers (`logstash-logback-encoder`)."
  - terme: Micrometer Tracing
    definition: "Façade de tracing distribué intégrée à Spring Boot 3, qui **remplace Spring Cloud Sleuth** (arrêté avec l'arrivée de Boot 3). Elle instrumente automatiquement les appels HTTP entrants/sortants et les publie via un pont (« bridge ») vers Brave (Zipkin) ou OpenTelemetry."
  - terme: traceparent
    definition: "En-tête HTTP standard (spécification **W3C Trace Context**) qui transporte l'identifiant de trace et de span d'un service à l'autre, ex. `traceparent: 00-<traceId>-<spanId>-01`. C'est ce qui permet de relier les spans de plusieurs microservices dans une même trace."
  - terme: management.tracing.sampling.probability
    definition: "Proportion des requêtes réellement tracées et exportées, entre `0.0` et `1.0`. Valeur historiquement modeste par défaut (héritée de Spring Cloud Sleuth) : en local, il est courant de la monter à `1.0` pour voir chaque requête dans l'outil de tracing."
quiz:
  - question: "Cette configuration est en place. Quel niveau de log est effectif pour la classe `com.boutique.commande.paiement.PaiementService` ?"
    code: |
      logging:
        level:
          root: INFO
          com.boutique.commande: DEBUG
    choix:
      - "INFO, car seul le package exact `com.boutique.commande` est concerné"
      - "DEBUG, car le niveau défini sur un package s'applique aussi à tous ses sous-packages"
      - "TRACE, le niveau le plus permissif l'emporte toujours"
      - "Erreur au démarrage : il faut déclarer chaque sous-package explicitement"
    reponse: 1
    explication: "`logging.level.com.boutique.commande=DEBUG` s'applique à ce package **et à tous ses descendants**, y compris `com.boutique.commande.paiement`, sauf si un niveau plus spécifique est défini pour ce sous-package précis."
  - question: "Un développeur ajoute Micrometer Tracing avec un exportateur Zipkin, envoie une dizaine de requêtes en local, et ne voit que 2 ou 3 traces dans l'interface Zipkin. Quelle est la cause la plus probable ?"
    choix:
      - "Zipkin limite l'affichage à 3 traces par minute"
      - "`management.tracing.sampling.probability` n'a pas été monté à `1.0` : seule une fraction des requêtes est échantillonnée et exportée par défaut"
      - "Micrometer Tracing ne fonctionne qu'à partir de la 4e requête après le démarrage"
      - "Le bridge Brave doit être redémarré après chaque requête"
    reponse: 1
    explication: "Par défaut, seule une petite fraction des requêtes est échantillonnée (comportement hérité de Spring Cloud Sleuth), pour ne pas surcharger le backend de tracing en production. En local ou en test, on monte typiquement `management.tracing.sampling.probability` à `1.0` pour voir toutes les traces ; en production, un taux plus bas est volontaire."
  - question: "Ce pattern de log est configuré, mais le projet n'a **aucune** dépendance de tracing (ni Micrometer Tracing, ni bridge). Que produit une ligne de log ?"
    code: |
      logging:
        pattern:
          console: "%d %-5level [%X{traceId:-},%X{spanId:-}] %logger{36} - %msg%n"
    choix:
      - "Une erreur au démarrage : `%X{traceId}` exige la présence de Micrometer Tracing"
      - "La ligne s'affiche normalement, avec des valeurs vides ou le texte par défaut à la place de `traceId`/`spanId`, car le MDC ne contient simplement pas ces clés"
      - "Spring Boot génère un `traceId` aléatoire pour chaque ligne malgré l'absence de dépendance"
      - "Le logger bascule silencieusement sur un format JSON"
    reponse: 1
    explication: "`%X{clé:-défaut}` lit une clé du MDC et affiche le texte par défaut si elle est absente : sans tracing, `traceId` et `spanId` ne sont jamais placés dans le MDC, donc la ligne s'affiche quand même, juste sans ces valeurs. Rien ne plante : le pattern est indépendant de la présence effective du tracing."
---

## Essentiel

Spring Boot utilise **SLF4J** comme façade de logging et **Logback** comme implémentation par défaut. On règle les niveaux avec `logging.level.*` :

```yaml
logging:
  level:
    root: INFO
    com.boutique.commande: DEBUG
  file:
    name: logs/application.log
```

Pour du contexte au-delà du simple message (identifiant de requête, utilisateur courant), on utilise le **MDC** (`org.slf4j.MDC`) : une carte clé/valeur propre à chaque thread, lue automatiquement par le pattern de log si elle contient les bonnes clés (`%X{cle}`).

En environnement distribué, le vrai problème n'est plus « ce log existe-t-il » mais « à quelle requête, dans quel service, appartient-il ». C'est le rôle de **Micrometer Tracing**, qui remplace Spring Cloud Sleuth depuis Spring Boot 3 : chaque requête reçoit un `traceId` (unique pour tout le parcours, potentiellement à travers plusieurs services) et un `spanId` (unique pour chaque étape), propagés entre services via l'en-tête HTTP standard `traceparent`. Micrometer Tracing place ces identifiants dans le MDC, donc ils apparaissent automatiquement dans les logs dès qu'on les inclut dans le pattern — la corrélation entre logs et traces se fait alors simplement en recherchant un `traceId`.

L'export des traces vers un outil (Zipkin, ou une plateforme compatible OpenTelemetry) passe par une dépendance de « bridge » (`micrometer-tracing-bridge-brave` ou `micrometer-tracing-bridge-otel`) et n'est réalisé, par défaut, que sur un **échantillon** des requêtes (`management.tracing.sampling.probability`), pour ne pas saturer le backend de tracing en production.

## Détail

### Comment ça marche

Micrometer Tracing s'appuie sur des instrumentations automatiques (filtres Spring MVC, intercepteurs de `RestClient`/`RestTemplate`…) qui, pour chaque requête entrante ou sortante, créent un **span** rattaché à la trace en cours (ou en démarrent une nouvelle si la requête entrante ne porte pas d'en-tête `traceparent`). Le span courant expose `traceId` et `spanId` au MDC pendant toute sa durée : c'est ce qui permet à une simple ligne de pattern Logback de faire apparaître ces identifiants sans aucun code applicatif supplémentaire.

### Exemple 1 — Dépendances pour exporter vers Zipkin

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-brave</artifactId>
</dependency>
<dependency>
    <groupId>io.zipkin.reporter2</groupId>
    <artifactId>zipkin-reporter-brave</artifactId>
</dependency>
```

```yaml
management:
  tracing:
    sampling:
      probability: 1.0   # 100 % en local/test, à réduire en production
  zipkin:
    tracing:
      endpoint: http://localhost:9411/api/v2/spans
```

Le bridge Brave est l'implémentation historique la plus simple à associer à Zipkin. Le taux d'échantillonnage à `1.0` permet de voir chaque requête pendant le développement.

### Exemple 2 — Exporter vers un collecteur OpenTelemetry

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>
```

Le bridge OpenTelemetry produit des traces au format standard **OTLP**, exportables vers n'importe quel collecteur compatible (Grafana Tempo, Jaeger, un backend commercial…), ce qui en fait le choix le plus interopérable dans un environnement multi-outils ou multi-fournisseurs.

### Exemple 3 — Propager le contexte utilisateur dans le MDC

```java
@Component
public class ContexteRequeteFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                     FilterChain chain) throws ServletException, IOException {
        try {
            MDC.put("utilisateur", extraireUtilisateur(req));
            chain.doFilter(req, res);
        } finally {
            MDC.remove("utilisateur"); // indispensable : le thread est réutilisé par le pool
        }
    }
}
```

Le `finally` est essentiel : les threads du serveur sont mis en commun (pool), donc un MDC non nettoyé peut « fuiter » sur la requête suivante traitée par le même thread et afficher le mauvais utilisateur dans les logs.

### Exemple 4 — Vers des logs structurés en JSON

Deux approches, selon la version de Spring Boot :

```yaml
# Spring Boot 3.4+ : support natif (à vérifier sur la documentation de la version utilisée)
logging:
  structured:
    format:
      console: ecs
```

```xml
<!-- Alternative éprouvée, valable sur toutes les versions Boot 3 : encodeur Logback JSON -->
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
</dependency>
```

```xml
<!-- logback-spring.xml -->
<appender name="CONSOLE_JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder" />
</appender>
```

Dans les deux cas, le principe est le même : chaque ligne de log devient un objet JSON dont les champs (message, niveau, `traceId`, `spanId`, MDC…) sont directement indexables par Elasticsearch, Loki ou un système équivalent, sans expression régulière fragile pour re-découper une ligne de texte.

### Corréler un log et une trace

| Sans tracing | Avec Micrometer Tracing |
|---|---|
| Chaque log est isolé ; retrouver le parcours complet d'une requête à travers plusieurs services demande de recouper des horodatages | Chaque log porte le `traceId` de la requête ; une recherche `traceId:abc123` dans l'outil de logs retrouve instantanément toutes les lignes du parcours, dans tous les services |
| Aucun lien direct vers un outil de tracing | L'outil de logs peut proposer un lien direct vers la trace correspondante dans Zipkin/Tempo/Jaeger, pour visualiser la latence de chaque étape |

### Pièges courants

> **Oublier de nettoyer le MDC.** Un `MDC.put(...)` sans `finally { MDC.remove(...) }` (ou `MDC.clear()`) peut laisser une valeur associée à un thread réutilisé par le pool, et faire apparaître les données d'un utilisateur dans les logs d'un autre.

> **Tester le tracing en local sans monter l'échantillonnage.** Avec `management.tracing.sampling.probability` à sa valeur par défaut (faible), la plupart des requêtes de test ne génèrent aucune trace exportée : on peut croire le tracing cassé alors qu'il fonctionne, juste sur un échantillon restreint.

> **Confondre niveau de log applicatif et volume de traces.** Passer tout le projet en `DEBUG` en production pour « avoir plus d'infos » dégrade les performances et noie l'information utile ; c'est souvent le tracing distribué (traceId partagé entre services) qui répond mieux au vrai besoin — comprendre le parcours d'une requête — sans changer les niveaux de log.

### À retenir

- SLF4J (façade) + Logback (implémentation) par défaut ; `logging.level.*` s'applique à un package et à ses sous-packages.
- Le MDC enrichit chaque ligne de log avec du contexte propre au thread ; toujours le nettoyer après usage.
- Micrometer Tracing remplace Spring Cloud Sleuth depuis Spring Boot 3 ; `traceId`/`spanId` sont propagés entre services via l'en-tête W3C `traceparent`.
- L'export vers Zipkin ou OpenTelemetry passe par un bridge dédié (Brave ou OTel) ; le taux d'échantillonnage par défaut n'exporte pas 100 % des requêtes.
- Les logs structurés en JSON (natifs depuis Spring Boot 3.4, ou via un encodeur Logback JSON avant) facilitent l'indexation et la recherche dans un outil centralisé.
