---
id: pattern-matching
chapitre: java-moderne
ordre: 1
titre: "Le filtrage par motif"
termes:
  - terme: Filtrage par motif (pattern matching)
    definition: "Mécanisme qui fusionne un **test** (« cette valeur a-t-elle telle forme ? ») et une **extraction** (« si oui, donne-m'en les morceaux ») en une seule expression. En Java, il s'applique à `instanceof`, à `switch` et, à l'intérieur de ces motifs, aux composants d'un record."
  - terme: Variable de motif (pattern variable)
    definition: "Variable introduite par un `instanceof` avec motif (`obj instanceof String s`) ou par un `case` de `switch`. Finalisée pour `instanceof` par le **JEP 394** en **Java 16**. Sa portée est limitée aux endroits où le compilateur peut prouver que le motif a été vérifié (voir « Détail »)."
  - terme: Filtrage par motif pour switch
    definition: "Extension de `switch` pour tester le **type** (ou la structure) d'une valeur dans chaque `case`, avec un `case null` explicite possible et une vérification d'**exhaustivité** par le compilateur. Finalisé par le **JEP 441** en **Java 21**."
  - terme: Garde de motif (guard, `when`)
    definition: "Clause booléenne additionnelle sur un `case` (`case String s when s.length() > 10 ->`), évaluée seulement si le motif correspond déjà. Permet d'affiner un cas sans casser l'exhaustivité du `switch`."
  - terme: Motif de record (record pattern)
    definition: "Motif qui **déconstruit** un record directement dans un `instanceof` ou un `case` (`case Point(int x, int y) ->`), en extrayant ses composants sans appeler leurs accesseurs. Les motifs de record peuvent s'**imbriquer** pour déconstruire des records composés en une seule étape. Finalisés par le **JEP 440** en **Java 21**."
  - terme: Motifs sur types primitifs
    definition: "Extension proposée du filtrage par motif aux types primitifs (`case int i when i > 0 ->`, `instanceof` sur `int`/`double`...). **Toujours en aperçu (preview) au 16/09/2026** — JEP 532, 5ᵉ aperçu livré en Java 27, nécessite `--enable-preview`. Aucune date de finalisation n'est confirmée : ne pas la présenter comme disponible en production."
quiz:
  - question: "Que va afficher ce code, une fois compilé sur Java 21 ou plus récent ?"
    code: |
      Object valeur = "boutique";

      if (valeur instanceof String s && s.length() > 5) {
          System.out.println(s.toUpperCase());
      } else {
          System.out.println("autre chose");
      }
    choix:
      - "BOUTIQUE"
      - "boutique"
      - "autre chose"
      - "Erreur de compilation : s n'est pas défini dans le bloc if"
    reponse: 0
    explication: "\"boutique\" est bien une String de longueur 8 (> 5) : les deux conditions du && sont vraies, s est donc défini et affecté dans le bloc if, et s.toUpperCase() affiche BOUTIQUE. La variable de motif s n'existe en revanche pas dans le bloc else, puisque le compilateur ne peut pas garantir qu'elle a été affectée si le test a échoué."
  - question: "Pourquoi ce switch ne compile-t-il pas, avec Forme scellée en `sealed interface Forme permits Cercle, Carre` ?"
    code: |
      sealed interface Forme permits Cercle, Carre {}
      record Cercle(double rayon) implements Forme {}
      record Carre(double cote) implements Forme {}

      static double aire(Forme forme) {
          return switch (forme) {
              case Cercle c -> Math.PI * c.rayon() * c.rayon();
          };
      }
    choix:
      - "Un switch sur motifs de type ne peut jamais être une expression"
      - "Il manque un cas pour Carre (ou un default) : le compilateur exige que le switch couvre tous les sous-types de la hiérarchie scellée"
      - "record Cercle doit implémenter equals() explicitement pour être utilisé dans un switch"
      - "Il faut écrire case Cercle(double rayon) et non case Cercle c"
    reponse: 1
    explication: "Comme Forme est scellée avec deux permits connus, le compilateur peut vérifier l'exhaustivité du switch sans clause default : ici il manque le cas Carre, donc ça ne compile pas. C'est justement l'intérêt de combiner switch sur motifs et classes scellées (voir la leçon suivante) : le compilateur signale un cas oublié dès la compilation."
  - question: "Une équipe veut utiliser dès aujourd'hui, en production, le filtrage par motif sur des types primitifs (`case int i when i > 0 ->`). Que faut-il en dire ?"
    choix:
      - "C'est disponible sans configuration particulière depuis Java 25"
      - "Ce n'est pas possible : cette fonctionnalité (JEP 532) est toujours en aperçu au 16/09/2026, nécessite --enable-preview même en Java 27, et n'a aucune date de finalisation annoncée"
      - "C'est possible uniquement avec Java 8 ou antérieur, via une bibliothèque tierce"
      - "C'est disponible depuis Java 21, en même temps que les motifs de record"
    reponse: 1
    explication: "Les motifs sur types primitifs en sont à leur 5ᵉ aperçu (JEP 532, Java 27) et n'ont pas de JEP de finalisation déposé : ils restent expérimentaux, à activer explicitement avec --enable-preview, et ne doivent jamais être présentés comme prêts pour la production. À distinguer des motifs de record et du switch sur motifs, eux finalisés depuis Java 21."
---

## Essentiel

Le **filtrage par motif** remplace le duo « tester le type, puis caster » par une seule expression qui fait les deux à la fois.

```java
if (obj instanceof String s && !s.isBlank()) {
    System.out.println(s.trim());
}
```

`s` est déclarée et affectée seulement si `obj` est bien une `String` : plus de cast explicite, plus de risque d'oubli. Finalisé en **Java 16** (JEP 394).

Le `switch` va plus loin : il teste des **types** dans ses `case`, gère `null` explicitement, et le compilateur vérifie l'**exhaustivité** des cas — finalisé en **Java 21** (JEP 441) :

```java
String description = switch (paiement) {
    case null -> "aucun paiement";
    case CarteBancaire cb when cb.plafondDepasse() -> "carte refusée";
    case CarteBancaire cb -> "carte " + cb.numeroMasque();
    case Virement v -> "virement " + v.reference();
    default -> "moyen inconnu";
};
```

Combiné aux **records**, le filtrage par motif peut aussi **déconstruire** un objet et en extraire les composants d'un coup (motifs de record, Java 21, JEP 440) :

```java
if (forme instanceof Rectangle(double largeur, double hauteur) && largeur == hauteur) {
    System.out.println("c'est un carré");
}
```

Attention : les **motifs sur types primitifs** (`case int i ->`) sont **toujours en aperçu** au 16/09/2026 (JEP 532) — jamais à utiliser en production sans `--enable-preview`.

## Détail

### Comment ça marche

Avant le filtrage par motif, tester puis exploiter un type demandait une cascade `instanceof` + cast manuel, source d'erreurs si le cast était oublié ou mal placé. Le compilateur, lui, connaît déjà le type après un `instanceof` réussi : le filtrage par motif se contente de rendre cette information exploitable directement, sans cast redondant. Pour `switch`, l'apport est double : remplacer une cascade `if/else instanceof` par une structure plus lisible, et donner au compilateur de quoi vérifier l'**exhaustivité** — en particulier avec une hiérarchie de types scellée (voir la leçon suivante).

### Exemple 1 — Remplacer une cascade if/instanceof

Avant (Java 8-16), une hiérarchie de moyens de paiement se traitait ainsi :

```java
String resume(Object paiement) {
    if (paiement instanceof CarteBancaire) {
        CarteBancaire cb = (CarteBancaire) paiement;
        return "carte " + cb.numeroMasque();
    } else if (paiement instanceof Virement) {
        Virement v = (Virement) paiement;
        return "virement " + v.reference();
    } else {
        return "inconnu";
    }
}
```

Avec un `switch` sur motifs (Java 21+), la même logique tient en un bloc lisible, sans cast :

```java
String resume(Object paiement) {
    return switch (paiement) {
        case CarteBancaire cb -> "carte " + cb.numeroMasque();
        case Virement v -> "virement " + v.reference();
        default -> "inconnu";
    };
}
```

### Exemple 2 — Motifs de record et déconstruction imbriquée

Un motif de record extrait les composants directement, y compris ceux d'un record **imbriqué** :

```java
record Adresse(String ville, String codePostal) {}
record Client(String nom, Adresse adresse) {}

static boolean livraisonParis(Object o) {
    return o instanceof Client(String nom, Adresse(String ville, String codePostal))
            && ville.equals("Paris");
}
```

Un seul motif remplace deux appels d'accesseurs imbriqués (`client.adresse().ville()`) et vérifie au passage que `o` est bien un `Client` dont l'adresse est bien une `Adresse`.

### Exemple 3 — Gardes (`when`) pour affiner sans casser l'exhaustivité

```java
sealed interface EtatCommande permits EnAttente, Expediee, Annulee {}
record EnAttente(int joursEcoules) implements EtatCommande {}
record Expediee(String transporteur) implements EtatCommande {}
record Annulee(String motif) implements EtatCommande {}

String alerte(EtatCommande etat) {
    return switch (etat) {
        case EnAttente e when e.joursEcoules() > 5 -> "retard à surveiller";
        case EnAttente e -> "en cours de préparation";
        case Expediee e -> "expédiée par " + e.transporteur();
        case Annulee a -> "annulée : " + a.motif();
    };
}
```

La garde `when` ajoute une condition **après** que le motif a déjà correspondu : `EnAttente` apparaît deux fois, la garde étant testée en premier. Le compilateur exige que l'un des deux cas `EnAttente` reste sans garde (ou qu'un `default` existe), sinon l'exhaustivité n'est plus garantie.

### Exemple 4 — Remplacer un visiteur par un switch sur types

Avant le filtrage par motif, appliquer une opération différente selon le type concret d'une hiérarchie fermée demandait souvent le patron **Visiteur** (une méthode `accept` par type, une interface `Visiteur` avec une méthode par cas). Avec `switch` sur motifs et une hiérarchie scellée, le même résultat s'obtient sans code de visiteur :

```java
double montantTTC(LigneCommande ligne) {
    return switch (ligne) {
        case ProduitPhysique p -> p.prixHT() * 1.20 + p.fraisPort();
        case ProduitNumerique n -> n.prixHT() * 1.20;
    };
}
```

Plus besoin d'une interface `Visiteur` ni de double dispatch manuel : le compilateur garantit l'exhaustivité directement sur `LigneCommande`, à condition qu'elle soit scellée.

### Portée d'une variable de motif

| Contexte | La variable de motif est visible... |
|---|---|
| `if (obj instanceof String s)` | dans le bloc `if`, pas dans le `else` |
| `if (!(obj instanceof String s)) return;` | après le `if`, jusqu'à la fin du bloc englobant (le compilateur sait que le `return` élimine le cas négatif) |
| `case String s ->` dans un `switch` | uniquement dans ce `case` |
| `obj instanceof String s && s.length() > 3` | à droite du `&&`, pas si `instanceof` a échoué |

### Pièges courants

> **Utiliser les motifs sur types primitifs en production.** `case int i when i > 0 ->` ne compile pas sans `--enable-preview`, et reste une fonctionnalité expérimentale (JEP 532, 5ᵉ aperçu en Java 27) sans date de finalisation. Un flag d'aperçu activé en production engage tout le module concerné dans une fonctionnalité qui peut encore changer.

> **Oublier qu'un `switch` sur motifs n'est exhaustif « gratuitement » qu'avec une hiérarchie scellée.** Sur une interface ouverte (non scellée) ou sur `Object`, le compilateur ne peut pas prouver l'exhaustivité : un `default` (ou un motif générique) reste obligatoire, sinon `MatchException` est levée à l'exécution sur un cas non couvert.

> **Confondre l'ordre des `case` avec des gardes qui se chevauchent.** Comme pour un `switch` classique, les `case` sont testés dans l'ordre d'écriture : un `case EnAttente e ->` sans garde placé *avant* `case EnAttente e when ... ->` rendrait la garde inatteignable, et certains compilateurs le signalent comme une erreur.

### À retenir

- `instanceof` avec variable de motif : finalisé en **Java 16** (JEP 394) ; élimine le cast manuel après un test de type réussi.
- `switch` sur motifs : finalisé en **Java 21** (JEP 441) — gère `case null` explicitement, exige l'exhaustivité (surtout utile avec des types scellés).
- Motifs de record : finalisés en **Java 21** (JEP 440) — déconstruisent un record, y compris de façon imbriquée, sans appeler ses accesseurs.
- Les gardes (`when`) affinent un `case` sans casser l'exhaustivité, à condition qu'un cas sans garde reste disponible pour le même motif.
- Les **motifs sur types primitifs** sont **toujours en aperçu** (JEP 532, Java 27) au 16/09/2026 : à ne jamais présenter comme utilisables en production.
