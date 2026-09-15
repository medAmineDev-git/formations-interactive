---
id: auto-configuration-principe
chapitre: demarrer
ordre: 3
titre: "L'auto-configuration : le principe"
termes:
  - terme: "@EnableAutoConfiguration"
    definition: "Annotation qui active l'auto-configuration de Spring Boot ; incluse dans `@SpringBootApplication`. Elle déclenche l'évaluation d'un ensemble de classes de configuration candidates, chacune activée ou non selon ses conditions."
  - terme: "@ConditionalOnClass"
    definition: "Condition qui n'active une configuration que si une classe donnée est présente dans le classpath. Exemple : la configuration Jackson ne s'active que si `ObjectMapper` est disponible (apporté par `spring-boot-starter-web` ou `-json`)."
  - terme: "@ConditionalOnMissingBean"
    definition: "Condition qui n'active un bean que si **aucun bean du même type** n'a déjà été défini par l'application. C'est ce qui permet à vos propres beans d'être toujours prioritaires sur ceux de l'auto-configuration."
  - terme: "@ConditionalOnProperty"
    definition: "Condition qui active une configuration selon la valeur d'une propriété (`application.properties`/`.yml`). Exemple : `@ConditionalOnProperty(name = \"ma.fonction.activee\", havingValue = \"true\")`."
  - terme: "AutoConfiguration.imports"
    definition: "Fichier `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`, présent dans le jar `spring-boot-autoconfigure`, qui liste toutes les classes de configuration candidates à l'auto-configuration (une par ligne). Chacune est ensuite retenue ou écartée selon ses conditions."
  - terme: Rapport des conditions
    definition: "Journal détaillant, pour chaque classe de configuration candidate, pourquoi elle a été retenue (« matched ») ou écartée (« did not match »). Affiché en lançant l'application avec `--debug`, ou `debug=true` dans `application.properties`."
  - terme: Exclure une auto-configuration
    definition: "Désactiver explicitement une classe d'auto-configuration, avec `exclude` sur `@SpringBootApplication` ou la propriété `spring.autoconfigure.exclude`. Utile quand l'auto-configuration par défaut ne convient pas (ex. gérer soi-même le `DataSource`)."
quiz:
  - question: "Une application ajoute `spring-boot-starter-data-jpa` et définit son propre bean `DataSource`. Quel `DataSource` est utilisé au final ?"
    code: |
      @Configuration
      public class DbConfig {
          @Bean
          public DataSource dataSource() {
              return DataSourceBuilder.create()
                  .url("jdbc:postgresql://prod-db/boutique")
                  .build();
          }
      }
    choix:
      - "Celui créé par l'auto-configuration de Spring Boot, car elle a la priorité"
      - "Celui défini par l'application, car `@ConditionalOnMissingBean` fait s'effacer l'auto-configuration"
      - "Les deux sont créés, et Spring choisit au hasard"
      - "Le démarrage échoue : deux `DataSource` sont en conflit"
    reponse: 1
    explication: "L'auto-configuration du `DataSource` est annotée `@ConditionalOnMissingBean(DataSource.class)` : dès qu'un bean `DataSource` existe déjà (le vôtre), elle ne s'active pas. C'est la règle générale : vos beans priment toujours sur ceux de l'auto-configuration."
  - question: "Comment savoir pourquoi une auto-configuration attendue ne s'est pas activée ?"
    choix:
      - "Regarder le fichier `pom.xml`"
      - "Lancer l'application avec `--debug` (ou `debug=true`) pour afficher le rapport des conditions"
      - "Ce n'est pas possible, il faut lire le code source de Spring Boot"
      - "Ajouter `@ConditionalOnMissingBean` dans sa propre classe"
    reponse: 1
    explication: "Le rapport des conditions (`--debug` ou `debug=true`) liste, pour chaque configuration candidate, les conditions évaluées et pourquoi elle a « matched » ou « did not match ». C'est le premier réflexe pour diagnostiquer une auto-configuration manquante ou en trop."
  - question: "Que fait `exclude = DataSourceAutoConfiguration.class` sur `@SpringBootApplication` ?"
    code: |
      @SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
      public class BoutiqueApplication { ... }
    choix:
      - "Supprime le driver JDBC du classpath"
      - "Empêche l'auto-configuration de créer un `DataSource`, même si un driver de base de données est présent"
      - "Empêche toute connexion à une base de données dans l'application"
      - "N'a aucun effet si `spring-boot-starter-data-jpa` est présent"
    reponse: 1
    explication: "`exclude` désactive une classe d'auto-configuration précise, quel que soit le classpath. Utile quand on veut configurer soi-même une ressource (plusieurs `DataSource`, configuration avancée) sans que l'auto-configuration standard entre en jeu."
---

## Essentiel

L'**auto-configuration** crée automatiquement des beans d'infrastructure selon ce qui est présent dans le classpath et la configuration. Elle est activée par `@EnableAutoConfiguration`, inclus dans `@SpringBootApplication`.

Concrètement : Spring Boot embarque des centaines de classes de configuration candidates (dans `spring-boot-autoconfigure`), listées dans un fichier `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`. Chacune ne s'active que si ses **conditions** sont remplies :

```java
@AutoConfiguration
@ConditionalOnClass(DataSource.class)          // le driver JDBC est présent
@ConditionalOnMissingBean(DataSource.class)     // vous n'avez pas déjà défini le vôtre
public class DataSourceAutoConfiguration {
    @Bean
    public DataSource dataSource(DataSourceProperties properties) { ... }
}
```

Règle essentielle : **vos beans sont toujours prioritaires**. Si vous définissez votre propre `DataSource`, l'auto-configuration s'efface grâce à `@ConditionalOnMissingBean`. Vous n'avez donc jamais besoin de « désactiver » quoi que ce soit pour personnaliser une infrastructure : il suffit de fournir votre propre bean.

## Détail

### Comment ça marche

Au démarrage, `@EnableAutoConfiguration` fait charger la liste des classes candidates depuis `AutoConfiguration.imports`. Chacune est ensuite évaluée : ses annotations `@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty` (et d'autres) décident si elle s'active. Le résultat dépend donc de trois choses : le **classpath** (quels starters sont présents), les **beans déjà définis** par l'application, et la **configuration** (`application.properties`).

### Exemple 1 — Jackson activé selon le classpath

```java
@AutoConfiguration
@ConditionalOnClass(ObjectMapper.class)
public class JacksonAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public ObjectMapper objectMapper() { ... }
}
```

`ObjectMapper` (Jackson) arrive avec `spring-boot-starter-web`. Un projet sans dépendance web n'a pas cette classe dans son classpath : la configuration Jackson ne s'active pas.

### Exemple 2 — Personnaliser sans tout réécrire

```java
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }
}
```

Ce bean remplace celui de l'auto-configuration (`@ConditionalOnMissingBean` s'en assure) : pas besoin d'exclusion, juste définir le vôtre.

### Exemple 3 — Activer une configuration par propriété

```java
@AutoConfiguration
@ConditionalOnProperty(name = "boutique.cache.active", havingValue = "true")
public class CacheAutoConfiguration {
    @Bean
    public CacheManager cacheManager() { ... }
}
```

```properties
boutique.cache.active=true
```

Sans cette propriété (ou avec `false`), la configuration ne s'active pas : c'est une bascule explicite, contrairement à `@ConditionalOnClass` qui dépend du classpath.

### Exemple 4 — Exclure une auto-configuration

```java
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class BoutiqueApplication { ... }
```

```properties
# Équivalent en propriété (pratique par profil)
spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
```

Utile quand l'auto-configuration par défaut ne convient pas du tout (par exemple plusieurs sources de données à configurer manuellement), plutôt que de la laisser s'effacer devant un simple bean.

### Exemple 5 — Lire le rapport des conditions

```bash
mvn spring-boot:run -Dspring-boot.run.arguments=--debug
```

```
============================
CONDITIONS EVALUATION REPORT
============================

Positive matches:
-----------------
   DataSourceAutoConfiguration matched:
      - @ConditionalOnClass found required class 'javax.sql.DataSource' (OnClassCondition)

Negative matches:
-----------------
   JacksonAutoConfiguration:
      Did not match:
         - @ConditionalOnClass did not find required class 'com.fasterxml.jackson.databind.ObjectMapper' (OnClassCondition)
```

Le rapport liste chaque configuration candidate, avec la raison précise de son activation ou de son rejet.

### Pièges courants

> **Croire qu'il faut exclure une auto-configuration pour la personnaliser.** Dans la grande majorité des cas, définir son propre bean suffit : `@ConditionalOnMissingBean` fait le travail. `exclude` est réservé aux cas où l'on veut empêcher toute tentative de configuration automatique.

> **Un bean personnalisé qui n'a pas le bon type ou n'est pas détecté.** Si votre `@Bean` est dans une classe hors du package scanné, ou renvoie un sous-type différent de celui attendu par `@ConditionalOnMissingBean`, l'auto-configuration peut s'activer quand même et entrer en conflit. Vérifiez le rapport des conditions en cas de doute.

> **Confondre `@ConditionalOnClass` (dépend du classpath) et `@ConditionalOnProperty` (dépend de la configuration).** Retirer une dépendance désactive la première ; seule une propriété désactive la seconde.

### À retenir

- L'auto-configuration crée des beans d'infrastructure selon le classpath (`@ConditionalOnClass`), les beans déjà présents (`@ConditionalOnMissingBean`) et la configuration (`@ConditionalOnProperty`).
- Les classes candidates sont listées dans `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.
- Vos propres beans sont toujours prioritaires : pas besoin d'exclusion pour les cas courants.
- `exclude` sur `@SpringBootApplication` (ou `spring.autoconfigure.exclude`) désactive complètement une auto-configuration.
- `--debug` (ou `debug=true`) affiche le rapport des conditions : la première chose à consulter en cas de comportement inattendu.
