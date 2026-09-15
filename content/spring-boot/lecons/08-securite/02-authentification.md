---
id: authentification
chapitre: securite
ordre: 2
titre: "Authentification : utilisateurs et mots de passe"
termes:
  - terme: UserDetailsService
    definition: "Interface à un seul rôle : `loadUserByUsername(String username)` renvoie un `UserDetails`, ou lève `UsernameNotFoundException` si l'utilisateur n'existe pas. C'est le point d'extension pour charger vos utilisateurs (base de données, LDAP…)."
  - terme: UserDetails
    definition: "Interface qui représente un utilisateur pour Spring Security : nom, mot de passe (déjà **encodé**), autorités (`GrantedAuthority`), et des indicateurs de compte (`isEnabled()`, `isAccountNonExpired()`, `isAccountNonLocked()`, `isCredentialsNonExpired()`)."
  - terme: PasswordEncoder
    definition: "Interface avec deux méthodes : `encode(rawPassword)` pour stocker un mot de passe, `matches(rawPassword, encodedPassword)` pour le vérifier à la connexion. Ne jamais comparer des mots de passe en clair soi-même."
  - terme: BCryptPasswordEncoder
    definition: "Implémentation la plus courante : algorithme **bcrypt**, avec un sel aléatoire intégré au résultat et un facteur de coût réglable (plus il est élevé, plus l'encodage — et une attaque par force brute — est lent)."
  - terme: DelegatingPasswordEncoder
    definition: "`PasswordEncoder` renvoyé par `PasswordEncoderFactories.createDelegatingPasswordEncoder()`, utilisé par défaut par Spring Boot. Il préfixe chaque mot de passe encodé d'un identifiant entre accolades (`{bcrypt}...`) qui indique l'algorithme à utiliser pour le vérifier."
  - terme: InMemoryUserDetailsManager
    definition: "Implémentation de `UserDetailsService` qui garde les utilisateurs en mémoire, déclarés au démarrage. Pratique pour un prototype, une démo ou un test ; pas pour une vraie base d'utilisateurs."
  - terme: AuthenticationManager
    definition: "Interface centrale qui reçoit une `Authentication` non vérifiée et renvoie une `Authentication` vérifiée (ou lève une exception). Son implémentation par défaut, `ProviderManager`, délègue à une liste d'`AuthenticationProvider`, dont le `DaoAuthenticationProvider` qui s'appuie sur `UserDetailsService` et `PasswordEncoder`."
quiz:
  - question: "Ce mot de passe encodé est stocké en base : `{bcrypt}$2a$10$N9qo8uLOickgx2ZMRZoMy...`. Que représente le préfixe `{bcrypt}` ?"
    choix:
      - "Une erreur de configuration : bcrypt ne doit jamais apparaître dans le mot de passe stocké"
      - "L'identifiant d'algorithme utilisé par le `DelegatingPasswordEncoder` pour savoir quel encodeur appeler lors de la vérification"
      - "Le nom du champ de la table `utilisateurs`"
      - "Un marqueur indiquant que le mot de passe n'est pas encore encodé"
    reponse: 1
    explication: "Le `DelegatingPasswordEncoder`, encodeur par défaut de Spring Boot, préfixe chaque hash de l'identifiant de l'algorithme utilisé (`{bcrypt}`, `{noop}`, `{pbkdf2}`…). Il permet de faire cohabiter plusieurs algorithmes et de migrer progressivement, sans configuration supplémentaire de votre part."
  - question: "Que fait ce `UserDetailsService`, et quel est son principal défaut pour une vraie application ?"
    code: |
      @Bean
      UserDetailsService userDetailsService() {
          UserDetails u = User.withUsername("alice")
              .password("{noop}secret")
              .roles("USER")
              .build();
          return new InMemoryUserDetailsManager(u);
      }
    choix:
      - "Il ne compile pas : `User.withUsername` n'existe pas"
      - "Il déclare un utilisateur en mémoire avec un mot de passe **non encodé** (`{noop}`) ; il n'est adapté qu'à une démo, jamais à une vraie base d'utilisateurs"
      - "Il chiffre automatiquement le mot de passe avec bcrypt au démarrage"
      - "`roles(\"USER\")` a pour effet d'appeler la base de données pour vérifier le rôle"
    reponse: 1
    explication: "`{noop}` indique au `DelegatingPasswordEncoder` de comparer le mot de passe **en clair**, uniquement utile en démonstration. Le vrai problème de fond est ailleurs : les utilisateurs sont codés en dur et perdus au redémarrage. En production, on fournit un `UserDetailsService` qui va chercher les utilisateurs en base, avec un mot de passe déjà encodé en bcrypt."
  - question: "Quelle est la différence essentielle entre `httpBasic()` et `formLogin()` ?"
    choix:
      - "`httpBasic()` est réservé aux API, `formLogin()` aux applications mobiles"
      - "`httpBasic()` demande les identifiants à **chaque requête** via l'en-tête `Authorization`, sans état côté serveur ; `formLogin()` affiche un formulaire et ouvre une **session** HTTP après connexion"
      - "Les deux sont strictement équivalents, seul le nom change"
      - "`formLogin()` ne fonctionne qu'avec un `UserDetailsService` en mémoire"
    reponse: 1
    explication: "Avec `httpBasic()`, le client renvoie `Authorization: Basic <base64(user:mdp)>` à chaque appel : rien n'est stocké côté serveur, pratique pour des tests ou des clients machine-à-machine. Avec `formLogin()`, l'authentification se fait une fois via un formulaire, puis Spring Security crée une session et un cookie `JSESSIONID` : les requêtes suivantes n'ont plus besoin de renvoyer les identifiants."
---

## Essentiel

S'authentifier, c'est prouver qui on est. Spring Security sépare deux responsabilités :

- **Charger l'utilisateur** : un `UserDetailsService` retrouve un `UserDetails` (nom, mot de passe encodé, rôles) à partir d'un nom d'utilisateur.
- **Vérifier le mot de passe** : un `PasswordEncoder` compare le mot de passe saisi au mot de passe stocké, sans jamais le déchiffrer (bcrypt n'est pas réversible).

En base de données, avec Spring Data JPA :

```java
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByUsername(String username);
}

@Service
public class JpaUserDetailsService implements UserDetailsService {

    private final UtilisateurRepository repo;

    public JpaUserDetailsService(UtilisateurRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        Utilisateur u = repo.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable : " + username));
        return User.withUsername(u.getUsername())
            .password(u.getMotDePasseEncode()) // déjà encodé, ex. "{bcrypt}$2a$..."
            .roles(u.getRole())
            .build();
    }
}
```

Et pour encoder un mot de passe à l'inscription :

```java
@Bean
PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder(); // encode en bcrypt par défaut
}
```

Le `DaoAuthenticationProvider`, utilisé automatiquement dès qu'un `UserDetailsService` et un `PasswordEncoder` sont des beans, assemble les deux : il appelle le premier pour charger l'utilisateur, puis le second pour vérifier le mot de passe.

## Détail

### Comment ça marche, de la requête à l'`Authentication` vérifiée

1. Le filtre d'authentification (`UsernamePasswordAuthenticationFilter` pour un formulaire, `BasicAuthenticationFilter` pour Basic) construit une `Authentication` **non vérifiée**, avec juste le nom d'utilisateur et le mot de passe saisi.
2. Elle est transmise à l'`AuthenticationManager`. Son implémentation par défaut, `ProviderManager`, la fait passer à travers une liste d'`AuthenticationProvider`.
3. Le `DaoAuthenticationProvider` gère le cas standard : il appelle `UserDetailsService.loadUserByUsername(...)`, puis `PasswordEncoder.matches(motDePasseSaisi, motDePasseStocke)`.
4. Succès : une `Authentication` **vérifiée**, contenant le `UserDetails` et ses autorités, est renvoyée et placée dans le `SecurityContextHolder`. Échec : `AuthenticationException` (ex. `BadCredentialsException`).

### Exemple 1 — Plusieurs utilisateurs en mémoire (démo, tests)

```java
@Bean
UserDetailsService userDetailsService(PasswordEncoder encoder) {
    UserDetails admin = User.withUsername("admin")
        .password(encoder.encode("motdepasse"))
        .roles("ADMIN", "USER")
        .build();
    UserDetails user = User.withUsername("bob")
        .password(encoder.encode("motdepasse"))
        .roles("USER")
        .build();
    return new InMemoryUserDetailsManager(admin, user);
}
```

`roles("ADMIN")` ajoute automatiquement le préfixe `ROLE_` à l'autorité (détail vu dans la leçon sur l'autorisation).

### Exemple 2 — `BCryptPasswordEncoder` seul, sans délégation

```java
@Bean
PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(); // facteur de coût par défaut : 10
}
```

Valable, mais on perd la souplesse du `DelegatingPasswordEncoder` (reconnaître et migrer d'anciens hashs stockés avec un autre algorithme). C'est pourquoi Spring Boot utilise le second par défaut.

### Exemple 3 — Basic pour une API interne, sans session

```java
@Bean
SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
    http
        .securityMatcher("/api/**")
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .httpBasic(Customizer.withDefaults())
        .authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
    return http.build();
}
```

Combiné à `STATELESS`, chaque requête est ré-authentifiée indépendamment : pas de session ni de cookie côté serveur.

### Choisir entre `httpBasic` et `formLogin`

| | `httpBasic()` | `formLogin()` |
|---|---|---|
| Identifiants envoyés | À chaque requête, en-tête `Authorization` | Une fois, via un formulaire HTML |
| État côté serveur | Aucun | Session HTTP (cookie `JSESSIONID`) |
| Cas d'usage typique | Outils, scripts, API interne, tests | Application web classique avec navigateur |
| Déconnexion | N'a pas vraiment de sens (rien à invalider) | `LogoutFilter` invalide la session |

### Pièges courants

> **Stocker un mot de passe en clair, `{noop}` en production.** Bcrypt existe précisément pour qu'une fuite de base de données n'expose pas les mots de passe. `{noop}` n'a de sens qu'en test ou en démonstration jetable.

> **Écrire son propre `if motDePasseSaisi.equals(motDePasseStocke)`.** Cela suppose un mot de passe en clair et ouvre la porte aux attaques par timing. Toujours passer par `PasswordEncoder.matches(...)`, qui compare de façon sûre.

> **Oublier de déclarer un bean `PasswordEncoder`.** Sans lui, un `UserDetailsService` personnalisé ne suffit pas à activer l'authentification par formulaire ou Basic sur des mots de passe encodés : Spring Security a besoin des deux beans pour assembler le `DaoAuthenticationProvider`.

### À retenir

- `UserDetailsService` charge l'utilisateur, `PasswordEncoder` vérifie le mot de passe : deux responsabilités séparées.
- `DelegatingPasswordEncoder` (bcrypt par défaut) préfixe chaque hash (`{bcrypt}...`) pour savoir quel algorithme utiliser à la vérification.
- `InMemoryUserDetailsManager` est réservé aux démos et aux tests ; en pratique, un `UserDetailsService` va chercher les utilisateurs en base.
- `AuthenticationManager` (via `ProviderManager` puis `DaoAuthenticationProvider`) orchestre le chargement et la vérification.
- `httpBasic()` : sans état, identifiants à chaque requête. `formLogin()` : session après connexion via un formulaire.
