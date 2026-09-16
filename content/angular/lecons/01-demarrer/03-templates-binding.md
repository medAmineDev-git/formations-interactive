---
id: templates-binding
chapitre: demarrer
ordre: 3
titre: "Templates et liaisons de données"
termes:
  - terme: Interpolation
    definition: "Syntaxe `{{ expression }}` qui insère le résultat d'une expression dans le texte d'un template. Angular convertit automatiquement le résultat en chaîne de caractères."
  - terme: "Property binding — [prop]"
    definition: "Lie une propriété d'un élément DOM, d'un composant ou d'une directive à une expression TypeScript : `[disabled]=\"panierVide()\"`. La valeur est évaluée et réaffectée à chaque détection de changement pertinente."
  - terme: "Event binding — (evt)"
    definition: "Exécute une expression (le plus souvent un appel de méthode) en réaction à un événement DOM ou personnalisé : `(click)=\"ajouterAuPanier(produit)\"`. `$event` donne accès à l'objet événement."
  - terme: "Liaison de classe et de style"
    definition: "`[class.nom]=\"expression\"` ajoute ou retire une classe CSS selon un booléen ; `[style.propriete]=\"expression\"` fixe une propriété CSS. `[class]` et `[style]` acceptent aussi directement une chaîne, un tableau ou un objet."
  - terme: "[attr.x]"
    definition: "Lie un **attribut HTML** (et non une propriété DOM), utile pour les attributs sans propriété JS correspondante (`aria-*`, `data-*`, `colspan`...) ou pour en retirer un quand la valeur est `null`."
  - terme: "model()"
    definition: "Fonction (`@angular/core`) qui déclare une entrée de composant utilisable en **liaison bidirectionnelle** avec la syntaxe `[(prop)]`. Détaillée dans le chapitre « Les signaux » (leçon « Entrées et sorties »)."
  - terme: host
    definition: "Propriété des métadonnées `@Component`/`@Directive` qui applique des liaisons de propriété, d'attribut, de classe, de style ou d'écouteurs d'événements directement sur **l'élément hôte** du composant, sans passer par le template."
quiz:
  - question: "Quelle liaison utiliser pour désactiver un bouton « Commander » quand le panier est vide (`panierVide` est un signal booléen) ?"
    choix:
      - "`{{ disabled: panierVide() }}`"
      - "`[disabled]=\"panierVide()\"`"
      - "`(disabled)=\"panierVide()\"`"
      - "`disabled=\"{{ panierVide() }}\"`"
    reponse: 1
    explication: "Le property binding `[disabled]=\"...\"` évalue l'expression TypeScript et l'assigne à la propriété `disabled` de l'élément. `{{ }}` (interpolation) ne fonctionne qu'à l'intérieur de texte, pas pour lier une propriété booléenne directement."
  - question: "Que reçoit la méthode `ajouterAuPanier` dans ce template ?"
    code: |
      <button (click)="ajouterAuPanier(produit, $event)">
        Ajouter au panier
      </button>
    choix:
      - "Seulement l'objet `produit`"
      - "L'objet `produit`, puis l'objet `MouseEvent` du clic"
      - "Uniquement l'objet `MouseEvent`, `produit` est ignoré"
      - "Une erreur de compilation : $event n'est pas défini"
    reponse: 1
    explication: "`$event` est une variable spéciale disponible dans un event binding : elle contient l'objet événement natif (ici un `MouseEvent` de clic). On peut la passer en argument comme n'importe quelle valeur de l'expression."
  - question: "Quelle est la différence entre `[class.actif]=\"estActif\"` et `[attr.data-actif]=\"estActif\"` ?"
    choix:
      - "Aucune, les deux syntaxes sont interchangeables"
      - "La première bascule une classe CSS selon un booléen, la seconde fixe (ou retire) un attribut HTML"
      - "La première ne fonctionne que sur des composants, la seconde uniquement sur des balises natives"
      - "`[attr.x]` est réservée aux attributs `aria-*`"
    reponse: 1
    explication: "`[class.x]` agit sur la liste de classes CSS de l'élément. `[attr.x]` agit sur un attribut HTML : utile pour `data-*`, `aria-*`, ou tout attribut sans propriété DOM correspondante. Une valeur `null`/`undefined` sur `[attr.x]` retire l'attribut."
---

## Essentiel

Le template d'un composant relie l'interface au code TypeScript grâce à quelques syntaxes de liaison.

**Interpolation**, pour afficher une valeur dans du texte :

```html
<h2>{{ produit.nom }}</h2>
<p>{{ produit.prix }} €</p>
```

**Property binding**, pour lier une propriété d'élément à une expression :

```html
<button [disabled]="panierVide()">Commander</button>
<img [src]="produit.imageUrl" [alt]="produit.nom" />
```

**Event binding**, pour réagir à un événement :

```html
<button (click)="ajouterAuPanier(produit)">Ajouter au panier</button>
<input (input)="filtrer($event.target.value)" />
```

Ces trois syntaxes couvrent l'essentiel : afficher du texte, configurer un élément, réagir à une action. Les expressions de template sont des expressions TypeScript **restreintes** : pas d'affectation, pas de nouveaux objets avec `new`, pas d'opérateurs comme `++` — l'expression doit rester un calcul simple, sans effet de bord caché.

Pour les classes et styles conditionnels, des syntaxes dédiées évitent de manipuler des chaînes à la main :

```html
<li [class.epuise]="produit.stock === 0" [style.opacity]="produit.stock === 0 ? 0.5 : 1">
  {{ produit.nom }}
</li>
```

## Détail

### Exemple 1 — Property binding vs attribut

```html
<!-- Property binding : agit sur la propriété DOM -->
<input [value]="rechercheTexte()" />

<!-- Attribute binding : agit sur l'attribut HTML -->
<td [attr.colspan]="nombreColonnes()"></td>
<button [attr.aria-pressed]="estActif()">Filtrer</button>
```

La plupart du temps, `[prop]` suffit : Angular fait correspondre les propriétés DOM usuelles. `[attr.x]` devient nécessaire quand il n'existe pas de propriété JavaScript correspondante (attributs `aria-*`, `data-*`, `colspan`) ou quand on veut retirer complètement l'attribut en liant `null`.

### Exemple 2 — Classes et styles, les trois formes

```html
<!-- Une classe, un booléen -->
<div [class.actif]="produit.estEnPromotion"></div>

<!-- [class] : chaîne, tableau ou objet -->
<div [class]="{ actif: produit.estEnPromotion, epuise: produit.stock === 0 }"></div>

<!-- Une propriété de style -->
<div [style.color]="produit.stock === 0 ? 'grey' : 'black'"></div>

<!-- [style] : objet de propriétés -->
<div [style]="{ color: couleurTexte(), fontWeight: estEnPromotion() ? 'bold' : 'normal' }"></div>
```

### Exemple 3 — Liaison bidirectionnelle avec `model()`

```html
<!-- champ-recherche.html -->
<input [(ngModel)]="texte" />
```

```html
<!-- Utilisation d'un composant qui expose un model() -->
<app-quantite-selecteur [(quantite)]="quantiteChoisie" />
```

La syntaxe `[(prop)]` combine un property binding et un event binding : elle lit la valeur **et** la met à jour en cas de changement. Côté composant, `model()` est l'API à signal recommandée pour exposer ce genre d'entrée/sortie combinée — voir la leçon « Entrées et sorties » du chapitre « Les signaux » pour le détail de son fonctionnement.

### Exemple 4 — La propriété `host`

```ts
@Component({
  selector: 'app-produit-card',
  templateUrl: './produit-card.html',
  host: {
    class: 'carte',
    '[class.epuise]': 'produit().stock === 0',
    '[attr.aria-label]': 'produit().nom',
    '(click)': 'ouvrirFiche()',
  },
})
export class ProduitCard {
  produit = input.required<Produit>();
  ouvrirFiche() { /* ... */ }
}
```

`host` applique des liaisons directement sur l'élément `<app-produit-card>` tel qu'il apparaît dans le template **parent**, sans avoir à envelopper tout le template du composant dans une balise supplémentaire. On y retrouve les mêmes syntaxes que dans un template : `[prop]`, `[class.x]`, `[attr.x]`, `(evt)`.

### Récapitulatif des syntaxes

| Syntaxe | Rôle | Exemple |
|---|---|---|
| `{{ }}` | Interpolation dans du texte | `{{ produit.nom }}` |
| `[prop]` | Property binding | `[disabled]="panierVide()"` |
| `(evt)` | Event binding | `(click)="commander()"` |
| `[(prop)]` | Liaison bidirectionnelle | `[(quantite)]="quantiteChoisie"` |
| `[class.x]` / `[style.x]` | Classe / style conditionnel | `[class.actif]="estActif"` |
| `[attr.x]` | Attribut HTML | `[attr.aria-label]="produit.nom"` |

### Pièges courants

> **Écrire `[value]="texte"` sans event binding et s'attendre à une mise à jour de `texte`.** Un property binding est **à sens unique** : il pousse la valeur du composant vers le DOM, jamais l'inverse. Pour une liaison bidirectionnelle, il faut `[(ngModel)]` (avec `FormsModule`) ou un `model()` côté composant.

> **Utiliser une expression avec effet de bord dans le template**, comme `{{ compteur++ }}` ou `{{ produits.push(nouveau) }}`. Les expressions de template doivent rester des lectures simples : Angular peut les réévaluer plusieurs fois par cycle de détection de changement, un effet de bord y devient imprévisible.

> **Confondre propriété et attribut.** `[disabled]="false"` retire réellement l'état désactivé (propriété DOM), alors que poser l'attribut HTML `disabled=""` (sans les crochets) l'active **quelle que soit sa valeur** — car pour cet attribut booléen, sa simple présence suffit en HTML.

### À retenir

- `{{ }}` pour du texte, `[prop]` pour une propriété, `(evt)` pour un événement.
- `[class.x]` / `[style.x]` pour des classes et styles conditionnels ; `[attr.x]` pour un attribut HTML sans équivalent propriété.
- `[(prop)]` combine lecture et écriture ; `model()` est l'API recommandée côté composant pour l'exposer.
- Les expressions de template restent simples : pas d'affectation ni d'effet de bord.
- `host` applique des liaisons sur l'élément hôte du composant, sans template supplémentaire.
