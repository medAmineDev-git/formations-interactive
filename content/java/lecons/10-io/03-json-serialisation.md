---
id: json-serialisation
chapitre: io-fichiers
ordre: 3
titre: "JSON et sérialisation"
termes:
  - terme: ObjectMapper
    definition: "Classe centrale de la bibliothèque Jackson, point d'entrée pour convertir des objets Java en JSON (`writeValue`, `writeValueAsString`) et inversement (`readValue`). Une même instance est thread-safe et coûteuse à créer : on en garde une seule, partagée, par application."
  - terme: TypeReference
    definition: "Classe utilitaire de Jackson à sous-classer en anonyme (`new TypeReference<List<Produit>>() {}`) pour indiquer à `readValue` un type générique précis, que l'effacement de type empêcherait sinon de connaître à l'exécution."
  - terme: JavaTimeModule
    definition: "Module Jackson (dépendance `jackson-datatype-jsr310`) qui apprend à `ObjectMapper` à sérialiser et désérialiser les types de `java.time` (`LocalDate`, `Instant`...). Sans lui, ces types ne sont pas correctement pris en charge."
  - terme: Serializable
    definition: "Interface marqueur (aucune méthode) de `java.io` : l'implémenter autorise une classe à être convertie en flux d'octets par `ObjectOutputStream`, puis reconstruite par `ObjectInputStream`. Mécanisme natif de sérialisation binaire du JDK, distinct du JSON."
  - terme: serialVersionUID
    definition: "Champ `static final long` qu'une classe `Serializable` déclare explicitement pour contrôler la compatibilité entre versions : une désérialisation échoue si l'UID du flux ne correspond pas à celui de la classe chargée, plutôt que de tenter une correspondance approximative."
  - terme: transient
    definition: "Modificateur qui exclut un champ de la sérialisation Java native (`Serializable`). Le champ redevient à sa valeur par défaut (`null`, `0`, `false`...) après désérialisation, au lieu d'être reconstruit depuis le flux."
  - terme: ObjectInputFilter
    definition: "Mécanisme (JEP 290, renforcé par JEP 415) permettant de restreindre les classes qu'un `ObjectInputStream` accepte de reconstruire, pour limiter le risque d'exécution de code arbitraire lors de la désérialisation de données non fiables."
quiz:
  - question: "Que se passe-t-il si on désérialise ce JSON avec `new ObjectMapper().readValue(json, Produit.class)`, sans configuration supplémentaire ?"
    code: |
      record Produit(String nom, double prix, java.time.LocalDate dateAjout) {}
      // json = {"nom":"Clavier","prix":49.9,"dateAjout":"2026-01-15"}
    choix:
      - "Une exception est levée : sans `JavaTimeModule` enregistré, Jackson ne sait pas désérialiser un `LocalDate`"
      - "`dateAjout` vaut simplement `null`, le reste de l'objet est construit normalement"
      - "Le mapping fonctionne intégralement, Jackson gère `java.time` nativement sans aucun module"
      - "Une erreur de compilation, les records ne peuvent pas être désérialisés par Jackson"
    reponse: 0
    explication: "Jackson ne prend pas en charge `java.time` par défaut : il faut ajouter la dépendance `jackson-datatype-jsr310` et enregistrer `new JavaTimeModule()` sur l'`ObjectMapper` (ou utiliser `findAndRegisterModules()`). Les records, eux, sont pris en charge nativement depuis Jackson 2.12, sans configuration ni annotation particulière tant que le constructeur canonique est le seul constructeur."
  - question: "Pourquoi la sérialisation Java native (`Serializable`) est-elle déconseillée pour lire des données reçues d'une source externe non fiable ?"
    choix:
      - "Parce que `readObject` peut être amené à instancier et initialiser des classes arbitraires présentes sur le classpath, ce qui peut être détourné pour exécuter du code non voulu"
      - "Parce que `Serializable` ne fonctionne qu'avec des types primitifs"
      - "Parce que le format binaire de `Serializable` est plus lent à parser que le JSON, sans autre inconvénient"
      - "Parce que `Serializable` a été formellement supprimée du JDK et ne compile plus"
    reponse: 0
    explication: "`Serializable` n'a pas été retirée du JDK et reste utilisable. Le risque est réel : désérialiser un flux non fiable peut déclencher l'instanciation de classes du classpath dans un ordre choisi par l'attaquant (« gadget chains »), menant potentiellement à l'exécution de code arbitraire. Le JDK propose des filtres (`ObjectInputFilter`, JEP 290 et JEP 415) pour restreindre les classes acceptées, mais pour tout nouveau code, un format comme JSON évite structurellement ce risque."
  - question: "À quoi sert `TypeReference` avec `ObjectMapper.readValue` ?"
    code: |
      List<Produit> produits = mapper.readValue(json, new TypeReference<List<Produit>>() {});
    choix:
      - "À contourner l'effacement de type (type erasure) pour indiquer à Jackson le type générique complet à reconstruire"
      - "À valider le JSON contre un schéma avant de le désérialiser"
      - "À accélérer la désérialisation en évitant la réflexion"
      - "Elle n'est nécessaire que pour désérialiser des tableaux, jamais des `List`"
    reponse: 0
    explication: "À l'exécution, un simple `List.class` ne porte plus l'information du type des éléments (effacement de type). `TypeReference`, sous-classée en anonyme, conserve cette information générique via son type parent, ce qui permet à Jackson de savoir qu'il doit produire une `List<Produit>` et non une simple `List<Object>` (ou `List<LinkedHashMap>`)."
---

## Essentiel

Pour lire et écrire du JSON, la bibliothèque **Jackson** (`com.fasterxml.jackson`) est le standard de fait dans l'écosystème Java. Tout passe par un `ObjectMapper`, à créer une seule fois et à réutiliser :

```java
ObjectMapper mapper = new ObjectMapper();

Produit produit = mapper.readValue(json, Produit.class);   // JSON -> objet
String json2 = mapper.writeValueAsString(produit);          // objet -> JSON
mapper.writeValue(cheminExport.toFile(), produit);           // objet -> fichier JSON
```

Un **record** se mappe nativement, sans annotation, tant que son constructeur canonique est le seul constructeur :

```java
record Produit(String nom, double prix, int quantiteStock) {}
```

Pour un type générique (`List<Produit>`), `readValue` a besoin d'une indication supplémentaire via `TypeReference`, car l'effacement de type ne laisse rien à l'exécution :

```java
List<Produit> produits = mapper.readValue(json, new TypeReference<List<Produit>>() {});
```

Le JDK possède aussi un mécanisme de sérialisation **natif** et bien plus ancien : `Serializable`, `ObjectOutputStream`/`ObjectInputStream`. Il n'a jamais été supprimé, mais désérialiser des données **non fiables** avec ce mécanisme est un risque de sécurité reconnu : le flux peut forcer l'instanciation de classes arbitraires du classpath. En 2026, pour persister ou échanger des données, JSON (ou un format binaire à schéma explicite comme Protobuf) est le choix par défaut ; la sérialisation Java native se réserve à des cas internes étroits, encadrés par des filtres.

## Détail

### Exemple 1 — Mapper vers un record, avec des types imbriqués

```java
record Adresse(String rue, String ville, String codePostal) {}
record Client(String nom, Adresse adresse, List<String> emails) {}

String json = """
    {"nom":"Dupont","adresse":{"rue":"1 rue des Lilas","ville":"Lyon","codePostal":"69000"},
     "emails":["dupont@mail.fr"]}
    """;

Client client = mapper.readValue(json, Client.class);
```

Jackson reconstruit récursivement les objets imbriqués et les collections (`List`, `Map`) à partir des noms de champs, sans code de mapping manuel.

### Exemple 2 — Annotations utiles

```java
public class Commande {

    @JsonProperty("id_commande")
    private final String id;

    @JsonIgnore
    private final String commentaireInterne;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private final LocalDate dateCommande;

    @JsonCreator
    public Commande(@JsonProperty("id_commande") String id,
                     @JsonProperty("dateCommande") LocalDate dateCommande) {
        this.id = id;
        this.dateCommande = dateCommande;
        this.commentaireInterne = null;
    }
}
```

`@JsonProperty` renomme un champ côté JSON, `@JsonIgnore` l'exclut totalement, `@JsonFormat` contrôle le format d'une date. `@JsonCreator` (avec `@JsonProperty` sur chaque paramètre) précise quel constructeur utiliser quand la classe en a plusieurs — pour un record à constructeur canonique unique, ce n'est généralement pas nécessaire.

### Exemple 3 — Les types `java.time` avec `JavaTimeModule`

```java
ObjectMapper mapper = JsonMapper.builder()
    .addModule(new JavaTimeModule())
    .build();

record Produit(String nom, LocalDate dateAjout) {}

String json = mapper.writeValueAsString(new Produit("Clavier", LocalDate.of(2026, 1, 15)));
// {"nom":"Clavier","dateAjout":[2026,1,15]}  par défaut, sous forme de tableau
```

Sans configuration, `JavaTimeModule` sérialise une date sous forme de tableau de composants plutôt qu'en chaîne ISO. Pour obtenir `"2026-01-15"`, il faut désactiver l'écriture des dates comme timestamps :

```java
mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
```

### Exemple 4 — Sérialisation Java native et ses garde-fous

```java
public class Panier implements Serializable {

    private static final long serialVersionUID = 1L;

    private final List<String> articles;
    private transient String sessionTemporaire; // exclu du flux sérialisé

    public Panier(List<String> articles) {
        this.articles = articles;
    }
}

try (ObjectOutputStream sortie = new ObjectOutputStream(Files.newOutputStream(chemin))) {
    sortie.writeObject(panier);
}

try (ObjectInputStream entree = new ObjectInputStream(Files.newInputStream(chemin))) {
    entree.setObjectInputFilter(info ->
        info.serialClass() == Panier.class ? ObjectInputFilter.Status.ALLOWED
                                            : ObjectInputFilter.Status.REJECTED);
    Panier restaure = (Panier) entree.readObject();
}
```

`serialVersionUID` fige un identifiant de version explicite : sans lui, le compilateur en génère un dépendant des détails de la classe, ce qui fragilise la compatibilité entre versions compilées séparément. `transient` exclut un champ (ici une donnée non pertinente à restaurer). `setObjectInputFilter` (JEP 290) restreint explicitement les classes que ce flux accepte de reconstruire — une précaution qui devient nécessaire dès que le flux peut provenir d'une source qu'on ne maîtrise pas entièrement.

### JSON vs sérialisation Java native

| | JSON (Jackson) | Sérialisation Java native (`Serializable`) |
|---|---|---|
| Lisible par un humain | Oui | Non (binaire) |
| Interopérable (autre langage, autre service) | Oui | Non — spécifique à la JVM |
| Risque sur des données non fiables | Limité par construction (pas d'exécution de code par simple parsing) | Réel : nécessite des filtres (`ObjectInputFilter`) pour être utilisé prudemment |
| Statut officiel en 2026 | Standard de facto pour l'échange de données | Pas supprimée du JDK, mais déconseillée pour tout nouveau code face à des données non fiables |
| Configuration nécessaire | Modules pour certains types (`java.time`) | `serialVersionUID` à gérer manuellement, `transient` pour exclure des champs |

### Pièges courants

> **Désérialiser un flux `ObjectInputStream` dont l'origine n'est pas totalement fiable, sans filtre.** C'est le risque de sécurité le plus documenté autour de `Serializable` : un flux conçu par un attaquant peut forcer l'instanciation de classes présentes sur le classpath. Ce chapitre pose la notion ; la validation des entrées et les risques de désérialisation sont approfondis dans le chapitre *Sécurité et robustesse*.

> **Oublier `TypeReference` pour une collection générique.** `mapper.readValue(json, List.class)` compile, mais produit une `List` d'objets bruts (`LinkedHashMap`), pas une `List<Produit>` typée — l'effacement de type empêche Jackson de deviner le type des éléments sans indication explicite.

> **Ne pas déclarer `serialVersionUID`.** Sans ce champ explicite, le compilateur en calcule un à partir des détails de la classe (méthodes, champs...). Une modification anodine du code (ajout d'une méthode, par exemple) peut alors changer cet UID généré et rendre incompatibles des objets sérialisés avec une version antérieure de la classe.

### À retenir

- `ObjectMapper` (Jackson) est le point d'entrée JSON : `readValue` pour lire, `writeValue`/`writeValueAsString` pour écrire ; une seule instance partagée suffit.
- Les records se mappent nativement depuis Jackson 2.12, sans annotation, tant qu'ils n'ont qu'un seul constructeur.
- `TypeReference` est nécessaire pour désérialiser un type générique, à cause de l'effacement de type.
- `java.time` nécessite `JavaTimeModule` (`jackson-datatype-jsr310`), sinon les dates ne sont pas correctement prises en charge.
- La sérialisation Java native n'a pas été retirée du JDK, mais elle est déconseillée pour des données non fiables ; en 2026, JSON (ou un format à schéma explicite) est le choix par défaut pour persister ou échanger des données — voir le chapitre *Sécurité et robustesse* pour les risques de désérialisation.
