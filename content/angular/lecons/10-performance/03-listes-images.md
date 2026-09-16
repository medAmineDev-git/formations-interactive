---
id: listes-images
chapitre: performance
ordre: 3
titre: "Listes et images performantes"
termes:
  - terme: "track"
    definition: "Expression obligatoire de `@for`, qui indique à Angular comment **identifier** chaque élément d'une liste d'un rendu à l'autre (en général une propriété stable comme un identifiant). Sans une bonne clé, Angular ne peut pas distinguer un élément déplacé d'un élément recréé."
  - terme: "Défilement virtuel (virtual scrolling)"
    definition: "Technique qui ne rend dans le DOM que les éléments actuellement visibles (plus une petite marge), même si la liste sous-jacente contient des milliers d'éléments. Fournie par `CdkVirtualScrollViewport` du module `@angular/cdk/scrolling`."
  - terme: "NgOptimizedImage"
    definition: "Directive (`ngSrc`) de `@angular/common` qui applique automatiquement de bonnes pratiques de chargement d'image : dimensions explicites obligatoires, attribut `loading` géré selon `priority`, avertissements en développement si une image mal configurée risque de dégrader les performances."
  - terme: "priority"
    definition: "Attribut booléen de `NgOptimizedImage` à poser sur l'image la plus importante visuellement de la page (typiquement l'image la plus grande visible sans défiler) : elle est chargée en priorité, sans `loading=\"lazy\"`, pour améliorer le LCP."
  - terme: "placeholder (NgOptimizedImage)"
    definition: "Attribut de `NgOptimizedImage` qui affiche une version floutée ou une couleur de fond en attendant le chargement de l'image réelle, pour limiter le décalage visuel perçu par l'utilisateur."
  - terme: "Chargement différé natif des images"
    definition: "Attribut HTML standard `loading=\"lazy\"` (géré automatiquement par `NgOptimizedImage` pour toute image sans `priority`) qui retarde le chargement d'une image jusqu'à son approche de la zone visible, sans code JavaScript supplémentaire."
quiz:
  - question: "Que se passe-t-il si `track` est omis dans ce bloc ?"
    code: |
      @for (produit of produits(); track produit) {
        <app-carte-produit [produit]="produit" />
      }
    choix:
      - "Le code compile normalement, `track` est une option facultative de style"
      - "Angular refuse de compiler le template : `track` est obligatoire dans `@for`"
      - "La liste s'affiche mais sans aucune animation possible"
      - "Seul le premier élément de la liste s'affiche"
    reponse: 1
    explication: "`track` est **obligatoire** dans `@for` (contrairement à l'ancien `*ngFor`, où `trackBy` était optionnel). Ici, `track produit` suit l'objet entier par référence — acceptable si la liste est reconstruite à chaque fois, mais `track produit.id` est presque toujours préférable dès que les objets peuvent être recréés sans changer d'identité métier."
  - question: "Une liste de 5 000 lignes de commande s'affiche avec un simple `@for` dans une page qui défile. Quel est le principal problème de performance ?"
    choix:
      - "Angular refuse d'afficher plus de 1 000 éléments avec `@for`"
      - "Les 5 000 éléments sont tous présents dans le DOM en même temps, même si seule une poignée est visible à l'écran, ce qui alourdit le rendu initial et le défilement"
      - "`@for` ne fonctionne qu'avec des tableaux de moins de 100 éléments"
      - "Le problème vient uniquement de l'absence de `track`, qui doit forcément être corrigée en premier"
    reponse: 1
    explication: "Un `@for` classique rend tous les éléments dans le DOM, visibles ou non. Pour une très longue liste, le défilement virtuel (`CdkVirtualScrollViewport` de `@angular/cdk/scrolling`) ne rend que les éléments visibles à l'écran plus une marge, quelle que soit la taille réelle de la liste — c'est la solution adaptée ici, indépendamment de la présence ou non de `track`."
  - question: "Pourquoi `NgOptimizedImage` exige-t-il des dimensions (`width`/`height`, ou `fill`) sur chaque image ?"
    choix:
      - "Pour des raisons purement esthétiques, sans effet mesurable sur les performances"
      - "Pour réserver l'espace occupé par l'image avant son chargement, et éviter un décalage de mise en page (CLS) quand elle apparaît"
      - "Parce que le navigateur ne peut pas afficher une image sans dimensions explicites"
      - "Pour forcer le chargement de l'image en priorité, quel que soit l'attribut `priority`"
    reponse: 1
    explication: "Sans dimensions connues à l'avance, le navigateur ne réserve aucun espace pour l'image : le reste du contenu se décale visuellement dès qu'elle finit de charger, ce qui dégrade le Cumulative Layout Shift (CLS). En exigeant des dimensions explicites (ou l'option `fill` avec un conteneur positionné), `NgOptimizedImage` élimine cette classe entière de problème à la compilation."
---

## Essentiel

Deux leviers courants pour des interfaces qui restent fluides avec beaucoup de contenu : bien identifier les éléments d'une liste, et bien charger les images.

`@for` impose une expression `track`, qui indique à Angular comment reconnaître un élément d'un rendu à l'autre :

```html
@for (produit of produits(); track produit.id) {
  <app-carte-produit [produit]="produit" />
}
```

Avec un bon `track` (un identifiant stable), Angular **réordonne** les éléments DOM existants au lieu de les détruire et recréer quand la liste change d'ordre ou de contenu — plus rapide, et ça préserve l'état interne (focus, animations en cours) de chaque élément.

Pour une liste de **plusieurs centaines ou milliers** d'éléments, même un `@for` bien configuré rend tout le monde dans le DOM. Le **défilement virtuel** (`@angular/cdk/scrolling`) ne rend que les éléments visibles à l'écran :

```html
<cdk-virtual-scroll-viewport itemSize="72" class="viewport">
  <app-carte-produit *cdkVirtualFor="let produit of produits(); trackBy: trackParId" [produit]="produit" />
</cdk-virtual-scroll-viewport>
```

Pour les images, `NgOptimizedImage` (`ngSrc` à la place de `src`) impose des dimensions explicites, gère le chargement différé natif automatiquement, et propose `priority` pour l'image la plus importante visuellement de la page :

```html
<img ngSrc="produits/clavier.jpg" width="400" height="300" priority />
```

Enfin, un calcul coûteux (tri, filtre, agrégation) ne doit jamais être appelé directement dans un template : mieux vaut un `computed()`, mémorisé, que Angular ne recalcule que si une dépendance a réellement changé.

## Détail

### Comment ça marche

Sans clé de suivi fiable, Angular ne peut comparer une liste à l'autre qu'en supposant que la position correspond à l'identité — ce qui, dès qu'un élément est ajouté au milieu, trié différemment, ou filtré, force la destruction et recréation d'un grand nombre d'éléments DOM. Avec `track produit.id`, Angular suit chaque objet par son identifiant métier, même s'il change de position : il **déplace** le nœud DOM existant plutôt que de le recréer.

Le défilement virtuel applique une idée différente : il ne s'agit plus d'optimiser le suivi des éléments, mais de réduire le **nombre** d'éléments réellement présents dans le DOM à un instant donné, en ne matérialisant que ceux visibles dans la fenêtre de défilement (plus une petite marge de chaque côté), et en recyclant les nœuds DOM au fur et à mesure du défilement.

### Exemple 1 — `track` avec un identifiant contre `track` sur l'objet entier

```ts
interface Produit {
  id: number;
  nom: string;
  prix: number;
}

produits = signal<Produit[]>([...]);
```

```html
<!-- Préférable : suit l'identité métier -->
@for (produit of produits(); track produit.id) {
  <app-carte-produit [produit]="produit" />
}

<!-- Fonctionne, mais moins robuste si la liste est régénérée -->
@for (produit of produits(); track produit) {
  <app-carte-produit [produit]="produit" />
}
```

`track produit` fonctionne tant que les objets ne sont jamais recréés (même référence conservée), mais dès qu'une liste est reconstruite (résultat d'un nouveau filtre, d'une nouvelle requête HTTP), les objets ont de nouvelles références même si leur contenu métier est identique : `track produit.id` reste stable dans ce cas, pas `track produit`.

### Exemple 2 — Défilement virtuel pour un catalogue de plusieurs milliers de produits

```ts
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-catalogue',
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="96" class="catalogue-viewport">
      <app-carte-produit
        *cdkVirtualFor="let produit of produits(); trackBy: trackParId"
        [produit]="produit"
      />
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`.catalogue-viewport { height: 600px; }`],
})
export class Catalogue {
  produits = signal<Produit[]>(genererMilliersDeProduits());

  trackParId(index: number, produit: Produit) {
    return produit.id;
  }
}
```

`itemSize` indique la hauteur (en pixels) d'un élément, pour qu'Angular CDK puisse calculer quelle portion de la liste rendre à un instant donné. Le viewport doit avoir une hauteur définie (ici via `styles`) : c'est lui qui délimite la zone de défilement.

### Exemple 3 — Image principale contre image secondaire

```html
<!-- Image principale de la fiche produit, visible sans défiler : priorité -->
<img ngSrc="produits/casque-audio.jpg" width="600" height="450" priority />

<!-- Images de produits similaires, plus bas dans la page : différées automatiquement -->
@for (suggestion of suggestions(); track suggestion.id) {
  <img [ngSrc]="suggestion.image" width="150" height="150" />
}
```

Seule l'image la plus importante visuellement (souvent l'image principale, au-dessus de la ligne de flottaison) doit porter `priority` : elle est chargée sans attendre, ce qui aide le LCP. Les autres bénéficient automatiquement du chargement différé natif (`loading="lazy"`), géré par `NgOptimizedImage` sans configuration supplémentaire.

### Exemple 4 — Éviter un recalcul coûteux dans le template

```ts
// À éviter : recalculé à chaque cycle de détection de changements
// template : <p>Total : {{ calculerTotal() }}</p>
calculerTotal() {
  return this.lignes().reduce((somme, l) => somme + l.prix * l.quantite, 0);
}

// Préférable : mémorisé, recalculé seulement si `lignes` change
total = computed(() =>
  this.lignes().reduce((somme, l) => somme + l.prix * l.quantite, 0),
);
```

Une méthode appelée directement depuis un template s'exécute à chaque vérification du composant, même si rien n'a changé. Un `computed()` équivalent ne recalcule qu'au moment d'une lecture suivant un vrai changement de dépendance.

### Suivi de liste contre défilement virtuel contre pagination serveur

| | Corrige | Ne résout pas |
|---|---|---|
| `track` bien choisi | Le coût de **mise à jour** du DOM quand la liste change | Le nombre d'éléments présents dans le DOM |
| Défilement virtuel | Le nombre d'éléments **présents dans le DOM** à un instant donné | Le volume de données transféré depuis le serveur |
| Pagination côté serveur | Le volume de **données chargées** (réseau, mémoire) | Rien de plus si la page courante reste très longue |

En pratique, ces trois techniques se combinent souvent : pagination pour limiter les données transférées, défilement virtuel si une « page » reste néanmoins longue, et un `track` correct dans tous les cas.

### Pièges courants

> **Utiliser l'index comme clé de `track`.** `track $index` fonctionne, mais réintroduit le problème que `track` est censé résoudre : si un élément est inséré au milieu de la liste, tous les indices suivants changent, et Angular re-associe les mauvais éléments DOM aux mauvaises données. Préférer un identifiant métier stable.

> **Charger une image sans dimensions ni `priority`, en pensant que `NgOptimizedImage` s'en occupe seule.** La directive impose les dimensions (erreur au démarrage sinon), mais ne devine pas quelle image est la plus importante visuellement : oublier `priority` sur l'image principale peut dégrader le LCP autant qu'une image non optimisée.

> **Défilement virtuel avec une hauteur d'élément variable non déclarée.** `CdkVirtualScrollViewport` calcule sa fenêtre de rendu à partir d'`itemSize` : des éléments de hauteurs très différentes (ex. cartes produit avec ou sans promotion) sans stratégie adaptée produisent un défilement saccadé ou des espaces incorrects.

### À retenir

- `track` est obligatoire dans `@for` : préférer un identifiant métier stable (`produit.id`) à l'objet entier ou à l'index.
- Le défilement virtuel (`@angular/cdk/scrolling`) réduit le nombre d'éléments réellement présents dans le DOM pour les listes longues, indépendamment du suivi par `track`.
- `NgOptimizedImage` (`ngSrc`) impose des dimensions explicites (évite le CLS), gère le chargement différé natif par défaut, et expose `priority` pour l'image la plus importante de la page.
- `placeholder` limite le décalage visuel perçu pendant le chargement d'une image.
- Un calcul coûteux référencé dans un template doit passer par un `computed()` mémorisé plutôt qu'une méthode recalculée à chaque vérification.
</content>
