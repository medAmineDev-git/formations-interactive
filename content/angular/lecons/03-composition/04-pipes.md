---
id: pipes
chapitre: composition
ordre: 4
titre: "Les pipes"
termes:
  - terme: Pipe
    definition: "Fonction de transformation utilisable directement dans un template avec la syntaxe `valeur | nomDuPipe`. Reçoit une valeur en entrée et retourne la valeur transformée, sans modifier la donnée d'origine."
  - terme: "@Pipe"
    definition: "Décorateur qui définit un pipe personnalisé. La classe doit implémenter l'interface `PipeTransform` avec une méthode `transform(valeur, ...parametres)`. Standalone par défaut, comme un composant ou une directive."
  - terme: Pipe pur (pure)
    definition: "Comportement **par défaut** d'un pipe : Angular ne réexécute `transform()` que si la référence de l'entrée change (nouvelle valeur, nouveau tableau...), pas si le contenu d'un objet ou tableau existant est muté en place. Le plus performant."
  - terme: Pipe impur (impure)
    definition: "Pipe déclaré avec `pure: false`, réexécuté à **chaque cycle de détection de changements**, que l'entrée ait changé ou non. Nécessaire pour observer une mutation interne (ex. un tableau modifié par `push`), mais coûteux en performance sur une grande vue."
  - terme: "AsyncPipe"
    definition: "Pipe intégré (`| async`) qui s'abonne automatiquement à un `Observable` ou une `Promise`, affiche la dernière valeur émise, et se désabonne automatiquement quand le composant est détruit — évite les fuites de mémoire d'un abonnement manuel oublié."
  - terme: Chaînage de pipes
    definition: "Plusieurs pipes peuvent s'enchaîner avec `|` successifs (`valeur | pipe1 | pipe2`) : chaque pipe reçoit le résultat du précédent. L'ordre a une importance."
quiz:
  - question: "Que produit `{{ 12.5 | currency: 'EUR' }}` dans un template Angular ?"
    choix:
      - "Une chaîne au format monétaire, par exemple « 12,50 € », selon la locale de l'application"
      - "Le nombre 12.5 sans transformation"
      - "Une erreur : `currency` exige un objet, pas un nombre"
      - "« EUR 12.5 » sans formatage des décimales"
    reponse: 0
    explication: "Le pipe `currency` formate un nombre selon un code de devise (ici `EUR`) et la locale configurée dans l'application, avec le bon nombre de décimales et le symbole à la bonne position. Le format exact (virgule, position du symbole) dépend de la locale active."
  - question: "Un composant affiche une liste de produits avec `{{ produits | filtrerParStock }}`. Le pipe `FiltrerParStock` est pur (par défaut). Un bouton fait `this.produits.push(nouveauProduit)` sans réaffecter `this.produits`. Que se passe-t-il à l'écran ?"
    code: |
      @Pipe({ name: 'filtrerParStock' })
      export class FiltrerParStock implements PipeTransform {
        transform(produits: Produit[]): Produit[] {
          return produits.filter((p) => p.stock > 0);
        }
      }
    choix:
      - "La liste affichée se met à jour immédiatement avec le nouveau produit"
      - "Rien ne change à l'écran : un pipe pur ne réexécute `transform()` que si la référence du tableau change"
      - "Une erreur est levée au prochain cycle de détection de changements"
      - "Le pipe devient automatiquement impur dès qu'un `push` est détecté"
    reponse: 1
    explication: "`push` mute le tableau existant sans changer sa référence. Un pipe pur compare les références d'entrée : comme `produits` pointe toujours vers le même tableau, `transform()` n'est pas réexécuté. Pour que la vue se mette à jour, il faut soit réaffecter le tableau (`this.produits = [...this.produits, nouveauProduit]`), soit rendre le pipe impur (`pure: false`, au prix de la performance)."
  - question: "Pour afficher `commande.total()` calculé à partir de plusieurs signaux (sous-total, remise, frais de port), quelle approche la documentation Angular recommande-t-elle plutôt qu'un pipe personnalisé ?"
    choix:
      - "Un pipe impur, réévalué à chaque cycle"
      - "Un `computed()` dans la classe du composant, affiché directement dans le template"
      - "Un `effect()` qui met à jour une propriété simple"
      - "`AsyncPipe` sur un `Observable` dérivé"
    reponse: 1
    explication: "Quand la transformation ne dépend que de signaux déjà présents dans le composant, `computed()` fait le même travail qu'un pipe personnalisé : il ne recalcule que si une de ses dépendances change, et se lit directement (`total()`) dans le template, sans déclarer de `@Pipe` séparé. Un pipe personnalisé garde son intérêt pour une transformation réutilisée dans plusieurs composants indépendants."
---

## Essentiel

Un **pipe** transforme une valeur directement dans le template, avec la syntaxe `valeur | nomDuPipe`.

```html
<p>{{ produit.prix | currency: 'EUR' }}</p>
<p>{{ produit.dateAjout | date: 'longDate' }}</p>
<p>{{ tauxRemise | percent }}</p>
```

Pipes intégrés les plus courants : `date`, `currency`, `number`, `percent`, `json` (débogage), `slice` (extrait d'une liste ou d'une chaîne), `keyvalue` (itérer sur les propriétés d'un objet), `async` (résout un `Observable`/`Promise`). Un pipe peut prendre des paramètres après `:` et plusieurs pipes peuvent s'enchaîner.

```html
@for (p of produits | slice: 0 : 3; track p.id) {
  <li>{{ p.nom }}</li>
}
```

On peut créer son propre pipe avec `@Pipe` et une méthode `transform()` :

```ts
@Pipe({ name: 'remise' })
export class RemisePipe implements PipeTransform {
  transform(prix: number, taux: number): number {
    return prix * (1 - taux);
  }
}
```

Par défaut, un pipe est **pur** : il ne se réexécute que si la référence de son entrée change, ce qui est performant. Un pipe **impur** (`pure: false`) se réexécute à chaque cycle de détection de changements. Quand la transformation ne dépend que de signaux déjà présents dans le composant, un `computed()` fait souvent aussi bien qu'un pipe personnalisé, sans déclaration séparée.

## Détail

### Exemple 1 — Pipes intégrés et paramètres

```html
<p>{{ commande.date | date: 'dd/MM/yyyy' }}</p>
<p>{{ commande.total | currency: 'EUR' : 'symbol' : '1.2-2' }}</p>
<p>{{ produit.noteMoyenne | number: '1.1-1' }}</p>
<p>{{ produit.stockRestant / produit.stockInitial | percent: '1.0-0' }}</p>
<pre>{{ commande | json }}</pre>
```

`currency` accepte un code de devise, un affichage (`symbol`, `code`), et un format `minEntiers.minDecimales-maxDecimales`. `number` et `percent` acceptent ce même format de décimales. `json` sert surtout au débogage : il affiche la structure brute d'un objet dans le template.

### Exemple 2 — Chaînage et `keyvalue`

```html
<!-- chaînage : slice puis json, pour déboguer un extrait de liste -->
<pre>{{ produits | slice: 0 : 2 | json }}</pre>

<!-- itérer sur les entrées d'un objet -->
@for (entree of stockParEntrepot() | keyvalue; track entree.key) {
  <li>{{ entree.key }} : {{ entree.value }} unités</li>
}
```

Chaque pipe de la chaîne reçoit le résultat du précédent : ici `slice` réduit d'abord la liste, puis `json` la formate pour l'affichage.

### Exemple 3 — Pipe personnalisé

```ts
// remise.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'remise' })
export class RemisePipe implements PipeTransform {
  transform(prix: number, tauxPourcent: number = 0): number {
    if (tauxPourcent <= 0) return prix;
    return prix * (1 - tauxPourcent / 100);
  }
}
```

```html
<p>{{ produit.prix | remise: 20 | currency: 'EUR' }}</p>
```

Le pipe est standalone : il doit être ajouté au tableau `imports` du composant qui l'utilise, comme un composant ou une directive. `transform()` peut prendre autant de paramètres que nécessaire après le premier (la valeur d'entrée).

### Exemple 4 — Pur vs impur

```ts
// pur (par défaut) : ne se réexécute que si "produits" change de référence
@Pipe({ name: 'enStock' })
export class EnStockPipe implements PipeTransform {
  transform(produits: Produit[]): Produit[] {
    return produits.filter((p) => p.stock > 0);
  }
}

// impur : se réexécute à chaque cycle de détection de changements
@Pipe({ name: 'enStockImpur', pure: false })
export class EnStockImpurPipe implements PipeTransform {
  transform(produits: Produit[]): Produit[] {
    return produits.filter((p) => p.stock > 0);
  }
}
```

Le second détecte une mutation interne (`produits.push(...)` sans réaffectation) mais recalcule le filtrage à chaque cycle, même sans changement réel — coûteux sur une longue liste.

### Pipe et signaux : `computed()` souvent suffisant

```ts
export class LigneCommande {
  prix = input.required<number>();
  quantite = input.required<number>();
  remise = input(0);

  // équivalent d'un pipe "remise", mais local au composant
  total = computed(() => this.prix() * this.quantite() * (1 - this.remise() / 100));
}
```

```html
<p>{{ total() | currency: 'EUR' }}</p>
```

Un pipe personnalisé garde son intérêt quand la même transformation doit être **réutilisée telle quelle dans plusieurs composants indépendants**, ou appliquée directement à une valeur brute du template sans passer par une propriété de la classe. Pour un calcul purement dérivé de signaux déjà présents dans le composant, `computed()` est plus direct.

### `AsyncPipe` avec un observable

```ts
export class ListeCommandes {
  private commandeService = inject(CommandeService);
  commandes$ = this.commandeService.rechercher();
}
```

```html
@for (commande of commandes$ | async; track commande.id) {
  <li>{{ commande.reference }}</li>
}
```

`async` s'abonne à `commandes$` au premier rendu et se désabonne automatiquement à la destruction du composant. C'est la façon la plus sûre d'afficher un `Observable` dans un template sans gérer l'abonnement à la main. Pour un signal, aucun pipe n'est nécessaire : il s'affiche directement en l'appelant (`{{ maValeur() }}`).

### Comparatif pur / impur

| | Réexécuté quand | Coût | Cas d'usage |
|---|---|---|---|
| Pur (défaut) | la référence de l'entrée change | faible | quasiment tous les cas |
| Impur (`pure: false`) | à chaque cycle de détection | élevé sur grande vue | détecter une mutation en place, rare |

### Pièges courants

> **Muter un tableau/objet et s'attendre à ce qu'un pipe pur réagisse.** `tableau.push(x)` ne change pas la référence de `tableau` : un pipe pur ne revoit rien de nouveau. Réaffecter (`tableau = [...tableau, x]`) ou rendre le pipe impur (en connaissance du coût).

> **Pipe impur sur une liste longue ou une vue qui se rafraîchit souvent.** Chaque cycle de détection de changements réexécute `transform()`, même sans changement réel : sur une liste de plusieurs centaines d'éléments, l'impact sur les performances devient visible.

> **Appeler une méthode de la classe dans le template au lieu d'un pipe ou d'un `computed()`.** `{{ calculerTotal() }}` réexécute la méthode à **chaque** cycle de détection, sans mémoïsation, contrairement à un pipe pur ou à un `computed()` qui ne recalculent que si leurs entrées changent.

### À retenir

- Pipes intégrés utiles : `date`, `currency`, `number`, `percent`, `json`, `slice`, `keyvalue`, `async`.
- Un pipe personnalisé s'écrit avec `@Pipe` et `PipeTransform.transform()`, et s'ajoute au tableau `imports` du composant qui l'utilise.
- Pur (par défaut) : réexécuté seulement si la référence de l'entrée change. Impur (`pure: false`) : réexécuté à chaque cycle, plus coûteux.
- Pour une valeur dérivée de signaux déjà dans le composant, `computed()` remplace souvent un pipe personnalisé.
- `AsyncPipe` gère l'abonnement et le désabonnement d'un `Observable`/`Promise` automatiquement ; un signal s'affiche directement, sans pipe.
