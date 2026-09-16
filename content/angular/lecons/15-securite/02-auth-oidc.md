---
id: auth-oidc
chapitre: securite
ordre: 2
titre: "Authentification OAuth2 / OIDC dans une application Angular"
termes:
  - terme: "Client public"
    definition: "Catégorie OAuth2 à laquelle appartient toute application qui s'exécute entièrement côté utilisateur (SPA Angular, application mobile) : son code est visible et inspectable, elle ne peut donc **garder aucun secret**. À l'opposé d'un « client confidentiel » (un serveur backend), qui peut stocker un secret d'application en toute sécurité."
  - terme: "Authorization Code Flow avec PKCE"
    definition: "Flux OAuth2/OIDC recommandé pour un client public : l'application redirige vers le serveur d'autorisation, récupère un **code** temporaire après authentification, puis l'échange contre des jetons. **PKCE** (Proof Key for Code Exchange) protège cet échange sans nécessiter de secret client."
  - terme: "code_verifier / code_challenge"
    definition: "Paire PKCE : l'application génère un `code_verifier` aléatoire, en dérive un `code_challenge` (haché) envoyé avec la demande d'autorisation, puis fournit le `code_verifier` d'origine lors de l'échange du code contre les jetons. Le serveur vérifie la correspondance, ce qui empêche qu'un code intercepté soit échangé par un tiers."
  - terme: "Jeton d'accès, jeton d'identité, jeton de rafraîchissement"
    definition: "Trois jetons distincts renvoyés par le serveur d'autorisation : le **jeton d'accès** (access token) autorise les appels API, le **jeton d'identité** (ID token, spécifique à OIDC) décrit l'utilisateur authentifié, le **jeton de rafraîchissement** (refresh token) permet d'obtenir un nouveau jeton d'accès sans réauthentification complète."
  - terme: "Intercepteur d'authentification"
    definition: "Intercepteur `HttpClient` (fonctionnel, `HttpInterceptorFn`) qui ajoute l'en-tête `Authorization: Bearer <jeton>` aux requêtes sortantes. Doit vérifier le domaine de destination avant d'ajouter le jeton, pour ne jamais l'envoyer à une API tierce non maîtrisée."
  - terme: "Cookie HttpOnly"
    definition: "Cookie posé par le serveur avec l'attribut `HttpOnly`, inaccessible au JavaScript de la page. Permet de stocker un jeton hors d'atteinte d'un script injecté par XSS, au prix d'une dépendance à un backend qui gère ce cookie (souvent via un pattern BFF, Backend for Frontend) et d'une protection CSRF à mettre en place en complément."
  - terme: "Guard de route (authentification)"
    definition: "`CanActivateFn` qui vérifie côté client si l'utilisateur semble authentifié, pour éviter d'afficher une page protégée ou rediriger vers la connexion. C'est une aide d'**expérience utilisateur**, pas un contrôle de sécurité : un utilisateur peut désactiver JavaScript ou appeler l'API directement, contournant tout guard."
  - terme: "Bibliothèque OIDC certifiée"
    definition: "Librairie ayant passé la suite de certification officielle OpenID Foundation (ex. `angular-auth-oidc-client`, `angular-oauth2-oidc`), à préférer systématiquement à une implémentation maison du flux Authorization Code + PKCE : la cryptographie et les nombreux cas limites du protocole sont difficiles à réimplémenter correctement."
quiz:
  - question: "Pourquoi le flux Authorization Code avec PKCE est-il recommandé pour une application Angular plutôt que l'ancien flux implicite (jetons renvoyés directement dans le fragment d'URL) ?"
    choix:
      - "Parce que PKCE est plus rapide à exécuter pour l'utilisateur"
      - "Parce que PKCE évite d'exposer les jetons dans l'URL (historique, journaux serveur, en-tête Referer) et protège l'échange du code contre son interception, sans nécessiter de secret que l'application ne peut de toute façon pas garder"
      - "Parce que le flux implicite nécessite un secret client, que PKCE permet d'éviter"
      - "Parce que PKCE fonctionne sans serveur d'autorisation"
    reponse: 1
    explication: "Le flux implicite renvoyait les jetons directement dans le fragment d'URL, exposé aux historiques de navigation, aux extensions de navigateur et parfois aux journaux. Le flux Authorization Code échange un code contre les jetons via un appel serveur-à-navigateur distinct, et PKCE sécurise cet échange par une preuve cryptographique dérivée d'un secret généré localement (`code_verifier`) — aucun secret client statique n'est requis ni possible dans les deux flux pour un client public."
  - question: "Un développeur veut stocker le jeton d'accès dans `localStorage` pour qu'il survive à un rechargement de page. Quel est le compromis principal ?"
    choix:
      - "localStorage est plus lent que la mémoire, ce qui ralentit chaque requête HTTP"
      - "localStorage est accessible à n'importe quel script s'exécutant sur la page : une faille XSS, même minime, permet de lire et d'exfiltrer le jeton"
      - "localStorage ne peut pas stocker de chaînes de caractères, seulement des objets JSON"
      - "localStorage expire automatiquement le jeton après quelques secondes"
    reponse: 1
    explication: "N'importe quel script exécuté dans la page, y compris un script injecté par une faille XSS ailleurs dans l'application ou une dépendance compromise, peut lire `localStorage`. C'est le compromis central : stockage en mémoire (perdu au rechargement, mais inaccessible en dehors du contexte JS courant) ou cookie `HttpOnly` posé par le serveur (inaccessible en JS, mais nécessite un backend coopérant et une protection CSRF) réduisent ce risque, contrairement à `localStorage`."
  - question: "Un guard `authGuard` bloque l'accès à `/admin` côté client si l'utilisateur n'est pas authentifié. Suffit-il à protéger les données de la route `/api/admin/*` ?"
    code: |
      export const authGuard: CanActivateFn = () => {
        const auth = inject(AuthService);
        return auth.estAuthentifie() || inject(Router).createUrlTree(['/connexion']);
      };
    choix:
      - "Oui, un guard qui redirige vers la connexion empêche tout accès non autorisé aux données"
      - "Non : le guard n'agit que sur l'affichage côté client. Un appel direct à l'API (sans passer par l'interface) contourne totalement le guard ; seul le serveur, en vérifiant le jeton à chaque requête, protège réellement les données"
      - "Oui, à condition d'ajouter CanDeactivateFn en complément"
      - "Non, il faut remplacer CanActivateFn par CanMatchFn pour que la protection soit appliquée côté serveur"
    reponse: 1
    explication: "Un guard de route est une aide d'expérience utilisateur exécutée dans le navigateur : il évite d'afficher une page inutilement à quelqu'un de non connecté, mais rien n'empêche un attaquant d'appeler `/api/admin/...` directement avec ou sans jeton falsifié. La sécurité réelle des données repose exclusivement sur la vérification du jeton (signature, expiration, portée) côté serveur, à chaque requête, indépendamment de ce que fait le front."
---

## Essentiel

Dans OAuth2/OIDC, une application Angular est un **client public** : son code s'exécute chez l'utilisateur, entièrement inspectable, donc incapable de garder un secret. C'est pourquoi le flux recommandé est **Authorization Code avec PKCE** : l'application redirige vers le serveur d'autorisation, l'utilisateur s'authentifie, un **code** temporaire revient dans l'URL de redirection, puis l'application l'échange contre des jetons — jeton d'accès, jeton d'identité (OIDC), éventuellement un jeton de rafraîchissement. PKCE remplace le secret client qu'une application front ne peut pas garder : un `code_verifier` généré localement prouve, au moment de l'échange, que c'est bien la même application qui a initié la demande.

**Ce qu'on ne met jamais dans une application front : un secret client.** Toute valeur présente dans le bundle JavaScript est publique, quelle que soit la minification.

Le stockage des jetons est un compromis, pas une solution parfaite :

| Stockage | Avantage | Risque |
|---|---|---|
| Mémoire (variable JS) | Inaccessible hors du contexte JS courant | Perdu au rechargement de page |
| `localStorage` | Persiste entre rechargements | Lisible par **tout** script, y compris un script injecté par XSS |
| Cookie `HttpOnly` posé par le serveur | Inaccessible en JavaScript | Nécessite un backend qui coopère (souvent un BFF), et une protection CSRF |

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const domainesAutorises = ['api.maboutique.com'];
  const url = new URL(req.url, window.location.origin);

  if (!domainesAutorises.includes(url.hostname)) {
    return next(req); // jamais de jeton envoyé à un domaine tiers
  }

  const jeton = inject(AuthService).jetonAcces();
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } }));
};
```

Un **guard de route** vérifiant l'authentification n'est qu'une aide d'expérience utilisateur : la vraie protection des données se joue côté serveur, à chaque appel API. Préférer une bibliothèque OIDC certifiée à une implémentation maison du flux.

## Détail

### Pourquoi c'est utile

Une application front n'a aucun moyen de prouver son identité par un secret : quiconque ouvre les outils de développement peut lire tout son code. OAuth2/OIDC a formalisé ce cas sous le nom de « client public », avec un flux (Authorization Code + PKCE) conçu spécifiquement pour ne jamais reposer sur un secret côté client. Comprendre cette distinction évite l'erreur classique de copier un tutoriel côté serveur (qui utilise un secret client) dans une application Angular.

### Exemple 1 — Vue d'ensemble du flux Authorization Code + PKCE

```ts
// 1. Génération locale (par la librairie OIDC) d'un code_verifier aléatoire,
//    et de son code_challenge (haché) envoyé dans l'URL d'autorisation.
//
// 2. Redirection vers le serveur d'autorisation :
// https://auth.maboutique.com/authorize
//   ?response_type=code
//   &client_id=boutique-spa
//   &redirect_uri=https://maboutique.com/callback
//   &code_challenge=<hache_du_code_verifier>
//   &code_challenge_method=S256
//   &scope=openid profile commandes.lecture

// 3. Après authentification de l'utilisateur, redirection retour avec un code :
// https://maboutique.com/callback?code=abc123

// 4. Échange du code contre les jetons, en fournissant le code_verifier d'origine.
// Le serveur vérifie que le hachage du code_verifier correspond au code_challenge envoyé à l'étape 2.
```

Un code intercepté en transit (étape 3) ne peut pas être échangé par un attaquant : il ne connaît pas le `code_verifier`, resté uniquement dans l'application d'origine.

### Exemple 2 — Ne jamais coder ce genre de constante

```ts
// À NE JAMAIS FAIRE dans une application Angular :
export const environment = {
  clientId: 'boutique-spa',
  clientSecret: 'a8f3e9d2c1...', // secret client : n'a aucun sens côté front
};
```

Un secret client placé ici est lisible par quiconque ouvre le bundle JavaScript livré au navigateur, minifié ou non. Un client public s'authentifie par son `client_id` (public, sans problème) et PKCE, jamais par un secret.

### Exemple 3 — Renouvellement du jeton et file d'attente des requêtes

```ts
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((erreur: HttpErrorResponse) => {
      if (erreur.status !== 401) {
        return throwError(() => erreur);
      }
      // rafraichirJeton() met en file les requêtes concurrentes pendant
      // le renouvellement, pour éviter plusieurs appels de rafraîchissement en parallèle.
      return auth.rafraichirJeton().pipe(
        switchMap((nouveauJeton) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${nouveauJeton}` } })),
        ),
        catchError(() => {
          auth.deconnexion();
          return throwError(() => erreur);
        }),
      );
    }),
  );
};
```

Sans mécanisme de file d'attente, plusieurs requêtes échouant en même temps sur un jeton expiré déclenchent chacune leur propre appel de rafraîchissement en parallèle : gaspillage d'appels, et risque que le serveur d'autorisation invalide un jeton de rafraîchissement à usage unique avant que toutes les tentatives ne l'utilisent. La bonne pratique consiste à ne lancer qu'un seul rafraîchissement à la fois, et à faire attendre les requêtes suivantes son résultat.

### Exemple 4 — Déconnexion

```ts
deconnexion(): void {
  this.jetonAcces.set(null);
  this.jetonIdentite.set(null);
  // Redirection vers l'endpoint de fin de session du serveur d'autorisation
  // (end_session_endpoint OIDC), pour invalider aussi la session côté serveur,
  // pas seulement effacer l'état local.
  window.location.href = this.construireUrlDeconnexion();
}
```

Effacer uniquement l'état local (signaux, mémoire) déconnecte l'application mais laisse potentiellement une session active côté serveur d'autorisation — d'où l'intérêt de rediriger vers son endpoint de fin de session quand il est disponible.

### Pièges courants

> **Réimplémenter PKCE et la validation du jeton d'identité à la main.** La génération du `code_verifier`, le hachage `S256`, la validation de la signature et des revendications (`iss`, `aud`, `exp`, `nonce`) d'un jeton d'identité comportent de nombreux cas limites. Une bibliothèque certifiée OIDC les couvre déjà ; une implémentation maison en oublie presque toujours un.

> **Envoyer le jeton d'accès à n'importe quel domaine.** Un intercepteur qui ajoute `Authorization: Bearer ...` à toutes les requêtes, y compris vers un CDN ou une API tierce, fuite le jeton en dehors de l'API qui doit le recevoir. Toujours restreindre l'ajout du jeton aux domaines de confiance de l'application.

> **Considérer un guard de route comme une mesure de sécurité.** `CanActivateFn` évite d'afficher une page à un utilisateur non connecté, mais un appel direct à l'API contourne totalement cette vérification. La protection réelle est toujours côté serveur.

### À retenir

- Une application Angular est un **client public** OAuth2/OIDC : elle ne peut garder aucun secret, jamais de `client_secret` dans le code front.
- Le flux recommandé est **Authorization Code + PKCE**, qui remplace le secret client par une preuve cryptographique locale (`code_verifier`/`code_challenge`).
- Le stockage des jetons est un compromis : mémoire (perdu au rechargement), `localStorage` (persistant mais exposé à XSS), cookie `HttpOnly` (protégé de XSS, nécessite un backend et une protection CSRF).
- L'intercepteur d'authentification doit vérifier le domaine avant d'ajouter le jeton, et gérer le renouvellement en mettant les requêtes concurrentes en file d'attente.
- Un guard de route protège l'expérience utilisateur, jamais les données : seule la vérification côté serveur, à chaque appel API, est une mesure de sécurité réelle. Préférer une bibliothèque OIDC certifiée à une implémentation maison.
