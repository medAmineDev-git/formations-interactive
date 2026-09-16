---
id: enums
chapitre: poo-avancee
ordre: 2
titre: Les énumérations
termes:
  - terme: Enum
    definition: "Type spécial de classe représentant un **ensemble fixe et connu de constantes**, déclaré avec `enum`. Chaque constante est une instance unique de l'énumération, créée une seule fois par la JVM."
  - terme: "values() et valueOf()"
    definition: "`values()` (généré automatiquement) renvoie un tableau de toutes les constantes, dans l'ordre de déclaration. `valueOf(String)` renvoie la constante dont le nom correspond exactement, ou lève une `IllegalArgumentException` sinon."
  - terme: "ordinal()"
    definition: "Renvoie la **position** (à partir de 0) de la constante dans sa déclaration. Fragile : réordonner ou insérer une constante change les valeurs de `ordinal()` pour toutes les constantes suivantes. À ne jamais utiliser pour persister une valeur."
  - terme: Corps de constante
    definition: "Bloc `{ }` après une constante qui lui donne une implémentation spécifique d'une méthode abstraite de l'énumération. Chaque constante peut ainsi avoir un comportement différent, sans `switch` ni `if`."
  - terme: EnumMap et EnumSet
    definition: "Implémentations de `Map` et `Set` spécialisées pour les clés/éléments de type `enum`, basées en interne sur un tableau indexé par `ordinal()`. Plus compactes et plus rapides que `HashMap`/`HashSet`, et itèrent dans l'ordre naturel des constantes."
  - terme: Énumération comme singleton
    definition: "Une énumération à une seule constante garantit, par construction du langage, une instance unique — y compris face à la réflexion et à la désérialisation, contrairement à un singleton codé à la main."
quiz:
  - question: "Pourquoi est-il risqué de stocker `statut.ordinal()` dans une base de données ?"
    code: |
      public enum StatutCommande { EN_COURS, VALIDEE, ANNULEE }
    choix:
      - "`ordinal()` change de valeur si l'ordre des constantes est modifié dans le code, ce qui corrompt silencieusement les données déjà stockées"
      - "`ordinal()` n'existe pas sur les énumérations déclarées sans constructeur"
      - "`ordinal()` renvoie une valeur différente à chaque exécution du programme"
      - "Ce n'est pas risqué, `ordinal()` est stable tant que le nom des constantes ne change pas"
    reponse: 0
    explication: "`ordinal()` reflète uniquement la **position** dans le code source. Ajouter `EXPEDIEE` entre `EN_COURS` et `VALIDEE` décale tous les ordinaux suivants : une ligne stockée avec la valeur 1 (autrefois `VALIDEE`) redevient `EXPEDIEE`, sans qu'aucune erreur ne soit levée. Mieux vaut stocker le nom (`name()`) ou une valeur explicite définie par l'énumération elle-même."
  - question: "Que fait ce code ?"
    code: |
      public enum Operation {
          ADDITION {
              @Override
              public int appliquer(int a, int b) { return a + b; }
          },
          MULTIPLICATION {
              @Override
              public int appliquer(int a, int b) { return a * b; }
          };

          public abstract int appliquer(int a, int b);
      }

      System.out.println(Operation.MULTIPLICATION.appliquer(3, 4));
    choix:
      - "Erreur de compilation : une constante d'énumération ne peut pas avoir de corps"
      - "Affiche 12 : chaque constante fournit sa propre implémentation de la méthode abstraite"
      - "Affiche 7 : la première constante déclarée est toujours utilisée"
      - "Erreur à l'exécution : `appliquer` n'est jamais implémentée"
    reponse: 1
    explication: "Chaque constante peut avoir un **corps** qui implémente une méthode abstraite de l'énumération. `MULTIPLICATION.appliquer(3, 4)` exécute l'implémentation propre à `MULTIPLICATION`, soit `3 * 4 = 12`. C'est une alternative à un `switch` sur le type de constante, plus sûre à l'ajout d'une nouvelle valeur."
  - question: "Quel est l'intérêt principal d'un `EnumMap` par rapport à un `HashMap<StatutCommande, Integer>` ?"
    choix:
      - "`EnumMap` accepte des clés `null`, contrairement à `HashMap`"
      - "`EnumMap` est plus compact et plus rapide (tableau interne indexé par `ordinal()`), et itère dans l'ordre de déclaration des constantes"
      - "`EnumMap` peut avoir des clés qui ne sont pas des constantes de l'énumération"
      - "Il n'y a aucune différence pratique, `EnumMap` existe uniquement pour la lisibilité"
    reponse: 1
    explication: "`EnumMap` stocke ses valeurs dans un tableau interne indexé par `ordinal()`, ce qui le rend plus compact et plus rapide qu'un `HashMap` (pas de hachage, pas de collision), et garantit une itération dans l'ordre naturel des constantes. À l'inverse d'un `HashMap`, `EnumMap` n'accepte pas de clé `null`."
---

## Essentiel

Une **énumération** (`enum`) représente un ensemble **fixe** de constantes connues à la compilation :

```java
public enum StatutCommande {
    EN_COURS, VALIDEE, EXPEDIEE, ANNULEE
}
```

Chaque constante est une instance unique, créée une seule fois. Les méthodes générées automatiquement :

```java
StatutCommande.values();              // tableau des 4 constantes, dans l'ordre de déclaration
StatutCommande.valueOf("VALIDEE");    // la constante VALIDEE
StatutCommande.VALIDEE.name();        // "VALIDEE"
StatutCommande.VALIDEE.ordinal();     // 1 (position dans la déclaration)
```

`ordinal()` reflète la **position** dans le code, pas une valeur métier : ne jamais s'en servir pour persister un statut en base ou le comparer entre deux versions du code, car insérer une constante décale toutes les positions suivantes.

Une énumération peut avoir un **constructeur** et des **champs**, comme une classe :

```java
public enum Devise {
    EURO("€", 2), DOLLAR("$", 2), YEN("¥", 0);

    private final String symbole;
    private final int decimales;

    Devise(String symbole, int decimales) {
        this.symbole = symbole;
        this.decimales = decimales;
    }

    public String symbole() { return symbole; }
}
```

Le constructeur d'une énumération est toujours implicitement `private` : on ne crée jamais de constante avec `new`.

## Détail

### Comment ça marche

Le compilateur transforme un `enum` en une classe `final` qui étend implicitement `java.lang.Enum`, avec une instance `static final` par constante déclarée, créée au chargement de la classe. C'est ce mécanisme qui garantit l'unicité de chaque constante — et qui permet de comparer deux constantes avec `==` en toute sécurité, puisqu'il ne peut jamais exister deux instances distinctes de `VALIDEE`.

### Exemple 1 — `switch` sur une énumération

```java
public String libelle(StatutCommande statut) {
    return switch (statut) {
        case EN_COURS -> "En cours de préparation";
        case VALIDEE -> "Validée";
        case EXPEDIEE -> "Expédiée";
        case ANNULEE -> "Annulée";
    };
}
```

Sur un `switch` expression sans branche `default`, le compilateur vérifie l'**exhaustivité** : si une constante de `StatutCommande` n'est couvrue par aucun `case`, la compilation échoue. Ajouter une nouvelle constante à l'énumération fait alors apparaître une erreur de compilation à corriger, plutôt qu'un oubli silencieux à l'exécution — un filet de sécurité précieux qui n'existe pas avec un `switch` classique sans `default`.

### Exemple 2 — Corps de constante (méthode spécifique par constante)

```java
public enum Remise {
    AUCUNE {
        @Override public double appliquer(double prix) { return prix; }
    },
    DIX_POURCENT {
        @Override public double appliquer(double prix) { return prix * 0.9; }
    },
    VINGT_POURCENT {
        @Override public double appliquer(double prix) { return prix * 0.8; }
    };

    public abstract double appliquer(double prix);
}

double prixFinal = Remise.DIX_POURCENT.appliquer(100.0); // 90.0
```

Chaque constante implémente `appliquer` différemment : pas de `switch` ni de champ supplémentaire à maintenir, le comportement est directement attaché à la constante.

### Exemple 3 — Énumération implémentant une interface

```java
public interface Notifiable {
    void notifier(String message);
}

public enum CanalNotification implements Notifiable {
    EMAIL {
        @Override public void notifier(String message) { /* envoi email */ }
    },
    SMS {
        @Override public void notifier(String message) { /* envoi sms */ }
    }
}
```

Une énumération peut implémenter une ou plusieurs interfaces, exactement comme une classe. C'est utile pour manipuler des constantes de façon polymorphe, sans connaître leur type concret.

### Exemple 4 — Énumération comme singleton

```java
public enum ConfigurationApplication {
    INSTANCE;

    private final Map<String, String> parametres = new HashMap<>();

    public String obtenir(String cle) {
        return parametres.get(cle);
    }
}

ConfigurationApplication.INSTANCE.obtenir("timeout");
```

Une énumération à une seule constante est le moyen le plus sûr d'écrire un singleton en Java : le langage garantit qu'une seule instance existe, y compris face à la désérialisation ou à la réflexion, deux cas qui peuvent casser un singleton écrit à la main avec un constructeur privé classique.

### `EnumMap`/`EnumSet` vs `HashMap`/`HashSet`

| | `EnumMap` / `EnumSet` | `HashMap` / `HashSet` |
|---|---|---|
| Clés/éléments acceptés | Uniquement les constantes d'une énumération donnée | N'importe quel type avec `equals`/`hashCode` |
| Structure interne | Tableau indexé par `ordinal()` | Table de hachage |
| Ordre d'itération | Ordre de déclaration des constantes | Non garanti |
| Performance | Plus rapide, plus compact | Correct, mais surcoût du hachage |
| Clé/élément `null` | Non accepté | Accepté (`HashMap`, `HashSet`) |

### Enum vs constantes `static final`

Avant les énumérations (avant Java 5), on utilisait souvent des constantes entières :

```java
// ancien style, à éviter
public static final int STATUT_EN_COURS = 0;
public static final int STATUT_VALIDEE = 1;
```

Ce style ne garantit **rien à la compilation** : une méthode attendant un statut peut recevoir n'importe quel `int`, y compris une valeur invalide. Une énumération, elle, est un vrai type : le compilateur refuse toute valeur qui n'est pas une constante déclarée.

### Pièges courants

> **Utiliser `ordinal()` pour persister ou sérialiser une valeur.** Une insertion ou un réordonnancement des constantes change silencieusement le sens des données déjà enregistrées. Préférez `name()` (le nom, stable tant qu'on ne renomme pas la constante) ou un champ métier explicite défini dans le constructeur de l'énumération.

> **`valueOf()` avec un nom incorrect.** `StatutCommande.valueOf("Validee")` lève une `IllegalArgumentException` (« No enum constant … ») car la casse doit correspondre exactement au nom de la constante. Valider ou capturer l'entrée utilisateur avant l'appel.

> **Oublier une constante dans un ancien `switch` classique (avec `case` et `break`, sans être une expression).** Sans branche `default` ni vérification d'exhaustivité, une constante non gérée ne provoque **aucune erreur** : le `switch` ne fait simplement rien pour elle. Ce risque disparaît avec un `switch` expression (`->`), exhaustif par construction sur une énumération.

### À retenir

- `values()`, `valueOf(String)`, `name()` et `ordinal()` sont générés automatiquement ; `ordinal()` ne doit jamais servir à persister une valeur.
- Une énumération peut avoir constructeur, champs, méthodes, corps de constante spécifique, et implémenter des interfaces.
- Un `switch` expression sur une énumération est vérifié à l'exhaustivité par le compilateur.
- `EnumMap`/`EnumSet` sont plus rapides et plus compacts que leurs équivalents `HashMap`/`HashSet` pour des clés d'énumération.
- Une énumération à une seule constante est la façon la plus sûre d'écrire un singleton en Java.
