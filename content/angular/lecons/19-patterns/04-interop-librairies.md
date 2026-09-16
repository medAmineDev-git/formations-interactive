---
id: interop-librairies
chapitre: patterns-avances
ordre: 4
titre: "Intégrer des librairies tierces"
termes:
  - terme: "Service ou directive enveloppant (wrapper)"
    definition: "Composant, directive ou service Angular dont le seul rôle est d'encapsuler une librairie JavaScript non-Angular : créer l'instance, exposer une API Angular-idiomatique (signaux, `input()`/`output()`), et la détruire proprement. Isole le reste de l'application du détail d'implémentation de la librairie."
  - terme: "ngOnDestroy"
    definition: "Hook de cycle de vie appelé juste avant la destruction d'un composant ou d'une directive. Emplacement correct pour libérer les ressources créées par une librairie tierce : instance à détruire, écouteurs globaux (`window`, `document`) à retirer, abonnements à fermer."
  - terme: "NgZone.runOutsideAngular()"
    definition: "Méthode qui exécute une fonction en dehors de la détection de changements automatique. Reste utile pour du code intensif ou fréquent (défilement, animation au pixel près) même en zoneless ; l'équipe Angular précise explicitement qu'il n'est pas nécessaire de retirer ces appels pour être compatible zoneless."
  - terme: "markForCheck() / signal de synchronisation"
    definition: "Deux façons de prévenir Angular qu'une donnée modifiée par du code extérieur (librairie tierce) doit rafraîchir l'affichage : recopier la valeur reçue dans un signal (le template se met à jour tout seul), ou appeler `ChangeDetectorRef.markForCheck()` pour forcer une vérification explicite du composant."
  - terme: "Déclaration de types ambiante"
    definition: "Fichier `.d.ts` (`declare module 'nom-librairie' { ... }`) qui décrit les types d'une librairie JavaScript dépourvue de typage TypeScript officiel, pour retrouver l'autocomplétion et la vérification de types sans modifier le code source de la librairie."
  - terme: "isPlatformBrowser()"
    definition: "Fonction de `@angular/common` qui, combinée à `PLATFORM_ID` injecté, indique si le code s'exécute dans un navigateur ou côté serveur (SSR). Sert de garde avant tout accès à `window`/`document` ou à une librairie qui en dépend."
quiz:
  - question: "Une directive enveloppe une librairie de graphiques tierce qui ajoute un écouteur sur `window.resize`. Que faut-il faire dans `ngOnDestroy` ?"
    code: |
      @Directive({ selector: '[appGraphique]' })
      export class GraphiqueDirective implements OnInit, OnDestroy {
        private graphique?: LibGraphique;

        ngOnInit() {
          this.graphique = new LibGraphique(this.elementRef.nativeElement);
          window.addEventListener('resize', this.gererRedimensionnement);
        }

        gererRedimensionnement = () => this.graphique?.redessiner();

        ngOnDestroy() {
          // ?
        }
      }
    choix:
      - "Rien : Angular détruit automatiquement toute ressource créée pendant `ngOnInit`"
      - "Appeler la méthode de destruction de la librairie **et** retirer explicitement l'écouteur avec `window.removeEventListener('resize', this.gererRedimensionnement)`, sinon la fonction reste référencée indéfiniment par `window`"
      - "Seul le retrait de l'écouteur est nécessaire, la librairie se nettoie toujours seule à la destruction du composant hôte"
      - "Remplacer `ngOnDestroy` par `ngOnChanges`, plus fiable pour le nettoyage"
    reponse: 1
    explication: "Une librairie tierce et un écouteur global (`window`, `document`) ne font pas partie du cycle de vie d'Angular : rien ne les nettoie automatiquement. Oublier `removeEventListener` laisse la fonction référencée par `window` même après la destruction de la directive, ce qui fuit de la mémoire et peut redessiner un graphique qui n'existe plus."
  - question: "En mode zoneless, une librairie de carte interactive appelle un callback JavaScript à chaque déplacement, en dehors de tout signal ou événement de template. Quelle est l'approche la plus robuste pour rafraîchir l'affichage ?"
    choix:
      - "Ne rien faire : le mode zoneless détecte automatiquement tout changement provenant d'une librairie externe"
      - "Recopier la donnée reçue dans un signal (`position.set(nouvellePosition)`) dans le callback : le template qui lit ce signal se rafraîchit alors normalement, sans code de détection de changements supplémentaire"
      - "Repasser toute l'application en mode zone.js dès qu'une librairie tierce est utilisée"
      - "Appeler `window.location.reload()` après chaque callback pour forcer un nouvel affichage"
    reponse: 1
    explication: "La solution la plus propre est de traduire l'état externe en signal dès sa réception : le template s'abonne alors automatiquement, sans appel manuel à `markForCheck()` à chaque fois. `markForCheck()` reste une solution de secours valable, mais recopier dans un signal évite d'y penser à chaque nouveau point d'entrée du callback."
  - question: "Pourquoi `NgZone.runOutsideAngular()` garde-t-il un intérêt dans une application zoneless ?"
    choix:
      - "Il n'en a plus aucun : en zoneless, il n'y a plus de zone dont sortir, l'appel est un no-op sans effet"
      - "Il reste utile pour exécuter du code fréquent ou coûteux (défilement, animation, minuteur haute fréquence) sans provoquer de détection de changements inutile, et l'équipe Angular précise qu'il n'est pas nécessaire de le retirer pour rester compatible zoneless"
      - "Il devient obligatoire pour tout appel HTTP en mode zoneless"
      - "Il remplace `provideZonelessChangeDetection()` comme mécanisme d'activation du mode zoneless"
    reponse: 1
    explication: "Même si le mode zoneless ne dépend plus de zone.js pour déclencher la détection de changements, `NgZone.run`/`runOutsideAngular` restent des API valides et utiles (notamment pour des librairies encore écrites en tenant compte de zone.js) ; l'équipe Angular indique explicitement que ces appels n'ont pas besoin d'être retirés pour la compatibilité zoneless."
---

## Essentiel

La plupart des librairies JavaScript utiles (cartes, graphiques, éditeurs de texte riche, lecteurs vidéo…) ne connaissent rien d'Angular. Le pattern standard consiste à les **envelopper** dans un service ou une directive Angular : créer l'instance dans `ngOnInit` (ou `afterNextRender` si elle touche au DOM), exposer une API Angular-idiomatique (`input()`, `output()`, signal), et **toujours** nettoyer dans `ngOnDestroy` — instance détruite, écouteurs globaux retirés, abonnements fermés.

```ts
@Directive({ selector: '[appGraphique]' })
export class GraphiqueDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private graphique?: LibGraphique;

  donnees = input.required<PointDonnee[]>();

  ngOnInit() {
    this.graphique = new LibGraphique(this.elementRef.nativeElement, { donnees: this.donnees() });
  }

  ngOnDestroy() {
    this.graphique?.detruire();
  }
}
```

Deux problèmes reviennent systématiquement :

1. **Exécuter du code intensif hors du cycle Angular.** Pour un défilement ou une animation à haute fréquence pilotée par la librairie, `NgZone.runOutsideAngular()` évite de solliciter la détection de changements à chaque image — utile même en zoneless, l'équipe Angular précisant qu'il n'y a pas besoin de retirer ces appels.
2. **Le problème inverse : une librairie modifie un état sans qu'Angular le sache.** En zoneless en particulier, rien ne rafraîchit automatiquement l'affichage. La solution la plus propre est de recopier la valeur reçue dans un **signal** ; à défaut, appeler `ChangeDetectorRef.markForCheck()` explicitement.

Autres points à surveiller : types TypeScript manquants (`declare module` pour une librairie sans typage officiel), chargement différé d'une grosse librairie (import dynamique), et compatibilité SSR — tout code touchant `window`/`document` doit être protégé par `isPlatformBrowser()` ou déplacé dans `afterNextRender`.

## Détail

### Pourquoi c'est utile

Sans point d'encapsulation, l'appel à une librairie tierce se disperse dans plusieurs composants, chacun réinventant sa propre gestion du cycle de vie et ses propres oublis de nettoyage. Un wrapper unique centralise la création, la destruction, et la traduction entre l'API de la librairie (souvent impérative, orientée callbacks) et le modèle réactif d'Angular (signaux, `input()`/`output()`) — le reste de l'application n'a plus à connaître les détails de la librairie sous-jacente.

### Exemple 1 — Wrapper de service avec nettoyage complet

```ts
@Injectable()
export class LecteurVideoService implements OnDestroy {
  private lecteur?: LibLecteurVideo;
  private zone = inject(NgZone);

  demarrer(element: HTMLElement, source: string) {
    this.zone.runOutsideAngular(() => {
      this.lecteur = new LibLecteurVideo(element, { source, autoplay: false });
      this.lecteur.on('timeupdate', () => { /* géré hors Angular, volontairement */ });
    });
  }

  ngOnDestroy() {
    this.lecteur?.detruire();
  }
}
```

Les mises à jour à haute fréquence de la lecture vidéo (`timeupdate`, potentiellement plusieurs fois par seconde) n'ont pas besoin de déclencher une détection de changements à chaque fois : elles restent hors du cycle Angular tant que rien dans le template n'en dépend directement.

### Exemple 2 — Refléter un état externe dans un signal

```ts
@Directive({ selector: '[appCarte]' })
export class CarteDirective implements OnInit, OnDestroy {
  private carte?: LibCarte;
  positionUtilisateur = signal<Position | null>(null);

  ngOnInit() {
    this.carte = new LibCarte(this.elementRef.nativeElement);
    this.carte.onPositionChange((position: Position) => {
      this.positionUtilisateur.set(position); // le template se rafraîchit tout seul
    });
  }

  ngOnDestroy() {
    this.carte?.detruire();
  }
}
```

Une fois la donnée transformée en signal, tout template qui la lit se met à jour normalement — aucun `markForCheck()` à ajouter à chaque nouveau point d'écoute de la librairie.

### Exemple 3 — Types manquants

```ts
// types/lib-carte.d.ts
declare module 'lib-carte' {
  export class LibCarte {
    constructor(element: HTMLElement, options?: { zoom?: number });
    onPositionChange(callback: (position: { lat: number; lng: number }) => void): void;
    detruire(): void;
  }
}
```

Une déclaration ambiante minimale suffit à retrouver l'autocomplétion et la vérification de types sur les parties de l'API réellement utilisées, sans dépendre d'un paquet `@types/...` qui n'existe pas forcément pour une librairie moins courante.

### Exemple 4 — Compatibilité SSR

```ts
@Component({ selector: 'app-graphique-ventes', template: `<div #conteneur></div>` })
export class GraphiqueVentes {
  private conteneur = viewChild.required('conteneur', { read: ElementRef });
  private platformId = inject(PLATFORM_ID);

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      new LibGraphique(this.conteneur().nativeElement);
    });
  }
}
```

`afterNextRender` ne s'exécute déjà que côté navigateur, mais associer `isPlatformBrowser()` reste une bonne pratique défensive si le même code est réutilisé ailleurs sans cette garantie — une librairie qui touche directement `window`/`document` au chargement du module ferait échouer le rendu serveur.

### Chargement différé d'une grosse librairie

```ts
async ouvrirEditeurRiche() {
  const { EditeurRiche } = await import('lib-editeur-riche');
  this.editeur = new EditeurRiche(this.conteneur().nativeElement);
}
```

Un import dynamique évite d'alourdir le bundle initial avec une librairie volumineuse qui n'est utile que dans un cas d'usage secondaire (ex. un éditeur de texte riche seulement visible en mode édition) ; ce chargement peut aussi être combiné à un bloc `@defer` côté template.

### Pièges courants

> **Oublier un écouteur global.** `window.addEventListener` ou `document.addEventListener` posé par une librairie (ou par le wrapper lui-même) doit être explicitement retiré dans `ngOnDestroy` — rien dans Angular ne le fait à la place.

> **Appeler `inject()` dans un callback de librairie tierce.** Une fonction passée en callback à une librairie externe (pas un champ de classe, pas le constructeur) n'est plus dans un contexte d'injection valide : `inject()` y échoue avec `NG0203`. Injecter les dépendances nécessaires *avant*, dans le constructeur ou un champ, puis les utiliser dans le callback via une closure.

> **Toucher `window`/`document` au niveau module ou dans le constructeur, hors garde SSR.** En rendu serveur, ce code s'exécute aussi, où `window` n'existe pas — l'erreur apparaît côté serveur, pas dans le navigateur où le problème est habituellement testé.

### À retenir

- Encapsuler une librairie tierce dans un service ou une directive dédiée, avec nettoyage systématique dans `ngOnDestroy`.
- `NgZone.runOutsideAngular()` reste pertinent en zoneless pour du code fréquent ou coûteux — inutile de le retirer en migrant.
- Le problème inverse (librairie qui change l'état sans qu'Angular le sache) se résout le plus proprement en recopiant la donnée dans un **signal** ; `markForCheck()` reste une solution de secours.
- Types manquants → déclaration ambiante (`declare module`) ciblée sur l'API réellement utilisée.
- Tout code touchant au DOM directement doit être protégé pour le SSR (`isPlatformBrowser()`, `afterNextRender`).
