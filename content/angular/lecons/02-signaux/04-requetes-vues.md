---
id: requetes-vues
chapitre: signaux
ordre: 4
titre: "Accéder aux éléments : viewChild et contentChild"
termes:
  - terme: "viewChild()"
    definition: "Déclare une requête sur un **élément ou composant du template du composant lui-même** (sa « vue »). Renvoie un signal, `Signal<T | undefined>`, dont la valeur est disponible une fois la vue initialisée."
  - terme: "viewChild.required()"
    definition: "Variante de `viewChild()` pour un élément dont on garantit la présence : le signal a le type `Signal<T>` (sans `undefined`). Si l'élément est absent au moment de la lecture, une erreur est levée."
  - terme: "viewChildren() / contentChildren()"
    definition: "Variantes plurielles qui renvoient un `Signal<ReadonlyArray<T>>` avec **tous** les éléments correspondants, au lieu d'un seul."
  - terme: "contentChild()"
    definition: "Déclare une requête sur un élément **projeté** dans le composant via `<ng-content>` (donc défini par le composant parent), plutôt que sur le propre template du composant."
  - terme: "Référence de template (#nom)"
    definition: "Nom local posé dans un template (`<input #champRecherche>`) qui identifie un élément DOM ou un composant, utilisable comme cible d'une requête `viewChild('champRecherche')` ou passé directement à un autre binding du template."
  - terme: ElementRef
    definition: "Enveloppe Angular autour d'un nœud DOM natif, avec une propriété `.nativeElement`. `viewChild()` posé sur une référence de template d'un élément HTML renvoie un `ElementRef<HTMLElement>` (ou le type précis si spécifié)."
  - terme: afterNextRender
    definition: "Fonction (stable) qui exécute un callback **une seule fois**, juste après le prochain rendu. C'est l'endroit recommandé pour du code qui doit toucher au DOM une fois que la vue est garantie d'être rendue (ex. mesurer une taille, initialiser une librairie tierce)."
quiz:
  - question: "À quel moment `champRecherche()` renvoie-t-il une valeur définie ?"
    code: |
      @Component({
        selector: 'app-barre-recherche',
        template: `<input #champRecherche type="search" />`,
      })
      export class BarreRecherche {
        champRecherche = viewChild<ElementRef<HTMLInputElement>>('champRecherche');

        constructor() {
          console.log(this.champRecherche()); // ?
        }
      }
    choix:
      - "Toujours `undefined`, car `viewChild()` sans `.required` ne fonctionne pas dans un constructeur"
      - "`undefined` dans le constructeur (la vue n'est pas encore initialisée), puis défini une fois le rendu effectué"
      - "L'`ElementRef` correspondant, immédiatement, même dans le constructeur"
      - "Une erreur de compilation : `viewChild()` ne peut pas être appelé sans argument de type explicite"
    reponse: 1
    explication: "Le signal renvoyé par `viewChild()` existe dès la création du composant, mais sa valeur reste `undefined` tant que la vue n'a pas été initialisée — ce qui n'est pas encore le cas dans le constructeur. Une fois le premier rendu effectué, le signal se met à jour et toute lecture réactive (template, `computed()`, `effect()`) en est notifiée automatiquement."
  - question: "Quelle est la différence principale entre `viewChild()` (signal) et le décorateur `@ViewChild` ?"
    choix:
      - "`viewChild()` ne peut cibler qu'une référence de template, jamais un type de composant"
      - "`@ViewChild` est déprécié et sera supprimé en Angular 22"
      - "`viewChild()` renvoie un signal, réutilisable directement dans un `computed()` ou un `effect()` ; `@ViewChild` remplit une propriété, disponible de façon fiable seulement dans `ngAfterViewInit`"
      - "Il n'y a aucune différence, `viewChild()` est un simple renommage de `@ViewChild`"
    reponse: 2
    explication: "`@ViewChild` reste pleinement supporté, mais c'est une propriété simple : il faut attendre le hook `ngAfterViewInit` pour être sûr qu'elle est renseignée. `viewChild()` renvoie un signal qu'on peut lire n'importe où (il vaut `undefined` tant que la vue n'est pas prête) et composer avec `computed()`/`effect()`, qui réagiront automatiquement dès que la valeur devient disponible."
  - question: "Pourquoi préférer `afterNextRender()` à du code placé directement dans le constructeur pour mesurer la largeur d'un élément du template ?"
    choix:
      - "`afterNextRender()` s'exécute avant que le template soit créé, ce qui est plus rapide"
      - "Dans le constructeur, le template n'est pas encore rendu : l'élément n'existe pas dans le DOM. `afterNextRender()` garantit que le rendu a eu lieu avant d'exécuter le callback"
      - "`afterNextRender()` est la seule façon d'accéder à `ElementRef` en Angular 21"
      - "Il n'y a pas de différence, les deux s'exécutent au même moment"
    reponse: 1
    explication: "Le constructeur s'exécute avant que le template du composant soit rendu : un accès direct au DOM y échouerait ou donnerait des mesures incorrectes (élément absent ou pas encore dimensionné). `afterNextRender()` exécute son callback une fois le rendu effectué, ce qui est l'endroit sûr pour ce genre de code."
---

## Essentiel

`viewChild()` récupère une référence vers un élément ou un composant du **propre template** du composant, sous forme de signal. `contentChild()` fait la même chose pour un élément **projeté** par le composant parent via `<ng-content>` (voir la leçon sur la projection de contenu).

```ts
import { Component, ElementRef, viewChild } from '@angular/core';

@Component({
  selector: 'app-barre-recherche',
  template: `<input #champRecherche type="search" />`,
})
export class BarreRecherche {
  // cible la référence de template #champRecherche
  champRecherche = viewChild<ElementRef<HTMLInputElement>>('champRecherche');

  focaliser() {
    this.champRecherche()?.nativeElement.focus();
  }
}
```

`champRecherche` est un `Signal<ElementRef<HTMLInputElement> | undefined>` : il vaut `undefined` tant que la vue n'est pas initialisée, puis se met à jour automatiquement. Quand on est sûr que l'élément existe toujours (pas dans un `@if`), `viewChild.required(...)` évite d'avoir à gérer le cas `undefined` :

```ts
champRecherche = viewChild.required<ElementRef<HTMLInputElement>>('champRecherche');
```

Les variantes plurielles `viewChildren()` et `contentChildren()` renvoient un signal contenant **tous** les éléments correspondants (`Signal<ReadonlyArray<T>>`).

Pour du code qui a besoin d'un rendu garanti (mesurer une taille, initialiser une librairie DOM tierce), `afterNextRender()` est l'endroit recommandé — jamais le constructeur, où le template n'existe pas encore.

## Détail

### Comment ça marche

`viewChild()` accepte soit une **référence de template** (`#nomLocal`, passée en chaîne), soit une **classe de composant ou de directive** (Angular cherche alors une instance de ce type dans le template). Comme il s'agit d'un signal, sa valeur se lit n'importe où — y compris dans un `computed()` ou un `effect()` — et se met à jour automatiquement dès que la vue est initialisée ou change (par exemple, un élément qui apparaît derrière un `@if`).

### Exemple 1 — Cibler un composant enfant par son type

```ts
@Component({ selector: 'app-graphique-ventes', /* ... */ })
export class GraphiqueVentes {
  redessiner() { /* ... */ }
}

@Component({
  selector: 'app-tableau-de-bord',
  imports: [GraphiqueVentes],
  template: `<app-graphique-ventes />`,
})
export class TableauDeBord {
  graphique = viewChild(GraphiqueVentes);

  actualiser() {
    this.graphique()?.redessiner();
  }
}
```

Pas besoin de référence de template ici : passer directement la classe `GraphiqueVentes` suffit à cibler l'instance présente dans le template.

### Exemple 2 — `viewChild.required()` pour un élément toujours présent

```ts
@Component({
  selector: 'app-formulaire-produit',
  template: `
    <form>
      <input #champNom type="text" required />
    </form>
  `,
})
export class FormulaireProduit {
  champNom = viewChild.required<ElementRef<HTMLInputElement>>('champNom');

  focaliserNom() {
    // pas de vérification undefined nécessaire, mais lever une erreur
    // si appelé avant le rendu (à éviter en pratique)
    this.champNom().nativeElement.focus();
  }
}
```

`viewChild.required()` n'a de sens que si l'élément ciblé est **toujours** présent dans le template (pas conditionné par un `@if`) : sinon, `viewChild()` classique avec vérification de `undefined` est plus sûr.

### Exemple 3 — `viewChildren()` sur une liste de lignes

```ts
@Component({
  selector: 'app-panier',
  template: `
    @for (ligne of lignes(); track ligne.id) {
      <app-ligne-panier [ligne]="ligne" />
    }
  `,
})
export class Panier {
  lignesAffichees = viewChildren(LignePanier);

  compterLignesInvalides(): number {
    return this.lignesAffichees().filter(l => !l.estValide()).length;
  }
}
```

`lignesAffichees` se met à jour automatiquement quand `lignes()` change et que le `@for` ajoute ou retire des composants `LignePanier`.

### Exemple 4 — `afterNextRender` pour une librairie tierce

```ts
import { Component, ElementRef, afterNextRender, viewChild } from '@angular/core';

@Component({
  selector: 'app-graphique-ventes',
  template: `<div #conteneur></div>`,
})
export class GraphiqueVentes {
  conteneur = viewChild.required<ElementRef<HTMLDivElement>>('conteneur');

  constructor() {
    afterNextRender(() => {
      // le DOM est garanti disponible ici
      initialiserGraphique(this.conteneur().nativeElement);
    });
  }
}
```

Placer `initialiserGraphique(...)` directement dans le constructeur échouerait : à ce stade, `<div #conteneur>` n'existe pas encore dans le DOM.

### `viewChild()` (signal) contre `@ViewChild` (décorateur)

| | `viewChild()` | `@ViewChild` |
|---|---|---|
| Type renvoyé | `Signal<T \| undefined>` | propriété classique (`T` ou `T \| undefined`) |
| Disponible de façon fiable | dès que la vue est initialisée, lisible n'importe où | seulement à partir de `ngAfterViewInit` |
| Composable avec `computed()` / `effect()` | ✅ nativement | nécessite de le recopier dans un signal |
| Variante obligatoire | `viewChild.required()` | `{ static: true }` (comportement différent, pas une garantie de présence) |
| Statut en v21 | Stable | Stable, pleinement supporté |

### Pièges courants

> **Lire `viewChild()` dans le constructeur en espérant une valeur.** La vue n'est pas encore initialisée : le signal vaut `undefined`. Utiliser `afterNextRender()` pour du code qui a besoin d'une valeur garantie tôt, ou lire le signal dans un `effect()`/`computed()` qui réagira quand la valeur apparaîtra.

> **Utiliser `viewChild.required()` sur un élément derrière un `@if`.** Si la condition est fausse au moment de la lecture, l'élément n'existe pas : `viewChild.required()` lève une erreur. Préférer `viewChild()` (optionnel) avec vérification, dans ce cas.

> **Chercher un élément projeté avec `viewChild()` au lieu de `contentChild()`.** `viewChild()` ne voit que le template **propre** du composant ; un élément fourni par le parent via `<ng-content>` doit être ciblé avec `contentChild()`.

### À retenir

- `viewChild()` / `viewChildren()` : éléments du propre template du composant. `contentChild()` / `contentChildren()` : éléments projetés par le parent.
- Le résultat est un signal : `undefined` tant que la vue n'est pas initialisée, puis mis à jour automatiquement — lisible n'importe où, y compris dans `computed()` et `effect()`.
- `viewChild.required()` supprime le `undefined`, mais suppose que l'élément est toujours présent.
- `ElementRef.nativeElement` donne accès au nœud DOM réel derrière une référence de template.
- `afterNextRender()` est l'endroit recommandé pour du code qui touche au DOM une fois le rendu garanti — jamais le constructeur.
