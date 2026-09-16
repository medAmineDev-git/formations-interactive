---
id: iteration-tri
chapitre: collections
ordre: 3
titre: "Parcourir, trier, transformer"
termes:
  - terme: Iterator
    definition: "Objet qui parcourt une collection un élément à la fois, via `hasNext()` et `next()`. La boucle `for-each` en est une écriture simplifiée par le compilateur. `remove()` permet de supprimer l'élément courant **pendant** le parcours, sans erreur."
  - terme: ConcurrentModificationException
    definition: "Exception levée quand une collection est **modifiée en dehors de l'itérateur** pendant un parcours (par exemple `liste.remove(x)` dans un `for-each`). Détectée par un compteur de modifications interne, comparé à chaque appel à `next()`."
  - terme: Comparable
    definition: "Interface implémentée par une classe pour définir son **ordre naturel** via `compareTo(T autre)`. `String`, les types enveloppes (`Integer`…) et beaucoup de classes du JDK l'implémentent déjà."
  - terme: Comparator
    definition: "Interface fonctionnelle qui définit un ordre **externe** à la classe, via `compare(T a, T b)`. Composable avec `comparing`, `thenComparing`, `reversed`, `nullsFirst` — pratique pour trier selon plusieurs critères ou sans modifier la classe triée."
  - terme: "List.sort(comparator)"
    definition: "Méthode par défaut de `List`, qui trie la liste **sur place** (elle modifie la liste, ne renvoie rien). `list.sort(null)` utilise l'ordre naturel (`Comparable`)."
  - terme: "binarySearch"
    definition: "Recherche par dichotomie en O(log n), fournie par `Collections.binarySearch` (List) et `Arrays.binarySearch` (tableau). **Exige que la collection soit déjà triée** dans le même ordre que celui utilisé pour la recherche ; sinon le résultat n'est pas défini."
  - terme: "Arrays.asList"
    definition: "Convertit un tableau en `List` **sans copier les données** : la liste obtenue est une vue de taille fixe sur le tableau. `set(i, v)` fonctionne (et modifie le tableau), mais `add`/`remove` lèvent `UnsupportedOperationException`."
quiz:
  - question: "Que se passe-t-il à l'exécution ?"
    code: |
      List<String> panier = new ArrayList<>(List.of("Clavier", "Souris", "Écran"));
      for (String article : panier) {
          if (article.equals("Souris")) {
              panier.remove(article);
          }
      }
    choix:
      - "Le panier contient [\"Clavier\", \"Écran\"] après la boucle"
      - "Une ConcurrentModificationException est levée"
      - "Rien ne se passe : remove() dans un for-each est ignoré silencieusement"
      - "Une StackOverflowError est levée"
    reponse: 1
    explication: "Le for-each utilise un Iterator interne. Appeler panier.remove(article) directement sur la liste modifie sa structure sans passer par cet itérateur, qui détecte l'incohérence au prochain next() et lève ConcurrentModificationException. La suppression correcte pendant un parcours passe par Iterator.remove() ou par removeIf()."
  - question: "Dans quel ordre les produits sont-ils triés ?"
    code: |
      record Produit(String nom, double prix) { }
      List<Produit> produits = new ArrayList<>(List.of(
          new Produit("Clavier", 49.90),
          new Produit("Souris", 49.90),
          new Produit("Écran", 199.00)
      ));
      produits.sort(Comparator.comparing(Produit::prix).thenComparing(Produit::nom));
    choix:
      - "Écran, puis Clavier, puis Souris"
      - "Clavier, puis Souris, puis Écran (par prix croissant, et par nom à prix égal)"
      - "Souris, puis Clavier, puis Écran"
      - "L'ordre d'origine, thenComparing n'a pas d'effet ici"
    reponse: 1
    explication: "comparing(Produit::prix) trie d'abord par prix croissant : Clavier et Souris (49.90) arrivent avant Écran (199.00). thenComparing(Produit::nom) ne s'applique qu'en cas d'égalité sur le premier critère : entre Clavier et Souris, à prix égal, l'ordre alphabétique des noms les départage (Clavier avant Souris)."
  - question: "Que produit ce code ?"
    code: |
      String[] categories = {"Informatique", "Jardin"};
      List<String> vue = Arrays.asList(categories);
      vue.add("Sport");
    choix:
      - "La liste contient désormais [\"Informatique\", \"Jardin\", \"Sport\"]"
      - "UnsupportedOperationException : Arrays.asList renvoie une liste de taille fixe"
      - "Le tableau categories est agrandi automatiquement à 3 éléments"
      - "ClassCastException"
    reponse: 1
    explication: "Arrays.asList renvoie une vue de taille fixe adossée au tableau : set(i, v) est autorisé (il modifie le tableau), mais toute opération qui changerait la taille — add, remove — lève UnsupportedOperationException. Pour une vraie liste modifiable, il faut la copier : new ArrayList<>(Arrays.asList(categories))."
---

## Essentiel

Le **for-each** (`for (String s : liste)`) est la façon la plus simple de parcourir une collection ; le compilateur le traduit en appels à un `Iterator` (`hasNext()`, `next()`).

```java
for (String article : panier) {
    System.out.println(article);
}
```

**Piège classique** : modifier la collection pendant ce parcours (`panier.remove(x)`) lève une `ConcurrentModificationException`. Pour supprimer pendant l'itération, deux options sûres :

```java
Iterator<String> it = panier.iterator();
while (it.hasNext()) {
    if (it.next().equals("Souris")) {
        it.remove(); // supprime l'élément courant, sans exception
    }
}

panier.removeIf(article -> article.equals("Souris")); // équivalent, plus concis
```

Pour **trier**, `List.sort(Comparator)` trie sur place :

```java
produits.sort(Comparator.comparing(Produit::prix));                          // par prix croissant
produits.sort(Comparator.comparing(Produit::prix).reversed());               // décroissant
produits.sort(Comparator.comparing(Produit::prix).thenComparing(Produit::nom)); // prix, puis nom si égalité
```

Pour **rechercher**, `contains`/`indexOf` parcourent la collection (O(n)) ; `Collections.binarySearch`/`Arrays.binarySearch` sont bien plus rapides (O(log n)) mais **exigent une collection déjà triée**.

## Détail

### Comment ça marche

Un `for-each` sur une `List<String> l` est réécrit par le compilateur à peu près ainsi :

```java
for (Iterator<String> it = l.iterator(); it.hasNext(); ) {
    String s = it.next();
    // corps de la boucle
}
```

L'itérateur garde une référence vers un compteur de modifications de la collection. Si ce compteur change **autrement que par l'itérateur lui-même** (un `add`/`remove` appelé directement sur la liste), `next()` détecte l'incohérence au tour suivant et lève `ConcurrentModificationException` — une protection contre les parcours incohérents, pas une garantie de robustesse en environnement concurrent (voir le chapitre sur la concurrence pour les collections thread-safe).

### Exemple 1 — forEach avec une lambda

```java
panier.forEach(article -> System.out.println("- " + article));
```

`forEach` (méthode par défaut de `Iterable`) prend un `Consumer` : pratique pour un traitement simple, mais on ne peut ni le rompre (pas d'équivalent `break`) ni supprimer d'élément dedans — pour transformer ou filtrer une collection, les streams (voir le chapitre dédié) sont mieux adaptés.

### Exemple 2 — Comparator.comparing, thenComparing, reversed, nullsFirst

```java
record Produit(String nom, double prix, String fabricant) { }

List<Produit> produits = new ArrayList<>(catalogue);

// Tri par prix décroissant
produits.sort(Comparator.comparing(Produit::prix).reversed());

// Tri par fabricant, puis par prix croissant à fabricant égal
produits.sort(Comparator.comparing(Produit::fabricant).thenComparing(Produit::prix));

// Fabricant potentiellement null : les null passent en premier
produits.sort(Comparator.comparing(Produit::fabricant, Comparator.nullsFirst(Comparator.naturalOrder())));
```

`Comparator.comparing` accepte une référence de méthode qui extrait la clé de tri ; les comparateurs se **composent** avec `thenComparing` et `reversed` sans écrire de classe séparée.

### Exemple 3 — Collections.sort vs List.sort

```java
List<String> noms = new ArrayList<>(List.of("Souris", "Clavier", "Écran"));

Collections.sort(noms);              // trie sur place, ordre naturel (String implémente Comparable)
noms.sort(Comparator.reverseOrder()); // trie sur place, ordre inverse
```

`Collections.sort(liste)` existe depuis Java 1.2 ; en interne, elle délègue à `liste.sort(null)` depuis que `List.sort` est devenu une méthode par défaut (Java 8). Les deux trient **sur place** : aucune des deux ne renvoie une nouvelle liste.

### Exemple 4 — Recherche : linéaire vs binaire

```java
List<Integer> ids = new ArrayList<>(List.of(3, 47, 12, 8));

ids.contains(12);   // true, O(n) : parcourt jusqu'à trouver
ids.indexOf(12);    // 2, même coût

Collections.sort(ids);                              // tri préalable obligatoire : [3, 8, 12, 47]
int position = Collections.binarySearch(ids, 12);   // 2, en O(log n)
```

Appeler `binarySearch` sur une collection **non triée** ne lève pas d'exception mais renvoie un résultat **non spécifié** — un bug silencieux difficile à détecter.

### Utilitaires courants de Collections et Arrays

| Besoin | `Collections` (pour `List`/`Set`/`Map`) | `Arrays` (pour un tableau) |
|---|---|---|
| Trier | `Collections.sort(liste)` | `Arrays.sort(tableau)` |
| Rechercher (trié) | `Collections.binarySearch(liste, valeur)` | `Arrays.binarySearch(tableau, valeur)` |
| Min / max | `Collections.max(liste)` / `min(liste)` | — (utiliser un stream) |
| Inverser | `Collections.reverse(liste)` | — |
| Liste vide/singleton immuables | `Collections.emptyList()`, `Collections.singletonList(v)` | — |
| Copier | — | `Arrays.copyOf(tab, n)` |
| Vue liste sur un tableau | `new ArrayList<>(Arrays.asList(tab))` (copie modifiable) | `Arrays.asList(tab)` (vue taille fixe) |

### Pièges courants

> **Supprimer un élément avec `liste.remove(x)` dans un for-each.** Provoque `ConcurrentModificationException`. Utiliser `Iterator.remove()` (dans une boucle `while (it.hasNext())`) ou, plus simplement, `liste.removeIf(predicat)`.

> **Appeler `binarySearch` sur une collection non triée.** Aucune exception n'est levée, mais le résultat est indéterminé (« if the list is not sorted, the results are undefined »). Toujours trier avec le même ordre que celui utilisé pour la recherche avant d'appeler `binarySearch`.

> **Modifier ou agrandir la liste renvoyée par `Arrays.asList`.** Elle est adossée au tableau d'origine : `set(i, v)` fonctionne (et modifie le tableau), mais `add`/`remove` lèvent `UnsupportedOperationException` (« liste de taille fixe »). Pour une liste réellement modifiable : `new ArrayList<>(Arrays.asList(tableau))`.

### À retenir

- Le for-each s'appuie sur un `Iterator` ; modifier la collection autrement que via cet itérateur pendant un parcours lève `ConcurrentModificationException`.
- Suppression sûre pendant un parcours : `Iterator.remove()` ou `removeIf(predicat)`.
- `Comparator.comparing().thenComparing().reversed()` compose des critères de tri sans toucher à la classe triée ; `Comparable`/`compareTo` définit l'ordre naturel dans la classe elle-même.
- `List.sort(comparator)` et `Collections.sort(liste)` trient **sur place** ; `binarySearch` exige une collection déjà triée, sous peine de résultat indéfini.
- `Arrays.asList(tableau)` renvoie une vue de taille fixe, pas une copie modifiable.
