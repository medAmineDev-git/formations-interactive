---
id: tests-manuels
chapitre: tests-outils
ordre: 2
titre: "Les tests manuels"
termes:
  - terme: Parcours clavier complet
    definition: "Naviguer et utiliser une page **entièrement au clavier** (souris débranchée mentalement) : Tab/Shift+Tab pour se déplacer, Entrée ou Espace pour activer, flèches dans les menus et listes. Le test le plus rapide et le plus rentable de ce chapitre."
  - terme: Focus visible
    definition: "Indicateur visuel (le plus souvent un contour) qui montre en permanence quel élément a le focus clavier. Sans lui, un parcours clavier techniquement fonctionnel reste inutilisable : on ne sait jamais où l'on se trouve sur la page."
  - terme: Zoom à 200 % et redimensionnement
    definition: "Vérifier qu'à 200 % de zoom navigateur, tout le contenu et toutes les fonctionnalités restent disponibles, sans texte tronqué ni superposition — un test rapide (Ctrl/Cmd + `+`) qui révèle vite des mises en page trop rigides."
  - terme: Vue linéarisée
    definition: "Désactiver le CSS (ou utiliser l'outil de désactivation des styles des outils de développement) pour voir la page dans l'ordre brut du DOM. Révèle si l'ordre de lecture logique correspond à l'ordre visuel donné par la mise en page."
  - terme: Structure des titres
    definition: "Vérification que les niveaux `<h1>` à `<h6>` forment une hiérarchie cohérente (pas de saut de niveau injustifié, un seul `<h1>` par page en général), consultable rapidement via l'arbre d'accessibilité ou un plan de la page généré par un outil dédié."
  - terme: Formulaire en erreur
    definition: "Test qui consiste à soumettre volontairement un formulaire invalide pour vérifier que chaque message d'erreur est annoncé, associé au bon champ, et que le focus est géré de façon prévisible après la soumission."
  - terme: Grille de test maison
    definition: "Checklist interne, courte et reproductible, listant les vérifications manuelles qu'une équipe s'engage à exécuter sur chaque fonctionnalité livrée — le socle qui rend les tests manuels réalistes dans un rythme de développement normal."
quiz:
  - question: "Un audit de la structure des titres d'une page relève cette hiérarchie. Quel est le problème ?"
    code: |
      <h1>Catalogue produits</h1>
      <h3>Filtrer par catégorie</h3>
      <h3>Résultats</h3>
    choix:
      - "Aucun : le niveau de titre n'a d'incidence que sur la taille visuelle du texte"
      - "Le saut direct de h1 à h3, sans h2, casse la hiérarchie : un lecteur d'écran naviguant par niveaux de titres perd le repère de structure, même si l'affichage visuel semble cohérent"
      - "Il est interdit d'avoir deux h3 identiques sur la même page"
      - "Le problème disparaîtrait en remplaçant les deux h3 par des h1"
    reponse: 1
    explication: "Les niveaux de titre doivent former une hiérarchie logique, pas seulement une hiérarchie visuelle. Un lecteur d'écran permet de naviguer de titre en titre et d'attendre une progression cohérente (h1 puis h2 puis h3…) : un saut de niveau désoriente, même si rien ne choque visuellement."
  - question: "Un bouton personnalisé a été stylé avec `outline: none` sans remplacement. Quel est le risque principal révélé par un test manuel au clavier ?"
    choix:
      - "Le bouton ne peut plus du tout recevoir le focus"
      - "Le bouton reste utilisable au clavier, mais personne ne peut voir où se trouve le focus pendant la navigation — le parcours devient inutilisable en pratique, sans erreur technique détectable automatiquement"
      - "Le navigateur refuse d'appliquer la règle CSS"
      - "Le problème n'existe que pour les utilisateurs de lecteur d'écran, pas pour les autres utilisateurs du clavier"
    reponse: 1
    explication: "Retirer l'outline sans le remplacer ne casse rien techniquement : le focus existe toujours dans le DOM. Mais un utilisateur qui navigue au clavier sans voir où il se trouve perd le fil — un problème d'usabilité réelle que seul un test manuel (parcourir la page au clavier, en regardant l'écran) révèle clairement."
  - question: "Une équipe a mis en place une routine de tests manuels rigoureuse (clavier, zoom, titres) sur chaque fonctionnalité livrée. Dans quel cas reste-t-il pertinent de faire appel à un audit externe ou à des utilisateurs en situation de handicap ?"
    choix:
      - "Jamais : une routine interne bien suivie remplace intégralement un regard extérieur"
      - "Uniquement si l'équipe soupçonne un bug visuel"
      - "Avant une déclaration de conformité, un jalon important, ou pour valider un parcours métier critique : un audit externe ou des utilisateurs experts détectent des difficultés d'usage réel qu'une routine interne, même rigoureuse, ne peut pas reproduire fidèlement"
      - "Seulement quand l'équipe ne dispose d'aucun outil automatique"
    reponse: 2
    explication: "Une routine maison, exécutée par des personnes non expertes du sujet, reste un filet de sécurité utile mais partiel. Un audit externe ou des utilisateurs en situation de handicap apportent une expérience réelle et experte qu'aucune checklist interne ne simule complètement — particulièrement avant un jalon officiel ou sur un parcours métier critique."
---

## Essentiel

Les tests manuels complètent les outils automatiques là où ils s'arrêtent : le sens, l'usage réel, le parcours complet. Une routine courte et **reproductible**, exécutée régulièrement, suffit à attraper la majorité des problèmes concrets.

Routine de base, dans cet ordre :

1. **Parcours clavier complet** : débrancher mentalement la souris, tout atteindre au Tab, tout activer avec Entrée/Espace.
2. **Focus visible** : à chaque étape du parcours, l'indicateur de focus doit être visible sans ambiguïté.
3. **Zoom à 200 %** : aucun contenu tronqué, aucune fonctionnalité perdue.
4. **Désactivation des styles** (ou vue linéarisée) : l'ordre de lecture du DOM doit rester logique.
5. **Structure des titres** : hiérarchie cohérente, sans saut de niveau injustifié.
6. **Formulaire en erreur** : soumettre volontairement des données invalides et vérifier que chaque erreur est annoncée et reliée au bon champ.
7. **Parcours métier de bout en bout** : un scénario réel complet (ajouter un article au panier puis commander, par exemple), du début à la fin, uniquement au clavier.

```html
<!-- Repéré en 30 secondes lors d'un parcours clavier : le focus n'est jamais visible -->
<button style="outline: none;">Ajouter au panier</button>
```

Cette routine tient sur une **grille de test maison** — une checklist courte qu'une équipe applique à chaque fonctionnalité livrée. Elle ne remplace pas tout : avant une échéance importante (déclaration de conformité, jalon majeur) ou sur un parcours critique, un audit externe ou des utilisateurs en situation de handicap restent nécessaires — ils apportent une expérience réelle qu'une routine interne ne reproduit jamais complètement.

## Détail

### Pourquoi cette routine, dans cet ordre

Elle va du test le plus rapide et le plus rentable (le clavier, qui révèle à lui seul une grande partie des problèmes bloquants) vers des vérifications plus ciblées. L'objectif n'est pas l'exhaustivité à chaque passage, mais la **régularité** : une routine de dix minutes exécutée à chaque livraison vaut mieux qu'un audit complet une fois par an.

### Exemple 1 — Une grille de test maison minimale

```markdown
## Checklist accessibilité — avant chaque mise en production

- [ ] Parcours clavier complet du flux principal, focus visible à chaque étape
- [ ] Zoom navigateur à 200 % : rien de tronqué, rien de superposé
- [ ] Un h1 par page, pas de saut de niveau de titre
- [ ] Formulaire testé avec des données invalides : erreurs annoncées et reliées au champ
- [ ] Aucune information transmise par la seule couleur
```

Une grille de ce type, courte et concrète, s'exécute en quelques minutes et attrape la majorité des régressions du quotidien.

### Exemple 2 — Tester un formulaire en erreur

```html
<label for="email">Adresse e-mail</label>
<input id="email" type="email" aria-describedby="erreur-email" aria-invalid="true">
<p id="erreur-email">Format d'adresse e-mail invalide.</p>
```

Le test manuel consiste à soumettre le formulaire avec une valeur invalide, puis à vérifier deux choses distinctes : que le message d'erreur apparaît visuellement **et** qu'il est relié au champ par `aria-describedby` (sinon un lecteur d'écran placé sur le champ n'annoncera jamais l'erreur, même visible juste en dessous).

### Exemple 3 — Un parcours métier de bout en bout

Ajouter un article au panier puis passer commande, uniquement au clavier, du catalogue à la page de confirmation : ce test révèle des problèmes qu'aucun test isolé sur une seule page ne peut voir — un focus qui disparaît après l'ajout au panier, une modale qui piège le focus sans possibilité d'en sortir, une étape du tunnel injoignable au Tab. C'est le test le plus proche d'un usage réel.

### Exemple 4 — Vue linéarisée pour vérifier l'ordre de lecture

Dans les outils de développement du navigateur, désactiver le CSS (Firefox : *Affichage responsive* puis désactivation des styles, ou une extension dédiée) affiche la page dans l'ordre brut du DOM. Si l'ordre obtenu n'a plus de sens — par exemple la barre latérale apparaît avant le contenu principal alors qu'elle devrait venir après au clavier comme au lecteur d'écran — c'est le signe d'un DOM organisé pour le rendu visuel, pas pour la lecture séquentielle.

### Quand aller au-delà de la routine interne

| Situation | Ce qu'apporte un audit externe ou des utilisateurs experts |
|---|---|
| Déclaration de conformité RGAA | Une évaluation indépendante et méthodique, exigée par la démarche elle-même |
| Jalon majeur (refonte, nouveau parcours critique) | Un regard neuf, sans les angles morts de l'équipe qui a construit la fonctionnalité |
| Retours d'usage contradictoires | L'expérience réelle d'un utilisateur expert d'une technologie d'assistance, que la routine interne ne simule pas |

### Pièges courants

> **Exécuter la routine une seule fois, au lancement.** Une régression sur `outline: none` ou une nouvelle étape de formulaire sans étiquette passe inaperçue si la routine n'est pas répétée à chaque livraison.

> **Tester le clavier sans regarder l'écran.** Le test clavier ne sert pas seulement à vérifier qu'on peut « tout atteindre » : il faut voir, à chaque étape, où se trouve le focus. Sans ça, un `outline: none` non compensé passe inaperçu.

> **Croire qu'une routine interne rigoureuse dispense de tout regard extérieur.** Elle attrape l'essentiel du quotidien, mais un audit externe ou des utilisateurs en situation de handicap révèlent des difficultés d'usage réel qu'une équipe non experte, même appliquée, ne reproduit pas.

### À retenir

- Le parcours clavier complet, avec vérification du focus visible, est le test manuel le plus rapide et le plus rentable.
- Zoom à 200 %, vue linéarisée et structure des titres se testent en quelques minutes avec les outils du navigateur.
- Tester un formulaire en erreur vérifie à la fois l'annonce du message et son association technique au champ.
- Un parcours métier de bout en bout, au clavier, révèle des problèmes invisibles à l'échelle d'une seule page.
- Une grille de test maison rend la routine reproductible ; un audit externe ou des utilisateurs en situation de handicap restent nécessaires pour les jalons importants.
