---
id: lecteurs-ecran
chapitre: tests-outils
ordre: 3
titre: "Prendre en main un lecteur d'écran"
termes:
  - terme: Lecteur d'écran
    definition: "Logiciel qui restitue vocalement (et/ou en braille) le contenu d'une interface à partir de l'**arbre d'accessibilité** exposé par le système et le navigateur. Un développeur qui n'en a jamais utilisé un juge son code sans jamais l'avoir « entendu »."
  - terme: NVDA
    definition: "Lecteur d'écran **gratuit et open source** pour Windows. Avec JAWS, c'est l'un des deux lecteurs les plus utilisés sur ordinateur ; sa gratuité en fait le point d'entrée le plus accessible pour un développeur qui débute."
  - terme: JAWS
    definition: "Lecteur d'écran commercial pour Windows, historiquement dominant en entreprise. D'après l'édition n° 10 (2024) de la WebAIM Screen Reader User Survey, c'est le lecteur d'écran **principal** le plus utilisé sur ordinateur."
  - terme: VoiceOver
    definition: "Lecteur d'écran intégré **nativement** à macOS et iOS (aucune installation requise). Activation de base sur Mac : `Cmd + F5` ; sur iPhone/iPad, via *Réglages > Accessibilité > VoiceOver* ou un raccourci d'accessibilité configuré au préalable."
  - terme: Touche NVDA
    definition: "Touche modificatrice de NVDA (par défaut `Insert`, ou `Verr. Maj.` en alternative configurable) qui préfixe la plupart des raccourcis, par exemple `NVDA + Flèche bas` pour la lecture continue."
  - terme: Rotor (VoiceOver)
    definition: "Menu circulaire de navigation ouvert avec `VO + U` (`VO` = `Ctrl + Option`), qui permet de parcourir une page par catégorie : titres, liens, régions, champs de formulaire — l'équivalent VoiceOver de la navigation par titres de NVDA."
  - terme: WebAIM Screen Reader User Survey
    definition: "Enquête de référence du secteur sur l'usage des lecteurs d'écran. L'édition la plus récente **publiée** est la n° 10 (22 février 2024, 1 539 réponses valides) ; une édition n° 11 a terminé sa collecte le 31 août 2026 mais n'était pas encore publiée à la date de rédaction de cette leçon — ses chiffres ne doivent pas être cités tant qu'ils ne sont pas publiés."
quiz:
  - question: "Un lecteur d'écran (NVDA ou VoiceOver) rencontre ce bouton en navigation au clavier. Qu'annonce-t-il ?"
    code: |
      <button aria-label="Fermer">
        <svg aria-hidden="true"><!-- icône de croix --></svg>
      </button>
    choix:
      - "« Fermer, bouton » : le nom accessible vient de aria-label, le contenu du SVG est ignoré car masqué par aria-hidden"
      - "Rien du tout : un bouton qui ne contient pas de texte visible n'est jamais annoncé"
      - "Le contenu du fichier SVG, lu élément par élément"
      - "« Bouton », sans aucun nom, car aria-label n'est pas pris en charge sur un <button>"
    reponse: 0
    explication: "aria-label fournit le nom accessible du bouton, indépendamment de son contenu visuel. aria-hidden=\"true\" retire le SVG de l'arbre d'accessibilité : le lecteur d'écran n'a donc aucune raison de le lire. C'est exactement ce type de comportement qu'on ne vérifie qu'en écoutant réellement un lecteur d'écran."
  - question: "D'après l'édition n° 10 (2024) de la WebAIM Screen Reader User Survey, quel est le lecteur d'écran cité comme lecteur *principal* par le plus grand nombre de répondants sur ordinateur ?"
    choix:
      - "NVDA, avec 37,7 %"
      - "JAWS, avec 40,5 %"
      - "VoiceOver (macOS), avec 9,7 %"
      - "Narrator, avec 0,7 %"
    reponse: 1
    explication: "Sur cette édition, JAWS arrive en tête comme lecteur d'écran *principal* (40,5 % contre 37,7 % pour NVDA). Le classement s'inverse si l'on considère l'usage « au sens large », toutes fréquences confondues (NVDA ~65,6 % contre JAWS ~60,5 %) : la distinction entre « lecteur principal » et « lecteur utilisé au moins occasionnellement » change la réponse, d'où l'intérêt de toujours préciser de quelle mesure on parle."
  - question: "Un développeur voyant teste sa fonctionnalité avec NVDA pendant une heure et ne relève aucun problème. Que peut-on raisonnablement en conclure ?"
    choix:
      - "La fonctionnalité est certifiée accessible pour tous les lecteurs d'écran"
      - "Le test a une vraie valeur pour repérer les problèmes grossiers (nom manquant, ordre incohérent), mais un développeur non expert reste plus lent et moins fiable qu'un utilisateur expérimenté, et le comportement peut différer avec un autre lecteur d'écran (JAWS, VoiceOver) ou une autre combinaison navigateur/lecteur"
      - "Le test ne vaut rien, seul un utilisateur aveugle peut évaluer l'accessibilité"
      - "Il suffit de refaire le même test avec Narrator pour couvrir tous les cas restants"
    reponse: 1
    explication: "Essayer soi-même un lecteur d'écran fait gagner en intuition et attrape des problèmes évidents, mais un développeur voyant n'a ni la vitesse, ni les réflexes, ni l'expérience d'un utilisateur expert — et le rendu peut varier d'un lecteur d'écran à l'autre. C'est un complément utile, pas un substitut à un test avec un utilisateur expert ou un audit externe."
---

## Essentiel

Lire le code d'une interface ne dit pas comment elle **sonne**. Essayer un lecteur d'écran, même brièvement, change durablement la façon d'écrire du HTML : on découvre presque toujours, dès les premières minutes, qu'un bouton icône sans `aria-label` est annoncé « bouton » sans aucun nom, qu'une image sans `alt` interrompt la lecture par un nom de fichier, ou qu'un champ de formulaire sans `<label>` associé est totalement muet.

Sur ordinateur, deux lecteurs dominent : **JAWS** (commercial) et **NVDA** (gratuit, open source) — d'après l'édition n° 10 (2024) de la WebAIM Screen Reader User Survey, JAWS reste le lecteur *principal* le plus cité (40,5 % contre 37,7 % pour NVDA), NVDA repassant devant en usage « au sens large ». Sur Mac et iPhone, **VoiceOver** est intégré nativement, sans rien à installer.

Premiers pas :
- **NVDA (Windows)** : gratuit sur [nvaccess.org](https://www.nvaccess.org/). Touche NVDA par défaut : `Insert`. `NVDA + Flèche bas` lit en continu depuis la position actuelle ; `Ctrl` arrête la lecture ; `H` / `Shift + H` passent au titre suivant/précédent ; `Tab` suit l'ordre de tabulation normal des éléments interactifs.
- **VoiceOver (macOS)** : `Cmd + F5` pour l'activer/désactiver. Touche `VO` = `Ctrl + Option`. `VO + Flèche droite/gauche` déplace l'élément courant ; `VO + U` ouvre le **rotor** pour naviguer par catégorie (titres, liens, régions).
- **VoiceOver (iOS)** : activable dans *Réglages > Accessibilité > VoiceOver*. Balayage à un doigt pour passer d'un élément au suivant, double-tap pour activer.

```html
<!-- Ce que NVDA ou VoiceOver annonce sans hésiter : « bouton », sans nom -->
<button><i class="icon-fermer"></i></button>
```

Un développeur voyant reste, par définition, un non-expert : plus lent, moins fluide dans les raccourcis, et le comportement d'un même code peut varier d'un lecteur d'écran à l'autre. Ce test personnel complète les tests manuels et les outils automatiques, sans jamais les remplacer.

## Détail

### Pourquoi un développeur devrait en essayer un

Aucune documentation ne remplace l'expérience directe : entendre un bouton icône annoncé « bouton », sans nom, marque plus durablement qu'une règle lue dans un guide. C'est aussi le seul moyen de vérifier concrètement ce que produit une combinaison de `aria-label`, `aria-hidden` et de structure HTML — sans deviner.

### Exemple 1 — Navigation par titres avec NVDA

```html
<h1>Catalogue</h1>
<h2>Filtres</h2>
<h2>Résultats</h2>
```

Avec NVDA en mode navigation (le mode par défaut sur une page web), la touche `H` déplace le focus de titre en titre, `Shift + H` en sens inverse, et `1` à `6` filtrent par niveau précis. `NVDA + F7` ouvre la liste complète des éléments (titres, liens, zones de repère) pour un aperçu rapide de la structure — un équivalent vocal du panneau *Accessibility* du navigateur vu dans la première leçon de ce chapitre.

### Exemple 2 — Navigation par régions avec VoiceOver

```html
<nav aria-label="Navigation principale">…</nav>
<main>…</main>
<aside aria-label="Filtres">…</aside>
```

Avec le rotor VoiceOver (`VO + U`), on choisit la catégorie « Points de repère » (landmarks) pour sauter directement entre `<nav>`, `<main>` et `<aside>`, à condition qu'ils portent un rôle ou une balise sémantique explicite. Sans ces éléments sémantiques, VoiceOver n'a rien à proposer dans cette catégorie du rotor.

### Exemple 3 — Ce qu'on découvre presque toujours à la première écoute

| Code rencontré | Ce qu'on entend |
|---|---|
| `<img src="produit.jpg">` sans `alt` | Le nom du fichier, ou « image », selon le lecteur |
| `<div onclick="...">Valider</div>` | Rien d'interactif : élément ignoré en navigation au Tab |
| `<input>` sans `<label>` associé | « Modifier texte », sans aucun contexte sur ce qu'il faut saisir |
| Message d'erreur visible mais non relié via `aria-describedby` | Le champ reste annoncé sans jamais mentionner l'erreur |

Ces quatre cas suffisent, à eux seuls, à convaincre qu'un simple essai vaut plus que des heures de lecture de documentation.

### Limites du test par un développeur voyant

- **Vitesse et fluidité** : un utilisateur expert navigue à une vitesse de lecture bien plus rapide et utilise des raccourcis combinés que peu de développeurs connaissent au-delà des bases.
- **Biais visuel** : un développeur voyant regarde l'écran en écoutant, ce qui l'aide à comprendre le contexte — un utilisateur aveugle n'a que l'audio, ce qui change fondamentalement la charge cognitive du test.
- **Pas un utilisateur expert** : reconnaître un problème réel (ordre incohérent, information manquante) demande de l'expérience ; un test occasionnel attrape surtout les problèmes les plus grossiers.

### Pièges d'interprétation : les différences entre lecteurs d'écran

Un même code peut être restitué différemment selon le lecteur d'écran, le navigateur, voire leur version. C'est précisément pour cette raison que la méthode RGAA définit des **combinaisons officielles de test** (NVDA + Firefox, JAWS + Firefox ou Internet Explorer, VoiceOver + Safari sur ordinateur ; TalkBack + Chrome sur Android, VoiceOver + Safari sur iOS) plutôt qu'un lecteur d'écran isolé. Un test concluant avec NVDA seul ne garantit donc pas le même résultat avec JAWS ou VoiceOver : tester sur une seule combinaison reste un indicateur, pas une validation complète.

### Pièges courants

> **Confondre « ça fonctionne avec NVDA » et « ça fonctionne avec tous les lecteurs d'écran ».** Le comportement face à un même attribut ARIA peut différer d'un lecteur à l'autre : ne généralisez jamais un résultat obtenu avec un seul couple lecteur/navigateur.

> **Citer des parts de marché sans préciser la mesure.** « Lecteur principal » et « lecteur utilisé au moins occasionnellement » donnent un classement différent (JAWS en tête sur le premier critère, NVDA sur le second) — toujours préciser de quelle mesure de la WebAIM Screen Reader User Survey on parle.

> **Se croire expert après un seul essai.** Un test personnel fait gagner en intuition et attrape les problèmes les plus évidents ; il ne remplace ni un audit externe, ni le retour d'un utilisateur expert d'un lecteur d'écran au quotidien.

### À retenir

- Essayer un lecteur d'écran change durablement la façon d'écrire du HTML — même une session courte révèle des problèmes qu'aucune documentation ne fait sentir aussi bien.
- Sur ordinateur, JAWS et NVDA dominent (édition n° 10, 2024, de la WebAIM Screen Reader User Survey) ; VoiceOver est intégré nativement sur macOS et iOS.
- NVDA : touche `Insert`, `NVDA + Flèche bas` pour lire en continu, `H`/`Shift + H` pour naviguer par titre. VoiceOver : `Cmd + F5` pour l'activer, touche `VO` = `Ctrl + Option`, `VO + U` pour le rotor.
- Un développeur voyant reste un non-expert : ce test complète les outils automatiques et les tests manuels, il ne remplace ni un audit externe ni un utilisateur expert.
- Le comportement peut varier d'un lecteur d'écran à l'autre : c'est pourquoi le RGAA définit des combinaisons officielles lecteur d'écran / navigateur plutôt qu'un test sur un seul outil.
