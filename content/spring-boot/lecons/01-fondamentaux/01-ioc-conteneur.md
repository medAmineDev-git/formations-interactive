---
id: ioc-conteneur
chapitre: fondamentaux
ordre: 1
titre: Inversion de contrôle et conteneur Spring
termes:
  - terme: Inversion de contrôle (IoC)
    definition: "Principe selon lequel ce n'est plus votre code qui crée et relie ses objets, mais un framework. Votre classe déclare ce dont elle a besoin, le framework s'occupe du reste. On le résume par le « principe d'Hollywood » : *ne nous appelez pas, c'est nous qui vous appellerons*."
  - terme: Conteneur Spring (IoC container)
    definition: "Le composant de Spring qui crée les objets de l'application, les configure, leur fournit leurs dépendances et gère leur cycle de vie jusqu'à l'arrêt. En pratique, c'est l'`ApplicationContext`."
  - terme: Bean
    definition: "Un objet dont le cycle de vie est géré par le conteneur Spring. Un objet créé avec `new MaClasse()` dans votre code n'est **pas** un bean : Spring ne le connaît pas."
  - terme: ApplicationContext
    definition: "L'interface principale du conteneur. Elle étend `BeanFactory` et ajoute : les événements applicatifs, l'internationalisation (`MessageSource`), le chargement de ressources et la création des beans singleton **dès le démarrage**. Dans Spring Boot, il est créé par `SpringApplication.run(...)`."
  - terme: BeanFactory
    definition: "L'interface de base du conteneur : elle sait créer et fournir des beans (`getBean(...)`). On ne l'utilise presque jamais directement, `ApplicationContext` la complète."
  - terme: Couplage fort / couplage faible
    definition: "**Couplage fort** : une classe crée elle-même ses dépendances concrètes (`new JpaCommandeRepository()`) et ne peut pas en changer sans être modifiée. **Couplage faible** : elle dépend d'une abstraction (une interface) qu'on lui fournit de l'extérieur."
quiz:
  - question: "Que signifie « inversion de contrôle » dans Spring ?"
    choix:
      - "Le développeur contrôle manuellement l'ordre de création de tous les objets"
      - "Le conteneur crée les objets et leur fournit leurs dépendances, à la place de votre code"
      - "Les exceptions remontent du service vers le contrôleur"
      - "Spring inverse l'ordre d'exécution des méthodes annotées"
    reponse: 1
    explication: "Le contrôle de la création et de l'assemblage des objets passe de votre code au conteneur Spring. Votre classe se contente de déclarer ce dont elle a besoin."
  - question: "Dans ce code, l'objet `service` est-il un bean Spring ?"
    code: |
      @Service
      public class CommandeService { /* ... */ }

      @RestController
      public class CommandeController {
          private final CommandeService service = new CommandeService();
      }
    choix:
      - "Oui, car `CommandeController` est un bean"
      - "Oui, car `CommandeService` est annoté `@Service`"
      - "Non : il est créé avec `new`, Spring ne le gère pas"
      - "Cela dépend de `application.properties`"
    reponse: 2
    explication: "Un objet créé avec `new` échappe au conteneur, même si sa classe est annotée `@Service`. Ses propres dépendances ne seront pas injectées et `@Transactional` n'aura aucun effet. Il faut le **recevoir par injection** (dans le constructeur). Au passage, Spring crée quand même son propre bean `CommandeService`, qui existe en parallèle sans être utilisé ici."
  - question: "Quelle affirmation sur `ApplicationContext` est vraie ?"
    choix:
      - "Il faut toujours l'instancier soi-même dans un projet Spring Boot"
      - "Il étend `BeanFactory` et ajoute notamment les événements et l'internationalisation"
      - "Il ne peut contenir qu'un seul bean par package"
      - "Il ne crée les beans singleton qu'au premier appel de `getBean(...)`"
    reponse: 1
    explication: "`ApplicationContext` étend `BeanFactory`. Dans Spring Boot, c'est `SpringApplication.run(...)` qui le crée. Par défaut, il crée les singletons **au démarrage** (sauf ceux marqués `@Lazy`), ce qui permet de détecter les erreurs de configuration tout de suite."
---

## Essentiel

Sans Spring, une classe crée elle-même ses dépendances :

```java
public class CommandeService {
    private final CommandeRepository repo = new JpaCommandeRepository(); // couplage fort
}
```

Avec Spring, c'est l'inverse : la classe **déclare** ce dont elle a besoin, et le **conteneur** (l'`ApplicationContext`) crée les objets et les relie entre eux. C'est l'**inversion de contrôle** (IoC).

```java
@Service
public class CommandeService {
    private final CommandeRepository repo;

    public CommandeService(CommandeRepository repo) { // Spring fournit le repository
        this.repo = repo;
    }
}
```

Les objets gérés par le conteneur s'appellent des **beans**. Dans Spring Boot, le conteneur est créé au démarrage par `SpringApplication.run(...)`.

## Détail

### Pourquoi c'est utile

- **Couplage faible** : `CommandeService` dépend de l'interface `CommandeRepository`, pas d'une implémentation. On peut changer d'implémentation sans modifier le service.
- **Tests faciles** : on passe un faux repository au constructeur, sans démarrer Spring.
- **Fonctions transverses gratuites** : comme c'est le conteneur qui crée les objets, il peut les « envelopper » dans un proxy pour ajouter des transactions (`@Transactional`), de la sécurité, du cache… sans toucher à votre code.
- **Configuration centralisée** : les objets sont créés une fois, au démarrage, et partagés.

### Exemple 1 — Le démarrage d'une application Spring Boot

```java
@SpringBootApplication
public class BoutiqueApplication {
    public static void main(String[] args) {
        ApplicationContext context = SpringApplication.run(BoutiqueApplication.class, args);
        // Ici, le conteneur est prêt : tous les beans singleton sont créés
        CommandeService service = context.getBean(CommandeService.class);
    }
}
```

`getBean(...)` est montré pour comprendre le mécanisme. Dans une vraie application, on ne l'appelle quasiment jamais : on reçoit les beans par **injection**.

### Exemple 2 — Tester sans Spring grâce à l'IoC

```java
class CommandeServiceTest {

    @Test
    void calculeLeTotal() {
        CommandeRepository fauxRepo = new CommandeRepositoryEnMemoire();
        CommandeService service = new CommandeService(fauxRepo); // pas besoin de Spring
        // ...
    }
}
```

Comme `CommandeService` ne crée pas lui-même son repository, on peut lui en donner un autre dans les tests.

### Exemple 3 — Changer d'implémentation sans toucher au service

```java
public interface CommandeRepository {
    Commande findById(long id);
}

@Repository
public class JpaCommandeRepository implements CommandeRepository { /* base de données */ }
```

Demain, si vous remplacez `JpaCommandeRepository` par un `MongoCommandeRepository`, `CommandeService` ne change pas d'une ligne : le conteneur lui injectera simplement la nouvelle implémentation.

### Ce que fait le conteneur au démarrage

1. Il **trouve** les définitions de beans : classes annotées (`@Component`, `@Service`…), méthodes `@Bean`, auto-configuration de Spring Boot.
2. Il **crée** les beans dans le bon ordre (une dépendance avant celui qui l'utilise).
3. Il **injecte** les dépendances.
4. Il appelle les méthodes d'**initialisation** (`@PostConstruct`…).
5. L'application est prête. À l'arrêt, il appelle les méthodes de **destruction** (`@PreDestroy`…).

### Pièges courants

> **Créer avec `new` un objet dont la classe est un bean.** L'objet obtenu n'est pas géré par Spring : ses dépendances ne sont pas injectées (elles restent `null`) et `@Transactional` n'a aucun effet.

> **Appeler `context.getBean(...)` partout.** C'est le schéma « Service Locator » : il recrée un couplage avec Spring et cache les dépendances. Préférez l'injection par constructeur.

### À retenir

- **IoC** : le conteneur crée et relie les objets à votre place.
- Un **bean** est un objet géré par le conteneur. Un objet créé avec `new` n'en est pas un.
- Le conteneur, c'est l'`ApplicationContext`, qui étend `BeanFactory`.
- L'**injection de dépendances** est la façon dont Spring met en œuvre l'IoC (leçon 3).
