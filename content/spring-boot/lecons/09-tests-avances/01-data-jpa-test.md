---
id: data-jpa-test
chapitre: tests-avances
ordre: 1
titre: "@DataJpaTest : tester la couche de données"
termes:
  - terme: "@DataJpaTest"
    definition: "Test slice pour la couche JPA : ne charge que les entités, les repositories Spring Data et l'infrastructure JPA (`EntityManager`, `DataSource`). Ni les `@Service`, ni les `@Controller` ne font partie du contexte."
  - terme: "Base embarquée par défaut"
    definition: "Sans configuration particulière, `@DataJpaTest` **remplace** la source de données réelle par une base embarquée en mémoire (H2, Derby ou HSQLDB, selon ce qui est présent sur le classpath), via `@AutoConfigureTestDatabase`."
  - terme: "@AutoConfigureTestDatabase(replace = Replace.NONE)"
    definition: "Désactive le remplacement automatique par une base embarquée : le test utilise le vrai `DataSource` configuré dans l'application (ou celui fourni par Testcontainers, voir la leçon suivante)."
  - terme: "Rollback automatique"
    definition: "`@DataJpaTest` applique `@Transactional` implicitement : chaque méthode de test s'exécute dans une transaction **annulée** à la fin, réussite ou échec. Aucune donnée de test ne persiste d'un test à l'autre."
  - terme: TestEntityManager
    definition: "Version simplifiée de l'`EntityManager` JPA, pensée pour les tests : `persistAndFlush(entite)`, `persist(entite)`, `find(...)`, `clear()`… Injectable par `@Autowired` dans un `@DataJpaTest`."
  - terme: "flush() et clear()"
    definition: "`flush()` force l'écriture immédiate en base des changements en attente (sans lui, Hibernate peut différer le SQL jusqu'à la fin de la transaction). `clear()` vide le **contexte de persistance** (le cache de premier niveau) pour forcer une vraie relecture en base plutôt qu'un renvoi de l'objet déjà en mémoire."
  - terme: Contexte de persistance (premier niveau)
    definition: "Cache interne d'Hibernate qui associe chaque entité chargée à son identifiant, pour la durée de la session. Un `findById` répété dans la même transaction renvoie l'objet déjà en mémoire **sans** exécuter de nouvelle requête SQL."
quiz:
  - question: "Sans autre configuration, quelle base de données utilise ce test ?"
    code: |
      @DataJpaTest
      class ProduitRepositoryTest {

          @Autowired
          private ProduitRepository repository;

          @Test
          void save_persiste_le_produit() {
              Produit produit = repository.save(new Produit("Clavier", 49.90));
              assertThat(produit.getId()).isNotNull();
          }
      }
    choix:
      - "La vraie base configurée dans `application.yml`"
      - "Une base embarquée en mémoire (H2 par défaut si présente sur le classpath), qui remplace la vraie base"
      - "Aucune base : le test échoue sans configuration explicite"
      - "Une base Testcontainers démarrée automatiquement"
    reponse: 1
    explication: "Par défaut, `@DataJpaTest` applique `@AutoConfigureTestDatabase(replace = Replace.ANY)` : la vraie source de données est remplacée par une base embarquée en mémoire. Pour utiliser la vraie configuration (ou Testcontainers), il faut explicitement `@AutoConfigureTestDatabase(replace = Replace.NONE)`."
  - question: "Pourquoi ce test échoue-t-il sans le `flush()` et le `clear()` ?"
    code: |
      @Test
      void unNomTropLong_estRejeteParLaContrainteDeColonne() {
          Produit produit = new Produit("N".repeat(500), 10.0); // @Column(length = 100)
          entityManager.persist(produit);

          // sans flush/clear ici : le test passe à tort
          assertThatThrownBy(() -> entityManager.flush())
              .isInstanceOf(DataIntegrityViolationException.class);
      }
    choix:
      - "`persist` échoue toujours immédiatement s'il viole une contrainte"
      - "Hibernate ne convertit les changements en SQL qu'au `flush` : sans lui, la contrainte de colonne n'est jamais vérifiée par la base"
      - "`TestEntityManager` ne supporte pas la méthode `persist`"
      - "Les contraintes `@Column` ne sont jamais vérifiées, quel que soit le test"
    reponse: 1
    explication: "`persist` place l'entité dans le contexte de persistance, mais Hibernate peut différer l'exécution du `INSERT` réel jusqu'au `flush` (explicite ou en fin de transaction). Pour vérifier une contrainte SQL (longueur, unicité…) dans le test, il faut déclencher le `flush` explicitement plutôt que d'attendre la fin du test."
  - question: "Un test `@DataJpaTest` insère un produit puis appelle `repository.findById(id)` dans la même méthode. Le champ vient d'être modifié directement en base par une requête SQL native (hors JPA), sans passer par `entityManager.clear()`. Que renvoie `findById` ?"
    choix:
      - "La nouvelle valeur, lue en base à chaque appel"
      - "L'objet déjà présent dans le contexte de persistance, avec l'ancienne valeur en mémoire — la requête SQL n'est pas ré-exécutée"
      - "Une exception `StaleObjectStateException`"
      - "`Optional.empty()`, car l'entité est désynchronisée"
    reponse: 1
    explication: "Le contexte de persistance associe déjà cet identifiant à l'objet chargé : `findById` renvoie cette instance en mémoire sans repasser par la base. `clear()` (ou `entityManager.detach(...)`) est nécessaire pour forcer une vraie relecture et vérifier ce qui a réellement été écrit."
---

## Essentiel

`@DataJpaTest` est un **test slice** ciblé sur la couche JPA : il charge les entités, les repositories Spring Data et l'infrastructure JPA (`EntityManager`, `DataSource`), mais ni les services ni les contrôleurs.

```java
@DataJpaTest
class ProduitRepositoryTest {

    @Autowired
    private ProduitRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void findByNomContenant_trouve_le_produit() {
        entityManager.persistAndFlush(new Produit("Clavier mécanique", 89.90));

        List<Produit> resultats = repository.findByNomContainingIgnoreCase("clavier");

        assertThat(resultats).hasSize(1);
    }
}
```

Par défaut, `@DataJpaTest` remplace la vraie source de données par une **base embarquée en mémoire** (H2, si elle est sur le classpath) et exécute chaque test dans une transaction **annulée** à la fin : aucune donnée ne fuit d'un test à l'autre.

`TestEntityManager` (à ne pas confondre avec `EntityManager`) offre des méthodes pratiques pour préparer des données de test : `persist(entite)`, `persistAndFlush(entite)`, `find(...)`. Le `flush()` est souvent nécessaire pour forcer l'exécution immédiate du SQL généré par Hibernate, sinon les écritures restent en attente jusqu'à la fin de la transaction.

## Détail

### Comment ça marche

`@DataJpaTest` combine plusieurs éléments : le scan est limité aux classes annotées `@Entity` et aux interfaces de repository Spring Data (le reste du contexte — `@Component`, `@Service`, `@Controller` — n'est pas chargé) ; `@AutoConfigureTestDatabase` remplace le `DataSource` par une base embarquée ; `@Transactional` encapsule chaque test dans une transaction annulée ; et un bean `TestEntityManager` est ajouté au contexte.

### Exemple 1 — Tester une requête dérivée

```java
public interface ProduitRepository extends JpaRepository<Produit, Long> {
    List<Produit> findByPrixLessThanEqual(double prixMax);
    Optional<Produit> findByReference(String reference);
}

@DataJpaTest
class ProduitRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ProduitRepository repository;

    @Test
    void findByPrixLessThanEqual_filtre_correctement() {
        entityManager.persistAndFlush(new Produit("Souris", 19.90));
        entityManager.persistAndFlush(new Produit("Écran", 199.00));

        List<Produit> abordables = repository.findByPrixLessThanEqual(50.0);

        assertThat(abordables).extracting(Produit::getNom).containsExactly("Souris");
    }
}
```

Un test dérivé vérifie surtout que le **nom de la méthode** a bien été traduit dans la requête attendue par Spring Data — une erreur de frappe (`findByPrix` au lieu de `findByPrixLessThanEqual`) change silencieusement le comportement, sans erreur de compilation.

### Exemple 2 — Tester une requête `@Query`

```java
public interface ProduitRepository extends JpaRepository<Produit, Long> {
    @Query("SELECT p FROM Produit p WHERE p.categorie.nom = :nomCategorie ORDER BY p.prix DESC")
    List<Produit> trouverParCategorieTrieParPrix(@Param("nomCategorie") String nomCategorie);
}

@Test
void trouverParCategorieTrieParPrix_trie_du_plus_cher_au_moins_cher() {
    Categorie informatique = entityManager.persistAndFlush(new Categorie("Informatique"));
    entityManager.persistAndFlush(new Produit("Souris", 19.90, informatique));
    entityManager.persistAndFlush(new Produit("Écran", 199.00, informatique));

    List<Produit> resultats = repository.trouverParCategorieTrieParPrix("Informatique");

    assertThat(resultats).extracting(Produit::getNom).containsExactly("Écran", "Souris");
}
```

Les requêtes `@Query` (JPQL ou natives) méritent un test dédié : contrairement aux requêtes dérivées, une erreur de syntaxe JPQL n'est détectée qu'à l'exécution, pas à la compilation.

### Exemple 3 — flush() et clear() pour vérifier ce qui est vraiment écrit

```java
@Test
void save_respecte_la_contrainte_dunicite_sur_reference() {
    entityManager.persistAndFlush(new Produit("Clavier", "REF-001"));

    Produit doublon = new Produit("Autre clavier", "REF-001");

    assertThatThrownBy(() -> {
        repository.save(doublon);
        entityManager.flush(); // force l'INSERT, sinon l'erreur n'apparaît qu'en fin de test
    }).isInstanceOf(DataIntegrityViolationException.class);
}

@Test
void modifierPrix_est_bien_persiste() {
    Produit produit = entityManager.persistAndFlush(new Produit("Clavier", 49.90));
    Long id = produit.getId();

    produit.setPrix(39.90);
    entityManager.persistAndFlush(produit);
    entityManager.clear(); // vide le contexte de persistance : force une vraie relecture

    Produit relu = repository.findById(id).orElseThrow();
    assertThat(relu.getPrix()).isEqualTo(39.90);
}
```

Sans `clear()`, `findById` risquerait de renvoyer l'objet déjà présent dans le contexte de persistance — le test passerait même si la mise à jour SQL était mal écrite (par exemple, une requête `@Query` de mise à jour incorrecte qui ne touche aucune ligne).

### Exemple 4 — Utiliser la vraie base plutôt que H2

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ProduitRepositoryAvecVraieBaseTest {
    // utilise le DataSource réellement configuré (ex. fourni par Testcontainers)
}
```

Utile dès que le comportement testé dépend du SGBD réel (types de colonnes spécifiques, fonctions SQL, contraintes avancées) : H2 imite PostgreSQL ou MySQL, mais imparfaitement. La leçon suivante détaille cette approche avec Testcontainers.

### Pièges courants

> **Oublier que `save()` seul ne déclenche pas forcément le SQL.** Hibernate peut regrouper et différer les écritures jusqu'au `flush`. Un test qui vérifie une contrainte de base de données (unicité, longueur, `NOT NULL`) doit forcer un `flush()` explicite, sinon l'exception SQL n'apparaît jamais pendant le test.

> **Confondre `TestEntityManager` et `EntityManager`.** `TestEntityManager` est une classe de test (`org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager`), pas celle utilisée par l'application. Elle enveloppe un vrai `EntityManager` avec des raccourcis pratiques pour préparer des données, elle ne remplace pas les repositories dans le code de production.

> **Croire que `@DataJpaTest` teste la couche service.** Ce test slice ne charge ni `@Service` ni `@Component` : impossible d'y injecter directement un service métier. Pour vérifier l'intégration complète, il faut `@SpringBootTest` (voir le chapitre Tests, niveau débutant).

### À retenir

- `@DataJpaTest` charge uniquement les entités et les repositories, remplace la base par une base embarquée en mémoire, et annule chaque test (rollback).
- `@AutoConfigureTestDatabase(replace = Replace.NONE)` désactive ce remplacement pour utiliser une vraie base (souvent avec Testcontainers).
- `TestEntityManager` prépare des données de test simplement (`persistAndFlush`).
- `flush()` force l'exécution du SQL en attente ; `clear()` vide le contexte de persistance pour forcer une vraie relecture en base.
- Testez systématiquement les requêtes dérivées complexes et les `@Query` : ce sont des chaînes de caractères sans vérification à la compilation.
