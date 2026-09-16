---
id: controle-flux
chapitre: demarrer
ordre: 4
titre: "Le contrôle de flux dans les templates"
termes:
  - terme: "@if / @else if / @else"
    definition: "Bloc de contrôle de flux qui affiche une portion de template selon une condition. `@else if` et `@else` sont optionnels et s'enchaînent comme en TypeScript."
  - terme: "@for"
    definition: "Bloc qui répète une portion de template pour chaque élément d'une collection. Nécessite obligatoirement l'expression `track`, qui indique à Angular comment identifier chaque élément d'une itération à l'autre."
  - terme: track
    definition: "Expression obligatoire de `@for` (`track produit.id`) qui donne à Angular un identifiant stable par élément. Sans elle, Angular ne pourrait pas savoir si un élément a été déplacé, modifié ou remplacé, et devrait tout redessiner à chaque changement."
  - terme: "@empty"
    definition: "Bloc optionnel de `@for`, affiché **à la place** de la boucle quand la collection est vide. Évite un `@if (produits.length === 0)` séparé."
  - terme: "@switch / @case / @default"
    definition: "Bloc de contrôle de flux qui compare une expression à plusieurs valeurs avec `@case`, et affiche `@default` si aucune ne correspond. La comparaison est stricte (`===`), sans effet de cascade entre les cas."
  - terme: "@let"
    definition: "Déclare une variable locale dans un template, calculée une fois et réutilisable dans le bloc où elle est définie : `@let total = prix() * quantite();`."
  - terme: "*ngIf / *ngFor / *ngSwitch"
    definition: "Anciennes directives structurelles à base d'astérisque, **dépréciées depuis Angular 20** au profit de `@if` / `@for` / `@switch`. Toujours fonctionnelles en Angular 21, mais leur suppression est annoncée pour une future version majeure."
quiz:
  - question: "Pourquoi ce code ne compile-t-il pas ?"
    code: |
      @for (produit of produits()) {
        <li>{{ produit.nom }}</li>
      }
    choix:
      - "Il manque un `@empty` pour gérer le cas d'une liste vide"
      - "Il manque l'expression `track`, obligatoire dans `@for`"
      - "`produits()` doit être remplacé par `produits`"
      - "`@for` doit être écrit `*ngFor`"
    reponse: 1
    explication: "`track` est **obligatoire** dans `@for` : `@for (produit of produits(); track produit.id) { ... }`. Sans lui, Angular ne peut pas identifier chaque élément de façon stable pour optimiser les mises à jour de la liste — le compilateur refuse le bloc plutôt que de deviner un comportement par défaut risqué."
  - question: "Que faut-il utiliser dans `track` quand les objets de la collection n'ont pas d'identifiant unique stable ?"
    code: |
      @for (ligne of lignesPanier(); track ???) {
        <app-ligne-panier [ligne]="ligne" />
      }
    choix:
      - "L'index de l'élément dans la boucle, avec `$index`"
      - "L'objet lui-même, avec `ligne`"
      - "Une valeur aléatoire générée à chaque rendu"
      - "`track` peut être omis dans ce cas particulier"
    reponse: 1
    explication: "Suivre `ligne` (l'objet entier) fonctionne quand chaque élément garde la même référence d'un rendu à l'autre (cas fréquent avec des données immuables). Suivre `$index` casse le suivi dès que l'ordre change : Angular associerait le mauvais élément à chaque position, ce qui provoque des ré-affichages incorrects (champs de saisie qui gardent l'ancienne valeur, par exemple)."
  - question: "`*ngIf` fonctionne-t-il encore dans une application Angular 21 ?"
    choix:
      - "Non, il a été supprimé en Angular 20"
      - "Oui, il est déprécié depuis Angular 20 mais reste pleinement fonctionnel en 21"
      - "Oui, mais uniquement dans les composants non standalone"
      - "Non, il faut migrer manuellement chaque usage avant de passer en 21"
    reponse: 1
    explication: "`*ngIf`, `*ngFor` et `*ngSwitch` sont dépréciés depuis Angular 20 (« intention de suppression dans une future version majeure »), mais restent utilisables tels quels en Angular 21. Un schematic de migration automatique existe (`ng generate @angular/core:control-flow`) pour basculer vers `@if`/`@for`/`@switch`."
---

## Essentiel

Depuis Angular 17, le contrôle de flux dans les templates utilise une syntaxe à blocs, intégrée directement au compilateur (pas une directive à importer).

```html
@if (produit.stock > 0) {
  <span class="disponible">En stock</span>
} @else if (produit.stock === 0) {
  <span class="epuise">Épuisé</span>
} @else {
  <span>Stock inconnu</span>
}
```

Pour les listes, `@for` **exige** une expression `track`, qui donne à Angular un identifiant stable par élément :

```html
@for (produit of produits(); track produit.id) {
  <app-produit-card [produit]="produit" />
} @empty {
  <p>Aucun produit ne correspond à votre recherche.</p>
}
```

`@switch` compare une expression à plusieurs valeurs, et `@let` déclare une variable locale calculée une fois :

```html
@switch (produit.statut) {
  @case ('disponible') { <span>Disponible</span> }
  @case ('rupture') { <span>Rupture de stock</span> }
  @default { <span>Statut inconnu</span> }
}

@let total = produit.prix * quantite();
<p>Total : {{ total }} €</p>
```

Les anciennes directives `*ngIf`, `*ngFor` et `*ngSwitch` sont **dépréciées depuis Angular 20** mais restent fonctionnelles en Angular 21 — nul besoin de tout migrer en urgence, mais tout nouveau code devrait utiliser `@if`/`@for`/`@switch`.

## Détail

### Pourquoi `track` est obligatoire

Quand une liste change (ajout, suppression, réordonnancement), Angular doit décider quels éléments du DOM garder, déplacer ou recréer. Sans identifiant stable, la seule option sûre serait de tout détruire et tout recréer à chaque changement — coûteux, et destructeur pour l'état local du DOM (un champ de saisie qui perd le focus, une animation qui repart de zéro).

`track` répond à la question « qu'est-ce qui identifie cet élément, indépendamment de sa position ? ». Le compilateur refuse de compiler un `@for` sans `track` plutôt que de choisir un comportement par défaut potentiellement trompeur.

### Exemple 1 — Bon et mauvais choix de `track`

```html
<!-- Bon : un identifiant métier stable -->
@for (produit of produits(); track produit.id) {
  <app-produit-card [produit]="produit" />
}

<!-- À éviter : l'index change dès que la liste est réordonnée ou filtrée -->
@for (produit of produits(); track $index) {
  <app-produit-card [produit]="produit" />
}

<!-- Dépannage seulement, si aucun identifiant n'existe et que les objets sont recréés à chaque rendu -->
@for (produit of produits(); track produit) {
  <app-produit-card [produit]="produit" />
}
```

`track $index` reste utile dans un cas précis : une liste **strictement statique**, sans ajout, suppression ni réordonnancement (rare en pratique).

### Exemple 2 — `@empty` évite une condition séparée

```html
<!-- Avant : deux blocs séparés -->
@if (produits().length === 0) {
  <p>Panier vide.</p>
}
@for (produit of produits(); track produit.id) {
  <app-ligne-panier [produit]="produit" />
}

<!-- Avec @empty : un seul bloc, l'intention est plus claire -->
@for (produit of produits(); track produit.id) {
  <app-ligne-panier [produit]="produit" />
} @empty {
  <p>Panier vide.</p>
}
```

### Exemple 3 — `@let` pour éviter de répéter un calcul

```html
@for (ligne of lignesPanier(); track ligne.produitId) {
  @let sousTotal = ligne.prixUnitaire * ligne.quantite;
  <tr>
    <td>{{ ligne.nom }}</td>
    <td>{{ ligne.quantite }}</td>
    <td>{{ sousTotal }} €</td>
  </tr>
}
```

`@let` évite de recalculer (ou de dupliquer) la même expression à plusieurs endroits du bloc. La variable n'existe que dans la portée où elle est déclarée — ici, à l'intérieur de chaque itération du `@for`.

### Exemple 4 — `@switch` sans cascade

```html
@switch (commande.statut) {
  @case ('en_attente') { <app-badge type="attente" /> }
  @case ('expediee') { <app-badge type="expediee" /> }
  @case ('livree') { <app-badge type="livree" /> }
  @default { <app-badge type="inconnu" /> }
}
```

Contrairement à un `switch` JavaScript classique, il n'y a pas de risque de « tomber » d'un `@case` au suivant faute de `break` : chaque bloc est indépendant, et la comparaison utilise l'égalité stricte (`===`).

### `*ngIf` / `*ngFor` / `*ngSwitch` : ancien et nouveau

| | Ancienne syntaxe | Syntaxe actuelle |
|---|---|---|
| Condition | `<p *ngIf="cond">...</p>` | `@if (cond) { <p>...</p> }` |
| Boucle | `<li *ngFor="let p of produits">...</li>` | `@for (p of produits; track p.id) { <li>...</li> }` |
| Aiguillage | `[ngSwitch]` / `*ngSwitchCase` | `@switch` / `@case` |
| Statut en v21 | **Déprécié depuis v20**, fonctionnel | Recommandé |
| Import nécessaire | `CommonModule` ou directives individuelles dans `imports` | Aucun, syntaxe du compilateur |

Un schematic de migration automatique existe : `ng generate @angular/core:control-flow` convertit un projet existant vers la nouvelle syntaxe.

### Pièges courants

> **Oublier `track` et s'étonner de l'erreur de compilation.** `@for (produit of produits()) { ... }` sans `track` ne compile pas. C'est volontaire : contrairement à `*ngFor` qui suivait par défaut l'identité d'objet, `@for` force à réfléchir explicitement à ce qui identifie chaque élément.

> **`track $index` sur une liste qui change souvent.** Ça compile, mais ça casse le suivi des éléments dès qu'un tri, un filtre ou une suppression modifie les positions : Angular réutilise le mauvais nœud DOM pour le mauvais élément (état de formulaire ou animation qui « saute » d'une ligne à l'autre).

> **Continuer à importer `CommonModule` uniquement pour `*ngIf`/`*ngFor` dans un composant qui n'en a plus besoin.** Les blocs `@if`/`@for`/`@switch` sont intégrés au compilateur : ils ne nécessitent aucun import. Garder `CommonModule` a un sens seulement si le template utilise encore d'autres éléments qu'il fournit (comme le pipe `async`, lui inchangé).

### À retenir

- `@if` / `@else if` / `@else`, `@for`, `@switch` / `@case` / `@default` et `@let` sont la syntaxe de contrôle de flux actuelle, intégrée au compilateur.
- `track` est **obligatoire** dans `@for` : il identifie chaque élément pour des mises à jour de liste efficaces et correctes.
- `@empty` remplace une condition séparée pour le cas d'une collection vide.
- `*ngIf` / `*ngFor` / `*ngSwitch` sont dépréciés depuis Angular 20 mais toujours fonctionnels en Angular 21 ; un schematic de migration existe.
- Bien choisir `track` (identifiant métier stable) évite des bugs d'affichage subtils sur les listes qui changent.
