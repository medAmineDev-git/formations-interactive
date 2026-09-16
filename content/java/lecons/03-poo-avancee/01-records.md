---
id: records
chapitre: poo-avancee
ordre: 1
titre: Les records
termes:
  - terme: Record
    definition: "Type de classe **immuable** dédié au transport de données, introduit par le mot-clé `record`. Le compilateur génère automatiquement le constructeur, les accesseurs, `equals`, `hashCode` et `toString` à partir des composants déclarés."
  - terme: Composant de record
    definition: "Chaque élément déclaré entre parenthèses (`record Point(int x, int y)`). Il devient à la fois un champ `private final` et un accesseur public du même nom (`x()`, pas `getX()`)."
  - terme: Constructeur canonique
    definition: "Le constructeur généré automatiquement, avec un paramètre par composant, dans l'ordre de déclaration. On peut le redéfinir explicitement, ou seulement le compléter avec un **constructeur compact**."
  - terme: Constructeur compact
    definition: "Forme abrégée du constructeur canonique, sans liste de paramètres ni affectations explicites, utilisée pour **valider** ou normaliser les valeurs avant l'affectation automatique des champs."
  - terme: "equals(), hashCode(), toString()"
    definition: "Générés automatiquement à partir de **tous** les composants : deux records du même type sont égaux si tous leurs composants le sont. `toString()` produit un format lisible du type `Point[x=1, y=2]`."
  - terme: Record imbriqué
    definition: "Un record déclaré à l'intérieur d'une classe ou d'un autre record. Comme toute classe imbriquée statique, il ne porte pas de référence implicite vers l'englobante (voir la leçon suivante)."
quiz:
  - question: "Que génère le compilateur pour ce record ?"
    code: |
      public record Produit(String nom, double prix) {
      }
    choix:
      - "Un constructeur canonique, les accesseurs `nom()` et `prix()`, `equals`, `hashCode` et `toString`"
      - "Uniquement un constructeur et des accesseurs `getNom()`/`getPrix()`"
      - "Un constructeur, mais `equals` et `hashCode` doivent être écrits manuellement"
      - "Rien : il faut ajouter `implements Serializable` pour que le compilateur génère du code"
    reponse: 0
    explication: "Un record génère automatiquement le constructeur canonique, un accesseur par composant nommé comme le composant (`nom()`, pas `getNom()`), ainsi que `equals`, `hashCode` et `toString` basés sur tous les composants."
  - question: "Pourquoi ce code ne compile-t-il pas ?"
    code: |
      public record Commande(String reference, int quantite) {
          public Commande {
              if (quantite <= 0) {
                  throw new IllegalArgumentException("quantite invalide");
              }
          }

          private int quantite;
      }
    choix:
      - "Le constructeur compact ne peut pas lever d'exception"
      - "Un composant de record ne peut pas être redéclaré comme champ : `quantite` est déjà un champ généré par le record"
      - "`IllegalArgumentException` n'est pas autorisée dans un record"
      - "Il manque `this.quantite = quantite;` dans le constructeur compact"
    reponse: 1
    explication: "Chaque composant devient déjà un champ `private final` généré par le compilateur. Redéclarer `private int quantite;` dans le corps du record entre en conflit avec ce champ généré et ne compile pas. Le constructeur compact, lui, peut parfaitement valider et lever une exception : c'est son usage principal."
  - question: "Quelle affirmation sur les records est correcte ?"
    choix:
      - "Un record peut hériter d'une autre classe, comme n'importe quelle classe"
      - "Un record est implicitement `final` et ne peut pas hériter d'une autre classe (mais peut implémenter des interfaces)"
      - "Un record ne peut jamais avoir de méthode supplémentaire en dehors de celles générées"
      - "Un record ne peut pas être utilisé comme clé dans une `HashMap`"
    reponse: 1
    explication: "Un record est implicitement `final` : il ne peut pas être étendu, ni étendre une autre classe (il hérite déjà implicitement de `Record`). Il peut en revanche implémenter des interfaces, déclarer des méthodes supplémentaires, et se comporte comme n'importe quel objet immuable avec `equals`/`hashCode` bien définis — donc utilisable sans problème comme clé de `Map`."
---

## Essentiel

Un **record** est un type de classe conçu pour transporter des données de façon **immuable**, avec beaucoup moins de code qu'une classe classique. Finalisé en **Java 16** (JEP 395).

```java
public record Produit(String nom, double prix) {
}
```

Cette seule ligne génère :

- un **constructeur canonique** `Produit(String nom, double prix)` ;
- des **accesseurs** `nom()` et `prix()` (pas de préfixe `get`) ;
- `equals()`, `hashCode()` et `toString()` basés sur `nom` et `prix`.

```java
Produit p1 = new Produit("Clavier", 49.90);
Produit p2 = new Produit("Clavier", 49.90);

p1.equals(p2);   // true : mêmes composants
p1.nom();        // "Clavier"
p1.toString();   // "Produit[nom=Clavier, prix=49.9]"
```

Un **constructeur compact** permet de valider les valeurs avant qu'elles ne soient affectées aux champs :

```java
public record Produit(String nom, double prix) {
    public Produit {
        if (prix < 0) {
            throw new IllegalArgumentException("le prix ne peut pas être négatif");
        }
    }
}
```

Un record est **implicitement final** et ne peut pas hériter d'une autre classe : c'est fait pour des objets simples, sans état modifiable ni logique de cycle de vie complexe.

## Détail

### Pourquoi c'est utile

Avant les records, transporter un petit groupe de valeurs immuables (un DTO, une coordonnée, une paire clé/valeur) demandait d'écrire à la main un constructeur, des accesseurs, `equals`, `hashCode` et `toString` — du code répétitif et source d'oublis (un `equals` non mis à jour après l'ajout d'un champ, par exemple). Le record élimine ce code mécanique pour se concentrer sur les données elles-mêmes.

### Exemple 1 — Constructeur et méthodes supplémentaires

Un record peut ajouter des constructeurs secondaires et des méthodes, comme une classe classique :

```java
public record Point(int x, int y) {

    // constructeur secondaire : doit déléguer au constructeur canonique
    public Point() {
        this(0, 0);
    }

    // méthode d'instance supplémentaire
    public double distanceOrigine() {
        return Math.sqrt(x * x + y * y);
    }

    // méthode statique supplémentaire (fabrique nommée)
    public static Point origine() {
        return new Point(0, 0);
    }
}
```

### Exemple 2 — Constructeur compact pour valider et normaliser

```java
public record Client(String email, String nom) {
    public Client {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("email invalide : " + email);
        }
        nom = nom.trim(); // normalisation avant affectation automatique
    }
}
```

Dans un constructeur compact, on ne réaffecte pas explicitement `this.email = email` : cette affectation est ajoutée automatiquement par le compilateur, après le corps du constructeur compact, avec les valeurs (éventuellement modifiées) des paramètres.

### Exemple 3 — Records imbriqués et composition

```java
public record Adresse(String rue, String ville, String codePostal) { }

public record Client(String nom, Adresse adresse) { }

Client client = new Client("Dupont", new Adresse("10 rue de la Paix", "Paris", "75002"));
client.adresse().ville(); // "Paris"
```

Les records se composent naturellement : un record peut contenir un autre record comme composant, et être lui-même imbriqué dans une classe ou une autre déclaration.

### Exemple 4 — Interface implémentée par un record

```java
public interface Forme {
    double aire();
}

public record Rectangle(double largeur, double hauteur) implements Forme {
    @Override
    public double aire() {
        return largeur * hauteur;
    }
}
```

Un record ne peut pas hériter d'une classe, mais il peut implémenter autant d'interfaces qu'il le souhaite : c'est le seul mécanisme de polymorphisme disponible pour un record.

### Ce qu'un record ne permet pas

| Autorisé | Interdit |
|---|---|
| Implémenter des interfaces | Hériter d'une autre classe (record ou pas) |
| Déclarer des méthodes et constructeurs supplémentaires | Être étendu (un record est implicitement `final`) |
| Déclarer des champs `static` | Déclarer des champs d'instance en plus des composants |
| Redéfinir les accesseurs générés | Rendre un composant modifiable après construction |

### Quand utiliser un record, quand garder une classe

Un record convient pour un **objet de transport ou une valeur métier** : DTO d'API, résultat d'un calcul, paire de valeurs, clé composite. Dès qu'un objet a un **état modifiable**, une **identité** propre indépendante de ses attributs (deux commandes avec les mêmes montants restent deux commandes distinctes), ou un cycle de vie géré par un framework, une classe classique reste préférable. C'est notamment le cas des **entités JPA** : elles ont besoin d'un constructeur sans argument et de champs modifiables après création, ce qu'un record ne permet pas.

### Pièges courants

> **Redéclarer un composant comme champ.** `private int quantite;` en plus du composant `quantite` du record ne compile pas : le champ existe déjà, généré par le compilateur. Si une valeur doit être transformée, faites-le dans le constructeur compact.

> **Croire qu'un record est toujours « profondément » immuable.** Les champs d'un record sont `final`, mais si un composant référence un objet mutable (une `List` par exemple), son contenu reste modifiable de l'extérieur. Pour une vraie immuabilité, copier la collection dans le constructeur compact (`List.copyOf(items)`) ou exposer une vue non modifiable.

> **Oublier que `this.x = x` est implicite dans un constructeur compact.** Réaffecter manuellement les champs dans un constructeur compact (`this.email = email;`) provoque une erreur de compilation : l'affectation finale est déjà ajoutée automatiquement à partir des paramètres.

### À retenir

- Un record génère constructeur canonique, accesseurs (`nom()`, pas `getNom()`), `equals`, `hashCode` et `toString` — finalisé en **Java 16** (JEP 395).
- Le constructeur compact sert à valider ou normaliser, sans réaffectation explicite des champs.
- Implicitement `final`, sans héritage possible, mais peut implémenter des interfaces et ajouter constructeurs/méthodes.
- Réservé au transport de données immuables et aux valeurs métier ; une classe classique reste nécessaire pour un état modifiable ou une entité JPA.
- Le filtrage par motif combiné aux records (*record patterns*) est traité dans le chapitre Java moderne, au niveau avancé.
