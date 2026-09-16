---
id: outils-automatiques
chapitre: tests-outils
ordre: 1
titre: "Les outils automatiques"
termes:
  - terme: Outil automatique d'audit
    definition: "Programme qui inspecte le DOM d'une page et signale les violations de règles **vérifiables mécaniquement** (attribut manquant, contraste insuffisant, rôle ARIA invalide…). Il ne juge jamais le **sens** du contenu."
  - terme: "axe DevTools / axe-core"
    definition: "Extension navigateur et moteur de règles open source de **Deque**, largement réutilisé par d'autres outils (Lighthouse, Accessibility Insights). Référence de fait du secteur pour l'analyse automatique."
  - terme: WAVE
    definition: "Outil web et extension navigateur de **WebAIM** : annote directement la page avec des icônes d'erreurs et d'alertes. Sert aussi de moteur au rapport annuel *WebAIM Million*."
  - terme: Google Lighthouse
    definition: "Audit intégré à Chrome DevTools et PageSpeed Insights. Son volet accessibilité s'appuie sur un **sous-ensemble** des règles axe-core (une cinquantaine d'audits contre près d'une centaine dans axe DevTools complet) : un score élevé ne couvre donc pas tout ce qu'axe DevTools peut détecter."
  - terme: Assistant RGAA
    definition: "Extension Firefox/Chrome (maintenue par Boscop) qui guide un **audit manuel** critère par critère sur les 106 critères RGAA : elle propose la procédure de test officielle et, pour certains tests, met en évidence les éléments DOM concernés. Ce n'est pas un outil d'analyse automatique au sens strict."
  - terme: Arbre d'accessibilité
    definition: "Représentation que le navigateur construit à partir du DOM et expose aux technologies d'assistance (rôle, nom accessible, état de chaque élément). Le panneau *Accessibility* de Chrome/Edge DevTools et l'*Accessibility Inspector* de Firefox permettent de l'inspecter élément par élément."
  - terme: Intégration continue (CI) d'accessibilité
    definition: "Exécuter un outil automatique (par exemple axe-core) à chaque build pour bloquer les **régressions** détectables mécaniquement. Utile, mais couvre seulement une partie des critères d'accessibilité — voir le chapitre avancé Angular pour la mise en œuvre concrète dans un projet."
quiz:
  - question: "Un outil comme axe DevTools ou WAVE analyse cette image. Que signale-t-il ?"
    code: |
      <img src="graphique-ventes.png" alt="graphique-ventes.png">
    choix:
      - "Une erreur : l'attribut alt est vide"
      - "Aucune erreur : l'attribut alt est présent, même si son contenu ne décrit rien d'utile"
      - "Une erreur : l'attribut alt ne doit jamais reprendre un nom de fichier"
      - "Une alerte de contraste, car le texte alternatif n'est pas visible à l'écran"
    reponse: 1
    explication: "Les outils automatiques vérifient la **présence** de l'attribut alt, pas la pertinence de son contenu. Un nom de fichier recopié dans alt passe le test automatique alors qu'il n'apporte aucune information utile : seul un jugement humain le détecte."
  - question: "Quelle affirmation sur la couverture réelle des outils automatiques est correcte ?"
    choix:
      - "Le RGAA publie un pourcentage officiel de critères automatisables"
      - "Le rapport WebAIM Million publie un pourcentage exact des erreurs détectées par WAVE"
      - "Selon une étude Deque publiée en mars 2021, les tests automatisés ont détecté 57,38 % du volume total des problèmes identifiés lors de plus de 2 000 audits réels"
      - "Aucune organisation n'a jamais publié de chiffre sur la couverture des outils automatiques"
    reponse: 2
    explication: "C'est le seul chiffre daté et sourcé de façon fiable : une étude Deque du 10 mars 2021, portant sur plus de 2 000 audits (13 000+ pages, ~300 000 problèmes relevés). Le RGAA et le rapport WebAIM Million ne publient aucun pourcentage équivalent — ne pas confondre avec la mesure Deque par critères WCAG (16 critères sur 50 concernés par l'automatisation), qui répond à une autre question."
  - question: "Lequel de ces problèmes un outil automatique ne détectera jamais, quelle que soit sa sophistication ?"
    choix:
      - "Un attribut alt manquant sur une image"
      - "Un ordre de tabulation illogique par rapport au sens visuel de la page"
      - "Un ratio de contraste texte/fond insuffisant"
      - "Un champ de formulaire sans étiquette associée"
    reponse: 1
    explication: "La cohérence de l'ordre de tabulation dépend du **sens** du contenu dans son contexte, pas d'une propriété mesurable dans le DOM : aucun outil automatique ne peut évaluer si l'ordre « a du sens » pour quelqu'un qui ne voit pas la page. Les trois autres problèmes sont, eux, vérifiables mécaniquement."
---

## Essentiel

Un outil automatique inspecte le DOM d'une page et signale ce qui est **vérifiable mécaniquement** : attribut `alt` manquant, champ de formulaire sans étiquette, contraste insuffisant, attribut `lang` absent, attribut ARIA invalide, titre de document manquant, hiérarchie des titres rompue, identifiants dupliqués. C'est un gain de temps réel — mais un rapport « zéro erreur » ne veut pas dire « page accessible ».

Ce qu'un outil automatique **ne détectera jamais** :
- la pertinence d'un texte alternatif (au-delà de sa simple présence) ;
- un ordre de tabulation logique dans un parcours complet ;
- la cohérence d'un intitulé de bouton ou de lien par rapport à sa fonction réelle ;
- le sens du contenu, en général.

Panorama des outils courants : extensions de navigateur (**axe DevTools**, **WAVE**, **Assistant RGAA** pour un audit manuel guidé sur les critères RGAA), l'audit **Lighthouse** intégré à Chrome DevTools, des vérificateurs de contraste, un validateur HTML, et l'**arbre d'accessibilité** inspectable directement dans les outils du navigateur.

```html
<!-- Passe tous les contrôles automatiques : présence de l'attribut, rien de plus -->
<img src="graphique-ventes.png" alt="graphique-ventes.png">
```

Le seul chiffre précis et sourcé sur la couverture réelle des outils automatiques vient d'une étude **Deque** de mars 2021 : environ **57,38 %** du volume de problèmes réels détectés lors de plus de 2 000 audits. Traiter un rapport « zéro violation » comme un objectif en soi — la « conformité à l'outil » — est le piège classique de ce chapitre.

## Détail

### Comment lire un rapport sans viser la « conformité à l'outil »

Un rapport automatique sert à **prioriser** un travail de correction, pas à cocher une case. Trois réflexes :

1. Corriger d'abord ce que l'outil signale avec certitude (erreurs), traiter les avertissements au cas par cas — un outil signale parfois un faux positif (par exemple un contraste jugé insuffisant sur un élément décoratif désactivé pour les technologies d'assistance).
2. Ne jamais arrêter le travail parce que le rapport est vide : c'est le signal qu'il faut passer aux tests manuels (voir la leçon suivante), pas que le travail est fini.
3. Garder trace de ce qu'un outil *peut* couvrir (structurel) et de ce qu'il ne couvre *jamais* (pertinence, sens, comportement réel) pour ne pas confondre les deux dans un rapport d'avancement.

### Exemple 1 — Panorama des extensions de navigateur

| Outil | Ce qu'il fait | Éditeur |
|---|---|---|
| axe DevTools | Analyse automatique du DOM affiché, référence de fait du secteur | Deque |
| WAVE | Annote la page avec des icônes d'erreurs/alertes directement dans le navigateur | WebAIM |
| Assistant RGAA | Guide un audit **manuel** critère par critère sur les 106 critères RGAA | Boscop |

L'Assistant RGAA se distingue des deux autres : ce n'est pas un moteur d'analyse automatique, mais un outil qui structure et accélère un audit humain suivant la méthode officielle.

### Exemple 2 — Lighthouse en ligne de commande, pour l'intégrer à un pipeline

```bash
# Exécute un audit Lighthouse (dont le volet accessibilité) sur une URL, sortie JSON
npx lighthouse https://exemple.fr --only-categories=accessibility --output=json --output-path=./rapport.json
```

Un score Lighthouse élevé ne signifie pas « autant couvert qu'axe DevTools » : Lighthouse s'appuie sur un sous-ensemble des règles axe-core, pas sur l'ensemble complet.

### Exemple 3 — Inspecter l'arbre d'accessibilité

Dans Chrome ou Edge DevTools, l'onglet *Accessibility* (dans le panneau *Elements*) affiche, pour l'élément sélectionné, son **rôle**, son **nom accessible** et ses **propriétés** exposés aux technologies d'assistance — utile pour vérifier concrètement ce qu'un lecteur d'écran recevrait, sans lancer de lecteur d'écran. Firefox propose l'équivalent dans son *Accessibility Inspector*, avec en plus un simulateur de déficience de vision des couleurs.

```html
<button aria-label="Fermer la fenêtre">
  <svg aria-hidden="true"><!-- icône --></svg>
</button>
```

L'arbre d'accessibilité de ce bouton affichera un nom accessible « Fermer la fenêtre » et aucune trace du contenu du SVG (masqué par `aria-hidden`) : exactement ce qu'un outil automatique ne peut pas vous montrer sans cette inspection.

### Exemple 4 — Intégration continue, le principe

Le principe général : faire échouer un build quand un outil automatique détecte une **nouvelle** violation, pour empêcher une régression silencieuse. Le chapitre avancé consacré à Angular détaille la mise en œuvre technique (tests de composants et de bout en bout) ; retenez ici seulement le principe : la CI protège contre les régressions détectables mécaniquement, elle ne remplace pas les tests manuels de ce chapitre.

### Pièges courants

> **Faire de « zéro erreur automatique » un objectif de projet.** Un rapport vide ne couvre, au mieux, qu'une partie des problèmes réels (voir le chiffre Deque ci-dessus) : c'est un jalon, pas une preuve de conformité.

> **Confondre le score Lighthouse et une couverture complète.** Lighthouse repose sur un sous-ensemble des règles axe-core : un score de 100 n'équivaut pas à un audit axe DevTools complet, encore moins à un audit RGAA.

> **Citer un pourcentage « officiel » d'automatisation du RGAA.** Le RGAA ne publie aucun chiffre de ce type ; les chiffres qui circulent en ligne à ce sujet ne viennent pas du texte officiel.

### À retenir

- Un outil automatique détecte des problèmes **structurels vérifiables mécaniquement** : présence d'attributs, contrastes, validité ARIA, duplication d'identifiants.
- Il ne détecte jamais la **pertinence** d'un contenu (texte alternatif, intitulé), ni un ordre de tabulation illogique, ni le sens réel d'une page.
- Le seul chiffre précis et sourcé sur la couverture réelle vient de Deque (mars 2021) : environ 57,38 % du volume de problèmes réels — pas un chiffre officiel du RGAA ni de WebAIM.
- Un audit vide est un signal pour passer aux tests manuels, jamais une preuve d'accessibilité.
- L'intégration continue protège contre les régressions détectables mécaniquement, en complément des tests manuels — jamais à leur place.
