---
id: parametres-requete
chapitre: api-rest
ordre: 2
titre: "Lire la requête : @PathVariable, @RequestParam, @RequestBody"
termes:
  - terme: "@PathVariable"
    definition: "Récupère une portion de l'**URL** déclarée entre accolades dans le mapping, par exemple `{id}` dans `/produits/{id}`. Utilisé pour identifier une ressource précise."
  - terme: "@RequestParam"
    definition: "Récupère un paramètre de la **chaîne de requête** (`?page=2&taille=20`) ou d'un formulaire. Sert au filtrage, à la pagination, au tri : ce qui n'identifie pas une ressource unique."
  - terme: "@RequestBody"
    definition: "Désérialise le **corps** de la requête (généralement du JSON) vers un objet Java ou un record. Utilisé avec `POST`, `PUT`, `PATCH`."
  - terme: "@RequestHeader"
    definition: "Récupère un en-tête HTTP de la requête, par exemple `@RequestHeader(\"Authorization\") String token`."
  - terme: "required et defaultValue"
    definition: "Attributs de `@RequestParam` (et `@RequestHeader`) : `required = false` rend le paramètre optionnel (il devient `null`, ou vaut le type par défaut), `defaultValue = \"...\"` fournit une valeur si le paramètre est absent (implique `required = false`)."
  - terme: DTO
    definition: "*Data Transfer Object* : un objet dédié au transport des données entre le client et l'API, distinct de l'entité JPA. Un **record** convient bien : immuable, concis, avec `equals`/`hashCode`/`toString` générés."
  - terme: HttpMessageNotReadableException
    definition: "Erreur levée quand Spring ne parvient pas à désérialiser le corps de la requête en objet Java (JSON absent, malformé, ou type incompatible). Traduite en réponse **400 Bad Request**."
quiz:
  - question: "Quelle annotation utiliser pour chaque paramètre dans `GET /produits/42?devise=EUR` ?"
    code: |
      @GetMapping("/produits/{id}")
      public Produit get(/* id */ Long id, /* devise */ String devise) { ... }
    choix:
      - "`@RequestParam` pour `id`, `@PathVariable` pour `devise`"
      - "`@PathVariable` pour `id`, `@RequestParam` pour `devise`"
      - "`@PathVariable` pour les deux"
      - "`@RequestBody` pour `id`, `@RequestParam` pour `devise`"
    reponse: 1
    explication: "`id` fait partie du chemin de l'URL (`/produits/{id}`) : c'est un `@PathVariable`. `devise` est un paramètre de la chaîne de requête, après le `?` : c'est un `@RequestParam`. Confondre les deux provoque une erreur de démarrage ou un 400 selon le cas."
  - question: "Que se passe-t-il si le client appelle `GET /produits?page=abc` avec ce contrôleur ?"
    code: |
      @GetMapping("/produits")
      public List<Produit> lister(@RequestParam(defaultValue = "0") int page) {
          return service.lister(page);
      }
    choix:
      - "`page` vaut 0, la valeur par défaut"
      - "Réponse 400 : `MethodArgumentTypeMismatchException`, `abc` n'est pas convertible en `int`"
      - "`page` vaut `null`"
      - "L'application ne démarre pas"
    reponse: 1
    explication: "`defaultValue` s'applique seulement quand le paramètre est **absent**. Ici il est présent mais avec une valeur non convertible en `int` : Spring lève une `MethodArgumentTypeMismatchException`, traduite en réponse 400 par le gestionnaire d'erreurs par défaut."
  - question: "Le client envoie un corps JSON `{\"nom\": \"Clavier\"}` (sans le champ `prix`) sur ce endpoint. Que reçoit la méthode ?"
    code: |
      public record ProduitDto(String nom, double prix) { }

      @PostMapping("/produits")
      public ProduitDto creer(@RequestBody ProduitDto dto) {
          return dto;
      }
    choix:
      - "Une erreur 400 : le champ `prix` est obligatoire"
      - "`dto` avec `nom = \"Clavier\"` et `prix = 0.0`, la valeur par défaut du type primitif"
      - "`dto` vaut `null`"
      - "Une `HttpMessageNotReadableException` systématique dès qu'un champ manque"
    reponse: 1
    explication: "Jackson désérialise ce qui est présent dans le JSON et laisse la valeur par défaut du type Java pour ce qui manque : `0.0` pour un `double` primitif, `null` pour un type objet (`Double`, `String`…). Sans validation (`@Valid` + `@NotNull`), un champ absent ne provoque **pas** d'erreur à ce stade — voir la leçon sur la validation."
---

## Essentiel

Trois annotations couvrent l'essentiel de la lecture d'une requête HTTP :

```java
@RestController
@RequestMapping("/produits")
public class ProduitController {

    // /produits/42 → id vient du chemin
    @GetMapping("/{id}")
    public Produit get(@PathVariable Long id) { ... }

    // /produits?categorie=informatique&page=0 → paramètres de requête
    @GetMapping
    public List<Produit> lister(
            @RequestParam(required = false) String categorie,
            @RequestParam(defaultValue = "0") int page) { ... }

    // Corps JSON désérialisé en objet
    @PostMapping
    public Produit creer(@RequestBody ProduitDto dto) { ... }
}

public record ProduitDto(String nom, double prix) { }
```

`@PathVariable` lit une portion de l'**URL** (identifie une ressource précise). `@RequestParam` lit un paramètre de la **chaîne de requête** après le `?` (filtrage, pagination, tri). `@RequestBody` désérialise le **corps** de la requête (JSON → objet Java) avec Jackson. `@RequestHeader` lit un en-tête HTTP.

Spring convertit automatiquement les types simples (`Long`, `int`, `boolean`…). En cas d'échec — paramètre requis absent, type invalide, JSON illisible — la réponse est un **400 Bad Request** géré par défaut par Spring Boot.

## Détail

### Exemple 1 — Types et conversion automatique

```java
@GetMapping("/produits/{id}")
public Produit get(@PathVariable Long id) { ... } // "42" → 42L

@GetMapping("/produits")
public List<Produit> lister(@RequestParam boolean disponible) { ... } // "true" → true
```

Spring convertit la chaîne brute de l'URL vers le type Java déclaré (`Long`, `int`, `boolean`, `LocalDate`…) grâce à son système de conversion interne. Si la conversion échoue, la requête n'atteint jamais le corps de la méthode.

### Exemple 2 — `required` et `defaultValue`

```java
@GetMapping("/produits")
public List<Produit> lister(
        @RequestParam(required = false) String categorie,   // null si absent
        @RequestParam(defaultValue = "20") int taille,       // 20 si absent
        @RequestParam(name = "q", required = false) String recherche) {
    ...
}
```

Par défaut, `@RequestParam` est **obligatoire** : son absence provoque une erreur 400. `required = false` le rend optionnel (valeur `null`, ou le défaut du type primitif). `defaultValue` implique `required = false` et fournit une valeur de repli. `name` renomme le paramètre attendu si le nom Java diffère.

### Exemple 3 — DTO en record pour le corps de la requête

```java
public record CreationProduitDto(String nom, double prix, String categorie) { }

@PostMapping("/produits")
public ResponseEntity<Produit> creer(@RequestBody CreationProduitDto dto) {
    Produit produit = service.creer(dto.nom(), dto.prix(), dto.categorie());
    return ResponseEntity.ok(produit);
}
```

Un record est idéal comme DTO d'entrée : immuable, sans setter, et Jackson sait le désérialiser nativement (il utilise le constructeur canonique). On évite ainsi d'exposer l'entité JPA directement dans l'API.

### Exemple 4 — En-têtes HTTP

```java
@GetMapping("/produits")
public List<Produit> lister(@RequestHeader(value = "Accept-Language", defaultValue = "fr") String langue) {
    ...
}

@PostMapping("/produits")
public Produit creer(@RequestHeader("Authorization") String token, @RequestBody CreationProduitDto dto) {
    ...
}
```

`@RequestHeader` fonctionne comme `@RequestParam` : `required`, `defaultValue`, conversion de type.

### Les trois erreurs 400 les plus courantes

| Situation | Exception levée |
|---|---|
| `@RequestParam` obligatoire absent de l'URL | `MissingServletRequestParameterException` |
| Paramètre présent mais de type incompatible (`page=abc` pour un `int`) | `MethodArgumentTypeMismatchException` |
| Corps JSON absent, malformé, ou de structure incompatible | `HttpMessageNotReadableException` |

Ces trois exceptions sont traduites en **400 Bad Request** par le gestionnaire d'erreurs par défaut de Spring Boot. La leçon sur la gestion des erreurs montre comment personnaliser cette réponse.

### Pièges courants

> **Confondre `@PathVariable` et `@RequestParam`.** `/produits/{id}` attend `@PathVariable`, pas `@RequestParam` : ce dernier chercherait un paramètre `?id=...` qui n'existe pas dans cette URL, et provoquerait une erreur 400 si aucune valeur par défaut n'est fournie.

> **Oublier que `@RequestParam` est obligatoire par défaut.** Un appel sans le paramètre échoue avec *« Required request parameter 'page' for method parameter type int is not present »*. Ajoutez `required = false` ou `defaultValue` pour les paramètres optionnels.

> **Un champ manquant dans le JSON n'est pas une erreur en soi.** `@RequestBody` désérialise ce qui est présent ; un champ absent devient `null` (type objet) ou la valeur par défaut (type primitif), sans exception. Pour l'interdire, il faut la validation (`@Valid` + `@NotNull`/`@NotBlank`), voir la leçon dédiée.

### À retenir

- `@PathVariable` → identité dans l'URL ; `@RequestParam` → filtrage/pagination dans la chaîne de requête ; `@RequestBody` → corps JSON désérialisé.
- `@RequestParam` est obligatoire par défaut ; `required = false` et `defaultValue` le rendent optionnel.
- Un DTO en record est le format naturel pour le corps d'une requête entrante.
- Paramètre manquant, type invalide ou JSON illisible → 400, sans code à écrire (comportement par défaut de Spring Boot).
