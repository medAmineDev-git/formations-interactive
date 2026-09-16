---
id: intercepteurs
chapitre: http
ordre: 2
titre: Les intercepteurs
termes:
  - terme: HttpInterceptorFn
    definition: "Type d'un intercepteur **fonctionnel** : une fonction `(req, next) => Observable<HttpEvent<unknown>>`. C'est la forme **recommandée** depuis Angular 15, à privilégier pour tout nouveau code."
  - terme: "withInterceptors([...])"
    definition: "Option de `provideHttpClient()` qui enregistre une liste d'intercepteurs fonctionnels. Ils s'exécutent **dans l'ordre du tableau**, chacun avant de passer la main au suivant."
  - terme: "req.clone()"
    definition: "Une `HttpRequest` est **immuable** : on ne peut pas modifier ses propriétés directement. Pour changer une en-tête, une URL ou un corps, on crée une copie modifiée avec `req.clone({ ... })`."
  - terme: next
    definition: "Fonction reçue en second paramètre par un intercepteur fonctionnel : l'appeler avec la requête (éventuellement clonée) **transmet la main** au prochain intercepteur, ou à `HttpClient` s'il n'y en a plus. Ne pas l'appeler bloque la requête."
  - terme: "HTTP_INTERCEPTORS (classe, legacy)"
    definition: "Ancienne forme d'intercepteur : une classe implémentant `HttpInterceptor` (méthode `intercept(req, next)`), enregistrée via le jeton `HTTP_INTERCEPTORS`. Toujours supportée, mais la doc met désormais en avant la forme fonctionnelle."
  - terme: "withInterceptorsFromDi()"
    definition: "Option de `provideHttpClient()` qui inclut dans la chaîne les intercepteurs de classe déclarés via `HTTP_INTERCEPTORS`. Utile pour faire cohabiter d'anciens intercepteurs de classe avec de nouveaux intercepteurs fonctionnels."
  - terme: Ordre d'exécution
    definition: "Les intercepteurs s'enchaînent comme des maillons : le premier de `withInterceptors([...])` voit la requête en premier (à l'aller) et la réponse en dernier (au retour). L'ordre du tableau a donc un effet réel sur le comportement."
quiz:
  - question: "Pourquoi ce code ne compile-t-il pas ?"
    code: |
      export const authInterceptor: HttpInterceptorFn = (req, next) => {
        req.headers.set('Authorization', `Bearer ${getToken()}`);
        return next(req);
      };
    choix:
      - "getToken() ne peut pas être appelé dans un intercepteur"
      - "req.headers est en lecture seule : HttpRequest est immuable, il faut passer par req.clone()"
      - "next(req) doit être appelé avant de modifier req, pas après"
      - "Un intercepteur fonctionnel ne peut pas accéder aux en-têtes"
    reponse: 1
    explication: "HttpRequest (et ses en-têtes) sont immuables : on ne peut pas les modifier en place. Il faut créer une copie via req.clone({ headers: req.headers.set('Authorization', ...) }) puis passer cette copie à next()."
  - question: "Un intercepteur de journalisation (logging) doit mesurer le temps total de la requête, jeton d'authentification compris. Dans quel ordre faut-il les déclarer ?"
    code: |
      provideHttpClient(
        withInterceptors([loggingInterceptor, authInterceptor]),
      )
    choix:
      - "L'ordre ne change rien au résultat mesuré"
      - "loggingInterceptor doit être déclaré avant authInterceptor, comme dans ce code, pour englober tout le traitement du jeton"
      - "authInterceptor doit toujours être déclaré en dernier, quel que soit le besoin"
      - "Il faut fusionner les deux intercepteurs en un seul pour garantir l'ordre"
    reponse: 1
    explication: "Les intercepteurs s'exécutent dans l'ordre du tableau à l'aller, et dans l'ordre inverse au retour : loggingInterceptor déclaré en premier entoure donc tout ce qui se passe ensuite, y compris l'ajout du jeton par authInterceptor. C'est exactement ce que fait ce code."
  - question: "Une application legacy utilise encore des intercepteurs de classe enregistrés via HTTP_INTERCEPTORS, en plus de nouveaux intercepteurs fonctionnels. Que faut-il faire pour que les deux s'exécutent ?"
    choix:
      - "Rien : withInterceptors() inclut automatiquement les intercepteurs de classe"
      - "Ajouter withInterceptorsFromDi() aux options de provideHttpClient(), en plus de withInterceptors()"
      - "Réécrire obligatoirement tous les intercepteurs de classe en intercepteurs fonctionnels"
      - "Utiliser NgModule à la place de provideHttpClient()"
    reponse: 1
    explication: "withInterceptors() n'active que les intercepteurs fonctionnels passés en argument. Pour que les intercepteurs de classe déclarés via HTTP_INTERCEPTORS s'exécutent aussi, il faut ajouter withInterceptorsFromDi() aux options de provideHttpClient()."
---

## Essentiel

Un **intercepteur** s'insère entre le code qui appelle `HttpClient` et l'envoi réel de la requête : il peut la lire, la modifier, ou intercepter la réponse (et les erreurs). Cas d'usage typiques : ajouter un jeton d'authentification, journaliser les appels, afficher un indicateur de chargement global.

La forme recommandée est **fonctionnelle**, typée `HttpInterceptorFn` :

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).jeton();
  const reqAvecJeton = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });
  return next(reqAvecJeton);
};
```

On l'enregistre avec `withInterceptors([...])` dans `app.config.ts` :

```ts
provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor]));
```

Point essentiel : une `HttpRequest` est **immuable**. Impossible de modifier `req.headers` ou `req.url` directement : il faut passer par `req.clone({ ... })`, qui retourne une copie avec les propriétés changées.

Les intercepteurs s'enchaînent **dans l'ordre du tableau** : le premier voit la requête en premier, et la réponse en dernier. C'est le même principe qu'une chaîne de middlewares.

L'ancienne forme, à base de **classes** implémentant `HttpInterceptor`, reste supportée (via `withInterceptorsFromDi()`) mais n'est plus mise en avant par la documentation officielle pour du code neuf.

## Détail

### Comment fonctionne un intercepteur fonctionnel

Un `HttpInterceptorFn` reçoit deux paramètres : la requête (`req`) et une fonction `next` qui représente « la suite de la chaîne ». Appeler `next(req)` transmet la requête (éventuellement clonée) au prochain intercepteur, ou à `HttpClient` s'il n'y en a plus. **Ne pas appeler `next`** bloque définitivement la requête, sans erreur explicite.

### Exemple 1 — Ajouter un jeton d'authentification

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.jeton();

  if (!token) {
    return next(req); // pas de jeton : requête inchangée
  }

  return next(
    req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    }),
  );
};
```

`inject(AuthService)` fonctionne directement dans un intercepteur fonctionnel : il s'exécute dans le contexte d'injection de l'application.

### Exemple 2 — Journaliser les requêtes

```ts
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const debut = Date.now();
  console.log(`→ ${req.method} ${req.url}`);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          console.log(`← ${req.method} ${req.url} en ${Date.now() - debut} ms`);
        }
      },
    }),
  );
};
```

L'intercepteur peut observer la réponse en chaînant un opérateur RxJS sur ce que retourne `next(req)`, exactement comme sur n'importe quel `Observable`.

### Exemple 3 — Intercepteur de chargement global

```ts
@Injectable({ providedIn: 'root' })
export class ChargementService {
  private compteur = signal(0);
  enCours = computed(() => this.compteur() > 0);

  demarrer() {
    this.compteur.update((n) => n + 1);
  }

  terminer() {
    this.compteur.update((n) => n - 1);
  }
}

export const chargementInterceptor: HttpInterceptorFn = (req, next) => {
  const chargement = inject(ChargementService);
  chargement.demarrer();

  return next(req).pipe(finalize(() => chargement.terminer()));
};
```

Un compteur (plutôt qu'un simple booléen) évite qu'une requête terminée en désactive l'indicateur pendant qu'une autre est encore en cours.

### Exemple 4 — Plusieurs intercepteurs, un ordre qui compte

```ts
provideHttpClient(
  withInterceptors([
    chargementInterceptor, // démarre l'indicateur avant tout le reste
    loggingInterceptor,    // journalise la requête, jeton compris
    authInterceptor,       // ajoute le jeton en dernier avant l'envoi
  ]),
);
```

À l'aller, `chargementInterceptor` s'exécute en premier ; au retour (la réponse), il s'exécute en dernier — il entoure donc bien tout le reste, y compris les erreurs éventuelles.

| | Fonctionnel (`HttpInterceptorFn`) | Classe (`HttpInterceptor`) |
|---|---|---|
| Forme | Fonction `(req, next) => Observable` | Classe avec méthode `intercept(req, next)` |
| Enregistrement | `withInterceptors([...])` | `HTTP_INTERCEPTORS` + `withInterceptorsFromDi()` |
| Statut dans la doc | Recommandé pour le code neuf | Toujours supporté, plus mis en avant |
| Injection de dépendances | `inject(...)` dans le corps de la fonction | Constructeur de la classe |

### Pièges courants

> **Modifier `req` directement.** `req.headers.set(...)` sans `req.clone({ ... })` échoue : `HttpRequest` est immuable, ses propriétés (dont `headers`) sont en lecture seule côté TypeScript. La bonne forme est `req.clone({ headers: req.headers.set(...) })`.

> **Oublier d'appeler `next`.** Un intercepteur qui ne retourne pas `next(req)` (ou un `Observable` équivalent) bloque la requête sans erreur visible : elle ne part simplement jamais.

> **Ignorer l'ordre du tableau.** Placer `authInterceptor` après un intercepteur qui lit déjà les en-têtes pour journaliser peut faire journaliser une requête **sans** le jeton, alors qu'il sera bien présent à l'envoi réel.

### À retenir

- Un intercepteur fonctionnel a le type `HttpInterceptorFn` : `(req, next) => Observable<HttpEvent<unknown>>`.
- `HttpRequest` est immuable : toute modification passe par `req.clone({ ... })`.
- `withInterceptors([...])` enregistre les intercepteurs fonctionnels, dans l'ordre du tableau.
- `withInterceptorsFromDi()` réintègre les anciens intercepteurs de classe (`HTTP_INTERCEPTORS`), toujours supportés.
- Cas d'usage classiques : jeton d'authentification, journalisation, indicateur de chargement global.
