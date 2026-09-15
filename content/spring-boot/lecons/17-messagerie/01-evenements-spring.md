---
id: evenements-spring
chapitre: messagerie
ordre: 1
titre: "Les événements Spring"
termes:
  - terme: ApplicationEventPublisher
    definition: "Interface centrale pour publier un événement. Le contexte Spring l'implémente : il suffit de l'injecter comme n'importe quel bean et d'appeler `publishEvent(...)`."
  - terme: Événement applicatif
    definition: "Depuis Spring 4.2, un événement peut être **n'importe quel objet** : plus besoin d'étendre `ApplicationEvent`. Un `record` est le choix naturel : immuable, concis, et il porte déjà `equals`/`toString`."
  - terme: "@EventListener"
    definition: "Annotée sur une méthode d'un bean, elle en fait un écouteur du type d'événement déclaré en paramètre. Plusieurs écouteurs peuvent réagir au même événement."
  - terme: Écoute synchrone
    definition: "Comportement par défaut : `publishEvent(...)` **bloque** jusqu'à ce que tous les écouteurs synchrones aient rendu la main, sur le **même thread** et, s'il y en a une, dans la **même transaction** que le code qui publie."
  - terme: "@TransactionalEventListener"
    definition: "Écouteur lié au **cycle de vie de la transaction** en cours plutôt qu'au moment précis de la publication. Sa `phase` par défaut est `AFTER_COMMIT` : il ne s'exécute qu'après le commit réussi de la transaction."
  - terme: "@Async sur un écouteur"
    definition: "Combiné à `@EnableAsync`, exécute l'écouteur sur un autre thread, dans un **pool séparé** de celui de la publication. L'écouteur n'a alors plus accès à la transaction ni au contexte de sécurité du publieur."
  - terme: "@Order"
    definition: "Fixe l'ordre d'exécution entre plusieurs écouteurs **synchrones** du même événement (valeur basse = exécuté en premier). Sans effet entre écouteurs asynchrones, qui s'exécutent indépendamment."
  - terme: Spring Modulith
    definition: "Projet qui aide à structurer une application en **modules** au sein d'un même déploiement, en s'appuyant notamment sur les événements Spring pour les faire communiquer sans dépendance directe entre leurs classes internes."
quiz:
  - question: "Que se passe-t-il si `envoyerEmailBienvenue` lève une exception ?"
    code: |
      @Service
      public class InscriptionService {
          private final ApplicationEventPublisher publisher;

          public void inscrire(Client client) {
              repository.save(client);
              publisher.publishEvent(new ClientInscrit(client.getId()));
          }
      }

      @Component
      public class EmailListener {
          @EventListener
          public void envoyerEmailBienvenue(ClientInscrit evt) {
              throw new RuntimeException("SMTP indisponible");
          }
      }
    choix:
      - "L'exception est silencieusement journalisée, `inscrire` se termine normalement"
      - "L'exception remonte jusqu'à `publishEvent`, dans le même thread : elle peut faire échouer `inscrire` et annuler la transaction"
      - "L'événement est remis en file d'attente et rejoué automatiquement plus tard"
      - "Seul l'écouteur `EmailListener` échoue, les autres écouteurs ne sont jamais appelés"
    reponse: 1
    explication: "Un `@EventListener` classique s'exécute de façon **synchrone**, sur le thread du publieur. Une exception qu'il lève remonte l'appel jusqu'à `publishEvent(...)`, donc jusqu'à `inscrire` : si la méthode est `@Transactional`, la transaction est annulée alors que l'inscription semblait terminée. C'est pour éviter ce couplage qu'on distingue souvent « ce qui doit réussir avec l'inscription » (même transaction) de « ce qui peut échouer sans grave conséquence » (`@TransactionalEventListener` ou `@Async`)."
  - question: "Un `@TransactionalEventListener` (phase par défaut) est déclaré sur une méthode appelée par un code qui ne s'exécute **dans aucune transaction**. Que se passe-t-il à la publication de l'événement ?"
    choix:
      - "L'écouteur s'exécute immédiatement, comme un `@EventListener` classique"
      - "L'écouteur n'est jamais invoqué : il n'y a pas de commit à attendre"
      - "Le démarrage de l'application échoue"
      - "Spring ouvre automatiquement une transaction pour permettre à l'écouteur de s'exécuter"
    reponse: 1
    explication: "La phase par défaut `AFTER_COMMIT` suppose qu'une transaction existe et se termine par un commit. Sans transaction active, il n'y a aucun commit à observer : l'écouteur est tout simplement ignoré, sans erreur bloquante. C'est un piège classique en test (souvent sans `@Transactional` autour de l'appel) où l'écouteur semble ne « jamais se déclencher »."
  - question: "Un écouteur `@EventListener @Async` lève une exception. Quel est le comportement par défaut ?"
    choix:
      - "L'exception remonte au code appelant `publishEvent`, comme pour un écouteur synchrone"
      - "L'exception est uniquement journalisée par le pool de threads asynchrone ; le code appelant ne la voit jamais"
      - "L'application s'arrête"
      - "L'événement est republié automatiquement une fois"
    reponse: 1
    explication: "Une méthode `@Async` qui renvoie `void` s'exécute sur un thread séparé : le code appelant a déjà rendu la main. L'exception ne peut donc pas remonter jusqu'à lui ; elle est traitée par le gestionnaire d'exceptions asynchrones par défaut (journalisation), sauf configuration d'un `AsyncUncaughtExceptionHandler` personnalisé."
---

## Essentiel

Les événements Spring permettent à un bean de **signaler** qu'il s'est passé quelque chose, sans connaître qui va réagir. On injecte `ApplicationEventPublisher`, on publie un objet quelconque — un `record` fait très bien l'affaire, plus besoin d'étendre `ApplicationEvent` depuis Spring 4.2 :

```java
public record ClientInscrit(Long clientId) { }

@Service
public class InscriptionService {
    private final ApplicationEventPublisher publisher;

    public InscriptionService(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    @Transactional
    public void inscrire(Client client) {
        repository.save(client);
        publisher.publishEvent(new ClientInscrit(client.getId()));
    }
}
```

N'importe quel bean peut écouter avec `@EventListener` :

```java
@Component
public class StatistiquesListener {
    @EventListener
    public void surInscription(ClientInscrit evt) {
        compteur.incrementer();
    }
}
```

Par défaut, l'écoute est **synchrone** : `publishEvent` bloque jusqu'à ce que tous les écouteurs se terminent, sur le **même thread**, et — point important — dans la **même transaction** que le publieur. Une exception dans un écouteur remonte donc jusqu'au code qui publie. Pour réagir seulement si la transaction réussit, on utilise `@TransactionalEventListener` (phase `AFTER_COMMIT` par défaut) plutôt que `@EventListener`.

## Détail

### Comment ça marche

`publishEvent(...)` délègue à un `ApplicationEventMulticaster` (implémentation par défaut : `SimpleApplicationEventMulticaster`), qui retrouve tous les beans possédant une méthode `@EventListener` compatible avec le type de l'événement (en tenant compte de l'héritage : un écouteur de `EvenementClient` reçoit aussi `ClientInscrit` si elle en hérite) et les invoque un par un, dans le thread appelant, sauf configuration d'un exécuteur asynchrone sur le multicaster lui-même ou usage de `@Async` par écouteur.

### Exemple 1 — Plusieurs écouteurs découplés

```java
public record CommandeValidee(Long commandeId, BigDecimal montant) { }

@Component
public class FactureListener {
    @EventListener
    public void genererFacture(CommandeValidee evt) { ... }
}

@Component
public class StockListener {
    @EventListener
    @Order(1) // s'exécute avant FactureListener si l'ordre compte
    public void decrementerStock(CommandeValidee evt) { ... }
}
```

`CommandeService` publie un seul événement ; il ignore tout de la facturation ou du stock. Ajouter un troisième écouteur ne demande aucune modification du service qui publie.

### Exemple 2 — @TransactionalEventListener et ses phases

```java
@Component
public class NotificationListener {

    @TransactionalEventListener // phase par défaut : AFTER_COMMIT
    public void surCommandeValidee(CommandeValidee evt) {
        notificationService.envoyer(evt.commandeId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    public void surEchec(CommandeValidee evt) {
        metriques.incrementerEchecs();
    }
}
```

Les quatre phases disponibles : `BEFORE_COMMIT`, `AFTER_COMMIT` (par défaut), `AFTER_ROLLBACK`, `AFTER_COMPLETION` (dans tous les cas, succès ou échec). `AFTER_COMMIT` est le choix naturel pour un effet de bord qui ne doit **pas** avoir lieu si la transaction échoue (notification, appel externe) : contrairement à un `@EventListener` classique, une exception dans cet écouteur ne peut plus annuler la transaction, puisqu'elle est déjà validée.

### Exemple 3 — Écouteur asynchrone

```java
@Configuration
@EnableAsync
public class AsyncConfig { }

@Component
public class EmailListener {
    @Async
    @TransactionalEventListener
    public void envoyerEmail(CommandeValidee evt) {
        emailService.envoyerConfirmation(evt.commandeId());
    }
}
```

`@Async` détache l'exécution du thread appelant : `publishEvent` rend la main immédiatement, sans attendre l'envoi de l'e-mail. Utile pour un traitement lent ou non critique, mais l'écouteur perd alors tout accès direct au contexte transactionnel et de sécurité du publieur — il faut lui passer les données nécessaires via l'événement lui-même plutôt que de relire un `SecurityContext` devenu inaccessible.

### Exemple 4 — Interface ApplicationListener (alternative à l'annotation)

```java
@Component
public class AuditListener implements ApplicationListener<CommandeValidee> {
    @Override
    public void onApplicationEvent(CommandeValidee evt) {
        audit.enregistrer(evt);
    }
}
```

Équivalent à `@EventListener`, mais typé explicitement par des génériques plutôt que par le paramètre de la méthode. `@EventListener` reste généralement préféré : plus concis, et permet plusieurs méthodes d'écoute dans la même classe.

### Comparatif des styles d'écoute

| | `@EventListener` | `@TransactionalEventListener` | `@EventListener @Async` |
|---|---|---|---|
| Thread | Même que le publieur | Même que le publieur, différé après commit | Thread séparé |
| Transaction | Celle du publieur | Se déclenche selon la phase choisie | Aucune (sauf configuration explicite) |
| Exception → publieur | Remonte, peut annuler la transaction | N'affecte plus la transaction déjà commitée | Jamais visible par le publieur |
| Sans transaction active | S'exécute normalement | N'est **jamais** invoqué (sauf `AFTER_COMPLETION` selon config) | S'exécute normalement |

### Pièges courants

> **Coupler par erreur une opération secondaire à la transaction principale.** Un `@EventListener` (non transactionnel) qui échoue annule tout, y compris l'opération métier initiale. Si l'échec de la notification ne doit pas invalider la commande, préférer `@TransactionalEventListener` ou `@Async`.

> **`@TransactionalEventListener` qui ne se déclenche jamais en test.** Un test qui publie l'événement sans englober l'appel dans une transaction (pas de `@Transactional` sur la méthode de test, ou transaction déjà terminée) ne verra jamais l'écouteur `AFTER_COMMIT` s'exécuter. Utiliser un `@EventListener` classique pour ces tests, ou entourer explicitement le test d'une transaction qui commit réellement.

> **Croire les événements Spring durables.** Ils vivent uniquement en mémoire, dans la JVM qui les publie. Si le processus s'arrête entre la publication et l'exécution d'un écouteur `@Async`, l'événement est perdu **sans aucune trace**, sans erreur, sans rejeu. Pour un traitement qui doit survivre à un redémarrage ou franchir la frontière d'un autre service, il faut une vraie messagerie (Kafka, RabbitMQ) ou un pattern comme l'**outbox transactionnel** (écrire l'événement dans une table, dans la même transaction que les données métier, puis le publier séparément).

### À retenir

- Un événement est un objet quelconque (un `record` suffit) ; `ApplicationEventPublisher.publishEvent(...)` le diffuse à tous les `@EventListener` compatibles.
- Écoute **synchrone par défaut** : même thread, même transaction que le publieur — une exception dans l'écouteur peut annuler la transaction du publieur.
- `@TransactionalEventListener` (phase `AFTER_COMMIT` par défaut) découple l'écouteur du résultat immédiat, mais ne se déclenche jamais sans transaction active.
- `@Async` détache complètement l'exécution ; ses exceptions ne remontent jamais au publieur.
- Les événements Spring restent en mémoire : ils ne survivent ni à un redémarrage, ni à un autre processus. Pour de la fiabilité inter-services, voir Kafka, RabbitMQ ou le pattern outbox.
