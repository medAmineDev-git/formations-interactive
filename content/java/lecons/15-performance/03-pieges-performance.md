---
id: pieges-performance
chapitre: performance
ordre: 3
titre: "Pièges courants et bons réflexes"
termes:
  - terme: StringBuilder
    definition: "Classe mutable pour construire une chaîne par concaténations successives sans réallouer un nouvel objet `String` à chaque étape. Indispensable dans une boucle : l'opérateur `+` sur des `String` crée un nouvel objet à chaque utilisation, ce qui coûte de plus en plus cher à mesure que la chaîne grandit."
  - terme: Autoboxing
    definition: "Conversion implicite entre un type primitif (`int`) et son type enveloppe (`Integer`). Dans une boucle chaude qui manipule des collections comme `List<Integer>`, chaque autoboxing/unboxing alloue potentiellement un nouvel objet et ajoute une indirection, contrairement à un tableau ou une structure de type primitif (`int[]`)."
  - terme: "Pattern (expression régulière précompilée)"
    definition: "`Pattern.compile(regex)` analyse et compile l'expression régulière en une structure interne réutilisable. Appeler `String.matches(regex)` ou `Pattern.compile(regex)` à chaque itération d'une boucle recompile la même expression à chaque fois, alors qu'un `Pattern` statique compilé une seule fois suffit."
  - terme: "hashCode() coûteux ou mal réparti"
    definition: "Une implémentation de `hashCode()` lente à calculer, ou qui produit trop souvent la même valeur pour des objets différents (mauvaise répartition), dégrade les performances d'un `HashMap`/`HashSet` : les éléments s'accumulent dans les mêmes cases (buckets), transformant des opérations censées être proches de O(1) en parcours plus coûteux."
  - terme: Journalisation paresseuse
    definition: "Construire le message d'un appel de journalisation (par exemple par concaténation de chaînes) coûte du temps même si le niveau de journalisation est désactivé et que le message ne sera jamais écrit. Les API de journalisation modernes proposent des formes paresseuses (paramètres substitués, ou fournisseur `Supplier<String>`) qui évitent ce coût quand le niveau est désactivé."
  - terme: Exception comme flux de contrôle
    definition: "Utiliser une exception pour un cas attendu et fréquent du déroulement normal du programme (plutôt qu'une condition), au lieu de la réserver à des situations réellement exceptionnelles. Une exception capture une pile d'appels à sa création, ce qui a un coût nettement supérieur à un simple test conditionnel."
  - terme: Requête N+1
    definition: "Motif d'accès aux données où une requête initiale ramène N enregistrements, suivie d'une requête supplémentaire par enregistrement pour récupérer des données associées — au lieu d'une seule requête qui les ramène toutes en une fois. Fréquent avec un ORM mal utilisé ; traité en détail dans la formation Spring Boot."
quiz:
  - question: "Quel est le principal problème de performance de ce code ?"
    code: |
      String resultat = "";
      for (String ligne : lignesDuFichier) {
          resultat = resultat + ligne;
      }
    choix:
      - "String est thread-safe, ce qui ajoute une synchronisation inutile à chaque itération"
      - "Chaque `resultat + ligne` crée un nouvel objet String et recopie tout le contenu déjà accumulé : le coût total croît de façon quadratique avec le nombre de lignes, au lieu d'être linéaire avec un StringBuilder"
      - "Le compilateur javac refuse ce code, il faut obligatoirement utiliser StringBuilder pour concaténer dans une boucle"
      - "lignesDuFichier doit être un tableau, pas une collection, pour que la boucle fonctionne correctement"
    reponse: 1
    explication: "String est immuable : chaque `+` produit un nouvel objet et recopie l'intégralité du contenu déjà accumulé, plus le nouveau fragment. Sur n lignes, le coût total de recopie croît de façon quadratique, pas linéaire. Un StringBuilder accumule dans un buffer interne redimensionné par amortissement, avec un coût total linéaire. Le code compile parfaitement ; le problème est uniquement de performance, invisible sur peu de lignes et significatif sur un gros volume."
  - question: "Pourquoi compiler un Pattern à l'intérieur de la méthode appelée à chaque itération d'une boucle est-il un piège ?"
    code: |
      for (String ligne : lignes) {
          if (Pattern.compile("^[A-Z]{2}\\d{4}$").matcher(ligne).matches()) {
              traiter(ligne);
          }
      }
    choix:
      - "Pattern.compile() ne peut être appelé qu'une seule fois par programme, sous peine d'exception"
      - "L'expression régulière est analysée et recompilée à chaque itération, un travail répété inutilement alors que l'expression ne change jamais : il faut compiler le Pattern une seule fois, en dehors de la boucle (par exemple dans un champ static final)"
      - "matches() sur un Matcher est déprécié depuis Java 21 au profit de find()"
      - "Ce code lève une ConcurrentModificationException car lignes est parcourue en même temps qu'elle est lue"
    reponse: 1
    explication: "Pattern.compile() a un coût réel (analyse et construction d'une machine à états internes) qui n'a aucune raison d'être payé à chaque itération puisque l'expression régulière est une constante du code. La correction consiste à extraire un `private static final Pattern PATTERN = Pattern.compile(...)` compilé une seule fois, puis à réutiliser `PATTERN.matcher(ligne).matches()` dans la boucle."
  - question: "Pourquoi utiliser une exception pour signaler un cas attendu et fréquent (par exemple, une entrée non trouvée dans une boucle de recherche) est-il déconseillé en termes de performance ?"
    choix:
      - "Parce que la JVM interdit de lever plus d'une exception par méthode"
      - "Parce que la création d'une exception capture une pile d'appels, un coût nettement supérieur à celui d'un simple test conditionnel ou d'une valeur de retour (comme un Optional vide) pour un cas qui fait partie du déroulement normal et fréquent du programme"
      - "Parce qu'une exception non interceptée provoque toujours l'arrêt immédiat de la JVM"
      - "Parce que le compilateur remplace automatiquement toute exception par une erreur de compilation en mode strict"
    reponse: 1
    explication: "Construire une exception a un coût réel, principalement lié à la capture de la pile d'appels au moment de sa création. Ce coût est parfaitement acceptable pour un cas réellement exceptionnel et rare, mais devient significatif si l'exception sert de mécanisme de flux de contrôle ordinaire dans un chemin fréquenté — un test conditionnel, une valeur de retour comme Optional, ou un code de retour explicite sont bien mieux adaptés à un cas attendu."
---

## Essentiel

Les optimisations les plus rentables suivent toujours le même ordre de priorité : **l'algorithme d'abord** (une complexité O(n²) reste mauvaise quelle que soit la micro-optimisation), **puis les structures de données** (choisir la bonne implémentation de collection — voir le chapitre Collections), **et seulement ensuite les micro-optimisations locales**, si elles sont justifiées par une mesure.

Quelques pièges reviennent constamment en revue de code :

- **Concaténer des `String` avec `+` dans une boucle** : chaque itération recopie tout le contenu déjà accumulé (coût quadratique). Utiliser `StringBuilder`.
- **Autoboxing dans une boucle chaude** (`List<Integer>` plutôt qu'un `int[]`) : chaque conversion primitive ↔ objet peut allouer, et multiplie les indirections.
- **Recompiler une expression régulière à chaque appel** (`Pattern.compile(...)` dans une méthode appelée en boucle) : compiler un `Pattern` une seule fois, en `static final`.
- **Journaliser un message coûteux à construire, même quand le niveau est désactivé** : privilégier les formes paresseuses (paramètres substitués, fournisseur).
- **Utiliser une exception pour un cas attendu et fréquent** : une exception capture une pile d'appels à sa création, bien plus coûteux qu'un test conditionnel.

D'autres pièges classiques : un `hashCode()` coûteux ou mal réparti qui dégrade un `HashMap`, des entrées/sorties non tamponnées, un cache mal dimensionné, ou des requêtes N+1 côté base de données.

**Aucun de ces pièges ne justifie une correction préventive systématique** : le message central du chapitre reste de mesurer (JMH, profilage) avant d'intervenir, puis de corriger ce qui est réellement significatif dans le contexte mesuré.

## Détail

### Exemple 1 — Concaténation de chaînes en boucle

```java
// À éviter : coût quadratique, un nouvel objet String à chaque itération
String rapport = "";
for (Commande commande : commandes) {
    rapport = rapport + commande.resume() + "\n";
}

// Préférable : StringBuilder accumule dans un buffer interne, coût linéaire
StringBuilder rapportBuilder = new StringBuilder();
for (Commande commande : commandes) {
    rapportBuilder.append(commande.resume()).append("\n");
}
String rapportFinal = rapportBuilder.toString();
```

Sur une poignée d'itérations, la différence est invisible. Sur des milliers de lignes, le coût de recopie répétée devient significatif — un cas typique où « ça marche en test, ça ralentit en production avec de vraies données ».

### Exemple 2 — Autoboxing dans une boucle chaude

```java
// Autoboxing à chaque ajout : chaque int est enveloppé dans un Integer
List<Integer> quantites = new ArrayList<>();
for (int i = 0; i < 1_000_000; i++) {
    quantites.add(i); // int -> Integer à chaque appel
}

// Sans autoboxing : tableau de primitifs
int[] quantitesPrimitives = new int[1_000_000];
for (int i = 0; i < quantitesPrimitives.length; i++) {
    quantitesPrimitives[i] = i;
}
```

Quand le volume est important et le traitement purement numérique, un tableau de primitifs (ou une collection spécialisée pour les primitifs, si le projet en dépend déjà) évite l'autoboxing systématique. Ce n'est pas une raison pour bannir `List<Integer>` partout : dans la grande majorité du code applicatif, la lisibilité et l'API riche des collections l'emportent largement sur ce coût, sauf dans une boucle réellement chaude et mesurée comme telle.

### Exemple 3 — Expressions régulières recompilées à chaque appel

```java
// À éviter : recompile l'expression à chaque appel
public boolean estUnCodeProduit(String valeur) {
    return valeur.matches("^[A-Z]{2}\\d{4}$"); // matches() compile un Pattern en interne
}

// Préférable : compilé une seule fois
private static final Pattern CODE_PRODUIT = Pattern.compile("^[A-Z]{2}\\d{4}$");

public boolean estUnCodeProduit(String valeur) {
    return CODE_PRODUIT.matcher(valeur).matches();
}
```

`String.matches(regex)` recompile un `Pattern` à chaque appel en interne — pratique pour un usage ponctuel, coûteux si la méthode est appelée en boucle sur un grand volume.

### Exemple 4 — Exceptions utilisées comme flux de contrôle

```java
// À éviter : une exception pour un cas attendu et fréquent
public Produit chercherOuLeverException(List<Produit> catalogue, String reference) {
    for (Produit p : catalogue) {
        if (p.reference().equals(reference)) {
            return p;
        }
    }
    throw new ProduitIntrouvableException(reference); // coûteux si appelé souvent pour un cas normal
}

// Préférable : un type qui exprime l'absence sans exception
public Optional<Produit> chercher(List<Produit> catalogue, String reference) {
    return catalogue.stream()
        .filter(p -> p.reference().equals(reference))
        .findFirst();
}
```

Si « produit non trouvé » est un résultat attendu et fréquent (pas une erreur système), un `Optional` (ou un code de retour explicite) l'exprime sans payer le coût de construction d'une exception, qui capture une pile d'appels à chaque création.

### Autres pièges fréquents

| Piège | Symptôme | Bon réflexe |
|---|---|---|
| Mauvais choix de collection | `contains()` lent sur une `List` volumineuse, insertions lentes en tête d'`ArrayList` | Choisir l'implémentation adaptée à l'usage réel (voir le chapitre Collections) |
| `hashCode()` coûteux ou mal réparti | `HashMap`/`HashSet` dont les performances se dégradent avec le volume | Un `hashCode()` rapide et bien réparti sur les champs significatifs de l'objet |
| Journalisation coûteuse toujours évaluée | Construction de messages même journal désactivé | Paramètres substitués ou `Supplier<String>` plutôt que concaténation directe |
| Entrées/sorties non tamponnées | Lecture/écriture fichier ou flux très lente, un appel système par octet ou par petite unité | `BufferedReader`/`BufferedWriter`, `BufferedInputStream`/`BufferedOutputStream` |
| Cache mal dimensionné | Trop petit : taux de succès faible, gain marginal ; trop grand : pression mémoire, GC plus fréquent | Dimensionner et ajuster à partir de mesures réelles, pas d'une valeur arbitraire |
| Requête N+1 | Une requête par enregistrement d'une liste au lieu d'une seule requête groupée | Chargement en une fois (jointure, requête groupée) — détaillé dans la formation Spring Boot |

### Pièges courants

> **Corriger un piège de performance sans l'avoir mesuré.** Remplacer une `List<Integer>` par un tableau de primitifs, ou réécrire une méthode entière pour éviter un hypothétique coût d'autoboxing, sans avoir établi que ce code est réellement un point chaud significatif, ajoute de la complexité pour un gain qui n'a jamais été vérifié. Revenir au principe du chapitre : mesurer (JMH pour un fragment isolé, profilage pour l'application réelle) avant d'intervenir.

> **`hashCode()` qui retourne une constante.** `return 1;` compile et respecte le contrat (des objets égaux ont le même hashCode), mais détruit les performances d'un `HashMap` : tous les éléments tombent dans le même bucket, transformant chaque recherche en parcours linéaire de tous les éléments.

> **Ignorer l'ordre des priorités.** Passer du temps à micro-optimiser une boucle alors que l'algorithme qui l'entoure est en O(n²) quand une structure de données adaptée le ramènerait à O(n log n) (ou l'inverse : chercher un meilleur algorithme alors qu'une requête N+1 domine largement le temps total) revient à optimiser le mauvais goulot d'étranglement. Un profilage préalable identifie où le temps est réellement passé.

### À retenir

- Ordre de priorité : algorithme d'abord, structures de données ensuite, micro-optimisations seulement en dernier recours et sur la base d'une mesure.
- Concaténation de chaînes en boucle, autoboxing dans les boucles chaudes, `Pattern` recompilé à chaque appel et exceptions utilisées comme flux de contrôle sont des pièges classiques, faciles à repérer en revue de code.
- Un `hashCode()` coûteux ou mal réparti dégrade silencieusement les performances d'un `HashMap`/`HashSet`, sans qu'aucune erreur ne le signale.
- Des entrées/sorties non tamponnées, un cache mal dimensionné et des requêtes N+1 sont des pièges qui se situent hors du code Java pur, mais qui dominent très souvent le temps réel d'une application.
- Aucun de ces pièges ne justifie une correction préventive systématique : le réflexe qui prime sur tous les autres reste de mesurer avant d'optimiser.
