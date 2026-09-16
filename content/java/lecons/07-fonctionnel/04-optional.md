---
id: optional
chapitre: fonctionnel
ordre: 4
titre: Optional
termes:
  - terme: Optional<T>
    definition: "Conteneur qui représente explicitement l'**absence possible** d'une valeur. Contient soit une valeur non nulle, soit rien (`Optional.empty()`). Sert principalement de **type de retour** pour signaler qu'une méthode peut ne rien avoir à renvoyer."
  - terme: "Optional.of / ofNullable / empty"
    definition: "`of(valeur)` : crée un Optional garanti non vide, lève `NullPointerException` si `valeur` est `null`. `ofNullable(valeur)` : crée un Optional vide si `valeur` est `null`, rempli sinon. `empty()` : Optional vide explicite."
  - terme: orElse vs orElseGet
    definition: "`orElse(x)` **évalue toujours** `x`, même si l'Optional est rempli. `orElseGet(supplier)` n'appelle le `Supplier` que si l'Optional est vide. Pour une valeur par défaut coûteuse à calculer ou avec effet de bord, `orElseGet` évite un calcul inutile."
  - terme: "get()"
    definition: "Renvoie la valeur contenue, ou lève `NoSuchElementException` si l'Optional est vide. À éviter en usage courant : il réintroduit le risque qu'`Optional` cherche justement à éliminer si l'absence n'est pas vérifiée avant l'appel."
  - terme: map / flatMap sur Optional
    definition: "`map(fonction)` transforme la valeur contenue si présente, sans rien faire si vide. `flatMap(fonction)` fait de même mais attend une fonction qui renvoie déjà un `Optional`, pour éviter d'obtenir un `Optional<Optional<T>>`."
  - terme: Variante primitive d'Optional
    definition: "`OptionalInt`, `OptionalLong`, `OptionalDouble` : évitent l'autoboxing pour les types primitifs correspondants, produites notamment par les opérations terminales de streams comme `average()` ou `max()`."
quiz:
  - question: "Que fait ce code ?"
    code: |
      public Produit chargerDefaut() {
          System.out.println("Chargement du produit par défaut");
          return new Produit("Standard", 0.0);
      }

      Optional<Produit> trouve = Optional.of(new Produit("Clavier", 49.90));
      Produit resultat = trouve.orElse(chargerDefaut());
    choix:
      - "\"Chargement du produit par défaut\" s'affiche, alors que trouve contient déjà une valeur"
      - "chargerDefaut() n'est jamais appelée, car trouve contient déjà une valeur"
      - "Ce code ne compile pas"
      - "chargerDefaut() est appelée uniquement si trouve est vide, quelle que soit la méthode utilisée"
    reponse: 0
    explication: "`orElse(x)` évalue systématiquement son argument, avant même de savoir si l'Optional est vide ou non, car `x` est calculé comme n'importe quel argument de méthode. Le message s'affiche donc même si `trouve` contient déjà une valeur. Pour éviter cet appel inutile, `orElseGet(this::chargerDefaut)` n'invoque le fournisseur que si l'Optional est réellement vide."
  - question: "Pourquoi cette méthode est-elle considérée comme un mauvais usage d'Optional ?"
    code: |
      public class Client {
          private Optional<String> telephone;

          public Client(Optional<String> telephone) {
              this.telephone = telephone;
          }
      }
    choix:
      - "Optional n'est pas conçu pour être un type de champ ou de paramètre : il n'implémente pas Serializable et ajoute une indirection inutile là où null (ou une chaîne vide) suffit, en plus de rester lui-même potentiellement null"
      - "Optional<String> n'existe pas, il faut utiliser OptionalString"
      - "Un champ ne peut jamais être de type générique"
      - "Optional ne peut être utilisé que dans un type de retour de méthode void"
    reponse: 0
    explication: "Optional a été conçu par ses auteurs comme un type de retour, pour que l'appelant d'une méthode soit obligé de considérer l'absence de valeur. L'utiliser comme champ ou paramètre ajoute une indirection sans bénéfice : le champ Optional lui-même peut toujours être null, ce qui ne résout rien, et Optional n'est pas fait pour être sérialisé ni stocké durablement."
  - question: "Quelle est la meilleure façon de récupérer le nom en majuscules d'un produit, ou une chaîne vide s'il n'y en a pas ?"
    code: |
      Optional<Produit> produit = depot.chercherParId(id);
    choix:
      - "produit.map(Produit::nom).map(String::toUpperCase).orElse(\"\")"
      - "produit.get().nom().toUpperCase()"
      - "produit.orElse(new Produit(\"\", 0.0)).nom()"
      - "if (produit.isPresent()) { produit.get().nom().toUpperCase(); } else { \"\"; }"
    reponse: 0
    explication: "`map` transforme la valeur si elle est présente et ne fait rien si l'Optional est vide, en restant dans le style déclaratif d'Optional. `orElse(\"\")` fournit la valeur de repli à la fin. `get()` sans vérification risque une exception, et créer un Produit factice juste pour extraire son nom vide est un détour inutile."
---

## Essentiel

`Optional<T>` rend explicite qu'une méthode peut **ne rien avoir à renvoyer**, sans recourir à `null` — dont l'oubli de vérification provoque la classique `NullPointerException` loin de sa cause réelle :

```java
public Optional<Produit> chercherParId(String id) {
    Produit p = base.get(id);
    return Optional.ofNullable(p); // vide si p est null, rempli sinon
}
```

Création : `Optional.of(valeur)` (valeur garantie non nulle, sinon exception), `Optional.ofNullable(valeur)` (accepte `null`, produit un Optional vide), `Optional.empty()` (vide explicite).

Consommation sans jamais appeler `get()` à l'aveugle :

```java
Optional<Produit> produit = depot.chercherParId("p1");

String nom = produit.map(Produit::nom).orElse("Inconnu");   // transforme si présent, sinon valeur par défaut
produit.ifPresent(p -> System.out.println(p.nom()));         // effet de bord si présent
Produit p = produit.orElseThrow(() -> new ProduitIntrouvableException("p1")); // exception explicite si vide
```

`orElse(x)` évalue toujours `x`, même quand l'Optional est rempli ; `orElseGet(supplier)` n'appelle le fournisseur que si nécessaire. `Optional` est prévu comme **type de retour**, pas comme type de champ, de paramètre, ni d'élément de collection.

## Détail

### Pourquoi c'est utile

Avant `Optional`, une méthode qui pouvait ne rien trouver renvoyait `null`, à charge pour l'appelant de s'en souvenir et de le vérifier — un oubli produit une `NullPointerException` potentiellement loin de son origine réelle. `Optional` rend le cas d'absence visible dans la **signature** de la méthode : le type de retour `Optional<Produit>` signale explicitement que l'appelant doit gérer les deux cas, contrairement à `Produit` qui laisse croire qu'une valeur est toujours renvoyée.

### Exemple 1 — Création : `of`, `ofNullable`, `empty`

```java
Optional<Produit> present = Optional.of(new Produit("Clavier", 49.90)); // jamais null ici
Optional<Produit> depuisNullable = Optional.ofNullable(base.get("p1")); // base.get peut renvoyer null
Optional<Produit> vide = Optional.empty();

Optional.of(null); // lève NullPointerException immédiatement — l'échec est volontaire et explicite
```

`of` sert quand on est certain que la valeur n'est jamais `null` (échec rapide sinon) ; `ofNullable` sert à envelopper le résultat d'une API existante qui peut renvoyer `null`.

### Exemple 2 — `map`, `flatMap`, `filter`

```java
Optional<Produit> produit = depot.chercherParId("p1");

Optional<String> nomMajuscule = produit
    .map(Produit::nom)             // Optional<String>, vide si produit est vide
    .map(String::toUpperCase);

Optional<Produit> enPromoUniquement = produit
    .filter(p -> p.remise() > 0);  // devient vide si le produit n'est pas en promo

// flatMap : quand la fonction renvoie déjà un Optional
Optional<String> emailClient = depot.chercherParId("p1")
    .flatMap(Produit::acheteurOptionnel)  // suppose acheteurOptionnel(): Optional<Client>
    .map(Client::email);
```

`map` évite d'obtenir un `Optional<Optional<X>>` quand la fonction transformée renvoie déjà une valeur simple ; `flatMap` s'utilise quand la fonction transformée renvoie elle-même un `Optional`, pour aplatir le résultat.

### Exemple 3 — Sortir de l'Optional : `orElse`, `orElseGet`, `orElseThrow`

```java
Produit p1 = produit.orElse(new Produit("Standard", 0.0));           // toujours construit, même si produit est présent
Produit p2 = produit.orElseGet(() -> chargerProduitParDefaut());     // appelé seulement si produit est vide
Produit p3 = produit.orElseThrow();                                   // NoSuchElementException si vide
Produit p4 = produit.orElseThrow(() -> new ProduitIntrouvableException("p1")); // exception métier explicite
```

`orElse` convient pour une constante ou une valeur déjà calculée ; `orElseGet` convient dès que la valeur de repli demande un calcul, un appel réseau, ou toute opération qu'on ne veut pas exécuter inutilement.

### Exemple 4 — `ifPresent` et `ifPresentOrElse`

```java
produit.ifPresent(p -> journal.info("Produit trouvé : " + p.nom()));

produit.ifPresentOrElse(
    p -> journal.info("Produit trouvé : " + p.nom()),
    () -> journal.warn("Produit introuvable")
);
```

`ifPresent` exécute une action uniquement si une valeur est présente ; `ifPresentOrElse` (depuis Java 9) ajoute une action alternative pour le cas vide, évitant un `if (produit.isPresent())` explicite.

### Pourquoi éviter `get()`

```java
Produit p = produit.get(); // lève NoSuchElementException si produit est vide, sans message explicite
```

`get()` réintroduit exactement le problème qu'`Optional` cherche à éviter : appeler cette méthode sans avoir vérifié `isPresent()` juste avant revient à espérer qu'une valeur est là, comme un déréférencement de `null` non protégé. Les méthodes de consommation (`map`, `orElse`, `orElseThrow`, `ifPresent`…) couvrent la quasi-totalité des besoins sans jamais appeler `get()` directement.

### Usages prévus et déconseillés

| Usage | Recommandation |
|---|---|
| Type de retour d'une méthode qui peut ne rien trouver | **Prévu** : c'est l'usage principal d'`Optional` |
| Champ d'une classe | **Déconseillé** : le champ Optional peut lui-même être `null`, ce qui ne résout rien ; `Optional` n'est pas fait pour être un état durable |
| Paramètre de méthode | **Déconseillé** : préférer la surcharge de méthode, ou accepter `null` documenté ; `Optional` en paramètre alourdit l'appel sans bénéfice net |
| Élément d'une collection (`List<Optional<T>>`) | **Déconseillé** : une collection sait déjà représenter l'absence d'éléments ; filtrer en amont plutôt que stocker des emplacements vides |
| Retour d'une méthode censée renvoyer une collection | **Déconseillé** : renvoyer une **collection vide** (`List.of()`) plutôt qu'`Optional<List<T>>` — les collections ont déjà leur propre notion de « rien » |

### `Optional` et sérialisation

`Optional` n'implémente pas `Serializable`. Un champ de type `Optional` dans une classe sérialisable provoque une erreur à la sérialisation — c'est une des raisons concrètes, en plus de l'intention de conception, pour lesquelles `Optional` est déconseillé comme type de champ.

### Variantes primitives

```java
OptionalInt maxQuantite = produits.stream().mapToInt(Produit::quantite).max();
OptionalDouble prixMoyen = produits.stream().mapToDouble(Produit::prix).average();

int max = maxQuantite.orElse(0); // pas de map/flatMap sur ces variantes, API plus restreinte
```

`OptionalInt`, `OptionalLong`, `OptionalDouble` évitent l'autoboxing, essentiellement produites par les opérations terminales de streams primitifs (`average`, `max`, `min`, `sum` n'a pas besoin d'Optional puisqu'il renvoie 0 par défaut). Leur API est plus restreinte que celle d'`Optional<T>` : pas de `map`/`flatMap` généraux, par exemple.

### Pièges courants

> **Appeler `get()` sans vérification préalable.** `produit.get().nom()` lève `NoSuchElementException` si `produit` est vide — exactement le type de bug qu'`Optional` visait à éliminer. Préférer `map`, `orElse`, `orElseThrow` avec un message ou une exception explicite.

> **Utiliser `orElse` avec un calcul coûteux ou un effet de bord.** `optional.orElse(chargerDepuisReseau())` appelle toujours `chargerDepuisReseau()`, même si `optional` est déjà rempli, car l'argument est évalué avant l'appel de la méthode. `orElseGet(() -> chargerDepuisReseau())` corrige ce problème en ne l'appelant que si nécessaire.

> **Renvoyer `Optional<List<T>>` au lieu d'une liste vide.** Une collection vide représente déjà l'absence de résultats sans indirection supplémentaire ; envelopper une collection dans `Optional` oblige l'appelant à un double déballage (`Optional` puis liste) pour un gain nul.

### À retenir

- `Optional` sert de type de **retour** pour signaler explicitement qu'une valeur peut être absente — pas de champ, ni de paramètre, ni d'élément de collection.
- `of` échoue sur `null`, `ofNullable` l'accepte et produit un Optional vide, `empty()` crée un vide explicite.
- `orElse` évalue toujours son argument ; `orElseGet` ne l'évalue que si l'Optional est vide.
- Éviter `get()` : préférer `map`, `orElse`, `orElseThrow`, `ifPresent`, `ifPresentOrElse`.
- Pour une méthode censée renvoyer une collection, préférer une collection vide à `Optional<Collection<T>>`.
