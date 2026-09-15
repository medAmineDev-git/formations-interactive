---
id: kafka
chapitre: messagerie
ordre: 2
titre: "Kafka avec Spring"
termes:
  - terme: Topic
    definition: "Flux nommé d'événements, découpé en une ou plusieurs **partitions**. Un topic n'est pas une file d'attente classique : les messages consommés ne sont pas supprimés, ils restent disponibles (selon la politique de rétention) et peuvent être relus."
  - terme: Partition
    definition: "Sous-division d'un topic, ordonnée et immuable : les messages y sont ajoutés en séquence et numérotés par un **offset**. L'ordre n'est garanti **qu'à l'intérieur d'une même partition**, jamais entre partitions différentes."
  - terme: Offset
    definition: "Position d'un message dans sa partition. Un consumer group mémorise, pour chaque partition, le dernier offset traité — c'est ce qui lui permet de reprendre où il s'était arrêté."
  - terme: Consumer group
    definition: "Ensemble de consommateurs identifiés par un `group.id` commun, qui se répartissent les partitions d'un topic : chaque partition n'est lue **que par un seul membre du groupe** à la fois. Ajouter des instances jusqu'au nombre de partitions augmente le parallélisme."
  - terme: Clé de message (key)
    definition: "Valeur optionnelle associée à un message. Kafka calcule sa partition à partir du hash de la clé : deux messages avec la **même clé** finissent toujours dans la **même partition**, donc traités dans l'ordre l'un par rapport à l'autre. Sans clé, la répartition est round-robin."
  - terme: KafkaTemplate
    definition: "Client Spring pour publier des messages (`send(topic, clé, valeur)`), fourni par `spring-kafka`. Retourne un `CompletableFuture` pour suivre l'accusé de réception du broker."
  - terme: "@KafkaListener"
    definition: "Annotation posée sur une méthode pour en faire un consommateur d'un ou plusieurs topics (`topics = \"...\"`, `groupId = \"...\"`). Nécessite `@EnableKafka` (activé automatiquement par l'auto-configuration Spring Boot dès que `spring-kafka` est sur le classpath)."
  - terme: DeadLetterPublishingRecoverer
    definition: "Stratégie de récupération qui republie, après échec persistant du traitement, le message original vers un **topic dédié aux erreurs** (par convention `<topic>.DLT`), en conservant l'exception dans les en-têtes du message."
quiz:
  - question: "Deux commandes du même client (`clientId = 42`) sont publiées avec cette clé. Pourquoi sont-elles garanties d'être traitées dans l'ordre d'émission ?"
    code: |
      kafkaTemplate.send("commandes", String.valueOf(clientId), commande1);
      kafkaTemplate.send("commandes", String.valueOf(clientId), commande2);
    choix:
      - "Kafka garantit l'ordre global sur tout le topic, quelle que soit la clé"
      - "Les deux messages partagent la même clé, donc la même partition ; l'ordre y est garanti"
      - "KafkaTemplate attend la confirmation du premier message avant d'envoyer le second"
      - "L'ordre n'est garanti que si le topic n'a qu'une seule partition"
    reponse: 1
    explication: "Kafka ne garantit l'ordre **qu'au sein d'une partition**. Le hash de la clé détermine la partition : une même clé (`clientId`) route systématiquement vers la même partition, où les messages restent dans leur ordre d'écriture. Sans clé (ou avec des clés différentes), rien ne garantit l'ordre relatif entre deux messages."
  - question: "Ce consommateur échoue au démarrage avec une erreur de désérialisation. Quelle en est la cause la plus probable ?"
    code: |
      @KafkaListener(topics = "commandes", groupId = "facturation")
      public void consommer(CommandeDto commande) {
          service.traiter(commande);
      }
    choix:
      - "`@KafkaListener` ne supporte pas les types génériques comme paramètre"
      - "Le `JsonDeserializer` refuse de désérialiser vers un package qui n'a pas été déclaré comme package de confiance (`trusted packages`)"
      - "Il manque `@EnableKafka` sur la méthode"
      - "`groupId` doit obligatoirement correspondre au nom du topic"
    reponse: 1
    explication: "Depuis les correctifs de sécurité de `spring-kafka`, `JsonDeserializer` refuse par défaut de recréer une instance d'une classe dont le package n'a pas été explicitement autorisé, pour éviter la désérialisation de classes arbitraires. Il faut déclarer les packages de confiance, par exemple via `spring.kafka.consumer.properties.spring.json.trusted.packages=com.exemple.dto` (ou `*` pour tout autoriser, à réserver aux environnements de confiance)."
  - question: "Avec `DefaultErrorHandler` associé à un `DeadLetterPublishingRecoverer`, que se passe-t-il quand `@KafkaListener` lève systématiquement une exception sur un message donné ?"
    choix:
      - "Le message est ignoré silencieusement dès la première erreur"
      - "L'application s'arrête après la première exception"
      - "Le message est retraité un certain nombre de fois (backoff configurable), puis republié tel quel vers le topic `<nom>.DLT` une fois les tentatives épuisées"
      - "Le consumer group entier est automatiquement supprimé"
    reponse: 2
    explication: "`DefaultErrorHandler` retente le traitement selon le `BackOff` configuré. Une fois les tentatives épuisées, il délègue au `DeadLetterPublishingRecoverer`, qui republie le message original (avec l'exception dans les en-têtes) vers le topic `<topic>.DLT` par convention, puis l'offset est validé pour le topic d'origine : la consommation continue sans bloquer sur ce message."
---

## Essentiel

Kafka est un **journal distribué** : les producteurs écrivent des messages dans des **topics**, découpés en **partitions** ordonnées. Un message consommé n'est pas supprimé — il reste disponible selon la rétention configurée, et peut être relu. Chaque **consumer group** garde sa propre progression (les **offsets**), indépendamment des autres groupes qui liraient le même topic.

Publier avec `KafkaTemplate` :

```java
@Service
public class CommandeProducer {
    private final KafkaTemplate<String, CommandeDto> kafkaTemplate;

    public void publier(CommandeDto commande) {
        kafkaTemplate.send("commandes", String.valueOf(commande.clientId()), commande);
    }
}
```

Consommer avec `@KafkaListener` :

```java
@Component
public class CommandeConsumer {
    @KafkaListener(topics = "commandes", groupId = "facturation")
    public void consommer(CommandeDto commande) {
        facturationService.traiter(commande);
    }
}
```

La **clé** (ici `clientId`) détermine la partition : deux messages avec la même clé restent dans l'ordre l'un par rapport à l'autre, ce qui n'est pas garanti entre partitions différentes. Un `groupId` identifie un ensemble de consommateurs qui se répartissent les partitions ; augmenter le nombre d'instances jusqu'au nombre de partitions augmente le parallélisme de consommation.

## Détail

### Comment ça marche

Un topic vit sur un ou plusieurs **brokers**, répliqué pour la tolérance aux pannes. À l'intérieur d'un consumer group, Kafka assigne chaque partition à un seul consommateur à la fois (rééquilibrage automatique si des instances rejoignent ou quittent le groupe). Un consommateur lit séquentiellement les partitions qui lui sont assignées et valide (« commit ») régulièrement l'offset atteint — c'est ce qui permet, en cas de redémarrage, de reprendre là où il s'était arrêté plutôt que de tout relire.

### Exemple 1 — Producteur et sérialisation JSON

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
```

`JsonSerializer` (fourni par `spring-kafka`) sérialise n'importe quel objet en JSON et ajoute un en-tête contenant le nom de la classe, utilisé côté consommateur pour reconstruire le bon type. `acks: all` attend l'accusé de réception de toutes les répliques synchronisées avant de considérer l'envoi réussi — le choix le plus sûr contre la perte de message.

### Exemple 2 — Consommateur avec désérialisation JSON et packages de confiance

```yaml
spring:
  kafka:
    consumer:
      group-id: facturation
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: com.exemple.commandes.dto
```

`auto-offset-reset: earliest` indique où commencer la lecture **si aucun offset n'a encore été enregistré** pour ce groupe (par exemple à la toute première exécution) : `earliest` relit tout l'historique disponible, `latest` (valeur par défaut de Kafka) ne lit que les messages à venir. `spring.json.trusted.packages` autorise explicitement les packages que `JsonDeserializer` a le droit d'instancier.

### Exemple 3 — Gestion d'erreurs avec DefaultErrorHandler et DLT

```java
@Configuration
public class KafkaErrorConfig {

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
        var recoverer = new DeadLetterPublishingRecoverer(template);
        var backOff = new FixedBackOff(1000L, 3); // 3 tentatives, 1 s d'intervalle
        return new DefaultErrorHandler(recoverer, backOff);
    }
}
```

Ce bean est repris automatiquement par le `ConcurrentKafkaListenerContainerFactory` de l'auto-configuration. Le message qui échoue est retraité jusqu'à trois fois ; s'il échoue toujours, `DeadLetterPublishingRecoverer` le republie vers `commandes.DLT` (le nom du topic d'origine suffixé de `.DLT`) plutôt que de bloquer indéfiniment le traitement des messages suivants de la même partition.

### Exemple 4 — Consommateur idempotent

```java
@KafkaListener(topics = "commandes", groupId = "facturation")
public void consommer(CommandeDto commande) {
    if (facturesRepository.existsByCommandeId(commande.id())) {
        return; // déjà traité, on ignore le doublon
    }
    facturationService.traiter(commande);
}
```

Kafka garantit une livraison **au moins une fois** (« at least once ») dans la configuration la plus courante : un redémarrage après traitement mais avant validation de l'offset, ou un rééquilibrage, peuvent entraîner le retraitement d'un même message. Le traitement doit donc être **idempotent** — rejouable sans effet indésirable — plutôt que de supposer une livraison exactement unique.

### Principales propriétés `spring.kafka.*`

| Propriété | Rôle |
|---|---|
| `spring.kafka.bootstrap-servers` | Adresse(s) des brokers auxquels se connecter |
| `spring.kafka.consumer.group-id` | Identifiant du consumer group (peut aussi être fixé par listener via `groupId`) |
| `spring.kafka.consumer.auto-offset-reset` | Point de départ (`earliest`/`latest`) si aucun offset enregistré |
| `spring.kafka.consumer.properties.spring.json.trusted.packages` | Packages autorisés pour `JsonDeserializer` |
| `spring.kafka.producer.acks` | Niveau d'accusé de réception exigé (`0`, `1`, `all`) |
| `spring.kafka.listener.ack-mode` | Mode de validation des offsets (ex. `RECORD`, `BATCH`) |

### Pièges courants

> **Changer le nombre de partitions d'un topic déjà en production.** Le hash d'une clé se recalcule sur le nouveau nombre de partitions : les messages d'une même clé peuvent alors atterrir dans une partition différente, rompant l'ordre relatif garanti jusque-là. Dimensionner les partitions dès la création du topic, en anticipant la charge future.

> **Oublier les packages de confiance du `JsonDeserializer`.** Sans `spring.json.trusted.packages` configuré (ou `*`), la désérialisation d'un DTO applicatif échoue au premier message reçu, même si le producteur envoie un JSON parfaitement valide.

> **Supposer une livraison exactement unique.** Le modèle par défaut de Kafka est « au moins une fois » : un même message peut être retraité après un rééquilibrage ou un redémarrage mal placé. Un traitement non idempotent (par exemple un simple `INSERT` sans vérification) produit alors des doublons.

### À retenir

- L'ordre n'est garanti **qu'au sein d'une partition** ; la clé du message détermine la partition.
- Un consumer group répartit les partitions entre ses membres : chaque partition n'a qu'un seul lecteur actif à la fois dans le groupe.
- `JsonSerializer`/`JsonDeserializer` simplifient l'échange d'objets, mais le consommateur doit déclarer ses `trusted.packages`.
- `DefaultErrorHandler` + `DeadLetterPublishingRecoverer` isolent les messages en échec persistant dans un topic `.DLT`, sans bloquer les suivants.
- Livraison au moins une fois : concevoir des consommateurs **idempotents**. Pour garantir l'écriture en base **et** la publication de l'événement de façon atomique, voir le pattern **outbox transactionnel**.
