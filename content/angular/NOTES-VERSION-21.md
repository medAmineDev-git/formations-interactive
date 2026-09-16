# Angular 21 — Fiche de référence factuelle

> Fiche de référence pour les rédacteurs de contenu pédagogique. Exactitude avant exhaustivité.
> Dernière vérification : **16 septembre 2026**.

## ⚠️ Avertissement méthodologique important

Au moment de la rédaction, **Angular 22 est déjà sorti** (`22.0.0` le 2026-06-03, patchs jusqu'à `22.1.6` / `22.2.0-next.7` au 2026-09-09 selon le [CHANGELOG officiel](https://github.com/angular/angular/blob/main/CHANGELOG.md)). Le site **`angular.dev` sert par défaut la documentation de la version actuelle (v22)**, pas celle d'Angular 21.

Pour obtenir une documentation fidèle à la version 21, ce document s'appuie sur le **site versionné `https://v21.angular.dev`** (équivalent de l'ancien `vXX.angular.io`), qui conserve la documentation figée d'Angular 21, complété par :
- le blog officiel [blog.angular.dev](https://blog.angular.dev/announcing-angular-v21-57946c34f14b) (annonce de la v21),
- le [CHANGELOG.md](https://github.com/angular/angular/blob/main/CHANGELOG.md) du dépôt `angular/angular` (sections `21.0.0` à `21.2.x`),
- la page d'événement [angular.dev/events/v21](https://angular.dev/events/v21).

Angular 21 correspond à la ligne `21.x` : `21.0.0` publié le **19 novembre 2025** (tag npm/CHANGELOG), annoncé publiquement le **20 novembre 2025** lors de l'événement de lancement. Au 16 septembre 2026, la dernière patch connue est `21.2.23` (2026-09-09) — cette fiche décrit le comportement de la **ligne 21.x dans son ensemble** (y compris les évolutions mineures 21.1 et 21.2), en signalant les changements de patch notables (ex. renommage d'une directive).

---

## 1. Nouveautés d'Angular 21

### Résumé des annonces principales (blog officiel + CHANGELOG)

| Nouveauté | Statut en v21 | Depuis |
|---|---|---|
| Zoneless par défaut pour les nouvelles apps | **Stable** (API `provideZonelessChangeDetection` stable depuis v20.2) | v21.0 |
| Signal Forms (`@angular/forms/signals`) | **Expérimental** | v21.0 |
| Angular Aria (`@angular/aria`) | **Developer Preview** | v21.0 |
| Vitest comme test runner par défaut des nouveaux projets | **Stable** | v21.0 |
| Angular MCP Server | **Stable** (certains outils restent expérimentaux : `modernize`, `onpush_zoneless_migration`) | v21.0 |
| Regex supportées dans les templates | Nouveauté | v21.0 |
| Déclencheurs `IntersectionObserver` personnalisés pour `@defer (on viewport)` | Nouveauté | v21.0 |
| `SimpleChanges` générique | Nouveauté | v21.0 |
| `ChangeDetectionStrategy.Eager` (alias de `Default`) | Nouveauté | v21.2 |
| `resource()` — composition via « snapshots » | Nouveauté | v21.2 |

Citation exacte du blog officiel (annonce v21) : *« Zone.js and its features will no longer be included by default in Angular applications in v21 »* ; *« Signal Forms, an experimental library that allows you to manage form state by building on the reactive foundations of Signals »* ; *« Vitest as our new default test runner, and are promoting it to stable in Angular v21 »*.

### Ruptures (breaking changes) v20 → v21 (CHANGELOG `21.0.0`)

- **TypeScript < 5.9 n'est plus supporté** (minimum requis : TypeScript 5.9, plage officielle `>=5.9.0 <6.0.0` selon `v21.angular.dev/reference/versions`).
- `NgModuleFactory` **supprimé** (utiliser `NgModule`).
- `UpgradeAdapter` (`@angular/upgrade`) **supprimé** (utiliser `upgrade/static`).
- `moduleId` supprimé des métadonnées `@Component`.
- L'option `interpolation` des composants (délimiteurs personnalisés) est **supprimée** — seul `{{ }}` est supporté.
- L'export `ApplicationConfig` depuis `@angular/platform-browser` est **supprimé** — il faut l'importer depuis `@angular/core`.
- Bootstrap serveur (SSR) : `bootstrapApplication` prend désormais un `BootstrapContext` en 3ᵉ argument côté serveur (un schematic migre `main.server.ts` automatiquement) ; `getPlatform()`/`destroyPlatform()` deviennent no-op côté serveur.
- `ignoreChangesOutsideZone` n'est plus une option disponible.
- Angular ne fournit plus de scheduler de détection de changements basé sur ZoneJS par défaut — il faut ajouter explicitement `provideZoneChangeDetection` si on reste en mode Zone (migration automatique fournie).
- Le vérificateur de types active désormais **par défaut** la vérification de type des *host bindings* (`typeCheckHostBindings`) — cela peut révéler des erreurs de type jusqu'ici masquées ; possibilité de désactiver via `"typeCheckHostBindings": false` dans `angularCompilerOptions`.
- Routeur : `lastSuccessfulNavigation` devient un **signal** (s'appelle désormais comme une fonction).
- (Tests uniquement) `TestBed` fournit désormais un faux `PlatformLocation` supportant la Navigation API (peut casser certains tests ; revenir à l'ancien comportement via `{provide: PlatformLocation, useClass: MockPlatformLocation}` depuis `@angular/common/testing`).
- (Tests uniquement) Les erreurs sont désormais systématiquement relancées par `TestBed`, même avec `provideZoneChangeDetection` dans les providers de test.
- `ngComponentOutletContent` est maintenant typé `Node[][] | undefined` (au lieu de `any[][] | undefined`).
- IE / Edge non-Chromium ne sont plus supportés par zone.js.

### Dépréciations v21

- `HttpResponseBase.statusText` déprécié (v21.0).
- `VERSION` exporté depuis `@angular/upgrade` déprécié — utiliser l'export de `@angular/upgrade/static` (v21.1).
- `@angular/animations` déprécié **depuis v20.2** (donc déjà déprécié en entrant dans la ligne v21), intention de suppression en **v23**. Voir section 13.
- `*ngIf` / `*ngFor` / `*ngSwitch` (et dérivés) dépréciés **depuis v20.0** (voir section 5), toujours fonctionnels en v21.

**Sources** : [blog.angular.dev — Announcing Angular v21](https://blog.angular.dev/announcing-angular-v21-57946c34f14b), [angular.dev/events/v21](https://angular.dev/events/v21), [CHANGELOG.md — section 21.0.0](https://github.com/angular/angular/blob/main/CHANGELOG.md), [v21.angular.dev/reference/versions](https://v21.angular.dev/reference/versions).

---

## 2. Composants

- **Standalone par défaut depuis Angular 19.** En v21, un composant/directive/pipe est standalone sans qu'il soit nécessaire d'écrire `standalone: true`. Pour un composant destiné à un `NgModule` (cas legacy), il faut explicitement écrire `standalone: false`.
- **Sélecteurs** : convention — préfixe applicatif en camelCase pour les attributs, kebab-case pour les éléments (ex. `app-user-card`, `[appTooltip]`).
- **`styleUrl` (singulier)** est la syntaxe recommandée/documentée pour une feuille de style unique (accepte une chaîne, contrairement à `styleUrls` qui prenait un tableau). `styleUrls` reste utilisable mais n'apparaît plus dans les exemples de la doc officielle.

```ts
@Component({
  selector: 'app-profile-photo',
  templateUrl: 'profile-photo.html',
  styleUrl: 'profile-photo.css',
})
export class ProfilePhoto {}
```

- **Cycle de vie** : hooks classiques inchangés — `ngOnInit`, `ngOnChanges`, `ngDoCheck`, `ngAfterContentInit`, `ngAfterContentChecked`, `ngAfterViewInit`, `ngAfterViewChecked`, `ngOnDestroy`.
- **`afterNextRender`** (stable) : exécute un callback une seule fois, après le prochain rendu.
- **`afterRenderEffect`** (stable) : combine `effect()` et les hooks de rendu (`earlyRead`/`write`/`read`/`mixedReadWrite`) pour lire/écrire le DOM après le rendu, en réagissant aux signaux lus.

```ts
import { Component, ElementRef, afterNextRender, afterRenderEffect, inject, signal } from '@angular/core';

@Component({ /* ... */ })
export class UserProfile {
  private elementRef = inject(ElementRef);
  count = signal(0);

  constructor() {
    afterNextRender(() => {
      this.elementRef.nativeElement.style.padding = '10px';
    });

    afterRenderEffect(() => {
      console.log('rendu avec count =', this.count());
    });
  }
}
```

**Statut** : `standalone` par défaut, `styleUrl`, cycle de vie, `afterNextRender`, `afterRenderEffect` — tous **stables**.

**Sources** : [v21.angular.dev/guide/components](https://v21.angular.dev/guide/components), [v21.angular.dev/guide/components/styling](https://v21.angular.dev/guide/components/styling), [v21.angular.dev/api/core/afterRenderEffect](https://v21.angular.dev/api/core/afterRenderEffect).

---

## 3. Signaux

| API | Statut en v21 | Depuis |
|---|---|---|
| `signal()` | **Stable** (pas de badge de statut sur la page API — stable depuis les débuts des Signals) | ~v17 |
| `computed()` | **Stable** (idem) | ~v17 |
| `effect()` | **Stable** | v20.0 |
| `linkedSignal()` | **Stable** | v20.0 |
| `toSignal()` (`@angular/core/rxjs-interop`) | **Stable** (pas de badge explicite trouvé, considérer comme stable) | — |
| `toObservable()` (`@angular/core/rxjs-interop`) | **Stable** | v20.0 |
| `resource()` | **Expérimental** — *« `resource` is experimental. It's ready for you to try, but it might change before it is stable »* | v19.0 |
| `httpResource()` | **Expérimental** | v19.2 |

Important pour les rédacteurs : contrairement à une idée reçue répandue (le site `angular.dev` générique affiche aujourd'hui la doc v22, où `resource()`/`httpResource()` sont passés stables), **en Angular 21, `resource()` et `httpResource()` sont explicitement marqués expérimentaux** dans la documentation versionnée v21.

```ts
import { signal, computed, effect, linkedSignal, resource } from '@angular/core';

const count = signal(0);
const doubleCount = computed(() => count() * 2);

effect(() => console.log(`count = ${count()}`));

// linkedSignal : se réinitialise quand sa source change
const selectedItem = signal<Item>(items[0]);
const draft = linkedSignal(() => selectedItem());

// resource() — expérimental
const userId = signal(1);
const userResource = resource({
  params: () => ({ id: userId() }),
  loader: ({ params }) => fetchUser(params.id),
});
```

**Sources** : [v21.angular.dev/guide/signals](https://v21.angular.dev/guide/signals), [v21.angular.dev/guide/signals/resource](https://v21.angular.dev/guide/signals/resource), [v21.angular.dev/api/core/resource](https://v21.angular.dev/api/core/resource), [v21.angular.dev/api/common/http/httpResource](https://v21.angular.dev/api/common/http/httpResource), [v21.angular.dev/api/core/effect](https://v21.angular.dev/api/core/effect), [v21.angular.dev/api/core/linkedSignal](https://v21.angular.dev/api/core/linkedSignal).

---

## 4. API des composants (inputs, outputs, model, queries, host)

| API | Statut | Depuis |
|---|---|---|
| `input()` / `input.required()` | **Stable** | — (~v17.1, généralisé v19) |
| `output()` | **Stable** | v19.0 |
| `model()` | **Stable** | v19.0 |
| `viewChild()` / `viewChildren()` / `contentChild()` / `contentChildren()` | **Stable** | v19.0 |
| `@Input` / `@Output` / `@ViewChild` / `@ViewChildren` / `@ContentChild` / `@ContentChildren` (décorateurs) | **Non dépréciés**, toujours pleinement supportés | — |

La documentation officielle est explicite : l'équipe Angular **recommande** les API à base de signaux pour les nouveaux projets, mais les décorateurs historiques *« remain fully supported »* — ils ne sont pas dépréciés.

```ts
export class CustomSlider {
  // signal-based (recommandé)
  value = input(0);
  requiredValue = input.required<number>();
  changed = output<number>();
  checked = model(false);

  header = viewChild(CustomCardHeader);
  header2 = viewChild.required(CustomCardHeader);
  actions = viewChildren(CustomCardAction);

  // décorateurs classiques (toujours supportés)
  // @Input() value = 0;
  // @Output() changed = new EventEmitter<number>();
  // @ViewChild(CustomCardHeader) header!: CustomCardHeader;
}
```

**`host`** (liaisons sur l'élément hôte) et **`hostDirectives`** (composition de directives) :

```ts
@Directive({
  selector: '[appTrigger]',
  host: {
    '[attr.data-trigger-id]': 'triggerId()',
  },
})
export class TriggerRef {}

@Component({
  selector: 'app-admin-menu',
  hostDirectives: [
    { directive: MenuBehavior, inputs: ['menuId'], outputs: ['menuClosed'] },
  ],
})
export class AdminMenu {}
```

**Sources** : [v21.angular.dev/guide/components/inputs](https://v21.angular.dev/guide/components/inputs) *(via angular.dev, contenu recoupé)*, [v21.angular.dev/api/core/output](https://v21.angular.dev/api/core/output), [v21.angular.dev/api/core/model](https://v21.angular.dev/api/core/model), [v21.angular.dev/api/core/viewChild](https://v21.angular.dev/api/core/viewChild), [v21.angular.dev/guide/directives/directive-composition-api](https://v21.angular.dev/guide/directives/directive-composition-api).

---

## 5. Templates — contrôle de flux

| Bloc | Statut | Règle clé |
|---|---|---|
| `@if` / `@else if` / `@else` | **Stable** | — |
| `@for` | **Stable** | `track` est **obligatoire** |
| `@switch` / `@case` / `@default` | **Stable** | comparaison stricte (`===`), pas de fallthrough |
| `@let` | **Stable** | déclare une variable locale dans le template |
| `@defer` (+ `@placeholder`, `@loading`, `@error`) | **Stable** | chargement paresseux de sous-arbres |
| `*ngIf`, `*ngFor`, `*ngSwitch`/`NgSwitchCase`/`NgSwitchDefault` | **Dépréciés depuis v20.0**, *« Intent to remove in a future major release »* — toujours fonctionnels en v21, pas encore supprimés | — |

```html
@if (isAdmin()) {
  <app-admin-dashboard />
} @else if (isEditor()) {
  <app-editor-dashboard />
} @else {
  <app-viewer-dashboard />
}

@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>Aucun élément</li>
}

@switch (permission()) {
  @case ('admin') { <app-admin /> }
  @case ('editor') { <app-editor /> }
  @default { <app-viewer /> }
}

@let total = price() * quantity();
<p>Total : {{ total }}</p>

@defer (on viewport; hydrate on interaction) {
  <app-comments />
} @placeholder {
  <div>Chargement des commentaires…</div>
} @loading (minimum 200ms) {
  <app-spinner />
}
```

**Statut exact `*ngIf`** (page API `NgIf`, v21) : *« Use the `@if` block instead. Intent to remove in a future major release »*, déprécié **« since v20.0 »**. Un schematic de migration automatique existe (`ng generate @angular/core:control-flow`).

**Sources** : [v21.angular.dev/guide/templates/control-flow](https://v21.angular.dev/guide/templates/control-flow), [v21.angular.dev/api/common/NgIf](https://v21.angular.dev/api/common/NgIf).

---

## 6. Détection de changements — zoneless

- **Zoneless est le comportement par défaut pour toute nouvelle application créée avec `ng new` en Angular 21.** Citation officielle : *« Zoneless is the default in Angular v21+ so you do not need to do anything to enable it »*.
- L'API `provideZonelessChangeDetection()` (`@angular/core`) est **stable depuis v20.2** (badge « stable since v20.2 »).
- Pour une application **v20** (ou pour comprendre le mécanisme), activation manuelle :

```ts
import { provideZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
});
```

- En v21+, il n'y a rien à ajouter par défaut ; il faut en revanche **vérifier qu'aucun `provideZoneChangeDetection` n'écrase la configuration par défaut**, et retirer `zone.js` / `zone.js/testing` de `angular.json` et des polyfills pour réduire la taille du bundle.
- **Avenir de zone.js** : la documentation ne fixe pas de date de suppression définitive, mais zone.js n'est plus inclus par défaut dans les nouveaux projets depuis v21 ; un migration schematic (« zoneless by default ») est fourni pour les projets existants.
- **`OnPush`** reste un concept pertinent et supporté (`ChangeDetectionStrategy.OnPush`), y compris en zoneless — c'est même la stratégie cohérente avec un modèle réactif à base de signaux. En v21.2, un alias `ChangeDetectionStrategy.Eager` a été ajouté pour `Default`.

**Sources** : [v21.angular.dev/guide/zoneless](https://v21.angular.dev/guide/zoneless), [v21.angular.dev/api/core/provideZonelessChangeDetection](https://v21.angular.dev/api/core/provideZonelessChangeDetection), CHANGELOG (`21.0.0`, entrée « Add migration for zoneless by default »).

---

## 7. Formulaires

### Formulaires réactifs typés — stables

Stables depuis Angular 14 (typage strict des `FormGroup`/`FormControl`/`FormArray`), inchangés en v21 dans leur usage courant.

```ts
private fb = inject(FormBuilder);
loginForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', Validators.required],
});
```

### Signal Forms — **expérimental** en v21

Introduites en v21.0 comme *« an experimental library that allows you to manage form state by building on the reactive foundations of Signals »* (citation du blog officiel). Package : **`@angular/forms/signals`**.

Point important pour les rédacteurs : la directive de liaison de template s'appelait initialement `[field]` à la sortie de v21.0.0, puis a été **renommée en `[formField]`** dès le correctif `21.0.9` (2026-01-14, CHANGELOG : *« Rename signal form [field] to [formField] »*). La documentation actuelle (toutes patchs 21.x confondus) utilise `[formField]`.

```ts
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  imports: [FormField],
  template: `
    <input type="email" [formField]="loginForm.email" />
    <input type="password" [formField]="loginForm.password" />
  `,
})
export class Login {
  loginModel = signal({ email: '', password: '' });
  loginForm = form(this.loginModel);
}
```

Recommandation officielle : *« Signal Forms work best in new applications built with signals. If you're working with an existing application that uses reactive forms, or if you need production stability guarantees, reactive forms remain a solid choice »* — donc à présenter comme **une API à essayer, pas encore recommandée en production**.

**Sources** : [blog.angular.dev — Announcing Angular v21](https://blog.angular.dev/announcing-angular-v21-57946c34f14b), [v21.angular.dev/guide/forms/signals/overview](https://v21.angular.dev/guide/forms/signals/overview), [v21.angular.dev/guide/forms/signals/models](https://v21.angular.dev/guide/forms/signals/models), CHANGELOG (`21.0.0`, `21.0.9`, `21.2.0`).

---

## 8. HTTP

`provideHttpClient()` (stable) + fonctions d'options :

| Option | Rôle |
|---|---|
| `withFetch()` | **Bascule vers l'API Fetch** — en Angular 21, le backend par défaut reste **`XMLHttpRequest`** ; `withFetch()` est requis pour utiliser `fetch` (⚠️ ce comportement par défaut change en v22, où `fetch` devient le backend par défaut — ne pas confondre) |
| `withInterceptors([...])` | intercepteurs fonctionnels (recommandés) |
| `withInterceptorsFromDi()` | inclut les intercepteurs de classe (legacy `HTTP_INTERCEPTORS`) |
| `withXsrfConfiguration({...})` / `withNoXsrfProtection()` | configuration XSRF |
| `withJsonpSupport()` | active `.jsonp()` |
| `withRequestsMadeViaParent()` | délègue au `HttpClient` de l'injecteur parent |

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptors([loggingInterceptor]),
    ),
  ],
};
```

Intercepteur fonctionnel (recommandé par la doc — *« more predictable behavior, especially in complex setups »*) :

```ts
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log(req.url);
  return next(req);
};
```

`httpResource()` — **expérimental depuis v19.2** (voir section 3) : enveloppe réactive autour de `HttpClient` exposant statut et réponse sous forme de signaux.

**Sources** : [v21.angular.dev/guide/http/setup](https://v21.angular.dev/guide/http/setup), [v21.angular.dev/guide/http/interceptors](https://v21.angular.dev/guide/http/interceptors), [v21.angular.dev/api/common/http/httpResource](https://v21.angular.dev/api/common/http/httpResource).

---

## 9. Routeur

- `provideRouter(routes, ...features)` — stable, standard depuis les applications standalone.
- `withComponentInputBinding()` — lie automatiquement params/query params aux `input()` du composant routé.
- Guards et resolvers **fonctionnels** recommandés (`CanActivateFn`, `CanDeactivateFn`, `ResolveFn`, etc.) ; les guards/resolvers de classe restent supportés mais ne sont pas mis en avant.
- `loadComponent` / `loadChildren` pour le lazy-loading — stables.

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
  ],
};

export const routes: Routes = [
  { path: 'feature', loadComponent: () => import('./feature').then(m => m.Feature) },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) },
];

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  return auth.isAuthenticated();
};
```

Nouveautés v21.x notables sur le routeur : intégration expérimentale avec la Navigation API (publiée comme expérimentale en v21.1), contrôles de scroll et de nettoyage de route, `isActive` avec options partielles.

**Sources** : [v21.angular.dev/guide/routing/define-routes](https://v21.angular.dev/guide/routing/define-routes) *(recoupé)*, [v21.angular.dev/guide/routing/route-guards](https://v21.angular.dev/guide/routing/route-guards) *(recoupé)*, CHANGELOG (`21.0.0`, `21.1.0`).

---

## 10. Tests

- **Runner par défaut d'un nouveau projet Angular 21 : Vitest.** Citation officielle (guide de test, v21) : *« This guide covers the default testing setup for new Angular CLI projects, which uses Vitest »*. Le blog confirme : *« Vitest as our new default test runner, and are promoting it to stable in Angular v21 »* — **stable**.
- **Karma** : reste pleinement supporté (*« Karma and Jasmine remain fully supported »*) mais **n'est plus le runner par défaut** pour les nouveaux projets. Angular CLI installe `vitest` + `jsdom` par défaut.
- **Jest et Web Test Runner** (supports expérimentaux introduits dans des versions antérieures) : dépréciés, avec suppression prévue en **v22** — effectivement supprimés depuis, v22 étant sorti en juin 2026.
- Un schematic de migration Jasmine → Vitest existe : `ng g @schematics/angular:refactor-jasmine-vitest`.
- `TestBed` : pour forcer le mode zoneless dans un test (quand zone.js est présent dans l'environnement de test), ajouter `provideZonelessChangeDetection()` aux providers de `TestBed.configureTestingModule(...)`.
- `HttpTestingController` + `provideHttpClientTesting()` — stables, inchangés.

```ts
TestBed.configureTestingModule({
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideHttpClientTesting(),
  ],
});

const httpTesting = TestBed.inject(HttpTestingController);
const req = httpTesting.expectOne('/api/config');
expect(req.request.method).toBe('GET');
req.flush({ data: 'config' });
httpTesting.verify();
```

**Sources** : [v21.angular.dev/guide/testing](https://v21.angular.dev/guide/testing), [blog.angular.dev — Announcing Angular v21](https://blog.angular.dev/announcing-angular-v21-57946c34f14b), [v21.angular.dev/guide/http/testing](https://v21.angular.dev/guide/http/testing) *(recoupé)*.

---

## 11. SSR (rendu côté serveur)

| Fonctionnalité | Statut en v21 |
|---|---|
| `provideServerRendering()` | **Stable** |
| Hydratation (non destructive) | **Stable** |
| Hydratation incrémentale (`hydrate on ...` sur `@defer`) | Pas de badge « expérimental »/« developer preview » trouvé sur la page v21 — traitée comme **stable** dans la doc actuelle, mais **statut à confirmer explicitement** (voir « Points non confirmés ») |
| Pré-rendu (SSG, `RenderMode.Prerender`) | **Stable** |

```ts
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

export const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};
```

Hydratation incrémentale — un déclencheur d'hydratation s'ajoute à un déclencheur `@defer` classique :

```html
@defer (on idle; hydrate on interaction) {
  <example-cmp />
} @placeholder {
  <div>Placeholder</div>
}
```

Déclencheurs d'hydratation disponibles : `hydrate on interaction`, `hydrate on viewport`, `hydrate on idle`, `hydrate never`.

Pré-rendu au build :

```ts
export const serverRoutes: ServerRoute[] = [
  {
    path: 'post/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const ids = await inject(PostService).getIds();
      return ids.map((id) => ({ id }));
    },
  },
];
```

**Sources** : [v21.angular.dev/guide/ssr](https://v21.angular.dev/guide/ssr) *(recoupé, angular.dev général contaminé par la v22)*, [v21.angular.dev/guide/incremental-hydration](https://v21.angular.dev/guide/incremental-hydration).

---

## 12. CLI et build

- Commandes principales : `ng new`, `ng generate` (`ng g`), `ng serve`, `ng build`, `ng test`, `ng update`, `ng add`.
- **Builder par défaut** : `@angular/build:application` (basé sur **esbuild** pour le build, **Vite** pour le serveur de développement `ng serve`) — défaut depuis Angular 17/18, inchangé en v21.
- `ng update @angular/cli@21 @angular/core@21` déclenche les migrations automatiques (schematics), notamment en v21 : migration « zoneless by default », migration `ngClass` → `class`, migration `ngStyle` → `style`, migration de la structure du module de test du routeur déprécié, migration du control-flow (`*ngIf`/`*ngFor` → `@if`/`@for`) si pas déjà fait.
- `ng new` propose désormais un prompt explicite sur le mode zoneless (le texte exact de l'invite a varié selon les patchs 21.x) ; le zoneless est la valeur par défaut recommandée.
- Nouveauté v21 : **Angular MCP Server** intégré à la CLI/aux outils IA (stable), avec des outils comme `get_best_practices`, `list_projects`, `search_documentation`, `find_examples`, et des outils expérimentaux (`modernize`, `onpush_zoneless_migration`, `ai_tutor`).
- CLDR mis à jour de la v41 à la **v47** en v21.0.

**Sources** : [v21.angular.dev/cli](https://v21.angular.dev/cli) *(recoupé)*, [angular.dev/tools/cli/build-system](https://angular.dev/tools/cli/build-system), CHANGELOG (`21.0.0`), [blog.angular.dev — Announcing Angular v21](https://blog.angular.dev/announcing-angular-v21-57946c34f14b).

---

## 13. Animations

- **`@angular/animations` est déprécié depuis Angular v20.2**, donc déjà déprécié pendant toute la ligne v21. Citation exacte (doc v21) : *« The `@angular/animations` package is deprecated as of v20.2, which also introduced the new `animate.enter` and `animate.leave` feature to add animations to your application »*. Intention de suppression annoncée : **v23**.
- Approche recommandée pour tout nouveau code : **animations CSS natives** pilotées par les attributs de template `animate.enter` / `animate.leave` (fonctionnalité stable, supportée nativement par le compilateur Angular — pas un module à part).

```html
@if (isShown()) {
  <div animate.enter="slide-fade" animate.leave="fade-out">
    Contenu
  </div>
}
```

Liaison dynamique et écoute d'événement possibles : `[animate.enter]="enterClass()"`, `(animate.leave)="onLeave($event)"`.

**Sources** : [v21.angular.dev/guide/legacy-animations](https://v21.angular.dev/guide/legacy-animations), [v21.angular.dev/guide/animations/migration](https://v21.angular.dev/guide/animations/migration), [angular.dev/guide/animations](https://angular.dev/guide/animations) *(exemples `animate.enter`/`animate.leave`, recoupés)*.

---

## 14. Style officiel (style guide angular.dev)

Changement récent notable : **les fichiers de composants n'ont plus besoin du suffixe `.component.ts`**.

- Nommage des fichiers : mots séparés par des tirets (`kebab-case`). Un composant `UserProfile` → fichier `user-profile.ts` (et non `user-profile.component.ts`). Citation verbatim : *« Separate words within a file name with hyphens (`-`). For example, a component named `UserProfile` has a file name `user-profile.ts` »*.
- Les fichiers liés partagent le même nom de base : `user-profile.ts`, `user-profile.html`, `user-profile.css`.
- Tests unitaires : suffixe `.spec.ts` (ex. `user-profile.spec.ts`).
- Éviter les noms génériques de fichiers (`helpers.ts`, `utils.ts`, `common.ts`) — *« File names should generally describe the contents of the code in the file »*.
- Sélecteurs : préfixe applicatif cohérent sur tous les composants/directives (ex. app nommée « MovieReel » → directive `[mrTooltip]`).
- Structure de projet : tout le code Angular dans `src/`, point d'entrée `main.ts`, **organisation par fonctionnalité** (feature-based) plutôt que par type de fichier (pas de dossiers globaux `components/`, `services/`, `directives/`) — *« Organize your project into subdirectories based on the features of your application »*.
- Principe directeur : un fichier = un concept ; regrouper les fichiers étroitement liés dans le même dossier.

**Sources** : [v21.angular.dev/style-guide](https://v21.angular.dev/style-guide).

---

## Points non confirmés

Les points suivants n'ont pas pu être vérifiés avec une certitude suffisante malgré les recherches sur les sources officielles ; à ne pas affirmer sans reformulation prudente dans le contenu pédagogique :

1. **Statut exact affiché pour l'hydratation incrémentale en v21** : aucun badge explicite « stable », « developer preview » ou « experimental » n'a pu être localisé sur la page `v21.angular.dev/guide/incremental-hydration` via les extractions effectuées. Des sources tierces (non officielles) affirment un passage au stable en v21, mais cela n'a pas été confirmé par une citation officielle directe (badge ou mention explicite de statut).
2. **Texte exact du prompt CLI `ng new` sur le mode zoneless** : plusieurs formulations ont été rapportées selon les patchs 21.x (« Do you want to create a 'zoneless' application without zone.js (Developer Preview)? » a été vu dans des sources tierces alors que la doc officielle qualifie l'API sous-jacente de stable) — possible texte résiduel non mis à jour dans un patch donné. À vérifier directement dans une CLI `@angular/cli@21` avant d'enseigner la formulation exacte.
3. **Badge de statut explicite pour `signal()`, `computed()`, `input()`, `input.required()`, `toSignal()`** : les pages API consultées n'affichaient aucun badge de statut (ni « stable », ni « experimental »). L'absence de badge est interprétée ici comme signe de stabilité de longue date, par analogie avec les autres API du même groupe qui affichent « stable since vX.Y », mais cela reste une inférence, pas une citation directe.
4. **Plage TypeScript exacte à la fin de la ligne v21** : le CHANGELOG signale l'ajout du support de TypeScript 6 comme fonctionnalité de la version **21.2.0** (« feat(core): add support for TypeScript 6 »). La page `reference/versions` récupérée indiquait toujours `>=5.9.0 <6.0.0` — il est possible que la plage haute ait été relevée dans une patch ultérieure sans que cela ait pu être reconfirmé de façon certaine au moment de la rédaction.
5. **Contenu complet de la page `v21.angular.dev/guide/components/inputs` et pages guides équivalentes** : plusieurs extractions sur des URLs `v21.angular.dev` spécifiques (inputs, outputs, model, routing, ssr, cli) ont parfois renvoyé le contenu de la page d'accueil au lieu du guide ciblé (probable limitation de rendu JavaScript côté outil d'extraction). Les faits correspondants ont été recoupés avec le domaine général `angular.dev` et avec les pages API (`/api/core/...`) qui, elles, se sont chargées correctement ; la cohérence entre les deux a été vérifiée mais une relecture humaine directe des guides narratifs v21 reste recommandée avant publication pédagogique.
6. **Date de suppression définitive de zone.js** : aucune date de suppression complète n'a été trouvée dans les sources officielles — seulement la confirmation que zone.js n'est plus inclus par défaut depuis v21.
