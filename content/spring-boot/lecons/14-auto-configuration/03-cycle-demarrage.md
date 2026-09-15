---
id: cycle-demarrage
chapitre: auto-config-avancee
ordre: 3
titre: "Le démarrage de Spring Boot en profondeur"
termes:
  - terme: "SpringApplication.run"
    definition: "Point d'entrée qui orchestre tout le démarrage : création de l'`Environment`, sélection du type de contexte (servlet, réactif, autonome), création de l'`ApplicationContext`, chargement des sources de configuration (dont l'auto-configuration), puis `refresh()` du contexte et exécution des `CommandLineRunner`/`ApplicationRunner`."
  - terme: "Environment et PropertySource"
    definition: "L'`Environment` regroupe les **profils actifs** et les **`PropertySource`** (variables d'environnement, arguments de ligne de commande, `application.yml`, valeurs par défaut…), consultées dans un ordre de priorité précis. Il existe déjà, prêt à être consulté, avant même la création de l'`ApplicationContext`."
  - terme: Événements de démarrage
    definition: "`SpringApplication` publie une séquence d'événements tout au long du démarrage : `ApplicationStartingEvent`, `ApplicationEnvironmentPreparedEvent`, `ApplicationContextInitializedEvent`, `ApplicationPreparedEvent`, puis, après le `refresh()` du contexte, `ApplicationStartedEvent` et enfin `ApplicationReadyEvent`. `ApplicationFailedEvent` remplace la suite en cas d'échec, à n'importe quelle étape."
  - terme: ApplicationContextInitializer
    definition: "Interface permettant d'agir sur l'`ApplicationContext` **juste après sa création, avant `refresh()`** — donc avant l'enregistrement des beans. Utile pour enregistrer des `PropertySource` supplémentaires ou des profils par programmation."
  - terme: EnvironmentPostProcessor
    definition: "Interface permettant de modifier l'`Environment` **avant même la création de l'`ApplicationContext`** (ajouter, réordonner ou remplacer des `PropertySource`). Contrairement aux classes d'auto-configuration, elle continue de se déclarer dans un fichier `META-INF/spring.factories` classique."
  - terme: BeanFactoryPostProcessor vs BeanPostProcessor
    definition: "Un `BeanFactoryPostProcessor` agit sur les **définitions de beans** (métadonnées), avant qu'aucun bean ne soit instancié — ex. `PropertySourcesPlaceholderConfigurer` pour résoudre `${...}`. Un `BeanPostProcessor` agit sur chaque **instance** de bean, juste après sa création — c'est le mécanisme qui crée les proxies AOP (`@Transactional`, `@Async`…)."
  - terme: "spring.main.lazy-initialization"
    definition: "Propriété qui rend **tous** les beans paresseux (créés au premier usage plutôt qu'au démarrage). Accélère le démarrage et repousse la découverte d'une erreur de câblage jusqu'à la première requête concernée — à ne pas confondre avec `@Lazy` posé sur un bean précis."
  - terme: FailureAnalyzer
    definition: "Interface qui transforme une exception de démarrage technique en message d'erreur lisible et actionnable (ex. port déjà utilisé, propriété manquante). Déclarée elle aussi via `META-INF/spring.factories`, distincte du mécanisme d'auto-configuration."
quiz:
  - question: "Un `EnvironmentPostProcessor` doit ajouter une `PropertySource` chargée depuis un fichier externe, dont la valeur doit pouvoir être lue par une classe `@ConfigurationProperties` de l'application. À quel moment du cycle de démarrage intervient-il ?"
    choix:
      - "Après la création de l'`ApplicationContext`, comme un `BeanFactoryPostProcessor`"
      - "Avant même la création de l'`ApplicationContext`, pendant la préparation de l'`Environment`"
      - "Après le `refresh()` du contexte, au moment de `ApplicationStartedEvent`"
      - "Il ne peut pas ajouter de `PropertySource`, seulement en lire"
    reponse: 1
    explication: "`EnvironmentPostProcessor` agit sur l'`Environment`, préparé avant la création de l'`ApplicationContext` — c'est justement ce qui permet à une `PropertySource` ajoutée ici d'être visible par toute classe `@ConfigurationProperties` liée plus tard, pendant le `refresh()`. Un `BeanFactoryPostProcessor` intervient bien après, sur un contexte déjà créé."
  - question: "Quel est le principal compromis de `spring.main.lazy-initialization=true` appliqué à toute une application ?"
    choix:
      - "Aucun : c'est une pure optimisation, sans effet observable ailleurs"
      - "Le démarrage est plus rapide, mais une erreur de câblage ou une dépendance manquante n'est découverte qu'au premier appel concerné, pas au démarrage ; le temps de réponse de la première requête concernée augmente aussi"
      - "Les beans singleton deviennent des beans prototype"
      - "Cela désactive l'auto-configuration pour les beans concernés"
    reponse: 1
    explication: "L'initialisation paresseuse globale repousse la création des beans à leur premier usage : le démarrage semble plus rapide, mais une erreur qui aurait normalement stoppé le démarrage (bean mal configuré, dépendance absente) n'apparaît qu'en cours de fonctionnement, et la première requête qui déclenche la création paie ce coût. Elle mélange aussi mal avec des vérifications de santé strictes au démarrage."
  - question: "Une classe implémente `BeanPostProcessor`. À quel moment son `postProcessAfterInitialization` s'exécute-t-il pour un bean donné, et pourquoi est-ce le mécanisme derrière `@Transactional` ?"
    choix:
      - "Avant l'instanciation du bean, pour modifier sa définition"
      - "Juste après l'initialisation complète du bean (constructeur, injection, `@PostConstruct`) : c'est l'endroit où Spring peut remplacer l'instance par un proxy"
      - "Uniquement au moment de la destruction du contexte"
      - "Avant la résolution des propriétés `${...}` du bean"
    reponse: 1
    explication: "`postProcessAfterInitialization` reçoit le bean déjà entièrement construit et initialisé, et peut renvoyer un objet différent : c'est exactement ainsi que les proxies AOP (`@Transactional`, `@Async`, `@Cacheable`) sont créés — le bean « brut » est remplacé par son proxy à cette étape, avant d'être exposé au reste de l'application. `BeanFactoryPostProcessor`, lui, agirait plus tôt, sur la définition plutôt que sur l'instance."
  - question: "Dans quel ordre ces événements sont-ils publiés lors d'un démarrage réussi ?"
    choix:
      - "ApplicationReadyEvent, ApplicationStartedEvent, ApplicationPreparedEvent, ApplicationStartingEvent"
      - "ApplicationStartingEvent, ApplicationEnvironmentPreparedEvent, ApplicationPreparedEvent, ApplicationStartedEvent, ApplicationReadyEvent"
      - "ApplicationEnvironmentPreparedEvent, ApplicationStartingEvent, ApplicationReadyEvent, ApplicationStartedEvent"
      - "ApplicationPreparedEvent, ApplicationContextInitializedEvent, ApplicationStartingEvent, ApplicationReadyEvent"
    reponse: 1
    explication: "L'ordre suit la construction progressive de l'application : d'abord aucun `Environment` ni contexte (`ApplicationStartingEvent`), puis l'`Environment` prêt (`ApplicationEnvironmentPreparedEvent`), puis le contexte créé mais pas encore rafraîchi (`ApplicationContextInitializedEvent`, entre les deux listés ici), puis les sources de configuration chargées (`ApplicationPreparedEvent`), puis le contexte rafraîchi (`ApplicationStartedEvent`), et enfin, une fois les `CommandLineRunner`/`ApplicationRunner` exécutés, `ApplicationReadyEvent`."
---

## Essentiel

`SpringApplication.run()` orchestre un démarrage en plusieurs phases bien distinctes, chacune marquée par un événement publié sur un `ApplicationListener` (ou une méthode `@EventListener`) :

1. **`ApplicationStartingEvent`** — tout commence, ni `Environment` ni contexte n'existent encore.
2. **`ApplicationEnvironmentPreparedEvent`** — l'`Environment` (profils, `PropertySource`) est prêt, mais le contexte n'existe pas encore.
3. **`ApplicationContextInitializedEvent`** — le contexte est créé, les `ApplicationContextInitializer` s'exécutent, mais aucun bean n'est encore enregistré.
4. **`ApplicationPreparedEvent`** — les sources de configuration (dont l'auto-configuration) sont chargées dans le contexte, juste avant son `refresh()`.
5. *(le `refresh()` s'exécute : instanciation de tous les beans singleton non paresseux)*
6. **`ApplicationStartedEvent`** — le contexte est rafraîchi, l'application est démarrée mais pas encore déclarée prête.
7. **`ApplicationReadyEvent`** — les `CommandLineRunner`/`ApplicationRunner` ont été exécutés : l'application est prête à traiter des requêtes.

À tout moment, un échec déclenche `ApplicationFailedEvent` à la place de la suite normale.

```java
@Component
public class DemarrageListener {
    @EventListener
    public void auDemarrage(ApplicationReadyEvent event) {
        // sûr d'être exécuté après que tous les beans sont initialisés
    }
}
```

Deux interfaces permettent d'intervenir **tôt**, avant même que des beans existent : `EnvironmentPostProcessor` (modifie l'`Environment`, avant la création du contexte) et `ApplicationContextInitializer` (agit sur le contexte fraîchement créé, avant `refresh()`).

## Détail

### Comment ça marche

`SpringApplication.run()` déroule, dans l'ordre : préparation du `bootstrapContext`, exécution des `ApplicationContextInitializer`, préparation de l'`Environment` (lecture des `PropertySource`, application des `EnvironmentPostProcessor`), sélection et instanciation de l'`ApplicationContext` adapté (servlet, réactif, ou simple), enregistrement des sources de configuration (dont, via `@EnableAutoConfiguration`, l'ensemble des classes candidates à l'auto-configuration), puis l'appel à `context.refresh()` — la méthode historique de Spring Framework qui instancie effectivement tous les beans singleton non paresseux, dans l'ordre déterminé par leurs dépendances. Le mécanisme d'auto-configuration décrit dans les autres leçons de ce chapitre n'intervient donc qu'à partir de l'étape 4 : avant cela, seuls l'`Environment` et le contexte lui-même existent.

### Exemple 1 — Un EnvironmentPostProcessor

```java
public class ChiffrementPropertySourceProcessor implements EnvironmentPostProcessor {
    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        environment.getPropertySources()
                .addFirst(new ChiffrementPropertySource("proprietes-chiffrees"));
    }
}
```

```
# src/main/resources/META-INF/spring.factories
org.springframework.boot.env.EnvironmentPostProcessor=\
com.boutique.config.ChiffrementPropertySourceProcessor
```

Contrairement aux classes `@AutoConfiguration`, listées depuis Spring Boot 3 dans `AutoConfiguration.imports`, un `EnvironmentPostProcessor` continue de se déclarer via l'ancien mécanisme `META-INF/spring.factories` : seule la clé `org.springframework.boot.autoconfigure.AutoConfiguration` (l'auto-configuration proprement dite) a migré vers le nouveau fichier ; les autres points d'extension de `spring.factories` (initialiseurs de contexte, analyseurs d'échec, écouteurs d'événements…) restent inchangés.

### Exemple 2 — Un ApplicationContextInitializer

```java
public class ProfilParDefautInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext context) {
        if (context.getEnvironment().getActiveProfiles().length == 0) {
            context.getEnvironment().setActiveProfiles("dev");
        }
    }
}
```

Intervient après la création du contexte, mais avant `refresh()` : aucun bean n'existe encore, seul l'`Environment` du contexte peut être ajusté. Utile pour imposer une valeur par défaut avant que la résolution des `@Profile` ne détermine quelles classes de configuration s'activent.

### Exemple 3 — Distinguer BeanFactoryPostProcessor et BeanPostProcessor

```java
// Agit sur les DÉFINITIONS, avant toute instanciation
public class ExempleBeanFactoryPostProcessor implements BeanFactoryPostProcessor {
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
        BeanDefinition def = beanFactory.getBeanDefinition("commandeService");
        def.setScope(BeanDefinition.SCOPE_PROTOTYPE); // avant que quoi que ce soit soit créé
    }
}

// Agit sur les INSTANCES, une par une, après leur création
public class ExempleBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean instanceof CommandeService) {
            return creerProxyDeJournalisation(bean); // remplace l'instance par un proxy
        }
        return bean;
    }
}
```

C'est exactement ce second mécanisme, appliqué en interne par Spring, qui crée les proxies AOP derrière `@Transactional`, `@Async` ou `@Cacheable` : le bean « nu » sort de `postProcessAfterInitialization` remplacé par son proxy.

### Exemple 4 — Un FailureAnalyzer

```java
public class PortOccupeFailureAnalyzer extends AbstractFailureAnalyzer<PortInUseException> {
    @Override
    protected FailureAnalysis analyze(Throwable rootFailure, PortInUseException cause) {
        return new FailureAnalysis(
                "Le port " + cause.getPort() + " est déjà utilisé.",
                "Arrêtez le processus qui occupe ce port, ou changez server.port.",
                cause);
    }
}
```

C'est ce mécanisme qui transforme une pile d'exceptions brute en message d'erreur structuré et actionnable au démarrage (« Description » / « Action ») — comme celui affiché par Spring Boot lui-même quand un port est déjà occupé. Il se déclare, lui aussi, via `META-INF/spring.factories`.

### Ce qui a changé, ce qui n'a pas changé (Spring Boot 3)

| Extension | Déclaration |
|---|---|
| `@AutoConfiguration` | `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` |
| `EnvironmentPostProcessor` | `META-INF/spring.factories` (inchangé) |
| `ApplicationContextInitializer` | `META-INF/spring.factories`, ou `SpringApplication.addInitializers(...)` |
| `FailureAnalyzer` | `META-INF/spring.factories` (inchangé) |
| `ApplicationListener` | `META-INF/spring.factories`, ou bean `@Component` avec `@EventListener` |

Seule l'auto-configuration proprement dite a migré vers son propre fichier dédié ; les autres points d'extension historiques de `spring.factories` n'ont pas changé de mécanisme.

### Pièges courants

> **Injecter des beans applicatifs dans un `ApplicationContextInitializer` ou un `EnvironmentPostProcessor`.** Ces deux interfaces s'exécutent **avant** que le contexte contienne un seul bean applicatif : il n'y a rien à injecter à ce stade, seuls l'`Environment` et le contexte brut sont accessibles.

> **Utiliser `spring.main.lazy-initialization=true` pour masquer un problème de démarrage lent.** Cela repousse le coût (et les erreurs de câblage) à la première requête concernée, au lieu de le résoudre. Utile en développement pour itérer plus vite, à valider soigneusement avant la production.

> **Confondre `ApplicationStartedEvent` et `ApplicationReadyEvent`.** Entre les deux s'exécutent les `CommandLineRunner`/`ApplicationRunner` : un traitement qui doit s'exécuter *après* eux (ou dépendre de leur résultat) doit écouter `ApplicationReadyEvent`, pas `ApplicationStartedEvent`.

### À retenir

- Le démarrage progresse par étapes marquées d'événements : Starting → EnvironmentPrepared → ContextInitialized → Prepared → (refresh du contexte) → Started → Ready.
- `EnvironmentPostProcessor` (avant le contexte) et `ApplicationContextInitializer` (après le contexte, avant `refresh()`) permettent d'intervenir tôt, sans accès aux beans applicatifs.
- Seule l'auto-configuration a migré vers `AutoConfiguration.imports` ; les autres extensions (`EnvironmentPostProcessor`, `FailureAnalyzer`, `ApplicationContextInitializer`) restent déclarées dans `META-INF/spring.factories`.
- `BeanFactoryPostProcessor` agit sur les définitions de beans ; `BeanPostProcessor` agit sur les instances, et c'est lui qui crée les proxies AOP.
- `spring.main.lazy-initialization=true` accélère le démarrage au prix d'erreurs découvertes plus tard, à la première utilisation.
