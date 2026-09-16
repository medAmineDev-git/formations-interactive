---
id: accessibilite
chapitre: i18n-a11y
ordre: 3
titre: "Rendre une application accessible"
termes:
  - terme: HTML sémantique
    definition: "Utiliser l'élément dont le sens correspond à son rôle (`<button>` pour une action, `<nav>` pour une navigation, `<label>` pour un champ) plutôt qu'un `<div>` générique. La première base de l'accessibilité : la plupart des comportements attendus (focus, clavier, rôle annoncé) viennent gratuitement avec le bon élément."
  - terme: ARIA
    definition: "*Accessible Rich Internet Applications* : ensemble d'attributs (`role`, `aria-label`, `aria-expanded`, `aria-live`…) qui décrivent le rôle et l'état d'un composant aux technologies d'assistance, utile pour ce que le HTML natif ne peut pas exprimer."
  - terme: "cdkTrapFocus"
    definition: "Directive du CDK Angular (`@angular/cdk/a11y`) qui confine la navigation au clavier (Tab) à l'intérieur d'un élément — indispensable pour une boîte de dialogue modale, afin que le focus ne s'échappe pas vers le contenu masqué derrière."
  - terme: LiveAnnouncer
    definition: "Service du CDK Angular (`@angular/cdk/a11y`) qui annonce un message aux lecteurs d'écran via une zone `aria-live`, pour signaler un changement qui n'a pas nécessairement le focus (résultat de recherche, message de confirmation)."
  - terme: "@angular/aria"
    definition: "Package Angular en **developer preview** depuis la v21.0, encore en évolution et non recommandé pour la production : à surveiller plutôt qu'à adopter tel quel dans du code métier."
  - terme: Gestion du focus
    definition: "Déplacer explicitement le focus clavier vers l'élément pertinent après une action qui change le contenu affiché (navigation de route, ouverture d'une boîte de dialogue) : sans cela, un utilisateur au clavier ou au lecteur d'écran perd le contexte."
  - terme: Contraste
    definition: "Rapport de luminosité entre un texte et son fond, mesuré pour garantir la lisibilité. Les critères WCAG fixent des seuils minimaux (ex. 4.5:1 pour du texte standard) vérifiables avec des outils automatisés."
quiz:
  - question: "Un composant doit se comporter comme un bouton (cliquable, activable au clavier avec Entrée et Espace, annoncé comme « bouton » par un lecteur d'écran). Quelle implémentation demande le moins d'ARIA et de code pour y arriver ?"
    code: |
      <!-- Option A -->
      <div (click)="valider()">Valider</div>

      <!-- Option B -->
      <div role="button" tabindex="0" (click)="valider()" (keydown.enter)="valider()" (keydown.space)="valider()">Valider</div>

      <!-- Option C -->
      <button (click)="valider()">Valider</button>
    choix:
      - "Option A : `(click)` suffit, le reste est automatique dans tous les navigateurs"
      - "Option C : `<button>` natif gère nativement le focus, l'activation clavier (Entrée et Espace) et le rôle annoncé, sans aucun attribut ARIA"
      - "Option B : c'est la seule façon correcte de faire un bouton accessible en Angular"
      - "Les trois options sont strictement équivalentes pour un lecteur d'écran"
    reponse: 1
    explication: "C'est le principe « HTML sémantique avant ARIA » : `<button>` fournit gratuitement tout ce que l'option B doit recréer à la main (focus, activation clavier, rôle). L'option A n'est pas accessible au clavier ni annoncée comme interactive. L'option B fonctionne mais réinvente ce qu'offre déjà l'élément natif — à réserver aux cas où aucun élément HTML ne correspond au composant voulu."
  - question: "Après un clic sur un lien qui déclenche une navigation de route (`routerLink`), un utilisateur au clavier ne sait pas que le contenu de la page a changé : le focus reste visuellement sur le lien cliqué, dans l'en-tête. Quelle est la bonne pratique ?"
    choix:
      - "Ne rien faire : le changement d'URL suffit à informer l'utilisateur"
      - "Déplacer explicitement le focus vers un élément pertinent de la nouvelle vue après la navigation (ex. le titre principal de la page, avec `tabindex=\"-1\"` s'il ne serait pas focusable nativement)"
      - "Recharger complètement la page à chaque navigation pour forcer la réinitialisation du focus"
      - "Ajouter `autofocus` sur le premier champ de formulaire de chaque page, systématiquement"
    reponse: 1
    explication: "Le routeur d'Angular ne déplace pas automatiquement le focus. Une pratique courante consiste à écouter la fin de navigation et à donner le focus au titre principal de la nouvelle vue (rendu focusable avec `tabindex=\"-1\"` si ce n'est pas un élément nativement interactif), ce qui permet à un lecteur d'écran d'annoncer le nouveau contenu et évite qu'un utilisateur au clavier ne perde ses repères."
  - question: "Quel est le rôle de `cdkTrapFocus` sur une boîte de dialogue modale ?"
    choix:
      - "Il annonce l'ouverture de la boîte de dialogue aux lecteurs d'écran"
      - "Il empêche la navigation au clavier (Tab) de sortir de la boîte de dialogue tant qu'elle est ouverte, pour que le focus ne s'échappe pas vers un contenu masqué derrière"
      - "Il ferme automatiquement la boîte de dialogue si l'utilisateur appuie sur Échap"
      - "Il ajoute automatiquement un contraste suffisant au contenu de la boîte de dialogue"
    reponse: 1
    explication: "`cdkTrapFocus` confine la navigation Tab à l'intérieur de l'élément sur lequel il est posé : essentiel pour une modale, sinon un utilisateur au clavier peut tabuler vers des éléments visuellement masqués derrière l'overlay. Annoncer l'ouverture relève plutôt de `LiveAnnouncer` ou d'un `role=\"dialog\"` avec `aria-modal=\"true\"`, et la fermeture au clavier est un comportement à gérer explicitement (souvent déjà fourni par un composant de dialogue comme celui d'Angular Material)."
---

## Essentiel

L'accessibilité (souvent abrégée **a11y**) rend une application utilisable par le plus grand nombre : utilisateurs de lecteur d'écran, navigation au clavier seul, daltonisme, basse vision, obligations légales dans de nombreux pays — et, plus largement, une meilleure qualité générale (structure claire, contraste correct profitent à tout le monde).

Première règle, avant tout attribut ARIA : préférer l'élément HTML **dont le rôle correspond déjà** à ce qu'on construit.

```html
<!-- À éviter : tout est à recréer à la main -->
<div role="button" tabindex="0" (click)="ajouterAuPanier()">Ajouter</div>

<!-- Préférer : le comportement accessible est natif -->
<button (click)="ajouterAuPanier()">Ajouter</button>
```

ARIA (`role`, `aria-label`, `aria-expanded`, `aria-live`…) complète le HTML natif quand un comportement n'a pas d'équivalent sémantique — un onglet personnalisé, un statut annoncé dynamiquement.

La **gestion du focus** est le point le plus souvent oublié : après une navigation de route ou l'ouverture d'une boîte de dialogue, il faut déplacer explicitement le focus clavier vers le nouveau contenu, sinon un utilisateur au clavier ou au lecteur d'écran perd le fil. Le module `@angular/cdk/a11y` fournit des outils prêts à l'emploi pour ça : `cdkTrapFocus` (confiner le focus dans une modale) et `LiveAnnouncer` (annoncer un message aux lecteurs d'écran).

## Détail

### Pourquoi c'est utile

Trois raisons concrètes : des utilisateurs réels dépendent d'un clavier ou d'un lecteur d'écran pour utiliser l'application ; plusieurs juridictions imposent des obligations légales d'accessibilité (secteur public, parfois privé selon les pays) ; et une interface bien structurée profite en général à tout le monde, pas seulement aux personnes en situation de handicap.

### Exemple 1 — ARIA pour ce que le HTML natif ne couvre pas

```html
<button
  (click)="basculerMenu()"
  [attr.aria-expanded]="menuOuvert()"
  aria-controls="menu-compte"
>
  Mon compte
</button>

<ul id="menu-compte" *ngIf="menuOuvert()" role="menu">
  <li role="menuitem"><a routerLink="/commandes">Mes commandes</a></li>
  <li role="menuitem"><a routerLink="/profil">Mon profil</a></li>
</ul>
```

`aria-expanded` indique si le menu est ouvert ou fermé, `aria-controls` relie le bouton à l'élément qu'il pilote : deux informations qu'un lecteur d'écran ne peut pas deviner d'un simple `<button>` et `<ul>`.

### Exemple 2 — Gestion du focus après une navigation de route

```ts
// template : <h1 tabindex="-1" #titrePage>{{ titre() }}</h1><router-outlet />

private router = inject(Router);
titrePage = viewChild.required<ElementRef<HTMLElement>>('titrePage');

constructor() {
  this.router.events
    .pipe(filter((e) => e instanceof NavigationEnd))
    .subscribe(() => this.titrePage().nativeElement.focus());
}
```

`tabindex="-1"` rend le titre **focusable par script** sans l'ajouter à l'ordre de tabulation naturel. Donner le focus au titre à chaque fin de navigation permet à un lecteur d'écran d'annoncer le nouveau contenu.

### Exemple 3 — Confiner le focus dans une boîte de dialogue avec le CDK

```ts
import { Component } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-dialogue-confirmation',
  imports: [A11yModule],
  template: `
    <div role="dialog" aria-modal="true" cdkTrapFocus cdkTrapFocusAutoCapture>
      <h2>Confirmer la suppression</h2>
      <button (click)="annuler()">Annuler</button>
      <button (click)="confirmer()">Confirmer</button>
    </div>
  `,
})
export class DialogueConfirmation {
  annuler() { /* ... */ }
  confirmer() { /* ... */ }
}
```

`cdkTrapFocus` empêche Tab de sortir de la boîte de dialogue ; `cdkTrapFocusAutoCapture` place automatiquement le focus à l'intérieur dès l'apparition de l'élément. `role="dialog"` et `aria-modal="true"` complètent l'information donnée aux technologies d'assistance.

### Exemple 4 — Annoncer un message avec `LiveAnnouncer`

```ts
import { inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

private liveAnnouncer = inject(LiveAnnouncer);

onResultats(nombre: number) {
  this.liveAnnouncer.announce(`${nombre} produits trouvés`);
}
```

Contrairement au focus (qui déplace l'attention vers un élément précis), `LiveAnnouncer` signale une information sans interrompre l'utilisateur — utile pour un résultat de recherche ou un message de confirmation.

### Pièges courants

> **Ajouter `role="button"` sans gérer le clavier.** Un `<div role="button">` sans `tabindex="0"` ni gestion de `Enter`/`Espace` est annoncé comme un bouton par un lecteur d'écran, mais reste inutilisable au clavier — pire qu'un simple `<div>` sans rôle, car il crée une fausse attente. Si un élément interactif natif (`<button>`, `<a>`) peut faire le travail, il évite ce piège par construction.

> **Oublier le focus après un changement de vue ou une action.** Une navigation de route, l'ouverture d'une boîte de dialogue ou la disparition d'un panneau sans déplacement explicite du focus laisse un utilisateur clavier « perdu » sur un élément qui n'existe peut-être plus, ou n'a plus de sens dans le nouveau contexte.

> **Se fier uniquement à la couleur, ou à un contraste insuffisant.** Un message d'erreur signalé seulement par du texte rouge, ou un texte gris clair sur fond blanc, échoue pour les utilisateurs daltoniens ou malvoyants. Un contraste suffisant (vérifiable avec un outil automatisé) et un second indice que la couleur seule (icône, texte, soulignement) sont nécessaires.

### Outillage et vérification

- **Navigation au clavier manuelle** (Tab / Maj+Tab / Entrée / Échap, sans souris) pour repérer les pièges à focus et les éléments inatteignables.
- **Lecteur d'écran** (NVDA, VoiceOver) sur les parcours critiques (formulaire, panier, paiement) : seul moyen de vérifier ce qui est réellement *annoncé*, pas seulement ce qui est visuellement correct.
- **axe DevTools** et **Lighthouse** : audits automatisés, utiles en continu (y compris en intégration continue pour Lighthouse), mais ne remplacent pas un test manuel — un outil automatisé ne peut pas juger si un texte alternatif est pertinent.
- **`@angular/aria`** : package encore en **developer preview** en Angular 21 (depuis la v21.0), présenté comme une évolution à venir, pas comme un outil prêt pour la production. En attendant, `@angular/cdk/a11y` reste l'outil stable pour la gestion du focus et les annonces aux lecteurs d'écran.

### À retenir

- HTML sémantique **avant** ARIA : un élément natif (`<button>`, `<nav>`, `<label>`) fournit gratuitement rôle, focus et activation clavier.
- ARIA (`role`, `aria-expanded`, `aria-live`…) complète ce que le HTML natif ne peut pas exprimer, jamais à la place d'un élément natif adapté.
- Gérer le focus explicitement après une navigation de route ou l'ouverture d'une boîte de dialogue : `@angular/cdk/a11y` fournit `cdkTrapFocus` (confiner le focus) et `LiveAnnouncer` (annoncer un message).
- Vérifier le contraste et tester au zoom, pas uniquement au clavier ou avec un outil automatisé.
- `@angular/aria` est en developer preview en v21 : à suivre, pas encore à utiliser en production. Tester avec un vrai lecteur d'écran reste indispensable, en complément d'axe DevTools et Lighthouse.
