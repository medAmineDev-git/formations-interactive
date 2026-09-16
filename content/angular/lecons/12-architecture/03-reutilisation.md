---
id: reutilisation
chapitre: architecture
ordre: 3
titre: "Réutiliser sans se piéger"
termes:
  - terme: "hostDirectives"
    definition: "Métadonnée de `@Component` ou `@Directive` qui applique une ou plusieurs directives directement sur l'hôte du composant, en exposant (ou non) leurs entrées et sorties. Permet de composer un comportement sans héritage ni duplication."
  - terme: API d'un composant réutilisable
    definition: "Ensemble des entrées, sorties et emplacements de projection (`ng-content`) qu'un composant expose. Une bonne API reste petite et explicite ; elle privilégie la projection de contenu à la multiplication d'options."
  - terme: Composant « à tout faire »
    definition: "Anti-pattern où un composant unique accumule des entrées (souvent booléennes) pour couvrir toutes les variantes imaginables, au lieu de rester simple et de laisser la composition (projection, plusieurs petits composants) gérer la diversité des cas."
  - terme: Règle de trois
    definition: "Convention répandue (pas une règle Angular) : attendre une troisième utilisation d'un même bout de code avant de l'extraire en composant, directive ou fonction réutilisable, pour éviter d'abstraire une similarité qui n'était en réalité pas durable."
  - terme: "Angular CDK"
    definition: "Component Dev Kit : ensemble de briques comportementales non stylées (positionnement d'overlay, gestion du focus clavier, glisser-déposer, détection de breakpoints…) utilisées à la fois en interne par Angular Material et directement dans des composants maison."
  - terme: Abstraction prématurée
    definition: "Créer un composant, une directive ou une option générique avant d'avoir un second cas d'usage réel. Le résultat colle rarement au vrai second besoin quand il arrive, et complique l'API pour rien dans l'intervalle."
quiz:
  - question: "Un comportement « repliable » (afficher/masquer un contenu au clic sur un en-tête) doit s'appliquer à la fois à une carte produit et à un panneau de filtres, deux composants au template très différent. Quel outil choisir pour éviter de dupliquer la logique ?"
    choix:
      - "Un composant wrapper générique `<app-repliable>` qui engloberait les deux, avec un `<ng-content>` pour le contenu"
      - "Une directive appliquée via hostDirectives sur chacun des deux composants, qui porte l'état ouvert/fermé et la logique de bascule sans imposer de template"
      - "Copier la logique de bascule dans les deux composants, car leurs templates sont trop différents pour partager du code"
      - "Un pipe qui transforme le contenu selon l'état ouvert/fermé"
    reponse: 1
    explication: "hostDirectives permet d'appliquer un comportement (ici, un état ouvert/fermé et sa logique de bascule) sur l'hôte de deux composants différents, sans les forcer à partager un même template. Un composant wrapper imposerait sa propre structure HTML autour du contenu, ce qui ne convient pas si les deux composants ont des mises en page très différentes."
  - question: "Ce composant bouton accumule des entrées pour couvrir tous les usages rencontrés au fil du temps. Quel est le principal problème de cette API ?"
    code: |
      @Component({ selector: 'app-bouton' })
      export class Bouton {
        primaire = input(false);
        secondaire = input(false);
        petit = input(false);
        grand = input(false);
        arrondi = input(false);
        avecIcone = input(false);
        pleineLargeur = input(false);
        desactiveSiVide = input(false);
        chargement = input(false);
        // ... encore quelques entrées booléennes
      }
    choix:
      - "Angular limite le nombre d'input() par composant, ce code ne compile pas"
      - "Des entrées booléennes qui se combinent librement créent des états incohérents possibles (primaire et secondaire à la fois, petit et grand à la fois) et une API difficile à lire ou à faire évoluer ; un type de variante explicite ou plusieurs composants plus ciblés seraient plus sûrs"
      - "Rien : plus un composant a d'options, plus il est réutilisable"
      - "Le problème est uniquement de performance : chaque input() ajoute un coût au rendu"
    reponse: 1
    explication: "Empiler des booléens indépendants autorise des combinaisons absurdes (primaire ET secondaire) que rien n'empêche à la compilation, et rend l'API illisible à l'usage. Une entrée unique `variante = input<'primaire' | 'secondaire'>('primaire')` (ou plusieurs composants dédiés pour des usages vraiment différents) exprime mieux les états réellement valides."
  - question: "Quelle affirmation décrit le mieux la différence entre Angular Material et Angular CDK ?"
    choix:
      - "Le CDK est une version allégée de Material avec moins de composants"
      - "Material propose des composants visuels complets suivant Material Design ; le CDK fournit des briques de comportement (overlay, glisser-déposer, gestion du clavier, détection de breakpoints) sans imposer de style, réutilisables pour construire des composants maison"
      - "Le CDK sert uniquement à écrire des tests pour les composants Material"
      - "Material et CDK sont deux noms pour la même librairie, à des versions différentes"
    reponse: 1
    explication: "Angular Material dépend du CDK pour son comportement (positionnement, accessibilité clavier…) mais y ajoute un habillage visuel selon Material Design. Utiliser directement le CDK permet de profiter de comportements robustes et accessibles (déjà éprouvés) tout en gardant un style entièrement personnalisé, sans avoir à réinventer par exemple la gestion du focus clavier dans une liste."
---

## Essentiel

Avant d'extraire quoi que ce soit, se demander **ce qu'on réutilise vraiment** :

- Une **fonction** simple, si c'est un calcul pur sans état ni template (ex. `calculerRemise(prix, taux)`).
- Un **pipe**, si c'est une transformation d'affichage utilisée dans plusieurs templates (`| devise`, `| dureeRelative`).
- Une **directive** (éventuellement via `hostDirectives`), si c'est un comportement à appliquer sur des éléments ou composants au template différent, sans template propre à imposer.
- Un **composant**, si c'est un morceau d'interface avec sa propre structure HTML et son propre état d'affichage.

Une API de composant réutilisable reste petite : des entrées qui décrivent clairement un état possible, et de la **projection de contenu** (`<ng-content>`) plutôt qu'une entrée pour chaque variante imaginable.

```ts
// Préférable : projection de contenu
@Component({
  selector: 'app-carte',
  template: `
    <div class="carte">
      <ng-content select="[carte-entete]" />
      <ng-content />
    </div>
  `,
})
export class Carte {}
```

```html
<app-carte>
  <h3 carte-entete>Clavier mécanique</h3>
  <p>Description libre, mise en page libre.</p>
</app-carte>
```

Le piège classique est le composant « à tout faire » : une entrée booléenne par variante rencontrée au fil du temps (`primaire`, `arrondi`, `pleineLargeur`, `avecIcone`…), jusqu'à une API illisible qui autorise des combinaisons qui n'ont pas de sens. Mieux vaut une entrée qui exprime un choix fermé (`variante = input<'primaire' | 'secondaire'>('primaire')`) ou, si les usages divergent vraiment, plusieurs composants ciblés plutôt qu'un seul composant universel.

## Détail

### Comment choisir entre composant, directive, pipe et fonction

Le bon niveau d'abstraction dépend de ce qui varie et de ce qui reste fixe :

- Le **template** est-il toujours le même, juste les données changent ? → composant.
- Il n'y a **pas de template propre**, seulement un comportement à greffer sur un élément existant ? → directive.
- C'est une **transformation de valeur** pour l'affichage, sans état propre ? → pipe.
- Il n'y a **ni template ni état**, juste un calcul ? → fonction simple, pas besoin d'un artefact Angular.

### Exemple 1 — `hostDirectives` : un comportement repliable partagé

```ts
@Directive({
  selector: '[appRepliable]',
  host: {
    '[attr.aria-expanded]': 'ouvert()',
  },
})
export class Repliable {
  ouvert = signal(false);

  basculer() {
    this.ouvert.update((v) => !v);
  }
}

@Component({
  selector: 'app-produit-carte',
  hostDirectives: [{ directive: Repliable, inputs: [], outputs: [] }],
  template: `
    <button (click)="repliable.basculer()">{{ produit().nom }}</button>
    @if (repliable.ouvert()) {
      <p>{{ produit().description }}</p>
    }
  `,
})
export class ProduitCarte {
  produit = input.required<Produit>();
  protected repliable = inject(Repliable, { self: true });
}
```

`Repliable` porte l'état ouvert/fermé et sa logique, sans connaître ni le template de `ProduitCarte`, ni celui d'un éventuel `PanneauFiltres` qui l'utiliserait de la même façon avec un tout autre affichage.

### Exemple 2 — Une API resserrée plutôt que des options infinies

```ts
// À éviter : une entrée par variante
@Component({ selector: 'app-alerte' })
export class AlerteAEviter {
  succes = input(false);
  erreur = input(false);
  avertissement = input(false);
  info = input(false);
}
```

```ts
// Préférable : un seul état fermé, qui exclut les combinaisons impossibles
@Component({
  selector: 'app-alerte',
  template: `<div [class]="'alerte alerte-' + type()"><ng-content /></div>`,
})
export class Alerte {
  type = input<'succes' | 'erreur' | 'avertissement' | 'info'>('info');
}
```

La seconde version rend impossible d'avoir `succes` et `erreur` à `true` en même temps — un état qui n'a aucun sens mais que la première version autorisait sans le vouloir.

### Exemple 3 — Angular CDK : du comportement sans style imposé

```ts
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-liste-panier',
  imports: [CdkDropList, CdkDrag],
  template: `
    <ul cdkDropList (cdkDropListDropped)="reordonner($event)">
      @for (ligne of lignes(); track ligne.id) {
        <li cdkDrag>{{ ligne.produit.nom }}</li>
      }
    </ul>
  `,
})
export class ListePanier {
  lignes = input.required<LigneCommande[]>();
}
```

Le CDK apporte la mécanique de glisser-déposer (calcul de position, accessibilité clavier, gestion tactile) sans imposer la moindre classe CSS : le style de `<li>` reste entièrement personnalisé. C'est la même logique qui alimente les composants Angular Material, mais utilisable seule, sans le style Material.

### Composant, directive, pipe ou fonction : repères

| Situation | Choix |
|---|---|
| Structure HTML propre et réutilisée | Composant |
| Comportement sans template, appliqué à des hôtes variés | Directive (`hostDirectives` pour composer plusieurs comportements) |
| Transformation d'affichage d'une valeur | Pipe |
| Calcul pur, sans template ni état | Fonction simple |
| Positionnement, focus clavier, glisser-déposer, breakpoints | Angular CDK plutôt que réinventer |

### Pièges courants

> **Extraire un composant réutilisable dès la première utilisation.** Sans un deuxième cas d'usage réel, il est difficile de deviner ce qui doit vraiment être configurable. La « règle de trois » (attendre une troisième occurrence avant d'abstraire) évite de construire une API générique autour d'un seul besoin, puis de devoir la retoucher en profondeur au deuxième cas qui ne rentre pas dans le moule prévu.

> **Empiler les entrées booléennes pour couvrir tous les cas.** Chaque nouveau besoin qui ajoute un `input(false)` de plus à un composant existant est un signal à prendre au sérieux : au-delà de quatre ou cinq entrées de ce type, une entrée à choix fermé (union de chaînes littérales) ou une scission en plusieurs composants sont presque toujours plus sûres.

> **Réinventer ce que le CDK fournit déjà.** Repositionnement d'un overlay au bord de l'écran, navigation au clavier dans une liste, détection de breakpoints : ce sont des problèmes déjà résolus, avec leurs cas limites d'accessibilité, dans `@angular/cdk`. Les réécrire à la main coûte cher et rate souvent des détails (piège au clavier, lecteurs d'écran) que le CDK gère déjà.

### À retenir

- Choisir l'outil selon ce qui varie : composant (template), directive (comportement sans template propre), pipe (transformation d'affichage), fonction (calcul pur).
- Une API de composant réutilisable reste petite : peu d'entrées, projection de contenu plutôt qu'une option par variante.
- `hostDirectives` compose un comportement sur des composants au template différent, sans wrapper imposé.
- Attendre un vrai second (ou troisième) besoin avant d'abstraire ; la duplication ponctuelle coûte souvent moins cher qu'une mauvaise abstraction.
- Le CDK fournit des comportements complexes et accessibles sans style imposé : à privilégier avant de réécrire ces mécaniques soi-même.
