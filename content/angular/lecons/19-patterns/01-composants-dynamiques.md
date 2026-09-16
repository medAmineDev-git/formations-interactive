---
id: composants-dynamiques
chapitre: patterns-avances
ordre: 1
titre: "Créer des composants dynamiquement"
termes:
  - terme: ViewContainerRef
    definition: "Représente un emplacement dans l'arbre de vues où des composants ou des vues peuvent être insérés dynamiquement. On l'obtient par injection (`inject(ViewContainerRef)`) ou via un `viewChild` pointant vers un `<ng-container>` ou une directive ancre."
  - terme: "createComponent()"
    definition: "Méthode de `ViewContainerRef` qui instancie un composant et l'insère dans la vue. Accepte le type du composant et un objet d'options (`injector`, `index`, `projectableNodes`…). Retourne un `ComponentRef`."
  - terme: ComponentRef
    definition: "Handle retourné par `createComponent()`, donnant accès à `instance` (l'instance du composant), `setInput()`, `destroy()`, `onDestroy()` et `location` (l'élément hôte dans le DOM)."
  - terme: "setInput()"
    definition: "Méthode de `ComponentRef` qui met à jour une entrée du composant créé dynamiquement. Contrairement à une affectation directe sur `instance`, elle notifie correctement Angular (marque le composant pour vérification, y compris en `OnPush`)."
  - terme: NgComponentOutlet
    definition: "Directive structurelle qui rend un composant dynamiquement à partir d'un `Type` fourni au template (`ngComponentOutlet`), avec des entrées via `ngComponentOutletInputs`. Alternative déclarative à `createComponent()` pour les cas simples."
  - terme: "Contexte d'injection"
    definition: "Portée dans laquelle `inject()` peut être appelé (constructeur, initialiseur de champ, fonction exécutée via `runInInjectionContext()`…). Un composant créé dynamiquement doit recevoir un `Injector` explicite si on veut lui fournir des dépendances hors de la hiérarchie d'injection standard."
  - terme: "@angular/cdk/dialog"
    definition: "Module du Component Dev Kit fournissant un service `Dialog` prêt à l'emploi (ouverture, fermeture, superposition, gestion du focus, accessibilité) construit au-dessus de `@angular/cdk/overlay`. Évite de réimplémenter `createComponent()` à la main pour des boîtes de dialogue."
quiz:
  - question: "Un composant `NotificationToast` est créé dynamiquement avec `createComponent()`. Il est en `ChangeDetectionStrategy.OnPush`. Que se passe-t-il avec ce code ?"
    code: |
      const ref = this.conteneur.createComponent(NotificationToast);
      ref.instance.message = 'Commande enregistrée'; // affectation directe
    choix:
      - "Le message s'affiche immédiatement, `createComponent()` déclenchant toujours une vérification complète"
      - "L'affectation directe sur `instance` change bien la propriété en mémoire, mais rien ne prévient Angular : avec `OnPush`, l'affichage ne se met pas à jour tant qu'aucun déclencheur reconnu (signal, `setInput()`, `markForCheck()`) ne survient"
      - "Une exception est levée car `instance` est en lecture seule"
      - "Angular détecte automatiquement toute affectation sur un composant fraîchement créé, une seule fois"
    reponse: 1
    explication: "`instance` donne un accès direct à l'objet TypeScript, sans passer par le mécanisme de détection de changements. `setInput()` existe précisément pour ça : il met à jour la valeur **et** marque le composant pour vérification, ce qui est indispensable en `OnPush`."
  - question: "Dans quel cas `NgComponentOutlet` est-il préférable à un appel manuel à `ViewContainerRef.createComponent()` ?"
    choix:
      - "Quand le composant à afficher est connu à l'avance dans le template et que le besoin se limite à afficher un type de composant variable avec quelques entrées, sans logique de cycle de vie personnalisée"
      - "Quand il faut gérer précisément le moment de la destruction, s'abonner à plusieurs sorties, ou passer un injecteur personnalisé complexe"
      - "Uniquement pour les composants standalone, jamais pour les composants historiques d'un `NgModule`"
      - "Jamais : `NgComponentOutlet` est déprécié au profit de `createComponent()`"
    reponse: 0
    explication: "`NgComponentOutlet` est une directive de template déclarative, pratique pour switcher entre plusieurs types de composants selon une condition. Dès qu'il faut un contrôle fin (destruction différée, plusieurs abonnements aux sorties, injecteur sur mesure), l'appel programmatique à `createComponent()` reste plus adapté."
  - question: "Quel risque principal faut-il surveiller après avoir appelé `ViewContainerRef.createComponent()` dans un service (par exemple pour ouvrir une boîte de dialogue) ?"
    choix:
      - "Le composant est automatiquement détruit dès que la méthode qui l'a créé se termine"
      - "Oublier d'appeler `destroy()` (ou de s'abonner à `onDestroy()`) quand le composant doit disparaître : il reste alors dans le DOM et dans l'arbre de vues, ce qui fuit de la mémoire et des écouteurs d'événements"
      - "`createComponent()` ne peut jamais être appelé depuis un service, seulement depuis un composant"
      - "Les entrées passées par `setInput()` sont perdues à la prochaine détection de changements"
    reponse: 1
    explication: "Un composant créé dynamiquement n'est pas détruit automatiquement : c'est au code appelant de retenir le `ComponentRef` et d'appeler `destroy()` au bon moment (fermeture d'une boîte de dialogue, disparition d'une notification…). L'oubli est une fuite de mémoire classique, en particulier pour des composants créés en boucle (une notification par action utilisateur)."
---

## Essentiel

Créer un composant dynamiquement veut dire l'instancier **par code**, sans qu'il apparaisse dans un template : boîte de dialogue de confirmation, système de notifications empilées, ou formulaire dont les champs dépendent d'une configuration reçue à l'exécution (un composant différent par type de champ). Le template classique (`<app-x />`) ne suffit pas quand on ne connaît pas le composant à afficher au moment de la compilation.

L'outil de base est `ViewContainerRef.createComponent()` :

```ts
@Component({ template: `<ng-container #ancre />` })
export class HoteNotifications {
  private ancre = viewChild.required('ancre', { read: ViewContainerRef });

  afficher(message: string) {
    const ref = this.ancre().createComponent(NotificationToast);
    ref.setInput('message', message);       // pas d'affectation directe sur .instance
    ref.instance.fermee.subscribe(() => ref.destroy());
  }
}
```

`setInput()` — pas une affectation directe sur `instance` — pour que le composant en `OnPush` soit correctement notifié. Les sorties (`output()`) s'écoutent directement sur `instance`. Il faut retenir le `ComponentRef` pour appeler `destroy()` le moment venu : rien ne le fait automatiquement.

Pour un cas simple (afficher tel ou tel composant selon une condition, sans logique fine), `NgComponentOutlet` évite d'écrire ce code à la main. Pour des boîtes de dialogue, `@angular/cdk/dialog` (module `Dialog`) fournit une solution complète (superposition, focus, accessibilité) plutôt que de réinventer `createComponent()` à chaque fois.

## Détail

### Comment ça marche

`createComponent(TypeDuComposant, options?)` instancie le composant, exécute son cycle de vie (`ngOnInit`…) et l'insère dans le DOM à l'emplacement du `ViewContainerRef` — donc dans l'arbre de vues d'Angular, avec détection de changements comme n'importe quel autre composant. L'objet `options` accepte notamment `index` (position d'insertion), `injector` (pour fournir des dépendances qui ne remonteraient pas naturellement dans la hiérarchie) et `projectableNodes` (contenu à projeter via `<ng-content>`). Le `ComponentRef` retourné est la seule référence au composant : sans lui, impossible de le détruire proprement ou de lire ses sorties.

### Exemple 1 — Notification empilée depuis un service

```ts
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private conteneur = signal<ViewContainerRef | null>(null);

  enregistrerConteneur(vcr: ViewContainerRef) {
    this.conteneur.set(vcr);
  }

  afficher(message: string, type: 'succes' | 'erreur') {
    const vcr = this.conteneur();
    if (!vcr) return;

    const ref = vcr.createComponent(NotificationToast);
    ref.setInput('message', message);
    ref.setInput('type', type);

    setTimeout(() => ref.destroy(), 4000); // auto-fermeture
  }
}
```

Le composant hôte (typiquement à la racine de l'application) enregistre son `ViewContainerRef` une fois, puis n'importe quel service peut demander l'affichage d'une notification sans connaître `NotificationToast` au moment de la compilation du template racine.

### Exemple 2 — Passer des entrées et écouter des sorties

```ts
const ref = this.conteneur().createComponent(BoiteConfirmation);
ref.setInput('titre', 'Supprimer le produit ?');
ref.setInput('message', `« ${produit.nom} » sera définitivement supprimé.`);

const abonnement = ref.instance.confirme.subscribe((valeur: boolean) => {
  if (valeur) this.produitService.supprimer(produit.id);
  abonnement.unsubscribe();
  ref.destroy();
});
```

Les entrées passent par `setInput()` (une par une), les sorties (`output()` ou `@Output`) s'écoutent directement sur `instance`, comme sur n'importe quelle instance de composant. Penser à se désabonner avant (ou juste après) `destroy()`.

### Exemple 3 — `NgComponentOutlet` pour un cas simple

```ts
@Component({
  imports: [NgComponentOutlet],
  template: `
    <ng-container
      [ngComponentOutlet]="composantActif()"
      [ngComponentOutletInputs]="{ produit: produitSelectionne() }"
    />
  `,
})
export class PanneauDetail {
  composantActif = computed(() =>
    this.produitSelectionne().type === 'numerique' ? FicheProduitNumerique : FicheProduitPhysique,
  );
  produitSelectionne = input.required<Produit>();
}
```

Pas de `ViewContainerRef` explicite, pas de `destroy()` manuel : Angular gère le cycle de vie comme pour n'importe quel élément de template qui apparaît ou disparaît selon une condition.

### Exemple 4 — Injecteur personnalisé et contexte d'injection

```ts
ouvrirEditeur(produit: Produit) {
  const injecteur = Injector.create({
    providers: [{ provide: PRODUIT_COURANT, useValue: produit }],
    parent: this.injector,
  });

  const ref = this.conteneur().createComponent(EditeurProduit, { injector: injecteur });
}
```

Utile quand le composant créé dynamiquement doit recevoir une dépendance (un jeton d'injection, une configuration) qui n'existe pas dans la hiérarchie d'injection par défaut à cet endroit — typiquement un service créé « à la volée » pour cette instance précise.

### Comparatif des approches

| | `createComponent()` manuel | `NgComponentOutlet` | `@angular/cdk/dialog` |
|---|---|---|---|
| Contrôle du cycle de vie | Total (index, injecteur, destruction) | Automatique (lié au template) | Géré par le service `Dialog` |
| Cas d'usage typique | Notifications, formulaire piloté par config | Switch de composant simple dans un template | Boîtes de dialogue, modales |
| Code à écrire | Le plus verbeux | Minimal | Minimal (configuration de l'appel) |
| Accessibilité (focus, superposition) | À la charge du développeur | À la charge du développeur | Fournie (overlay, gestion du focus) |

### Pièges courants

> **Oublier `destroy()`.** Un composant créé dynamiquement n'est jamais nettoyé automatiquement. Sans appel à `destroy()` (ou `onDestroy()` correctement enchaîné), il reste dans le DOM et dans l'arbre de vues — fuite de mémoire classique pour des notifications créées en boucle.

> **Affecter directement `ref.instance.propriete = valeur` au lieu de `setInput()`.** Ça fonctionne visuellement avec la stratégie par défaut (grâce au balayage global), mais casse silencieusement en `OnPush` : rien ne marque le composant pour vérification.

> **Appeler `inject()` en dehors d'un contexte d'injection valide** (par exemple dans une closure passée en callback à une librairie tierce, après la création du composant). Angular lève une erreur (`NG0203`). Solution : injecter au bon endroit (constructeur, champ), ou passer un `Injector` explicite à `createComponent()`.

### À retenir

- `ViewContainerRef.createComponent(Type, options?)` instancie un composant par code et retourne un `ComponentRef`.
- `setInput()` — pas une affectation directe — pour que les entrées soient prises en compte, y compris en `OnPush`.
- Les sorties s'écoutent sur `ref.instance`, le nettoyage passe par `ref.destroy()` — rien n'est automatique.
- `NgComponentOutlet` couvre les cas simples déclaratifs ; `@angular/cdk/dialog` couvre les boîtes de dialogue sans réinventer la gestion de superposition et d'accessibilité.
- Un `Injector` personnalisé, passé en option de `createComponent()`, permet de fournir des dépendances propres à l'instance créée.
