---
id: formulaires-accessibles
chapitre: interaction
ordre: 2
titre: Formulaires accessibles
termes:
  - terme: "`<label for>`"
    definition: "Associe un texte à son champ de formulaire via l'`id` du champ. Cliquer sur le label focalise le champ, et un lecteur d'écran l'annonce à chaque fois que le champ reçoit le focus. C'est l'étiquette **programmatique** du champ, pas seulement visuelle."
  - terme: Champ obligatoire
    definition: "Doit être signalé **à la fois** visuellement (par exemple un astérisque expliqué en légende) et **programmatiquement**, avec l'attribut HTML `required` (et éventuellement `aria-required=\"true\"` si le champ n'accepte pas `required` nativement)."
  - terme: "`<fieldset>` / `<legend>`"
    definition: "Regroupe un ensemble de champs liés (cases à cocher, boutons radio) sous une légende commune (`<legend>`), annoncée par les lecteurs d'écran en plus du libellé de chaque option — indispensable dès qu'un groupe de choix a une question commune (« Mode de livraison »)."
  - terme: "`aria-describedby`"
    definition: "Relie un champ à un texte d'aide ou d'erreur ailleurs dans la page, en pointant vers son `id`. Un lecteur d'écran annonce ce texte à la suite du libellé du champ — indispensable car la seule proximité visuelle ne crée aucun lien pour une technologie d'assistance."
  - terme: "`aria-invalid`"
    definition: "Signale qu'un champ est actuellement en erreur (`aria-invalid=\"true\"`). Combiné à `aria-describedby` pointant vers le message d'erreur, il permet à un lecteur d'écran d'annoncer à la fois l'état invalide et la raison."
  - terme: Résumé des erreurs
    definition: "Liste de toutes les erreurs de saisie affichée en haut du formulaire à la soumission, avec un lien vers chaque champ concerné, et le focus déplacé vers ce résumé — pour que l'utilisateur n'ait pas à chercher les erreurs une par une."
  - terme: "`autocomplete`"
    definition: "Attribut qui déclare la nature attendue d'un champ (`autocomplete=\"email\"`, `\"tel\"`, `\"given-name\"`…) pour permettre le remplissage automatique par le navigateur ou un gestionnaire de mots de passe — utile à tout le monde, indispensable à certaines personnes en situation de handicap cognitif ou moteur."
quiz:
  - question: "Que se passe-t-il pour un utilisateur de lecteur d'écran avec ce champ, une fois qu'il commence à saisir du texte ?"
    code: |
      <input type="text" name="destinataire" placeholder="Nom du destinataire">
    choix:
      - "Rien de particulier : le `placeholder` continue d'être annoncé comme un `<label>` classique"
      - "Le texte du `placeholder` disparaît visuellement dès la saisie, et rien ne rappelle à quoi correspond le champ une fois qu'on y revient plus tard"
      - "Le navigateur transforme automatiquement le `placeholder` en `<label>` au premier caractère saisi"
      - "Le formulaire refuse la saisie tant qu'aucun `<label>` n'est présent"
    reponse: 1
    explication: "Le `placeholder` n'est pas une étiquette : il disparaît dès que l'utilisateur tape, et certains lecteurs d'écran ne l'annoncent pas de façon fiable ni durable. Un `<label for=\"…\">` associé au champ reste, lui, annoncé à chaque passage sur le champ, y compris une fois rempli."
  - question: "Un champ « Code promo » affiche un message d'erreur visible juste en dessous après soumission, mais sans `aria-describedby` ni `aria-invalid`. Quel est le problème ?"
    choix:
      - "Aucun : la proximité visuelle entre le champ et le message suffit à les relier pour toute technologie d'assistance"
      - "En se plaçant sur le champ, un lecteur d'écran n'annonce que son libellé, sans jamais mentionner l'erreur ni sa description"
      - "Le champ devient automatiquement en lecture seule tant que l'erreur n'est pas corrigée"
      - "Le problème vient du `<label for>`, qui devrait être retiré"
    reponse: 1
    explication: "La proximité visuelle ne crée aucune relation programmatique. Sans `aria-describedby` pointant vers l'`id` du message d'erreur (et sans `aria-invalid=\"true\"`), un lecteur d'écran annonce uniquement le libellé du champ : l'utilisateur ne sait même pas qu'une erreur existe."
  - question: "Pourquoi recommande-t-on d'afficher un résumé des erreurs en haut du formulaire ET de déplacer le focus dessus à la soumission, plutôt que de se fier uniquement aux messages sous chaque champ ?"
    choix:
      - "Parce que les messages sous chaque champ sont interdits par le RGAA"
      - "Parce qu'après soumission, rien ne prévient automatiquement une technologie d'assistance de l'apparition d'erreurs ailleurs sur la page si le focus n'est pas déplacé explicitement"
      - "Parce qu'un formulaire ne peut techniquement afficher qu'un seul message d'erreur à la fois"
      - "Uniquement pour des raisons visuelles, sans impact pour les technologies d'assistance"
    reponse: 1
    explication: "Sans déplacement explicite du focus, un lecteur d'écran reste où il était avant la soumission et ne détecte pas seul les nouveaux messages apparus ailleurs dans la page. Le résumé, avec le focus déplacé dessus, donne un point d'entrée unique et annoncé vers l'ensemble des erreurs, en plus des messages restés près de chaque champ."
---

## Essentiel

Un formulaire accessible commence par une règle simple : chaque champ a un `<label for>` qui pointe vers son `id`. Le `placeholder` n'est **jamais** un substitut : il disparaît à la saisie et n'est pas annoncé de façon fiable par les lecteurs d'écran.

```html
<label for="email">Adresse e-mail</label>
<input type="email" id="email" name="email" required autocomplete="email">
```

Un champ **obligatoire** se signale visuellement (astérisque, mention « obligatoire ») **et** programmatiquement avec `required`. Des choix liés (mode de livraison, moyen de paiement) se regroupent dans un `<fieldset>` avec une `<legend>` qui porte la question commune :

```html
<fieldset>
  <legend>Mode de livraison</legend>
  <input type="radio" id="livr-domicile" name="livraison" value="domicile">
  <label for="livr-domicile">À domicile</label>
  <input type="radio" id="livr-point-relais" name="livraison" value="relais">
  <label for="livr-point-relais">En point relais</label>
</fieldset>
```

Un message d'erreur doit être **relié** au champ (`aria-describedby` + `aria-invalid="true"`), pas seulement affiché à proximité visuelle. À la soumission, un résumé des erreurs en haut de page, avec le focus déplacé dessus, évite à l'utilisateur de chercher ce qui ne va pas.

## Détail

### Comment ça marche

Un lecteur d'écran n'annonce, quand le focus arrive sur un champ, que ce qui lui est **programmatiquement** relié : son libellé (`<label for>` ou `aria-label`), sa description (`aria-describedby`) et son état (`required`, `aria-invalid`). Ce qui n'est que visuellement proche — un texte d'aide en dessous, un astérisque rouge, un message d'erreur affiché après soumission — reste invisible pour cette annonce tant qu'il n'est pas explicitement rattaché au champ.

### Exemple 1 — champ obligatoire, visuel et programmatique

```html
<label for="nom">
  Nom <span aria-hidden="true">*</span>
  <span class="visually-hidden">(obligatoire)</span>
</label>
<input type="text" id="nom" name="nom" required aria-required="true">
<p id="legende-obligatoire">* champs obligatoires</p>
```

L'astérisque seul (`aria-hidden="true"` pour ne pas faire annoncer un « étoile » sans contexte) reste un indice purement visuel : le texte masqué visuellement (« obligatoire ») et l'attribut `required` portent l'information pour tout le monde.

### Exemple 2 — message d'erreur relié au champ

```html
<label for="code-promo">Code promo</label>
<input
  type="text"
  id="code-promo"
  name="code-promo"
  aria-describedby="erreur-code-promo"
  aria-invalid="true">
<p id="erreur-code-promo" class="erreur">
  Ce code promo n'est plus valide.
</p>
```

`aria-describedby` fait annoncer le message d'erreur à la suite du libellé dès que le champ reçoit le focus, et `aria-invalid="true"` signale l'état invalide. Dès l'erreur corrigée, retirer `aria-invalid` ou le passer à `"false"`.

### Exemple 3 — résumé des erreurs à la soumission

```html
<div role="alert" tabindex="-1" id="resume-erreurs">
  <h2>2 erreurs empêchent la validation de la commande</h2>
  <ul>
    <li><a href="#code-promo">Code promo : ce code n'est plus valide</a></li>
    <li><a href="#telephone">Téléphone : format attendu à 10 chiffres</a></li>
  </ul>
</div>
```

```js
// Après une soumission invalide
document.getElementById('resume-erreurs').focus();
```

`tabindex="-1"` rend le résumé focalisable par script sans l'ajouter au Tab. Chaque lien pointe vers l'`id` du champ concerné pour y accéder directement, en plus du message d'erreur individuel resté près de chaque champ.

### Exemple 4 — aide au format attendu

```html
<label for="telephone">Téléphone</label>
<input
  type="tel"
  id="telephone"
  name="telephone"
  autocomplete="tel"
  aria-describedby="aide-telephone">
<p id="aide-telephone">Format : 10 chiffres, sans espace.</p>
```

L'aide sur le format attendu, donnée **avant** toute erreur, réduit le risque de se tromper — et `autocomplete="tel"` permet au navigateur de proposer un remplissage automatique.

### Pièges courants

> **Placeholder en guise de label.** `<input placeholder="Nom du destinataire">` sans `<label>` associé : le champ n'a alors aucun nom accessible une fois qu'il est rempli, et certains lecteurs d'écran ne lisent jamais les `placeholder`. Un `<label for>` est toujours nécessaire, même visuellement discret.

> **Groupe de cases à cocher ou de boutons radio sans `<fieldset>`/`<legend>`.** Chaque option a bien son propre `<label>`, mais rien n'indique la question commune (« Mode de livraison ? »). Résultat : un lecteur d'écran annonce « à domicile », « en point relais », sans jamais dire à quoi ces choix répondent.

> **Bouton de soumission non explicite.** Un bouton « Envoyer » ou « OK » générique ne dit rien de l'action réalisée, une fois retrouvé dans une liste de contrôles au lecteur d'écran. Préférer un intitulé précis : « Valider la commande », « Créer mon compte ».

### À retenir

- `<label for>` relié à l'`id` du champ, jamais un `placeholder` seul en guise d'étiquette.
- Champ obligatoire : indication visuelle **et** `required`/`aria-required`.
- `<fieldset>`/`<legend>` pour tout groupe de cases à cocher ou de boutons radio ayant une question commune.
- Erreur : `aria-describedby` vers le message, `aria-invalid="true"` sur le champ, et un résumé en haut de page avec le focus déplacé dessus à la soumission.
- `autocomplete` sur les champs courants (email, téléphone, nom, adresse) facilite la saisie pour tout le monde, et davantage encore en cas de handicap moteur ou cognitif.
