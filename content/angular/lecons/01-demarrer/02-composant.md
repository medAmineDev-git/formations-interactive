---
id: composant
chapitre: demarrer
ordre: 2
titre: "Le composant"
termes:
  - terme: "@Component"
    definition: "Décorateur qui transforme une classe TypeScript en composant Angular. Ses métadonnées décrivent le sélecteur, le template, les styles et les dépendances du composant."
  - terme: selector
    definition: "Nom de balise (ou attribut) utilisé pour insérer le composant dans un template, ex. `app-produit-card`. Par convention, un préfixe applicatif (`app-`) distingue les composants « maison » des éléments HTML natifs."
  - terme: Composant standalone
    definition: "Composant qui déclare directement ses dépendances (autres composants, directives, pipes) dans sa propriété `imports`, sans passer par un `NgModule`. **Comportement par défaut** depuis Angular 19 : pas besoin d'écrire `standalone: true`."
  - terme: "template / templateUrl"
    definition: "`template` définit le HTML du composant **en ligne**, sous forme de chaîne. `templateUrl` référence un fichier `.html` séparé. Un composant utilise l'un ou l'autre, jamais les deux."
  - terme: "styles / styleUrl"
    definition: "`styles` définit du CSS en ligne (tableau de chaînes). `styleUrl` référence **un** fichier de styles (chaîne unique) : c'est la syntaxe recommandée pour une seule feuille de style, `styleUrls` (tableau) restant utilisable pour plusieurs fichiers."
  - terme: Crochets de cycle de vie
    definition: "Méthodes que le composant peut implémenter pour réagir à des moments précis de sa vie : `ngOnInit` (initialisation, une fois les `@Input()` posés), `ngOnDestroy` (juste avant destruction, pour nettoyer abonnements et minuteurs)."
  - terme: afterNextRender
    definition: "Fonction qui exécute un callback **une seule fois**, juste après le prochain rendu du composant dans le DOM. Utile pour une manipulation ponctuelle du DOM ou l'appel d'une librairie tierce qui a besoin des éléments déjà rendus."
quiz:
  - question: "Que faut-il ajouter à ce composant pour qu'il puisse utiliser `ProduitCard` dans son template ?"
    code: |
      @Component({
        selector: 'app-liste-produits',
        templateUrl: './liste-produits.html',
      })
      export class ListeProduits {
        produits = [/* ... */];
      }
    choix:
      - "Rien, tous les composants du projet sont disponibles partout"
      - "Ajouter `ProduitCard` au tableau `imports` des métadonnées `@Component`"
      - "Déclarer `ProduitCard` dans un `NgModule` partagé"
      - "Ajouter `import { ProduitCard } from './produit-card'` dans le template HTML"
    reponse: 1
    explication: "Un composant standalone déclare explicitement ce qu'il utilise dans son template via `imports` : `@Component({ ..., imports: [ProduitCard] })`. Sans cet ajout, Angular ne reconnaît pas la balise `<app-produit-card>` et affiche une erreur au compilateur."
  - question: "Un composant a besoin de fermer un abonnement RxJS manuel quand il est retiré de la page. Quel crochet de cycle de vie utiliser ?"
    choix:
      - "ngOnInit"
      - "ngOnDestroy"
      - "afterNextRender"
      - "ngOnChanges"
    reponse: 1
    explication: "`ngOnDestroy` s'exécute juste avant que le composant soit détruit : c'est l'endroit pour appeler `subscription.unsubscribe()`, arrêter un `setInterval`, etc. `ngOnInit` s'exécute à la création, pas à la destruction."
  - question: "Que se passe-t-il si un composant définit à la fois `template` et `templateUrl` ?"
    code: |
      @Component({
        selector: 'app-fiche-produit',
        template: '<p>Version en ligne</p>',
        templateUrl: './fiche-produit.html',
      })
      export class FicheProduit {}
    choix:
      - "Angular fusionne les deux templates"
      - "Le compilateur refuse la configuration : c'est une erreur"
      - "Seul templateUrl est pris en compte silencieusement"
      - "Seul template est pris en compte silencieusement"
    reponse: 1
    explication: "`template` et `templateUrl` sont mutuellement exclusifs : un composant ne peut définir son HTML que d'une seule façon. Les combiner provoque une erreur de compilation, pas un comportement silencieux."
---

## Essentiel

Un **composant** Angular est une classe TypeScript décorée par `@Component`. Il combine un sélecteur (le nom de balise à utiliser dans un template), un template (le HTML) et éventuellement des styles.

```ts
import { Component } from '@angular/core';
import { ProduitCard } from './produit-card/produit-card';

@Component({
  selector: 'app-liste-produits',
  imports: [ProduitCard],
  templateUrl: './liste-produits.html',
  styleUrl: './liste-produits.css',
})
export class ListeProduits {
  produits = [
    { id: 1, nom: 'Casque audio', prix: 79 },
    { id: 2, nom: 'Clavier mécanique', prix: 129 },
  ];
}
```

Depuis Angular 19, un composant est **standalone par défaut** : pas besoin d'écrire `standalone: true`. Il déclare directement, dans `imports`, les autres composants, directives et pipes qu'il utilise dans son template — plus de `NgModule` à faire intervenir.

La classe elle-même est un objet TypeScript ordinaire : ses propriétés (`produits` ci-dessus) sont lues par le template, et ses méthodes peuvent réagir à des événements ou au cycle de vie du composant (`ngOnInit` à l'initialisation, `ngOnDestroy` à la destruction). La logique métier lourde (appels réseau, calculs partagés) se place plutôt dans un **service** injecté, pour garder le composant concentré sur l'affichage.

Le CLI génère la structure de base : `ng generate component produits/produit-card` crée la classe, son template, ses styles et son fichier de test.

## Détail

### Comment ça marche

Angular instancie un composant chaque fois que son sélecteur apparaît dans un template rendu. Les métadonnées de `@Component` disent à Angular :

- **quel élément** reconnaître (`selector`),
- **quel HTML** afficher (`template` ou `templateUrl`),
- **quel CSS** appliquer, avec un encapsulement propre au composant par défaut (`styles` ou `styleUrl`),
- **quelles dépendances** le template peut utiliser (`imports`).

### Exemple 1 — Un composant complet

```ts
// produit-card.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-produit-card',
  templateUrl: './produit-card.html',
  styleUrl: './produit-card.css',
})
export class ProduitCard {
  nom = input.required<string>();
  prix = input.required<number>();
}
```

```html
<!-- produit-card.html -->
<article class="carte">
  <h3>{{ nom() }}</h3>
  <p>{{ prix() }} €</p>
</article>
```

`nom` et `prix` sont des entrées à base de signal (détaillées dans le chapitre « Les signaux ») : le template les lit comme des fonctions, `nom()` et `prix()`.

### Exemple 2 — Cycle de vie : charger des données à l'initialisation

```ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { PanierService } from './panier-service';

@Component({
  selector: 'app-panier',
  templateUrl: './panier.html',
})
export class Panier implements OnInit, OnDestroy {
  private panierService = inject(PanierService);
  private minuteurRelance?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.panierService.chargerPanierEnCours();
    this.minuteurRelance = setInterval(() => this.panierService.verifierExpiration(), 30_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.minuteurRelance);
  }
}
```

`ngOnInit` s'exécute une fois, après qu'Angular a posé les éventuelles entrées du composant. `ngOnDestroy` est l'endroit pour nettoyer tout ce qui vivrait plus longtemps que le composant (minuteurs, abonnements manuels, écouteurs d'événements posés à la main).

### Exemple 3 — Après le rendu, avec `afterNextRender`

```ts
import { Component, ElementRef, afterNextRender, inject } from '@angular/core';

@Component({
  selector: 'app-fiche-produit',
  templateUrl: './fiche-produit.html',
})
export class FicheProduit {
  private elementRef = inject(ElementRef);

  constructor() {
    afterNextRender(() => {
      // le DOM du composant est garanti présent ici
      this.elementRef.nativeElement.querySelector('img')?.focus();
    });
  }
}
```

`afterNextRender` s'exécute une seule fois, après le prochain rendu — utile pour une lecture ou manipulation ponctuelle du DOM, ou pour initialiser une librairie tierce qui a besoin des éléments déjà présents dans la page.

### Où placer la logique ?

| Dans le composant | Dans un service |
|---|---|
| Affichage, mise en forme des données pour le template | Appels HTTP, accès aux données |
| Réaction directe à un événement UI (clic, saisie) | Règles métier partagées entre plusieurs composants |
| État propre à cet écran | État partagé entre plusieurs écrans |

Un composant qui grossit avec de la logique métier redondante d'un écran à l'autre est un signal pour extraire cette logique dans un service, injecté avec `inject()`.

### Pièges courants

> **Utiliser `template` et `templateUrl` en même temps.** Les deux options sont exclusives : le compilateur refuse la configuration. Choisir l'une ou l'autre selon que le HTML est court (en ligne) ou mieux dans un fichier séparé.

> **Oublier un composant dans `imports`.** Sans `ProduitCard` dans `imports`, Angular ne reconnaît pas `<app-produit-card>` dans le template : erreur de compilation (élément inconnu), pas un simple avertissement silencieux.

> **Mettre toute la logique métier dans le composant.** Un composant qui appelle directement une API, transforme des données complexes et gère l'affichage devient difficile à tester et à réutiliser. Extraire cette logique dans un service testable séparément.

### À retenir

- `@Component` décrit un composant : `selector`, `template`/`templateUrl`, `styles`/`styleUrl`, `imports`.
- Standalone par défaut depuis Angular 19 : les dépendances du template se déclarent dans `imports`, sans `NgModule`.
- `ngOnInit` pour initialiser, `ngOnDestroy` pour nettoyer ; `afterNextRender` pour agir juste après le premier rendu.
- La logique métier partagée et les accès aux données vont plutôt dans un service injecté.
- `ng generate component` respecte les conventions du projet (nom de fichier, sélecteur préfixé).
