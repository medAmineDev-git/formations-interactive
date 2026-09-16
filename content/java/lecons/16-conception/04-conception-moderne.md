---
id: conception-moderne
chapitre: conception
ordre: 4
titre: "Concevoir en Java aujourd'hui"
termes:
  - terme: "Objet de valeur (value object)"
    definition: "Objet défini uniquement par son contenu, sans identité propre (deux instances avec les mêmes valeurs sont interchangeables), et généralement immuable. Un `record` est le candidat naturel en Java moderne : égalité, `hashCode()` et `toString()` corrects sont générés automatiquement."
  - terme: "Obsession des primitifs (primitive obsession)"
    definition: "Défaut de conception qui utilise `String`, `int`, `double` ou `boolean` bruts pour représenter des concepts métier (un email, une quantité, un statut), au lieu de types dédiés qui rendent les valeurs invalides impossibles à représenter."
  - terme: "Composition plutôt qu'héritage"
    definition: "Principe qui privilégie l'assemblage d'objets collaborant via des interfaces (un champ qui référence une dépendance) à l'héritage de classe, plus rigide (une seule classe mère, couplage figé à la compilation)."
  - terme: "Type résultat"
    definition: "Type (souvent une interface scellée maison, avec un cas succès et un cas échec) qui rend un échec attendu visible dans la signature d'une méthode, à la place d'une exception ou d'un Optional sans contexte. Ce n'est pas un type standard du JDK — Java n'a pas d'équivalent natif à `Either` ou `Result` — seulement un patron que certaines équipes implémentent elles-mêmes."
  - terme: "Séparation domaine / infrastructure"
    definition: "Organisation où les classes qui portent les règles métier (le domaine) ne dépendent d'aucun détail technique (JPA, HTTP, un SGBD précis) — ces détails restent dans une couche infrastructure qui dépend du domaine, jamais l'inverse."
  - terme: "Code testable par construction"
    definition: "Code dont les dépendances sont explicites (reçues par constructeur) et dont le comportement ne dépend pas d'un état global caché (singleton statique, horloge système directe) — un tel code se teste sans artifice, avec de simples doubles de test."
quiz:
  - question: "Que change ce record par rapport à une simple paire de int pour représenter une quantité en commande ?"
    code: |
      public record Quantite(int valeur) {
          public Quantite {
              if (valeur <= 0) {
                  throw new IllegalArgumentException("La quantité doit être positive : " + valeur);
              }
          }
      }

      // Avant : rien n'empêche new LigneCommande(produit, -5)
      // Après : new LigneCommande(produit, new Quantite(-5)) lève immédiatement une exception
    choix:
      - "Rien, un record se comporte exactement comme une classe avec un seul champ int"
      - "Une quantité invalide (négative ou nulle) devient impossible à construire : l'invariant est vérifié une seule fois, au constructeur, plutôt que dans chaque méthode qui manipule la quantité"
      - "Le record rend le calcul plus rapide qu'un int primitif"
      - "Le record empêche toute quantité supérieure au stock disponible"
    reponse: 1
    explication: "C'est l'intérêt central de remplacer un type primitif par un type dédié : l'invariant (positive) est vérifié une seule fois, dans le constructeur compact du record, et devient impossible à violer ensuite. Un int nu oblige à revalider la même règle partout où la quantité est utilisée — ou pire, à l'oublier à certains endroits. Le record ne connaît rien du stock : ce serait une règle métier différente, portée ailleurs."
  - question: "Cette méthode renvoie Optional<Commande> pour signaler un échec de validation. Quel est le principal défaut de cette approche ?"
    code: |
      public Optional<Commande> valider(Panier panier) {
          if (panier.estVide()) return Optional.empty();
          if (!stockDisponible(panier)) return Optional.empty();
          return Optional.of(new Commande(panier));
      }
    choix:
      - "Optional ne peut pas être utilisé comme type de retour d'une méthode publique"
      - "Optional.empty() ne distingue pas la raison de l'échec (panier vide ou stock insuffisant) : l'appelant reçoit une absence, sans contexte exploitable pour réagir ou informer l'utilisateur"
      - "Optional force à écrire un bloc try/catch à chaque appel"
      - "Optional alloue systématiquement un objet sur le tas, ce qui dégrade les performances"
    reponse: 1
    explication: "Optional convient à l'absence d'une valeur, pas à un échec qui a une cause à communiquer. Ici, panier vide et rupture de stock produisent le même Optional.empty(), et l'appelant ne peut pas distinguer les deux sans revalider lui-même. Une exception métier avec un message, ou un type résultat avec un cas d'échec porteur d'une raison, transmettent l'information réellement utile."
  - question: "Pourquoi cette méthode est-elle difficile à tester unitairement ?"
    code: |
      public class ServiceRemise {
          public double calculerRemise(Commande commande) {
              double taux = ConfigurationBoutique.getInstance().getTauxRemiseVip();
              return commande.total() * taux;
          }
      }
    choix:
      - "Parce que calculerRemise devrait être une méthode static"
      - "Parce qu'elle dépend d'un accès global caché (ConfigurationBoutique.getInstance()) plutôt que d'une dépendance reçue explicitement : impossible de fournir un taux différent dans un test sans manipuler un état global partagé"
      - "Parce que Commande devrait être un record pour être testable"
      - "Parce que double ne peut pas être vérifié par une assertion de test"
    reponse: 1
    explication: "La dépendance à ConfigurationBoutique est invisible dans la signature de calculerRemise : impossible de la remplacer par un double de test sans modifier un état global partagé entre tous les tests, source de tests fragiles et dépendants de leur ordre d'exécution. En recevant la configuration (ou juste le taux) par le constructeur, le test devient trivial : construire ServiceRemise avec un taux connu, sans toucher à aucun état global."
---

## Essentiel

Le Java moderne (records, classes scellées, filtrage par motif) ne remplace pas les principes SOLID ni les patrons vus dans ce chapitre — il change **quels** patrons restent utiles et **comment** les écrire.

```java
// Objet de valeur : immuable, égalité et toString générés
public record Argent(BigDecimal montant, Devise devise) {
    public Argent {
        if (montant.signum() < 0) throw new IllegalArgumentException("Montant négatif");
    }
}

// Type précis plutôt que des primitifs
public record EmailClient(String valeur) {
    public EmailClient {
        if (!valeur.matches(".+@.+\\..+")) throw new IllegalArgumentException("Email invalide : " + valeur);
    }
}
```

Quatre idées structurent la conception Java d'aujourd'hui : préférer l'**immuabilité par défaut** (records comme objets de valeur) ; modéliser le domaine avec des **types précis** plutôt que des `String` et des `boolean` génériques ; préférer la **composition** à l'héritage ; rendre les **erreurs attendues visibles** dans les signatures (exception métier, `Optional`, ou un type résultat maison selon le cas). À cela s'ajoute la **testabilité par construction** : un code dont les dépendances sont explicites (constructeur) se teste sans artifice.

## Détail

### Exemple 1 — Immuabilité par défaut et records comme objets de valeur

```java
public record LigneCommande(Produit produit, int quantite, Argent prixUnitaire) {
    public Argent sousTotal() {
        return prixUnitaire.multiplierPar(quantite);
    }
}
```

Un `record` est immuable par construction (champs `final`, aucun setter généré), et deux instances avec les mêmes valeurs sont égales par `equals()` sans code à écrire. C'est exactement la définition d'un objet de valeur : `LigneCommande` n'a pas d'identité propre, seul son contenu compte. Pour un objet qui a une identité (une `Commande` suivie dans le temps, avec un statut qui évolue), un record convient moins bien — préférer une classe ordinaire dont l'égalité se fait sur un identifiant.

### Exemple 2 — Modéliser avec des types précis plutôt que des String et des boolean

```java
// Avant : obsession des primitifs, invariants non protégés
public class Commande {
    private String emailClient;      // n'importe quelle chaîne accepté
    private boolean payee;
    private boolean expediee;
    private boolean annulee;         // les trois booléens peuvent être vrais en même temps !
}
```

```java
// Après : des types qui rendent les états invalides impossibles
public record EmailClient(String valeur) {
    public EmailClient { if (!valeur.contains("@")) throw new IllegalArgumentException(valeur); }
}

public enum StatutCommande { EN_ATTENTE, PAYEE, EXPEDIEE, ANNULEE } // un seul état à la fois

public class Commande {
    private EmailClient emailClient;
    private StatutCommande statut;
}
```

Trois `boolean` indépendants autorisent des combinaisons absurdes (`payee = true, annulee = true`) qu'un seul `enum StatutCommande` élimine structurellement — une commande a exactement un statut. `EmailClient` empêche une chaîne invalide de circuler dans tout le code sans jamais être revalidée. Le principe : **rendre un état invalide impossible à représenter**, plutôt que de le valider à répétition.

### Exemple 3 — Composition plutôt qu'héritage

```java
// Hérité : figé à la compilation, un seul parent possible
public class ExportateurCommandeCompresse extends ExportateurCommandeCsv {
    @Override
    public byte[] exporter(Commande commande) {
        return compresser(super.exporter(commande));
    }
}
```

```java
// Composé : les comportements s'assemblent librement, testables séparément
public interface ExportateurCommande {
    byte[] exporter(Commande commande);
}

public class ExportateurCompresse implements ExportateurCommande {
    private final ExportateurCommande delegue;
    public ExportateurCompresse(ExportateurCommande delegue) { this.delegue = delegue; }

    @Override
    public byte[] exporter(Commande commande) {
        return compresser(delegue.exporter(commande));
    }
}

ExportateurCommande exportateur = new ExportateurCompresse(new ExportateurCsv());
```

La version composée peut envelopper n'importe quel `ExportateurCommande` (CSV, JSON, futur format), se teste avec un délégué factice, et ne dépend d'aucun détail interne d'une classe mère. C'est le même raisonnement que le décorateur du chapitre précédent, appliqué comme règle générale de conception plutôt que comme patron nommé.

### Exemple 4 — Gestion des erreurs : exception, Optional ou type résultat

```java
// Exception métier : le cas normal pour un échec exceptionnel, avec contexte
public class StockInsuffisantException extends RuntimeException {
    public StockInsuffisantException(Produit produit, int demande, int disponible) {
        super("Stock insuffisant pour " + produit.nom() + " : demandé " + demande + ", disponible " + disponible);
    }
}
```

```java
// Optional : pour une absence normale, pas pour un échec avec une cause à expliquer
public Optional<Produit> trouverParReference(String reference) { /* peut légitimement ne rien trouver */ }
```

```java
// Type résultat maison : pour un échec attendu et fréquent, dont l'appelant doit gérer chaque cas explicitement
public sealed interface ResultatPaiement {
    record Succes(String idTransaction) implements ResultatPaiement {}
    record Refuse(String motif) implements ResultatPaiement {}
}

ResultatPaiement resultat = passerelle.payer(commande);
String message = switch (resultat) {
    case ResultatPaiement.Succes s -> "Paiement confirmé : " + s.idTransaction();
    case ResultatPaiement.Refuse r -> "Paiement refusé : " + r.motif();
}; // exhaustif : impossible d'oublier un cas
```

Trois outils, trois usages différents : une **exception** pour un échec qui interrompt réellement le déroulement normal (avec un message qui explique pourquoi) ; **`Optional`** pour une absence de valeur sans cause à communiquer (chercher un produit qui n'existe pas n'est l'échec de rien) ; un **type résultat** maison (interface scellée avec un cas succès et un ou plusieurs cas d'échec) quand l'échec est un déroulement normal et fréquent (un paiement refusé n'est pas une anomalie) et que chaque cas doit être traité explicitement par l'appelant. Ce dernier n'est pas un idiome standard du JDK : une exception métier reste souvent le choix le plus simple et le plus idiomatique en Java, à réserver au type résultat les cas où forcer l'appelant à traiter chaque branche a une vraie valeur.

### Classes scellées : rendre un ensemble de cas explicite

Une hiérarchie `sealed` (finalisée depuis Java 17) déclare la liste fermée et exhaustive de ses sous-types. Combinée au filtrage par motif sur `switch` (Java 21), elle remplace souvent un visiteur classique ou un `enum` avec des données hétérogènes attachées en commentaire. Ce chapitre s'appuie sur cette idée (voir l'exemple du type résultat ci-dessus et le visiteur du chapitre précédent) sans la détailler — la syntaxe complète est couverte dans le chapitre Java moderne.

### Petites interfaces et fonctions de première classe

Une interface à une seule méthode abstraite (`RegleRemise`, `Formateur`) se substitue souvent à `Function`, `Predicate` ou `Consumer` directement, sans déclaration dédiée — la stratégie et l'observateur du chapitre précédent en sont les exemples les plus courants. Garder des interfaces petites (idéalement une seule responsabilité, souvent une seule méthode) facilite à la fois la composition et le remplacement par une lambda.

### Séparation domaine / infrastructure

```java
// Domaine : ne connaît aucun détail technique
public interface CommandeRepository {
    void sauvegarder(Commande commande);
    Optional<Commande> parReference(String reference);
}

// Infrastructure : dépend du domaine, jamais l'inverse
@Repository
public class CommandeRepositoryJpa implements CommandeRepository {
    private final EntityManager entityManager; // détail technique confiné ici
    // ...
}
```

`Commande` et `CommandeRepository` ne mentionnent ni JPA, ni SQL, ni HTTP — ces détails vivent dans une couche infrastructure qui implémente les interfaces du domaine. C'est une application directe de l'inversion des dépendances (voir la première leçon du chapitre) : le domaine définit le contrat, l'infrastructure s'y conforme, jamais l'inverse. Ce découpage permet de tester les règles métier sans base de données réelle.

### Quand un patron classique n'a plus lieu d'être

| Patron classique | Remplacé en pratique par |
|---|---|
| Singleton fait main | Énumération à une valeur, ou bean à portée singleton d'un conteneur d'injection |
| Visiteur (accept/visit) sur une hiérarchie fermée | Filtrage par motif sur classes scellées |
| Stratégie/Observateur via une interface dédiée à une méthode | `Function`, `Consumer`, `Predicate` et lambdas |
| Builder pour un objet à 2-3 champs | Constructeur ordinaire, ou constructeur compact d'un record |
| État encodé par plusieurs booléens indépendants | Un `enum` unique, ou une hiérarchie scellée si chaque état porte des données différentes |

### Code testable par construction

```java
// Difficile à tester : dépendance cachée, état global
public class ServiceRemise {
    public double calculer(Commande commande) {
        return commande.total() * ConfigurationBoutique.getInstance().getTauxRemiseVip();
    }
}

// Testable sans artifice : dépendance explicite, reçue au constructeur
public class ServiceRemise {
    private final double tauxRemiseVip;
    public ServiceRemise(double tauxRemiseVip) { this.tauxRemiseVip = tauxRemiseVip; }
    public double calculer(Commande commande) { return commande.total() * tauxRemiseVip; }
}
```

Rendre chaque dépendance explicite dans le constructeur (plutôt que de la récupérer via un accès global) rend le code testable sans framework de mock complexe ni état partagé entre tests — un simple `new ServiceRemise(0.20)` suffit dans un test.

### Pièges courants

> **Créer un type résultat maison pour chaque méthode qui peut échouer.** Si l'échec est rare et vraiment exceptionnel, une exception (vérifiée ou non selon le contexte) reste plus simple à lire et plus idiomatique en Java — réserver le type résultat aux échecs fréquents et attendus qui font partie du flux normal.

> **Sur-typer des valeurs qui n'ont besoin d'aucune règle propre.** Envelopper un simple identifiant technique sans invariant ni comportement dans un `record` à un champ ajoute une indirection sans bénéfice réel ; réserver les types dédiés aux concepts qui portent une règle métier (validation, calcul) ou une confusion possible (deux `String` qui représentent des choses différentes).

> **Continuer à écrire un visiteur accept/visit sur une hiérarchie qui pourrait être scellée.** Si la hiérarchie est fermée et connue à l'avance, un `switch` exhaustif sur classes scellées obtient la même garantie de complétude avec moins de code — voir le chapitre précédent.

### À retenir

- Un `record` immuable est le candidat par défaut pour un objet de valeur (`Argent`, `EmailClient`, `LigneCommande`) ; réserver une classe mutable à ce qui a une véritable identité suivie dans le temps.
- Remplacer `String`/`boolean`/`int` bruts par des types dédiés rend les états invalides impossibles à représenter, au lieu de les valider à répétition.
- Composition avant héritage : une interface injectée se teste et se recombine mieux qu'une hiérarchie de classes.
- Trois outils pour les erreurs, trois usages : exception pour un échec exceptionnel avec contexte, `Optional` pour une absence normale, type résultat maison pour un échec attendu qui doit être traité explicitement (pas un idiome standard du JDK).
- Un code testable par construction ne dépend d'aucun état global caché : chaque dépendance est reçue par le constructeur.
