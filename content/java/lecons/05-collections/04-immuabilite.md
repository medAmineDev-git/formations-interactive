---
id: immuabilite
chapitre: collections
ordre: 4
titre: "Collections immuables et défensives"
termes:
  - terme: "List.of / Set.of / Map.of"
    definition: "Fabriques (Java 9+) qui créent une collection **immuable** à partir des valeurs données. N'acceptent **aucun `null`** (`NullPointerException`) ; `Set.of`/`Map.of` refusent aussi les doublons/clés dupliquées (`IllegalArgumentException`)."
  - terme: Vue non modifiable
    definition: "Objet renvoyé par `Collections.unmodifiableList` (et équivalents) qui **interdit la modification par son propre biais**, mais reste adossé à la collection d'origine : toute modification de celle-ci reste visible à travers la vue. Ce n'est **pas** une copie."
  - terme: "List.copyOf"
    definition: "Crée une **vraie copie immuable** du contenu d'une collection (Java 10+) : contrairement à `unmodifiableList`, elle n'est plus liée à la collection source, dont les modifications ultérieures ne se répercutent pas. Lève `NullPointerException` si la source ou un élément est `null`."
  - terme: Immuabilité superficielle
    definition: "Une collection immuable interdit d'ajouter, retirer ou remplacer des éléments — mais **n'empêche pas de modifier les éléments eux-mêmes** s'ils sont mutables. `List.of(new int[]{1})` reste une liste immuable d'un tableau, dont le contenu peut, lui, changer."
  - terme: Copie défensive
    definition: "Copie d'une collection effectuée **avant de l'exposer** (en retour de méthode) ou **avant de la stocker** (reçue en paramètre), pour empêcher tout code extérieur de modifier l'état interne d'un objet sans passer par ses méthodes."
  - terme: UnsupportedOperationException
    definition: "Exception levée par toute tentative de modification (`add`, `remove`, `set`, `clear`…) sur une collection immuable ou une vue non modifiable. Elle ne précise pas toujours pourquoi l'opération est refusée : vérifier l'origine de la collection."
quiz:
  - question: "Que lève ce code ?"
    code: |
      List<String> categories = List.of("Informatique", "Jardin", null);
    choix:
      - "Rien, la liste contient trois éléments dont un null"
      - "NullPointerException, dès la création de la liste"
      - "IllegalArgumentException"
      - "UnsupportedOperationException"
    reponse: 1
    explication: "List.of (comme Set.of et Map.of) refuse tout élément null et lève NullPointerException immédiatement à la construction, pas seulement à l'usage. Contrairement à ArrayList, qui accepte les null sans problème."
  - question: "Après ce code, que vaut vue.size() ?"
    code: |
      List<String> panier = new ArrayList<>(List.of("Clavier"));
      List<String> vue = Collections.unmodifiableList(panier);
      panier.add("Souris");
      System.out.println(vue.size());
    choix:
      - "1 : la vue a été créée avant l'ajout"
      - "2 : la vue reste adossée à la liste d'origine et reflète ses changements"
      - "UnsupportedOperationException à la lecture de vue.size()"
      - "Une ConcurrentModificationException"
    reponse: 1
    explication: "Collections.unmodifiableList ne fait pas de copie : c'est une vue en lecture seule sur la liste d'origine. Modifier panier directement reste possible et se répercute immédiatement sur vue. Seules les tentatives de modification via vue elle-même (vue.add(...)) lèvent UnsupportedOperationException."
  - question: "Ce service expose sa liste interne d'articles. Quel est le risque ?"
    code: |
      public class Panier {
          private final List<String> articles = new ArrayList<>();

          public List<String> getArticles() {
              return articles;
          }
      }
    choix:
      - "Aucun risque, List est déjà en lecture seule par défaut"
      - "Le code appelant peut modifier panier.getArticles().add(\"Souris\") et changer l'état interne du Panier sans passer par ses méthodes"
      - "Une NullPointerException est levée au premier appel de getArticles()"
      - "Le code ne compile pas : il faut renvoyer une copie explicitement"
    reponse: 1
    explication: "getArticles() renvoie la référence directe vers la liste interne : tout appelant peut la modifier (add, remove, clear) sans que Panier ne le sache ni ne le contrôle. Il faut renvoyer une copie défensive, par exemple List.copyOf(articles) ou Collections.unmodifiableList(articles)."
---

## Essentiel

Depuis **Java 9**, `List.of(...)`, `Set.of(...)` et `Map.of(...)` créent des collections **immuables** : impossible d'ajouter, de retirer ou de remplacer un élément après coup.

```java
List<String> categories = List.of("Informatique", "Jardin", "Sport");
categories.add("Bricolage"); // UnsupportedOperationException
```

Contraintes propres à ces fabriques : **aucun `null`** n'est accepté (`NullPointerException` à la création), et `Set.of`/`Map.of` refusent les doublons/clés dupliquées (`IllegalArgumentException`).

Deux autres façons d'obtenir une collection en lecture seule, à ne pas confondre :

```java
List<String> vue = Collections.unmodifiableList(panier); // VUE : reflète les changements de panier
List<String> copie = List.copyOf(panier);                 // COPIE : indépendante de panier
```

`unmodifiableList` empêche seulement de modifier **par son propre biais** ; la collection d'origine, elle, reste modifiable et ses changements se répercutent sur la vue. `List.copyOf` fige réellement le contenu au moment de l'appel.

L'immuabilité est **superficielle** : elle porte sur la structure (impossible d'ajouter/retirer), pas sur les éléments eux-mêmes s'ils sont mutables.

## Détail

### Pourquoi c'est utile

Une collection qu'on sait immuable peut être partagée sans précaution : pas de copie défensive à chaque passage, pas de risque qu'un autre thread la modifie pendant qu'on la lit (voir le chapitre concurrence), pas besoin de vérifier « est-ce que cette méthode va modifier ma liste ? » en la lisant. C'est aussi un signal de conception : une signature qui renvoie `List<String>` immuable documente, sans commentaire, que l'appelant ne doit pas essayer de la modifier.

### Exemple 1 — Contraintes de List.of / Set.of / Map.of

```java
List.of(1, 2, 3);                 // OK
List.of(1, null, 3);              // NullPointerException

Set.of("A", "B");                 // OK
Set.of("A", "A");                 // IllegalArgumentException : élément dupliqué

Map.of("clavier", 12, "souris", 8); // OK
Map.of("clavier", 12, "clavier", 20); // IllegalArgumentException : clé dupliquée
```

### Exemple 2 — Vue vs copie

```java
List<String> panier = new ArrayList<>(List.of("Clavier"));

List<String> vue = Collections.unmodifiableList(panier);
List<String> copie = List.copyOf(panier);

panier.add("Souris");

System.out.println(vue);   // [Clavier, Souris] — la vue reflète panier
System.out.println(copie); // [Clavier]         — la copie est figée
```

### Exemple 3 — Immuabilité superficielle

```java
List<int[]> lots = List.of(new int[]{10, 20});
// lots.add(new int[]{5});   // UnsupportedOperationException : structure immuable

lots.get(0)[0] = 999; // autorisé : on modifie le tableau, pas la liste
System.out.println(lots.get(0)[0]); // 999
```

La liste ne peut pas changer de taille ni de contenu (quels éléments elle référence), mais rien n'empêche de modifier un élément mutable qu'elle référence. Pour une immuabilité complète, il faut aussi que les éléments eux-mêmes soient immuables (records à composants immuables, `String`, types enveloppes…).

### Exemple 4 — Copie défensive à l'entrée et à la sortie

```java
public class Panier {
    private final List<String> articles;

    public Panier(List<String> articlesInitiaux) {
        this.articles = new ArrayList<>(articlesInitiaux); // copie : indépendant de la liste passée par l'appelant
    }

    public List<String> getArticles() {
        return List.copyOf(articles); // copie immuable : l'appelant ne peut pas modifier l'état interne
    }
}
```

Deux copies défensives : une à la **construction** (si l'appelant garde une référence sur `articlesInitiaux` et la modifie ensuite, `Panier` ne doit pas en être affecté), une à la **lecture** (si l'appelant modifie la liste renvoyée, `Panier` ne doit pas en être affecté non plus).

### Comparatif des façons d'obtenir une collection en lecture seule

| | `List.of(...)` | `Collections.unmodifiableList(l)` | `List.copyOf(l)` |
|---|---|---|---|
| Type de résultat | Immuable | Vue non modifiable | Copie immuable |
| Reflète les changements de la source | — (pas de source) | Oui | Non |
| Accepte `null` | Non | Selon la liste source | Non |
| Depuis | Java 9 | Java 1.2 (`unmodifiableList`) | Java 10 |

### Pièges courants

> **Croire que `Collections.unmodifiableList` protège complètement une collection.** Elle interdit seulement les modifications passant par la vue elle-même. Si le code garde une référence vers la liste d'origine (mutable), rien n'empêche de la modifier — et la vue le reflète aussitôt. Pour une vraie indépendance, utiliser `List.copyOf`.

> **Exposer directement un champ `List`/`Map`/`Set` mutable via un getter.** `return this.articles;` sans copie laisse n'importe quel appelant modifier l'état interne de l'objet, en contournant toute validation. Toujours renvoyer une copie (`List.copyOf(...)`) ou une vue non modifiable selon le besoin.

> **Oublier que `List.of` refuse `null`.** Du code qui migre d'`Arrays.asList` (qui accepte `null`) vers `List.of` peut lever une `NullPointerException` inattendue en production si une valeur `null` se glisse dans les arguments.

### À retenir

- `List.of`/`Set.of`/`Map.of` (Java 9+) créent des collections immuables, sans `null`, sans doublon pour `Set`/`Map`.
- `Collections.unmodifiableList` est une **vue** (adossée à la source, reflète ses changements) ; `List.copyOf` (Java 10+) est une **vraie copie**, indépendante.
- L'immuabilité d'une collection est **superficielle** : elle porte sur la structure, pas sur la mutabilité de ses éléments.
- Copie défensive à l'entrée (constructeur) et à la sortie (getter) d'une classe pour protéger son état interne.
- Toute tentative de modification d'une collection immuable ou d'une vue non modifiable lève `UnsupportedOperationException`.
