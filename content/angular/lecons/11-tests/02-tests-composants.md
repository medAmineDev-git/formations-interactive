---
id: tests-composants
chapitre: tests-angular
ordre: 2
titre: Tester un composant
termes:
  - terme: DebugElement
    definition: "Enveloppe d'un nœud du DOM rendue par Angular, accessible via `fixture.debugElement`. Contrairement à `nativeElement`, elle fonctionne de façon identique quelle que soit la plateforme (navigateur, serveur), et donne accès à l'injecteur du nœud."
  - terme: "By.css()"
    definition: "Sélecteur utilisé avec `debugElement.query()` ou `queryAll()` pour retrouver un `DebugElement` par sélecteur CSS, par exemple `fixture.debugElement.query(By.css('button.primaire'))`."
  - terme: "fixture.componentRef.setInput()"
    definition: "Façon recommandée de simuler la valeur qu'un composant parent donnerait à une entrée (`input()` ou `@Input()`) dans un test. Contrairement à une affectation directe sur l'instance, elle passe par le vrai mécanisme de liaison d'entrée d'Angular."
  - terme: dispatchEvent
    definition: "Méthode DOM permettant de déclencher manuellement un événement (`input`, `click`, `submit`) dans un test. Nécessaire après avoir modifié la propriété `value` d'un champ, car Angular ne surveille pas cette propriété directement : il écoute l'événement."
  - terme: Double de test
    definition: "Objet de substitution fourni à la place d'une vraie dépendance dans `TestBed.configureTestingModule({ providers: [...] })`, généralement via `{ provide: MonService, useClass: MonServiceStub }` ou `useValue: { ... }`. Isole le composant testé du comportement réel du service."
  - terme: "provideRouter([])"
    definition: "Fournisseur de routeur minimal, utilisable dans les `providers` de `TestBed` pour qu'un composant qui dépend du routeur (injecte `Router` ou utilise `routerLink`) puisse être instancié en test, sans définir de vraies routes."
  - terme: ActivatedRoute simulée
    definition: "Remplacement de `ActivatedRoute` par un objet fourni via `useValue` dans les `providers` de test, exposant les paramètres de route attendus (`paramMap`, `snapshot`), pour tester un composant routé sans navigation réelle."
quiz:
  - question: "Pourquoi ce test échoue-t-il ?"
    code: |
      it('affiche le nom du produit', () => {
        const fixture = TestBed.createComponent(ProduitCard);
        fixture.componentInstance.nom = 'Clavier';
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Clavier');
      });
      // ProduitCard : nom = input.required<string>();
    choix:
      - "`detectChanges()` ne rafraîchit jamais le texte du DOM"
      - "`nom` est un `input()` : on ne peut pas l'affecter directement sur l'instance, il faut passer par `fixture.componentRef.setInput('nom', 'Clavier')`"
      - "`input.required()` interdit toute valeur autre que la valeur par défaut en test"
      - "Il manque un `await fixture.whenStable()` avant l'assertion"
    reponse: 1
    explication: "Un `input()` est en lecture seule sur l'instance du composant : Angular attend que la valeur transite par son mécanisme de liaison. `fixture.componentRef.setInput('nom', 'Clavier')` simule correctement ce que ferait un composant parent."
  - question: "Après avoir changé la propriété `value` d'un `<input>` dans un test, pourquoi faut-il souvent appeler `dispatchEvent(new Event('input'))` ensuite ?"
    choix:
      - "Parce que sans cet appel, la propriété `value` du DOM n'est jamais réellement modifiée"
      - "Parce qu'Angular ne réagit pas à un changement de `value` en lui-même : c'est l'événement `input` (écouté par `ngModel` ou une liaison d'événement) qui déclenche la mise à jour du modèle"
      - "Parce que `dispatchEvent` est nécessaire pour que TypeScript compile le test"
      - "Parce que `detectChanges()` déclenche automatiquement l'événement `input` à sa place"
    reponse: 1
    explication: "Modifier `value` change bien le DOM, mais Angular ne l'observe pas passivement : ses liaisons réagissent à l'événement `input` (ou `change`). Sans `dispatchEvent`, le modèle du composant ne se met jamais à jour, même si le DOM a changé."
  - question: "Quelle est la bonne façon d'isoler un composant qui dépend d'un `PanierService` pour un test de composant ?"
    choix:
      - "Importer `PanierService` normalement et laisser le test appeler la vraie API réseau"
      - "Fournir un double de test dans `TestBed.configureTestingModule({ providers: [{ provide: PanierService, useClass: PanierServiceStub }] })`, avec un comportement contrôlé pour le test"
      - "Marquer `PanierService` comme `@Injectable({ providedIn: 'none' })` avant de lancer le test"
      - "Il n'y a rien à faire : Angular remplace automatiquement tous les services par des simulations en mode test"
    reponse: 1
    explication: "Remplacer la dépendance par un double (stub, faux objet) dans les `providers` du module de test permet de contrôler précisément ce que le service renvoie, sans dépendre d'un vrai réseau ni d'un état partagé entre tests."
---

## Essentiel

Tester un composant, c'est le créer via `TestBed`, lui donner des entrées, puis vérifier ce qu'il affiche ou ce qu'il émet. Trois accès au rendu : `fixture.nativeElement` (élément DOM natif, pratique pour `querySelector`), `fixture.debugElement` (abstraction `DebugElement`, indépendante de la plateforme, avec `By.css()`), et l'instance du composant elle-même.

```ts
const fixture = TestBed.createComponent(ProduitCard);
fixture.componentRef.setInput('nom', 'Clavier mécanique');
await fixture.whenStable();

const titre = fixture.nativeElement.querySelector('h3');
expect(titre.textContent).toContain('Clavier mécanique');
```

Pour une entrée signal (`input()`) ou un `@Input()` classique, on ne les affecte **jamais** directement sur l'instance : `fixture.componentRef.setInput('nom', valeur)` simule fidèlement ce qu'un composant parent ferait. Pour une sortie (`output()`), on s'y abonne comme le ferait un parent : `component.selectionne.subscribe(v => …)`.

Simuler un clic est direct (`element.click()` ou `debugElement.triggerEventHandler('click')`), mais simuler une saisie demande deux étapes : modifier `value`, **puis** déclencher l'événement (`dispatchEvent(new Event('input'))`), car Angular réagit à l'événement, pas à la propriété.

Quand un composant dépend d'un service ou du routeur, on **isole** le test avec un double de test (`useClass`/`useValue` dans `providers`) plutôt que d'utiliser les vraies dépendances.

## Détail

### Exemple 1 — Interroger le DOM avec `nativeElement` et `By.css()`

```ts
import { By } from '@angular/platform-browser';

it('affiche le prix formaté', async () => {
  const fixture = TestBed.createComponent(ProduitCard);
  fixture.componentRef.setInput('prix', 49.9);
  await fixture.whenStable();

  // Deux façons équivalentes d'accéder au même nœud
  const parDom = fixture.nativeElement.querySelector('.prix');
  const parDebugElement = fixture.debugElement.query(By.css('.prix'));

  expect(parDom.textContent).toContain('49,90 €');
  expect(parDebugElement.nativeElement.textContent).toContain('49,90 €');
});
```

`By.css()` s'utilise avec `debugElement.query()`/`queryAll()` ; il renvoie des `DebugElement`, pas des éléments DOM bruts — d'où le `.nativeElement` supplémentaire pour lire le texte.

### Exemple 2 — Simuler un clic et vérifier une sortie

```ts
it('émet un événement "ajouterAuPanier" au clic', () => {
  const fixture = TestBed.createComponent(ProduitCard);
  fixture.componentRef.setInput('produitId', 42);

  let idRecu: number | undefined;
  fixture.componentInstance.ajouterAuPanier.subscribe((id: number) => (idRecu = id));

  fixture.detectChanges();
  fixture.nativeElement.querySelector('button').click();

  expect(idRecu).toBe(42);
});
```

Le test s'abonne explicitement à la sortie, exactement comme le ferait `(ajouterAuPanier)="..."` dans le template du parent.

### Exemple 3 — Remplacer un composant enfant et une dépendance de service

```ts
@Component({ selector: 'app-avis-produit', template: '' })
class AvisProduitFaux {}

describe('ProduitPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProduitPage],
      providers: [{ provide: PanierService, useClass: PanierServiceStub }],
    }).overrideComponent(ProduitPage, {
      remove: { imports: [AvisProduit] },
      add: { imports: [AvisProduitFaux] },
    });
  });

  it('se crée sans appeler le vrai service de panier', () => {
    const fixture = TestBed.createComponent(ProduitPage);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

Remplacer un composant enfant coûteux (ou qui a ses propres dépendances complexes) par un faux réduit le test à ce qu'on veut vraiment vérifier : le comportement de `ProduitPage`.

### Exemple 4 — Composant routé : `provideRouter([])` et `ActivatedRoute` simulée

```ts
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('FicheProduit', () => {
  it('affiche le produit correspondant à l\'identifiant de route', async () => {
    TestBed.configureTestingModule({
      imports: [FicheProduit],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '42' })) },
        },
      ],
    });

    const fixture = TestBed.createComponent(FicheProduit);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Produit #42');
  });
});
```

`provideRouter([])` suffit à satisfaire les dépendances du routeur (comme `Router` ou `routerLink`) sans devoir déclarer de vraies routes ; `ActivatedRoute` simulée évite toute navigation réelle pendant le test.

### Pièges courants

> **Affecter un `input()` directement sur l'instance.** `component.nom = 'X'` ne passe pas par le mécanisme de liaison d'Angular et peut sembler fonctionner par accident (ou lever une erreur selon le type d'entrée). `fixture.componentRef.setInput()` est la seule façon fiable.

> **Modifier `value` sans déclencher `dispatchEvent`.** Un test qui remplit un champ puis vérifie immédiatement le modèle du composant échoue souvent pour cette raison : Angular n'a simplement pas encore été prévenu du changement.

> **Sélecteurs CSS trop précis ou trop couplés à la mise en page.** Un sélecteur comme `div > div:nth-child(3) > span` casse au moindre changement de structure HTML, sans rapport avec un vrai bug. Préférer un sélecteur stable (classe dédiée au test, attribut `data-testid`) quand c'est possible.

### À retenir

- `fixture.nativeElement` pour un accès DOM direct, `fixture.debugElement` + `By.css()` pour un accès indépendant de la plateforme et l'accès à l'injecteur du nœud.
- Une entrée se fixe avec `fixture.componentRef.setInput()`, jamais par affectation directe sur l'instance.
- Une saisie clavier se simule en deux temps : changer `value`, puis `dispatchEvent`.
- Isoler un composant de ses dépendances (service, routeur, composant enfant coûteux) avec des doubles de test fournis dans `providers`, ou `overrideComponent()` pour un enfant.
- `provideRouter([])` et une `ActivatedRoute` simulée suffisent à tester un composant routé sans navigation réelle.
