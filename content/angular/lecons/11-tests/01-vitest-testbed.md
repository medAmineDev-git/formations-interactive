---
id: vitest-testbed
chapitre: tests-angular
ordre: 1
titre: "Vitest et TestBed"
termes:
  - terme: Vitest
    definition: "Runner de tests **installé et configuré par défaut** pour tout nouveau projet Angular 21 créé avec `ng new` (avec `jsdom` pour simuler le DOM). Il exécute les tests dans Node.js plutôt que dans un vrai navigateur, ce qui le rend nettement plus rapide que Karma."
  - terme: "TestBed"
    definition: "Module de test d'Angular : on lui déclare un environnement (`imports`, `providers`) avec `TestBed.configureTestingModule()`, puis on l'utilise pour créer des composants (`createComponent()`) ou récupérer des services (`inject()`)."
  - terme: ComponentFixture
    definition: "Objet renvoyé par `TestBed.createComponent()`. C'est le harnais de test d'un composant : il expose l'instance (`componentInstance`), l'élément DOM (`nativeElement`), le `DebugElement`, et les méthodes pour piloter la détection de changements."
  - terme: "fixture.detectChanges()"
    definition: "Déclenche manuellement un cycle de détection de changements sur le composant testé : les liaisons de template (`{{ }}`, `[input]`) sont mises à jour dans le DOM à cet instant précis."
  - terme: "fixture.whenStable()"
    definition: "Renvoie une promesse résolue quand l'application est **stabilisée** (plus de tâches asynchrones en attente, rendu à jour). En mode zoneless, c'est la façon recommandée d'attendre le rendu initial avant les assertions."
  - terme: Karma
    definition: "Ancien runner de tests d'Angular, basé sur Jasmine et exécuté dans un vrai navigateur. **Toujours pleinement supporté** en Angular 21, mais n'est plus le choix par défaut d'un nouveau projet."
  - terme: ".spec.ts"
    definition: "Suffixe conventionnel d'un fichier de test Angular (`panier.spec.ts` pour `panier.ts`). Vitest détecte les fichiers de test via le motif `**/*.spec.ts` (et `**/*.test.ts`) configuré dans `angular.json`."
quiz:
  - question: "Que se passe-t-il si ce code s'exécute tel quel ?"
    code: |
      const fixture = TestBed.createComponent(PanierComponent);

      TestBed.configureTestingModule({
        providers: [{ provide: PanierService, useClass: PanierServiceStub }],
      });
    choix:
      - "Le composant est recréé automatiquement avec le nouveau provider"
      - "Une erreur est levée : `createComponent()` fige la configuration de `TestBed`, impossible de la modifier après coup"
      - "Le nouveau provider est ignoré silencieusement, sans erreur"
      - "Angular fusionne les deux appels à `configureTestingModule` automatiquement"
    reponse: 1
    explication: "`TestBed.createComponent()` verrouille la configuration courante : tout appel à `configureTestingModule()` après coup échoue. Il faut configurer entrées, `imports` et `providers` **avant** de créer le composant testé."
  - question: "Pour un nouveau projet créé avec `ng new` en Angular 21, quel est le runner de tests installé par défaut ?"
    choix:
      - "Jest"
      - "Vitest, avec jsdom pour simuler le DOM"
      - "Karma, avec Jasmine"
      - "Web Test Runner"
    reponse: 1
    explication: "Angular 21 fait de Vitest le runner par défaut des nouveaux projets (stable depuis la v21.0). Karma reste disponible et pleinement supporté, mais il faut désormais le choisir explicitement. Jest et Web Test Runner, eux, ont été retirés du support expérimental d'Angular."
  - question: "Dans une application zoneless, pourquoi préfère-t-on souvent `await fixture.whenStable()` juste après `TestBed.createComponent()`, plutôt que de tester immédiatement ?"
    choix:
      - "Parce que `whenStable()` est obligatoire pour compiler le test"
      - "Parce que sans zone.js, rien ne déclenche automatiquement la détection de changements après le rendu initial : `whenStable()` attend que l'application se stabilise avant d'interroger le DOM"
      - "Parce que `whenStable()` remplace `TestBed.configureTestingModule()`"
      - "Parce que `whenStable()` supprime le besoin d'appeler `detectChanges()` dans tout le reste du test"
    reponse: 1
    explication: "En mode zoneless, il n'y a pas de patch automatique qui prévient Angular d'un changement : `whenStable()` donne une garantie que le rendu initial (et les tâches en attente) sont terminés avant de lire le DOM. `detectChanges()` reste utile ensuite pour forcer un cycle après une modification ponctuelle."
---

## Essentiel

Depuis Angular 21, un projet créé avec `ng new` embarque **Vitest** comme runner de tests par défaut (avec `jsdom` pour simuler un DOM sans navigateur). `ng test` construit l'application en mode watch et lance Vitest. **Karma reste pleinement supporté** pour les projets existants ou pour qui préfère exécuter les tests dans un vrai navigateur, mais ce n'est plus le choix par défaut.

Un fichier de test (`produit-card.spec.ts`) suit toujours la même structure, indépendamment du runner :

```ts
import { TestBed } from '@angular/core/testing';
import { ProduitCard } from './produit-card';

describe('ProduitCard', () => {
  it('devrait se créer', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(ProduitCard);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

`TestBed.configureTestingModule({ imports, providers })` déclare l'environnement du test (composants à importer, services à fournir ou remplacer). `TestBed.createComponent()` instancie le composant testé et renvoie un `ComponentFixture` : le harnais qui donne accès à l'instance, à l'élément DOM et aux méthodes de détection de changements. **Attention** : `createComponent()` fige la configuration de `TestBed` — plus aucun appel à `configureTestingModule()` n'est possible après.

En mode zoneless (par défaut en v21), rien ne déclenche automatiquement un rendu après la création du composant : `await fixture.whenStable()` attend que l'application se stabilise, `fixture.detectChanges()` force un cycle de détection de changements immédiat.

## Détail

### Pourquoi c'est utile

Vitest apporte un démarrage et une réexécution des tests nettement plus rapides que Karma, car il tourne dans Node.js (via `jsdom`) plutôt que dans un navigateur réel — un gain sensible sur un gros projet avec des centaines de fichiers `.spec.ts`. Karma garde son intérêt quand on veut tester dans un vrai moteur de rendu de navigateur (comportements spécifiques au DOM natif, compatibilité multi-navigateurs).

### Exemple 1 — Configuration minimale et injection d'un service

```ts
import { TestBed } from '@angular/core/testing';
import { PanierService } from './panier.service';

describe('PanierService', () => {
  it('démarre avec un panier vide', () => {
    TestBed.configureTestingModule({
      providers: [PanierService],
    });

    const service = TestBed.inject(PanierService);
    expect(service.lignes()).toEqual([]);
  });
});
```

`TestBed.inject(PanierService)` récupère l'instance construite par l'injecteur de test, avec les mêmes règles de résolution de dépendances qu'en production.

### Exemple 2 — Créer un composant et attendre la stabilisation

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProduitCard } from './produit-card';

describe('ProduitCard', () => {
  let fixture: ComponentFixture<ProduitCard>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ProduitCard],
    });
    fixture = TestBed.createComponent(ProduitCard);
    fixture.componentRef.setInput('nom', 'Clavier mécanique');
    await fixture.whenStable();
  });

  it('affiche le nom du produit', () => {
    expect(fixture.nativeElement.textContent).toContain('Clavier mécanique');
  });
});
```

L'entrée est fixée avant `whenStable()`, puis le test lit le DOM une fois certain que le rendu initial est terminé.

### Exemple 3 — Forcer un cycle de détection après une action

```ts
it('met à jour le total après un clic sur "ajouter"', () => {
  fixture.nativeElement.querySelector('button').click();
  fixture.detectChanges(); // applique la mise à jour au DOM immédiatement

  expect(fixture.nativeElement.textContent).toContain('1 article');
});
```

Ici, `detectChanges()` est préféré à `whenStable()` : l'action est synchrone (un clic), pas besoin d'attendre une éventuelle tâche asynchrone.

### Exemple 4 — Migrer un projet existant vers Vitest

```bash
ng g @schematics/angular:refactor-jasmine-vitest
```

Ce schematic tente de convertir automatiquement les fichiers de test Jasmine/Karma existants. Il ne couvre pas nécessairement toutes les API spécifiques à Jasmine utilisées dans un projet ancien (matchers personnalisés, spies avancés) : une relecture des fichiers migrés reste nécessaire.

### Vitest contre Karma

| | Vitest (défaut v21) | Karma |
|---|---|---|
| Environnement d'exécution | Node.js + `jsdom` | Vrai navigateur |
| Vitesse de démarrage / réexécution | Rapide | Plus lent |
| Statut en Angular 21 | Stable, par défaut pour `ng new` | Pleinement supporté, plus le défaut |
| Framework d'assertions historique | Style Jest (`describe`, `it`, `expect`) | Jasmine |
| Commande CLI | `ng test` | `ng test` |

### Pièges courants

> **Appeler `configureTestingModule()` après `createComponent()`.** La configuration est figée dès la création du composant. Il faut regrouper tous les `imports` et `providers` nécessaires dans le même appel, avant de créer le composant testé.

> **Lire le DOM sans avoir attendu la stabilisation.** En zoneless, oublier `await fixture.whenStable()` (ou `fixture.detectChanges()` pour une action synchrone) peut faire lire un DOM pas encore mis à jour, et produire un test qui échoue de façon intermittente.

> **Confondre « Vitest n'est plus expérimental » avec « Karma est retiré ».** Karma reste un choix valide et pleinement supporté en Angular 21 ; seul le **défaut** pour les nouveaux projets a changé.

### À retenir

- Vitest est le runner de tests **par défaut** des nouveaux projets Angular 21 ; Karma reste pleinement supporté, mais n'est plus le choix par défaut.
- `TestBed.configureTestingModule({ imports, providers })` prépare l'environnement, `TestBed.createComponent()` instancie et fige la configuration.
- `ComponentFixture` donne accès à l'instance, au DOM (`nativeElement`), et pilote la détection de changements (`detectChanges()`, `whenStable()`).
- En mode zoneless, `fixture.whenStable()` est la façon fiable d'attendre que le rendu initial (ou une tâche asynchrone) soit terminé.
- Un schematic (`refactor-jasmine-vitest`) aide à migrer un projet existant, mais une relecture manuelle reste recommandée.
