---
id: projection
chapitre: composition
ordre: 2
titre: "Projeter du contenu"
termes:
  - terme: "<ng-content>"
    definition: "Balise qui marque, dans le template d'un composant, l'endroit où insérer le contenu placé par le **parent** entre les balises ouvrante et fermante du composant. C'est la projection de contenu (*content projection*), l'équivalent Angular des `<slot>` des composants web."
  - terme: "select"
    definition: "Attribut de `<ng-content>` qui restreint la projection à certains éléments du contenu fourni, via un sélecteur CSS (`select=\"[titre]\"`, `select=\".pied\"`, `select=\"app-icone\"`). Permet plusieurs emplacements de projection dans un même composant."
  - terme: "ng-template"
    definition: "Balise qui déclare un fragment de template **sans le rendre immédiatement**. Combinée à `ngTemplateOutlet`, elle permet au parent de fournir un morceau de template personnalisable, pas seulement du contenu figé."
  - terme: "ngTemplateOutlet"
    definition: "Directive qui insère le contenu d'un `TemplateRef` (généralement obtenu via `ng-template` et une référence locale) à un endroit donné. `ngTemplateOutletContext` fournit des données à ce template, accessibles avec `let-xxx`."
  - terme: "ng-container"
    definition: "Élément qui regroupe plusieurs éléments ou applique une directive **sans ajouter de nœud au DOM**. Utile pour poser `select` sur un groupe d'éléments projetés, ou pour appliquer `@if`/`ngTemplateOutlet` sans `<div>` superflu."
  - terme: "contentChild()"
    definition: "Fonction de requête (signal) qui donne accès, depuis la classe du composant, à un élément ou composant **projeté** via `<ng-content>`. Équivalent signal du décorateur `@ContentChild`."
quiz:
  - question: "Un composant `Carte` a ce template. Le parent écrit `<app-carte><p>Bonjour</p></app-carte>`. Que se passe-t-il ?"
    code: |
      @Component({
        selector: 'app-carte',
        template: `
          <div class="carte">
            <ng-content></ng-content>
          </div>
        `,
      })
      export class Carte {}
    choix:
      - "Le `<p>Bonjour</p>` est ignoré, rien ne s'affiche"
      - "Le `<p>Bonjour</p>` est projeté à l'intérieur de la `<div class=\"carte\">`"
      - "Erreur de compilation : `Carte` doit déclarer un `input()` pour recevoir du contenu"
      - "Le `<p>Bonjour</p>` remplace entièrement le template de `Carte`"
    reponse: 1
    explication: "`<ng-content>` projette tel quel le contenu placé par le parent entre les balises `<app-carte>...</app-carte>` à l'endroit où elle apparaît dans le template du composant. Le reste du template de `Carte` (ici la `<div class=\"carte\">`) est conservé autour."
  - question: "Une boîte de dialogue doit projeter séparément un titre et un pied de page, en gardant un contenu par défaut pour le pied si le parent n'en fournit pas. Quelle approche ?"
    choix:
      - "Deux `<ng-content select=\"...\">`, avec le contenu par défaut écrit entre les balises de la seconde"
      - "Un seul `<ng-content>` : Angular sépare automatiquement titre et pied de page"
      - "Deux `input()` de type `TemplateRef`"
      - "Un `@ContentChildren` qui boucle sur tous les enfants projetés"
    reponse: 0
    explication: "Plusieurs `<ng-content select=\"...\">` permettent des emplacements de projection distincts (ex. `select=\"[titre]\"` et `select=\"[pied]\"`). Le contenu placé entre les balises ouvrante et fermante d'un `<ng-content>` sert de valeur par défaut, affichée uniquement si le parent ne projette rien pour ce sélecteur."
  - question: "Pourquoi utiliser `ng-template` + `ngTemplateOutlet` plutôt que `<ng-content>` pour un tableau réutilisable dont chaque ligne doit afficher des données différentes ?"
    choix:
      - "`ng-content` ne fonctionne pas à l'intérieur d'un `@for`"
      - "`ngTemplateOutlet` permet de rendre le **même** template plusieurs fois, avec des données différentes à chaque fois via son contexte, ce que `<ng-content>` ne permet pas"
      - "`ng-template` est plus performant que `ng-content` dans tous les cas"
      - "`ngTemplateOutlet` est la seule directive compatible avec `@for`"
    reponse: 1
    explication: "`<ng-content>` projette un contenu déjà instancié **une seule fois**. Pour afficher un fragment fourni par le parent une fois par ligne d'une liste, avec des données différentes injectées à chaque instanciation, il faut un `TemplateRef` réutilisable : `ng-template` le déclare, `ngTemplateOutlet` (avec `ngTemplateOutletContext`) le rend autant de fois que nécessaire."
---

## Essentiel

La **projection de contenu** permet à un composant de laisser son parent fournir tout ou partie de son contenu, plutôt que de tout coder en dur dans son propre template.

Le cas le plus simple : `<ng-content>` insère ce que le parent a placé entre les balises du composant.

```ts
@Component({
  selector: 'app-carte',
  template: `<div class="carte"><ng-content /></div>`,
})
export class Carte {}
```

```html
<app-carte><p>Contenu du parent</p></app-carte>
```

Avec l'attribut `select`, plusieurs emplacements distincts sont possibles (titre, corps, pied de page), chacun avec un contenu par défaut optionnel écrit entre les balises `<ng-content>...</ng-content>`.

Quand le contenu doit être **réutilisé plusieurs fois** avec des données différentes (une ligne de tableau par élément d'une liste), `<ng-content>` ne suffit plus : il faut un `ng-template`, référencé et rendu via `ngTemplateOutlet`, avec un contexte de données passé via `ngTemplateOutletContext`.

`<ng-container>` regroupe des éléments ou porte une directive sans ajouter de nœud DOM. `contentChild()` permet à la classe du composant d'accéder programmatiquement à un élément projeté.

## Détail

### Pourquoi c'est utile

Sans projection, un composant « carte » ou « boîte de dialogue » devrait exposer un `input()` par variante de contenu possible (texte simple, liste, formulaire...), ce qui devient vite ingérable. La projection laisse le parent écrire du HTML normal, que le composant se contente d'encadrer.

### Exemple 1 — Un emplacement de projection

```ts
// carte.ts
@Component({
  selector: 'app-carte',
  template: `
    <div class="carte">
      <ng-content />
    </div>
  `,
})
export class Carte {}
```

```html
<app-carte>
  <h3>Chaise de bureau</h3>
  <p>79,00 €</p>
</app-carte>
```

Tout ce qui se trouve entre `<app-carte>` et `</app-carte>` est projeté à la place de `<ng-content />`.

### Exemple 2 — Plusieurs emplacements avec `select`

```ts
// boite-dialogue.ts
@Component({
  selector: 'app-boite-dialogue',
  template: `
    <div class="boite">
      <header><ng-content select="[titre]" /></header>
      <section><ng-content /></section>
      <footer>
        <ng-content select="[pied]">
          <button>Fermer</button>
        </ng-content>
      </footer>
    </div>
  `,
})
export class BoiteDialogue {}
```

```html
<app-boite-dialogue>
  <h2 titre>Supprimer la commande ?</h2>
  <p>Cette action est définitive.</p>
  <div pied>
    <button>Annuler</button>
    <button>Supprimer</button>
  </div>
</app-boite-dialogue>
```

`select="[titre]"` capture l'élément portant l'attribut `titre`, `select="[pied]"` celui portant `pied`. Le `<ng-content>` du milieu, sans `select`, récupère tout le reste (ici le `<p>`). Si le parent ne fournit rien pour `[pied]`, le bouton « Fermer » par défaut s'affiche.

### Exemple 3 — `ng-template` et `ngTemplateOutlet` avec contexte

Pour un tableau réutilisable où le parent choisit comment afficher chaque ligne :

```ts
// tableau-generique.ts
@Component({
  selector: 'app-tableau-generique',
  template: `
    @for (produit of produits(); track produit.id) {
      <ng-container
        [ngTemplateOutlet]="ligne()"
        [ngTemplateOutletContext]="{ $implicit: produit }"
      />
    }
  `,
})
export class TableauGenerique {
  produits = input.required<Produit[]>();
  ligne = contentChild.required(TemplateRef);
}
```

```html
<app-tableau-generique [produits]="catalogue">
  <ng-template let-produit>
    <tr>
      <td>{{ produit.nom }}</td>
      <td>{{ produit.prix | currency: 'EUR' }}</td>
    </tr>
  </ng-template>
</app-tableau-generique>
```

Le `ng-template` du parent n'est pas rendu directement : `TableauGenerique` le récupère (`contentChild`) et le rend une fois par produit, via `ngTemplateOutlet`, en lui passant chaque `produit` comme contexte. `let-produit` récupère la valeur `$implicit` du contexte dans le template.

### Exemple 4 — Accéder au contenu projeté avec `contentChild()`

```ts
@Component({
  selector: 'app-onglet',
  template: `<button (click)="activer()">{{ titre() }}</button>`,
})
export class Onglet {
  panneau = contentChild(PanneauOnglet);

  activer() {
    this.panneau()?.afficher();
  }
}
```

`contentChild()` retourne un signal : `undefined` tant que le contenu projeté n'est pas résolu, puis l'instance trouvée. Il existe aussi `contentChildren()` pour récupérer plusieurs éléments projetés correspondants.

### Comparatif

| | Usage | Rendu |
|---|---|---|
| `<ng-content>` | afficher un contenu fourni tel quel, une seule fois | direct |
| `ng-template` + `ngTemplateOutlet` | réutiliser un fragment plusieurs fois, avec des données différentes | à la demande, via le contexte |
| `<ng-container>` | regrouper / appliquer une directive sans nœud DOM | aucun élément ajouté |

### Pièges courants

> **`select` ne matche rien.** Le sélecteur CSS de `select` doit correspondre à un attribut, une classe ou une balise **du contenu du parent tel qu'il est écrit** (ex. `<h2 titre>`). Oublier l'attribut côté parent envoie silencieusement l'élément dans le `<ng-content>` par défaut (ou nulle part s'il n'y en a pas).

> **Utiliser `<ng-content>` pour du contenu répété.** `<ng-content>` n'instancie le contenu du parent **qu'une seule fois**, même placé dans un `@for` : Angular n'accepte pas de le dupliquer ainsi. Pour un rendu répété avec des données variables, il faut `ngTemplateOutlet`.

> **Oublier `<ng-container>` et ajouter une `<div>` inutile.** Poser `select`, `@if` ou `ngTemplateOutlet` sur un élément réel ajoute un nœud DOM parfois indésirable (casse une mise en page CSS basée sur les enfants directs). `<ng-container>` porte la directive sans laisser de trace dans le DOM final.

### À retenir

- `<ng-content>` projette le contenu du parent tel quel, à l'endroit où il apparaît.
- `select` définit plusieurs emplacements de projection ; le contenu entre les balises `<ng-content>` sert de valeur par défaut.
- `ng-template` + `ngTemplateOutlet` (+ `ngTemplateOutletContext`) permettent de réutiliser un fragment fourni par le parent avec des données différentes à chaque rendu.
- `<ng-container>` regroupe ou porte une directive sans ajouter d'élément au DOM.
- `contentChild()` / `contentChildren()` donnent accès, depuis la classe, au contenu projeté.
