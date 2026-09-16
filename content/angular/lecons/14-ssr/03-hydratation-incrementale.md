---
id: hydratation-incrementale
chapitre: ssr
ordre: 3
titre: "Hydratation incrémentale"
termes:
  - terme: Hydratation incrémentale
    definition: "Variante de l'hydratation (leçon précédente) qui n'hydrate **pas** toute la page d'un coup au démarrage, mais bloc par bloc, chacun selon son propre déclencheur (`@defer (hydrate on ...)`). Un bloc non encore hydraté reste affiché tel quel (HTML statique) mais n'est pas interactif."
  - terme: "withIncrementalHydration()"
    definition: "Fonctionnalité à ajouter à `provideClientHydration()` pour activer l'hydratation incrémentale dans l'application : `provideClientHydration(withIncrementalHydration())`. Active automatiquement le rejeu d'événements pour les blocs concernés."
  - terme: "@defer (hydrate on ...)"
    definition: "Syntaxe qui ajoute un déclencheur d'**hydratation** à un bloc `@defer`, séparé par un point-virgule du déclencheur de chargement classique : `@defer (on viewport; hydrate on interaction) { ... }`. Le déclencheur d'hydratation s'applique au premier rendu (issu du SSR) ; le déclencheur classique reprend la main pour tout rendu client ultérieur."
  - terme: "hydrate on interaction / hover / viewport / idle / timer"
    definition: "Déclencheurs d'hydratation disponibles : au clic ou à la frappe (`interaction`), au survol (`hover`), à l'entrée dans le viewport (`viewport`), quand le navigateur est inactif (`idle`), après un délai (`timer(500ms)`), ou selon une condition personnalisée (`when`)."
  - terme: "hydrate never"
    definition: "Déclencheur qui maintient un bloc **indéfiniment déshydraté** : son HTML reste affiché tel quel, sans jamais devenir interactif côté client. Utile pour un contenu purement informatif qui n'a besoin d'aucune interactivité."
  - terme: "TTI (Time to Interactive)"
    definition: "Indicateur de performance qui mesure le temps avant qu'une page devienne pleinement réactive aux interactions utilisateur. L'hydratation incrémentale vise à réduire ce délai en évitant d'hydrater immédiatement des blocs peu prioritaires."
quiz:
  - question: "Sur une page produit, la description longue tout en bas de page utilise `@defer (on viewport; hydrate on viewport)`. Que se passe-t-il au chargement initial, avant que l'utilisateur ne fasse défiler la page jusqu'à ce bloc ?"
    code: |
      @defer (on viewport; hydrate on viewport) {
        <app-description-longue [texte]="produit().description" />
      } @placeholder {
        <div>Chargement de la description…</div>
      }
    choix:
      - "Le bloc est absent du HTML tant que l'utilisateur n'a pas atteint le viewport"
      - "Le HTML rendu côté serveur pour ce bloc est affiché tel quel (donc visible et lisible), mais il n'est pas encore hydraté : aucune interaction n'y fonctionne avant que le bloc n'entre dans le viewport"
      - "Le bloc est immédiatement et entièrement hydraté dès le chargement de la page, `hydrate on viewport` n'ayant d'effet que côté client pur"
      - "Une erreur `NG0500` est levée tant que le viewport n'a pas atteint le bloc"
    reponse: 1
    explication: "Le point clé de l'hydratation incrémentale : le contenu SSR d'un bloc `@defer (hydrate on ...)` reste affiché immédiatement (lisible, indexable), mais il n'est **hydraté** — donc interactif — qu'au déclenchement choisi. Ici, tant que le bloc n'entre pas dans le viewport, la description est visible mais aucun événement Angular n'y est encore actif."
  - question: "Pourquoi préférer l'hydratation incrémentale à une hydratation complète sur une page riche en widgets secondaires (avis clients, produits recommandés, chat d'assistance) ?"
    choix:
      - "Elle réduit le poids du HTML envoyé par le serveur"
      - "Elle évite d'hydrater immédiatement des blocs peu prioritaires au premier affichage, ce qui réduit le travail JavaScript exécuté au démarrage et améliore le temps avant interactivité (TTI) des blocs réellement prioritaires"
      - "Elle supprime totalement le besoin de SSR pour ces blocs"
      - "Elle remplace `@defer` classique, qui devient inutile une fois l'hydratation incrémentale activée"
    reponse: 1
    explication: "Une hydratation complète attache tous les gestionnaires d'événements de toute la page dès le démarrage, y compris pour des widgets secondaires que l'utilisateur ne verra peut-être jamais. L'hydratation incrémentale reporte ce travail selon un déclencheur par bloc, ce qui concentre le travail JavaScript initial sur l'essentiel de la page et améliore le temps avant interactivité perçu."
  - question: "Comment activer l'hydratation incrémentale dans la configuration de l'application ?"
    choix:
      - "`provideClientHydration(withIncrementalHydration())`"
      - "Elle est activée par défaut dès que `provideServerRendering()` est présent"
      - "`provideRouter(routes, withIncrementalHydration())`"
      - "Il suffit d'ajouter `hydrate on ...` à un `@defer` sans rien changer à la configuration des providers"
    reponse: 0
    explication: "`withIncrementalHydration()` s'ajoute à `provideClientHydration()`, comme `withEventReplay()`. Sans cette fonctionnalité activée, les déclencheurs `hydrate on ...` d'un `@defer` n'ont pas d'effet : l'application retombe sur une hydratation complète classique."
---

## Essentiel

L'hydratation (leçon précédente) réutilise le DOM du SSR au lieu de le recréer, mais elle le fait **d'un coup**, pour toute la page, au démarrage. Sur une page riche en widgets secondaires (avis clients, produits recommandés, chat d'assistance…), ce travail d'hydratation complète — attacher tous les gestionnaires d'événements, reconstruire tout l'état interne — peut retarder inutilement le moment où l'essentiel de la page devient réellement interactif.

L'**hydratation incrémentale** répartit ce travail bloc par bloc, en réutilisant la syntaxe `@defer` déjà connue pour le chargement paresseux de sous-arbres, en lui ajoutant un déclencheur d'**hydratation** séparé par un point-virgule :

```html
@defer (on viewport; hydrate on interaction) {
  <app-avis-clients [produitId]="produit().id" />
} @placeholder {
  <div>Avis clients</div>
}
```

Le contenu de ce bloc est présent dans le HTML dès le rendu serveur (visible, lisible, indexable), mais il ne devient **interactif** qu'au premier clic ou frappe dans la zone — avant cela, aucun gestionnaire d'événement Angular n'y est actif.

Activation dans la configuration de l'application :

```ts
import { provideClientHydration, withIncrementalHydration } from '@angular/platform-browser';

bootstrapApplication(App, {
  providers: [provideClientHydration(withIncrementalHydration())],
});
```

Déclencheurs d'hydratation disponibles : `hydrate on interaction`, `hydrate on hover`, `hydrate on viewport`, `hydrate on idle`, `hydrate on timer(500ms)`, `hydrate when condition`, et `hydrate never` (le bloc ne devient jamais interactif).

## Détail

### Le problème résolu

Une page de fiche produit typique combine un contenu prioritaire (photo, prix, bouton « Ajouter au panier ») et des blocs secondaires plus bas dans la page (avis clients, produits recommandés, widget de chat). Avec une hydratation complète, Angular attache les gestionnaires d'événements de **tous** ces blocs dès le démarrage — y compris pour un widget que l'utilisateur ne fera peut-être jamais défiler jusqu'à voir. Ce travail JavaScript supplémentaire retarde le moment où la page entière (y compris sa partie prioritaire) est considérée comme stable et réactive.

L'hydratation incrémentale reporte l'hydratation de chaque bloc secondaire à un déclencheur pertinent : `hydrate on viewport` pour un bloc qui n'a besoin d'interactivité qu'une fois visible, `hydrate on interaction` pour un widget qui ne réagit qu'au clic, `hydrate never` pour un contenu purement informatif sans aucune interactivité prévue.

### Exemple 1 — Combiner déclencheur de chargement et déclencheur d'hydratation

```html
@defer (on idle; hydrate on interaction) {
  <app-widget-avis [produitId]="produit().id" />
} @placeholder {
  <div>Chargement des avis…</div>
}
```

Les deux déclencheurs répondent à des questions différentes. `on idle` (déclencheur `@defer` classique) répond à « quand le code de ce bloc doit-il être **chargé** côté client si ce n'était pas déjà fait par le SSR ? ». `hydrate on interaction` répond à « quand ce bloc, déjà présent dans le HTML serveur, doit-il devenir **interactif** ? ». Pour un rendu issu du SSR, c'est le déclencheur d'hydratation qui s'applique en premier ; tout rendu client ultérieur (si le bloc doit être re-rendu depuis zéro) retombe sur le déclencheur classique.

### Exemple 2 — Un contenu jamais hydraté

```html
@defer (hydrate never) {
  <app-mentions-legales-resumees />
}
```

Un résumé de mentions légales en bas de page n'a besoin d'aucune interactivité. `hydrate never` évite définitivement le coût d'hydratation de ce bloc : son HTML reste affiché tel quel, sans jamais attacher le moindre gestionnaire d'événement.

### Exemple 3 — Un déclencheur au survol

```html
@defer (on viewport; hydrate on hover) {
  <app-apercu-produit-associe [produitId]="idProduitAssocie" />
}
```

Une carte de produit associé, affichée dans une liste de recommandations, ne devient interactive qu'au survol de la souris — un compromis entre coût d'hydratation différé et réactivité perçue par l'utilisateur qui s'apprête réellement à interagir avec elle.

### Interaction avec `@defer` classique

Un bloc `@defer` sans déclencheur `hydrate on ...` continue à se comporter comme avant : si son contenu est déjà rendu côté serveur, il est hydraté normalement (complètement, immédiatement) au démarrage de l'application. L'hydratation incrémentale est donc **additive** : elle ne change rien aux blocs `@defer` existants qui n'ajoutent pas de déclencheur d'hydratation, et ne s'active que si `withIncrementalHydration()` est présent dans la configuration.

### Quand cela apporte vraiment quelque chose

L'hydratation incrémentale a un intérêt mesurable sur des pages avec plusieurs blocs secondaires non prioritaires au premier affichage (avis, recommandations, widgets tiers) — typiquement des pages de contenu riche (fiche produit détaillée, article). Sur une page simple avec peu de composants, le gain est négligeable et la complexité ajoutée (choisir un déclencheur par bloc) n'en vaut pas la peine.

### Comment le mesurer

Comme pour toute optimisation de performance (voir le chapitre Performance), la démarche reste mesurer avant et après : le **profileur d'Angular DevTools** pour observer le travail de détection de changements au démarrage, et **Lighthouse** pour suivre l'effet sur le temps avant interactivité (TTI) et l'INP. Un gain qui ne se voit pas dans ces mesures ne justifie pas la complexité ajoutée.

### Pièges courants

> **Ajouter `hydrate on ...` sans activer `withIncrementalHydration()`.** Sans cette fonctionnalité dans `provideClientHydration()`, les déclencheurs d'hydratation d'un `@defer` n'ont aucun effet : l'application retombe silencieusement sur une hydratation complète classique.

> **Découper à l'excès.** Ajouter un déclencheur d'hydratation à chaque petit fragment de la page multiplie les points de synchronisation à surveiller, sans bénéfice mesurable si ces fragments sont de toute façon peu coûteux à hydrater. Réserver l'hydratation incrémentale aux blocs réellement secondaires et non triviaux à hydrater.

> **Oublier `@placeholder` pour un rendu client pur.** Si le bloc doit un jour être rendu uniquement côté client (sans SSR préalable, par exemple une route non prérendue visitée en navigation interne), le déclencheur `@defer` classique reprend la main et un `@placeholder` reste nécessaire pour éviter un vide pendant le chargement.

### À retenir

- L'hydratation incrémentale hydrate la page **bloc par bloc**, selon un déclencheur choisi, au lieu de tout hydrater d'un coup au démarrage.
- Activation : `provideClientHydration(withIncrementalHydration())`.
- Syntaxe : un déclencheur d'hydratation s'ajoute à un `@defer`, séparé par un point-virgule — `@defer (on viewport; hydrate on interaction) { ... }`.
- Déclencheurs disponibles : `interaction`, `hover`, `viewport`, `idle`, `timer(...)`, `when condition`, et `hydrate never` (jamais interactif).
- Un bloc non encore hydraté reste affiché (HTML du SSR visible et indexable) mais n'est pas interactif : utile pour des blocs secondaires sur des pages riches en contenu.
- À mesurer avant/après (profileur Angular DevTools, Lighthouse — TTI, INP) plutôt qu'à appliquer par principe sur toute la page.
