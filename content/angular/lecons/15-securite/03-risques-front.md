---
id: risques-front
chapitre: securite
ordre: 3
titre: "Les autres risques côté front"
termes:
  - terme: "CSRF (Cross-Site Request Forgery)"
    definition: "Attaque qui pousse le navigateur d'une victime déjà authentifiée (par cookie) à envoyer, à son insu, une requête vers une application tierce — un site malveillant déclenche une requête vers votre API, et le navigateur y joint automatiquement les cookies de session valides."
  - terme: "withXsrfConfiguration()"
    definition: "Option de `provideHttpClient()` qui personnalise la protection CSRF intégrée : par défaut, `HttpClient` lit un jeton dans le cookie **`XSRF-TOKEN`** et le renvoie dans l'en-tête **`X-XSRF-TOKEN`** sur les requêtes mutantes (`POST`, `PUT`...) vers une URL relative de même origine. `withXsrfConfiguration({ cookieName, headerName })` permet de changer ces noms pour les faire correspondre à ceux attendus par le backend ; `withNoXsrfProtection()` désactive complètement le mécanisme."
  - terme: "Content-Security-Policy: Report-Only"
    definition: "Variante de l'en-tête CSP qui **n'applique pas** la politique (rien n'est bloqué) mais journalise les violations qu'elle aurait bloquées, via un point de collecte (`report-uri`/`report-to`). Permet de tester une CSP en production sans risquer de casser une fonctionnalité légitime, avant de passer en mode bloquant."
  - terme: "Fuite de secret dans le bundle"
    definition: "Toute valeur présente dans le code livré au navigateur (fichiers `environment.ts`, constantes, appels d'API tiers directs) est **publique**, minification ou non — un fichier `.map` (source map) même retiré du bundle final peut parfois rester accessible et révéler le code source d'origine."
  - terme: "npm audit"
    definition: "Commande qui compare les dépendances installées (`package-lock.json`) à une base de vulnérabilités connues, et signale les paquets à mettre à jour. À exécuter régulièrement et en intégration continue, pas seulement une fois au démarrage du projet."
  - terme: "ng update"
    definition: "Commande du CLI Angular qui met à jour le framework et ses dépendances associées, en appliquant les schematics de migration nécessaires. Rester sur une version ancienne prive l'application des correctifs de sécurité publiés dans les versions plus récentes."
  - terme: "En-têtes de sécurité HTTP (hébergeur)"
    definition: "En-têtes ajoutés par le serveur ou le CDN qui sert l'application (pas par Angular lui-même) pour durcir le comportement du navigateur : `Content-Security-Policy` (dont la directive `frame-ancestors` empêche l'affichage du site dans une `iframe` tierce), `X-Content-Type-Options: nosniff` (le navigateur cesse de deviner le type d'un fichier), `Strict-Transport-Security` (HTTPS obligatoire) et `Referrer-Policy`. La façon de les déclarer dépend de l'hébergeur ou du CDN : à vérifier dans sa documentation."
  - terme: "Revue de sécurité avant mise en production"
    definition: "Vérification systématique avant chaque déploiement majeur : dépendances à jour (`npm audit`), aucune clé ou secret dans le bundle, CSP en place et testée, HTTPS partout, journaux applicatifs ne contenant aucune donnée personnelle ou jeton, authentification et guards testés avec des cas limites (jeton expiré, absent, falsifié)."
quiz:
  - question: "Un backend authentifie les utilisateurs par cookie de session (pas par jeton Bearer). Un développeur ajoute `withNoXsrfProtection()` à `provideHttpClient()` pour « simplifier ». Quel est le risque ?"
    code: |
      export const appConfig: ApplicationConfig = {
        providers: [
          provideHttpClient(withNoXsrfProtection()),
        ],
      };
    choix:
      - "Aucun risque : la protection XSRF ne concerne que les applications qui utilisent des jetons Bearer"
      - "L'application perd la protection intégrée contre les requêtes forgées par un site tiers : un cookie de session étant automatiquement joint par le navigateur, un site malveillant peut déclencher des requêtes mutantes en se faisant passer pour un utilisateur authentifié"
      - "L'application ne pourra plus faire de requêtes POST du tout"
      - "Le risque disparaît si l'application est servie en HTTPS"
    reponse: 1
    explication: "La protection CSRF intégrée d'Angular est précisément utile quand l'authentification repose sur un cookie envoyé automatiquement par le navigateur à chaque requête, même celles initiées par un autre site. La désactiver avec `withNoXsrfProtection()` supprime le jeton anti-CSRF que le backend est censé vérifier, rouvrant la possibilité qu'un site tiers déclenche des actions au nom de l'utilisateur connecté. HTTPS protège le transport, pas ce type de falsification de requête."
  - question: "Une équipe stocke une clé d'API tierce (service de paiement) dans `environment.prod.ts` pour l'utiliser directement depuis Angular. Pourquoi est-ce risqué même si le fichier `.map` est désactivé en production ?"
    choix:
      - "Ce n'est pas risqué : une fois le code minifié, la clé devient illisible"
      - "N'importe qui peut inspecter le bundle JavaScript livré au navigateur (minifié ou non) et y retrouver la valeur de la clé, car tout code exécuté côté client est par nature public"
      - "Le risque ne concerne que les clés de plus de 32 caractères"
      - "Angular chiffre automatiquement le contenu de environment.prod.ts au build"
    reponse: 1
    explication: "La minification rend le code moins lisible pour un humain, mais ne le chiffre pas : une clé, un secret, un jeton présents dans le bundle final restent une chaîne de caractères extractible par n'importe qui, avec ou sans source map. Toute opération nécessitant un secret (appel à un service tiers avec une clé privée) doit passer par un backend, jamais être exécutée directement depuis le navigateur avec la clé exposée."
  - question: "Que permet de faire une Content-Security-Policy déployée d'abord en `Content-Security-Policy-Report-Only` plutôt que directement en mode bloquant ?"
    choix:
      - "Elle bloque déjà toutes les violations, mais uniquement en environnement de développement"
      - "Elle journalise les violations qu'une politique équivalente en mode bloquant aurait empêchées, sans rien casser en production, ce qui permet de repérer les faux positifs avant de basculer en mode bloquant"
      - "Elle n'a aucun effet, ni blocage ni journalisation"
      - "Elle remplace complètement le besoin de sanitization côté Angular"
    reponse: 1
    explication: "`Content-Security-Policy-Report-Only` sert de phase de test : rien n'est bloqué, mais chaque violation potentielle (script non autorisé, style inline...) est journalisée. Cela permet de découvrir les ressources légitimes que la politique casserait, avant de basculer en `Content-Security-Policy` bloquant. Elle ne remplace jamais la sanitization : ce sont deux couches de défense complémentaires."
---

## Essentiel

Au-delà de XSS et de l'authentification, plusieurs risques côté front méritent une vérification systématique avant mise en production.

**CSRF** cible les authentifications par cookie : un site malveillant peut déclencher une requête vers votre API, et le navigateur y joint automatiquement le cookie de session valide. `HttpClient` intègre une protection par défaut : il lit un jeton dans le cookie `XSRF-TOKEN` et le renvoie dans l'en-tête `X-XSRF-TOKEN` sur les requêtes mutantes vers une URL relative de même origine — seul du code s'exécutant sur votre domaine peut lire ce cookie et reproduire l'en-tête attendu. `withXsrfConfiguration({ cookieName, headerName })` adapte les noms au backend, `withNoXsrfProtection()` la désactive (à réserver aux cas où l'authentification ne repose pas sur un cookie).

```ts
provideHttpClient(
  withXsrfConfiguration({
    cookieName: 'XSRF-TOKEN-BOUTIQUE',
    headerName: 'X-Xsrf-Token-Boutique',
  }),
);
```

**Tout ce qui est livré au navigateur est public** : une clé d'API dans `environment.prod.ts`, minifiée ou non, reste extractible. Une opération qui nécessite un secret doit passer par un backend.

**Dépendances** : `npm audit` régulièrement (et en intégration continue), `ng update` pour rester sur une version d'Angular maintenue et bénéficier des correctifs.

**CSP en production** : la déployer d'abord en `Content-Security-Policy-Report-Only` pour repérer les faux positifs, avant de passer en mode bloquant. Les en-têtes de sécurité HTTP eux-mêmes sont configurés par l'hébergeur (serveur, CDN), pas par Angular.

Enfin, une **journalisation** qui envoie des jetons, mots de passe ou données personnelles vers la console ou un outil de suivi d'erreurs (Sentry...) est une fuite à part entière, même sans faille XSS.

## Détail

### Exemple 1 — Vérifier la protection XSRF de bout en bout

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withXsrfConfiguration({
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    })),
  ],
};
```

Côté backend, ces noms doivent correspondre : le serveur pose le cookie `XSRF-TOKEN` (lisible en JavaScript, donc **pas** `HttpOnly`) au premier chargement, et vérifie la présence de l'en-tête `X-XSRF-TOKEN` sur chaque requête mutante. Si les noms ne correspondent pas entre le serveur et la configuration Angular, la protection ne fonctionne simplement pas — à vérifier avec les outils réseau du navigateur (présence de l'en-tête sur une requête `POST`).

### Exemple 2 — Où mettre une clé qui doit rester secrète

```ts
// À NE PAS FAIRE : appel direct depuis Angular avec une clé privée
async payer(montant: number) {
  return fetch('https://paiement.example/api/charge', {
    headers: { 'Authorization': `Bearer ${environment.clePaiementSecrete}` },
    body: JSON.stringify({ montant }),
  });
}

// À FAIRE : passer par son propre backend, qui détient la clé côté serveur
async payer(montant: number) {
  return this.http.post('/api/paiements', { montant });
  // Le backend ajoute la clé privée à l'appel vers le service de paiement,
  // hors d'atteinte du navigateur.
}
```

Le second appel ne transporte aucun secret : seul le backend, qui n'est jamais livré au navigateur, connaît la clé du service de paiement.

### Exemple 3 — Intégrer `npm audit` à la routine de l'équipe

```bash
npm audit                 # liste les vulnérabilités connues des dépendances installées
npm audit --production    # ignore les dépendances de développement
ng update                 # met à jour Angular et applique les migrations associées
```

Une vulnérabilité corrigée dans une nouvelle version d'une dépendance ne protège rien tant que le projet reste sur l'ancienne version : l'intérêt de `npm audit` en intégration continue est de la détecter avant qu'elle ne s'accumule avec d'autres.

### Exemple 4 — Une journalisation qui fuit des données personnelles

```ts
// À NE PAS FAIRE
catchError((erreur: HttpErrorResponse) => {
  console.error('Échec de connexion', { email, motDePasse, erreur });
  return throwError(() => erreur);
});

// Préférable : ne journaliser que ce qui aide au diagnostic, jamais les identifiants
catchError((erreur: HttpErrorResponse) => {
  console.error('Échec de connexion', { status: erreur.status });
  return throwError(() => erreur);
});
```

Un outil de suivi d'erreurs tiers (Sentry ou équivalent) reçoit tout ce qui est journalisé : un mot de passe ou un jeton loggé « pour déboguer plus vite » finit alors stocké chez un tiers, potentiellement de façon durable.

### Checklist avant mise en production

| Point | Vérification |
|---|---|
| Dépendances | `npm audit` sans vulnérabilité critique non traitée, version d'Angular maintenue |
| Secrets | Aucune clé privée, mot de passe ou jeton dans le bundle (`environment.*.ts` inclus) |
| CSP | En place, testée d'abord en `Report-Only`, puis en mode bloquant |
| CSRF | Activée si l'authentification repose sur un cookie, noms de cookie/en-tête vérifiés avec le backend |
| Journalisation | Aucune donnée personnelle ni jeton envoyé en clair vers la console ou un outil tiers |
| HTTPS | Partout, y compris en environnement de test proche de la production |

### Pièges courants

> **Désactiver la protection XSRF « parce que ça bloquait une requête ».** Un blocage vient presque toujours d'un nom de cookie/en-tête différent entre le backend et `withXsrfConfiguration`, pas d'un défaut du mécanisme. Le corriger plutôt que le désactiver.

> **Croire qu'une clé est protégée parce que le fichier `.map` est retiré du build de production.** La source map facilite la lecture du code d'origine, mais son absence n'empêche pas d'inspecter directement le bundle JavaScript exécuté, où la valeur de la clé reste présente en clair.

> **Ne faire `npm audit` qu'une fois, au lancement du projet.** De nouvelles vulnérabilités sont découvertes en continu dans des dépendances déjà installées ; sans vérification récurrente (idéalement en intégration continue), une faille corrigée en amont reste active dans le projet pendant des mois.

### À retenir

- La protection CSRF intégrée d'Angular (`withXsrfConfiguration` / `withNoXsrfProtection`) repose par défaut sur le cookie `XSRF-TOKEN` et l'en-tête `X-XSRF-TOKEN` ; elle a du sens dès que l'authentification passe par un cookie.
- Tout ce qui est livré au navigateur est public : jamais de secret dans le bundle, minification ou non ; les opérations sensibles passent par un backend.
- `npm audit` et `ng update` sont des routines récurrentes, pas des vérifications ponctuelles.
- Une CSP se teste d'abord en `Report-Only` avant d'être appliquée en mode bloquant ; les en-têtes de sécurité HTTP eux-mêmes relèvent de la configuration de l'hébergeur, pas d'Angular.
- La journalisation (console, outils tiers) ne doit jamais contenir de mots de passe, jetons ou données personnelles.
