---
id: references-methode
chapitre: fonctionnel
ordre: 3
titre: Les références de méthode
termes:
  - terme: Référence de méthode
    definition: "Syntaxe `Classe::methode` (ou `objet::methode`) qui désigne une méthode existante comme implémentation directe d'une interface fonctionnelle, sans écrire de lambda qui se contente de l'appeler."
  - terme: Référence à une méthode statique
    definition: "Forme `Classe::methodeStatique`. Équivaut à une lambda `(args) -> Classe.methodeStatique(args)`. Exemple : `Integer::parseInt`."
  - terme: Référence à une méthode d'instance d'un objet particulier
    definition: "Forme `objet::methode`, où `objet` est une variable déjà existante. Équivaut à `(args) -> objet.methode(args)`. Exemple : `System.out::println`."
  - terme: Référence à une méthode d'instance d'un type quelconque
    definition: "Forme `Type::methode`, sans objet particulier. Le premier paramètre de l'interface fonctionnelle devient le récepteur de l'appel. Équivaut à `(objet, args) -> objet.methode(args)`. Exemple : `String::toUpperCase` dans un `Function<String,String>`."
  - terme: Référence à un constructeur
    definition: "Forme `Classe::new`. Équivaut à `(args) -> new Classe(args)`. Exemple : `Produit::new` dans un `Supplier<Produit>` ou `Function<String,Produit>`."
quiz:
  - question: "À quelle forme de référence de méthode correspond `String::isEmpty` utilisé comme `Predicate<String>` ?"
    choix:
      - "Référence à une méthode statique"
      - "Référence à une méthode d'instance d'un objet particulier"
      - "Référence à une méthode d'instance d'un type quelconque : le paramètre du `Predicate` devient le récepteur de `isEmpty()`"
      - "Référence à un constructeur"
    reponse: 2
    explication: "`isEmpty()` est une méthode d'instance de `String`, appelée ici sans objet particulier désigné avant le `::`. Le paramètre reçu par `test(String s)` devient le récepteur de l'appel : c'est équivalent à `s -> s.isEmpty()`."
  - question: "Pourquoi cette référence de méthode est-elle ambiguë ?"
    code: |
      public class Produit {
          static boolean estValide(Produit p, String champ) { ... }
          boolean estValide(String champ) { ... }
      }

      BiFunction<Produit, String, Boolean> validateur = Produit::estValide;
    choix:
      - "Les deux méthodes `estValide` correspondent à la signature attendue : la statique directement (deux paramètres), l'instance en traitant le premier paramètre comme récepteur (« type quelconque ») et le second comme argument"
      - "`BiFunction` ne peut pas être utilisé avec une référence de méthode"
      - "`estValide` n'est pas un nom de méthode valide pour une référence"
      - "Il manque `Produit::new` avant `estValide`"
    reponse: 0
    explication: "C'est un cas réel d'ambiguïté : la forme « méthode statique » (`estValide(Produit, String)`) et la forme « méthode d'instance de type quelconque » (premier paramètre = récepteur, second = argument de `estValide(String)`) correspondent toutes les deux à la signature `(Produit, String) -> Boolean` attendue par `BiFunction`. Le compilateur rejette la référence pour ambiguïté ; il faut soit renommer une des deux méthodes, soit repasser par une lambda explicite."
  - question: "Quelle référence de méthode remplace correctement cette lambda ?"
    code: |
      Function<String, Produit> creerProduit = nom -> new Produit(nom);
    choix:
      - "Produit::new"
      - "Produit::creer"
      - "new::Produit"
      - "Function::new"
    reponse: 0
    explication: "`Produit::new` est une référence à un constructeur : elle équivaut exactement à `nom -> new Produit(nom)`, à condition qu'un constructeur `Produit(String)` existe. C'est la forme la plus concise pour transformer une valeur en un nouvel objet."
---

## Essentiel

Une référence de méthode remplace une lambda qui ne fait **rien d'autre qu'appeler une méthode déjà existante**. Elle existe sous quatre formes :

```java
// 1. Méthode statique : Classe::methodeStatique
Function<String, Integer> parseur = Integer::parseInt;          // au lieu de s -> Integer.parseInt(s)

// 2. Méthode d'instance d'un objet particulier : objet::methode
Consumer<String> afficher = System.out::println;                 // au lieu de s -> System.out.println(s)

// 3. Méthode d'instance d'un type quelconque : Type::methode
Function<String, String> majuscules = String::toUpperCase;       // au lieu de s -> s.toUpperCase()

// 4. Constructeur : Classe::new
Supplier<ArrayList<String>> nouvelleListe = ArrayList::new;      // au lieu de () -> new ArrayList<>()
```

Une référence est plus lisible qu'une lambda quand elle se contente de **déléguer** un appel sans rien transformer. Elle devient moins lisible que la lambda équivalente dès qu'elle force à deviner la forme utilisée (statique ? instance ? quel objet est le récepteur ?), en particulier avec la troisième forme, où le premier paramètre de l'interface fonctionnelle devient implicitement le récepteur de l'appel.

Usage courant avec `Comparator` :

```java
List<Produit> produits = new ArrayList<>(...);
produits.sort(Comparator.comparing(Produit::nom));
produits.sort(Comparator.comparingDouble(Produit::prix).reversed());
```

## Détail

### Exemple 1 — Référence à une méthode statique

```java
List<String> textes = List.of("10", "25", "3");
List<Integer> nombres = textes.stream()
    .map(Integer::parseInt)      // équivaut à s -> Integer.parseInt(s)
    .toList();
```

Utile dès qu'une méthode utilitaire statique existe déjà (`Integer::parseInt`, `Math::sqrt`, ou une méthode statique métier comme `Produit::depuisLigneCsv`).

### Exemple 2 — Référence à une méthode d'instance d'un objet particulier

```java
StringBuilder journal = new StringBuilder();
Consumer<String> ajouterLigne = journal::append;   // équivaut à ligne -> journal.append(ligne)

produits.forEach(p -> ajouterLigne.accept(p.nom() + "\n"));
```

L'objet (`journal`) est fixé au moment où la référence est créée : chaque appel agit sur ce même objet, exactement comme le ferait la lambda équivalente qui le capture.

### Exemple 3 — Référence à une méthode d'instance d'un type quelconque

```java
List<String> noms = List.of("clavier", "Écran", "souris");
noms.stream()
    .sorted(String::compareToIgnoreCase)   // équivaut à (a, b) -> a.compareToIgnoreCase(b)
    .toList();

Function<Produit, String> extraireNom = Produit::nom; // équivaut à p -> p.nom()
```

Ici, aucun objet particulier n'est désigné avant `::` : c'est le **premier paramètre** reçu par la méthode abstraite de l'interface fonctionnelle qui devient le récepteur de l'appel, et les paramètres suivants (s'il y en a) sont transmis tels quels. C'est la forme la plus fréquente avec `Comparator.comparing` et les streams, mais aussi la plus facile à mal lire pour qui ne connaît pas la règle.

### Exemple 4 — Référence à un constructeur

```java
Function<String, Produit> creerVide = Produit::new;      // équivaut à nom -> new Produit(nom)
Supplier<List<Produit>> nouvelleListe = ArrayList::new;   // équivaut à () -> new ArrayList<>()

List<String> noms = List.of("Clavier", "Souris");
List<Produit> produits = noms.stream()
    .map(Produit::new)   // appelle le constructeur Produit(String) pour chaque nom
    .toList();
```

`Classe::new` fonctionne avec n'importe quel constructeur ; celui qui est réellement invoqué dépend de la signature attendue par l'interface fonctionnelle ciblée (ici, un seul paramètre `String` sélectionne `Produit(String)`).

### Références et surcharge

Quand une classe a plusieurs méthodes (ou constructeurs) du même nom, la référence est résolue **au moment de la compilation**, en fonction de la signature exacte attendue par l'interface fonctionnelle cible :

```java
public class Produit {
    Produit(String nom) { ... }
    Produit(String nom, double prix) { ... }
}

Function<String, Produit> c1 = Produit::new;                    // choisit Produit(String)
BiFunction<String, Double, Produit> c2 = Produit::new;           // choisit Produit(String, double)
```

Le compilateur choisit la surcharge dont la signature correspond à la méthode abstraite du type cible. Si plusieurs surcharges correspondent également bien, ou si aucune ne correspond exactement, la compilation échoue avec une erreur d'ambiguïté ou d'incompatibilité de type.

### Quand préférer la lambda

```java
// Référence : lisible, appel direct
Function<String, String> f1 = String::trim;

// Lambda préférable : la référence forcerait à écrire une méthode intermédiaire
Function<Produit, String> resume = p -> p.nom() + " (" + p.prix() + "€)";
```

Dès qu'un traitement combine plusieurs appels, une condition, ou une valeur littérale, la lambda reste plus directe qu'une référence — qui obligerait à extraire une méthode uniquement pour pouvoir la référencer.

### Pièges courants

> **Confondre la forme « objet particulier » et la forme « type quelconque ».** `produit::getNom` (objet déjà existant) et `Produit::getNom` (type, premier paramètre = récepteur) se ressemblent syntaxiquement mais ne s'utilisent pas dans le même contexte. Se tromper de forme casse la compatibilité avec la signature attendue par l'interface fonctionnelle ciblée.

> **Référencer une méthode surchargée sans que le contexte suffise à lever l'ambiguïté.** Si aucune signature ne correspond sans ambiguïté au type cible, le compilateur rejette la référence. Une lambda explicite, elle, force à écrire les types et lève l'ambiguïté à la main.

> **Utiliser une référence de méthode pour la seule raison qu'elle est plus courte, au prix de la lisibilité.** `Type::methode` sur une méthode au nom peu explicite, dans un contexte où le lecteur ne voit pas immédiatement quel paramètre devient le récepteur, peut être moins clair qu'une lambda `p -> p.methode()` qui rend la relation explicite.

### À retenir

- Quatre formes : méthode statique (`Classe::methode`), méthode d'instance d'un objet particulier (`objet::methode`), méthode d'instance d'un type quelconque (`Type::methode`), constructeur (`Classe::new`).
- Une référence de méthode n'est qu'un raccourci syntaxique pour une lambda qui se contenterait d'appeler cette méthode — aucune des deux n'est plus performante que l'autre.
- Dans la forme « type quelconque », le premier paramètre de l'interface fonctionnelle devient implicitement le récepteur de l'appel.
- La résolution de surcharge se fait à la compilation, selon la signature attendue par le type cible.
- `Comparator.comparing(Produit::champ)` est l'usage le plus courant avec les collections et les streams.
