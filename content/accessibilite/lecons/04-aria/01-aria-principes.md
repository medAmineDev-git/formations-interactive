---
id: aria-principes
chapitre: aria
ordre: 1
titre: "ARIA : à quoi ça sert, et quand l'utiliser"
termes:
  - terme: ARIA
    definition: "Accessible Rich Internet Applications. Ensemble d'attributs `role`, `aria-*` qui permet de décrire aux technologies d'assistance la sémantique d'un composant d'interface. Spécifié par **WAI-ARIA 1.2**, Recommandation W3C publiée le 6 juin 2023."
  - terme: Arbre d'accessibilité
    definition: "Structure que le navigateur construit à partir du DOM et transmet aux technologies d'assistance (lecteur d'écran, etc.). Chaque nœud y porte un **rôle**, un **nom accessible** et des **états**. ARIA agit uniquement sur cet arbre : il ne touche ni au rendu visuel, ni au comportement du navigateur."
  - terme: Rôle implicite
    definition: "Rôle ARIA qu'un élément HTML natif possède déjà sans qu'on ait besoin de l'écrire. `<button>` a le rôle implicite `button`, `<nav>` a le rôle `navigation`, `<a href=\"…\">` a le rôle `link`. Le mapping complet est défini par la spécification **ARIA in HTML**."
  - terme: Nom accessible
    definition: "Texte annoncé par le lecteur d'écran pour identifier un élément. Calculé selon un ordre de priorité : `aria-labelledby`, puis `aria-label`, puis le contenu natif (texte du `<label>`, du bouton, l'attribut `alt`…)."
  - terme: aria-label
    definition: "Fournit un nom accessible **directement en texte**, sans élément visible associé. N'apparaît nulle part à l'écran : à réserver aux cas où aucun texte visible ne peut servir de nom (ex. un bouton icône seul)."
  - terme: aria-labelledby
    definition: "Fournit un nom accessible en **référençant l'id d'un ou plusieurs éléments déjà présents** dans la page. Prioritaire sur `aria-label`. Préférable dès qu'un texte visible existe déjà : évite de dupliquer le contenu."
  - terme: aria-describedby
    definition: "Référence l'id d'un élément qui **complète** le nom accessible par une description plus longue (aide, format attendu, message d'erreur). N'écrase pas le nom : les deux sont annoncés, le nom d'abord."
  - terme: aria-hidden
    definition: "Masque un élément et **tout son contenu** de l'arbre d'accessibilité, sans rien changer à l'affichage visuel. Dangereux mal utilisé : appliqué à un élément focalisable ou à un ancêtre du contenu principal, il peut rendre du contenu invisible pour les technologies d'assistance alors qu'il reste visible et cliquable à l'écran."
quiz:
  - question: "Que fait exactement `aria-hidden=\"true\"` posé sur un `<div>` ?"
    code: |
      <div class="bandeau" aria-hidden="true">
        <p>Livraison offerte dès 50 €</p>
      </div>
    choix:
      - "Il cache visuellement le bandeau, comme `display: none`"
      - "Il retire le bandeau et son contenu de l'arbre d'accessibilité, mais le bandeau reste visible à l'écran"
      - "Il change la couleur du texte pour améliorer le contraste"
      - "Il empêche le bandeau de recevoir le focus au clavier"
    reponse: 1
    explication: "ARIA ne modifie jamais l'apparence. `aria-hidden=\"true\"` agit uniquement sur l'arbre d'accessibilité : le bandeau reste affiché et cliquable, mais un lecteur d'écran l'ignore complètement. Pour le masquer visuellement, il faut du CSS ; pour empêcher le focus clavier, il faut retirer l'élément du DOM ou gérer `tabindex`."
  - question: "Un développeur ajoute `role=\"button\"` sur un `<div>` pour un bouton « Ajouter au panier ». Que manque-t-il pour que ce soit réellement accessible ?"
    code: |
      <div role="button" class="btn-panier" onclick="ajouter()">
        Ajouter au panier
      </div>
    choix:
      - "Rien : `role=\"button\"` suffit à rendre l'élément identique à un `<button>` natif"
      - "Il manque `tabindex=\"0\"` pour le rendre focalisable, et le code JavaScript pour gérer Entrée et Espace : ARIA ne fait ni l'un ni l'autre"
      - "Il faut remplacer `role=\"button\"` par `aria-label=\"button\"`"
      - "Il faut ajouter `aria-hidden=\"false\"` pour confirmer qu'il est visible"
    reponse: 1
    explication: "ARIA change uniquement la sémantique annoncée : un `<div role=\"button\">` est annoncé comme un bouton, mais reste un `<div>` — non focalisable au Tab, et sans réaction aux touches Entrée/Espace tant qu'on ne le code pas soi-même. Utiliser `<button>` évite tout ce travail : c'est le sens de la première règle d'usage d'ARIA."
  - question: "Un champ de recherche a un `<label>` visible « Rechercher un produit » et un texte d'aide « Minimum 3 caractères » affiché juste en dessous. Comment associer le texte d'aide sans dupliquer l'information du label ?"
    choix:
      - "Ajouter `aria-label=\"Minimum 3 caractères\"` sur le champ"
      - "Ajouter `aria-describedby` sur le champ, référençant l'id de l'élément qui contient le texte d'aide"
      - "Copier le texte d'aide dans l'attribut `title` uniquement"
      - "Dupliquer le texte du label pour inclure la contrainte de longueur"
    reponse: 1
    explication: "`aria-label` écraserait le nom accessible fourni par le `<label>` natif, faisant perdre « Rechercher un produit ». `aria-describedby` ajoute la description sans toucher au nom : les deux sont annoncés à la suite. C'est l'outil fait pour ce cas."
---

## Essentiel

ARIA (*Accessible Rich Internet Applications*) est un ensemble d'attributs (`role`, `aria-*`) qui décrit la sémantique d'un composant aux technologies d'assistance. La version de référence actuelle est **WAI-ARIA 1.2** (Recommandation W3C, 6 juin 2023).

**Ce qu'ARIA modifie : uniquement l'arbre d'accessibilité.** Cet arbre est une structure parallèle au DOM, construite par le navigateur, que lisent les lecteurs d'écran. ARIA n'a **aucun effet visuel** (ce n'est pas du CSS) et **ne change aucun comportement natif** (ce n'est pas du JavaScript). Poser `role="button"` sur un `<div>` le fait *annoncer* comme un bouton — il ne devient ni focalisable, ni activable au clavier pour autant.

```html
<!-- ARIA change ce que le lecteur d'écran annonce, rien d'autre -->
<div role="button" aria-pressed="false">Favoris</div>
```

D'où l'adage central du sujet, aujourd'hui formulé dans l'APG (*ARIA Authoring Practices Guide*) : **« pas d'ARIA vaut mieux qu'un mauvais ARIA »**. Un attribut ARIA mal posé ne casse rien visuellement, donc personne ne le remarque au test manuel à la souris — mais il envoie une fausse information aux lecteurs d'écran, souvent pire que l'absence d'ARIA.

Beaucoup d'éléments HTML natifs ont déjà un **rôle implicite** : `<nav>` → `navigation`, `<button>` → `button`, `<a href>` → `link`. Les utiliser évite d'avoir à écrire de l'ARIA.

Pour donner un **nom accessible**, trois attributs existent : `aria-label` (texte direct, invisible à l'écran), `aria-labelledby` (référence l'id d'un texte déjà visible, prioritaire) et `aria-describedby` (ajoute une description complémentaire, sans remplacer le nom).

## Détail

### Pourquoi c'est utile

Un lecteur d'écran ne « voit » pas une page comme un navigateur l'affiche : il parcourt l'arbre d'accessibilité. Sans rôle ni nom corrects, un composant visuellement clair (un bouton icône, un onglet, une case à cocher personnalisée) devient une boîte muette : « groupe, non étiqueté ». ARIA comble cet écart quand le HTML natif ne suffit pas.

### Les règles fondamentales d'usage d'ARIA

Le document *Using ARIA* du W3C, longtemps cité pour « les cinq règles d'ARIA », a été reclassé **« Discontinued Draft »** le 24 février 2026. Sa version actuelle ne conserve que **quatre règles** — un article qui en cite encore cinq décrit une version dépassée du document. Pour toute guidance à jour sur les composants, le document renvoie désormais vers l'**ARIA Authoring Practices Guide (APG)**, à `w3.org/WAI/ARIA/apg/`.

1. **Préférer un élément HTML natif** qui a déjà la sémantique et le comportement voulus, plutôt que de détourner un autre élément avec du rôle ARIA. `<button>` plutôt que `<div role="button">`.
2. **Ne pas modifier la sémantique native sans nécessité réelle.** Éviter `<h2 role="tab">` ; préférer envelopper l'élément natif : `<div role="tab"><h2>…</h2></div>`.
3. **Tout contrôle ARIA interactif doit être utilisable au clavier**, avec les touches standards attendues pour ce type de contrôle.
4. **Ne jamais poser `role="presentation"` ni `aria-hidden="true"` sur un élément focalisable** : un utilisateur au clavier ou au lecteur d'écran ferait alors le focus sur « rien ».

### Rôles, états et propriétés

ARIA distingue trois catégories d'attributs :

- **Rôle** (`role="…"`) : ce qu'est l'élément (`button`, `tab`, `dialog`, `alert`…). Un seul rôle par élément, posé une fois.
- **États** : reflètent une situation qui change pendant l'usage (`aria-expanded`, `aria-checked`, `aria-selected`, `aria-disabled`). À mettre à jour en JavaScript à chaque changement.
- **Propriétés** : décrivent une relation ou une caractéristique plus stable (`aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-required`).

### Exemple 1 — Rôle implicite vs rôle explicite

```html
<!-- Rôle implicite : rien à écrire -->
<nav>…</nav>          <!-- role="navigation" implicite -->
<button>Valider</button> <!-- role="button" implicite -->

<!-- Rôle explicite : nécessaire car l'élément natif n'existe pas dans ce cas -->
<div role="tablist">
  <button role="tab" aria-selected="true">Description</button>
  <button role="tab" aria-selected="false">Avis</button>
</div>
```

Même dans le second exemple, on part d'un `<button>` natif pour chaque `tab` : il reste focalisable et activable au clavier sans code supplémentaire.

### Exemple 2 — aria-label vs aria-labelledby

```html
<!-- aria-label : pas de texte visible correspondant -->
<button aria-label="Fermer">
  <svg aria-hidden="true">…</svg>
</button>

<!-- aria-labelledby : réutilise un texte déjà affiché -->
<h2 id="titre-panier">Votre panier</h2>
<section aria-labelledby="titre-panier">
  …
</section>
```

Le bouton icône n'a aucun texte exploitable comme nom : `aria-label` en fournit un. La section, elle, a déjà un titre visible : `aria-labelledby` le réutilise plutôt que de le dupliquer dans un `aria-label` caché.

### Exemple 3 — aria-describedby pour une description complémentaire

```html
<label for="mdp">Mot de passe</label>
<input id="mdp" type="password" aria-describedby="mdp-aide">
<p id="mdp-aide">8 caractères minimum, avec au moins un chiffre.</p>
```

Le lecteur d'écran annonce : « Mot de passe, saisie protégée, 8 caractères minimum, avec au moins un chiffre. » Le nom (« Mot de passe ») et la description sont deux informations distinctes, toutes deux annoncées.

### Tableau récapitulatif

| Attribut | Rôle | Écrase le nom natif ? |
|---|---|---|
| `aria-label` | Fournit un nom, en texte direct | Oui |
| `aria-labelledby` | Fournit un nom, en référençant un id existant | Oui, et prioritaire sur `aria-label` |
| `aria-describedby` | Ajoute une description complémentaire | Non, s'ajoute au nom |

### Ce qu'ARIA ne fait jamais

- Il ne rend **aucun élément focalisable** : `role="button"` sur un `<div>` n'ajoute pas `tabindex`, il faut le poser soi-même (`tabindex="0"`).
- Il ne gère **aucune interaction clavier** : ni Entrée, ni Espace, ni flèches ne sont câblées automatiquement ; tout le JavaScript est à écrire.
- Il ne change **rien à l'apparence** : pas de style, pas de curseur, pas de mise en évidence du focus.

### Pièges courants

> **`aria-hidden="true"` sur un ancêtre qui contient un élément focalisable.** Le contenu reste visible et cliquable à la souris, mais un lecteur d'écran l'ignore et un utilisateur au clavier peut faire le focus sur un champ « invisible » pour lui. La règle : ne jamais poser `aria-hidden="true"` sur un élément qui contient — ou qui est lui-même — focalisable.

> **`role="button"` sans le comportement qui va avec.** Ajouter le rôle sans `tabindex="0"` ni gestion de Entrée/Espace donne un bouton annoncé mais inutilisable au clavier — pire, à l'usage, qu'un `<div>` sans rôle du tout, car il crée une fausse attente.

> **`aria-label` sur un élément qui a déjà un texte visible pertinent.** Si le texte visible du bouton dit « Envoyer » et que `aria-label="Soumettre le formulaire de contact"` diffère, un utilisateur de reconnaissance vocale qui dit « clique Envoyer » ne trouve rien : le nom accessible doit rester cohérent avec le texte visible.

### À retenir

- ARIA modifie seulement l'arbre d'accessibilité : jamais l'apparence, jamais le comportement natif.
- « Using ARIA » ne compte plus que quatre règles depuis son reclassement en *Discontinued Draft* ; l'APG est la référence pour les motifs de composants.
- Préférer un élément HTML natif à un rôle ARIA détourné : c'est la première règle, et elle évite le plus de travail.
- `aria-label` (texte direct) et `aria-labelledby` (référence un id, prioritaire) fournissent un nom ; `aria-describedby` ajoute une description sans l'écraser.
- `aria-hidden="true"` sur un élément focalisable ou un de ses ancêtres est un piège classique à vérifier systématiquement.
