---
id: web-mvc-test
chapitre: tests
ordre: 3
titre: "Tester un contrôleur avec @WebMvcTest et MockMvc"
termes:
  - terme: Test slice
    definition: "Un test qui ne charge qu'une **partie** du contexte Spring, ciblée sur une couche (web, JPA…), au lieu de toute l'application. Plus rapide que `@SpringBootTest`, tout en testant du vrai code Spring (pas seulement une classe isolée)."
  - terme: "@WebMvcTest"
    definition: "Test slice pour la couche web : charge uniquement les contrôleurs, la configuration MVC (Jackson, validation, gestion des erreurs) et un `MockMvc`, **sans** les couches service ou repository. `@WebMvcTest(CommandeController.class)` cible un seul contrôleur ; sans argument, tous les contrôleurs sont chargés."
  - terme: MockMvc
    definition: "Client qui simule des requêtes HTTP **sans démarrer de serveur réel**. `mockMvc.perform(get(\"/commandes/1\"))` envoie la requête au contrôleur, en passant par la vraie chaîne Spring MVC (désérialisation, validation, sérialisation JSON)."
  - terme: "andExpect"
    definition: "Vérifie un aspect de la réponse simulée : `status().isOk()`, `jsonPath(\"$.nom\").value(\"Clavier\")`, `content().contentType(MediaType.APPLICATION_JSON)`. Plusieurs `andExpect` peuvent s'enchaîner sur un même `perform`."
  - terme: JsonPath
    definition: "Syntaxe pour naviguer dans un JSON par chemin, comme XPath pour le XML. `$.nom` lit le champ `nom` à la racine, `$.lignes[0].prix` le prix de la première ligne d'un tableau."
  - terme: "@MockitoBean (dans un test slice)"
    definition: "Comme dans `@SpringBootTest`, remplace un bean par un mock. Dans un `@WebMvcTest`, indispensable pour fournir le `Service` attendu par le contrôleur : ce bean n'existe pas dans ce contexte réduit, il faut le mocker."
  - terme: ObjectMapper
    definition: "Composant Jackson qui convertit un objet Java en JSON et inversement. Dans un test, `objectMapper.writeValueAsString(dto)` prépare le corps JSON d'une requête POST simulée."
quiz:
  - question: "Pourquoi un `@WebMvcTest(CommandeController.class)` a-t-il besoin d'un `@MockitoBean` pour `CommandeService` ?"
    choix:
      - "Parce que `CommandeService` n'existe pas vraiment dans l'application"
      - "Parce que `@WebMvcTest` ne charge que la couche web : les beans `@Service` ne font pas partie du contexte réduit, il faut donc fournir un mock à la place"
      - "Parce que `@MockitoBean` est obligatoire dans tous les tests Spring"
      - "Parce que `CommandeService` doit être `@Primary`"
    reponse: 1
    explication: "`@WebMvcTest` charge uniquement les contrôleurs et la configuration MVC. Le contrôleur a besoin d'un `CommandeService` injecté ; comme ce bean n'est pas dans le contexte, `@MockitoBean` en fournit un mock pour que le contexte démarre et pour contrôler son comportement (`when(...).thenReturn(...)`)."
  - question: "Que vérifie cet appel MockMvc ?"
    code: |
      mockMvc.perform(get("/produits/1"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.nom").value("Clavier"));
    choix:
      - "Que la base de données contient bien un produit nommé « Clavier »"
      - "Que la requête GET renvoie un statut 200 et que le champ `nom` du JSON de réponse vaut « Clavier »"
      - "Que le contrôleur appelle bien `ProduitService.trouver(1)`"
      - "Que la réponse est vide"
    reponse: 1
    explication: "`status().isOk()` vérifie le code HTTP 200. `jsonPath(\"$.nom\").value(\"Clavier\")` lit le champ `nom` du corps JSON et vérifie sa valeur. `@WebMvcTest` ne touche pas la base de données : le contenu vient du mock du service, configuré avec `when(...)`."
  - question: "Quel test choisir pour vérifier qu'une requête POST invalide (champ obligatoire manquant) renvoie bien un statut 400, sans dépendre de la base de données ?"
    choix:
      - "Un test unitaire pur, avec `new CommandeController(...)`"
      - "`@WebMvcTest` avec MockMvc : la validation Bean Validation et la gestion des erreurs font partie de la couche web testée"
      - "`@SpringBootTest(webEnvironment = RANDOM_PORT)` uniquement"
      - "`@DataJpaTest`"
    reponse: 1
    explication: "La validation (`@Valid`) et la conversion en réponse 400 sont gérées par la couche MVC, exactement ce que charge `@WebMvcTest`. Un test unitaire pur n'exécute pas cette mécanique Spring. `@SpringBootTest` fonctionnerait aussi mais chargerait tout le contexte inutilement, plus lentement. `@DataJpaTest` cible la couche JPA, pas la couche web."
---

## Essentiel

`@WebMvcTest` est un **test slice** : il ne charge que la couche web (contrôleurs, Jackson, validation, gestion des erreurs), pas les services ni les repositories. Beaucoup plus rapide qu'un `@SpringBootTest` complet, tout en testant le vrai comportement HTTP.

```java
@WebMvcTest(ProduitController.class)
class ProduitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProduitService produitService; // le service n'est pas chargé, on le mocke

    @Test
    void getProduit_renvoie_le_produit() throws Exception {
        when(produitService.trouver(1L)).thenReturn(new Produit(1L, "Clavier", 49.90));

        mockMvc.perform(get("/produits/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nom").value("Clavier"))
            .andExpect(jsonPath("$.prix").value(49.90));
    }
}
```

`MockMvc` simule une requête HTTP sans ouvrir de port réseau : `perform(get(...))` envoie la requête, `andExpect(...)` vérifie la réponse (statut, en-têtes, corps JSON via `jsonPath`). Comme le service n'est pas dans ce contexte réduit, `@MockitoBean` fournit un mock à la place du vrai bean, injecté dans le contrôleur.

## Détail

### Exemple 1 — Statut, contenu et en-têtes

```java
mockMvc.perform(get("/produits/1"))
    .andExpect(status().isOk())
    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
    .andExpect(jsonPath("$.id").value(1))
    .andExpect(jsonPath("$.nom").value("Clavier"));
```

`jsonPath` lit le JSON de la réponse par chemin. Utile aussi sur des tableaux : `jsonPath("$.lignes", hasSize(2))` (avec Hamcrest).

### Exemple 2 — POST avec un corps JSON

```java
@Autowired
private ObjectMapper objectMapper;

@Test
void creerProduit_renvoie_201() throws Exception {
    ProduitDto dto = new ProduitDto("Souris", 19.90);
    when(produitService.creer(any())).thenReturn(new Produit(2L, "Souris", 19.90));

    mockMvc.perform(post("/produits")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(2));
}
```

`ObjectMapper` (bean Jackson, déjà présent dans le contexte `@WebMvcTest`) sérialise le DTO en JSON pour construire le corps de la requête simulée.

### Exemple 3 — Tester une erreur de validation (400)

```java
@Test
void creerProduit_sansNom_renvoie_400() throws Exception {
    ProduitDto dtoInvalide = new ProduitDto(null, 19.90); // @NotBlank sur nom

    mockMvc.perform(post("/produits")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dtoInvalide)))
        .andExpect(status().isBadRequest());
}
```

Si le contrôleur utilise `@Valid` sur son DTO (voir le chapitre API REST), la validation s'exécute réellement : `@WebMvcTest` charge cette mécanique, contrairement à un test unitaire du contrôleur seul.

### Exemple 4 — Tester une ressource introuvable (404)

```java
@Test
void getProduit_inexistant_renvoie_404() throws Exception {
    when(produitService.trouver(99L)).thenThrow(new ProduitIntrouvableException(99L));

    mockMvc.perform(get("/produits/99"))
        .andExpect(status().isNotFound());
}
```

Le mock simule l'exception métier ; le test vérifie que le `@ExceptionHandler` (ou `@ControllerAdvice`) du contrôleur la traduit bien en 404 — sans jamais toucher une vraie base de données.

### Quel test choisir ?

| | Test unitaire | `@WebMvcTest` | `@SpringBootTest` |
|---|---|---|---|
| Contexte Spring chargé | Aucun | Couche web seulement | Complet |
| Vitesse | Très rapide | Rapide | Plus lent |
| Ce qui est vérifié | Logique d'une classe isolée | Routage, JSON, validation, gestion des erreurs HTTP | Intégration réelle de toutes les couches |
| Dépendances | Mocks manuels (`@Mock`) | `@MockitoBean` pour les services | Vrais beans (ou `@MockitoBean` ponctuel) |
| Base de données | Non concernée | Non chargée | Chargée (souvent H2 de test) |

Il existe aussi `@DataJpaTest`, un test slice pour la couche JPA (entités, repositories, base H2 en mémoire), qui sera vu plus en détail au niveau intermédiaire avec Testcontainers.

### Pièges courants

> **Oublier `@MockitoBean` pour le service.** Sans lui, le contexte `@WebMvcTest` échoue au démarrage : le contrôleur attend un bean `ProduitService` qui n'existe pas dans ce contexte réduit (*« required a bean of type … that could not be found »*).

> **Confondre `@WebMvcTest` et `@SpringBootTest` pour tester un contrôleur.** `@SpringBootTest` fonctionne aussi, mais charge inutilement les repositories, la base de données et tous les autres beans : plus lent, pour un résultat souvent identique sur la couche web.

> **`content().json(...)` avec un ordre de champs différent.** Comparer un JSON complet avec `content().json(attendu)` peut sembler fragile ; `jsonPath` sur les champs importants est en général plus robuste et plus lisible en cas d'échec.

### À retenir

- `@WebMvcTest` est un test slice : seule la couche web est chargée, plus rapide qu'un `@SpringBootTest` complet.
- `MockMvc` simule des requêtes HTTP sans serveur réel ; `andExpect` vérifie statut, en-têtes et JSON (`jsonPath`).
- Les beans `@Service` n'étant pas chargés, `@MockitoBean` fournit un mock au contrôleur.
- Ce test slice est idéal pour vérifier le routage, la sérialisation JSON, la validation (400) et la gestion des erreurs (404).
- `@DataJpaTest` fait la même chose pour la couche JPA — détaillé au niveau intermédiaire.
