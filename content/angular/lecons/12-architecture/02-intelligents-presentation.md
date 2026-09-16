---
id: intelligents-presentation
chapitre: architecture
ordre: 2
titre: "Composants intelligents et composants de présentation"
termes:
  - terme: Composant intelligent
    definition: "Aussi appelé « container » ou « smart component ». Connaît les services, le routeur, l'état applicatif : il va chercher les données et décide de la logique métier, puis les transmet aux composants qu'il affiche."
  - terme: Composant de présentation
    definition: "Aussi appelé « dumb component » ou « presentational component ». Ne connaît que ce qu'on lui donne en entrée (`input()`), n'injecte aucun service métier, et notifie ses actions vers l'extérieur via des sorties (`output()`)."
  - terme: "ChangeDetectionStrategy.OnPush"
    definition: "Stratégie de détection de changements qui ne redéclenche le rendu du composant que si une de ses entrées change de référence, si un événement se produit dans son template, ou si un signal qu'il lit change. Bien adaptée aux composants de présentation."
  - terme: Flux de données unidirectionnel
    definition: "Les données descendent du composant intelligent vers le composant de présentation par ses entrées ; les actions remontent du composant de présentation vers le composant intelligent par ses sorties. Jamais l'inverse en direct."
  - terme: Testabilité en isolation
    definition: "Un composant de présentation se teste en lui fournissant des entrées et en vérifiant les sorties émises, sans avoir à simuler (mock) le moindre service. Un composant intelligent se teste en simulant les services qu'il injecte."
  - terme: Couplage
    definition: "Degré de dépendance d'un composant envers son environnement (services, routeur, état global). Un composant de présentation vise un couplage minimal : il fonctionne pareil, peu importe où et par qui il est utilisé."
quiz:
  - question: "Dans une page catalogue, quel composant est responsable d'appeler `ProduitService` pour charger la liste des produits ?"
    choix:
      - "Le composant de présentation, car il affiche les produits"
      - "Le composant intelligent, qui récupère les données puis les transmet en entrée au composant de présentation"
      - "Peu importe, les deux approches sont strictement équivalentes"
      - "Aucun des deux : c'est toujours au routeur de charger les données via un resolver"
    reponse: 1
    explication: "Le composant intelligent (ex. CataloguePage) connaît les services et orchestre le chargement des données ; le composant de présentation (ex. ProduitCarte) ne fait qu'afficher ce qu'on lui donne. Un resolver est une option pour charger des données avant navigation, mais ce n'est pas une obligation ni une remise en cause du découpage intelligent/présentation."
  - question: "`ProduitCarte` est un composant de présentation avec `changeDetection: ChangeDetectionStrategy.OnPush` et une entrée `produit = input.required<Produit>();`. Le parent détient `produits = signal<Produit[]>([...]);` et fait `this.produits().push(nouveauProduit)` sans appeler `.set()` ni `.update()`. Que se passe-t-il ?"
    code: |
      // Parent (intelligent)
      produits = signal<Produit[]>([produitA, produitB]);

      ajouter(produit: Produit) {
        this.produits().push(produit); // mutation en place
      }
    choix:
      - "OnPush bloque totalement le composant, il faut retirer OnPush pour que ça fonctionne"
      - "Le nouveau produit n'apparaît dans aucune carte, car pousser dans le tableau ne change pas la référence lue par le signal : ni le signal ni les entrées qui en dépendent ne sont notifiés"
      - "Angular détecte automatiquement la mutation et met à jour l'affichage, car c'est le même tableau"
      - "Une erreur est levée au moment du push, car signal() interdit toute mutation"
      - "Le nouveau produit apparaît immédiatement, OnPush n'a aucun effet sur les signaux"
    reponse: 1
    explication: "Ce n'est pas un problème d'OnPush : c'est la même règle que pour tout signal. push() mute le tableau existant sans appeler .set() ni .update(), donc le signal ne notifie personne — ni le parent, ni un éventuel `computed()`, ni les composants enfants qui liraient ce signal. La correction est `this.produits.update((liste) => [...liste, produit])`, qui crée un nouveau tableau et déclenche la propagation. C'est une bonne raison de préférer OnPush avec des signaux : le couple force à traiter l'état de façon immuable, ce qui évite ce genre de bug."
  - question: "Une équipe découpe systématiquement chaque bouton et chaque libellé de l'application en un composant « intelligent » + un composant « de présentation » séparés, même pour un simple bouton d'envoi sans aucune logique. Quel est le problème ?"
    choix:
      - "Aucun : plus il y a de composants séparés, plus le code est maintenable"
      - "Ce découpage n'a de sens que quand il y a une vraie logique à isoler (accès aux données, état, navigation) ; l'appliquer à des éléments triviaux ajoute des fichiers et des indirections sans bénéfice réel"
      - "Angular limite le nombre de composants qu'une application peut contenir"
      - "OnPush ne peut être utilisé que sur un nombre limité de composants par application"
    reponse: 1
    explication: "Le découpage intelligent/présentation a un coût (un fichier de plus, une entrée et une sortie de plus à maintenir) qui se justifie par un gain réel : réutilisation, test en isolation, lisibilité d'un composant qui ferait sinon trop de choses. Un bouton sans aucune logique métier n'a rien à gagner à être scindé en deux composants ; le découpage devient alors de la sur-ingénierie."
---

## Essentiel

Le découpage intelligent / présentation sépare deux responsabilités qui, mélangées dans un seul composant, le rendent vite difficile à tester et à réutiliser :

- Un **composant intelligent** (container) connaît les services, le routeur, l'état applicatif. Il récupère les données et décide de la logique métier.
- Un **composant de présentation** ne connaît que ce qu'on lui transmet via `input()`, et notifie ses actions via `output()`. Il n'injecte aucun service métier.

```ts
// Composant de présentation : ne connaît que ses entrées et ses sorties
@Component({
  selector: 'app-produit-carte',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3>{{ produit().nom }}</h3>
    <p>{{ produit().prix }} €</p>
    <button (click)="ajoute.emit(produit())">Ajouter au panier</button>
  `,
})
export class ProduitCarte {
  produit = input.required<Produit>();
  ajoute = output<Produit>();
}
```

Les données descendent (entrées), les actions remontent (sorties) : jamais l'inverse. Ce flux unidirectionnel rend le composant de présentation prévisible et facile à tester : lui donner des entrées, vérifier ce qu'il émet, sans simuler le moindre service.

Le bénéfice principal est la **réutilisation** (le même `ProduitCarte` sert dans le catalogue, les résultats de recherche, une liste de favoris) et la **testabilité** (pas besoin de simuler `ProduitService` pour tester l'affichage d'une carte). Mais ce découpage a un coût : un fichier, une entrée et une sortie de plus à maintenir. Pour un élément trivial sans logique (un simple bouton), ça n'en vaut pas la peine.

## Détail

### Comment ça marche avec des signaux

Avec les entrées et sorties à base de signaux, le composant de présentation lit ses entrées comme n'importe quel signal, y compris dans un `computed()` interne s'il a besoin d'une valeur dérivée. Marqué `ChangeDetectionStrategy.OnPush`, il ne se re-rend que si une de ses entrées change de référence, si un événement se produit dans son propre template, ou si un signal qu'il lit change — ce qui correspond exactement à la façon dont un composant de présentation est censé fonctionner : son affichage dépend uniquement de ses entrées.

### Exemple 1 — Composant intelligent : `CataloguePage`

```ts
@Component({
  selector: 'app-catalogue-page',
  imports: [ProduitCarte],
  template: `
    @for (produit of produits(); track produit.id) {
      <app-produit-carte [produit]="produit" (ajoute)="ajouterAuPanier($event)" />
    }
  `,
})
export class CataloguePage {
  private produitService = inject(ProduitService);
  private panierService = inject(PanierService);

  produits = toSignal(this.produitService.lister(), { initialValue: [] });

  ajouterAuPanier(produit: Produit) {
    this.panierService.ajouter(produit);
  }
}
```

`CataloguePage` connaît deux services et décide quoi faire d'un événement « ajoute ». Il ne sait rien afficher lui-même de la carte produit : il délègue entièrement l'affichage à `ProduitCarte`.

### Exemple 2 — Composant de présentation complet : `ProduitCarte`

```ts
@Component({
  selector: 'app-produit-carte',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DevisePipe],
  template: `
    <article class="carte">
      <h3>{{ produit().nom }}</h3>
      <p>{{ produit().prix | devise }}</p>
      <button [disabled]="produit().rupture" (click)="ajoute.emit(produit())">
        {{ produit().rupture ? 'Rupture de stock' : 'Ajouter au panier' }}
      </button>
    </article>
  `,
})
export class ProduitCarte {
  produit = input.required<Produit>();
  ajoute = output<Produit>();
}
```

`ProduitCarte` ne connaît ni `ProduitService`, ni `PanierService`, ni le routeur. Il fonctionnerait à l'identique dans n'importe quelle autre page qui a une liste de `Produit` à afficher.

### Exemple 3 — Tester `ProduitCarte` sans simuler de service

```ts
it('émet le produit au clic sur Ajouter', () => {
  const fixture = TestBed.createComponent(ProduitCarte);
  fixture.componentRef.setInput('produit', produitDeTest);
  const emissions: Produit[] = [];
  fixture.componentInstance.ajoute.subscribe((p) => emissions.push(p));

  fixture.detectChanges();
  fixture.nativeElement.querySelector('button').click();

  expect(emissions).toEqual([produitDeTest]);
});
```

Aucun service à simuler : on fournit une entrée, on déclenche un clic, on vérifie la sortie. Tester `CataloguePage` demanderait à l'inverse de simuler `ProduitService` et `PanierService`.

### Composant intelligent contre composant de présentation

| | Composant intelligent | Composant de présentation |
|---|---|---|
| Injecte des services métier | Oui | Non |
| Connaît le routeur, l'état global | Souvent | Jamais |
| Reçoit ses données par | Services, résolveurs | `input()` uniquement |
| Communique vers l'extérieur par | Navigation, appels de service | `output()` uniquement |
| Se teste en | Simulant les services injectés | Fournissant des entrées, lisant les sorties |
| Réutilisable tel quel ailleurs | Rarement | Généralement oui |

### Pièges courants

> **Injecter un service métier dans un composant de présentation « pour aller plus vite ».** Dès qu'un `ProduitCarte` injecte `PanierService` directement au lieu d'émettre un `output()`, il perd sa testabilité en isolation et sa réutilisabilité : il devient couplé à ce service précis, impossible à réutiliser dans un contexte qui n'a pas ce service, et impossible à tester sans le simuler.

> **Appliquer le découpage à un élément sans aucune logique.** Scinder un simple bouton d'envoi ou un titre de page en « composant intelligent » + « composant de présentation » ajoute des fichiers et des entrées/sorties sans aucun bénéfice, puisqu'il n'y a rien à isoler. Réserver ce découpage aux composants qui mélangeraient vraiment accès aux données et affichage.

> **Muter une entrée reçue par le composant de présentation.** `ProduitCarte` ne doit jamais modifier l'objet `produit()` qu'on lui passe (par exemple en réassignant une de ses propriétés) : ce n'est pas son rôle, et ça contourne le flux de données descendant. Toute modification doit remonter au parent via un `output()`.

### À retenir

- Composant intelligent : services, état, logique métier. Composant de présentation : entrées et sorties seulement.
- Le flux de données est **unidirectionnel** : entrées vers le bas, sorties vers le haut.
- `OnPush` convient naturellement aux composants de présentation, et combiné aux signaux, il force à traiter l'état de façon immuable.
- Le gain principal est la testabilité en isolation et la réutilisation — pas un objectif en soi.
- Réserver ce découpage aux composants qui ont réellement une logique à isoler ; l'appliquer partout est de la sur-ingénierie.
