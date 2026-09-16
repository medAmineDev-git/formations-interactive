---
id: heritage
chapitre: poo
ordre: 3
titre: "L'héritage"
termes:
  - terme: "extends"
    definition: "Mot-clé qui déclare qu'une classe **hérite** d'une autre : elle reçoit ses attributs et méthodes accessibles (non `private`), et peut en ajouter ou en redéfinir. Une classe Java ne peut `extends` qu'**une seule** classe."
  - terme: "super"
    definition: "Référence vers la partie « classe mère » de l'objet courant. `super(...)` appelle un constructeur de la classe mère (première instruction du constructeur) ; `super.methode()` appelle la version de la méthode définie dans la classe mère, même si elle est redéfinie."
  - terme: "@Override"
    definition: "Annotation qui indique qu'une méthode redéfinit une méthode de la classe mère (ou implémente une méthode d'interface). Facultative pour le compilateur, mais **fortement recommandée** : elle déclenche une erreur de compilation si la signature ne correspond en réalité à rien à redéfinir (faute de frappe, mauvais type de paramètre)."
  - terme: Redéfinition (override)
    definition: "Fournir, dans une sous-classe, une nouvelle implémentation d'une méthode d'instance héritée, avec la **même signature**. C'est cette version qui s'exécute à l'appel, quel que soit le type déclaré de la variable (voir le polymorphisme)."
  - terme: "final (classe ou méthode)"
    definition: "Sur une classe : interdit d'en hériter (`extends` impossible). Sur une méthode : interdit de la redéfinir dans une sous-classe. `String` est une classe `final`, par exemple."
  - terme: "Object"
    definition: "La classe racine dont héritent, implicitement, toutes les classes Java. Elle fournit `toString()`, `equals(Object)`, `hashCode()`, `getClass()`, entre autres, redéfinissables dans toute classe."
  - terme: Composition
    definition: "Construire une classe en lui donnant une **référence** vers un objet d'une autre classe (« a un »), plutôt qu'en héritant de cette classe (« est un »). Souvent plus sûr et plus flexible que l'héritage."
quiz:
  - question: "Que se passe-t-il à la compilation ?"
    code: |
      public class Personne {
          public Personne(String nom) { }
      }

      public class Client extends Personne {
          public Client(String nom) {
          }
      }
    choix:
      - "Compilation réussie : super(nom) est appelé implicitement"
      - "Erreur de compilation : Personne n'a pas de constructeur sans argument, et Client n'appelle pas super(nom) explicitement"
      - "Compilation réussie, mais nom de Personne reste toujours null"
      - "Erreur de compilation : une classe fille doit toujours redéfinir le constructeur de la classe mère"
    reponse: 1
    explication: "Sans appel explicite à this(...) ou super(...), Java insère un appel implicite à super() (sans argument) en première instruction. Comme Personne n'a pas de constructeur sans argument, cet appel implicite échoue à la compilation : il faut écrire super(nom); explicitement."
  - question: "Cette redéfinition compile-t-elle ?"
    code: |
      public class Notification {
          protected void envoyer() { System.out.println("Envoi générique"); }
      }

      public class NotificationEmail extends Notification {
          @Override
          private void envoyer() { System.out.println("Envoi par email"); }
      }
    choix:
      - "Oui, private est plus sûr donc toujours autorisé"
      - "Non : une redéfinition ne peut pas réduire la visibilité de la méthode héritée"
      - "Oui, car @Override autorise n'importe quel changement de visibilité"
      - "Non, car il manque le mot-clé extends sur la méthode"
    reponse: 1
    explication: "Une méthode redéfinie doit avoir une visibilité au moins aussi large que celle qu'elle redéfinit. protected peut devenir public, mais pas private : le compilateur refuse (« attempting to assign weaker access privileges »)."
  - question: "Pourquoi préfère-t-on généralement la composition à l'héritage dans un cas comme Pile (une structure LIFO) ?"
    choix:
      - "Parce que Java interdit d'hériter des classes de collections"
      - "Parce que hériter d'une ArrayList exposerait aussi add(index, ...) ou remove(index), qui permettent de casser la discipline LIFO que Pile est censée garantir"
      - "Parce que la composition est toujours plus rapide à l'exécution"
      - "Parce qu'une classe ne peut redéfinir qu'une seule méthode héritée"
    reponse: 1
    explication: "En héritant publiquement d'ArrayList, Pile hériterait de toute son API, y compris des méthodes qui permettent d'insérer ou retirer n'importe où dans la liste — ce qui contredit l'idée même d'une pile. En composition (un ArrayList interne, privé), Pile n'expose que empiler()/depiler(), et l'invariant est protégé. C'est l'erreur de conception historique de java.util.Stack, qui hérite bien de Vector."
---

## Essentiel

L'**héritage** permet à une classe de réutiliser les attributs et méthodes d'une autre :

```java
public class Personne {
    protected String nom;

    public Personne(String nom) {
        this.nom = nom;
    }

    public String seDecrire() {
        return "Personne : " + nom;
    }
}

public class Client extends Personne {
    private int pointsFidelite;

    public Client(String nom) {
        super(nom); // appelle le constructeur de Personne, en première instruction
        this.pointsFidelite = 0;
    }

    @Override
    public String seDecrire() {
        return super.seDecrire() + " (fidélité : " + pointsFidelite + ")";
    }
}
```

`Client` **redéfinit** (`@Override`) `seDecrire()` : c'est cette version qui s'exécute pour un objet `Client`, même manipulé via une variable de type `Personne`. Une méthode redéfinie doit garder la même signature, un type de retour identique ou covariant, et une visibilité au moins aussi large que l'originale.

Une classe Java ne peut hériter que d'**une seule** classe (héritage simple), contrairement à des langages comme C++. Elle peut en revanche implémenter plusieurs interfaces (leçon 5).

## Détail

### Comment ça marche

- Un constructeur de sous-classe appelle toujours, en première instruction, soit `this(...)` (un autre constructeur de la même classe), soit `super(...)` (un constructeur de la classe mère). Si aucun des deux n'est écrit, Java insère automatiquement `super()` sans argument.
- Une méthode d'instance non `private`, non `static` et non `final` est redéfinissable. Les méthodes `private` ne sont pas héritées et ne peuvent donc pas être redéfinies ; les méthodes `static` peuvent être « masquées » avec la même signature mais ce n'est pas de la redéfinition (voir la leçon sur le polymorphisme).
- Toute classe qui n'utilise pas `extends` hérite implicitement de `Object`.

### Règles de la redéfinition

| Élément | Règle |
|---|---|
| Signature (nom + paramètres) | identique à la méthode redéfinie |
| Type de retour | identique, ou **covariant** (un sous-type du retour d'origine) |
| Visibilité | identique ou **plus large** (jamais plus restrictive) |
| Exceptions vérifiées déclarées | identiques, plus restreintes, ou absentes (jamais de nouvelle exception vérifiée plus large) |

### Exemple 1 — Type de retour covariant

```java
public class Produit {
    public Produit dupliquer() { return new Produit(); }
}

public class Livre extends Produit {
    @Override
    public Livre dupliquer() { return new Livre(); } // Livre est un sous-type de Produit : autorisé
}
```

`Livre.dupliquer()` retourne `Livre`, plus précis que `Produit` : c'est autorisé depuis Java 5, car tout `Livre` est aussi un `Produit`.

### Exemple 2 — Appeler la version de la classe mère avec super

```java
public class Facture {
    public double calculerTotal() {
        return 100.0;
    }
}

public class FactureAvecRemise extends Facture {
    private double tauxRemise = 0.10;

    @Override
    public double calculerTotal() {
        double totalDeBase = super.calculerTotal(); // réutilise le calcul de la classe mère
        return totalDeBase * (1 - tauxRemise);
    }
}
```

`super.calculerTotal()` appelle explicitement la version de `Facture`, même si `FactureAvecRemise` redéfinit `calculerTotal()`. Sans `super.`, l'appel serait récursif sur la méthode redéfinie elle-même.

### Exemple 3 — final sur une classe et sur une méthode

```java
public final class CodePromo { // ne peut pas être étendue
    // ...
}

public class Paiement {
    public final void journaliser() { // ne peut pas être redéfinie
        System.out.println("Paiement journalisé");
    }
}
```

`final` sur une classe (comme `String` dans le JDK) interdit tout `extends` sur elle. `final` sur une méthode fige son comportement dans toute la hiérarchie : utile quand une sous-classe ne doit surtout pas pouvoir la court-circuiter.

### Exemple 4 — Composition plutôt qu'héritage

```java
// Héritage : Panier "est" une ArrayList, avec toute son API
public class Panier extends ArrayList<String> { }

// Composition : Panier "a" une liste, et n'expose que ce qui a du sens
public class Panier {
    private final List<String> articles = new ArrayList<>();

    public void ajouter(String article) { articles.add(article); }
    public int nombreArticles() { return articles.size(); }
}
```

Avec l'héritage, `Panier` hérite aussi de `add(index, ...)`, `sort(...)`, `subList(...)`… même si rien de tout cela n'a de sens dans le vocabulaire métier d'un panier. La composition permet de n'exposer qu'une API volontairement restreinte.

### Object et ses méthodes

Toute classe hérite implicitement de `Object`, qui fournit notamment `toString()` (représentation textuelle, souvent redéfinie pour l'affichage ou les logs), `equals(Object)` et `hashCode()` (égalité entre objets, détaillées au chapitre suivant), et `getClass()` (classe réelle à l'exécution).

### Pièges courants

> **Oublier que `super()` implicite exige un constructeur sans argument dans la classe mère.** Si `Personne` n'a qu'un constructeur avec paramètre, toute sous-classe doit appeler `super(...)` explicitement — sinon erreur de compilation (« constructor Personne in class Personne cannot be applied to given types »).

> **Réduire la visibilité en redéfinissant.** Passer une méthode `protected` à `private` dans une sous-classe ne compile pas. Ce n'est d'ailleurs pas une redéfinition mais une nouvelle méthode indépendante si on omet `@Override` — raison de plus de toujours l'utiliser.

> **Hériter uniquement pour réutiliser du code, sans relation « est-un » sincère.** Si `NotificationUrgente` hérite de `ArrayList` juste pour profiter d'une liste interne, elle expose une API sans rapport avec son rôle métier. Préférez la composition dès que la relation n'est pas clairement « est un ».

### À retenir

- `extends` : héritage simple, une seule classe mère ; `super(...)` doit être la première instruction du constructeur (implicite si omis).
- `@Override` protège contre les fautes de frappe dans une redéfinition — à utiliser systématiquement.
- Une redéfinition doit garder la signature et un retour covariant, ne peut pas réduire la visibilité ni élargir les exceptions vérifiées.
- `final` interdit d'étendre une classe ou de redéfinir une méthode.
- Préférez la **composition** à l'héritage dès que la relation « est un » n'est pas évidente et durable.
