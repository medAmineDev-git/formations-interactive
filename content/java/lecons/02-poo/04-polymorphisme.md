---
id: polymorphisme
chapitre: poo
ordre: 4
titre: "Le polymorphisme"
termes:
  - terme: Polymorphisme
    definition: "Capacité à manipuler des objets de classes différentes à travers un **type commun** (une classe mère ou une interface), chacun réagissant à sa façon aux mêmes appels de méthode."
  - terme: Liaison dynamique (dynamic binding)
    definition: "Mécanisme par lequel Java détermine, **à l'exécution**, quelle version d'une méthode redéfinie appeler, en fonction du type réel de l'objet — jamais du type déclaré de la variable."
  - terme: Surcharge (overloading)
    definition: "Plusieurs méthodes de même nom mais de paramètres différents dans une même classe. La méthode appelée est choisie **à la compilation**, d'après le type déclaré des arguments."
  - terme: Redéfinition (overriding)
    definition: "Une sous-classe fournit une nouvelle implémentation d'une méthode héritée, avec la **même signature**. La méthode exécutée est choisie à l'exécution, d'après le type réel de l'objet (liaison dynamique)."
  - terme: Transtypage (casting)
    definition: "Convertir explicitement une référence d'un type vers un autre, par exemple `(Livre) produit`. Ne change rien à l'objet réel : ne fait que changer le type utilisé pour y accéder, et échoue si le type demandé est incompatible."
  - terme: "instanceof"
    definition: "Opérateur qui teste si un objet est bien d'un type donné avant un transtypage. Depuis Java 16 (JEP 394), le filtrage par motif permet d'écrire `if (produit instanceof Livre livre)` et d'obtenir directement une variable déjà transtypée dans le bloc concerné."
  - terme: ClassCastException
    definition: "Exception levée à l'exécution quand un transtypage est invalide, c'est-à-dire quand l'objet réel n'est pas une instance du type demandé."
quiz:
  - question: "Que produit ce programme ?"
    code: |
      class Produit {
          String decrire() { return "Produit générique"; }
      }
      class Livre extends Produit {
          @Override
          String decrire() { return "Livre"; }
      }

      Produit p = new Livre();
      System.out.println(p.decrire());
    choix:
      - "Produit générique, car p est déclarée de type Produit"
      - "Livre, car la méthode appelée dépend du type réel de l'objet, pas du type déclaré de la variable"
      - "Erreur de compilation : Livre ne peut pas remplacer decrire()"
      - "ClassCastException à l'exécution"
    reponse: 1
    explication: "decrire() est redéfinie : elle est résolue par liaison dynamique, d'après le type réel de l'objet (Livre), quel que soit le type déclaré de la variable p (Produit)."
  - question: "Que produit ce programme ?"
    code: |
      class Traiteur {
          String traiter(Produit p) { return "traitement générique"; }
          String traiter(Livre l) { return "traitement livre"; }
      }

      Produit p = new Livre();
      Traiteur t = new Traiteur();
      System.out.println(t.traiter(p));
    choix:
      - "traitement livre, car p contient réellement un Livre"
      - "traitement générique, car la surcharge est résolue à la compilation d'après le type déclaré de p (Produit)"
      - "Erreur de compilation : traiter est ambiguë"
      - "ClassCastException à l'exécution"
    reponse: 1
    explication: "traiter(...) est surchargée, pas redéfinie : le compilateur choisit la méthode à appeler en fonction du type déclaré de l'argument (Produit), sans regarder le type réel de l'objet à l'exécution. C'est l'inverse de la redéfinition, souvent confondu avec elle."
  - question: "Que se passe-t-il à l'exécution de la dernière ligne ?"
    code: |
      Produit p = new Produit();
      Livre l = (Livre) p;
    choix:
      - "Le transtypage réussit toujours, car Livre hérite de Produit"
      - "ClassCastException, car l'objet réel est un Produit, pas un Livre"
      - "Erreur de compilation"
      - "Le compilateur transforme silencieusement p en un nouveau Livre"
    reponse: 1
    explication: "Le transtypage ne change pas l'objet réel : il ne fait que réinterpréter la référence. Comme l'objet créé est réellement un Produit (pas un Livre), la JVM lève une ClassCastException à l'exécution. Un instanceof pour tester avant de transtyper aurait évité l'exception."
---

## Essentiel

Le **polymorphisme** permet de manipuler des objets différents à travers un type commun :

```java
class Produit {
    double calculerFraisLivraison() { return 5.0; }
}
class Livre extends Produit {
    @Override
    double calculerFraisLivraison() { return 0.0; } // livraison gratuite
}

List<Produit> panier = List.of(new Produit(), new Livre());
for (Produit p : panier) {
    System.out.println(p.calculerFraisLivraison()); // 5.0, puis 0.0
}
```

Chaque objet répond à sa manière au même appel `calculerFraisLivraison()`. C'est la **liaison dynamique** : Java choisit la méthode à exécuter d'après le type **réel** de l'objet, pas d'après le type déclaré de la variable (`Produit` ici, pour les deux éléments).

Attention à ne pas confondre avec la **surcharge** : plusieurs méthodes de même nom mais de paramètres différents. Elle est résolue **à la compilation**, d'après le type déclaré des arguments — c'est un piège classique en entretien (voir Exemple 2).

## Détail

### Comment ça marche

À la compilation, Java vérifie que la méthode appelée existe bien sur le type déclaré de la référence. À l'exécution, pour une méthode redéfinissable (non `private`, non `static`, non `final`), la JVM regarde la classe **réelle** de l'objet et exécute la version la plus spécifique de la méthode. C'est pour cela que la surcharge (résolue à la compilation) et la redéfinition (résolue à l'exécution) peuvent donner des résultats très différents pour un code qui se ressemble.

### Exemple 1 — Surcharge vs redéfinition, le piège classique

```java
class Traiteur {
    void traiter(Produit p) { System.out.println("générique"); }
    void traiter(Livre l) { System.out.println("livre"); }
}

Produit p = new Livre();
new Traiteur().traiter(p); // affiche "générique"
```

À la compilation, le compilateur ne connaît que le type **déclaré** de `p`, c'est-à-dire `Produit` : il choisit donc `traiter(Produit)`, même si l'objet réel est un `Livre`. Pour obtenir `traiter(Livre)`, il faudrait soit déclarer `Livre p`, soit transtyper explicitement.

### Exemple 2 — Transtypage et instanceof

```java
void traiterCommande(Produit p) {
    if (p instanceof Livre livre) {          // filtrage par motif (Java 16+)
        System.out.println("Auteur : " + livre.getAuteur());
    } else if (p instanceof Vetement vetement) {
        System.out.println("Taille : " + vetement.getTaille());
    }
}
```

`instanceof` teste le type réel de l'objet avant d'y accéder de façon spécifique. Le filtrage par motif (`p instanceof Livre livre`) évite d'écrire un transtypage manuel juste après le test (détaillé au niveau avancé, avec `switch`).

### Exemple 3 — ClassCastException

```java
Produit p = new Produit(); // un Produit "pur", pas un Livre
Livre l = (Livre) p;       // compile, mais échoue à l'exécution
```

Le transtypage compile car `Livre` hérite de `Produit` (le compilateur l'autorise sur le principe). Mais à l'exécution, l'objet réel n'est pas un `Livre` : la JVM lève `ClassCastException: class Produit cannot be cast to class Livre`.

### Exemple 4 — Les champs ne sont pas polymorphes

```java
class Compte {
    String type = "Compte générique";
}
class ComptePremium extends Compte {
    String type = "Compte premium"; // masque le champ de Compte, ne le redéfinit pas
}

Compte c = new ComptePremium();
System.out.println(c.type); // "Compte générique" !
```

Seules les **méthodes** d'instance bénéficient de la liaison dynamique. Les champs sont résolus d'après le type **déclaré** de la variable (`Compte`), pas le type réel de l'objet — un champ n'est jamais « redéfini », il est simplement masqué. C'est une bonne raison de garder les champs `private` et de n'exposer que des méthodes.

### Surcharge vs redéfinition

| | Surcharge (overloading) | Redéfinition (overriding) |
|---|---|---|
| Où | dans une même classe (ou entre mère et fille, avec des paramètres différents) | entre une classe mère et une sous-classe |
| Signature | paramètres différents (nombre ou type) | signature identique |
| Résolution | à la **compilation**, type déclaré des arguments | à l'**exécution**, type réel de l'objet |
| Annotation | aucune | `@Override` recommandé |

### Pièges courants

> **Appeler une méthode redéfinie depuis le constructeur de la classe mère.** L'objet n'est pas encore complètement initialisé : les champs de la sous-classe n'ont pas encore reçu leur valeur.
> ```java
> class A {
>     A() { init(); }              // appelle la version redéfinie, trop tôt
>     void init() { }
> }
> class B extends A {
>     private String nom = "valeur";
>     @Override
>     void init() { System.out.println(nom); } // affiche null, pas "valeur" !
> }
> new B();
> ```
> Au moment où `A()` appelle `init()`, l'initialiseur `nom = "valeur"` de `B` ne s'est pas encore exécuté (il s'exécute après `super()`, donc après le retour de `A()`). `init()` s'exécute bien sur l'objet `B` (liaison dynamique) mais avec `nom` encore à sa valeur par défaut, `null`. Évitez d'appeler une méthode redéfinissable depuis un constructeur ; si nécessaire, rendez-la `final` ou `private`.

> **Confondre le type déclaré et le type réel pour la surcharge.** Comme dans l'Exemple 1 : si l'intention est bien d'appeler `traiter(Livre)`, il faut que le type **déclaré** de la variable soit `Livre` au moment de l'appel, pas seulement l'objet réel.

> **Enchaîner de longues séries de `instanceof`/transtypage** pour reproduire à la main ce que la liaison dynamique ferait automatiquement. Si chaque sous-classe redéfinit une méthode commune, un simple appel polymorphe (`p.calculerFraisLivraison()`) remplace tout le `if (p instanceof ...) ... else if ...`.

### À retenir

- La **redéfinition** est résolue à l'exécution, d'après le type réel de l'objet (liaison dynamique).
- La **surcharge** est résolue à la compilation, d'après le type déclaré des arguments — piège classique quand les deux se ressemblent.
- Un transtypage invalide compile mais lève une `ClassCastException` à l'exécution ; `instanceof` (avec filtrage par motif) permet de le vérifier avant.
- Les **champs** ne sont jamais polymorphes : ils sont résolus d'après le type déclaré de la variable.
- N'appelez jamais une méthode redéfinissable depuis un constructeur : les champs de la sous-classe ne sont pas encore initialisés.
