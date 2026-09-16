---
id: lambdas
chapitre: fonctionnel
ordre: 1
titre: Les lambdas
termes:
  - terme: Lambda
    definition: "Expression qui fournit directement le **corps** d'une méthode, sans nom ni classe visible. Le compilateur en déduit une implémentation de l'unique méthode abstraite d'une interface fonctionnelle ciblée par le contexte."
  - terme: Interface fonctionnelle
    definition: "Interface qui déclare **une seule méthode abstraite** (elle peut en avoir d'autres, par défaut ou statiques). C'est le type que doit avoir une lambda : `Runnable`, `Comparator<T>`, `Function<T,R>`…"
  - terme: Type cible (target type)
    definition: "Type d'interface fonctionnelle attendu à l'endroit où la lambda apparaît (variable, paramètre, retour). Le compilateur s'en sert pour déduire les types des paramètres de la lambda, sans qu'on ait besoin de les écrire."
  - terme: Capture de variable
    definition: "Une lambda peut lire une variable locale de la méthode englobante à condition qu'elle soit **effectivement finale** (jamais réassignée après son initialisation). La lambda capture la **valeur** au moment de la capture, pas une référence vivante à la variable."
  - terme: Effectivement finale
    definition: "Une variable locale non déclarée `final` mais jamais réaffectée après son initialisation. C'est la condition exigée pour qu'une lambda (ou une classe anonyme) puisse la capturer."
  - terme: invokedynamic
    definition: "Instruction bytecode utilisée par le compilateur pour traduire une lambda : contrairement à une classe anonyme, aucune classe séparée n'est générée à la compilation — l'implémentation est produite dynamiquement à l'exécution, au premier appel."
quiz:
  - question: "Que fait ce code au moment de l'exécution de la lambda ?"
    code: |
      int seuil = 10;
      List<Integer> quantites = List.of(4, 12, 20, 3);
      seuil = 15;
      quantites.stream().filter(q -> q > seuil).forEach(System.out::println);
    choix:
      - "Le code affiche les quantités supérieures à 10, car la lambda a capturé la valeur au moment de sa création"
      - "Le code ne compile pas, car `seuil` est réassigné après la déclaration de la lambda"
      - "Le code affiche les quantités supérieures à 15"
      - "Le code compile mais lève une exception à l'exécution"
    reponse: 1
    explication: "`seuil` est réassigné après son initialisation : il n'est donc pas effectivement final, et une lambda ne peut pas le capturer. Le compilateur refuse ce code (\"local variables referenced from a lambda expression must be final or effectively final\"). Pour corriger, il faudrait ne plus réaffecter `seuil`, ou introduire une seconde variable finale."
  - question: "Quelle est la principale différence entre une lambda et une classe anonyme implémentant la même interface fonctionnelle ?"
    choix:
      - "Une lambda ne peut pas accéder aux variables locales de la méthode englobante, contrairement à une classe anonyme"
      - "Dans une lambda, `this` désigne l'instance englobante (comme du code normal) ; dans une classe anonyme, `this` désigne l'instance anonyme elle-même"
      - "Une classe anonyme est toujours plus rapide à l'exécution qu'une lambda"
      - "Une lambda peut implémenter une interface avec plusieurs méthodes abstraites, pas une classe anonyme"
    reponse: 1
    explication: "Une lambda n'introduit pas de nouvelle portée pour `this` : à l'intérieur, `this` reste celui du contexte englobant. Une classe anonyme, elle, définit une vraie classe avec sa propre instance, donc son propre `this`. C'est une différence de fonctionnement, pas seulement de syntaxe."
  - question: "Pourquoi cette ligne ne compile-t-elle pas ?"
    code: |
      Comparator<String> parLongueur = (String a, b) -> a.length() - b.length();
    choix:
      - "Il manque un point-virgule après l'expression"
      - "Les types des paramètres doivent tous être écrits explicitement, ou tous omis — on ne peut pas mélanger"
      - "`Comparator<String>` n'est pas une interface fonctionnelle"
      - "Le corps d'une lambda ne peut pas contenir de soustraction"
    reponse: 1
    explication: "Java interdit de mélanger paramètres typés et non typés dans la même liste : soit `(String a, String b) -> ...`, soit `(a, b) -> ...` avec inférence complète à partir du type cible. Ici `a` est typé et `b` ne l'est pas, ce que le compilateur refuse."
---

## Essentiel

Une lambda est une syntaxe compacte pour fournir le corps d'une méthode **sans écrire de classe**. Elle n'a de sens que là où le compilateur attend une **interface fonctionnelle** — une interface avec une seule méthode abstraite :

```java
// Comparator<Produit> a une seule méthode abstraite : compare(T, T)
Comparator<Produit> parPrix = (p1, p2) -> Double.compare(p1.prix(), p2.prix());

Predicate<Produit> enPromo = p -> p.remise() > 0;

Runnable tache = () -> System.out.println("Commande traitée");
```

Les types des paramètres (`p1`, `p2`, `p`) sont **déduits** du type cible — inutile de les répéter. Le corps est soit une expression unique (valeur de retour implicite), soit un bloc `{ ... }` avec `return` explicite.

Une lambda peut lire une variable locale de la méthode qui l'entoure, à condition qu'elle soit **effectivement finale** (jamais réassignée) :

```java
double seuilRemise = 0.10;
Predicate<Produit> grosseRemise = p -> p.remise() >= seuilRemise; // OK : seuilRemise n'est jamais réaffectée
```

Une lambda n'est **pas** une classe anonyme déguisée : elle ne définit pas de nouvelle instance avec son propre `this`, elle n'a pas de champ à elle, et le compilateur ne génère pas de fichier `.class` séparé à sa compilation (elle repose sur `invokedynamic`, résolue à l'exécution).

## Détail

### Comment ça marche

Une lambda **implémente** l'unique méthode abstraite de l'interface fonctionnelle désignée par le type cible : variable, paramètre de méthode, ou type de retour. Sans ce contexte, le compilateur ne peut rien déduire — une lambda seule, sans type cible, ne compile pas.

Techniquement, le compilateur traduit chaque lambda en une instruction `invokedynamic` : au lieu de générer une classe séparée pour chaque lambda (comme il le fait pour une classe anonyme), il délègue la création de l'implémentation à un mécanisme du JDK exécuté au premier appel du site d'invocation. Le détail de ce mécanisme (bootstrap, `LambdaMetafactory`) relève du fonctionnement interne de la JVM, hors du périmètre de cette leçon.

### Exemple 1 — Inférence des types de paramètres

```java
// Forme complète, explicite
Comparator<Produit> c1 = (Produit p1, Produit p2) -> p1.nom().compareTo(p2.nom());

// Forme inférée, la plus courante
Comparator<Produit> c2 = (p1, p2) -> p1.nom().compareTo(p2.nom());

// Un seul paramètre : les parenthèses restent facultatives
Function<Produit, String> nomEnMajuscules = p -> p.nom().toUpperCase();

// Aucun paramètre : parenthèses obligatoires
Supplier<Produit> produitVide = () -> new Produit("", 0.0);
```

Le compilateur retrouve le type de chaque paramètre à partir de la signature de la méthode abstraite du type cible (ici, `Comparator<Produit>.compare(Produit, Produit)`). Écrire les types explicitement reste possible, utile surtout quand l'inférence est ambiguë ou pour la lisibilité.

### Exemple 2 — Corps expression contre corps bloc

```java
Function<Produit, Double> prixTTC = p -> p.prixHT() * 1.20;          // expression : retour implicite

Function<Produit, Double> prixTTCValide = p -> {                     // bloc : return explicite obligatoire
    if (p.prixHT() < 0) {
        throw new IllegalArgumentException("prix négatif");
    }
    return p.prixHT() * 1.20;
};
```

Dès qu'un bloc `{ }` est utilisé, chaque chemin doit se terminer par un `return` explicite (sauf pour `void`, où `return;` seul ou l'absence de `return` sont valides).

### Exemple 3 — Capture d'une variable effectivement finale

```java
public List<Produit> filtrerParSeuil(List<Produit> produits, double seuil) {
    return produits.stream()
        .filter(p -> p.prix() >= seuil) // seuil est un paramètre, jamais réaffecté : capturable
        .toList();
}
```

`seuil` est capturé **par valeur** au moment où la lambda est créée. Si `seuil` pouvait changer après coup, la lambda ne le verrait pas — c'est justement pour éviter cette confusion que Java impose l'immutabilité effective des variables capturées.

### Exemple 4 — Lambda contre classe anonyme : la différence de `this`

```java
public class GestionnaireCommandes {
    private String nom = "Gestionnaire";

    public void demonstration() {
        Runnable viaLambda = () -> System.out.println(this.nom);          // this = GestionnaireCommandes
        Runnable viaAnonyme = new Runnable() {
            private String nom = "Anonyme";
            @Override
            public void run() {
                System.out.println(this.nom);                             // this = l'instance anonyme
            }
        };
        viaLambda.run();   // affiche "Gestionnaire"
        viaAnonyme.run();  // affiche "Anonyme"
    }
}
```

Dans une lambda, `this` n'est jamais réinterprété : il désigne toujours l'instance englobante, exactement comme n'importe quel autre code de la méthode. Une classe anonyme, elle, crée une véritable instance avec sa propre notion de `this`. C'est une conséquence directe du fait qu'une lambda ne définit pas de nouvelle classe : elle n'a pas de champ propre, pas d'état caché, seulement un corps de méthode et les variables qu'elle capture.

### Lambda contre méthode nommée : quand extraire

| Situation | Choix recommandé |
|---|---|
| Logique d'une ligne, utilisée une seule fois | Lambda inline |
| Logique réutilisée à plusieurs endroits | Méthode nommée, référencée via `::` |
| Corps de plusieurs lignes avec conditions imbriquées | Méthode nommée : plus lisible, testable isolément |
| Nom métier porteur de sens (`estEligibleRemise`) | Méthode nommée : le nom documente l'intention |

Une lambda longue ou imbriquée dans un pipeline de streams devient vite difficile à relire. Dès qu'une lambda dépasse deux ou trois lignes, ou qu'elle mérite un nom explicite, l'extraire en méthode privée puis la référencer (voir la leçon sur les références de méthode) améliore presque toujours la lisibilité.

### Pièges courants

> **Réassigner une variable capturée.** `int total = 0; produits.forEach(p -> total += p.prix());` ne compile pas : `total` est réassigné dans la boucle, donc pas effectivement final. Solution : accumuler avec un stream (`.mapToDouble(...).sum()`) plutôt que muter une variable locale depuis une lambda.

> **Confondre la capture par valeur avec une référence vivante.** Une lambda capture la valeur d'une variable au moment de sa création, pas un lien vers une case mémoire qui continuerait à évoluer. Pour un objet mutable capturé (une `List`, par exemple), c'est la référence qui est capturée par valeur — l'objet pointé, lui, reste mutable et ses changements sont visibles.

> **Sur-utiliser les lambdas au détriment de la lisibilité.** Empiler des lambdas de plusieurs lignes dans un pipeline de streams imbriqué rend le code difficile à suivre. Une méthode nommée, même courte, documente l'intention par son nom et peut être testée séparément.

### À retenir

- Une lambda implémente l'unique méthode abstraite d'une interface fonctionnelle déterminée par le type cible du contexte.
- Les types des paramètres sont inférés ; ils ne peuvent pas être mélangés (explicites pour tous, ou pour aucun).
- Une lambda ne peut capturer qu'une variable locale **effectivement finale**, et la capture se fait par valeur.
- `this` dans une lambda désigne l'instance englobante ; dans une classe anonyme, `this` désigne l'instance anonyme elle-même.
- Le compilateur traduit une lambda via `invokedynamic`, sans générer de classe séparée à la compilation — le détail relève du fonctionnement interne de la JVM.
