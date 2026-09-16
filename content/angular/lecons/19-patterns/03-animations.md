---
id: animations
chapitre: patterns-avances
ordre: 3
titre: "Les animations en Angular 21"
termes:
  - terme: "@angular/animations"
    definition: "Ancien module d'animations d'Angular (API `trigger`/`state`/`transition`/`animate` en TypeScript). **Déprécié depuis la version 20.2**, intention de suppression annoncée pour la v23. À ne plus utiliser dans du nouveau code."
  - terme: "animate.enter"
    definition: "Attribut de template qui applique une classe CSS à un élément au moment où il entre dans le DOM (par exemple via `@if` ou `@for`). L'animation associée est une animation ou une transition CSS classique, pas une API Angular séparée."
  - terme: "animate.leave"
    definition: "Attribut de template qui applique une classe CSS à un élément au moment où il doit quitter le DOM. Angular attend la fin de l'animation ou de la transition CSS déclenchée par cette classe avant de retirer l'élément du DOM."
  - terme: "AnimationCallbackEvent"
    definition: "Type de l'événement reçu par un gestionnaire `(animate.leave)`, utilisé quand la sortie de l'élément est pilotée par du JavaScript (ex. Web Animations API) plutôt que par une simple classe CSS. Le code appelant doit invoquer `animationComplete()` pour signaler à Angular que l'élément peut être retiré du DOM."
  - terme: "withViewTransitions()"
    definition: "Fonctionnalité du routeur (`@angular/router`, statut *developer preview* depuis la v19.0) qui exécute l'activation/désactivation de route à l'intérieur de `document.startViewTransition`, pour obtenir une transition visuelle fluide entre deux vues routées."
  - terme: "prefers-reduced-motion"
    definition: "Media query CSS standard du navigateur qui reflète le réglage d'accessibilité système de l'utilisateur (« réduire les animations »). Les animations déclenchées par `animate.enter`/`animate.leave` étant du CSS classique, elles doivent être désactivées ou atténuées dans un bloc `@media (prefers-reduced-motion: reduce)`, comme n'importe quelle animation CSS."
quiz:
  - question: "En Angular 21, quelle affirmation décrit correctement le statut de `@angular/animations` ?"
    choix:
      - "Le module est la solution recommandée pour tout nouveau code d'animation en v21"
      - "Le module est déprécié depuis la v20.2 ; l'équipe Angular recommande le CSS natif (`animate.enter`/`animate.leave`) pour tout nouveau code, avec une intention de suppression annoncée pour la v23"
      - "Le module a déjà été supprimé du framework en v21 et ne compile plus"
      - "Le module reste recommandé pour les animations de liste, et `animate.enter`/`animate.leave` seulement pour les transitions simples"
    reponse: 1
    explication: "`@angular/animations` est déprécié depuis la v20.2 (donc pendant toute la ligne v21), avec une suppression prévue pour la v23 — il reste utilisable en v21, mais l'équipe Angular recommande explicitement le CSS natif via `animate.enter`/`animate.leave` pour tout nouveau code."
  - question: "Que se passe-t-il si un composant essaie d'utiliser à la fois un `trigger()` de `@angular/animations` et un attribut `animate.leave` sur le même composant ?"
    code: |
      @Component({
        selector: 'app-carte-produit',
        animations: [
          trigger('etat', [/* ... */]),
        ],
        template: `<div animate.leave="disparition" [@etat]="etatCourant()">...</div>`,
      })
      export class CarteProduit {}
    choix:
      - "Angular applique les deux systèmes d'animation en parallèle sans problème"
      - "Les deux systèmes d'animation ne sont pas compatibles au sein d'un même composant : ils ne peuvent pas être utilisés ensemble"
      - "`animate.leave` est simplement ignoré si `@angular/animations` est présent dans le même composant"
      - "Seul le `trigger()` legacy est ignoré, `animate.leave` prend systématiquement le dessus"
    reponse: 1
    explication: "La documentation officielle est explicite : les animations historiques (`@angular/animations`) et les animations natives (`animate.enter`/`animate.leave`) ne peuvent pas coexister dans le même composant. Migrer un composant vers le CSS natif implique de retirer entièrement ses `trigger()` legacy, pas de les mélanger."
  - question: "Pour une animation de sortie déclenchée par `animate.leave`, quelles propriétés CSS privilégier pour rester fluide, y compris sur des appareils modestes ?"
    choix:
      - "`width` et `height`, pour un redimensionnement progressif de l'élément"
      - "`transform` et `opacity`, animables par le compositeur du navigateur sans recalcul de la mise en page (layout) à chaque image"
      - "`margin` et `padding`, plus simples à comprendre dans les outils de développement"
      - "Peu importe : le moteur de rendu du navigateur optimise toute propriété CSS animée de la même façon"
    reponse: 1
    explication: "`transform` et `opacity` peuvent être animées par le compositeur graphique sans redéclencher de calcul de mise en page (layout) ni de peinture (paint) à chaque image, contrairement à des propriétés comme `width`, `height`, `margin` ou `top`/`left`, qui forcent un recalcul coûteux de la géométrie de la page à chaque frame."
---

## Essentiel

`@angular/animations` (l'ancienne API `trigger`/`state`/`transition`) est **déprécié depuis la version 20.2**, donc pendant toute la ligne Angular 21, avec une intention de suppression annoncée pour la **v23**. Pour tout nouveau code, l'approche recommandée est le **CSS natif**, piloté par les attributs de template `animate.enter` et `animate.leave` — une fonctionnalité du compilateur Angular, pas un module séparé à importer.

```html
@if (estVisible()) {
  <div animate.enter="entree-douce" animate.leave="sortie-douce">
    Article ajouté au panier
  </div>
}
```

```css
.entree-douce { animation: glisser-fondu 300ms ease-out; }
@keyframes glisser-fondu {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.sortie-douce {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 250ms ease-in, transform 250ms ease-in;
}
```

`animate.enter` applique une classe dès que l'élément entre dans le DOM. `animate.leave` applique une classe puis **attend la fin de l'animation ou de la transition CSS déclenchée** avant de retirer réellement l'élément — pas besoin de temporiser manuellement la suppression.

Points à garder en tête : animer `transform` et `opacity` en priorité (performance), respecter le réglage système `prefers-reduced-motion` comme pour toute animation CSS, et ne jamais mélanger `@angular/animations` et `animate.enter`/`animate.leave` dans un même composant — les deux systèmes ne sont pas compatibles ensemble.

## Détail

### Comment ça marche

`animate.enter`/`animate.leave` ne sont pas un nouveau moteur d'animation Angular : ce sont des attributs de template reconnus par le compilateur, qui appliquent une classe CSS au bon moment du cycle de vie de l'élément. Toute la logique d'animation reste en CSS pur (`@keyframes`, `transition`) — Angular se contente d'orchestrer **quand** la classe est posée, et, pour la sortie, de retarder la suppression du DOM jusqu'à ce que l'animation ou la transition associée à la classe soit terminée. C'est ce qui permet à un élément conditionné par `@if` ou `@for` de rester visible le temps de son animation de sortie, au lieu de disparaître instantanément.

### Exemple 1 — Liste avec animation par élément

```html
@for (article of panier(); track article.id) {
  <li animate.enter="apparition" animate.leave="disparition">
    {{ article.nom }} — {{ article.prix | currency:'EUR' }}
  </li>
}
```

Chaque élément produit par `@for` est un nœud DOM distinct : `animate.enter`/`animate.leave` s'appliquent individuellement à chaque instance, sans configuration supplémentaire pour une liste — ajouter ou retirer un article du panier anime uniquement l'élément concerné.

### Exemple 2 — Liaison dynamique de la classe

```html
<div [animate.enter]="classeEntree()" [animate.leave]="classeSortie()">
  {{ notification().message }}
</div>
```

```ts
classeEntree = computed(() => (this.notification().type === 'erreur' ? 'entree-erreur' : 'entree-succes'));
```

La classe appliquée peut dépendre d'un signal, utile quand l'animation doit varier selon le contexte (type de notification, sens de navigation…).

### Exemple 3 — Sortie pilotée par JavaScript

```html
<div (animate.leave)="animerSortie($event)">Contenu</div>
```

```ts
animerSortie(event: AnimationCallbackEvent) {
  const anim = event.target.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 200 },
  );
  anim.finished.then(() => event.animationComplete());
}
```

Pour un cas qui ne se prête pas à une simple classe CSS (séquence pilotée par la Web Animations API, calcul dynamique), `(animate.leave)` fournit l'événement `AnimationCallbackEvent` ; l'élément n'est retiré du DOM qu'après l'appel explicite à `animationComplete()`.

### Exemple 4 — Transition de vue au changement de route

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
  ],
};
```

`withViewTransitions()` (statut *developer preview* depuis la v19.0) exécute l'activation/désactivation des composants routés à l'intérieur de `document.startViewTransition`, ce qui délègue la transition visuelle entre deux pages au navigateur. Si le navigateur ne supporte pas la View Transitions API, le routeur poursuit la navigation normalement, sans transition.

### Respecter `prefers-reduced-motion`

```css
.entree-douce { animation: glisser-fondu 300ms ease-out; }

@media (prefers-reduced-motion: reduce) {
  .entree-douce { animation: none; }
}
```

`animate.enter`/`animate.leave` s'appuyant entièrement sur du CSS standard, la bonne pratique d'accessibilité habituelle s'applique sans particularité Angular : envelopper les animations non essentielles dans `@media (prefers-reduced-motion: reduce)`.

### `@angular/animations` contre le CSS natif

| | `@angular/animations` (déprécié) | `animate.enter` / `animate.leave` |
|---|---|---|
| Statut en v21 | Déprécié depuis v20.2, suppression prévue v23 | Recommandé pour tout nouveau code |
| Où vit la logique | TypeScript (`trigger`, `state`, `transition`) | CSS (`@keyframes`, `transition`) |
| Dépendance | Module `@angular/animations` à importer | Aucune, natif au compilateur de templates |
| Séquences complexes (orchestration, stagger) | Prise en charge riche en TypeScript | À recomposer en CSS, ou piloter en JS via `(animate.leave)` |
| Coexistence | — | Incompatibles dans un même composant |

### Pièges courants

> **Mélanger `@angular/animations` et `animate.enter`/`animate.leave` dans le même composant.** Les deux systèmes ne sont pas compatibles ensemble : migrer un composant signifie retirer entièrement ses `trigger()` existants, pas les combiner.

> **Animer des propriétés coûteuses en mise en page** (`width`, `height`, `top`, `margin`) plutôt que `transform` et `opacity`. Sur une liste qui anime plusieurs éléments à la fois (ajout au panier, filtrage), ça peut suffire à faire chuter la fluidité perçue, en particulier sur mobile.

> **Ignorer `prefers-reduced-motion`.** Comme il s'agit de CSS standard, rien dans Angular ne désactive automatiquement une animation pour les utilisateurs ayant demandé de réduire les animations au niveau système — c'est une responsabilité explicite du CSS écrit.

### À retenir

- `@angular/animations` est déprécié depuis la v20.2 (suppression prévue v23) : ne plus l'utiliser pour du nouveau code.
- `animate.enter`/`animate.leave` pilotent des classes CSS classiques (`@keyframes`, `transition`) au bon moment du cycle de vie de l'élément — ce n'est pas une nouvelle API TypeScript à apprendre.
- `animate.leave` retarde la suppression réelle du DOM jusqu'à la fin de l'animation/transition CSS déclenchée.
- `withViewTransitions()` (developer preview) délègue les transitions entre routes à la View Transitions API du navigateur, avec repli silencieux si non supportée.
- Animer `transform`/`opacity` en priorité, et respecter `prefers-reduced-motion` comme pour toute animation CSS.
