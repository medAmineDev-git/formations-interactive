---
id: angular-bases
chapitre: angular-a11y
ordre: 1
titre: "Sémantique et templates Angular"
termes:
  - terme: "host / hostBindings"
    definition: "Propriété de `@Component`/`@Directive` qui pose des attributs sur l'élément hôte (`role`, `[attr.aria-label]`, `[class.actif]`…) directement dans la décoration TypeScript, sans les répéter dans chaque template qui utilise le composant."
  - terme: "hostDirectives"
    definition: "Compose une directive dans un composant sans la déclarer dans le template consommateur. Utile pour attacher un comportement accessible (ex. gestion clavier d'un motif ARIA) à plusieurs composants sans dupliquer le code."
  - terme: "@defer"
    definition: "Bloc de template qui retarde le chargement et le rendu d'un sous-arbre (`@placeholder`, `@loading`, `@error`). Le contenu différé est **absent du DOM** tant qu'il n'a pas été déclenché : une aide technique qui parcourt la page ne le voit pas avant son affichage."
  - terme: "NgOptimizedImage"
    definition: "Directive (`ngSrc`) qui optimise le chargement des images (formats, dimensions, priorité) mais ne gère **pas** l'attribut `alt` : il reste à la charge du développeur, exactement comme avec un `<img>` classique."
  - terme: Rôle implicite
    definition: "Rôle ARIA qu'un élément HTML possède nativement sans attribut `role` (`<button>` → *button*, `<nav>` → *navigation*, `<a href>` → *link*). Un composant Angular qui enveloppe un tel élément hérite de ce rôle tant qu'il ne le masque pas avec un `<div>` intermédiaire."
  - terme: Libellé dynamique
    definition: "Texte d'un `aria-label` ou `aria-describedby` recalculé à partir de signaux (`computed()`) et posé via une liaison d'hôte (`'[attr.aria-label]': 'libelle()'`) : il se met à jour automatiquement avec l'état du composant, sans code impératif."
quiz:
  - question: "Un composant `<app-produit-carte>` encapsule tout son contenu, y compris son action principale, dans un seul `<div>` cliquable. Quel est le problème d'accessibilité, indépendamment de tout ARIA ajouté ensuite ?"
    code: |
      @Component({
        selector: 'app-produit-carte',
        template: `
          <div class="carte" (click)="voirDetail()">
            <img [ngSrc]="produit().image" width="300" height="200" alt="" />
            <h3>{{ produit().nom }}</h3>
            <p>{{ produit().prix }} €</p>
          </div>
        `,
      })
      export class ProduitCarte { produit = input.required<Produit>(); }
    choix:
      - "Aucun : un `(click)` sur un `<div>` fonctionne à la souris comme au clavier"
      - "Le `<div>` n'est pas un élément interactif : il n'est pas atteignable au Tab, n'a pas de rôle interactif annoncé et n'active rien avec Entrée ou Espace, quel que soit le contenu qu'il enveloppe"
      - "Le problème vient uniquement de `alt=\"\"` sur l'image, qui devrait contenir le nom du produit"
      - "Angular empêche par défaut les `(click)` sur des éléments non interactifs, donc ce code ne compile pas"
    reponse: 1
    explication: "Le `(click)` déclenche bien une action à la souris, mais un `<div>` reste un élément neutre pour le clavier et les technologies d'assistance : pas de focus, pas de rôle *button*/*link*, pas d'activation avec Entrée/Espace. La solution est d'envelopper la carte dans un vrai élément interactif (un `<a>` si c'est une navigation vers le détail, un `<button>` sinon), pas d'ajouter `role=\"button\"` par-dessus le `<div>`. `alt=\"\"` est ici correct : l'image est redondante avec le nom du produit déjà affiché en texte, donc décorative."
  - question: "Dans quel cas `@defer` demande une attention particulière du point de vue de l'accessibilité, en plus du choix du déclencheur ?"
    choix:
      - "Jamais : `@defer` est purement une optimisation de performance, sans impact sur les technologies d'assistance"
      - "Quand le contenu différé porte une information ou une action que l'utilisateur attend immédiatement dans le flux de la page (ex. le formulaire de paiement) : tant qu'il n'est pas chargé, il est absent du DOM et donc invisible pour une aide technique qui explore la structure"
      - "Uniquement pour des raisons de référencement (SEO), sans rapport avec les lecteurs d'écran"
      - "Seulement si le bloc `@placeholder` est vide"
    reponse: 1
    explication: "Le contenu d'un `@defer` non encore déclenché n'existe simplement pas dans le DOM : une aide technique ne peut ni l'annoncer, ni le trouver dans les repères de page. Différer un bloc secondaire (avis clients, suggestions) pose peu de problème ; différer une zone attendue immédiatement par tous les utilisateurs (formulaire, résumé de commande) peut laisser un utilisateur d'aide technique face à un placeholder sans savoir qu'un contenu va apparaître, surtout si le déclencheur dépend d'une interaction qu'il n'a pas déclenchée (ex. `on hover`)."
  - question: "`NgOptimizedImage` (`ngSrc`) prend-elle en charge l'attribut `alt` à la place du développeur ?"
    choix:
      - "Oui, elle génère un texte alternatif à partir du nom de fichier de l'image"
      - "Non : `alt` reste entièrement à la charge du développeur, exactement comme avec un `<img>` classique — `NgOptimizedImage` optimise le chargement (formats, dimensions, priorité), pas le texte alternatif"
      - "Oui, mais uniquement si l'image dépasse une certaine taille"
      - "Non, et Angular refuse de compiler une balise `ngSrc` sans `alt`"
    reponse: 1
    explication: "`NgOptimizedImage` cible exclusivement la performance de chargement des images (formats modernes, `srcset`, priorisation, avertissements de dimensions manquantes). Le texte alternatif reste une décision humaine : `alt=\"...\"` descriptif pour une image porteuse de sens, `alt=\"\"` pour une image décorative. L'oublier ne provoque aucune erreur de compilation ni avertissement de `NgOptimizedImage`."
---

## Essentiel

Une application monopage part avec un handicap que n'a pas un site classique : sans rechargement de page, le navigateur ne déclenche jamais les événements qu'un lecteur d'écran utilise pour annoncer « nouvelle page » ou « nouveau contenu ». Tout ce qu'Angular fait apparaître, remplacer ou supprimer dans le DOM — un `@if`, un `@for`, une nouvelle vue de route — est **silencieux** par défaut pour une technologie d'assistance, tant que rien n'est fait explicitement pour le signaler. C'est le fil conducteur de tout ce chapitre.

La première ligne de défense reste la même qu'en HTML classique, mais elle se joue maintenant dans un template Angular : préférer l'élément dont le rôle correspond déjà à l'usage plutôt qu'un `<div>` ou un `<span>` transformé à coups d'attributs.

```html
<!-- À éviter : tout le comportement interactif est à recréer -->
<div class="carte-produit" (click)="voirDetail()">...</div>

<!-- Préférer : le focus, le rôle et l'activation clavier sont natifs -->
<a class="carte-produit" [routerLink]="['/produits', produit().id]">...</a>
```

Pour un composant réutilisable, Angular offre deux outils pour porter cette sémantique au niveau du composant lui-même plutôt que de la répéter dans chaque template consommateur : `host` (attributs, dont `role` et les `aria-*`, posés sur l'élément hôte) et `hostDirectives` (composer une directive, par exemple une gestion clavier, sans que le template consommateur ait à l'écrire). Les libellés peuvent être dynamiques, recalculés avec `computed()` et posés via une liaison d'hôte.

Deux pièges spécifiques à Angular à connaître : `@defer` retire son contenu du DOM tant qu'il n'est pas déclenché — invisible pour une aide technique, pas seulement visuellement masqué — et `NgOptimizedImage` (`ngSrc`) ne gère **pas** `alt`, qui reste entièrement à la charge du développeur.

## Détail

### Pourquoi c'est utile

Dans un site multi-pages classique, chaque navigation recharge le document : le lecteur d'écran repart du haut de la page et annonce le nouveau titre. Une SPA Angular ne fait jamais ça — le routeur remplace un fragment de DOM, un signal met à jour un compteur, un `@if` fait apparaître un panneau : rien de tout cela ne déclenche d'annonce automatique. Cette absence de « redémarrage » gratuit est la raison pour laquelle la gestion du focus (leçon suivante), les régions live et les composants riches (leçon 3) demandent un travail explicite qui n'existerait pas dans une application rendue entièrement côté serveur, page par page.

### Exemple 1 — Rôle et libellé posés sur l'hôte, pas dans chaque template

```ts
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-badge-panier',
  host: {
    role: 'status',
    '[attr.aria-label]': 'libelle()',
  },
  template: `<span aria-hidden="true">{{ nombreArticles() }}</span>`,
})
export class BadgePanier {
  nombreArticles = input(0);
  libelle = computed(() =>
    this.nombreArticles() === 0
      ? 'Panier vide'
      : `Panier, ${this.nombreArticles()} article${this.nombreArticles() > 1 ? 's' : ''}`,
  );
}
```

Le `role="status"` et l'`aria-label` sont posés une seule fois, dans la définition du composant, et se recalculent avec `nombreArticles`. Le chiffre affiché visuellement (`aria-hidden="true"`) n'a pas besoin d'être lu séparément puisque le libellé complet est déjà porté par l'hôte.

### Exemple 2 — `hostDirectives` pour partager un comportement clavier

```ts
@Directive({
  selector: '[appActivable]',
  host: {
    tabindex: '0',
    role: 'button',
    '(keydown.enter)': 'activer.emit()',
    '(keydown.space)': 'activer.emit()',
  },
})
export class Activable {
  activer = output<void>();
}

@Component({
  selector: 'app-vignette-favori',
  hostDirectives: [{ directive: Activable, outputs: ['activer'] }],
  template: `<span>★</span>`,
})
export class VignetteFavori {
  // hérite du comportement clavier de Activable sans le redéclarer
}
```

`hostDirectives` évite de recopier `tabindex`, `role` et la gestion d'Entrée/Espace dans chaque composant qui a besoin du même comportement. À réserver aux cas où aucun élément natif (`<button>`) ne peut porter le composant — c'est un pis-aller documenté, pas une première option.

### Exemple 3 — `@for` : le contenu change, rien n'est annoncé par défaut

```html
@for (produit of produitsFiltres(); track produit.id) {
  <app-produit-carte [produit]="produit" />
} @empty {
  <p>Aucun produit ne correspond à ce filtre.</p>
}
```

Visuellement, filtrer la liste fonctionne très bien. Pour un utilisateur de lecteur d'écran qui ne regarde pas l'écran, rien n'indique que la liste vient de changer ni combien de résultats restent : `@for` met à jour le DOM, il ne prévient personne. Annoncer ce changement (« 4 produits trouvés ») est un besoin réel mais qui se traite avec `LiveAnnouncer`, vu en leçon 3 — le point à retenir ici est que la disparition/apparition silencieuse de contenu via `@if`/`@for` est la norme, pas l'exception, et qu'il faut la repérer avant de la corriger.

### Exemple 4 — `@defer` et images : deux pièges à l'affichage

```html
@defer (on viewport) {
  <app-avis-clients [produitId]="produit().id" />
} @placeholder {
  <p>Avis clients</p>
}

<img [ngSrc]="produit().imagePrincipale" width="400" height="400"
     [alt]="produit().nom" priority />
```

`app-avis-clients` n'existe dans le DOM qu'après son déclenchement : pour un contenu secondaire comme des avis, c'est un bon compromis. Pour un contenu attendu immédiatement (un résumé de commande, un formulaire), différer son affichage peut laisser un utilisateur d'aide technique face à un `@placeholder` sans indication claire qu'autre chose va apparaître — à réserver au contenu réellement secondaire. Sur l'image, `[alt]="produit().nom"` reste un attribut ordinaire : `ngSrc` ne le fournit ni ne le vérifie.

### Pièges courants

> **`(click)` sur un `<div>` ou un `<span>` sans réfléchir à l'élément qui l'entoure.** Le comportement à la souris masque le problème en test rapide ; au clavier, l'élément n'est simplement pas atteignable. Chercher d'abord un élément natif (`<a>`, `<button>`) avant d'envisager `role`/`tabindex`/gestion clavier manuelle.

> **Considérer `@defer` comme purement une optimisation de performance.** Retirer un sous-arbre du DOM a un effet réel sur ce qu'une aide technique peut voir et trouver, indépendamment du rendu visuel. Le choix du déclencheur (`on viewport`, `on interaction`, `on idle`…) doit tenir compte de qui a besoin d'atteindre ce contenu et comment.

> **Oublier `alt` en pensant que `NgOptimizedImage` s'en charge.** Aucun avertissement de build ni d'exécution ne signale un `ngSrc` sans `alt` : c'est un oubli qui passe inaperçu jusqu'à un audit ou un test au lecteur d'écran.

### À retenir

- Une SPA Angular ne bénéficie d'aucune annonce automatique au changement de contenu : c'est la raison d'être de ce chapitre, pas un détail.
- HTML sémantique d'abord, dans le template Angular comme ailleurs : chercher l'élément natif avant `role`/`tabindex`/gestion clavier manuelle.
- `host` et `hostDirectives` portent la sémantique (rôle, libellé dynamique, comportement clavier) au niveau du composant, à écrire une seule fois.
- `@defer` retire son contenu du DOM tant qu'il n'est pas déclenché : à réserver au contenu réellement secondaire pour une aide technique.
- `NgOptimizedImage` optimise le chargement, jamais le texte alternatif : `alt` reste une décision humaine, à chaque `ngSrc`.
