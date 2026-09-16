---
id: tests-services-http
chapitre: tests-angular
ordre: 3
titre: Tester services et appels HTTP
termes:
  - terme: HttpTestingController
    definition: "Service injectable (`provideHttpClientTesting()`) qui capture les requêtes émises pendant un test au lieu de les envoyer sur le réseau. Permet de faire des assertions sur ces requêtes puis de simuler leur réponse."
  - terme: "expectOne()"
    definition: "Méthode de `HttpTestingController` qui vérifie qu'**exactement une** requête correspond aux critères donnés (URL, méthode, prédicat), et échoue sinon. Renvoie l'objet requête capturée, sur lequel on appelle ensuite `flush()` ou `error()`."
  - terme: "flush()"
    definition: "Simule la réponse du serveur pour une requête capturée : `req.flush(donnees)` pour un succès, `req.flush(message, { status, statusText })` pour une erreur HTTP avec un code précis."
  - terme: "verify()"
    definition: "Vérifie qu'aucune requête inattendue n'a été faite pendant le test (aucune requête « oubliée », non vérifiée par un `expectOne`/`match`). S'appelle généralement dans un `afterEach()`."
  - terme: "provideHttpClientTesting()"
    definition: "Fournisseur qui remplace le backend HTTP réel par un backend de test dans `TestBed`. Doit être déclaré **après** `provideHttpClient(...)` dans le tableau `providers`, sous peine de compromettre le test."
  - terme: fakeAsync
    definition: "Utilitaire historique de test Angular (`@angular/core/testing`) qui permettait d'avancer le temps virtuellement avec `tick()`. **Non recommandé et incompatible avec le runner Vitest** — à réserver, si nécessaire, à un projet resté sur Karma."
  - terme: "vi.useFakeTimers()"
    definition: "Fonctionnalité de minuteurs simulés fournie par Vitest, alternative à `fakeAsync`/`tick()` pour contrôler le temps dans un test (`vi.useFakeTimers()`, puis `await vi.runAllTimersAsync()`)."
quiz:
  - question: "Que se passe-t-il si les providers sont déclarés dans cet ordre ?"
    code: |
      TestBed.configureTestingModule({
        providers: [
          provideHttpClientTesting(),
          provideHttpClient(),
        ],
      });
    choix:
      - "Aucune différence : l'ordre des providers HTTP n'a pas d'importance"
      - "L'ordre inverse est attendu : `provideHttpClient()` doit être déclaré avant `provideHttpClientTesting()`, sinon le test peut se comporter de façon incorrecte"
      - "Angular lève une erreur de compilation si `provideHttpClientTesting()` est déclaré en premier"
      - "`provideHttpClient()` est ignoré car il est redondant avec `provideHttpClientTesting()`"
    reponse: 1
    explication: "`provideHttpClientTesting()` doit venir après `provideHttpClient(...)` pour remplacer correctement le backend réel par le backend de test, y compris quand des fonctionnalités comme des intercepteurs sont configurées avec `provideHttpClient()`. Inverser l'ordre peut casser le test silencieusement."
  - question: "Comment simuler une erreur HTTP 500 renvoyée par le serveur sur une requête capturée par `HttpTestingController` ?"
    choix:
      - "`req.flush(null, { status: 500, statusText: 'Erreur serveur' })`"
      - "`req.cancel(500)`"
      - "`httpTesting.expectError(500)`"
      - "En levant une exception JavaScript dans le test"
    reponse: 0
    explication: "`flush()` accepte un deuxième argument avec `status` et `statusText` pour simuler une réponse HTTP en erreur. `req.error(new ProgressEvent(...))` sert plutôt à simuler une erreur réseau (pas de réponse HTTP du tout), pas un code d'erreur serveur."
  - question: "Pourquoi éviter `fakeAsync`/`tick()` dans un nouveau projet Angular 21 utilisant Vitest ?"
    choix:
      - "Parce que `fakeAsync` est désormais réservé aux composants, plus aux services"
      - "Parce que `fakeAsync` ne peut pas être utilisé avec le runner Vitest, et que son usage n'est de toute façon plus recommandé ; Vitest propose ses propres minuteurs simulés (`vi.useFakeTimers()`)"
      - "Parce que `tick()` provoque systématiquement une boucle infinie en mode zoneless"
      - "Parce que `fakeAsync` a été retiré d'Angular 21"
    reponse: 1
    explication: "La documentation Angular 21 est explicite : `fakeAsync` n'est plus recommandé, et surtout, il ne fonctionne pas avec le runner Vitest. Pour contrôler le temps dans un test asynchrone sous Vitest, on utilise les minuteurs simulés de Vitest (`vi.useFakeTimers()`, `vi.runAllTimersAsync()`)."
---

## Essentiel

Un service à signaux, sans dépendance HTTP, se teste souvent **sans `TestBed`** : c'est une classe normale, instanciable directement.

```ts
const service = new PanierService();
service.ajouter({ produit: 'Clavier', prix: 49, quantite: 1 });
expect(service.total()).toBe(49);
```

`TestBed` redevient nécessaire dès que le service utilise `inject()` ou dépend d'autres services fournis par injection — dont `HttpClient`. Pour tester un service qui fait des appels HTTP, on remplace le vrai réseau par un contrôleur de test :

```ts
TestBed.configureTestingModule({
  providers: [provideHttpClient(), provideHttpClientTesting()],
});

const httpTesting = TestBed.inject(HttpTestingController);
const service = TestBed.inject(ProduitService);

service.chargerProduit(42).subscribe();

const req = httpTesting.expectOne('/api/produits/42');
expect(req.request.method).toBe('GET');
req.flush({ id: 42, nom: 'Clavier' });

httpTesting.verify();
```

`expectOne()` capture la requête au lieu de l'envoyer, `flush()` simule la réponse du serveur, `verify()` (souvent dans un `afterEach`) s'assure qu'aucune requête n'a été oubliée. Important : `provideHttpClient(...)` doit toujours précéder `provideHttpClientTesting()` dans les `providers`.

Pour le code asynchrone en général, les promesses et observables se testent normalement (`await`, `firstValueFrom`, ou assertions dans le `subscribe`). `fakeAsync`/`tick()` — l'ancien outil pour avancer le temps virtuellement — **n'est plus recommandé et ne fonctionne pas avec Vitest** ; Vitest fournit ses propres minuteurs simulés.

## Détail

### Exemple 1 — Tester un service à signaux sans `TestBed`

```ts
describe('PanierService', () => {
  it('calcule le total en fonction des lignes ajoutées', () => {
    const service = new PanierService();

    service.ajouter({ produit: 'Clavier', prix: 49, quantite: 1 });
    service.ajouter({ produit: 'Souris', prix: 19, quantite: 2 });

    expect(service.total()).toBe(87);
  });
});
```

Pas besoin de `TestBed` : aucune dépendance injectée, le service est une simple classe TypeScript. C'est la forme de test la plus rapide à écrire et à exécuter.

### Exemple 2 — Tester un intercepteur

```ts
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('ajoute un en-tête Authorization à chaque requête', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    const http = TestBed.inject(HttpClient);
    const httpTesting = TestBed.inject(HttpTestingController);

    http.get('/api/commandes').subscribe();

    const req = httpTesting.expectOne('/api/commandes');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jeton-test');

    req.flush([]);
    httpTesting.verify();
  });
});
```

L'intercepteur fonctionnel est branché via `withInterceptors([...])` sur `provideHttpClient()` — la requête capturée par `HttpTestingController` reflète ce que l'intercepteur lui a réellement fait subir.

### Exemple 3 — Simuler un code d'erreur

```ts
it('propage une erreur quand le produit n\'existe pas', () => {
  const service = TestBed.inject(ProduitService);
  const httpTesting = TestBed.inject(HttpTestingController);

  let erreurRecue: unknown;
  service.chargerProduit(999).subscribe({
    error: (e) => (erreurRecue = e),
  });

  httpTesting.expectOne('/api/produits/999').flush(
    { message: 'Produit introuvable' },
    { status: 404, statusText: 'Not Found' },
  );

  expect(erreurRecue).toBeDefined();
});
```

`flush(corps, { status, statusText })` simule une réponse HTTP en erreur (le serveur a répondu, mais avec un code d'échec) — à distinguer d'une erreur réseau simulée avec `req.error(...)`, où il n'y a aucune réponse du tout.

### Exemple 4 — Code asynchrone : promesse, observable, minuteur simulé

```ts
// Une promesse : await direct
it('résout avec la liste des produits', async () => {
  const produits = await service.chargerTousLesProduits();
  expect(produits.length).toBeGreaterThan(0);
});

// Un debounce piloté par un minuteur, avec les timers simulés de Vitest
it('attend 300ms avant de lancer la recherche', () => {
  vi.useFakeTimers();
  const rechercher = vi.fn();

  service.rechercherAvecDelai('clavier', rechercher);
  expect(rechercher).not.toHaveBeenCalled();

  vi.advanceTimersByTime(300);
  expect(rechercher).toHaveBeenCalledWith('clavier');

  vi.useRealTimers();
});
```

`fakeAsync`/`tick()` restent mentionnés dans certains projets plus anciens sous Karma, mais la documentation Angular 21 les déconseille désormais explicitement, et ils ne fonctionnent pas du tout sous Vitest.

### Pièges courants

> **Inverser `provideHttpClientTesting()` et `provideHttpClient()`.** `provideHttpClientTesting()` doit venir après, pour remplacer correctement le backend HTTP — y compris les fonctionnalités ajoutées à `provideHttpClient()` comme les intercepteurs. Dans le mauvais ordre, le test peut sembler fonctionner tout en cachant un bug.

> **Oublier `httpTesting.verify()`.** Sans cet appel (généralement en `afterEach`), une requête émise par erreur (mauvaise URL, appel en double) passe inaperçue au lieu de faire échouer le test.

> **Utiliser `fakeAsync`/`tick()` dans un projet sous Vitest.** Ce combo ne fonctionne pas : le test échoue ou se comporte de façon incohérente. Utiliser les minuteurs simulés propres à Vitest (`vi.useFakeTimers()`) à la place.

### À retenir

- Un service sans dépendance injectée se teste par instanciation directe, sans `TestBed`.
- `provideHttpClient()` + `provideHttpClientTesting()` (dans cet ordre) remplacent le réseau réel par `HttpTestingController` dans les tests.
- `expectOne()` capture une requête, `flush()` simule sa réponse (succès ou erreur HTTP), `verify()` détecte les requêtes oubliées.
- Un intercepteur se teste comme n'importe quel appel HTTP : la requête capturée reflète ses éventuelles modifications.
- `fakeAsync`/`tick()` sont déconseillés et incompatibles avec Vitest ; préférer `vi.useFakeTimers()` pour contrôler le temps dans un test.
