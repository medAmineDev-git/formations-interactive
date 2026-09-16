---
id: streams-bases
chapitre: streams
ordre: 1
titre: "Comprendre un stream"
termes:
  - terme: Stream
    definition: "Une **séquence d'éléments** sur laquelle on décrit un calcul en chaîne (filtrer, transformer, agréger…). Un stream **ne stocke rien** : ce n'est pas une structure de données, seulement une abstraction de traitement qui lit sa source à la demande."
  - terme: Pipeline
    definition: "L'enchaînement complet d'un traitement par stream : une **source** (`list.stream()`…), zéro ou plusieurs **opérations intermédiaires** (`filter`, `map`…) et exactement une **opération terminale** (`collect`, `forEach`…) qui déclenche réellement le calcul."
  - terme: Opération intermédiaire
    definition: "Opération qui renvoie un nouveau `Stream` (`filter`, `map`, `sorted`…) sans rien exécuter immédiatement. Elle se contente d'enregistrer une étape du pipeline ; le traitement effectif attend l'opération terminale."
  - terme: Opération terminale
    definition: "Opération qui **déclenche l'évaluation** du pipeline et produit un résultat (une valeur, une collection) ou un effet de bord (`forEach`), puis **consomme** le stream : celui-ci devient inutilisable ensuite."
  - terme: Paresse (laziness)
    definition: "Propriété des opérations intermédiaires : elles ne font aucun travail tant qu'aucune opération terminale n'a été appelée. Sans opération terminale, un pipeline entier ne s'exécute jamais."
  - terme: "IntStream / LongStream / DoubleStream"
    definition: "Variantes **spécialisées pour les types primitifs** (`int`, `long`, `double`) qui évitent l'autoboxing et ajoutent des opérations numériques (`sum()`, `average()`, `summaryStatistics()`)."
  - terme: "Stream.iterate / Stream.generate"
    definition: "Deux façons de créer un stream **potentiellement infini** : `iterate` applique une fonction de façon répétée à partir d'une valeur de départ, `generate` appelle un `Supplier` à chaque élément. Toujours les borner avec `limit(n)` (ou une condition d'arrêt pour `iterate`), sous peine de boucle infinie."
quiz:
  - question: "Que se passe-t-il si on appelle deux fois une opération terminale sur le même objet Stream ?"
    code: |
      Stream<String> categories = List.of("Livres", "Jeux", "Musique").stream();
      long total = categories.count();
      categories.forEach(System.out::println);
    choix:
      - "Le code compile et affiche les trois catégories normalement"
      - "IllegalStateException : le stream a déjà été consommé par count()"
      - "Le deuxième appel renvoie un stream vide silencieusement"
      - "NullPointerException, car categories vaut null après count()"
    reponse: 1
    explication: "Un stream ne se parcourt qu'une seule fois : la première opération terminale (count()) le consomme. Toute nouvelle opération sur le même objet Stream lève IllegalStateException (« stream has already been operated upon or closed »). Il faut recréer un stream depuis la source (categories.stream() à nouveau si la source est une collection)."
  - question: "Pourquoi ce pipeline ne s'exécute-t-il jamais ?"
    code: |
      List<String> produits = List.of("Clavier", "Souris", "Écran");
      produits.stream()
          .filter(p -> p.startsWith("C"))
          .map(String::toUpperCase);
    choix:
      - "filter() et map() sont incompatibles entre eux"
      - "Il manque une opération terminale : sans elle, les opérations intermédiaires ne sont jamais déclenchées"
      - "produits.stream() doit être stocké dans une variable avant d'être utilisé"
      - "startsWith() n'existe pas sur les streams de chaînes"
    reponse: 1
    explication: "filter() et map() sont des opérations intermédiaires paresseuses : elles décrivent le traitement mais ne l'exécutent pas. Sans opération terminale (collect(), forEach(), count()…), rien ne se passe — le compilateur n'émet même pas d'erreur, ce qui rend l'oubli facile à manquer."
  - question: "Quelle est la meilleure raison de garder une boucle for classique plutôt qu'un stream ?"
    choix:
      - "Les boucles for sont toujours plus rapides que les streams"
      - "Un traitement qui doit s'arrêter tôt selon plusieurs conditions imbriquées, ou qui modifie plusieurs variables externes à chaque itération, reste souvent plus lisible en boucle"
      - "Les streams ne peuvent pas parcourir une List"
      - "Les streams ne fonctionnent qu'avec des types primitifs"
    reponse: 1
    explication: "Les streams excellent pour décrire des transformations et agrégations en chaîne, mais un algorithme avec plusieurs sorties anticipées, des compteurs multiples ou une logique de contrôle complexe reste souvent plus clair — et pas forcément plus lent — avec une boucle classique. Ce n'est pas une question de performance brute mais de lisibilité."
---

## Essentiel

Un **stream** décrit un calcul sur une séquence d'éléments : filtrer, transformer, agréger. Ce n'est **pas une structure de données** — il ne stocke rien, il lit sa source à la demande et ne se parcourt qu'**une seule fois**.

```java
List<String> categories = List.of("Livres", "Jeux", "Musique", "Jardin");

long nbCourtes = categories.stream()      // source
    .filter(c -> c.length() <= 5)         // opération intermédiaire
    .count();                             // opération terminale
```

Un pipeline a toujours cette forme : une **source** (`collection.stream()`, `Stream.of(...)`, `Arrays.stream(tableau)`, `Files.lines(chemin)`, `IntStream.range(0, 10)`…), zéro ou plusieurs **opérations intermédiaires** qui renvoient un nouveau stream, et exactement une **opération terminale** qui déclenche le calcul et produit un résultat.

Les opérations intermédiaires sont **paresseuses** : `filter` et `map` ne font rien tant qu'aucune opération terminale n'a été invoquée. C'est cette dernière qui parcourt réellement les éléments.

Un stream se **consomme une seule fois** : une fois l'opération terminale exécutée, réutiliser le même objet `Stream` lève une `IllegalStateException`. Pour retraiter les mêmes données, il faut recréer un stream depuis la source.

Pour les types primitifs (`int`, `long`, `double`), `IntStream`, `LongStream` et `DoubleStream` évitent l'autoboxing et ajoutent des opérations numériques (`sum()`, `average()`).

## Détail

### Comment ça marche

Un `Stream` ne contient pas ses éléments à l'avance : chaque opération terminale tire les éléments un par un depuis la source, les fait passer par **toute la chaîne d'opérations intermédiaires**, puis passe à l'élément suivant. Rien n'est calculé avant que l'opération terminale ne le demande, et rien n'est stocké entre les étapes — d'où l'impossibilité de réutiliser un stream déjà parcouru.

### Exemple 1 — Créer un stream depuis différentes sources

```java
List<String> produits = List.of("Clavier", "Souris", "Écran");

Stream<String> depuisCollection = produits.stream();
Stream<String> depuisValeurs = Stream.of("Clavier", "Souris", "Écran");
Stream<String> depuisTableau = Arrays.stream(new String[] { "Clavier", "Souris" });
IntStream depuisPlage = IntStream.range(0, 5);          // 0, 1, 2, 3, 4
IntStream depuisPlageIncluse = IntStream.rangeClosed(1, 5); // 1, 2, 3, 4, 5

try (Stream<String> lignes = Files.lines(Path.of("catalogue.csv"))) {
    long nbLignes = lignes.count();
}
```

`Files.lines` ouvre une ressource système (le fichier) : il faut l'utiliser dans un try-with-resources pour garantir sa fermeture, même si l'opération terminale n'est jamais atteinte à cause d'une exception.

### Exemple 2 — Streams potentiellement infinis

```java
// iterate : applique une fonction de façon répétée à partir d'un seed
Stream<Integer> puissancesDeDeux = Stream.iterate(1, n -> n * 2)
    .limit(5); // 1, 2, 4, 8, 16 — sans limit(), boucle infinie

// iterate avec condition d'arrêt (depuis Java 9) : plus besoin de limit()
Stream<Integer> jusqua100 = Stream.iterate(1, n -> n < 100, n -> n * 2);

// generate : appelle un Supplier à chaque élément
Stream<Double> alea = Stream.generate(Math::random).limit(3);
```

`Stream.iterate` et `Stream.generate` créent des streams sans fin définie. Il faut toujours les borner, soit avec `limit(n)`, soit avec la variante à trois arguments d'`iterate` qui fournit sa propre condition d'arrêt.

### Exemple 3 — Un stream ne se consomme qu'une fois

```java
Stream<String> stream = produits.stream();
stream.filter(p -> p.length() > 5).count(); // consomme le stream

stream.forEach(System.out::println);
// IllegalStateException: stream has already been operated upon or closed
```

Pour retraiter les mêmes données, il faut repartir de la source : `produits.stream()` à nouveau, pas réutiliser la variable `stream`.

### Exemple 4 — Streams primitifs et conversions

```java
List<String> produits = List.of("Clavier", "Souris", "Écran");

IntStream longueurs = produits.stream().mapToInt(String::length); // Stream<String> -> IntStream
int total = longueurs.sum();

IntStream nombres = IntStream.rangeClosed(1, 5);
List<Integer> liste = nombres.boxed().toList(); // IntStream -> Stream<Integer>
```

`mapToInt`/`mapToLong`/`mapToDouble` convertissent un `Stream<T>` en stream primitif ; `boxed()` fait l'inverse. Passer par les streams primitifs évite l'autoboxing pour des calculs numériques sur de grands volumes.

### Quand une boucle reste plus claire

| Situation | Préférer |
|---|---|
| Transformer, filtrer, agréger une collection en une expression | Stream |
| Plusieurs conditions de sortie anticipée imbriquées | Boucle `for`/`while` |
| Mise à jour de plusieurs variables externes à chaque itération | Boucle |
| Parcours avec index explicite nécessaire en permanence | Boucle (ou `IntStream.range` avec prudence) |
| Lecture d'un fichier ligne à ligne avec agrégation simple | Stream (`Files.lines`) |

### Pièges courants

> **Croire qu'un stream stocke des données.** `produits.stream()` recrée un nouveau stream à chaque appel car `produits` (la `List`) est la vraie source. C'est l'objet `Stream` lui-même, une fois obtenu, qui est à usage unique — pas la collection sous-jacente.

> **Oublier l'opération terminale.** Un pipeline sans opération terminale ne fait strictement rien : ni erreur de compilation, ni exécution. `filter` et `map` sans `collect`/`forEach`/`count` derrière sont du code mort.

> **Créer un stream infini sans le borner.** `Stream.iterate(0, n -> n + 1)` sans `limit()` ni condition d'arrêt bloque le programme dès qu'une opération terminale est appelée dessus.

### À retenir

- Un stream décrit un calcul, il ne stocke rien : pipeline = source + opérations intermédiaires (paresseuses) + une opération terminale (qui déclenche tout).
- Un stream se consomme une seule fois ; le réutiliser après une opération terminale lève `IllegalStateException`.
- `IntStream`/`LongStream`/`DoubleStream` évitent l'autoboxing ; `mapToInt`/`boxed()` font le pont avec `Stream<T>`.
- `Stream.iterate`/`Stream.generate` créent des streams potentiellement infinis : toujours les borner.
- Une boucle classique reste parfois plus lisible qu'un stream, notamment avec une logique de contrôle complexe.
