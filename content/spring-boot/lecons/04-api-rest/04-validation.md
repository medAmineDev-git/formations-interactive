---
id: validation
chapitre: api-rest
ordre: 4
titre: "Valider les données avec Bean Validation"
termes:
  - terme: spring-boot-starter-validation
    definition: "Dépendance à ajouter pour utiliser Bean Validation (Hibernate Validator). Depuis Spring Boot 2.3, elle n'est **plus incluse automatiquement** dans `spring-boot-starter-web` : il faut l'ajouter explicitement au projet."
  - terme: "@Valid"
    definition: "Annotation (`jakarta.validation.Valid`) posée sur un paramètre de méthode (typiquement `@RequestBody`) pour déclencher la validation de l'objet selon les contraintes posées sur ses champs."
  - terme: "@NotNull, @NotBlank, @NotEmpty"
    definition: "Contraintes de présence. `@NotNull` : la valeur n'est pas `null` (accepte une chaîne vide). `@NotEmpty` : ni `null` ni vide (chaîne, collection). `@NotBlank` : en plus, une chaîne ne peut pas être uniquement des espaces."
  - terme: "@Size, @Min, @Max, @Positive"
    definition: "Contraintes numériques et de taille. `@Size(min=, max=)` sur une chaîne ou une collection. `@Min`/`@Max` sur un nombre. `@Positive` (ou `@PositiveOrZero`) exige une valeur strictement positive (ou positive ou nulle)."
  - terme: "@Email, @Pattern, @Past"
    definition: "`@Email` valide un format d'adresse électronique. `@Pattern(regexp = \"...\")` valide une chaîne contre une expression régulière. `@Past` exige une date antérieure à maintenant (utile pour une date de naissance)."
  - terme: MethodArgumentNotValidException
    definition: "Exception levée quand `@Valid` détecte une violation de contrainte sur un `@RequestBody`. Traduite automatiquement en réponse **400 Bad Request** par Spring Boot."
  - terme: HandlerMethodValidationException
    definition: "Depuis **Spring Framework 6.1**, exception levée quand un `@PathVariable` ou `@RequestParam` porteur d'une contrainte (ex. `@Min(1)`) échoue à la validation. Traduite automatiquement en **400 Bad Request**."
quiz:
  - question: "Ce DTO est validé avec `@Valid`. Le client envoie `{\"nom\": \"\", \"prix\": -5}`. Que se passe-t-il ?"
    code: |
      public record CreationProduitDto(
          @NotBlank String nom,
          @Positive double prix
      ) { }

      @PostMapping("/produits")
      public ResponseEntity<Produit> creer(@Valid @RequestBody CreationProduitDto dto) {
          ...
      }
    choix:
      - "La méthode s'exécute normalement, `nom` vaut une chaîne vide"
      - "400 Bad Request : `MethodArgumentNotValidException`, avec le détail des deux violations"
      - "500 Internal Server Error"
      - "La méthode s'exécute mais `dto` vaut `null`"
    reponse: 1
    explication: "`@Valid` déclenche la validation avant l'exécution de la méthode. Les deux contraintes échouent (`nom` vide viole `@NotBlank`, `prix` négatif viole `@Positive`) : Spring lève une `MethodArgumentNotValidException`, traduite en 400 par défaut, avec les détails des champs invalides dans le corps de la réponse."
  - question: "Quelle contrainte choisir pour un champ `String description` qui doit être présent et ne pas être composé uniquement d'espaces ?"
    choix:
      - "`@NotNull`"
      - "`@NotEmpty`"
      - "`@NotBlank`"
      - "`@Size(min = 1)`"
    reponse: 2
    explication: "`@NotNull` accepterait une chaîne vide. `@NotEmpty` accepterait `\"   \"` (des espaces uniquement). Seul `@NotBlank` rejette aussi les chaînes composées uniquement d'espaces : c'est le bon choix pour un texte destiné à être lu."
  - question: "Qu'ajoute la dépendance `spring-boot-starter-validation` ?"
    choix:
      - "Elle est inutile : la validation est incluse par défaut dans `spring-boot-starter-web`"
      - "Hibernate Validator, l'implémentation de Bean Validation utilisée par `@Valid` et les annotations `@NotNull`, `@Size`…"
      - "Une validation automatique de tous les champs sans annotation"
      - "Un validateur de syntaxe JSON uniquement"
    reponse: 1
    explication: "Depuis Spring Boot 2.3, `spring-boot-starter-web` n'embarque plus Hibernate Validator : sans `spring-boot-starter-validation`, les annotations comme `@NotBlank` sont ignorées (aucune erreur, la validation ne se déclenche simplement pas)."
---

## Essentiel

Bean Validation (les annotations `jakarta.validation.constraints.*`) permet de décrire des règles sur un DTO et de les faire vérifier automatiquement par Spring. Il faut d'abord ajouter la dépendance, absente du starter web depuis Spring Boot 2.3 :

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

Ensuite, on annote le DTO et on ajoute `@Valid` devant `@RequestBody` :

```java
public record CreationProduitDto(
        @NotBlank String nom,
        @Positive double prix,
        @NotNull String categorie
) { }

@PostMapping("/produits")
public ResponseEntity<Produit> creer(@Valid @RequestBody CreationProduitDto dto) {
    Produit produit = service.creer(dto);
    return ResponseEntity.ok(produit);
}
```

Si une contrainte échoue, Spring lève une `MethodArgumentNotValidException` **avant** que le corps de la méthode ne s'exécute, traduite automatiquement en réponse **400 Bad Request** avec le détail des champs invalides. Aucun `if` manuel n'est nécessaire.

## Détail

### Les contraintes de présence, en détail

| Annotation | `null` refusé | `""` (vide) refusé | `"   "` (espaces) refusé |
|---|---|---|---|
| `@NotNull` | ✅ | ❌ | ❌ |
| `@NotEmpty` | ✅ | ✅ | ❌ |
| `@NotBlank` | ✅ | ✅ | ✅ |

`@NotEmpty` s'applique aussi aux collections (`List`, `Set`…) et vérifie qu'elles ne sont pas vides. `@NotBlank` est réservé aux `String`.

### Exemple 1 — Un DTO avec plusieurs contraintes

```java
public record CreationProduitDto(
        @NotBlank
        @Size(max = 100)
        String nom,

        @Positive
        double prix,

        @Email
        String emailContact,

        @Pattern(regexp = "^[A-Z]{2}\\d{4}$")
        String reference
) { }
```

Plusieurs annotations peuvent se cumuler sur un même champ : toutes sont vérifiées, toutes les violations apparaissent dans la réponse d'erreur.

### Exemple 2 — Validation en cascade d'un objet imbriqué

```java
public record AdresseDto(@NotBlank String rue, @NotBlank String ville, @Pattern(regexp = "\\d{5}") String codePostal) { }

public record CreationClientDto(
        @NotBlank String nom,
        @Valid AdresseDto adresse // @Valid déclenche aussi la validation de l'objet imbriqué
) { }
```

Sans `@Valid` sur le champ `adresse`, seules les contraintes de `CreationClientDto` seraient vérifiées : les contraintes de `AdresseDto` seraient ignorées. `@Valid` doit être répété à chaque niveau d'imbrication.

### Exemple 3 — Validation d'un `@RequestParam`

```java
@RestController
@RequestMapping("/produits")
public class ProduitController {

    @GetMapping
    public List<Produit> lister(@RequestParam @Min(0) int page,
                                 @RequestParam @Min(1) @Max(100) int taille) {
        return service.lister(page, taille);
    }
}
```

Depuis **Spring Framework 6.1** (Spring Boot 3.2), Spring MVC valide directement les `@RequestParam` et `@PathVariable` porteurs d'une contrainte, sans configuration supplémentaire : une valeur invalide (`page=-1`) lève une `HandlerMethodValidationException`, traduite en 400. Avant cette version, il fallait ajouter `@Validated` sur la classe du contrôleur pour activer ce comportement, et l'exception levée (`ConstraintViolationException`) n'était pas convertie en 400 par défaut.

### Exemple 4 — Contrainte personnalisée (aperçu)

```java
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ReferenceProduitValidator.class)
public @interface ReferenceProduitValide {
    String message() default "Référence produit invalide";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

Bean Validation permet de créer ses propres annotations en implémentant `ConstraintValidator`. Utile pour une règle métier réutilisée à plusieurs endroits (format de référence, cohérence entre deux champs…).

### Pièges courants

> **Oublier `spring-boot-starter-validation`.** Sans cette dépendance, les annotations `@NotBlank`, `@Size`… sont simplement **ignorées** : aucune erreur au démarrage, aucune validation à l'exécution. Le bug est silencieux et donc difficile à repérer.

> **Oublier `@Valid` devant `@RequestBody`.** Sans lui, les contraintes du DTO ne sont jamais vérifiées, même si elles sont bien présentes sur les champs.

> **`@Valid` non répété sur un champ imbriqué.** La validation ne descend pas automatiquement dans les objets composés : chaque champ objet qui doit être validé a besoin de son propre `@Valid`.

### À retenir

- Ajouter `spring-boot-starter-validation` : elle n'est plus incluse par défaut dans le starter web depuis Spring Boot 2.3.
- `@Valid` sur `@RequestBody` déclenche la validation du DTO ; une violation lève `MethodArgumentNotValidException` → 400 automatique.
- `@NotNull` / `@NotEmpty` / `@NotBlank` : bien choisir selon ce qu'on veut réellement interdire.
- `@Valid` sur un champ imbriqué valide aussi l'objet composé.
- Depuis Spring Framework 6.1, `@RequestParam`/`@PathVariable` avec contrainte sont validés nativement (`HandlerMethodValidationException` → 400).
