---
id: images-alternatives
chapitre: html-semantique
ordre: 2
titre: "Images et alternatives textuelles"
termes:
  - terme: "alt"
    definition: "Attribut de `<img>` qui fournit une **alternative textuelle** à l'image : ce qu'un lecteur d'écran annonce à la place, et ce qui s'affiche si l'image ne charge pas. Son contenu dépend du rôle de l'image (informative, décorative, lien…), pas d'une description générique."
  - terme: Image décorative
    definition: "Image qui n'apporte aucune information utile (illustration purement esthétique, motif de fond, icône redondante avec un texte déjà présent). Elle doit avoir `alt=\"\"` (attribut vide, pas absent) pour qu'un lecteur d'écran l'ignore complètement."
  - terme: Image informative
    definition: "Image qui transmet une information nécessaire à la compréhension du contenu (photo de produit, schéma simple, pictogramme sans texte à côté). Son `alt` doit décrire cette information, pas l'apparence de l'image elle-même."
  - terme: Image-lien
    definition: "Image placée à l'intérieur d'un `<a>` ou d'un `<button>` sans texte visible à côté. Son `alt` doit décrire la **destination ou l'action** du lien, pas le contenu visuel de l'image."
  - terme: Description longue
    definition: "Texte détaillé accompagnant une image complexe (graphique, infographie, plan) dont le sens ne tient pas dans un `alt` court. Placée en texte visible à proximité (ex. sous forme de tableau de données équivalent), l'`alt` de l'image renvoie alors vers ce résumé plutôt que de tout décrire."
  - terme: "aria-hidden"
    definition: "Attribut qui masque un élément aux technologies d'assistance sans le masquer visuellement. Utilisé sur une icône ou un SVG purement décoratif à côté d'un texte déjà visible, pour éviter une annonce redondante."
  - terme: "role=\"img\""
    definition: "Rôle posé sur un `<svg>` pour indiquer qu'il doit être traité comme une image porteuse de sens, associé à un `<title>` interne qui sert d'alternative textuelle (équivalent du `alt` d'un `<img>`)."
quiz:
  - question: "Quel est le problème avec ce balisage ?"
    code: |
      <a href="/panier">
        <img src="icone-panier.svg" alt="icone-panier.svg" />
      </a>
    choix:
      - "Aucun : l'attribut `alt` est présent, c'est suffisant"
      - "L'`alt` répète le nom du fichier plutôt que de décrire la destination du lien ; un lecteur d'écran annonce littéralement « icone-panier point s v g, lien »"
      - "Il manque un `title` en plus de l'`alt`"
      - "L'image devrait être en `<div>` plutôt qu'en `<img>`"
    reponse: 1
    explication: "C'est une image-lien : son `alt` doit décrire où mène le lien (par exemple `alt=\"Panier\"`), pas le fichier. `alt=\"icone-panier.svg\"` est un texte alternatif présent mais inutile, aussi problématique qu'une absence d'attribut — l'utilisateur n'apprend rien sur la destination."
  - question: "Quelle valeur d'`alt` est correcte pour cette photo de fiche produit, sachant que le nom et le prix sont déjà affichés en texte juste à côté ?"
    code: |
      <h1>Robot pâtissier XR200</h1>
      <p>149,99 €</p>
      <img src="xr200.jpg" alt="???" />
    choix:
      - "alt=\"Robot pâtissier XR200, 149,99 euros\" — pour renforcer l'information déjà présente"
      - "alt=\"image.jpg\""
      - "alt=\"Robot pâtissier XR200 vu de face, coloris inox, bol ouvert\" — décrit ce que montre la photo sans répéter le nom et le prix déjà en texte"
      - "Pas d'attribut alt, car l'information est déjà donnée par le titre"
    reponse: 2
    explication: "Le nom et le prix sont déjà du texte accessible : les répéter dans l'`alt` est redondant. En revanche l'image apporte une information que le texte n'a pas : l'aspect visuel du produit (coloris, angle, détail). Un bon `alt` décrit ce que l'image montre de spécifique, sans dupliquer ni ignorer le contexte. Omettre l'attribut `alt` n'est jamais correct pour une image informative : sans lui, certains lecteurs d'écran annoncent le nom du fichier ou le chemin complet de l'URL."
  - question: "Ce SVG utilisé seul comme bouton « fermer » est-il accessible ?"
    code: |
      <button>
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    choix:
      - "Oui : un `<button>` est toujours annoncé comme un bouton, quel que soit son contenu"
      - "Non : le bouton n'a aucun nom accessible — un lecteur d'écran annonce « bouton » sans indiquer son rôle ; il faut ajouter un `aria-label=\"Fermer\"` sur le `<button>` (ou un texte visuellement masqué)"
      - "Non, car les SVG ne peuvent jamais être utilisés dans un bouton"
      - "Oui, à condition d'ajouter `alt=\"fermer\"` sur la balise `<svg>`"
    reponse: 1
    explication: "`<button>` a bien le rôle *button*, mais son **nom accessible** (ce qui est annoncé en plus du rôle) vient de son contenu textuel — inexistant ici, le SVG n'en fournit pas automatiquement. `alt` n'existe pas sur `<svg>` ; la solution est un `aria-label` sur le bouton ou un texte masqué visuellement à l'intérieur. Sans nom, l'utilisateur sait qu'un bouton existe mais pas ce qu'il fait."
---

## Essentiel

L'attribut `alt` d'une `<img>` n'a pas une seule bonne valeur : elle dépend du **rôle** de l'image dans la page.

- **Décorative** (n'apporte rien) → `alt=""` (vide, jamais absent). Un lecteur d'écran l'ignore complètement.
- **Informative** → `alt` décrit ce que l'image apporte, pas son apparence générale ni son nom de fichier.
- **Image-lien** (dans un `<a>` ou un `<button>`, sans texte à côté) → `alt` décrit la **destination ou l'action**, pas le contenu visuel.

```html
<!-- Décorative : un simple filet graphique -->
<img src="separateur.png" alt="" />

<!-- Informative -->
<img src="xr200-detail.jpg" alt="Bol inox amovible du robot pâtissier XR200" />

<!-- Image-lien -->
<a href="/panier">
  <img src="icone-panier.svg" alt="Panier" />
</a>
```

Le piège le plus fréquent : `alt="image"`, `alt="photo produit"` ou l'absence pure et simple de l'attribut. Un `alt` manquant n'est jamais neutre : selon le lecteur d'écran, l'image est soit ignorée silencieusement (perte d'information si elle était utile), soit annoncée par son nom de fichier ou son URL complète — dans les deux cas, une mauvaise expérience.

Pour une icône seule dans un bouton (pas de `<img>`, juste un SVG ou une police d'icônes), c'est le bouton lui-même qui a besoin d'un nom accessible, via `aria-label` ou un texte masqué visuellement — pas un `alt`, qui n'existe pas sur ces éléments.

## Détail

### Comment écrire une bonne alternative

Trois questions à se poser avant d'écrire un `alt` :

1. **Cette image apporte-t-elle une information que le texte environnant n'a pas déjà ?** Si non → décorative, `alt=""`.
2. **Si l'image disparaissait, qu'est-ce que je perdrais ?** La réponse à cette question est le contenu de l'`alt`.
3. **Est-ce un lien ou un bouton ?** Alors l'`alt` décrit la destination ou l'action, jamais l'apparence de l'icône.

### Exemple 1 — Avant / après sur une fiche produit

```html
<!-- Avant : alt absent -->
<img src="xr200.jpg" />

<!-- Avant : alt inutile -->
<img src="xr200.jpg" alt="image du produit" />

<!-- Après : décrit ce que montre l'image, sans répéter le nom déjà en h1 -->
<h1>Robot pâtissier XR200</h1>
<img src="xr200.jpg" alt="Robot pâtissier XR200 vu de trois-quarts, coloris inox" />
```

### Exemple 2 — Image-bouton (icône seule, sans `<img>`)

```html
<!-- Icône SVG en police d'icônes ou SVG inline, sans texte visible -->
<button aria-label="Ajouter au panier">
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <path d="..."/>
  </svg>
</button>
```

`aria-hidden="true"` sur le `<svg>` évite qu'un lecteur d'écran tente de l'annoncer en plus du `aria-label` du bouton, qui porte déjà le nom complet. `focusable="false"` évite qu'un ancien navigateur (Internet Explorer notamment) rende le SVG focusable indépendamment du bouton.

### Exemple 3 — SVG porteur de sens (pas dans un bouton)

```html
<svg role="img" aria-labelledby="titre-logo" viewBox="0 0 100 40">
  <title id="titre-logo">Cuisine+, boutique d'électroménager</title>
  <path d="..."/>
</svg>
```

`role="img"` indique explicitement qu'il faut traiter le SVG comme une image porteuse de sens plutôt que comme un groupe de formes vectorielles ; `<title>` en interne fournit le texte annoncé, l'équivalent d'un `alt`. Un SVG purement décoratif, lui, se masque simplement avec `aria-hidden="true"`.

### Exemple 4 — Image complexe : graphique de répartition des ventes

```html
<figure>
  <img src="repartition-ventes.png"
       alt="Répartition des ventes par catégorie : voir le tableau ci-dessous" />
  <table>
    <caption>Répartition des ventes par catégorie — deuxième trimestre 2026</caption>
    <tr><th scope="col">Catégorie</th><th scope="col">Part</th></tr>
    <tr><th scope="row">Cuisine</th><td>45 %</td></tr>
    <tr><th scope="row">Petit électroménager</th><td>30 %</td></tr>
    <tr><th scope="row">Rangement</th><td>25 %</td></tr>
  </table>
</figure>
```

Un `alt` court ne peut pas transmettre le détail d'un graphique. La solution : un `alt` bref qui renvoie vers une alternative complète affichée à proximité — ici un tableau de données équivalent, mais un paragraphe descriptif convient aussi selon le cas.

### Texte dans une image

Un bandeau promotionnel avec le texte « –20 % ce week-end » intégré à l'image plutôt qu'en HTML pose plusieurs problèmes : le texte n'est pas sélectionnable, ne se redimensionne pas avec les réglages d'affichage de l'utilisateur, et dépend entièrement de la qualité de l'`alt` pour exister pour un lecteur d'écran. À éviter dès que possible : afficher le texte en HTML, par-dessus ou à côté d'une image de fond purement décorative.

### Pièges courants

> **`alt="image"`, `alt="photo"` ou un nom de fichier (`alt="IMG_4021.jpg"`).** Ce sont des alternatives présentes mais sans aucune valeur informative — aussi inutiles qu'une absence d'attribut, en pire : elles donnent l'illusion que l'image a été traitée.

> **Alternative identique au texte déjà affiché juste à côté.** Répéter le nom du produit déjà en `<h1>` dans l'`alt` de sa photo double l'annonce sans rien apporter. Décrire ce que l'image montre de spécifique (angle, détail, contexte) est plus utile.

> **Absence totale de l'attribut `alt`.** À ne jamais confondre avec `alt=""` : un attribut manquant laisse le comportement à la discrétion du lecteur d'écran ou du navigateur (annonce du nom de fichier ou de l'URL dans certains cas), un `alt=""` volontaire dit explicitement « ignore cette image ».

### À retenir

- Le contenu d'un `alt` dépend du rôle de l'image : décorative (`alt=""`), informative (décrit l'information), lien (décrit la destination).
- `alt=""` doit être un choix volontaire pour une image décorative, jamais un oubli.
- Une icône seule dans un `<button>` ou un `<a>` (pas de `<img>`) a besoin d'un `aria-label` ou d'un texte masqué visuellement sur l'élément interactif, pas d'un `alt`.
- Un SVG porteur de sens utilise `role="img"` + `<title>` ; un SVG décoratif se masque avec `aria-hidden="true"`.
- Une image complexe (graphique) a besoin d'une alternative détaillée à proximité, pas seulement d'un `alt` court qui tenterait de tout décrire.
