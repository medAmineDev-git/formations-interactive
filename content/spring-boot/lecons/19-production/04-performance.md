---
id: performance
chapitre: production
ordre: 4
titre: "Performance et tuning"
termes:
  - terme: Mesurer avant d'optimiser
    definition: "Principe de base du tuning : identifier le **vrai** goulot d'étranglement (métriques Actuator/Micrometer, profilage, logs de requêtes lentes) avant de changer un réglage. Modifier un paramètre au hasard, sans mesure avant/après, risque de dégrader ce qui fonctionnait déjà et de masquer le problème réel."
  - terme: "HikariCP — maximum-pool-size"
    definition: "`spring.datasource.hikari.maximum-pool-size` fixe le nombre maximal de connexions simultanées à la base de données. Un pool trop grand n'accélère pas les requêtes : au-delà d'un certain seuil, les connexions supplémentaires se disputent les mêmes ressources (cœurs CPU, disques) côté base de données, et la contention peut même **réduire** le débit global."
  - terme: "spring.jpa.open-in-view"
    definition: "Propriété booléenne, `true` par défaut dans Spring Boot, qui garde la session Hibernate ouverte jusqu'à la fin du rendu de la réponse. Pratique (elle évite des `LazyInitializationException` dans les vues), mais elle maintient une connexion à la base **occupée** pendant tout le traitement de la requête, y compris les parties qui n'accèdent pas aux données. La passer à `false` force un accès explicite aux données dans la couche service."
  - terme: Initialisation paresseuse (lazy-initialization)
    definition: "`spring.main.lazy-initialization=true` retarde la création des beans jusqu'à leur première utilisation, au lieu de tout créer au démarrage. Réduit le temps de démarrage, au prix d'un premier appel à chaque bean légèrement plus lent et d'erreurs de configuration détectées plus tard qu'au démarrage."
  - terme: "server.compression.enabled"
    definition: "Active la compression (gzip) des réponses HTTP dépassant une taille minimale (`server.compression.min-response-size`), pour les types de contenu configurés (`server.compression.mime-types`). Réduit la bande passante consommée, au prix d'un peu de CPU côté serveur pour compresser."
  - terme: Ramasse-miettes (GC)
    definition: "Le récupérateur de mémoire de la JVM. Le collecteur par défaut des JVM récentes (G1) vise un compromis entre débit et pauses courtes ; son réglage fin (taille de tas, objectif de pause) n'a de sens qu'après avoir mesuré un problème réel (pauses longues, usage mémoire excessif), pas de façon préventive."
quiz:
  - question: "Une équipe augmente `spring.datasource.hikari.maximum-pool-size` de 10 à 200 sur une base PostgreSQL à 4 cœurs, en espérant absorber un pic de trafic. Quel effet est le plus probable ?"
    choix:
      - "Le débit augmente proportionnellement, car plus de connexions traitent plus de requêtes en parallèle"
      - "Le débit peut stagner voire se dégrader : trop de connexions actives simultanément se disputent les mêmes ressources CPU de la base, augmentant la contention plus qu'elle n'augmente le parallélisme utile"
      - "Aucun effet : `maximum-pool-size` ne concerne que le pool côté application, jamais la base"
      - "La base rejette automatiquement les connexions excédentaires sans impact sur les performances"
    reponse: 1
    explication: "Une base de données a une capacité de traitement parallèle limitée par ses propres ressources (cœurs, I/O disque). Au-delà d'un certain nombre de connexions actives, les requêtes se mettent en concurrence pour les mêmes ressources plutôt que de s'exécuter réellement en parallèle : le pool devient plus grand sans que le débit suive, parfois même au détriment de la latence de chaque requête. Le bon dimensionnement se mesure, il ne se devine pas."
  - question: "Que change concrètement le passage de `spring.jpa.open-in-view=true` (défaut) à `false` ?"
    choix:
      - "Les requêtes JPA deviennent automatiquement plus rapides grâce à un cache activé"
      - "La session Hibernate n'est plus maintenue ouverte jusqu'au rendu de la vue : un accès à une association chargée en lazy en dehors d'une transaction (par exemple dans le contrôleur) lève désormais une `LazyInitializationException` au lieu de fonctionner silencieusement"
      - "Toutes les entités deviennent chargées en `EAGER` par défaut"
      - "Les transactions ne sont plus nécessaires dans la couche service"
    reponse: 1
    explication: "`open-in-view=true` masque un problème de conception en gardant la session ouverte plus longtemps que la transaction métier — au prix d'une connexion base retenue inutilement pendant tout le traitement de la requête. Le passer à `false` révèle les accès à des associations lazy faits hors transaction (souvent dans la couche présentation), qu'il faut alors résoudre explicitement (projections, `JOIN FETCH`, DTO construits dans le service). C'est un compromis délibéré entre confort de développement et efficacité en production."
  - question: "Quel est le compromis principal de `spring.main.lazy-initialization=true` ?"
    choix:
      - "Elle accélère le démarrage, au prix d'un premier appel plus lent sur chaque bean concerné et d'erreurs de configuration détectées plus tard, potentiellement seulement à l'usage"
      - "Elle ralentit toujours le démarrage, mais accélère chaque requête HTTP"
      - "Elle ne concerne que les beans annotés `@Lazy` explicitement, aucun autre effet"
      - "Elle désactive complètement l'auto-configuration de Spring Boot"
    reponse: 0
    explication: "L'initialisation paresseuse retarde la création de tous les beans (pas seulement ceux annotés `@Lazy`) jusqu'à leur première sollicitation. Le démarrage devient plus rapide car moins de travail est fait immédiatement, mais un bean mal configuré peut ne révéler son erreur qu'au moment de sa première utilisation en production, plutôt qu'au démarrage où elle serait détectée tout de suite. Ce compromis se prête bien à des environnements où le démarrage rapide prime (scale-to-zero, tests), moins à une application critique où l'on préfère échouer vite."
---

## Essentiel

La règle de base du tuning : **mesurer avant d'optimiser**. Changer un paramètre à l'aveugle, sans savoir où se situe réellement le goulot d'étranglement, risque de dégrader ce qui fonctionnait et de perdre du temps sur un problème qui n'existait pas. Les métriques Actuator/Micrometer, les logs de requêtes lentes et un profilage ciblé donnent les vraies réponses.

Quelques leviers fréquents, une fois le problème identifié :

- **Requêtes** : éliminer les N+1 (voir la leçon sur le chargement lazy/eager), ajouter les bons index, paginer les listes plutôt que tout charger.
- **`spring.jpa.open-in-view=false`** : évite de garder une connexion base occupée pendant tout le traitement d'une requête HTTP, au prix d'un accès aux données explicitement fait dans la couche service.
- **Pool de connexions HikariCP** : `spring.datasource.hikari.maximum-pool-size` se dimensionne selon les ressources réelles de la base, pas « le plus grand possible ». Un pool trop grand crée de la contention plutôt que du parallélisme.
- **Compression HTTP** (`server.compression.enabled=true`) : réduit la bande passante des réponses volumineuses (JSON, texte), au prix d'un peu de CPU.
- **Temps de démarrage** : initialisation paresseuse (`spring.main.lazy-initialization=true`), exclusion des auto-configurations inutilisées.

Un test de charge (Gatling, JMeter, k6) reste le seul moyen fiable de valider qu'une optimisation a un effet réel, sous une charge représentative de la production.

## Détail

### Comment aborder le tuning méthodiquement

1. **Mesurer** l'état actuel : métriques Micrometer exposées par Actuator (temps de réponse, taux d'erreur, utilisation du pool de connexions), logs de requêtes SQL lentes, profilage CPU/mémoire si nécessaire.
2. **Identifier** le vrai goulot : CPU, mémoire, I/O disque, latence réseau vers un service externe, contention sur une ressource partagée (connexions, verrous).
3. **Changer un seul paramètre à la fois**, puis remesurer sous une charge comparable.
4. **Valider** avec un test de charge reproductible avant de considérer le changement acquis.

### Exemple 1 — Dimensionner le pool HikariCP

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 20
```

Une règle empirique parfois citée pour une base à E/S rapide (SSD) est `connexions ≈ nombre de cœurs de la base × 2`, à ajuster selon la charge réelle observée. Ce n'est qu'un point de départ — le bon chiffre dépend du type de requêtes, du matériel de la base et se confirme par la mesure, pas par la formule seule.

### Exemple 2 — Désactiver open-in-view et gérer le chargement explicitement

```yaml
spring:
  jpa:
    open-in-view: false
```

```java
@Service
public class CommandeService {

    @Transactional(readOnly = true)
    public CommandeDetailDto consulter(Long id) {
        Commande commande = commandeRepository.findByIdWithLignes(id) // JOIN FETCH explicite
                .orElseThrow();
        return CommandeDetailDto.from(commande); // conversion DANS la transaction
    }
}
```

Avec `open-in-view=false`, la conversion en DTO doit se faire **pendant** que la transaction est encore ouverte (dans le service), pas plus tard dans le contrôleur ou la sérialisation JSON. C'est plus explicite, et cela évite de garder une connexion base ouverte pendant tout le rendu de la réponse HTTP.

### Exemple 3 — Réduire le temps de démarrage

```yaml
spring:
  main:
    lazy-initialization: true
```

```java
@SpringBootApplication(exclude = {
    JmxAutoConfiguration.class // exemple : auto-configuration non utilisée, exclue explicitement
})
public class Application { }
```

L'initialisation paresseuse retarde la création des beans jusqu'à leur premier usage ; exclure une auto-configuration inutile évite le travail correspondant dès le démarrage. Ces deux leviers aident surtout dans des contextes où le démarrage rapide compte (tests, environnements à mise à l'échelle fréquente) — moins dans une application de longue durée où le gain, ponctuel, pèse peu sur la durée de vie totale du processus.

### Exemple 4 — Activer la compression HTTP

```yaml
server:
  compression:
    enabled: true
    mime-types: application/json,text/html,text/plain
    min-response-size: 1024
```

Seules les réponses dépassant `min-response-size` (ici 1 Ko) sont compressées : compresser de très petites réponses coûterait plus de CPU que ce que la réduction de bande passante ferait gagner.

### Où chercher en premier, selon le symptôme

| Symptôme observé | Piste à vérifier en premier |
|---|---|
| Temps de réponse élevé, requêtes SQL nombreuses par appel | N+1, associations lazy mal utilisées |
| Pool de connexions souvent épuisé (attente de connexion) | `open-in-view`, transactions trop longues, dimensionnement du pool |
| Démarrage lent (tests, scale-to-zero) | initialisation paresseuse, auto-configurations inutilisées |
| Bande passante élevée, réponses JSON volumineuses | compression HTTP, pagination des listes |
| Pauses GC visibles, usage mémoire croissant | profilage mémoire avant tout réglage du ramasse-miettes |

### Pièges courants

> **Augmenter le pool de connexions comme premier réflexe.** C'est souvent la fausse bonne idée : si la base est déjà proche de sa capacité, ajouter des connexions ajoute de la contention plutôt que du débit. Mesurer d'abord si le pool est réellement le goulot (connexions en attente) avant de le redimensionner.

> **Optimiser sans mesure de référence (baseline).** Sans métriques avant/après sous une charge comparable, impossible de savoir si un changement a réellement aidé — ou s'il a simplement coïncidé avec une baisse naturelle du trafic. Un test de charge reproductible (Gatling, JMeter, k6) donne une base de comparaison fiable.

> **Confondre `open-in-view=false` avec une simple bascule de configuration.** La désactiver sans revoir le code fait apparaître des `LazyInitializationException` dans des endroits qui fonctionnaient « par accident » grâce à la session ouverte. C'est un changement qui doit s'accompagner d'une revue du code d'accès aux données, pas d'un simple interrupteur.

### À retenir

- **Mesurer avant d'optimiser** : métriques, profilage, test de charge — jamais un réglage à l'aveugle.
- Le pool HikariCP se dimensionne selon les ressources de la **base**, pas selon « plus c'est grand, mieux c'est » : un pool trop grand crée de la contention.
- `spring.jpa.open-in-view=false` évite de garder une connexion occupée pendant tout le rendu de la réponse, au prix d'un chargement des données rendu explicite dans le service.
- Le temps de démarrage se réduit avec l'initialisation paresseuse et l'exclusion d'auto-configurations inutiles — utile surtout pour du démarrage fréquent (tests, scale-to-zero).
- Un test de charge (Gatling, JMeter, k6) est le seul moyen fiable de confirmer qu'une optimisation a un effet réel sous une charge représentative.
