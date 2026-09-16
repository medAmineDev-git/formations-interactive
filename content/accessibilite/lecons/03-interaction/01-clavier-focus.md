---
id: clavier-focus
chapitre: interaction
ordre: 1
titre: Navigation au clavier et focus
termes:
  - terme: Focus (clavier)
    definition: "L'élément de la page qui reçoit actuellement les événements clavier (Tab, Entrée, flèches…). Il n'y a jamais qu'un seul élément focus à la fois, visible grâce à un **indicateur de focus**."
  - terme: Ordre de tabulation
    definition: "L'ordre dans lequel la touche Tab déplace le focus d'un élément à l'autre. Par défaut, c'est l'**ordre du DOM** (l'ordre du code source), pas l'ordre visuel à l'écran — les deux peuvent diverger si le CSS repositionne les éléments."
  - terme: "`tabindex`"
    definition: "Attribut HTML qui modifie le comportement de focus d'un élément. `tabindex=\"0\"` l'ajoute à l'ordre de tabulation naturel ; `tabindex=\"-1\"` le rend focalisable par script mais pas au Tab ; une valeur **positive** (`1`, `2`…) impose un ordre manuel prioritaire, à éviter."
  - terme: Indicateur de focus visible
    definition: "Le contour (souvent un `outline`) qui montre quel élément a le focus. Obligatoire (critère WCAG 2.4.7 Focus Visible) : le supprimer sans le remplacer rend la navigation au clavier inutilisable."
  - terme: "`:focus-visible`"
    definition: "Pseudo-classe CSS qui affiche un style de focus uniquement quand la navigation clavier (ou équivalente) l'a déclenché, pas lors d'un simple clic de souris. Elle permet un style de focus soigné sans jamais le supprimer."
  - terme: Piège du focus (focus trap)
    definition: "Situation où le focus reste bloqué dans une zone de la page sans pouvoir en sortir au clavier. **Volontaire** et nécessaire dans une fenêtre modale ouverte ; **involontaire**, c'est un bug bloquant qui empêche de continuer la navigation."
  - terme: Lien d'évitement (skip link)
    definition: "Premier élément focalisable de la page, invisible tant qu'il n'a pas le focus, qui permet de sauter directement au contenu principal sans repasser par toute la navigation à chaque page."
quiz:
  - question: "Dans quel ordre le focus circule-t-il au clavier (touche Tab) sur ce code ?"
    code: |
      <button>Ajouter au panier</button>
      <input type="text" tabindex="1" placeholder="Code promo">
      <button>Valider la commande</button>
    choix:
      - "« Ajouter au panier » puis « Code promo » puis « Valider la commande », dans l'ordre du DOM"
      - "« Code promo » en premier (tabindex positif prioritaire), puis « Ajouter au panier » puis « Valider la commande »"
      - "L'ordre est choisi aléatoirement par le navigateur"
      - "« Valider la commande » en premier, car c'est le bouton principal du formulaire"
    reponse: 1
    explication: "Un `tabindex` positif est toujours prioritaire : les éléments qui en ont un sont focalisés en premier, par ordre croissant, avant tous les éléments à `tabindex=\"0\"` ou nativement focalisables (qui suivent, eux, l'ordre du DOM). C'est justement pour cette raison que le `tabindex` positif est déconseillé : il devient vite impossible à maintenir cohérent."
  - question: "Un développeur ajoute `outline: none` sur tous les boutons du site pour « nettoyer » le design, sans ajouter de remplacement. Quelle est la conséquence pour un utilisateur au clavier ?"
    choix:
      - "Aucune : l'indicateur de focus ne sert qu'aux technologies d'assistance vocales"
      - "Il perd tout repère visuel sur l'élément actuellement focus et ne peut plus suivre sa navigation"
      - "La touche Tab cesse complètement de fonctionner sur la page"
      - "Le navigateur rétablit automatiquement un contour par défaut malgré la règle CSS"
    reponse: 1
    explication: "L'indicateur de focus est la seule information visuelle qui dit « vous êtes ici » à quelqu'un qui navigue au clavier sans souris. `outline: none` sans remplacement ne casse rien techniquement, mais rend le parcours illisible : impossible de savoir quel élément va être activé par Entrée."
  - question: "Un menu déroulant se ferme au clavier (Échap) en supprimant son contenu avec `display: none`, alors qu'un des liens du menu avait le focus. Que se passe-t-il ?"
    choix:
      - "Le focus reste correctement affiché sur le bouton qui a ouvert le menu"
      - "Le focus est perdu : il retombe sur le `<body>`, et l'utilisateur doit recommencer sa navigation depuis le haut de la page"
      - "Le navigateur relance automatiquement le focus sur le premier lien de la page suivante"
      - "Rien ne change, `display: none` n'a aucun effet sur le focus"
    reponse: 1
    explication: "Masquer un élément qui a le focus (`display: none`, suppression du DOM) ne déplace pas le focus ailleurs intelligemment : il revient au `<body>`, ce qui donne l'impression que le clavier « ne répond plus ». Il faut déplacer le focus explicitement (par exemple vers le bouton qui a ouvert le menu) avant ou pendant la fermeture."
---

## Essentiel

Une page doit être **entièrement utilisable au clavier** : ouvrir un menu, remplir un formulaire, valider une commande, fermer une fenêtre. Ce n'est pas réservé aux personnes aveugles : cela concerne aussi les personnes qui ont un tremblement, une amputation, une fatigue motrice, qui utilisent un contacteur, un clavier alternatif, une commande vocale qui simule le Tab — ou tout simplement une souris en panne.

Par défaut, la touche Tab suit l'**ordre du DOM**, pas l'ordre visuel. Un élément natif (`<button>`, `<a href>`, `<input>`) est focalisable et activable au clavier sans rien faire. Un `<div>` ou un `<span>` cliqué en JavaScript ne l'est pas :

```html
<!-- Inaccessible au clavier : rien ne le rend focalisable -->
<div class="bouton" onclick="ajouterAuPanier()">Ajouter au panier</div>

<!-- Accessible d'office -->
<button onclick="ajouterAuPanier()">Ajouter au panier</button>
```

L'attribut `tabindex="0"` peut rendre un élément non natif focalisable en cas de vrai besoin, mais ne lui donne ni le comportement clavier (Entrée, Espace) ni la sémantique d'un bouton — préférez toujours l'élément natif. Un **indicateur de focus visible** doit rester présent partout : ne jamais faire `outline: none` sans le remplacer par un autre style clairement visible.

## Détail

### Pourquoi c'est utile

Le clavier est le dénominateur commun de la plupart des technologies d'assistance : lecteur d'écran, plage braille, contacteur ou commande vocale finissent presque tous par piloter la page comme le ferait un clavier. Une page vraiment utilisable au clavier est donc, la plupart du temps, déjà utilisable avec ces outils — et c'est aussi le test le plus rapide à faire soi-même : débrancher la souris et naviguer au Tab.

### Exemple 1 — `tabindex="0"` et `tabindex="-1"`

```html
<!-- 0 : entre dans l'ordre de tabulation naturel -->
<div role="button" tabindex="0" onclick="fermer()">Fermer</div>

<!-- -1 : focalisable seulement par script (element.focus()), pas au Tab -->
<h1 tabindex="-1" id="titre-page">Résultat de votre recherche</h1>
```

```js
// Après une navigation en SPA, on déplace le focus vers le titre
document.getElementById('titre-page').focus();
```

`tabindex="-1"` est très utile pour déplacer volontairement le focus par script (vers un titre, une modale, un message d'erreur) sans ajouter l'élément à l'ordre de tabulation classique.

### Exemple 2 — le piège du `tabindex` positif

```html
<input tabindex="3" placeholder="Nom">
<input tabindex="1" placeholder="Prénom">
<input tabindex="2" placeholder="Email">
```

Le Tab suit ici l'ordre 1, 2, 3 (Prénom, Email, Nom), indépendamment de l'ordre visuel ou du DOM. Cela fonctionne tant que personne n'ajoute un champ dans le formulaire — au premier ajout oublié, l'ordre devient incohérent. La bonne pratique : ne jamais utiliser de `tabindex` positif, et faire correspondre l'ordre du DOM à l'ordre visuel avec le HTML et le CSS.

### Exemple 3 — lien d'évitement

```html
<body>
  <a class="lien-evitement" href="#contenu">Aller au contenu principal</a>
  <header>…navigation, filtres, logo…</header>
  <main id="contenu">…</main>
</body>
```

```css
.lien-evitement {
  position: absolute;
  left: -9999px;
}
.lien-evitement:focus {
  left: 0;
  top: 0;
  z-index: 100;
}
```

Le lien reste invisible jusqu'à ce qu'il reçoive le focus (premier Tab de la page), moment où il apparaît. Il permet d'éviter de retraverser tout un bandeau de navigation ou de filtres à chaque page.

### Exemple 4 — `:focus-visible` pour un style soigné sans rien supprimer

```css
/* Style discret par défaut */
button:focus {
  outline: 2px solid transparent;
}
/* Style marqué uniquement à la navigation clavier */
button:focus-visible {
  outline: 3px solid #1d4ed8;
  outline-offset: 2px;
}
```

`:focus-visible` répond à l'argument « l'outline par défaut est moche au clic souris », sans jamais supprimer l'indicateur au clavier.

### Valeurs de `tabindex`

| Valeur | Effet |
|---|---|
| absent | Comportement natif : focalisable si l'élément l'est nativement (`button`, `a[href]`, `input`…), sinon non focalisable |
| `0` | Ajoute l'élément à l'ordre de tabulation naturel, à sa position dans le DOM |
| `-1` | Focalisable uniquement par script (`element.focus()`), retiré du Tab |
| positif (`1`, `2`…) | Impose un ordre manuel, prioritaire sur tout le reste — à éviter |

### Pièges courants

> **Retirer le focus visible sans le remplacer.** `*:focus { outline: none; }` glissé dans une réinitialisation CSS globale rend toute la navigation clavier muette : plus aucun moyen de savoir où on se trouve. Remplacer, ne jamais supprimer.

> **Piège du focus inversé : élément caché alors qu'il a le focus.** Fermer un menu, une infobulle ou un onglet avec `display: none` ou en le retirant du DOM, alors que le focus était dessus, renvoie silencieusement le focus au `<body>`. Il faut déplacer le focus explicitement (vers le déclencheur, un titre, ou un autre élément pertinent) au moment de la fermeture.

> **Raccourcis clavier globaux en conflit avec les technologies d'assistance.** Un raccourci à une seule lettre (par exemple `f` pour rechercher) sans modificateur peut se déclencher pendant la saisie, ou entrer en collision avec les raccourcis de navigation par lettre d'un lecteur d'écran. Solution : le limiter à un champ précis, ou permettre de le désactiver et de le réassigner.

### À retenir

- Tout doit être atteignable et activable au clavier : ce n'est pas une fonctionnalité annexe, c'est la base sur laquelle reposent la plupart des technologies d'assistance.
- L'ordre de tabulation suit le DOM par défaut : faites correspondre ordre visuel et ordre du code plutôt que de forcer un `tabindex` positif.
- `tabindex="0"` ajoute au Tab, `tabindex="-1"` permet un focus par script sans l'ajouter au Tab, une valeur positive est à éviter.
- Ne jamais supprimer l'indicateur de focus sans le remplacer ; `:focus-visible` permet de le styliser sans le retirer.
- Testez un parcours complet à la souris débranchée : Tab pour circuler, Entrée/Espace pour activer, Échap pour fermer — cinq minutes suffisent à repérer les pièges de focus les plus fréquents.
