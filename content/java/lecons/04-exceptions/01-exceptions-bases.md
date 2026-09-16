---
id: exceptions-bases
chapitre: exceptions
ordre: 1
titre: Comprendre les exceptions
termes:
  - terme: Throwable
    definition: "Racine de toute la hiérarchie des exceptions en Java. Seuls les objets dont la classe hérite de `Throwable` peuvent être lancés avec `throw` et interceptés avec `catch`. Ses deux branches sont `Error` et `Exception`."
  - terme: Error
    definition: "Problème grave lié à la JVM elle-même (`OutOfMemoryError`, `StackOverflowError`), que le code applicatif n'est en général pas censé intercepter ni pouvoir corriger."
  - terme: Exception vérifiée (checked)
    definition: "Sous-classe de `Exception` qui n'hérite **pas** de `RuntimeException` (ex. `IOException`). Le compilateur oblige à la traiter : soit un `catch`, soit un `throws` dans la signature de la méthode."
  - terme: Exception non vérifiée (unchecked)
    definition: "Sous-classe de `RuntimeException` (ex. `IllegalArgumentException`). Le compilateur n'exige rien : elle peut se propager sans `catch` ni `throws`, jusqu'à faire planter le programme si personne ne l'intercepte."
  - terme: "throws"
    definition: "Mot-clé dans la signature d'une méthode qui annonce qu'elle peut laisser propager tel type d'exception, sans la traiter elle-même. Obligatoire pour les exceptions vérifiées, facultatif (mais parfois utile en documentation) pour les non vérifiées."
  - terme: Pile d'appels (stack trace)
    definition: "Liste des méthodes en cours d'exécution au moment où l'exception a été créée, de la plus récente à la plus ancienne. Affichée par `printStackTrace()` ou par défaut quand une exception non interceptée remonte jusqu'au programme principal."
  - terme: "Caused by"
    definition: "Ligne d'une pile d'appels qui indique la **cause d'origine** d'une exception encapsulée dans une autre (voir `Throwable.getCause()`). Permet de remonter à l'erreur technique initiale sans perdre le contexte métier ajouté au passage."
  - terme: Multi-catch
    definition: "Syntaxe `catch (TypeA | TypeB e)` qui traite plusieurs types d'exceptions indépendants de la même façon dans un seul bloc, pour éviter de dupliquer le code."
quiz:
  - question: "Ce code compile-t-il ?"
    code: |
      try {
          verifierStock(produit);
      } catch (Exception e) {
          journaliser(e);
      } catch (IllegalArgumentException e) {
          System.out.println("Argument invalide");
      }
    choix:
      - "Oui, l'ordre des blocs `catch` n'a pas d'importance"
      - "Non : erreur de compilation, le bloc `catch (IllegalArgumentException e)` est inaccessible car déjà couvert par le `catch (Exception e)` précédent"
      - "Oui, mais seul le premier `catch` sera exécuté à l'exécution"
      - "Non : on ne peut pas avoir deux blocs `catch` pour le même `try`"
    reponse: 1
    explication: "`IllegalArgumentException` est une sous-classe de `Exception` : le premier `catch` l'intercepterait déjà, ce qui rend le second inaccessible. Le compilateur refuse ce code (« exception IllegalArgumentException has already been caught »). Règle : toujours cataloguer les `catch` du plus spécifique au plus général."
  - question: "`lireFichierCatalogue()` déclare `throws IOException`. Que se passe-t-il si on l'appelle sans `try/catch` ni `throws` dans la méthode appelante ?"
    code: |
      public void chargerCatalogue() {
          List<Produit> produits = lireFichierCatalogue(); // throws IOException
      }
    choix:
      - "Le code compile, l'exception remonte automatiquement à l'appelant"
      - "Erreur de compilation : exception vérifiée non capturée ni déclarée"
      - "Une `RuntimeException` est levée automatiquement à la place"
      - "Le code compile mais un avertissement s'affiche à l'exécution"
    reponse: 1
    explication: "`IOException` est une exception **vérifiée** : le compilateur exige qu'elle soit interceptée (`try/catch`) ou déclarée (`throws IOException` sur `chargerCatalogue`). Sans l'un des deux, javac refuse de compiler (« unreported exception IOException; must be caught or declared to be thrown »)."
  - question: "Que produit ce code à l'exécution ?"
    code: |
      Commande commande = null;
      System.out.println(commande.getMontant());
    choix:
      - "Une `NullPointerException` avec un message générique sans détail"
      - "Une `NullPointerException`, avec un message précisant que `commande` est `null` et quel appel a échoué"
      - "Le programme affiche `0` puis continue"
      - "Une erreur de compilation"
    reponse: 1
    explication: "Depuis Java 15 (activé par défaut), la JVM produit des messages de `NullPointerException` détaillés, du type « Cannot invoke \"Commande.getMontant()\" because \"commande\" is null » : plus besoin de deviner quelle variable était `null`."
---

## Essentiel

Toutes les exceptions Java héritent de `Throwable`, qui se divise en deux branches : `Error` (problèmes graves de la JVM, à ne pas gérer soi-même) et `Exception` (le reste). `Exception` se divise à son tour : `RuntimeException` et ses sous-classes sont **non vérifiées**, tout le reste est **vérifié**.

```java
public class GestionnaireCommandes {

    public void traiter(Commande commande) {
        try {
            valider(commande);          // peut lever une IllegalArgumentException (non vérifiée)
            enregistrer(commande);      // peut lever une IOException (vérifiée)
        } catch (IllegalArgumentException e) {
            System.out.println("Commande invalide : " + e.getMessage());
        } catch (IOException e) {
            System.out.println("Échec d'enregistrement : " + e.getMessage());
        } finally {
            libererRessources();
        }
    }
}
```

Le `finally` s'exécute **toujours** : que le `try` réussisse, qu'une exception soit attrapée, ou même qu'aucun `catch` ne corresponde. C'est l'endroit pour un nettoyage indispensable.

Différence essentielle : le compilateur **oblige** à traiter une exception vérifiée (`catch` ou `throws` dans la signature), alors qu'une exception non vérifiée peut se propager librement — c'est au développeur de décider où l'intercepter.

## Détail

### La hiérarchie

```
Throwable
├── Error                          (OutOfMemoryError, StackOverflowError…)
└── Exception
    ├── IOException                (vérifiée)
    ├── SQLException                (vérifiée)
    └── RuntimeException           (non vérifiée)
        ├── NullPointerException
        ├── IllegalArgumentException
        │   └── NumberFormatException
        ├── IllegalStateException
        └── IndexOutOfBoundsException
```

Une exception est « vérifiée » ou non uniquement selon sa position dans cette hiérarchie : hériter de `RuntimeException` (directement ou indirectement) suffit à la rendre non vérifiée.

### Exemple 1 — Vérifiée vs non vérifiée, à l'écriture

```java
// Vérifiée : le compilateur imposera un catch ou un throws à chaque appelant
public class StockIndisponibleException extends Exception {
    public StockIndisponibleException(String message) {
        super(message);
    }
}

// Non vérifiée : libre de se propager sans obligation
public class PaiementRefuseException extends RuntimeException {
    public PaiementRefuseException(String message) {
        super(message);
    }
}
```

### Exemple 2 — Multi-catch

```java
try {
    int quantite = Integer.parseInt(champQuantite);
    Produit produit = catalogue.get(codeProduit);
    produit.reduireStock(quantite);
} catch (NumberFormatException | NullPointerException e) {
    System.out.println("Saisie invalide : " + e.getMessage());
}
```

Utile quand plusieurs types d'exceptions **sans lien de parenté directe** appellent le même traitement. Si l'un des types est sous-classe de l'autre, le multi-catch est inutile : seul le type le plus général suffit.

### Exemple 3 — Propagation et `throws`

```java
public class CatalogueService {

    public List<Produit> lireFichierCatalogue(Path chemin) throws IOException {
        return Files.readAllLines(chemin).stream()
                .map(Produit::depuisLigne)
                .toList();
    }
}

public class ApplicationCatalogue {

    public void demarrer() {
        try {
            List<Produit> produits = catalogueService.lireFichierCatalogue(Path.of("catalogue.csv"));
        } catch (IOException e) {
            System.out.println("Impossible de charger le catalogue : " + e.getMessage());
        }
    }
}
```

`lireFichierCatalogue` ne traite pas l'erreur, elle la **déclare** avec `throws IOException` : c'est l'appelant, `demarrer()`, qui décide de l'intercepter. L'exception remonte la pile d'appels jusqu'au premier `catch` compatible ; si aucun ne l'intercepte, elle atteint le point d'entrée du programme et l'arrête.

### Exemple 4 — Lire une pile d'appels

```
Exception in thread "main" fr.boutique.ServiceIndisponibleException: Échec du paiement
	at fr.boutique.PaiementService.payer(PaiementService.java:42)
	at fr.boutique.CommandeService.valider(CommandeService.java:17)
	at fr.boutique.Application.main(Application.java:9)
Caused by: java.net.ConnectException: Connection refused
	at fr.boutique.PaiementClient.appeler(PaiementClient.java:23)
	at fr.boutique.PaiementService.payer(PaiementService.java:40)
	... 2 more
```

Se lit de haut en bas : le type et le message de l'exception, puis la pile au moment où elle a été **créée** (méthode la plus récente en premier). Le bloc `Caused by` indique qu'une exception technique (`ConnectException`) a été capturée puis enveloppée dans une exception métier (`ServiceIndisponibleException`) — souvent via un constructeur avec cause (voir la leçon sur les exceptions métier). `... 2 more` signale des lignes communes avec la pile précédente, non répétées.

### Exceptions les plus fréquentes

| Exception | Cause typique |
|---|---|
| `NullPointerException` | Appel d'une méthode ou accès à un champ sur une référence `null` |
| `IllegalArgumentException` | Un argument passé à une méthode ne respecte pas un contrat attendu |
| `IllegalStateException` | La méthode est appelée alors que l'objet n'est pas dans un état valide pour ça |
| `NumberFormatException` | `Integer.parseInt("abc")` ou équivalent : la chaîne n'est pas un nombre valide |
| `IndexOutOfBoundsException` | Index hors bornes sur un tableau ou une liste (`ArrayIndexOutOfBoundsException`, `StringIndexOutOfBoundsException` en sont des sous-classes) |

### Pièges courants

> **`catch (Exception e)` trop large.** Attraper `Exception` capture aussi les erreurs de programmation qu'on préférerait voir planter tôt (bug plutôt masqué que corrigé). Cibler le type précis attendu, et ne remonter à un type large qu'en dernier recours documenté (voir la leçon sur les exceptions métier).

> **Ordre des `catch` incorrect.** Un `catch` pour un type général avant un `catch` pour une de ses sous-classes rend ce second bloc inaccessible : erreur de compilation. Toujours ordonner du plus spécifique au plus général.

> **Oublier que `Error` n'est pas fait pour être attrapé.** `catch (Error e)` ou pire `catch (Throwable e)` compile, mais intercepte aussi des situations comme `OutOfMemoryError`, où le programme n'est généralement plus en état de continuer proprement.

### À retenir

- `Throwable` → `Error` (JVM, à ne pas gérer) et `Exception` (applicatif).
- `RuntimeException` et ses sous-classes = non vérifiées, pas d'obligation du compilateur ; le reste = vérifiées, `catch` ou `throws` obligatoire.
- `finally` s'exécute toujours, y compris après un `return` dans le `try`.
- Ordonner les `catch` du plus spécifique au plus général.
- Une pile d'appels se lit de haut en bas ; `Caused by` remonte à la cause d'origine d'une exception encapsulée.
