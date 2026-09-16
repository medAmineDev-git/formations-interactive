---
id: inputs-outputs
chapitre: signaux
ordre: 3
titre: Entrées et sorties d'un composant
termes:
  - terme: "input()"
    definition: "Déclare une **entrée** (input) sous forme de signal en lecture seule (`InputSignal<T>`). Le composant parent fournit la valeur par liaison de template ; le composant reçoit un `Signal<T>` qu'il lit avec des parenthèses (`valeur()`)."
  - terme: "input.required()"
    definition: "Variante de `input()` pour une entrée **obligatoire**, sans valeur par défaut. Si le composant parent oublie de la fournir, le compilateur de templates signale une erreur à la compilation."
  - terme: "output()"
    definition: "Déclare une **sortie** (output) : un événement que le composant peut émettre avec `.emit(valeur)`. Le composant parent l'écoute avec la syntaxe `(evenement)=\"...\"`, exactement comme avec l'ancien `@Output`."
  - terme: "model()"
    definition: "Combine une entrée et une sortie pour la **liaison bidirectionnelle** (« two-way binding ») : `[(propriete)]=\"variable\"` côté parent. Le composant peut à la fois lire la valeur et la modifier avec `.set()`/`.update()`, ce qui émet automatiquement le changement vers le parent."
  - terme: "transform"
    definition: "Option de `input()` : une fonction qui convertit la valeur reçue avant de l'exposer dans le signal, par exemple `transform: booleanAttribute` pour accepter un attribut HTML sans valeur (`<app-carte figee>`)."
  - terme: alias
    definition: "Option de `input()` (et `output()`) qui donne un nom différent à la propriété côté template, tout en gardant un nom de champ différent côté TypeScript : `input(0, { alias: 'valeurInitiale' })`."
  - terme: "@Input / @Output"
    definition: "Décorateurs historiques pour déclarer entrées et sorties. Toujours **pleinement supportés** en Angular 21 (pas dépréciés), mais l'équipe Angular recommande désormais les fonctions `input()` / `output()` / `model()` pour les nouveaux projets."
quiz:
  - question: "Le composant parent oublie de fournir `produit` à `<app-fiche-produit>`. Que se passe-t-il ?"
    code: |
      @Component({
        selector: 'app-fiche-produit',
        template: `<h2>{{ produit().nom }}</h2>`,
      })
      export class FicheProduit {
        produit = input.required<Produit>();
      }
    choix:
      - "Le composant s'affiche avec `produit()` valant `undefined`, et plante au premier accès à `.nom` seulement au runtime"
      - "Le compilateur de templates signale une erreur à la compilation : l'entrée obligatoire n'est pas fournie"
      - "Angular fournit automatiquement `null` comme valeur par défaut"
      - "Rien : `input.required()` se comporte exactement comme `input()` sans argument"
    reponse: 1
    explication: "`input.required<T>()` déclare une entrée sans valeur par défaut. Si le template du parent n'utilise pas `[produit]=\"...\"` sur `<app-fiche-produit>`, le compilateur de templates Angular détecte l'entrée manquante et refuse de compiler — l'erreur est détectée bien avant l'exécution."
  - question: "Quelle déclaration permet la liaison bidirectionnelle `<app-selecteur-quantite [(quantite)]=\"quantiteCommande\" />` ?"
    choix:
      - "quantite = input(1);"
      - "quantite = output<number>();"
      - "quantite = model(1);"
      - "@Input() quantite = 1; @Output() quantiteChange = new EventEmitter<number>();"
    reponse: 2
    explication: "`model()` est la façon signal-based de créer une entrée/sortie combinée pour `[(...)]`. La quatrième option obtiendrait le même résultat avec les décorateurs classiques (toujours valides), mais ce n'est pas ce que produit `model()` : une seule déclaration, à comparer aux deux nécessaires avec les décorateurs."
  - question: "Vrai ou faux : en Angular 21, les décorateurs `@Input()` et `@Output()` sont dépréciés au profit de `input()` et `output()`."
    choix:
      - "Vrai, ils seront supprimés dans une prochaine version majeure"
      - "Faux : ils restent pleinement supportés, l'approche signaux est seulement recommandée pour les nouveaux projets"
      - "Vrai, mais seulement `@Output()` est concerné, `@Input()` reste recommandé"
      - "Faux, c'est l'inverse : `input()`/`output()` sont dépréciés au profit des décorateurs"
    reponse: 1
    explication: "La documentation Angular est explicite : les décorateurs historiques « remain fully supported ». Ils ne portent aucune dépréciation en v21. L'équipe recommande l'approche signaux pour les nouveaux projets, mais aucune migration n'est imposée sur le code existant."
---

## Essentiel

`input()` déclare une entrée de composant sous forme de **signal en lecture seule**. La valeur vient du parent, le composant la lit avec des parenthèses :

```ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-carte-produit',
  template: `<h3>{{ nom() }}</h3><p>{{ prix() }} €</p>`,
})
export class CarteProduit {
  nom = input.required<string>();  // obligatoire, pas de valeur par défaut
  prix = input(0);                 // optionnelle, valeur par défaut 0
}
```

Côté parent : `<app-carte-produit [nom]="produit.nom" [prix]="produit.prix" />`. Si `nom` (obligatoire) n'est pas fourni, le compilateur de templates signale l'erreur — pas de surprise au runtime.

`output()` déclare un événement que le composant émet avec `.emit(...)` :

```ts
ajouterAuPanier = output<Produit>();

// dans le template : (click)="ajouterAuPanier.emit(produit())"
```

Le parent écoute avec `(ajouterAuPanier)="onAjout($event)"`, exactement comme avec l'ancien `@Output`.

`model()` combine les deux pour une **liaison bidirectionnelle** :

```ts
quantite = model(1); // input + output combinés
// quantite() pour lire, quantite.set(n) pour écrire ET notifier le parent
```

Le parent peut alors écrire `<app-selecteur-quantite [(quantite)]="quantiteCommande" />`.

Les décorateurs `@Input()` et `@Output()` fonctionnent toujours en Angular 21 et ne sont pas dépréciés, mais l'approche signaux est recommandée pour les nouveaux composants : elle s'intègre naturellement avec `computed()` et `effect()`.

## Détail

### Exemple 1 — Options `alias` et `transform`

```ts
@Component({
  selector: 'app-carte-produit',
  template: `<article [class.figee]="estFigee()">{{ titre() }}</article>`,
})
export class CarteProduit {
  // alias : nom différent côté template
  titre = input('', { alias: 'titreAffiche' });

  // transform : convertit un attribut HTML sans valeur en booléen
  estFigee = input(false, { transform: booleanAttribute });
}
```

```html
<!-- côté parent -->
<app-carte-produit [titreAffiche]="produit.nom" figee />
```

`booleanAttribute` (fourni par `@angular/core`) permet d'écrire `figee` sans `="true"`, comme un attribut HTML natif (`disabled`, `readonly`).

### Exemple 2 — Un panier avec `output()`

```ts
interface Produit {
  id: number;
  nom: string;
  prix: number;
}

@Component({
  selector: 'app-ligne-produit',
  template: `
    <span>{{ produit().nom }} — {{ produit().prix }} €</span>
    <button (click)="ajouter.emit(produit())">Ajouter au panier</button>
    <button (click)="retirer.emit(produit().id)">Retirer</button>
  `,
})
export class LigneProduit {
  produit = input.required<Produit>();
  ajouter = output<Produit>();
  retirer = output<number>();
}
```

```ts
// composant parent
@Component({
  selector: 'app-catalogue',
  imports: [LigneProduit],
  template: `
    @for (produit of produits(); track produit.id) {
      <app-ligne-produit
        [produit]="produit"
        (ajouter)="ajouterAuPanier($event)"
        (retirer)="retirerDuPanier($event)"
      />
    }
  `,
})
export class Catalogue {
  produits = input.required<Produit[]>();
  ajouterAuPanier(produit: Produit) { /* ... */ }
  retirerDuPanier(id: number) { /* ... */ }
}
```

### Exemple 3 — Liaison bidirectionnelle avec `model()`

```ts
@Component({
  selector: 'app-selecteur-quantite',
  template: `
    <button (click)="quantite.update(q => Math.max(1, q - 1))">-</button>
    <span>{{ quantite() }}</span>
    <button (click)="quantite.update(q => q + 1)">+</button>
  `,
})
export class SelecteurQuantite {
  quantite = model(1);
}
```

```html
<!-- parent : quantiteCommande se met à jour automatiquement -->
<app-selecteur-quantite [(quantite)]="quantiteCommande" />
```

Chaque appel à `quantite.set(...)` ou `quantite.update(...)` dans `SelecteurQuantite` propage la nouvelle valeur vers `quantiteCommande` chez le parent. Le parent peut aussi lier la valeur en lecture seule avec `[quantite]="valeur"` s'il n'a pas besoin de la synchronisation dans les deux sens.

### Exemple 4 — Migration d'un composant en décorateurs

```ts
// Avant (décorateurs, toujours valide)
@Component({ /* ... */ })
export class AncienneCarteProduit {
  @Input({ required: true }) nom!: string;
  @Input() prix = 0;
  @Output() ajouterAuPanier = new EventEmitter<void>();
}

// Après (signaux, recommandé pour du nouveau code)
@Component({ /* ... */ })
export class CarteProduit {
  nom = input.required<string>();
  prix = input(0);
  ajouterAuPanier = output<void>();
}
```

Les deux styles cohabitent sans problème dans une même application ; rien n'oblige à migrer le code existant.

### Comparaison : signaux contre décorateurs

| | `input()` / `output()` / `model()` | `@Input` / `@Output` |
|---|---|---|
| Statut en v21 | Stable, recommandé | Stable, pleinement supporté |
| Lecture d'une entrée | `valeur()` (signal) | `this.valeur` (propriété) |
| Entrée obligatoire | `input.required<T>()` | `@Input({ required: true })` |
| S'utilise dans `computed()` / `effect()` | Naturellement (c'est un signal) | Nécessite de repasser par un signal |
| Two-way binding en une déclaration | `model()` | Deux membres (`@Input` + `@Output` suffixé `Change`) |

### Pièges courants

> **Oublier les parenthèses sur un `input()`.** `{{ produit.nom }}` dans le template échoue si `produit` est un `input()` : `produit` est le signal lui-même, il faut `produit().nom`. C'est la même règle que pour tout signal.

> **Confondre `[produit]` et `[(produit)]`.** Un simple `[produit]="valeur"` sur un `model()` reste valide (liaison à sens unique), mais si le composant modifie `produit` en interne, le parent ne le verra jamais sans les parenthèses `[(...)]` qui activent la synchronisation dans les deux sens.

> **Donner une valeur par défaut à `input.required()`.** `input.required(0)` ne compile pas : une entrée obligatoire n'a par définition pas de valeur par défaut. Utiliser `input.required<number>()` sans argument, ou revenir à `input(0)` si une valeur par défaut a du sens.

### À retenir

- `input()` / `input.required()` : entrée en lecture seule, lue avec `valeur()`.
- `output()` : événement émis avec `.emit(...)`, écouté côté parent avec `(evenement)="..."`.
- `model()` : entrée + sortie combinées, pour `[(propriete)]="variable"`.
- `alias` renomme la propriété côté template ; `transform` convertit la valeur reçue (ex. `booleanAttribute`).
- `@Input` / `@Output` restent pleinement supportés en Angular 21 : ce n'est pas une dépréciation, seulement une recommandation pour le nouveau code.
