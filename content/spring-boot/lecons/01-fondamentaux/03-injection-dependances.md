---
id: injection-dependances
chapitre: fondamentaux
ordre: 3
titre: L'injection de dépendances
termes:
  - terme: Injection de dépendances (DI)
    definition: "Technique qui consiste à **fournir** à un objet les objets dont il a besoin (ses dépendances), au lieu qu'il les crée lui-même. C'est la façon dont Spring met en œuvre l'inversion de contrôle."
  - terme: Injection par constructeur
    definition: "Les dépendances sont des paramètres du constructeur. C'est la méthode **recommandée** : les champs peuvent être `final`, l'objet est complet dès sa création, et on peut le tester avec un simple `new`. Depuis Spring 4.3, si la classe n'a **qu'un seul constructeur**, `@Autowired` est inutile."
  - terme: Injection par setter
    definition: "Spring appelle une méthode `setXxx(...)` annotée `@Autowired` après la création de l'objet. Utile pour une dépendance **optionnelle** ou modifiable, rare en pratique."
  - terme: Injection par champ
    definition: "`@Autowired` directement sur un attribut. Court à écrire mais **déconseillé** : le champ ne peut pas être `final`, les dépendances sont cachées, et l'objet est inutilisable sans Spring (le champ reste `null` dans un test avec `new`)."
  - terme: "@Autowired"
    definition: "Demande à Spring d'injecter une dépendance (sur un constructeur, un setter ou un champ). Obligatoire par défaut : si aucun bean ne correspond, le démarrage échoue. `@Autowired(required = false)` la rend optionnelle."
  - terme: "@Qualifier"
    definition: "Précise **quel bean** injecter quand plusieurs beans ont le même type : `@Qualifier(\"smsNotification\")`. Il est prioritaire sur `@Primary`."
  - terme: "@Primary"
    definition: "Désigne le bean choisi **par défaut** quand plusieurs beans du même type existent et qu'aucun `@Qualifier` n'est précisé."
  - terme: NoUniqueBeanDefinitionException
    definition: "Erreur levée quand Spring trouve **plusieurs** beans pour un point d'injection et ne sait pas lequel choisir. Spring Boot affiche : *« required a single bean, but 2 were found »*."
  - terme: NoSuchBeanDefinitionException
    definition: "Erreur levée quand Spring ne trouve **aucun** bean du type demandé. Spring Boot affiche : *« required a bean of type '…' that could not be found »*."
quiz:
  - question: "Spring injecte-t-il `NotificationService` dans ce code ?"
    code: |
      @Service
      public class CommandeService {
          private final NotificationService notifications;

          public CommandeService(NotificationService notifications) {
              this.notifications = notifications;
          }
      }
    choix:
      - "Non, il manque `@Autowired` sur le constructeur"
      - "Non, il manque `@Autowired` sur le champ"
      - "Oui : avec un seul constructeur, `@Autowired` est facultatif"
      - "Oui, mais seulement si le champ n'est pas `final`"
    reponse: 2
    explication: "Depuis Spring 4.3, quand une classe n'a qu'un seul constructeur, Spring l'utilise automatiquement pour l'injection. Le champ `final` est même recommandé : il garantit que la dépendance ne change pas."
  - question: "Que se passe-t-il au démarrage ?"
    code: |
      public interface NotificationService { void envoyer(String msg); }

      @Service
      public class EmailNotification implements NotificationService { ... }

      @Service
      public class SmsNotification implements NotificationService { ... }

      @Service
      public class CommandeService {
          public CommandeService(NotificationService service) { ... }
      }
    choix:
      - "Spring injecte `EmailNotification`, déclarée en premier"
      - "Spring injecte les deux, l'une après l'autre"
      - "Le démarrage échoue : 2 beans correspondent et Spring ne sait pas lequel choisir"
      - "Spring injecte `null`"
    reponse: 2
    explication: "Deux beans ont le type `NotificationService` : Spring lève une `NoUniqueBeanDefinitionException` (« required a single bean, but 2 were found »). Solutions : `@Primary` sur l'un des deux, `@Qualifier` au point d'injection, ou injecter `List<NotificationService>` pour les recevoir tous."
  - question: "Quel bean est injecté dans `CommandeService` ?"
    code: |
      @Service
      @Primary
      public class EmailNotification implements NotificationService { ... }

      @Service
      public class SmsNotification implements NotificationService { ... }

      @Service
      public class CommandeService {
          public CommandeService(@Qualifier("smsNotification") NotificationService service) { ... }
      }
    choix:
      - "`EmailNotification`, car elle est `@Primary`"
      - "`SmsNotification`, car `@Qualifier` est prioritaire sur `@Primary`"
      - "Aucun : `@Primary` et `@Qualifier` sont incompatibles"
      - "Les deux"
    reponse: 1
    explication: "`@Primary` définit le choix **par défaut**. `@Qualifier` est une demande **explicite** au point d'injection : elle l'emporte. `smsNotification` est le nom par défaut du bean `SmsNotification`."
---

## Essentiel

L'**injection de dépendances** consiste à fournir à un objet ce dont il a besoin. Spring propose trois façons de le faire. Retenez surtout la première.

**Par constructeur (recommandée)** :

```java
@Service
public class CommandeService {
    private final CommandeRepository repo;
    private final NotificationService notifications;

    public CommandeService(CommandeRepository repo, NotificationService notifications) {
        this.repo = repo;
        this.notifications = notifications;
    }
}
```

Avec un seul constructeur, pas besoin de `@Autowired`. Les champs sont `final` et la classe se teste avec un simple `new`.

**Par setter** et **par champ** existent aussi, mais sont réservés à des cas particuliers (champ : déconseillé).

Quand **plusieurs beans** ont le même type, on choisit avec `@Primary` (choix par défaut) ou `@Qualifier` (choix explicite).

## Détail

### Les trois types d'injection comparés

```java
// 1. Constructeur — recommandé
@Service
public class A {
    private final Repo repo;
    public A(Repo repo) { this.repo = repo; }
}

// 2. Setter — pour une dépendance optionnelle
@Service
public class B {
    private Repo repo;
    @Autowired
    public void setRepo(Repo repo) { this.repo = repo; }
}

// 3. Champ — déconseillé
@Service
public class C {
    @Autowired
    private Repo repo;
}
```

| | Constructeur | Setter | Champ |
|---|---|---|---|
| Champ `final` possible | ✅ | ❌ | ❌ |
| Dépendances visibles | ✅ dans la signature | ⚠️ | ❌ cachées |
| Test sans Spring | ✅ `new A(mock)` | ⚠️ penser à appeler le setter | ❌ champ `null` |
| Objet complet dès sa création | ✅ | ❌ | ❌ |

Un constructeur avec beaucoup de paramètres est d'ailleurs un bon signal : la classe fait sans doute trop de choses.

### Exemple 1 — Avec Lombok

Beaucoup de projets génèrent le constructeur avec Lombok :

```java
@Service
@RequiredArgsConstructor // génère un constructeur avec tous les champs final
public class CommandeService {
    private final CommandeRepository repo;
    private final NotificationService notifications;
}
```

C'est toujours de l'injection par constructeur.

### Exemple 2 — Plusieurs implémentations

```java
public interface NotificationService { void envoyer(String msg); }

@Service
@Primary // choisi par défaut
public class EmailNotification implements NotificationService { ... }

@Service
public class SmsNotification implements NotificationService { ... }

@Service
public class AlerteService {
    private final NotificationService parDefaut;
    private final NotificationService sms;

    public AlerteService(NotificationService parDefaut,
                         @Qualifier("smsNotification") NotificationService sms) {
        this.parDefaut = parDefaut; // EmailNotification (@Primary)
        this.sms = sms;             // SmsNotification (@Qualifier)
    }
}
```

### Exemple 3 — Recevoir toutes les implémentations

```java
@Service
public class DiffusionService {
    private final List<NotificationService> canaux;

    public DiffusionService(List<NotificationService> canaux) { // email + sms
        this.canaux = canaux;
    }

    public void diffuser(String msg) {
        canaux.forEach(c -> c.envoyer(msg));
    }
}
```

On peut aussi injecter un `Map<String, NotificationService>` : la clé est le nom du bean.

### Exemple 4 — Une dépendance optionnelle

```java
@Service
public class RapportService {
    private final Optional<ExportPdf> exportPdf; // présent seulement si le bean existe

    public RapportService(Optional<ExportPdf> exportPdf) {
        this.exportPdf = exportPdf;
    }
}
```

`ObjectProvider<ExportPdf>` offre la même chose avec plus d'options (`getIfAvailable()`…).

### Comment Spring choisit le bean à injecter

1. Il cherche les beans du **type** demandé.
2. S'il y en a un seul → il l'injecte.
3. S'il y en a plusieurs → `@Qualifier` s'il est présent, sinon le bean `@Primary`, sinon le bean dont le **nom** correspond au nom du paramètre.
4. Toujours rien de décisif → `NoUniqueBeanDefinitionException`. Aucun bean → `NoSuchBeanDefinitionException`.

### Pièges courants

> **Injection par champ + test avec `new`** : `new CommandeService()` compile, mais le champ `@Autowired` reste `null` → `NullPointerException` au premier appel.

> **Dépendance circulaire** : A a besoin de B et B a besoin de A. Avec l'injection par constructeur, Spring ne peut pas les créer, et depuis Spring Boot 2.6 les cycles sont interdits par défaut, quel que soit le type d'injection. Le démarrage échoue avec *« The dependencies of some of the beans in the application context form a cycle »*. La vraie solution est de revoir la conception (extraire une troisième classe, utiliser des événements). `@Lazy` sur un paramètre peut dépanner.

> **Compter sur le nom du paramètre** pour choisir entre deux beans : ça marche, mais un simple renommage casse l'injection. Préférez `@Qualifier`.

### À retenir

- Utilisez l'injection **par constructeur**, avec des champs `final`.
- Un seul constructeur → `@Autowired` inutile.
- Plusieurs beans du même type : `@Primary` = choix par défaut, `@Qualifier` = choix explicite (prioritaire).
- `List<Interface>` permet de recevoir toutes les implémentations.
