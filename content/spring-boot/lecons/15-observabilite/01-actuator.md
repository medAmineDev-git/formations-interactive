---
id: actuator
chapitre: observabilite
ordre: 1
titre: Spring Boot Actuator
termes:
  - terme: spring-boot-starter-actuator
    definition: "Dépendance qui ajoute les endpoints de supervision (`/actuator/*`) à l'application : santé, métriques, informations d'environnement, journalisation à chaud, etc. Rien n'est exposé en HTTP tant qu'on ne le configure pas explicitement."
  - terme: management.endpoints.web.exposure.include
    definition: "Propriété qui liste les endpoints exposés **en HTTP**. Par défaut, seul `health` est exposé : tous les autres (`metrics`, `env`, `beans`…) existent mais ne répondent pas tant qu'ils ne sont pas ajoutés à cette liste (ou `*` pour tout exposer)."
  - terme: management.endpoint.health.show-details
    definition: "Contrôle le niveau de détail renvoyé par `/actuator/health` : `never` (défaut, juste `UP`/`DOWN`), `when-authorized` (détail réservé aux rôles autorisés) ou `always`."
  - terme: Groupes de santé (health groups)
    definition: "Regroupement d'indicateurs de santé sous un sous-chemin dédié, typiquement `readiness` et `liveness` pour Kubernetes. Exposés sur `/actuator/health/readiness` et `/actuator/health/liveness`."
  - terme: HealthIndicator
    definition: "Interface à implémenter pour ajouter sa propre vérification de santé (ex. joignabilité d'une API tierce). Le nom du bean moins le suffixe `HealthIndicator` devient une clé dans la réponse de `/actuator/health`."
  - terme: management.server.port
    definition: "Fait écouter les endpoints Actuator sur un **port séparé** de celui de l'application, pour ne pas exposer la supervision sur le même réseau que l'API publique."
  - terme: "/actuator/loggers"
    definition: "Endpoint qui affiche (GET) et modifie (POST) le niveau de log d'un logger **à chaud**, sans redémarrer l'application."
quiz:
  - question: "Une application Spring Boot ajoute `spring-boot-starter-actuator` sans aucune autre configuration. Que renvoie une requête `GET /actuator/metrics` ?"
    choix:
      - "La liste des noms de métriques disponibles, en JSON"
      - "404 Not Found : par défaut, seul `/actuator/health` est exposé en HTTP"
      - "403 Forbidden : Actuator est désactivé tant que Spring Security n'est pas configuré"
      - "500 Internal Server Error : `metrics` nécessite `micrometer-registry-prometheus`"
    reponse: 1
    explication: "Depuis Spring Boot 2, la présence de la dépendance n'expose rien d'autre que `health` en HTTP par sécurité. Il faut lister explicitement les endpoints voulus dans `management.endpoints.web.exposure.include` (ou mettre `*`, à réserver aux environnements protégés)."
  - question: "À quoi sert `management.endpoint.health.show-details=when-authorized` plutôt que `always` ?"
    choix:
      - "À masquer complètement l'endpoint `/actuator/health`"
      - "À ne montrer le détail de chaque indicateur (base de données, disque…) qu'aux utilisateurs authentifiés avec le bon rôle, en renvoyant juste UP/DOWN aux autres"
      - "À désactiver les health groups"
      - "À exiger une authentification pour accéder à `/actuator/health` tout court"
    reponse: 1
    explication: "`always` expose le détail de chaque `HealthIndicator` à tout le monde, ce qui peut révéler des informations internes (nom d'une base, cause d'une panne). `when-authorized` réserve ce détail aux appelants autorisés, tout en laissant `/actuator/health` répondre publiquement `UP` ou `DOWN`."
  - question: "Ce endpoint est exposé et accessible. Quel appel change le niveau de log de `com.boutique.commande` sans redémarrer l'application ?"
    code: |
      GET /actuator/loggers/com.boutique.commande
    choix:
      - "`POST /actuator/loggers/com.boutique.commande` avec le corps `{\"configuredLevel\": \"DEBUG\"}`"
      - "`PUT /actuator/env` avec le corps `{\"logging.level.com.boutique.commande\": \"DEBUG\"}`"
      - "Modifier `application.yml` et attendre le rechargement automatique"
      - "`DELETE /actuator/loggers/com.boutique.commande`"
    reponse: 0
    explication: "`/actuator/loggers` accepte un `POST` avec `configuredLevel` pour changer un niveau à chaud. Le `GET` du même chemin, lui, sert seulement à lire le niveau effectif et le niveau hérité."
---

## Essentiel

**Actuator** ajoute à l'application des endpoints HTTP de supervision : santé, métriques, configuration effective, journaux, etc. On l'ajoute avec `spring-boot-starter-actuator`.

Par défaut, **un seul** endpoint est exposé en HTTP : `/actuator/health`. Tous les autres existent mais ne répondent pas tant qu'ils ne sont pas ajoutés explicitement :

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus, loggers
  endpoint:
    health:
      show-details: when-authorized
```

Les endpoints les plus utilisés : `health` (l'application et ses dépendances sont-elles vivantes ?), `info` (métadonnées de build), `metrics` (compteurs et temps de réponse), `env` (propriétés effectives), `beans` (contenu du contexte Spring), `loggers` (niveaux de log, modifiables à chaud), `mappings` (routes exposées) et `conditions` (pourquoi telle auto-configuration s'est activée ou non).

`health` peut être détaillé par **groupes** — typiquement `liveness` et `readiness`, utilisés par Kubernetes pour savoir s'il faut redémarrer un pod (`liveness`) ou lui envoyer du trafic (`readiness`).

## Détail

### Comment ça marche

Chaque endpoint Actuator est un bean qui expose des opérations (le plus souvent une simple lecture). `management.endpoints.web.exposure.include` ne **crée** rien : il ouvre juste l'accès HTTP à des endpoints qui existent déjà dans le contexte. C'est une décision volontairement séparée de la sécurité : exposer un endpoint ne veut pas dire qu'il est accessible sans authentification si Spring Security est présent sur le projet.

### Exemple 1 — Indicateur de santé personnalisé

```java
@Component
public class FournisseurPaiementHealthIndicator implements HealthIndicator {

    private final FournisseurPaiementClient client;

    public FournisseurPaiementHealthIndicator(FournisseurPaiementClient client) {
        this.client = client;
    }

    @Override
    public Health health() {
        try {
            client.verifierDisponibilite();
            return Health.up().withDetail("fournisseur", "stripe").build();
        } catch (Exception e) {
            return Health.down(e).withDetail("fournisseur", "stripe").build();
        }
    }
}
```

Le nom du bean (`fournisseurPaiement`, sans le suffixe `HealthIndicator`) devient une clé dans la réponse JSON de `/actuator/health` : si cet indicateur est `DOWN`, l'agrégat global `/actuator/health` passe `DOWN` lui aussi.

### Exemple 2 — Sondes liveness et readiness pour Kubernetes

```yaml
management:
  endpoint:
    health:
      probes:
        enabled: true
  health:
    livenessstate:
      enabled: true
    readinessstate:
      enabled: true
```

Deux sous-endpoints apparaissent : `/actuator/health/liveness` (le processus tourne-t-il correctement, indépendamment de ses dépendances ?) et `/actuator/health/readiness` (l'application est-elle prête à recevoir du trafic ?). Dans un manifeste Kubernetes, ils se déclarent comme sondes `livenessProbe` et `readinessProbe`. Quand Spring Boot détecte qu'il tourne dans un conteneur, ces groupes sont activés automatiquement dans la plupart des cas ; les déclarer explicitement évite toute ambiguïté.

### Exemple 3 — Port de management séparé

```yaml
management:
  server:
    port: 9001
  endpoints:
    web:
      exposure:
        include: "*"
```

L'API métier reste sur le port applicatif (ex. 8080), tandis qu'Actuator écoute sur un port dédié (9001), qu'on peut alors n'ouvrir qu'au réseau interne ou à l'outil de supervision — sans jamais l'exposer publiquement, même par erreur de configuration réseau.

### Exemple 4 — Sécuriser les endpoints avec Spring Security

```java
@Bean
SecurityFilterChain actuatorSecurity(HttpSecurity http) throws Exception {
    http.securityMatcher(EndpointRequest.to("health"))
        .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
    return http.build();
}

@Bean
SecurityFilterChain apiSecurity(HttpSecurity http) throws Exception {
    http.securityMatcher(EndpointRequest.toAnyEndpoint().excluding("health"))
        .authorizeHttpRequests(auth -> auth.hasRole("SUPERVISION"))
        .httpBasic(Customizer.withDefaults());
    return http.build();
}
```

`EndpointRequest` (fourni par Actuator) cible les chemins Actuator sans coder les URL en dur. Ici, `/actuator/health` reste public (utile pour un load balancer), le reste exige le rôle `SUPERVISION`.

### Endpoints les plus utilisés

| Endpoint | Rôle |
|---|---|
| `health` | État de l'application et de ses dépendances (base, disque, indicateurs personnalisés) |
| `info` | Métadonnées de build (version, commit git…), alimentées via `management.info.*` ou des `InfoContributor` |
| `metrics` | Liste des métriques, puis détail d'une métrique via `/actuator/metrics/{nom}` |
| `env` | Propriétés effectives de l'environnement (valeurs sensibles masquées automatiquement) |
| `beans` | Tous les beans du contexte Spring |
| `loggers` | Niveau de log par logger, modifiable à chaud |
| `mappings` | Toutes les routes exposées par les contrôleurs |
| `conditions` | Rapport des conditions d'auto-configuration : ce qui s'est activé, et pourquoi ce qui ne s'est pas activé a été écarté |
| `prometheus` | Métriques au format texte Prometheus (nécessite `micrometer-registry-prometheus`) |

### Pièges courants

> **`management.endpoints.web.exposure.include: "*"` en production, sans sécurité derrière.** `env` et `beans` peuvent révéler des informations sensibles (même si les clés contenant `password`, `secret`, `key`, `token` sont automatiquement masquées par `env`, l'exhaustivité de ce masquage n'est pas garantie sur des noms de propriétés inhabituels). Combiner l'exposition sélective des endpoints avec une vraie restriction d'accès (Spring Security ou port de management séparé).

> **Oublier que `show-details` par défaut est `never`.** Un `/actuator/health` qui répond toujours `{"status":"UP"}` sans détail n'est pas cassé : c'est le comportement par défaut, pensé pour ne rien révéler à un appelant non authentifié.

> **Confondre « exposé » et « sécurisé ».** `management.endpoints.web.exposure.include` contrôle la visibilité HTTP des endpoints, pas leur protection. Sans Spring Security (ou un filtre réseau équivalent), un endpoint exposé est accessible à quiconque atteint l'application.

### À retenir

- Par défaut, seul `health` est exposé en HTTP : lister explicitement le reste dans `management.endpoints.web.exposure.include`.
- `show-details` (`never` par défaut) contrôle la quantité d'information renvoyée par `/actuator/health`.
- Les groupes `liveness`/`readiness` servent aux sondes Kubernetes ; un `HealthIndicator` personnalisé influence l'agrégat global.
- `management.server.port` isole Actuator sur un port dédié, distinct de l'API publique.
- `/actuator/loggers` change un niveau de log sans redémarrage : très utile pour diagnostiquer un incident en production.
