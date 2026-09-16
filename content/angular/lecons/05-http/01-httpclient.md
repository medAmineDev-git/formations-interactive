---
id: httpclient
chapitre: http
ordre: 1
titre: "HttpClient : lire et envoyer des données"
termes:
  - terme: HttpClient
    definition: "Service fourni par Angular pour communiquer avec une API HTTP. On l'obtient par injection (`inject(HttpClient)`) plutôt que par `new`, comme n'importe quel service Angular."
  - terme: "provideHttpClient()"
    definition: "Fonction à ajouter aux `providers` de l'application (dans `app.config.ts`) pour activer `HttpClient`. Sans elle, l'injection échoue au démarrage."
  - terme: "withFetch()"
    definition: "Option de `provideHttpClient()` qui bascule le backend des requêtes vers l'API `fetch` du navigateur. **En Angular 21, le backend par défaut reste `XMLHttpRequest`** : sans `withFetch()`, Angular continue d'utiliser `XHR`."
  - terme: "withInterceptors([...])"
    definition: "Option de `provideHttpClient()` qui enregistre des intercepteurs fonctionnels, exécutés sur chaque requête. Détaillé dans la leçon suivante."
  - terme: Observable froid
    definition: "Un `Observable` retourné par `HttpClient` **n'exécute rien tant que personne ne s'y abonne**. Appeler `http.get(...)` sans `.subscribe()`, sans `AsyncPipe` ni `toSignal()` ne déclenche **aucune** requête réseau."
  - terme: HttpParams
    definition: "Classe immuable pour construire des paramètres de requête (`?page=1&taille=20`). Chaque méthode (`.set(...)`, `.append(...)`) **retourne une nouvelle instance** au lieu de modifier l'originale."
  - terme: AsyncPipe
    definition: "Pipe de template (`| async`) qui s'abonne automatiquement à un `Observable` et se désabonne quand le composant est détruit. Évite les fuites de mémoire liées à un abonnement manuel oublié."
  - terme: "toSignal()"
    definition: "Fonction de `@angular/core/rxjs-interop` qui convertit un `Observable` en signal, pour le lire comme n'importe quel autre signal dans le template ou un `computed`."
quiz:
  - question: "Que se passe-t-il quand ce code s'exécute ?"
    code: |
      export class ProduitService {
        private http = inject(HttpClient);

        chargerProduits() {
          this.http.get<Produit[]>('/api/produits');
        }
      }
    choix:
      - "Une requête GET part vers /api/produits, mais le résultat est ignoré"
      - "Rien : l'Observable n'est jamais souscrit, donc aucune requête HTTP n'est envoyée"
      - "Une erreur de compilation, car le résultat de get() doit être assigné"
      - "La requête part uniquement si le composant est visible à l'écran"
    reponse: 1
    explication: "Un Observable retourné par HttpClient est froid : sans .subscribe(), sans AsyncPipe ni toSignal(), rien ne se déclenche. C'est une source d'erreur fréquente chez les débutants habitués à des promesses, exécutées dès leur création."
  - question: "Une application Angular 21 doit envoyer ses requêtes HTTP via l'API fetch du navigateur plutôt que via XMLHttpRequest. Que faut-il faire ?"
    choix:
      - "Rien : fetch est le backend par défaut depuis Angular 21"
      - "Ajouter withFetch() aux options de provideHttpClient()"
      - "Remplacer HttpClient par le fetch natif dans chaque service"
      - "Ajouter un intercepteur qui appelle fetch() manuellement"
    reponse: 1
    explication: "En Angular 21, HttpClient utilise XMLHttpRequest par défaut. withFetch(), passé à provideHttpClient(), bascule explicitement le backend vers l'API fetch. Ce comportement par défaut changera en Angular 22, où fetch deviendra le backend par défaut : ne pas confondre les deux versions."
  - question: "Pourquoi encapsuler les appels HttpClient dans un service dédié (ProduitService) plutôt que de les faire directement dans le composant ?"
    choix:
      - "HttpClient ne peut pas être injecté dans un composant, seulement dans un service"
      - "Un service permet de réutiliser la logique d'accès aux données, de la tester isolément et de garder le composant concentré sur l'affichage"
      - "C'est une exigence du compilateur Angular, sinon la compilation échoue"
      - "Cela évite d'avoir à écrire provideHttpClient() dans app.config.ts"
    reponse: 1
    explication: "HttpClient est injectable partout, y compris dans un composant. Mais séparer l'accès aux données dans un service garde le composant simple, permet de réutiliser la même logique dans plusieurs composants et facilite les tests (on peut simuler le service sans simuler tout HttpClient)."
---

## Essentiel

`HttpClient` est le service Angular pour dialoguer avec une API. On l'active dans `app.config.ts` avec `provideHttpClient()`, puis on l'injecte avec `inject(HttpClient)` :

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient()],
};

// produit.service.ts
@Injectable({ providedIn: 'root' })
export class ProduitService {
  private http = inject(HttpClient);

  lister(): Observable<Produit[]> {
    return this.http.get<Produit[]>('/api/produits');
  }

  creer(produit: NouveauProduit): Observable<Produit> {
    return this.http.post<Produit>('/api/produits', produit);
  }
}
```

Les méthodes `get`, `post`, `put`, `patch`, `delete` sont **génériques** : `get<Produit[]>(...)` type directement la réponse, sans cast manuel.

Point essentiel : l'`Observable` retourné est **froid**. Tant que rien ne s'y abonne (`.subscribe()`, `AsyncPipe` dans le template, ou `toSignal()`), **aucune requête ne part**. C'est très différent d'une `Promise`, exécutée dès sa création.

Écrivez les appels HTTP dans un **service dédié** (un par domaine métier : `ProduitService`, `PanierService`, `CommandeService`), jamais directement dans un composant : le composant reste concentré sur l'affichage, la logique d'accès aux données devient réutilisable et testable indépendamment de l'interface.

## Détail

### Comment ça marche : un Observable froid

```ts
const produits$ = this.http.get<Produit[]>('/api/produits');
// À ce stade, aucune requête HTTP n'a été envoyée.

produits$.subscribe((produits) => console.log(produits));
// Maintenant seulement, la requête part.
```

Dans un composant, on ne s'abonne quasiment jamais à la main : on laisse `AsyncPipe` ou `toSignal()` le faire, pour ne jamais oublier de se désabonner.

### Exemple 1 — Configurer HttpClient dans `app.config.ts`

```ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),                    // backend fetch plutôt que XMLHttpRequest
      withInterceptors([authInterceptor]),
    ),
  ],
};
```

Sans `withFetch()`, Angular 21 utilise `XMLHttpRequest` par défaut — c'est un point qui change en Angular 22, où `fetch` devient le comportement par défaut.

### Exemple 2 — Un service typé, avec toutes les méthodes

```ts
export interface Produit {
  id: number;
  nom: string;
  prix: number;
}

@Injectable({ providedIn: 'root' })
export class ProduitService {
  private http = inject(HttpClient);
  private base = '/api/produits';

  lister(): Observable<Produit[]> {
    return this.http.get<Produit[]>(this.base);
  }

  obtenir(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.base}/${id}`);
  }

  creer(produit: Omit<Produit, 'id'>): Observable<Produit> {
    return this.http.post<Produit>(this.base, produit);
  }

  modifier(id: number, produit: Partial<Produit>): Observable<Produit> {
    return this.http.put<Produit>(`${this.base}/${id}`, produit);
  }

  modifierPrix(id: number, prix: number): Observable<Produit> {
    return this.http.patch<Produit>(`${this.base}/${id}`, { prix });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
```

`put` remplace la ressource entière, `patch` en modifie une partie : le choix dépend de ce que l'API attend réellement.

### Exemple 3 — Paramètres de requête et en-têtes

```ts
rechercher(motCle: string, page: number): Observable<Produit[]> {
  const params = new HttpParams()
    .set('q', motCle)
    .set('page', page);

  const headers = new HttpHeaders().set('X-Client', 'boutique-web');

  return this.http.get<Produit[]>(this.base, { params, headers });
}
```

`HttpParams` est **immuable** : `.set(...)` retourne une nouvelle instance, il ne modifie pas l'originale. Oublier de réassigner le résultat (`params = params.set(...)`) est un piège classique.

### Exemple 4 — Afficher le résultat : AsyncPipe ou toSignal

```ts
// Avec AsyncPipe
@Component({
  selector: 'app-catalogue',
  template: `
    @for (produit of produits$ | async; track produit.id) {
      <p>{{ produit.nom }} — {{ produit.prix }} €</p>
    }
  `,
})
export class Catalogue {
  private produitService = inject(ProduitService);
  produits$ = this.produitService.lister();
}
```

```ts
// Avec toSignal()
@Component({
  selector: 'app-catalogue',
  template: `
    @for (produit of produits(); track produit.id) {
      <p>{{ produit.nom }} — {{ produit.prix }} €</p>
    }
  `,
})
export class Catalogue {
  private produitService = inject(ProduitService);
  produits = toSignal(this.produitService.lister(), { initialValue: [] });
}
```

| | `AsyncPipe` | `toSignal()` |
|---|---|---|
| Abonnement/désabonnement | Automatique dans le template | Automatique, géré par le contexte d'injection |
| Valeur avant la réponse | `null` | Valeur fournie par `initialValue` (sinon `undefined`) |
| Usage dans un `computed()` | Impossible | Possible : c'est un signal comme un autre |
| Cohérence avec une app à base de signaux | Correcte, mais mélange deux modèles | Homogène avec le reste du code |

### Pièges courants

> **Oublier de s'abonner.** `this.http.post(...)` sans `.subscribe()` ni `AsyncPipe` ne fait **rien** : la commande n'est jamais envoyée, sans la moindre erreur. C'est silencieux et donc difficile à repérer.

> **`provideHttpClient()` manquant.** Sans lui dans `app.config.ts`, l'injection de `HttpClient` échoue au démarrage avec une erreur `NullInjectorError: No provider for HttpClient!`.

> **Réassigner un `HttpParams` oublié.** `params.set('q', motCle)` sans faire `params = params.set(...)` laisse `params` inchangé, car la méthode retourne un nouvel objet au lieu de modifier l'existant.

### À retenir

- `provideHttpClient()` dans `app.config.ts` active `HttpClient` ; `inject(HttpClient)` l'injecte.
- `withFetch()` bascule vers l'API `fetch` ; sans elle, Angular 21 utilise `XMLHttpRequest` par défaut.
- L'`Observable` retourné est **froid** : rien ne part sans abonnement (`AsyncPipe`, `toSignal()`, `.subscribe()`).
- `HttpParams` est immuable : chaque `.set(...)` retourne une nouvelle instance à réassigner.
- Isoler les appels HTTP dans des services dédiés, pas dans les composants.
