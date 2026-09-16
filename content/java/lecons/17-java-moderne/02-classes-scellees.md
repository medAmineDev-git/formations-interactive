---
id: classes-scellees
chapitre: java-moderne
ordre: 2
titre: "Les classes scellées"
termes:
  - terme: Classe scellée (sealed)
    definition: "Classe ou interface déclarée avec le mot-clé `sealed`, qui restreint explicitement la liste des types autorisés à en hériter directement, via `permits`. Finalisée par le **JEP 409** en **Java 17**."
  - terme: "permits"
    definition: "Clause qui énumère, par leur nom, les sous-types directs autorisés d'une classe ou interface scellée (`sealed interface Forme permits Cercle, Carre {}`). Peut être omise si tous les sous-types sont déclarés dans le même fichier source : le compilateur les déduit alors automatiquement."
  - terme: "non-sealed"
    definition: "Modificateur qu'un sous-type direct d'une classe scellée doit porter s'il veut **rouvrir** la hiérarchie, c'est-à-dire autoriser n'importe quelle classe supplémentaire à en hériter à son tour. Chaque sous-type direct listé dans `permits` doit obligatoirement être `sealed`, `non-sealed` ou `final`."
  - terme: Sous-type final dans une hiérarchie scellée
    definition: "Un sous-type direct déclaré `final` ferme définitivement cette branche de la hiérarchie : il ne peut plus être étendu du tout. C'est le choix le plus courant pour les feuilles d'une hiérarchie scellée (souvent des records, déjà implicitement `final`)."
  - terme: Exhaustivité du compilateur
    definition: "Capacité du compilateur à vérifier qu'un `switch` sur une valeur de type scellé couvre bien tous les sous-types `permits` connus, sans nécessiter de clause `default`. C'est l'un des principaux bénéfices concrets d'une hiérarchie scellée, combinée au filtrage par motif (leçon précédente)."
  - terme: Somme de types (hiérarchie fermée) vs polymorphisme ouvert
    definition: "Une hiérarchie scellée modélise un ensemble **fini et connu à la compilation** de variantes (une « somme de types », comme un `enum` mais avec des données différentes par cas). Le polymorphisme ouvert classique (une interface implémentable par n'importe qui) convient, lui, quand la liste des implémentations ne peut ou ne doit pas être figée (points d'extension d'une bibliothèque, plugins)."
quiz:
  - question: "Pourquoi cette hiérarchie ne compile-t-elle pas ?"
    code: |
      public sealed interface Resultat permits Succes, Echec {}

      public record Succes(String valeur) implements Resultat {}

      public class Echec implements Resultat {
          private final String motif;
          public Echec(String motif) { this.motif = motif; }
      }
    choix:
      - "Une interface scellée ne peut permits que des records, jamais des classes classiques"
      - "Echec doit être déclarée sealed, non-sealed ou final : un sous-type direct d'un type scellé doit obligatoirement choisir l'un des trois"
      - "Succes ne peut pas implémenter Resultat car c'est un record"
      - "Il manque un constructeur sans argument dans Echec"
    reponse: 1
    explication: "Un record est implicitement final, donc Succes est valide sans rien ajouter. Mais Echec, une classe classique, ne porte aucun des trois modificateurs obligatoires (sealed, non-sealed ou final) pour un sous-type direct d'une interface scellée : le compilateur refuse la compilation tant que ce choix n'est pas explicite."
  - question: "Quel est l'intérêt principal de rendre une hiérarchie d'états métier sealed plutôt que de la laisser ouverte ?"
    choix:
      - "Cela améliore automatiquement les performances d'exécution du switch"
      - "Le compilateur peut vérifier l'exhaustivité d'un switch sur cette hiérarchie sans clause default, donc signaler à la compilation un cas oublié après l'ajout d'un nouvel état"
      - "Cela permet d'ajouter des sous-types sans jamais modifier le code existant"
      - "Cela rend les sous-types thread-safe automatiquement"
    reponse: 1
    explication: "Le bénéfice concret d'une hiérarchie scellée est la vérification d'exhaustivité à la compilation : si on ajoute un nouvel état et qu'un switch existant ne le traite pas, la compilation échoue (ou un avertissement apparaît) au lieu de découvrir le trou en production. C'est l'inverse d'une hiérarchie ouverte, où ajouter un sous-type ne casse jamais la compilation ailleurs, au prix de switch potentiellement incomplets."
  - question: "Une classe scellée peut-elle avoir des sous-types dans un autre paquet que le sien ?"
    choix:
      - "Jamais, quelle que soit la configuration"
      - "Oui, mais seulement si la classe scellée et ses sous-types permits appartiennent au même module (ou, en l'absence de module, sont compilés à partir du même chemin de classes, en étant listés explicitement)"
      - "Oui, sans aucune restriction, comme pour l'héritage classique"
      - "Seulement si tous les sous-types sont des records"
    reponse: 1
    explication: "Une classe scellée peut avoir des sous-types dans des paquets différents, mais tous doivent appartenir au même module (avec un système de modules) ou, à défaut, être accessibles depuis le même chemin de classes et déclarés explicitement dans permits (le compilateur vérifie la cohérence à la compilation, la JVM la revérifie au chargement des classes). Un sous-type scellé ne peut jamais provenir d'un module ou d'un jar totalement indépendant sans que la classe scellée ne le liste."
---

## Essentiel

Une classe ou interface **scellée** (`sealed`) restreint explicitement la liste de ses sous-types directs, listés avec `permits`. Finalisée en **Java 17** (JEP 409).

```java
public sealed interface Forme permits Cercle, Carre, Rectangle {}

public record Cercle(double rayon) implements Forme {}
public record Carre(double cote) implements Forme {}
public record Rectangle(double largeur, double hauteur) implements Forme {}
```

Chaque sous-type direct doit choisir explicitement son propre statut : `final` (ferme définitivement cette branche), `sealed` (restreint encore, avec sa propre liste `permits`), ou `non-sealed` (rouvre la hiérarchie à des sous-types quelconques).

Le bénéfice principal : le compilateur connaît **tous** les sous-types possibles de `Forme`. Un `switch` sur motifs (voir la leçon précédente) peut donc être **exhaustif sans `default`** :

```java
double aire(Forme forme) {
    return switch (forme) {
        case Cercle c -> Math.PI * c.rayon() * c.rayon();
        case Carre c -> c.cote() * c.cote();
        case Rectangle r -> r.largeur() * r.hauteur();
    }; // pas de default : le compilateur sait qu'il n'y a rien d'autre
}
```

Si on omet `permits`, tous les sous-types doivent être déclarés dans le **même fichier source** : le compilateur les déduit alors automatiquement.

## Détail

### Pourquoi c'est utile

Sans `sealed`, une interface est ouverte par défaut : n'importe qui, n'importe où, peut créer une nouvelle implémentation, y compris longtemps après l'écriture du code d'origine. C'est précieux pour un point d'extension volontaire (une bibliothèque, un système de plugins), mais problématique pour modéliser un **ensemble fini et connu** de variantes métier : les états d'une commande, le résultat d'une opération (succès ou échec), les types de lignes d'un panier. Une hiérarchie scellée fige cet ensemble à la compilation, ce qui permet au compilateur de vérifier l'exhaustivité des `switch` qui la traitent — et donc de repérer un cas oublié dès qu'un nouvel état est ajouté, au lieu de le découvrir en production.

### Exemple 1 — Modéliser un résultat succès/échec

```java
public sealed interface Resultat<T> permits Succes, Echec {}

public record Succes<T>(T valeur) implements Resultat<T> {}
public record Echec<T>(String motif) implements Resultat<T> {}

String traiter(Resultat<Commande> resultat) {
    return switch (resultat) {
        case Succes<Commande> s -> "commande " + s.valeur().reference() + " créée";
        case Echec<Commande> e -> "échec : " + e.motif();
    };
}
```

Combiner `sealed` et `record` pour ce genre de type « résultat » est un remplacement direct et courant du couple exceptions/valeur nulle : le compilateur oblige à traiter les deux cas.

### Exemple 2 — Les états d'une commande

```java
public sealed interface EtatCommande
        permits EnPreparation, Expediee, Livree, Annulee {}

public record EnPreparation(int articlesRestants) implements EtatCommande {}
public record Expediee(String transporteur, String numeroSuivi) implements EtatCommande {}
public record Livree(LocalDate date) implements EtatCommande {}
public record Annulee(String motif) implements EtatCommande {}
```

Chaque état porte ses propres données (un transporteur pour `Expediee`, un motif pour `Annulee`) : impossible en Java d'obtenir cette précision avec un simple `enum`, qui ne peut pas avoir des composants différents par constante.

### Exemple 3 — Rouvrir volontairement une branche avec non-sealed

```java
public sealed interface MoyenPaiement permits CarteBancaire, Virement, MoyenExterne {}

public record CarteBancaire(String numeroMasque) implements MoyenPaiement {}
public record Virement(String reference) implements MoyenPaiement {}
public non-sealed interface MoyenExterne extends MoyenPaiement {}
```

`MoyenExterne` reste un point d'extension : un module de paiement tiers peut implémenter cette interface sans toucher au code de `MoyenPaiement`. Un `switch` exhaustif sur `MoyenPaiement` devra alors couvrir `MoyenExterne` avec un cas générique (ou un `default`), puisque le compilateur ne connaît plus la liste complète de ses implémentations.

### Exemple 4 — Règles de placement (même module ou même paquet)

```java
// Fichier Forme.java, paquet boutique.catalogue
package boutique.catalogue;

public sealed interface Forme permits Cercle, Carre {}
```

```java
// Fichier Cercle.java, même paquet boutique.catalogue
package boutique.catalogue;

public final class Cercle implements Forme {
    // ...
}
```

Sans système de modules, `permits` accepte des sous-types répartis dans plusieurs fichiers, **à condition qu'ils soient dans le même paquet** que la classe scellée. Avec un système de modules, la règle s'assouplit au niveau du module entier : les sous-types peuvent être dans des paquets différents, tant qu'ils appartiennent au **même module**.

### Somme de types vs polymorphisme ouvert

| Choisir une hiérarchie **scellée** | Choisir une hiérarchie **ouverte** |
|---|---|
| L'ensemble des variantes est connu et stable (états, résultats, formes d'un domaine métier) | Le nombre d'implémentations n'est pas connu à l'avance (plugins, extensions tierces) |
| On veut que le compilateur signale un `switch` incomplet après ajout d'un cas | On veut pouvoir ajouter des implémentations sans recompiler le code existant |
| Le code appelant doit être forcé à traiter chaque cas explicitement | Le code appelant traite un contrat générique, sans connaître les implémentations concrètes |

### Pièges courants

> **Oublier le modificateur obligatoire sur un sous-type direct.** Chaque type listé dans `permits` (ou déduit du même fichier) doit être `final`, `sealed` ou `non-sealed` — sinon erreur de compilation. Une classe classique (pas un record, qui est déjà implicitement `final`) l'oublie facilement.

> **Croire qu'une hiérarchie scellée empêche toute extension.** `non-sealed` existe précisément pour rouvrir une branche volontairement. « Scellée » signifie « la liste des sous-types directs est connue et contrôlée », pas « aucune extension n'est jamais possible ».

> **Ajouter un nouveau sous-type sans revérifier les switch existants.** Le compilateur signale bien les `switch` exhaustifs devenus incomplets, mais seulement à la recompilation : un `switch` avec une clause `default` masque silencieusement l'oubli d'un nouveau cas, en le faisant tomber dans le `default` au lieu de forcer un traitement explicite.

### À retenir

- `sealed` + `permits` restreint la liste des sous-types directs, finalisé en **Java 17** (JEP 409).
- Chaque sous-type direct doit être `final`, `sealed` ou `non-sealed` — un choix explicite et obligatoire.
- Sans système de modules : classe scellée et sous-types doivent être dans le **même paquet**. Avec modules : dans le **même module**.
- Le bénéfice concret est l'**exhaustivité vérifiée par le compilateur** d'un `switch` sur motifs, sans `default`.
- Combiner `sealed` et `record` modélise efficacement une **somme de types** (états, résultat succès/échec) ; préférer une hiérarchie ouverte pour un vrai point d'extension.
