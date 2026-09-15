---
id: response-entity
chapitre: api-rest
ordre: 3
titre: "Construire la réponse : ResponseEntity et codes HTTP"
termes:
  - terme: ResponseEntity
    definition: "Classe qui représente une réponse HTTP complète : code de statut, en-têtes et corps. Permet de contrôler précisément ce que l'API renvoie, contrairement à un retour d'objet simple (toujours 200)."
  - terme: "ResponseEntity.ok(...)"
    definition: "Construit une réponse **200 OK** avec le corps donné. `ResponseEntity.ok().build()` pour un 200 sans corps."
  - terme: "ResponseEntity.created(URI)"
    definition: "Construit une réponse **201 Created** avec l'en-tête `Location` pointant vers la ressource créée. Le corps s'ajoute ensuite avec `.body(...)`."
  - terme: ServletUriComponentsBuilder
    definition: "Utilitaire Spring MVC pour construire l'URI de la ressource créée à partir de la requête courante, par exemple `ServletUriComponentsBuilder.fromCurrentRequest().path(\"/{id}\").buildAndExpand(id).toUri()`."
  - terme: "@ResponseStatus"
    definition: "Annotation qui fixe le code HTTP renvoyé par une méthode de contrôleur, ou associé à une exception. Alternative simple à `ResponseEntity` quand le code est toujours le même."
  - terme: "ResponseEntity.notFound() / noContent()"
    definition: "`notFound().build()` construit une réponse **404** sans corps. `noContent().build()` construit une réponse **204** sans corps, typiquement après une suppression réussie."
quiz:
  - question: "Quel code HTTP ce endpoint renvoie-t-il pour une création réussie, et quel en-tête est présent ?"
    code: |
      @PostMapping("/produits")
      public ResponseEntity<Produit> creer(@RequestBody CreationProduitDto dto) {
          Produit produit = service.creer(dto);
          URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                  .path("/{id}")
                  .buildAndExpand(produit.id())
                  .toUri();
          return ResponseEntity.created(location).body(produit);
      }
    choix:
      - "200 OK, sans en-tête particulier"
      - "201 Created, avec l'en-tête `Location` pointant vers la nouvelle ressource"
      - "204 No Content, avec l'en-tête `Location`"
      - "201 Created, sans en-tête"
    reponse: 1
    explication: "`ResponseEntity.created(location)` fixe le statut à 201 et ajoute automatiquement l'en-tête `Location` avec l'URI passée en paramètre. C'est la convention REST pour signaler où trouver la ressource nouvellement créée."
  - question: "Quel est le code HTTP le plus approprié pour une suppression réussie qui ne renvoie aucun corps ?"
    choix:
      - "200 OK"
      - "201 Created"
      - "204 No Content"
      - "404 Not Found"
    reponse: 2
    explication: "204 signifie « traitement réussi, rien à renvoyer dans le corps » : exactement le cas d'une suppression. `ResponseEntity.noContent().build()` construit cette réponse. 200 conviendrait aussi mais suppose alors un corps (souvent vide en pratique, ce qui est trompeur) ; 204 est plus précis."
  - question: "Un client demande `GET /produits/999` et ce produit n'existe pas. Que renvoie ce code ?"
    code: |
      @GetMapping("/{id}")
      public ResponseEntity<Produit> get(@PathVariable Long id) {
          return service.trouver(id)
                  .map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
      }
    choix:
      - "Une exception non gérée, 500"
      - "200 OK avec un corps vide"
      - "404 Not Found, sans corps"
      - "204 No Content"
    reponse: 2
    explication: "`service.trouver(id)` renvoie un `Optional<Produit>`. Présent → 200 avec le produit. Absent → `ResponseEntity.notFound().build()`, soit un 404 sans corps. C'est le pattern courant pour une lecture par identifiant qui peut échouer."
---

## Essentiel

Un contrôleur qui retourne directement un objet répond toujours **200 OK**. `ResponseEntity<T>` permet de choisir précisément le code HTTP, les en-têtes et le corps de la réponse.

```java
@RestController
@RequestMapping("/produits")
public class ProduitController {

    @GetMapping("/{id}")
    public ResponseEntity<Produit> get(@PathVariable Long id) {
        return service.trouver(id)
                .map(ResponseEntity::ok)               // 200
                .orElse(ResponseEntity.notFound().build()); // 404
    }

    @PostMapping
    public ResponseEntity<Produit> creer(@RequestBody CreationProduitDto dto) {
        Produit produit = service.creer(dto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(produit.id())
                .toUri();
        return ResponseEntity.created(location).body(produit); // 201 + Location
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        service.supprimer(id);
        return ResponseEntity.noContent().build(); // 204
    }
}
```

`ResponseEntity.ok(corps)` pour un succès, `.created(uri).body(corps)` pour une création (avec l'en-tête `Location`), `.noContent().build()` pour un succès sans contenu, `.notFound().build()` quand la ressource n'existe pas.

## Détail

### Pourquoi c'est utile

Retourner directement un objet (`public Produit get(...)`) est simple mais rigide : impossible de signaler un 404 sans lever une exception, impossible d'ajouter un en-tête. `ResponseEntity` donne un contrôle complet, indispensable dès que l'API doit distinguer plusieurs issues (trouvé/non trouvé, créé, sans contenu…).

### Exemple 1 — Les constructions les plus courantes

```java
ResponseEntity.ok(produit);                         // 200 + corps
ResponseEntity.ok().build();                        // 200 sans corps
ResponseEntity.status(HttpStatus.ACCEPTED).body(x);  // code arbitraire + corps
ResponseEntity.created(location).body(produit);      // 201 + Location + corps
ResponseEntity.noContent().build();                  // 204 sans corps
ResponseEntity.notFound().build();                    // 404 sans corps
ResponseEntity.badRequest().body(erreur);             // 400 + corps
```

### Exemple 2 — Construire l'URI avec ServletUriComponentsBuilder

```java
@PostMapping
public ResponseEntity<Produit> creer(@RequestBody CreationProduitDto dto) {
    Produit produit = service.creer(dto);
    URI location = ServletUriComponentsBuilder.fromCurrentRequest() // ex. /produits
            .path("/{id}")
            .buildAndExpand(produit.id())
            .toUri(); // ex. /produits/42
    return ResponseEntity.created(location).body(produit);
}
```

`fromCurrentRequest()` part de l'URL de la requête entrante (`POST /produits`), y ajoute `/{id}` puis remplace `{id}` par la valeur réelle. Le résultat est une URI absolue, correcte même derrière un proxy si celui-ci transmet les en-têtes `X-Forwarded-*` (gérés par Spring).

### Exemple 3 — Ajouter des en-têtes personnalisés

```java
@GetMapping("/{id}")
public ResponseEntity<Produit> get(@PathVariable Long id) {
    Produit produit = service.trouver(id).orElseThrow();
    return ResponseEntity.ok()
            .header("X-Cache", "MISS")
            .eTag(String.valueOf(produit.version()))
            .body(produit);
}
```

`ResponseEntity.ok()` (sans argument) renvoie un `BodyBuilder` : on peut chaîner `.header(...)`, `.eTag(...)`, `.contentType(...)`, puis terminer par `.body(...)`.

### Exemple 4 — `@ResponseStatus`, alternative simple

```java
@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public Produit creer(@RequestBody CreationProduitDto dto) {
    return service.creer(dto); // toujours 201, mais pas d'en-tête Location facile à ajouter
}
```

Pratique quand le code est **toujours le même** et qu'il n'y a pas besoin d'en-têtes spécifiques. Dès qu'il faut varier le code selon le résultat (trouvé/non trouvé) ou ajouter `Location`, `ResponseEntity` est plus adapté.

### Codes HTTP principaux pour une API REST

| Code | Signification | Usage typique |
|---|---|---|
| 200 OK | Succès | Lecture, mise à jour réussie avec corps |
| 201 Created | Ressource créée | Réponse à un `POST` réussi, avec `Location` |
| 204 No Content | Succès sans corps | Suppression réussie, mise à jour sans retour |
| 400 Bad Request | Requête invalide | Paramètre manquant, JSON illisible, validation échouée |
| 401 Unauthorized | Authentification manquante ou invalide | Token absent ou expiré |
| 403 Forbidden | Authentifié mais non autorisé | Droits insuffisants pour l'action |
| 404 Not Found | Ressource inexistante | `GET`/`PUT`/`DELETE` sur un id absent |
| 409 Conflict | Conflit avec l'état actuel | Doublon, version obsolète (verrou optimiste) |
| 500 Internal Server Error | Erreur inattendue côté serveur | Exception non gérée |

### Pièges courants

> **Retourner l'objet directement au lieu de `ResponseEntity`** quand un 404 est possible. `public Produit get(Long id) { return service.trouver(id).orElseThrow(); }` renvoie 500 par défaut si l'exception n'est pas gérée, pas 404. Utilisez `ResponseEntity` avec `Optional`, ou une exception dédiée traduite en 404 (voir la leçon sur la gestion des erreurs).

> **Oublier `.build()` sur un `ResponseEntity` sans corps.** `ResponseEntity.notFound()` seul renvoie un `HeadersBuilder`, pas une `ResponseEntity` : il faut `.build()` pour obtenir l'objet final.

> **201 sans `Location`.** Le code 201 seul ne dit pas où trouver la ressource créée. La convention REST veut que l'en-tête `Location` accompagne systématiquement un 201.

### À retenir

- `ResponseEntity<T>` contrôle le code, les en-têtes et le corps ; un retour d'objet simple est toujours 200.
- `ok()`, `created(uri)`, `noContent()`, `notFound()`, `badRequest()` couvrent les cas courants.
- `ServletUriComponentsBuilder` construit l'URI de la ressource créée pour l'en-tête `Location`.
- `@ResponseStatus` convient quand le code est fixe ; `ResponseEntity` quand il varie selon le résultat.
