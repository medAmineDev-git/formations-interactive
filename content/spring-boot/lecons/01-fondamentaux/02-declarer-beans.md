---
id: declarer-beans
chapitre: fondamentaux
ordre: 2
titre: "Déclarer des beans : @Component et @Bean"
termes:
  - terme: "@Component"
    definition: "Annotation qui marque une **classe** comme bean. Spring la détecte automatiquement au démarrage grâce au *component scan* et en crée une instance."
  - terme: "Stéréotypes : @Service, @Repository, @Controller"
    definition: "Des variantes de `@Component` qui indiquent le rôle de la classe. `@Service` : logique métier. `@Repository` : accès aux données, avec en plus la **traduction des exceptions** techniques (JDBC, JPA) en `DataAccessException` de Spring. `@Controller` : contrôleur web. `@RestController` = `@Controller` + `@ResponseBody` (les retours sont écrits en JSON)."
  - terme: Component scan
    definition: "Le parcours des packages, au démarrage, pour trouver les classes annotées `@Component` (et ses dérivés). Avec Spring Boot, il part du **package de la classe `@SpringBootApplication`** et inclut tous ses sous-packages."
  - terme: "@SpringBootApplication"
    definition: "Raccourci pour trois annotations : `@SpringBootConfiguration` (une `@Configuration`), `@EnableAutoConfiguration` (active l'auto-configuration de Spring Boot) et `@ComponentScan` (lance le scan à partir de ce package)."
  - terme: "@Configuration"
    definition: "Classe qui regroupe des méthodes `@Bean`. Spring en crée une sous-classe (proxy CGLIB) pour que l'appel d'une méthode `@Bean` depuis une autre renvoie **toujours le même singleton** au lieu d'un nouvel objet."
  - terme: "@Bean"
    definition: "Annotation sur une **méthode** : l'objet qu'elle retourne devient un bean. Idéal pour les classes que vous ne pouvez pas annoter (librairies externes) ou dont la création demande de la logique. Les paramètres de la méthode sont injectés par Spring."
  - terme: Nom d'un bean
    definition: "Chaque bean a un nom. Par défaut : le nom de la classe avec une minuscule pour `@Component` (`CommandeService` → `commandeService`), le nom de la méthode pour `@Bean`. On peut le changer : `@Service(\"monService\")`, `@Bean(\"monBean\")`."
  - terme: Auto-configuration
    definition: "Mécanisme de Spring Boot qui crée automatiquement des beans selon ce qui est présent dans le classpath et la configuration (par exemple un `DataSource` si un driver de base de données est présent). Vos propres beans sont prioritaires : l'auto-configuration s'efface si vous définissez le vôtre."
quiz:
  - question: "Avec cette arborescence, quelles classes sont détectées par le component scan ?"
    code: |
      // com/boutique/BoutiqueApplication.java
      @SpringBootApplication
      public class BoutiqueApplication { ... }

      // com/boutique/commande/CommandeService.java
      @Service
      public class CommandeService { ... }

      // com/outils/DateUtils.java
      @Component
      public class DateUtils { ... }
    choix:
      - "Les deux : toute classe annotée est détectée"
      - "Seulement `CommandeService`"
      - "Seulement `DateUtils`"
      - "Aucune : il faut les déclarer dans `application.properties`"
    reponse: 1
    explication: "Le scan part de `com.boutique` (le package de `@SpringBootApplication`) et descend dans ses sous-packages. `com.outils` est en dehors : `DateUtils` est ignorée. Si un autre bean en dépend, l'application échoue au démarrage avec « required a bean of type 'com.outils.DateUtils' that could not be found »."
  - question: "Dans quel cas `@Bean` est-il préférable à `@Component` ?"
    choix:
      - "Pour une classe métier de votre projet"
      - "Pour une classe d'une librairie externe, que vous ne pouvez pas modifier"
      - "Pour rendre un bean plus rapide"
      - "Pour qu'un bean ne soit pas un singleton"
    reponse: 1
    explication: "On ne peut pas ajouter `@Component` dans le code d'une librairie. Avec une méthode `@Bean` dans une classe `@Configuration`, vous créez et configurez l'objet vous-même, puis Spring le gère comme n'importe quel bean. Pour vos propres classes, `@Component` et ses stéréotypes suffisent."
  - question: "Combien d'instances de `Horloge` sont créées ?"
    code: |
      @Configuration
      public class AppConfig {

          @Bean
          public Horloge horloge() { return new Horloge(); }

          @Bean
          public ServiceA serviceA() { return new ServiceA(horloge()); }

          @Bean
          public ServiceB serviceB() { return new ServiceB(horloge()); }
      }
    choix:
      - "1"
      - "2"
      - "3"
      - "Cela dépend de l'ordre de création"
    reponse: 0
    explication: "Une classe `@Configuration` est enveloppée par un proxy CGLIB : l'appel à `horloge()` est intercepté et renvoie le singleton déjà créé. Il n'y a donc **qu'une** `Horloge`, partagée par `ServiceA` et `ServiceB`. Attention : avec `@Component` à la place de `@Configuration`, chaque appel créerait une nouvelle instance (3 au total)."
---

## Essentiel

Il y a deux façons principales de déclarer un bean.

**1. Annoter la classe** avec `@Component` ou un de ses stéréotypes. Spring la trouve tout seul grâce au *component scan* :

```java
@Service
public class CommandeService { ... }

@Repository
public class JpaCommandeRepository implements CommandeRepository { ... }

@RestController
public class CommandeController { ... }
```

**2. Écrire une méthode `@Bean`** dans une classe `@Configuration`. L'objet retourné devient un bean. On l'utilise surtout pour les classes externes :

```java
@Configuration
public class ClientsConfig {

    @Bean
    public RestClient paiementClient(RestClient.Builder builder) {
        return builder.baseUrl("https://api.paiement.example").build();
    }
}
```

Le scan part du package de la classe `@SpringBootApplication` et inclut ses sous-packages.

## Détail

### Les stéréotypes en un coup d'œil

| Annotation | Couche | Particularité |
|---|---|---|
| `@Component` | Générique | Bean « simple », sans rôle précis |
| `@Service` | Métier | Aucune différence technique, mais le rôle est clair |
| `@Repository` | Accès aux données | Traduit les exceptions JDBC/JPA en `DataAccessException` |
| `@Controller` | Web (pages) | Les méthodes renvoient des noms de vues |
| `@RestController` | Web (API) | `@Controller` + `@ResponseBody` : les retours sont écrits en JSON |
| `@Configuration` | Configuration | Contient des méthodes `@Bean`, avec proxy CGLIB |

Toutes ces annotations sont elles-mêmes annotées avec `@Component` : c'est pour cela que le scan les détecte.

### Exemple 1 — Une application en couches

```java
@RestController
@RequestMapping("/commandes")
public class CommandeController {
    private final CommandeService service;

    public CommandeController(CommandeService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public Commande get(@PathVariable long id) {
        return service.trouver(id);
    }
}

@Service
public class CommandeService {
    private final CommandeRepository repo;

    public CommandeService(CommandeRepository repo) {
        this.repo = repo;
    }

    public Commande trouver(long id) {
        return repo.findById(id).orElseThrow();
    }
}

public interface CommandeRepository extends JpaRepository<Commande, Long> { }
```

Remarque : une interface Spring Data (`JpaRepository`) n'a pas besoin de `@Repository`, Spring Data génère l'implémentation et le bean automatiquement.

### Exemple 2 — Une méthode `@Bean` avec de la logique

```java
@Configuration
public class TempsConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone(); // classe du JDK : impossible d'y mettre @Component
    }
}

@Service
public class FactureService {
    private final Clock clock;

    public FactureService(Clock clock) { // reçoit le bean Clock
        this.clock = clock;
    }
}
```

Bonus : dans les tests, on peut fournir un `Clock.fixed(...)` pour contrôler la date.

### Exemple 3 — `@SpringBootApplication` décomposée

```java
@SpringBootApplication   // équivaut à :
// @SpringBootConfiguration  → cette classe est une @Configuration
// @EnableAutoConfiguration  → Spring Boot crée les beans d'infrastructure (DataSource, Jackson…)
// @ComponentScan            → scan à partir de com.boutique
public class BoutiqueApplication { ... }
```

### `@Component` ou `@Bean` ?

- **Votre propre classe** → `@Component` / `@Service` / `@Repository`…
- **Classe externe** (librairie, JDK) → `@Bean`.
- **Création conditionnelle ou paramétrée** (plusieurs instances configurées différemment) → `@Bean`.

### Pièges courants

> **Classe en dehors du package scanné.** L'application échoue au démarrage : *« Parameter 0 of constructor in … required a bean of type '…' that could not be found »*. Placez la classe principale à la racine de vos packages (`com.boutique`), ou ajoutez le package avec `@ComponentScan`.

> **Méthodes `@Bean` dans une classe `@Component`** (mode « lite ») : il n'y a pas de proxy. Un appel direct entre méthodes `@Bean` crée alors un **nouvel objet** au lieu de renvoyer le singleton.

> **Oublier l'annotation.** Une classe sans `@Component` (ou dérivé) n'est pas un bean, même si elle est dans le bon package.

### À retenir

- `@Component` sur une classe, `@Bean` sur une méthode.
- `@Service`, `@Repository`, `@Controller`, `@RestController` et `@Configuration` sont des `@Component` avec un rôle.
- Le scan part du package de `@SpringBootApplication`.
- `@Configuration` garantit qu'un appel entre méthodes `@Bean` renvoie le même singleton.
