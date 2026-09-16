---
id: packages-classpath
chapitre: outils
ordre: 1
titre: "Packages, classpath et javadoc"
termes:
  - terme: Package
    definition: "Espace de noms qui regroupe des classes apparentées et évite les collisions de noms. Déclaré en première ligne d'un fichier source (`package com.boutique.produit;`), il doit correspondre exactement à l'arborescence de dossiers du projet."
  - terme: "import statique"
    definition: "Variante d'`import` qui importe les **membres statiques** d'une classe (méthodes ou champs) pour les utiliser sans préfixe. `import static java.lang.Math.max;` permet d'écrire `max(a, b)` au lieu de `Math.max(a, b)`."
  - terme: Classpath
    definition: "Liste de dossiers et de fichiers `.jar` dans lesquels la JVM (à l'exécution) et `javac` (à la compilation) cherchent les classes à charger. Fixé par l'option `-cp`/`-classpath`, ou géré automatiquement par un outil de build comme Maven."
  - terme: ClassNotFoundException
    definition: "Exception **vérifiée** levée quand du code tente de charger une classe par son nom à l'exécution (`Class.forName(\"...\")`, chargement d'un pilote JDBC) et que cette classe est introuvable sur le classpath."
  - terme: NoClassDefFoundError
    definition: "Erreur levée par la JVM quand une classe référencée à la compilation (donc présente dans le bytecode) est introuvable ou n'a pas pu être initialisée à l'exécution. Signale presque toujours un **classpath incomplet ou différent** entre la compilation et l'exécution."
  - terme: "JAR et manifeste"
    definition: "Un `.jar` est une archive ZIP de classes compilées et de ressources. Son manifeste (`META-INF/MANIFEST.MF`) peut déclarer `Main-Class` pour en faire un jar exécutable (`java -jar app.jar`)."
  - terme: Javadoc
    definition: "Commentaire de documentation `/** ... */` placé juste avant une classe, une méthode ou un champ, avec des balises (`@param`, `@return`, `@throws`…). L'outil `javadoc` le transforme en pages HTML consultables."
quiz:
  - question: "Une application compile sans erreur, mais au lancement vous obtenez `Exception in thread \"main\" java.lang.NoClassDefFoundError: com/boutique/util/JsonMapper`. Quelle est la cause la plus probable ?"
    choix:
      - "La classe `JsonMapper` n'existe pas et n'a jamais existé"
      - "Le jar contenant `JsonMapper` était présent à la compilation mais manque sur le classpath au lancement"
      - "Une faute de frappe dans le nom de la classe empêche la compilation"
      - "La méthode `main` n'est pas static"
    reponse: 1
    explication: "`NoClassDefFoundError` signifie que le compilateur a bien trouvé la classe (le bytecode la référence), mais que la JVM ne la trouve plus au lancement. C'est le symptôme classique d'un classpath d'exécution incomplet, par exemple un jar de dépendance oublié dans la commande `java -cp`."
  - question: "Que fait concrètement cette ligne ?"
    code: |
      import static java.util.Comparator.comparing;

      List<Produit> tries = produits.stream()
          .sorted(comparing(Produit::getPrix))
          .toList();
    choix:
      - "Elle importe toute la classe `Comparator` comme un import classique"
      - "Elle permet d'appeler `comparing(...)` directement, sans écrire `Comparator.comparing(...)`"
      - "Elle trie automatiquement `produits` avant même l'appel à `.stream()`"
      - "Elle ne compile pas : `static` est réservé à l'import de classes internes"
    reponse: 1
    explication: "Un import statique importe un membre statique précis (ici la méthode `comparing`) pour l'utiliser sans préfixer par le nom de la classe. Le tri lui-même ne se produit qu'à l'appel de `.sorted(...)` ; l'import ne fait qu'alléger l'écriture."
  - question: "Pourquoi évite-t-on en général les imports avec joker (`import com.boutique.produit.*;`) dans du code professionnel ?"
    choix:
      - "Ils ralentissent l'exécution du programme compilé"
      - "Ils sont interdits par le compilateur Java depuis Java 9"
      - "Ils rendent moins visible la provenance exacte d'une classe et peuvent créer une ambiguïté si deux packages importés définissent une classe de même nom"
      - "Ils importent aussi automatiquement les sous-packages, ce qui alourdit le programme"
    reponse: 2
    explication: "Un joker n'importe que les classes directement dans ce package (pas les sous-packages) et n'a aucun effet sur les performances : tout est résolu à la compilation. Le vrai problème est la lisibilité et le risque d'ambiguïté entre deux classes homonymes importées par deux jokers différents, qui provoque une erreur de compilation à corriger manuellement."
---

## Essentiel

Un **package** regroupe des classes apparentées et évite les collisions de noms. Son nom suit la **convention inversée** du nom de domaine de l'organisation, tout en minuscules : `com.boutique.produit`. Cette déclaration doit correspondre **exactement** à l'arborescence de dossiers du projet :

```
src/main/java/com/boutique/produit/Produit.java   →  package com.boutique.produit;
```

Pour utiliser une classe d'un autre package, on l'importe :

```java
package com.boutique.commande;

import com.boutique.produit.Produit;
import static java.util.Comparator.comparing;

public class Commande {
    private List<Produit> produits;
    // ...
}
```

Évitez l'import avec joker (`import com.boutique.produit.*;`) : il masque la provenance exacte des classes utilisées et peut créer une ambiguïté si deux packages importés définissent une classe portant le même nom.

Le **classpath** est la liste des dossiers et fichiers `.jar` où la JVM cherche les classes à charger à l'exécution. Un outil comme Maven le construit automatiquement à partir des dépendances déclarées ; en ligne de commande, on le fixe avec `-cp`.

## Détail

### Comment ça marche

À la compilation, `javac` vérifie que chaque classe importée existe sur le classpath et produit un fichier `.class` par classe, dans un dossier qui respecte la même arborescence que les packages. À l'exécution, la JVM recherche chaque classe référencée dans les emplacements du classpath, dans l'ordre : la première correspondance trouvée est utilisée. C'est pour cette raison qu'un même nom de classe présent dans deux jars différents du classpath peut provoquer des comportements surprenants selon l'ordre de déclaration.

### Exemple 1 — Package et arborescence

```
mon-projet/
└── src/main/java/
    └── com/boutique/
        ├── produit/
        │   ├── Produit.java        → package com.boutique.produit;
        │   └── ProduitService.java → package com.boutique.produit;
        └── commande/
            └── Commande.java       → package com.boutique.commande;
```

Chaque niveau de dossier correspond à un segment du package, séparé par un point dans le code source et par `/` (ou `\` sous Windows) sur le disque.

### Exemple 2 — Compiler et lancer manuellement avec le classpath

```bash
# Compiler toutes les classes dans le dossier out/
javac -d out $(find src/main/java -name "*.java")

# Lancer en pointant sur out/ et sur un jar de dépendance
java -cp "out;libs/gson-2.11.0.jar" com.boutique.commande.Commande
```

Sous Windows, le séparateur d'entrées du classpath est `;` ; sous Linux/macOS, c'est `:`. En pratique, Maven et Gradle construisent ce classpath pour vous — cette commande sert surtout à comprendre ce qui se passe derrière un IDE ou un build.

### Exemple 3 — Javadoc

```java
/**
 * Calcule le prix total d'une commande, remises comprises.
 *
 * @param commande la commande à évaluer, non nulle
 * @return le montant total en euros, jamais négatif
 * @throws IllegalArgumentException si la commande ne contient aucun produit
 */
public double calculerTotal(Commande commande) {
    if (commande.getProduits().isEmpty()) {
        throw new IllegalArgumentException("Commande vide");
    }
    // ...
}
```

Générer la documentation HTML à partir de ces commentaires :

```bash
javadoc -d docs -sourcepath src/main/java -subpackages com.boutique
```

Les IDE affichent aussi ce contenu directement au survol d'une méthode, sans avoir à générer les pages HTML.

### ClassNotFoundException vs NoClassDefFoundError

| | `ClassNotFoundException` | `NoClassDefFoundError` |
|---|---|---|
| Nature | Exception vérifiée (`Exception`) | Erreur (`Error`) |
| Déclenchée par | Chargement dynamique explicite (`Class.forName`, réflexion, pilote JDBC) | La JVM, en résolvant une référence déjà présente dans le bytecode compilé |
| Moment typique | Code qui charge une classe par son nom, à un chemin dont il n'est pas sûr | Une classe existait à la compilation mais son jar manque (ou a échoué à s'initialiser) à l'exécution |
| Se rattrape avec `catch` | Oui, c'est une exception vérifiée | Techniquement oui, mais ça n'a presque jamais de sens : c'est un symptôme d'environnement mal configuré |

### Pièges courants

> **Nom de package en majuscules ou avec des underscores.** La convention Java veut des packages tout en minuscules, sans `_` (`com.boutique.gestioncommandes`, pas `com.Boutique.GestionCommandes`). Ce n'est pas une erreur de compilation, mais ça casse la cohérence avec le reste de l'écosystème Java.

> **Dossier et package qui ne correspondent plus après un renommage.** Renommer un package sans déplacer le fichier physiquement (ou l'inverse) donne une erreur de compilation du type *« class Produit is public, should be declared in a file named Produit.java »* ou un package introuvable. Les IDE proposent un refactoring dédié (« Move » / « Rename package ») qui fait les deux en même temps.

> **Confondre les deux erreurs de classe manquante.** Voir `NoClassDefFoundError` alors que le code compile très bien signifie presque toujours un problème de **classpath au déploiement** (jar oublié, version différente entre build et exécution), pas une faute de code à corriger dans les sources.

### À retenir

- Le nom d'un package suit la convention inversée du domaine, tout en minuscules, et doit correspondre à l'arborescence des dossiers.
- `import static` importe un membre statique précis ; évitez les imports avec joker en code professionnel.
- Le classpath liste où la JVM et `javac` cherchent les classes ; Maven/Gradle le construisent automatiquement.
- `ClassNotFoundException` (chargement dynamique manqué) et `NoClassDefFoundError` (classpath d'exécution incomplet) ne se résolvent pas de la même façon.
- Un jar exécutable a besoin d'un manifeste avec `Main-Class` ; la javadoc (`/** ... */` + balises) documente l'API et se génère avec l'outil `javadoc`.
