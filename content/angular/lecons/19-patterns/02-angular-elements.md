---
id: angular-elements
chapitre: patterns-avances
ordre: 2
titre: "Angular Elements et Web Components"
termes:
  - terme: "Web Component"
    definition: "Standard du navigateur (Custom Elements + Shadow DOM) permettant de définir un élément HTML personnalisé (`<mon-widget>`) utilisable dans n'importe quelle page, quelle que soit la technologie qui l'a produit."
  - terme: "createCustomElement()"
    definition: "Fonction de `@angular/elements` qui transforme un composant Angular en classe conforme à l'API `Custom Elements` du navigateur. Signature : `createCustomElement(MonComposant, { injector })`."
  - terme: "customElements.define()"
    definition: "API native du navigateur qui enregistre une classe d'élément personnalisé sous un nom de balise (obligatoirement avec un tiret, ex. `avis-produit`). Une fois enregistrée, la balise peut être utilisée dans n'importe quel HTML, y compris hors d'Angular."
  - terme: "CUSTOM_ELEMENTS_SCHEMA"
    definition: "Schéma à ajouter aux métadonnées d'un composant Angular pour autoriser dans son template des balises et propriétés inconnues du compilateur (typiquement des Web Components tiers), sans lever d'erreur de compilation."
  - terme: "CustomEvent / detail"
    definition: "Les sorties (`output()`) d'un composant transformé en élément personnalisé sont émises comme des `CustomEvent` DOM standards ; la valeur émise se trouve dans la propriété `detail` de l'événement."
  - terme: "Attribut vs propriété"
    definition: "Un attribut HTML est toujours une chaîne de caractères ; une propriété JavaScript peut contenir n'importe quelle valeur (objet, tableau). Les entrées simples d'un élément Angular Elements peuvent être passées en attribut, mais une entrée complexe (objet, tableau) doit être affectée en propriété JavaScript (`element.produit = {...}`)."
quiz:
  - question: "Une boutique construite en PHP veut intégrer un widget d'avis produit écrit en Angular, sans réécrire le reste du site. Quelle approche est la plus adaptée ?"
    choix:
      - "Réécrire tout le site en Angular, seule façon d'y intégrer un composant Angular"
      - "Exposer le composant `AvisProduit` avec `createCustomElement()` puis `customElements.define('avis-produit', ...)`, et insérer `<avis-produit produit-id=\"42\">` dans la page PHP comme n'importe quelle balise HTML"
      - "Utiliser `NgComponentOutlet` : cette directive fonctionne aussi bien en dehors d'une application Angular"
      - "Copier le HTML compilé du composant dans la page PHP sans passer par Angular Elements"
    reponse: 1
    explication: "Angular Elements sert exactement ce cas : transformer un composant Angular en balise HTML standard, utilisable dans n'importe quelle page, quelle que soit sa technologie. `NgComponentOutlet` est une directive de template Angular : elle exige d'être déjà dans une application Angular, elle ne fonctionne pas dans une page PHP brute."
  - question: "Ce template Angular consomme un Web Component tiers (`<emoji-picker>`) qui n'existe dans aucun module Angular. Que se passe-t-il sans intervention ?"
    code: |
      @Component({
        selector: 'app-editeur-avis',
        template: `<emoji-picker (emoji-click)="ajouter($event)" />`,
      })
      export class EditeurAvis {}
    choix:
      - "Angular ignore silencieusement la balise inconnue et n'affiche rien"
      - "Le compilateur de templates lève une erreur car `emoji-picker` n'est ni un composant Angular connu ni un élément HTML standard reconnu"
      - "Angular charge automatiquement la définition du Web Component depuis un registre public"
      - "Le code compile sans problème, `output()` étant compatible nativement avec tout événement DOM"
    reponse: 1
    explication: "Sans `CUSTOM_ELEMENTS_SCHEMA` dans les métadonnées du composant, le compilateur de templates Angular refuse toute balise ou attribut qu'il ne reconnaît pas comme un composant/directive Angular ou un élément HTML standard. Ajouter `schemas: [CUSTOM_ELEMENTS_SCHEMA]` autorise `<emoji-picker>` et ses attributs."
  - question: "Un composant Angular exposé en élément personnalisé a une entrée `produit = input<Produit>()` où `Produit` est un objet complexe. Comment lui transmettre une valeur depuis du JavaScript classique (hors Angular) ?"
    choix:
      - "En attribut HTML : `<fiche-produit produit=\"{ id: 1 }\">`, comme n'importe quelle chaîne"
      - "En propriété JavaScript sur l'élément : `document.querySelector('fiche-produit').produit = { id: 1, nom: 'Casque' }`, car un attribut HTML ne peut contenir qu'une chaîne de caractères"
      - "Ce n'est pas possible : Angular Elements ne supporte que des entrées de type primitif (chaîne, nombre, booléen)"
      - "En appelant `customElements.define()} une seconde fois avec la valeur en argument"
    reponse: 1
    explication: "Un attribut HTML est toujours une chaîne : y placer un objet obligerait à le sérialiser puis le parser manuellement. La bonne pratique pour une donnée complexe est d'affecter directement la propriété JavaScript de l'élément, qui accepte n'importe quel type — c'est ce que fait Angular en interne pour relier la propriété DOM à l'entrée du composant."
---

## Essentiel

**Angular Elements** (`@angular/elements`) transforme un composant Angular en **Web Component** : un élément HTML personnalisé, utilisable dans n'importe quelle page — Angular ou non — via `customElements.define()`. Cas d'usage réel : un widget (avis produit, chat, calculateur de livraison) à intégrer dans un site tiers non-Angular, ou dans une grande application existante qu'on migre progressivement composant par composant.

```ts
import { createCustomElement } from '@angular/elements';

const injector = createApplication(...).then(appRef => appRef.injector); // ou l'injecteur d'une app Angular existante
const ElementAvisProduit = createCustomElement(AvisProduit, { injector });
customElements.define('avis-produit', ElementAvisProduit);
```

```html
<!-- dans une page qui n'a jamais entendu parler d'Angular -->
<avis-produit produit-id="42"></avis-produit>
```

Les entrées (`input()`) se transmettent en attributs HTML (chaînes) pour les valeurs simples, ou en propriétés JavaScript pour les objets. Les sorties (`output()`) deviennent des `CustomEvent` DOM standards, avec la valeur émise dans `event.detail`.

Dans l'autre sens — consommer un Web Component tiers **dans** un template Angular — le compilateur refuse par défaut les balises et propriétés qu'il ne connaît pas. Il faut ajouter `schemas: [CUSTOM_ELEMENTS_SCHEMA]` au composant qui l'utilise, puis lier propriétés et événements comme sur n'importe quel élément DOM.

Limites à connaître : chaque élément personnalisé embarque le runtime Angular nécessaire à son fonctionnement (un widget isolé pèse plus lourd qu'un composant JS natif équivalent), et une entrée complexe doit être passée en propriété JavaScript, pas en attribut.

## Détail

### Comment ça marche

`createCustomElement()` enveloppe le composant Angular dans une classe conforme à l'API navigateur `Custom Elements` (héritière de `HTMLElement`) : elle gère la création/destruction du composant Angular aux callbacks `connectedCallback`/`disconnectedCallback`, synchronise les attributs observés avec les entrées, et relaie les sorties comme des `CustomEvent`. Une fois enregistrée via `customElements.define()`, la balise est reconnue par le moteur HTML du navigateur, exactement comme `<video>` ou `<input>` — elle n'a plus besoin d'Angular pour être instanciée dans le DOM, seul le bundle JavaScript généré doit être chargé sur la page.

### Exemple 1 — Exposer un widget dans une page non-Angular

```ts
// bootstrap dédié au widget, séparé de l'application principale
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { AvisProduit } from './avis-produit';

createApplication({ providers: [/* ... */] }).then((app) => {
  const element = createCustomElement(AvisProduit, { injector: app.injector });
  customElements.define('avis-produit', element);
});
```

```html
<script src="avis-produit-widget.js"></script>
<avis-produit produit-id="42" langue="fr"></avis-produit>
```

Le site hôte n'a rien à connaître d'Angular : il charge un script et utilise une balise HTML.

### Exemple 2 — Entrée complexe transmise en propriété

```ts
const el = document.querySelector('fiche-produit') as HTMLElement & { produit: Produit };
el.produit = { id: 42, nom: 'Casque audio', prix: 89.9 }; // propriété JS, pas un attribut
```

```ts
@Component({ selector: 'fiche-produit' })
export class FicheProduit {
  produit = input.required<Produit>();
}
```

Un attribut HTML est toujours une chaîne : transmettre un objet impose de passer par la propriété JavaScript de l'élément DOM plutôt que par un attribut sérialisé à la main.

### Exemple 3 — Consommer un Web Component tiers dans Angular

```ts
@Component({
  selector: 'app-editeur-avis',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <emoji-picker
      [locale]="langue()"
      (emoji-click)="ajouterEmoji($event.detail)"
    />
  `,
})
export class EditeurAvis {
  langue = input('fr');

  ajouterEmoji(detail: { unicode: string }) {
    this.texte.update((t) => t + detail.unicode);
  }
}
```

`CUSTOM_ELEMENTS_SCHEMA` autorise la balise `<emoji-picker>` et l'attribut/propriété `locale`, inconnus du compilateur Angular. L'écoute d'événement `(emoji-click)` fonctionne comme n'importe quel événement DOM : Angular n'a pas besoin de connaître le composant à l'avance pour s'abonner à l'événement qu'il émet, la valeur utile est dans `$event.detail`.

### Comparatif

| | Composant Angular classique | Angular Elements | Web Component tiers dans Angular |
|---|---|---|---|
| Où il peut être utilisé | Uniquement dans une app Angular | N'importe quelle page HTML | Uniquement dans un template Angular |
| Entrées | `input()` lié au template | Attribut (simple) ou propriété JS (complexe) | Propriété/attribut natif, souvent sans typage |
| Sorties | `output()` typé | `CustomEvent` avec `detail` | Événement DOM, à typer manuellement |
| Configuration requise | Aucune | `createCustomElement()` + `customElements.define()` | `schemas: [CUSTOM_ELEMENTS_SCHEMA]` |

### Pièges courants

> **Oublier que chaque widget embarque son runtime.** Un composant Angular Elements exporté isolément (bundle séparé de l'application principale) inclut ce dont il a besoin pour fonctionner seul. Sur une page qui charge plusieurs widgets indépendants, ça peut alourdir sensiblement le poids total — à mesurer avant de multiplier les widgets sur une même page.

> **Passer un objet en attribut HTML.** `<fiche-produit produit="[object Object]">` échoue silencieusement : un attribut est une chaîne. Pour une entrée complexe, affecter la propriété JavaScript de l'élément, pas l'attribut.

> **`CUSTOM_ELEMENTS_SCHEMA` appliqué trop largement.** Ce schéma désactive la vérification du compilateur pour **toutes** les balises et propriétés inconnues du composant, pas seulement le Web Component visé — une vraie faute de frappe dans un nom de composant Angular légitime ne sera alors plus détectée à la compilation. À limiter au composant qui en a réellement besoin.

### À retenir

- `createCustomElement(Composant, { injector })` + `customElements.define('nom-balise', ...)` transforme un composant Angular en Web Component utilisable n'importe où.
- Entrées simples → attributs HTML ; entrées complexes (objets, tableaux) → propriétés JavaScript de l'élément.
- Les sorties deviennent des `CustomEvent` : la valeur est dans `event.detail`.
- Pour consommer un Web Component tiers dans un template Angular, `schemas: [CUSTOM_ELEMENTS_SCHEMA]` est nécessaire — à poser sur le composant concerné, pas globalement.
- Chaque élément personnalisé exporté isolément embarque son propre runtime : à surveiller si plusieurs widgets cohabitent sur une même page tierce.
