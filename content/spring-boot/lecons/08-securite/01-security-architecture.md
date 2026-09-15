---
id: security-architecture
chapitre: securite
ordre: 1
titre: "Architecture de Spring Security : la chaîne de filtres"
termes:
  - terme: spring-boot-starter-security
    definition: "Dépendance qui active Spring Security. Dès son ajout, **toutes** les requêtes sont protégées : un utilisateur `user` est créé avec un mot de passe généré aléatoirement, affiché une seule fois dans les logs au démarrage."
  - terme: DelegatingFilterProxy
    definition: "Filtre standard **Servlet** enregistré dans le conteneur (Tomcat…) par Spring Boot. Son seul rôle est de déléguer chaque requête à un bean Spring nommé `springSecurityFilterChain` : le pont entre le monde Servlet et le monde Spring."
  - terme: FilterChainProxy
    definition: "Le bean `springSecurityFilterChain` lui-même. Il contient la **liste** des `SecurityFilterChain` de l'application et choisit, pour chaque requête, la première dont le `RequestMatcher` correspond à l'URL."
  - terme: SecurityFilterChain
    definition: "Bean déclaré avec une méthode `@Bean` retournant `SecurityFilterChain`, construit via l'objet `HttpSecurity` et sa **DSL lambda** (`http.authorizeHttpRequests(auth -> ...)`). Il définit la liste ordonnée des filtres de sécurité pour un ensemble de requêtes."
  - terme: SecurityContextHolder
    definition: "Point d'accès **statique** au `SecurityContext` courant, qui contient l'`Authentication` de l'utilisateur. Stockage par défaut : un `ThreadLocal`, donc valable pour le thread qui traite la requête."
  - terme: Authentication
    definition: "Interface qui représente l'utilisateur authentifié (ou la tentative d'authentification) : le principal (souvent un `UserDetails`), ses `credentials`, et ses autorités (`GrantedAuthority`)."
  - terme: ExceptionTranslationFilter
    definition: "Filtre qui intercepte les exceptions de sécurité (`AuthenticationException`, `AccessDeniedException`) levées plus loin dans la chaîne et les traduit en réponse HTTP : redirection vers le login, 401 ou 403."
quiz:
  - question: "Un développeur ajoute uniquement `spring-boot-starter-security` au `pom.xml`, sans aucune classe de configuration. Il relance l'application. Que se passe-t-il ?"
    choix:
      - "Rien : la sécurité reste désactivée tant qu'on n'écrit pas de `SecurityFilterChain`"
      - "Toutes les routes sont protégées ; un utilisateur `user` est créé avec un mot de passe généré, visible dans les logs de démarrage"
      - "L'application refuse de démarrer tant qu'un `UserDetailsService` n'est pas fourni"
      - "Seules les routes `/admin/**` sont protégées par défaut"
    reponse: 1
    explication: "L'auto-configuration de Spring Boot réagit à la seule présence du starter sur le classpath : elle protège tout par défaut et crée un utilisateur de secours. Le mot de passe change à chaque démarrage et n'apparaît qu'une fois dans la console, sous une ligne du type « Using generated security password: ... »."
  - question: "Que fait ce bean, concrètement ?"
    code: |
      @Bean
      SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
          http.authorizeHttpRequests(auth -> auth
              .requestMatchers("/public/**").permitAll()
              .anyRequest().authenticated()
          );
          return http.build();
      }
    choix:
      - "Il remplace le `DelegatingFilterProxy` par un filtre personnalisé"
      - "Il construit, via la DSL de `HttpSecurity`, la liste ordonnée des filtres appliqués aux requêtes de cette application, ici avec une règle d'autorisation"
      - "Il crée directement le `FilterChainProxy` enregistré dans Tomcat"
      - "Il ne s'applique qu'aux requêtes qui ne correspondent à aucune autre `SecurityFilterChain`"
    reponse: 1
    explication: "`HttpSecurity` est un constructeur qui accumule la configuration (ici l'autorisation) puis produit, avec `build()`, un `SecurityFilterChain` : la liste de filtres réellement exécutée pour les requêtes couvertes par ce bean. C'est le `FilterChainProxy`, lui, qui choisit ensuite quelle chaîne utiliser selon l'URL."
  - question: "Où Spring Security range-t-il l'`Authentication` de l'utilisateur pendant le traitement d'une requête ?"
    choix:
      - "Dans la session HTTP uniquement"
      - "Dans le `SecurityContextHolder`, qui l'expose via un `SecurityContext` (stockage `ThreadLocal` par défaut)"
      - "Dans un cookie signé, relu à chaque filtre"
      - "Dans le contexte Spring (`ApplicationContext`), comme un bean supplémentaire"
    reponse: 1
    explication: "`SecurityContextHolder.getContext().getAuthentication()` est le point d'accès utilisé partout, y compris par `@PreAuthorize` ou `SecurityContextHolder.getContext().getAuthentication().getName()` dans un contrôleur. Le stockage par défaut est un `ThreadLocal` : il ne survit pas automatiquement d'une requête à l'autre, c'est un filtre (`SecurityContextHolderFilter`) qui le recharge depuis la session à chaque requête, quand la session existe."
---

## Essentiel

Spring Security fonctionne comme une **chaîne de filtres Servlet**, placée devant vos contrôleurs. Dès que `spring-boot-starter-security` est sur le classpath, l'auto-configuration protège **toutes** les routes et crée un utilisateur `user` avec un mot de passe généré, affiché une fois dans les logs.

Le mécanisme, en résumé :

1. Le conteneur Servlet (Tomcat…) appelle un unique filtre, le `DelegatingFilterProxy`, enregistré par Spring Boot.
2. Ce filtre délègue au bean Spring `springSecurityFilterChain`, qui est en réalité un `FilterChainProxy`.
3. Le `FilterChainProxy` choisit, parmi les `SecurityFilterChain` déclarées, la première dont l'URL correspond, et exécute sa propre liste de filtres (authentification, contexte de sécurité, autorisation…).

On configure une `SecurityFilterChain` avec la **DSL lambda**, seule syntaxe recommandée depuis Spring Security 5.7 (l'ancienne API fluide chaînée, et `WebSecurityConfigurerAdapter`, sont supprimées) :

```java
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(Customizer.withDefaults());
        return http.build();
    }
}
```

Dès qu'un bean `SecurityFilterChain` est déclaré, il remplace la configuration par défaut de Spring Boot.

## Détail

### Comment ça marche, filtre par filtre

Le `FilterChainProxy` n'est pas un filtre parmi d'autres : c'est un **conteneur de chaînes**. Chaque `SecurityFilterChain` associe un `RequestMatcher` (souvent implicite : toutes les requêtes) à une liste ordonnée de filtres. Sans être exhaustif, on y retrouve typiquement, dans cet ordre :

1. **`SecurityContextHolderFilter`** — recharge le `SecurityContext` (depuis la session, s'il y en a une) au début de la requête.
2. **`CsrfFilter`** — vérifie le jeton CSRF sur les requêtes qui modifient l'état.
3. **`UsernamePasswordAuthenticationFilter`** — traite la soumission du formulaire de login (`formLogin`).
4. **`BasicAuthenticationFilter`** — traite l'en-tête `Authorization: Basic ...` (`httpBasic`).
5. **`ExceptionTranslationFilter`** — capture les exceptions de sécurité et déclenche une redirection ou une réponse d'erreur.
6. **`AuthorizationFilter`** — dernier filtre de la chaîne : applique les règles d'`authorizeHttpRequests` et autorise ou bloque la requête.

Chaque filtre a une responsabilité précise ; ils s'exécutent dans l'ordre à chaque requête qui entre dans la chaîne.

### Exemple 1 — Voir le mot de passe généré

Sans aucune configuration, au démarrage, la console affiche une ligne proche de :

```
Using generated security password: 8e557245-73e2-4286-969a-ff57fe326336
```

Cet utilisateur `user` n'est là que pour vérifier rapidement que la sécurité est active. Il ne doit jamais servir en production : la première chose à faire est de déclarer sa propre authentification.

### Exemple 2 — Plusieurs `SecurityFilterChain`

```java
@Configuration
public class SecurityConfig {

    @Bean
    @Order(1)
    SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/api/**")
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .csrf(csrf -> csrf.disable()); // API sans session : pas de CSRF
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain webChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .formLogin(Customizer.withDefaults());
        return http.build();
    }
}
```

`securityMatcher(...)` restreint la chaîne à un préfixe d'URL. `@Order` fixe l'ordre d'évaluation : le `FilterChainProxy` teste les chaînes dans cet ordre et utilise la première qui correspond.

### Exemple 3 — Consulter l'utilisateur courant dans un contrôleur

```java
@GetMapping("/moi")
public String moi() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    return auth.getName(); // le username, ou "anonymousUser" si personne n'est authentifié
}
```

Spring MVC propose aussi une injection plus directe, sans passer par le holder :

```java
@GetMapping("/moi")
public String moi(Authentication auth) {
    return auth.getName();
}
```

### Comparaison rapide

| Composant | Rôle |
|---|---|
| `DelegatingFilterProxy` | Pont Servlet → Spring, enregistré une seule fois |
| `FilterChainProxy` | Choisit la bonne `SecurityFilterChain` selon l'URL |
| `SecurityFilterChain` | Liste ordonnée de filtres pour un ensemble de requêtes |
| `SecurityContextHolder` | Accès à l'`Authentication` courante pendant la requête |

### Pièges courants

> **Déclarer plusieurs `@Bean SecurityFilterChain` sans `@Order`.** Si l'ordre entre les chaînes n'est pas précisé, le comportement n'est pas garanti de façon fiable. Ajoutez toujours `@Order` quand vous avez plusieurs chaînes.

> **Croire que `SecurityFilterChain` est LE filtre exécuté par Tomcat.** C'est un objet de configuration côté Spring ; le seul filtre réellement enregistré dans le conteneur Servlet est le `DelegatingFilterProxy`. Toute la suite se passe côté Spring, à l'intérieur du `FilterChainProxy`.

> **Oublier que le mot de passe généré change à chaque redémarrage.** Il ne doit jamais être codé en dur ou communiqué : c'est un garde-fou de démarrage, pas un compte applicatif.

### À retenir

- Le starter Security protège **tout** par défaut, dès son ajout au classpath.
- Chaîne réelle : `DelegatingFilterProxy` (Servlet) → `FilterChainProxy` (bean `springSecurityFilterChain`) → la `SecurityFilterChain` choisie → ses filtres, dans l'ordre.
- On configure une `SecurityFilterChain` avec la DSL lambda sur `HttpSecurity` ; `WebSecurityConfigurerAdapter` n'existe plus depuis Spring Security 5.7.
- `SecurityContextHolder` donne accès à l'`Authentication` courante pendant le traitement de la requête.
- Plusieurs chaînes sont possibles (`securityMatcher` + `@Order`), utile pour traiter API et pages web différemment.
