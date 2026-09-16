---
id: operations
chapitre: streams
ordre: 2
titre: "Les opérations"
termes:
  - terme: Court-circuit
    definition: "Propriété d'une opération qui peut arrêter le parcours du stream avant d'avoir traité tous les éléments : `limit`, `findFirst`, `findAny`, `anyMatch`, `allMatch`, `noneMatch`, `takeWhile`. Elle rend un pipeline potentiellement infini exploitable."
  - terme: Opération sans état (stateless)
    definition: "Opération qui traite chaque élément indépendamment des autres, sans rien mémoriser entre eux (`filter`, `map`, `peek`). Elle peut démarrer à produire des résultats dès le premier élément."
  - terme: Opération avec état (stateful)
    definition: "Opération qui doit connaître d'autres éléments (voire tout le stream) pour produire son résultat (`sorted`, `distinct`, `limit`, `skip`). Elle peut retenir des éléments en mémoire et retarder la production de résultats."
  - terme: reduce
    definition: "Opération terminale qui combine tous les éléments en une seule valeur via une fonction d'accumulation. Elle exige une **valeur initiale (identité)** neutre pour l'opération, et une opération **associative** pour que le résultat soit indépendant de l'ordre de regroupement des calculs."
  - terme: "flatMap"
    definition: "Opération intermédiaire qui transforme chaque élément en un stream, puis **aplatit** tous ces streams en un seul (utile pour passer d'une liste de listes à une liste plate)."
  - terme: peek
    definition: "Opération intermédiaire qui exécute une action sur chaque élément **sans le transformer** ; réservée au débogage (afficher ce qui circule dans le pipeline), jamais à une logique métier avec effets de bord."
  - terme: Gatherer
    definition: "Mécanisme d'opération intermédiaire **personnalisée et à état** introduit par `Stream.gather()`, finalisé en **JDK 24** (JEP 485). `java.util.stream.Gatherers` fournit des gatherers prêts à l'emploi comme `windowFixed`, `windowSliding`, `fold` et `scan`."
quiz:
  - question: "Combien d'éléments sont réellement transformés par map() dans ce pipeline ?"
    code: |
      List<String> produits = List.of("Clavier", "Souris", "Écran", "Tapis", "Webcam");
      Optional<String> resultat = produits.stream()
          .map(p -> { System.out.println("map: " + p); return p.toUpperCase(); })
          .filter(p -> p.startsWith("S"))
          .findFirst();
    choix:
      - "Les 5 éléments, car map() doit s'exécuter avant filter() sur tout le stream"
      - "Seulement les éléments nécessaires jusqu'à trouver le premier qui correspond, grâce au court-circuit de findFirst()"
      - "0 élément, car findFirst() n'a pas besoin de map()"
      - "3 éléments, la moitié arrondie du stream"
    reponse: 1
    explication: "Un pipeline traite les éléments un par un, verticalement : chaque élément passe par map() puis filter() avant que le suivant ne soit pris. findFirst() est une opération à court-circuit : dès qu'un élément satisfait filter(), le pipeline s'arrête. Ici, \"Clavier\" et \"Souris\" passent par map() (2 affichages), \"Souris\" satisfait le filtre, et le parcours s'arrête — \"Écran\", \"Tapis\", \"Webcam\" ne sont jamais transformés."
  - question: "Pourquoi reduce() exige-t-il une opération associative ?"
    choix:
      - "Parce que Java ne peut pas compiler une expression lambda non associative"
      - "Parce que le résultat doit rester correct quel que soit l'ordre dans lequel les éléments sont regroupés, notamment en parallèle où les sous-résultats sont combinés dans un ordre non déterministe"
      - "Parce que l'associativité est nécessaire uniquement pour les types primitifs"
      - "Ce n'est pas vrai : reduce() fonctionne avec n'importe quelle opération"
    reponse: 1
    explication: "reduce() ne garantit pas l'ordre exact des combinaisons intermédiaires, en particulier sur un stream parallèle où des morceaux sont réduits séparément puis combinés. Une opération non associative (comme la soustraction) donne alors un résultat différent selon le découpage — d'où l'exigence d'associativité, même en séquentiel où l'ordre reste techniquement respecté mais où le contrat de l'API ne le garantit pas."
  - question: "Que faut-il éviter avec peek() ?"
    choix:
      - "L'utiliser pour afficher les éléments qui traversent le pipeline pendant le débogage"
      - "L'utiliser pour modifier un état métier partagé (par exemple ajouter chaque élément à une liste externe) au lieu de collect()"
      - "L'appeler après un filter()"
      - "L'utiliser sur un IntStream"
    reponse: 1
    explication: "peek() est documenté comme un outil de débogage : son exécution n'est même pas garantie sur tous les éléments si le pipeline court-circuite ou si l'implémentation optimise certains cas. L'utiliser pour une vraie logique métier (accumulation dans une liste externe, appel à un service) est fragile et doit être remplacé par collect() ou forEach() en fin de pipeline."
---

## Essentiel

Les opérations intermédiaires transforment un stream en un autre stream ; les opérations terminales produisent un résultat et consomment le stream.

- **Sans état** (`filter`, `map`, `peek`) : traitent chaque élément isolément, peuvent commencer à produire des résultats immédiatement.
- **Avec état** (`sorted`, `distinct`, `limit`, `skip`) : ont besoin de voir d'autres éléments (parfois tout le stream) avant de produire un résultat.

```java
List<String> produits = List.of("Clavier", "Souris", "Écran", "Tapis");

List<String> resultat = produits.stream()
    .filter(p -> p.length() > 5)   // intermédiaire, sans état
    .sorted()                      // intermédiaire, avec état
    .map(String::toUpperCase)      // intermédiaire, sans état
    .toList();                     // terminale
```

Certaines opérations sont à **court-circuit** : `findFirst`, `findAny`, `anyMatch`, `allMatch`, `noneMatch`, `limit`, `takeWhile` peuvent arrêter le parcours avant la fin du stream, ce qui permet même de travailler avec des streams infinis.

`reduce` combine tous les éléments en une seule valeur, à partir d'une **valeur initiale neutre** et d'une opération **associative** :

```java
int totalQuantites = List.of(2, 5, 1, 3).stream()
    .reduce(0, Integer::sum); // 0 = identité, sum = associatif
```

`peek` sert uniquement au débogage — jamais à une logique métier avec effets de bord.

## Détail

### Comment ça marche

Un pipeline traite les éléments un par un, **verticalement** : un élément passe par toute la chaîne d'opérations avant que le suivant ne commence, et non toute la collection à travers `filter` puis toute la collection à travers `map`. C'est ce qui permet au court-circuit de fonctionner : dès qu'un élément satisfait la condition d'arrêt, le parcours des éléments suivants n'a jamais lieu.

Les opérations avec état changent cette mécanique : `sorted()` doit avoir vu **tous** les éléments avant d'en livrer un seul (elle bloque le flux vertical), alors que `limit(n)` peut s'arrêter dès que `n` éléments sont sortis.

### Exemple 1 — Enchaîner filter, sorted, map, distinct

```java
record Produit(String nom, double prix) { }

List<Produit> catalogue = List.of(
    new Produit("Clavier", 45.0), new Produit("Souris", 20.0),
    new Produit("Écran", 199.0), new Produit("Clavier", 45.0));

List<String> nomsTries = catalogue.stream()
    .filter(p -> p.prix() < 100)
    .map(Produit::nom)
    .distinct()
    .sorted()
    .toList(); // [Clavier, Souris]
```

`distinct()` s'appuie sur `equals()` ; `sorted()` sans argument exige que les éléments implémentent `Comparable` (ici `String`).

### Exemple 2 — flatMap pour aplatir une structure imbriquée

```java
record LigneCommande(String produit, int quantite) { }
record Commande(String id, List<LigneCommande> lignes) { }

List<Commande> commandes = List.of(
    new Commande("C1", List.of(new LigneCommande("Clavier", 1), new LigneCommande("Souris", 2))),
    new Commande("C2", List.of(new LigneCommande("Écran", 1))));

List<String> tousLesProduits = commandes.stream()
    .flatMap(c -> c.lignes().stream())     // Stream<Commande> -> Stream<LigneCommande>
    .map(LigneCommande::produit)
    .toList(); // [Clavier, Souris, Écran]
```

`map` aurait produit un `Stream<Stream<LigneCommande>>` (une liste de listes) ; `flatMap` aplatit directement en `Stream<LigneCommande>`.

### Exemple 3 — reduce avec identité et opération associative

```java
List<Double> prix = List.of(45.0, 20.0, 199.0);

double total = prix.stream()
    .reduce(0.0, Double::sum); // identité 0.0, opération associative

String concatenation = List.of("Clavier", "Souris", "Écran").stream()
    .reduce("", (acc, nom) -> acc.isEmpty() ? nom : acc + ", " + nom);
```

La forme à trois arguments (`reduce(identite, accumulateur, combineur)`) ajoute un **combineur** utilisé pour fusionner des résultats partiels sur un stream parallèle ; en séquentiel, il n'est jamais appelé.

### Exemple 4 — takeWhile, dropWhile et un Gatherer

```java
List<Integer> quantites = List.of(2, 4, 6, 7, 8, 10);

List<Integer> pairesDebut = quantites.stream()
    .takeWhile(n -> n % 2 == 0) // s'arrête au premier élément qui échoue : [2, 4, 6]
    .toList();

List<Integer> apresLaCoupure = quantites.stream()
    .dropWhile(n -> n % 2 == 0) // ignore tant que la condition est vraie, garde le reste : [7, 8, 10]
    .toList();

// Gatherers (java.util.stream.Gatherers, finalisé en JDK 24) : opérations intermédiaires prêtes à l'emploi
List<List<Integer>> fenetres = quantites.stream()
    .gather(Gatherers.windowFixed(2))
    .toList(); // [[2, 4], [6, 7], [8, 10]]
```

`takeWhile`/`dropWhile` diffèrent de `filter` : ils s'arrêtent (ou commencent) au **premier changement** de condition, sans réexaminer les éléments suivants même s'ils redeviendraient valides. `Stream.gather()` (JEP 485, finalisé en JDK 24) permet d'écrire des opérations intermédiaires à état arbitraire ; `Gatherers` fournit notamment `windowFixed`, `windowSliding`, `fold` et `scan`.

### Panorama des opérations

| Catégorie | Opérations |
|---|---|
| Intermédiaires sans état | `filter`, `map`, `flatMap`, `peek`, `mapMulti` |
| Intermédiaires avec état | `distinct`, `sorted`, `limit`, `skip`, `takeWhile`, `dropWhile` |
| Terminales — résultat unique | `reduce`, `count`, `min`, `max`, `sum`/`average` (streams primitifs) |
| Terminales — court-circuit | `findFirst`, `findAny`, `anyMatch`, `allMatch`, `noneMatch` |
| Terminales — collecte | `collect`, `toList`, `forEach` |

`mapMulti` (depuis Java 16) joue un rôle proche de `flatMap` mais pousse les éléments un par un dans un `Consumer` au lieu de construire un stream intermédiaire par élément — utile quand la transformation produit 0, 1 ou quelques éléments plutôt qu'une vraie collection à aplatir.

### Pièges courants

> **Utiliser `peek()` pour une vraie logique métier.** La Javadoc précise que `peek()` est prévu « principalement pour soutenir le débogage ». Son exécution n'est pas garantie sur tous les éléments si le pipeline court-circuite avant — un `peek()` qui alimente une liste externe peut silencieusement en oublier une partie.

> **Placer une opération coûteuse avant un `filter()` qui élimine beaucoup d'éléments.** `catalogue.stream().map(this::enrichirDepuisApi).filter(p -> p.prix() < 50)` appelle l'enrichissement coûteux sur **tous** les éléments, alors que `filter` avant `map` évite le travail sur les éléments déjà exclus.

> **Utiliser `reduce()` avec une opération non associative**, par exemple `(a, b) -> a - b`. Le résultat séquentiel « semble » correct par hasard (l'ordre est respecté en séquentiel), mais rien dans le contrat de l'API ne le garantit, et passer en stream parallèle change silencieusement le résultat.

### À retenir

- Un pipeline traite chaque élément verticalement (toutes les opérations d'affilée) avant de passer au suivant ; c'est ce qui permet le court-circuit.
- Les opérations avec état (`sorted`, `distinct`, `limit`…) doivent voir plusieurs éléments, parfois tout le stream, avant de produire un résultat.
- `reduce` exige une identité neutre et une opération associative — indispensable dès qu'un stream parallèle entre en jeu.
- `flatMap` aplatit une structure imbriquée ; `takeWhile`/`dropWhile` s'arrêtent au premier changement de condition, contrairement à `filter`.
- `peek` est un outil de débogage, pas un mécanisme d'effets de bord ; les gatherers (`Stream.gather`, finalisés en JDK 24) couvrent les besoins d'opérations intermédiaires personnalisées à état.
