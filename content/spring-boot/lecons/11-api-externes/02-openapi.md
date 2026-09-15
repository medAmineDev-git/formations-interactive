---
id: openapi
chapitre: api-externes
ordre: 2
titre: "Documenter son API avec OpenAPI (springdoc)"
termes:
  - terme: OpenAPI
    definition: "Spécification standard (au format JSON ou YAML) qui décrit une API REST : ses endpoints, leurs paramètres, les schémas des corps de requête et de réponse, les codes de statut possibles. Elle sert de contrat lisible par des humains et par des outils (génération de clients, tests, portails de documentation)."
  - terme: springdoc-openapi-starter-webmvc-ui
    definition: "Dépendance à ajouter au projet pour générer automatiquement la documentation OpenAPI d'une application Spring MVC, en inspectant les `@RestController` au démarrage, et pour exposer l'interface Swagger UI."
  - terme: "/v3/api-docs"
    definition: "URL exposée par springdoc où l'on récupère la description OpenAPI générée, au format JSON (ajouter `.yaml` pour la variante YAML : `/v3/api-docs.yaml`)."
  - terme: Swagger UI
    definition: "Interface web interactive, servie par défaut sur `/swagger-ui.html` (qui redirige vers `/swagger-ui/index.html`), qui affiche la documentation générée et permet de tester les endpoints directement depuis le navigateur."
  - terme: "@Operation / @Tag"
    definition: "`@Operation` documente un endpoint (résumé, description) au-delà de ce que Spring peut déduire seul. `@Tag`, posée sur le contrôleur, regroupe ses endpoints sous un même nom dans Swagger UI."
  - terme: "@Schema"
    definition: "Documente un champ ou un DTO : description, exemple, contraintes affichées (`@Schema(description = \"...\", example = \"...\")`). Vient compléter ce que springdoc déduit déjà des annotations Bean Validation présentes sur le DTO (`@NotBlank`, `@Min`…)."
  - terme: "@ApiResponse(s)"
    definition: "Documente les réponses possibles d'un endpoint au-delà du cas de succès : `@ApiResponses({ @ApiResponse(responseCode = \"404\", description = \"Produit introuvable\") })`. springdoc ne peut pas deviner les codes d'erreur possibles à partir du seul code Java : il faut les déclarer explicitement pour qu'ils apparaissent dans la documentation."
  - terme: GroupedOpenApi
    definition: "Bean qui permet de définir plusieurs documentations distinctes pour une même application (ex. API publique vs API interne), chacune filtrée par package ou par motif d'URL, chacune avec sa propre page Swagger UI."
quiz:
  - question: "Quelle dépendance faut-il ajouter pour générer la documentation OpenAPI d'une application Spring MVC et obtenir Swagger UI ?"
    choix:
      - "spring-boot-starter-web suffit, la documentation est générée automatiquement"
      - "springdoc-openapi-starter-webmvc-ui"
      - "spring-boot-starter-actuator"
      - "spring-boot-starter-validation"
    reponse: 1
    explication: "`spring-boot-starter-web` fournit les annotations REST (`@RestController`…) mais ne génère aucune documentation. C'est `springdoc-openapi-starter-webmvc-ui` qui inspecte les contrôleurs au démarrage et expose `/v3/api-docs` et Swagger UI."
  - question: "Avec springdoc, ce contrôleur est en place. Que faut-il ajouter pour que le code d'erreur 404 apparaisse dans la documentation générée ?"
    code: |
      @GetMapping("/produits/{id}")
      public Produit trouver(@PathVariable Long id) {
          return service.trouver(id) // lève ProduitIntrouvableException si absent
                  .orElseThrow(() -> new ProduitIntrouvableException(id));
      }
    choix:
      - "Rien : springdoc détecte automatiquement les exceptions possibles dans le corps de la méthode"
      - "@ApiResponse(responseCode = \"404\", description = \"Produit introuvable\") sur la méthode"
      - "@Schema(example = \"404\") sur le type de retour"
      - "Il suffit de déclarer un @ExceptionHandler pour l'exception"
    reponse: 1
    explication: "springdoc génère la documentation en inspectant les signatures et annotations, pas le comportement du code à l'exécution : il ne peut pas savoir qu'un `orElseThrow` peut mener à un 404. `@ApiResponse` (ou `@ApiResponses` pour plusieurs codes) le rend explicite dans la documentation."
  - question: "Comment désactiver Swagger UI et le endpoint `/v3/api-docs` en environnement de production, sans toucher au code ?"
    choix:
      - "Retirer l'annotation @RestController des contrôleurs concernés"
      - "Avec des propriétés dédiées, par exemple dans un profil « prod » : springdoc.swagger-ui.enabled=false et springdoc.api-docs.enabled=false"
      - "Supprimer la dépendance springdoc uniquement pour le build de production"
      - "Ce n'est pas possible : springdoc est toujours actif si la dépendance est présente"
    reponse: 1
    explication: "springdoc expose des propriétés de configuration standard pour désactiver l'UI et/ou l'endpoint de description sans changer une ligne de code, typiquement activées seulement pour certains profils Spring (dev, test) et désactivées en production."
---

## Essentiel

**OpenAPI** est une spécification qui décrit une API REST (endpoints, paramètres, schémas, codes de réponse) dans un format standard. **springdoc-openapi** génère cette description automatiquement à partir des `@RestController` d'une application Spring Boot, sans écrire de fichier YAML à la main.

Ajouter la dépendance :

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.x.x</version>
</dependency>
```

Au démarrage, deux URL sont disponibles sans rien configurer de plus :

- `/v3/api-docs` : la description OpenAPI en JSON.
- `/swagger-ui.html` : une interface web pour explorer et tester l'API.

springdoc déduit déjà beaucoup de choses du code : les chemins, les méthodes HTTP, les types de paramètres, et même les contraintes Bean Validation (`@NotBlank`, `@Min`…) présentes sur les DTO. Pour aller plus loin, on ajoute des annotations dédiées :

```java
@Tag(name = "Produits")
@RestController
@RequestMapping("/produits")
public class ProduitController {

    @Operation(summary = "Récupère un produit par son identifiant")
    @ApiResponse(responseCode = "404", description = "Produit introuvable")
    @GetMapping("/{id}")
    public Produit trouver(@PathVariable Long id) { ... }
}
```

En production, on désactive généralement Swagger UI et l'endpoint de description (`springdoc.swagger-ui.enabled=false`, `springdoc.api-docs.enabled=false`), pour ne pas exposer la structure de l'API publiquement.

## Détail

### Pourquoi c'est utile

Une documentation à jour manuellement dérive vite du code réel. En générant la documentation depuis le code (approche *code-first*), elle reste toujours synchronisée avec ce que l'API fait réellement : un champ ajouté au DTO, un nouveau paramètre, apparaissent automatiquement dans `/v3/api-docs` sans action supplémentaire. La description OpenAPI générée sert aussi de base à d'autres outils : génération de client (`openapi-generator`), tests de contrat, import dans Postman.

### Exemple 1 — Documenter un DTO avec `@Schema`

```java
public record CreationProduitDto(
        @Schema(description = "Nom affiché du produit", example = "Clavier mécanique")
        @NotBlank
        String nom,

        @Schema(description = "Prix hors taxe en euros", example = "49.90")
        @Positive
        double prix
) { }
```

springdoc combine les contraintes Bean Validation (visibles dans le schéma comme `required`, `minimum`…) avec les précisions apportées par `@Schema` (description, exemple), qui ne peuvent pas être déduites du code seul.

### Exemple 2 — Documenter les paramètres et les réponses possibles

```java
@Operation(summary = "Liste les produits d'une catégorie")
@ApiResponses({
        @ApiResponse(responseCode = "200", description = "Liste renvoyée"),
        @ApiResponse(responseCode = "400", description = "Paramètre categorie invalide")
})
@GetMapping
public List<Produit> lister(
        @Parameter(description = "Catégorie à filtrer, ex. informatique")
        @RequestParam String categorie) {
    ...
}
```

`@Parameter` documente un paramètre individuel (utile surtout quand son rôle n'est pas évident depuis son nom) ; `@ApiResponses` liste les statuts que le client peut recevoir, au-delà du 200 par défaut.

### Exemple 3 — Séparer une API publique et une API interne avec `GroupedOpenApi`

```java
@Configuration
public class OpenApiConfig {

    @Bean
    public GroupedOpenApi apiPublique() {
        return GroupedOpenApi.builder()
                .group("publique")
                .pathsToMatch("/produits/**", "/commandes/**")
                .build();
    }

    @Bean
    public GroupedOpenApi apiInterne() {
        return GroupedOpenApi.builder()
                .group("interne")
                .pathsToMatch("/admin/**")
                .build();
    }
}
```

Chaque groupe obtient sa propre entrée dans Swagger UI et son propre `/v3/api-docs`, filtré par motif d'URL (ou par package). Pratique pour ne montrer aux consommateurs externes que ce qui les concerne.

### Exemple 4 — Désactiver la documentation en production

```yaml
# application-prod.yaml
springdoc:
  api-docs:
    enabled: false
  swagger-ui:
    enabled: false
```

En laissant ces propriétés à leur valeur par défaut (activées) uniquement dans les profils `dev` et `test`, la structure interne de l'API (noms de champs, endpoints) n'est pas exposée publiquement en production. Une API destinée à des partenaires externes fait au contraire l'inverse : elle garde la documentation active, potentiellement en y ajoutant un contrôle d'accès dédié.

### Code-first ou contract-first ?

| | Code-first (springdoc) | Contract-first |
|---|---|---|
| Point de départ | Le code Java (contrôleurs, DTO) | Un fichier OpenAPI écrit à la main |
| Documentation générée depuis | Le code | — (c'est le code qui doit s'y conformer) |
| Risque de dérive | Faible : la doc suit le code | Fort si le code n'est pas vérifié contre le contrat |
| Adapté quand | L'équipe qui code l'API décide aussi de sa forme | Le contrat est négocié avant le code (API publique, plusieurs équipes en parallèle) |
| Outil côté contrat | — | `openapi-generator` peut générer les interfaces de contrôleur à implémenter |

springdoc suit l'approche *code-first* : pratique et rapide pour la majorité des projets. L'approche *contract-first*, où le fichier OpenAPI est la source de vérité et où `openapi-generator` génère du code à partir de lui (client ou squelette de contrôleur), est plus adaptée quand le contrat doit être stable et négocié avant l'implémentation.

### Pièges courants

> **Laisser Swagger UI actif en production sans réflexion.** Ce n'est pas automatiquement une faille de sécurité (la documentation ne donne pas accès aux données), mais elle expose la structure interne de l'API à qui la trouve. Décider consciemment, plutôt que de garder la configuration par défaut sans y penser.

> **Oublier que springdoc documente la signature, pas le comportement.** Un endpoint qui peut renvoyer 404 ou 409 selon la logique métier n'affichera que 200 dans la documentation tant que `@ApiResponse` ne le précise pas explicitement.

> **Multiplier les annotations OpenAPI sur des DTO déjà couverts par Bean Validation.** `@NotBlank` génère déjà `required: true` dans le schéma : `@Schema(required = true)` en plus est redondant. Réserver `@Schema` à ce que Bean Validation ne peut pas exprimer (description, exemple).

### À retenir

- `springdoc-openapi-starter-webmvc-ui` génère la documentation depuis le code : `/v3/api-docs` (JSON) et `/swagger-ui.html` (interface interactive).
- `@Tag`, `@Operation`, `@Parameter`, `@Schema`, `@ApiResponse(s)` précisent ce que springdoc ne peut pas déduire seul du code.
- `GroupedOpenApi` permet plusieurs documentations distinctes dans une même application (publique / interne).
- `springdoc.api-docs.enabled` / `springdoc.swagger-ui.enabled` désactivent la documentation, typiquement en production.
- Approche *code-first* (springdoc) par défaut ; *contract-first* avec `openapi-generator` quand le contrat doit précéder le code.
