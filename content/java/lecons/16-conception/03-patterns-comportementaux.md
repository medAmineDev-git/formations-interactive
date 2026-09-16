---
id: patterns-comportementaux
chapitre: conception
ordre: 3
titre: "Patrons de comportement"
termes:
  - terme: Stratégie
    definition: "Interface qui encapsule un algorithme interchangeable à l'exécution (par exemple une règle de remise), passée à l'objet qui l'utilise plutôt que codée en dur. Depuis Java 8, une interface fonctionnelle à une seule méthode se remplace souvent directement par une lambda, sans classe dédiée."
  - terme: "Patron de méthode (template method)"
    definition: "Méthode d'une classe mère qui fixe le squelette d'un algorithme et délègue certaines étapes à des méthodes abstraites, redéfinies par les sous-classes. La composition (passer une stratégie en paramètre plutôt qu'hériter) obtient souvent le même résultat avec moins de couplage."
  - terme: Observateur
    definition: "Mécanisme par lequel un sujet notifie automatiquement une liste d'observateurs enregistrés lorsqu'un événement se produit, sans connaître leur nature exacte. Les écouteurs fonctionnels (`List<Consumer<T>>`) et les événements applicatifs d'un framework (`ApplicationEventPublisher` de Spring) en sont des variantes modernes courantes."
  - terme: Commande
    definition: "Objet qui encapsule une action et ses paramètres (au lieu d'un simple appel de méthode), pour pouvoir la stocker, la mettre en file d'attente, la journaliser ou l'annuler plus tard."
  - terme: Itérateur
    definition: "Objet qui expose un parcours séquentiel d'une collection sans révéler sa structure interne. Déjà intégré au JDK via `Iterable`/`Iterator` et la boucle `for-each` — il est rare d'en écrire un à la main aujourd'hui."
  - terme: État
    definition: "Patron où le comportement d'un objet change selon un état interne, chaque état étant modélisé par une classe qui implémente une interface commune, plutôt que par un champ énuméré testé dans des `if` partout dans le code."
  - terme: "Chaîne de responsabilité"
    definition: "Suite de gestionnaires, chacun décidant de traiter une requête ou de la transmettre au suivant, sans que l'appelant connaisse à l'avance lequel la traitera effectivement."
  - terme: Visiteur
    definition: "Patron qui ajoute une nouvelle opération à une hiérarchie de types fermée sans modifier ces types, via un double dispatch (`accept`/`visit`). Le filtrage par motif (pattern matching) sur une hiérarchie de classes scellées rend ce patron largement inutile en Java moderne pour ce même besoin."
quiz:
  - question: "Cette classe applique une remise selon le type de client, avec un champ vers une interface fonctionnelle. Quel patron ce code illustre-t-il ?"
    code: |
      public class CalculateurRemise {
          private final Function<Double, Double> regle;

          public CalculateurRemise(Function<Double, Double> regle) {
              this.regle = regle;
          }

          public double appliquer(double montant) {
              return regle.apply(montant);
          }
      }

      CalculateurRemise remisePremium = new CalculateurRemise(montant -> montant * 0.90);
      CalculateurRemise remiseVip = new CalculateurRemise(montant -> montant * 0.80);
    choix:
      - "Patron d'état : le comportement change selon un champ interne à CalculateurRemise"
      - "Patron stratégie : l'algorithme de calcul est fourni de l'extérieur et interchangeable, ici sous forme de lambda plutôt que de classe dédiée"
      - "Patron commande : chaque appel encapsule une action à rejouer plus tard"
      - "Patron visiteur : la remise visite chaque ligne de commande"
      - "Patron observateur : CalculateurRemise notifie regle du montant"
    reponse: 1
    explication: "C'est une stratégie : l'algorithme (la règle de remise) est injecté depuis l'extérieur et interchangeable sans modifier CalculateurRemise. Avant Java 8, ce serait une interface RegleRemise avec plusieurs classes ; ici, Function<Double, Double> et des lambdas suffisent, sans classe dédiée par règle."
  - question: "Pourquoi préférer la composition (passer un Formateur en paramètre) plutôt que le patron de méthode (hériter et redéfinir des méthodes abstraites) pour cet exportateur de commandes ?"
    code: |
      // Patron de méthode : une sous-classe par format
      public abstract class ExportateurCommande {
          public final String exporter(Commande c) {
              return enTete() + corps(c) + piedDePage();
          }
          protected abstract String enTete();
          protected abstract String corps(Commande c);
          protected abstract String piedDePage();
      }
      public class ExportateurCsv extends ExportateurCommande { /* ... */ }
      public class ExportateurJson extends ExportateurCommande { /* ... */ }
    choix:
      - "Parce que le patron de méthode ne compile pas si la classe mère est abstract"
      - "Parce qu'hériter oblige à créer une sous-classe par format et fige la relation à la compilation, alors qu'un Formateur injecté au constructeur peut être choisi, combiné ou remplacé dynamiquement, et testé isolément"
      - "Parce que Java interdit d'avoir plus de deux sous-classes d'une même classe abstraite"
      - "Parce qu'une méthode final ne peut pas appeler une méthode abstraite"
    reponse: 1
    explication: "Le patron de méthode fonctionne, mais chaque nouveau format ajoute une classe liée par héritage, difficile à tester indépendamment de ExportateurCommande et impossible à changer à l'exécution. Remplacer les méthodes abstraites par une interface Formateur injectée au constructeur obtient le même résultat avec un couplage plus faible et une meilleure testabilité — un exemple concret de « préférer la composition à l'héritage »."
  - question: "Une hiérarchie scellée LigneCommande (ArticleUnique, LotArticles) doit gagner une nouvelle opération de calcul de poids total. En Java moderne, quelle approche est la plus adaptée, et pourquoi le patron visiteur classique perd de son intérêt ici ?"
    choix:
      - "Le patron visiteur reste obligatoire : Java n'a aucun autre moyen d'ajouter une opération à une hiérarchie fermée"
      - "Un switch avec filtrage par motif sur la hiérarchie scellée, exhaustif et vérifié par le compilateur, obtient le même résultat que le visiteur (ajouter une opération sans modifier les classes) sans le double dispatch accept/visit"
      - "Il faut ajouter une méthode calculerPoids() abstraite dans l'interface LigneCommande, ce qui est la seule solution valable"
      - "Le patron d'état est la seule alternative possible au visiteur"
    reponse: 1
    explication: "Le visiteur existe pour ajouter une opération à une hiérarchie fermée sans modifier ses classes. Depuis que les classes scellées (Java 17) et le filtrage par motif sur switch (Java 21) sont finalisés, un switch exhaustif sur la hiérarchie scellée fait exactement cela, avec une vérification à la compilation qu'aucun cas n'est oublié, sans avoir à écrire une paire de méthodes accept/visit par type — voir le chapitre Java moderne pour le détail de cette syntaxe."
---

## Essentiel

Les patrons de comportement organisent la **communication entre objets** : quel algorithme s'exécute, qui est notifié d'un changement, comment une requête est traitée.

```java
// Stratégie, version lambda : interchangeable sans classe dédiée
Function<Double, Double> remisePremium = montant -> montant * 0.90;
double prixFinal = remisePremium.apply(100.0);

// Observateur, version fonctionnelle : pas d'interface Observateur à écrire
List<Consumer<Commande>> ecouteurs = List.of(
    commande -> envoyerEmailConfirmation(commande),
    commande -> mettreAJourStock(commande)
);
ecouteurs.forEach(ecouteur -> ecouteur.accept(commande));
```

La **stratégie** encapsule un algorithme interchangeable (souvent une simple lambda aujourd'hui). Le **patron de méthode** fixe un squelette d'algorithme dans une classe mère et délègue des étapes aux sous-classes — la composition (une interface injectée) obtient souvent le même résultat avec moins de couplage. L'**observateur** notifie une liste d'écouteurs d'un changement — écouteurs fonctionnels ou événements applicatifs (Spring) remplacent souvent l'interface `Observateur` classique. La **commande** encapsule une action pour la stocker ou la rejouer. L'**itérateur** est déjà dans le JDK (`for-each`). L'**état** modélise un comportement qui change selon une situation interne. La **chaîne de responsabilité** transmet une requête entre gestionnaires successifs. Le **visiteur** ajoute une opération à une hiérarchie fermée — un besoin que le filtrage par motif sur des classes scellées couvre souvent mieux en Java moderne.

## Détail

### Exemple 1 — Stratégie (et sa version lambda)

```java
public interface RegleRemise {
    double appliquer(double montant);
}

public class ServiceCommande {
    private final RegleRemise regle;

    public ServiceCommande(RegleRemise regle) { this.regle = regle; } // interchangeable

    public double calculerTotal(double montant) { return regle.appliquer(montant); }
}

// Version lambda, sans interface dédiée à écrire
ServiceCommande service = new ServiceCommande(montant -> montant * 0.90);
```

**Problème résolu** : choisir un algorithme (une règle de remise parmi plusieurs) sans `if`/`switch` dans le code appelant, et pouvoir en ajouter un nouveau sans toucher à `ServiceCommande`. Depuis Java 8, si la stratégie n'a qu'une seule méthode abstraite, une interface fonctionnelle standard (`Function`, `Predicate`) et une lambda suffisent — l'interface `RegleRemise` dédiée ne se justifie que si son nom clarifie l'intention ou si plusieurs méthodes sont nécessaires.

### Exemple 2 — Patron de méthode et son alternative par composition

```java
// Patron de méthode classique : le squelette est fixé, les étapes varient par héritage
public abstract class ExportateurCommande {
    public final String exporter(Commande commande) {
        return enTete() + corps(commande) + piedDePage();
    }
    protected abstract String enTete();
    protected abstract String corps(Commande commande);
    protected String piedDePage() { return ""; } // étape optionnelle, valeur par défaut
}
```

```java
// Alternative par composition : une interface injectée plutôt qu'une hiérarchie
public interface Formateur {
    String enTete();
    String corps(Commande commande);
    default String piedDePage() { return ""; }
}

public class ExportateurCommande {
    private final Formateur formateur;

    public ExportateurCommande(Formateur formateur) { this.formateur = formateur; }

    public String exporter(Commande commande) {
        return formateur.enTete() + formateur.corps(commande) + formateur.piedDePage();
    }
}
```

La version par composition évite de figer la relation à la compilation (une seule classe mère possible en Java) et se teste indépendamment : un `Formateur` factice se construit sans instancier `ExportateurCommande`. Elle se combine aussi librement avec d'autres comportements, ce qu'un héritage unique interdit.

### Exemple 3 — Observateur et ses alternatives modernes

```java
// Version classique : interface Observateur dédiée
public interface ObservateurCommande {
    void surChangementStatut(Commande commande);
}

public class Commande {
    private final List<ObservateurCommande> observateurs = new ArrayList<>();
    public void ajouterObservateur(ObservateurCommande o) { observateurs.add(o); }

    public void changerStatut(StatutCommande nouveau) {
        // ... mettre à jour le statut ...
        observateurs.forEach(o -> o.surChangementStatut(this));
    }
}
```

```java
// Alternative fonctionnelle : List<Consumer<Commande>>, sans interface à écrire
private final List<Consumer<Commande>> ecouteurs = new ArrayList<>();
public void ajouterEcouteur(Consumer<Commande> ecouteur) { ecouteurs.add(ecouteur); }
```

```java
// Alternative Spring : événement applicatif découplé du code qui le déclenche
applicationEventPublisher.publishEvent(new CommandeStatutChangeEvent(commande));

@EventListener
void surChangementStatut(CommandeStatutChangeEvent evenement) { /* ... */ }
```

Les trois versions résolvent le même problème (notifier sans coupler l'émetteur à chaque destinataire), avec un couplage décroissant : l'interface classique lie l'observateur à un type précis, la version fonctionnelle accepte n'importe quel `Consumer`, les événements applicatifs découplent totalement l'émetteur des écouteurs (qui n'ont pas besoin d'être enregistrés directement sur `Commande`).

### Exemple 4 — Commande

```java
public interface ActionCommande {
    void executer();
}

public class AnnulerCommande implements ActionCommande {
    private final Commande commande;
    private final ServiceStock stock;

    @Override
    public void executer() {
        commande.annuler();
        stock.reapprovisionner(commande.getLignes());
    }
}

// Les actions peuvent être mises en file d'attente, journalisées, rejouées
Queue<ActionCommande> actionsEnAttente = new ArrayDeque<>();
actionsEnAttente.add(new AnnulerCommande(commande, stock));
```

**Problème résolu** : sans ce patron, `commande.annuler()` s'exécuterait immédiatement et directement. En l'encapsulant dans un objet `ActionCommande`, l'action peut être différée, mise en file, journalisée pour audit, ou combinée à une pile d'actions pour permettre un « annuler la dernière action ».

### Exemple 5 — Itérateur, déjà dans le JDK

```java
public class CatalogueProduits implements Iterable<Produit> {
    private final List<Produit> produits;

    @Override
    public Iterator<Produit> iterator() { return produits.iterator(); }
}

// Le for-each utilise directement le patron itérateur, sans le nommer
for (Produit produit : catalogue) {
    System.out.println(produit.nom());
}
```

Implémenter `Iterable` sur une collection maison suffit à profiter du `for-each` et de tout ce qui accepte un `Iterable` — écrire son propre `Iterator` à la main (gestion manuelle de `hasNext()`/`next()`) reste rare, réservé à un parcours réellement particulier (arborescence, flux paginé).

### Exemple 6 — État

```java
public interface EtatCommande {
    EtatCommande payer();
    EtatCommande expedier();
}

public class EnAttente implements EtatCommande {
    @Override public EtatCommande payer() { return new Payee(); }
    @Override public EtatCommande expedier() {
        throw new IllegalStateException("Impossible d'expédier une commande non payée");
    }
}

public class Payee implements EtatCommande {
    @Override public EtatCommande payer() { throw new IllegalStateException("Déjà payée"); }
    @Override public EtatCommande expedier() { return new Expediee(); }
}
```

**Problème résolu** : sans ce patron, chaque méthode de `Commande` contiendrait un `if (statut == EN_ATTENTE) ... else if (statut == PAYEE) ...` répété partout où le statut compte. En déléguant le comportement à une classe par état, chaque transition n'existe qu'à un seul endroit, et un état qui ne supporte pas une transition (`EnAttente.expedier()`) l'exprime explicitement plutôt que par un `if` oublié.

### Exemple 7 — Chaîne de responsabilité

```java
public abstract class ValidateurCommande {
    private ValidateurCommande suivant;

    public ValidateurCommande suivant(ValidateurCommande suivant) {
        this.suivant = suivant;
        return suivant;
    }

    public final void valider(Commande commande) {
        verifier(commande);
        if (suivant != null) suivant.valider(commande);
    }

    protected abstract void verifier(Commande commande);
}

public class VerifierStock extends ValidateurCommande {
    @Override protected void verifier(Commande commande) { /* lève une exception si rupture */ }
}

ValidateurCommande chaine = new VerifierStock();
chaine.suivant(new VerifierPaiement()).suivant(new VerifierAdresse());
chaine.valider(commande);
```

**Problème résolu** : ajouter ou retirer une étape de validation (stock, paiement, adresse) sans modifier une méthode `validerCommande()` monolithique qui les enchaînerait toutes. Chaque validateur ne connaît que le suivant, pas l'ensemble de la chaîne.

### Exemple 8 — Visiteur, et pourquoi le filtrage par motif le rend souvent inutile

```java
// Visiteur classique : double dispatch accept/visit
public interface LigneCommande {
    <R> R accepter(VisiteurLigne<R> visiteur);
}
public interface VisiteurLigne<R> {
    R visiter(ArticleUnique article);
    R visiter(LotArticles lot);
}
public class ArticleUnique implements LigneCommande {
    @Override public <R> R accepter(VisiteurLigne<R> v) { return v.visiter(this); }
}
```

```java
// Alternative Java moderne : classes scellées + filtrage par motif sur switch
public sealed interface LigneCommande permits ArticleUnique, LotArticles { }

double poids = switch (ligne) {
    case ArticleUnique a -> a.poids();
    case LotArticles l -> l.articles().stream().mapToDouble(ArticleUnique::poids).sum();
    // exhaustif : le compilateur signale une erreur si un cas de la hiérarchie scellée manque
};
```

Le visiteur existait pour ajouter une opération (`calculerPoids`, `exporterCsv`, ...) à une hiérarchie fermée sans modifier ses classes, avec une garantie d'exhaustivité obtenue via la paire `accept`/`visit`. Une hiérarchie **scellée** (`sealed`) associée à un `switch` avec filtrage par motif obtient la même exhaustivité, vérifiée par le compilateur, sans le mécanisme de double dispatch ni les interfaces `accept`/`visit` à maintenir. Le visiteur classique garde un intérêt quand la hiérarchie n'est pas scellée (extensible par du code tiers) — voir le chapitre Java moderne pour le détail de cette syntaxe.

### Problème → patron

| Problème | Patron |
|---|---|
| Changer un algorithme à l'exécution | Stratégie |
| Squelette d'algorithme fixe, étapes variables | Patron de méthode (ou composition) |
| Notifier plusieurs objets d'un changement | Observateur |
| Encapsuler une action pour la stocker, la rejouer ou l'annuler | Commande |
| Parcourir une collection sans exposer sa structure | Itérateur |
| Comportement qui change selon un état interne | État |
| Suite de vérifications ou de traitements optionnels | Chaîne de responsabilité |
| Ajouter une opération à une hiérarchie fermée de types | Visiteur, ou filtrage par motif sur classes scellées |

### Pièges courants

> **Écrire une interface Observateur ou Stratégie dédiée alors qu'une interface fonctionnelle du JDK suffit.** Si le besoin se résume à une seule méthode abstraite, `Function`, `Consumer`, `Predicate` ou `Supplier` évitent une interface et une implémentation supplémentaires à maintenir.

> **Utiliser le patron de méthode pour un besoin qui varie souvent ou doit être testé isolément.** L'héritage fige la relation à la compilation ; si les étapes doivent être combinées, remplacées à l'exécution ou testées seules, une interface injectée (composition) est presque toujours préférable.

> **Garder un visiteur accept/visit sur une hiérarchie scellée par nostalgie.** Une fois la hiérarchie scellée et le filtrage par motif disponibles (Java 17 et 21), le visiteur classique n'apporte plus rien de plus que le switch exhaustif, pour davantage de code à maintenir.

### À retenir

- La plupart des patrons de comportement d'origine (stratégie, observateur) se réduisent aujourd'hui à une interface fonctionnelle et une lambda, sans classe dédiée.
- Le patron de méthode fige une relation par héritage ; sa version par composition (une interface injectée) est presque toujours plus flexible et plus testable.
- L'itérateur est déjà résolu par `Iterable`/`Iterator` et le `for-each` — il n'y a presque jamais de raison d'en écrire un à la main.
- Le visiteur perd une grande partie de son intérêt face au filtrage par motif sur des classes scellées, qui obtient la même exhaustivité vérifiée par le compilateur avec moins de code.
- Reconnaître le **problème** (tableau ci-dessus) avant de choisir un patron évite d'en plaquer un qui ne correspond pas à la situation réelle.
