---
id: jwt-oauth2
chapitre: securite
ordre: 4
titre: "API stateless : JWT et OAuth2 Resource Server"
termes:
  - terme: JWT (JSON Web Token)
    definition: "Jeton composé de trois parties séparées par des points et encodées en Base64Url : `en-tête.charge utile.signature`. L'en-tête décrit l'algorithme de signature, la charge utile (« payload ») contient des informations (« claims ») comme l'émetteur ou l'expiration, la signature garantit que le jeton n'a pas été modifié."
  - terme: SessionCreationPolicy.STATELESS
    definition: "Politique de session qui indique à Spring Security de ne **jamais** créer ni utiliser de session HTTP. Chaque requête est authentifiée indépendamment, à partir du jeton qu'elle transporte."
  - terme: spring-boot-starter-oauth2-resource-server
    definition: "Dépendance qui ajoute le support « resource server » de Spring Security : valider un jeton (JWT le plus souvent) envoyé par un client, sans gérer soi-même la connexion des utilisateurs."
  - terme: "issuer-uri / jwk-set-uri"
    definition: "Propriétés `spring.security.oauth2.resourceserver.jwt.issuer-uri` (l'identifiant de l'émetteur, ex. une URL Keycloak) et `...jwk-set-uri` (l'adresse où récupérer les clés publiques de vérification). Avec `issuer-uri`, Spring Security peut découvrir automatiquement les autres informations, dont `jwk-set-uri`, via un point de découverte standard."
  - terme: "http.oauth2ResourceServer(...)"
    definition: "Méthode de configuration DSL sur `HttpSecurity` qui active la validation des jetons entrants : `http.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))`."
  - terme: "Scope → SCOPE_"
    definition: "Par défaut, chaque scope présent dans le claim `scope` (ou `scp`) d'un JWT est converti en une autorité Spring Security préfixée par `SCOPE_` (le scope `read` devient l'autorité `SCOPE_read`), utilisable avec `hasAuthority(\"SCOPE_read\")`."
  - terme: "Authorization: Bearer"
    definition: "En-tête HTTP par lequel le client transmet le jeton à chaque requête : `Authorization: Bearer <jwt>`. « Bearer » (porteur) signifie que quiconque possède le jeton peut l'utiliser, d'où l'importance de le transmettre uniquement en HTTPS et de ne jamais le logger."
quiz:
  - question: "Pourquoi une API stateless (consommée par des clients mobiles et des SPA) préfère-t-elle un JWT à une session HTTP classique ?"
    choix:
      - "Un JWT est plus court qu'un identifiant de session"
      - "Avec un jeton auto-porteur, le serveur n'a rien à stocker par utilisateur : n'importe quelle instance peut vérifier la signature et répondre, ce qui simplifie le passage à l'échelle horizontal"
      - "Un JWT ne peut pas expirer, contrairement à une session"
      - "Les sessions HTTP ne fonctionnent pas avec HTTPS"
    reponse: 1
    explication: "Une session classique oblige à retrouver son état côté serveur (en mémoire ou dans un stockage partagé) à chaque requête, ce qui complique le passage à plusieurs instances. Un JWT signé est auto-suffisant : n'importe quel serveur qui connaît la clé de vérification peut valider la requête, sans rien avoir stocké au préalable. Les JWT ont bien une expiration, portée par le claim `exp`."
  - question: "Avec cette configuration, que se passe-t-il pour une requête `GET /api/commandes` sans en-tête `Authorization` ?"
    code: |
      http
          .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
          .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
          .authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
    choix:
      - "La requête passe, l'utilisateur est considéré comme anonyme"
      - "401 Unauthorized : aucune authentification n'a pu être établie"
      - "500 Internal Server Error"
      - "La requête est mise en attente jusqu'à ce qu'un jeton soit fourni"
    reponse: 1
    explication: "`anyRequest().authenticated()` exige une authentification. Sans en-tête `Authorization`, aucun jeton n'est présenté : l'`AuthorizationFilter` bloque la requête et l'`ExceptionTranslationFilter` la traduit en **401**, sans redirection possible vers une page de login puisqu'il n'y en a pas dans une configuration purement stateless."
  - question: "Un JWT contient le claim `\"scope\": \"read write\"`. Quelle expression protège une méthode pour exiger le scope `write` ?"
    choix:
      - "`@PreAuthorize(\"hasAuthority('write')\")`"
      - "`@PreAuthorize(\"hasAuthority('SCOPE_write')\")`"
      - "`@PreAuthorize(\"hasRole('write')\")`"
      - "`@PreAuthorize(\"hasScope('write')\") `— méthode qui n'existe pas par défaut"
    reponse: 1
    explication: "Le convertisseur JWT par défaut transforme chaque scope en autorité préfixée `SCOPE_`. `hasAuthority(\"SCOPE_write\")` est donc la forme correcte. `hasRole` chercherait `ROLE_write`, un préfixe différent qui ne correspond pas à la conversion appliquée aux scopes."
---

## Essentiel

Pour une API **stateless**, consommée par des clients qu'on ne contrôle pas forcément (application mobile, SPA, autre service), le couple session + cookie est mal adapté : il faudrait partager l'état de session entre toutes les instances du serveur. La solution largement adoptée est le **JWT** : un jeton signé, auto-suffisant, que le client envoie à chaque requête dans l'en-tête `Authorization: Bearer <jwt>`.

Spring Security ne fabrique pas ces jetons lui-même dans ce rôle : il joue le rôle de **resource server**, qui se contente de **vérifier** un jeton émis par un fournisseur d'identité externe (Keycloak, Auth0, Okta, Azure AD…).

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://mon-fournisseur.exemple.com/realms/boutique
```

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/public/**").permitAll()
            .anyRequest().authenticated()
        )
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
    return http.build();
}
```

Avec `issuer-uri` seul, Spring Security va chercher automatiquement les clés publiques nécessaires à la vérification de la signature. Aucun filtre « fait maison » n'est nécessaire.

## Détail

### Structure d'un JWT

```
eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJhbGljZSIsInNjb3BlIjoicmVhZCB3cml0ZSIsImV4cCI6MTcxMDAwMDAwMH0.signature...
```

- **En-tête** (`header`) : algorithme de signature (`alg`), type (`JWT`).
- **Charge utile** (`payload`) : les *claims*, par exemple `sub` (le sujet, souvent l'identifiant utilisateur), `iss` (l'émetteur), `exp` (expiration), `scope`.
- **Signature** : calculée par le fournisseur d'identité avec sa clé privée. Le resource server la vérifie avec la clé **publique** correspondante, sans jamais connaître la clé privée.

Le payload est seulement encodé en Base64Url, **pas chiffré** : n'importe qui peut le lire. Ne jamais y placer d'information sensible (mot de passe, numéro de carte…).

### Comment Spring Security vérifie un jeton

1. Il extrait le jeton de l'en-tête `Authorization: Bearer ...`.
2. Il vérifie la **signature**, avec la clé publique récupérée via `jwk-set-uri` (« JSON Web Key Set »), déduit automatiquement de `issuer-uri` par un mécanisme de découverte standard, ou fourni directement.
3. Il vérifie les claims temporels (`exp` non dépassé) et l'émetteur (`iss` correspond à `issuer-uri`).
4. Si tout est valide, un `JwtAuthenticationConverter` construit une `Authentication` à partir des claims (le `sub` comme nom du principal, les scopes convertis en autorités `SCOPE_*`), placée dans le `SecurityContextHolder`.

### Exemple 1 — Protéger par scope

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.GET, "/api/commandes/**").hasAuthority("SCOPE_read")
            .requestMatchers(HttpMethod.POST, "/api/commandes/**").hasAuthority("SCOPE_write")
            .anyRequest().authenticated()
        )
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
    return http.build();
}
```

### Exemple 2 — Extraire des informations du jeton dans un contrôleur

```java
@GetMapping("/moi")
public String moi(@AuthenticationPrincipal Jwt jwt) {
    return jwt.getSubject(); // la valeur du claim "sub"
}
```

`Jwt` expose aussi `getClaimAsString("email")`, `getIssuedAt()`, `getExpiresAt()`… selon ce que le fournisseur d'identité inclut dans le jeton.

### Exemple 3 — Des rôles métier plutôt que des scopes techniques

Beaucoup de fournisseurs placent aussi des rôles applicatifs dans un claim personnalisé (ex. `realm_access.roles` chez Keycloak). Le convertisseur par défaut ne les transforme pas automatiquement en `ROLE_*` ; il faut fournir son propre `Converter<Jwt, Collection<GrantedAuthority>>` :

```java
@Bean
JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter(); // conversion standard des scopes
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(jwt -> {
        var authorities = new ArrayList<>(scopes.convert(jwt));
        // + extraction des rôles spécifiques au fournisseur, ajoutés avec le préfixe ROLE_
        return authorities;
    });
    return converter;
}
```

Le détail exact de l'extraction dépend du format propre à chaque fournisseur d'identité ; c'est un point à vérifier dans sa documentation plutôt qu'à deviner.

### Pourquoi éviter un filtre JWT « fait maison »

Un filtre `OncePerRequestFilter` qui décode le jeton soi-même est tentant, mais il doit réimplémenter correctement : vérification de signature avec rotation des clés, expiration, algorithmes autorisés (refuser `alg: none`), gestion des erreurs traduite en 401… Le support intégré (`oauth2ResourceServer().jwt(...)`) gère déjà tout cela, avec un code revu et maintenu par le projet Spring Security. Réinventer cette brique augmente le risque d'une faille de vérification.

### Pièges courants

> **Oublier `SessionCreationPolicy.STATELESS`.** Sans elle, Spring Security peut quand même créer une session (par exemple pour stocker le contexte de sécurité), ce qui n'a pas de sens pour une API purement à base de jetons et complique le passage à l'échelle.

> **Confondre authentification et autorisation du jeton.** Un JWT valide (signature correcte, non expiré) prouve seulement **qui** est l'appelant. Il faut ensuite, comme pour toute autorisation, décider **ce qu'il a le droit de faire** avec `hasAuthority("SCOPE_...")` ou des règles métier.

> **Stocker des données sensibles dans le payload.** Le JWT n'est qu'encodé, pas chiffré : toute personne interceptant le jeton peut lire son contenu.

### À retenir

- Un JWT est signé, pas chiffré : `header.payload.signature`, tout est lisible sauf falsifiable.
- `SessionCreationPolicy.STATELESS` + `oauth2ResourceServer(oauth2 -> oauth2.jwt(...))` : chaque requête est vérifiée indépendamment, sans session.
- `issuer-uri` suffit dans le cas courant : Spring Security découvre le reste, dont `jwk-set-uri`.
- Les scopes du jeton deviennent des autorités `SCOPE_*` par défaut ; les rôles métier spécifiques à un fournisseur demandent souvent un `JwtAuthenticationConverter` personnalisé.
- Préférer le support intégré à un filtre JWT maison : la vérification de signature est un point sensible, déjà correctement traité par Spring Security.
