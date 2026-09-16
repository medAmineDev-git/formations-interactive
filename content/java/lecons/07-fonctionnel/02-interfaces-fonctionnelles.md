---
id: interfaces-fonctionnelles
chapitre: fonctionnel
ordre: 2
titre: Les interfaces fonctionnelles
termes:
  - terme: "@FunctionalInterface"
    definition: "Annotation optionnelle qui documente l'intention et fait vérifier par le compilateur qu'une interface ne déclare bien qu'**une seule** méthode abstraite. Sans elle, une interface à une seule méthode abstraite reste utilisable comme cible de lambda, mais sans ce filet de sécurité si une deuxième méthode abstraite est ajoutée par erreur."
  - terme: Function<T,R>
    definition: "Transforme une valeur de type `T` en une valeur de type `R` via `apply(T)`. Composable avec `andThen` (enchaîner après) et `compose` (enchaîner avant)."
  - terme: Predicate<T>
    definition: "Teste une valeur de type `T` et renvoie un `boolean` via `test(T)`. Composable avec `and`, `or` et `negate`."
  - terme: Consumer<T>
    definition: "Consomme une valeur de type `T` sans rien renvoyer (`void accept(T)`). Utilisé pour un effet de bord : afficher, enregistrer, envoyer."
  - terme: Supplier<T>
    definition: "Ne prend aucun argument et fournit une valeur de type `T` via `get()`. Utilisé pour différer un calcul ou une création d'objet jusqu'au moment où elle est réellement nécessaire."
  - terme: Variante primitive
    definition: "Version spécialisée d'une interface fonctionnelle pour `int`, `long` ou `double` (`IntPredicate`, `ToIntFunction<T>`, `IntUnaryOperator`…), qui évite l'autoboxing en travaillant directement sur le type primitif."
  - terme: Composition fonctionnelle
    definition: "Combiner plusieurs interfaces fonctionnelles en une seule via des méthodes par défaut (`andThen`, `compose`, `and`, `or`, `negate`) plutôt qu'en écrivant une nouvelle lambda qui répète la logique des précédentes."
quiz:
  - question: "Que fait ce code ?"
    code: |
      Function<Integer, Integer> doubler = x -> x * 2;
      Function<Integer, Integer> ajouterUn = x -> x + 1;

      Function<Integer, Integer> combinee = doubler.andThen(ajouterUn);
      System.out.println(combinee.apply(5));
    choix:
      - "Affiche 11 : d'abord doubler (5 → 10), puis ajouterUn (10 → 11)"
      - "Affiche 12 : d'abord ajouterUn (5 → 6), puis doubler (6 → 12)"
      - "Ne compile pas : `andThen` n'existe pas sur `Function`"
      - "Affiche 10 : `andThen` ignore la seconde fonction"
    reponse: 0
    explication: "`f.andThen(g)` applique d'abord `f`, puis `g` sur le résultat : ici doubler(5) = 10, puis ajouterUn(10) = 11. C'est `compose` qui inverse l'ordre : `f.compose(g)` applique `g` d'abord, puis `f`."
  - question: "Pourquoi utiliser `IntPredicate` plutôt que `Predicate<Integer>` pour filtrer un grand tableau d'entiers ?"
    choix:
      - "`IntPredicate` évite l'autoboxing de chaque `int` en `Integer`, ce que `Predicate<Integer>` impose à chaque appel"
      - "`IntPredicate` et `Predicate<Integer>` sont strictement identiques, seule la syntaxe change"
      - "`Predicate<Integer>` ne peut pas être utilisé avec une lambda"
      - "`IntPredicate` permet de tester plusieurs entiers à la fois en un seul appel"
    reponse: 0
    explication: "`Predicate<Integer>` force chaque `int` à être « boxé » en objet `Integer` pour respecter la généricité, ce qui crée des objets et sollicite le ramasse-miettes inutilement. `IntPredicate` déclare `test(int)` directement sur le type primitif, sans cette conversion — c'est exactement pour ce cas que les variantes primitives existent."
  - question: "Pourquoi ce code ne compile-t-il pas ?"
    code: |
      Function<String, Integer> parseur = s -> Integer.parseInt(s);

      List<String> valeurs = List.of("10", "abc", "30");
      Function<String, Integer> lectureFichier = s -> {
          return new java.io.BufferedReader(new java.io.FileReader(s)).read();
      };
    choix:
      - "`FileReader` n'existe pas en Java"
      - "`read()` lève `IOException`, une exception vérifiée, et `Function.apply` ne déclare aucune exception vérifiée dans sa signature"
      - "Une lambda ne peut jamais appeler de méthode d'un autre objet"
      - "`Function<String, Integer>` ne peut pas retourner un `int`"
    reponse: 1
    explication: "La méthode abstraite `apply(T)` de `Function` ne déclare `throws` aucune exception vérifiée : une lambda qui l'implémente ne peut donc pas laisser échapper une exception vérifiée comme `IOException`. Il faut soit l'attraper et la relancer en exception non vérifiée, soit écrire une interface fonctionnelle personnalisée qui déclare `throws IOException`."
---

## Essentiel

Une interface fonctionnelle est une interface avec **une seule méthode abstraite**. `@FunctionalInterface` documente cette intention et fait échouer la compilation si une deuxième méthode abstraite est ajoutée par erreur — elle est optionnelle mais recommandée.

`java.util.function` fournit les interfaces les plus courantes, à connaître avant d'en écrire une soi-même :

| Interface | Méthode abstraite | Usage typique |
|---|---|---|
| `Function<T,R>` | `R apply(T t)` | transformer une valeur |
| `BiFunction<T,U,R>` | `R apply(T t, U u)` | combiner deux valeurs en une |
| `Predicate<T>` | `boolean test(T t)` | tester une condition |
| `Consumer<T>` | `void accept(T t)` | effet de bord (afficher, enregistrer) |
| `Supplier<T>` | `T get()` | fournir une valeur à la demande |
| `UnaryOperator<T>` | `T apply(T t)` | transformer une valeur en une du **même type** |
| `BinaryOperator<T>` | `T apply(T t1, T t2)` | combiner deux valeurs du **même type** |

```java
Function<Produit, Double> prixTTC = p -> p.prixHT() * 1.20;
Predicate<Produit> enStock = p -> p.quantite() > 0;
Consumer<Produit> journaliser = p -> System.out.println("Traité : " + p.nom());
Supplier<Produit> defaut = () -> new Produit("Inconnu", 0.0);
```

Ces interfaces se **composent** sans écrire de nouvelle lambda : `Predicate.and`, `or`, `negate`, `Function.andThen`, `compose`. Des variantes primitives (`IntPredicate`, `ToIntFunction<T>`, `IntUnaryOperator`…) évitent l'autoboxing quand le type manipulé est `int`, `long` ou `double`.

## Détail

### Pourquoi c'est utile

Avant Java 8, chaque bibliothèque définissait ses propres interfaces à une méthode (comparateurs, écouteurs, filtres…), sans réutilisation possible. `java.util.function` fournit un vocabulaire standard : `Function`, `Predicate`, `Consumer` et `Supplier` couvrent l'immense majorité des besoins, ce qui évite de redéfinir une interface pour chaque cas d'usage et permet aux API (streams, `Optional`, `Map`…) de s'appuyer sur un socle commun.

### Exemple 1 — Composition de `Function`

```java
Function<String, String> nettoyer = String::trim;
Function<String, String> majuscules = String::toUpperCase;

Function<String, String> normaliser = nettoyer.andThen(majuscules);
normaliser.apply("  clavier  "); // "CLAVIER" : trim() puis toUpperCase()

Function<String, String> inverse = nettoyer.compose(majuscules);
inverse.apply("  clavier  "); // "  CLAVIER  " : toUpperCase() d'abord, trim() ensuite (rien à retirer)
```

`andThen` enchaîne **après** la fonction courante ; `compose` enchaîne **avant**. Utile pour construire un pipeline de transformations sans écrire de lambda intermédiaire qui répète la logique des deux fonctions.

### Exemple 2 — Composition de `Predicate`

```java
Predicate<Produit> enStock = p -> p.quantite() > 0;
Predicate<Produit> enPromo = p -> p.remise() > 0;

Predicate<Produit> disponibleEnPromo = enStock.and(enPromo);
Predicate<Produit> nonDisponible = enStock.negate();
Predicate<Produit> stockOuPromo = enStock.or(enPromo);

produits.stream().filter(disponibleEnPromo).toList();
```

Combiner des `Predicate` nommés rend l'intention explicite (`enStock.and(enPromo)`) et évite de dupliquer les conditions dans plusieurs lambdas éparpillées dans le code.

### Exemple 3 — Variantes primitives : éviter le boxing

```java
List<Integer> quantites = List.of(4, 12, 20, 3);

// Predicate<Integer> : chaque int est boxé en Integer à chaque appel de test()
Predicate<Integer> seuilBoxe = q -> q > 10;

// IntPredicate : travaille directement sur int, aucun boxing
IntPredicate seuilPrimitif = q -> q > 10;

int total = quantites.stream()
    .mapToInt(Integer::intValue)   // IntStream : flux de int primitifs
    .filter(seuilPrimitif)
    .sum();
```

Les variantes existent pour `int`, `long` et `double`, sous plusieurs formes : `IntFunction<R>` (prend un `int`, renvoie `R`), `ToIntFunction<T>` (prend `T`, renvoie un `int`), `IntUnaryOperator`, `IntPredicate`, `IntConsumer`, `IntSupplier`, etc. Sur de gros volumes, éviter l'autoboxing représente un vrai gain (moins d'objets créés, moins de pression sur le ramasse-miettes).

### Exemple 4 — Écrire sa propre interface fonctionnelle

```java
@FunctionalInterface
public interface CalculateurRemise {
    double appliquer(double prix, int quantite);
}

CalculateurRemise remiseFixe = (prix, quantite) -> prix * 0.9;
CalculateurRemise remiseParPalier = (prix, quantite) -> quantite >= 10 ? prix * 0.8 : prix;
```

Écrire sa propre interface a du sens quand les noms de `java.util.function` (`apply`, `test`, `accept`) nuiraient à la lisibilité du code métier, ou quand la signature ne correspond à aucune interface standard (ici, deux paramètres de types différents avec un retour `double` ne correspond à aucune interface prête à l'emploi hors `BiFunction`, moins parlante ici que `CalculateurRemise`).

### Le problème des exceptions vérifiées

Aucune méthode abstraite de `java.util.function` ne déclare `throws` d'exception vérifiée. Une lambda qui appelle du code pouvant lever une exception vérifiée (`IOException`, `SQLException`…) ne peut donc pas la laisser se propager telle quelle :

```java
Function<String, byte[]> lireFichier = chemin -> {
    try {
        return Files.readAllBytes(Path.of(chemin));
    } catch (IOException e) {
        throw new UncheckedIOException(e); // enveloppée en exception non vérifiée
    }
};
```

Deux solutions courantes : envelopper l'exception vérifiée dans une exception non vérifiée (`UncheckedIOException`, ou une exception métier), ou définir sa propre interface fonctionnelle dont la méthode déclare `throws` l'exception concernée — perdant alors la compatibilité directe avec les API qui attendent un `Function` standard.

### Pièges courants

> **Oublier `@FunctionalInterface` et casser accidentellement le contrat.** Sans l'annotation, ajouter une deuxième méthode abstraite à une interface censée rester fonctionnelle compile silencieusement, mais casse tout code qui l'utilisait comme cible de lambda. Avec l'annotation, cette erreur est détectée à la compilation.

> **Utiliser `Predicate<Integer>` (ou toute forme boxée) dans une boucle chaude.** Chaque `test()` autobox l'`int` en `Integer`, créant potentiellement un nouvel objet à chaque appel (le cache d'`Integer` ne couvre que -128 à 127). Sur un gros volume, préférer la variante primitive correspondante.

> **Laisser une exception vérifiée fuiter d'une lambda sans la gérer.** Le code ne compile pas si l'exception vérifiée n'est pas attrapée dans le corps de la lambda — l'erreur de compilation (« unhandled exception type IOException ») pointe souvent vers la lambda plutôt que vers l'appel réel, ce qui peut dérouter au premier abord.

### À retenir

- Une interface fonctionnelle a une seule méthode abstraite ; `@FunctionalInterface` fait vérifier ce contrat par le compilateur.
- `Function`, `BiFunction`, `Predicate`, `Consumer`, `Supplier`, `UnaryOperator`, `BinaryOperator` couvrent la majorité des besoins standards.
- Les variantes primitives (`IntPredicate`, `ToIntFunction`…) évitent l'autoboxing sur `int`, `long`, `double`.
- La composition (`andThen`, `compose`, `and`, `or`, `negate`) évite de réécrire une lambda pour combiner des comportements existants.
- Aucune méthode de `java.util.function` ne déclare d'exception vérifiée : il faut l'envelopper, ou écrire sa propre interface.
