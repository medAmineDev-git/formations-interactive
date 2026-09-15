---
id: configuration-properties
chapitre: configuration
ordre: 3
titre: "@ConfigurationProperties : une configuration typée"
termes:
  - terme: "@ConfigurationProperties"
    definition: "Annotation qui lie un **groupe** de propriétés partageant un préfixe à une classe (ou un `record`) Java, champ par champ. Ex. `@ConfigurationProperties(prefix = \"app.mail\")` lie toutes les propriétés `app.mail.*`."
  - terme: "@ConfigurationPropertiesScan"
    definition: "Placée sur la classe principale (ou une `@Configuration`), elle fait rechercher automatiquement toutes les classes `@ConfigurationProperties` du projet, sans avoir à les déclarer une par une."
  - terme: "@EnableConfigurationProperties"
    definition: "Alternative à `@ConfigurationPropertiesScan` : enregistre explicitement une (ou plusieurs) classe `@ConfigurationProperties` comme bean, ex. `@EnableConfigurationProperties(AppProperties.class)`."
  - terme: "@Validated"
    definition: "Sur une classe `@ConfigurationProperties`, active la **validation Bean Validation** (`@NotNull`, `@Min`, `@Email`…) des propriétés au démarrage. En cas d'échec, l'application ne démarre pas."
  - terme: Record de configuration
    definition: "Un `record` Java peut porter `@ConfigurationProperties` : ses composants (immuables) deviennent les propriétés liées. Spring Boot 3 reconnaît automatiquement ce mode de liaison par constructeur, sans annotation supplémentaire."
  - terme: Duration et DataSize
    definition: "Types dédiés pour les durées (`Duration`, ex. `15s`, `2m`, `500ms`) et les tailles (`DataSize`, ex. `10MB`, `1GB`), reconnus automatiquement par le binder de `@ConfigurationProperties`."
  - terme: spring-boot-configuration-processor
    definition: "Dépendance optionnelle (annotation processor) qui génère des métadonnées à la compilation, utilisées par l'IDE pour l'**autocomplétion** et la documentation des propriétés personnalisées."
quiz:
  - question: "Cette classe est-elle correctement liée aux propriétés `app.mail.*` ?"
    code: |
      @Component
      @ConfigurationProperties(prefix = "app.mail")
      public class MailProperties {
          private String hote;
          private int port;
          // getters et setters
      }

      // application.yml
      app:
        mail:
          hote: smtp.boutique.fr
          port: 587
    choix:
      - "Non, il manque `@EnableConfigurationProperties`"
      - "Oui : `@Component` suffit à en faire un bean, et `@ConfigurationProperties` lie les propriétés par leurs setters"
      - "Non, `@ConfigurationProperties` doit obligatoirement être sur un `record`"
      - "Non, il faut aussi ajouter `@Value` sur chaque champ"
    reponse: 1
    explication: "`@Component` (ou `@ConfigurationPropertiesScan` sans `@Component`) suffit à enregistrer la classe comme bean ; `@ConfigurationProperties` s'occupe ensuite de lier `hote` et `port` via leurs setters. `@EnableConfigurationProperties` est une alternative à `@Component`, pas un ajout obligatoire."
  - question: "Que se passe-t-il si `app.securite.tentatives-max` est absent, sachant que le champ est annoté `@Min(1)` sur une classe `@Validated` ?"
    code: |
      @ConfigurationProperties(prefix = "app.securite")
      @Validated
      public class SecuriteProperties {
          @Min(1)
          private int tentativesMax = 3; // valeur par défaut dans le champ
      }
    choix:
      - "L'application ne démarre pas : la propriété est obligatoire"
      - "`tentativesMax` vaut 3, la valeur par défaut du champ Java, et la validation passe (3 ≥ 1)"
      - "`tentativesMax` vaut 0 et la validation échoue au démarrage"
      - "`@Min` est ignoré car la propriété n'est pas définie"
    reponse: 1
    explication: "Contrairement à `@Value`, une propriété absente n'est pas une erreur pour `@ConfigurationProperties` : le champ garde sa valeur par défaut Java (ici 3, initialisée dans la déclaration du champ). `@Validated` s'applique à la valeur finale du champ, qui respecte bien `@Min(1)`."
  - question: "Pourquoi ajouter la dépendance `spring-boot-configuration-processor` ?"
    choix:
      - "Elle est obligatoire pour que `@ConfigurationProperties` fonctionne"
      - "Elle valide les propriétés au démarrage à la place de `@Validated`"
      - "Elle génère des métadonnées utilisées par l'IDE pour l'autocomplétion et la documentation des propriétés personnalisées, sans effet à l'exécution"
      - "Elle permet d'utiliser des `record` avec `@ConfigurationProperties`"
    reponse: 2
    explication: "C'est un *annotation processor* qui tourne à la **compilation** et produit `META-INF/spring-configuration-metadata.json`. Il n'a aucun rôle à l'exécution ni sur la validation : `@ConfigurationProperties` fonctionne très bien sans lui, on perd juste le confort de l'autocomplétion dans l'IDE."
---

## Essentiel

`@ConfigurationProperties` lie un **groupe** de propriétés partageant un préfixe à un objet Java typé, au lieu d'un `@Value` par propriété :

```java
@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(String hote, int port, String expediteur) { }
```

```yaml
app:
  mail:
    hote: smtp.boutique.fr
    port: 587
    expediteur: no-reply@boutique.fr
```

Pour qu'elle devienne un bean, la classe doit soit être annotée `@Component`, soit être déclarée avec `@EnableConfigurationProperties(MailProperties.class)` sur une `@Configuration`, soit être trouvée par `@ConfigurationPropertiesScan` (sur la classe principale, une seule fois pour tout le projet) :

```java
@SpringBootApplication
@ConfigurationPropertiesScan
public class BoutiqueApplication { ... }
```

Puis on l'injecte comme n'importe quel bean :

```java
@Service
public class MailService {
    public MailService(MailProperties mailProperties) {
        // mailProperties.hote(), mailProperties.port()…
    }
}
```

Avantages sur `@Value` : structure (objets imbriqués, listes, maps), validation avec `@Validated`, et autocomplétion IDE grâce à `spring-boot-configuration-processor`.

## Détail

### Exemple 1 — Avec une classe classique (getters/setters)

```java
@Component
@ConfigurationProperties(prefix = "app.pagination")
public class PaginationProperties {
    private int tailleParDefaut = 20;
    private int tailleMax = 100;

    // getters et setters obligatoires (le binder les utilise)
    public int getTailleParDefaut() { return tailleParDefaut; }
    public void setTailleParDefaut(int v) { this.tailleParDefaut = v; }
    public int getTailleMax() { return tailleMax; }
    public void setTailleMax(int v) { this.tailleMax = v; }
}
```

Une classe classique a besoin de getters **et** setters : le binder appelle les setters pour affecter les valeurs lues.

### Exemple 2 — Objets imbriqués, listes et maps

```yaml
app:
  securite:
    tentatives-max: 5
    origines-autorisees:
      - https://boutique.fr
      - https://admin.boutique.fr
    roles-par-defaut:
      client: LECTURE
      admin: ECRITURE
    login:
      duree-session: 30m
```

```java
@ConfigurationProperties(prefix = "app.securite")
public record SecuriteProperties(
        int tentativesMax,
        List<String> originesAutorisees,
        Map<String, String> rolesParDefaut,
        Login login) {

    public record Login(Duration dureeSession) { }
}
```

Les objets imbriqués (`Login`), les listes et les maps sont liés nativement, sans code supplémentaire.

### Exemple 3 — `Duration` et `DataSize`

```yaml
app:
  cache:
    duree-vie: 15m       # ou 900s, PT15M...
    taille-max: 50MB
```

```java
@ConfigurationProperties(prefix = "app.cache")
public record CacheProperties(Duration dureeVie, DataSize tailleMax) { }
```

`Duration` accepte les suffixes courants (`ns`, `ms`, `s`, `m`, `h`, `d`) ou le format ISO-8601 (`PT15M`). `DataSize` accepte `B`, `KB`, `MB`, `GB`, `TB`. Fini les `long millisecondes` ou `int octets` à interpréter soi-même.

### Exemple 4 — Validation

```java
@ConfigurationProperties(prefix = "app.mail")
@Validated
public record MailProperties(
        @NotBlank String hote,
        @Min(1) @Max(65535) int port,
        @Email String expediteur) { }
```

Si `app.mail.expediteur` n'est pas une adresse valide, l'application **échoue au démarrage** avec le détail de la violation, plutôt que d'échouer plus tard au premier envoi de mail.

### `@Value` vs `@ConfigurationProperties`

| | `@Value` | `@ConfigurationProperties` |
|---|---|---|
| Portée | Une propriété | Un groupe de propriétés (préfixe) |
| Objets imbriqués, listes, maps | Limité | Natif |
| Validation (`@NotNull`, `@Min`…) | Non | Oui, avec `@Validated` |
| SpEL (`#{...}`) | Oui | Non |
| Relaxed binding | Limité | Complet (kebab-case, camelCase…) |
| Autocomplétion IDE | Non | Oui, avec `spring-boot-configuration-processor` |
| Bon pour | Une valeur isolée, ponctuelle | Une configuration structurée, réutilisée |

### Pièges courants

> **Oublier d'enregistrer la classe comme bean.** `@ConfigurationProperties` seule, sans `@Component`, sans `@EnableConfigurationProperties` et sans `@ConfigurationPropertiesScan`, n'est **pas** un bean : rien ne l'injecte, et aucune erreur explicite ne le signale forcément à première vue.

> **`@Component` sur un `record`.** La liaison par constructeur (records, classes immuables) ne fonctionne qu'avec `@EnableConfigurationProperties` ou `@ConfigurationPropertiesScan`. Avec `@Component`, Spring traite le record comme un bean ordinaire et cherche des beans à injecter dans son constructeur : le démarrage échoue. `@Component` ne convient qu'aux classes classiques avec setters.

> **Classe classique sans setters.** Le binder utilise les setters (sauf pour un `record`, lié par son constructeur). Une classe classique sans setter voit ses champs rester à leur valeur par défaut, silencieusement.

> **Préfixe en camelCase.** `@ConfigurationProperties(prefix = "appMail")` fonctionne à l'exécution grâce au relaxed binding, mais Spring Boot recommande le kebab-case (`app-mail` ou `app.mail`) pour rester cohérent avec la casse utilisée dans les fichiers YAML.

### À retenir

- `@ConfigurationProperties(prefix = "...")` lie un groupe de propriétés à un objet typé (classe ou `record`).
- La classe doit être enregistrée comme bean : `@Component`, `@EnableConfigurationProperties`, ou `@ConfigurationPropertiesScan`.
- `@Validated` ajoute la validation Bean Validation au démarrage.
- `Duration` et `DataSize` évitent de gérer soi-même les unités.
- `spring-boot-configuration-processor` apporte l'autocomplétion IDE, sans effet à l'exécution.
