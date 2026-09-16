---
id: effacement-limites
chapitre: generiques
ordre: 3
titre: "Effacement de type et ses conséquences"
termes:
  - terme: "Effacement de type (type erasure)"
    definition: "Mécanisme par lequel le compilateur utilise les paramètres de type pour vérifier le code, puis les **retire** en générant le bytecode : `T` devient `Object` (ou sa borne), et `List<String>`/`List<Integer>` produisent exactement le même `.class` à l'exécution."
  - terme: "Type réifiable"
    definition: "Type dont l'information est **entièrement présente à l'exécution** : types non génériques, types bruts, et types paramétrés uniquement par des jokers non bornés (`List<?>`). `List<String>` n'est **pas** réifiable : c'est pour cela que `instanceof List<String>` et `new List<String>[10]` ne compilent pas."
  - terme: "Avertissement unchecked"
    definition: "Avertissement du compilateur signalant une opération dont il ne peut pas garantir la sûreté de type à cause de l'effacement (cast non vérifiable, type brut, varargs générique). À corriger si possible ; sinon, isoler avec `@SuppressWarnings(\"unchecked\")` sur le plus petit scope possible, avec un commentaire justifiant pourquoi c'est sûr."
  - terme: Pollution du tas (heap pollution)
    definition: "Situation où une variable d'un type paramétré référence en réalité un objet d'un type différent, en général via un tableau générique ou des varargs génériques mal utilisés. Elle ne se révèle qu'à l'exécution, en `ClassCastException`, souvent loin de sa cause."
  - terme: "@SafeVarargs"
    definition: "Annotation posée sur une méthode variadique à paramètre de type générique (`static <T> List<T> de(T... elements)`) : elle promet au compilateur que la méthode ne fait rien d'incorrect avec son tableau varargs interne, et supprime l'avertissement de pollution du tas. Utilisable seulement sur les méthodes `static`, `final`, les constructeurs, et les méthodes d'instance `private`."
  - terme: "Jeton de type (Class<T>)"
    definition: "Technique consistant à passer un objet `Class<T>` en paramètre pour disposer, à l'exécution, d'une information de type que l'effacement a fait disparaître de `T` lui-même — utile notamment pour créer un tableau générique via `java.lang.reflect.Array`."
quiz:
  - question: "Ce code compile-t-il ?"
    code: |
      List<String> liste = new ArrayList<>();
      if (liste instanceof List<String>) {
          System.out.println("liste de chaînes");
      }
    choix:
      - "Non : erreur de compilation, car List<String> n'est pas réifiable — l'effacement de type supprime le paramètre <String> à l'exécution, un instanceof ne peut le tester"
      - "Oui, et il affiche \"liste de chaînes\""
      - "Oui, mais il n'affiche rien : le test échoue toujours à l'exécution"
      - "Oui, mais uniquement si la liste a été créée avec le mot-clé var"
    reponse: 0
    explication: "instanceof exige un type réifiable, c'est-à-dire dont l'information est disponible à l'exécution. Or List<String> et List<Integer> partagent le même .class après effacement : impossible pour la JVM de les distinguer. Seul instanceof List<?> (joker non borné, réifiable) compile."
  - question: "Pourquoi ce code ne compile-t-il pas ?"
    code: |
      public class Traitement {
          public void traiter(List<String> chaines) { }
          public void traiter(List<Integer> entiers) { }
      }
    choix:
      - "Après effacement de type, les deux méthodes deviennent toutes les deux traiter(List) : signatures identiques, donc conflit (name clash) au niveau du bytecode"
      - "On ne peut jamais surcharger une méthode qui prend une List en paramètre"
      - "Il manque le mot-clé generic devant la classe Traitement"
      - "String et Integer doivent être déclarés comme paramètres de type de la classe avant de pouvoir être utilisés ainsi"
    reponse: 0
    explication: "Le compilateur efface List<String> et List<Integer> en un seul type List, car il ne peut générer qu'une seule version du bytecode. Les deux méthodes traiter(List) deviennent alors indiscernables : c'est un conflit de signatures (name clash), rejeté à la compilation, pas seulement une question de style."
  - question: "Que garantit concrètement l'annotation @SafeVarargs sur une méthode générique variadique ?"
    choix:
      - "Rien de vérifié par le compilateur : c'est une promesse du développeur que la méthode n'expose ni ne corrompt son tableau varargs interne, ce qui supprime l'avertissement de pollution du tas"
      - "Le compilateur analyse automatiquement le corps de la méthode et prouve l'absence de pollution du tas"
      - "Elle rend le paramètre de type T réifiable à l'intérieur de cette méthode"
      - "Elle transforme les arguments variadiques en une vraie List<T> typée à l'exécution"
    reponse: 0
    explication: "@SafeVarargs ne déclenche aucune vérification supplémentaire : elle indique au compilateur de faire confiance au développeur et de ne pas émettre l'avertissement unchecked sur ce point précis. Y recourir sur une méthode qui stocke réellement son tableau varargs ailleurs (et y écrit ensuite) réintroduit le risque qu'elle est censée écarter."
---

## Essentiel

Les génériques n'existent qu'à la **compilation**. Le compilateur les utilise pour vérifier le code, puis les **efface** : `T` devient `Object` (ou sa borne), et le bytecode généré ne contient plus aucune trace du paramètre de type. Ce choix — l'**effacement de type** — a été fait pour que le code générique reste compatible avec le bytecode et les bibliothèques compilées avant Java 5, qui ne connaissaient pas les génériques.

Conséquence directe : `List<String>` et `List<Integer>` produisent exactement le **même `.class`** à l'exécution. Cela interdit plusieurs choses qui semblent naturelles :

```java
// Aucun de ces trois ne compile
class Boite<T> {
    T[] tableau = new T[10];                 // erreur : generic array creation
}
if (objet instanceof List<String>) { }         // erreur : illegal generic type for instanceof
void traiter(List<String> l) { }
void traiter(List<Integer> l) { }              // erreur : same erasure, name clash
```

À la place : `instanceof List<?>` (joker non borné, réifiable) fonctionne ; un tableau générique se contourne via `Object[]` en interne ou un jeton `Class<T>` ; la surcharge par paramètre de type doit se remplacer par des noms de méthode différents.

L'effacement produit aussi des **avertissements « unchecked »** quand le compilateur ne peut pas garantir la sûreté d'une opération (cast, varargs génériques). Un dernier recours ciblé et commenté : `@SuppressWarnings("unchecked")`, jamais posé à la légère sur une classe entière.

## Détail

### Comment fonctionne l'effacement

Le compilateur vérifie tout le code générique avec les paramètres de type, puis génère le bytecode en les **remplaçant** par leur borne (`Object` si non borné), en insérant les **casts** nécessaires aux points de lecture. Une seule version du `.class` existe pour `Boite<T>`, quel que soit l'argument de type utilisé à l'appel.

```java
class Boite<T> {
    private T contenu;
    public T ouvrir() { return contenu; }
}
// Après effacement, approximativement :
class Boite {
    private Object contenu;
    public Object ouvrir() { return contenu; }
}
Boite<String> b = new Boite<>();
String s = b.ouvrir(); // le compilateur insère le cast (String) invisible dans le source
List<int> valeurs;      // ne compile pas : un paramètre de type doit être un type référence
List<Integer> valeurs;  // correct, via l'autoboxing
```

### Exemple 1 — Pas de tableau générique, et comment le contourner

```java
class Pile<T> {
    private Object[] elements = new Object[10]; // tableau d'Object en interne : autorisé
    private int taille = 0;

    void empiler(T element) { elements[taille++] = element; }

    @SuppressWarnings("unchecked") // sûr : seul empiler() écrit dans elements, toujours avec un T
    T depiler() { return (T) elements[--taille]; }
}
```

`new T[10]` refuse de compiler (« generic array creation ») : à l'exécution, un tableau connaît et vérifie le type réel de ses éléments (covariance des tableaux) ; un tableau de `T` effacé en `Object[]` casserait cette vérification. La solution courante : stocker un `Object[]` en interne, et caster localement au point de lecture, avec `@SuppressWarnings` réduit à cette seule ligne.

### Exemple 2 — Jeton de type pour créer un vrai tableau typé

```java
public static <T> T[] creerTableau(Class<T> type, int taille) {
    @SuppressWarnings("unchecked")
    T[] tableau = (T[]) java.lang.reflect.Array.newInstance(type, taille);
    return tableau;
}

String[] noms = creerTableau(String.class, 5); // Class<String> comme jeton de type
```

`Array.newInstance` sait créer un tableau du type exact passé en argument, à l'exécution — parce que `Class<T>` transporte, lui, une information de type qui survit à l'effacement. C'est le patron du **jeton de type**.

### Exemple 3 — Pollution du tas avec des varargs génériques

```java
static void danger(List<String>... listes) {
    Object[] tableau = listes;         // un tableau de List<String> est aussi un Object[]
    tableau[0] = List.of(42);          // compile : ajoute une List<Integer> dans le tableau
    String s = listes[0].get(0);       // ClassCastException ici, loin de la vraie erreur
}
```

Le compilateur avertit : « possible heap pollution from parameterized vararg type ». Le tableau varargs `listes`, une fois vu comme `Object[]`, accepte n'importe quel contenu ; l'incohérence ne se révèle qu'au moment de lire un élément comme `String`.

```java
@SafeVarargs // sûr uniquement parce que la méthode ne fait que lire, jamais écrire dans elements
static <T> List<T> de(T... elements) {
    return Arrays.asList(elements);
}
```

`@SafeVarargs` ne s'applique qu'aux méthodes `static`, `final`, aux constructeurs, et aux méthodes d'instance `private` — jamais à une méthode d'instance redéfinissable, où la promesse ne pourrait pas être garantie par toutes les sous-classes.

### Types réifiables et non réifiables

| Type | Réifiable ? | Pourquoi |
|---|---|---|
| `String`, `int`, `Produit` | Oui | Type non générique, information complète à l'exécution |
| `List` (type brut) | Oui | Aucun paramètre de type à vérifier |
| `List<?>` | Oui | Joker non borné : aucune information de type précise perdue |
| `List<String>`, `List<T>` | Non | Le paramètre de type est effacé, indisponible à l'exécution |
| `String[]`, `List<?>[]` | Oui | Tableau d'un type de composant réifiable |
| `List<String>[]` | Non | Tableau d'un type de composant non réifiable : création interdite |

`instanceof` et `new` (pour les tableaux) exigent un type réifiable : c'est la même cause profonde derrière l'interdiction de `instanceof List<String>` et de `new List<String>[10]`.

### Pièges courants

> **Poser `@SuppressWarnings("unchecked")` sur une méthode ou une classe entière « pour que ça compile ».** Ça masque aussi de vrais problèmes de type sans rapport avec la ligne visée. Toujours réduire le scope au minimum (une déclaration de variable si possible) et commenter pourquoi le cast est réellement sûr.

> **Croire que l'effacement empêche toute réflexion sur les génériques.** Le compilateur conserve certaines métadonnées (signature générique) accessibles par réflexion (`Method.getGenericParameterTypes()`), mais la JVM, elle, ne voit à l'exécution que le type effacé — `instanceof` et la création d'objets restent limités au type brut.

> **Appliquer `@SafeVarargs` sans vérifier que la méthode ne fait vraiment que lire son tableau varargs.** Si la méthode le stocke ailleurs (un champ, un tableau externe) puis y écrit, la pollution du tas reste possible : l'annotation aura seulement fait taire l'avertissement qui aurait pu la révéler.

### Où en est le projet Valhalla, et ce qu'il changerait

Le manque de génériques sur types primitifs (`List<int>` impossible aujourd'hui) découle directement de l'effacement combiné à la distinction primitif/objet en Java. Le **projet Valhalla** vise à terme une plus grande unification entre primitifs et objets, mais **aucune fonctionnalité cœur n'est finalisée à ce jour** (16 septembre 2026) : le premier preview d'une fonctionnalité cœur, **JEP 401 « Value Objects »**, n'est intégré que pour **JDK 28** (prévu vers mars 2027) et reste **absent de JDK 27**, la version la plus récente disponible.

La suite de la feuille de route — types null-restricted, tableaux améliorés, et surtout l'**unification primitifs/classes** qui permettrait un jour d'écrire `List<int>` sans effacement forcé vers `Integer` — reste très majoritairement **non livrée**, certains éléments n'étant encore qu'au stade de JEP *draft*. Aucune date n'est confirmée pour cette unification complète : les génériques sur types primitifs ne sont pas une fonctionnalité « bientôt disponible », mais un objectif de long terme, encore loin de sa livraison.

### À retenir

- L'effacement de type retire les paramètres de type à la compilation, pour rester compatible avec le bytecode et les bibliothèques pré-génériques.
- Conséquences directes : pas de `new T[]`, pas de `instanceof List<String>` (seulement `List<?>`), pas de surcharge distinguée par paramètre de type, pas de `List<int>`.
- Un seul `.class` existe par classe générique, quel que soit l'argument de type utilisé à l'appel.
- `@SuppressWarnings("unchecked")` : dernier recours, sur le plus petit scope possible, jamais une habitude.
- `@SafeVarargs` supprime l'avertissement de pollution du tas des varargs génériques, mais ne garantit rien par lui-même : la méthode doit réellement être sûre.
- Le projet Valhalla n'a livré, au 16/09/2026, aucune fonctionnalité cœur en version finale ; la généricité sur types primitifs reste un objectif de long terme, non planifié à une version précise.
