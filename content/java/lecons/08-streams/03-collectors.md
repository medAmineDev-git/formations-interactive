---
id: collectors
chapitre: streams
ordre: 3
titre: "Les collecteurs"
termes:
  - terme: collect(Collector)
    definition: "Opération terminale générique qui accumule les éléments d'un stream dans un résultat quelconque (collection, `Map`, chaîne, valeur agrégée…), en déléguant toute la logique à un objet `Collector` fourni, le plus souvent via la classe utilitaire `Collectors`."
  - terme: groupingBy
    definition: "Collecteur qui regroupe les éléments par **clé de classification** dans une `Map<K, List<T>>` (par défaut). Un second argument, un **collecteur en aval**, change ce que contient chaque groupe (`counting()`, `summingInt()`, `mapping()`…) au lieu de la liste brute."
  - terme: partitioningBy
    definition: "Cas particulier de `groupingBy` où la clé de classification est un `boolean` : produit toujours une `Map<Boolean, List<T>>` avec exactement deux entrées (`true` et `false`), même si l'une des deux est vide."
  - terme: "toMap et les clés en double"
    definition: "`Collectors.toMap(clé, valeur)` lève une `IllegalStateException` (« Duplicate key ») si deux éléments produisent la même clé. Une variante à trois arguments accepte une **fonction de fusion** (`(v1, v2) -> ...`) pour résoudre les doublons."
  - terme: teeing
    definition: "Collecteur qui applique **deux collecteurs en parallèle** sur le même stream, puis combine leurs deux résultats en un seul via une fonction de fusion — utile pour calculer plusieurs agrégats en un seul parcours."
  - terme: "Collectors.reducing"
    definition: "Variante de `reduce()` sous forme de collecteur, utilisable comme collecteur en aval d'un `groupingBy`. Exige, comme `reduce()`, une opération associative."
  - terme: "stream.toList() vs collect(Collectors.toList())"
    definition: "`stream.toList()` (depuis Java 16) est un raccourci qui renvoie une liste **non modifiable**. `collect(Collectors.toList())` ne garantit rien sur la mutabilité du résultat, mais renvoie en pratique une `ArrayList` **modifiable**."
quiz:
  - question: "Que produit ce code ?"
    code: |
      record Produit(String nom, String categorie, double prix) { }
      List<Produit> catalogue = List.of(
          new Produit("Clavier", "Informatique", 45.0),
          new Produit("Souris", "Informatique", 20.0),
          new Produit("Roman", "Livres", 12.0));

      Map<String, Double> totalParCategorie = catalogue.stream()
          .collect(Collectors.groupingBy(Produit::categorie, Collectors.summingDouble(Produit::prix)));
    choix:
      - "Une exception, car groupingBy() n'accepte qu'un seul argument"
      - "{Informatique=65.0, Livres=12.0} : groupingBy avec un collecteur en aval qui somme les prix de chaque groupe"
      - "{Informatique=[Clavier, Souris], Livres=[Roman]} : la liste des noms par catégorie"
      - "Une Map avec les prix individuels, sans regroupement"
    reponse: 1
    explication: "Le deuxième argument de groupingBy() est un collecteur en aval appliqué à chaque groupe : ici Collectors.summingDouble additionne les prix des produits de chaque catégorie au lieu de simplement les lister. Sans ce deuxième argument, groupingBy(Produit::categorie) seul aurait produit une Map<String, List<Produit>>."
  - question: "Pourquoi ce code lève-t-il une exception à l'exécution ?"
    code: |
      record Produit(String nom, String categorie) { }
      List<Produit> catalogue = List.of(
          new Produit("Clavier", "Informatique"),
          new Produit("Souris", "Informatique"));

      Map<String, String> parCategorie = catalogue.stream()
          .collect(Collectors.toMap(Produit::categorie, Produit::nom));
    choix:
      - "toMap() ne fonctionne qu'avec des clés numériques"
      - "Clavier et Souris partagent la même clé \"Informatique\" : toMap() à deux arguments lève IllegalStateException sur une clé en double, sans fonction de fusion pour la résoudre"
      - "record ne peut pas être utilisé comme valeur d'une Map"
      - "Il manque un troisième élément dans catalogue"
    reponse: 1
    explication: "Collectors.toMap(keyMapper, valueMapper) à deux arguments suppose des clés uniques ; deux produits de la même catégorie génèrent la même clé et provoquent une IllegalStateException (\"Duplicate key\"). La solution est la variante à trois arguments avec une fonction de fusion, par exemple (nom1, nom2) -> nom1 + \", \" + nom2, ou de repenser la clé de regroupement (souvent avec groupingBy à la place)."
  - question: "Quelle est la différence pratique entre stream.toList() et stream.collect(Collectors.toList()) ?"
    choix:
      - "Il n'y a aucune différence, ce sont deux syntaxes strictement équivalentes"
      - "stream.toList() renvoie une liste non modifiable ; collect(Collectors.toList()) renvoie en pratique une ArrayList modifiable"
      - "collect(Collectors.toList()) est toujours plus rapide"
      - "stream.toList() ne fonctionne que sur les streams primitifs"
    reponse: 1
    explication: "stream.toList(), ajouté en Java 16, documente explicitement un résultat non modifiable (toute tentative d'ajout lève UnsupportedOperationException). Collectors.toList() ne garantit officiellement ni le type ni la mutabilité du résultat, mais l'implémentation actuelle renvoie une ArrayList modifiable — une différence à connaître avant de faire list.add(...) sur le résultat d'un stream.toList()."
---

## Essentiel

`collect(Collector)` est l'opération terminale la plus flexible : elle délègue l'accumulation à un objet `Collector`, le plus souvent pioché dans `Collectors`.

```java
List<String> noms = catalogue.stream()
    .map(Produit::nom)
    .collect(Collectors.toList());          // ArrayList modifiable

List<String> nomsImmuables = catalogue.stream()
    .map(Produit::nom)
    .toList();                              // liste non modifiable (raccourci depuis Java 16)
```

Les collecteurs courants : `toList`/`toSet`/`toUnmodifiableList`, `joining` (concaténation de chaînes), `counting`, `summingInt`/`averagingDouble`/`summarizingInt` (agrégats numériques).

`groupingBy` regroupe par clé de classification, avec un **collecteur en aval** optionnel pour dire ce que contient chaque groupe :

```java
Map<String, Long> nbParCategorie = catalogue.stream()
    .collect(Collectors.groupingBy(Produit::categorie, Collectors.counting()));
```

`partitioningBy` est un cas particulier de `groupingBy` avec une clé booléenne : toujours exactement deux groupes (`true`/`false`).

`toMap(clé, valeur)` lève une exception sur une **clé en double** — il faut alors la variante à trois arguments avec une fonction de fusion.

## Détail

### Comment ça marche

Un `Collector` combine trois éléments : un **conteneur mutable** de départ (ex. une `ArrayList` vide), une fonction qui **accumule** chaque élément dedans, et éventuellement une fonction de **finition** qui transforme ce conteneur en résultat final (par exemple `joining` construit une `StringBuilder` en interne puis renvoie sa `String`). C'est ce mécanisme générique qui permet à `Collectors` de couvrir des besoins très différents avec une seule opération terminale, `collect`.

### Exemple 1 — Collecteurs courants

```java
List<Produit> catalogue = List.of(
    new Produit("Clavier", "Informatique", 45.0),
    new Produit("Souris", "Informatique", 20.0),
    new Produit("Roman", "Livres", 12.0));

String nomsJoints = catalogue.stream()
    .map(Produit::nom)
    .collect(Collectors.joining(", ", "[", "]")); // "[Clavier, Souris, Roman]"

long nbProduits = catalogue.stream().collect(Collectors.counting());
double totalPrix = catalogue.stream().collect(Collectors.summingDouble(Produit::prix));
DoubleSummaryStatistics stats = catalogue.stream()
    .collect(Collectors.summarizingDouble(Produit::prix)); // min, max, moyenne, somme, count en un seul passage
```

`summarizingDouble`/`Int`/`Long` évitent plusieurs parcours du stream quand plusieurs statistiques sont nécessaires en même temps.

### Exemple 2 — groupingBy avec collecteur en aval, et imbriqué

```java
Map<String, List<String>> nomsParCategorie = catalogue.stream()
    .collect(Collectors.groupingBy(Produit::categorie,
             Collectors.mapping(Produit::nom, Collectors.toList())));
// {Informatique=[Clavier, Souris], Livres=[Roman]}

Map<String, Double> totalParCategorie = catalogue.stream()
    .collect(Collectors.groupingBy(Produit::categorie, Collectors.summingDouble(Produit::prix)));
// {Informatique=65.0, Livres=12.0}

// Regroupement imbriqué : catégorie, puis nombre de produits par tranche de prix
Map<String, Map<String, Long>> imbrique = catalogue.stream()
    .collect(Collectors.groupingBy(Produit::categorie,
             Collectors.groupingBy(p -> p.prix() < 30 ? "économique" : "premium", Collectors.counting())));

// TreeMap comme fournisseur : catégories triées par ordre alphabétique
Map<String, Long> trie = catalogue.stream()
    .collect(Collectors.groupingBy(Produit::categorie, TreeMap::new, Collectors.counting()));
```

`mapping` transforme chaque élément d'un groupe avant de le collecter ; `groupingBy` imbriqué crée une classification à plusieurs niveaux ; la variante à trois arguments avec un fournisseur de `Map` (ici `TreeMap::new`) contrôle le type de `Map` renvoyée.

### Exemple 3 — partitioningBy, filtering, teeing

```java
Map<Boolean, List<Produit>> partition = catalogue.stream()
    .collect(Collectors.partitioningBy(p -> p.prix() < 30));
// {false=[Clavier, Écran...], true=[Souris, Roman]}

Map<String, List<Produit>> chersSeulement = catalogue.stream()
    .collect(Collectors.groupingBy(Produit::categorie,
             Collectors.filtering(p -> p.prix() > 15, Collectors.toList())));

// teeing : deux collecteurs en un seul parcours, combinés à la fin
var resultat = catalogue.stream()
    .collect(Collectors.teeing(
        Collectors.counting(),
        Collectors.summingDouble(Produit::prix),
        (nb, total) -> "‱ " + nb + " produits, total " + total));
```

`filtering` (à ne pas confondre avec `filter` avant `collect` : il filtre **à l'intérieur** de chaque groupe, après `groupingBy`) et `teeing` (depuis Java 12) permettent de calculer plusieurs agrégats liés en un seul passage sur le stream, plutôt que de le parcourir deux fois.

### Exemple 4 — reducing comme collecteur en aval

```java
Optional<Produit> plusCher = catalogue.stream()
    .collect(Collectors.reducing((p1, p2) -> p1.prix() >= p2.prix() ? p1 : p2));

Map<String, Optional<Produit>> plusCherParCategorie = catalogue.stream()
    .collect(Collectors.groupingBy(Produit::categorie,
             Collectors.reducing((p1, p2) -> p1.prix() >= p2.prix() ? p1 : p2)));
```

`Collectors.reducing` rend `reduce()` utilisable comme collecteur en aval d'un `groupingBy` — par exemple trouver le produit le plus cher **par catégorie** en un seul `collect`.

### Panorama des collecteurs

| Besoin | Collecteur |
|---|---|
| Liste modifiable / non modifiable | `toList` / `toUnmodifiableList` (ou `stream.toList()`) |
| Ensemble sans doublon | `toSet` |
| `Map` clé → valeur | `toMap` (attention aux clés en double) |
| Concaténer des chaînes | `joining(séparateur, préfixe, suffixe)` |
| Compter / sommer / moyenner | `counting`, `summingInt`/`Double`/`Long`, `averagingDouble` |
| Plusieurs stats en un passage | `summarizingInt`/`Double`/`Long` |
| Regrouper par clé | `groupingBy` (+ collecteur en aval optionnel) |
| Regrouper en deux groupes booléens | `partitioningBy` |
| Transformer avant de collecter | `mapping`, `flatMapping` |
| Filtrer à l'intérieur d'un groupe | `filtering` |
| Deux collecteurs combinés en un résultat | `teeing` |

### Pièges courants

> **`toMap()` sur des clés potentiellement en double.** Sans fonction de fusion, une seule collision fait échouer tout le `collect` avec `IllegalStateException: Duplicate key ...`. Fournir un troisième argument, par exemple `(v1, v2) -> v1` (garder le premier) ou `(v1, v2) -> v1 + v2` (fusionner), ou repenser le besoin comme un `groupingBy`.

> **Confondre `filter` (avant `collect`) et `Collectors.filtering` (à l'intérieur d'un `groupingBy`).** `stream.filter(cond).collect(groupingBy(...))` supprime les éléments **avant** le regroupement — une catégorie peut disparaître entièrement si tous ses produits sont filtrés. `groupingBy(clé, filtering(cond, toList()))` conserve toutes les clés, avec une liste vide pour celles sans élément correspondant.

> **Modifier le résultat de `stream.toList()`.** Il est documenté non modifiable : `liste.add(x)` lève `UnsupportedOperationException`. Utiliser `collect(Collectors.toList())` (ou envelopper dans `new ArrayList<>(...)`) si une liste modifiable est nécessaire ensuite.

### À retenir

- `collect(Collector)` est l'opération terminale générique ; `Collectors` fournit les collecteurs prêts à l'emploi les plus courants.
- `groupingBy` (+ collecteur en aval) et `partitioningBy` (cas booléen) sont les deux outils de regroupement de base ; ils peuvent s'imbriquer.
- `toMap` à deux arguments échoue sur une clé en double ; la variante à trois arguments avec fonction de fusion résout le conflit.
- `mapping`, `filtering`, `flatMapping` transforment ou filtrent **à l'intérieur** d'un groupe ; `teeing` combine deux collecteurs en un seul parcours.
- `stream.toList()` renvoie une liste non modifiable, contrairement à `collect(Collectors.toList())` ; écrire un collecteur personnalisé se fait via `Collectors.of(...)` ou en implémentant l'interface `Collector`.
