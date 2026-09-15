---
id: rabbitmq
chapitre: messagerie
ordre: 3
titre: "RabbitMQ avec Spring AMQP"
termes:
  - terme: Exchange
    definition: "Point d'entrée auquel un producteur publie un message. L'exchange ne stocke rien : il **route** le message vers zéro, une ou plusieurs queues selon son type et les bindings déclarés."
  - terme: Queue
    definition: "File où les messages routés par un exchange s'accumulent jusqu'à leur consommation. C'est la queue, pas l'exchange, que consomme `@RabbitListener`."
  - terme: Binding
    definition: "Lien déclaré entre un exchange et une queue, éventuellement accompagné d'une **routing key** (ou de critères d'en-têtes pour un exchange `headers`). Sans binding, un message publié sur un exchange n'atteint aucune queue."
  - terme: Routing key
    definition: "Étiquette fournie par le producteur au moment de la publication. L'exchange la compare aux clés des bindings pour décider vers quelle(s) queue(s) livrer le message ; son interprétation dépend du **type** d'exchange."
  - terme: Types d'exchange
    definition: "**direct** : correspondance exacte routing key / binding key. **topic** : correspondance par motif (`*` = un mot, `#` = zéro ou plusieurs mots). **fanout** : diffusion à toutes les queues liées, routing key ignorée. **headers** : routage sur des attributs d'en-tête plutôt que sur la routing key."
  - terme: RabbitTemplate
    definition: "Client Spring AMQP pour publier (`convertAndSend(exchange, routingKey, message)`) et, plus rarement, consommer de façon synchrone. Utilise un `MessageConverter` (par défaut Java natif, en pratique presque toujours remplacé par du JSON) pour convertir l'objet Java en message AMQP."
  - terme: "@RabbitListener"
    definition: "Annotation posée sur une méthode pour en faire un consommateur d'une ou plusieurs **queues** (`queues = \"...\"`). Le message est désérialisé automatiquement si un `MessageConverter` adapté est configuré."
  - terme: Dead letter exchange (DLX)
    definition: "Exchange vers lequel une queue republie un message rejeté (acquittement négatif sans reprise), expiré (TTL) ou refusé faute de place, quand l'argument `x-dead-letter-exchange` est défini sur la queue."
quiz:
  - question: "Avec un exchange `topic` nommé `commandes.evenements` et une queue liée avec la binding key `commandes.*.creee`, un message est publié avec la routing key `commandes.fr.creee`. Est-il routé vers cette queue ?"
    choix:
      - "Oui : `*` correspond exactement à un seul mot, ici `fr`"
      - "Non : `*` ne correspond qu'à une chaîne vide"
      - "Non, seul `#` peut remplacer un segment dans un exchange `topic`"
      - "Oui, mais uniquement si l'exchange est de type `direct`"
    reponse: 0
    explication: "Dans un exchange `topic`, `*` remplace **exactement un mot** entre deux points, `#` remplace **zéro ou plusieurs mots**. `commandes.*.creee` correspond donc à `commandes.fr.creee`, `commandes.de.creee`, etc., mais pas à `commandes.creee` (il manque un segment) ni à `commandes.fr.eu.creee` (deux segments)."
  - question: "Un `@RabbitListener` (mode d'acquittement `AUTO`, le défaut) lève une exception non gérée en traitant un message. Que fait Spring AMQP par défaut ?"
    code: |
      @RabbitListener(queues = "commandes.a-traiter")
      public void traiter(CommandeDto commande) {
          service.traiter(commande); // lève une exception
      }
    choix:
      - "Le message est acquitté (perdu) malgré l'exception"
      - "Le message est rejeté et, sauf configuration contraire, remis en tête de la queue (requeue), pouvant créer une boucle infinie sur un message systématiquement en échec"
      - "Le conteneur d'écoute s'arrête définitivement"
      - "Le message est automatiquement routé vers une dead letter queue, sans configuration supplémentaire"
    reponse: 1
    explication: "En mode `AUTO` (par défaut), le conteneur acquitte positivement après un retour normal de la méthode, et négativement en cas d'exception. Le comportement par défaut sur un rejet est de **remettre le message en file** (`requeue=true`) : un message qui échoue systématiquement peut donc boucler indéfiniment. Pour éviter la boucle et isoler les messages en échec, on combine typiquement `defaultRequeueRejected=false` (ou une exception non « requeue-able ») avec un dead letter exchange configuré sur la queue."
  - question: "Que retourne `MessageConverter` par défaut si on ne configure rien, et pourquoi le remplace-t-on presque toujours ?"
    choix:
      - "Un converter JSON basé sur Jackson, activé automatiquement dès que Jackson est sur le classpath"
      - "Le `SimpleMessageConverter`, qui repose sur la sérialisation Java native (`Serializable`), peu interopérable et fragile aux évolutions de classe"
      - "Aucun converter par défaut : la configuration d'un `MessageConverter` est obligatoire pour démarrer"
      - "Un converter XML, pour rester compatible avec les anciens clients AMQP"
    reponse: 1
    explication: "Sans configuration explicite, `RabbitTemplate` et les conteneurs `@RabbitListener` utilisent `SimpleMessageConverter`, qui sérialise les objets Java avec `Serializable` — illisible pour un client non Java, et cassé au moindre changement incompatible de la classe. En pratique, on déclare un bean `Jackson2JsonMessageConverter` pour échanger du JSON, interopérable et stable."
---

## Essentiel

RabbitMQ implémente le modèle **AMQP** : un producteur publie sur un **exchange**, qui route le message vers une ou plusieurs **queues** selon les **bindings** déclarés et la **routing key** du message. Contrairement à Kafka, une **queue** est une vraie file d'attente : un message consommé et acquitté en disparaît.

```java
@Configuration
public class RabbitConfig {

    @Bean
    public Queue queueCommandes() {
        return new Queue("commandes.a-traiter");
    }

    @Bean
    public TopicExchange exchangeCommandes() {
        return new TopicExchange("commandes.evenements");
    }

    @Bean
    public Binding binding() {
        return BindingBuilder.bind(queueCommandes())
                .to(exchangeCommandes())
                .with("commandes.*.creee");
    }
}
```

Publier avec `RabbitTemplate` :

```java
rabbitTemplate.convertAndSend("commandes.evenements", "commandes.fr.creee", commande);
```

Consommer avec `@RabbitListener` :

```java
@RabbitListener(queues = "commandes.a-traiter")
public void traiter(CommandeDto commande) {
    facturationService.traiter(commande);
}
```

Quatre types d'exchange couvrent la plupart des besoins de routage : **direct** (correspondance exacte), **topic** (motifs avec `*`/`#`), **fanout** (diffusion à tous, routing key ignorée) et **headers** (routage sur des attributs). Le choix du type dépend de la façon dont on veut filtrer les destinataires d'un message.

## Détail

### Comment ça marche

Le producteur ne connaît que l'exchange et la routing key : il ignore combien de queues, ni lesquelles, recevront réellement le message — c'est le rôle des bindings. Une queue peut être liée à plusieurs exchanges, et un exchange peut avoir zéro binding (les messages publiés sont alors simplement perdus, sauf option « publisher confirms » côté producteur pour au moins savoir que le broker les a reçus). Contrairement à un topic Kafka, un message consommé et acquitté est retiré de la queue : RabbitMQ ne permet pas nativement de « rejouer » l'historique.

### Exemple 1 — Exchange direct (routage exact)

```java
@Bean
public DirectExchange exchangeNotifications() {
    return new DirectExchange("notifications");
}

@Bean
public Binding bindingEmail() {
    return BindingBuilder.bind(new Queue("notifications.email"))
            .to(exchangeNotifications())
            .with("email"); // routing key exacte
}
```

Un message publié avec la routing key `email` atteint uniquement les queues liées avec exactement cette clé — utile pour un routage simple, un canal = une clé.

### Exemple 2 — Exchange fanout (diffusion)

```java
@Bean
public FanoutExchange exchangeAudit() {
    return new FanoutExchange("audit.broadcast");
}
```

Toutes les queues liées à un exchange `fanout` reçoivent **chaque** message, quelle que soit la routing key fournie (souvent ignorée ou vide). Typique pour diffuser un événement à plusieurs consommateurs indépendants (audit, cache, notifications) sans coupler le producteur à leur nombre.

### Exemple 3 — Conversion JSON

```java
@Bean
public Jackson2JsonMessageConverter jsonConverter() {
    return new Jackson2JsonMessageConverter();
}

@Bean
public RabbitTemplate rabbitTemplate(ConnectionFactory cf, Jackson2JsonMessageConverter converter) {
    RabbitTemplate template = new RabbitTemplate(cf);
    template.setMessageConverter(converter);
    return template;
}
```

Déclarer ce bean suffit : l'auto-configuration Spring Boot l'applique aussi bien à `RabbitTemplate` qu'aux conteneurs `@RabbitListener`, tant qu'un seul `MessageConverter` est présent dans le contexte. Les messages échangés deviennent du JSON lisible par n'importe quel client, plutôt qu'une sérialisation Java propriétaire.

### Exemple 4 — Dead letter exchange

```java
@Bean
public Queue queueCommandes() {
    return QueueBuilder.durable("commandes.a-traiter")
            .withArgument("x-dead-letter-exchange", "commandes.dlx")
            .build();
}

@Bean
public DirectExchange dlx() {
    return new DirectExchange("commandes.dlx");
}

@Bean
public Queue queueEchecs() {
    return new Queue("commandes.echecs");
}

@Bean
public Binding bindingDlx() {
    return BindingBuilder.bind(queueEchecs()).to(dlx()).with("commandes.a-traiter");
}
```

```java
@Bean
public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
        ConnectionFactory cf, Jackson2JsonMessageConverter converter) {
    SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
    factory.setConnectionFactory(cf);
    factory.setMessageConverter(converter);
    factory.setDefaultRequeueRejected(false); // ne pas remettre en file : direction le DLX
    return factory;
}
```

```java
@RabbitListener(queues = "commandes.a-traiter")
public void traiter(CommandeDto commande) {
    service.traiter(commande); // une exception non rattrapée rejette le message
}
```

Avec `setDefaultRequeueRejected(false)`, une exception non rattrapée fait rejeter le message **sans le remettre en file** : comme la queue déclare `x-dead-letter-exchange`, RabbitMQ le republie automatiquement vers le DLX plutôt que de le remettre en boucle devant le même consommateur.

### Kafka vs RabbitMQ

| | Kafka | RabbitMQ |
|---|---|---|
| Modèle | Journal distribué, rejouable | File de messages, consommée puis vidée |
| Après consommation | Le message reste (rétention configurable) | Le message disparaît une fois acquitté |
| Ordre | Garanti par partition (selon la clé) | Garanti dans une queue simple (FIFO) |
| Routage | Par topic/partition (clé) | Riche : direct, topic, fanout, headers |
| Relire l'historique | Naturel (rejouer depuis un offset) | Pas nativement prévu |
| Cas d'usage typique | Flux d'événements à fort volume, plusieurs consommateurs indépendants du même flux | Tâches à distribuer, routage fin, files de travail classiques |

### Pièges courants

> **Publier sur un exchange sans binding.** Le message est accepté par le broker puis **perdu**, sans erreur du côté du producteur (sauf activation explicite des « publisher confirms » et returns). Toujours vérifier qu'un binding relie bien l'exchange à au moins une queue avant de mettre en production.

> **Laisser le comportement de reprise par défaut sur une erreur métier définitive.** Sans configuration, un message qui échoue systématiquement (donnée invalide, par exemple) est remis en file indéfiniment (`requeue=true` par défaut), saturant le conteneur d'écoute en boucle. Distinguer les erreurs **transitoires** (retenter a du sens) des erreurs **définitives** (à envoyer directement vers un dead letter exchange).

> **Oublier le `MessageConverter` sur le conteneur d'écoute.** Configurer `Jackson2JsonMessageConverter` uniquement sur `RabbitTemplate` (côté producteur) ne suffit pas : sans le même converter appliqué à la fabrique de conteneurs `@RabbitListener`, la désérialisation côté consommateur retombe sur le comportement par défaut.

### À retenir

- Le routage passe toujours par un **exchange** puis un **binding** vers une **queue** ; sans binding, un message publié est perdu.
- Quatre types d'exchange : **direct** (clé exacte), **topic** (motifs `*`/`#`), **fanout** (diffusion), **headers** (attributs).
- `Jackson2JsonMessageConverter` remplace la sérialisation Java par défaut, à appliquer autant au `RabbitTemplate` qu'aux conteneurs `@RabbitListener`.
- Une exception dans `@RabbitListener` remet le message en file par défaut : configurer un **dead letter exchange** pour isoler les échecs définitifs plutôt que de boucler indéfiniment.
- Kafka rejoue un journal ordonné par partition ; RabbitMQ distribue et vide une file — le choix dépend du besoin (flux d'événements relisable vs distribution de tâches).
