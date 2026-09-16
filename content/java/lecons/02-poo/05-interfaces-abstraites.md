---
id: interfaces-abstraites
chapitre: poo
ordre: 5
titre: "Interfaces et classes abstraites"
termes:
  - terme: Interface
    definition: "Un **contrat** : un ensemble de méthodes qu'une classe s'engage à implémenter, sans dire comment (sauf pour les méthodes `default`). Une classe peut implémenter **plusieurs** interfaces avec `implements`."
  - terme: "Méthode default"
    definition: "Méthode d'interface avec un **corps**, introduite en Java 8. Une classe qui implémente l'interface en hérite automatiquement, sans obligation de la redéfinir. A permis de faire évoluer des interfaces existantes (comme `List`) sans casser tout le code déjà écrit."
  - terme: "Méthode static (interface)"
    definition: "Méthode utilitaire rattachée à l'interface elle-même, appelée `NomInterface.methode(...)`, comme `List.of(...)` ou `Comparator.comparing(...)`. N'est **pas** héritée par les classes qui implémentent l'interface."
  - terme: "Méthode privée d'interface"
    definition: "Méthode `private` (Java 9+) qui factorise du code partagé entre plusieurs méthodes `default` ou `static` de la même interface, sans l'exposer aux classes qui l'implémentent."
  - terme: Classe abstraite
    definition: "Classe qui ne peut pas être instanciée directement (`new` interdit), déclarée avec `abstract`. Peut mélanger des méthodes concrètes (avec corps), des méthodes `abstract` (sans corps, à implémenter par les sous-classes), un état (champs d'instance) et des constructeurs."
  - terme: "Méthode abstraite"
    definition: "Méthode sans corps (`abstract void calculer();`), déclarée dans une classe `abstract` ou une interface. Toute sous-classe concrète doit l'implémenter, sinon elle doit elle-même être déclarée `abstract`."
  - terme: Programmer vis-à-vis d'une interface
    definition: "Déclarer les variables, paramètres et types de retour avec un type **interface** (`List<Produit>`) plutôt qu'une implémentation concrète (`ArrayList<Produit>`), pour pouvoir changer d'implémentation sans modifier le code appelant."
quiz:
  - question: "Que se passe-t-il si une classe implémente cette interface sans redéfinir envoyer() ?"
    code: |
      public interface Notifiable {
          void envoyer(String message);

          default void envoyerUrgent(String message) {
              envoyer("URGENT : " + message);
          }
      }

      public class Email implements Notifiable {
          @Override
          public void envoyer(String message) {
              System.out.println("Email : " + message);
          }
      }
    choix:
      - "Erreur de compilation : Email doit aussi redéfinir envoyerUrgent"
      - "Compilation réussie : Email hérite automatiquement de l'implémentation par défaut de envoyerUrgent"
      - "Erreur de compilation : une interface ne peut pas avoir de méthode default"
      - "Compilation réussie, mais envoyerUrgent lève une exception si on l'appelle"
    reponse: 1
    explication: "envoyer() est abstraite : elle doit être implémentée, ce qui est fait. envoyerUrgent() a un corps (default) : Email en hérite tel quel, sans obligation de la redéfinir. Elle peut être redéfinie si besoin, mais ce n'est pas obligatoire."
  - question: "Cette classe compile-t-elle ?"
    code: |
      public interface Imprimable {
          default String resume() { return "Imprimable"; }
      }
      public interface Exportable {
          default String resume() { return "Exportable"; }
      }
      public class Rapport implements Imprimable, Exportable {
      }
    choix:
      - "Oui, Java choisit automatiquement Imprimable car déclarée en premier"
      - "Non : les deux méthodes default resume() sont en conflit, Rapport doit la redéfinir explicitement"
      - "Oui, les deux méthodes s'exécutent l'une après l'autre"
      - "Non, une classe ne peut jamais implémenter deux interfaces à la fois"
    reponse: 1
    explication: "Quand deux interfaces implémentées fournissent une méthode default de même signature, Java ne choisit pas pour vous : la compilation échoue (« class Rapport inherits unrelated defaults for resume() from types Imprimable and Exportable »). Il faut que Rapport redéfinisse resume() elle-même, éventuellement en appelant Imprimable.super.resume()."
  - question: "Quelle affirmation sur les classes abstraites est correcte ?"
    choix:
      - "Une classe abstraite ne peut avoir aucun champ ni constructeur, comme une interface"
      - "Une classe abstraite peut avoir des champs d'instance, un constructeur et un mélange de méthodes concrètes et abstraites"
      - "Une classe abstraite ne peut être étendue que par une seule sous-classe"
      - "Toute classe qui contient une méthode abstraite doit forcément implémenter une interface"
    reponse: 1
    explication: "Contrairement à une interface, une classe abstraite peut porter un véritable état (champs), un constructeur (appelé via super(...) par les sous-classes) et du comportement partiel déjà implémenté. Elle ne peut simplement pas être instanciée directement avec new."
---

## Essentiel

Une **interface** définit un contrat, sans dire comment il est rempli :

```java
public interface Notifiable {
    void envoyer(String message); // abstraite : à implémenter

    default void envoyerUrgent(String message) { // avec corps : héritée telle quelle
        envoyer("URGENT : " + message);
    }
}

public class Email implements Notifiable {
    @Override
    public void envoyer(String message) {
        System.out.println("Email : " + message);
    }
}
```

Une classe peut implémenter **plusieurs** interfaces (contrairement à l'héritage de classe, limité à une seule). Depuis Java 8, une interface peut aussi porter des méthodes `default` (avec corps, héritées) et `static` (utilitaires, appelées sur l'interface elle-même) — ce qui a permis de faire évoluer des interfaces du JDK sans casser le code existant.

Une **classe abstraite** ressemble à une classe normale, mais ne peut pas être instanciée directement et peut déclarer des méthodes `abstract` (sans corps) à charge des sous-classes. Contrairement à une interface, elle peut porter un véritable état (champs) et un constructeur.

## Détail

### Pourquoi les méthodes default et static ont été ajoutées

Avant Java 8, ajouter une méthode à une interface publique du JDK (comme `List`) cassait **toutes** les classes qui l'implémentaient déjà, faute d'une implémentation. Les méthodes `default` résolvent ce problème : `List.forEach(...)` ou `List.sort(...)` ont pu être ajoutées avec une implémentation par défaut, sans obliger chaque classe existante à les implémenter.

### Exemple 1 — Constantes et méthode static

```java
public interface Tva {
    double TAUX_STANDARD = 0.20; // implicitement public static final

    static double appliquer(double prixHT, double taux) { // méthode utilitaire
        return prixHT * (1 + taux);
    }
}

double prixTTC = Tva.appliquer(100.0, Tva.TAUX_STANDARD);
```

Tout champ déclaré dans une interface est implicitement `public static final` : une interface ne peut pas porter d'état propre à chaque implémentation, seulement des constantes partagées. Une méthode `static` d'interface s'appelle sur l'interface (`Tva.appliquer(...)`), elle n'est **pas** héritée par les classes qui l'implémentent.

### Exemple 2 — Méthode privée d'interface

```java
public interface RapportExportable {
    default String exporterCsv() {
        return formaterEnTete() + "donnees...";
    }
    default String exporterCsvDetaille() {
        return formaterEnTete() + "donnees detaillees...";
    }

    private String formaterEnTete() { // factorisation, non visible depuis l'extérieur
        return "id;date;montant\n";
    }
}
```

Depuis Java 9, une méthode `private` d'interface permet de partager du code entre plusieurs méthodes `default` (ou `static`) sans l'exposer comme faisant partie du contrat public.

### Exemple 3 — Conflit entre deux méthodes default

```java
public interface Imprimable {
    default String resume() { return "Imprimable"; }
}
public interface Exportable {
    default String resume() { return "Exportable"; }
}

public class Rapport implements Imprimable, Exportable {
    @Override
    public String resume() { // obligatoire : lève le conflit
        return Imprimable.super.resume() + " / " + Exportable.super.resume();
    }
}
```

Quand deux interfaces implémentées définissent la même méthode `default`, Java ne choisit pas à votre place : la classe doit la redéfinir explicitement. `Imprimable.super.resume()` permet d'appeler quand même l'une des deux versions d'origine.

### Exemple 4 — Classe abstraite avec état partagé

```java
public abstract class MoyenPaiement {
    protected final String reference;

    protected MoyenPaiement(String reference) { // constructeur, appelé via super(...)
        this.reference = reference;
    }

    public abstract boolean valider(double montant); // à implémenter

    public void journaliser() { // comportement déjà partagé
        System.out.println("Paiement " + reference + " traité");
    }
}

public class PaiementCarte extends MoyenPaiement {
    public PaiementCarte(String reference) { super(reference); }

    @Override
    public boolean valider(double montant) {
        return montant <= 5000; // règle propre à la carte
    }
}
```

`MoyenPaiement` factorise l'état (`reference`) et un comportement commun (`journaliser()`), tout en laissant `valider(...)` spécifique à chaque sous-classe.

### Interface ou classe abstraite : comment choisir

| | Interface | Classe abstraite |
|---|---|---|
| Héritage/implémentation multiple | ✅ plusieurs interfaces | ❌ une seule classe mère |
| État (champs d'instance) | ❌ seulement des constantes | ✅ |
| Constructeur | ❌ | ✅ |
| Méthodes avec corps | `default`, `static`, `private` | toutes, sauf celles marquées `abstract` |
| Usage typique | définir un **contrat** transversal (`Comparable`, `Notifiable`) | partager du **code et de l'état** entre classes clairement apparentées |

En pratique : une interface pour dire « peut faire X » (souvent implémentée par des classes sans rapport entre elles) ; une classe abstraite pour un socle commun à une famille de classes proches, avec de l'état et du comportement partagé.

### Programmer vis-à-vis d'une interface

```java
// Préférable : dépend du contrat, pas de l'implémentation
public void traiterCommandes(List<Produit> produits) { ... }

// À éviter : couple le code à ArrayList précisément
public void traiterCommandes(ArrayList<Produit> produits) { ... }
```

Déclarer les variables et paramètres avec le type interface (`List`, `Map`) plutôt qu'une implémentation concrète (`ArrayList`, `HashMap`) permet de changer d'implémentation (par exemple passer à `LinkedList`) sans toucher au code appelant.

### Pièges courants

> **Croire qu'une interface peut porter un champ d'instance.** `private int compteur;` dans une interface ne compile pas : seuls des champs implicitement `public static final` (constantes) sont autorisés.

> **Oublier de gérer un conflit entre deux méthodes default de même signature.** Le message d'erreur (« inherits unrelated defaults ») surprend souvent : la solution est de redéfinir la méthode dans la classe qui implémente les deux interfaces.

> **Créer une classe abstraite juste pour éviter `implements` sur plusieurs types.** Si les classes concernées n'ont pas de code ni d'état réellement partagé, une interface (éventuellement avec des méthodes `default`) est un choix plus flexible, qui n'empêche pas d'autres héritages.

### À retenir

- Une interface définit un contrat ; une classe peut en implémenter **plusieurs**.
- Les méthodes `default` et `static` (Java 8+) ont permis de faire évoluer des interfaces existantes sans casser le code déjà écrit ; les méthodes `private` (Java 9+) factorisent du code interne à l'interface.
- Une classe abstraite peut porter un état, un constructeur et du comportement partiel — une interface ne porte que des constantes.
- Deux méthodes `default` en conflit obligent la classe implémentante à trancher explicitement.
- Programmez vis-à-vis d'une interface (`List`, pas `ArrayList`) pour garder la liberté de changer d'implémentation.
