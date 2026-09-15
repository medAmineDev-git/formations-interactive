---
id: r2dbc
chapitre: reactif
ordre: 3
titre: "Accès aux données réactif avec R2DBC"
termes:
  - terme: R2DBC
    definition: "*Reactive Relational Database Connectivity* : spécification d'accès aux bases de données relationnelles **non bloquante**, basée sur Reactive Streams. Contrairement à JDBC, aucune méthode ne bloque le thread appelant en attendant la base."
  - terme: spring-boot-starter-data-r2dbc
    definition: "Starter qui apporte Spring Data R2DBC. Nécessite en plus un **driver R2DBC** spécifique à la base utilisée (`r2dbc-postgresql`, `r2dbc-h2`, `r2dbc-mysql`…), l'équivalent réactif d'un driver JDBC."
  - terme: ReactiveCrudRepository
    definition: "Interface Spring Data équivalente à `CrudRepository`, mais dont toutes les méthodes renvoient `Mono` ou `Flux` (`Mono<T> findById(ID id)`, `Flux<T> findAll()`, `Mono<T> save(T entity)`…). Les requêtes dérivées par nom de méthode fonctionnent comme en JPA."
  - terme: DatabaseClient
    definition: "Client bas niveau de Spring Data R2DBC pour exécuter du SQL directement, avec liaison de paramètres et mapping du résultat — l'équivalent réactif de `JdbcTemplate`. Utile quand `@Query` ou les méthodes dérivées ne suffisent pas."
  - terme: TransactionalOperator
    definition: "Façon d'exécuter une séquence réactive dans une transaction sans bloquer : `transactionalOperator.transactional(monoOuFlux)`. Alternative programmatique à `@Transactional`, utilisable notamment quand la transaction doit englober plusieurs appels indépendants."
  - terme: "Absence de chargement paresseux (no lazy loading)"
    definition: "R2DBC ne connaît pas les relations entre entités comme JPA (pas de `@OneToMany`, pas de proxy, pas de session de persistance). Chaque relation doit être chargée **explicitement**, par une requête séparée composée avec `flatMap`."
quiz:
  - question: "Pourquoi ne peut-on pas simplement remplacer le driver JDBC par un driver R2DBC dans une application Spring Data JPA existante pour la rendre réactive ?"
    choix:
      - "C'est possible, JPA détecte automatiquement le type de driver et bascule en mode réactif"
      - "JPA repose sur JDBC et un modèle bloquant (sessions, chargement paresseux, proxies) ; R2DBC est une spécification différente, utilisée par Spring Data R2DBC, une autre couche d'accès aux données"
      - "R2DBC n'est compatible qu'avec les bases NoSQL"
      - "JDBC et R2DBC utilisent le même pilote, seule la configuration change"
    reponse: 1
    explication: "JPA (via Hibernate) est construit sur JDBC et un ensemble de concepts fondamentalement bloquants et non réactifs : session de persistance, proxies de chargement paresseux, cache de premier niveau. Passer au réactif implique de changer de couche d'accès aux données pour Spring Data R2DBC, avec des repositories, un modèle de mapping et des outils différents (pas d'équivalent direct à `@OneToMany`)."
  - question: "Que produit ce repository R2DBC pour un client ayant 3 commandes ?"
    code: |
      public interface ClientRepository extends ReactiveCrudRepository<Client, Long> { }

      public interface CommandeRepository extends ReactiveCrudRepository<Commande, Long> {
          Flux<Commande> findByClientId(Long clientId);
      }

      Mono<ClientAvecCommandes> fiche = clientRepository.findById(1L)
              .flatMap(client -> commandeRepository.findByClientId(client.getId())
                      .collectList()
                      .map(commandes -> new ClientAvecCommandes(client, commandes)));
    choix:
      - "Une erreur : R2DBC charge automatiquement les commandes du client via une relation"
      - "Un `Mono<ClientAvecCommandes>` avec le client et ses 3 commandes, obtenues par une requête séparée composée explicitement"
      - "Un `Flux<ClientAvecCommandes>` avec un élément par commande"
      - "`fiche` reste vide car `Client` et `Commande` ne sont pas liés par une annotation JPA"
    reponse: 1
    explication: "R2DBC/Spring Data R2DBC n'a pas de mécanisme de relations automatiques comme `@OneToMany` en JPA. Ici, le code compose explicitement deux requêtes avec `flatMap` : charger le client, puis charger ses commandes, puis les assembler. C'est le fonctionnement normal — pas une erreur ni un défaut de configuration."
  - question: "Pourquoi les migrations de schéma (Flyway, Liquibase) d'un projet R2DBC utilisent-elles généralement une connexion JDBC séparée plutôt que le pool R2DBC ?"
    choix:
      - "Flyway et Liquibase ne fonctionnent qu'avec R2DBC, jamais avec JDBC"
      - "Flyway et Liquibase sont conçus autour de JDBC (connexions bloquantes, exécutées une fois au démarrage) et n'ont pas de version R2DBC officielle largement adoptée"
      - "C'est interdit par Spring Boot en mode réactif"
      - "R2DBC ne supporte pas les instructions DDL (CREATE TABLE, ALTER TABLE…)"
    reponse: 1
    explication: "Les migrations sont des opérations ponctuelles au démarrage, où le modèle bloquant de JDBC ne pose aucun problème de scalabilité. Flyway et Liquibase restent construits sur JDBC : un projet R2DBC garde donc typiquement une dépendance JDBC (et son driver) uniquement pour exécuter les migrations, séparée du pool R2DBC utilisé à l'exécution."
---

## Essentiel

**R2DBC** (*Reactive Relational Database Connectivity*) est une spécification d'accès aux bases relationnelles pensée pour Reactive Streams : aucune méthode ne bloque le thread appelant. C'est la contrepartie réactive de JDBC — et donc de JPA, qui repose sur JDBC et ne peut pas devenir réactif par un simple changement de configuration.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-r2dbc</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>r2dbc-postgresql</artifactId>
</dependency>
```

Les repositories ressemblent beaucoup à Spring Data JPA, avec des types réactifs :

```java
public interface ClientRepository extends ReactiveCrudRepository<Client, Long> {
    Flux<Client> findByVille(String ville);   // requête dérivée, comme en JPA

    @Query("SELECT * FROM client WHERE actif = true")
    Flux<Client> trouverActifs();
}
```

Différence majeure avec JPA : **pas de chargement paresseux ni de relations automatiques**. Chaque relation (`Client` → ses `Commande`) se charge par une requête séparée, composée explicitement avec `flatMap` :

```java
Mono<ClientAvecCommandes> fiche = clientRepository.findById(id)
        .flatMap(client -> commandeRepository.findByClientId(client.getId())
                .collectList()
                .map(commandes -> new ClientAvecCommandes(client, commandes)));
```

## Détail

### R2DBC vs JDBC, en un coup d'œil

| | JDBC (+ JPA/Hibernate) | R2DBC (+ Spring Data R2DBC) |
|---|---|---|
| Modèle d'exécution | Bloquant, un thread attend le résultat | Non bloquant, Reactive Streams |
| Types de retour | `T`, `List<T>` | `Mono<T>`, `Flux<T>` |
| Relations (`@OneToMany`…) | Oui, avec chargement paresseux | Non : composition manuelle des requêtes |
| Cache de premier niveau, dirty checking | Oui (session Hibernate) | Non |
| Migrations Flyway/Liquibase | Oui, nativement | Généralement via une connexion JDBC séparée |
| Maturité de l'écosystème | Très large | Plus récent, moins de drivers, moins d'outillage |

### Exemple 1 — DatabaseClient pour du SQL direct

```java
@Repository
public class RapportRepository {

    private final DatabaseClient client;

    public RapportRepository(DatabaseClient client) {
        this.client = client;
    }

    public Flux<VenteParVille> ventesParVille() {
        return client.sql("SELECT ville, SUM(montant) AS total FROM commande GROUP BY ville")
                .map((row, metadata) -> new VenteParVille(
                        row.get("ville", String.class),
                        row.get("total", BigDecimal.class)))
                .all();
    }
}
```

`DatabaseClient` est utile pour des requêtes agrégées, des jointures complexes, ou tout ce que les méthodes dérivées et `@Query` d'un `ReactiveCrudRepository` ne couvrent pas facilement.

### Exemple 2 — Transactions réactives

```java
@Service
public class TransfertService {

    private final CompteRepository compteRepository;
    private final TransactionalOperator transactionalOperator;

    public TransfertService(CompteRepository compteRepository, TransactionalOperator transactionalOperator) {
        this.compteRepository = compteRepository;
        this.transactionalOperator = transactionalOperator;
    }

    public Mono<Void> transferer(Long depuisId, Long versId, BigDecimal montant) {
        Mono<Void> operation = compteRepository.findById(depuisId)
                .flatMap(depuis -> compteRepository.save(depuis.debiter(montant)))
                .then(compteRepository.findById(versId))
                .flatMap(vers -> compteRepository.save(vers.crediter(montant)))
                .then();

        return transactionalOperator.transactional(operation);
    }
}
```

`@Transactional` fonctionne aussi sur une méthode qui renvoie `Mono`/`Flux`, à condition que `spring-boot-starter-data-r2dbc` fournisse un `ReactiveTransactionManager` (auto-configuré). Le principe reste le même qu'en JDBC : soit toutes les opérations réussissent, soit tout est annulé — mais la propagation se fait via le contexte réactif (`Context` de Reactor), pas via un `ThreadLocal` comme avec `@Transactional` classique, puisque l'exécution peut changer de thread en cours de route.

### Exemple 3 — Composer plusieurs appels sans bloquer

```java
public Mono<PanierDto> chargerPanier(Long clientId) {
    Mono<Client> client = clientRepository.findById(clientId);
    Flux<LigneCommande> lignes = ligneCommandeRepository.findByClientId(clientId);
    Mono<Promotion> promotion = promotionRepository.findActivePour(clientId)
            .defaultIfEmpty(Promotion.aucune());

    return Mono.zip(client, lignes.collectList(), promotion)
            .map(tuple -> new PanierDto(tuple.getT1(), tuple.getT2(), tuple.getT3()));
}
```

`Mono.zip` exécute les trois sources en parallèle plutôt qu'en séquence, ce qui réduit la latence totale — un avantage concret du modèle réactif quand plusieurs requêtes indépendantes doivent être combinées.

### Exemple 4 — Les migrations restent en JDBC

```xml
<!-- Reste en JDBC, uniquement pour les migrations -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId> <!-- driver JDBC, pas r2dbc-postgresql -->
</dependency>
```

```properties
# Connexion JDBC dédiée à Flyway
spring.flyway.url=jdbc:postgresql://localhost:5432/boutique
spring.flyway.user=appli
spring.flyway.password=secret

# Connexion R2DBC utilisée par l'application à l'exécution
spring.r2dbc.url=r2dbc:postgresql://localhost:5432/boutique
```

Flyway s'exécute une fois au démarrage, avant que l'application ne serve du trafic : le caractère bloquant de JDBC n'y pose aucun problème pratique.

### Pièges courants

> **Chercher un équivalent à `@OneToMany` ou au chargement paresseux.** Ça n'existe pas en Spring Data R2DBC. Vouloir reproduire le confort de JPA mène souvent à des solutions maison fragiles ; mieux vaut assumer la composition explicite des requêtes avec `flatMap`, ou charger plusieurs entités liées en une seule requête SQL via `DatabaseClient` quand la performance l'exige.

> **Garder une dépendance JPA « juste au cas où » dans un projet R2DBC.** Certaines classes utilitaires ou DTO d'un projet legacy portent parfois des annotations JPA (`@Entity`, `@Id` de `jakarta.persistence`) par habitude. Spring Data R2DBC utilise ses propres annotations (`@Id` de `org.springframework.data.annotation`, `@Table` de `org.springframework.data.relational.core.mapping`) : mélanger les deux mondes ne fonctionne pas et ajoute une dépendance bloquante inutile.

> **Oublier que `save()` fait un `INSERT` ou un `UPDATE` selon l'état de l'identifiant, sans session pour le déterminer autrement.** Sans cache de premier niveau, Spring Data R2DBC décide généralement selon que l'entité porte déjà un identifiant non nul (et parfois un champ de version) : une entité dont l'identifiant est renseigné manuellement (pas généré par la base) peut déclencher un `UPDATE` inattendu au lieu d'un `INSERT`. Il existe une interface `Persistable<ID>` pour contrôler ce comportement explicitement.

### À retenir

- R2DBC est une spécification non bloquante à part entière : on ne « rend pas JPA réactif », on change de couche d'accès aux données.
- `ReactiveCrudRepository` ressemble à `CrudRepository`, avec `Mono`/`Flux` en retour ; `@Query` et les requêtes dérivées fonctionnent de façon similaire à JPA.
- Pas de relations automatiques ni de chargement paresseux : composer les requêtes liées avec `flatMap`.
- `DatabaseClient` pour du SQL direct ; `TransactionalOperator` (ou `@Transactional` réactif) pour les transactions.
- Les migrations de schéma (Flyway, Liquibase) restent typiquement en JDBC, dans une connexion séparée du pool R2DBC applicatif.
