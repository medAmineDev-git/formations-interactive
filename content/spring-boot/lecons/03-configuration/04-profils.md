---
id: profils
chapitre: configuration
ordre: 4
titre: "Les profils (dev, test, prod)"
termes:
  - terme: Profil Spring
    definition: "Un label (ex. `dev`, `test`, `prod`) qui active une configuration ou des beans différents selon l'environnement d'exécution, sans changer le code."
  - terme: spring.profiles.active
    definition: "Propriété qui active un ou plusieurs profils, ex. `spring.profiles.active=dev`. Se règle en ligne de commande, en variable d'environnement (`SPRING_PROFILES_ACTIVE`) ou dans un fichier de configuration."
  - terme: "application-{profil}.yml"
    definition: "Fichier de configuration chargé **en plus** d'`application.yml` quand le profil correspondant est actif, et dont les valeurs **complètent ou surchargent** celles du fichier principal. Ex. `application-dev.yml` pour le profil `dev`."
  - terme: "@Profile"
    definition: "Annotation posée sur un `@Component` ou une méthode `@Bean` : le bean n'est créé que si le profil indiqué est actif. Accepte une négation, ex. `@Profile(\"!prod\")`."
  - terme: "spring.config.activate.on-profile"
    definition: "Dans un fichier YAML multi-documents (séparés par `---`), indique qu'un document ne s'applique que si le profil donné est actif. Remplace l'ancienne syntaxe `spring.profiles: dev` depuis Spring Boot 2.4."
  - terme: Profil par défaut
    definition: "Le profil `default` est actif quand **aucun** profil n'est explicitement défini. `application-default.yml` (rarement utilisé) se comporte comme les autres fichiers de profil."
  - terme: Groupe de profils
    definition: "`spring.profiles.group.production=proddb,proddmq` : activer le profil `production` active aussi automatiquement `proddb` et `proddmq`. Pratique pour regrouper plusieurs profils techniques sous un seul nom."
quiz:
  - question: "Avec ces deux fichiers, que vaut `logging.level.root` en profil `dev` ?"
    code: |
      # application.yml
      logging:
        level:
          root: WARN
      spring:
        application:
          name: boutique-api

      # application-dev.yml
      logging:
        level:
          root: DEBUG
    choix:
      - "WARN, application-dev.yml ne s'applique qu'en absence d'application.yml"
      - "DEBUG, application-dev.yml complète application.yml et surcharge les valeurs communes"
      - "Une erreur au démarrage : la propriété est définie deux fois"
      - "WARN, car application.yml est toujours prioritaire"
    reponse: 1
    explication: "`application-dev.yml` est chargé **en plus** d'`application.yml` quand le profil `dev` est actif, et ses valeurs l'emportent sur celles du fichier principal pour les propriétés en commun. `spring.application.name` reste hérité d'`application.yml` puisqu'il n'est pas redéfini."
  - question: "Ce bean est-il créé quand `spring.profiles.active` n'est pas défini du tout ?"
    code: |
      @Service
      @Profile("!prod")
      public class FausseDonneesService { ... }
    choix:
      - "Non, aucun profil n'étant actif, aucun bean `@Profile` n'est créé"
      - "Oui : en l'absence de profil actif, le profil `default` s'applique, et `!prod` l'inclut"
      - "Non, `@Profile` exige qu'au moins un profil soit explicitement activé"
      - "Une exception est levée au démarrage"
    reponse: 1
    explication: "Sans `spring.profiles.active`, le profil implicite `default` est actif. `@Profile(\"!prod\")` signifie « tout profil sauf prod » : `default` n'étant pas `prod`, le bean est créé. C'est un piège classique : du code de développement peut ainsi se retrouver actif par erreur si le profil `prod` n'est pas explicitement positionné en production."
  - question: "Quelle commande active le profil `prod` au lancement du jar ?"
    choix:
      - "java -jar app.jar --profile=prod"
      - "java -jar app.jar --spring.profiles.active=prod"
      - "java -jar app.jar -Dprofile=prod"
      - "Il faut recompiler le jar avec le profil souhaité"
    reponse: 1
    explication: "`--spring.profiles.active=prod` est un argument de ligne de commande, reconnu comme n'importe quelle propriété Spring Boot. `SPRING_PROFILES_ACTIVE=prod` (variable d'environnement) fonctionne aussi et évite de modifier la commande de lancement entre les environnements."
---

## Essentiel

Un **profil** active une configuration différente selon l'environnement : `dev`, `test`, `prod`. On l'active avec `spring.profiles.active`, par exemple en ligne de commande :

```bash
java -jar boutique-api.jar --spring.profiles.active=dev
# ou en variable d'environnement, souvent utilisé en conteneur
SPRING_PROFILES_ACTIVE=prod java -jar boutique-api.jar
```

Un fichier `application-dev.yml` est alors chargé **en plus** d'`application.yml`, et ses valeurs surchargent celles du fichier principal :

```yaml
# application.yml (commun à tous les environnements)
spring:
  application:
    name: boutique-api

# application-dev.yml (uniquement en profil dev)
spring:
  datasource:
    url: jdbc:h2:mem:boutique
logging:
  level:
    root: DEBUG
```

Un bean peut aussi n'exister que pour certains profils avec `@Profile` :

```java
@Service
@Profile("dev")
public class FausseDonneesService { ... } // jeu de données de test, jamais en prod
```

Sans profil actif, c'est le profil implicite **`default`** qui s'applique.

## Détail

### Exemple 1 — Plusieurs profils actifs à la fois

```bash
java -jar app.jar --spring.profiles.active=prod,monitoring
```

Plusieurs profils peuvent être actifs simultanément (liste séparée par des virgules). Les fichiers `application-prod.yml` et `application-monitoring.yml` sont alors tous les deux chargés.

### Exemple 2 — `@Profile` sur une méthode `@Bean`

```java
@Configuration
public class NotificationConfig {

    @Bean
    @Profile("prod")
    public NotificationService notificationSms() {
        return new SmsNotificationService(); // vrai envoi, coûte de l'argent
    }

    @Bean
    @Profile("!prod")
    public NotificationService notificationConsole() {
        return new ConsoleNotificationService(); // affiche juste le message
    }
}
```

Un seul des deux beans `NotificationService` est créé, selon le profil actif : jamais les deux, jamais aucun (ici, grâce à la négation `!prod` qui couvre tous les autres cas).

### Exemple 3 — Plusieurs documents dans un seul fichier YAML

Depuis Spring Boot 2.4, un seul fichier `application.yml` peut contenir plusieurs documents séparés par `---`, chacun activé par un profil :

```yaml
spring:
  application:
    name: boutique-api
---
spring:
  config:
    activate:
      on-profile: dev
logging:
  level:
    root: DEBUG
---
spring:
  config:
    activate:
      on-profile: prod
logging:
  level:
    root: WARN
```

Pratique pour garder toute la configuration dans un seul fichier plutôt que de la répartir entre `application.yml`, `application-dev.yml`, `application-prod.yml`… Les deux approches (fichiers séparés ou documents dans un seul fichier) sont valides ; un même projet choisit généralement l'une ou l'autre.

### Exemple 4 — Groupes de profils

```properties
spring.profiles.group.production=prod-db,prod-cache
```

```bash
java -jar app.jar --spring.profiles.active=production
# active en réalité : production, prod-db, prod-cache
```

Utile pour regrouper des profils techniques (base de données, cache…) sous un seul profil « métier » à activer.

### Activer un profil, les trois façons courantes

| Méthode | Exemple | Contexte typique |
|---|---|---|
| Argument de ligne de commande | `--spring.profiles.active=dev` | Lancement manuel, script |
| Variable d'environnement | `SPRING_PROFILES_ACTIVE=prod` | Conteneur, CI/CD |
| Fichier de configuration | `spring.profiles.active=dev` dans `application.properties` | Déconseillé en pratique : fige le profil dans le jar |

Définir `spring.profiles.active` **dans** `application.yml` fonctionne, mais fige le profil par défaut pour tout le monde : à réserver à un profil de secours, pas à la configuration normale d'un environnement.

### Pièges courants

> **Aucun profil actif en production.** Sans `spring.profiles.active=prod` explicitement positionné, c'est le profil `default` qui s'applique. Un bean `@Profile("!prod")` (jeu de données de test, service simulé…) se retrouverait alors actif en production.

> **Secrets en clair dans `application-prod.yml`.** Un mot de passe de base de données commité dans le dépôt Git, même dans un fichier de profil, reste un secret exposé. Préférez une variable d'environnement référencée par placeholder : `spring.datasource.password=${DB_PASSWORD}`, la vraie valeur étant fournie au déploiement, jamais versionnée.

> **Ancienne syntaxe `spring.profiles: dev`.** Dépréciée depuis Spring Boot 2.4 au profit de `spring.config.activate.on-profile: dev` dans un document YAML. Avec Spring Boot 3, elle n'est plus acceptée : l'application refuse de démarrer et indique la propriété de remplacement. Pensez-y en migrant un ancien projet ou en copiant un exemple trouvé en ligne.

### À retenir

- `spring.profiles.active` active un ou plusieurs profils (ligne de commande, variable d'environnement, ou fichier).
- `application-{profil}.yml` complète et surcharge `application.yml` pour ce profil.
- `@Profile("nom")` (ou `"!nom"` en négation) restreint un bean à certains profils.
- Sans profil actif, c'est `default` qui s'applique — à ne jamais oublier en production.
- Les secrets (mots de passe, clés d'API) ne doivent jamais être commités : variables d'environnement ou gestionnaire de secrets.
