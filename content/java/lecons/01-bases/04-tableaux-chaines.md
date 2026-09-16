---
id: tableaux-chaines
chapitre: bases
ordre: 4
titre: "Tableaux et chaînes de caractères"
termes:
  - terme: Tableau
    definition: "Structure de taille **fixe** contenant des éléments d'un même type, indexés à partir de 0. Un type référence en Java : une variable tableau contient une adresse vers la zone mémoire des éléments."
  - terme: "Arrays"
    definition: "Classe utilitaire (`java.util.Arrays`) offrant des méthodes statiques sur les tableaux : `sort`, `copyOf`, `toString`, `equals`, `asList`…"
  - terme: Immuabilité de String
    definition: "Une fois créé, le contenu d'un objet `String` ne change jamais. Toute méthode qui semble « modifier » une chaîne (`concat`, `replace`, `toUpperCase`…) renvoie en réalité un **nouvel** objet `String`."
  - terme: Pool de chaînes
    definition: "Zone mémoire où la JVM réutilise les littéraux `String` identiques : `\"abc\"` écrit deux fois dans le code référence le **même** objet. Un `String` créé avec `new String(\"abc\")` échappe au pool et crée un objet distinct."
  - terme: "StringBuilder"
    definition: "Classe représentant une chaîne **modifiable**. Recommandée pour construire une chaîne par concaténations répétées (boucle), là où `String + String` créerait un nouvel objet à chaque itération."
  - terme: Bloc de texte (text block)
    definition: "Littéral de chaîne multi-ligne délimité par `\"\"\"`, finalisé en **Java 15** (JEP 378), qui évite d'échapper les guillemets et gère l'indentation automatiquement. Toujours un `String` ordinaire à l'exécution."
  - terme: "formatted / String.format"
    definition: "`\"...\"​.formatted(args)` (méthode d'instance, équivalente à `String.format(\"...\", args)`) insère des valeurs dans un gabarit avec des spécificateurs comme `%s`, `%d`, `%.2f`."
quiz:
  - question: "Que vaut cette comparaison ?"
    code: |
      String a = "clavier";
      String b = "clavier";
      String c = new String("clavier");
      System.out.println(a == b);
      System.out.println(a == c);
    choix:
      - "true puis true"
      - "true puis false"
      - "false puis false"
      - "false puis true"
    reponse: 1
    explication: "`a` et `b` sont deux littéraux identiques : ils référencent le **même** objet dans le pool de chaînes, donc `a == b` est `true`. `new String(\"clavier\")` force la création d'un objet distinct hors du pool : `a == c` compare deux références différentes, donc `false`, même si le contenu est identique. Il faut toujours `.equals()` pour comparer le **contenu** de deux `String`."
  - question: "Pourquoi ce code est-il déconseillé pour construire une grande chaîne ?"
    code: |
      String resultat = "";
      for (Produit p : produits) {
          resultat = resultat + p.getNom() + ", ";
      }
    choix:
      - "Il ne compile pas : `String` n'a pas d'opérateur `+`"
      - "`String` étant immuable, chaque `+` crée un nouvel objet, recopiant tout le contenu précédent à chaque itération"
      - "`resultat` reste toujours vide à cause de l'immuabilité"
      - "Ce code lève une exception après 100 itérations"
    reponse: 1
    explication: "Comme `String` est immuable, `resultat + ...` ne modifie rien : il crée un nouvel objet `String` et recopie l'ancien contenu à chaque tour de boucle, ce qui coûte de plus en plus cher (quadratique) à mesure que `produits` grandit. `StringBuilder` (avec `append`) modifie un buffer en place, sans recopie complète à chaque ajout."
  - question: "Que déclare cette ligne ?"
    code: |
      int[][] grille = new int[3][4];
    choix:
      - "Un tableau à une dimension de 12 éléments"
      - "Un tableau de 3 lignes, chacune contenant 4 éléments `int`"
      - "Un tableau de 4 lignes, chacune contenant 3 éléments `int`"
      - "Une erreur de compilation : la syntaxe correcte est `new int[3, 4]`"
    reponse: 1
    explication: "`new int[3][4]` crée un tableau à deux dimensions de 3 lignes et 4 colonnes (`grille[0]` à `grille[2]`, chacun de longueur 4). La syntaxe avec deux crochets successifs (pas de virgule) est celle d'un tableau multidimensionnel en Java."
---

## Essentiel

Un **tableau** a une taille fixe, définie à sa création :

```java
int[] quantites = new int[3];         // {0, 0, 0} : valeurs par défaut
quantites[0] = 10;

String[] categories = {"Informatique", "Bureautique", "Réseau"}; // taille 3, initialisé directement

for (String categorie : categories) {  // for-each : parcours simple
    System.out.println(categorie);
}
```

Un tableau à deux dimensions : `int[][] grille = new int[3][4];` (3 lignes de 4 éléments).

Une **`String`** est **immuable** : aucune méthode ne la modifie, chacune renvoie un nouvel objet.

```java
String nom = "clavier";
nom.toUpperCase();          // ne modifie PAS nom
nom = nom.toUpperCase();    // il faut réaffecter : "CLAVIER"
```

Comparer deux `String` avec `==` compare des **références**, pas le contenu : utilisez toujours `.equals()`. Pour construire une chaîne dans une boucle, utilisez `StringBuilder` plutôt que la concaténation `+`, qui recrée un objet à chaque itération.

## Détail

### Comment ça marche

Un tableau réserve un bloc mémoire contiguu de taille fixe au moment de sa création (`new Type[taille]`) ; sa longueur est accessible via `.length` (sans parenthèses, contrairement à `String.length()`). Une `String`, elle, encapsule en interne un tableau de caractères jamais modifié après construction : chaque opération qui « transforme » une chaîne construit un nouvel objet et laisse l'original intact — c'est ce qui garantit qu'une `String` partagée entre plusieurs parties du code ne change jamais dans le dos de l'une d'elles.

### Exemple 1 — `Arrays` : trier, copier, afficher

```java
import java.util.Arrays;

int[] prix = {45, 12, 89, 23};

Arrays.sort(prix);                          // tri en place : {12, 23, 45, 89}
int[] copie = Arrays.copyOf(prix, prix.length); // copie indépendante
System.out.println(Arrays.toString(prix));  // [12, 23, 45, 89]
```

Sans `Arrays.toString`, `System.out.println(prix)` affiche une chaîne technique inexploitable (ex. `[I@1b6d3586`), pas le contenu du tableau.

### Exemple 2 — Méthodes utiles de `String`

```java
String phrase = "  Clavier,Souris,Ecran  ";

String nettoyee = phrase.strip();               // "Clavier,Souris,Ecran" (retire les espaces de bord)
boolean vide = "".isBlank();                      // true : vide ou uniquement des espaces
String[] mots = nettoyee.split(",");              // ["Clavier", "Souris", "Ecran"]
String recolle = String.join(" / ", mots);        // "Clavier / Souris / Ecran"
String message = "Prix : %.2f €".formatted(19.9); // "Prix : 19,90 €" (selon la locale) ou "19.90 €"
```

`strip()` est l'équivalent moderne de `trim()`, compatible Unicode ; `isBlank()` vérifie aussi les chaînes composées uniquement d'espaces (contrairement à `isEmpty()`).

### Exemple 3 — `StringBuilder` pour construire une chaîne

```java
StringBuilder sb = new StringBuilder();
for (Produit p : produits) {
    sb.append(p.getNom()).append(", ");
}
String resultat = sb.toString();
```

`append` modifie le buffer interne sans le recopier entièrement à chaque appel : bien plus efficace qu'une concaténation `+` répétée dans une boucle.

### Exemple 4 — Bloc de texte pour du contenu multi-ligne

Finalisés en **Java 15** (JEP 378) :

```java
String requeteSql = """
        SELECT nom, prix
        FROM produits
        WHERE categorie = 'Informatique'
        """;
```

Plus besoin d'échapper les guillemets ni de concaténer ligne par ligne avec `\n`. L'indentation commune à toutes les lignes est retirée automatiquement.

> Les **modèles de chaînes** (*string templates*, qui auraient permis d'écrire `"Total : \{total}"` pour interpoler une variable directement) ont été **retirés** par le JDK avant leur finalisation, après plusieurs previews (Java 21 à 22) : ils ne sont disponibles dans **aucune** version de Java et il ne faut jamais les présenter comme utilisables. Pour composer une chaîne avec des variables, on utilise la concaténation `+`, `String.format`/`.formatted()`, ou un bloc de texte.

### Pièges courants

> **Comparer deux `String` avec `==`.** Deux littéraux identiques peuvent référencer le même objet grâce au pool de chaînes (souvent `true` par coïncidence), mais ce n'est jamais garanti — notamment avec `new String(...)` ou une chaîne construite dynamiquement. `.equals()` compare toujours le contenu réel, `==` compare des références.

> **Concaténer avec `+` dans une boucle.** Comme `String` est immuable, chaque `+` recrée un objet et recopie tout le contenu déjà accumulé : coût croissant à chaque itération. `StringBuilder` évite cette recopie.

> **Confondre `length` (tableau) et `length()` (`String`).** `tableau.length` est un champ (pas de parenthèses) ; `chaine.length()` est une méthode. Les inverser est une erreur de compilation fréquente chez les débutants.

### À retenir

- Un tableau a une taille fixe ; `Arrays` fournit `sort`, `copyOf`, `toString`, etc.
- `String` est immuable : chaque transformation renvoie un nouvel objet, il faut réaffecter le résultat.
- `.equals()` pour comparer le contenu de deux `String`, jamais `==` (réservé à la comparaison de références).
- `StringBuilder` pour construire une chaîne dans une boucle.
- Les blocs de texte (`"""`) sont finalisés depuis **Java 15** ; les **modèles de chaînes** ont été **retirés** et ne sont disponibles dans aucune version.
