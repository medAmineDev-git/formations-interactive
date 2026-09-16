---
id: egalite-comparaison
chapitre: poo-avancee
ordre: 4
titre: Égalité, hachage et comparaison
termes:
  - terme: "== (opérateur)"
    definition: "Sur des objets, compare les **références** (même emplacement en mémoire), pas leur contenu. Sur des types primitifs, compare les valeurs. Deux objets avec un contenu identique mais créés séparément sont `==` faux."
  - terme: "equals()"
    definition: "Méthode héritée d'`Object`, à redéfinir pour comparer le **contenu** de deux objets plutôt que leur référence. Par défaut (sans redéfinition), `equals()` se comporte exactement comme `==`."
  - terme: Contrat d'equals
    definition: "Règles que toute redéfinition d'`equals` doit respecter : réflexive (`x.equals(x)` vrai), symétrique (`x.equals(y)` ⟺ `y.equals(x)`), transitive (`x.equals(y)` et `y.equals(z)` ⟹ `x.equals(z)`), cohérente (résultat stable tant que les objets ne changent pas), et `x.equals(null)` toujours faux."
  - terme: Contrat equals/hashCode
    definition: "Deux objets **égaux** selon `equals()` doivent obligatoirement avoir le **même** `hashCode()`. L'inverse n'est pas exigé : deux objets non égaux peuvent avoir le même hashCode (une collision, normale et gérée)."
  - terme: Comparable
    definition: "Interface avec la méthode `compareTo(T autre)`, qui définit l'**ordre naturel** d'un type — un seul ordre possible par classe. Utilisée par `Collections.sort()`, `TreeSet`, `TreeMap` sans argument supplémentaire."
  - terme: Comparator
    definition: "Interface fonctionnelle avec la méthode `compare(T a, T b)`, qui définit un ordre **externe** à la classe comparée. Permet de définir plusieurs ordres différents (par prix, par nom…) sans toucher à la classe elle-même."
quiz:
  - question: "Qu'affiche ce code ?"
    code: |
      String a = new String("café");
      String b = new String("café");
      System.out.println(a == b);
      System.out.println(a.equals(b));
    choix:
      - "true puis true"
      - "false puis true"
      - "true puis false"
      - "false puis false"
    reponse: 1
    explication: "`new String(...)` crée systématiquement une nouvelle référence, distincte du pool de chaînes : `a == b` est donc `false`. `String` redéfinit `equals()` pour comparer le contenu caractère par caractère : `a.equals(b)` est `true`, car les deux chaînes contiennent \"café\"."
  - question: "Pourquoi ce `Client` posera-t-il problème dans une `HashMap` ?"
    code: |
      public class Client {
          private final String email;

          public Client(String email) { this.email = email; }

          @Override
          public boolean equals(Object o) {
              if (!(o instanceof Client autre)) return false;
              return email.equals(autre.email);
          }
          // hashCode() n'est pas redéfini
      }
    choix:
      - "`equals` est mal écrit : il devrait comparer les références"
      - "`hashCode()` n'a pas été redéfini avec `equals()` : deux clients avec le même email peuvent avoir des `hashCode()` différents, donc être stockés dans des buckets différents et introuvables l'un par l'autre dans une `HashMap`"
      - "`instanceof` ne peut pas être utilisé dans `equals`"
      - "Ce code ne compile pas"
    reponse: 1
    explication: "Le contrat impose que deux objets égaux selon `equals()` aient le **même** `hashCode()`. Ici, `hashCode()` reste celui d'`Object` (basé sur l'identité), donc deux `Client` avec le même email peuvent avoir des hashCodes différents. Une `HashMap` utilise `hashCode()` pour choisir le bucket : `map.get(nouveauClientMemeEmail)` peut chercher dans le mauvais bucket et ne jamais trouver l'entrée, même si `equals()` aurait renvoyé `true`."
  - question: "Que se passe-t-il si `compareTo` n'est pas cohérent avec `equals` sur une classe utilisée dans un `TreeSet` ?"
    code: |
      public class Produit implements Comparable<Produit> {
          String nom;
          double prix;

          @Override
          public int compareTo(Produit autre) {
              return Double.compare(this.prix, autre.prix); // ignore le nom
          }
          // equals() compare nom ET prix
      }
    choix:
      - "Aucun risque, `TreeSet` utilise toujours `equals()` pour détecter les doublons"
      - "Deux produits de noms différents mais de même prix sont considérés comme des doublons par le `TreeSet` (un seul est conservé), alors qu'`equals()` les distinguerait"
      - "Le `TreeSet` lève une exception au premier ajout"
      - "`compareTo` doit obligatoirement comparer les mêmes champs qu'`equals`, sinon le code ne compile pas"
    reponse: 1
    explication: "Un `TreeSet` (et `TreeMap`) utilise exclusivement `compareTo` (ou un `Comparator` fourni) pour déterminer l'égalité entre éléments, pas `equals()`. Si `compareTo` renvoie 0 pour deux produits de même prix mais de noms différents, le `TreeSet` les traite comme des doublons et n'en garde qu'un — un comportement silencieusement incohérent avec `equals()`, qui lui les distinguerait. La documentation de `Comparable` recommande explicitement que `compareTo` soit cohérent avec `equals`."
---

## Essentiel

`==` compare des **références** sur des objets (le même emplacement en mémoire), jamais leur contenu :

```java
Produit p1 = new Produit("Clavier", 49.90);
Produit p2 = new Produit("Clavier", 49.90);

p1 == p2;        // false : deux objets distincts
p1.equals(p2);   // dépend de la redéfinition d'equals()
```

Sans redéfinition, `equals()` hérité d'`Object` se comporte exactement comme `==`. Pour comparer le **contenu**, il faut redéfinir `equals()` — et, systématiquement en même temps, `hashCode()` :

```java
public class Produit {
    private final String nom;
    private final double prix;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Produit autre)) return false;
        return Double.compare(prix, autre.prix) == 0 && Objects.equals(nom, autre.nom);
    }

    @Override
    public int hashCode() {
        return Objects.hash(nom, prix);
    }
}
```

**Règle absolue** : deux objets égaux selon `equals()` doivent avoir le **même** `hashCode()`. Casser cette règle rend un objet introuvable dans une `HashMap` ou un `HashSet`, même après un `equals()` qui aurait renvoyé `true`.

Pour **trier** ou **ordonner**, deux interfaces distinctes : `Comparable` définit un **ordre naturel unique** par classe (`compareTo`), `Comparator` définit un **ordre externe**, autant qu'on veut (`compare`).

## Détail

### Pourquoi c'est utile

Toute collection basée sur le hachage (`HashMap`, `HashSet`) ou sur un ordre (`TreeMap`, `TreeSet`, tri) dépend directement de la correction d'`equals`, `hashCode` et `compareTo`. Une redéfinition incomplète ou incohérente ne provoque en général **aucune erreur de compilation ni exception immédiate** — le bug se manifeste plus tard, silencieusement, sous la forme d'un objet « perdu » dans une collection ou d'un tri incohérent.

### Exemple 1 — Le contrat d'`equals`

```java
Produit a = new Produit("Clavier", 49.90);
Produit b = new Produit("Clavier", 49.90);
Produit c = new Produit("Clavier", 49.90);

a.equals(a);              // réflexif : toujours true
a.equals(b) == b.equals(a);              // symétrique : même résultat dans les deux sens
(a.equals(b) && b.equals(c)) ? a.equals(c) : true; // transitif
a.equals(null);            // toujours false, jamais d'exception
```

Un `equals` mal écrit peut sembler correct sur des cas simples et casser un de ces principes dans un cas limite (héritage, valeurs `null`, comparaison partielle). Les frameworks de test et les IDE peuvent générer une implémentation correcte automatiquement.

### Exemple 2 — Le piège de l'héritage

```java
public class Personne {
    protected String nom;

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Personne autre)) return false;
        return Objects.equals(nom, autre.nom);
    }
}

public class Employe extends Personne {
    private String matricule;

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Employe autre)) return false;
        return super.equals(o) && Objects.equals(matricule, autre.matricule);
    }
}
```

`instanceof Employe` (plutôt que `getClass() == o.getClass()`) permet à une sous-classe éventuelle de rester compatible, mais peut casser la **symétrie** si une `Personne` non `Employe` est comparée à un `Employe` : `personne.equals(employe)` peut différer de `employe.equals(personne)`. En pratique, le choix le plus sûr est d'utiliser `equals`/`hashCode` uniquement sur des classes **finales**, ou de comparer strictement les mêmes classes avec `getClass()`.

### Exemple 3 — `Comparable` : un seul ordre naturel

```java
public class Produit implements Comparable<Produit> {
    private final String nom;
    private final double prix;

    @Override
    public int compareTo(Produit autre) {
        return Double.compare(this.prix, autre.prix); // ordre naturel : par prix croissant
    }
}

List<Produit> produits = new ArrayList<>(List.of(clavier, souris, ecran));
Collections.sort(produits); // utilise compareTo
```

`Comparable` répond à la question « quel est l'ordre par défaut de ce type ? ». Une classe ne peut avoir qu'un seul `compareTo`.

### Exemple 4 — `Comparator` : autant d'ordres que nécessaire

```java
Comparator<Produit> parNom = Comparator.comparing(Produit::nom);
Comparator<Produit> parPrixDesc = Comparator.comparingDouble(Produit::prix).reversed();
Comparator<Produit> parNomPuisPrix = Comparator.comparing(Produit::nom)
                                                .thenComparing(Produit::prix);

produits.sort(parPrixDesc);
```

`Comparator` répond à « comment trier **dans ce cas précis** ? », sans modifier la classe comparée — utile quand plusieurs tris différents sont nécessaires, ou quand la classe n'implémente pas `Comparable`.

### `Comparable` vs `Comparator`

| | `Comparable` | `Comparator` |
|---|---|---|
| Méthode | `compareTo(T autre)` | `compare(T a, T b)` |
| Implémenté par | La classe comparée elle-même | Une classe séparée (souvent une lambda) |
| Nombre d'ordres possibles | Un seul (l'ordre « naturel ») | Autant que nécessaire |
| Utilisé automatiquement par | `Collections.sort()`, `TreeSet`, `TreeMap` sans argument | `list.sort(comparator)`, ou passé explicitement à `TreeSet`/`TreeMap` |

### Pièges courants

> **Redéfinir `equals` sans redéfinir `hashCode`.** Deux objets égaux avec des `hashCode()` différents (celui hérité d'`Object`, basé sur l'identité) se retrouvent dans des « emplacements » différents d'une `HashMap`/`HashSet` : `map.get(clone)` ne trouve pas une entrée pourtant `equals()` à la clé cherchée. Les IDE modernes proposent de générer les deux méthodes ensemble — toujours accepter l'offre pour les deux à la fois.

> **`compareTo` incohérent avec `equals` dans un `TreeSet`/`TreeMap`.** Ces collections utilisent exclusivement `compareTo` (ou un `Comparator`) pour décider si deux éléments sont « les mêmes » — pas `equals()`. Un `compareTo` qui renvoie 0 pour des objets qu'`equals()` distinguerait fait disparaître silencieusement des éléments considérés comme doublons.

> **Oublier `Objects.requireNonNull` et laisser une `NullPointerException` surgir loin de sa cause.** `Objects.requireNonNull(nom, "nom ne peut pas être null")` échoue tôt, avec un message clair, au lieu de laisser `null` se propager jusqu'à un appel `nom.length()` bien plus tard dans le code, avec une pile d'appels moins parlante.

### `Objects` : des utilitaires à connaître

```java
Objects.equals(a, b);          // null-safe : true si a == b == null, ou a.equals(b)
Objects.hash(nom, prix);       // combine plusieurs champs en un seul hashCode
Objects.requireNonNull(nom);   // lève NullPointerException si nom est null
Objects.requireNonNull(nom, "nom obligatoire"); // avec message personnalisé
Objects.toString(valeur, "N/A"); // "N/A" si valeur est null
```

`Objects.equals` évite un `NullPointerException` classique (`a.equals(b)` explose si `a` est `null`), et `Objects.hash` évite d'écrire à la main la combinaison des hashCodes de chaque champ.

### `toString()` utile

```java
@Override
public String toString() {
    return "Produit{nom='%s', prix=%.2f}".formatted(nom, prix);
}
```

Redéfinir `toString()` rend les logs, les messages d'exception et le débogage lisibles : sans redéfinition, `Object.toString()` affiche uniquement `NomClasse@1540e19d` (nom de classe et hashCode en hexadécimal), sans aucune information utile.

### À retenir

- `==` compare des références sur les objets ; `equals()` (redéfini) compare le contenu.
- Contrat d'`equals` : réflexif, symétrique, transitif, cohérent, et faux pour `null`.
- Deux objets égaux doivent avoir le **même** `hashCode()` — toujours redéfinir les deux ensemble.
- `Comparable` = un seul ordre naturel intégré à la classe ; `Comparator` = autant d'ordres externes que nécessaire.
- `compareTo` doit rester cohérent avec `equals`, en particulier pour un usage avec `TreeSet`/`TreeMap`.
