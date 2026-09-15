---
id: query-jpql
chapitre: data-jpa
ordre: 4
titre: Requêtes personnalisées avec @Query
termes:
  - terme: "@Query"
    definition: "Annotation posée sur une méthode de repository pour écrire soi-même la requête, en JPQL par défaut, ou en SQL natif avec `nativeQuery = true`."
  - terme: JPQL
    definition: "*Jakarta Persistence Query Language* : un langage de requête proche du SQL, mais qui porte sur les **entités et leurs attributs Java**, pas sur les tables et colonnes de la base. `SELECT p FROM Produit p WHERE p.prix > :prixMin` interroge l'entité `Produit`, pas une table `produit`."
  - terme: "SQL natif (nativeQuery = true)"
    definition: "Requête SQL classique, écrite contre les vraies tables et colonnes de la base. Utile pour des fonctionnalités spécifiques à un SGBD ou des requêtes que JPQL ne sait pas exprimer, au prix d'une portabilité réduite."
  - terme: "@Param"
    definition: "Associe un paramètre de méthode à un paramètre nommé de la requête (`:nom`). Alternative : les paramètres positionnels `?1`, `?2`, dans l'ordre des arguments de la méthode."
  - terme: "@Modifying"
    definition: "Annotation obligatoire sur une méthode `@Query` qui exécute un `UPDATE` ou un `DELETE` (au lieu d'un `SELECT`). La méthode doit être appelée dans une **transaction** active."
  - terme: Projection DTO
    definition: "Le fait de faire renvoyer à une requête un objet **différent** de l'entité (souvent un DTO léger), avec la syntaxe JPQL `SELECT new com.boutique.ProduitResume(p.nom, p.prix) FROM Produit p`."
  - terme: Pageable
    definition: "Paramètre spécial de Spring Data qui porte le numéro de page, la taille de page et le tri demandés. Une méthode `@Query` peut le recevoir en dernier paramètre pour renvoyer une `Page<T>`."
quiz:
  - question: "Pourquoi cette méthode lève-t-elle une exception à l'exécution ?"
    code: |
      public interface ProduitRepository extends JpaRepository<Produit, Long> {

          @Query("UPDATE Produit p SET p.prix = p.prix * 1.1 WHERE p.categorie = :cat")
          int augmenterPrix(@Param("cat") String categorie);
      }
    choix:
      - "Le paramètre nommé `:cat` n'existe pas dans la requête"
      - "Il manque `@Modifying` : sans elle, Spring Data attend un `SELECT`"
      - "`UPDATE` n'est pas un mot-clé JPQL valide"
      - "Le type de retour devrait être `void`"
    reponse: 1
    explication: "`@Query` seule suppose une requête de lecture. Pour un `UPDATE` ou un `DELETE`, il faut ajouter `@Modifying` (et exécuter la méthode dans une transaction, via `@Transactional` sur la méthode appelante ou le service). Sans `@Modifying`, Spring Data lève une `InvalidDataAccessApiUsageException`."
  - question: "Quelle est l'erreur dans cette requête JPQL ?"
    code: |
      @Query("SELECT * FROM produits WHERE prix > :prixMin")
      List<Produit> trouverChers(@Param("prixMin") double prixMin);
    choix:
      - "Rien, cette requête est correcte"
      - "JPQL n'accepte pas `SELECT *` ni les noms de table/colonnes SQL : il faut utiliser le nom de l'entité et de ses attributs"
      - "Il manque `nativeQuery = true`"
      - "`:prixMin` doit être remplacé par `?1`"
    reponse: 1
    explication: "JPQL interroge des entités et des attributs Java, pas des tables et des colonnes SQL. La requête correcte est `SELECT p FROM Produit p WHERE p.prix > :prixMin`. Écrire du SQL réel dans `@Query` sans préciser `nativeQuery = true` provoque une erreur de syntaxe JPQL au démarrage ou à l'exécution."
  - question: "À quoi sert `SELECT new com.boutique.ProduitResume(p.nom, p.prix) FROM Produit p` ?"
    choix:
      - "À créer une nouvelle entité `Produit` en base"
      - "À projeter le résultat de la requête directement vers un DTO, sans charger l'entité complète"
      - "À dupliquer chaque ligne de résultat"
      - "C'est une syntaxe invalide en JPQL"
    reponse: 1
    explication: "La syntaxe `SELECT new PackageComplet.Classe(...)` construit directement des objets `ProduitResume` (un DTO avec un constructeur `(String nom, double prix)`) à partir des colonnes sélectionnées, sans charger l'entité `Produit` entière ni ses relations. Pratique pour limiter les données transférées et éviter d'exposer l'entité telle quelle."
---

## Essentiel

Quand une requête dérivée du nom de méthode devient trop complexe ou impossible à exprimer, `@Query` permet d'écrire soi-même la requête, en **JPQL** par défaut :

```java
public interface ProduitRepository extends JpaRepository<Produit, Long> {

    @Query("SELECT p FROM Produit p WHERE p.categorie = :categorie AND p.prix <= :prixMax")
    List<Produit> rechercher(@Param("categorie") String categorie, @Param("prixMax") double prixMax);

    @Modifying
    @Query("UPDATE Produit p SET p.disponible = false WHERE p.quantiteStock = 0")
    int marquerIndisponibles();
}
```

Points clés :

- **JPQL** interroge les **entités et leurs attributs Java** (`Produit`, `p.prix`), pas les tables et colonnes SQL. `nativeQuery = true` permet d'écrire du vrai SQL quand JPQL ne suffit pas.
- Paramètres **nommés** (`:categorie`, avec `@Param("categorie")`) ou **positionnels** (`?1`, `?2`, dans l'ordre des arguments).
- `@Modifying` est **obligatoire** pour un `UPDATE`/`DELETE`, et la méthode doit s'exécuter dans une transaction.
- Une méthode `@Query` peut aussi recevoir un `Pageable` pour renvoyer une page de résultats.

## Détail

### Exemple 1 — Paramètres nommés et positionnels

```java
// Paramètres nommés (recommandé : plus lisible)
@Query("SELECT p FROM Produit p WHERE p.categorie = :categorie")
List<Produit> parCategorie(@Param("categorie") String categorie);

// Paramètres positionnels
@Query("SELECT p FROM Produit p WHERE p.categorie = ?1 AND p.prix <= ?2")
List<Produit> parCategorieEtPrix(String categorie, double prixMax);
```

Les paramètres nommés restent lisibles même quand ils sont nombreux ou ré-ordonnés ; c'est l'usage recommandé dans la majorité des projets.

### Exemple 2 — SQL natif

```java
@Query(value = "SELECT * FROM produits WHERE date_creation > CURRENT_DATE - INTERVAL '30' DAY",
       nativeQuery = true)
List<Produit> ajoutesRecemment();
```

Ici, `produits` et `date_creation` sont bien les noms réels de la table et de la colonne SQL : contrairement à JPQL, le SQL natif parle le langage de la base, avec ses fonctions spécifiques (`INTERVAL` ici est une syntaxe PostgreSQL).

### Exemple 3 — Modification avec `@Modifying`

```java
@Service
public class ProduitService {
    private final ProduitRepository repo;
    // constructeur...

    @Transactional
    public int marquerIndisponibles() {
        return repo.marquerIndisponibles(); // exécute l'UPDATE dans la transaction
    }
}

public interface ProduitRepository extends JpaRepository<Produit, Long> {

    @Modifying
    @Query("UPDATE Produit p SET p.disponible = false WHERE p.quantiteStock = 0")
    int marquerIndisponibles();
}
```

La méthode renvoie le nombre de lignes affectées. `@Transactional` est indispensable : sans transaction active, Spring Data lève une erreur.

### Exemple 4 — Projection vers un DTO et pagination

```java
public record ProduitResume(String nom, double prix) { }

@Query("SELECT new com.boutique.ProduitResume(p.nom, p.prix) FROM Produit p WHERE p.categorie = :categorie")
List<ProduitResume> resumesParCategorie(@Param("categorie") String categorie);

@Query("SELECT p FROM Produit p WHERE p.categorie = :categorie")
Page<Produit> parCategoriePaginee(@Param("categorie") String categorie, Pageable pageable);
```

Un `record` fait un excellent DTO pour une projection : il n'a pas les contraintes d'une entité (pas besoin de constructeur sans argument), car il n'est pas géré par Hibernate.

### JPQL contre SQL natif

| | JPQL | SQL natif (`nativeQuery = true`) |
|---|---|---|
| Porte sur | Entités et attributs Java | Tables et colonnes réelles |
| Portabilité entre SGBD | Bonne | Limitée aux fonctions du SGBD utilisé |
| Résultat | Entités, projections DTO | `Object[]`, DTO via `@SqlResultSetMapping`, ou types simples |
| Cas d'usage | La grande majorité des requêtes personnalisées | Fonctions spécifiques au SGBD, requêtes très optimisées |

### Pièges courants

> **Écrire du SQL dans une requête JPQL.** `SELECT * FROM produits` au lieu de `SELECT p FROM Produit p` : JPQL ne connaît que les noms d'entités et d'attributs Java, pas les tables ni les colonnes SQL. Cela provoque une erreur de syntaxe JPQL, souvent au démarrage si Spring Data valide les requêtes annotées à froid.

> **`UPDATE`/`DELETE` sans `@Modifying`.** Spring Data considère par défaut qu'une méthode `@Query` fait un `SELECT`. Sans `@Modifying`, la requête est exécutée comme une lecture et l'appel échoue : Hibernate signale qu'il attendait un `SELECT` (le message exact dépend de sa version) et Spring le remonte sous forme d'`InvalidDataAccessApiUsageException`. `@Modifying` doit être combinée avec une transaction active.

> **Confondre paramètre nommé et positionnel.** Mélanger `:categorie` dans la requête avec un paramètre de méthode sans `@Param`, ou `?1` sans respecter l'ordre des arguments, provoque une erreur au démarrage (paramètre non lié). Rester cohérent sur tout le repository (préférer les paramètres nommés) évite ce genre d'erreur.

### À retenir

- `@Query` avec JPQL par défaut : porte sur les entités et attributs Java, pas les tables/colonnes.
- `nativeQuery = true` pour du vrai SQL, quand JPQL ne suffit pas.
- Paramètres nommés (`:nom` + `@Param`) préférables aux positionnels (`?1`) pour la lisibilité.
- `@Modifying` + transaction active, obligatoires pour un `UPDATE`/`DELETE`.
- `SELECT new Package.Dto(...)` pour projeter directement vers un DTO, souvent un `record`.
