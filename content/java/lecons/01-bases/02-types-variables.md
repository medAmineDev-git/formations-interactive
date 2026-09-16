---
id: types-variables
chapitre: bases
ordre: 2
titre: "Types, variables et opérateurs"
termes:
  - terme: Type primitif
    definition: "Un des 8 types intégrés au langage (`byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean`) : ni objet, ni `null` possible, stocké directement (pas de référence). Chacun a une taille fixe et une valeur par défaut."
  - terme: Type référence
    definition: "Tout type qui n'est pas primitif : classes (`String`, `Produit`…), tableaux, interfaces. Une variable de type référence contient une **adresse** vers l'objet en mémoire (ou `null` si elle ne pointe sur rien)."
  - terme: Autoboxing / unboxing
    definition: "Conversion automatique entre un type primitif et son wrapper objet (`int` ↔ `Integer`, `boolean` ↔ `Boolean`…). Pratique, mais source de pièges : comparaison avec `==` sur des objets, et `NullPointerException` si on déboxe un wrapper `null`."
  - terme: "var"
    definition: "Mot-clé qui déclare une variable **locale** en laissant le compilateur inférer son type à partir de la valeur assignée. Le type reste **statique** : il est fixé à la compilation, `var` n'est pas du typage dynamique. Utilisable uniquement pour les variables locales avec initialisation, pas pour les champs ni les paramètres de méthode ordinaires."
  - terme: "final"
    definition: "Modificateur qui interdit de réassigner une variable après sa première affectation. Sur une référence d'objet, seule la référence est figée : l'objet pointé peut rester modifiable."
  - terme: Transtypage (cast)
    definition: "Conversion explicite d'un type vers un autre, ex. `(int) 3.9`. Un **rétrécissement** (`double` → `int`, classe mère → fille) exige un cast explicite et peut perdre de l'information ou lever une exception ; un **élargissement** (`int` → `double`) est implicite."
  - terme: BigDecimal
    definition: "Classe représentant un nombre décimal en précision arbitraire, sans les erreurs d'arrondi binaire de `double`/`float`. Recommandée pour tout calcul monétaire."
quiz:
  - question: "Que vaut cette comparaison ?"
    code: |
      Integer a = 200;
      Integer b = 200;
      System.out.println(a == b);
    choix:
      - "true, car 200 == 200"
      - "false, car `==` compare les références et 200 sort du cache d'`Integer`"
      - "Une erreur de compilation"
      - "true uniquement en mode debug"
    reponse: 1
    explication: "`Integer` met en cache les valeurs de -128 à 127 (autoboxing) : dans cette plage, `==` peut sembler fonctionner par coïncidence. 200 est hors cache, donc `a` et `b` sont deux objets `Integer` distincts, et `==` compare des références, pas des valeurs. Il faut `a.equals(b)` (ou comparer des `int` primitifs)."
  - question: "Que se passe-t-il à l'exécution ?"
    code: |
      Map<String, Integer> stocks = new HashMap<>();
      int quantite = stocks.get("produit-inconnu");
    choix:
      - "quantite vaut 0"
      - "NullPointerException lors du déboxage de null en int"
      - "Erreur de compilation"
      - "quantite vaut -1"
    reponse: 1
    explication: "`get` renvoie `null` (clé absente), un `Integer`. L'affecter à un `int` déclenche un déboxage automatique (`intValue()`), impossible sur `null` : `NullPointerException`. Il faut vérifier la présence de la clé, ou utiliser `getOrDefault(\"produit-inconnu\", 0)`."
  - question: "Pourquoi éviter `double` pour représenter un prix en euros ?"
    code: |
      double prix = 0.1 + 0.2;
      System.out.println(prix);
    choix:
      - "`double` est trop lent pour des calculs financiers"
      - "La représentation binaire ne peut pas représenter exactement certains décimaux, d'où des erreurs d'arrondi cumulées"
      - "`double` ne peut pas stocker de nombre supérieur à 100"
      - "Ce n'est pas un problème, `double` convient parfaitement aux montants"
    reponse: 1
    explication: "`0.1 + 0.2` affiche `0.30000000000000004` : les flottants binaires (`float`, `double`) ne représentent pas exactement la plupart des décimaux, et ces erreurs s'accumulent au fil des calculs. Pour un montant monétaire, on utilise `BigDecimal` (idéalement construit depuis une `String`, ex. `new BigDecimal(\"0.1\")`) ou des entiers représentant des centimes."
---

## Essentiel

Java distingue deux familles de types.

**Types primitifs** (8 au total) : stockés directement, jamais `null`.

| Type | Taille | Plage / usage |
|---|---|---|
| `byte` | 8 bits | -128 à 127 |
| `short` | 16 bits | petits entiers |
| `int` | 32 bits | entier courant |
| `long` | 64 bits | grands entiers (suffixe `L`) |
| `float` | 32 bits | flottant, peu précis |
| `double` | 64 bits | flottant courant |
| `char` | 16 bits | un caractère UTF-16 |
| `boolean` | — | `true` / `false` |

**Types référence** : `String`, classes, tableaux, interfaces. Une variable référence contient une adresse vers l'objet, ou `null`.

```java
int quantite = 5;                 // primitif
String nom = "Clavier mécanique"; // référence
var prix = 49.90;                 // var : le compilateur infère double
final double TAUX_TVA = 0.20;     // final : jamais réassigné
```

`var` n'est pas du typage dynamique : le type est déduit **une fois**, à la compilation, à partir de la valeur d'initialisation, puis reste figé.

L'**autoboxing** convertit automatiquement entre primitif et wrapper (`int` ↔ `Integer`). Pratique, mais deux pièges classiques : comparer des wrappers avec `==` (compare les références, pas les valeurs), et déboxer un wrapper `null` (`NullPointerException`).

## Détail

### Pourquoi c'est utile

Choisir le bon type évite deux catégories d'erreurs : le **dépassement de capacité** (un `int` ne peut pas dépasser environ 2,1 milliards) et la **perte de précision** (un flottant binaire ne représente pas exactement des décimaux comme 0.1). Comprendre `var`, l'autoboxing et le cast permet aussi de lire du code Java moderne sans confusion.

### Exemple 1 — Valeurs par défaut

Les champs d'une classe (pas les variables locales) reçoivent une valeur par défaut s'ils ne sont pas initialisés :

```java
public class Compteur {
    int total;        // 0
    double moyenne;    // 0.0
    boolean actif;     // false
    String libelle;    // null
}
```

Une **variable locale**, elle, n'a pas de valeur par défaut : l'utiliser sans l'initialiser est une erreur de compilation.

### Exemple 2 — `var` : ce qu'elle fait et ne fait pas

```java
var quantite = 10;              // int, déduit du littéral
var nom = "Souris sans fil";    // String
var produits = new ArrayList<Produit>(); // ArrayList<Produit>

// quantite = "dix";  // erreur de compilation : le type reste int, figé
```

`var` réduit la verbosité, mais seulement pour les variables **locales avec initialisation immédiate** ; impossible sur un champ de classe, un paramètre de méthode classique, ou sans valeur initiale (`var x;` ne compile pas : rien à inférer).

### Exemple 3 — Transtypage (cast)

```java
double moyenne = 19.9;
int arrondi = (int) moyenne;       // 19 : cast explicite, tronque (ne pas confondre avec un arrondi)

Object objet = "Clavier";
String texte = (String) objet;     // cast explicite classe mère → fille

long grandNombre = 3_000_000_000L; // élargissement int → long implicite si littéral typé L
```

Un cast vers un type plus étroit (`double` → `int`) tronque sans avertissement ; un cast d'objet invalide (`(String) new Produit()`) lève une `ClassCastException` à l'exécution.

### Exemple 4 — `BigDecimal` pour un montant

```java
import java.math.BigDecimal;

BigDecimal prixUnitaire = new BigDecimal("19.90"); // depuis une String, pas un double
BigDecimal quantite = new BigDecimal("3");
BigDecimal total = prixUnitaire.multiply(quantite);

System.out.println(total); // 59.70
```

Construire un `BigDecimal` depuis un `double` (`new BigDecimal(19.90)`) reproduit l'imprécision binaire d'origine : toujours partir d'une `String` ou d'un `int`/`long`.

### Opérateurs courants

| Catégorie | Opérateurs | Remarque |
|---|---|---|
| Arithmétiques | `+ - * / %` | `/` entre deux `int` tronque (division entière) |
| Logiques | `&& \|\| !` | court-circuit : le second opérande n'est évalué que si nécessaire |
| Comparaison | `== != < > <= >=` | `==` sur des objets compare les références, pas le contenu |
| Ternaire | `condition ? a : b` | équivalent compact d'un `if`/`else` qui renvoie une valeur |

### Pièges courants

> **`==` sur des objets `Integer`, `Long`, etc.** Le cache d'autoboxing ne couvre que -128 à 127 : `Integer.valueOf(100) == Integer.valueOf(100)` est `true` par coïncidence, mais `Integer.valueOf(200) == Integer.valueOf(200)` est `false`. Toujours utiliser `.equals()` pour comparer des wrappers, ou rester en primitifs (`int`) quand c'est possible.

> **`NullPointerException` au déboxage.** Affecter un wrapper potentiellement `null` (ex. le retour d'une `Map.get`) à un primitif provoque un déboxage implicite qui échoue sur `null`. Vérifier la présence de la valeur, ou garder le type wrapper si `null` est une valeur légitime.

> **`double`/`float` pour des montants.** `0.1 + 0.2` n'affiche pas `0.3` exactement, à cause de la représentation binaire des flottants. Ces écarts s'accumulent sur beaucoup d'opérations. `BigDecimal` (construit depuis une `String`) est la solution standard pour l'argent.

### À retenir

- 8 types primitifs, jamais `null`, valeurs par défaut sur les champs (pas sur les variables locales).
- Types référence : contiennent une adresse, peuvent valoir `null`.
- `var` infère le type à la compilation à partir de la valeur d'initialisation : ce n'est pas du typage dynamique, et elle ne s'utilise que sur des variables locales initialisées.
- Autoboxing pratique mais deux pièges à connaître : `==` sur des wrappers, `NullPointerException` au déboxage d'un `null`.
- `BigDecimal` (depuis une `String`) pour tout calcul monétaire, jamais `double`/`float`.
