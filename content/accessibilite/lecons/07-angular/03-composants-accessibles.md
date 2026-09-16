---
id: composants-accessibles
chapitre: angular-a11y
ordre: 3
titre: "Composants et formulaires accessibles"
termes:
  - terme: "Dialog (@angular/cdk/dialog)"
    definition: "Service `Dialog` (`@angular/cdk/dialog`) pour ouvrir une boîte de dialogue accessible sans la construire à la main : rôle `dialog`/`alertdialog`, piège à focus et restitution du focus au déclencheur sont gérés par défaut à l'ouverture et à la fermeture."
  - terme: "FocusKeyManager"
    definition: "Classe du CDK (`@angular/cdk/a11y`) qui implémente la navigation clavier d'une liste d'éléments **focusables** (flèches, Origine/Fin) : la brique derrière un composant d'onglets ou de menu qui suit le motif ARIA correspondant."
  - terme: LiveAnnouncer
    definition: "Service `@angular/cdk/a11y` qui pousse un message dans une zone `aria-live` invisible, pour annoncer un événement qui n'a pas le focus — un article ajouté au panier, un nombre de résultats après filtrage."
  - terme: "aria-describedby / aria-invalid"
    definition: "`aria-describedby` relie un champ à l'identifiant d'un élément qui le décrit (message d'aide ou d'erreur) ; `aria-invalid=\"true\"` signale qu'un champ est en erreur. Les deux se pilotent dynamiquement dans Angular via des liaisons de propriété sur des signaux d'état du formulaire."
  - terme: "@angular/aria"
    definition: "Package en **developer preview** depuis Angular 21.0, développé par l'équipe Angular Material : directives headless (sans style par défaut) implémentant des motifs ARIA courants (onglets, accordéon, liste, menu, arbre…) au-dessus du CDK. À suivre, pas encore recommandé pour du code de production sans réévaluation régulière de sa stabilité."
quiz:
  - question: "Pourquoi préférer `@angular/cdk/dialog` (service `Dialog`) à une modale codée à la main avec `@if` et une `<div class=\"overlay\">` ?"
    choix:
      - "Parce que `@if` ne peut pas afficher de contenu superposé au reste de la page"
      - "Parce que `Dialog` gère par défaut ce qu'une modale accessible doit implémenter (rôle, piège à focus, focus initial, restitution du focus à la fermeture), évitant de recoder ces comportements et d'oublier un cas limite"
      - "Parce qu'une modale codée à la main ne peut jamais contenir de formulaire"
      - "Parce que `@if` recharge la page à chaque bascule d'affichage"
    reponse: 1
    explication: "Une modale accessible doit gérer plusieurs comportements en même temps (rôle `dialog`, confinement du Tab, focus initial cohérent, restitution du focus au déclencheur, fermeture propre) : `Dialog` les fournit par défaut et testés, alors qu'une implémentation maison avec `@if` et une `<div>` doit tout recréer et oublie facilement un cas (souvent la restitution du focus à la fermeture)."
  - question: "À quoi sert `FocusKeyManager` dans un composant d'onglets personnalisé ?"
    choix:
      - "À styler visuellement l'onglet actif avec une couleur différente"
      - "À implémenter la navigation clavier (flèches) entre les onglets, en déplaçant le focus réel d'un onglet focusable à l'autre selon le motif ARIA attendu pour ce type de composant"
      - "À générer automatiquement les identifiants `aria-controls` entre chaque onglet et son panneau"
      - "À remplacer `[tabindex]` par un attribut équivalent plus performant"
    reponse: 1
    explication: "`FocusKeyManager` gère la mécanique de navigation clavier (flèches, Origine/Fin) attendue par le motif ARIA « onglets » : à chaque appui, il déplace le focus réel vers l'élément suivant/précédent de la liste qu'on lui a fournie. Les identifiants `aria-controls`, `aria-selected` et le style visuel restent à la charge du composant qui l'utilise."
  - question: "Un formulaire de paiement affiche une erreur sous un champ, mais sans relier les deux avec `aria-describedby` ni poser `aria-invalid`. Quel est le problème pour un utilisateur de lecteur d'écran qui navigue de champ en champ ?"
    code: |
      <label for="cvv">Code de sécurité</label>
      <input id="cvv" [formControl]="cvvControl" />
      @if (cvvControl.invalid && cvvControl.touched) {
        <p class="erreur">Code de sécurité invalide</p>
      }
    choix:
      - "Aucun problème : le message d'erreur est visible juste sous le champ, donc accessible à tous"
      - "Le champ n'est signalé ni invalide (`aria-invalid`), ni relié à son message d'erreur (`aria-describedby`) : un lecteur d'écran qui se place sur le champ ne lit que « Code de sécurité », sans mention de l'erreur ni de sa description, même si le message est visible à l'écran"
      - "Le problème vient uniquement de l'usage de `[formControl]` plutôt que de `[(ngModel)]`"
      - "Le `<label for=\"cvv\">` est inutile puisque le message d'erreur suit visuellement le champ"
    reponse: 1
    explication: "La proximité visuelle entre un champ et son message d'erreur ne crée aucune relation pour une technologie d'assistance. Sans `aria-describedby` pointant vers l'identifiant du message et sans `aria-invalid=\"true\"`, un lecteur d'écran annonce seulement le libellé du champ (« Code de sécurité ») en se plaçant dessus, sans jamais mentionner l'erreur — sauf à ce que l'utilisateur explore ensuite le contenu environnant, ce qu'il n'a aucune raison de faire s'il n'est pas prévenu."
---

## Essentiel

Construire un composant riche (modale, onglets, accordéon) accessible « à la main » demande de recréer plusieurs comportements à la fois : rôle ARIA correct, piège à focus, navigation clavier conforme au motif attendu, restitution du focus. C'est long et facile à faire à moitié. Angular fournit des briques pour éviter de tout recoder :

```ts
import { Dialog } from '@angular/cdk/dialog';

@Component({ /* ... */ })
export class Panier {
  private dialog = inject(Dialog);

  confirmerSuppression(ligne: LigneCommande) {
    const ref = this.dialog.open<boolean>(DialogueConfirmation, {
      ariaLabel: `Confirmer la suppression de ${ligne.produit}`,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    ref.closed.subscribe((confirme) => confirme && this.supprimer(ligne));
  }
}
```

`Dialog` (`@angular/cdk/dialog`) gère par défaut le rôle `dialog`, le confinement du focus et sa restitution au déclencheur à la fermeture — le développeur fournit le contenu et la logique métier, pas la mécanique d'accessibilité.

Pour un composant composite (onglets, menu), le motif ARIA correspondant impose une navigation clavier précise (flèches plutôt que Tab entre les éléments) : `FocusKeyManager` (`@angular/cdk/a11y`) l'implémente. Pour annoncer un événement sans déplacer le focus (article ajouté au panier, résultats filtrés), `LiveAnnouncer`.

Dans un formulaire, l'accessibilité tient à trois liaisons : `<label for>` vers un identifiant unique, `aria-describedby` reliant le champ à son message d'erreur, et `aria-invalid` signalant l'état invalide — les trois pilotables dynamiquement depuis l'état du formulaire.

## Détail

### Exemple 1 — Un composant d'onglets suivant le motif ARIA, avec `FocusKeyManager`

```ts
import { AfterViewInit, Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FocusKeyManager } from '@angular/cdk/a11y';

interface OngletFocusable {
  element: ElementRef<HTMLElement>;
  focus(): void;
}

@Component({
  selector: 'app-onglets-commande',
  template: `
    <div role="tablist" aria-label="Étapes de la commande" (keydown)="clavier.onKeydown($event)">
      @for (onglet of onglets; track onglet.id) {
        <button
          role="tab"
          [id]="'onglet-' + onglet.id"
          [attr.aria-selected]="onglet.id === selection()"
          [attr.aria-controls]="'panneau-' + onglet.id"
          [tabindex]="onglet.id === selection() ? 0 : -1"
          (click)="selectionner(onglet.id)"
        >
          {{ onglet.libelle }}
        </button>
      }
    </div>
  `,
})
export class OngletsCommande implements AfterViewInit {
  @ViewChildren('button') boutons!: QueryList<ElementRef<HTMLElement>>;
  private clavier!: FocusKeyManager<OngletFocusable>;

  ngAfterViewInit() {
    // clavier = new FocusKeyManager(itemsFocusables).withWrap().withHomeAndEnd();
  }
}
```

`FocusKeyManager` prend en charge le déplacement du focus réel entre les onglets au clavier (flèches, `withHomeAndEnd()` pour Origine/Fin, `withWrap()` pour boucler). Le composant reste responsable de `role="tablist"`/`role="tab"`, `aria-selected`, `aria-controls` et du `tabindex` en **roving tabindex** (seul l'onglet sélectionné est à `0`, les autres à `-1`) — le motif ARIA « onglets » l'exige pour que Tab sorte du groupe en une seule étape plutôt que de le traverser onglet par onglet.

### Exemple 2 — `LiveAnnouncer` pour un événement sans focus

```ts
import { inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

private liveAnnouncer = inject(LiveAnnouncer);

ajouterAuPanier(produit: Produit) {
  this.panierService.ajouter(produit);
  this.liveAnnouncer.announce(`${produit.nom} ajouté au panier`, 'polite');
}

appliquerFiltre(criteres: FiltresCatalogue) {
  const resultats = this.catalogueService.filtrer(criteres);
  this.liveAnnouncer.announce(`${resultats.length} produits trouvés`, 'polite');
}
```

Le focus reste sur le bouton « Ajouter » ou sur le champ de filtre — l'utilisateur continue son parcours — pendant qu'un message annonce discrètement le résultat de l'action. `'polite'` attend que le lecteur d'écran finisse ce qu'il est en train de lire ; `'assertive'` interrompt immédiatement, à réserver aux messages réellement urgents (erreur bloquante).

### Exemple 3 — Formulaire réactif : identifiant, `aria-describedby`, `aria-invalid`, focus sur la première erreur

```ts
@Component({
  selector: 'app-formulaire-livraison',
  template: `
    <form [formGroup]="formulaire" (ngSubmit)="valider()">
      <label for="code-postal">Code postal</label>
      <input
        id="code-postal"
        formControlName="codePostal"
        [attr.aria-invalid]="champInvalide('codePostal')"
        [attr.aria-describedby]="champInvalide('codePostal') ? 'erreur-code-postal' : null"
      />
      @if (champInvalide('codePostal')) {
        <p id="erreur-code-postal" class="erreur">Code postal à 5 chiffres requis</p>
      }

      <button type="submit">Valider la livraison</button>
    </form>
  `,
})
export class FormulaireLivraison {
  formulaire = inject(FormBuilder).group({
    codePostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
  });

  champInvalide(nom: string) {
    const controle = this.formulaire.get(nom);
    return !!controle && controle.invalid && controle.touched;
  }

  valider() {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      this.liveAnnouncer.announce('Le formulaire contient des erreurs', 'assertive');
      this.premierChampInvalide()?.nativeElement.focus();
      return;
    }
    // ...
  }
}
```

Trois éléments travaillent ensemble : `id="code-postal"` unique référencé par `label for` **et** par `aria-describedby` du message d'erreur, `aria-invalid` recalculé depuis l'état du contrôle, et à la soumission un focus explicite vers le premier champ en erreur (via une référence obtenue par `viewChild`/`viewChildren`, non détaillée ici) accompagné d'une annonce `LiveAnnouncer`. Sans ce dernier point, un utilisateur qui soumet un formulaire long ne sait pas qu'une erreur existe tant qu'il n'a pas fait défiler la page.

### `@angular/aria` : où ça en est en v21

Le package `@angular/aria`, développé par l'équipe Angular Material, propose des directives **headless** (sans style visuel imposé) qui implémentent des motifs ARIA courants — onglets, accordéon, liste, menu, arbre, combobox, entre autres — au-dessus du CDK : gestion du clavier, des attributs ARIA et du focus fournie par la directive, style et structure HTML laissés à l'application. L'objectif rejoint l'exemple 1 (onglets) de cette leçon, en plus générique. En v21, le package est en **developer preview** : intéressant à explorer, mais à ne pas généraliser dans du code de production sans revérifier sa stabilité au fil des versions — `@angular/cdk/a11y` (`FocusKeyManager`, `LiveAnnouncer`, `Dialog`) reste la base stable pour construire ce même type de composant aujourd'hui.

### Pièges courants

> **Recoder une modale sans piège à focus ni restitution.** Une `<div class="overlay">` conditionnée par `@if`, sans `cdkTrapFocus` ni équivalent, laisse le Tab s'échapper vers le contenu masqué derrière, et le focus se perd à la fermeture. `Dialog` ou `A11yModule` évitent d'oublier ces cas.

> **Un composant d'onglets qui ne gère que le clic.** Sans `role="tablist"`/`role="tab"`, sans navigation aux flèches et sans roving tabindex, le composant fonctionne à la souris mais ne respecte pas le motif ARIA attendu par les utilisateurs de lecteur d'écran habitués à ce composant.

> **Un message d'erreur visible mais non relié au champ.** `class="erreur"` sous un `<input>` sans `aria-describedby` ni `aria-invalid` : l'erreur est là visuellement, mais un lecteur d'écran positionné sur le champ ne la mentionne pas.

### À retenir

- `Dialog` (`@angular/cdk/dialog`) gère par défaut rôle, piège à focus et restitution du focus : à préférer à une modale reconstruite à la main.
- `FocusKeyManager` implémente la navigation clavier d'un composant composite (onglets, menu) conforme au motif ARIA attendu ; le roving tabindex (un seul élément à `tabindex="0"`) reste à gérer par le composant.
- `LiveAnnouncer` annonce un événement sans déplacer le focus ; `'polite'` par défaut, `'assertive'` réservé à l'urgent.
- Un formulaire accessible relie `label for`, identifiant, `aria-describedby` et `aria-invalid`, et déplace le focus vers la première erreur à la soumission.
- `@angular/aria` (developer preview en v21) généralise cette approche pour d'autres motifs ; `@angular/cdk/a11y` reste la base stable en attendant.
