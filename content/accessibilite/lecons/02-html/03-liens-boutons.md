---
id: liens-boutons
chapitre: html-semantique
ordre: 3
titre: "Liens et boutons"
termes:
  - terme: "Lien (`<a href>`)"
    definition: "Élément qui **navigue** : il change de page, d'ancre dans la page, ou télécharge un fichier. Focusable, activable au clavier avec Entrée, annoncé avec le rôle *link*. Un `<a>` **sans** attribut `href` n'a aucun de ces comportements : pas de rôle de lien, pas de focus automatique."
  - terme: "Bouton (`<button>`)"
    definition: "Élément qui **agit** sur la page courante : ouvrir une modale, soumettre un formulaire, ajouter au panier, trier une liste. Focusable, activable au clavier avec Entrée **et** Espace, annoncé avec le rôle *button*."
  - terme: Nom accessible
    definition: "Texte qu'une technologie d'assistance annonce pour identifier un lien ou un bouton, en plus de son rôle. Construit à partir du contenu textuel de l'élément, ou d'un `aria-label` s'il est présent (`aria-label` prend alors le pas sur le texte visible)."
  - terme: "aria-label"
    definition: "Attribut qui fournit un nom accessible **sans texte visible correspondant**. Utile sur un bouton icône seule ; à éviter sur un élément qui a déjà du texte visible pertinent, car il remplace ce texte pour les technologies d'assistance et peut créer une incohérence avec ce que voit un utilisateur voyant."
  - terme: Texte masqué visuellement
    definition: "Technique CSS (classe utilitaire souvent nommée `sr-only` ou `visually-hidden`) qui rend un texte lisible par les technologies d'assistance sans l'afficher à l'écran. Contrairement à `display: none` ou `visibility: hidden`, le texte reste dans l'arbre d'accessibilité."
  - terme: "aria-current"
    definition: "Attribut qui signale l'élément **actif** dans un ensemble, par exemple `aria-current=\"page\"` sur le lien de navigation correspondant à la page affichée. Annoncé par un lecteur d'écran en plus du nom du lien."
quiz:
  - question: "Quel est le problème principal de ce bouton ?"
    code: |
      <div class="btn-supprimer" onclick="supprimerArticle(42)">
        Supprimer
      </div>
    choix:
      - "Aucun : `onclick` déclenche bien l'action au clic de souris"
      - "Le `<div>` n'est ni focusable ni activable au clavier par défaut, et son rôle n'est pas annoncé comme un bouton par un lecteur d'écran : un utilisateur clavier ne peut simplement pas l'atteindre ni l'activer"
      - "Il manque un `alt` sur la `<div>`"
      - "Le nom de la classe CSS devrait être en anglais pour être reconnu par les lecteurs d'écran"
    reponse: 1
    explication: "Un `<div>` est un élément neutre : pas de focus au Tab, pas de rôle interactif annoncé, pas d'activation avec Entrée ou Espace, quel que soit le gestionnaire `onclick` posé dessus. La correction est de remplacer la `<div>` par un vrai `<button type=\"button\">`, qui obtient tout ce comportement nativement, sans code supplémentaire à écrire ni à maintenir."
  - question: "Ce lien de fin d'article pose un problème pour un utilisateur qui navigue de lien en lien avec un lecteur d'écran. Lequel ?"
    code: |
      <p>Découvrez notre nouvelle gamme de robots pâtissiers.</p>
      <a href="/gamme-robots">En savoir plus</a>
      ...
      <p>Notre service après-vente s'étend maintenant à toute la France.</p>
      <a href="/sav">En savoir plus</a>
    choix:
      - "Aucun problème : le texte du paragraphe juste avant donne le contexte"
      - "Un lecteur d'écran qui liste les liens de la page (fonction de navigation courante) affiche deux liens identiques intitulés « En savoir plus », sans indication de leur destination respective"
      - "Le problème vient uniquement de l'absence d'attribut `alt` sur les liens"
      - "Les liens ne peuvent pas être activés au clavier tant qu'ils ne contiennent pas d'icône"
    reponse: 1
    explication: "De nombreux lecteurs d'écran proposent une liste de tous les liens de la page, sortie de leur contexte visuel. Deux liens « En savoir plus » y sont indiscernables. La solution est un intitulé explicite hors contexte (« En savoir plus sur les robots pâtissiers », « En savoir plus sur le SAV ») ou un `aria-label` complémentaire sur chaque lien, sans changer le texte visible si le design l'impose."
  - question: "Ce lien de téléchargement respecte-t-il les bonnes pratiques d'accessibilité ?"
    code: |
      <a href="/docs/garantie-xr200.pdf">Conditions de garantie</a>
    choix:
      - "Oui, c'est suffisant : un lien vers un PDF n'a besoin d'aucune information supplémentaire"
      - "Non : rien n'indique à l'avance qu'il s'agit d'un téléchargement plutôt que d'une navigation classique, ni son format et son poids — des informations utiles avant de déclencher le téléchargement"
      - "Non, car les fichiers PDF ne sont jamais accessibles aux lecteurs d'écran"
      - "Oui, à condition d'ajouter `target=\"_blank\"`"
    reponse: 1
    explication: "Un lien qui déclenche un téléchargement plutôt qu'une navigation devrait le signaler, généralement par du texte visible complémentaire (« Conditions de garantie (PDF, 240 Ko) ») plutôt que par la couleur ou une icône seule. Ouvrir dans un nouvel onglet (`target=\"_blank\"`) est une question distincte, qui mérite elle aussi d'être annoncée à l'utilisateur plutôt que supposée — ce n'est pas un correctif au problème de ce lien."
---

## Essentiel

La distinction entre un lien et un bouton n'est pas une question de style, c'est une question de **comportement** que les technologies d'assistance s'attendent à trouver.

- **Un lien navigue** : il mène ailleurs (autre page, ancre, fichier à télécharger). `<a href="...">`.
- **Un bouton agit** : il déclenche quelque chose sur la page actuelle (ajouter au panier, ouvrir une modale, trier). `<button>`.

```html
<!-- Lien : on va ailleurs -->
<a href="/produits/robot-xr200">Voir la fiche produit</a>

<!-- Bouton : on agit ici -->
<button type="button" onclick="ajouterAuPanier(42)">Ajouter au panier</button>
```

Cette distinction compte parce que le comportement natif diffère : un lien s'active avec **Entrée**, un bouton avec **Entrée et Espace**. Un lecteur d'écran annonce « lien » ou « bouton » différemment, et certains utilisateurs s'appuient sur cette annonce pour anticiper ce qui va se passer.

Deux pièges très fréquents :

- **L'intitulé de lien hors contexte.** « En savoir plus », « Cliquez ici » ne veulent rien dire pour un utilisateur qui liste tous les liens de la page hors de leur paragraphe d'origine — fonctionnalité courante des lecteurs d'écran.
- **`<div>` ou `<span>` avec un `onclick`.** Ça fonctionne à la souris, jamais nativement au clavier : pas de focus, pas de rôle annoncé, pas d'activation avec Entrée. Utiliser `<button>` évite d'avoir à recréer ce comportement à la main.

## Détail

### Intitulés de lien explicites hors contexte

Un lien doit se comprendre seul, sans le paragraphe qui l'entoure — c'est le principe à retenir. Deux façons d'y arriver sans changer le design visuel :

```html
<!-- Texte visible complété -->
<a href="/gamme-robots">En savoir plus sur la gamme de robots pâtissiers</a>

<!-- Texte visible court, complément masqué visuellement pour les technologies d'assistance -->
<a href="/gamme-robots">
  En savoir plus
  <span class="sr-only"> sur la gamme de robots pâtissiers</span>
</a>
```

La classe `sr-only` (ou `visually-hidden`) repose sur une technique CSS courante : positionner le texte hors de l'écran sans le retirer de l'arbre d'accessibilité, contrairement à `display: none` qui le masque pour tout le monde, technologies d'assistance comprises.

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Exemple — `aria-label` plutôt que texte masqué

Sur un élément déjà sans texte visible (icône seule), `aria-label` fait le même travail sans bloc CSS dédié :

```html
<a href="/panier" aria-label="Voir le panier (3 articles)">
  <svg aria-hidden="true" focusable="false">...</svg>
</a>
```

À réserver aux cas où il n'y a pas de texte visible pertinent : poser un `aria-label` différent sur un lien qui a déjà un texte visible remplace ce texte pour les technologies d'assistance, ce qui peut créer un décalage entre ce qu'un utilisateur voyant lit et ce qu'un utilisateur de lecteur d'écran entend.

### Liens qui ouvrent un nouvel onglet ou déclenchent un téléchargement

Deux comportements que l'utilisateur n'anticipe pas s'ils ne sont pas annoncés :

```html
<a href="/docs/garantie-xr200.pdf">
  Conditions de garantie
  <span class="sr-only">(PDF, s'ouvre dans un nouvel onglet, 240 Ko)</span>
</a>
```

Indiquer le comportement inhabituel (nouvel onglet, téléchargement) et, pour un fichier, son format et son poids, évite à l'utilisateur d'être surpris ou de perdre le fil de sa navigation sans le savoir. Le texte complémentaire peut être visible ou masqué visuellement selon les contraintes de design ; l'important est qu'il existe.

### `<a>` sans `href` : un cas à part

```html
<!-- Ce lien n'a aucun comportement de lien -->
<a class="bouton-desactive">Rupture de stock</a>

<!-- Correct pour un état désactivé -->
<button type="button" disabled>Rupture de stock</button>
```

Un `<a>` sans `href` n'a pas de rôle de lien implicite et n'est pas focusable par défaut : visuellement, il peut ressembler à un lien grâce au CSS, mais il est invisible pour la navigation au clavier et pour un lecteur d'écran qui liste les liens de la page. S'il s'agit d'un état désactivé, `<button disabled>` communique cet état correctement ; s'il s'agit d'un vrai lien, il lui faut un `href`.

### Liens vides ou image seule sans alternative

```html
<!-- Annoncé comme "lien" sans aucun nom : inutilisable -->
<a href="/panier"><img src="panier.svg" /></a>

<!-- Corrigé -->
<a href="/panier"><img src="panier.svg" alt="Panier" /></a>
```

Sans `alt` sur l'image et sans texte alternatif dans le lien, un lecteur d'écran annonce « lien » sans aucun nom (parfois complété par l'URL brute selon le lecteur), ce qui rend le lien inutilisable sans deviner sa destination.

### État actif d'un lien de navigation

```html
<nav aria-label="Principale">
  <ul>
    <li><a href="/catalogue" aria-current="page">Catalogue</a></li>
    <li><a href="/panier">Panier</a></li>
  </ul>
</nav>
```

`aria-current="page"` signale au lecteur d'écran quel lien correspond à la page actuellement affichée, en plus de tout style visuel (soulignement, couleur) qui indique la même chose visuellement pour un utilisateur voyant.

### Pièges courants

> **`<div>` ou `<span>` avec `onclick`.** Fonctionne parfaitement à la souris, ce qui masque le problème en test rapide. Au clavier : pas de focus, pas d'activation, pas de rôle annoncé. Utiliser `<button>` (action) ou `<a href>` (navigation) évite de recréer ce comportement à la main.

> **Intitulé de lien identique répété plusieurs fois sur une même page** (« En savoir plus », « Lire la suite »), sans contexte associé. Piège fréquent car il passe inaperçu visuellement — le paragraphe qui précède suffit à un utilisateur voyant, pas à un utilisateur qui liste les liens hors contexte.

> **`aria-label` posé sur un élément qui a déjà un texte visible différent.** Le nom accessible remplace alors totalement le texte visible pour un lecteur d'écran : un bouton affichant « Valider » avec `aria-label="Confirmer la commande et procéder au paiement"` sera annoncé uniquement par ce second texte, jamais par « Valider ».

### À retenir

- Un lien navigue (`<a href>`), un bouton agit (`<button>`) — le choix dépend du comportement, jamais du style visuel.
- Un intitulé de lien doit se comprendre seul, hors de son paragraphe d'origine.
- `aria-label` et le texte masqué visuellement (`sr-only`) servent tous deux à enrichir le nom accessible ; `aria-label` remplace le texte visible, le texte masqué le complète.
- `<div>`/`<span>` avec un gestionnaire de clic ne sont ni focusables ni activables au clavier par défaut : ce n'est jamais un remplacement neutre d'un `<button>`.
- `<a>` sans `href` n'a ni rôle de lien ni focus automatique — à ne pas utiliser pour simuler un état désactivé.
