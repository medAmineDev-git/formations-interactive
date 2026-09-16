---
id: inject-fonction
chapitre: di-avancee
ordre: 1
titre: "La fonction inject()"
termes:
  - terme: "inject()"
    definition: "Fonction qui récupère une dépendance depuis l'injecteur actif, en dehors de la liste de paramètres d'un constructeur. Elle renvoie le même résultat que l'injection par constructeur, mais peut s'utiliser dans un initialiseur de champ, une fabrique de provider, un guard, un intercepteur, etc."
  - terme: Contexte d'injection
    definition: "Fenêtre d'exécution pendant laquelle Angular sait quel injecteur utiliser : construction d'une classe gérée par le DI (constructeur, initialiseurs de champ), fonction `factory` d'un provider ou d'un `InjectionToken`, et tout code exécuté via `runInInjectionContext()`. En dehors de ce contexte, `inject()` échoue."
  - terme: "runInInjectionContext()"
    definition: "Fonction qui exécute un callback en lui fournissant explicitement un contexte d'injection, à partir d'un `Injector` (ou `EnvironmentInjector`) donné. Utile pour appeler `inject()` hors d'une classe gérée par le DI, par exemple dans un test ou un code asynchrone tardif."
  - terme: DestroyRef
    definition: "Service injectable qui expose `onDestroy(callback)` pour enregistrer une action de nettoyage exécutée à la destruction du composant, de la directive ou du service courant. Alternative moderne à `ngOnDestroy` quand on écrit une fonction utilitaire plutôt qu'une classe."
  - terme: "takeUntilDestroyed()"
    definition: "Opérateur RxJS qui complète automatiquement un `Observable` quand le contexte appelant (composant, directive, service) est détruit. Appelé dans un contexte d'injection, il récupère le `DestroyRef` tout seul ; sinon, il faut lui en passer un explicitement."
  - terme: "{ optional: true }"
    definition: "Option de `inject()` qui renvoie `null` au lieu de lever une erreur (`NullInjectorError`) quand aucun provider n'est trouvé pour le jeton demandé. Utile pour une dépendance qui n'existe que dans certains contextes (une feature chargée en différé, par exemple)."
  - terme: "{ self } / { skipSelf } / { host }"
    definition: "Options de `inject()` qui contrôlent où chercher le provider dans la hiérarchie des injecteurs : `self` limite la recherche à l'injecteur courant (sans remonter), `skipSelf` l'exclut et commence par le parent, `host` s'arrête à la frontière de l'élément hôte d'une directive."
quiz:
  - question: "Que se passe-t-il à l'exécution avec ce code ?"
    code: |
      @Component({ selector: 'app-panier' })
      export class Panier {
        private panierService!: PanierService;

        ngOnInit() {
          this.panierService = inject(PanierService);
        }
      }
    choix:
      - "Ça fonctionne : ngOnInit s'exécute juste après le constructeur, donc encore dans le contexte d'injection"
      - "Erreur au runtime (NG0203) : inject() est appelé en dehors d'un contexte d'injection, car l'instance de Panier est déjà construite quand ngOnInit s'exécute"
      - "Ça fonctionne, mais uniquement si PanierService est fourni avec providedIn: 'root'"
      - "Erreur de compilation TypeScript, car inject() ne peut être utilisé que dans un champ typé"
    reponse: 1
    explication: "Le contexte d'injection se referme dès que l'instance de la classe est construite. ngOnInit est une méthode de cycle de vie appelée après coup, comme n'importe quelle autre méthode : inject() y est interdit. La bonne pratique est de l'appeler dans un initialiseur de champ (private panierService = inject(PanierService);) ou dans le constructeur."
  - question: "Cette fonction utilitaire, définie dans un fichier séparé, est appelée depuis le constructeur de plusieurs services. Pourquoi fonctionne-t-elle alors qu'elle n'est ni un constructeur ni un initialiseur de champ ?"
    code: |
      export function injecterJournal(prefixe: string) {
        const journal = inject(JournalService);
        return (message: string) => journal.ecrire(`[${prefixe}] ${message}`);
      }

      @Injectable({ providedIn: 'root' })
      export class CommandeService {
        private log = injecterJournal('commande');
      }
    choix:
      - "Ce n'est pas le cas : ce code lève une erreur NG0203 à l'exécution"
      - "Ce qui compte, c'est le contexte d'exécution au moment de l'appel, pas la position lexicale de la fonction : injecterJournal() s'exécute de façon synchrone pendant l'initialiseur de champ de CommandeService, donc encore dans son contexte d'injection"
      - "Ça fonctionne uniquement parce que injecterJournal() est déclarée avec le mot-clé function et non une flèche"
      - "Angular détecte automatiquement les fonctions utilitaires qui contiennent inject() et les exécute dans un contexte spécial"
    reponse: 1
    explication: "Un contexte d'injection est une propriété de la pile d'appel au moment de l'exécution, pas de l'endroit où la fonction est écrite. Tant que injecterJournal() est appelée de façon synchrone depuis un endroit valide (ici l'initialiseur de champ de CommandeService), son propre appel à inject() hérite de ce contexte. C'est ce qui permet d'écrire des fonctions utilitaires réutilisables autour de inject()."
  - question: "Un composant a besoin d'un jeton FEATURE_FLAGS qui n'est fourni que si le module de feature correspondant est chargé. Quelle option de inject() évite une erreur si le jeton est absent ?"
    choix:
      - "{ self: true }, pour limiter la recherche à l'injecteur du composant"
      - "{ optional: true }, qui renvoie null au lieu de lever une NullInjectorError si aucun provider n'est trouvé"
      - "{ skipSelf: true }, pour ignorer l'injecteur du composant"
      - "Aucune option n'existe : il faut envelopper l'appel dans un bloc try/catch"
    reponse: 1
    explication: "{ optional: true } est fait exactement pour ce cas : une dépendance qui peut légitimement ne pas être fournie selon le contexte. inject(FEATURE_FLAGS, { optional: true }) renvoie alors null, à tester ensuite, plutôt que de faire planter l'application avec une NullInjectorError. self et skipSelf contrôlent où chercher dans la hiérarchie, pas ce qui se passe en cas d'échec."
---

## Essentiel

`inject()` récupère une dépendance depuis l'injecteur actif. C'est un **strict équivalent** de l'injection par constructeur, mais sous forme de fonction plutôt que de paramètre :

```ts
@Injectable({ providedIn: 'root' })
export class ProduitService {
  // équivalent moderne
  private http = inject(HttpClient);
  private journal = inject(JournalService);

  // équivalent classique
  // constructor(private http: HttpClient, private journal: JournalService) {}
}
```

L'intérêt de `inject()` n'est pas esthétique : il fonctionne dans des endroits où un paramètre de constructeur est impossible — un **initialiseur de champ**, la fonction `factory` d'un `InjectionToken`, un guard ou un intercepteur **fonctionnel**, ou toute fonction utilitaire réutilisable qui a besoin d'une dépendance.

`inject()` n'est valable que dans un **contexte d'injection** : pendant la construction d'une classe gérée par le DI (constructeur, initialiseurs de champ), dans une fonction `factory` de provider, ou dans du code exécuté via `runInInjectionContext()`. En dehors — dans `ngOnInit`, un gestionnaire d'événement, un `setTimeout`, une méthode appelée plus tard — Angular lève l'erreur **NG0203** : *« inject() must be called from an injection context »*.

```ts
export const authGuard: CanActivateFn = () => {
  // les guards fonctionnels s'exécutent dans un contexte d'injection
  return inject(AuthService).estConnecte();
};
```

Pour se désabonner automatiquement d'un `Observable` à la destruction, `DestroyRef` (et l'opérateur `takeUntilDestroyed()`) remplacent avantageusement `ngOnDestroy` dans du code fonctionnel. Les options `{ optional, self, skipSelf, host }` affinent la recherche du provider dans la hiérarchie des injecteurs.

## Détail

### Comment ça marche

Un contexte d'injection n'est pas lié à *où* une fonction est écrite, mais à *quand* elle s'exécute. Angular ouvre un contexte d'injection le temps de construire une instance (constructeur, initialiseurs de champ dans l'ordre de déclaration), puis le referme. Toute fonction appelée **de façon synchrone** pendant cette fenêtre — y compris une fonction utilitaire définie ailleurs — hérite du contexte courant et peut donc appeler `inject()`. Un appel différé (callback asynchrone, méthode de cycle de vie, gestionnaire d'événement) s'exécute **après coup**, hors contexte.

### Exemple 1 — Contexte d'injection autorisé vs interdit

```ts
@Component({ selector: 'app-fiche-produit' })
export class FicheProduit {
  // ✅ initialiseur de champ : contexte d'injection actif
  private produits = inject(ProduitService);

  constructor() {
    // ✅ toujours dans le contexte d'injection de la construction
    const journal = inject(JournalService);
    journal.ecrire('FicheProduit créée');
  }

  chargerAvis() {
    // ❌ méthode appelée plus tard : contexte déjà refermé
    // const avis = inject(AvisService); // NG0203
  }
}
```

### Exemple 2 — `inject()` dans un guard, un intercepteur, une fabrique

Les fonctions dites *fonctionnelles* d'Angular (guards, resolvers, intercepteurs, `factory` de `InjectionToken`) sont **appelées par le framework à l'intérieur d'un contexte d'injection** : `inject()` y fonctionne directement, sans classe ni constructeur.

```ts
export const panierNonVideGuard: CanDeactivateFn<PanierComponent> = (composant) => {
  const panier = inject(PanierService);
  return panier.estVide() || confirm('Quitter sans valider la commande ?');
};

export const journalInterceptor: HttpInterceptorFn = (req, next) => {
  const journal = inject(JournalService);
  journal.ecrire(`Requête vers ${req.url}`);
  return next(req);
};
```

### Exemple 3 — `runInInjectionContext()` pour sortir de la règle

Quand un appel `inject()` doit se produire hors d'un contexte naturel (par exemple dans un test, ou après une opération asynchrone), on peut fournir un injecteur explicitement :

```ts
@Injectable({ providedIn: 'root' })
export class RechercheProduitsService {
  private injecteur = inject(EnvironmentInjector);

  rechercherPlusTard(terme: string) {
    setTimeout(() => {
      runInInjectionContext(this.injecteur, () => {
        const produits = inject(ProduitService);
        produits.rechercher(terme);
      });
    }, 1000);
  }
}
```

Sans `runInInjectionContext()`, l'appel `inject(ProduitService)` dans le `setTimeout` lèverait NG0203 : le callback s'exécute bien après la construction de `RechercheProduitsService`.

### Exemple 4 — `DestroyRef` et `takeUntilDestroyed()`

```ts
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private destroyRef = inject(DestroyRef);

  ecouter(flux$: Observable<Notification>) {
    // se désabonne automatiquement à la destruction du service
    flux$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((notif) => {
      console.log(notif.message);
    });
  }
}

@Component({ selector: 'app-suivi-commande' })
export class SuiviCommande {
  private commandes = inject(CommandeService);

  constructor() {
    // dans un contexte d'injection : pas besoin de passer destroyRef explicitement
    this.commandes.statutChange$
      .pipe(takeUntilDestroyed())
      .subscribe((statut) => console.log('Statut :', statut));
  }
}
```

`takeUntilDestroyed()` appelé sans argument, dans un contexte d'injection, récupère lui-même le `DestroyRef` courant. Hors contexte (comme dans `ecouter()` ci-dessus, appelée après construction), il faut le lui passer explicitement.

### Options de `inject()`

| Option | Effet |
|---|---|
| `{ optional: true }` | Renvoie `null` au lieu de lever une `NullInjectorError` si aucun provider n'est trouvé |
| `{ self: true }` | Cherche uniquement dans l'injecteur de l'élément courant, sans remonter la hiérarchie |
| `{ skipSelf: true }` | Ignore l'injecteur courant, commence la recherche au niveau du parent |
| `{ host: true }` | S'arrête à la frontière de l'élément hôte d'une directive (ne remonte pas au-delà) |

```ts
@Directive({ selector: '[appMiseEnEvidence]' })
export class MiseEnEvidence {
  // null si aucune configuration n'est fournie plus haut, plutôt qu'une erreur
  private config = inject(CONFIG_MISE_EN_EVIDENCE, { optional: true });

  // uniquement l'instance déclarée directement sur cet élément, jamais un ancêtre
  private conteneur = inject(ConteneurDirective, { self: true });
}
```

### Pièges courants

> **Appeler `inject()` dans un hook de cycle de vie.** `ngOnInit`, `ngAfterViewInit`, etc. s'exécutent après la construction : le contexte d'injection est déjà refermé. Résultat : `NG0203: inject() must be called from an injection context`. Solution : déplacer l'appel dans un initialiseur de champ ou le constructeur.

> **Appeler `inject()` dans un callback asynchrone.** `setTimeout`, `.then()`, un gestionnaire d'événement DOM ajouté après coup : tous s'exécutent hors du contexte de construction. Il faut soit lire la dépendance à l'avance (dans un champ), soit utiliser `runInInjectionContext()`.

> **Oublier `{ optional: true }` pour une dépendance qui peut manquer.** Sans cette option, l'absence de provider lève une `NullInjectorError` qui casse le rendu du composant, même si l'absence est un cas normal (feature non chargée, configuration facultative).

### À retenir

- `inject()` est équivalent à l'injection par constructeur, mais utilisable dans un initialiseur de champ, une fabrique, un guard, un intercepteur.
- Ce qui compte, c'est le **contexte d'exécution** au moment de l'appel, pas l'endroit où la fonction est écrite : une fonction utilitaire appelée en synchrone depuis un contexte valide peut utiliser `inject()`.
- Hors contexte (cycle de vie, callback asynchrone), `inject()` lève NG0203 ; `runInInjectionContext()` permet de le forcer avec un injecteur explicite.
- `DestroyRef.onDestroy()` et `takeUntilDestroyed()` gèrent le nettoyage sans dépendre d'une classe ni de `ngOnDestroy`.
- `{ optional, self, skipSelf, host }` affinent où et comment `inject()` cherche un provider dans la hiérarchie.
