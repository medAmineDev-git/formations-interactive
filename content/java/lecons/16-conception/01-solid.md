---
id: solid
chapitre: conception
ordre: 1
titre: "Les principes SOLID"
termes:
  - terme: SOLID
    definition: "Acronyme de cinq principes de conception orientée objet : responsabilité unique (**S**), ouvert/fermé (**O**), substitution de Liskov (**L**), ségrégation des interfaces (**I**), inversion des dépendances (**D**). Ce sont des **guides** pour repérer un mauvais signe dans une conception, pas des règles à appliquer mécaniquement."
  - terme: "Responsabilité unique (SRP)"
    definition: "Une classe ne devrait avoir qu'une seule raison de changer. Le symptôme qui alerte : une classe qui change pour des raisons totalement indépendantes (une règle métier d'un côté, un format d'export de l'autre)."
  - terme: "Ouvert/fermé (OCP)"
    definition: "Le code devrait être ouvert à l'extension (ajouter un comportement) mais fermé à la modification (sans toucher au code existant qui fonctionne déjà). Le symptôme qui alerte : ajouter un cas oblige systématiquement à modifier un `switch` ou une suite de `if` déjà en place."
  - terme: "Substitution de Liskov (LSP)"
    definition: "Une sous-classe doit pouvoir remplacer sa classe mère partout où celle-ci est attendue, sans surprise pour le code appelant. Le symptôme qui alerte : une sous-classe qui lève `UnsupportedOperationException` ou change le contrat d'une méthode héritée."
  - terme: "Ségrégation des interfaces (ISP)"
    definition: "Mieux vaut plusieurs petites interfaces spécifiques qu'une seule interface obèse. Le symptôme qui alerte : une classe qui implémente une interface mais laisse la moitié des méthodes vides ou lève une exception dedans."
  - terme: "Inversion des dépendances (DIP)"
    definition: "Les modules de haut niveau ne devraient pas dépendre de modules de bas niveau, tous deux devraient dépendre d'abstractions. En pratique : dépendre d'une interface, pas d'une classe concrète."
  - terme: Injection de dépendances
    definition: "Technique qui fournit ses dépendances à un objet de l'extérieur (constructeur, setter) plutôt que de les créer lui-même avec `new`. C'est la mise en œuvre la plus courante du principe d'inversion des dépendances — au cœur du conteneur Spring."
quiz:
  - question: "Ce code parcourt une liste de moyens de paiement pour appliquer une remise. Que se passe-t-il si la liste contient une CarteCadeau ?"
    code: |
      public class CarteCadeau extends MoyenPaiement {
          @Override
          public void appliquerRemise(double pourcentage) {
              throw new UnsupportedOperationException("Une carte cadeau ne peut pas être remisée");
          }
      }

      for (MoyenPaiement mp : moyensPaiement) {
          mp.appliquerRemise(10);
      }
    choix:
      - "Rien de spécial : la remise est simplement ignorée pour la carte cadeau"
      - "UnsupportedOperationException interrompt la boucle : le code appelant, écrit pour le type MoyenPaiement, ne peut pas anticiper que cette sous-classe se comporte différemment"
      - "Erreur de compilation : une sous-classe ne peut jamais lever une exception non déclarée par la classe mère"
      - "Java ignore silencieusement l'appel car CarteCadeau redéfinit la méthode"
    reponse: 1
    explication: "C'est une violation typique du principe de substitution de Liskov : le code appelant manipule des MoyenPaiement sans savoir qu'un sous-type particulier va exploser à l'exécution. UnsupportedOperationException est une RuntimeException, donc rien n'empêche la compilation — le problème n'apparaît qu'en production, au pire moment."
  - question: "Pour ajouter un nouveau type de client VIP à cette méthode, quelle approche respecte le principe ouvert/fermé ?"
    code: |
      double calculerRemise(TypeClient type, double montant) {
          switch (type) {
              case STANDARD -> { return 0; }
              case PREMIUM -> { return montant * 0.10; }
              // il faut ajouter un case VIP ici à chaque nouveau type
          }
      }
    choix:
      - "Ajouter un nouveau case VIP dans ce switch : c'est la seule façon possible en Java"
      - "Remplacer le switch par une abstraction (une interface RegleRemise implémentée par chaque type de client) pour ajouter le nouveau cas sans modifier le code existant"
      - "Dupliquer toute la méthode calculerRemise pour créer une version spécifique à VIP"
      - "Le principe ouvert/fermé interdit d'ajouter de nouveaux types de client"
    reponse: 1
    explication: "Le switch oblige à modifier un fichier qui fonctionne déjà et qui est potentiellement déjà testé et déployé, à chaque nouveau cas. Une abstraction (interface + implémentations, ou une Map<TypeClient, RegleRemise>) permet d'ajouter une classe sans toucher au code existant. À nuancer : sur un ensemble de cas fermé et connu, un switch exhaustif sur une hiérarchie scellée peut rester un choix délibéré, voir la leçon sur la conception moderne."
  - question: "Une interface GestionnaireCommande déclare valider(), annuler(), exporterPdf() et envoyerSms(). Une classe ValidateurStock, qui ne fait que valider le stock disponible, doit l'implémenter et laisse les trois autres méthodes vides. Quel principe est en cause ?"
    choix:
      - "SRP — il faudrait au contraire fusionner encore plus de méthodes dans cette interface"
      - "ISP — il faut scinder l'interface en plusieurs interfaces plus petites, chacune correspondant à un besoin réel de ses implémentations"
      - "LSP — ValidateurStock ne devrait jamais implémenter d'interface"
      - "DIP — il faut que ValidateurStock dépende directement d'une classe concrète plutôt que d'une interface"
    reponse: 1
    explication: "C'est une interface obèse : elle force ses implémentations à porter des méthodes qui ne les concernent pas. La ségrégation des interfaces consiste à découper GestionnaireCommande en interfaces plus fines (ValidateurCommande, ExporteurCommande, NotificateurCommande) que chaque classe implémente seulement pour ce dont elle a réellement besoin."
---

## Essentiel

**SOLID** regroupe cinq principes qui aident à repérer une conception fragile — pas des règles à cocher :

- **S**RP — une classe, une seule raison de changer.
- **O**CP — ajouter un comportement sans modifier le code existant.
- **L**SP — une sous-classe doit tenir les promesses de sa classe mère.
- **I**SP — préférer plusieurs interfaces ciblées à une seule interface fourre-tout.
- **D**IP — dépendre d'abstractions, pas de détails concrets.

```java
// Violation de DIP : ServicePaiement crée lui-même sa dépendance concrète
public class ServicePaiement {
    private final PasserellePaiementStripe passerelle = new PasserellePaiementStripe();
}

// Respect de DIP : ServicePaiement dépend d'une abstraction, reçue de l'extérieur
public class ServicePaiement {
    private final PasserellePaiement passerelle; // interface

    public ServicePaiement(PasserellePaiement passerelle) {
        this.passerelle = passerelle;
    }
}
```

Chaque principe a un **symptôme concret** qui doit alerter en lisant ou en relisant du code : une classe aux raisons de changer multiples (SRP), un `switch` qu'il faut rouvrir à chaque nouveau cas (OCP), une sous-classe qui lève une exception là où la classe mère ne l'aurait jamais fait (LSP), une interface dont la moitié des méthodes ne concernent pas l'implémentation (ISP), une classe qui instancie elle-même ses dépendances avec `new` (DIP).

Ces principes se contredisent parfois entre eux ou avec la simplicité : les appliquer aveuglément sur un petit projet crée souvent plus d'abstractions que de valeur.

## Détail

### Exemple 1 — Responsabilité unique (SRP)

```java
// Avant : une seule classe change pour des raisons indépendantes
public class Commande {
    private List<LigneCommande> lignes;

    public double calculerTotal() { /* règle métier */ return 0; }

    public void sauvegarder() { /* écrit en base de données */ }

    public String genererTicketHtml() { /* met en forme pour impression */ return ""; }
}
```

`Commande` change si la règle de calcul du total évolue, si le schéma de base de données change, ou si le format du ticket change — trois équipes différentes, trois raisons de modifier le même fichier, trois sources de conflits git et de régressions croisées.

```java
// Après : une responsabilité par classe
public class Commande {
    private List<LigneCommande> lignes;
    public double calculerTotal() { /* règle métier */ return 0; }
}

public class CommandeRepository {
    public void sauvegarder(Commande commande) { /* accès aux données */ }
}

public class TicketCommandeFormatter {
    public String versHtml(Commande commande) { /* présentation */ return ""; }
}
```

**Le symptôme à surveiller** : dans l'historique git, une classe modifiée pour des raisons sans rapport (une fois pour une règle de remise, une fois pour un format d'export) est un signal fort de responsabilités mélangées.

### Exemple 2 — Ouvert/fermé (OCP)

```java
// Avant : ajouter un type de client oblige à modifier ce switch
double calculerRemise(TypeClient type, double montant) {
    return switch (type) {
        case STANDARD -> 0;
        case PREMIUM -> montant * 0.10;
        case VIP -> montant * 0.20; // ajouté à chaque nouveau cas
    };
}
```

```java
// Après : ajouter un client = ajouter une classe, sans toucher à l'existant
public interface RegleRemise {
    double calculer(double montant);
}

public class RemisePremium implements RegleRemise {
    @Override
    public double calculer(double montant) { return montant * 0.10; }
}

// Un nouveau type de client = une nouvelle implémentation, le code appelant ne change pas
double remise = regleRemiseDuClient.calculer(montant);
```

**Le symptôme à surveiller** : un `switch` métier qui revient régulièrement dans les diffs de code review à chaque nouvelle fonctionnalité est le signe qu'il gagnerait à devenir une abstraction. Nuance importante : sur un ensemble de cas **fermé et stable** (voir la leçon sur la conception moderne), un `switch` exhaustif sur une hiérarchie scellée reste souvent préférable — le compilateur garantit qu'aucun cas n'est oublié, ce qu'une interface ouverte ne peut pas offrir.

### Exemple 3 — Substitution de Liskov (LSP)

```java
public abstract class MoyenPaiement {
    public abstract void appliquerRemise(double pourcentage);
}

public class PaiementCarte extends MoyenPaiement {
    @Override
    public void appliquerRemise(double pourcentage) { /* réduit le montant à débiter */ }
}

// Violation : une sous-classe qui trahit le contrat de la classe mère
public class CarteCadeau extends MoyenPaiement {
    @Override
    public void appliquerRemise(double pourcentage) {
        throw new UnsupportedOperationException("Une carte cadeau ne peut pas être remisée");
    }
}
```

Tout code qui manipule une `List<MoyenPaiement>` et appelle `appliquerRemise(...)` sur chaque élément — parfaitement correct pour `PaiementCarte` — plante à l'exécution dès qu'une `CarteCadeau` s'y glisse. Le contrat implicite de `MoyenPaiement` (« on peut toujours appliquer une remise ») est rompu par une seule sous-classe.

```java
// Correction : ne pas forcer une méthode que tous les moyens de paiement ne supportent pas
public abstract class MoyenPaiement { /* pas de appliquerRemise() ici */ }

public interface Remisable {
    void appliquerRemise(double pourcentage);
}

public class PaiementCarte extends MoyenPaiement implements Remisable { /* ... */ }
public class CarteCadeau extends MoyenPaiement { /* n'implémente pas Remisable, un point c'est tout */ }
```

En sortant `appliquerRemise(...)` du contrat commun, le compilateur empêche désormais d'appeler cette méthode sur une `CarteCadeau` — l'erreur devient impossible à la compilation plutôt qu'une surprise à l'exécution.

### Exemple 4 — Ségrégation des interfaces (ISP)

```java
// Avant : interface obèse, une seule classe couvre tout ou triche
public interface GestionnaireCommande {
    void valider(Commande commande);
    void annuler(Commande commande);
    String exporterPdf(Commande commande);
    void envoyerSms(Commande commande);
}

public class ValidateurStock implements GestionnaireCommande {
    @Override
    public void valider(Commande commande) { /* vérifie le stock */ }
    @Override
    public void annuler(Commande commande) { throw new UnsupportedOperationException(); }
    @Override
    public String exporterPdf(Commande commande) { throw new UnsupportedOperationException(); }
    @Override
    public void envoyerSms(Commande commande) { throw new UnsupportedOperationException(); }
}
```

```java
// Après : une interface par besoin réel
public interface ValidateurCommande { void valider(Commande commande); }
public interface ExporteurCommande { String exporterPdf(Commande commande); }
public interface NotificateurCommande { void envoyerSms(Commande commande); }

public class ValidateurStock implements ValidateurCommande {
    @Override
    public void valider(Commande commande) { /* vérifie le stock */ }
}
```

`ValidateurStock` n'implémente désormais que ce qu'il sait vraiment faire, sans méthodes fantômes qui lèvent une exception ou ne font rien.

### Exemple 5 — Inversion des dépendances (DIP)

```java
// Avant : le module de haut niveau connaît un détail d'implémentation concret
public class ServicePaiement {
    private final PasserellePaiementStripe passerelle = new PasserellePaiementStripe();

    public void payer(Commande commande) {
        passerelle.debiter(commande.getMontant());
    }
}
```

Impossible de tester `ServicePaiement` sans appeler la vraie API Stripe, et impossible de changer de fournisseur sans modifier `ServicePaiement`.

```java
// Après : ServicePaiement dépend d'une abstraction, injectée de l'extérieur
public interface PasserellePaiement {
    void debiter(double montant);
}

public class ServicePaiement {
    private final PasserellePaiement passerelle;

    public ServicePaiement(PasserellePaiement passerelle) { // injection par constructeur
        this.passerelle = passerelle;
    }

    public void payer(Commande commande) {
        passerelle.debiter(commande.getMontant());
    }
}
```

`ServicePaiement` peut maintenant être testé avec une implémentation factice de `PasserellePaiement`, et changer de fournisseur de paiement ne touche à aucune ligne de `ServicePaiement`. C'est exactement ce que fait l'**injection de dépendances** de Spring : un `@Service` déclare dépendre d'une interface, le conteneur choisit et fournit l'implémentation concrète au démarrage.

### Pièges courants

> **Créer une interface avec une seule implémentation « juste pour respecter DIP ».** Si aucun second fournisseur n'est prévu et que rien ne justifie un remplacement (test ou variante), l'interface n'ajoute qu'un fichier à ouvrir sans bénéfice réel. DIP se justifie quand une vraie variation existe ou est attendue (tests, plusieurs fournisseurs).

> **Découper à l'extrême au nom du SRP.** Une classe avec une seule méthode privée extraite « pour faire propre » multiplie les fichiers sans réduire les raisons de changer. La bonne granularité s'évalue par les raisons de changement réelles du projet, pas par un objectif de petitesse.

> **Confondre LSP avec « la sous-classe doit tout redéfinir ».** LSP porte sur le **comportement observé** par le code appelant (pas d'exception surprise, pas de précondition renforcée, pas de postcondition affaiblie), pas sur l'obligation de redéfinir chaque méthode.

### À retenir

- SOLID donne un vocabulaire et des symptômes pour discuter d'une conception, pas une checklist à cocher avant chaque commit.
- Le symptôme le plus utile à repérer : une classe aux raisons de changer multiples (SRP), un `switch` rouvert à chaque cas (OCP), une sous-classe qui surprend l'appelant (LSP), une interface aux méthodes non pertinentes (ISP), une dépendance créée avec `new` au lieu d'être injectée (DIP).
- L'inversion des dépendances est la base de l'injection de dépendances : dépendre d'une interface, laisser un tiers (ou un conteneur comme Spring) fournir l'implémentation.
- Appliquer un principe sans qu'un problème réel le justifie ajoute de la complexité sans bénéfice — l'objectif reste un code plus facile à faire évoluer, pas plus d'abstractions.
- Ces cinq principes s'articulent souvent ensemble dans un même refactoring : corriger l'ISP de l'exemple 4 a aussi renforcé l'OCP et facilité les tests.
