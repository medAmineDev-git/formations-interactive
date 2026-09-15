---
id: lazy-eager-n-plus-1
chapitre: jpa-avance
ordre: 2
titre: "Chargement lazy/eager et le problème N+1"
termes:
  - terme: Problème N+1
    definition: "Situation où une requête initiale ramène **N** résultats, puis chaque résultat déclenche une requête supplémentaire pour charger une relation : **1 + N** requêtes au lieu d'une seule bien construite. Le cas le plus fréquent : parcourir une liste d'entités en accédant, pour chacune, à une collection ou une relation en chargement paresseux."
  - terme: "JOIN FETCH"
    definition: "Clause JPQL qui charge une relation dans la **même** requête SQL que l'entité principale, via une jointure, au lieu d'une requête séparée par entité. S'écrit dans une méthode annotée `@Query`."
  - terme: "@EntityGraph"
    definition: "Annotation Spring Data qui décrit, sans JPQL, les relations à charger en une seule requête pour une méthode de repository donnée : `@EntityGraph(attributePaths = \"lignes\")`. Une alternative déclarative à `JOIN FETCH`."
  - terme: "Taille de lot (@BatchSize / default_batch_fetch_size)"
    definition: "Au lieu d'une requête séparée par entité pour charger une relation LAZY, Hibernate peut regrouper plusieurs identifiants dans une seule requête `IN (...)`, par lots. Se règle entité par entité (`@BatchSize`, annotation Hibernate) ou globalement (`spring.jpa.properties.hibernate.default_batch_fetch_size`)."
  - terme: "spring.jpa.open-in-view"
    definition: "Propriété Spring Boot, **`true` par défaut**, qui garde la session Hibernate ouverte au-delà de la transaction, jusqu'à la fin du traitement de la requête HTTP. Spring Boot affiche un avertissement au démarrage tant qu'elle n'est pas explicitement définie."
  - terme: LazyInitializationException
    definition: "Exception levée quand on accède à une relation LAZY alors que la session Hibernate qui l'a chargée est déjà fermée. Message typique : *« failed to lazily initialize a collection of role... could not initialize proxy - no Session »*."
  - terme: "FetchType.LAZY / FetchType.EAGER"
    definition: "`LAZY` : la relation n'est chargée qu'au premier accès. `EAGER` : elle est chargée immédiatement, avec l'entité propriétaire. Défauts JPA : LAZY pour `@OneToMany`/`@ManyToMany`, EAGER pour `@ManyToOne`/`@OneToOne`."
quiz:
  - question: "Ce code liste 50 commandes puis affiche le nombre de lignes de chacune. Combien de requêtes SQL Hibernate exécute-t-il au minimum, sans optimisation particulière ?"
    code: |
      List<Commande> commandes = commandeRepository.findAll(); // lignes en @OneToMany LAZY

      for (Commande c : commandes) {
          System.out.println(c.getLignes().size());
      }
    choix:
      - "1 requête : `findAll()` charge tout, relations comprises"
      - "2 requêtes : une pour les commandes, une pour toutes les lignes"
      - "51 requêtes : 1 pour les commandes, puis 1 par commande pour ses lignes"
      - "50 requêtes : 1 par commande, la liste des commandes est incluse dedans"
    reponse: 2
    explication: "C'est le problème **N+1** : `findAll()` exécute 1 requête pour charger les 50 commandes, puis chaque appel à `c.getLignes()` déclenche une requête séparée (la collection est LAZY) pour aller chercher les lignes de **cette** commande précise. Total : 1 + 50 = 51 requêtes, là où une seule requête avec jointure suffirait."
  - question: "Quelle est la conséquence principale de laisser `spring.jpa.open-in-view` à sa valeur par défaut (`true`) dans une API REST ?"
    choix:
      - "L'application refuse de démarrer sans le désactiver explicitement"
      - "Les relations LAZY deviennent EAGER automatiquement"
      - "La session Hibernate reste ouverte pendant tout le traitement de la requête HTTP, ce qui peut masquer des N+1 exécutés en dehors de la couche service, hors de toute transaction explicite"
      - "Toutes les requêtes deviennent en lecture seule"
    reponse: 2
    explication: "Avec `open-in-view=true`, une relation LAZY reste accessible (sans `LazyInitializationException`) même après la sortie du service, par exemple pendant la sérialisation JSON — au prix de requêtes supplémentaires exécutées à un endroit peu visible du code, en dehors d'une transaction métier claire. Le désactiver (`false`) rend ces accès explicites : une relation LAZY non chargée dans le service lève une `LazyInitializationException`, détectée tôt plutôt que masquée."
  - question: "Quelle solution charge les lignes de commande dans la **même** requête SQL que les commandes, en JPQL explicite ?"
    choix:
      - "`@BatchSize(size = 20)` sur la collection `lignes`"
      - "Une méthode `@Query(\"SELECT c FROM Commande c JOIN FETCH c.lignes\")`"
      - "`spring.jpa.open-in-view=true`"
      - "Passer `lignes` en `FetchType.EAGER`"
    reponse: 1
    explication: "`JOIN FETCH` dans la requête JPQL charge la collection via une jointure SQL, en une seule requête. `@BatchSize` réduit le nombre de requêtes sans les supprimer (regroupement par lots), et `FetchType.EAGER` charge la relation systématiquement pour **toute** utilisation de l'entité, pas seulement quand c'est utile, ce qui déplace le problème plutôt que de le résoudre."
---

## Essentiel

Par défaut, JPA charge les relations `@OneToMany`/`@ManyToMany` en **LAZY** (à la demande) et les `@ManyToOne`/`@OneToOne` en **EAGER** (immédiatement). Le chargement LAZY évite de charger des données inutiles, mais expose au **problème N+1** : parcourir une liste d'entités en accédant, pour chacune, à une relation LAZY déclenche une requête par entité.

```java
List<Commande> commandes = commandeRepository.findAll(); // 1 requête
for (Commande c : commandes) {
    c.getLignes().size(); // 1 requête supplémentaire PAR commande
}
// 1 (commandes) + N (une par commande) requêtes au lieu d'une seule
```

Trois solutions principales, à choisir selon le cas :

```java
// JOIN FETCH : une seule requête, écrite explicitement
@Query("SELECT c FROM Commande c JOIN FETCH c.lignes")
List<Commande> trouverAvecLignes();

// @EntityGraph : la même idée, sans JPQL à écrire
@EntityGraph(attributePaths = "lignes")
List<Commande> findAll();
```

Le taux de requêtes peut aussi être réduit sans les supprimer, avec un chargement par **lots** (`spring.jpa.properties.hibernate.default_batch_fetch_size`).

Enfin, `spring.jpa.open-in-view` (`true` par défaut, avec un avertissement au démarrage tant qu'il n'est pas fixé explicitement) garde la session Hibernate ouverte pendant tout le traitement de la requête HTTP — pratique pour éviter des `LazyInitializationException`, mais au prix d'un N+1 potentiellement invisible. Le désactiver rend les accès aux relations explicites, dans la couche service.

## Détail

### Le N+1, avec le SQL généré

```java
@Entity
public class Commande {
    @OneToMany(mappedBy = "commande") // LAZY par défaut
    private List<LigneCommande> lignes;
}
```

```java
List<Commande> commandes = commandeRepository.findAll();
for (Commande c : commandes) {
    c.getLignes().forEach(l -> System.out.println(l.getProduit().getNom()));
}
```

Avec `spring.jpa.show-sql=true`, on observerait :

```sql
select c.id, c.date_creation from commande c;                          -- 1 requête
select l.* from ligne_commande l where l.commande_id = 1;               -- pour la commande 1
select l.* from ligne_commande l where l.commande_id = 2;               -- pour la commande 2
-- ... une requête de plus par commande ...
select p.* from produit p where p.id = ?;                               -- éventuellement, un N+1 en cascade sur produit (ManyToOne EAGER)
```

Sur 50 commandes, cela peut représenter 51 requêtes, voire davantage si `produit` (relation `@ManyToOne`, EAGER par défaut) est lui aussi chargé à part pour chaque ligne.

### Exemple 1 — `JOIN FETCH`

```java
public interface CommandeRepository extends JpaRepository<Commande, Long> {

    @Query("SELECT c FROM Commande c JOIN FETCH c.lignes WHERE c.id = :id")
    Optional<Commande> trouverAvecLignes(@Param("id") Long id);
}
```

Une seule requête SQL, avec une jointure, charge la commande et ses lignes en même temps. `JOIN FETCH` s'utilise en JPQL explicite : il n'existe pas de mot-clé équivalent dans les requêtes dérivées du nom de méthode.

### Exemple 2 — `@EntityGraph`

```java
public interface CommandeRepository extends JpaRepository<Commande, Long> {

    @EntityGraph(attributePaths = {"lignes", "lignes.produit"})
    List<Commande> findByStatut(StatutCommande statut);
}
```

`@EntityGraph` obtient le même résultat que `JOIN FETCH` (une jointure dans la requête générée), sans écrire de JPQL, et fonctionne aussi avec les requêtes dérivées du nom de méthode. `attributePaths` liste les relations à charger, y compris en profondeur (`lignes.produit`).

### Exemple 3 — Réduire le nombre de requêtes par lots

```java
@Entity
public class Commande {

    @OneToMany(mappedBy = "commande")
    @BatchSize(size = 20) // annotation Hibernate, pas JPA standard
    private List<LigneCommande> lignes;
}
```

```properties
# alternative globale, sans annoter chaque relation
spring.jpa.properties.hibernate.default_batch_fetch_size=20
```

Au lieu d'une requête `WHERE commande_id = ?` par commande, Hibernate regroupe les identifiants et exécute des requêtes `WHERE commande_id IN (?, ?, ..., ?)` par lots de 20. Le nombre de requêtes chute (3 requêtes pour 50 commandes au lieu de 50), sans réécrire les repositories : une bonne option par défaut quand `JOIN FETCH` n'est pas pratique partout (relations multiples, cas trop variés).

### Exemple 4 — Le piège de `spring.jpa.open-in-view`

```properties
# application.properties
spring.jpa.open-in-view=false
```

```java
@RestController
public class CommandeController {
    @GetMapping("/commandes/{id}")
    public CommandeReponse get(@PathVariable Long id) {
        Commande c = service.trouver(id); // transaction fermée en sortie du service
        return new CommandeReponse(c.getId(), c.getLignes().size()); // accès hors session
    }
}
```

Avec `open-in-view=false`, ce code lève une `LazyInitializationException` au lieu d'exécuter une requête cachée pendant la sérialisation : l'erreur apparaît tôt, en développement, plutôt que sous forme de lenteur difficile à diagnostiquer en production. La correction consiste à charger `lignes` explicitement dans le service (`JOIN FETCH` ou `@EntityGraph`), pendant que la transaction est encore ouverte.

### Comparatif des solutions

| Solution | Requêtes | Portée | Remarque |
|---|---|---|---|
| `JOIN FETCH` (JPQL) | 1, avec jointure | Par méthode de repository | Le plus explicite ; attention à ne pas paginer une collection avec `JOIN FETCH` (voir la leçon suivante) |
| `@EntityGraph` | 1, avec jointure | Par méthode de repository | Même résultat que `JOIN FETCH`, sans JPQL ; compatible avec les requêtes dérivées |
| `@BatchSize` / `default_batch_fetch_size` | Réduit (par lots), pas 1 | Par relation, ou globale | Ne supprime pas le N+1, le rend juste beaucoup moins coûteux ; simple à activer globalement |
| `FetchType.EAGER` | Toujours chargé | Toute utilisation de l'entité | Déplace le problème plutôt que de le résoudre : charge la relation même quand elle est inutile |

### Pièges courants

> **`LazyInitializationException`.** Accéder à une relation LAZY après la fermeture de la session Hibernate (typiquement, hors d'une méthode `@Transactional`, ou après désactivation de `open-in-view`). Message typique : *« failed to lazily initialize a collection of role... no Session »*. Solution : charger la relation dans le service, pendant que la transaction est ouverte (`JOIN FETCH`, `@EntityGraph`), ou construire directement un DTO à cet endroit.

> **Passer une relation en `EAGER` pour « régler » un N+1.** Cela supprime bien l'erreur observée à un endroit précis, mais charge désormais la relation **systématiquement**, y compris dans des cas où elle n'est jamais utilisée — souvent au prix d'un nouveau N+1 ailleurs, moins visible. `JOIN FETCH` ou `@EntityGraph`, appliqués là où la relation est réellement nécessaire, sont des solutions plus ciblées.

> **Garder `open-in-view=true` sans y réfléchir.** Ce n'est pas une erreur en soi, et convient à de petites applications. Mais dans une API avec des volumes significatifs, cela masque des requêtes N+1 exécutées pendant la sérialisation JSON, difficiles à repérer sans activer `spring.jpa.show-sql`. Le désactiver rend le problème visible tout de suite, sous forme d'exception, plutôt que sous forme de lenteur en production.

### À retenir

- Le N+1 : 1 requête pour la liste, puis 1 requête par élément pour charger une relation LAZY.
- `JOIN FETCH` et `@EntityGraph` chargent la relation en une seule requête, avec jointure.
- `@BatchSize` / `default_batch_fetch_size` regroupe les requêtes par lots sans les supprimer complètement — une bonne option globale par défaut.
- `spring.jpa.open-in-view` est à `true` par défaut (avertissement au démarrage) : pratique, mais masque potentiellement des N+1 en dehors de la couche service.
- Passer une relation en `EAGER` déplace le problème plus qu'il ne le résout.
