---
id: jokers-pecs
chapitre: generiques
ordre: 2
titre: "Les jokers et PECS"
termes:
  - terme: "Joker (wildcard, ?)"
    definition: "Argument de type inconnu, noté `?`, utilisé là où le type exact importe peu. `List<?>` signifie « une liste d'un type précis mais non spécifié », à ne pas confondre avec `List<Object>`."
  - terme: "Joker borné supérieurement (? extends T)"
    definition: "`? extends T` signifie « T, ou une sous-classe de T, mais on ne sait pas laquelle ». On peut **lire** des `T` en toute sécurité, mais on ne peut **rien écrire** (à part `null`) : le type exact réel pourrait être une sous-classe plus restrictive."
  - terme: "Joker borné inférieurement (? super T)"
    definition: "`? super T` signifie « T, ou une super-classe de T ». On peut **écrire** des `T` en toute sécurité, mais une lecture ne renvoie que des `Object` : on ne connaît pas le type exact au-dessus de T."
  - terme: PECS
    definition: "Mnémonique de Joshua Bloch (*Effective Java*) : **Producer Extends, Consumer Super**. Un paramètre dont on ne fait que **lire** des valeurs (un producteur) se type en `? extends T` ; un paramètre dans lequel on ne fait qu'**écrire** (un consommateur) se type en `? super T`."
  - terme: "Joker non borné (?)"
    definition: "`List<?>` sans `extends` ni `super` : équivalent à `? extends Object`. On peut lire les éléments comme des `Object`, mais rien n'y est ajoutable (à part `null`) — contrairement à `List<Object>`, qui accepte l'ajout de n'importe quel objet."
  - terme: Capture de joker
    definition: "Mécanisme interne par lequel le compilateur associe temporairement le `?` d'un paramètre à un type concret précis (mais inconnu du code appelant) pour vérifier la cohérence des appels à l'intérieur d'une méthode générique."
quiz:
  - question: "Dans Collections.copy(List<? super T> dest, List<? extends T> src), quel est le rôle de chaque joker ?"
    choix:
      - "src est un producteur (on y lit des T, donc extends), dest est un consommateur (on y écrit des T, donc super) — c'est le principe PECS"
      - "src est un consommateur et dest un producteur, l'inverse de ce que suggèrent les noms"
      - "Les deux jokers sont interchangeables, extends et super ont le même effet ici"
      - "? super T et ? extends T ne servent qu'à afficher un avertissement, sans effet réel sur ce qui compile"
    reponse: 0
    explication: "copy() lit chaque élément de src (un producteur de T, donc ? extends T) pour l'écrire dans dest (un consommateur de T, donc ? super T). C'est l'exemple canonique de PECS dans la bibliothèque standard : Producer Extends, Consumer Super."
  - question: "Que se passe-t-il à la compilation de ce code ?"
    code: |
      List<? extends Number> nombres = new ArrayList<Integer>();
      nombres.add(10);
    choix:
      - "Erreur de compilation sur add(10) : le type réel de la liste (peut-être une List<Double>) est inconnu, ajouter un Integer n'est pas sûr"
      - "Ça compile, 10 est autoboxé en Integer et ajouté normalement"
      - "Ça compile mais lève une ClassCastException à l'exécution"
      - "Erreur de compilation dès la déclaration de la variable nombres"
    reponse: 0
    explication: "? extends Number signifie « Number ou une sous-classe inconnue ». Le compilateur ne peut pas garantir que la liste réelle accepte un Integer (elle pourrait être une List<Double>), donc tout add() autre que add(null) est refusé. On peut en revanche lire ses éléments comme des Number sans problème."
  - question: "Quelle affirmation distingue correctement List<?> de List<Object> ?"
    choix:
      - "List<Object> accepte l'ajout de n'importe quel objet ; List<?> n'accepte aucun ajout (à part null), car son type réel exact reste inconnu du compilateur"
      - "Les deux types sont strictement équivalents et interchangeables partout"
      - "List<?> ne peut contenir que des instances de String"
      - "List<Object> ne peut pas être passée à une méthode qui attend un List<?>"
    reponse: 0
    explication: "List<Object> EST un type concret dont l'élément est Object : on peut y ajouter n'importe quoi. List<?> représente une liste d'un type précis mais inconnu (par exemple List<String> reçue par une méthode) : le compilateur interdit d'y ajouter quoi que ce soit pour ne pas violer ce type réel caché."
---

## Essentiel

Un **joker** (`?`) représente un type inconnu là où le type exact n'a pas besoin d'être nommé. Il existe trois formes :

```java
List<?> uneListe;                 // un type inconnu, quel qu'il soit
List<? extends Number> lecture;   // Number ou une sous-classe inconnue : on peut LIRE des Number
List<? super Integer> ecriture;   // Integer ou une super-classe inconnue : on peut ÉCRIRE des Integer
```

Le principe **PECS** (*Producer Extends, Consumer Super*, formulé par Joshua Bloch) donne la règle de choix :

- Un paramètre dont la méthode ne fait que **lire** des valeurs (un **producteur**) se type en `? extends T`.
- Un paramètre dans lequel la méthode ne fait qu'**écrire** des valeurs (un **consommateur**) se type en `? super T`.

```java
// source produit des T (lecture) -> extends ; destination consomme des T (écriture) -> super
public static <T> void copier(List<? extends T> source, List<? super T> destination) {
    for (T element : source) {
        destination.add(element);
    }
}

List<Integer> entiers = List.of(1, 2, 3);
List<Number> nombres = new ArrayList<>();
copier(entiers, nombres); // List<Integer> comme source d'une méthode qui attend un producteur de Number
```

Sans jokers, `copier` n'accepterait que `List<T>` exactement — impossible de passer une `List<Integer>` là où une `List<Number>` est attendue (les génériques sont invariants, voir la leçon précédente). Les jokers réintroduisent de la flexibilité, sans réintroduire de risque de type.

## Détail

### Comment lire les jokers

- **`? extends T`** (borné supérieurement) : « un type inconnu, sous-type de `T` ». On peut lire un élément et le traiter comme un `T` en toute sécurité. On ne peut **rien écrire** dedans (à part `null`) : la liste pourrait réellement être une `List<Chien>` et l'écriture d'un `Chat` y serait invalide.
- **`? super T`** (borné inférieurement) : « un type inconnu, super-type de `T` ». On peut écrire un `T` (ou un sous-type de `T`) en toute sécurité. En lecture, seul `Object` est garanti : la liste pourrait réellement être une `List<Object>`.
- **`?`** (non borné) : équivalent à `? extends Object`. Lecture possible en `Object`, aucune écriture possible (à part `null`).

### Exemple 1 — Producteur : lire sans savoir écrire

```java
public static double sommer(List<? extends Number> valeurs) {
    double total = 0;
    for (Number n : valeurs) {   // lecture : toujours valide
        total += n.doubleValue();
    }
    return total;
}

sommer(List.of(1, 2, 3));         // List<Integer>
sommer(List.of(1.5, 2.5));        // List<Double>
```

`sommer` ne fait que **lire** des nombres : `? extends Number` accepte n'importe quelle `List<X>` où `X` hérite de `Number`, ce qu'un simple `List<Number>` interdirait.

### Exemple 2 — Consommateur : écrire sans savoir lire précisément

```java
public static void remplirAvecPromo(List<? super ProduitEnPromo> destination) {
    destination.add(new ProduitEnPromo("Casque", 39.90));
    destination.add(new ProduitEnPromo("Clavier", 59.90));
}

List<Produit> catalogue = new ArrayList<>(); // Produit est une super-classe de ProduitEnPromo
remplirAvecPromo(catalogue);
```

`remplirAvecPromo` ne fait qu'**écrire** des `ProduitEnPromo` : `? super ProduitEnPromo` accepte toute liste dont le type est `ProduitEnPromo` ou un de ses ancêtres, comme `List<Produit>`.

### Exemple 3 — Signatures de la bibliothèque standard qui illustrent PECS

```java
// Comparator.comparing : la fonction consomme un T (super) et produit une clé U (extends)
static <T, U extends Comparable<? super U>> Comparator<T> comparing(
        Function<? super T, ? extends U> keyExtractor)

// Stream.map : la fonction consomme un T (super) et produit un R (extends)
<R> Stream<R> map(Function<? super T, ? extends R> mapper)

// Collection.addAll : c est un producteur d'éléments à ajouter à this
boolean addAll(Collection<? extends E> c)
```

Dans `Function<? super T, ? extends R>`, le paramètre d'entrée de la fonction (`T`) est **consommé** par la fonction (elle le reçoit) donc `super` ; sa sortie (`R`) est **produite** par la fonction donc `extends`. Même logique dans les trois signatures : ce qui entre est consommé (`super`), ce qui sort est produit (`extends`).

```java
List<Produit> produits = List.of(new Produit("Casque", 39.90), new Produit("Clavier", 59.90));

produits.stream()
        .map(Produit::nom)                                    // Function<? super Produit, ? extends String>
        .sorted(Comparator.comparing(String::length))          // Function<? super String, ? extends Integer>
        .forEach(System.out::println);
```

### Tableau récapitulatif

| Joker | Lecture | Écriture | Cas d'usage typique |
|---|---|---|---|
| `? extends T` | Oui, comme `T` | Non (sauf `null`) | Paramètre **producteur** : on lit ses éléments |
| `? super T` | Non (sauf `Object`) | Oui, `T` ou sous-type | Paramètre **consommateur** : on y écrit des éléments |
| `?` | Oui, comme `Object` | Non (sauf `null`) | Type réellement indifférent, ni lu en détail ni modifié |
| `T` (sans joker) | Oui, comme `T` | Oui, `T` | Le paramètre doit à la fois produire **et** consommer le même `T` |

### Quand utiliser un joker plutôt qu'un paramètre de type nommé

Utiliser un joker quand le type ne sert **qu'une fois** dans la signature (un seul paramètre, ou un paramètre indépendant du retour). Garder un paramètre de type nommé (`<T>`) dès que ce même type doit **relier plusieurs éléments** de la signature — par exemple si la méthode doit retourner un `T` cohérent avec un paramètre d'entrée, ou si deux paramètres doivent obligatoirement partager le même type exact.

```java
// Joker suffisant : le type ne sert qu'à afficher, aucune relation à préserver
static void afficherTout(List<?> elements) {
    for (Object e : elements) {
        System.out.println(e);
    }
}

// Paramètre de type nommé nécessaire : T relie l'entrée et la sortie
static <T> T premierOuDefaut(List<T> liste, T valeurParDefaut) {
    return liste.isEmpty() ? valeurParDefaut : liste.get(0);
}
```

### Pièges courants

> **Utiliser `? extends T` pour un paramètre dans lequel on veut aussi écrire.** Le code `liste.add(element)` ne compile jamais sur un `List<? extends T>`, quelle que soit la variable ; c'est une propriété du joker, pas un bug ponctuel. Si la méthode doit lire **et** écrire, un joker borné ne convient pas — il faut souvent un paramètre de type nommé `T`.

> **Confondre `List<?>` et `List<Object>`.** `List<Object>` est un type concret qui accepte n'importe quel objet en écriture. `List<?>` représente un type précis mais inconnu (peut-être `List<String>` en réalité) : le compilateur interdit toute écriture pour ne pas risquer d'y placer un type incompatible.

> **Utiliser `? super T` uniquement pour lire.** Une lecture sur `List<? super T>` ne renvoie que des `Object`, jamais des `T` — un cast serait nécessaire et non garanti sûr. Si le but principal est de lire des `T`, c'est `? extends T` qu'il faut, pas `? super T`.

### À retenir

- `? extends T` : on **lit** des `T` en sécurité, on n'écrit rien (sauf `null`) — un **producteur**.
- `? super T` : on **écrit** des `T` en sécurité, on ne lit que des `Object` — un **consommateur**.
- PECS : *Producer Extends, Consumer Super* — la règle mnémotechnique pour choisir entre les deux.
- La bibliothèque standard applique PECS partout où une fonction transforme une entrée en sortie : `Function<? super T, ? extends R>` dans `Stream.map`, `Comparator.comparing`, etc.
- Un joker suffit quand le type ne relie qu'un seul point de la signature ; un paramètre de type nommé (`<T>`) devient nécessaire dès qu'il faut garantir la cohérence entre plusieurs paramètres ou avec le retour.
