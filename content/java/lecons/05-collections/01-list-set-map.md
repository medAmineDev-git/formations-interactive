---
id: list-set-map
chapitre: collections
ordre: 1
titre: "List, Set et Map"
termes:
  - terme: Collection
    definition: "L'interface racine du framework des collections (hors `Map`) : elle définit les opérations communes (`add`, `remove`, `size`, `contains`, `iterator`…). `List`, `Set` et `Queue` en héritent toutes."
  - terme: List
    definition: "Collection **ordonnée** (l'ordre d'insertion est conservé) qui autorise les **doublons** et l'accès indexé (`get(int)`). Implémentations courantes : `ArrayList`, `LinkedList`."
  - terme: Set
    definition: "Collection qui n'autorise **aucun doublon** : ajouter un élément déjà présent (au sens de `equals`) est ignoré, sans erreur. `add` renvoie `false` dans ce cas."
  - terme: Map
    definition: "Structure clé → valeur, **séparée** de `Collection` (elle ne contient pas d'éléments, mais des paires). Les clés sont uniques ; chaque nouvelle valeur pour une clé existante écrase l'ancienne."
  - terme: Deque
    definition: "« Double ended queue » : file à **deux extrémités**, qui permet d'ajouter et de retirer aussi bien en tête qu'en queue. Sert à la fois de file (FIFO) et de pile (LIFO). Implémentation courante : `ArrayDeque`."
  - terme: SequencedCollection
    definition: "Interface introduite par le **JEP 431**, finalisée en **Java 21** : regroupe les collections qui ont un ordre de parcours bien défini et leur ajoute `getFirst()`, `getLast()`, `addFirst(e)`, `addLast(e)`, `removeFirst()`, `removeLast()` et `reversed()`. `List` et `Deque` l'implémentent ; `SequencedSet` et `SequencedMap` en dérivent pour `LinkedHashSet`/`TreeSet` et `LinkedHashMap`/`TreeMap`."
  - terme: "Stack (classe)"
    definition: "Classe historique (Java 1.0) qui hérite de `Vector` : toutes ses méthodes sont synchronisées (coût même en mono-thread) et elle expose aussi les méthodes de `List`, ce qui permet d'insérer au milieu d'une pile. **À éviter** : préférer `ArrayDeque` avec `push`/`pop`/`peek`."
quiz:
  - question: "Que contient cet ensemble une fois le code exécuté ?"
    code: |
      Set<String> refs = new HashSet<>();
      refs.add("A1");
      refs.add("A2");
      refs.add("A1");
      System.out.println(refs.size());
    choix:
      - "3"
      - "2"
      - "1"
      - "Une exception est levée au second ajout de \"A1\""
    reponse: 1
    explication: "Un Set n'autorise pas les doublons : le second add(\"A1\") est simplement ignoré (add renvoie false), sans erreur. La taille finale est 2 : \"A1\" et \"A2\"."
  - question: "Depuis quelle version de Java une List expose-t-elle directement getFirst() et getLast() sans passer par get(0) ou get(size() - 1) ?"
    choix:
      - "Depuis Java 8, avec l'arrivée des streams"
      - "Depuis Java 21, via les collections séquencées (JEP 431)"
      - "Depuis toujours, ce sont des méthodes historiques de List"
      - "Depuis Java 25, la dernière version LTS"
    reponse: 1
    explication: "Le JEP 431 « Sequenced Collections », finalisé en Java 21 sans passer par un cycle de preview, ajoute l'interface SequencedCollection dont List hérite : elle apporte getFirst(), getLast(), addFirst(), addLast(), removeFirst(), removeLast() et reversed()."
  - question: "Pourquoi préférer ArrayDeque à Stack pour implémenter une pile ?"
    choix:
      - "Stack ne permet pas d'empiler plus de 10 éléments"
      - "Stack est synchronisée (coût inutile en mono-thread) et hérite de Vector, ce qui permet d'insérer au milieu de la pile en cassant la discipline LIFO"
      - "ArrayDeque est la seule des deux à implémenter l'interface Queue"
      - "Stack ne peut contenir que des objets de type Object"
    reponse: 1
    explication: "Stack est une classe historique héritant de Vector : ses méthodes sont toutes synchronisées, même en dehors de tout contexte concurrent, et elle expose les méthodes de List (add(int, E)...), ce qui permet de rompre l'ordre LIFO attendu d'une pile. ArrayDeque, via push()/pop()/peek(), offre une pile plus rapide et plus sûre."
---

## Essentiel

Le framework des collections repose sur quelques interfaces à bien distinguer :

- **`List`** : ordonnée, doublons autorisés, accès par index.
- **`Set`** : pas de doublons, ordre selon l'implémentation.
- **`Queue`** / **`Deque`** : file (FIFO) ou file à deux extrémités (FIFO **et** LIFO).
- **`Map`** : à part — associe des **clés uniques** à des valeurs, ne contient pas d'« éléments » au sens de `Collection`.

```java
List<String> panier = new ArrayList<>();
panier.add("Clavier");
panier.add("Clavier"); // doublon accepté

Set<String> categories = new HashSet<>();
categories.add("Informatique");
categories.add("Informatique"); // ignoré, déjà présent

Map<String, Integer> stock = new HashMap<>();
stock.put("Clavier", 12);
stock.put("Clavier", 15); // écrase la valeur précédente (12 → 15)
```

`Map` propose des méthodes pratiques pour éviter le classique « vérifier puis agir » :

```java
int quantite = stock.getOrDefault("Souris", 0);              // 0 si absent, pas de NullPointerException
stock.computeIfAbsent("Souris", cle -> 0);                    // initialise seulement si absent
stock.merge("Clavier", 3, Integer::sum);                      // additionne à la valeur existante (ou l'insère)
for (Map.Entry<String, Integer> entree : stock.entrySet()) {  // parcours des paires clé/valeur
    System.out.println(entree.getKey() + " : " + entree.getValue());
}
```

Depuis **Java 21** (JEP 431), les collections qui ont un ordre bien défini (`List`, `Deque`, `LinkedHashSet`, `TreeSet`, `LinkedHashMap`, `TreeMap`) implémentent des interfaces « séquencées » qui ajoutent `getFirst()`, `getLast()` et `reversed()`.

## Détail

### Comment ça marche

```
Iterable<E>
  └── Collection<E>
        ├── List<E>            (ordonnée, doublons, index)
        ├── Set<E>              (pas de doublons)
        │     └── SortedSet<E> / NavigableSet<E>
        └── Queue<E>
              └── Deque<E>      (deux extrémités : file ET pile)

Map<K, V>                       (séparée : pas une Collection)
        └── SortedMap<K, V> / NavigableMap<K, V>
```

`Map` n'étend pas `Collection` : elle ne contient pas des éléments isolés, mais des **paires** clé-valeur. Pour la parcourir comme une collection, on passe par `keySet()`, `values()` ou `entrySet()`.

### Exemple 1 — Queue et Deque comme file d'attente

```java
Queue<String> commandesEnAttente = new ArrayDeque<>();
commandesEnAttente.offer("CMD-1"); // ajoute en fin de file
commandesEnAttente.offer("CMD-2");
String prochaine = commandesEnAttente.poll(); // retire et renvoie la tête : "CMD-1"
String suivante = commandesEnAttente.peek();  // consulte la tête sans la retirer : "CMD-2"
```

`ArrayDeque` est l'implémentation recommandée de `Queue` en usage général : plus rapide que `LinkedList` et sans les surcoûts d'une liste chaînée.

### Exemple 2 — Deque comme pile (LIFO)

```java
Deque<String> pilesActions = new ArrayDeque<>();
pilesActions.push("ajout-panier");   // empile
pilesActions.push("application-code-promo");
String derniereAction = pilesActions.pop(); // dépile : "application-code-promo"
```

`push`/`pop`/`peek` sur un `Deque` implémentent une pile classique — c'est le remplaçant recommandé de la classe `Stack`.

### Exemple 3 — Collections séquencées (Java 21+)

```java
List<String> categories = new ArrayList<>(List.of("Informatique", "Jardin", "Sport"));

String premiere = categories.getFirst(); // "Informatique" — sans get(0)
String derniere = categories.getLast();  // "Sport" — sans get(size() - 1)

List<String> inversee = categories.reversed(); // vue inversée, pas une copie
System.out.println(inversee); // [Sport, Jardin, Informatique]
```

`reversed()` renvoie une **vue** : elle reflète les modifications faites sur la collection d'origine (et réciproquement), elle ne la copie pas. `HashSet` et `HashMap` n'ont **pas** d'ordre défini : ils n'implémentent pas les interfaces séquencées.

### Exemple 4 — Map : le triptyque get / getOrDefault / computeIfAbsent

```java
Map<String, List<String>> avisParProduit = new HashMap<>();

// Sans computeIfAbsent : verbeux et sujet aux bugs
List<String> avis = avisParProduit.get("Clavier");
if (avis == null) {
    avis = new ArrayList<>();
    avisParProduit.put("Clavier", avis);
}
avis.add("Très bien");

// Avec computeIfAbsent : une seule ligne, atomique dans son intention
avisParProduit.computeIfAbsent("Souris", cle -> new ArrayList<>()).add("Correct");
```

### Comparatif des grandes familles

| Interface | Doublons | Ordre | Accès par index | Clés/valeurs |
|---|---|---|---|---|
| `List` | Oui | D'insertion (conservé) | Oui (`get(i)`) | — |
| `Set` | Non | Selon l'implémentation | Non | — |
| `Queue` / `Deque` | Oui | FIFO (ou LIFO pour Deque en pile) | Non | — |
| `Map` | Clés uniques | Selon l'implémentation | Non (accès par clé) | Oui |

### Pièges courants

> **Confondre `Map` et `Collection`.** `Map` n'étend pas `Collection` : on ne peut pas écrire `for (var e : maMap)`, il faut parcourir `maMap.entrySet()`, `maMap.keySet()` ou `maMap.values()`.

> **Utiliser `Stack` par habitude.** Elle hérite de `Vector`, donc toutes ses méthodes sont synchronisées même en mono-thread, et elle laisse insérer à un index arbitraire — ce qui casse la discipline LIFO d'une pile. `ArrayDeque` (`push`/`pop`/`peek`) est plus rapide et plus sûr.

> **Croire que `Set.add` lève une exception sur un doublon.** Ce n'est pas le cas : `add` renvoie simplement `false` et l'ensemble reste inchangé. Tester la valeur de retour si le résultat de l'ajout doit être connu.

### À retenir

- `Collection` regroupe `List`, `Set`, `Queue`/`Deque` ; `Map` est séparée (paires clé-valeur, pas d'éléments isolés).
- `List` : ordonnée, doublons autorisés, index. `Set` : pas de doublons. `Map` : clés uniques.
- `Deque` sert à la fois de file (FIFO, `offer`/`poll`) et de pile (LIFO, `push`/`pop`) — `ArrayDeque` remplace avantageusement `Stack`.
- `getOrDefault`, `computeIfAbsent` et `merge` évitent le schéma « vérifier puis agir » sur une `Map`.
- Depuis **Java 21** (JEP 431), `List`, `Deque`, `LinkedHashSet`/`TreeSet` et `LinkedHashMap`/`TreeMap` offrent `getFirst()`, `getLast()` et `reversed()` — `HashSet`/`HashMap`, sans ordre défini, ne les ont pas.
