---
id: hydratation
chapitre: ssr
ordre: 2
titre: "L'hydratation"
termes:
  - terme: Hydratation
    definition: "Processus qui, après un rendu SSR, **réutilise** le DOM déjà présent dans la page (au lieu de le détruire et de le recréer) et y rattache les gestionnaires d'événements et l'état interne d'Angular. Stable depuis l'introduction de l'hydratation non destructive."
  - terme: "provideClientHydration()"
    definition: "Fonction de `@angular/platform-browser` à ajouter aux providers de l'application pour activer l'hydratation côté client. Générée automatiquement par `ng add @angular/ssr`. Se combine avec des fonctionnalités optionnelles : `withEventReplay()`, `withI18nSupport()`, `withIncrementalHydration()`."
  - terme: "withEventReplay()"
    definition: "Fonctionnalité de `provideClientHydration()` qui **capture** les événements utilisateur (clic, frappe…) survenus entre l'affichage du HTML serveur et la fin de l'hydratation, puis les **rejoue** une fois l'application prête — pour qu'un clic précoce ne soit jamais silencieusement perdu."
  - terme: "NG0500 (Hydration Node Mismatch)"
    definition: "Erreur levée quand la structure du DOM produite côté serveur diverge de celle attendue côté client lors de l'hydratation. Causes typiques : manipulation directe du DOM (`appendChild`, `innerHTML`), HTML invalide, ou contenu non déterministe dans le template."
  - terme: ngSkipHydration
    definition: "Attribut (ou liaison d'hôte `host: { ngSkipHydration: 'true' }`) qui désactive l'hydratation pour un composant précis et ses enfants : Angular détruit alors le DOM serveur de ce sous-arbre et le recrée entièrement côté client. Solution de dernier recours, pas une correction."
  - terme: "Transfert d'état HTTP (TransferState)"
    definition: "Mécanisme qui transmet au client les réponses HTTP déjà obtenues côté serveur pendant le rendu, pour que le client les réutilise au lieu de relancer les mêmes requêtes juste après le démarrage — évite une double requête serveur puis client pour les mêmes données."
quiz:
  - question: "Sans hydratation, que fait Angular avec le HTML produit par le SSR lors du démarrage côté client ?"
    choix:
      - "Il le réutilise directement, sans le modifier"
      - "Il le détruit intégralement et recrée tout le DOM depuis zéro, comme en CSR pur"
      - "Il fusionne automatiquement l'ancien et le nouveau DOM nœud par nœud"
      - "Il ignore le rendu serveur et affiche une page blanche jusqu'à la fin du chargement"
    reponse: 1
    explication: "Sans hydratation, le rendu serveur n'est qu'un affichage transitoire : dès qu'Angular démarre côté client, il reconstruit tout le DOM comme s'il partait de zéro (un « flash » visible, un travail dupliqué). L'hydratation évite précisément cette destruction/recréation en réutilisant le DOM existant."
  - question: "Ce composant provoque une erreur `NG0500` en environnement SSR + hydratation. Pourquoi ?"
    code: |
      @Component({
        selector: 'app-graphique-ventes',
        template: `<div #conteneur></div>`,
      })
      export class GraphiqueVentes implements AfterViewInit {
        constructor(private el: ElementRef) {}

        ngAfterViewInit() {
          this.el.nativeElement.querySelector('div')!.innerHTML = '<canvas></canvas>';
        }
      }
    choix:
      - "`AfterViewInit` n'existe pas côté serveur"
      - "La manipulation directe du DOM via `innerHTML` crée une structure que le rendu serveur n'avait pas produite : à l'hydratation, Angular détecte une divergence entre le DOM attendu et le DOM réel"
      - "`ElementRef` est interdit dans un composant utilisé en SSR"
      - "Le sélecteur du composant est mal formé"
    reponse: 1
    explication: "`innerHTML` modifie le DOM en dehors du système de rendu d'Angular. Le serveur ne connaît pas cette modification : à l'hydratation, le DOM réel (avec le `<canvas>` ajouté côté client au rendu précédent, ou absent selon le moment) ne correspond plus à ce qu'Angular attend d'après son propre rendu, d'où `NG0500` (Hydration Node Mismatch). La correction consiste à exprimer ce contenu dans le template plutôt que par manipulation DOM directe."
  - question: "À quoi sert `withEventReplay()` dans `provideClientHydration(withEventReplay())` ?"
    choix:
      - "Il accélère le téléchargement du bundle JavaScript"
      - "Il capture les événements utilisateur survenus avant la fin de l'hydratation et les rejoue une fois l'application prête, pour qu'un clic précoce ne soit pas perdu"
      - "Il remplace `ngSkipHydration` pour tous les composants de l'application"
      - "Il empêche toute interaction utilisateur tant que l'hydratation n'est pas terminée"
    reponse: 1
    explication: "Entre l'affichage du HTML serveur et la fin de l'hydratation, la page est visible mais les gestionnaires d'événements Angular ne sont pas encore actifs. `withEventReplay()` enregistre les interactions survenues pendant cette fenêtre et les rejoue une fois l'hydratation terminée, plutôt que de les perdre silencieusement."
---

## Essentiel

Le SSR (leçon précédente) produit du HTML avant même que le JavaScript ne s'exécute côté client. Sans précaution supplémentaire, Angular démarre ensuite côté client exactement comme en CSR : il **détruit** ce DOM serveur et le **recrée** entièrement — un travail dupliqué, et souvent un flash visible à l'écran.

L'**hydratation** évite cela : Angular réutilise le DOM déjà présent, y rattache les écouteurs d'événements et son propre état interne, sans tout reconstruire. Elle s'active avec `provideClientHydration()` (déjà branché automatiquement par `ng add @angular/ssr`) :

```ts
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';

bootstrapApplication(App, {
  providers: [provideClientHydration(withEventReplay())],
});
```

`withEventReplay()` capture les interactions utilisateur (clic, frappe) survenues **avant** que l'hydratation ne soit terminée, et les rejoue une fois l'application prête — un clic précoce sur un bouton « Ajouter au panier » n'est donc pas perdu.

Pour que l'hydratation fonctionne, le DOM produit côté client doit correspondre **exactement** à celui produit côté serveur. Une divergence (manipulation DOM directe, HTML invalide, valeur non déterministe comme `Math.random()` dans un template) déclenche une erreur d'hydratation (`NG0500`). `ngSkipHydration` permet de désactiver l'hydratation pour un composant précis en dernier recours, au prix d'une destruction/recréation classique de son DOM.

## Détail

### Comment ça marche

Pendant le rendu serveur, Angular insère dans le HTML des marqueurs internes (des nœuds de commentaire invisibles) qui décrivent la structure attendue de l'arbre de vues. Au démarrage côté client, l'hydratation parcourt le DOM existant en s'appuyant sur ces marqueurs : à chaque nœud, elle vérifie qu'il correspond à ce que le rendu client produirait, l'associe à l'instance de composant correspondante, et rattache les écouteurs d'événements — sans recréer l'élément DOM lui-même. Si un nœud attendu est absent, en trop, ou d'un type différent, l'hydratation de ce sous-arbre échoue.

### Exemple 1 — Rejeu d'événements

```ts
bootstrapApplication(App, {
  providers: [provideClientHydration(withEventReplay())],
});
```

Sur une fiche produit affichée en SSR, un utilisateur impatient peut cliquer sur « Ajouter au panier » avant que le JavaScript ne soit chargé et que l'hydratation ne soit terminée. Sans `withEventReplay()`, ce clic ne déclenche rien (aucun gestionnaire Angular n'est encore actif) et l'utilisateur doit cliquer une seconde fois. Avec `withEventReplay()`, Angular capture l'événement dès la phase HTML et le rejoue une fois l'hydratation terminée.

### Exemple 2 — Une cause classique d'erreur d'hydratation

```ts
@Component({
  selector: 'app-bandeau-promo',
  template: `<p>Code promo : {{ codePromo }}</p>`,
})
export class BandeauPromo {
  codePromo = `PROMO-${Math.floor(Math.random() * 1000)}`;
}
```

Ce champ est évalué une fois côté serveur (ex. `PROMO-482`) et une seconde fois côté client lors de l'hydratation (ex. `PROMO-117`) : les deux valeurs diffèrent, Angular détecte que le texte du nœud ne correspond pas à ce qui a été rendu côté serveur. La correction consiste à calculer cette valeur une seule fois — côté serveur uniquement, transmise ensuite au client via le transfert d'état — plutôt qu'à chaque exécution du template.

### Exemple 3 — `ngSkipHydration` en dernier recours

```ts
@Component({
  selector: 'app-widget-carte-tierce',
  template: `<div #carte></div>`,
  host: { ngSkipHydration: 'true' },
})
export class WidgetCarteTierce implements AfterViewInit {
  ngAfterViewInit() {
    // Librairie tierce qui manipule le DOM à sa façon, hors du contrôle d'Angular
    initialiserCarteInteractive(this.elementCarte);
  }
}
```

Une librairie de cartographie interactive tierce manipule le DOM directement, d'une façon incompatible avec l'hydratation. `ngSkipHydration` isole ce composant : Angular renonce à hydrater son sous-arbre et le reconstruit classiquement côté client. Le reste de la page continue de bénéficier de l'hydratation normale.

### Exemple 4 — Transfert d'état HTTP

```ts
// Côté serveur (pendant le rendu) : HttpClient exécute la requête normalement.
export class CatalogueService {
  private http = inject(HttpClient);

  produits() {
    return this.http.get<Produit[]>('/api/produits');
  }
}
```

Sans transfert d'état, le client relance la même requête `GET /api/produits` juste après le démarrage, alors que le serveur venait de l'exécuter quelques instants plus tôt pour produire le HTML — une requête réseau dupliquée, invisible pour l'utilisateur mais coûteuse pour le serveur d'API. Le transfert d'état HTTP capture la réponse obtenue côté serveur et la met à disposition du client au démarrage, qui la réutilise directement au lieu de la redemander.

### Pièges courants

> **Manipuler le DOM avec les API natives du navigateur.** `appendChild()`, `innerHTML`, `insertBefore()`… en dehors du système de template d'Angular créent une structure que le serveur ne connaît pas : à l'hydratation, Angular compare ce qu'il attend à ce qu'il trouve et lève `NG0500` (Hydration Node Mismatch). Exprimer ce contenu dans le template plutôt que par manipulation DOM directe.

> **HTML invalide dans le template.** Un `<div>` imbriqué dans un `<p>`, un `<a>` dans un `<a>`, ou un `<table>` sans `<tbody>` (le navigateur corrige silencieusement la structure à l'affichage, ce qui ne correspond plus au HTML généré par le serveur) sont des causes fréquentes et discrètes d'échec d'hydratation.

> **Valeur non déterministe évaluée dans le template.** `Math.random()`, `new Date()`, ou toute donnée qui dépend de l'environnement d'exécution (fuseau horaire, locale du serveur) produit une valeur différente entre le rendu serveur et le rendu client — l'hydratation constate alors une divergence, même sur un template par ailleurs correct.

### À retenir

- L'hydratation réutilise le DOM produit par le SSR au lieu de le détruire et de le recréer côté client : moins de travail, pas de flash visible.
- `provideClientHydration()` l'active ; `withEventReplay()` capture et rejoue les événements survenus avant la fin de l'hydratation.
- Une divergence entre le DOM serveur et le DOM client (manipulation DOM directe, HTML invalide, valeur non déterministe) déclenche une erreur d'hydratation (`NG0500`, Hydration Node Mismatch).
- `ngSkipHydration` désactive l'hydratation pour un composant précis (recréation classique de son DOM) : un dernier recours, pas une solution à généraliser.
- Le transfert d'état HTTP réutilise côté client les réponses déjà obtenues côté serveur, pour éviter de relancer les mêmes requêtes juste après le démarrage.
