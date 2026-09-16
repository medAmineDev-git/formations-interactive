---
id: directives
chapitre: composition
ordre: 3
titre: "Les directives"
termes:
  - terme: "@Directive"
    definition: "Décorateur qui définit une directive : une classe qui ajoute un comportement à un élément existant, sans créer de nouvel élément visuel (contrairement à `@Component`, une directive n'a pas de template). Standalone par défaut, comme les composants."
  - terme: "host"
    definition: "Propriété du décorateur `@Directive` (ou `@Component`) qui déclare des liaisons sur l'élément hôte : classes, styles, attributs, écouteurs d'événements. Remplace l'usage de `@HostBinding`/`@HostListener` pour le nouveau code."
  - terme: Directive d'attribut
    definition: "Directive appliquée comme un attribut sur un élément existant (`<div appSurbrillance>`), qui modifie son apparence ou son comportement sans changer la structure du DOM autour."
  - terme: Directive structurelle
    definition: "Directive qui ajoute, retire ou répète des éléments du DOM en s'appuyant sur un `TemplateRef` et un `ViewContainerRef`. `@if` et `@for` remplacent aujourd'hui les cas d'usage les plus courants (anciennement `*ngIf`, `*ngFor`) ; écrire sa propre directive structurelle reste utile pour des besoins spécifiques (permissions, feature flags)."
  - terme: "TemplateRef / ViewContainerRef"
    definition: "`TemplateRef` référence un fragment de template non rendu (le contenu porté par la directive structurelle). `ViewContainerRef` représente l'endroit du DOM où l'insérer : `createEmbeddedView(templateRef)` l'affiche, `clear()` le retire."
  - terme: "hostDirectives"
    definition: "Propriété du décorateur `@Component`/`@Directive` qui permet de **composer** une directive existante dans un composant, en réutilisant son comportement (et éventuellement certaines de ses entrées/sorties) sans héritage ni duplication de code."
quiz:
  - question: "Que fait cette directive appliquée à `<p appSurbrillance>`?"
    code: |
      @Directive({
        selector: '[appSurbrillance]',
        host: {
          '(mouseenter)': 'actif.set(true)',
          '(mouseleave)': 'actif.set(false)',
          '[class.surligne]': 'actif()',
        },
      })
      export class Surbrillance {
        protected actif = signal(false);
      }
    choix:
      - "Elle ajoute la classe CSS `surligne` à l'élément pendant que la souris est dessus"
      - "Elle remplace le contenu de `<p>` par un autre template au survol"
      - "Elle ne fait rien : `host` ne fonctionne que dans `@Component`"
      - "Elle ajoute un nouvel élément `<p>` au DOM à chaque survol"
    reponse: 0
    explication: "`host` déclare ici deux écouteurs (`mouseenter`/`mouseleave`) qui modifient un signal, et une liaison de classe (`[class.surligne]`) qui reflète ce signal sur l'élément hôte. C'est une directive d'**attribut** : elle modifie le comportement de l'élément existant, elle n'ajoute ni ne retire d'élément du DOM."
  - question: "Pour créer une directive structurelle personnalisée `*appSiRole=\"'admin'\"` qui n'affiche son contenu que si l'utilisateur a le rôle donné, quelles dépendances faut-il injecter ?"
    choix:
      - "ElementRef et Renderer2"
      - "TemplateRef et ViewContainerRef"
      - "ChangeDetectorRef uniquement"
      - "ComponentFactoryResolver et Injector"
    reponse: 1
    explication: "Une directive structurelle a besoin du `TemplateRef` (le contenu porté par `*appSiRole`, à afficher ou non) et du `ViewContainerRef` (l'endroit du DOM où l'insérer via `createEmbeddedView()`, ou d'où le retirer via `clear()`)."
  - question: "Pourquoi préférer `hostDirectives` à l'héritage de classe pour réutiliser le comportement d'une directive `Deplacable` (drag and drop) dans plusieurs composants ?"
    choix:
      - "`hostDirectives` est plus rapide à l'exécution que l'héritage"
      - "`hostDirectives` compose un comportement existant sans modifier la hiérarchie de classes ni dupliquer son code, et permet d'exposer sélectivement ses entrées/sorties"
      - "L'héritage de classe est interdit entre deux composants Angular"
      - "`hostDirectives` fonctionne uniquement avec les directives structurelles"
    reponse: 1
    explication: "L'héritage lie fortement deux classes et complique la réutilisation de plusieurs comportements à la fois (on n'hérite que d'une seule classe). `hostDirectives` applique une ou plusieurs directives existantes à un composant, en choisissant quelles entrées/sorties exposer, ce qui rapproche Angular d'une composition de comportements plutôt que d'une hiérarchie rigide."
---

## Essentiel

Une **directive** ajoute un comportement à un élément existant, sans template propre (contrairement à un composant). On distingue deux familles.

**Directive d'attribut** : modifie l'apparence ou le comportement d'un élément.

```ts
@Directive({
  selector: '[appSurbrillance]',
  host: {
    '(mouseenter)': 'actif.set(true)',
    '(mouseleave)': 'actif.set(false)',
    '[class.surligne]': 'actif()',
  },
})
export class Surbrillance {
  protected actif = signal(false);
}
```

```html
<p appSurbrillance>Survolez-moi</p>
```

**Directive structurelle** : ajoute, retire ou répète des éléments du DOM, à l'aide d'un `TemplateRef` (le contenu) et d'un `ViewContainerRef` (où l'insérer). Pour l'immense majorité des cas, le contrôle de flux intégré (`@if`, `@for`, `@switch`) remplace aujourd'hui les anciennes directives `*ngIf`/`*ngFor`/`*ngSwitch`, **dépréciées depuis Angular 20** mais toujours fonctionnelles. Écrire sa propre directive structurelle reste utile pour des besoins métier spécifiques (afficher un contenu selon un rôle, une feature flag...).

`hostDirectives` permet de composer une directive existante dans un composant, sans héritage.

## Détail

### Comment ça marche

Une directive est une classe décorée `@Directive`, avec un `selector` qui cible des éléments par attribut (`[appSurbrillance]`), et une propriété `host` qui déclare les liaisons sur l'élément porteur : classes (`[class.x]`), styles (`[style.x]`), attributs (`[attr.x]`) et écouteurs d'événements (`(evt)`). Standalone par défaut, elle s'ajoute au tableau `imports` du composant qui l'utilise, exactement comme un composant.

### Exemple 1 — Directive d'attribut avec entrée

```ts
// surbrillance.ts
import { Directive, input, signal } from '@angular/core';

@Directive({
  selector: '[appSurbrillance]',
  host: {
    '(mouseenter)': 'actif.set(true)',
    '(mouseleave)': 'actif.set(false)',
    '[style.background-color]': 'actif() ? couleur() : null',
  },
})
export class Surbrillance {
  couleur = input('#fffae0');
  protected actif = signal(false);
}
```

```html
<tr appSurbrillance [couleur]="'#ffe0e0'">
  <td>{{ commande.reference }}</td>
</tr>
```

Comme pour un composant, une directive peut déclarer ses propres `input()`/`output()`. Ici, `couleur` personnalise la teinte de surbrillance ligne par ligne.

### Exemple 2 — Directive structurelle personnalisée

```ts
// si-role.ts
import { Directive, TemplateRef, ViewContainerRef, inject, input, effect } from '@angular/core';
import { SessionService } from '../session.service';

@Directive({
  selector: '[appSiRole]',
})
export class SiRole {
  private templateRef = inject(TemplateRef<unknown>);
  private conteneur = inject(ViewContainerRef);
  private session = inject(SessionService);

  appSiRole = input.required<string>();

  constructor() {
    effect(() => {
      this.conteneur.clear();
      if (this.session.roles().includes(this.appSiRole())) {
        this.conteneur.createEmbeddedView(this.templateRef);
      }
    });
  }
}
```

```html
<button *appSiRole="'admin'">Supprimer la commande</button>
```

La convention `*appSiRole="'admin'"` est un raccourci de syntaxe qui, sous le capot, transforme le `<button>` en `ng-template` porteur de la directive. `input.required()` reçoit ici la valeur passée après `*appSiRole=`, grâce au nom d'entrée identique au sélecteur (convention Angular pour la syntaxe `*`).

### Exemple 3 — `hostDirectives` : composer un comportement

```ts
// deplacable.ts
@Directive({
  selector: '[appDeplacable]',
  host: { '(pointerdown)': 'demarrer($event)' },
})
export class Deplacable {
  position = model({ x: 0, y: 0 });
  demarrer(evenement: PointerEvent) { /* ... */ }
}
```

```ts
// carte-flottante.ts
@Component({
  selector: 'app-carte-flottante',
  hostDirectives: [
    { directive: Deplacable, inputs: ['position'], outputs: ['positionChange'] },
  ],
  template: `...`,
})
export class CarteFlottante {}
```

`CarteFlottante` obtient tout le comportement de `Deplacable` (l'écouteur `pointerdown`, la logique de déplacement) sans en hériter ni le réécrire ; `inputs`/`outputs` choisissent ce qui est exposé publiquement sur `CarteFlottante`.

### Directives intégrées encore utiles

Le contrôle de flux (`@if`, `@for`, `@switch`) a remplacé `*ngIf`/`*ngFor`/`*ngSwitch` pour l'affichage conditionnel et les listes. De même, `NgClass` et `NgStyle` ne sont plus recommandées : les liaisons `[class]` et `[style]` acceptent aussi bien une chaîne qu'un objet ou un tableau, et Angular fournit une migration automatique pour les remplacer. Reste utile en revanche : `NgTemplateOutlet` (voir la leçon « Projeter du contenu ») pour rendre un `TemplateRef` à la demande.

### Pièges courants

> **`host` sur une directive n'a aucun effet visible.** `host` ajoute des liaisons sur l'élément **hôte** — l'élément qui porte la directive. Si l'écouteur ou la classe déclarée ne correspond à rien de visible (mauvais nom de propriété CSS, faute de frappe dans l'événement), rien ne s'affiche sans erreur de compilation : à vérifier en premier en cas de directive « silencieuse ».

> **Oublier `conteneur.clear()` dans une directive structurelle.** Sans l'appeler avant de recréer la vue, chaque changement de condition **ajoute** une nouvelle vue au lieu de remplacer la précédente : le contenu apparaît en double.

> **`*ngIf`/`*ngFor` encore présents dans du code récent.** Ils restent fonctionnels en Angular 21 mais sont dépréciés depuis la version 20, avec une intention de suppression à terme. Un schematic de migration (`ng generate @angular/core:control-flow`) convertit automatiquement vers `@if`/`@for`.

### À retenir

- Directive d'attribut : modifie un élément existant. Directive structurelle : ajoute/retire des éléments via `TemplateRef` + `ViewContainerRef`.
- `host` remplace `@HostBinding`/`@HostListener` pour déclarer les liaisons sur l'élément hôte.
- `@if`/`@for`/`@switch` couvrent l'essentiel des besoins ; `*ngIf`/`*ngFor` restent utilisables mais sont dépréciés depuis Angular 20.
- `hostDirectives` compose le comportement d'une directive existante dans un composant, sans héritage.
- Une directive standalone doit, comme un composant, être ajoutée au tableau `imports` du composant qui l'utilise.
