---
id: classes-internes
chapitre: poo-avancee
ordre: 3
titre: Classes internes, anonymes et locales
termes:
  - terme: Classe interne statique (imbriquée)
    definition: "Classe déclarée `static` à l'intérieur d'une autre. Elle ne porte **aucune** référence vers une instance de la classe englobante : elle se comporte comme une classe de premier niveau, simplement rangée dans l'espace de noms de l'autre classe."
  - terme: Classe interne d'instance
    definition: "Classe déclarée sans `static` à l'intérieur d'une autre. Chaque instance porte une référence **implicite** vers l'instance englobante qui l'a créée (`Externe.this`), ce qui la lie à son cycle de vie et peut provoquer une fuite mémoire si elle survit trop longtemps."
  - terme: Classe locale
    definition: "Classe déclarée à l'intérieur d'un corps de méthode. Visible uniquement dans cette méthode, elle peut capturer les variables locales **effectivement finales** de la méthode englobante."
  - terme: Classe anonyme
    definition: "Classe sans nom, déclarée et instanciée en une seule expression, généralement pour fournir une implémentation ponctuelle d'une interface ou d'une classe abstraite. Souvent remplaçable par une lambda quand l'interface n'a qu'une seule méthode abstraite."
  - terme: Variable effectivement finale
    definition: "Variable locale jamais réassignée après son initialisation, même sans le mot-clé `final`. C'est la condition requise pour qu'une classe locale ou anonyme (ou une lambda) puisse la **capturer**."
  - terme: Fuite mémoire par référence implicite
    definition: "Situation où une classe interne d'instance (ou une classe anonyme non statique) reste référencée plus longtemps que prévu, et empêche ainsi le ramasse-miettes de libérer l'instance englobante à laquelle elle est implicitement rattachée."
quiz:
  - question: "Pourquoi cette classe interne empêche-t-elle potentiellement `RapportVolumineux` d'être libérée par le ramasse-miettes ?"
    code: |
      public class RapportVolumineux {
          private byte[] donnees = new byte[100_000_000];

          public class Export {
              public void executer() { /* utilise donnees */ }
          }
      }

      RapportVolumineux rapport = new RapportVolumineux();
      Export export = rapport.new Export();
      rapport = null; // on espère libérer le tableau
    choix:
      - "`Export` n'est pas `static` : chaque instance garde une référence implicite vers son `RapportVolumineux` englobant, qui reste donc accessible tant que `export` existe"
      - "Les classes internes sont toujours copiées en mémoire indépendamment de leur classe englobante"
      - "`byte[]` n'est jamais éligible au ramasse-miettes"
      - "C'est un problème uniquement si `Export` implémente une interface"
    reponse: 0
    explication: "Une classe interne **d'instance** (non `static`) porte toujours une référence cachée vers l'instance englobante qui l'a créée. Tant que `export` est accessible, `RapportVolumineux.this` l'est aussi, avec son tableau de 100 Mo — même si la variable `rapport` a été mise à `null`. Déclarer `Export` en `static` (classe interne statique) supprime cette référence implicite si elle n'a pas besoin d'accéder à l'état de `RapportVolumineux`."
  - question: "Ce code compile-t-il ?"
    code: |
      public Runnable creerTache(String nomTache) {
          int compteur = 0;
          Runnable tache = () -> {
              compteur++;
              System.out.println(nomTache + " : " + compteur);
          };
          return tache;
      }
    choix:
      - "Oui, sans restriction"
      - "Non : `compteur` est réassigné (`compteur++`) dans la lambda, donc pas effectivement final, ce que le compilateur refuse pour une variable capturée"
      - "Non : `nomTache` ne peut jamais être capturé, seuls les types primitifs le peuvent"
      - "Oui, mais uniquement si `compteur` est déclaré `final`"
    reponse: 1
    explication: "Une lambda (comme une classe anonyme ou locale) ne peut capturer que des variables **effectivement finales**. `compteur++` réassigne `compteur` à l'intérieur de la lambda : le compilateur refuse (« variable used in lambda expression should be final or effectively final »). `nomTache`, jamais réassigné, serait capturable sans problème."
  - question: "Quelle affirmation sur les classes anonymes est correcte ?"
    choix:
      - "Une classe anonyme ne peut jamais accéder aux variables locales de la méthode qui la contient"
      - "Une classe anonyme peut implémenter une interface fonctionnelle, mais aussi étendre une classe abstraite avec plusieurs méthodes — ce qu'une lambda ne peut pas faire"
      - "Une classe anonyme est toujours équivalente à une lambda et peut toujours être remplacée par l'une d'elles"
      - "Une classe anonyme ne peut pas avoir de bloc d'initialisation d'instance"
    reponse: 1
    explication: "Une lambda ne peut implémenter qu'une **interface fonctionnelle** (une seule méthode abstraite). Une classe anonyme peut, elle, étendre une classe abstraite avec plusieurs méthodes, ou implémenter une interface avec plusieurs méthodes abstraites — un cas où elle reste nécessaire et n'est pas remplaçable par une lambda."
---

## Essentiel

Java permet de déclarer une classe **à l'intérieur** d'une autre classe ou d'une méthode. Quatre formes existent, avec une différence essentielle : une classe interne **d'instance** garde une référence cachée vers l'objet englobant, une classe interne **statique** non.

```java
public class Commande {
    private final List<LigneCommande> lignes = new ArrayList<>();

    // classe interne statique : pas de lien avec une instance de Commande
    public static class LigneCommande {
        private final String produit;
        private final int quantite;

        public LigneCommande(String produit, int quantite) {
            this.produit = produit;
            this.quantite = quantite;
        }
    }

    // classe interne d'instance : peut accéder à "lignes" directement
    public class RecapitulatifDetaille {
        public int nombreArticles() {
            return lignes.size(); // accède implicitement à Commande.this.lignes
        }
    }
}
```

Une **classe locale** est déclarée dans une méthode, une **classe anonyme** est déclarée et instanciée en une seule expression, sans nom :

```java
Comparator<LigneCommande> parQuantite = new Comparator<>() { // classe anonyme
    @Override
    public int compare(LigneCommande a, LigneCommande b) {
        return Integer.compare(a.quantite, b.quantite);
    }
};
```

Quand l'interface n'a qu'**une seule méthode abstraite** (interface fonctionnelle), une lambda remplace avantageusement la classe anonyme — sujet détaillé au niveau intermédiaire, dans le chapitre sur la programmation fonctionnelle.

## Détail

### Pourquoi c'est utile

Regrouper une classe étroitement liée à une autre (une classe d'événement propre à un composant, un comparateur ponctuel, une implémentation utilisée à un seul endroit) directement à l'intérieur de la classe qui l'utilise améliore la lisibilité : le lecteur voit immédiatement que cette classe n'a de sens que dans ce contexte, sans avoir à chercher un fichier séparé.

### Exemple 1 — Classe interne statique (cas le plus courant)

```java
public class Commande {
    public static class LigneCommande {
        private final String produit;
        private final int quantite;

        public LigneCommande(String produit, int quantite) {
            this.produit = produit;
            this.quantite = quantite;
        }
    }
}

Commande.LigneCommande ligne = new Commande.LigneCommande("Clavier", 2);
```

Pas besoin d'une instance de `Commande` pour créer une `LigneCommande` : c'est le choix par défaut dès que la classe interne n'a pas besoin d'accéder à l'état de l'instance englobante.

### Exemple 2 — Classe interne d'instance et sa référence implicite

```java
public class Panier {
    private final List<String> produits = new ArrayList<>();

    public class Resume { // pas static : liée à une instance de Panier
        public String afficher() {
            return "Panier de " + produits.size() + " article(s)";
        }
    }
}

Panier panier = new Panier();
Panier.Resume resume = panier.new Resume(); // syntaxe particulière : instance.new
```

`Resume` accède directement à `produits` sans qu'on ait besoin de le lui passer : elle porte une référence cachée vers l'instance `panier` qui l'a créée (`Panier.this`). C'est pratique, mais cette référence maintient `panier` accessible tant que `resume` l'est — un risque de fuite mémoire si `resume` est conservée longtemps (mise en cache, écouteur enregistré durablement) alors que `panier` devrait être libéré.

### Exemple 3 — Classe locale dans une méthode

```java
public List<LigneCommande> lignesValides(List<LigneCommande> lignes, int quantiteMin) {

    class FiltreQuantite { // classe locale, visible uniquement dans cette méthode
        boolean estValide(LigneCommande ligne) {
            return ligne.quantite() >= quantiteMin; // capture quantiteMin
        }
    }

    FiltreQuantite filtre = new FiltreQuantite();
    return lignes.stream().filter(filtre::estValide).toList();
}
```

Une classe locale a accès aux variables **effectivement finales** de la méthode englobante (ici `quantiteMin`). Rare en pratique aujourd'hui — une lambda ou une méthode privée suffisent souvent — mais utile quand plusieurs méthodes ou plusieurs champs sont nécessaires pour un besoin purement local.

### Exemple 4 — Classe anonyme pour un écouteur

```java
bouton.addActionListener(new ActionListener() {
    @Override
    public void actionPerformed(ActionEvent e) {
        System.out.println("Bouton cliqué");
    }
});
```

Cas d'usage historique des classes anonymes : implémenter une interface d'écouteur à usage unique, sans créer une classe nommée séparée. Avec une interface fonctionnelle (une seule méthode abstraite, comme ici), ce code se réécrit en une lambda plus courte : `bouton.addActionListener(e -> System.out.println("Bouton cliqué"));`.

### Comparatif des quatre formes

| | Déclarée | Référence à l'englobante | Remplaçable par une lambda |
|---|---|---|---|
| Interne statique | Dans une classe, avec `static` | Non | Non (ce n'est pas une implémentation d'interface fonctionnelle contextuelle) |
| Interne d'instance | Dans une classe, sans `static` | Oui (implicite) | Non |
| Locale | Dans une méthode | Oui (variables effectivement finales) | Parfois |
| Anonyme | Expression, sans nom | Oui si non statique | Oui, si interface fonctionnelle à une seule méthode |

### Pièges courants

> **Classe interne d'instance conservée plus longtemps que prévu.** Une classe interne non `static` retient toujours son instance englobante. Si l'instance interne est stockée dans un cache, un `Map` statique, ou enregistrée comme écouteur durable, elle empêche le ramasse-miettes de libérer l'objet englobant — même longtemps après que celui-ci n'est plus utile ailleurs. Réflexe : rendre la classe interne `static` dès qu'elle n'a pas besoin d'accéder à l'état de l'instance englobante.

> **Capturer une variable qui n'est pas effectivement finale.** `compteur++` puis capture de `compteur` dans une classe locale, une classe anonyme ou une lambda ne compile pas (« variable … should be final or effectively final »). Solution : utiliser un objet mutable englobant (un tableau à une case, un `AtomicInteger`) si un état partagé et modifiable est réellement nécessaire.

> **Oublier la syntaxe `instance.new`.** Créer une classe interne d'instance depuis l'extérieur nécessite une instance englobante explicite : `panier.new Resume()`, pas `new Resume()`. Cette syntaxe surprend souvent à la première rencontre — un signe supplémentaire que les classes internes statiques sont plus simples à utiliser quand le lien avec l'instance n'est pas nécessaire.

### À retenir

- Classe interne **statique** : pas de référence vers l'englobante, se comporte comme une classe indépendante — à préférer par défaut.
- Classe interne **d'instance** : référence implicite vers l'englobante, pratique mais source potentielle de fuite mémoire si elle survit trop longtemps.
- Classe **locale** : visible dans une seule méthode, capture les variables effectivement finales.
- Classe **anonyme** : implémentation ponctuelle sans nom, souvent remplacée par une lambda quand l'interface n'a qu'une seule méthode abstraite (voir le chapitre sur la programmation fonctionnelle).
- Une variable capturée (classe locale, anonyme ou lambda) doit être effectivement finale : jamais réassignée après son initialisation.
