---
id: cors-csrf
chapitre: securite
ordre: 5
titre: "CORS et CSRF"
termes:
  - terme: CSRF (Cross-Site Request Forgery)
    definition: "Attaque où un site malveillant fait exécuter, à l'insu de la victime, une requête vers un autre site où elle est déjà connectée (ex. un formulaire caché qui soumet un virement). Le navigateur joint automatiquement les cookies de session, la requête paraît donc légitime."
  - terme: CsrfFilter
    definition: "Filtre Spring Security actif par défaut avec une authentification à base de session. Il exige un jeton CSRF valide sur les requêtes qui modifient l'état (POST, PUT, PATCH, DELETE) ; sans lui, la requête est rejetée avec un **403**."
  - terme: CORS (Cross-Origin Resource Sharing)
    definition: "Mécanisme du **navigateur** qui autorise (ou non) une page JavaScript chargée depuis une origine (protocole + domaine + port) à appeler une API sur une autre origine. Contrôlé côté serveur par des en-têtes de réponse (`Access-Control-Allow-Origin`…)."
  - terme: Requête preflight (OPTIONS)
    definition: "Avant certaines requêtes cross-origin (méthodes autres que GET/HEAD/POST simple, en-têtes personnalisés…), le navigateur envoie automatiquement une requête `OPTIONS` pour demander au serveur s'il autorise l'appel réel. Si la réponse ne l'autorise pas, la vraie requête n'est même pas envoyée."
  - terme: CorsConfigurationSource
    definition: "Bean qui décrit les règles CORS (origines, méthodes, en-têtes autorisés) et se branche dans `HttpSecurity` avec `http.cors(cors -> cors.configurationSource(...))`."
  - terme: "@CrossOrigin"
    definition: "Annotation posée sur un contrôleur ou une méthode pour autoriser des origines spécifiques, sans passer par un bean `CorsConfigurationSource` global. Pratique au cas par cas, moins centralisé."
quiz:
  - question: "Une application web utilise `formLogin()` (authentification par session). Un utilisateur connecté envoie ce POST **sans jeton CSRF**. Que se passe-t-il ?"
    code: |
      POST /api/commandes HTTP/1.1
      Cookie: JSESSIONID=...
      Content-Type: application/json

      {"produitId": 42, "quantite": 2}
    choix:
      - "La requête est traitée normalement : le cookie de session suffit à prouver l'identité"
      - "403 Forbidden : le `CsrfFilter`, actif par défaut avec une authentification par session, rejette la requête sans jeton CSRF valide"
      - "401 Unauthorized, car le serveur ne reconnaît pas l'utilisateur"
      - "La requête est acceptée mais mise en file d'attente jusqu'à réception du jeton"
    reponse: 1
    explication: "C'est justement le but de la protection CSRF : le cookie de session seul ne suffit pas à prouver que la requête vient bien de l'application (un site tiers pourrait le faire suivre automatiquement). Sans jeton CSRF valide dans la requête, Spring Security répond 403."
  - question: "Un front-end React servi sur `http://localhost:3000` appelle une API Spring Boot sur `http://localhost:8080`. La console du navigateur affiche une erreur CORS. Que faut-il vérifier en premier côté serveur ?"
    choix:
      - "Que le `PasswordEncoder` est correctement configuré"
      - "Qu'un `CorsConfigurationSource` autorisant `http://localhost:3000` est déclaré, et que `http.cors(...)` est activé dans la `SecurityFilterChain`"
      - "Que le jeton CSRF est transmis dans l'en-tête `Authorization`"
      - "Que l'API utilise `SessionCreationPolicy.STATELESS`"
    reponse: 1
    explication: "`localhost:3000` et `localhost:8080` sont deux origines différentes (port différent) : sans configuration CORS explicite côté serveur, le navigateur bloque la réponse avant même qu'elle atteigne le code JavaScript de l'application. Il faut un `CorsConfigurationSource` qui liste les origines autorisées, connecté à `HttpSecurity` via `http.cors(...)`."
  - question: "Une API REST est purement stateless : authentification par JWT dans l'en-tête `Authorization`, aucune session, aucun cookie. Désactiver la protection CSRF sur cette API (`csrf(csrf -> csrf.disable())`) est-il raisonnable ?"
    choix:
      - "Non, jamais : CSRF doit toujours rester activé quelle que soit l'authentification"
      - "Oui : CSRF exploite l'envoi automatique de cookies par le navigateur ; sans cookie de session, il n'y a pas de vecteur d'attaque CSRF à protéger"
      - "Non, car CORS et CSRF protègent exactement la même chose"
      - "Oui, mais uniquement si l'application n'a pas de front-end web"
    reponse: 1
    explication: "CSRF exploite le fait que le navigateur joint **automatiquement** les cookies (dont le cookie de session) à toute requête, même déclenchée par un autre site. Un jeton JWT transmis dans un en-tête `Authorization` doit être ajouté **explicitement** par le code JavaScript : un site tiers ne peut pas le faire suivre à son insu. Désactiver CSRF a donc du sens ici, à condition de ne jamais faire porter l'authentification par un cookie sur cette même API."
---

## Essentiel

CORS et CSRF sont souvent confondus, alors qu'ils répondent à des problèmes opposés.

**CSRF** protège **votre serveur** contre un site tiers qui ferait exécuter, à l'insu de l'utilisateur, une action en son nom (le navigateur joint automatiquement les cookies). Cette protection n'a de sens **que** quand l'authentification repose sur un cookie de session, ce qui est le cas de `formLogin()`. C'est pourquoi elle est activée par défaut dans ce cas ; pour une API stateless authentifiée par jeton (voir la leçon sur JWT et OAuth2), elle est généralement désactivée puisqu'il n'y a pas de cookie à détourner :

```java
@Bean
SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
    http
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .csrf(csrf -> csrf.disable()) // pas de cookie de session : pas de risque CSRF ici
        .authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
    return http.build();
}
```

**CORS** protège **le navigateur de l'utilisateur** : par défaut, une page JavaScript chargée depuis une origine ne peut pas appeler librement une API sur une autre origine. Le serveur doit explicitement l'autoriser :

```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://mon-app.exemple.com"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

```java
http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
```

## Détail

### CSRF, l'attaque concrètement

1. Alice est connectée sur `banque.exemple.com`, son navigateur détient un cookie de session valide.
2. Alice visite `site-piege.exemple.com`, qui contient un formulaire caché soumis automatiquement en JavaScript vers `banque.exemple.com/virement`.
3. Le navigateur d'Alice joint **automatiquement** le cookie de session de `banque.exemple.com` à cette requête, même si elle part d'un autre site.
4. Sans protection, le serveur ne voit aucune différence avec une requête volontaire d'Alice.

La protection CSRF de Spring Security exige un jeton, généré côté serveur et transmis par l'application légitime (champ caché de formulaire, en-tête personnalisé), que le site tiers ne peut pas connaître ni deviner.

### Exemple 1 — Transmettre le jeton CSRF depuis une page rendue côté serveur

Avec Thymeleaf, l'intégration Spring Security ajoute automatiquement le jeton dans les formulaires :

```html
<form th:action="@{/commandes}" method="post">
    <!-- le champ caché _csrf est ajouté automatiquement -->
    ...
</form>
```

### Exemple 2 — Transmettre le jeton depuis un client JavaScript

Quand le front-end et le back-end sont séparés mais partagent quand même une session (même domaine ou sous-domaines), le jeton doit être lu (souvent dans un cookie dédié) et renvoyé dans un en-tête à chaque requête modifiante :

```javascript
fetch('/api/commandes', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': lireCookie('XSRF-TOKEN'),
    },
    body: JSON.stringify({ produitId: 42, quantite: 2 }),
});
```

### Exemple 3 — Preflight CORS

Pour une requête `PUT` avec un en-tête `Authorization`, le navigateur envoie d'abord automatiquement :

```
OPTIONS /api/commandes/42 HTTP/1.1
Origin: https://mon-app.exemple.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: authorization, content-type
```

Le serveur doit répondre avec les en-têtes `Access-Control-Allow-*` correspondants pour que le navigateur laisse ensuite partir la requête `PUT` réelle. `http.cors(...)` gère cette réponse automatiquement à partir du `CorsConfigurationSource`.

### Exemple 4 — `@CrossOrigin` au cas par cas

```java
@RestController
@RequestMapping("/api/produits")
@CrossOrigin(origins = "https://mon-app.exemple.com")
public class ProduitController { ... }
```

Pratique pour un cas isolé ; dès que plusieurs contrôleurs ou une politique commune sont concernés, un `CorsConfigurationSource` centralisé est plus facile à maintenir.

### CORS et CSRF, côte à côte

| | CSRF | CORS |
|---|---|---|
| Protège | Le serveur, contre des requêtes forgées | Le navigateur de l'utilisateur, contre des lectures cross-origin non désirées |
| Repose sur | Un jeton que le site tiers ne peut pas connaître | Des en-têtes de réponse autorisant explicitement une origine |
| Pertinent avec | Authentification par cookie/session | Toute API appelée depuis une origine différente (front séparé) |
| Absence de protection | Requête acceptée à tort (403 sinon) | Réponse bloquée par le navigateur, pas par le serveur |

### Pièges courants

> **Erreur `No 'Access-Control-Allow-Origin' header is present`.** C'est un blocage **côté navigateur** : la requête part parfois réellement (visible côté serveur dans les logs), mais la réponse n'est pas accessible au code JavaScript. Elle disparaît en configurant correctement `CorsConfigurationSource` et `http.cors(...)`.

> **Croire que CORS protège le serveur.** CORS n'empêche pas un outil comme `curl` ou Postman d'appeler l'API : c'est une règle appliquée par le navigateur aux pages web, pas un contrôle d'accès côté serveur. La vraie protection contre les appels non autorisés reste l'authentification et l'autorisation.

> **Désactiver CSRF « pour que ça marche » sur une application avec `formLogin()`.** C'est la cause la plus fréquente de ce réflexe en développement, mais cela supprime une vraie protection tant que l'authentification repose sur un cookie de session. La bonne réponse est presque toujours de transmettre correctement le jeton, pas de désactiver la protection.

### À retenir

- CSRF exploite l'envoi automatique de cookies par le navigateur : nécessaire avec une authentification par session, généralement inutile avec un jeton transmis explicitement dans un en-tête.
- CORS est appliqué par le **navigateur**, pas par le serveur : il ne protège pas contre des appels directs hors navigateur.
- `CorsConfigurationSource` + `http.cors(...)` configurent les origines, méthodes et en-têtes autorisés côté serveur.
- Une requête cross-origin « non simple » déclenche un `OPTIONS` de préflight avant la requête réelle.
- Ne jamais désactiver CSRF par réflexe : seulement quand l'authentification ne repose sur aucun cookie.
