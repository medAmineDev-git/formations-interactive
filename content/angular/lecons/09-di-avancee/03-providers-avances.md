---
id: providers-avances
chapitre: di-avancee
ordre: 3
titre: Providers avancés
termes:
  - terme: useClass
    definition: "Configuration de provider qui indique quelle classe instancier pour un jeton donné. Permet de fournir une implémentation différente de la classe utilisée comme jeton (ex. une version simulée en test, une implémentation enrichie en production)."
  - terme: useValue
    definition: "Configuration de provider qui fournit directement une valeur déjà construite, sans instanciation ni appel de fonction. Adaptée aux constantes, objets de configuration ou valeurs calculées une seule fois avant le bootstrap."
  - terme: useExisting
    definition: "Configuration de provider qui crée un **alias** : le jeton renvoie la **même instance** qu'un autre provider déjà enregistré, plutôt que d'en créer une nouvelle. À ne pas confondre avec `useClass`, qui instancie une classe séparée."
  - terme: "useFactory + deps"
    definition: "Configuration de provider qui délègue la construction de la valeur à une fonction. Le tableau `deps` liste les jetons à injecter comme arguments de cette fonction, dans l'ordre — utile quand `inject()` n'est pas disponible (fonction externe non exécutée en contexte d'injection)."
  - terme: "multi: true"
    definition: "Option de provider qui fait que plusieurs déclarations pour le **même jeton** s'accumulent dans un tableau au lieu de s'écraser. Utilisée par Angular lui-même pour les intercepteurs HTTP de classe (`HTTP_INTERCEPTORS`) et les fonctions d'initialisation."
  - terme: "provideXxx()"
    definition: "Fonction qui encapsule un ensemble de providers liés à une fonctionnalité (`provideHttpClient()`, `provideRouter()`…) et renvoie des `EnvironmentProviders`. Forme recommandée pour configurer une fonctionnalité ou une librairie : plus lisible qu'un tableau `providers` brut, et composable avec des fonctions `withXxx()`."
  - terme: "provideAppInitializer()"
    definition: "Fonction qui enregistre du code exécuté au démarrage de l'application, avant le premier rendu — attend la résolution d'une `Promise` ou d'un `Observable` retourné. Remplace le jeton `APP_INITIALIZER`, déprécié depuis Angular 19."
  - terme: "forwardRef()"
    definition: "Fonction qui reporte la résolution d'une référence de classe, pour les cas où deux éléments dépendent l'un de l'autre et qu'aucun des deux n'est encore défini au moment où l'autre en a besoin (dépendance circulaire)."
quiz:
  - question: "Quelle est la différence de comportement entre ces deux providers ?"
    code: |
      // Option A
      providers: [{ provide: JournalAncien, useClass: JournalService }]

      // Option B
      providers: [JournalService, { provide: JournalAncien, useExisting: JournalService }]
    choix:
      - "Aucune différence : les deux options renvoient la même instance pour JournalAncien et JournalService"
      - "Option A crée deux instances distinctes (une par jeton) ; Option B fait de JournalAncien un simple alias vers l'unique instance de JournalService"
      - "Option A ne compile pas, car useClass exige que la classe cible soit abstraite"
      - "Option B est interdite : useExisting ne peut pas référencer un provider déclaré dans le même tableau"
    reponse: 1
    explication: "useClass instancie la classe indiquée séparément pour ce jeton : injecter JournalAncien et injecter JournalService donnent deux objets différents. useExisting ne crée rien : il fait pointer JournalAncien vers l'instance déjà résolue pour JournalService, donc les deux injections renvoient le même objet — utile pour renommer un jeton sans dupliquer l'état."
  - question: "Pourquoi ce provider échoue-t-il à l'exécution avec une erreur d'injection ?"
    code: |
      export function creerRemiseService(config: AppConfig) {
        return new RemiseService(config.tauxRemiseMax);
      }

      providers: [
        { provide: RemiseService, useFactory: creerRemiseService },
      ]
    choix:
      - "creerRemiseService doit être une méthode de classe, pas une fonction autonome"
      - "Il manque deps: [APP_CONFIG] : sans lui, Angular ne sait pas quoi injecter pour le paramètre config, qui reste undefined"
      - "useFactory ne peut pas être combiné avec une fonction qui prend des paramètres"
      - "RemiseService doit être marqué @Injectable() pour que useFactory fonctionne"
    reponse: 1
    explication: "Contrairement à inject(), une fonction passée à useFactory ne s'exécute pas automatiquement dans un contexte qui devine ses paramètres : il faut lister explicitement, dans deps, les jetons à injecter et à passer dans l'ordre à la fonction. Sans deps: [APP_CONFIG], config vaut undefined et config.tauxRemiseMax lève une erreur."
  - question: "Une application utilise encore APP_INITIALIZER pour charger sa configuration avant le démarrage. Que faut-il faire pour suivre les recommandations actuelles d'Angular 21 ?"
    choix:
      - "Rien : APP_INITIALIZER est toujours la méthode recommandée et n'a pas de remplaçant"
      - "Migrer vers provideAppInitializer(), qui remplace APP_INITIALIZER (déprécié depuis Angular 19) avec une syntaxe basée sur une fonction plutôt qu'un jeton multi"
      - "Remplacer APP_INITIALIZER par un effect() placé dans le composant racine"
      - "Utiliser useFactory sur le composant racine pour exécuter le code avant le bootstrap"
    reponse: 1
    explication: "APP_INITIALIZER est déprécié depuis Angular 19 au profit de provideAppInitializer(initializerFn), qui exécute la fonction dans un contexte d'injection au démarrage et attend la résolution d'une Promise ou d'un Observable éventuellement renvoyé — même comportement, syntaxe plus directe, sans jeton multi ni tableau à assembler soi-même."
---

## Essentiel

Au-delà du raccourci `providers: [MonService]` (qui utilise implicitement `useClass`), Angular offre plusieurs façons de configurer ce qu'un jeton renvoie :

```ts
providers: [
  { provide: JournalService, useClass: JournalServiceProd },        // une autre classe
  { provide: APP_CONFIG, useValue: { urlApi: '...' } },             // une valeur toute faite
  { provide: JournalAncien, useExisting: JournalService },          // un alias, même instance
  { provide: RemiseService, useFactory: creerRemise, deps: [APP_CONFIG] }, // construction déléguée
]
```

`useClass` instancie une classe (souvent différente du jeton lui-même). `useValue` fournit une valeur déjà construite, sans instanciation. `useExisting` crée un **alias** vers un provider existant — même instance, pas de duplication. `useFactory` délègue la construction à une fonction, dont les paramètres viennent du tableau `deps` (car `useFactory` ne s'exécute pas forcément dans un contexte d'injection permettant `inject()`).

L'option `multi: true` permet à **plusieurs** providers de contribuer au **même** jeton, qui devient alors un tableau — c'est ainsi qu'Angular assemble en interne les intercepteurs de classe (`HTTP_INTERCEPTORS`).

Pour configurer une fonctionnalité entière, Angular privilégie désormais les fonctions **`provideXxx()`** (`provideHttpClient()`, `provideRouter()`…), qui encapsulent la liste de providers nécessaire et se composent avec des options `withXxx()`. Le jeton `APP_INITIALIZER` suit la même évolution : déprécié depuis Angular 19 au profit de **`provideAppInitializer()`**. Enfin, `forwardRef()` résout les cas de dépendance circulaire entre deux éléments qui se référencent mutuellement.

## Détail

### Comment ça marche

Un provider est une **recette** que l'injecteur suit pour produire une valeur associée à un jeton. `useClass`/`useValue`/`useExisting`/`useFactory` sont quatre recettes différentes pour la même finalité. Angular privilégie aujourd'hui les fonctions `provideXxx()` plutôt que des tableaux `providers` écrits à la main, pour deux raisons : elles restent **tree-shakables** (seules les fonctionnalités réellement activées finissent dans le bundle), et elles offrent une API découvrable et typée (`provideHttpClient(withFetch(), withInterceptors([...]))`) plutôt qu'un tableau d'objets `{ provide, use... }` à assembler soi-même.

### Exemple 1 — `useClass` : changer d'implémentation selon l'environnement

```ts
export abstract class PaiementGateway {
  abstract payer(montant: number): Observable<Confirmation>;
}

@Injectable()
export class PaiementGatewayStripe extends PaiementGateway {
  payer(montant: number) { /* appel réel à l'API Stripe */ }
}

@Injectable()
export class PaiementGatewaySimulee extends PaiementGateway {
  payer(montant: number) { return of({ id: 'sim-1', statut: 'ok' }); }
}

// en test ou en démo, sans toucher au code métier :
providers: [{ provide: PaiementGateway, useClass: PaiementGatewaySimulee }]
```

### Exemple 2 — `multi: true` pour accumuler des contributions

```ts
export const VALIDATEUR_COMMANDE = new InjectionToken<ValidateurCommande[]>('validateurs.commande');

providers: [
  { provide: VALIDATEUR_COMMANDE, useClass: ValidateurStock, multi: true },
  { provide: VALIDATEUR_COMMANDE, useClass: ValidateurAdresse, multi: true },
  { provide: VALIDATEUR_COMMANDE, useClass: ValidateurPaiement, multi: true },
]

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private validateurs = inject(VALIDATEUR_COMMANDE); // ValidateurCommande[]

  valider(commande: Commande) {
    return this.validateurs.every((v) => v.estValide(commande));
  }
}
```

Sans `multi: true`, la dernière déclaration pour `VALIDATEUR_COMMANDE` écraserait les précédentes ; avec `multi: true`, `inject()` reçoit le tableau complet.

### Exemple 3 — `provideXxx()` pour une librairie ou une fonctionnalité maison

```ts
export function provideBoutique(options: { deviseParDefaut: string }): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: DEVISE_PAR_DEFAUT, useValue: options.deviseParDefaut },
    PanierService,
    CatalogueService,
  ]);
}

// utilisation, au même niveau que provideHttpClient() ou provideRouter()
bootstrapApplication(App, {
  providers: [provideBoutique({ deviseParDefaut: 'EUR' }), provideHttpClient()],
});
```

Ce pattern est celui que suit Angular pour ses propres fonctionnalités : une fonction unique, nommée clairement, qui cache le détail des providers derrière une API simple.

### Exemple 4 — `provideAppInitializer()` et `forwardRef()`

```ts
// initialisation au démarrage : charger la configuration avant le premier rendu
bootstrapApplication(App, {
  providers: [
    provideAppInitializer(() => {
      const config = inject(ConfigService);
      return firstValueFrom(config.charger()); // attend la résolution avant de démarrer
    }),
  ],
});

// dépendance circulaire entre deux directives qui se référencent mutuellement
@Directive({ selector: '[appOnglet]' })
export class OngletDirective {
  constructor(@Inject(forwardRef(() => GroupeOngletsDirective)) private groupe: GroupeOngletsDirective) {}
}
```

`provideAppInitializer()` remplace l'ancien jeton `APP_INITIALIZER` (qui demandait `multi: true` et un tableau de fonctions) par un appel direct, plus lisible. `forwardRef()` reste utile quand deux classes se déclarent mutuellement dans le même fichier, avant que l'une des deux soit encore définie au moment où l'autre la référence.

### Les quatre configurations de provider

| | Que fournit-il | Quand l'utiliser |
|---|---|---|
| `useClass` | Une instance d'une classe (potentiellement différente du jeton) | Changer d'implémentation (test, environnement) |
| `useValue` | Une valeur déjà construite | Configuration statique, constante |
| `useExisting` | Un alias vers une instance déjà résolue | Renommer un jeton sans dupliquer l'état |
| `useFactory` + `deps` | Le résultat d'une fonction, avec ses dépendances explicites | Construction conditionnelle, logique d'assemblage |

### Pièges courants

> **Confondre `useClass` et `useExisting`.** `useClass` crée une **nouvelle instance** ; `useExisting` réutilise celle qui existe déjà pour un autre jeton. Utiliser `useClass` par réflexe pour créer un alias aboutit à deux objets distincts qui peuvent diverger, alors qu'un seul état était voulu.

> **Oublier `deps` avec `useFactory`.** Une fonction passée à `useFactory` ne s'exécute pas dans un contexte permettant `inject()` par défaut : sans `deps`, ses paramètres valent `undefined`. Il faut lister explicitement les jetons dans `deps`, dans le même ordre que les paramètres de la fonction.

> **Utiliser encore `APP_INITIALIZER` par habitude.** Ce jeton est déprécié depuis Angular 19 ; `provideAppInitializer()` fait la même chose avec une API plus directe (une fonction plutôt qu'un jeton `multi: true` à assembler). Le code existant continue de fonctionner, mais le nouveau code devrait utiliser `provideAppInitializer()`.

### À retenir

- `useClass`, `useValue`, `useExisting`, `useFactory` sont quatre façons de dire à l'injecteur quoi renvoyer pour un jeton donné.
- `useExisting` crée un alias (même instance), `useClass` crée une instance séparée : ne pas confondre les deux.
- `useFactory` a besoin de `deps` pour connaître ses paramètres — `inject()` n'y est pas automatiquement disponible.
- `multi: true` accumule plusieurs providers pour un même jeton dans un tableau, au lieu de les faire s'écraser.
- Les fonctions `provideXxx()` sont la forme recommandée pour configurer une fonctionnalité ; `provideAppInitializer()` remplace `APP_INITIALIZER` (déprécié depuis Angular 19) ; `forwardRef()` reste nécessaire pour les rares dépendances circulaires.
