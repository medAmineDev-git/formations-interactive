---
id: choisir-implementation
chapitre: collections
ordre: 2
titre: "Choisir la bonne implémentation"
termes:
  - terme: ArrayList
    definition: "Implémentation de `List` basée sur un **tableau redimensionnable**. Accès par index en O(1), ajout en fin en O(1) amorti, insertion/suppression ailleurs qu'en fin en O(n) (décalage des éléments). Le choix par défaut pour `List`."
  - terme: LinkedList
    definition: "Implémentation de `List` (et `Deque`) basée sur une **liste doublement chaînée**. Ajout/suppression en tête ou en queue en O(1), mais accès par index en O(n) : rarement le bon choix face à `ArrayList`."
  - terme: Table de hachage (hashing)
    definition: "Structure qui range les éléments dans des **cases** (« buckets ») déterminées par leur `hashCode()`. Elle permet de retrouver un élément en temps constant en moyenne, sans le comparer à tous les autres. `HashMap`, `HashSet`, `LinkedHashMap` et `LinkedHashSet` reposent dessus."
  - terme: "hashCode() / equals()"
    definition: "Deux méthodes liées par un contrat strict : si `a.equals(b)` est vrai, alors `a.hashCode() == b.hashCode()` **doit** être vrai. Une classe utilisée comme clé de `Map` ou élément de `Set` doit redéfinir les deux ensemble, jamais une seule."
  - terme: Facteur de charge (load factor)
    definition: "Seuil de remplissage (0.75 par défaut) au-delà duquel une table de hachage se **redimensionne** (généralement en doublant sa capacité) et redistribue tous ses éléments. Capacité initiale par défaut : 16."
  - terme: TreeMap / TreeSet
    definition: "Implémentations basées sur un **arbre rouge-noir équilibré** : les clés (ou éléments) sont toujours **triées**, et les opérations de base coûtent O(log n), garanti. Les clés/éléments doivent être `Comparable` ou fournis avec un `Comparator`."
  - terme: LinkedHashMap / LinkedHashSet
    definition: "Variantes de `HashMap`/`HashSet` qui ajoutent une **liste doublement chaînée** entre les entrées pour conserver l'ordre d'insertion (ou l'ordre d'accès, en option). Mêmes performances qu'une table de hachage classique, avec un léger surcoût mémoire."
quiz:
  - question: "Quelle structure choisir pour stocker les catégories d'un catalogue, en conservant l'ordre d'ajout et sans jamais avoir de doublon ?"
    choix:
      - "HashSet"
      - "TreeSet"
      - "LinkedHashSet"
      - "ArrayList"
    reponse: 2
    explication: "LinkedHashSet garantit l'absence de doublons (comme tout Set) tout en conservant l'ordre d'insertion, grâce à sa liste chaînée interne. HashSet ne garantit aucun ordre, TreeSet trie les éléments (pas l'ordre d'ajout), et ArrayList autoriserait les doublons."
  - question: "Que se passe-t-il si on modifie un champ utilisé par hashCode() sur une clé déjà insérée dans un HashMap ?"
    code: |
      class Reference {
          String code; // utilisé dans equals()/hashCode()
      }
      Map<Reference, Integer> stock = new HashMap<>();
      Reference r = new Reference("A1");
      stock.put(r, 10);
      r.code = "A2"; // modification après insertion
      stock.get(r);
    choix:
      - "get(r) renvoie toujours 10, sans problème"
      - "Une ConcurrentModificationException est levée"
      - "L'entrée devient introuvable par une recherche normale : elle reste dans une case de la table qui ne correspond plus à son hashCode() actuel"
      - "Le HashMap détecte le changement et redéplace automatiquement l'entrée"
    reponse: 2
    explication: "La javadoc de Map prévient que le comportement n'est pas garanti si un objet clé est modifié d'une façon qui affecte equals() après insertion. En pratique, HashMap place l'entrée selon le hashCode() au moment de put() ; la chercher plus tard recalcule un hashCode() différent et regarde dans la mauvaise case. Ne jamais utiliser comme clé un objet dont les champs pertinents peuvent changer."
  - question: "Pourquoi ArrayList est-il presque toujours préférable à LinkedList, même pour des insertions fréquentes ?"
    choix:
      - "LinkedList ne peut pas contenir plus de 1000 éléments"
      - "add(index, element) sur une LinkedList doit d'abord parcourir la liste en O(n) pour atteindre la position, l'avantage du O(1) ne joue que si on tient déjà le nœud (via un ListIterator)"
      - "ArrayList est thread-safe, contrairement à LinkedList"
      - "LinkedList ne supporte pas l'itération avec un for-each"
    reponse: 1
    explication: "L'insertion O(1) d'une LinkedList ne s'applique qu'une fois positionné sur le bon nœud ; atteindre ce nœud via add(index, ...) ou get(index) coûte O(n), comme pour ArrayList. En pratique, ArrayList est aussi plus compact en mémoire et plus rapide grâce à la localité de cache, même pour des insertions en milieu de liste."
---

## Essentiel

Le nom de l'interface (`List`, `Set`, `Map`) dit **ce qu'on peut faire** ; le choix de l'implémentation détermine **à quel coût**.

- **`ArrayList`** (tableau redimensionnable) : le choix par défaut pour `List`. Accès par index en O(1). `LinkedList` (liste chaînée) est rarement préférable : son seul vrai avantage, l'ajout/suppression en O(1) en tête ou en queue, est mieux couvert par `ArrayDeque`.
- **`HashMap`** / **`HashSet`** : les plus rapides (O(1) en moyenne), mais **aucun ordre garanti**.
- **`LinkedHashMap`** / **`LinkedHashSet`** : mêmes performances, en conservant l'**ordre d'insertion**.
- **`TreeMap`** / **`TreeSet`** : plus lentes (O(log n)), mais **toujours triées**.

```java
Map<String, Integer> stockRapide = new HashMap<>();       // pas d'ordre garanti, le plus rapide
Map<String, Integer> stockOrdonne = new LinkedHashMap<>(); // ordre d'insertion conservé
Map<String, Integer> stockTrie = new TreeMap<>();          // toujours trié par clé
```

`HashMap` et `HashSet` reposent sur une **table de hachage** : chaque clé est rangée dans une case déterminée par son `hashCode()`. Deux clés `equals` doivent obligatoirement avoir le même `hashCode()` — sinon la table ne les retrouve plus. Une classe utilisée comme clé doit donc redéfinir `equals()` **et** `hashCode()` ensemble.

## Détail

### Comment fonctionne une table de hachage

1. `put(cle, valeur)` calcule `cle.hashCode()`, le réduit à l'index d'une case du tableau interne (la **capacité**, 16 par défaut).
2. Si la case est vide, l'entrée y est stockée directement : accès en O(1).
3. Si deux clés tombent dans la même case (**collision**), elles y coexistent sous forme de petite liste chaînée (transformée en arbre rouge-noir, O(log n), si une case accumule beaucoup d'entrées — un détail d'implémentation interne à HashMap depuis Java 8, pas une garantie contractuelle).
4. Quand le nombre d'entrées dépasse `capacité × facteur de charge` (16 × 0.75 = 12 par défaut), la table est **redimensionnée** (doublée) et **toutes** les entrées sont redistribuées selon la nouvelle capacité.

Ce redimensionnement a un coût (O(n) le jour où il se produit), amorti sur l'ensemble des insertions. Connaître à l'avance le nombre d'éléments attendu et fournir une capacité initiale suffisante (`new HashMap<>(200)`) évite des redimensionnements inutiles.

### Exemple 1 — ArrayList vs LinkedList à l'usage

```java
List<String> commandesArray = new ArrayList<>();
List<String> commandesLinked = new LinkedList<>();

commandesArray.get(500);   // O(1) : calcul direct de l'adresse
commandesLinked.get(500);  // O(n) : parcours depuis le début jusqu'au 500e nœud

commandesArray.add("CMD-X");   // O(1) amorti, en fin de liste
commandesLinked.addLast("CMD-X"); // O(1), pas de décalage
```

En pratique, même pour des insertions fréquentes, `ArrayList` reste souvent plus rapide : ses données sont contiguës en mémoire (meilleure localité de cache), contrairement aux nœuds épars d'une `LinkedList`.

### Exemple 2 — HashSet, LinkedHashSet, TreeSet : même contenu, ordres différents

```java
Set<String> hash = new HashSet<>(List.of("Souris", "Clavier", "Écran"));
Set<String> linked = new LinkedHashSet<>(List.of("Souris", "Clavier", "Écran"));
Set<String> tree = new TreeSet<>(List.of("Souris", "Clavier", "Écran"));

System.out.println(hash);   // ordre non garanti, dépend du hashCode()
System.out.println(linked); // [Souris, Clavier, Écran] — ordre d'insertion
System.out.println(tree);   // [Clavier, Souris, Écran] — ordre alphabétique
```

### Exemple 3 — Redéfinir hashCode()/equals() pour une clé

```java
public record Reference(String code) { } // record : equals()/hashCode() générés automatiquement, cohérents entre eux

Map<Reference, Integer> stock = new HashMap<>();
stock.put(new Reference("A1"), 12);
stock.get(new Reference("A1")); // 12 : même code, même hashCode(), equals() vrai
```

Un `record` génère `equals()`/`hashCode()` à partir de ses composants, ce qui en fait une clé naturellement sûre — à condition que ses champs restent constants après création (voir la leçon sur les records).

### Exemple 4 — Capacité initiale pour éviter les redimensionnements

```java
// Si on sait qu'on va insérer environ 10 000 entrées :
Map<String, Integer> catalogue = new HashMap<>(16_000); // évite plusieurs redimensionnements successifs
```

Prévoir large : la capacité effective est arrondie à la puissance de 2 supérieure, et le redimensionnement se déclenche à 75 % de la capacité.

### Complexités des opérations courantes

| Opération | `ArrayList` | `LinkedList` | `HashMap`/`HashSet` | `LinkedHashMap`/`Set` | `TreeMap`/`TreeSet` |
|---|---|---|---|---|---|
| Accès par index / recherche par clé | O(1) | O(n) | O(1) en moyenne | O(1) en moyenne | O(log n) garanti |
| Ajout en fin | O(1) amorti | O(1) | O(1) en moyenne | O(1) en moyenne | O(log n) |
| Ajout/suppression en tête | O(n) | O(1) | — | — | — |
| `contains` | O(n) | O(n) | O(1) en moyenne | O(1) en moyenne | O(log n) |
| Ordre conservé | Insertion | Insertion | Aucun | Insertion | Tri |

### Pièges courants

> **Choisir `LinkedList` en pensant gagner en performance.** Son O(1) pour l'insertion ne vaut que si l'on tient déjà le nœud (via un `ListIterator`) ; `add(index, e)` doit d'abord parcourir la liste en O(n), exactement comme `ArrayList`. Pour une pile ou une file, `ArrayDeque` est presque toujours meilleur que `LinkedList`.

> **Oublier de redéfinir `hashCode()` en ne redéfinissant que `equals()` (ou l'inverse).** Le contrat impose les deux ensemble. Sans `hashCode()` cohérent, un `HashSet` peut accepter deux objets « égaux » selon `equals()` comme deux entrées distinctes : ils ne tombent simplement pas dans la même case.

> **Modifier un champ d'une clé après l'avoir insérée dans un `HashMap`/`HashSet`.** L'entrée reste physiquement dans la table, mais dans la case correspondant à l'**ancien** `hashCode()` : une recherche ultérieure avec un objet égal (nouveau `hashCode()`) ne la retrouve plus. Utiliser des clés immuables (records, `String`, types enveloppes) évite ce piège.

### À retenir

- `ArrayList` par défaut pour `List` ; `LinkedList` se justifie rarement, `ArrayDeque` couvre mieux ses cas d'usage (pile, file).
- `HashMap`/`HashSet` : le plus rapide, sans ordre garanti. `LinkedHashMap`/`LinkedHashSet` : même vitesse, ordre d'insertion conservé. `TreeMap`/`TreeSet` : trié, O(log n).
- Une table de hachage range les éléments par `hashCode()` dans des cases ; `equals()` et `hashCode()` doivent être cohérents entre eux.
- Capacité initiale (16 par défaut) et facteur de charge (0.75 par défaut) déterminent quand la table se redimensionne (coût O(n) amorti).
- Ne jamais modifier un champ utilisé par `hashCode()`/`equals()` une fois l'objet inséré comme clé ou élément d'un `Set`.
