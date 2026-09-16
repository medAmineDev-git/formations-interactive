---
id: couleurs-contrastes
chapitre: interaction
ordre: 3
titre: "Couleurs, contrastes et contenus visuels"
termes:
  - terme: Rapport de contraste
    definition: "Mesure, de 1:1 (aucune différence) à 21:1 (noir pur sur blanc pur), l'écart de luminosité entre une couleur de premier plan et sa couleur de fond. C'est ce chiffre, calculable par un outil, qui détermine si un texte ou un élément respecte les seuils WCAG."
  - terme: Texte large
    definition: "Au sens WCAG, un texte d'au moins 18 points (~24px) en graisse normale, ou d'au moins 14 points (~18,5px) en gras. En dessous, un texte est considéré comme « normal » et soumis à un seuil de contraste plus strict."
  - terme: Contraste des composants d'interface
    definition: "Seuil de contraste distinct de celui du texte, qui s'applique aux bordures de champs, cases à cocher, icônes de contrôle et indicateurs de focus nécessaires pour identifier un composant — ainsi qu'aux éléments graphiques porteurs d'information (lignes d'un graphique, icônes autonomes)."
  - terme: Zoom et reflow
    definition: "Un contenu doit rester utilisable agrandi à 200 % (texte) et se réorganiser en une seule colonne sans défilement horizontal ni perte de contenu à 400 % de zoom, équivalent à une largeur de 320 pixels CSS."
  - terme: "Espacement du texte"
    definition: "Le contenu ne doit pas être coupé ni perdre de fonctionnalité quand une personne force, via son navigateur ou une extension, un interligne d'au moins 1,5 fois la taille de police, un espacement de paragraphe d'au moins 2 fois, un espacement de lettres d'au moins 0,12 fois et un espacement de mots d'au moins 0,16 fois."
  - terme: "`prefers-reduced-motion`"
    definition: "Media query CSS qui détecte la préférence système « réduire les animations » et permet de désactiver ou d'atténuer les animations et transitions non essentielles pour les personnes sensibles au mouvement (troubles vestibulaires, migraines)."
  - terme: Daltonisme
    definition: "Déficience de la perception des couleurs (le plus souvent une confusion rouge-vert) qui touche une partie significative de la population, essentiellement masculine. Impose de ne jamais faire reposer une information **uniquement** sur la couleur."
quiz:
  - question: "Un texte de 16px en graisse normale s'affiche en gris (#767676) sur fond blanc. Quel rapport de contraste minimal doit-il atteindre pour respecter le niveau AA ?"
    choix:
      - "3:1, comme n'importe quel texte"
      - "4,5:1, car un texte de 16px en graisse normale est un texte « normal », pas un texte large"
      - "7:1, le seuil applicable à tout texte de moins de 18px"
      - "Aucun seuil ne s'applique tant que le texte n'est pas la couleur principale de la page"
    reponse: 1
    explication: "Le seuil de 3:1 concerne le texte large (18pt/~24px ou 14pt/~18,5px gras) et les composants d'interface, pas un texte de 16px en graisse normale. 7:1 correspond au niveau AAA renforcé, plus exigeant que le niveau AA usuel. Un texte normal en dessous de la taille « large » doit atteindre 4,5:1."
  - question: "Un formulaire signale un champ en erreur uniquement en changeant la couleur de sa bordure du gris au rouge, sans aucun autre indice. Quel est le problème ?"
    choix:
      - "Aucun : le rouge est universellement reconnu comme signal d'erreur"
      - "Une personne daltonienne (confusion rouge-vert) ou qui ne perçoit pas les couleurs peut ne pas remarquer que le champ est en erreur"
      - "Le problème est uniquement lié au contraste de la bordure, pas à la couleur en elle-même"
      - "Ce n'est un problème que si le formulaire contient plus de dix champs"
    reponse: 1
    explication: "Faire reposer une information uniquement sur la couleur exclut les personnes qui ne perçoivent pas bien cette couleur, ou pas du tout (daltonisme, cécité). Un champ en erreur doit aussi porter un indice non coloré : icône, texte, changement de bordure combiné à un message explicite."
  - question: "Une page contient une bannière promotionnelle qui clignote 6 fois par seconde en continu, sans lien avec une interaction de l'utilisateur. Quel est le problème du point de vue de l'accessibilité ?"
    choix:
      - "Aucun tant que le clignotement dure moins de 5 secondes au total"
      - "Le seuil à ne pas dépasser est de 3 flashs par seconde ; au-delà, le contenu peut déclencher des crises chez des personnes photosensibles"
      - "Le clignotement n'est un problème que sur mobile"
      - "Le problème vient uniquement du contraste des couleurs utilisées, pas de la fréquence"
    reponse: 1
    explication: "Un contenu qui flashe plus de trois fois par seconde peut déclencher des crises d'épilepsie photosensible chez certaines personnes. Une bannière à 6 flashs par seconde dépasse ce seuil, indépendamment de sa durée ou des couleurs utilisées."
---

## Essentiel

Le **rapport de contraste** mesure l'écart de luminosité entre un texte (ou un élément) et son fond, de 1:1 à 21:1. Pour un texte **normal**, WCAG niveau AA exige au moins **4,5:1** ; pour un texte **large** (au moins 18pt/~24px, ou 14pt/~18,5px en gras), **3:1** suffit. Ce même seuil de **3:1** s'applique aux **composants d'interface** (bordures de champ, icônes de contrôle) et aux éléments graphiques porteurs d'information.

```css
/* Insuffisant : ~2,85:1 sur fond blanc, en dessous de 4,5:1 */
.texte-secondaire { color: #999999; background: #ffffff; }

/* Conforme : ~4,54:1 */
.texte-secondaire { color: #767676; background: #ffffff; }
```

Sont exemptés : le texte purement décoratif ou invisible, le texte faisant partie d'un logo ou d'une marque, et le texte incident à l'intérieur d'une image contenant d'autres éléments visuels significatifs.

Autre règle centrale : ne **jamais** faire reposer seule une information sur la couleur (un lien qui ne se distingue du texte que par sa couleur, un champ en erreur uniquement rouge, un graphique dont seules les couleurs distinguent les séries). Une personne daltonienne, ou qui ne perçoit pas les couleurs, doit pouvoir s'en sortir avec les autres indices : soulignement, icône, texte, motif.

## Détail

### Comment ça marche

Le calcul du rapport de contraste WCAG compare la **luminance relative** de deux couleurs (une valeur dérivée des composantes RGB, pondérée pour approcher la perception humaine), pas simplement leur différence de teinte. Deux couleurs qui semblent contrastées à l'œil (un rouge vif sur un vert vif) peuvent avoir un rapport très faible si leur luminosité est proche — d'où l'intérêt de toujours vérifier avec un outil plutôt qu'à l'œil.

### Exemple 1 — seuils de contraste du texte

```css
/* Texte normal (moins de 18pt / moins de 14pt gras) : 4,5:1 minimum */
p { color: #595959; background: #ffffff; } /* ≈ 7:1, large marge */

/* Titre large (24px, graisse normale) : 3:1 suffit */
h2 { font-size: 24px; color: #757575; background: #ffffff; } /* ≈ 4,6:1 */
```

Un même gris peut être conforme pour un grand titre et insuffisant pour un texte de description en dessous : la taille du texte change le seuil à atteindre, pas seulement son apparence.

### Exemple 2 — contraste des composants d'interface

```css
/* Bordure de champ trop discrète : ~1,4:1 sur fond blanc */
input { border: 1px solid #e0e0e0; }

/* Bordure conforme : ~3,1:1 */
input { border: 1px solid #767676; }

input:focus-visible {
  outline: 3px solid #1d4ed8; /* indicateur de focus, lui aussi soumis au seuil de 3:1 */
}
```

Le seuil de 3:1 concerne autant les bordures de champ que les cases à cocher, les icônes de filtre ou l'indicateur de focus : un composant d'interface doit rester repérable même pour une personne malvoyante qui ne perçoit pas des contrastes faibles.

### Exemple 3 — ne pas coder l'information uniquement par la couleur

```html
<!-- Insuffisant : seule la couleur distingue le prix barré -->
<p><span style="color:red">29,99&nbsp;€</span> <span>19,99&nbsp;€</span></p>

<!-- Accessible : la structure porte l'information, la couleur ne fait que la renforcer -->
<p>
  <del>29,99&nbsp;€</del>
  <span>Prix promo : 19,99&nbsp;€</span>
</p>
```

Dans un graphique en barres comparant plusieurs produits, la même règle s'applique : ajouter des motifs, des libellés directs ou une légende textuelle en plus de la couleur, pour qu'un daltonien distingue les séries.

### Exemple 4 — `prefers-reduced-motion`

```css
.carrousel-panier {
  animation: glisser 0.6s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .carrousel-panier {
    animation: none;
  }
}
```

Cette media query respecte le réglage système d'une personne sensible au mouvement (troubles vestibulaires, migraines) sans rien supprimer pour les autres. Tout contenu qui démarre seul et dure plus de 5 secondes doit pouvoir être mis en pause, arrêté ou masqué ; un contenu qui clignote ne doit jamais dépasser 3 flashs par seconde, seuil au-delà duquel des crises peuvent survenir chez des personnes photosensibles.

### Seuils de contraste — récapitulatif

| Élément | Seuil minimal (niveau AA) |
|---|---|
| Texte normal | 4,5:1 |
| Texte large (≥18pt / ≥24px, ou ≥14pt / ≥18,5px gras) | 3:1 |
| Composant d'interface (bordure de champ, case à cocher, indicateur de focus) | 3:1 |
| Élément graphique porteur d'information (ligne de graphique, icône autonome) | 3:1 |
| Texte décoratif, invisible, logo, marque | Exempté |

### Pièges courants

> **Vérifier le contraste « à l'œil ».** Deux couleurs vives de teintes différentes peuvent sembler contrastées visuellement tout en ayant un rapport de luminance très faible. Toujours mesurer avec un outil (vérificateur de contraste, panneau d'accessibilité du navigateur) plutôt que de se fier à une impression.

> **Confondre zoom du texte seul et zoom complet de la page.** Le critère de redimensionnement à 200 % s'applique au zoom du navigateur (qui agrandit tout : texte, images, mise en page), pas uniquement à un réglage de taille de police isolé. Une page qui casse sa mise en page ou tronque du contenu à 200 % de zoom navigateur ne passe pas le critère, même si un bouton « Agrandir le texte » local fonctionne.

> **Mode sombre appliqué sans revérifier les contrastes.** Inverser les couleurs (fond noir, texte blanc) ne garantit ni ne casse automatiquement la conformité : chaque paire texte/fond doit être recalculée pour le thème sombre, bordures et icônes comprises.

### À retenir

- Texte normal : 4,5:1 minimum. Texte large (≥18pt/24px, ou ≥14pt/18,5px gras) et composants d'interface : 3:1 minimum.
- Texte décoratif, invisible ou faisant partie d'un logo : exempté du seuil de contraste.
- Ne jamais faire porter une information uniquement par la couleur : ajouter un texte, une icône ou un motif en complément.
- La page doit rester utilisable à 200 % de zoom texte et se réorganiser sans défilement horizontal ni perte de contenu à 400 % (320px de large).
- Contenu en mouvement démarrant seul et durant plus de 5 secondes : prévoir pause/arrêt/masquage ; clignotement : jamais plus de 3 flashs par seconde ; respecter `prefers-reduced-motion`.
