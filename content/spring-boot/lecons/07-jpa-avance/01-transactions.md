---
id: transactions
chapitre: jpa-avance
ordre: 1
titre: "Les transactions avec @Transactional"
termes:
  - terme: "@Transactional"
    definition: "Annotation (`org.springframework.transaction.annotation.Transactional`) qui délimite une transaction autour d'une méthode : tout se valide (commit) ensemble à la fin, ou tout est annulé (rollback) en cas d'erreur. Repose sur un **proxy** créé par Spring autour du bean."
  - terme: Proxy transactionnel
    definition: "Spring n'exécute jamais directement la méthode annotée : il enveloppe le bean dans un **proxy** (CGLIB ou proxy JDK dynamique) qui ouvre la transaction, appelle la vraie méthode, puis commite ou annule selon le résultat. Sans passer par ce proxy, l'annotation n'a aucun effet."
  - terme: Rollback par défaut
    definition: "Par défaut, Spring annule la transaction sur une `RuntimeException` (ou une `Error`), mais **valide** la transaction si la méthode lève une exception vérifiée (*checked*, qui étend `Exception` sans étendre `RuntimeException`). `rollbackFor = MonException.class` étend le rollback à une exception vérifiée précise."
  - terme: "readOnly"
    definition: "`@Transactional(readOnly = true)` indique que la méthode ne fait que lire. Permet à Hibernate d'optimiser (pas de vérification de modification à la fin) et, selon le pilote et la base, d'informer le SGBD. Ce n'est **pas** une protection stricte contre les écritures : une modification reste possible, elle n'est simplement pas garantie d'être détectée ou persistée correctement."
  - terme: Propagation
    definition: "Attribut `propagation` qui règle le comportement quand une méthode transactionnelle en appelle une autre, elle aussi transactionnelle : rejoindre la transaction existante, en suspendre une, en exiger une, en refuser une… `REQUIRED` est la valeur par défaut."
  - terme: Isolation
    definition: "Attribut `isolation` qui règle le niveau d'isolement entre transactions concurrentes (`READ_COMMITTED`, `REPEATABLE_READ`, `SERIALIZABLE`…). Par défaut, `Isolation.DEFAULT` conserve le niveau configuré par la base de données ; à ne modifier qu'en connaissance de cause, l'attribut n'a d'effet qu'au **démarrage** d'une nouvelle transaction."
  - terme: Auto-invocation
    definition: "Le fait qu'une méthode d'un bean en appelle une autre du **même** bean via `this.autreMethode()`. Cet appel ne passe pas par le proxy Spring : si `autreMethode()` est annotée `@Transactional`, l'annotation est silencieusement ignorée."
  - terme: "jakarta.transaction.Transactional"
    definition: "Annotation standard JTA, elle aussi reconnue par Spring, mais avec moins d'attributs que celle de Spring (pas de `readOnly`, pas de propagation `NESTED`…). En pratique, dans un projet Spring Boot, on utilise l'annotation Spring `org.springframework.transaction.annotation.Transactional`."
quiz:
  - question: "Ce service appelle `enregistrer()` depuis `traiterCommande()`, une méthode du même bean. Que se passe-t-il si `enregistrer()` lève une exception après avoir modifié plusieurs lignes ?"
    code: |
      @Service
      public class CommandeService {

          public void traiterCommande(Commande commande) {
              // ... logique métier ...
              this.enregistrer(commande);
          }

          @Transactional
          public void enregistrer(Commande commande) {
              repository.save(commande);
              stockService.decrementer(commande); // lève une RuntimeException
          }
      }
    choix:
      - "Les deux opérations sont annulées : `@Transactional` protège `enregistrer()`"
      - "`enregistrer()` n'est pas exécutée dans une transaction : l'appel `this.enregistrer(...)` ne passe pas par le proxy Spring"
      - "Seule `repository.save(commande)` est annulée"
      - "Spring lève une erreur au démarrage à cause de cet appel interne"
    reponse: 1
    explication: "`traiterCommande()` appelle `enregistrer()` directement sur `this`, sans repasser par le proxy transactionnel de Spring : c'est l'appel externe, via le proxy, qui déclenche l'ouverture de la transaction. Ici, `enregistrer()` s'exécute donc sans transaction, et l'annotation est silencieusement ignorée — aucune erreur au démarrage, aucun avertissement à l'exécution."
  - question: "Une méthode `@Transactional` (sans `rollbackFor`) lève une `IOException` (exception vérifiée). Que fait Spring ?"
    choix:
      - "Il annule la transaction, comme pour toute exception"
      - "Il valide (commit) la transaction : par défaut, seules les `RuntimeException` et `Error` déclenchent un rollback"
      - "Il relance l'exception sans avoir ouvert de transaction"
      - "Le comportement dépend du SGBD utilisé"
    reponse: 1
    explication: "La règle de rollback par défaut de Spring ne couvre que les exceptions non vérifiées (`RuntimeException`, `Error`). Une exception vérifiée comme `IOException` entraîne un **commit**, sauf si `rollbackFor = IOException.class` (ou une exception parente) est précisé explicitement sur l'annotation."
  - question: "Quelle est la propagation par défaut de `@Transactional`, et que fait-elle quand une méthode l'utilisant est appelée depuis une méthode déjà transactionnelle ?"
    choix:
      - "`REQUIRES_NEW` : elle suspend la transaction en cours et en ouvre une nouvelle"
      - "`REQUIRED` : elle rejoint la transaction déjà ouverte, sans en créer de nouvelle"
      - "`MANDATORY` : elle échoue s'il n'y a pas déjà de transaction"
      - "`NESTED` : elle crée un point de sauvegarde (savepoint) dans la transaction en cours"
    reponse: 1
    explication: "`REQUIRED` est la valeur par défaut : la méthode rejoint la transaction en cours si elle existe, ou en crée une nouvelle sinon. C'est le comportement souhaité dans l'immense majorité des cas — les autres valeurs de propagation servent des besoins précis (isoler un traitement, l'exécuter même en cas d'échec du reste, etc.)."
---

## Essentiel

`@Transactional` délimite une transaction autour d'une méthode : si tout se passe bien, les modifications sont validées (commit) ensemble à la fin ; en cas d'erreur, elles sont toutes annulées (rollback).

```java
@Service
public class CommandeService {
    private final CommandeRepository repo;
    private final StockService stockService;

    public CommandeService(CommandeRepository repo, StockService stockService) {
        this.repo = repo;
        this.stockService = stockService;
    }

    @Transactional
    public Commande valider(Commande commande) {
        stockService.decrementer(commande); // si ça échoue...
        return repo.save(commande);         // ...ceci est annulé aussi
    }
}
```

Points essentiels :

- **Rollback par défaut** uniquement sur `RuntimeException` et `Error`. Une exception **vérifiée** (checked) entraîne un **commit**, sauf avec `rollbackFor = MonException.class`.
- `readOnly = true` sur les méthodes de lecture seule : optimisation, pas une interdiction stricte d'écrire.
- `@Transactional` repose sur un **proxy** : sans passer par lui, l'annotation ne fait rien. C'est pour cela qu'un appel **interne** (`this.autreMethode()`) ne déclenche pas de transaction.
- On place `@Transactional` sur la couche **service**, qui orchestre la logique métier, plutôt que sur le contrôleur (trop haut, mélange HTTP et transaction) ou le repository (trop bas, une transaction couvre souvent plusieurs appels au repository).

## Détail

### Comment ça marche

Au démarrage, Spring détecte les méthodes `@Transactional` et enveloppe le bean dans un **proxy**. Quand un autre bean appelle cette méthode :

1. Le proxy intercepte l'appel.
2. Il ouvre une transaction (ou rejoint une transaction existante, selon la propagation).
3. Il appelle la vraie méthode.
4. Si elle se termine normalement → **commit**. Si elle lève une exception qui déclenche un rollback → **rollback**.

Ce mécanisme explique le piège de l'auto-invocation : un appel `this.methode()` depuis l'intérieur du bean n'est jamais intercepté par le proxy, puisqu'il ne transite pas par lui.

### Exemple 1 — `rollbackFor` sur une exception vérifiée

```java
@Transactional(rollbackFor = StockInsuffisantException.class)
public Commande valider(Commande commande) throws StockInsuffisantException {
    stockService.decrementer(commande); // peut lever StockInsuffisantException (checked)
    return repo.save(commande);
}
```

Sans `rollbackFor`, une `StockInsuffisantException` (si elle étend `Exception` et non `RuntimeException`) provoquerait un commit malgré l'échec logique du traitement : la commande serait enregistrée avec un stock déjà décrémenté de façon incohérente.

### Exemple 2 — `readOnly` pour les lectures

```java
@Transactional(readOnly = true)
public List<Commande> lister() {
    return repo.findAll();
}
```

Utile sur les méthodes de consultation : Hibernate peut sauter certaines vérifications internes (détection de changements sur les entités chargées). Certains pilotes JDBC ou bases de données s'en servent aussi pour des optimisations côté réplication.

### Exemple 3 — `REQUIRES_NEW` pour isoler un traitement

```java
@Transactional
public void traiterCommande(Commande commande) {
    repo.save(commande);
    auditService.tracer(commande); // doit être enregistré même si la suite échoue
    stockService.decrementer(commande); // peut échouer
}

@Service
public class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void tracer(Commande commande) {
        auditRepository.save(new EntreeAudit(commande));
    }
}
```

`REQUIRES_NEW` suspend la transaction appelante le temps d'exécuter `tracer()` dans sa **propre** transaction, commitée indépendamment. Si `decrementer()` échoue ensuite et fait annuler `traiterCommande()`, la trace d'audit reste enregistrée.

### Les valeurs de propagation

| Valeur | Comportement |
|---|---|
| `REQUIRED` (défaut) | Rejoint la transaction en cours, ou en crée une si aucune n'existe |
| `REQUIRES_NEW` | Suspend la transaction en cours (s'il y en a une) et en crée toujours une nouvelle, indépendante |
| `SUPPORTS` | Rejoint la transaction en cours si elle existe, s'exécute sans transaction sinon |
| `MANDATORY` | Exige une transaction en cours ; lève `IllegalTransactionStateException` s'il n'y en a pas |
| `NOT_SUPPORTED` | Suspend la transaction en cours et s'exécute sans transaction |
| `NEVER` | S'exécute sans transaction ; lève `IllegalTransactionStateException` si une transaction est en cours |
| `NESTED` | S'exécute dans une transaction imbriquée (point de sauvegarde) si une transaction est en cours, sinon se comporte comme `REQUIRED` — nécessite un gestionnaire de transactions et un pilote qui supportent les savepoints |

### Pièges courants

> **L'auto-invocation.** `this.autreMethode()` depuis une méthode du même bean ne passe pas par le proxy Spring : `@Transactional` sur `autreMethode()` est **silencieusement ignorée**, sans erreur ni avertissement au démarrage. Solution : appeler la méthode via un autre bean (injecter le service dans lui-même via une interface, ou — mieux — extraire la méthode dans une autre classe).

> **Ne pas annoter une méthode privée en s'attendant à ce que ça fonctionne.** Le mécanisme de proxy repose sur l'interception d'appels **entrants** sur le bean ; une méthode privée ne peut pas être interceptée : l'annotation n'a aucun effet, sans erreur signalée. Depuis Spring Framework 6, les méthodes `protected` ou package-private sont prises en charge avec les proxies de classe qu'utilise Spring Boot, mais la règle simple reste : une méthode publique, appelée depuis un autre bean.

> **Compter sur le rollback pour une exception vérifiée sans `rollbackFor`.** Une `Exception` métier qui n'étend pas `RuntimeException` entraîne un **commit** par défaut, même si elle signale un échec. C'est une source classique de données incohérentes en base.

### À retenir

- `@Transactional` fonctionne via un **proxy** : un appel interne (`this.methode()`) le contourne complètement.
- Rollback par défaut : `RuntimeException`/`Error` seulement. Utiliser `rollbackFor` pour les exceptions vérifiées.
- `readOnly = true` sur les lectures : optimisation, pas une garantie d'immutabilité.
- `REQUIRED` (défaut) suffit dans la grande majorité des cas ; `REQUIRES_NEW` isole un traitement qui doit survivre à l'échec du reste.
- Placer `@Transactional` sur la couche **service**, qui orchestre la logique métier.
