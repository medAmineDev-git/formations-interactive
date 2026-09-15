---
id: pagination-tri
chapitre: jpa-avance
ordre: 3
titre: "Pagination et tri"
termes:
  - terme: Pageable
    definition: "Interface qui décrit **une page demandée** : numéro de page, taille, et tri éventuel. `PagingAndSortingRepository` et `JpaRepository` acceptent un `Pageable` en paramètre sur `findAll(Pageable)` et sur la plupart des requêtes dérivées ou `@Query`."
  - terme: "PageRequest.of(...)"
    definition: "Implémentation courante de `Pageable`. `PageRequest.of(page, size)` (page **indexée à partir de 0**) ou `PageRequest.of(page, size, sort)` pour ajouter un tri."
  - terme: Sort
    definition: "Décrit un ou plusieurs critères de tri : `Sort.by(\"nom\").ascending()`, combinable avec `.and(Sort.by(\"prix\").descending())`. Se passe seul (`findAll(Sort)`) ou intégré à un `Pageable`."
  - terme: "Page<T>"
    definition: "Résultat de pagination qui connaît le **nombre total d'éléments** et de pages (`getTotalElements()`, `getTotalPages()`), au prix d'une requête `COUNT` supplémentaire exécutée par Spring Data en plus de la requête de données."
  - terme: "Slice<T>"
    definition: "Résultat de pagination plus léger que `Page<T>` : il sait seulement s'il existe une page suivante (`hasNext()`), sans requête `COUNT`. Utile quand le total exact n'est pas nécessaire (défilement « charger plus », par exemple)."
  - terme: "Paramètres web de pagination"
    definition: "Dans un contrôleur Spring MVC, un paramètre de type `Pageable` est résolu automatiquement depuis les paramètres de requête `?page=0&size=20&sort=nom,asc` (plusieurs `sort` possibles). `page` par défaut à `0`, `size` par défaut à `20`."
  - terme: "Pagination en mémoire avec JOIN FETCH"
    definition: "Paginer une requête qui fait un `JOIN FETCH` sur une collection (`@OneToMany`) est risqué : la jointure duplique une ligne par élément de la collection, ce qui fausse la pagination SQL. Hibernate applique alors la pagination **en mémoire**, en chargeant beaucoup plus de données que nécessaire, avec un avertissement dans les logs."
  - terme: DTO de page
    definition: "Objet propre à l'API qui reprend le contenu et les métadonnées d'une `Page` (contenu, page courante, taille, total) sans exposer directement la classe interne `PageImpl` de Spring Data, dont la structure JSON exacte n'est pas garantie stable dans le temps."
quiz:
  - question: "Quelle est la différence de coût entre `Page<Produit>` et `Slice<Produit>` pour une même requête paginée ?"
    choix:
      - "Aucune différence, ce sont deux noms pour le même mécanisme"
      - "`Page` exécute une requête `COUNT` supplémentaire pour connaître le nombre total d'éléments ; `Slice` s'en passe et sait seulement s'il existe une page suivante"
      - "`Slice` charge toujours plus de données que `Page`"
      - "`Page` ne fonctionne qu'avec `findAll()`, `Slice` uniquement avec les requêtes dérivées"
    reponse: 1
    explication: "`Page<T>` étend `Slice<T>` et ajoute `getTotalElements()`/`getTotalPages()`, calculés via une requête `COUNT` distincte de la requête de données. Sur une table volumineuse ou une requête `COUNT` coûteuse (jointures complexes), utiliser `Slice` évite cette requête supplémentaire quand le total exact n'est pas affiché à l'utilisateur."
  - question: "Que se passe-t-il en exécutant ce repository avec `findAllWithLignes(PageRequest.of(0, 10))` ?"
    code: |
      public interface CommandeRepository extends JpaRepository<Commande, Long> {
          @Query("SELECT c FROM Commande c JOIN FETCH c.lignes")
          Page<Commande> findAllWithLignes(Pageable pageable);
      }
    choix:
      - "Hibernate pagine efficacement en SQL avec LIMIT/OFFSET, comme pour toute requête paginée"
      - "La requête échoue au démarrage : `JOIN FETCH` et `Pageable` sont incompatibles"
      - "Hibernate ne peut pas paginer correctement en SQL à cause de la jointure sur une collection : il charge davantage de données et pagine en mémoire, avec un avertissement dans les logs"
      - "`lignes` est automatiquement chargée en LAZY malgré le `JOIN FETCH`"
    reponse: 2
    explication: "La jointure sur `c.lignes` duplique une ligne de résultat par ligne de commande : appliquer `LIMIT`/`OFFSET` directement en SQL découperait alors les commandes de façon incohérente. Hibernate charge donc plus de données que la page demandée et effectue la découpe en mémoire, ce qui perd l'intérêt de la pagination sur une grosse table. Mieux vaut paginer sans `JOIN FETCH` sur la collection, puis charger celle-ci séparément (par lot, ou requête dédiée) pour les seuls éléments de la page."
  - question: "Pourquoi éviter de renvoyer directement un `Page<Produit>` (donc, en pratique, une instance de `PageImpl`) depuis un endpoint REST ?"
    choix:
      - "Ce n'est jamais un problème, Jackson le sérialise sans aucune limitation"
      - "`Page` ne peut pas contenir plus de 20 éléments"
      - "La structure JSON exacte de `PageImpl` n'est pas garantie stable dans le temps ; Spring Data recommande de passer par un DTO de page (ou une abstraction dédiée) plutôt que d'exposer la classe interne telle quelle"
      - "`Page` ne peut être sérialisé qu'en XML"
    reponse: 2
    explication: "`PageImpl` est une classe interne à Spring Data, pas pensée comme un contrat d'API stable. Exposer un DTO propre (contenu + métadonnées de pagination choisies explicitement) découple l'API du détail d'implémentation interne de Spring Data, et évite une rupture de contrat au fil des montées de version."
---

## Essentiel

`Pageable` décrit une page demandée (numéro, taille, tri). `JpaRepository` l'accepte directement :

```java
public interface ProduitRepository extends JpaRepository<Produit, Long> {
    Page<Produit> findByCategorie(String categorie, Pageable pageable);
}
```

```java
Pageable pageable = PageRequest.of(0, 20, Sort.by("nom").ascending()); // page 0, 20 éléments, triés par nom
Page<Produit> page = produitRepository.findByCategorie("Jardin", pageable);

page.getContent();       // les produits de cette page
page.getTotalElements(); // nombre total de produits pour ce critère
page.getTotalPages();
page.hasNext();
```

Dans un contrôleur Spring MVC, un paramètre `Pageable` est résolu automatiquement depuis les paramètres de requête HTTP :

```java
@GetMapping("/produits")
public Page<Produit> lister(Pageable pageable) { // ?page=0&size=20&sort=nom,asc
    return produitRepository.findAll(pageable);
}
```

`Page<T>` connaît le total (une requête `COUNT` en plus). `Slice<T>` ne le connaît pas mais évite cette requête supplémentaire — un bon choix pour un simple « charger plus » sans afficher le nombre total de résultats.

Deux points de vigilance à ce niveau : paginer une requête avec `JOIN FETCH` sur une collection est risqué (pagination en mémoire, voir plus bas), et exposer directement une `Page` en JSON dans une API n'est pas recommandé — mieux vaut passer par un DTO de page.

## Détail

### Exemple 1 — Pagination et tri combinés

```java
Sort tri = Sort.by("categorie").ascending().and(Sort.by("prix").descending());
Pageable pageable = PageRequest.of(1, 10, tri); // page 1 = la 2e page (index à partir de 0)

Page<Produit> resultat = produitRepository.findAll(pageable);
```

`Sort.by(...).and(...)` combine plusieurs critères : ici, tri par catégorie croissante, puis par prix décroissant au sein de chaque catégorie.

### Exemple 2 — Résolution automatique depuis les paramètres HTTP

```java
@GetMapping("/produits")
public Page<Produit> lister(
        @RequestParam(required = false) String categorie,
        Pageable pageable) {
    return categorie != null
        ? produitRepository.findByCategorie(categorie, pageable)
        : produitRepository.findAll(pageable);
}
```

Appel : `GET /produits?page=0&size=20&sort=nom,asc`. Spring MVC construit un `PageRequest` à partir de ces paramètres, sans code supplémentaire. Plusieurs `sort` peuvent être répétés dans l'URL pour trier sur plusieurs critères (`sort=categorie,asc&sort=prix,desc`).

### Exemple 3 — `Slice` pour éviter le `COUNT`

```java
public interface ProduitRepository extends JpaRepository<Produit, Long> {
    Slice<Produit> findByDisponibleTrue(Pageable pageable);
}
```

```java
Slice<Produit> slice = produitRepository.findByDisponibleTrue(PageRequest.of(0, 20));
slice.getContent();
slice.hasNext(); // pas de getTotalElements() : pas de requête COUNT exécutée
```

Adapté à une interface de type « charger plus de résultats », où le nombre total de produits disponibles n'a pas besoin d'être affiché.

### Exemple 4 — Un DTO de page pour l'API

```java
public record PageReponse<T>(List<T> contenu, int page, int taille, long totalElements, int totalPages) {
    public static <T> PageReponse<T> depuis(Page<T> page) {
        return new PageReponse<>(page.getContent(), page.getNumber(), page.getSize(),
            page.getTotalElements(), page.getTotalPages());
    }
}
```

```java
@GetMapping("/produits")
public PageReponse<ProduitDto> lister(Pageable pageable) {
    Page<Produit> page = produitRepository.findAll(pageable);
    return PageReponse.depuis(page.map(this::versDto));
}
```

Le contrôleur renvoie une structure JSON définie explicitement par l'application, indépendante de la représentation interne de `PageImpl`.

### Le piège de la pagination avec `JOIN FETCH`

```java
@Query("SELECT c FROM Commande c JOIN FETCH c.lignes")
Page<Commande> findAllWithLignes(Pageable pageable); // à éviter
```

Une jointure sur une collection (`c.lignes`) produit une ligne de résultat SQL par ligne de commande : une commande avec 3 lignes apparaît 3 fois dans le jeu de résultats brut. Appliquer `LIMIT`/`OFFSET` directement dessus couperait des commandes au milieu de leurs lignes. Hibernate détecte la situation et pagine **en mémoire** (charge davantage de lignes, puis découpe côté application), ce qui annule le bénéfice de la pagination sur une table volumineuse.

Solution : paginer sans `JOIN FETCH` sur la collection, puis charger celle-ci séparément pour les seuls éléments déjà sélectionnés — par exemple avec un `@BatchSize` (voir la leçon précédente) ou une seconde requête ciblée sur les identifiants de la page.

```java
// 1. Pagine sans la collection
Page<Commande> page = commandeRepository.findAll(pageable);

// 2. Les lignes de ces commandes précises sont chargées séparément,
//    par exemple via @BatchSize sur la relation, ou une requête dédiée par lot d'identifiants.
```

### `Page` vs `Slice`

| | `Page<T>` | `Slice<T>` |
|---|---|---|
| Contenu de la page | ✅ | ✅ |
| `hasNext()` | ✅ | ✅ |
| Nombre total d'éléments | ✅ (`getTotalElements()`) | ❌ |
| Nombre total de pages | ✅ (`getTotalPages()`) | ❌ |
| Requête `COUNT` exécutée | ✅ | ❌ |

### Pièges courants

> **Paginer une requête avec `JOIN FETCH` sur une collection.** Hibernate ne peut pas appliquer `LIMIT`/`OFFSET` correctement en SQL et pagine en mémoire, en chargeant potentiellement bien plus de données que la page demandée. Mieux vaut séparer la pagination (sans la collection) du chargement de la collection (par lot).

> **Renvoyer directement un `Page<T>` en JSON dans une API publique.** La structure sérialisée de `PageImpl` n'est pas un contrat d'API stable. Un DTO de page dédié (contenu et métadonnées choisis explicitement) évite qu'une évolution interne de Spring Data ne casse silencieusement le format de réponse.

> **Oublier que `page` commence à `0`.** `PageRequest.of(0, 20)` correspond à la **première** page. Un client qui envoie `page=1` en pensant obtenir la première page reçoit en réalité la deuxième.

### À retenir

- `Pageable` (souvent `PageRequest.of(page, size, sort)`) porte le numéro de page (indexé à `0`), la taille et le tri.
- `Page<T>` connaît le total (requête `COUNT` en plus) ; `Slice<T>` ne le connaît pas mais l'évite.
- Un paramètre `Pageable` sur une méthode de contrôleur est résolu automatiquement depuis `?page=&size=&sort=`.
- Ne jamais combiner pagination et `JOIN FETCH` sur une collection : la pagination bascule en mémoire.
- Exposer un DTO de page en API plutôt que `Page`/`PageImpl` directement.
