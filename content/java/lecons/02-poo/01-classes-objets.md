---
id: classes-objets
chapitre: poo
ordre: 1
titre: "Classes, objets et constructeurs"
termes:
  - terme: Classe
    definition: "Le **modèle** qui décrit un type d'objet : ses attributs (données) et ses méthodes (comportement). `Produit` est une classe, elle ne représente aucun produit en particulier."
  - terme: Objet (instance)
    definition: "Une **réalisation concrète** d'une classe, créée avec `new`. Chaque objet a son propre état (les valeurs de ses attributs) mais partage le comportement défini par sa classe."
  - terme: Constructeur
    definition: "Méthode spéciale, sans type de retour, portant le nom de la classe, appelée lors de la création d'un objet avec `new`. Elle initialise l'état de l'objet. Si aucun constructeur n'est écrit, le compilateur en génère un sans paramètre, le **constructeur par défaut**."
  - terme: "this"
    definition: "Référence vers l'objet courant. Sert à distinguer un attribut d'un paramètre de même nom (`this.nom = nom;`) ou à désigner l'objet lui-même."
  - terme: "this(...)"
    definition: "Appelle un **autre constructeur de la même classe**, depuis le premier constructeur. Permet de factoriser l'initialisation entre plusieurs constructeurs surchargés."
  - terme: Membre static
    definition: "Attribut, méthode ou bloc rattaché à la **classe** elle-même, et non à une instance particulière. Il existe en un seul exemplaire, partagé par tous les objets."
  - terme: "final (champ)"
    definition: "Un champ `final` ne peut être affecté **qu'une seule fois** : à sa déclaration ou dans le constructeur. Toute tentative de le réaffecter ensuite est une erreur de compilation."
quiz:
  - question: "Combien d'objets `Produit` distincts sont créés par ce code ?"
    code: |
      Produit p1 = new Produit("Clavier", 49.90);
      Produit p2 = new Produit("Clavier", 49.90);
      Produit p3 = p1;
    choix:
      - "1"
      - "2"
      - "3"
      - "0, car p3 est une référence, pas un objet"
    reponse: 1
    explication: "`new` crée un nouvel objet à chaque appel : p1 et p2 sont deux objets distincts, même avec les mêmes valeurs. p3 ne fait que copier la référence vers l'objet déjà créé par p1 : aucun nouvel objet n'est créé."
  - question: "Que se passe-t-il à la compilation ?"
    code: |
      public class Client {
          private final String email;

          public Client(String email) {
              this.email = email;
          }

          public void corrigerEmail(String nouvelEmail) {
              this.email = nouvelEmail;
          }
      }
    choix:
      - "Compilation réussie : this permet de réaffecter n'importe quel champ"
      - "Erreur de compilation : un champ final ne peut être affecté que dans le constructeur ou à la déclaration"
      - "Erreur de compilation : this ne peut pas être utilisé dans deux méthodes différentes"
      - "Compilation réussie, mais nouvelEmail est ignoré à l'exécution"
    reponse: 1
    explication: "Le champ email est final : il est déjà affecté dans le constructeur. Toute autre affectation, même dans une méthode différente, est rejetée par le compilateur (« cannot assign a value to final variable email »)."
  - question: "Un constructeur en appelle un autre avec this(...). Que peut-on affirmer ?"
    code: |
      public class Commande {
          private final String reference;
          private final String statut;

          public Commande(String reference) {
              this(reference, "EN_ATTENTE");
          }

          public Commande(String reference, String statut) {
              this.reference = reference;
              this.statut = statut;
          }
      }
    choix:
      - "this(reference, \"EN_ATTENTE\") doit être la première instruction du premier constructeur"
      - "Les deux constructeurs s'exécutent indépendamment, dans l'ordre où ils sont déclarés"
      - "Ce code ne compile pas : une classe ne peut pas avoir deux constructeurs"
      - "this(...) doit obligatoirement être la dernière instruction du constructeur"
    reponse: 0
    explication: "Quand un constructeur appelle this(...), cet appel doit être la toute première instruction. Java exécute alors le second constructeur en entier avant de revenir poursuivre le premier (ici, il n'y a rien après l'appel)."
---

## Essentiel

Une **classe** décrit un type d'objet : ses attributs (l'état) et ses méthodes (le comportement). Un **objet** est une instance concrète de cette classe, créée avec `new`.

```java
public class Produit {
    private String nom;
    private double prix;

    public Produit(String nom, double prix) { // constructeur
        this.nom = nom;   // this distingue l'attribut du paramètre
        this.prix = prix;
    }
}

Produit clavier = new Produit("Clavier", 49.90); // création d'un objet
```

Le **constructeur** porte le nom de la classe et initialise l'objet. Si vous n'en écrivez aucun, le compilateur en génère un sans paramètre (le constructeur par défaut) ; dès que vous écrivez un constructeur, ce constructeur par défaut disparaît.

Une classe peut avoir plusieurs constructeurs **surchargés** (mêmes noms, paramètres différents). L'un peut en appeler un autre avec `this(...)`, en première instruction, pour éviter de dupliquer l'initialisation.

Les membres marqués `static` appartiennent à la **classe**, pas à un objet particulier : un seul exemplaire est partagé par toutes les instances (utile pour un compteur, une constante, une méthode utilitaire).

## Détail

### Comment ça marche

Quand `new Produit(...)` s'exécute, Java :

1. Alloue la mémoire pour le nouvel objet et initialise ses champs à leur valeur par défaut (`0`, `false`, `null`…).
2. Exécute, dans l'ordre du code source, les initialiseurs de champs (`private double prix = 0;`) et les blocs d'initialisation d'instance.
3. Exécute le corps du constructeur.

Les membres `static` suivent un cycle séparé : leurs initialiseurs et blocs `static` s'exécutent **une seule fois**, au chargement de la classe par la JVM, avant la création de toute instance.

### Exemple 1 — Constructeurs surchargés et this(...)

```java
public class Client {
    private final String nom;
    private final String email;
    private final boolean newsletter;

    public Client(String nom, String email) {
        this(nom, email, false); // valeur par défaut pour newsletter
    }

    public Client(String nom, String email, boolean newsletter) {
        this.nom = nom;
        this.email = email;
        this.newsletter = newsletter;
    }
}
```

`this(...)` doit être la première instruction du constructeur qui l'utilise. Il permet de centraliser l'initialisation réelle dans un seul constructeur.

### Exemple 2 — Membres static : un compteur partagé

```java
public class Commande {
    private static int nombreCommandesCreees = 0; // partagé par toutes les instances
    private final String reference;

    public Commande(String reference) {
        this.reference = reference;
        nombreCommandesCreees++;
    }

    public static int getNombreCommandesCreees() { // méthode static : pas d'accès à this
        return nombreCommandesCreees;
    }
}

Commande c1 = new Commande("CMD-1");
Commande c2 = new Commande("CMD-2");
System.out.println(Commande.getNombreCommandesCreees()); // 2
```

Une méthode `static` n'a pas de `this` : elle ne peut pas accéder aux attributs d'instance (`reference` ici), seulement aux membres `static`.

### Exemple 3 — Bloc d'initialisation static

```java
public class TauxTva {
    static final double TAUX_STANDARD;

    static {
        TAUX_STANDARD = 0.20; // calcul ou lecture de configuration au chargement de la classe
    }
}
```

Un bloc `static { ... }` s'exécute une fois, au chargement de la classe — pratique pour initialiser une constante `static final` dont le calcul dépasse une simple affectation.

### Exemple 4 — Ordre complet d'initialisation

```java
public class Paiement {
    private String etape = "création";              // 1. initialiseur de champ

    { // 2. bloc d'initialisation d'instance
        System.out.println("Bloc d'init, etape = " + etape);
    }

    public Paiement() {
        System.out.println("Constructeur, etape = " + etape); // 3. corps du constructeur
        etape = "validé";
    }
}

new Paiement();
// Affiche, dans cet ordre :
// Bloc d'init, etape = création
// Constructeur, etape = création
```

Les initialiseurs de champs et les blocs d'instance s'exécutent dans l'ordre où ils apparaissent dans le fichier, **avant** le corps du constructeur.

### Instance vs static

| | Membre d'instance | Membre static |
|---|---|---|
| Appartient à | chaque objet | la classe |
| Nombre d'exemplaires | un par objet | un seul, partagé |
| Accès à `this` | oui | non |
| Quand l'utiliser | état propre à un objet (`prix` d'un `Produit`) | constante partagée, compteur global, méthode utilitaire (`Math.max(...)`) |

### Cycle de vie et ramasse-miettes

Un objet vit tant qu'au moins une référence pointe vers lui ; dès qu'il n'est plus accessible depuis le code en cours d'exécution, le **ramasse-miettes** (garbage collector) de la JVM libère automatiquement sa mémoire, sans intervention du développeur (le fonctionnement détaillé du ramasse-miettes est vu au niveau avancé).

### Pièges courants

> **Oublier qu'écrire un constructeur supprime le constructeur par défaut.** Dès qu'une classe déclare un constructeur avec paramètres, `new Produit()` sans argument ne compile plus, sauf à écrire explicitement un constructeur sans paramètre.

> **Confondre `static` et « accessible partout ».** Un membre `static` est partagé entre toutes les instances, ce n'est pas juste une question de visibilité : le modifier depuis un objet affecte tous les autres. Un compteur `static` mal protégé en environnement concurrent peut aussi perdre des incréments (voir le chapitre concurrence).

> **Nommer paramètre et champ pareil sans utiliser `this`.** `nom = nom;` dans un constructeur `Produit(String nom)` n'affecte rien : le paramètre local s'affecte lui-même. Il faut écrire `this.nom = nom;`.

### À retenir

- Une **classe** est un modèle ; un **objet** est une instance créée avec `new`.
- Sans constructeur explicite, un constructeur par défaut sans paramètre est généré ; dès qu'on en écrit un, il disparaît.
- `this(...)` (première instruction) réutilise un autre constructeur de la même classe.
- L'ordre d'initialisation d'un objet : champs et blocs d'instance dans l'ordre du code, puis corps du constructeur.
- `static` appartient à la classe, partagé par toutes les instances ; `final` sur un champ interdit toute réaffectation après la première.
