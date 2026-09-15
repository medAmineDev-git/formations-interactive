---
id: verrouillage-auditing
chapitre: jpa-avance
ordre: 5
titre: "Verrouillage optimiste et audit"
termes:
  - terme: "@Version"
    definition: "Champ ajouté à une entité (`Long`, `Integer`, `Short`…) pour activer le **verrouillage optimiste**. Hibernate l'incrémente à chaque mise à jour et l'inclut dans la clause `WHERE` du `UPDATE` : si la version en base a changé depuis la lecture, aucune ligne n'est mise à jour et Hibernate détecte le conflit."
  - terme: ObjectOptimisticLockingFailureException
    definition: "Exception levée quand une mise à jour avec `@Version` ne trouve aucune ligne correspondante (version obsolète) : quelqu'un d'autre a modifié la ligne entre la lecture et l'écriture. Signale un conflit d'écriture concurrente, pas une erreur de code."
  - terme: "@Lock(LockModeType.PESSIMISTIC_WRITE)"
    definition: "Sur une méthode de repository, force un verrouillage **pessimiste** : la requête SQL sous-jacente verrouille les lignes lues (typiquement `SELECT ... FOR UPDATE`), empêchant toute autre transaction de les modifier — voire de les lire selon le mode — jusqu'à la fin de la transaction en cours."
  - terme: "@EnableJpaAuditing"
    definition: "Annotation posée sur une classe `@Configuration` qui active l'infrastructure d'audit de Spring Data JPA : c'est elle qui déclenche le remplissage automatique des champs `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy`."
  - terme: "@CreatedDate et @LastModifiedDate"
    definition: "Posées sur un champ de type `LocalDateTime` (ou `Instant`…), remplies automatiquement à la création (`@CreatedDate`) ou à chaque modification (`@LastModifiedDate`) de l'entité, sans code applicatif."
  - terme: "@CreatedBy, @LastModifiedBy et AuditorAware"
    definition: "`@CreatedBy`/`@LastModifiedBy` enregistrent **qui** a créé ou modifié l'entité. Ils ont besoin d'un bean `AuditorAware<T>` fourni par l'application, dont la méthode `getCurrentAuditor()` renvoie l'utilisateur courant (souvent déduit du contexte de sécurité)."
  - terme: "@EntityListeners(AuditingEntityListener.class)"
    definition: "Annotation à poser sur chaque entité (ou une classe de base commune) pour que les champs d'audit soient réellement renseignés : sans elle, `@EnableJpaAuditing` seul ne suffit pas, les champs `@CreatedDate`/`@LastModifiedDate`/`@CreatedBy`/`@LastModifiedBy` restent vides."
quiz:
  - question: "Deux utilisateurs chargent la même `Commande` (version = 3), puis modifient chacun un champ et appellent `save()`. Le premier `save()` réussit et passe la version à 4. Que se passe-t-il pour le second `save()` ?"
    code: |
      @Entity
      public class Commande {
          @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
          private Long id;

          @Version
          private Long version;

          private StatutCommande statut;
      }
    choix:
      - "Il écrase silencieusement les modifications du premier utilisateur"
      - "Il échoue avec une `ObjectOptimisticLockingFailureException` : la version en base (4) ne correspond plus à la version chargée par ce second utilisateur (3)"
      - "Il attend que la transaction du premier utilisateur se termine, puis s'applique automatiquement"
      - "Il fonctionne normalement, `@Version` ne sert qu'à l'affichage"
    reponse: 1
    explication: "L'`UPDATE` généré par Hibernate pour le second `save()` contient `WHERE id = ? AND version = 3` : comme la version en base est désormais `4`, aucune ligne ne correspond, et Hibernate lève une `ObjectOptimisticLockingFailureException`. C'est le mécanisme voulu : détecter un conflit plutôt que d'écraser silencieusement une modification concurrente. Au code appelant de proposer un rechargement ou une nouvelle tentative."
  - question: "Pour quel type de scénario le verrouillage pessimiste (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) est-il le plus adapté, par rapport au verrouillage optimiste ?"
    choix:
      - "Tous les cas, il est toujours préférable au verrouillage optimiste"
      - "Un scénario où les conflits d'écriture sont fréquents et où le coût de faire échouer/réessayer une transaction serait trop élevé, par exemple décrémenter un stock très demandé"
      - "Uniquement pour les requêtes de lecture seule"
      - "Il remplace `@Transactional`, qui devient inutile"
    reponse: 1
    explication: "Le verrouillage optimiste (avec `@Version`) convient à la majorité des cas : peu de conflits réels, coût minimal tant qu'il n'y en a pas. Le verrouillage pessimiste bloque activement les autres transactions sur la ligne dès la lecture — utile quand un conflit est probable (forte contention sur une même ligne, comme un stock très demandé) et qu'un échec après coup serait plus coûteux qu'une attente, mais il réduit la concurrence et peut provoquer des verrous mous ou des interblocages s'il est mal utilisé."
  - question: "Cette entité ne voit jamais ses champs d'audit renseignés, alors que `@EnableJpaAuditing` est bien présent sur une classe `@Configuration` du projet. Pourquoi ?"
    code: |
      @Entity
      public class Commande {
          @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
          private Long id;

          @CreatedDate
          private LocalDateTime dateCreation;

          @LastModifiedDate
          private LocalDateTime derniereModification;
      }
    choix:
      - "`@CreatedDate` et `@LastModifiedDate` n'existent pas sur des `LocalDateTime`"
      - "Il manque `@EntityListeners(AuditingEntityListener.class)` sur l'entité : sans lui, le remplissage automatique ne se déclenche pas pour cette entité"
      - "`@EnableJpaAuditing` doit être posée directement sur l'entité, pas sur une classe `@Configuration`"
      - "Il manque un champ `@Version`"
    reponse: 1
    explication: "`@EnableJpaAuditing` active l'infrastructure d'audit au niveau de l'application, mais c'est `@EntityListeners(AuditingEntityListener.class)` sur l'entité (ou une classe de base commune) qui déclenche réellement le remplissage des champs à la persistance et à la mise à jour. Sans ce listener sur l'entité, les deux mécanismes restent inactifs l'un sans l'autre."
---

## Essentiel

**Verrouillage optimiste** : un champ `@Version` détecte les écritures concurrentes sans jamais bloquer personne.

```java
@Entity
public class Commande {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version; // incrémenté à chaque UPDATE

    private StatutCommande statut;
}
```

Hibernate inclut la version dans la clause `WHERE` de chaque `UPDATE`. Si elle a changé entre la lecture et l'écriture, aucune ligne ne correspond : Hibernate lève une `ObjectOptimisticLockingFailureException`. C'est le comportement recherché dans la majorité des applications web : pas de verrou tenu pendant la réflexion de l'utilisateur, juste une détection de conflit au moment d'écrire.

**Audit automatique** : remplir `dateCreation`, `derniereModification`, etc. sans code applicatif.

```java
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig { }

@Entity
@EntityListeners(AuditingEntityListener.class)
public class Commande {
    @CreatedDate
    private LocalDateTime dateCreation;

    @LastModifiedDate
    private LocalDateTime derniereModification;
}
```

Les deux ingrédients sont nécessaires : `@EnableJpaAuditing` active le mécanisme au niveau de l'application, `@EntityListeners(AuditingEntityListener.class)` le déclenche pour cette entité précise. Pour savoir **qui** a créé/modifié une ligne (`@CreatedBy`/`@LastModifiedBy`), il faut en plus fournir un bean `AuditorAware<T>`.

## Détail

### Comment fonctionne le verrouillage optimiste

1. L'entité est chargée avec sa version actuelle (ex. `version = 3`).
2. L'utilisateur modifie des champs, sans verrou tenu en base pendant ce temps.
3. À l'enregistrement, Hibernate exécute `UPDATE commande SET statut = ?, version = 4 WHERE id = ? AND version = 3`.
4. Si la ligne a été modifiée entre-temps par quelqu'un d'autre (version passée à `4` en base), la clause `WHERE` ne correspond à aucune ligne : `0` ligne affectée, Hibernate le détecte et lève l'exception.

Aucune requête `SELECT FOR UPDATE`, aucun verrou tenu pendant que l'utilisateur réfléchit : le coût du mécanisme n'existe que s'il y a réellement un conflit.

### Exemple 1 — Gérer le conflit côté service

```java
@Transactional
public Commande changerStatut(Long id, StatutCommande nouveauStatut) {
    try {
        Commande commande = repo.findById(id).orElseThrow();
        commande.setStatut(nouveauStatut);
        return repo.save(commande);
    } catch (ObjectOptimisticLockingFailureException e) {
        throw new ConflitModificationException(
            "La commande a été modifiée entre-temps, veuillez recharger la page.", e);
    }
}
```

Le service traduit l'exception technique en une erreur métier explicite, à charge pour l'appelant (souvent l'interface utilisateur) de recharger les données et de proposer une nouvelle tentative.

### Exemple 2 — Verrouillage pessimiste ciblé

```java
public interface StockRepository extends JpaRepository<Stock, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s WHERE s.produit.id = :produitId")
    Optional<Stock> trouverPourMiseAJour(@Param("produitId") Long produitId);
}
```

```java
@Transactional
public void decrementerStock(Long produitId, int quantite) {
    Stock stock = stockRepository.trouverPourMiseAJour(produitId).orElseThrow();
    stock.decrementer(quantite); // aucune autre transaction ne peut modifier cette ligne jusqu'au commit
    stockRepository.save(stock);
}
```

La ligne `Stock` est verrouillée dès la lecture jusqu'à la fin de la transaction. Une autre transaction qui tente le même appel **attend** que la première se termine, plutôt que d'échouer immédiatement comme avec le verrouillage optimiste.

### Exemple 3 — Audit avec `@CreatedBy` / `@LastModifiedBy`

```java
@Component
public class AuditeurCourant implements AuditorAware<String> {
    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        return Optional.of(auth.getName());
    }
}
```

```java
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Commande {
    @CreatedBy
    private String creePar;

    @LastModifiedBy
    private String modifiePar;
}
```

Spring Data appelle `getCurrentAuditor()` à chaque persistance ou mise à jour pour renseigner `creePar`/`modifiePar`. S'il existe plusieurs beans `AuditorAware`, il faut préciser lequel utiliser avec `@EnableJpaAuditing(auditorAwareRef = "auditeurCourant")`.

### Exemple 4 — Factoriser les champs d'audit dans une classe de base

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class EntiteAuditee {
    @CreatedDate
    private LocalDateTime dateCreation;

    @LastModifiedDate
    private LocalDateTime derniereModification;
    // getters...
}

@Entity
public class Commande extends EntiteAuditee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // ...
}
```

`@MappedSuperclass` partage les champs d'audit (et l'annotation `@EntityListeners`) entre toutes les entités qui en héritent, sans les répéter.

### Verrouillage optimiste vs pessimiste

| | Optimiste (`@Version`) | Pessimiste (`@Lock`) |
|---|---|---|
| Verrou tenu en base | Non | Oui, jusqu'à la fin de la transaction |
| Détection du conflit | À l'écriture (`UPDATE` sans ligne affectée) | Empêché en amont (attente ou blocage) |
| Concurrence | Élevée | Réduite : d'autres transactions attendent |
| Coût si peu de conflits | Quasi nul | Verrous tenus même sans conflit réel |
| Bon usage | Cas général, conflits rares | Contention forte, conflit coûteux à rattraper |

### Pièges courants

> **Confondre `ObjectOptimisticLockingFailureException` avec un bug applicatif.** Cette exception signale une **modification concurrente**, un cas métier normal dans une application à plusieurs utilisateurs, pas une erreur de code. Elle mérite d'être traduite en message clair pour l'utilisateur (recharger, réessayer), pas simplement journalisée comme une erreur inattendue.

> **`@EnableJpaAuditing` sans `@EntityListeners` sur les entités.** Les deux sont nécessaires : la configuration seule n'active rien tant que les entités concernées ne portent pas `@EntityListeners(AuditingEntityListener.class)` (directement, ou via une classe de base `@MappedSuperclass`).

> **Verrouillage pessimiste tenu trop longtemps.** Une transaction longue qui verrouille une ligne pessimistement bloque toutes les autres transactions qui tentent d'y accéder, avec un risque d'interblocage si plusieurs lignes sont verrouillées dans des ordres différents par des transactions concurrentes. Garder ces transactions aussi courtes et ciblées que possible.

### À retenir

- `@Version` détecte les écritures concurrentes sans verrou : `ObjectOptimisticLockingFailureException` si la version a changé entre lecture et écriture.
- `@Lock(LockModeType.PESSIMISTIC_WRITE)` verrouille activement la ligne, au prix de la concurrence : réservé aux cas de forte contention.
- `@EnableJpaAuditing` (configuration) + `@EntityListeners(AuditingEntityListener.class)` (par entité) sont **tous les deux** nécessaires pour l'audit automatique.
- `@CreatedDate`/`@LastModifiedDate` sont automatiques ; `@CreatedBy`/`@LastModifiedBy` ont en plus besoin d'un bean `AuditorAware`.
- `@MappedSuperclass` évite de répéter les champs et l'annotation d'audit sur chaque entité.
