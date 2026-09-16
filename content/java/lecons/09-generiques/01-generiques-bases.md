---
id: generiques-bases
chapitre: generiques
ordre: 1
titre: "Écrire du code générique"
termes:
  - terme: Paramètre de type
    definition: "Variable représentant un type, déclarée entre chevrons (`<T>`) sur une classe, une interface ou une méthode. Elle est remplacée par un vrai type (`String`, `Produit`…) au moment de l'utilisation : `Boite<String>`, `Boite<Produit>`."
  - terme: Classe générique
    definition: "Classe déclarée avec un ou plusieurs paramètres de type (`class Boite<T>`), qui peut ainsi manipuler un type sans le figer à l'écriture. Le même code source sert pour `Boite<Produit>`, `Boite<Client>`, etc."
  - terme: Méthode générique
    definition: "Méthode qui déclare son propre paramètre de type, **avant** le type de retour (`static <T> T premier(List<T> liste)`), indépendamment du fait que sa classe soit générique ou non."
  - terme: "Type brut (raw type)"
    definition: "Utilisation d'un type générique sans indiquer son paramètre de type (`List` au lieu de `List<String>`). Compile avec un avertissement mais désactive les vérifications du compilateur : les erreurs de type ne sont détectées qu'à l'exécution, en `ClassCastException`. Hérité du code pré-Java 5, à éviter."
  - terme: "Borne (extends)"
    definition: "Restriction posée sur un paramètre de type avec `extends` (`<T extends Number>`) : `T` doit être `Number` ou une sous-classe. Permet d'appeler les méthodes de la borne sur des valeurs de type `T`, ce qu'un paramètre de type non borné n'autorise pas."
  - terme: "Opérateur diamant (<>)"
    definition: "Depuis Java 7, `<>` à droite du `new` laisse le compilateur déduire les arguments de type à partir du contexte : `List<Produit> produits = new ArrayList<>();` évite de les répéter."
  - terme: Invariance des génériques
    definition: "En Java, `List<Chien>` n'est **pas** un sous-type de `List<Animal>`, même si `Chien` hérite d'`Animal`. Contrairement aux tableaux (covariants), les types génériques sont invariants : c'est une protection contre les erreurs de type à l'exécution."
quiz:
  - question: "Que se passe-t-il à l'exécution de ce code ?"
    code: |
      List liste = new ArrayList(); // type brut
      liste.add("Casque");
      liste.add(42);
      String s = (String) liste.get(1);
    choix:
      - "Erreur de compilation, car on mélange String et Integer dans la même liste"
      - "ClassCastException à l'exécution, à la ligne du transtypage : Integer ne peut pas être casté en String"
      - "Le programme affiche \"42\" sans erreur, Java convertit automatiquement"
      - "ArrayIndexOutOfBoundsException, car liste.get(1) dépasse la taille"
    reponse: 1
    explication: "Avec un type brut, le compilateur n'exerce aucune vérification : liste.add(42) compile sans problème. L'erreur n'apparaît qu'à l'exécution, au transtypage explicite (String) liste.get(1), sous forme de ClassCastException. C'est exactement le problème que les génériques ont été conçus pour détecter à la compilation."
  - question: "Quelle déclaration de méthode générique statique est syntaxiquement correcte ?"
    choix:
      - "public static <T> T premierElement(List<T> liste)"
      - "public static T premierElement(List<T> liste)"
      - "public <T> static T premierElement(List<T> liste)"
      - "public static T<T> premierElement(List<T> liste)"
    reponse: 0
    explication: "Le paramètre de type d'une méthode générique se déclare entre chevrons juste avant le type de retour, après les modificateurs (public static). Sans ce <T> déclaratif, le compilateur ne sait pas d'où vient T et rejette la méthode."
  - question: "Que se passe-t-il à la compilation de ce code ?"
    code: |
      List<Chien> chiens = new ArrayList<>();
      List<Animal> animaux = chiens; // Chien hérite d'Animal
    choix:
      - "Erreur de compilation : List<Chien> n'est pas un sous-type de List<Animal>"
      - "Ça compile, puisque Chien hérite d'Animal, le polymorphisme s'applique aussi aux List"
      - "Ça compile, mais lève une exception au premier accès à animaux"
      - "Ça compile seulement si Animal est une interface"
    reponse: 0
    explication: "Les types génériques sont invariants : même si Chien hérite d'Animal, List<Chien> et List<Animal> sont deux types sans relation d'héritage entre eux. Si ce n'était pas le cas, on pourrait écrire animaux.add(new Chat()) sur une référence qui pointe en réalité vers une List<Chien> — une pollution de type que le compilateur interdit en amont."
---

## Essentiel

Avant les génériques (Java 5), une collection stockait des `Object` : tout y entrait, mais chaque lecture exigeait un **transtypage** (cast) dont le compilateur ne pouvait pas vérifier la validité. Une erreur de type ne se révélait qu'à l'exécution, en `ClassCastException`.

```java
List liste = new ArrayList();       // type brut : aucune vérification
liste.add("Casque");
liste.add(42);                       // compile sans problème
String s = (String) liste.get(1);   // ClassCastException à l'exécution
```

Les **génériques** déplacent cette vérification à la **compilation**. Une classe générique déclare un **paramètre de type** entre chevrons :

```java
public class Boite<T> {
    private T contenu;
    public void ranger(T valeur) { this.contenu = valeur; }
    public T ouvrir() { return contenu; }
}

Boite<String> boite = new Boite<>();   // <> : opérateur diamant
boite.ranger("Casque");
String s = boite.ouvrir();              // pas de cast, pas de risque
```

Une **méthode générique** déclare son propre paramètre de type avant le type de retour : `static <T> T premier(List<T> liste)`. Convention de nommage : `T` (Type), `E` (Element), `K`/`V` (Key/Value), `R` (Result).

Point piégeux : `List<Chien>` n'est **pas** un `List<Animal>`, même si `Chien` hérite d'`Animal` — les génériques sont **invariants** (la leçon suivante montre comment assouplir cela avec les jokers).

## Détail

### Pourquoi c'est utile

Sans générique, le compilateur ne peut rien garantir sur le contenu d'une collection : `List` accepte n'importe quel `Object`. Le prix de cette souplesse est payé plus tard, à l'exécution, sous forme de `ClassCastException` — souvent loin du code fautif. Les génériques rendent explicite, dans la signature même du type, ce qu'il est censé contenir, et laissent le compilateur refuser tout ce qui ne correspond pas.

### Exemple 1 — Classe générique avec plusieurs paramètres de type

```java
public class Paire<K, V> {
    private final K cle;
    private final V valeur;

    public Paire(K cle, V valeur) {
        this.cle = cle;
        this.valeur = valeur;
    }

    public K cle() { return cle; }
    public V valeur() { return valeur; }
}

Paire<String, Integer> stock = new Paire<>("CASQ-01", 42);
```

Une classe peut déclarer plusieurs paramètres de type, séparés par une virgule. `K` et `V` sont les conventions pour clé/valeur, à l'image de `Map<K, V>`.

### Exemple 2 — Interface générique

```java
public interface Depot<T> {
    void ajouter(T element);
    T recuperer(int id);
    int taille();
}

public class DepotProduits implements Depot<Produit> {
    private final List<Produit> produits = new ArrayList<>();

    @Override
    public void ajouter(Produit element) { produits.add(element); }

    @Override
    public Produit recuperer(int id) { return produits.get(id); }

    @Override
    public int taille() { return produits.size(); }
}
```

Une interface générique fixe un contrat paramétré par un type ; chaque implémentation choisit un type concret (ici `Produit`) à la place de `T`.

### Exemple 3 — Méthode générique et bornes

```java
// Paramètre de type propre à la méthode, indépendant de la classe
public static <T> T premier(List<T> liste) {
    if (liste.isEmpty()) {
        throw new NoSuchElementException("Liste vide");
    }
    return liste.get(0);
}

// Borne : T doit être Comparable à lui-même pour que compareTo soit utilisable
public static <T extends Comparable<T>> T maximum(List<T> valeurs) {
    T max = valeurs.get(0);
    for (T v : valeurs) {
        if (v.compareTo(max) > 0) {
            max = v;
        }
    }
    return max;
}

// Bornes multiples : une seule classe (en premier), puis des interfaces avec &
public static <T extends Number & Comparable<T>> boolean depasseSeuil(T valeur, T seuil) {
    return valeur.compareTo(seuil) > 0;
}
```

Sans `extends Comparable<T>`, `v.compareTo(max)` ne compilerait pas : le compilateur ne sait rien des méthodes disponibles sur un `T` non borné, à part celles d'`Object`.

### Exemple 4 — Diamant, var, et pourquoi List<Chien> n'est pas List<Animal>

```java
// Avant Java 7 : le type était répété des deux côtés
List<Produit> produitsAncien = new ArrayList<Produit>();

// Depuis Java 7 : l'opérateur diamant déduit le type à droite
List<Produit> produits = new ArrayList<>();

// var infère le type déclaré, ici List<Produit>, à partir du membre de droite
var commandes = new ArrayList<Commande>();

// Invariance : ceci ne compile PAS
List<Chien> chiens = new ArrayList<>();
List<Animal> animaux = chiens; // erreur de compilation
```

Si cette dernière affectation compilait, on pourrait écrire `animaux.add(new Chat())` sur une référence qui pointe en réalité vers la `List<Chien>` — un chat se retrouverait dans une liste censée ne contenir que des chiens. Le compilateur bloque ce scénario en amont en refusant la relation de sous-typage entre `List<Chien>` et `List<Animal>`. La leçon suivante montre comment retrouver de la flexibilité avec les jokers, sans réintroduire ce risque.

### Conventions de nommage des paramètres de type

| Lettre | Signification | Usage typique |
|---|---|---|
| `T` | Type | Paramètre de type générique, cas général |
| `E` | Element | Élément d'une collection (`List<E>`, `Iterator<E>`) |
| `K` / `V` | Key / Value | Clé et valeur d'une structure associative (`Map<K, V>`) |
| `R` | Result | Type de retour d'une opération générique |
| `N` | Number | Paramètre de type borné par `Number` |

### Pièges courants

> **Oublier qu'un type primitif ne peut pas être un argument de type.** `Boite<int>` ne compile pas ; il faut le type enveloppe `Boite<Integer>`. C'est une conséquence de l'effacement de type, détaillée dans la prochaine leçon.

> **Mélanger types bruts et génériques par habitude d'ancien code.** `List liste = new ArrayList<Produit>();` compile mais génère un avertissement « unchecked » et perd toute vérification côté `liste`. Toujours typer la variable elle-même : `List<Produit> liste = ...`.

> **Croire que `List<Chien>` hérite de `List<Animal>` par analogie avec `Chien extends Animal`.** Les types génériques sont invariants en Java : seule la relation entre paramètres de type déclarée explicitement (via les jokers, leçon suivante) permet ce genre de flexibilité, de façon contrôlée.

### À retenir

- Les génériques déplacent la détection des erreurs de type de l'exécution (`ClassCastException`) vers la compilation.
- Une classe, une interface ou une méthode peut déclarer un ou plusieurs paramètres de type ; une méthode générique les déclare avant son type de retour.
- Conventions : `T`, `E`, `K`/`V`, `R` — des lettres, pas des noms complets, pour bien les distinguer des vrais types.
- `<T extends X>` borne le paramètre de type et donne accès aux méthodes de `X` ; les bornes multiples s'écrivent `<T extends Classe & Interface1 & Interface2>`.
- Les génériques sont **invariants** : `List<Chien>` n'est pas un `List<Animal>`, même si `Chien` hérite d'`Animal`.
