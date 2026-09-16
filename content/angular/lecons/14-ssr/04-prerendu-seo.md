---
id: prerendu-seo
chapitre: ssr
ordre: 4
titre: "Pré-rendu et SEO"
termes:
  - terme: "RenderMode (Server / Client / Prerender)"
    definition: "Valeur associée à chaque route dans `app.routes.server.ts` (via `ServerRoute`) qui précise comment cette route est rendue : `Server` (SSR à chaque requête), `Client` (CSR, comportement Angular par défaut), ou `Prerender` (SSG, une fois au build)."
  - terme: getPrerenderParams()
    definition: "Fonction fournie dans une `ServerRoute` en `RenderMode.Prerender` pour une route à paramètres (ex. `post/:id`) : elle renvoie, au moment du build, la liste des valeurs de paramètres pour lesquelles générer une page statique."
  - terme: "Title / Meta (@angular/platform-browser)"
    definition: "Services injectables pour lire et modifier respectivement le titre de la page (`Title.setTitle()`) et ses balises `<meta>` (`Meta.updateTag()`, `Meta.addTag()`, `Meta.getTag()`, `Meta.removeTag()`) — indispensables pour un titre et une description propres à chaque page, plutôt qu'un titre unique statique dans `index.html`."
  - terme: "Données structurées (JSON-LD)"
    definition: "Bloc `<script type=\"application/ld+json\">` inséré dans la page, au format Schema.org, qui décrit son contenu de façon exploitable par les moteurs de recherche (ex. type `Product` avec prix et disponibilité) — sans effet sur l'affichage visuel de la page."
  - terme: "status (ServerRoute)"
    definition: "Propriété d'une `ServerRoute` qui fixe le code de statut HTTP renvoyé pour cette route (ex. `status: 404` sur une route catch-all associée à une page introuvable), en complément de `headers` pour des en-têtes personnalisés."
  - terme: robots.txt
    definition: "Fichier statique à la racine du site qui indique aux robots d'indexation les zones à explorer ou à ignorer, et référence généralement l'emplacement du sitemap. Ne remplace pas une protection d'accès réelle : un robot qui l'ignore volontairement peut quand même accéder aux pages listées."
  - terme: Sitemap
    definition: "Fichier (généralement XML) qui liste les URL du site à faire connaître aux moteurs de recherche, utile en particulier pour des pages peu reliées entre elles par des liens internes."
quiz:
  - question: "Un catalogue compte des milliers de fiches produits, dont le contenu (description, caractéristiques) change rarement mais dont le stock varie en continu. Quelle configuration de rendu est la plus cohérente ?"
    choix:
      - "Prérendre (SSG) l'intégralité de chaque fiche produit, stock inclus, et relancer un build à chaque changement de stock"
      - "SSR pour la fiche produit dans son ensemble, avec le stock chargé côté serveur à chaque requête, quitte à accepter le coût d'un rendu serveur par visite"
      - "CSR pur pour toute la fiche produit, y compris la description, chargée après coup via une requête HTTP"
      - "Prérendre les pages listant les catégories (peu volatiles), et servir les fiches produits individuelles en SSR pour refléter un stock à jour"
    reponse: 3
    explication: "Le choix du mode de rendu se fait page par page selon la volatilité réelle du contenu : des pages de catégories peu volatiles se prêtent bien au prérendu (rapide, sans coût serveur), tandis qu'une donnée qui change en continu comme un stock justifie le SSR sur la fiche produit elle-même. Prérendre tout le catalogue avec le stock inclus figerait une donnée qui doit rester à jour ; tout passer en CSR pur perd l'avantage SEO et de premier affichage du SSR."
  - question: "Que renvoie `getPrerenderParams()` dans une `ServerRoute` en `RenderMode.Prerender` pour la route `post/:id` ?"
    code: |
      export const serverRoutes: ServerRoute[] = [
        {
          path: 'post/:id',
          renderMode: RenderMode.Prerender,
          async getPrerenderParams() {
            const ids = await inject(PostService).getIds();
            return ids.map((id) => ({ id }));
          },
        },
      ];
    choix:
      - "La liste des identifiants d'articles pour lesquels une page statique doit être générée au build"
      - "Le contenu HTML final de chaque article, à insérer tel quel dans le fichier statique"
      - "La configuration du serveur Node qui servira les pages une fois le build terminé"
      - "Un middleware exécuté à chaque requête pour valider l'identifiant demandé"
    reponse: 0
    explication: "`getPrerenderParams()` répond à la question « pour quelles valeurs du paramètre `:id` faut-il générer une page au build ? ». Le tableau d'objets qu'elle renvoie (un objet par jeu de paramètres) pilote directement le nombre et l'identité des fichiers HTML statiques produits ; le rendu HTML proprement dit reste géré par Angular, pas par cette fonction."
  - question: "Une route catch-all `**` doit afficher une page « produit introuvable » avec le bon code HTTP pour les robots d'indexation. Que faut-il faire dans `app.routes.server.ts` ?"
    choix:
      - "Rien : Angular renvoie automatiquement un code 404 pour toute route non trouvée, côté serveur comme côté client"
      - "Ajouter une `ServerRoute` avec `path: '**'`, un `renderMode` adapté (`Server`, par exemple) et `status: 404`, associée au composant de page introuvable"
      - "Retirer complètement la route catch-all : Angular gère les 404 uniquement via `index.html`"
      - "Fixer `status: 404` directement dans le composant, via un décorateur dédié"
    reponse: 1
    explication: "`ServerRoute` accepte une propriété `status` pour fixer le code HTTP renvoyé pour une route donnée. Sans elle, une route catch-all rendue en SSR renverrait un code 200 par défaut même pour une page « introuvable » — trompeur pour un robot d'indexation, qui indexerait alors une page qui ne devrait pas l'être."
---

## Essentiel

Le choix du mode de rendu (leçon 1) se fait **page par page**, selon la volatilité du contenu. `app.routes.server.ts` associe chaque route à un `RenderMode` :

```ts
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'categories/:slug', renderMode: RenderMode.Prerender },
  {
    path: 'produits/:id',
    renderMode: RenderMode.Server, // stock à jour à chaque requête
  },
  { path: 'compte', renderMode: RenderMode.Client }, // contenu privé, pas d'intérêt SEO
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
```

- **`Prerender`** (SSG) : une fois au build, pour des routes dont le contenu est stable (page d'accueil, catégories). Pour une route à paramètres, `getPrerenderParams()` fournit la liste des valeurs à générer.
- **`Server`** (SSR) : à chaque requête, pour du contenu qui change souvent et doit rester indexable à jour (fiche produit avec stock).
- **`Client`** (CSR) : pour du contenu sans intérêt SEO (page de compte utilisateur, tableau de bord).

Au-delà du mode de rendu, le SEO d'une page dépend de son **titre** et de ses **balises meta**, propres à chaque route, via les services `Title` et `Meta` de `@angular/platform-browser` :

```ts
export class FicheProduit implements OnInit {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  produit = input.required<Produit>();

  ngOnInit() {
    this.titleService.setTitle(`${this.produit().nom} — Ma Boutique`);
    this.metaService.updateTag({ name: 'description', content: this.produit().resume });
  }
}
```

Un `robots.txt` et un sitemap complètent le dispositif ; une route catch-all avec `status: 404` évite qu'une page introuvable ne soit indexée avec un code 200 trompeur.

## Détail

### Comment ça marche

Le rendu d'une page n'est qu'une partie du SEO : un robot d'indexation évalue aussi le titre, la description, la structure sémantique du HTML et, de plus en plus, des données structurées explicites. Un site entièrement en SSR mais avec un titre statique identique sur toutes les pages (celui d'`index.html`, jamais modifié) reste mal indexé, malgré un HTML complet dès la première réponse.

### Exemple 1 — Titre et meta par page

```ts
import { Component, OnInit, inject, input } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({ selector: 'app-fiche-produit', template: `...` })
export class FicheProduit implements OnInit {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  produit = input.required<Produit>();

  ngOnInit() {
    const p = this.produit();
    this.titleService.setTitle(`${p.nom} — Ma Boutique`);
    this.metaService.updateTag({ name: 'description', content: p.resume });
    this.metaService.updateTag({ property: 'og:title', content: p.nom });
    this.metaService.updateTag({ property: 'og:image', content: p.imagePrincipale });
  }
}
```

`updateTag()` crée la balise si elle n'existe pas encore, ou met à jour celle qui correspond déjà — utile pour les balises `og:*` utilisées par les aperçus de partage sur les réseaux sociaux, en plus de la `description` classique pour les moteurs de recherche.

### Exemple 2 — Pré-rendu paramétré

```ts
export const serverRoutes: ServerRoute[] = [
  {
    path: 'categories/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const categories = await inject(CatalogueService).getCategories();
      return categories.map((c) => ({ slug: c.slug }));
    },
  },
];
```

Chaque valeur renvoyée par `getPrerenderParams()` correspond à une page statique générée au build. Une catégorie ajoutée après le build ne sera visible qu'après un nouveau déploiement — acceptable pour des catégories peu volatiles, à mettre en balance avec la fréquence réelle des changements.

### Exemple 3 — Données structurées pour une fiche produit

```ts
private document = inject(DOCUMENT);

ajouterDonneesStructurees(produit: Produit) {
  const script = this.document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produit.nom,
    offers: { '@type': 'Offer', price: produit.prix, priceCurrency: 'EUR' },
  });
  this.document.head.appendChild(script);
}
```

Injecté côté serveur (donc présent dès la réponse HTML), ce bloc n'affecte pas l'affichage visuel mais donne aux moteurs de recherche une description structurée du produit (prix, disponibilité), exploitable par exemple pour un affichage enrichi dans les résultats de recherche.

### Exemple 4 — Route catch-all avec code 404

```ts
export const serverRoutes: ServerRoute[] = [
  // ...
  {
    path: '**',
    renderMode: RenderMode.Server,
    status: 404,
  },
];
```

Associée côté client à une route affichant un composant « Page introuvable », cette configuration garantit qu'un robot recevant cette page reçoit aussi le code HTTP 404 — sans quoi une page d'erreur pourrait être indexée comme une page normale (code 200 par défaut).

### Choisir entre SSG, SSR et CSR par page

| Page | Volatilité du contenu | Intérêt SEO | Mode recommandé |
|---|---|---|---|
| Accueil, page « À propos » | Faible | Élevé | Prérendu (SSG) |
| Liste de catégories | Faible à moyenne | Élevé | Prérendu (SSG) |
| Fiche produit (stock, prix) | Élevée | Élevé | SSR |
| Résultats de recherche/filtre | Élevée, dépend de la requête utilisateur | Faible à moyen | SSR ou CSR selon l'indexation souhaitée |
| Tableau de bord, compte utilisateur | Élevée, contenu privé | Nul | CSR |

### Vérifier le rendu réel

Le rendu observé dans le navigateur (après hydratation, JavaScript exécuté) ne dit rien du HTML **réellement** reçu par un robot qui n'exécute pas JavaScript, ou l'exécute différemment. Deux vérifications simples avant publication :

- `curl -s https://exemple.com/produits/123` (ou l'équivalent dans un client HTTP) pour inspecter le HTML brut réellement renvoyé, avant toute exécution de JavaScript — le titre, la description et le contenu principal doivent déjà y figurer pour une page en SSR ou prérendue.
- Un outil d'inspection d'URL (ex. celui de la Search Console de Google) pour voir comment un robot d'indexation particulier interprète effectivement la page, au-delà du simple HTML brut.

### Pièges courants

> **Oublier de personnaliser `Title`/`Meta` sur les pages rendues côté serveur.** Un SSR qui livre un HTML complet mais avec un titre statique identique sur toutes les pages (jamais modifié depuis `index.html`) reste mal différencié aux yeux d'un moteur de recherche, malgré un contenu déjà présent dans la réponse.

> **Renvoyer un code 200 sur une page d'erreur.** Sans `status: 404` explicite sur la route catch-all, une page « produit introuvable » rendue en SSR renvoie par défaut un code de succès : un robot peut alors l'indexer comme une page normale.

> **Prérendre une donnée qui change en continu.** Figer un stock, un prix ou une disponibilité dans une page `Prerender` produit un contenu obsolète dès la prochaine variation, jusqu'au prochain build — à réserver aux données réellement stables entre deux déploiements.

### À retenir

- Le mode de rendu se choisit route par route dans `app.routes.server.ts` : `Prerender` (contenu stable), `Server` (contenu volatile mais indexable), `Client` (contenu privé, sans intérêt SEO).
- `getPrerenderParams()` fournit, pour une route à paramètres en `Prerender`, la liste des valeurs à générer au build.
- `Title.setTitle()` et `Meta.updateTag()` personnalisent titre et balises meta par page — indispensable même avec un HTML déjà complet grâce au SSR.
- Des données structurées (JSON-LD) enrichissent la compréhension du contenu par les moteurs de recherche sans changer l'affichage visuel.
- `status` sur une `ServerRoute` catch-all évite qu'une page d'erreur ne soit indexée avec un code 200 trompeur ; `robots.txt` et un sitemap complètent le dispositif.
- Vérifier le rendu réel (HTML brut via `curl`, outil d'inspection d'URL) plutôt que de se fier à ce qui s'affiche dans un navigateur après hydratation.
