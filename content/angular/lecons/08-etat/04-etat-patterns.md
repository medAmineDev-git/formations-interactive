---
id: etat-patterns
chapitre: etat
ordre: 4
titre: "Patterns d'état : local, partagé, serveur"
termes:
  - terme: État local
    definition: "État qui n'a de sens que pour **un composant** (souvent une seule instance) : un menu ouvert/fermé, un onglet sélectionné, le texte en cours de saisie dans un champ non encore validé. Créé et détruit avec le composant."
  - terme: État partagé (applicatif)
    definition: "État utilisé par **plusieurs composants** sans lien de parenté direct : utilisateur connecté, panier, préférences d'affichage. Vit dans un service `providedIn: 'root'` ou un store de portée route (voir leçon précédente)."
  - terme: État serveur
    definition: "Copie locale de données qui appartiennent réellement au **serveur** (liste de produits, détail d'une commande) : elle peut devenir **périmée**, doit être **invalidée**/rechargée, et n'est jamais la source de vérité définitive."
  - terme: Source unique de vérité
    definition: "Principe selon lequel une donnée ne doit exister qu'à **un seul endroit** dans l'application. Toute autre valeur qui en dépend doit être **dérivée** (`computed()`), jamais recopiée dans un état séparé qu'il faudrait resynchroniser à la main."
  - terme: État dérivé dupliqué
    definition: "Anti-pattern consistant à stocker dans un signal une valeur qui pourrait être calculée à partir d'un autre état (ex. un total stocké séparément des lignes de commande) : source fréquente de désynchronisation quand on oublie de le mettre à jour partout."
  - terme: URL comme état
    definition: "Utiliser les paramètres de route ou de requête (`?categorie=peripheriques&tri=prix`) pour stocker un état d'interface : il devient partageable par lien, conservé au rafraîchissement de la page, et navigable avec le bouton retour du navigateur."
quiz:
  - question: "Une page catalogue stocke `resultatsRecherche` (venu d'un appel HTTP) et, séparément, un signal `nombreResultats` mis à jour manuellement après chaque appel. Quel est le risque principal ?"
    code: |
      resultatsRecherche = signal<Produit[]>([]);
      nombreResultats = signal(0);

      async rechercher(texte: string) {
        const resultats = await api.rechercher(texte);
        this.resultatsRecherche.set(resultats);
        this.nombreResultats.set(resultats.length); // facile à oublier
      }
    choix:
      - "Aucun risque, c'est la bonne pratique pour éviter de recalculer une longueur de tableau"
      - "`nombreResultats` duplique une donnée calculable à partir de `resultatsRecherche` : tout nouveau point de mise à jour de `resultatsRecherche` qui oublierait de mettre aussi à jour `nombreResultats` désynchronise les deux"
      - "Le code ne compile pas : deux signaux ne peuvent pas être mis à jour dans la même fonction"
      - "`nombreResultats` doit obligatoirement être un `WritableSignal` pour des raisons de performance"
    reponse: 1
    explication: "`nombreResultats` devrait être `computed(() => resultatsRecherche().length)` : une valeur qui se déduit entièrement d'un autre état ne doit jamais être stockée séparément. Le stocker à part crée un point de synchronisation manuel, oublié tôt ou tard dans un autre endroit du code qui modifie `resultatsRecherche`."
  - question: "Un filtre de catalogue (catégorie, tri) n'existe que dans un signal local du composant liste. Quel est l'inconvénient principal pour l'utilisateur ?"
    choix:
      - "Aucun : un signal local est toujours le bon choix pour un filtre"
      - "Le filtre ne peut pas être lu par un `computed()`"
      - "L'utilisateur ne peut pas partager un lien vers la liste déjà filtrée, et perd son filtre en rafraîchissant la page ou en revenant avec le bouton précédent du navigateur"
      - "Le filtre disparaît automatiquement après 30 secondes"
    reponse: 2
    explication: "Un filtre qui n'existe que dans un signal de composant est un état purement local : invisible dans l'URL, il ne survit pas à un rafraîchissement, n'est pas partageable par lien, et le bouton précédent du navigateur ne le restaure pas. Synchroniser ce filtre avec les paramètres de requête de l'URL (`?categorie=...&tri=...`) corrige ces trois problèmes."
  - question: "Quelle est la différence essentielle entre un état « partagé » (ex. panier) et un état « serveur » (ex. liste de produits chargée par HTTP), qui justifie de ne pas les traiter de la même façon ?"
    choix:
      - "L'état serveur ne peut jamais être un signal, seulement un `Observable`"
      - "L'état partagé est modifié directement par l'application, qui en reste la source de vérité ; l'état serveur appartient au backend, peut devenir périmé sans que l'application le sache, et nécessite une stratégie d'invalidation/rechargement"
      - "L'état serveur est toujours plus rapide à lire que l'état partagé"
      - "Il n'y a aucune différence : les deux se gèrent exactement de la même façon"
    reponse: 1
    explication: "Un panier est modifié par l'utilisateur via l'application, qui en est la source de vérité. Une liste de produits chargée par HTTP est une **copie locale** d'une donnée qui vit ailleurs (le serveur) : elle peut devenir obsolète pendant que l'utilisateur navigue, et l'application doit décider quand la recharger (au montage, périodiquement, après une action) — un problème que l'état purement applicatif ne pose pas."
---

## Essentiel

Toute donnée d'une application n'est pas de même nature. Distinguer trois catégories évite de mal placer un état — et la plupart des bugs de synchronisation viennent d'une mauvaise catégorisation :

- **État local** : n'a de sens que pour un composant (menu ouvert, brouillon de champ). Un `signal()` dans le composant suffit.
- **État partagé (applicatif)** : utilisé par plusieurs parties de l'application sans lien direct (utilisateur connecté, panier). Un service à signaux ou un store, de portée `root` ou route (voir les deux leçons précédentes).
- **État serveur** : une copie locale de données qui appartiennent au backend (produits, commandes). Elle peut devenir **périmée** et doit être **invalidée**/rechargée — un problème que l'état purement local ou partagé ne pose pas.

```ts
// État local : ce menu, ce composant
menuOuvert = signal(false);

// État partagé : le panier de l'utilisateur, injecté partout où nécessaire
private panier = inject(PanierService);

// État serveur : une ressource distante, avec son propre cycle de vie
produits = httpResource<Produit[]>(() => '/api/produits');
```

Règle centrale : une **source unique de vérité** par donnée. Si une valeur se calcule à partir d'une autre (un total, un nombre de résultats), elle doit être un `computed()`, jamais un signal séparé mis à jour manuellement — sinon les deux finissent par se désynchroniser.

## Détail

### Pourquoi confondre les deux complique tout

Traiter un état serveur comme un simple état partagé (le charger une fois dans un signal et ne plus y penser) mène à des données obsolètes affichées sans que rien ne le signale. À l'inverse, traiter un état purement local (comme un filtre d'interface) comme s'il devait vivre dans un store partagé alourdit le code sans bénéfice. Le bon réflexe est de se demander, pour chaque donnée : *qui d'autre en a besoin ?* et *d'où vient-elle réellement ?*

### Exemple 1 — État local : un menu déroulant

```ts
@Component({ selector: 'app-menu-utilisateur' })
export class MenuUtilisateur {
  ouvert = signal(false);

  basculer(): void {
    this.ouvert.update(v => !v);
  }
}
```

Rien ne justifie de sortir `ouvert` du composant : aucun autre composant n'en a besoin, et il n'a aucun sens en dehors de cet affichage précis.

### Exemple 2 — État partagé : l'utilisateur connecté

```ts
@Injectable({ providedIn: 'root' })
export class UtilisateurStore {
  private _utilisateur = signal<Utilisateur | null>(null);
  readonly utilisateur = this._utilisateur.asReadonly();
  readonly estConnecte = computed(() => this._utilisateur() !== null);
}
```

Le menu, le fil d'Ariane, la page de compte : tous ont besoin de savoir qui est connecté, sans lien de parenté entre eux. C'est la définition même d'un état partagé (voir la leçon sur les services à signaux).

### Exemple 3 — État serveur : une liste de produits

```ts
@Component({ selector: 'app-catalogue' })
export class Catalogue {
  categorie = signal<string | null>(null);

  // L'état serveur a son propre cycle : chargement, erreur, revalidation.
  produits = httpResource<Produit[]>(() =>
    this.categorie() ? `/api/produits?categorie=${this.categorie()}` : '/api/produits',
  );
}
```

`produits` n'est pas « juste un signal » : c'est une **ressource** avec un statut (chargement, erreur, valeur), qui se recharge automatiquement quand `categorie` change. La copier dans un signal séparé dupliquerait un état déjà géré par la ressource elle-même. (`httpResource()` reste **expérimental** en Angular 21 — voir le chapitre HTTP pour le détail ; le principe illustré ici, une ressource comme unique source de vérité pour une donnée serveur, reste valable même avec un appel `HttpClient` classique.)

### Exemple 4 — Synchroniser un filtre avec l'URL

```ts
export const routesCatalogue: Routes = [
  {
    path: 'catalogue',
    loadComponent: () => import('./catalogue').then(m => m.Catalogue),
  },
];

// appConfig
provideRouter(routes, withComponentInputBinding());

@Component({ selector: 'app-catalogue' })
export class Catalogue {
  // Lié automatiquement au paramètre de requête `categorie` grâce à withComponentInputBinding()
  categorie = input<string | null>(null);
}
```

Avec `withComponentInputBinding()`, le paramètre de requête `?categorie=peripheriques` alimente directement l'`input()` du composant : le filtre devient partie de l'URL, donc partageable par lien, conservé au rafraîchissement, et navigable avec le bouton précédent.

### Où placer cet état ? (tableau de décision)

| Question | Réponse | Placement |
|---|---|---|
| Un seul composant en a besoin, et ça n'a de sens que le temps de son affichage ? | Oui | Signal local du composant |
| Plusieurs composants sans lien de parenté en ont besoin, et c'est l'application qui en est propriétaire ? | Oui | Service à signaux `root`, ou store de portée route si limité à une fonctionnalité |
| La donnée vient du serveur et peut devenir périmée ? | Oui | Ressource dédiée (`resource()`, `httpResource()`) avec une stratégie de rechargement |
| L'utilisateur doit pouvoir partager, rafraîchir ou revenir en arrière sans perdre cette info (filtre, page, tri) ? | Oui | Paramètres de l'URL |
| La valeur se calcule entièrement à partir d'un autre état déjà stocké ? | Oui | `computed()` — jamais un état séparé |

### Pièges courants

> **Dupliquer une donnée serveur dans un signal séparé.** Copier le résultat d'une ressource dans un `signal()` « pour aller plus vite » recrée un second endroit à synchroniser manuellement, alors que la ressource (`resource()`/`httpResource()`) gère déjà chargement, erreur et revalidation. Lire directement la ressource, ou dériver avec `computed()` si une transformation est nécessaire.

> **Stocker un état dérivé calculable au lieu d'un `computed()`.** Un total, un nombre d'éléments, un statut « filtré vide » : s'ils se déduisent d'un autre état, un signal séparé mis à jour à la main finit toujours par se désynchroniser un jour où quelqu'un oublie un point de mise à jour.

> **Confondre le filtre (état d'interface) et le résultat filtré (état serveur).** Le filtre choisi par l'utilisateur (catégorie, tri) est un état d'interface, éventuellement à mettre dans l'URL ; le résultat de la recherche est un état serveur, avec son propre cycle de chargement. Les traiter comme une seule donnée complique l'invalidation : on ne sait plus si on doit recharger parce que le filtre a changé ou parce que les données sont périmées.

### À retenir

- Trois catégories d'état à distinguer systématiquement : **local**, **partagé**, **serveur** — chacune a sa bonne place.
- Une seule **source unique de vérité** par donnée ; tout le reste se dérive avec `computed()`.
- L'état serveur n'est jamais « juste un signal » : il a un cycle de vie (chargement, erreur, péremption) à gérer explicitement.
- Les paramètres de l'URL sont un excellent emplacement pour un état d'interface qui doit être partageable ou survivre à un rafraîchissement.
- Se poser la question « qui a besoin de cette donnée, et d'où vient-elle vraiment ? » avant de choisir où la stocker.
