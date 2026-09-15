---
id: requetes-derivees
chapitre: data-jpa
ordre: 3
titre: Les requêtes dérivées du nom des méthodes
termes:
  - terme: Requête dérivée
    definition: "Une méthode de repository dont Spring Data génère la requête SQL/JPQL **à partir de son nom**, sans écrire de code. Exemple : `findByNom(String nom)`."
  - terme: "Mots-clés de comparaison"
    definition: "`Between`, `LessThan`, `GreaterThan`, `LessThanEqual`, `GreaterThanEqual` : comparent un attribut numérique ou une date à une ou plusieurs valeurs passées en paramètre."
  - terme: "Like, Containing, StartingWith"
    definition: "Recherches partielles sur une chaîne : `Like` (motif SQL explicite avec `%`), `Containing` (contient), `StartingWith` / `EndingWith` (commence/finit par). `IgnoreCase` les rend insensibles à la casse."
  - terme: "And, Or"
    definition: "Combinent plusieurs conditions dans le nom de la méthode : `findByNomAndCategorie(...)`, `findByNomOrReference(...)`."
  - terme: OrderBy
    definition: "Ajoute un tri dans le nom de la méthode : `findByCategorieOrderByPrixAsc(...)`. `Asc` (défaut) ou `Desc`."
  - terme: "Top / First"
    definition: "Limitent le nombre de résultats : `findTop3ByCategorieOrderByPrixDesc(...)`, `findFirstByOrderByDateCreationDesc()`."
  - terme: "existsBy, countBy, deleteBy"
    definition: "Préfixes alternatifs à `findBy` : `existsByReference(...)` renvoie un `boolean`, `countByCategorie(...)` renvoie un `long`, `deleteByStatut(...)` supprime et renvoie le nombre de lignes supprimées."
  - terme: "In, IsNull"
    definition: "`In` teste l'appartenance à une collection (`findByCategorieIn(List<String> categories)`), `IsNull` / `IsNotNull` teste la nullité d'un attribut, sans paramètre."
quiz:
  - question: "Quelle méthode faut-il écrire pour trouver les produits dont le prix est compris entre deux valeurs, triés du plus cher au moins cher ?"
    choix:
      - "`findByPrixBetweenOrderByPrixDesc(double min, double max)`"
      - "`findByPrixFromToOrderByPrixDesc(double min, double max)`"
      - "`findAllByPrixRangeDesc(double min, double max)`"
      - "`findByPrixBetweenSortedDesc(double min, double max)`"
    reponse: 0
    explication: "`Between` prend deux paramètres (borne basse, borne haute) dans l'ordre de la méthode, et `OrderBy...Desc` ajoute le tri. C'est le vocabulaire exact que Spring Data reconnaît : les autres formulations ne correspondent à aucun mot-clé et provoquent une erreur au démarrage."
  - question: "Que se passe-t-il au démarrage avec cette méthode, si l'entité `Produit` n'a pas d'attribut `stockDisponible` (elle a `quantiteStock`) ?"
    code: |
      public interface ProduitRepository extends JpaRepository<Produit, Long> {
          List<Produit> findByStockDisponibleGreaterThan(int seuil);
      }
    choix:
      - "L'application démarre normalement, l'erreur n'apparaît qu'au premier appel"
      - "Spring Data ignore la méthode et renvoie toujours une liste vide"
      - "L'application échoue au démarrage : Spring Data valide les noms de méthode dès la création du bean"
      - "Spring Data corrige automatiquement le nom vers `quantiteStock`"
    reponse: 2
    explication: "Spring Data analyse et valide chaque méthode dérivée à la création du repository, au démarrage de l'application (pas à l'exécution). Avec un attribut inexistant, l'erreur est du type « No property 'stockDisponible' found for type 'Produit' » : le problème est détecté tôt, avant même de recevoir une requête."
  - question: "Pourquoi éviter ce genre de méthode dans un vrai projet ?"
    code: |
      List<Produit> findByCategorieAndPrixLessThanAndDisponibleTrueOrderByNomAscPrixDesc(
          String categorie, double prixMax);
    choix:
      - "Ce nom n'est pas syntaxiquement valide pour Spring Data"
      - "Il fonctionne, mais devient long et difficile à lire ; une requête @Query explicite serait plus claire"
      - "Les requêtes dérivées ne supportent pas plus de deux conditions"
      - "`OrderBy` ne peut trier que sur un seul attribut"
    reponse: 1
    explication: "Le nom est valide et Spring Data le comprend, mais la lisibilité en souffre nettement au-delà de deux ou trois conditions. Dès que le nom devient difficile à relire d'un coup d'œil, il vaut mieux passer à une requête `@Query` explicite en JPQL (leçon suivante), plus facile à maintenir."
---

## Essentiel

Spring Data peut générer une requête **à partir du nom d'une méthode** de repository, sans écrire de SQL ni de JPQL.

```java
public interface ProduitRepository extends JpaRepository<Produit, Long> {

    List<Produit> findByCategorie(String categorie);
    List<Produit> findByPrixLessThan(double prixMax);
    List<Produit> findByNomContainingIgnoreCase(String motCle);
    Optional<Produit> findByReference(String reference);
    boolean existsByReference(String reference);
    long countByCategorie(String categorie);
    List<Produit> findByCategorieOrderByPrixAsc(String categorie);
}
```

Le principe : `findBy` (ou `existsBy`, `countBy`, `deleteBy`) suivi du nom d'un attribut de l'entité, éventuellement combiné avec des mots-clés (`And`, `Or`, `Between`, `LessThan`, `Containing`, `OrderBy`…). Spring Data traduit ce nom en requête au démarrage — et **échoue au démarrage**, pas plus tard, si un attribut cité n'existe pas.

Le type de retour compte : une `List<T>` pour plusieurs résultats, un `Optional<T>` pour au plus un résultat, un `boolean` pour `existsBy...`, un `long` pour `countBy...`.

Ces requêtes sont pratiques pour des cas simples. Au-delà de deux ou trois conditions, le nom devient illisible : mieux vaut alors écrire une requête `@Query` (leçon suivante).

## Détail

### Exemple 1 — Comparaisons et dates

```java
List<Produit> findByPrixBetween(double min, double max);
List<Produit> findByPrixGreaterThanEqual(double min);
List<Commande> findByDateCreationAfter(LocalDate date);
List<Commande> findByDateCreationBetween(LocalDate debut, LocalDate fin);
```

### Exemple 2 — Recherche texte et tri

```java
List<Produit> findByNomStartingWithIgnoreCase(String prefixe);
List<Produit> findByNomContaining(String motCle);
List<Produit> findTop5ByCategorieOrderByPrixDesc(String categorie);
List<Produit> findByOrderByNomAsc();
```

`findTop5By...` limite à 5 résultats ; combiné à `OrderBy`, cela donne « les 5 produits les moins chers d'une catégorie ».

### Exemple 3 — Existence, comptage, suppression

```java
boolean existsByReference(String reference);
long countByCategorie(String categorie);
long deleteByStatut(StatutCommande statut); // renvoie le nombre de lignes supprimées
```

`existsByReference` est plus efficace que `findByReference(...).isPresent()` : Spring Data génère une requête limitée au premier résultat, sans charger ni construire l'entité complète.

### Exemple 4 — Combiner plusieurs conditions

```java
List<Produit> findByCategorieAndDisponibleTrue(String categorie);
List<Produit> findByCategorieOrReference(String categorie, String reference);
List<Produit> findByCategorieInAndPrixLessThan(List<String> categories, double prixMax);
List<Produit> findByDescriptionIsNull();
```

### Mots-clés courants

| Mot-clé | Exemple | Effet |
|---|---|---|
| `And` / `Or` | `findByNomAndCategorie` | Combine deux conditions |
| `Between` | `findByPrixBetween(min, max)` | Intervalle |
| `LessThan` / `GreaterThan` | `findByPrixLessThan(max)` | Comparaison |
| `Like` / `Containing` | `findByNomContaining(mot)` | Recherche partielle |
| `IgnoreCase` | `findByNomIgnoreCase(nom)` | Insensible à la casse |
| `OrderBy...Asc/Desc` | `findByCategorieOrderByPrixDesc` | Tri |
| `In` | `findByCategorieIn(liste)` | Appartenance à une liste |
| `IsNull` / `IsNotNull` | `findByDescriptionIsNull()` | Test de nullité |
| `Top` / `First` | `findTop3ByOrderByPrixAsc()` | Limite le nombre de résultats |

### Pièges courants

> **Faute de frappe ou attribut renommé.** `findByPrxi(...)` au lieu de `findByPrix(...)` : l'application échoue au démarrage avec un message du type *« No property 'prxi' found for type 'Produit' »*. C'est en fait une bonne nouvelle : l'erreur est détectée avant la mise en production, pas au premier appel en production.

> **Un nom de méthode qui devient une phrase.** Passé deux ou trois conditions, le nom est long, fragile au moindre renommage d'attribut, et difficile à relire. Basculez vers `@Query` avec du JPQL explicite (leçon suivante) : c'est plus verbeux à écrire, mais bien plus lisible et plus facile à faire évoluer.

> **`findBy...` sans résultat attendu à zéro ou un élément.** Une méthode censée renvoyer au plus une ligne (ex. `findByReference`) doit renvoyer un `Optional<Produit>`, pas `Produit` directement : sinon, Hibernate lève une exception s'il n'y a pas de résultat unique, au lieu de laisser le code appelant gérer l'absence proprement.

### À retenir

- `findBy`, `existsBy`, `countBy`, `deleteBy` suivis du nom d'un attribut, combinés avec `And`, `Or`, `Between`, `Like`/`Containing`, `OrderBy`, `In`, `IsNull`…
- Le type de retour reflète l'intention : `List<T>`, `Optional<T>`, `boolean`, `long`.
- Une erreur de nom (attribut inexistant) échoue **au démarrage**, avant tout appel.
- Passé quelques conditions, préférer `@Query` pour la lisibilité.
