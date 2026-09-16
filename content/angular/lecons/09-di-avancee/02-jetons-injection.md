---
id: jetons-injection
chapitre: di-avancee
ordre: 2
titre: Les jetons d'injection
termes:
  - terme: "InjectionToken<T>"
    definition: "Objet qui sert de clé d'injection typée quand une classe ne convient pas (interface, valeur de configuration, API du navigateur). Créé avec `new InjectionToken<T>('description', { providedIn, factory })`, il se lit comme n'importe quelle dépendance avec `inject(MON_JETON)`."
  - terme: "factory (d'un InjectionToken)"
    definition: "Fonction optionnelle passée à `InjectionToken` qui fournit une valeur par défaut, calculée seulement à la première injection (paresseuse) et **tree-shakable** : si le jeton n'est jamais injecté, ni la valeur ni ses dépendances n'atterrissent dans le bundle final."
  - terme: DOCUMENT
    definition: "Jeton d'injection (`@angular/core` depuis Angular 20 ; auparavant `@angular/common`) qui représente le `Document` du contexte de rendu courant. À injecter à la place d'un accès direct à l'objet global `document`, notamment pour que le code reste compatible avec le rendu côté serveur (SSR)."
  - terme: LOCALE_ID
    definition: "Jeton d'injection qui donne la locale active de l'application (ex. `'fr-FR'`), utilisée par les pipes de formatage (`date`, `currency`, `number`) et l'internationalisation. Se configure via un provider au bootstrap."
  - terme: PLATFORM_ID
    definition: "Jeton d'injection qui identifie la plateforme d'exécution courante (navigateur, serveur…). S'utilise presque toujours avec `isPlatformBrowser()` ou `isPlatformServer()` pour écrire du code conditionnel selon l'environnement."
  - terme: "isPlatformBrowser()"
    definition: "Fonction utilitaire (`@angular/common`) qui prend la valeur de `PLATFORM_ID` et renvoie `true` si le code s'exécute dans un navigateur. Indispensable avant d'utiliser une API propre au navigateur (`window`, `localStorage`…) dans une application qui peut aussi tourner en SSR."
  - terme: Remplacement de provider en test
    definition: "Dans `TestBed.configureTestingModule({ providers: [...] })`, remplacer le provider réel d'un jeton (classe ou `InjectionToken`) par une version simulée, sans toucher au code de production — c'est le même mécanisme de résolution de jeton qui rend ça possible."
quiz:
  - question: "Pourquoi ce code ne compile-t-il pas ?"
    code: |
      export interface Journalisation {
        ecrire(message: string): void;
      }

      @Component({
        providers: [{ provide: Journalisation, useClass: ConsoleJournal }],
      })
      export class TableauDeBord {}
    choix:
      - "ConsoleJournal doit être déclaré avant Journalisation dans le fichier"
      - "Journalisation est une interface TypeScript : elle n'existe plus après compilation et ne peut donc pas servir de jeton d'injection à l'exécution"
      - "useClass ne peut pas être utilisé avec provide"
      - "Il manque le mot-clé abstract devant interface"
    reponse: 1
    explication: "Les interfaces TypeScript sont purement structurelles : elles disparaissent à la compilation, il n'en reste aucune trace à l'exécution. Angular a besoin d'une valeur qui existe réellement au runtime pour servir de clé — une classe, ou un InjectionToken<Journalisation> créé explicitement pour représenter ce contrat."
  - question: "Quand la fonction factory de ce jeton s'exécute-t-elle ?"
    code: |
      export const CONFIG_PANIER = new InjectionToken<ConfigPanier>('config.panier', {
        providedIn: 'root',
        factory: () => ({ tvaParDefaut: 0.2, deviseParDefaut: 'EUR' }),
      });
    choix:
      - "Immédiatement, dès que le fichier contenant CONFIG_PANIER est chargé par le bundler"
      - "Seulement à la première injection de CONFIG_PANIER (inject(CONFIG_PANIER) ou constructeur), et jamais si le jeton n'est jamais utilisé"
      - "À chaque appel de inject(CONFIG_PANIER), une nouvelle valeur est recalculée à chaque fois"
      - "Au démarrage de l'application, avant même le bootstrap du composant racine"
    reponse: 1
    explication: "providedIn: 'root' avec une factory rend le jeton tree-shakable : la valeur n'est calculée qu'à la première injection réelle, et mise en cache ensuite comme un service en providedIn: 'root'. Si aucune partie de l'application n'injecte jamais CONFIG_PANIER, la fonction factory (et tout ce qu'elle référence) peut être éliminée du bundle final."
  - question: "Ce composant plante uniquement lors du rendu côté serveur (SSR), jamais dans le navigateur. Quelle est la cause la plus probable, et la correction ?"
    code: |
      @Component({ selector: 'app-largeur-ecran' })
      export class LargeurEcran {
        largeur = window.innerWidth;
      }
    choix:
      - "window n'existe pas dans l'environnement Node.js utilisé côté serveur ; il faut injecter PLATFORM_ID et n'accéder à window qu'après avoir vérifié isPlatformBrowser(platformId)"
      - "Le problème vient de innerWidth, qu'il faut remplacer par innerWidth() avec des parenthèses"
      - "Il faut ajouter standalone: false au composant pour qu'il fonctionne en SSR"
      - "window doit être importé explicitement depuis @angular/common avant de pouvoir être utilisé"
    reponse: 0
    explication: "En SSR, le composant s'exécute côté serveur, dans un environnement Node.js où l'objet global window n'existe pas. Le correctif standard consiste à injecter PLATFORM_ID, tester isPlatformBrowser(inject(PLATFORM_ID)) et n'exécuter le code dépendant du navigateur que si le test est vrai — ou, pour le Document, à injecter DOCUMENT plutôt que d'utiliser la variable globale document."
---

## Essentiel

Une classe injectable suffit la plupart du temps, mais pas toujours : une **interface** TypeScript n'existe plus à l'exécution (elle disparaît à la compilation), une **valeur de configuration** (URL d'API, taux de TVA par défaut) n'est pas une classe, et une **API du navigateur** (`document`, `window`) ne doit pas être référencée directement si le code doit aussi tourner côté serveur.

Pour ces cas, Angular fournit `InjectionToken<T>` : un objet qui sert de clé d'injection typée, indépendante de toute classe.

```ts
export interface ConfigPanier {
  tvaParDefaut: number;
  deviseParDefaut: string;
}

export const CONFIG_PANIER = new InjectionToken<ConfigPanier>('config.panier', {
  providedIn: 'root',
  factory: () => ({ tvaParDefaut: 0.2, deviseParDefaut: 'EUR' }),
});
```

L'option `factory` rend le jeton **tree-shakable**, comme un service `providedIn: 'root'` : la valeur n'est calculée qu'à la première injection, et éliminée du bundle si personne ne l'injecte jamais.

```ts
@Injectable({ providedIn: 'root' })
export class PanierService {
  private config = inject(CONFIG_PANIER);

  calculerTTC(montantHT: number) {
    return montantHT * (1 + this.config.tvaParDefaut);
  }
}
```

Angular fournit lui-même des jetons intégrés utiles : `DOCUMENT` (le `Document` courant, à la place de l'objet global `document`), `LOCALE_ID` (la locale active), `PLATFORM_ID` (identifie navigateur vs serveur, à combiner avec `isPlatformBrowser()`). Le même mécanisme de jeton permet aussi de **remplacer une implémentation dans les tests**, sans toucher au code de production.

## Détail

### Pourquoi c'est utile

Une classe fait à la fois office d'implémentation et de clé d'injection (`provide: MonService, useClass: MonService` — d'où le raccourci `providers: [MonService]`). Ce raisonnement s'effondre dès que la clé n'a pas de représentation à l'exécution : une interface, un type union, ou une simple valeur (chaîne, nombre, objet de configuration). `InjectionToken<T>` comble ce manque : il porte le type `T` côté TypeScript (vérification statique à l'injection), et existe comme une valeur réelle à l'exécution (clé de recherche dans l'injecteur).

### Exemple 1 — Configuration typée au bootstrap

```ts
export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

export interface AppConfig {
  urlApi: string;
  nomBoutique: string;
}

bootstrapApplication(App, {
  providers: [
    { provide: APP_CONFIG, useValue: { urlApi: 'https://api.boutique.fr', nomBoutique: 'MaBoutique' } },
  ],
});

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private config = inject(APP_CONFIG);
  private http = inject(HttpClient);

  chargerProduits() {
    return this.http.get<Produit[]>(`${this.config.urlApi}/produits`);
  }
}
```

Sans `factory`, ce jeton n'a pas de valeur par défaut : il **doit** être fourni explicitement quelque part (ici au bootstrap), sinon l'injection échoue avec une `NullInjectorError`.

### Exemple 2 — Jeton avec `factory` (tree-shakable, sans provider explicite)

```ts
export const TAUX_TVA = new InjectionToken<number>('taux.tva', {
  providedIn: 'root',
  factory: () => 0.2,
});

// utilisable directement, sans rien ajouter aux providers
@Injectable({ providedIn: 'root' })
export class FactureService {
  private taux = inject(TAUX_TVA);
}
```

Contrairement à l'exemple précédent, aucun provider explicite n'est nécessaire : `factory` joue ce rôle, exactement comme `providedIn: 'root'` sur un `@Injectable`.

### Exemple 3 — Jetons intégrés : `DOCUMENT` et `PLATFORM_ID`

```ts
@Component({ selector: 'app-export-facture' })
export class ExportFacture {
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  telechargerPdf(contenu: Blob) {
    if (!isPlatformBrowser(this.platformId)) {
      return; // pas de téléchargement possible côté serveur
    }
    const lien = this.document.createElement('a');
    lien.href = URL.createObjectURL(contenu);
    lien.download = 'facture.pdf';
    lien.click();
  }
}
```

Injecter `DOCUMENT` plutôt que d'utiliser la variable globale `document` permet à Angular de fournir la bonne implémentation selon le contexte de rendu (navigateur ou SSR), et rend le code testable (on peut fournir un faux `Document` dans un test).

### Exemple 4 — Remplacer un jeton dans les tests

```ts
TestBed.configureTestingModule({
  providers: [
    { provide: CONFIG_PANIER, useValue: { tvaParDefaut: 0, deviseParDefaut: 'USD' } },
  ],
});

const panier = TestBed.inject(PanierService);
expect(panier.calculerTTC(100)).toBe(100); // TVA à 0 dans ce test
```

Le composant ou service sous test ne sait pas que sa dépendance a été remplacée : il continue d'appeler `inject(CONFIG_PANIER)`, qui renvoie désormais la valeur de test.

### `InjectionToken` avec ou sans `factory`

| | Sans `factory` | Avec `factory` |
|---|---|---|
| Provider nécessaire | Oui, explicitement (`useValue`, `useFactory`…) | Non, sauf pour remplacer la valeur par défaut |
| Tree-shakable | Non | Oui |
| Cas d'usage | Configuration fournie une seule fois au bootstrap, obligatoire | Valeur par défaut raisonnable, remplaçable au besoin |

### Pièges courants

> **Utiliser une interface TypeScript comme jeton.** `{ provide: MonInterface, useClass: ... }` ne compile pas : une interface n'existe pas à l'exécution. Il faut créer un `InjectionToken<MonInterface>` dédié qui, lui, existe comme valeur réelle.

> **Accéder directement à `window` ou `document` dans une application SSR.** Ces objets globaux n'existent pas côté serveur (environnement Node.js) : leur utilisation directe fait planter le rendu SSR, même si tout fonctionne dans le navigateur en développement. Passer par `DOCUMENT` (injecté) et `PLATFORM_ID` + `isPlatformBrowser()` évite le problème.

> **Oublier de fournir un jeton sans `factory`.** Sans valeur par défaut, un `InjectionToken` sans `factory` doit être fourni explicitement quelque part dans l'arbre d'injecteurs, sinon l'injection échoue avec une `NullInjectorError` — sauf si on l'injecte avec `{ optional: true }`.

### À retenir

- `InjectionToken<T>` sert de clé d'injection typée quand une classe ne convient pas : interface, configuration, valeur primitive.
- Une `factory` rend le jeton tree-shakable et évite d'avoir à le déclarer dans un tableau `providers` : calcul paresseux, à la première injection.
- `DOCUMENT`, `LOCALE_ID`, `PLATFORM_ID` sont des jetons intégrés utiles, notamment pour écrire du code compatible SSR (`isPlatformBrowser()`).
- Remplacer un jeton par une valeur de test dans `TestBed.configureTestingModule({ providers: [...] })` ne demande aucune modification du code de production.
