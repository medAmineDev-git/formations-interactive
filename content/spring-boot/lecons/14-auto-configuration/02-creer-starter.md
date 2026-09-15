---
id: creer-starter
chapitre: auto-config-avancee
ordre: 2
titre: "Créer son propre starter"
termes:
  - terme: Starter
    definition: "Module qui ne contient **aucun code** : seulement des dépendances Maven/Gradle regroupées (la bibliothèque, son auto-configuration, ses dépendances transitives). C'est le module que les projets consommateurs ajoutent à leur `pom.xml`."
  - terme: Module d'auto-configuration
    definition: "Module séparé, contenant les classes `@AutoConfiguration` et les `@ConfigurationProperties`. Le starter en dépend ; ce découpage en deux modules permet à un projet de dépendre de l'auto-configuration seule, sans passer par le starter, si besoin."
  - terme: Convention de nommage
    definition: "Le préfixe `spring-boot-starter-*` (ex. `spring-boot-starter-web`) est **réservé aux starters officiels** maintenus par l'équipe Spring Boot. Un starter tiers se nomme `<nom>-spring-boot-starter` (ex. `acme-spring-boot-starter`), et son module d'auto-configuration `<nom>-spring-boot-autoconfigure`."
  - terme: "AutoConfiguration.imports"
    definition: "Fichier `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` du module d'auto-configuration, listant en clair (une classe par ligne, nom complet) les classes `@AutoConfiguration` à enregistrer comme candidates."
  - terme: spring-boot-configuration-processor
    definition: "Dépendance (portée `optional` ou `annotationProcessor`) qui génère, à la compilation, `META-INF/spring-configuration-metadata.json` : les métadonnées qui alimentent l'autocomplétion et la documentation des propriétés dans l'IDE, à partir des classes `@ConfigurationProperties`."
  - terme: "@ConditionalOnMissingBean (dans un starter)"
    definition: "Posée sur chaque `@Bean` fourni par le starter, elle garantit que **tout bean défini par l'application consommatrice prime automatiquement** sur celui du starter, sans qu'elle ait besoin d'exclure quoi que ce soit."
  - terme: ApplicationContextRunner
    definition: "Classe utilitaire (`org.springframework.boot.test.context.runner`) pour tester une auto-configuration **isolément**, sans démarrer une vraie application : `withUserConfiguration(...)`, `withPropertyValues(...)`, `withClassLoader(...)`, puis `run(context -> ...)`."
quiz:
  - question: "Pourquoi nomme-t-on un starter tiers `acme-spring-boot-starter` plutôt que `spring-boot-starter-acme`, en suivant la convention Java classique des starters officiels ?"
    choix:
      - "Les deux formes sont équivalentes, c'est une simple préférence stylistique"
      - "`spring-boot-starter-*` est réservé aux starters maintenus par l'équipe Spring Boot ; l'inverser évite toute confusion sur la provenance du module"
      - "Maven interdit les artifactId commençant par `spring-boot-starter-` en dehors de `org.springframework.boot`"
      - "`spring-boot-starter-acme` ne serait pas détecté par le mécanisme d'auto-configuration"
    reponse: 1
    explication: "C'est une convention documentée par Spring Boot, pas une contrainte technique de Maven ni du mécanisme d'auto-configuration : `spring-boot-starter-*` signale un module officiel. La respecter évite qu'un utilisateur croie, à tort, qu'un starter tiers est maintenu par l'équipe Spring."
  - question: "Ce test vérifie une auto-configuration de starter avec `ApplicationContextRunner`. Que vérifie-t-il précisément ?"
    code: |
      @Test
      void beanRemplaceParUtilisateur() {
          new ApplicationContextRunner()
              .withConfiguration(AutoConfigurations.of(AcmeAutoConfiguration.class))
              .withUserConfiguration(ConfigurationUtilisateur.class)
              .run(context -> assertThat(context)
                  .getBean(AcmeClient.class)
                  .isSameAs(context.getBean(ConfigurationUtilisateur.class).acmeClient()));
      }
    choix:
      - "Que l'auto-configuration échoue si l'utilisateur définit son propre bean"
      - "Que le bean `AcmeClient` défini par l'utilisateur prend le pas sur celui de l'auto-configuration, grâce à `@ConditionalOnMissingBean`"
      - "Que les deux beans `AcmeClient` coexistent dans le contexte"
      - "Que `ApplicationContextRunner` démarre un vrai serveur embarqué pour tester le starter en conditions réelles"
    reponse: 1
    explication: "`withUserConfiguration` simule une classe de configuration de l'application consommatrice, chargée avant l'auto-configuration testée. Le test vérifie qu'`AcmeClient` obtenu dans le contexte est bien celui de l'utilisateur : la preuve que `@ConditionalOnMissingBean` a bien laissé la priorité au bean applicatif, sans démarrer de serveur ni de contexte web complet."
  - question: "À quoi sert `spring-boot-configuration-processor` dans un module de starter qui expose une classe `@ConfigurationProperties` ?"
    choix:
      - "Il valide au démarrage que toutes les propriétés obligatoires sont renseignées"
      - "Il génère les métadonnées (`spring-configuration-metadata.json`) qui permettent l'autocomplétion et la documentation des propriétés dans l'IDE"
      - "Il transforme automatiquement le fichier `application.yml` en objet Java"
      - "Il est indispensable pour que `@ConfigurationProperties` fonctionne à l'exécution"
    reponse: 1
    explication: "C'est un outil purement lié à l'expérience de développement (autocomplétion, documentation au survol dans l'IDE) : le binding des propriétés fonctionne sans lui. Il ne fait aucune validation à l'exécution ; c'est un annotation processor qui s'exécute à la compilation."
---

## Essentiel

Un starter Spring Boot bien conçu se compose en pratique de **deux modules** : un module d'**auto-configuration** (le code, les classes `@AutoConfiguration`, les `@ConfigurationProperties`) et un module **starter** au sens strict, qui ne contient aucune classe et se contente de déclarer les dépendances (l'auto-configuration, la bibliothèque cliente, ses dépendances transitives). Un projet peut ainsi dépendre du module d'auto-configuration seul, sans passer par le starter, si son propre mécanisme d'assemblage de dépendances diffère.

La convention de nommage compte : `spring-boot-starter-*` est réservé aux starters officiels. Un starter tiers s'appelle `acme-spring-boot-starter`, son module d'auto-configuration `acme-spring-boot-autoconfigure`.

Le cœur du module d'auto-configuration :

```java
@AutoConfiguration
@ConditionalOnClass(AcmeClient.class)
@EnableConfigurationProperties(AcmeProperties.class)
public class AcmeAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public AcmeClient acmeClient(AcmeProperties properties) {
        return new AcmeClient(properties.getUrl(), properties.getTimeout());
    }
}
```

`@ConditionalOnMissingBean` sur chaque bean fourni garantit qu'un bean défini par l'application consommatrice prend toujours le dessus, sans qu'elle ait besoin d'exclure quoi que ce soit. La classe est déclarée candidate en l'ajoutant, une par ligne, au fichier `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.

## Détail

### Structure des deux modules

```
acme-spring-boot-autoconfigure/
  src/main/java/.../AcmeAutoConfiguration.java
  src/main/java/.../AcmeProperties.java
  src/main/resources/META-INF/spring/
    org.springframework.boot.autoconfigure.AutoConfiguration.imports

acme-spring-boot-starter/
  pom.xml   # dépend de acme-spring-boot-autoconfigure + de la lib acme cliente
            # aucune classe Java dans ce module
```

Cette séparation reprend exactement celle des starters officiels : par exemple `spring-boot-starter-data-jpa` (dépendances) et `spring-boot-autoconfigure` (le code, partagé par tous les starters officiels).

### Exemple 1 — Propriétés typées avec métadonnées IDE

```java
@ConfigurationProperties(prefix = "acme")
public class AcmeProperties {

    /**
     * URL du service Acme.
     */
    private String url = "https://api.acme.example";

    /**
     * Délai d'attente avant abandon d'une requête.
     */
    private Duration timeout = Duration.ofSeconds(5);

    // getters/setters
}
```

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-configuration-processor</artifactId>
    <optional>true</optional>
</dependency>
```

Avec cette dépendance, la Javadoc des champs devient la description affichée par l'IDE lors de la saisie de `acme.url` dans `application.yml`. Pour une propriété qui ne peut pas être déduite automatiquement (valeur calculée, type complexe), on peut compléter avec un fichier `META-INF/additional-spring-configuration-metadata.json` écrit à la main.

### Exemple 2 — Laisser l'utilisateur surcharger une valeur, pas seulement un bean entier

```java
@AutoConfiguration
@ConditionalOnClass(AcmeClient.class)
@EnableConfigurationProperties(AcmeProperties.class)
public class AcmeAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public AcmeClient acmeClient(AcmeProperties properties) {
        return new AcmeClient(properties.getUrl(), properties.getTimeout());
    }
}
```

```yaml
acme:
  url: https://acme.interne.entreprise.fr
  timeout: 10s
```

Ici, l'utilisateur n'a besoin de redéfinir **ni bean ni configuration Java** : ajuster les propriétés suffit. C'est le niveau de personnalisation le plus léger, à privilégier chaque fois que c'est possible ; remplacer le bean entier via `@ConditionalOnMissingBean` reste la solution pour les cas qui dépassent une simple valeur.

### Exemple 3 — Tester l'auto-configuration avec ApplicationContextRunner

```java
class AcmeAutoConfigurationTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(AcmeAutoConfiguration.class));

    @Test
    void creeLeClientParDefaut() {
        contextRunner.run(context ->
                assertThat(context).hasSingleBean(AcmeClient.class));
    }

    @Test
    void appliqueLesProprietes() {
        contextRunner
                .withPropertyValues("acme.url=https://test.local", "acme.timeout=2s")
                .run(context -> {
                    AcmeClient client = context.getBean(AcmeClient.class);
                    assertThat(client.getUrl()).isEqualTo("https://test.local");
                });
    }

    @Test
    void neSActivePasSansLaClasseClient() {
        contextRunner
                .withClassLoader(new FilteredClassLoader(AcmeClient.class))
                .run(context -> assertThat(context).doesNotHaveBean(AcmeClient.class));
    }
}
```

`ApplicationContextRunner` construit un `ApplicationContext` minimal, sans serveur web ni auto-configurations superflues : seule celle testée (et ses dépendances explicites) est chargée. `withClassLoader(new FilteredClassLoader(...))` simule l'absence d'une classe du classpath, pour vérifier qu'`@ConditionalOnClass` fonctionne comme prévu.

### Ce qu'un starter fournit, au minimum

| Élément | Rôle |
|---|---|
| Classe(s) `@AutoConfiguration` | Déclarent les beans, sous conditions |
| `AutoConfiguration.imports` | Enregistre les classes comme candidates |
| Classe `@ConfigurationProperties` | Regroupe les options exposées à l'utilisateur |
| `spring-boot-configuration-processor` | Génère la documentation IDE des propriétés |
| Tests avec `ApplicationContextRunner` | Vérifient chaque condition en isolation |

### Pièges courants

> **Oublier `@ConditionalOnMissingBean`.** Sans elle, un bean défini par l'application consommatrice entre en conflit avec celui du starter (`NoUniqueBeanDefinitionException`) au lieu de le remplacer silencieusement : le starter cesse d'être personnalisable sans exclusion explicite.

> **Placer `AutoConfiguration.imports` au mauvais endroit ou mal l'orthographier.** Le fichier doit être sous `src/main/resources/META-INF/spring/`, avec ce nom exact (`org.springframework.boot.autoconfigure.AutoConfiguration.imports`). Une erreur de chemin ou de nom rend l'auto-configuration invisible, sans message d'erreur au démarrage.

> **Ne pas ajouter `@ConditionalOnClass` sur la bibliothèque cliente.** Sans cette garde, l'auto-configuration s'active même si le starter est présent sans que la classe centrale de la bibliothèque le soit (dépendance `optional`, exclusion manuelle…), provoquant un `NoClassDefFoundError` au lieu d'une absence silencieuse.

### À retenir

- Deux modules : `*-spring-boot-autoconfigure` (le code) et `*-spring-boot-starter` (les dépendances, sans code).
- Le préfixe `spring-boot-starter-*` est réservé aux starters officiels ; un starter tiers s'appelle `<nom>-spring-boot-starter`.
- Les classes candidates sont listées dans `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.
- `@ConditionalOnMissingBean` sur chaque bean fourni permet à l'utilisateur de le remplacer sans configuration particulière.
- `ApplicationContextRunner` teste une auto-configuration isolément, y compris ses conditions (`withPropertyValues`, `withUserConfiguration`, `withClassLoader`).
