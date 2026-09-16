---
id: structure-semantique
chapitre: html-semantique
ordre: 1
titre: "Structurer une page"
termes:
  - terme: "lang"
    definition: "Attribut posé sur `<html>` (`<html lang=\"fr\">`) qui déclare la langue principale de la page. Un lecteur d'écran s'en sert pour choisir la voix et la prononciation de synthèse vocale correctes. Un passage substantiel dans une autre langue se marque localement avec `lang` sur l'élément qui le contient."
  - terme: Hiérarchie des titres
    definition: "Suite de `<h1>` à `<h6>` qui reflète le plan logique de la page : un seul `<h1>` par page, aucun niveau sauté en descendant (`<h2>` puis `<h3>`, jamais `<h2>` puis `<h4>` directement). C'est l'un des principaux outils de navigation rapide d'un utilisateur de lecteur d'écran."
  - terme: Repère (landmark)
    definition: "Région de page qu'une technologie d'assistance peut lister et rejoindre directement, sans parcourir tout le contenu intermédiaire. Les éléments HTML `<header>`, `<nav>`, `<main>`, `<aside>` et `<footer>` créent chacun un repère, à condition de respecter certaines règles de position (voir Détail)."
  - terme: Rôle implicite
    definition: "Rôle ARIA qu'un élément HTML porte nativement, sans attribut `role`. `<nav>` a le rôle implicite *navigation*, `<main>` a le rôle *main*, etc. Utiliser l'élément natif suffit : ajouter le `role` correspondant en plus est inutile."
  - terme: "`<th scope>`"
    definition: "Cellule d'en-tête de tableau de données. L'attribut `scope=\"col\"` ou `scope=\"row\"` précise si l'en-tête s'applique à toute la colonne ou à toute la ligne, ce qui permet à un lecteur d'écran d'annoncer l'en-tête correspondant quand l'utilisateur se déplace de cellule en cellule."
  - terme: "`<caption>`"
    definition: "Titre d'un tableau de données, placé juste après la balise `<table>` ouvrante. Il est annoncé automatiquement par un lecteur d'écran quand l'utilisateur entre dans le tableau, avant même la première cellule."
  - terme: "`<figure>` / `<figcaption>`"
    definition: "`<figure>` regroupe un contenu autonome (image, graphique, extrait de code…) et sa légende `<figcaption>`. Le lien entre les deux est structurel : pas besoin d'`aria-describedby` pour l'établir."
quiz:
  - question: "Que produit ce balisage pour un lecteur d'écran qui liste les titres de la page ?"
    code: |
      <h1>Fiche produit</h1>
      <h2>Description</h2>
      <h4>Caractéristiques techniques</h4>
      <h2>Avis clients</h2>
    choix:
      - "Rien d'anormal : les niveaux de titre n'ont qu'un rôle visuel"
      - "Un plan à trois niveaux cohérent, car l'ordre d'apparition dans le code suffit à structurer la page"
      - "Un saut de niveau entre « Description » (h2) et « Caractéristiques techniques » (h4) : la structure logique de la page est rompue, même si l'affichage visuel peut sembler correct"
      - "Une erreur qui empêche la page de s'afficher"
    reponse: 2
    explication: "Les niveaux de titre forment un plan que les lecteurs d'écran exposent sous forme de liste navigable. Passer de h2 à h4 sans h3 casse ce plan : un utilisateur qui navigue par titres peut croire qu'il manque une section, ou ne pas comprendre le rattachement de « Caractéristiques techniques ». Le niveau doit refléter la hiérarchie logique, pas seulement la taille visuelle souhaitée (qui se règle en CSS)."
  - question: "Ce `<footer>` obtient-il le rôle implicite *contentinfo* (pied de page global du site) ?"
    code: |
      <body>
        <header>...</header>
        <main>
          <article>
            <h1>Robot pâtissier XR200</h1>
            <p>...</p>
            <footer>Publié le 12 mars — 4 avis</footer>
          </article>
        </main>
        <footer>© 2026 — Mentions légales</footer>
      </body>
    choix:
      - "Les deux `<footer>` obtiennent le rôle *contentinfo*, car c'est le rôle implicite de l'élément `<footer>` dans tous les cas"
      - "Seul le `<footer>` de premier niveau, en dehors de tout `<article>`/`<section>`/`<aside>`/`<nav>`/`<main>`, obtient le rôle *contentinfo* ; celui imbriqué dans `<article>` n'est qu'un pied de section, sans rôle de repère global"
      - "Aucun des deux, car `<footer>` n'a jamais de rôle implicite"
      - "Seul le `<footer>` imbriqué dans `<article>` obtient le rôle *contentinfo*, car il est plus proche du contenu"
    reponse: 1
    explication: "Le rôle implicite *contentinfo* ne s'applique qu'au `<footer>` qui n'est pas imbriqué dans un `<article>`, `<aside>`, `<main>`, `<nav>` ou `<section>` : c'est le pied de page du document entier. Le `<footer>` à l'intérieur de l'`<article>` reste un simple pied de section (informations de publication), pas un repère de navigation global — la même règle s'applique à `<header>` et au rôle *banner*."
  - question: "Quel est le principal problème d'accessibilité de ce tableau ?"
    code: |
      <table>
        <tr>
          <td>Taille</td>
          <td>M</td>
          <td>L</td>
        </tr>
        <tr>
          <td>Stock</td>
          <td>12</td>
          <td>3</td>
        </tr>
      </table>
    choix:
      - "Aucun : un lecteur d'écran devine l'en-tête grâce à la position de la cellule dans le tableau"
      - "Aucune cellule n'est un vrai en-tête (`<th>` avec `scope`) : en se déplaçant sur « 3 », un lecteur d'écran ne peut pas annoncer automatiquement qu'il s'agit du stock en taille L"
      - "Le tableau devrait utiliser des `<div>` plutôt que `<table>`, car les tableaux HTML ne sont pas accessibles"
      - "Il manque uniquement un attribut `alt` sur le tableau"
    reponse: 1
    explication: "Avec uniquement des `<td>`, aucune relation formelle n'existe entre une cellule de données et son en-tête de ligne ou de colonne. Remplacer les cellules d'en-tête par `<th scope=\"row\">Taille</th>` / `<th scope=\"row\">Stock</th>` et la première ligne par `<th scope=\"col\">` permet à un lecteur d'écran d'annoncer « Stock, colonne L : 3 » lors du déplacement cellule par cellule. Un tableau `<table>` bien balisé est un outil accessible ; le problème vient du balisage, pas de l'élément lui-même."
---

## Essentiel

Un lecteur d'écran ne « voit » pas une page comme un navigateur l'affiche : il s'appuie sur la **structure** du document pour permettre à l'utilisateur de s'y repérer sans tout lire dans l'ordre. Quatre éléments construisent cette structure.

**La langue** : `<html lang="fr">` doit être posé une fois, sur la racine du document. Sans lui, la synthèse vocale peut prononcer le texte avec les mauvaises règles phonétiques.

**Le titre de page** (`<title>`) doit être unique et pertinent par page : c'est la première chose annoncée à l'arrivée sur une page, et l'onglet ouvert qu'un utilisateur retrouve dans une liste.

**La hiérarchie des titres** (`<h1>` à `<h6>`) forme un plan : un seul `<h1>` par page, aucun niveau sauté. C'est l'un des tout premiers outils de navigation d'un utilisateur de lecteur d'écran, qui peut afficher la liste des titres et sauter directement à celui qui l'intéresse.

**Les repères** (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) découpent la page en régions qu'une technologie d'assistance peut lister et rejoindre directement :

```html
<header>...</header>
<nav aria-label="Principale">...</nav>
<main>
  <h1>Robot pâtissier XR200</h1>
  ...
</main>
<aside>Produits similaires</aside>
<footer>...</footer>
```

Chacun de ces éléments porte un **rôle implicite** (`<nav>` → *navigation*, `<main>` → *main*…) : pas besoin d'ajouter `role="navigation"` par-dessus, c'est redondant.

## Détail

### Pourquoi c'est utile

Un utilisateur voyant balaie une page du regard en quelques secondes pour repérer le menu, le contenu principal, le pied de page. Un utilisateur de lecteur d'écran n'a pas cet aperçu global : sans structure, il doit tout écouter dans l'ordre pour se faire une idée de la page. Titres et repères lui donnent l'équivalent de ce coup d'œil : une liste de sections qu'il peut parcourir et rejoindre directement, au lieu de subir un flux de texte linéaire.

### Exemple 1 — Structure minimale d'une page boutique

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <title>Robot pâtissier XR200 — Boutique Cuisine+</title>
</head>
<body>
  <header>
    <a href="/">Cuisine+</a>
    <nav aria-label="Principale">
      <ul>
        <li><a href="/catalogue">Catalogue</a></li>
        <li><a href="/panier">Panier</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <h1>Robot pâtissier XR200</h1>
    <p>Puissance 1200 W, bol inox 5 L.</p>
  </main>

  <aside aria-label="Produits similaires">...</aside>

  <footer>© 2026 Cuisine+ — <a href="/mentions-legales">Mentions légales</a></footer>
</body>
</html>
```

Un seul `<main>` par page, un seul `<h1>` : c'est le titre de la page elle-même, pas celui d'une section interne. Plusieurs `<nav>` sur une même page (menu principal, fil d'Ariane, pagination) sont possibles, à condition de les distinguer avec un `aria-label` différent, sinon un lecteur d'écran les annonce tous sous le même nom générique « navigation ».

### Exemple 2 — Le piège du `<header>`/`<footer>` imbriqué

```html
<main>
  <article>
    <header>
      <h1>Robot pâtissier XR200</h1>
      <p>Publié le 12 mars 2026</p>
    </header>
    <p>Description du produit...</p>
    <footer>4 avis — Voir les commentaires</footer>
  </article>
</main>
```

Ce `<header>` et ce `<footer>` sont imbriqués dans un `<article>` : ils n'obtiennent **pas** les rôles *banner* et *contentinfo* (réservés au `<header>`/`<footer>` de premier niveau), mais restent des en-têtes et pieds de section ordinaires. C'est un balisage correct — la nuance à connaître est que la position dans le document change le rôle implicite obtenu, pas seulement le nom de la balise.

### Exemple 3 — Tableau de données correctement balisé

```html
<table>
  <caption>Stock disponible par taille</caption>
  <tr>
    <th scope="col">Taille</th>
    <th scope="col">Stock</th>
  </tr>
  <tr>
    <th scope="row">M</th>
    <td>12</td>
  </tr>
  <tr>
    <th scope="row">L</th>
    <td>3</td>
  </tr>
</table>
```

`<caption>` est annoncé à l'entrée dans le tableau. Chaque `<th scope>` permet à un lecteur d'écran d'annoncer l'en-tête de ligne et de colonne à chaque déplacement de cellule (« Taille M, Stock : 12 »). À l'inverse, un tableau utilisé uniquement pour la **mise en forme** visuelle (aligner des blocs sans relation de données) ne doit pas utiliser `<table>` : c'est le rôle du CSS (grid, flexbox).

### Exemple 4 — `<figure>` pour une image et sa légende

```html
<figure>
  <img src="robot-xr200.jpg" alt="Robot pâtissier XR200, coloris inox, bol ouvert" />
  <figcaption>Le XR200 avec son bol inox de 5 litres</figcaption>
</figure>
```

`<figcaption>` associe structurellement la légende à l'image : pas besoin d'`aria-describedby` pour établir ce lien, `<figure>` le fait nativement. Le texte alternatif (`alt`) reste nécessaire par ailleurs : il joue un rôle différent, détaillé dans la leçon suivante.

### Comment vérifier rapidement

- **Le plan des titres** : un panneau dédié dans les outils de développement du navigateur, ou une extension listant les `<h1>`–`<h6>` de la page, permet de voir en quelques secondes si la hiérarchie est cohérente sans lire le code source.
- **Les repères** : le panneau d'accessibilité des outils de développement (arbre d'accessibilité) affiche les rôles réellement obtenus par chaque élément — utile pour vérifier qu'un `<header>` imbriqué n'a pas hérité du rôle *banner* par erreur.
- **La langue** : vérifier `<html lang="...">` directement dans le code source suffit ; c'est une des vérifications les plus rapides et les plus souvent oubliées.

### Pièges courants

> **Plusieurs `<h1>` par page, ou aucun.** Un seul `<h1>` doit correspondre au sujet principal de la page. Un titre de section (« Avis clients », « Produits similaires ») est un `<h2>` ou `<h3>`, jamais un second `<h1>`.

> **Choisir un niveau de titre pour sa taille visuelle plutôt que pour sa place dans le plan.** Si un `<h3>` doit paraître plus petit ou plus grand, c'est une question de CSS, pas de niveau HTML. Sauter un niveau pour obtenir un rendu casse la navigation par titres.

> **Utiliser un `<table>` pour aligner visuellement des blocs sans relation de données.** Un lecteur d'écran annonce alors des informations de navigation de tableau (nombre de lignes, de colonnes) qui n'ont aucun sens pour l'utilisateur, sur un contenu qui n'est pas réellement tabulaire.

### À retenir

- `<html lang="fr">` une fois par page ; `lang` localement pour un passage substantiel dans une autre langue.
- Un seul `<h1>` par page, aucun niveau de titre sauté : c'est un outil de navigation, pas un simple style.
- `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` créent des repères avec un rôle implicite — mais `<header>`/`<footer>` imbriqués dans `<article>`/`<section>` n'obtiennent pas les rôles *banner*/*contentinfo*.
- Un tableau de données a besoin de `<caption>` et de `<th scope>` ; un tableau de mise en forme ne devrait pas exister — c'est le rôle du CSS.
- `<figure>`/`<figcaption>` associe structurellement une légende à son contenu, sans attribut ARIA supplémentaire.
