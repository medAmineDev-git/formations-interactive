---
id: defer
chapitre: performance
ordre: 2
titre: "Différer le rendu avec @defer"
termes:
  - terme: "@defer"
    definition: "Bloc de contrôle de flux qui découpe le contenu qu'il contient dans un **chunk JavaScript séparé**, téléchargé et rendu seulement quand un déclencheur se produit, au lieu de faire partie du rendu initial du composant."
  - terme: "@placeholder"
    definition: "Bloc affiché **avant** que le déclencheur du `@defer` ne se produise. Optionnel mais fortement recommandé : sans lui, l'emplacement reste simplement vide, ce qui peut provoquer un décalage de mise en page à l'arrivée du contenu."
  - terme: "@loading"
    definition: "Bloc affiché **pendant** le téléchargement du chunk différé, une fois le déclencheur activé mais avant que le contenu ne soit prêt. Accepte les paramètres `minimum` (durée d'affichage minimale, évite un flash) et `after` (délai avant de l'afficher)."
  - terme: "@error"
    definition: "Bloc affiché si le chargement du chunk différé échoue (ex. coupure réseau). Sans lui, un échec de chargement laisse simplement le `@placeholder` affiché."
  - terme: "Déclencheur (on ...)"
    definition: "Condition qui déclenche le passage du `@placeholder` au chargement : `on idle` (navigateur inactif, par défaut), `on viewport` (élément visible à l'écran), `on interaction` (clic ou touche sur un élément), `on hover` (survol), `on timer(duree)`, ou `when expression` (condition personnalisée basée sur un signal ou une autre expression)."
  - terme: prefetch
    definition: "Mot-clé combinable à un déclencheur (`@defer (on interaction; prefetch on idle)`) pour télécharger le chunk **en avance**, avant même que le déclencheur d'affichage ne se produise, tout en retardant son rendu jusqu'à ce déclencheur."
quiz:
  - question: "Quel est l'effet de ce bloc sur le bundle initial de la page ?"
    code: |
      @defer (on viewport) {
        <app-graphique-ventes [donnees]="ventes()" />
      } @placeholder {
        <div class="zone-graphique">Graphique des ventes</div>
      } @loading (minimum 300ms) {
        <app-spinner />
      }
    choix:
      - "Aucun effet : `@defer` change seulement le moment du rendu, pas le contenu du bundle"
      - "`AppGraphiqueVentes` (et ses dépendances propres) sont extraits dans un chunk séparé, absent du bundle initial, téléchargé seulement quand l'élément devient visible à l'écran"
      - "Le bundle initial grossit, car Angular ajoute le code de gestion des trois états (placeholder, loading, error)"
      - "`on viewport` charge le graphique dès le démarrage de l'application, avant même qu'il soit visible"
    reponse: 1
    explication: "`@defer` découpe son contenu en un chunk JavaScript séparé, exactement comme `loadComponent` pour une route mais à l'échelle d'un fragment de template. `on viewport` retarde le déclenchement jusqu'à ce que l'élément entre dans la zone visible, généralement via un `IntersectionObserver` : idéal pour un graphique coûteux plus bas dans la page, qu'un visiteur ne verra peut-être jamais."
  - question: "Un bloc `@defer (on idle)` n'a pas de `@placeholder`. Que se passe-t-il à l'affichage initial de la page ?"
    choix:
      - "Angular refuse de compiler le template : `@placeholder` est obligatoire"
      - "L'emplacement du bloc est simplement vide (aucun élément rendu) tant que le navigateur n'est pas devenu inactif"
      - "Le contenu du `@defer` s'affiche immédiatement, comme sans `@defer`"
      - "Un message d'erreur générique s'affiche à la place du contenu"
    reponse: 1
    explication: "`@placeholder` est optionnel : sans lui, rien n'est rendu à cet emplacement avant le déclencheur. C'est rarement souhaitable en pratique — un espace vide qui se remplit brutalement dès que le navigateur devient inactif produit un décalage de mise en page désagréable, d'où la recommandation de toujours fournir un `@placeholder`, même minimal."
  - question: "Quelle est la différence entre le chargement différé des routes (`loadComponent`) et `@defer` ?"
    choix:
      - "Aucune : les deux sont deux syntaxes pour la même fonctionnalité"
      - "`loadComponent` diffère une route entière au moment de la navigation ; `@defer` diffère un fragment de template à l'intérieur d'une page déjà affichée, selon un déclencheur choisi (visibilité, interaction, minuteur…)"
      - "`@defer` ne fonctionne qu'avec des composants qui n'ont aucune entrée (`input()`)"
      - "`loadComponent` s'utilise dans un template, `@defer` se configure dans les routes"
    reponse: 1
    explication: "Les deux mécanismes créent des chunks séparés, mais à des granularités différentes : une route entière pour `loadComponent`/`loadChildren`, un fragment de template pour `@defer`. On peut très bien avoir les deux dans la même application : une route chargée à la navigation, contenant elle-même un bloc `@defer` pour un widget secondaire de cette page."
---

## Essentiel

`@defer` découpe une partie d'un template dans un **chunk séparé**, téléchargé et rendu seulement quand un déclencheur se produit — pas au chargement du composant qui le contient. Le déclencheur par défaut est `on idle` (dès que le navigateur est inactif).

```html
@defer (on viewport) {
  <app-avis-clients [produitId]="produit().id" />
} @placeholder {
  <div class="zone-avis">Avis clients</div>
} @loading (minimum 200ms) {
  <app-spinner />
} @error {
  <p>Impossible de charger les avis.</p>
}
```

Quatre blocs possibles : le contenu principal (obligatoire), `@placeholder` (avant le déclencheur), `@loading` (pendant le téléchargement) et `@error` (si le chargement échoue). Seul le contenu principal est obligatoire, mais un `@placeholder` est fortement recommandé pour éviter un trou vide dans la page.

Déclencheurs courants : `on idle`, `on viewport` (visible à l'écran), `on interaction` (clic), `on hover`, `on timer(2s)`, ou `when uneCondition()` pour une condition personnalisée. `prefetch` permet de télécharger le chunk en avance tout en retardant son affichage :

```html
@defer (on interaction; prefetch on idle) {
  <app-panneau-filtres />
} @placeholder {
  <button>Filtrer les résultats</button>
}
```

Effet réel : le code du bloc différé (et ses dépendances propres, si elles ne sont utilisées nulle part ailleurs dans le bundle initial) sort du bundle principal, ce qui réduit le temps de premier affichage — particulièrement utile pour du contenu lourd et non prioritaire (graphiques, cartes, widgets sociaux, commentaires).

## Détail

### Pourquoi c'est utile

Une page peut contenir du contenu essentiel (fiche produit, prix, bouton d'achat) et du contenu secondaire, souvent plus coûteux (un graphique de tendance des prix, une carte de disponibilité en magasin, un fil de commentaires). Sans `@defer`, tout ce code fait partie du même rendu initial. `@defer` permet de prioriser : le contenu essentiel s'affiche immédiatement, le reste arrive dès qu'il devient pertinent (visible, survolé, demandé par un clic).

### Exemple 1 — Un bloc de commentaires différé jusqu'à la visibilité

```html
@defer (on viewport) {
  <app-commentaires [articleId]="article().id" />
} @placeholder (minimum 100ms) {
  <div class="placeholder-commentaires">Commentaires</div>
}
```

Le composant `Commentaires`, souvent volumineux (formulaire, pagination, tri), ne se charge que lorsque l'utilisateur fait défiler la page jusqu'à cette section — la majorité des visiteurs qui ne descendent pas jusque-là ne le téléchargent jamais.

### Exemple 2 — Un graphique lourd déclenché par une action utilisateur

```html
@defer (on interaction) {
  <app-graphique-avance [donnees]="statistiques()" />
} @placeholder {
  <button>Voir les statistiques détaillées</button>
} @loading (minimum 300ms; after 100ms) {
  <app-spinner />
}
```

Sans référence explicite, c'est le `@placeholder` lui-même qui sert d'élément déclencheur (il doit alors avoir un seul élément racine, ici le `<button>`). Une librairie de graphiques peut peser plusieurs centaines de kilo-octets : la différer jusqu'au clic explicite de l'utilisateur évite de la télécharger pour les visiteurs qui ne consultent jamais le détail. `after 100ms` évite d'afficher le spinner pour un chargement quasi instantané ; `minimum 300ms` évite qu'il ne clignote s'il apparaît malgré tout.

### Exemple 3 — Combiner un déclencheur et `prefetch`

```html
@defer (on interaction; prefetch on idle) {
  <app-widget-carte [adresse]="magasin().adresse" />
} @placeholder {
  <div class="placeholder-carte">Cliquer pour afficher la carte</div>
}
```

Le chunk de la carte est **téléchargé** dès que le navigateur est inactif (`prefetch on idle`), donc probablement déjà en cache au moment où l'utilisateur clique, mais il ne **s'affiche** qu'au clic (`on interaction`). Ce couple prefetch/déclencheur réduit le bundle initial sans introduire de latence perceptible à l'usage.

### Exemple 4 — Condition personnalisée avec `when`

```html
@defer (when utilisateurConnecte()) {
  <app-recommandations-personnalisees />
} @placeholder {
  <app-recommandations-generiques />
}
```

`when` accepte n'importe quelle expression de template, ici un signal. Dès que `utilisateurConnecte()` devient vrai, le bloc se déclenche — utile pour du contenu qui dépend d'un état applicatif plutôt que d'une interaction directe avec l'élément.

### Différence avec le chargement différé des routes

| | `loadComponent` / `loadChildren` | `@defer` |
|---|---|---|
| Granularité | Une route entière | Un fragment de template |
| Déclencheur | La navigation | `on idle`, `on viewport`, `on interaction`, `when`… |
| Contenu intermédiaire | Rien de spécifique (le routeur gère l'affichage) | `@placeholder`, `@loading`, `@error` intégrés |
| Où l'utiliser | Découper l'application par fonctionnalité | Alléger une page déjà chargée d'un fragment secondaire |

Ces deux mécanismes se combinent : une route chargée en `loadComponent` peut elle-même contenir des blocs `@defer` pour ses parties les moins prioritaires. Le détail du chargement différé des routes est couvert dans le chapitre routage, leçon « Chargement différé des routes ».

### Pièges courants

> **Différer du contenu au-dessus de la ligne de flottaison.** `@defer` est pensé pour du contenu secondaire ou hors écran. Différer un élément visible dès le chargement (ex. le titre principal d'une page) dégrade l'expérience au lieu de l'améliorer : l'utilisateur voit un `@placeholder` puis un changement brusque, ce qui peut aussi nuire au LCP (Largest Contentful Paint).

> **Oublier `@placeholder` et provoquer un décalage de mise en page.** Sans dimensions réservées, l'arrivée du contenu différé pousse le reste de la page (CLS, Cumulative Layout Shift). Donner au `@placeholder` une taille proche du contenu final limite ce décalage.

> **Différer un composant encore importé statiquement ailleurs.** Comme pour `loadComponent`, si le composant ciblé par `@defer` est aussi importé de façon statique ailleurs dans le même fichier ou un fichier qu'il inclut, le bundler peut l'inclure malgré tout dans le chunk principal. Vérifier la sortie de `ng build` reste le seul moyen fiable de confirmer le découpage.

### À retenir

- `@defer` isole un fragment de template dans un chunk séparé, chargé selon un déclencheur (`on idle` par défaut, `on viewport`, `on interaction`, `on hover`, `on timer`, `when`).
- `@placeholder`, `@loading` et `@error` couvrent respectivement l'état avant, pendant et en cas d'échec du chargement ; seul le contenu principal est obligatoire, mais `@placeholder` est fortement recommandé.
- `prefetch` télécharge le chunk en avance sans en avancer l'affichage, pour combiner bundle initial léger et affichage rapide au déclenchement.
- `@defer` diffère un fragment de template dans une page déjà chargée ; `loadComponent`/`loadChildren` diffère une route entière — les deux se combinent.
- Réserver `@defer` au contenu secondaire ou hors écran, avec un `@placeholder` dimensionné, pour éviter de dégrader le LCP et le CLS.
</content>
