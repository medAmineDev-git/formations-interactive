---
id: gestion-erreurs
chapitre: api-rest
ordre: 5
titre: "Gérer les erreurs : @ExceptionHandler et @RestControllerAdvice"
termes:
  - terme: Exception métier
    definition: "Une exception propre au domaine de l'application, par exemple `ProduitIntrouvableException`, levée par le code métier (service, repository) plutôt que de renvoyer `null` ou un `Optional` vide partout."
  - terme: "@ExceptionHandler"
    definition: "Annotation posée sur une méthode qui intercepte un type d'exception précis et construit la réponse HTTP correspondante. Peut être locale à un contrôleur, ou globale dans une classe `@RestControllerAdvice`."
  - terme: "@RestControllerAdvice"
    definition: "Raccourci pour `@ControllerAdvice` + `@ResponseBody` : une classe qui centralise des `@ExceptionHandler` pour **tous les contrôleurs** de l'application, au lieu de les dupliquer dans chacun."
  - terme: ResponseStatusException
    definition: "Exception prête à l'emploi de Spring (`org.springframework.web.server.ResponseStatusException`) qui porte directement un code HTTP et un message, pratique pour une erreur ponctuelle sans créer de classe dédiée."
  - terme: ProblemDetail
    definition: "Classe Spring 6 (`org.springframework.http.ProblemDetail`) qui représente une erreur au format **RFC 9457** (*Problem Details for HTTP APIs*) : `type`, `title`, `status`, `detail`, `instance`, et des champs additionnels propres à l'application."
  - terme: spring.mvc.problemdetails.enabled
    definition: "Propriété qui active la production de réponses `ProblemDetail` (au format `application/problem+json`) pour les exceptions que Spring MVC gère lui-même en interne (ex. `HttpMessageNotReadableException`, `MethodArgumentNotValidException`)."
  - terme: "/error"
    definition: "Endpoint géré par `BasicErrorController`, appelé automatiquement quand une exception n'est interceptée par aucun `@ExceptionHandler`. Produit une réponse JSON par défaut avec `timestamp`, `status`, `error`, `path` (le message et la pile d'appel ne sont inclus que si on l'active explicitement)."
quiz:
  - question: "Un `ProduitIntrouvableException` est levé dans le service. Quelle réponse ce gestionnaire produit-il ?"
    code: |
      @RestControllerAdvice
      public class GestionnaireErreurs {

          @ExceptionHandler(ProduitIntrouvableException.class)
          public ResponseEntity<String> gererProduitIntrouvable(ProduitIntrouvableException ex) {
              return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
          }
      }
    choix:
      - "500, car l'exception n'est pas interceptée dans le contrôleur"
      - "404, avec le message de l'exception comme corps de réponse"
      - "L'application ne démarre pas : `@RestControllerAdvice` n'existe pas"
      - "200, l'exception est ignorée"
    reponse: 1
    explication: "`@RestControllerAdvice` centralise les `@ExceptionHandler` pour toute l'application : peu importe le contrôleur d'où vient l'exception, ce gestionnaire l'intercepte et construit la réponse 404 avec le message de l'exception."
  - question: "Pourquoi éviter de renvoyer directement `ex.getMessage()` ou la pile d'appel d'une exception technique au client ?"
    choix:
      - "Pour des raisons de performance uniquement"
      - "Cela peut exposer des détails internes (requêtes SQL, noms de classes, chemins de fichiers) exploitables par un attaquant"
      - "Ce n'est pas possible techniquement"
      - "Jackson refuse de sérialiser les exceptions"
    reponse: 1
    explication: "Le message ou la trace d'une exception technique (SQL, NPE, chemin de fichier…) peut révéler la structure interne de l'application. Bonne pratique : gérer les exceptions métier proprement avec un message contrôlé, et pour les erreurs inattendues, renvoyer un message générique côté client tout en journalisant le détail côté serveur."
  - question: "À quoi sert `ProblemDetail`, introduit par Spring Framework 6 ?"
    choix:
      - "À remplacer entièrement `ResponseEntity`"
      - "À produire des réponses d'erreur normalisées selon la RFC 9457 (`type`, `title`, `status`, `detail`…)"
      - "À valider automatiquement le corps des requêtes"
      - "À générer la documentation OpenAPI"
    reponse: 1
    explication: "`ProblemDetail` structure une réponse d'erreur selon un format standard interopérable (`application/problem+json`). Avec `spring.mvc.problemdetails.enabled=true`, Spring Boot l'utilise pour les erreurs qu'il gère en interne ; on peut aussi le construire soi-même dans un `@ExceptionHandler`."
---

## Essentiel

Sans gestion particulière, une exception non interceptée aboutit sur l'endpoint `/error` de Spring Boot, avec un code 500 et une réponse JSON générique. Pour des réponses précises et cohérentes, on définit des exceptions métier et on les intercepte avec `@ExceptionHandler` :

```java
public class ProduitIntrouvableException extends RuntimeException {
    public ProduitIntrouvableException(Long id) {
        super("Produit introuvable : " + id);
    }
}

@RestControllerAdvice
public class GestionnaireErreurs {

    @ExceptionHandler(ProduitIntrouvableException.class)
    public ResponseEntity<String> gererProduitIntrouvable(ProduitIntrouvableException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}
```

`@RestControllerAdvice` centralise ces gestionnaires pour **tous les contrôleurs** de l'application, au lieu de répéter `@ExceptionHandler` dans chacun. On peut aussi en mettre un directement dans un contrôleur : il ne s'applique alors qu'à ce contrôleur.

Règle essentielle : ne jamais renvoyer au client le message brut d'une exception technique ni sa pile d'appel — cela peut exposer des détails internes de l'application.

## Détail

### Exemple 1 — `@ExceptionHandler` local à un contrôleur

```java
@RestController
@RequestMapping("/produits")
public class ProduitController {

    @GetMapping("/{id}")
    public Produit get(@PathVariable Long id) {
        return service.trouver(id).orElseThrow(() -> new ProduitIntrouvableException(id));
    }

    @ExceptionHandler(ProduitIntrouvableException.class)
    public ResponseEntity<String> gererIntrouvable(ProduitIntrouvableException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}
```

Utile pour un cas très spécifique à ce contrôleur. Dès que plusieurs contrôleurs doivent gérer les mêmes types d'exceptions, `@RestControllerAdvice` évite la duplication.

### Exemple 2 — `ResponseStatusException`, pour une erreur ponctuelle

```java
@GetMapping("/{id}")
public Produit get(@PathVariable Long id) {
    return service.trouver(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produit introuvable : " + id));
}
```

Pas besoin de créer une classe d'exception ni de gestionnaire : `ResponseStatusException` porte directement le code et le message. Pratique pour un cas isolé ; une exception métier dédiée reste préférable quand la même erreur doit être gérée à plusieurs endroits ou testée précisément.

### Exemple 3 — `ProblemDetail` (RFC 9457)

```java
@RestControllerAdvice
public class GestionnaireErreurs {

    @ExceptionHandler(ProduitIntrouvableException.class)
    public ProblemDetail gererIntrouvable(ProduitIntrouvableException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        detail.setTitle("Produit introuvable");
        return detail;
    }
}
```

```json
{
  "type": "about:blank",
  "title": "Produit introuvable",
  "status": 404,
  "detail": "Produit introuvable : 42",
  "instance": "/produits/42"
}
```

`ProblemDetail` (Spring Framework 6) structure la réponse selon la RFC 9457, un format normalisé pour les erreurs d'API. En activant `spring.mvc.problemdetails.enabled=true` dans `application.properties`, Spring Boot produit aussi ce format pour les erreurs qu'il gère en interne, sans code supplémentaire.

### Exemple 4 — Gestionnaire global pour la validation

```java
@RestControllerAdvice
public class GestionnaireErreurs {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> gererValidation(MethodArgumentNotValidException ex) {
        Map<String, String> erreurs = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(err -> erreurs.put(err.getField(), err.getDefaultMessage()));
        return ResponseEntity.badRequest().body(erreurs);
    }
}
```

Transforme la liste de violations de Bean Validation en une réponse claire, par exemple `{"nom": "ne doit pas être vide", "prix": "doit être positif"}`.

### Le comportement par défaut de Spring Boot

Sans aucun `@ExceptionHandler`, une exception non interceptée remonte jusqu'au `BasicErrorController`, qui répond sur `/error` avec un JSON du type :

```json
{
  "timestamp": "2026-01-01T10:00:00.000+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "path": "/produits/42"
}
```

Par défaut, le champ `message` détaillé et la pile d'appel (`trace`) ne sont **pas** inclus dans cette réponse en production : c'est volontaire, pour ne pas exposer d'informations internes. Les journaliser côté serveur (`logger.error(...)`) reste le bon réflexe pour le diagnostic.

### Pièges courants

> **Renvoyer `ex.getMessage()` d'une exception technique brute au client.** Un message JDBC ou une `NullPointerException` peut révéler la structure de la base de données ou du code. Réservez ce niveau de détail aux logs serveur ; le client reçoit un message contrôlé.

> **Multiplier les `@ExceptionHandler` identiques dans chaque contrôleur.** Dès que deux contrôleurs ou plus doivent gérer la même exception de la même façon, centralisez avec `@RestControllerAdvice`.

> **Laisser une exception inattendue remonter sans réponse structurée.** Sans gestionnaire, le client reçoit le format par défaut de `/error`, peu informatif pour lui. Un `@ExceptionHandler(Exception.class)` de dernier recours dans le `@RestControllerAdvice` (loggant l'erreur et renvoyant un message générique 500) évite les réponses inconsistantes.

### À retenir

- Créer des exceptions métier explicites (`ProduitIntrouvableException`) plutôt que de propager des exceptions techniques.
- `@ExceptionHandler` intercepte un type d'exception ; `@RestControllerAdvice` centralise ces gestionnaires pour toute l'application.
- `ResponseStatusException` dépanne pour un cas ponctuel sans classe dédiée.
- `ProblemDetail` (RFC 9457) normalise le format des erreurs ; `spring.mvc.problemdetails.enabled=true` l'active pour les erreurs internes de Spring MVC.
- Ne jamais exposer un message technique brut ou une pile d'appel au client.
