---
id: rest-controller
chapitre: api-rest
ordre: 1
titre: "@RestController et les mappings HTTP"
termes:
  - terme: "@RestController"
    definition: "Raccourci pour `@Controller` + `@ResponseBody`. Chaque méthode renvoie directement des données (JSON, texte…) écrites dans le corps de la réponse HTTP, au lieu d'un nom de vue à afficher."
  - terme: "@RequestMapping"
    definition: "Annotation générique qui associe une classe ou une méthode à une URL. Posée sur la **classe**, elle donne le préfixe commun à toutes les méthodes du contrôleur, par exemple `@RequestMapping(\"/produits\")`."
  - terme: "@GetMapping, @PostMapping, @PutMapping, @PatchMapping, @DeleteMapping"
    definition: "Variantes spécialisées de `@RequestMapping` pour chaque verbe HTTP. Plus lisibles que `@RequestMapping(method = RequestMethod.GET)`."
  - terme: Sérialisation JSON
    definition: "La conversion automatique d'un objet Java (ou d'un record) en JSON par **Jackson**, la librairie incluse dans `spring-boot-starter-web`. Chaque propriété (getter, ou composant du record) devient un champ JSON."
  - terme: Méthode sûre (safe)
    definition: "Une méthode HTTP qui ne modifie pas l'état du serveur : `GET`. On peut l'appeler sans conséquence, la mettre en cache, la précharger."
  - terme: Méthode idempotente
    definition: "Un appel répété plusieurs fois produit le même résultat qu'un seul appel. `GET`, `PUT` et `DELETE` sont idempotents. `POST` ne l'est pas : le rappeler crée une nouvelle ressource à chaque fois. `PATCH` ne l'est pas garanti."
  - terme: Ressource REST
    definition: "L'entité manipulée par l'API, désignée par une URL et un nom au **pluriel** (`/produits`, `/produits/{id}`). Le verbe HTTP porte l'action, pas l'URL : on évite `/getProduit` ou `/creerProduit`."
quiz:
  - question: "Que renvoie ce contrôleur pour `GET /produits/1` ?"
    code: |
      @RestController
      @RequestMapping("/produits")
      public class ProduitController {

          @GetMapping("/{id}")
          public Produit get(@PathVariable Long id) {
              return new Produit(id, "Clavier", 49.90);
          }
      }

      public record Produit(Long id, String nom, double prix) { }
    choix:
      - "Une page HTML affichant le produit"
      - "Le JSON `{\"id\":1,\"nom\":\"Clavier\",\"prix\":49.9}`, écrit automatiquement dans le corps de la réponse"
      - "Une erreur, car il manque `@ResponseBody`"
      - "Le nom d'une vue « produit »"
    reponse: 1
    explication: "`@RestController` inclut `@ResponseBody` : l'objet retourné est sérialisé en JSON par Jackson et écrit directement dans le corps de la réponse, avec un `Content-Type: application/json`. Sans `@RestController` (avec un simple `@Controller`), Spring MVC chercherait une vue nommée « produit »."
  - question: "Quelle URL respecte le mieux les conventions REST pour créer une commande ?"
    choix:
      - "GET /creerCommande"
      - "POST /commandes"
      - "POST /commande/create"
      - "GET /commandes/nouvelle"
    reponse: 1
    explication: "En REST, l'URL désigne une **ressource au pluriel** (`/commandes`) et c'est le **verbe HTTP** qui porte l'action : `POST` pour créer. Un verbe dans l'URL (`creerCommande`, `create`) ou un `GET` qui modifie l'état sont des anti-patterns : `GET` doit rester sûr."
  - question: "`PUT /produits/1` appelé deux fois de suite avec le même corps : quel est le résultat ?"
    choix:
      - "Deux produits différents sont créés"
      - "Une erreur au deuxième appel"
      - "Le même état final qu'un seul appel : PUT est idempotent"
      - "Cela dépend du corps de la requête"
    reponse: 2
    explication: "`PUT` est idempotent par définition de HTTP : remplacer une ressource par le même contenu plusieurs fois produit le même état final. C'est une différence importante avec `POST`, qui crée une nouvelle ressource à chaque appel."
---

## Essentiel

`@RestController` combine `@Controller` (la classe est un bean qui gère des requêtes web) et `@ResponseBody` (chaque méthode écrit son résultat directement dans le corps de la réponse, sérialisé en JSON par Jackson). C'est l'annotation de base pour exposer une API REST.

```java
@RestController
@RequestMapping("/produits")
public class ProduitController {

    @GetMapping
    public List<Produit> lister() {
        return List.of(new Produit(1L, "Clavier", 49.90));
    }

    @GetMapping("/{id}")
    public Produit get(@PathVariable Long id) {
        return new Produit(id, "Clavier", 49.90);
    }

    @PostMapping
    public Produit creer(@RequestBody Produit produit) {
        return produit; // en réalité, on l'enregistrerait
    }
}
```

`@RequestMapping("/produits")` sur la classe donne le préfixe commun. Chaque méthode utilise ensuite le mapping du verbe HTTP qui correspond à son action : `@GetMapping` (lire), `@PostMapping` (créer), `@PutMapping` (remplacer), `@PatchMapping` (modifier partiellement), `@DeleteMapping` (supprimer).

Les conventions REST : une URL désigne une **ressource**, nommée au **pluriel** (`/produits`), jamais un verbe. C'est le verbe HTTP qui porte l'action, pas l'URL.

## Détail

### Comment ça marche

Au démarrage, le component scan détecte `@RestController` (c'est un `@Component`). Spring MVC construit une table qui associe chaque combinaison « URL + verbe HTTP » à la méthode Java correspondante. À chaque requête entrante, le `DispatcherServlet` retrouve la bonne méthode, l'appelle, puis passe la valeur retournée à Jackson pour la sérialiser en JSON.

### Exemple 1 — Les cinq verbes sur une même ressource

```java
@RestController
@RequestMapping("/produits")
public class ProduitController {

    @GetMapping
    public List<Produit> lister() { ... }

    @GetMapping("/{id}")
    public Produit get(@PathVariable Long id) { ... }

    @PostMapping
    public Produit creer(@RequestBody Produit produit) { ... }

    @PutMapping("/{id}")
    public Produit remplacer(@PathVariable Long id, @RequestBody Produit produit) { ... }

    @PatchMapping("/{id}")
    public Produit modifier(@PathVariable Long id, @RequestBody Map<String, Object> changements) { ... }

    @DeleteMapping("/{id}")
    public void supprimer(@PathVariable Long id) { ... }
}
```

Une seule ressource (`/produits`), cinq actions distinguées par le verbe HTTP.

### Exemple 2 — Sérialisation d'un record

```java
public record Produit(Long id, String nom, double prix) { }

@GetMapping("/{id}")
public Produit get(@PathVariable Long id) {
    return new Produit(id, "Clavier", 49.90);
}
```

```json
{"id": 1, "nom": "Clavier", "prix": 49.9}
```

Jackson sérialise un record comme une classe classique : chaque composant devient un champ JSON, dans l'ordre de déclaration. Aucune annotation n'est nécessaire pour ce cas simple.

### Exemple 3 — `@Controller` classique, pour comparer

```java
@Controller
public class PageController {

    @GetMapping("/accueil")
    public String accueil() {
        return "accueil"; // nom d'une vue (ex. accueil.html avec Thymeleaf)
    }
}

@RestController
public class ApiController {

    @GetMapping("/accueil")
    public String accueil() {
        return "accueil"; // écrit tel quel : le texte "accueil" dans le corps de la réponse
    }
}
```

Le même code retourne un rendu totalement différent selon l'annotation : une vue HTML d'un côté, du texte brut dans le corps HTTP de l'autre.

### Les verbes HTTP en un coup d'œil

| Verbe | Usage REST | Sûr | Idempotent |
|---|---|---|---|
| `GET` | Lire une ressource | ✅ | ✅ |
| `POST` | Créer une ressource | ❌ | ❌ |
| `PUT` | Remplacer entièrement une ressource | ❌ | ✅ |
| `PATCH` | Modifier partiellement une ressource | ❌ | non garanti |
| `DELETE` | Supprimer une ressource | ❌ | ✅ |

### Pièges courants

> **Un verbe dans l'URL.** `/getProduits` ou `/produits/delete/1` ne sont pas du REST : le verbe HTTP (`GET`, `DELETE`) porte déjà l'action. Gardez des URL qui ne décrivent que la ressource : `GET /produits`, `DELETE /produits/1`.

> **`@Controller` au lieu de `@RestController`.** Sans `@ResponseBody`, Spring MVC interprète la chaîne retournée comme un **nom de vue** à résoudre, pas comme le contenu de la réponse. Résultat typique : une erreur 404 « No mapping for GET /produits » côté résolution de vue, alors que le contrôleur a bien été appelé.

> **Un `GET` qui modifie des données.** Casse la promesse « méthode sûre » de HTTP : un lien prévisualisé, un robot d'indexation ou un cache peuvent déclencher l'appel sans intention de l'utilisateur. Réservez les modifications à `POST`, `PUT`, `PATCH`, `DELETE`.

### À retenir

- `@RestController` = `@Controller` + `@ResponseBody` : les retours sont sérialisés en JSON par Jackson.
- `@RequestMapping` sur la classe donne le préfixe, un mapping par verbe (`@GetMapping`…) sur chaque méthode.
- URL = ressource au pluriel, verbe HTTP = action.
- `GET` est sûr ; `GET`, `PUT`, `DELETE` sont idempotents ; `POST` ne l'est pas.
