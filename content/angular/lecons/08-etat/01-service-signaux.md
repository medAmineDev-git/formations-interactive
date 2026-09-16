---
id: service-signaux
chapitre: etat
ordre: 1
titre: "Un store maison avec des signaux"
termes:
  - terme: "@Injectable({ providedIn: 'root' })"
    definition: "Déclare un service comme **singleton applicatif** : une seule instance, créée à la première injection, partagée par tout le monde. `providedIn: 'root'` permet aussi le **tree-shaking** : le service n'est inclus dans le bundle que s'il est réellement injecté quelque part."
  - terme: "WritableSignal<T>"
    definition: "Le type d'un signal modifiable (`set()`, `update()`). Dans un store maison, on le garde **privé** : c'est l'état interne, que seules les méthodes du service ont le droit de modifier."
  - terme: "asReadonly()"
    definition: "Méthode disponible sur un `WritableSignal<T>` qui renvoie un `Signal<T>` en lecture seule pointant vers la même valeur. Elle permet d'exposer un état **sans permettre** aux consommateurs de l'écrire directement."
  - terme: "computed()"
    definition: "Sert à exposer des **valeurs dérivées** de l'état interne (total, nombre d'articles, filtre appliqué) sans dupliquer de donnée : elles se recalculent automatiquement quand l'état privé change."
  - terme: État privé / API publique
    definition: "Principe d'encapsulation appliqué à un store : l'état (`WritableSignal`) reste privé à la classe, et le service n'expose que des signaux en lecture seule et des méthodes nommées (`ajouter()`, `retirer()`) pour le modifier — jamais le signal modifiable lui-même."
  - terme: "effect() de persistance"
    definition: "Un `effect()` qui synchronise l'état du store avec le stockage local du navigateur à chaque changement : un usage légitime d'`effect()`, car il agit sur quelque chose en dehors du système de réactivité d'Angular."
quiz:
  - question: "Ce service expose son état ainsi. Quel est le problème principal ?"
    code: |
      @Injectable({ providedIn: 'root' })
      export class PanierService {
        lignes = signal<LigneCommande[]>([]);

        ajouter(ligne: LigneCommande) {
          this.lignes.update(l => [...l, ligne]);
        }
      }
    choix:
      - "Rien : c'est la façon recommandée d'exposer l'état d'un service"
      - "`lignes` est un `WritableSignal` public : n'importe quel composant injectant le service peut appeler `lignes.set(...)` directement, en contournant `ajouter()` et toute règle métier associée"
      - "`providedIn: 'root'` empêche d'utiliser `update()` dans une méthode"
      - "Un service ne peut pas exposer de signal, seulement des `Observable`"
    reponse: 1
    explication: "Exposer un `WritableSignal` casse l'encapsulation : n'importe quel composant peut écrire l'état sans passer par les méthodes du service, donc sans validation ni cohérence garantie. La correction consiste à garder `lignes` privé et à exposer `lignes.asReadonly()` (ou un `computed()`) sous un nom public."
  - question: "Avec ce store, que vaut `total()` juste après l'appel à `ajouter()` ?"
    code: |
      @Injectable({ providedIn: 'root' })
      export class PanierService {
        private _lignes = signal<LigneCommande[]>([
          { produitId: 'a', prix: 10, quantite: 1 },
        ]);
        readonly lignes = this._lignes.asReadonly();
        readonly total = computed(() =>
          this._lignes().reduce((s, l) => s + l.prix * l.quantite, 0),
        );

        ajouter(ligne: LigneCommande) {
          this._lignes.update(l => [...l, ligne]);
        }
      }

      // service.ajouter({ produitId: 'b', prix: 25, quantite: 2 });
    choix:
      - "10, car `total` a été calculé avant l'ajout et ne se met pas à jour"
      - "60, car `total` est un `computed()` : il se recalcule automatiquement à partir de `_lignes`, qui contient maintenant les deux lignes (10 + 25 × 2)"
      - "Une erreur est levée, car `total` lit un signal privé `_lignes` depuis un autre membre de la classe"
      - "50, car seule la nouvelle ligne est comptée"
    reponse: 1
    explication: "`total` est un `computed()` qui lit `_lignes` : dès que `_lignes` change (ici via `update()` dans `ajouter()`), Angular invalide le calcul mémorisé. À la prochaine lecture de `total()`, il vaut 10 (1 × 10) + 50 (2 × 25) = 60. Lire un signal privé depuis une autre méthode de la même classe est parfaitement normal."
  - question: "Pourquoi préférer `asReadonly()` à un simple `computed(() => this._etat())` pour exposer un état sans transformation ?"
    choix:
      - "Les deux sont strictement équivalents en pratique pour exposer une valeur sans transformation ; `asReadonly()` évite juste de créer un `computed()` inutile qui ne fait que recopier la valeur"
      - "`computed()` ne peut pas être utilisé dans un service, seulement dans un composant"
      - "`asReadonly()` copie la valeur, alors que `computed()` garde une référence vers l'original"
      - "`asReadonly()` empêche toute lecture du signal en dehors du service"
    reponse: 0
    explication: "`asReadonly()` renvoie une vue en lecture seule du même signal, sans recalcul ni signal supplémentaire à maintenir : c'est le bon outil quand on veut juste exposer l'état tel quel. `computed()` garde tout son intérêt dès qu'une **valeur dérivée** (total, filtre, tri) doit être calculée à partir de l'état."
---

## Essentiel

Le pattern le plus simple pour gérer un état partagé en Angular 21 est un **service à signaux** : pas besoin de librairie, juste `@Injectable({ providedIn: 'root' })` et quelques signaux bien encapsulés.

La règle d'encapsulation : l'état est un `WritableSignal` **privé**, et le service n'expose que des signaux en lecture seule (via `asReadonly()` ou `computed()`) et des **méthodes** pour le modifier.

```ts
@Injectable({ providedIn: 'root' })
export class PanierService {
  private _lignes = signal<LigneCommande[]>([]);
  readonly lignes = this._lignes.asReadonly();

  readonly total = computed(() =>
    this._lignes().reduce((somme, l) => somme + l.prix * l.quantite, 0),
  );

  ajouter(ligne: LigneCommande): void {
    this._lignes.update(lignes => [...lignes, ligne]);
  }

  retirer(produitId: string): void {
    this._lignes.update(lignes => lignes.filter(l => l.produitId !== produitId));
  }
}
```

Aucun composant ne peut modifier `lignes` directement : il doit passer par `ajouter()` ou `retirer()`. C'est la même logique que l'encapsulation objet classique (attributs privés, méthodes publiques), appliquée aux signaux.

`providedIn: 'root'` fait de ce service un **singleton** : tous les composants qui l'injectent partagent la même instance, donc le même état. C'est ce qui en fait un état **partagé**, et non local à un composant.

## Détail

### Pourquoi c'est utile

Avant même d'introduire une librairie de gestion d'état, un service à signaux couvre la grande majorité des besoins d'une application : état d'authentification, panier, préférences utilisateur, filtres partagés entre plusieurs vues. Il ne demande aucune dépendance supplémentaire, se teste facilement (un service normal, injectable dans un test), et le typage TypeScript garantit la forme de l'état.

### Exemple 1 — Un panier complet

```ts
interface LigneCommande {
  produitId: string;
  nom: string;
  prix: number;
  quantite: number;
}

@Injectable({ providedIn: 'root' })
export class PanierService {
  private _lignes = signal<LigneCommande[]>([]);

  readonly lignes = this._lignes.asReadonly();
  readonly nombreArticles = computed(() =>
    this._lignes().reduce((n, l) => n + l.quantite, 0),
  );
  readonly total = computed(() =>
    this._lignes().reduce((s, l) => s + l.prix * l.quantite, 0),
  );

  ajouter(produit: { id: string; nom: string; prix: number }): void {
    this._lignes.update(lignes => {
      const existante = lignes.find(l => l.produitId === produit.id);
      if (existante) {
        return lignes.map(l =>
          l.produitId === produit.id ? { ...l, quantite: l.quantite + 1 } : l,
        );
      }
      return [...lignes, { produitId: produit.id, nom: produit.nom, prix: produit.prix, quantite: 1 }];
    });
  }

  retirer(produitId: string): void {
    this._lignes.update(lignes => lignes.filter(l => l.produitId !== produitId));
  }

  vider(): void {
    this._lignes.set([]);
  }
}
```

`nombreArticles` et `total` ne stockent jamais de valeur en dur : ils se recalculent à chaque lecture si `_lignes` a changé, et jamais sinon. Impossible qu'ils se désynchronisent des lignes réelles.

### Exemple 2 — Persistance avec `effect()`

```ts
@Injectable({ providedIn: 'root' })
export class PanierService {
  private _lignes = signal<LigneCommande[]>(this.chargerDepuisStockage());
  readonly lignes = this._lignes.asReadonly();

  constructor() {
    effect(() => {
      // Effet de bord légitime : écrire vers l'extérieur du système de signaux.
      localStorage.setItem('panier', JSON.stringify(this._lignes()));
    });
  }

  ajouter(ligne: LigneCommande): void {
    this._lignes.update(lignes => [...lignes, ligne]);
  }

  private chargerDepuisStockage(): LigneCommande[] {
    const donnees = localStorage.getItem('panier');
    return donnees ? JSON.parse(donnees) : [];
  }
}
```

L'`effect()` ne calcule rien et ne modifie aucun autre signal : il se contente de réagir à un changement pour synchroniser une ressource externe (ici, `localStorage`). C'est exactement l'usage recommandé d'`effect()`.

### Exemple 3 — Un test simple

```ts
describe('PanierService', () => {
  it('calcule le total à partir des lignes', () => {
    const service = TestBed.inject(PanierService);

    service.ajouter({ produitId: 'clavier', nom: 'Clavier', prix: 49, quantite: 1 });
    service.ajouter({ produitId: 'souris', nom: 'Souris', prix: 19, quantite: 1 });

    expect(service.total()).toBe(68);
    expect(service.nombreArticles()).toBe(2);
  });
});
```

Comme le service ne dépend d'aucun composant ni du DOM, il se teste comme n'importe quelle classe TypeScript : on l'injecte (ou on l'instancie), on appelle ses méthodes, on lit ses signaux.

### Service à signaux contre approche par `Observable`/`BehaviorSubject`

| | Service à signaux | Service à `BehaviorSubject` |
|---|---|---|
| Lecture dans un template | `store.total()` | `store.total$ \| async` |
| Lecture hors template | `store.total()` | `.subscribe()` ou `firstValueFrom()` |
| Composition (dérivés) | `computed()` | opérateurs RxJS (`combineLatest`, `map`…) |
| Dépendance | Aucune (API native Angular) | RxJS |
| Cohérent avec le zoneless | Oui, nativement | Oui, via `toSignal()` si besoin d'un signal |

Un service à signaux est aujourd'hui le point de départ recommandé pour un état applicatif simple ; RxJS garde son intérêt pour des flux asynchrones complexes (voir le chapitre RxJS).

### Pièges courants

> **Exposer le `WritableSignal` directement.** `lignes = signal([])` public permet à n'importe quel composant d'appeler `lignes.set(...)`, en contournant toute logique métier. Toujours garder l'état modifiable **privé**, et exposer `asReadonly()` ou un `computed()`.

> **Muter le tableau en place puis appeler `set()` avec la même référence.** `this._lignes().push(ligne); this._lignes.set(this._lignes())` ne déclenche aucune mise à jour : Angular compare par référence. Toujours passer par `update()` avec une copie (`[...lignes, ligne]`).

> **Dupliquer une valeur dérivée dans un signal séparé.** Stocker `total` comme un `signal(0)` mis à jour manuellement dans chaque méthode, au lieu d'un `computed()`, crée un risque d'oubli et de désynchronisation. Si une valeur se calcule à partir d'autres signaux, elle doit être un `computed()`, jamais un état stocké en parallèle.

### À retenir

- Un store maison, c'est un service `providedIn: 'root'` avec un état **privé** (`WritableSignal`) et une **API publique** en lecture seule.
- `asReadonly()` expose l'état tel quel ; `computed()` expose une **valeur dérivée**.
- Les méthodes du service sont le seul point d'entrée pour modifier l'état — jamais le signal directement.
- `effect()` est l'outil légitime pour synchroniser l'état avec le stockage local ou toute ressource externe.
- Ce pattern couvre la majorité des besoins avant d'envisager une librairie comme NgRx.
