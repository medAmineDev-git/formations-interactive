---
id: parallele-pieges
chapitre: streams
ordre: 4
titre: "Streams parallèles et pièges"
termes:
  - terme: "parallelStream() / parallel()"
    definition: "Deux façons d'obtenir un stream **parallèle** : `collection.parallelStream()` depuis une collection, ou `.parallel()` sur un stream existant. Le traitement est alors découpé en plusieurs morceaux exécutés sur plusieurs threads du **pool commun ForkJoin**."
  - terme: Pool commun ForkJoin
    definition: "`ForkJoinPool.commonPool()`, le pool de threads partagé par **tous** les streams parallèles de l'application (et par `CompletableFuture` par défaut). Sa taille par défaut vaut `Runtime.getRuntime().availableProcessors() - 1`."
  - terme: "findFirst vs findAny"
    definition: "`findFirst()` respecte l'ordre de rencontre du stream, ce qui a un coût en parallèle (il faut coordonner les morceaux). `findAny()` renvoie n'importe quel élément trouvé, sans garantie d'ordre — souvent nettement plus rapide en parallèle si l'ordre n'a pas d'importance."
  - terme: "forEach vs forEachOrdered"
    definition: "`forEach()` n'exécute pas forcément l'action dans l'ordre de rencontre sur un stream parallèle. `forEachOrdered()` garantit l'ordre, au prix de la perte d'une bonne partie du gain de parallélisme."
  - terme: Effet de bord non sûr
    definition: "Modifier une structure partagée (une `List` externe, un compteur) depuis l'action d'un `forEach`/`map` sur un stream **parallèle**, sans synchronisation, produit des résultats incorrects ou incohérents (éléments perdus, exceptions) car plusieurs threads y écrivent en même temps."
  - terme: Accumulateur associatif obligatoire
    definition: "`reduce()` (et les collecteurs qui reposent dessus) exigent une opération associative : un stream parallèle combine des résultats partiels calculés indépendamment, et une opération non associative rend ce résultat dépendant, de façon imprévisible, du découpage effectué."
  - terme: Threads virtuels
    definition: "Les threads virtuels (JEP 444, finalisés en JDK 21) sont conçus pour un très grand nombre de tâches **bloquantes** (E/S), pas pour du calcul intensif parallèle sur peu de cœurs — un rôle différent de celui des streams parallèles, qui reposent sur des threads plateforme. Voir le chapitre Concurrence."
quiz:
  - question: "Pourquoi ce code peut-il donner un total incorrect selon les exécutions ?"
    code: |
      List<Integer> total = new ArrayList<>();
      List<Produit> catalogue = catalogueVolumineux(); // 50 000 produits

      catalogue.parallelStream()
          .forEach(p -> total.add((int) p.prix())); // ArrayList non thread-safe

      System.out.println(total.size());
    choix:
      - "C'est toujours correct : forEach() synchronise automatiquement les accès à la collection cible"
      - "ArrayList n'est pas thread-safe : plusieurs threads du pool commun y écrivent en même temps, ce qui peut perdre des éléments ou lever une exception"
      - "parallelStream() interdit l'utilisation de forEach(), il faut obligatoirement collect()"
      - "Le code ne compile pas, car ArrayList ne peut pas être utilisée dans un forEach parallèle"
    reponse: 1
    explication: "Un stream parallèle exécute l'action de forEach() depuis plusieurs threads simultanément. ArrayList n'offre aucune garantie de sécurité en environnement concurrent : des écritures concurrentes non synchronisées peuvent perdre des éléments, produire une ArrayIndexOutOfBoundsException interne, voire une ConcurrentModificationException. La solution correcte est catalogue.parallelStream().collect(Collectors.toList()) (ou mapToInt(...).boxed().toList()), qui gère la fusion en interne sans partage d'état mutable."
  - question: "Dans quelle situation parallelStream() a-t-il le plus de chances d'apporter un vrai gain de performance ?"
    choix:
      - "Sur une petite liste de 20 éléments avec une opération simple comme un filtrage de chaînes"
      - "Sur un grand volume d'éléments, avec une opération coûteuse en CPU par élément, et une source facile à découper comme un ArrayList ou un tableau"
      - "Sur un LinkedList de taille quelconque, car les streams parallèles corrigent son absence d'accès direct"
      - "Sur un Stream.generate() infini sans limit(), pour répartir le calcul sur plusieurs threads"
    reponse: 1
    explication: "Le gain d'un stream parallèle doit compenser le coût de découpage de la source, de répartition entre threads et de fusion des résultats. Ce coût n'est amorti que si chaque élément coûte réellement cher à traiter et si la source se découpe efficacement (ArrayList, tableau, IntStream.range — pas LinkedList, dont le découpage est lui-même coûteux). Sur peu d'éléments ou une opération triviale, le parallélisme ralentit presque toujours le traitement."
  - question: "Que garantit findAny() sur un stream parallèle, contrairement à findFirst() ?"
    choix:
      - "findAny() garantit de renvoyer l'élément de plus petit index"
      - "findAny() ne garantit aucun ordre particulier, ce qui lui évite le coût de coordination entre threads qu'impose le respect de l'ordre de rencontre par findFirst()"
      - "findAny() ne fonctionne que sur les streams séquentiels"
      - "findAny() et findFirst() sont strictement identiques sur un stream parallèle"
    reponse: 1
    explication: "findFirst() doit renvoyer l'élément qui apparaîtrait en premier dans l'ordre de rencontre du stream, ce qui oblige les threads à se coordonner même en parallèle. findAny() lève cette contrainte et peut renvoyer dès qu'un thread trouve une correspondance, sans attendre les autres — plus rapide en parallèle si l'ordre est indifférent au besoin métier."
---

## Essentiel

`collection.parallelStream()` (ou `.parallel()` sur un stream existant) répartit le traitement sur plusieurs threads du **pool commun ForkJoin**, partagé par toute l'application. Sa taille par défaut vaut `Runtime.getRuntime().availableProcessors() - 1`.

```java
long total = catalogue.parallelStream()
    .filter(p -> p.categorie().equals("Informatique"))
    .count();
```

Le parallélisme aide vraiment quand **trois conditions** sont réunies : un grand volume d'éléments, une opération coûteuse par élément, et une source facile à découper (`ArrayList`, tableau, `IntStream.range`). Sur peu d'éléments, une opération triviale, ou une source difficile à découper (`LinkedList`, `Files.lines`), le surcoût de répartition/fusion dépasse souvent le gain — voire ralentit le traitement.

Deux pièges dominent :
- **Effets de bord non sûrs** : écrire dans une collection externe non thread-safe depuis `forEach` sur un stream parallèle corrompt le résultat.
- **`reduce` non associatif** : le résultat devient dépendant, de façon imprévisible, du découpage effectué par le pool.

`findFirst`/`forEachOrdered` respectent l'ordre de rencontre au prix d'une partie du gain ; `findAny`/`forEach` ne le garantissent pas mais sont généralement plus rapides. **Mesurer plutôt que supposer** : le gain (ou la perte) dépend fortement du matériel, du volume et de l'opération.

## Détail

### Comment ça marche

Un stream parallèle découpe sa source en plusieurs morceaux (via son `Spliterator`), traite chaque morceau sur un thread du pool commun ForkJoin, puis fusionne les résultats partiels. Ce découpage et cette fusion ont un coût fixe, à amortir par le gain de calcul réparti sur plusieurs cœurs. Le pool commun est **partagé** par toute l'application (y compris par `CompletableFuture.supplyAsync` sans exécuteur explicite) : un traitement parallèle lourd quelque part peut ralentir un autre traitement parallèle ailleurs, faute de threads disponibles.

### Exemple 1 — Activer le parallélisme

```java
List<Produit> catalogue = chargerCatalogueVolumineux(); // dizaines de milliers de lignes

double totalSequentiel = catalogue.stream()
    .mapToDouble(Produit::prix)
    .sum();

double totalParallele = catalogue.parallelStream()
    .mapToDouble(Produit::prix)
    .sum(); // même résultat, potentiellement plus rapide sur un gros volume

Stream<Produit> dejaSequentiel = catalogue.stream();
Stream<Produit> devenuParallele = dejaSequentiel.parallel(); // bascule un stream existant
```

`sum()` sur un `DoubleStream` est associatif et sans effet de bord : c'est un bon candidat pour la parallélisation, contrairement à un `forEach` qui écrirait dans une variable partagée.

### Exemple 2 — Ordre : findFirst vs findAny, forEach vs forEachOrdered

```java
Optional<Produit> premier = catalogue.parallelStream()
    .filter(p -> p.prix() > 100)
    .findFirst(); // respecte l'ordre de rencontre : coordination nécessaire entre threads

Optional<Produit> nimporteLequel = catalogue.parallelStream()
    .filter(p -> p.prix() > 100)
    .findAny(); // pas de garantie d'ordre : généralement plus rapide en parallèle

catalogue.parallelStream().forEach(System.out::println);          // ordre non garanti
catalogue.parallelStream().forEachOrdered(System.out::println);   // ordre garanti, gain de parallélisme réduit
```

Si le besoin métier n'exige pas un ordre précis (« un produit qui correspond », pas « le premier du catalogue »), `findAny`/`forEach` sont préférables en parallèle.

### Exemple 3 — Accumulation sûre vs non sûre

```java
// Non sûr : ArrayList n'est pas thread-safe, écritures concurrentes non coordonnées
List<String> resultatFragile = new ArrayList<>();
catalogue.parallelStream().forEach(p -> resultatFragile.add(p.nom())); // à éviter

// Sûr : collect() gère la fusion des résultats partiels sans état partagé mutable exposé
List<String> resultatSur = catalogue.parallelStream()
    .map(Produit::nom)
    .collect(Collectors.toList());
```

`collect()` avec un `Collector` standard reste sûr en parallèle car chaque thread accumule dans son propre conteneur, fusionné ensuite par le combineur du collecteur — sans jamais exposer de structure mutable partagée au code appelant.

### Exemple 4 — reduce associatif obligatoire

```java
// Correct : Integer::sum est associatif, le résultat est indépendant du découpage
int totalQuantites = List.of(2, 5, 1, 3).parallelStream()
    .reduce(0, Integer::sum);

// Dangereux : la soustraction n'est pas associative
// (a - b) - c != a - (b - c) selon comment le pool découpe le stream
int resultatInstable = List.of(10, 3, 2).parallelStream()
    .reduce(0, (a, b) -> a - b); // résultat imprévisible en parallèle
```

### Quand paralléliser, et quand s'abstenir

| Facteur | Favorise le parallélisme | Défavorise le parallélisme |
|---|---|---|
| Volume | Grand nombre d'éléments | Petite collection |
| Coût par élément | Opération coûteuse en CPU | Opération triviale (une comparaison, une addition) |
| Source | `ArrayList`, tableau, `IntStream.range` (découpage efficace) | `LinkedList`, `Files.lines` (découpage coûteux ou impossible efficacement) |
| Nature de l'opération | Associative, sans effet de bord (`sum`, `count`, `collect`) | Effet de bord sur état partagé, ordre strict requis |
| Type de travail | Calcul CPU-bound | Attente d'E/S (réseau, disque, base de données) |

### Pièges courants

> **Paralléliser des appels bloquants (E/S, réseau).** Le pool commun ForkJoin a un nombre de threads limité, dimensionné pour du calcul CPU-bound. Y bloquer des threads sur des appels réseau ou disque les immobilise et prive le reste de l'application (et tout autre stream parallèle) de threads disponibles. Pour de nombreuses tâches bloquantes, les **threads virtuels** (voir le chapitre Concurrence) sont un outil bien plus adapté que les streams parallèles.

> **Modifier la source pendant le parcours d'un stream.** Ajouter ou retirer un élément d'une `List` pendant qu'un stream la parcourt (parallèle ou non) lève une `ConcurrentModificationException` — un stream lit sa source à la demande, il ne la copie pas au départ.

> **Supposer un gain sans mesurer.** Le surcoût de découpage/fusion du pool commun peut dépasser le gain de calcul réparti, surtout sur peu d'éléments ou du matériel avec peu de cœurs. Mesurer avec un vrai outil de micro-benchmark (JMH, voir le chapitre Performance) plutôt que de généraliser un résultat observé une fois.

### À retenir

- `parallelStream()`/`parallel()` répartissent le travail sur le pool commun ForkJoin (taille par défaut : cœurs disponibles − 1), **partagé** par toute l'application.
- Le parallélisme aide surtout avec un grand volume, une opération coûteuse en CPU et une source facile à découper — jamais garanti, toujours à mesurer.
- `findFirst`/`forEachOrdered` respectent l'ordre au prix d'un coût de coordination ; `findAny`/`forEach` sont plus rapides sans garantie d'ordre.
- Un `reduce` (ou un effet de bord dans `forEach`) doit rester associatif et sans état partagé mutable non synchronisé, sous peine de résultats incorrects et imprévisibles.
- Les streams parallèles ciblent le calcul CPU-bound ; pour des tâches nombreuses et bloquantes (E/S), préférer les threads virtuels (chapitre Concurrence).
