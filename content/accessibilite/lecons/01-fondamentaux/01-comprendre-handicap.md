---
id: comprendre-handicap
chapitre: fondamentaux
ordre: 1
titre: Qui est concerné, et comment
termes:
  - terme: Handicap situationnel
    definition: "Limitation **temporaire et liée au contexte**, pas à la personne : porter des courses et n'avoir qu'une main, être en plein soleil sur un écran de smartphone, se trouver dans un environnement trop bruyant pour entendre une vidéo. Concevoir pour le handicap permanent profite directement à ces situations."
  - terme: Lecteur d'écran (screen reader)
    definition: "Logiciel qui explore une page non pas visuellement mais via l'**arbre d'accessibilité**, et restitue son contenu par synthèse vocale ou sur une plage braille. Exemples : NVDA et JAWS (Windows), VoiceOver (macOS/iOS), TalkBack (Android)."
  - terme: Arbre d'accessibilité (accessibility tree)
    definition: "Représentation structurée d'une page que le navigateur construit à partir du DOM, exposée aux technologies d'assistance : chaque élément y porte un **rôle**, un **nom accessible** et des **états**. C'est cet arbre qu'un lecteur d'écran parcourt, pas le rendu visuel."
  - terme: Plage braille (afficheur braille)
    definition: "Périphérique qui affiche du texte en braille sur des picots mobiles, ligne par ligne. Généralement couplé à un lecteur d'écran, il permet de lire silencieusement et est la seule aide technique qui restitue vraiment l'écrit (orthographe, ponctuation) plutôt qu'une lecture orale."
  - terme: Contacteur (switch access)
    definition: "Dispositif à un ou quelques boutons, actionné avec la partie du corps encore mobile (main, tête, souffle), qui permet de naviguer dans une interface par **balayage** : les éléments sont mis en surbrillance tour à tour, un appui valide celui en cours."
  - terme: Commande vocale
    definition: "Contrôle d'une interface par la voix (ex. Dragon NaturallySpeaking, Voice Control) : dicter du texte, mais aussi nommer les éléments interactifs pour les activer (« cliquer sur Valider »). Nécessite que chaque élément ait un **nom accessible** correspondant à son libellé visible."
  - terme: Agrandisseur d'écran
    definition: "Logiciel de zoom (ex. ZoomText, ou le zoom intégré aux systèmes d'exploitation) qui grossit une portion de l'écran. Utilisé pour une malvoyance, mais aussi ponctuellement par n'importe qui sur un écran distant ou un texte trop petit."
quiz:
  - question: "Ce bouton n'a ni texte visible ni attribut dédié à son nom accessible. Que va annoncer un lecteur d'écran quand le focus l'atteint ?"
    code: |
      <button>
        <img src="corbeille.svg" alt="">
      </button>
    choix:
      - "« Corbeille, bouton », car le lecteur d'écran devine le sens de l'icône"
      - "« Bouton », sans aucun libellé : l'attribut `alt=\"\"` vide l'image du texte alternatif, et rien d'autre ne fournit de nom accessible"
      - "Rien du tout : le bouton est ignoré et n'est jamais atteint au clavier"
      - "Le nom du fichier « corbeille.svg », car le lecteur d'écran retombe sur l'attribut `src`"
    reponse: 1
    explication: "Le nom accessible d'un `<button>` se calcule à partir de son contenu texte, puis de l'`alt` d'une image qu'il contient. Ici `alt=\"\"` marque l'image comme décorative : elle n'apporte donc aucun texte, et le bouton reste sans nom. Un lecteur d'écran annonce seulement son rôle (« bouton »), sans indication de ce qu'il fait. Il faudrait `alt=\"Supprimer\"` sur l'image, ou un `aria-label=\"Supprimer\"` sur le `<button>`."
  - question: "Un développeur affirme : « Mon appli n'a pas besoin d'être accessible, je n'ai pas d'utilisateurs handicapés parmi mes testeurs. » Quelle situation illustre le mieux pourquoi ce raisonnement est incomplet ?"
    choix:
      - "Un utilisateur qui consulte le site au soleil sur son téléphone, l'écran peu lisible, et qui a besoin d'un contraste suffisant exactement comme une personne malvoyante"
      - "Un utilisateur qui préfère le mode sombre pour des raisons esthétiques"
      - "Un utilisateur qui n'a jamais installé d'extension de blocage de publicités"
      - "Un utilisateur qui utilise un ordinateur portable plutôt qu'un ordinateur de bureau"
    reponse: 0
    explication: "Le handicap situationnel (bras immobilisé, bruit ambiant, soleil sur l'écran) touche potentiellement tous les utilisateurs, pas seulement les personnes en situation de handicap permanent. Concevoir pour un bon contraste, une navigation clavier complète ou des sous-titres profite à un public bien plus large que les seuls testeurs identifiés comme handicapés."
  - question: "Pourquoi un lecteur d'écran peut-il annoncer correctement un bouton personnalisé stylé en CSS pour ressembler à un simple texte souligné ?"
    choix:
      - "Parce que le lecteur d'écran analyse le rendu visuel final de la page, comme une capture d'écran"
      - "Parce qu'il s'appuie sur l'arbre d'accessibilité, construit à partir du DOM (rôle, nom accessible, états), qui est indépendant de l'apparence visuelle produite par le CSS"
      - "Parce que le CSS contient toujours des commentaires que le lecteur d'écran interprète"
      - "Parce que les navigateurs interdisent de modifier l'apparence des éléments interactifs natifs"
    reponse: 1
    explication: "Le CSS change l'apparence, pas la structure exposée dans l'arbre d'accessibilité. Un `<button>` stylé pour ressembler à un lien reste annoncé comme un bouton, avec son nom accessible, parce que le lecteur d'écran lit cet arbre — pas les pixels affichés à l'écran."
---

## Essentiel

L'accessibilité ne concerne pas une petite minorité aux marges du produit : quatre grandes familles de situations sont concernées — **visuelle** (cécité, malvoyance, daltonisme), **auditive** (surdité, malentendance), **motrice** (mobilité réduite, tremblements, absence de membre) et **cognitive** (troubles de l'apprentissage, de l'attention, du spectre autistique). Chacune peut être **permanente**, **temporaire** (une opération, une fracture) ou **situationnelle** (une seule main occupée, un environnement bruyant, un écran au soleil) — et concevoir pour le cas permanent profite directement aux deux autres.

Des technologies d'assistance compensent ces situations : lecteur d'écran, plage braille, contacteur pour naviguer par balayage, commande vocale, agrandisseur d'écran. Point essentiel à retenir dès cette première leçon : un lecteur d'écran ne « voit » jamais la page comme un navigateur l'affiche. Il parcourt l'**arbre d'accessibilité**, une structure de rôles, de noms accessibles et d'états construite à partir du DOM.

```html
<!-- Visuellement identique pour un utilisateur voyant... -->
<div onclick="valider()">Valider</div>
<button onclick="valider()">Valider</button>
```

Le premier `<div>` est invisible pour l'arbre d'accessibilité en tant qu'élément interactif ; le second est exposé avec le rôle *bouton* et un nom accessible « Valider ». Le rendu visuel ne dit rien de ce que perçoit réellement une technologie d'assistance — c'est le fil conducteur de toute cette formation.

Au-delà de l'obligation (voir la leçon suivante), l'accessibilité a des bénéfices collatéraux directs : meilleure utilisabilité mobile, meilleur référencement (SEO), interfaces plus claires pour tout le monde.

## Détail

### Comment ça marche

Le navigateur construit l'arbre d'accessibilité à partir du DOM, en tenant compte du HTML natif, des attributs ARIA et de l'état courant (ouvert/fermé, coché/décoché, sélectionné…). Chaque nœud expose trois informations principales à une technologie d'assistance :

- un **rôle** (bouton, lien, case à cocher, titre de niveau 2…) ;
- un **nom accessible** (le texte qui identifie l'élément — pas forcément le texte visible) ;
- des **états et propriétés** (désactivé, développé, requis…).

Un lecteur d'écran restitue cet arbre, pas les pixels. C'est pourquoi un design visuellement irréprochable peut être totalement inutilisable au clavier ou à la voix si la structure sous-jacente ne suit pas.

### Exemple 1 — Les grandes familles de situations de handicap

| Famille | Exemples de situations | Aides techniques typiques |
|---|---|---|
| Visuelle | Cécité, malvoyance, daltonisme (confusion de couleurs, pas absence de vision) | Lecteur d'écran, plage braille, agrandisseur, contrastes renforcés |
| Auditive | Surdité, malentendance | Sous-titres, transcriptions, alertes visuelles plutôt que sonores |
| Motrice | Mobilité réduite, tremblements, absence de membre, fatigue | Navigation clavier complète, contacteur, commande vocale, cibles de clic larges |
| Cognitive | Troubles de l'apprentissage, de l'attention, du spectre autistique, de la mémoire | Structure claire et constante, langage simple, absence d'animations imposées |

Ces catégories se recoupent souvent : une personne peut cumuler plusieurs situations, et leur sévérité varie considérablement d'un individu à l'autre au sein d'une même famille.

### Exemple 2 — Permanent, temporaire, situationnel

```text
Permanent    : une personne aveugle utilise un lecteur d'écran au quotidien.
Temporaire   : un bras dans le plâtre après une fracture, le clavier redevient
               la seule option pendant plusieurs semaines.
Situationnel : un parent tient son enfant d'un bras et navigue d'une seule main ;
               un trajet en train bruyant rend une vidéo inaudible sans sous-titres ;
               le soleil sur l'écran d'un smartphone rend un texte à faible
               contraste illisible.
```

Un clavier utilisable à 100 % ou un contraste suffisant ne servent donc pas qu'aux personnes en situation de handicap permanent : ce sont des exigences qui reviennent, sous une forme ou une autre, pour la quasi-totalité des utilisateurs à un moment ou un autre.

### Exemple 3 — Ce qu'un nom accessible change concrètement

```html
<!-- Nom accessible : "corbeille.svg" ou rien du tout selon le navigateur -->
<button><img src="corbeille.svg" alt=""></button>

<!-- Nom accessible : "Supprimer l'article" -->
<button aria-label="Supprimer l'article">
  <img src="corbeille.svg" alt="" aria-hidden="true">
</button>
```

Un utilisateur de commande vocale qui dit « cliquer sur Supprimer l'article » ne peut activer que le second bouton : la commande vocale s'appuie sur le nom accessible exposé par l'arbre, exactement comme un lecteur d'écran.

### Pièges courants

> **Confondre « accessible » et « pour aveugles ».** L'accessibilité couvre le visuel, l'auditif, le moteur et le cognitif à la fois. Un site entièrement dépendant de la souris exclut aussi bien une personne aveugle qu'une personne avec un tremblement essentiel ou un bras immobilisé.

> **Croire que le rendu visuel garantit l'accessibilité.** Un élément qui « a l'air » d'un bouton (curseur pointeur, couleur, ombre) n'est un bouton pour une technologie d'assistance que s'il en a le rôle dans l'arbre d'accessibilité — pas seulement l'apparence.

> **Ignorer les handicaps temporaires et situationnels dans l'estimation du besoin.** Se limiter aux utilisateurs identifiés comme handicapés dans les tests sous-estime largement le public réellement concerné à un moment ou un autre.

### À retenir

- Quatre grandes familles de situations : visuelle, auditive, motrice, cognitive — chacune permanente, temporaire ou situationnelle.
- Les technologies d'assistance (lecteur d'écran, plage braille, contacteur, commande vocale, agrandisseur) reposent sur des informations exposées par la page, pas sur son rendu visuel.
- L'arbre d'accessibilité (rôle, nom accessible, états) est ce que lit réellement un lecteur d'écran — indépendant du CSS.
- Concevoir pour le handicap permanent profite directement au mobile, au SEO et à l'ergonomie générale.
