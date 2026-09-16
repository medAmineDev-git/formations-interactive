---
id: signal-bases
chapitre: signaux
ordre: 1
titre: "Les signaux : l'état réactif"
termes:
  - terme: "signal()"
    definition: "Fonction qui crée un **signal accessible en écriture** (`WritableSignal<T>`) : un conteneur de valeur qui prévient automatiquement Angular quand elle change. On le lit en l'appelant comme une fonction : `compteur()`."
  - terme: "WritableSignal<T>"
    definition: "Type renvoyé par `signal()`. Expose `set()`, `update()` et la lecture par appel (`monSignal()`). C'est le seul type de signal qu'on peut modifier directement."
  - terme: "Signal<T>"
    definition: "Type de signal **en lecture seule** : on peut l'appeler pour lire sa valeur, mais pas le modifier (pas de `set()` ni `update()`). C'est le type renvoyé par `computed()` ou par `asReadonly()`."
  - terme: "set()"
    definition: "Remplace entièrement la valeur d'un `WritableSignal` : `compteur.set(10)`. À utiliser quand la nouvelle valeur ne dépend pas de l'ancienne."
  - terme: "update()"
    definition: "Calcule la nouvelle valeur à partir de l'ancienne : `compteur.update(v => v + 1)`. À utiliser pour un incrément, un ajout dans un tableau, etc."
  - terme: "asReadonly()"
    definition: "Renvoie une version en lecture seule (`Signal<T>`) d'un `WritableSignal`, qui partage la même valeur sous-jacente. Permet à un service d'exposer un état sans laisser les composants le modifier directement."
  - terme: Immutabilité
    definition: "Règle de bonne pratique avec les signaux : ne jamais modifier un objet ou un tableau **en place** (`push`, `obj.prop = x`), mais toujours fournir une **nouvelle référence** via `set()` ou `update()`. Sinon, Angular ne détecte aucun changement."
quiz:
  - question: "Que se passe-t-il quand on appelle `ajouter('Écran')` ?"
    code: |
      const produits = signal<string[]>(['Clavier', 'Souris']);

      function ajouter(nom: string) {
        produits().push(nom);
        produits.set(produits());
      }
    choix:
      - "« Écran » apparaît immédiatement dans le template qui affiche `produits()`"
      - "Le tableau contient bien « Écran », mais aucun template ni `effect()` dépendant de `produits` ne se met à jour"
      - "Une exception est levée : on ne peut pas appeler `push()` sur un signal"
      - "`produits.set(...)` est ignoré car le signal est en lecture seule"
    reponse: 1
    explication: "`produits().push(nom)` mute le tableau existant, puis `set()` reçoit **la même référence** (déjà modifiée). Angular compare les valeurs par référence (`Object.is`) : comme la référence n'a pas changé, il ne détecte rien à mettre à jour, même si le tableau contient bien le nouvel élément en mémoire. La bonne pratique : `produits.update(articles => [...articles, nom])`."
  - question: "Un service veut exposer un panier en lecture seule aux composants, tout en gardant le contrôle de l'écriture en interne. Quelle est la bonne pratique ?"
    choix:
      - "Exposer directement `_panier` en le rendant `public`"
      - "Exposer `panier = this._panier.asReadonly();`, dérivé du signal privé"
      - "Ajouter le mot-clé TypeScript `readonly` devant la propriété du signal, sans rien changer d'autre"
      - "Renvoyer `this._panier` tel quel, en documentant qu'il ne faut pas appeler `set()` dessus"
    reponse: 1
    explication: "`asReadonly()` renvoie un `Signal<T>` qui partage la valeur du `WritableSignal` mais ne propose ni `set()` ni `update()` : c'est le compilateur TypeScript qui empêche toute écriture depuis l'extérieur, pas une simple convention documentée."
  - question: "Quel code met à jour le prix du produit en respectant l'immutabilité ?"
    code: |
      const produit = signal({ nom: 'Clavier', prix: 49 });
    choix:
      - "produit().prix = 59;"
      - "produit.update(p => ({ ...p, prix: 59 }));"
      - "produit.set(produit().prix = 59);"
      - "produit().update({ prix: 59 });"
    reponse: 1
    explication: "`update()` reçoit la valeur actuelle et doit renvoyer une **nouvelle** valeur. Ici, on construit un nouvel objet avec `{ ...p, prix: 59 }` : l'objet d'origine n'est pas modifié, et Angular détecte la nouvelle référence."
---

## Essentiel

Un **signal** est un conteneur de valeur qui prévient Angular chaque fois qu'elle change, pour qu'il ne redessine que ce qui en dépend réellement. C'est la base de la réactivité moderne d'Angular : le code reste lisible (on sait exactement quelles valeurs sont réactives), et c'est ce mécanisme fin qui permet à Angular de fonctionner sans `zone.js` (mode **zoneless**, par défaut pour les nouveaux projets Angular 21).

```ts
import { signal } from '@angular/core';

const compteur = signal(0);       // WritableSignal<number>

console.log(compteur());          // 0 — on lit un signal en l'appelant
compteur.set(5);                  // remplace la valeur
compteur.update(v => v + 1);      // calcule la nouvelle valeur à partir de l'ancienne
console.log(compteur());          // 6
```

Dans un template, on appelle le signal comme une fonction : `{{ compteur() }}`. Angular sait alors précisément quel bout de template dépend de ce signal, et ne recalcule que lui.

Avec un objet ou un tableau, il faut respecter l'**immutabilité** : ne jamais modifier la valeur en place, toujours fournir une nouvelle référence.

```ts
const panier = signal<string[]>(['Clavier']);

panier.update(articles => [...articles, 'Souris']); // nouveau tableau, pas de push()
```

Un signal peut être exposé en **lecture seule** (`Signal<T>`), soit parce qu'il vient de `computed()` (leçon suivante), soit via `asReadonly()` sur un `WritableSignal`. C'est la pratique recommandée dans un service : le service garde le contrôle de l'écriture, les composants ne font que lire.

## Détail

### Pourquoi les signaux

Avant les signaux, Angular détectait les changements en relançant la détection de changements sur **tout l'arbre de composants** à chaque événement (grâce à `zone.js`, qui interceptait les timers, les promesses, les événements DOM). Ça marche, mais c'est coûteux et opaque : impossible de savoir, en lisant le code, quelles valeurs déclenchent un rafraîchissement.

Les signaux inversent la logique : chaque signal **sait** qui le lit (un template, un `computed()`, un `effect()`), et ne notifie que ces consommateurs précis quand sa valeur change. C'est plus rapide, plus prévisible, et c'est ce qui rend possible le mode **zoneless** (pas de `zone.js` du tout) : Angular n'a plus besoin de surveiller globalement l'application, les signaux lui disent exactement quoi mettre à jour.

### Exemple 1 — Lire et écrire un signal

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-compteur-panier',
  template: `
    <p>Articles dans le panier : {{ nombreArticles() }}</p>
    <button (click)="ajouterArticle()">Ajouter</button>
  `,
})
export class CompteurPanier {
  nombreArticles = signal(0);

  ajouterArticle() {
    this.nombreArticles.update(n => n + 1);
  }
}
```

`nombreArticles` est un `WritableSignal<number>`. Le template l'appelle (`nombreArticles()`) pour afficher sa valeur ; le composant l'appelle sans parenthèses quand il veut le manipuler (`.update(...)`).

### Exemple 2 — `set()` contre `update()`

```ts
const prix = signal(19.99);

// set() : je connais déjà la nouvelle valeur
prix.set(24.99);

// update() : la nouvelle valeur dépend de l'ancienne
prix.update(p => p * 1.1); // +10 %
```

Utiliser `update()` quand on a besoin de l'ancienne valeur évite une erreur classique : lire le signal séparément puis le fixer, avec un risque de valeur périmée si autre chose a modifié le signal entre-temps.

### Exemple 3 — Immutabilité avec une liste de produits

```ts
interface Produit {
  id: number;
  nom: string;
  prix: number;
}

const catalogue = signal<Produit[]>([
  { id: 1, nom: 'Clavier', prix: 49 },
  { id: 2, nom: 'Souris', prix: 19 },
]);

// Ajouter un produit : nouveau tableau
catalogue.update(produits => [...produits, { id: 3, nom: 'Écran', prix: 199 }]);

// Modifier le prix d'un produit précis : nouveau tableau ET nouvel objet
catalogue.update(produits =>
  produits.map(p => (p.id === 1 ? { ...p, prix: 39 } : p)),
);

// Supprimer un produit : nouveau tableau filtré
catalogue.update(produits => produits.filter(p => p.id !== 2));
```

Le principe est toujours le même : on ne touche jamais à l'ancien tableau ou objet, on en construit un nouveau.

### Exemple 4 — Lecture seule depuis un service

```ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PanierService {
  private readonly _articles = signal<Produit[]>([]);

  // Les composants ne peuvent que lire
  readonly articles = this._articles.asReadonly();

  ajouter(produit: Produit) {
    this._articles.update(articles => [...articles, produit]);
  }
}
```

Un composant qui injecte `PanierService` peut lire `panierService.articles()`, mais pas appeler `panierService.articles.set(...)` : la méthode n'existe simplement pas sur un `Signal<T>`.

### `WritableSignal<T>` contre `Signal<T>`

| | `WritableSignal<T>` | `Signal<T>` |
|---|---|---|
| Créé par | `signal(valeur)` | `computed(...)`, `.asReadonly()` |
| Lecture | `monSignal()` | `monSignal()` |
| `set()` / `update()` | ✅ | ❌ (n'existe pas sur le type) |
| Usage typique | état interne d'un composant ou d'un service | valeur exposée publiquement, ou dérivée |

### Pièges courants

> **Oublier les parenthèses.** `console.log(compteur)` affiche la fonction signal elle-même, pas sa valeur. Il faut toujours appeler le signal : `console.log(compteur())`. C'est vrai aussi dans un template : `{{ compteur }}` n'affichera pas la bonne chose.

> **Muter un objet ou un tableau en place.** `panier().push(article)` puis `panier.set(panier())` ne déclenche **aucune** mise à jour visible, car Angular compare les références et celle-ci n'a pas changé. Toujours passer par `update()` avec une copie (`[...tableau, x]`, `{ ...objet, champ: x }`).

> **Essayer d'appeler `set()` sur un `Signal<T>`.** Une fois passé par `asReadonly()` ou `computed()`, le signal n'a plus ces méthodes : TypeScript refuse la compilation (`Property 'set' does not exist on type 'Signal<...>'`). C'est voulu : c'est ce qui protège l'état contre les écritures non désirées.

### À retenir

- On **lit** un signal en l'appelant : `compteur()`. On l'**écrit** avec `set()` (nouvelle valeur) ou `update()` (à partir de l'ancienne).
- Objets et tableaux doivent rester **immuables** : toujours une nouvelle référence, jamais de mutation en place.
- `WritableSignal<T>` peut être modifié ; `Signal<T>` (via `computed()` ou `asReadonly()`) est en lecture seule.
- `asReadonly()` est la façon recommandée d'exposer un état depuis un service sans permettre aux composants de l'écrire.
- Les signaux sont le socle du mode **zoneless** : ils remplacent la détection de changements globale de `zone.js` par des notifications ciblées.
