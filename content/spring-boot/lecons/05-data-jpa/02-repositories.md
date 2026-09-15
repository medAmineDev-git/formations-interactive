---
id: repositories
chapitre: data-jpa
ordre: 2
titre: Les repositories Spring Data
termes:
  - terme: Repository
    definition: "Une interface qui donne accès aux données d'une entité, sans écrire d'implémentation : Spring Data en génère une automatiquement au démarrage, à partir de l'interface déclarée."
  - terme: "Repository<T, ID>"
    definition: "L'interface racine de Spring Data, marqueur sans méthode. `T` est le type de l'entité, `ID` le type de sa clé primaire."
  - terme: CrudRepository
    definition: "Étend `Repository` et ajoute les opérations CRUD de base : `save`, `findById`, `findAll`, `deleteById`, `existsById`, `count`…"
  - terme: ListCrudRepository
    definition: "Variante de `CrudRepository` dont les méthodes qui renvoyaient une `Iterable<T>` (comme `findAll()`) renvoient directement une `List<T>`, plus pratique à utiliser."
  - terme: PagingAndSortingRepository
    definition: "Ajoute la pagination et le tri : `findAll(Pageable)`, `findAll(Sort)`. Souvent combiné avec `CrudRepository` via `JpaRepository`."
  - terme: JpaRepository
    definition: "L'interface la plus utilisée en pratique : combine `ListCrudRepository`, `PagingAndSortingRepository` et ajoute des méthodes propres à JPA (`flush()`, `saveAndFlush()`, `deleteAllInBatch()`…)."
  - terme: "save(entite)"
    definition: "Insère l'entité si son identifiant est `null` (ou absent en base), sinon met à jour la ligne existante. C'est la même méthode pour créer et pour modifier."
  - terme: "findById(id)"
    definition: "Renvoie un `Optional<T>` : `Optional.empty()` si aucune ligne ne correspond, jamais `null`. On le traite avec `orElseThrow()`, `orElse(...)` ou `map(...)`."
quiz:
  - question: "Que faut-il écrire pour que ce repository fonctionne ?"
    code: |
      public interface ProduitRepository extends JpaRepository<Produit, Long> {
      }
    choix:
      - "Rien de plus : Spring Data génère l'implémentation au démarrage"
      - "Ajouter `@Repository` sur l'interface"
      - "Créer une classe `ProduitRepositoryImpl` qui l'implémente"
      - "Ajouter `implements Serializable`"
    reponse: 0
    explication: "Spring Data JPA détecte les interfaces qui étendent `Repository` (ou ses sous-interfaces) et génère un bean qui les implémente, par proxy dynamique. `@Repository` n'est pas nécessaire ici : c'est utile pour la traduction d'exceptions, mais Spring Data l'applique déjà automatiquement à ses proxies."
  - question: "Que renvoie `produitRepository.findById(42L)` si aucun produit n'a l'identifiant 42 ?"
    choix:
      - "`null`"
      - "Une exception `EntityNotFoundException`"
      - "Un `Optional<Produit>` vide"
      - "Un `Produit` avec tous les champs à `null`"
    reponse: 2
    explication: "`findById` renvoie toujours un `Optional<Produit>`, jamais `null`. S'il est vide, on choisit quoi faire : `orElseThrow(() -> new ProduitIntrouvableException(id))`, `orElse(null)` si `null` convient au contexte, ou `map(...)` pour transformer la valeur si elle existe."
  - question: "Quel est le comportement de `save(produit)` si `produit.getId()` correspond à une ligne déjà en base ?"
    choix:
      - "Une exception est levée : l'identifiant existe déjà"
      - "Une nouvelle ligne est insérée avec un nouvel identifiant"
      - "La ligne existante est mise à jour avec les valeurs de l'objet"
      - "Rien ne se passe, l'appel est ignoré"
    reponse: 2
    explication: "`save` sert aussi bien à créer qu'à modifier. Avec un identifiant `null`, Hibernate considère l'objet comme nouveau et l'insère. Avec un identifiant déjà présent en base, il effectue une mise à jour (via un `merge` en interne)."
---

## Essentiel

Un **repository** Spring Data est une interface qui donne accès aux données, **sans implémentation à écrire**. Spring Data JPA génère la classe concrète au démarrage.

```java
public interface ProduitRepository extends JpaRepository<Produit, Long> {
}
```

`JpaRepository<Produit, Long>` fournit déjà :

```java
Produit enregistre = produitRepository.save(nouveauProduit);        // insertion ou mise à jour
Optional<Produit> trouve = produitRepository.findById(42L);         // jamais null
List<Produit> tous = produitRepository.findAll();
boolean existe = produitRepository.existsById(42L);
long total = produitRepository.count();
produitRepository.deleteById(42L);
```

Pas besoin de `@Repository` : Spring Data détecte l'interface et crée le bean tout seul, tant qu'elle étend `Repository` (directement ou via une des interfaces intermédiaires).

Pour démarrer rapidement, une base **H2** embarquée (en mémoire) est pratique : aucune installation, la base est recréée à chaque redémarrage.

## Détail

### La hiérarchie des interfaces

```
Repository<T, ID>                     // marqueur, aucune méthode
    └── CrudRepository<T, ID>         // save, findById, findAll, deleteById, existsById, count...
            └── ListCrudRepository<T, ID>        // comme CrudRepository, mais renvoie des List au lieu d'Iterable
    └── PagingAndSortingRepository<T, ID>        // findAll(Pageable), findAll(Sort)
            └── ListPagingAndSortingRepository<T, ID>
    └── JpaRepository<T, ID>          // combine tout ce qui précède + méthodes spécifiques JPA
```

En pratique, on étend directement `JpaRepository` : c'est l'interface la plus complète, et elle couvre l'immense majorité des besoins.

### Exemple 1 — CRUD complet

```java
@Service
public class ProduitService {
    private final ProduitRepository repo;

    public ProduitService(ProduitRepository repo) {
        this.repo = repo;
    }

    public Produit creer(String nom, double prix) {
        return repo.save(new Produit(nom, prix)); // id null → insertion
    }

    public Produit renommer(Long id, String nouveauNom) {
        Produit produit = repo.findById(id)
            .orElseThrow(() -> new ProduitIntrouvableException(id));
        produit.setNom(nouveauNom);
        return repo.save(produit); // id existant → mise à jour
    }

    public void supprimer(Long id) {
        repo.deleteById(id);
    }
}
```

### Exemple 2 — Configuration H2 pour démarrer

```properties
spring.datasource.url=jdbc:h2:mem:boutique
spring.h2.console.enabled=true
spring.jpa.hibernate.ddl-auto=update
```

Avec le starter `spring-boot-starter-data-jpa` et la dépendance `com.h2database:h2`, Spring Boot configure automatiquement le `DataSource` et l'`EntityManagerFactory` : aucune classe à écrire pour se connecter.

### Exemple 3 — Ce que `JpaRepository` ajoute par rapport à `CrudRepository`

```java
public interface ProduitRepository extends JpaRepository<Produit, Long> {
}

// Méthodes propres à JpaRepository, en plus du CRUD de base :
produitRepository.flush();                 // force l'écriture immédiate en base
produitRepository.saveAndFlush(produit);   // save() + flush() en un appel
produitRepository.deleteAllInBatch();      // suppression en une seule requête SQL
```

### Comparatif des interfaces principales

| Interface | Apporte | Type de retour pour `findAll` |
|---|---|---|
| `CrudRepository` | CRUD de base | `Iterable<T>` |
| `ListCrudRepository` | Même chose, plus pratique | `List<T>` |
| `PagingAndSortingRepository` | Pagination, tri | `Page<T>` / `List<T>` selon la méthode |
| `JpaRepository` | Tout ce qui précède + `flush`, suppressions en lot | `List<T>` |

### Pièges courants

> **Appeler `.get()` sur un `Optional` sans vérifier sa présence.** `produitRepository.findById(id).get()` lève une `NoSuchElementException` si le produit n'existe pas, avec un message peu explicite. Préférez `orElseThrow(() -> new MonException(...))` pour un message clair et un code d'erreur adapté (voir la leçon sur la gestion des erreurs).

> **Croire que `save` échoue si l'entité existe déjà.** Ce n'est pas le cas : `save` est à la fois « créer » et « modifier ». Pour interdire une insertion en double, il faut une contrainte d'unicité en base (`@Column(unique = true)`) ou une vérification explicite (`existsBy...`, voir la leçon suivante).

> **Oublier que `findAll()` sans pagination charge toute la table.** Sur une grosse table, cela peut charger des milliers de lignes en mémoire. Utiliser `findAll(Pageable)` dès que le volume est incertain.

### À retenir

- Une interface qui étend `JpaRepository<Entite, TypeId>` suffit : pas d'implémentation à écrire, pas de `@Repository` nécessaire.
- `save` = insertion **ou** mise à jour selon la présence de l'identifiant.
- `findById` renvoie toujours un `Optional`, jamais `null`.
- `JpaRepository` > `PagingAndSortingRepository` > `CrudRepository`/`ListCrudRepository` > `Repository` : à choisir selon les besoins, `JpaRepository` par défaut.
- H2 en mémoire est idéal pour démarrer et pour les tests.
