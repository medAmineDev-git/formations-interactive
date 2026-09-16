---
id: detection-changements
chapitre: performance
ordre: 1
titre: "La détection de changements, de zone.js au zoneless"
termes:
  - terme: "zone.js"
    definition: "Librairie historiquement chargée par défaut dans les projets Angular. Elle **patche** (remplace) les API asynchrones du navigateur (`setTimeout`, `addEventListener`, les promesses…) pour être notifiée chaque fois que l'une d'elles se termine, et déclenche alors un cycle de détection de changements sur toute l'application."
  - terme: "Monkey-patching"
    definition: "Technique consistant à remplacer une fonction native (ex. `setTimeout`) par une version instrumentée qui appelle l'originale tout en ajoutant un comportement (ici, prévenir Angular). C'est le mécanisme interne de zone.js."
  - terme: "provideZonelessChangeDetection()"
    definition: "Fonction de `@angular/core` à passer aux providers de l'application pour activer le mode **zoneless** : Angular ne dépend plus de zone.js et se fie uniquement à des notifications explicites (signaux, `markForCheck`…) pour savoir quand re-vérifier une vue."
  - terme: "markForCheck()"
    definition: "Méthode de `ChangeDetectorRef` qui indique à Angular qu'un composant (et ses ancêtres jusqu'à la racine) doit être re-vérifié au prochain cycle de détection de changements. Nécessaire en zoneless quand une donnée change en dehors des mécanismes qu'Angular surveille automatiquement."
  - terme: AsyncPipe
    definition: "Pipe de template (`| async`) qui s'abonne à un `Observable` ou une `Promise` et déclenche lui-même, à chaque nouvelle valeur, un rafraîchissement du composant — y compris en mode zoneless, sans code supplémentaire."
  - terme: "ChangeDetectionStrategy.OnPush"
    definition: "Stratégie de détection de changements qui limite la re-vérification d'un composant aux cas où une de ses entrées change par référence, un événement se déclenche dans son template, ou il est explicitement marqué (`markForCheck`, signal lu dans le template)."
  - terme: ChangeDetectorRef
    definition: "Service injectable donnant un accès manuel au mécanisme de détection de changements d'un composant : `markForCheck()` (planifier une vérification), `detectChanges()` (la lancer immédiatement, de façon synchrone), `detach()`/`reattach()` (sortir/rentrer dans le cycle automatique)."
quiz:
  - question: "Ce composant est en `OnPush` et n'utilise pas de signaux. Que se passe-t-il à l'affichage ?"
    code: |
      @Component({
        selector: 'app-compteur-vues',
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<p>Vues : {{ stats.vues }}</p>`,
      })
      export class CompteurVues implements OnInit {
        stats = { vues: 0 };

        ngOnInit() {
          setInterval(() => {
            this.stats.vues++; // mutation directe de la propriété
          }, 1000);
        }
      }
    choix:
      - "Le nombre de vues s'incrémente à l'écran chaque seconde, comme attendu"
      - "Le nombre de vues change bien en mémoire, mais l'affichage reste bloqué sur 0 : ni un événement de template, ni une entrée, ni un signal, ni `markForCheck()` ne préviennent Angular de la mutation"
      - "Une exception est levée car `setInterval` est interdit avec `OnPush`"
      - "Angular détecte automatiquement la mutation d'objet, quel que soit le mode de détection de changements"
    reponse: 1
    explication: "`OnPush` ne re-vérifie pas un composant à chaque tic d'horloge : il faut un déclencheur reconnu (entrée changée par référence, événement de template, signal lu, ou appel explicite à `markForCheck()`). Une mutation d'objet dans un `setInterval` n'en fait partie d'aucun : la vue reste périmée jusqu'au prochain déclencheur, même si `stats.vues` a bien changé en mémoire."
  - question: "En mode zoneless, lequel de ces changements déclenche automatiquement un rafraîchissement de la vue, sans code supplémentaire ?"
    choix:
      - "L'écriture d'une nouvelle valeur dans un signal lu par le template"
      - "La mutation d'un tableau ordinaire (`liste.push(x)`) référencé par une propriété de classe"
      - "Le retour d'un `setTimeout` qui modifie une propriété simple (`this.total = 42`)"
      - "N'importe quel appel de fonction asynchrone terminé, comme en mode zone.js"
    reponse: 0
    explication: "En zoneless, Angular ne surveille plus toutes les API asynchrones : il réagit aux **signaux** lus dans un template, aux événements déclenchés depuis ce template, à `AsyncPipe`, et aux appels explicites à `markForCheck()`. Une mutation d'objet ou une affectation dans un `setTimeout` ne fait partie d'aucun de ces déclencheurs : sans signal, rien ne prévient Angular."
  - question: "Un service reçoit un callback d'une librairie tierce non Angular (ex. une carte interactive) et doit mettre à jour l'écran. Que faut-il faire en zoneless si la donnée n'est pas un signal ?"
    choix:
      - "Rien : Angular détecte toujours les changements provenant de code externe"
      - "Injecter `ChangeDetectorRef` dans le composant concerné et appeler `markForCheck()` dans le callback, pour signaler explicitement qu'une vérification est nécessaire"
      - "Envelopper tout le callback dans un `setTimeout` pour forcer Angular à le détecter"
      - "Passer le composant en `ChangeDetectionStrategy.Default` pour que zone.js reprenne la main"
    reponse: 1
    explication: "Le code d'une librairie tierce échappe au système de réactivité d'Angular : ni signal, ni événement de template, ni `AsyncPipe`. La solution propre reste d'injecter `ChangeDetectorRef` et d'appeler `markForCheck()` au bon moment (ou, mieux, d'adapter la donnée reçue pour la stocker dans un signal, ce qui règle le problème sans code manuel)."
---

## Essentiel

Historiquement, Angular s'appuyait sur **zone.js** : une librairie qui **patche** les API asynchrones du navigateur (`setTimeout`, `addEventListener`, promesses…) pour être notifiée chaque fois que l'une d'elles se termine. À chaque notification, Angular relançait un cycle de détection de changements sur **toute l'arborescence de composants**, pour repérer ce qui avait changé. Efficace, mais coûteux : un simple clic n'importe où re-vérifiait potentiellement des centaines de composants qui n'avaient rien à voir avec ce clic.

Le mode **zoneless** (stable, **par défaut pour tout nouveau projet Angular 21**) abandonne zone.js : Angular ne re-vérifie une vue que sur des déclencheurs **explicites et précis** :

- un **signal** lu dans le template change de valeur ;
- un **événement** se déclenche depuis le template (`(click)`, `(input)`…) ;
- `AsyncPipe` reçoit une nouvelle valeur d'un `Observable` ;
- un appel manuel à `ChangeDetectorRef.markForCheck()`.

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
});
```

En v21, un nouveau projet n'a rien à ajouter : le zoneless est déjà actif. Conséquence pratique : un code qui **mute** un objet ou un tableau sans passer par un signal, ou qui modifie une propriété ordinaire dans un `setTimeout`, ne rafraîchit plus l'écran — ce qui « marchait par hasard » avec zone.js (parce que le `setTimeout` déclenchait un cycle global) casse silencieusement en zoneless.

`ChangeDetectionStrategy.OnPush` reste pertinent : il limite la vérification d'un composant aux mêmes déclencheurs, et se combine naturellement avec les signaux.

## Détail

### Comment ça marche

Avec zone.js, Angular exécute tout le code de l'application dans une « zone » qui intercepte les API asynchrones. Dès qu'une callback patchée se termine (un clic, une réponse HTTP, un minuteur), zone.js prévient Angular, qui relance `ApplicationRef.tick()` : un parcours complet de l'arbre de composants pour comparer les valeurs affichées aux valeurs actuelles. `OnPush` limite ce parcours en excluant les sous-arbres dont rien ne justifie la re-vérification, mais le déclenchement initial reste global et automatique — c'est ce filet de sécurité, pratique mais coûteux, que le mode zoneless retire.

En zoneless, il n'y a plus de filet global : Angular sait exactement, via le graphe de dépendances des signaux et les écouteurs d'événements de template, quels composants re-vérifier. Le résultat est plus prévisible, souvent plus rapide sur de grosses applications, et **oblige** à exprimer l'état réactif avec des signaux plutôt qu'avec des mutations directes.

### Exemple 1 — Ce qui fonctionne sans rien changer

```ts
@Component({
  selector: 'app-panier-resume',
  template: `<p>{{ nombreArticles() }} article(s)</p>`,
})
export class PanierResume {
  nombreArticles = signal(0);

  ajouter() {
    this.nombreArticles.update((n) => n + 1); // déclenche un rafraîchissement
  }
}
```

Un signal lu dans le template est un déclencheur reconnu nativement, aussi bien en zoneless qu'en zone.js : rien à faire de spécial.

### Exemple 2 — Ce qui casse en zoneless

```ts
@Component({
  selector: 'app-horloge',
  template: `<p>{{ etat.heure }}</p>`,
})
export class Horloge implements OnInit {
  etat = { heure: new Date().toLocaleTimeString() };

  ngOnInit() {
    setInterval(() => {
      this.etat.heure = new Date().toLocaleTimeString(); // propriété ordinaire
    }, 1000);
  }
}
```

Avec zone.js, ce code fonctionnait : `setInterval` étant patché, chaque tic déclenchait un cycle global qui rafraîchissait l'horloge par effet de bord. En zoneless, plus aucun mécanisme ne prévient Angular : l'affichage reste figé. La correction consiste à remplacer `etat.heure` par un signal, ou à appeler `markForCheck()` dans la callback.

### Exemple 3 — Corriger avec un signal

```ts
@Component({
  selector: 'app-horloge',
  template: `<p>{{ heure() }}</p>`,
})
export class Horloge implements OnInit {
  heure = signal(new Date().toLocaleTimeString());

  ngOnInit() {
    setInterval(() => {
      this.heure.set(new Date().toLocaleTimeString());
    }, 1000);
  }
}
```

Même comportement visuel, mais désormais explicite et indépendant de zone.js : le signal notifie directement les templates qui le lisent, avec ou sans zone.js.

### Exemple 4 — `ChangeDetectorRef` pour le code hors du contrôle d'Angular

```ts
@Component({
  selector: 'app-carte-produit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #conteneurCarte></div>`,
})
export class CarteProduit implements AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  positionUtilisateur = '';

  ngAfterViewInit() {
    libreCarteTierce.onPositionChange((position) => {
      this.positionUtilisateur = position; // vient d'une lib externe, pas un signal
      this.cdr.markForCheck(); // sans ça, la vue ne se rafraîchit jamais
    });
  }
}
```

`markForCheck()` reste l'outil de secours quand une donnée provient d'un code totalement extérieur au système de réactivité d'Angular (librairie JS tierce, WebSocket bas niveau…) et qu'il n'est pas pratique de tout convertir en signal immédiatement.

### zone.js contre zoneless

| | zone.js (historique) | Zoneless (défaut v21) |
|---|---|---|
| Déclencheur de vérification | Toute API asynchrone patchée (global) | Signal, événement de template, `AsyncPipe`, `markForCheck()` (explicite) |
| Coût par défaut | Cycle complet à chaque événement asynchrone | Seulement les composants concernés |
| Bundle | zone.js inclus (poids supplémentaire) | Aucune dépendance à zone.js |
| Mutation d'objet sans signal | Fonctionne « par accident » | Ne rafraîchit pas la vue |
| Activation en v21 | `provideZoneChangeDetection()` explicite | Rien à faire (défaut) |

### Pièges courants

> **Muter un tableau ou un objet au lieu de le remplacer.** `produits().push(nouveauProduit)` ne change pas la référence lue par le template : ni zone.js (si retiré) ni le mode zoneless ne rafraîchissent l'affichage. Utiliser `produits.update((p) => [...p, nouveauProduit])`.

> **Garder du code qui suppose un cycle de détection global.** Un composant écrit avant la migration zoneless peut modifier une propriété simple dans une callback tierce et compter sur zone.js pour rafraîchir l'écran. En zoneless, ce code doit être revu : signal, ou `markForCheck()` explicite.

> **Abuser de `detectChanges()`.** Contrairement à `markForCheck()` (planifie une vérification au prochain cycle), `detectChanges()` lance une vérification **synchrone immédiate** du composant et de ses enfants. Appelé au mauvais endroit (dans une boucle, à chaque frappe clavier), il peut dégrader les performances au lieu de les améliorer.

### À retenir

- zone.js patchait les API asynchrones pour déclencher un cycle de détection **global** à chaque événement ; coûteux à grande échelle.
- Le mode **zoneless** est stable et **par défaut** pour tout nouveau projet Angular 21 : `provideZonelessChangeDetection()`.
- Déclencheurs reconnus en zoneless : signal lu dans un template, événement de template, `AsyncPipe`, `markForCheck()`.
- Une mutation d'objet ou une affectation dans un callback externe sans signal ni `markForCheck()` ne rafraîchit plus l'écran — piège fréquent en migrant un projet existant.
- `OnPush` et `ChangeDetectorRef` restent d'actualité : `OnPush` structure les déclencheurs, `ChangeDetectorRef.markForCheck()` sert de secours pour le code hors du système réactif d'Angular.
</content>
