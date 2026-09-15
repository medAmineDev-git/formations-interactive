---
id: tests-securite
chapitre: tests-avances
ordre: 3
titre: "Tester la sécurité"
termes:
  - terme: spring-security-test
    definition: "Dépendance (scope `test`) qui apporte les utilitaires de test de Spring Security : l'annotation `@WithMockUser`, les *post-processors* MockMvc (`with(user(...))`, `with(csrf())`, `with(jwt())`…) et le support des tests `@WebFluxTest` réactifs."
  - terme: "@WithMockUser"
    definition: "Annotation posée sur une méthode ou une classe de test : place un utilisateur simulé dans le contexte de sécurité **avant** l'exécution du test. `@WithMockUser(username = \"alice\", roles = {\"ADMIN\"})` — les `roles` reçoivent automatiquement le préfixe `ROLE_`, contrairement à `authorities`."
  - terme: "roles vs authorities"
    definition: "`@WithMockUser(roles = \"ADMIN\")` crée l'autorité `ROLE_ADMIN` (préfixe ajouté automatiquement). `@WithMockUser(authorities = \"ADMIN\")` crée l'autorité `ADMIN` telle quelle, sans préfixe. Les deux formes ne sont **pas interchangeables** : `hasRole(\"ADMIN\")` attend `ROLE_ADMIN`, `hasAuthority(\"ADMIN\")` attend `ADMIN`."
  - terme: "Post-processors MockMvc (with(...))"
    definition: "Méthodes statiques de `SecurityMockMvcRequestPostProcessors` passées à `.with(...)` sur une requête `MockMvc`, pour simuler un contexte de sécurité **au niveau de la requête** plutôt que de toute la méthode de test : `with(user(\"alice\").roles(\"ADMIN\"))`, `with(csrf())`, `with(jwt())`, `with(anonymous())`."
  - terme: "with(csrf())"
    definition: "Ajoute un jeton CSRF valide à la requête simulée. Indispensable pour tester un `POST`, `PUT`, `DELETE` ou `PATCH` sur une application où la protection CSRF est active (typiquement, une application avec sessions et formulaires) : sans lui, la requête est rejetée en 403."
  - terme: "with(jwt())"
    definition: "Simule une requête authentifiée par un jeton JWT valide, pour tester un `resource server` OAuth2 (`spring-security-oauth2-resource-server`) sans jeton réel ni serveur d'autorisation. `with(jwt().jwt(builder -> builder.claim(\"scope\", \"produits:lire\")))` personnalise les *claims*."
  - terme: "401 vs 403"
    definition: "**401 Unauthorized** : la requête n'est pas authentifiée (identité inconnue ou jeton absent/invalide). **403 Forbidden** : l'utilisateur est authentifié, mais n'a pas les droits nécessaires pour cette ressource. Confondre les deux dans les tests masque des bugs d'autorisation."
quiz:
  - question: "Ce test échoue avec un statut 403 au lieu du 200 attendu. Quelle est la cause la plus probable ?"
    code: |
      @WebMvcTest(ProduitController.class)
      class ProduitControllerTest {

          @Autowired
          private MockMvc mockMvc;

          @Test
          @WithMockUser(roles = "ADMIN")
          void supprimerProduit_renvoie_204() throws Exception {
              mockMvc.perform(delete("/produits/1"))
                  .andExpect(status().isNoContent());
          }
      }
    choix:
      - "`@WithMockUser` ne fonctionne pas avec `@WebMvcTest`"
      - "Le rôle `ADMIN` n'a pas les droits suffisants"
      - "La protection CSRF rejette la requête `DELETE`, qui n'inclut pas de jeton CSRF valide"
      - "`ProduitController` n'existe pas dans le contexte"
    reponse: 2
    explication: "Avec la protection CSRF active (le cas par défaut pour une application à sessions), toute requête qui modifie l'état (`POST`, `PUT`, `DELETE`, `PATCH`) doit porter un jeton CSRF valide, sinon Spring Security répond 403 **avant** même de vérifier les rôles. Il faut ajouter `.with(csrf())` à la requête simulée."
  - question: "Quelle est la différence entre `@WithMockUser(roles = \"ADMIN\")` et `@WithMockUser(authorities = \"ADMIN\")` ?"
    choix:
      - "Aucune, ce sont deux syntaxes équivalentes"
      - "`roles` ajoute automatiquement le préfixe `ROLE_` à l'autorité créée, `authorities` ne l'ajoute pas"
      - "`authorities` fonctionne uniquement avec OAuth2"
      - "`roles` ne fonctionne que dans les tests `@WebMvcTest`"
    reponse: 1
    explication: "`roles = \"ADMIN\"` crée l'autorité `ROLE_ADMIN` (le préfixe est ajouté pour vous, comme le fait `.hasRole(\"ADMIN\")` côté configuration). `authorities = \"ADMIN\"` crée l'autorité `ADMIN` exactement telle quelle. Utiliser la mauvaise forme est une cause fréquente de faux 403 dans les tests : la règle attend un nom d'autorité que le test ne produit pas."
  - question: "Pourquoi faut-il ajouter `@Import(SecurityConfig.class)` à ce test `@WebMvcTest` pour qu'il vérifie vraiment les règles d'autorisation de l'application ?"
    code: |
      @WebMvcTest(ProduitController.class)
      @Import(SecurityConfig.class)
      class ProduitControllerSecuriteTest {
          @Autowired
          private MockMvc mockMvc;
      }
    choix:
      - "`@Import` n'a aucun effet sur un test `@WebMvcTest`"
      - "`@WebMvcTest` ne charge que les composants de la couche web (contrôleurs, convertisseurs…) ; une classe `@Configuration` comme `SecurityConfig`, qui définit le `SecurityFilterChain`, doit être importée explicitement pour faire partie du contexte du test"
      - "`SecurityConfig` est toujours chargée par défaut, `@Import` sert seulement à la documentation"
      - "C'est nécessaire uniquement si l'application utilise OAuth2"
    reponse: 1
    explication: "Le test slice `@WebMvcTest` ne scanne pas les classes `@Configuration` générales. Sans `@Import(SecurityConfig.class)`, le test s'exécute soit avec la configuration de sécurité par défaut de Spring Boot, soit sans les règles spécifiques de l'application (selon ce qui est présent sur le classpath) — pas avec les vraies règles d'autorisation définies dans `SecurityConfig`."
---

## Essentiel

`spring-security-test` fournit tout ce qu'il faut pour tester l'authentification et l'autorisation sans vrai jeton ni vrai utilisateur en base : l'annotation `@WithMockUser` et des *post-processors* MockMvc.

```java
@WebMvcTest(ProduitController.class)
@Import(SecurityConfig.class)
class ProduitControllerSecuriteTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProduitService produitService;

    @Test
    void supprimerProduit_sansAuthentification_renvoie_401() throws Exception {
        mockMvc.perform(delete("/produits/1"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void supprimerProduit_avecRoleInsuffisant_renvoie_403() throws Exception {
        mockMvc.perform(delete("/produits/1").with(csrf()))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void supprimerProduit_avecRoleAdmin_renvoie_204() throws Exception {
        mockMvc.perform(delete("/produits/1").with(csrf()))
            .andExpect(status().isNoContent());
    }
}
```

`@WithMockUser` place un utilisateur simulé dans le contexte de sécurité pour toute la durée du test. `.with(csrf())` ajoute un jeton CSRF valide à la requête, nécessaire pour les méthodes qui modifient l'état si la protection CSRF est active. `@WebMvcTest` ne charge pas automatiquement une classe `@Configuration` personnalisée : il faut `@Import(SecurityConfig.class)` pour tester les vraies règles d'autorisation de l'application.

## Détail

### Exemple 1 — @WithMockUser, rôles et autorités

```java
@Test
@WithMockUser(username = "alice", roles = {"ADMIN", "USER"})
void adminEtUser_accede_au_tableau_de_bord() throws Exception {
    mockMvc.perform(get("/admin/tableau-de-bord"))
        .andExpect(status().isOk());
}

@Test
@WithMockUser(username = "bob", authorities = {"produits:ecrire"})
void utilisateurAvecAutoritePersonnalisee_peut_creer_un_produit() throws Exception {
    mockMvc.perform(post("/produits").with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nom\":\"Clavier\",\"prix\":49.90}"))
        .andExpect(status().isCreated());
}
```

`roles` convient pour un modèle simple par rôle (`hasRole("ADMIN")` côté configuration). `authorities` convient pour un modèle plus fin, par permission (`hasAuthority("produits:ecrire")`) — de plus en plus courant, car il découple les droits du nom du rôle.

### Exemple 2 — Post-processors plutôt que l'annotation

```java
@Test
void suppression_avec_utilisateur_specifie_dans_la_requete() throws Exception {
    mockMvc.perform(delete("/produits/1")
            .with(user("alice").roles("ADMIN"))
            .with(csrf()))
        .andExpect(status().isNoContent());
}

@Test
void requete_anonyme_est_bien_rejetee() throws Exception {
    mockMvc.perform(get("/admin/tableau-de-bord").with(anonymous()))
        .andExpect(status().isUnauthorized());
}
```

`.with(user(...))` fait la même chose que `@WithMockUser`, mais au niveau d'une **requête précise** plutôt que de toute la méthode de test — pratique quand une méthode enchaîne plusieurs appels avec des utilisateurs différents.

### Exemple 3 — Tester un resource server JWT

```java
@Test
void lireProduits_avecJwtEtScopeValide_renvoie_200() throws Exception {
    mockMvc.perform(get("/produits")
            .with(jwt().jwt(jwtBuilder -> jwtBuilder.claim("scope", "produits:lire"))))
        .andExpect(status().isOk());
}

@Test
void lireProduits_sansJwt_renvoie_401() throws Exception {
    mockMvc.perform(get("/produits"))
        .andExpect(status().isUnauthorized());
}
```

`with(jwt())` simule une authentification par jeton JWT valide sans avoir besoin d'un vrai serveur d'autorisation ni de générer un jeton signé — utile pour tester une API protégée par `spring-security-oauth2-resource-server` (voir la sécurité, niveau intermédiaire).

### Exemple 4 — @SpringBootTest et sécurité de bout en bout

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProduitApiSecuriteIT {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void suppression_sansAuthentification_renvoie_401() {
        ResponseEntity<Void> reponse = restTemplate.exchange(
            "/produits/1", HttpMethod.DELETE, null, Void.class);

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void suppression_avecAuthentificationBasique_renvoie_204() {
        ResponseEntity<Void> reponse = restTemplate
            .withBasicAuth("admin", "motdepasse")
            .exchange("/produits/1", HttpMethod.DELETE, null, Void.class);

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }
}
```

Avec un vrai serveur (`RANDOM_PORT`), les post-processors MockMvc n'existent plus — ils simulent une requête au niveau du `DispatcherServlet`, sans passer par une vraie connexion réseau. `TestRestTemplate` propose ses propres méthodes d'authentification (`withBasicAuth`) pour ce type de test bout-en-bout.

### Pièges courants

> **Oublier `.with(csrf())` sur une requête qui modifie l'état.** Une application avec sessions (formulaires web classiques) active la protection CSRF par défaut : un `POST`/`PUT`/`DELETE`/`PATCH` simulé sans jeton CSRF échoue en 403, **avant même** que les règles d'autorisation ne soient évaluées. Ce n'est pas le cas pour une API purement stateless en JWT, où CSRF est généralement désactivé.

> **Confondre `roles` et `authorities` dans `@WithMockUser`.** `roles = "ADMIN"` crée `ROLE_ADMIN` ; si la configuration attend `hasAuthority("ADMIN")` (sans préfixe), le test échoue en 403 alors que le rôle semble correct à la lecture.

> **Tester `@WebMvcTest` sans importer la vraie configuration de sécurité.** Sans `@Import(SecurityConfig.class)`, le test peut passer avec la configuration de sécurité par défaut de Spring Boot (souvent plus permissive ou différente) au lieu des vraies règles d'autorisation de l'application — un faux positif dangereux : le test vérifie la sécurité, mais pas la bonne.

### À retenir

- `spring-security-test` fournit `@WithMockUser` et les post-processors MockMvc (`with(user(...))`, `with(csrf())`, `with(jwt())`).
- `roles` ajoute le préfixe `ROLE_` automatiquement ; `authorities` non — les deux ne sont pas interchangeables.
- `.with(csrf())` est nécessaire pour les requêtes qui modifient l'état si la protection CSRF est active.
- Vérifiez systématiquement les deux cas : **401** (non authentifié) et **403** (authentifié mais sans les droits).
- `@WebMvcTest` n'importe pas automatiquement une classe `@Configuration` personnalisée : `@Import(SecurityConfig.class)` est nécessaire pour tester les vraies règles d'autorisation.
