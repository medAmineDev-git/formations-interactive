---
id: microservices-principes
chapitre: microservices
ordre: 1
titre: "Principes des microservices"
termes:
  - terme: Bounded context
    definition: "Concept du Domain-Driven Design : une frontière explicite autour d'un sous-domaine métier (facturation, catalogue, expédition…), à l'intérieur de laquelle un modèle et un vocabulaire restent cohérents. C'est la base la plus fiable pour découper des microservices — plus fiable qu'un découpage technique (par couche) ou organisationnel arbitraire."
  - terme: Une base de données par service
    definition: "Chaque microservice possède son propre schéma, inaccessible directement aux autres services. C'est ce qui garantit le découplage : sans cela, deux services partageant une base sont couplés par le schéma, même s'ils communiquent par API."
  - terme: Cohérence éventuelle (eventual consistency)
    definition: "Dans un système distribué, les données de plusieurs services ne sont pas toujours synchronisées à l'instant T. Elles convergent **avec un délai** (via des événements, par exemple), au lieu d'une transaction unique et immédiate comme dans un monolithe."
  - terme: Communication synchrone vs asynchrone
    definition: "**Synchrone** (REST, gRPC) : le service appelant attend la réponse, couplage temporel fort. **Asynchrone** (message, événement) : l'appelant publie et continue, le traitement se fait indépendamment — découplage temporel, mais complexité de traçabilité en plus."
  - terme: Monolithe modulaire
    definition: "Une seule application déployée, mais découpée en **modules internes** aux frontières nettes (packages séparés, pas de dépendances croisées non maîtrisées). Étape intermédiaire courante avant de découper en microservices, ou alternative durable quand la complexité distribuée ne se justifie pas."
  - terme: 12-factor app
    definition: "Ensemble de bonnes pratiques pour des applications cloud-native : configuration dans l'environnement (pas dans le code), dépendances explicites, processus sans état, logs traités comme des flux d'événements, parité dev/prod… Base commune aux architectures microservices modernes."
  - terme: Complexité accidentelle vs essentielle
    definition: "La complexité **essentielle** vient du métier (elle existe quoi qu'on fasse). La complexité **accidentelle** vient des choix d'architecture (réseau, sérialisation, orchestration…). Les microservices échangent de la complexité métier contre de la complexité distribuée : ce n'est un bon calcul que si le métier ou l'organisation le justifie."
quiz:
  - question: "Une équipe découpe son application en microservices en séparant « couche web », « couche métier » et « couche données » dans trois services distincts. Quel est le problème principal ?"
    choix:
      - "Aucun : c'est le découpage standard recommandé"
      - "Le découpage est technique et non métier : les trois services restent couplés et doivent évoluer ensemble à chaque changement de fonctionnalité"
      - "Il manque un quatrième service pour la sécurité"
      - "Ce découpage n'est possible qu'avec Spring Cloud Gateway"
    reponse: 1
    explication: "Un découpage par couche technique recrée en réseau les dépendances qui existaient déjà en mémoire : la moindre fonctionnalité traverse les trois services, qui doivent être déployés ensemble. Le découpage recommandé suit les frontières métier (bounded context) : chaque service porte une capacité métier complète, de l'API à la base de données."
  - question: "Pourquoi recommande-t-on qu'un microservice ait sa propre base de données, plutôt qu'un schéma partagé entre plusieurs services ?"
    choix:
      - "Pour des raisons de performance uniquement : une base partagée est toujours plus lente"
      - "Parce qu'un schéma partagé recrée un couplage fort : un service ne peut plus faire évoluer sa table sans risquer de casser un autre service qui la lit directement"
      - "Ce n'est qu'une convention esthétique, sans impact réel"
      - "Parce que deux bases ne peuvent pas tourner sur le même serveur"
    reponse: 1
    explication: "Le but des microservices est le découplage. Si deux services lisent ou écrivent dans les mêmes tables, ils sont couplés au niveau du schéma, même si leurs API sont séparées : un renommage de colonne dans un service peut casser l'autre sans qu'aucun appel d'API n'ait changé. Chaque service expose ses données via son API, jamais via un accès direct à sa base par un autre service."
  - question: "Dans quel cas les microservices sont-ils probablement un mauvais choix ?"
    choix:
      - "Une petite équipe qui démarre un produit dont le périmètre métier est encore incertain"
      - "Une grande organisation avec plusieurs équipes autonomes et des domaines métier stables et bien identifiés"
      - "Un système qui doit déployer des parties indépendamment à haute fréquence"
      - "Un système où certains composants ont des besoins de montée en charge très différents des autres"
    reponse: 0
    explication: "Les microservices ajoutent un coût réel (réseau, cohérence éventuelle, observabilité distribuée, déploiement multiplié) qui ne se justifie que s'il achète quelque chose en retour : autonomie d'équipes, scalabilité différenciée, déploiements indépendants. Quand le périmètre métier n'est pas encore stabilisé, découper trop tôt fige des frontières qui vont de toute façon bouger — un monolithe modulaire est presque toujours le meilleur point de départ."
---

## Essentiel

Un **monolithe** est déployé comme une seule unité ; des **microservices** sont plusieurs applications indépendantes, déployées séparément, communiquant par le réseau. Le critère de découpage qui fonctionne le mieux est le **bounded context** (Domain-Driven Design) : chaque service porte une **capacité métier complète** — pas une couche technique — avec sa propre logique et sa **propre base de données**.

| | Monolithe | Microservices |
|---|---|---|
| Déploiement | Une unité | Indépendant par service |
| Communication interne | Appels de méthode (en mémoire) | Réseau (REST, messages) |
| Transaction | ACID, immédiate | Cohérence éventuelle |
| Scalabilité | Toute l'application | Service par service |
| Complexité opérationnelle | Faible | Élevée (réseau, observabilité, déploiement) |
| Autonomie des équipes | Limitée (code partagé) | Forte, si le découpage est bon |

Les microservices ont un **coût réel** : latence et pannes réseau, cohérence éventuelle des données au lieu de transactions, observabilité distribuée à mettre en place, et un déploiement à orchestrer par service. Ce coût ne se justifie que s'il achète quelque chose — autonomie d'équipes, scalabilité différenciée, déploiements indépendants et fréquents. Une équipe qui démarre un produit gagne en général à commencer par un **monolithe modulaire** : une seule application, mais avec des frontières internes nettes qui préparent un découpage ultérieur si le besoin se confirme.

## Détail

### Pourquoi le découpage par domaine métier plutôt que par couche technique

Un découpage « service web / service métier / service données » recrée en réseau les dépendances qui existaient déjà en mémoire dans un monolithe : la moindre fonctionnalité traverse les trois services, qui doivent évoluer et se déployer ensemble — on a payé le coût du réseau sans gagner l'autonomie de déploiement. Le **bounded context** (venu du Domain-Driven Design) donne un meilleur critère : chaque service correspond à un sous-domaine métier cohérent (facturation, catalogue, expédition…), avec son propre modèle de données et son propre vocabulaire.

### Exemple 1 — Découpage par domaine dans une boutique en ligne

```
service-catalogue     → produits, catégories, recherche
service-commandes     → panier, création de commande, historique
service-paiement      → transactions, remboursements
service-expedition    → suivi de livraison
```

Chaque service possède ses propres tables. `service-commandes` ne lit jamais directement la base de `service-catalogue` : il appelle son API (ou réagit à ses événements) pour connaître le prix d'un produit au moment de la commande.

### Exemple 2 — Communication synchrone (REST)

```java
@Service
public class CommandeService {

    private final RestClient catalogueClient;

    public CommandeService(RestClient.Builder builder) {
        this.catalogueClient = builder.baseUrl("http://service-catalogue").build();
    }

    public Commande creer(CreationCommandeDto dto) {
        Produit produit = catalogueClient.get()
                .uri("/produits/{id}", dto.produitId())
                .retrieve()
                .body(Produit.class);
        // ... construction de la commande avec le prix courant
    }
}
```

Simple à raisonner (comme un appel de méthode), mais couplage **temporel** : si `service-catalogue` est indisponible ou lent, `service-commandes` l'est aussi pour cette opération. D'où l'intérêt de la résilience (voir la leçon sur Resilience4j).

### Exemple 3 — Communication asynchrone (événement)

```java
// Dans service-commandes, après la création
applicationEventPublisher.publishEvent(new CommandeCreeeEvent(commande.getId(), commande.getClientId()));

// Dans service-expedition (ou via un broker de messages Kafka/RabbitMQ)
@KafkaListener(topics = "commandes.creees")
public void onCommandeCreee(CommandeCreeeEvent event) {
    expeditionService.preparerExpedition(event.commandeId());
}
```

`service-commandes` n'attend pas que `service-expedition` ait traité l'événement : il continue immédiatement. Le prix à payer est la **cohérence éventuelle** : il existe un court délai pendant lequel la commande existe sans que son expédition ait été préparée. Ce découplage temporel est traité en détail dans le chapitre sur la messagerie.

### Le monolithe modulaire comme étape intermédiaire

```
com.boutique
 ├── catalogue     (package sans dépendance vers commandes.impl)
 ├── commandes
 ├── paiement
 └── expedition
```

Une seule application, un seul déploiement, mais des **frontières de package** strictes (un module n'accède aux autres que par une interface publique explicite, jamais à leurs classes internes). C'est un excellent point de départ : le coût opérationnel reste celui d'un monolithe, et si un module doit un jour devenir un service séparé, ses frontières sont déjà là — l'extraire est un refactoring, pas une redécouverte du domaine.

### Les principes 12-factor, pertinents pour les microservices

Quelques principes particulièrement structurants dans un contexte distribué :

- **Configuration dans l'environnement** : pas de valeurs d'environnement en dur dans le code ni dans un fichier versionné — variables d'environnement ou service de configuration externe (voir la leçon sur la configuration centralisée).
- **Processus sans état** : l'état (session, panier…) ne vit pas en mémoire du service, mais dans un stockage partagé (base, cache) — sinon impossible de faire tourner plusieurs instances derrière un équilibreur de charge.
- **Logs comme flux d'événements** : chaque service écrit sur sa sortie standard, un système externe (agrégateur de logs) centralise — indispensable dès qu'on a plus d'une instance par service.
- **Parité dev/prod** : mêmes types de dépendances (base, broker de messages) en développement qu'en production, pour éviter les surprises au déploiement.

### Pièges courants

> **Découper trop tôt.** Tant que le domaine métier n'est pas stabilisé, un découpage en microservices fige des frontières qui vont de toute façon bouger — chaque renégociation de frontière entre deux services coûte beaucoup plus cher qu'un refactoring interne à un monolithe modulaire.

> **Base de données partagée entre services « pour simplifier ».** Ça supprime le principal bénéfice du découpage : deux services qui lisent/écrivent le même schéma sont couplés, même avec des API séparées. Un service ne doit exposer ses données qu'à travers son API.

> **Sous-estimer le coût de la cohérence éventuelle.** Une équipe habituée aux transactions ACID d'un monolithe découvre souvent tard que « la commande existe mais le stock n'est pas encore décrémenté » est un état normal et temporaire en microservices, pas un bug — il faut le concevoir dès le départ (idempotence, compensation).

### À retenir

- Découper selon les frontières **métier** (bounded context), jamais selon les couches techniques.
- Une base de données **par service** : les données ne s'exposent qu'à travers l'API du service qui les possède.
- Synchrone (REST) = simple mais couplage temporel ; asynchrone (messages) = découplé mais cohérence éventuelle à gérer.
- Les microservices ont un coût réel (réseau, observabilité, déploiement) : ne pas les choisir sans un bénéfice net en face.
- Le **monolithe modulaire** est souvent le meilleur point de départ, et une base de migration saine vers des microservices si le besoin se confirme.
