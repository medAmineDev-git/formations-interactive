---
id: observables-bases
chapitre: rxjs
ordre: 1
titre: "Les observables : ce qu'il faut comprendre"
termes:
  - terme: Observable
    definition: "Représente un flux de valeurs dans le temps (zéro, une ou plusieurs), produit par RxJS. Contrairement à une valeur classique, un observable ne « fait » rien tant que personne ne s'y **abonne**."
  - terme: "subscribe()"
    definition: "Démarre l'exécution d'un observable en lui attachant un **Observer** (des callbacks `next`, `error`, `complete`). C'est le seul moment où le code producteur (requête HTTP, minuteur, écouteur d'événement…) s'exécute réellement."
  - terme: Subscription
    definition: "Objet renvoyé par `subscribe()`, représentant l'abonnement actif. Sa méthode `unsubscribe()` arrête l'écoute et libère les ressources associées (annule une requête en cours, retire un écouteur d'événement, stoppe un minuteur)."
  - terme: Observable froid (cold)
    definition: "Un observable qui ne produit **rien** avant qu'on ne s'y abonne, et qui rejoue son exécution **indépendamment pour chaque abonné** (deux `subscribe()` sur un observable HTTP froid déclenchent deux requêtes distinctes). La grande majorité des observables créés dans une application Angular sont froids."
  - terme: "takeUntilDestroyed()"
    definition: "Opérateur (`@angular/core/rxjs-interop`) qui désabonne automatiquement un observable quand le contexte d'injection courant (composant, directive, service) est détruit. Évite d'écrire et de stocker soi-même une `Subscription` à nettoyer dans `ngOnDestroy`."
  - terme: DestroyRef
    definition: "Jeton injectable (`@angular/core`) représentant le cycle de vie du contexte courant. `takeUntilDestroyed()` s'appuie dessus par défaut ; on peut aussi l'utiliser directement avec `destroyRef.onDestroy(() => ...)` pour du nettoyage personnalisé."
  - terme: AsyncPipe
    definition: "Pipe de template (`| async`) qui s'abonne à un observable (ou une Promise) à l'affichage du composant et se désabonne automatiquement à sa destruction. Évite tout appel manuel à `subscribe()`/`unsubscribe()` pour un simple affichage."
quiz:
  - question: "Que se passe-t-il quand ce code s'exécute ?"
    code: |
      const produits$ = this.http.get<Produit[]>('/api/produits');

      console.log('avant');
      produits$.subscribe(p => console.log('reçu', p));
      console.log('après');
      // rien d'autre
    choix:
      - "\"avant\" et \"après\" s'affichent avant \"reçu\", car la requête HTTP ne part qu'au moment de subscribe() et se résout plus tard"
      - "La requête part dès la ligne `this.http.get(...)`, donc \"reçu\" peut s'afficher avant \"après\""
      - "Le code ne compile pas : un Observable doit obligatoirement être assigné avec `await`"
      - "\"reçu\" ne s'affichera jamais car aucun opérateur `pipe()` n'a été utilisé"
    reponse: 0
    explication: "`HttpClient.get()` renvoie un observable **froid** : rien ne part tant qu'il n'y a pas d'abonnement. La requête ne démarre qu'à `subscribe()`, et sa réponse arrive de façon asynchrone, donc après l'exécution du code synchrone qui suit. \"avant\" et \"après\" s'affichent dans l'ordre du code ; \"reçu\" arrive ensuite, une fois la réponse reçue."
  - question: "Ce service expose un flux de recherche produits. Quel est le problème ?"
    code: |
      @Injectable({ providedIn: 'root' })
      export class RechercheService {
        rechercher(terme: string) {
          this.http.get<Produit[]>(`/api/produits?q=${terme}`)
            .subscribe(resultats => this.resultats.set(resultats));
        }
      }
    choix:
      - "Rien : c'est l'usage normal de subscribe() dans un service"
      - "La Subscription n'est jamais conservée ni désabonnée : ici ce n'est pas grave car l'observable HTTP se termine de lui-même après une émission, mais le réflexe est risqué sur un flux qui ne se termine pas (interval, fromEvent, WebSocket)"
      - "Le code ne compile pas car `subscribe()` doit toujours être appelé avec trois callbacks (next, error, complete)"
      - "http.get() doit obligatoirement être combiné avec l'AsyncPipe, jamais avec subscribe()"
    reponse: 1
    explication: "Un observable HTTP se complète après sa réponse, donc pas de fuite ici. Mais généraliser ce réflexe (`subscribe()` sans jamais garder ni nettoyer la Subscription) devient dangereux dès qu'on écoute un flux qui ne se termine pas de lui-même (`fromEvent`, `interval`, un WebSocket) : la fonction continue à s'exécuter et à retenir tout ce qu'elle référence, même après la destruction du composant ou du service qui l'a lancée."
  - question: "Quelle est la principale différence entre une Promise et un Observable ?"
    choix:
      - "Une Promise peut être annulée facilement, pas un Observable"
      - "Un Observable peut émettre plusieurs valeurs dans le temps et ne démarre son exécution qu'à l'abonnement (paresseux), alors qu'une Promise représente une seule valeur future et démarre dès sa création (eager)"
      - "Une Promise et un Observable sont strictement interchangeables, RxJS ne fait qu'ajouter du sucre syntaxique"
      - "Un Observable ne peut représenter que des événements DOM, une Promise que des appels réseau"
    reponse: 1
    explication: "Une Promise s'exécute dès sa création et se résout **une seule fois**. Un Observable est **paresseux** (il ne s'exécute qu'à `subscribe()`) et peut émettre **zéro, une ou plusieurs valeurs** dans le temps — ce qui le rend adapté à des flux (clics, WebSocket, minuteur), pas seulement à un résultat unique. C'est l'inverse pour l'annulation : un Observable s'annule nativement via `unsubscribe()`, une Promise ne s'annule pas (il faut un mécanisme séparé comme `AbortController`)."
    lecon: observables-bases
---

## Essentiel

Un **observable** représente un flux de valeurs dans le temps. Contrairement à une Promise, il est **paresseux** : rien ne s'exécute avant `subscribe()`.

```ts
import { of, fromEvent, interval } from 'rxjs';

const nombres$ = of(1, 2, 3);              // émet 3 valeurs puis se termine
const clics$ = fromEvent(bouton, 'click'); // émet à chaque clic, ne se termine jamais
const minuteur$ = interval(1000);          // émet 0, 1, 2… toutes les secondes

nombres$.subscribe(n => console.log(n));
```

La plupart des observables créés dans une application sont **froids** : chaque `subscribe()` relance l'exécution depuis le début, indépendamment des autres. Deux abonnements à un même `http.get(...)` déclenchent **deux requêtes** distinctes.

`subscribe()` renvoie une `Subscription`, à désabonner avec `unsubscribe()` quand le flux ne se termine pas de lui-même (`interval`, `fromEvent`, WebSocket) — sinon la fonction continue à s'exécuter après que le composant qui l'a lancée a disparu. Deux solutions courantes en Angular 21 :

```ts
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class SuiviStock {
  private destroyRef = inject(DestroyRef);

  constructor() {
    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rafraichirStock());
  }
}
```

Dans un template, `AsyncPipe` (`| async`) gère l'abonnement et le désabonnement automatiquement — pas de `subscribe()` manuel à écrire pour un simple affichage.

Malgré la montée des signaux, RxJS reste indispensable pour tout ce qu'un signal ne modélise pas naturellement : des **événements** répétés, un **flux** continu (WebSocket, minuteur), et surtout l'**annulation**/la composition temporelle (attendre, ignorer les émissions intermédiaires, combiner plusieurs sources).

## Détail

### Comment ça marche

Un observable est une **description** de comment produire des valeurs — pas une valeur en soi. Créer `const produits$ = this.http.get(...)` ne fait rien d'observable au sens propre : c'est un plan d'exécution. `subscribe()` exécute ce plan et connecte trois callbacks : `next` (une valeur arrive), `error` (le flux s'est terminé en erreur, plus aucune valeur ne suivra), `complete` (le flux s'est terminé normalement). Un flux ne peut jamais émettre après `error` ou `complete`.

### Exemple 1 — Créer des observables

```ts
import { of, from, fromEvent, interval } from 'rxjs';

const uneCommande$ = of({ id: 42, statut: 'validee' }); // valeur(s) fixe(s)
const commandes$ = from(fetch('/api/commandes').then(r => r.json())); // depuis une Promise
const survolProduit$ = fromEvent<MouseEvent>(carteProduit, 'mouseenter');
const rafraichissement$ = interval(30_000); // toutes les 30 secondes
```

`of` et `from` créent des observables qui se terminent après avoir émis leurs valeurs. `fromEvent` et `interval` ne se terminent jamais d'eux-mêmes : il faudra explicitement s'en désabonner.

### Exemple 2 — Chaque abonnement relance l'exécution (observable froid)

```ts
const produits$ = this.http.get<Produit[]>('/api/produits');

produits$.subscribe(p => console.log('appel A', p));
produits$.subscribe(p => console.log('appel B', p));
// → deux requêtes HTTP distinctes, une par subscribe()
```

C'est une source d'erreur fréquente : penser qu'un observable « garde » sa dernière valeur comme le ferait un signal. Un observable froid ne garde rien — il recommence à zéro à chaque abonnement. (Les Subjects, vus dans une prochaine leçon, changent ce comportement.)

### Exemple 3 — Se désabonner proprement

```ts
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({ selector: 'app-recherche-produits' })
export class RechercheProduits {
  private destroyRef = inject(DestroyRef);
  motCle = signal('');

  constructor(champRecherche: HTMLInputElement) {
    fromEvent(champRecherche, 'input')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evt) => this.motCle.set((evt.target as HTMLInputElement).value));
  }
}
```

`takeUntilDestroyed()` supprime le besoin de garder une `Subscription` dans un champ et de la désabonner manuellement dans `ngOnDestroy` : l'abonnement s'arrête automatiquement à la destruction du composant. Appelée sans argument **dans un contexte d'injection** (constructeur, champ de classe), elle récupère le `DestroyRef` courant toute seule.

### Exemple 4 — AsyncPipe : pas de subscribe() manuel

```ts
@Component({
  selector: 'app-liste-commandes',
  template: `
    @if (commandes$ | async; as commandes) {
      @for (commande of commandes; track commande.id) {
        <app-ligne-commande [commande]="commande" />
      }
    }
  `,
})
export class ListeCommandes {
  commandes$ = this.http.get<Commande[]>('/api/commandes');
}
```

`AsyncPipe` s'abonne quand le template s'affiche et se désabonne à la destruction du composant, sans aucun code de nettoyage à écrire. C'est le choix le plus simple pour un affichage direct — mais dès qu'il faut transformer, combiner ou déclencher le flux depuis du code, `takeUntilDestroyed()` ou une conversion vers un signal (`toSignal()`, vue dans une prochaine leçon) prennent le relais.

### Observable contre Promise

| | Promise | Observable |
|---|---|---|
| Nombre de valeurs | Une seule | Zéro, une ou plusieurs, dans le temps |
| Démarrage | Immédiat (eager), dès la création | Paresseux, seulement à `subscribe()` |
| Annulation | Pas de mécanisme natif | `unsubscribe()` natif |
| Opérateurs de transformation | `.then()` uniquement | Toute la bibliothèque d'opérateurs RxJS (`pipe()`) |
| Usage typique | Un résultat asynchrone unique | Un flux, un événement répété, un besoin d'annulation |

### Pièges courants

> **Oublier de se désabonner d'un flux qui ne se termine pas.** `fromEvent`, `interval`, un WebSocket : sans `unsubscribe()` (ou `takeUntilDestroyed()`), le callback continue de s'exécuter et de retenir ses références après la destruction du composant — fuite mémoire classique, souvent invisible en développement avec un seul composant monté.

> **Croire qu'un observable froid partage son exécution entre plusieurs abonnés.** Chaque `subscribe()` sur `http.get(...)` déclenche sa propre requête. Pour partager une seule exécution entre plusieurs abonnés, il faut un opérateur de multidiffusion comme `shareReplay()` (voir la leçon sur les Subjects).

> **Appeler `takeUntilDestroyed()` hors d'un contexte d'injection.** Sans contexte d'injection actif (par exemple dans un callback asynchrone tardif), l'appel sans argument échoue : il faut alors capturer le `DestroyRef` au préalable (`inject(DestroyRef)` dans le constructeur) et le passer explicitement en paramètre.

### À retenir

- Un observable est **paresseux** : rien ne s'exécute avant `subscribe()`.
- La plupart des observables sont **froids** : chaque abonnement relance l'exécution indépendamment.
- Un flux qui ne se termine pas de lui-même (`fromEvent`, `interval`, WebSocket) doit être désabonné explicitement — `takeUntilDestroyed()` est le moyen le plus simple en Angular 21.
- `AsyncPipe` gère l'abonnement et le désabonnement pour un affichage direct dans un template.
- Les signaux couvrent bien l'**état** ; RxJS reste la meilleure réponse pour un **événement**, un **flux continu**, ou l'**annulation**/composition temporelle.
