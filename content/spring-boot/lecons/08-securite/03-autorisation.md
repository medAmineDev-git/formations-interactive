---
id: autorisation
chapitre: securite
ordre: 3
titre: "Autorisation : protéger les URL et les méthodes"
termes:
  - terme: authorizeHttpRequests
    definition: "Méthode de configuration sur `HttpSecurity` (DSL lambda) qui déclare les règles d'autorisation par URL, évaluées **dans l'ordre d'écriture** : la première règle dont le `requestMatcher` correspond à la requête s'applique."
  - terme: requestMatchers
    definition: "Sélectionne un ensemble de requêtes par chemin (`requestMatchers(\"/admin/**\")`), éventuellement combiné à une méthode HTTP (`requestMatchers(HttpMethod.POST, \"/produits\")`). Remplace `antMatchers`, supprimé dans Spring Security 6."
  - terme: "hasRole / hasAuthority"
    definition: "`hasAuthority(\"X\")` exige l'autorité exacte `X`. `hasRole(\"ADMIN\")` est un raccourci qui exige l'autorité `ROLE_ADMIN` : Spring Security **ajoute automatiquement** le préfixe `ROLE_`. Ne pas l'ajouter soi-même dans `hasRole`, au risque de chercher `ROLE_ROLE_ADMIN`."
  - terme: "anyRequest().authenticated()"
    definition: "Règle « filet de sécurité » placée en dernier : toute requête qui n'a matché aucune règle précédente doit être authentifiée. Bonne pratique pour ne jamais laisser une route oubliée en accès libre."
  - terme: "@EnableMethodSecurity"
    definition: "Active la sécurité au niveau des méthodes (`@PreAuthorize`, `@PostAuthorize`, `@Secured`…), posée sur une classe `@Configuration`. Remplace `@EnableGlobalMethodSecurity`, dépréciée."
  - terme: "@PreAuthorize / @PostAuthorize"
    definition: "Annotations posées sur une méthode (service ou contrôleur), avec une expression **SpEL** évaluée respectivement **avant** (`@PreAuthorize`) ou **après** (`@PostAuthorize`) son exécution. `@PreAuthorize` peut accéder aux paramètres de la méthode (`#id`), `@PostAuthorize` peut accéder à la valeur retournée (`returnObject`)."
  - terme: "@Secured"
    definition: "Annotation plus ancienne et plus limitée : accepte seulement une liste de rôles/autorités, sans expression SpEL (`@Secured(\"ROLE_ADMIN\")`). `@PreAuthorize` est préféré pour sa souplesse."
quiz:
  - question: "Dans quel ordre le `FilterChainProxy` (via `AuthorizationFilter`) évalue-t-il ces règles ?"
    code: |
      http.authorizeHttpRequests(auth -> auth
          .anyRequest().authenticated()
          .requestMatchers("/admin/**").hasRole("ADMIN")
      );
    choix:
      - "Ce code ne compile pas : `anyRequest()` doit être en dernier"
      - "Les deux règles sont évaluées ensemble, la plus restrictive gagne"
      - "`/admin/**` est traité par `hasRole(\"ADMIN\")`, les autres URL par `authenticated()`, l'ordre d'écriture n'a pas d'importance ici"
      - "`anyRequest().authenticated()` matche déjà toutes les URL en premier, donc `/admin/**` n'est jamais protégée par `hasRole(\"ADMIN\")` : simple authentification suffit"
    reponse: 3
    explication: "`authorizeHttpRequests` évalue les règles **dans l'ordre d'écriture** et applique la première qui correspond. `anyRequest()` correspond à toutes les URL, y compris `/admin/**` : la règle `hasRole(\"ADMIN\")` placée après n'est donc jamais atteinte. Le code compile, mais le résultat est probablement une faille de sécurité. Règle générale : les règles les plus spécifiques d'abord, `anyRequest()` en tout dernier."
  - question: "Quelle autorité un utilisateur doit-il posséder pour satisfaire `hasRole(\"ADMIN\")` ?"
    choix:
      - "`ADMIN`"
      - "`ROLE_ADMIN`"
      - "`ROLE_ROLE_ADMIN`"
      - "N'importe quelle autorité commençant par `ROLE_`"
    reponse: 1
    explication: "`hasRole(\"ADMIN\")` ajoute automatiquement le préfixe `ROLE_` avant de comparer. C'est pour cela que `.roles(\"ADMIN\")` sur un `UserDetails` (qui fait la même chose côté création) et `hasRole(\"ADMIN\")` se correspondent naturellement. Utiliser `hasAuthority(\"ROLE_ADMIN\")` donne un résultat strictement identique, sans ajout automatique de préfixe."
  - question: "Un utilisateur authentifié, mais sans le rôle requis, appelle cette méthode. Que se passe-t-il, et quel code HTTP le contrôleur renvoie-t-il typiquement ?"
    code: |
      @PreAuthorize("hasRole('ADMIN')")
      public void supprimerCompte(Long id) { ... }
    choix:
      - "La méthode s'exécute normalement, le contrôle est ignoré côté service"
      - "`AccessDeniedException` est levée avant l'exécution de la méthode ; traduite par défaut en **403 Forbidden**"
      - "`AuthenticationException` est levée ; traduite par défaut en **401 Unauthorized**"
      - "La méthode s'exécute mais retourne `null`"
    reponse: 1
    explication: "Distinction à connaître : **401** signifie « je ne sais pas qui vous êtes » (pas authentifié, ou authentification invalide) ; **403** signifie « je sais qui vous êtes, mais vous n'avez pas le droit » (authentifié, autorisation refusée). Ici l'utilisateur est authentifié : `@PreAuthorize` échoue côté autorisation, donc 403."
---

## Essentiel

L'autorisation répond à une question différente de l'authentification : *une fois qu'on sait qui vous êtes, avez-vous le droit ?* Spring Security la contrôle à deux niveaux, souvent combinés.

**Par URL**, avec `authorizeHttpRequests` :

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/public/**").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/produits").hasRole("ADMIN")
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().authenticated()
    );
    return http.build();
}
```

**Règle essentielle : l'ordre compte.** Ces règles sont évaluées de haut en bas, la première qui correspond au chemin l'emporte. Il faut donc placer les règles les plus précises en premier, et `anyRequest()` toujours en dernier.

**Par méthode**, avec `@EnableMethodSecurity` sur la configuration, puis `@PreAuthorize` sur les méthodes à protéger :

```java
@PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
public Commande annuler(Long id) { ... }
```

`hasRole("ADMIN")` exige l'autorité `ROLE_ADMIN` (le préfixe `ROLE_` est ajouté automatiquement) ; `hasAuthority("ADMIN")` exige l'autorité exacte `ADMIN`, sans préfixe.

## Détail

### Pourquoi deux niveaux (URL et méthode) plutôt qu'un seul

La protection par URL est une première ligne de défense, simple à lire d'un seul coup d'œil dans la configuration. La protection par méthode va plus loin : elle s'applique quel que soit le point d'entrée (un contrôleur REST, un job planifié, un autre service qui appelle la méthode directement), et elle peut exprimer des règles impossibles à écrire avec un simple chemin, comme « seulement le propriétaire de la ressource ». Beaucoup de projets combinent les deux : une règle d'URL large (« authentifié »), affinée méthode par méthode.

### Exemple 1 — `hasRole` contre `hasAuthority`

```java
// Un utilisateur avec l'autorité "ROLE_ADMIN"
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/admin/**").hasRole("ADMIN")       // compare à "ROLE_ADMIN" : ✅ correspond
);

http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/admin/**").hasAuthority("ADMIN")  // compare à "ADMIN" : ❌ ne correspond pas
);
```

`hasRole` et `hasAuthority` finissent par comparer la même chose ; seule la gestion du préfixe diffère. En cas de doute sur le comportement, `hasAuthority("ROLE_ADMIN")` est explicite et sans ambiguïté.

### Exemple 2 — `@PreAuthorize` avec accès aux paramètres

```java
@Service
public class CommandeService {

    @PreAuthorize("hasRole('ADMIN') or #clientId == authentication.principal.id")
    public List<Commande> listerCommandesClient(Long clientId) {
        return repo.findByClientId(clientId);
    }
}
```

L'expression SpEL accède au paramètre `clientId` via `#clientId`, et à l'utilisateur authentifié via `authentication`. Un client ne peut lister que ses propres commandes ; un administrateur peut tout voir.

### Exemple 3 — `@PostAuthorize` sur la valeur retournée

```java
@PostAuthorize("returnObject.proprietaire == authentication.name")
public Document lire(Long id) {
    return documentRepository.findById(id).orElseThrow();
}
```

Ici, on ne peut pas décider avant d'avoir chargé le document : `@PostAuthorize` évalue l'expression sur `returnObject`, **après** l'exécution. Attention : la méthode s'exécute quand même avant le refus, ce qui peut avoir un coût (chargement inutile, effets de bord à éviter dans une méthode de lecture).

### Exemple 4 — `@Secured`, plus simple, plus limité

```java
@Secured("ROLE_ADMIN")
public void purgerCommandesAnnulees() { ... }
```

Pas d'expression SpEL possible, seulement une liste de rôles/autorités exacts. `@PreAuthorize` couvre ce cas et bien plus ; `@Secured` reste surtout présent dans du code plus ancien.

### 401 contre 403

| Code | Signification | Cause typique |
|---|---|---|
| 401 Unauthorized | L'identité n'est pas établie | Pas de jeton/session, identifiants invalides |
| 403 Forbidden | L'identité est établie, mais l'accès est refusé | Rôle ou autorité insuffisants |

### Pièges courants

> **Une règle large placée avant une règle précise.** `anyRequest().authenticated()` avant `requestMatchers("/admin/**").hasRole("ADMIN")` neutralise silencieusement la seconde règle : elle ne cause aucune erreur au démarrage, seulement un accès trop large en production.

> **Oublier `@EnableMethodSecurity`.** Sans elle, `@PreAuthorize` et `@PostAuthorize` sont simplement ignorées, sans avertissement : le code paraît protégé, il ne l'est pas.

> **`hasRole(\"ROLE_ADMIN\")` par erreur.** Comme `hasRole` ajoute déjà le préfixe, cette écriture cherche l'autorité `ROLE_ROLE_ADMIN`, qui n'existe jamais : l'accès est refusé à tout le monde, y compris aux administrateurs légitimes.

### À retenir

- `authorizeHttpRequests` évalue les règles dans l'ordre d'écriture : du plus précis au plus général, `anyRequest()` toujours en dernier.
- `hasRole("X")` = `hasAuthority("ROLE_X")` : le préfixe `ROLE_` est ajouté automatiquement, ne pas le dupliquer.
- `@EnableMethodSecurity` + `@PreAuthorize`/`@PostAuthorize` protègent au niveau méthode, avec des expressions SpEL qui peuvent lire les paramètres ou le résultat.
- `@Secured` est plus simple mais plus limité (pas de SpEL) ; `@PreAuthorize` est aujourd'hui le choix par défaut.
- 401 = pas authentifié, 403 = authentifié mais pas autorisé.
