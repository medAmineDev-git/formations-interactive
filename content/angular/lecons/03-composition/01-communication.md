---
id: communication
chapitre: composition
ordre: 1
titre: "Faire communiquer des composants"
termes:
  - terme: "input()"
    definition: "Fonction qui déclare une **entrée** de composant sous forme de signal en lecture seule. Le parent fournit la valeur par liaison de template (`[valeur]=\"x\"`), l'enfant la lit en appelant `monInput()`. `input.required<T>()` rend l'entrée obligatoire (erreur si le parent ne la fournit pas)."
  - terme: "output()"
    definition: "Fonction qui déclare une **sortie** de composant. L'enfant émet un événement avec `.emit(valeur)`, le parent l'écoute avec `(evenement)=\"handler($event)\"`. Remplace l'ancien `@Output() + new EventEmitter()` pour le nouveau code."
  - terme: "model()"
    definition: "Déclare une entrée/sortie **combinée** pour la liaison bidirectionnelle (`[(valeur)]=\"x\"`). C'est un signal modifiable depuis l'enfant (`.set()`, `.update()`) : chaque changement émet automatiquement un événement `xChange` que le parent peut écouter, y compris via `[(x)]`."
  - terme: imports
    definition: "Tableau du décorateur `@Component` qui liste les composants, directives et pipes **standalone** utilisés dans le template de ce composant. Sans cette entrée, le compilateur ne reconnaît pas la balise ou l'attribut et le template échoue à la compilation."
  - terme: "Composant intelligent / composant de présentation"
    definition: "Pattern de découpage : un composant **intelligent** (*smart*, *container*) récupère les données (services, routeur) et gère l'état ; un composant de **présentation** (*dumb*, *presentational*) ne fait qu'afficher ce qu'on lui donne via `input()` et notifier via `output()`, sans connaître d'où viennent les données."
  - terme: "@Input() / @Output()"
    definition: "Décorateurs historiques équivalents à `input()` et `output()`. Ils ne sont **pas dépréciés** et restent pleinement supportés, mais la documentation officielle recommande les signaux pour le nouveau code : valeur toujours à jour, intégration native avec `computed()` et `effect()`."
  - terme: Communication via un service
    definition: "Pour deux composants qui ne sont pas parent/enfant direct (ex. frères, ou éloignés dans l'arbre), on partage un service injecté dans les deux : l'un modifie un signal exposé par le service, l'autre le lit. Solution développée plus en détail dans le chapitre « Gestion d'état »."
quiz:
  - question: "Le parent affiche `<app-produit-carte [produit]=\"p\" (ajouter)=\"onAjouter($event)\" />`. Que doit contenir `ProduitCarte` pour que ça compile ?"
    code: |
      @Component({
        selector: 'app-produit-carte',
        template: `...`,
      })
      export class ProduitCarte {
        // ?
      }
    choix:
      - "produit = input<Produit>(); ajouter = output<Produit>();"
      - "produit = signal<Produit>(); ajouter = signal<Produit>();"
      - "@Input() produit; @Output() ajouter = output<Produit>();"
      - "produit = model<Produit>(); ajouter = model<Produit>();"
    reponse: 0
    explication: "`[produit]` est une liaison d'entrée classique : `input()` (ou `@Input()`) suffit, pas besoin de `model()` qui est réservé au two-way binding `[(...)]`. `(ajouter)` est un événement émis par l'enfant : `output<Produit>()` avec `.emit(...)`. Mélanger décorateur et fonction sur la même paire input/output, comme dans la troisième option, fonctionne techniquement mais n'est pas une pratique cohérente."
  - question: "Quelle liaison de template correspond à `quantite = model(1);` dans un composant `SelecteurQuantite` ?"
    choix:
      - "<app-selecteur-quantite [quantite]=\"qte\" />"
      - "<app-selecteur-quantite [(quantite)]=\"qte\" />"
      - "<app-selecteur-quantite (quantite)=\"qte = $event\" />"
      - "<app-selecteur-quantite quantite=\"qte\" />"
    reponse: 1
    explication: "`model()` est fait pour la liaison bidirectionnelle `[(quantite)]` : le parent passe `qte` en entrée et récupère automatiquement chaque changement émis par l'enfant via l'événement implicite `quantiteChange`. `[quantite]` seule ne recevrait que la valeur initiale, sans jamais la synchroniser en retour."
  - question: "Un composant `FilAriane` (fil d'Ariane) utilise `<app-lien-produit />` dans son template, mais Angular signale que `app-lien-produit` n'est pas reconnu. Cause la plus probable ?"
    choix:
      - "LienProduit oublie d'ajouter `standalone: true` à son décorateur"
      - "FilAriane n'a pas ajouté LienProduit dans le tableau `imports` de son `@Component`"
      - "LienProduit n'exporte pas d'`input()`"
      - "Il manque un `NgModule` partagé entre les deux composants"
    reponse: 1
    explication: "Depuis qu'un composant est standalone par défaut, il n'a plus besoin d'être déclaré dans un module : c'est le tableau `imports` du composant **qui l'utilise** dans son template qui doit lister `LienProduit`. Oublier cette entrée est l'erreur la plus fréquente lors de la composition de composants standalone."
---

## Essentiel

Un composant communique avec son parent ou son enfant via trois fonctions à base de signaux.

**Parent → enfant**, avec `input()` :

```ts
@Component({ selector: 'app-produit-carte' })
export class ProduitCarte {
  produit = input.required<Produit>();
}
```

```html
<app-produit-carte [produit]="produitCourant" />
```

**Enfant → parent**, avec `output()` :

```ts
ajouterAuPanier = output<Produit>();

confirmer() {
  this.ajouterAuPanier.emit(this.produit());
}
```

```html
<app-produit-carte (ajouterAuPanier)="onAjout($event)" />
```

**Liaison bidirectionnelle**, avec `model()` : l'enfant modifie la valeur et le parent est notifié automatiquement, sans écrire d'`output()` séparé.

```ts
quantite = model(1);
```

```html
<app-selecteur-quantite [(quantite)]="quantiteChoisie" />
```

Pour qu'un composant standalone apparaisse dans un template, il doit figurer dans le tableau `imports` du composant qui l'utilise. Quand deux composants ne sont ni parent ni enfant, on passe par un **service partagé** injecté des deux côtés plutôt que par des `input`/`output` en cascade.

## Détail

### Pourquoi c'est utile

Découper une application en petits composants qui communiquent par entrées/sorties rend chaque composant testable isolément et réutilisable. Le pattern **intelligent / présentation** pousse cette idée plus loin : un composant intelligent (`ProduitsPage`) connaît les services et l'état de l'application, un composant de présentation (`ProduitCarte`) ne connaît que ce qu'on lui donne. Les composants de présentation, sans dépendance, sont les plus simples à tester et à documenter dans un catalogue de composants.

### Exemple 1 — Parent vers enfant avec `input()`

```ts
// produit-carte.ts
import { Component, input } from '@angular/core';
import { Produit } from '../produit.model';

@Component({
  selector: 'app-produit-carte',
  template: `
    <article>
      <h3>{{ produit().nom }}</h3>
      <p>{{ produit().prix | currency: 'EUR' }}</p>
    </article>
  `,
})
export class ProduitCarte {
  produit = input.required<Produit>();
  // entrée optionnelle avec valeur par défaut
  compact = input(false);
}
```

```html
<!-- catalogue.html -->
<app-produit-carte [produit]="p" [compact]="true" />
```

`produit` est un signal en lecture seule : dans le template comme dans la classe, on l'appelle `produit()` pour lire sa valeur.

### Exemple 2 — Enfant vers parent avec `output()`

```ts
// produit-carte.ts
import { Component, input, output } from '@angular/core';

@Component({ selector: 'app-produit-carte' /* ... */ })
export class ProduitCarte {
  produit = input.required<Produit>();
  ajouterAuPanier = output<Produit>();

  onClicAjouter() {
    this.ajouterAuPanier.emit(this.produit());
  }
}
```

```html
<!-- catalogue.html -->
<app-produit-carte
  [produit]="p"
  (ajouterAuPanier)="panier.ajouter($event)"
/>
```

Le parent (`CataloguePage`, un composant intelligent) reçoit l'événement et décide quoi en faire, ici appeler un service `Panier`.

### Exemple 3 — Liaison bidirectionnelle avec `model()`

```ts
// selecteur-quantite.ts
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-selecteur-quantite',
  template: `
    <button (click)="quantite.update((q) => Math.max(1, q - 1))">-</button>
    <span>{{ quantite() }}</span>
    <button (click)="quantite.update((q) => q + 1)">+</button>
  `,
})
export class SelecteurQuantite {
  quantite = model(1);
}
```

```html
<!-- panier-ligne.html -->
<app-selecteur-quantite [(quantite)]="ligne.quantite" />
```

À chaque clic, `quantite.update(...)` change le signal **et** émet l'événement `quantiteChange`, ce qui met à jour `ligne.quantite` chez le parent. Un `model()` peut aussi être utilisé sans `[( )]`, en liaison simple `[quantite]` ou `(quantiteChange)`.

### Exemple 4 — Composants éloignés : passer par un service

```ts
// panier.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PanierService {
  private lignes = signal<LignePanier[]>([]);
  nombreArticles = computed(() => this.lignes().length);

  ajouter(produit: Produit) {
    this.lignes.update((l) => [...l, { produit, quantite: 1 }]);
  }
}
```

```ts
// en-tete.ts (affiche le compteur, loin de la page catalogue dans l'arbre)
export class EnTete {
  private panier = inject(PanierService);
  nombreArticles = this.panier.nombreArticles;
}
```

`ProduitCarte` et `EnTete` n'ont aucun lien parent/enfant, mais partagent le même `PanierService` injecté en singleton (`providedIn: 'root'`) : l'un écrit, l'autre lit. Le chapitre « Gestion d'état » détaille les stratégies plus riches (providers hiérarchiques, stores).

### Comparatif des trois API

| | Sens | Déclaration | Le parent écrit |
|---|---|---|---|
| `input()` | parent → enfant | `valeur = input<T>()` | `[valeur]="x"` |
| `output()` | enfant → parent | `evt = output<T>()` | `(evt)="handler($event)"` |
| `model()` | les deux | `valeur = model<T>(init)` | `[(valeur)]="x"` |

### Pièges courants

> **Composant introuvable dans le template.** Un composant standalone doit être ajouté au tableau `imports` du composant **parent** (celui qui l'utilise dans son propre template), pas du composant lui-même. L'oubli produit une erreur de compilation du template signalant une balise inconnue.

> **Confondre `output()` et `model()`.** `output()` seul ne permet pas d'écrire `[(valeur)]` côté parent : Angular s'attend à trouver à la fois une entrée `valeur` et une sortie `valeurChange`. Pour une vraie liaison bidirectionnelle, `model()` est plus simple qu'un couple `input()` + `output()` nommé manuellement.

> **Chaîner les `input`/`output` sur plusieurs niveaux.** Faire remonter une donnée de trois composants imbriqués via des `output()` en cascade jusqu'à un ancêtre commun devient vite illisible. Passé un ou deux niveaux, un service partagé est plus clair.

### À retenir

- `input()` pour recevoir, `output()` pour émettre, `model()` pour les deux à la fois.
- Un composant standalone doit être listé dans le tableau `imports` du composant qui l'utilise.
- Les décorateurs `@Input()`/`@Output()` restent supportés mais les fonctions à base de signaux sont recommandées pour le nouveau code.
- Composant intelligent (données, services) / composant de présentation (affichage pur) : un découpage qui facilite les tests.
- Deux composants sans lien parent/enfant communiquent via un service partagé, pas via des `input`/`output` en cascade.
