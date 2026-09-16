---
id: providers-portees
chapitre: etat
ordre: 2
titre: "Portée d'un service : root, composant, route"
termes:
  - terme: "providedIn: 'root'"
    definition: "Enregistre le service auprès de l'**injecteur racine** de l'application : une seule instance, partagée par tout le monde, créée à la première injection (**tree-shakable** : absente du bundle si jamais injectée)."
  - terme: "providers (composant)"
    definition: "Un tableau `providers` déclaré dans `@Component({ providers: [...] })` crée une **nouvelle instance** du service pour ce composant et ses descendants. Chaque instance du composant obtient sa propre instance du service."
  - terme: "providers (route)"
    definition: "Un tableau `providers` déclaré sur une entrée de `Routes` crée un injecteur propre à cette route (et ses routes filles) : l'état est partagé par toute la fonctionnalité, et détruit quand on quitte la route."
  - terme: Hiérarchie des injecteurs
    definition: "Angular cherche un service en remontant d'injecteur en injecteur (composant → composants ancêtres → route → racine). Le premier injecteur qui a un provider pour ce service fournit l'instance : c'est la portée la plus proche qui gagne."
  - terme: "providedIn: 'platform' / 'any'"
    definition: "`'platform'` : instance partagée entre plusieurs applications Angular sur la même page (cas rare). `'any'` : une instance distincte par point d'entrée chargé paresseusement (`loadChildren`/`loadComponent`), utile pour un état qui ne doit pas fuiter d'une fonctionnalité à l'autre."
  - terme: Durée de vie de l'état
    definition: "L'état d'un service vit aussi longtemps que l'injecteur qui l'a créé. Un service `root` vit pour toute la session applicative ; un service fourni par un composant ou une route est détruit avec lui."
quiz:
  - question: "Dans ce contexte, combien d'instances de `AssistantAchatService` existent si trois `<app-fiche-produit>` sont affichées en même temps ?"
    code: |
      @Component({
        selector: 'app-fiche-produit',
        providers: [AssistantAchatService],
      })
      export class FicheProduit { /* ... */ }
    choix:
      - "Une seule, partagée par les trois composants, comme avec `providedIn: 'root'`"
      - "Trois instances : une par composant, car `providers` au niveau du composant en crée une nouvelle pour chaque instance"
      - "Zéro, car `providers` sur un composant n'a d'effet que sur les composants enfants, jamais sur lui-même"
      - "Une erreur au démarrage : un service ne peut être fourni qu'au niveau racine"
    reponse: 1
    explication: "`providers` déclaré sur un composant crée une nouvelle instance du service pour **chaque instance** de ce composant (et ses descendants) : trois `<app-fiche-produit>` affichées donnent trois instances indépendantes d'`AssistantAchatService`, chacune avec son propre état."
  - question: "Une équipe fournit un `CatalogueFiltresStore` dans les `providers` de la route `/catalogue` (avec des routes filles `/catalogue/liste` et `/catalogue/carte`). Que se passe-t-il pour l'état des filtres ?"
    choix:
      - "Il est réinitialisé à chaque changement de route, même entre `/catalogue/liste` et `/catalogue/carte`"
      - "Il est partagé entre `/catalogue/liste` et `/catalogue/carte` (même injecteur de route), et détruit quand on quitte complètement `/catalogue`"
      - "Il devient un singleton global, comme s'il avait été fourni en `root`"
      - "Il n'est accessible que depuis le composant racine de la route, pas depuis ses enfants"
    reponse: 1
    explication: "Un `providers` déclaré sur une route crée un injecteur partagé par cette route et toutes ses routes filles : naviguer entre `/catalogue/liste` et `/catalogue/carte` garde la même instance du store (donc les mêmes filtres), qui n'est détruite qu'en quittant `/catalogue` entièrement. C'est le bon niveau pour un état propre à une fonctionnalité, sans le polluer avec `root`."
  - question: "Quel est le piège classique d'un service d'état utilisateur déclaré avec `providedIn: 'root'` ?"
    choix:
      - "Il ne peut jamais être injecté dans un composant standalone"
      - "Comme il vit pour toute la session applicative, son état (ex. profil, panier) reste en mémoire après une déconnexion si rien ne le réinitialise explicitement — le prochain utilisateur peut voir des données de l'ancien"
      - "Il empêche l'application de fonctionner en mode zoneless"
      - "Angular en crée une nouvelle instance à chaque navigation, ce qui casse la réactivité des signaux"
    reponse: 1
    explication: "`providedIn: 'root'` crée un singleton pour toute la durée de vie de l'application, pas seulement pour la session d'un utilisateur connecté. Sans remise à zéro explicite à la déconnexion (une méthode `reinitialiser()` appelée par le service d'authentification, par exemple), l'état d'un utilisateur peut rester visible après sa déconnexion — un vrai risque, y compris de confidentialité."
---

## Essentiel

Un service Angular n'est pas forcément un singleton global : sa **portée** dépend d'où il est fourni (`providers`), et détermine combien d'instances existent et combien de temps chacune vit.

- **`providedIn: 'root'`** (dans `@Injectable`) : une seule instance pour toute l'application, tree-shakable. Le bon choix pour un état vraiment global (utilisateur connecté, panier).
- **`providers` sur un composant** : une nouvelle instance par instance du composant. Utile pour un état **local à un composant complexe**, partagé par ses enfants mais pas par le reste de l'app (un assistant d'achat par fiche produit, un état de formulaire multi-étapes).
- **`providers` sur une route** : une instance partagée par une route et ses routes filles, détruite en quittant cette branche. Le bon niveau pour un état propre à une **fonctionnalité** (filtres du catalogue, état d'un tunnel de commande).

```ts
// Root : singleton applicatif
@Injectable({ providedIn: 'root' })
export class UtilisateurStore { /* ... */ }

// Composant : une instance par instance du composant
@Component({
  selector: 'app-fiche-produit',
  providers: [AssistantAchatService],
})
export class FicheProduit { /* ... */ }

// Route : une instance partagée par la fonctionnalité
export const routes: Routes = [
  {
    path: 'catalogue',
    providers: [CatalogueFiltresStore],
    children: [
      { path: 'liste', loadComponent: () => import('./catalogue-liste').then(m => m.CatalogueListe) },
      { path: 'carte', loadComponent: () => import('./catalogue-carte').then(m => m.CatalogueCarte) },
    ],
  },
];
```

Angular résout un service en remontant la **hiérarchie des injecteurs** : composant demandeur, composants ancêtres, injecteur de la route active, puis injecteur racine. Le premier niveau qui fournit le service l'emporte.

## Détail

### Comment ça marche

Chaque composant possède potentiellement son propre injecteur (créé seulement s'il déclare des `providers`), tout comme chaque route peut créer un injecteur d'environnement partagé par ses routes filles. Quand un composant injecte un service (`inject(MonService)`), Angular part de l'injecteur du composant et remonte : composant → composants parents → injecteur de la route active → injecteur racine. Dès qu'un niveau a un provider pour ce service, c'est cette instance-là qui est utilisée — et c'est elle qui sera partagée par tous les descendants, sauf si un descendant re-déclare son propre `providers` pour le même service (auquel cas il masque le parent et obtient sa propre instance).

### Exemple 1 — État global : l'utilisateur connecté

```ts
@Injectable({ providedIn: 'root' })
export class UtilisateurStore {
  private _utilisateur = signal<Utilisateur | null>(null);
  readonly utilisateur = this._utilisateur.asReadonly();
  readonly estConnecte = computed(() => this._utilisateur() !== null);

  connecter(utilisateur: Utilisateur): void {
    this._utilisateur.set(utilisateur);
  }

  deconnecter(): void {
    this._utilisateur.set(null); // remise à zéro explicite
  }
}
```

Un seul `UtilisateurStore` pour toute l'application : peu importe le composant qui l'injecte, c'est toujours la même instance.

### Exemple 2 — État local à un composant : un assistant d'achat par fiche produit

```ts
@Injectable()
export class AssistantAchatService {
  private _etapeCourante = signal(0);
  readonly etapeCourante = this._etapeCourante.asReadonly();

  suivant(): void {
    this._etapeCourante.update(e => e + 1);
  }
}

@Component({
  selector: 'app-fiche-produit',
  providers: [AssistantAchatService], // une instance par <app-fiche-produit>
})
export class FicheProduit {
  private assistant = inject(AssistantAchatService);
}
```

Notez l'absence de `providedIn: 'root'` sur `@Injectable()` : ce service n'a de sens que fourni explicitement par un composant, jamais en global.

### Exemple 3 — État partagé par une fonctionnalité : les filtres du catalogue

```ts
@Injectable()
export class CatalogueFiltresStore {
  private _texte = signal('');
  private _categorie = signal<string | null>(null);
  readonly texte = this._texte.asReadonly();
  readonly categorie = this._categorie.asReadonly();

  filtrerParTexte(texte: string): void {
    this._texte.set(texte);
  }

  filtrerParCategorie(categorie: string | null): void {
    this._categorie.set(categorie);
  }
}

export const routesCatalogue: Routes = [
  {
    path: '',
    providers: [CatalogueFiltresStore],
    children: [
      { path: '', component: CatalogueListe },
      { path: 'carte', component: CatalogueCarte },
    ],
  },
];
```

`CatalogueListe` et `CatalogueCarte` partagent la même instance de `CatalogueFiltresStore` (donc les mêmes filtres), qui disparaît dès qu'on quitte la section catalogue — pas besoin de la réinitialiser manuellement.

### Comparatif des portées

| Portée | Où déclarer | Instances | Durée de vie | Cas d'usage |
|---|---|---|---|---|
| `root` | `@Injectable({ providedIn: 'root' })` | 1 pour toute l'app | Toute la session applicative | Utilisateur connecté, panier, préférences |
| Composant | `providers` sur `@Component` | 1 par instance du composant | Liée au composant | État interne d'un composant complexe réutilisé plusieurs fois |
| Route | `providers` sur une entrée `Routes` | 1 par activation de la route | Le temps de rester sur la route (et ses filles) | État propre à une fonctionnalité (filtres, tunnel d'achat) |
| `platform` | `providedIn: 'platform'` | 1 par page (multi-apps) | Vie de la page | Cas rare, plusieurs apps Angular coexistantes |
| `any` | `providedIn: 'any'` | 1 par point d'entrée lazy | Vie du module lazy | État isolé par fonctionnalité chargée paresseusement |

### Pièges courants

> **Un service `root` qui garde l'état d'un utilisateur déconnecté.** `providedIn: 'root'` vit aussi longtemps que l'application, pas que la session d'un utilisateur. Sans remise à zéro explicite à la déconnexion, le panier ou le profil du précédent utilisateur peuvent rester visibles pour le suivant sur le même appareil. Toujours prévoir une méthode de réinitialisation appelée par le flux de déconnexion.

> **Croire qu'un `providers` de route se réinitialise à chaque navigation interne.** Un service fourni sur une route est partagé par **toutes ses routes filles** : naviguer de `/catalogue/liste` à `/catalogue/carte` garde le même état. Il n'est détruit qu'en quittant la branche de routes concernée.

> **Oublier `providedIn: 'root'` sur un service censé être global.** Sans `providedIn` ni déclaration dans un tableau `providers`, Angular refuse d'injecter le service (erreur `NullInjectorError`). Décider explicitement de la portée fait partie de la conception du service, pas un détail.

### À retenir

- La portée d'un service dépend d'où il est **fourni** (`providedIn`, ou `providers` sur un composant/une route), pas de sa définition seule.
- `root` : singleton applicatif. Composant : une instance par instance de composant. Route : une instance par fonctionnalité (partagée par les routes filles).
- La résolution remonte la hiérarchie des injecteurs ; le niveau le plus proche qui fournit le service l'emporte.
- Un état `root` qui doit disparaître à un moment donné (déconnexion) a besoin d'une remise à zéro explicite — ce n'est jamais automatique.
- `providedIn: 'any'` isole un état par fonctionnalité chargée paresseusement ; `'platform'` reste un cas marginal.
