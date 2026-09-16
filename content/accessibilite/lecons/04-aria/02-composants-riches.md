---
id: composants-riches
chapitre: aria
ordre: 2
titre: "Les motifs de composants (APG)"
termes:
  - terme: APG (ARIA Authoring Practices Guide)
    definition: "Guide pratique non normatif du W3C (`w3.org/WAI/ARIA/apg/`), qui décrit des **motifs de conception** (*design patterns*) pour les composants d'interface courants : rôles à utiliser, états à maintenir, et interactions clavier attendues. C'est la référence à jour pour construire un composant riche, désormais recommandée par le document *Using ARIA* lui-même."
  - terme: Motif (design pattern)
    definition: "Dans l'APG, association d'un rôle ARIA, des états qui l'accompagnent et d'un jeu précis de touches clavier attendues pour un type de composant (onglets, boîte de dialogue, accordéon…). Suivre le motif, pas seulement le rôle, est ce qui rend le composant réellement utilisable."
  - terme: Piège du focus (focus trap)
    definition: "Dans une boîte de dialogue modale, mécanisme qui confine la tabulation à l'intérieur du dialogue : `Tab` depuis le dernier élément focalisable revient au premier, et `Shift+Tab` depuis le premier revient au dernier. Sans lui, la tabulation s'échappe vers un contenu masqué visuellement mais toujours présent dans le DOM."
  - terme: aria-modal
    definition: "Posé à `true` sur l'élément `role=\"dialog\"` d'une boîte modale. Signale aux technologies d'assistance que le reste de la page est inerte pendant que le dialogue est ouvert."
  - terme: aria-selected
    definition: "État booléen posé sur chaque élément `role=\"tab\"` d'une liste d'onglets, indiquant lequel est actif. Un seul `tab` à `true` à la fois dans un `tablist`."
  - terme: aria-expanded
    definition: "État booléen posé sur l'élément déclencheur (bouton) d'un contenu qui peut être affiché ou masqué : `true` quand le contenu est visible, `false` sinon. Utilisé par les accordéons, menus déroulants, et divulgations simples."
  - terme: aria-controls
    definition: "Référence l'id de l'élément dont le déclencheur contrôle la visibilité ou le contenu (le panneau d'un onglet, le contenu d'un accordéon). Utile pour établir la relation, même si son support par les lecteurs d'écran reste inégal — ne remplace pas un lien visuel/structurel clair."
quiz:
  - question: "Un développeur ouvre une boîte de dialogue modale mais ne déplace pas le focus dedans. Quel est le problème concret pour un utilisateur au clavier ?"
    choix:
      - "Aucun : le focus n'a d'importance que pour la souris"
      - "Le focus reste sur l'élément qui a ouvert le dialogue (ou pire, en haut de la page) : l'utilisateur continue à tabuler dans une page qu'il ne voit plus derrière la modale, sans savoir qu'un dialogue s'est ouvert"
      - "Le navigateur ferme automatiquement le dialogue au bout de 5 secondes"
      - "Le dialogue devient invisible pour les lecteurs d'écran"
    reponse: 1
    explication: "Rien n'est automatique : ouvrir visuellement un dialogue ne déplace pas le focus. Sans ce déplacement explicite au premier élément focalisable (ou à un élément statique du contenu), un utilisateur au clavier ou au lecteur d'écran ne sait même pas que le contenu de la page a changé."
  - question: "Dans le motif Tabs de l'APG, que fait la touche Tab (et non les flèches) une fois le focus posé sur un onglet actif ?"
    choix:
      - "Elle passe à l'onglet suivant, comme la flèche droite"
      - "Elle sort de la liste d'onglets et déplace le focus vers le panneau associé (ou l'élément focalisable suivant de la page)"
      - "Elle active l'onglet suivant sans déplacer le focus"
      - "Elle ferme la liste d'onglets"
    reponse: 1
    explication: "Dans les onglets, la navigation entre onglets se fait avec les flèches, pas avec Tab — c'est le principe du roving tabindex : seul l'onglet actif est dans l'ordre de tabulation (`tabindex=\"0\"`), les autres sont à `tabindex=\"-1\"`. Tab quitte donc la liste elle-même."
  - question: "Que doit valoir `aria-expanded` sur le bouton d'un panneau d'accordéon fermé ?"
    code: |
      <button aria-controls="panneau-livraison">
        Frais de livraison
      </button>
      <div id="panneau-livraison" hidden>…</div>
    choix:
      - "Il ne faut rien ajouter : `hidden` suffit à indiquer l'état"
      - "aria-expanded=\"false\""
      - "aria-expanded=\"true\""
      - "aria-hidden=\"true\" sur le bouton"
    reponse: 1
    explication: "Le motif *Disclosure* de l'APG attend `aria-expanded` sur le déclencheur : `false` quand le contenu est masqué, `true` quand il est visible, à synchroniser en JavaScript avec l'attribut `hidden`. Sans lui, un lecteur d'écran ne sait pas si le panneau est ouvert ou fermé."
---

## Essentiel

Un **motif APG** (ARIA Authoring Practices Guide, `w3.org/WAI/ARIA/apg/`) décrit trois choses ensemble pour un type de composant : le **rôle** à poser, les **états** à maintenir à jour, et les **touches clavier** attendues. Suivre uniquement le rôle sans le reste du motif donne un composant qui « sonne juste » au lecteur d'écran mais reste inutilisable au clavier.

**Boîte de dialogue modale** (`role="dialog"`, `aria-modal="true"`) : à l'ouverture, le focus part explicitement à l'intérieur du dialogue (premier élément focalisable, ou élément statique pour du contenu long) ; `Tab`/`Shift+Tab` restent piégés à l'intérieur (*focus trap*) ; `Échap` ferme le dialogue ; à la fermeture, le focus **revient** à l'élément qui l'avait ouvert.

**Onglets** (`tablist` / `tab` / `tabpanel`) : les flèches gauche/droite déplacent le focus entre onglets, `aria-selected` marque l'onglet actif, `aria-controls` relie chaque `tab` à son `tabpanel`.

**Accordéon / divulgation** (*disclosure*) : un simple `<button aria-expanded="…">` contrôle un panneau, `aria-expanded` bascule entre `true`/`false`.

```html
<button aria-expanded="false" aria-controls="panneau-avis">
  Avis clients (128)
</button>
<div id="panneau-avis" hidden>…</div>
```

Pour des motifs réputés difficiles — **combobox**, **menu**, **grille** — les pièges clavier sont nombreux (gestion de la frappe, des touches d'édition, du focus roving à deux dimensions). Mieux vaut partir d'une librairie de composants déjà auditée que réimplémenter le motif complet soi-même.

## Détail

### Pourquoi c'est utile

Sans motif de référence, chaque équipe invente son propre jeu de touches pour un même type de composant : une modale qui ne se ferme pas avec Échap, des onglets où Tab saute d'un onglet à l'autre au lieu des flèches. L'APG fixe un comportement attendu et testé, partagé par tous les lecteurs d'écran majeurs.

### Exemple 1 — Boîte de dialogue modale, HTML et JavaScript

```html
<button id="ouvrir-modale">Voir la fiche produit</button>

<div id="modale" role="dialog" aria-modal="true" aria-labelledby="titre-modale" hidden>
  <h2 id="titre-modale">Chaise de bureau — Référence CB-204</h2>
  <p>…</p>
  <button id="fermer-modale">Fermer</button>
</div>
```

```javascript
const ouvrirBtn = document.getElementById('ouvrir-modale');
const modale = document.getElementById('modale');
const fermerBtn = document.getElementById('fermer-modale');
let declencheur = null;

function ouvrirModale() {
  declencheur = document.activeElement; // pour restituer le focus à la fermeture
  modale.hidden = false;
  fermerBtn.focus(); // focus initial à l'intérieur du dialogue
  document.addEventListener('keydown', gererTouches);
}

function fermerModale() {
  modale.hidden = true;
  document.removeEventListener('keydown', gererTouches);
  declencheur?.focus(); // retour du focus à l'ouvreur
}

function gererTouches(e) {
  if (e.key === 'Escape') fermerModale();
  if (e.key === 'Tab') piegerFocus(e); // confine Tab/Shift+Tab dans la modale
}

function piegerFocus(e) {
  const focalisables = modale.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
  const premier = focalisables[0];
  const dernier = focalisables[focalisables.length - 1];
  if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
  else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
}

ouvrirBtn.addEventListener('click', ouvrirModale);
fermerBtn.addEventListener('click', fermerModale);
```

Quatre points non négociables du motif : focus initial déplacé à l'ouverture, `Tab`/`Shift+Tab` piégés, `Échap` ferme, focus restitué à l'ouvreur à la fermeture.

### Exemple 2 — Onglets, roving tabindex et flèches

```html
<div role="tablist" aria-label="Informations produit">
  <button role="tab" id="tab-desc" aria-selected="true" aria-controls="panel-desc" tabindex="0">Description</button>
  <button role="tab" id="tab-livraison" aria-selected="false" aria-controls="panel-livraison" tabindex="-1">Livraison</button>
  <button role="tab" id="tab-avis" aria-selected="false" aria-controls="panel-avis" tabindex="-1">Avis</button>
</div>
<div role="tabpanel" id="panel-desc" aria-labelledby="tab-desc">…</div>
<div role="tabpanel" id="panel-livraison" aria-labelledby="tab-livraison" hidden>…</div>
<div role="tabpanel" id="panel-avis" aria-labelledby="tab-avis" hidden>…</div>
```

```javascript
const onglets = [...document.querySelectorAll('[role="tab"]')];

onglets.forEach((onglet, index) => {
  onglet.addEventListener('click', () => activerOnglet(onglet));
  onglet.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') deplacerFocus(index + 1);
    if (e.key === 'ArrowLeft') deplacerFocus(index - 1);
    if (e.key === 'Home') deplacerFocus(0);
    if (e.key === 'End') deplacerFocus(onglets.length - 1);
  });
});

function deplacerFocus(index) {
  const i = (index + onglets.length) % onglets.length;
  activerOnglet(onglets[i]); // activation "automatique" au focus
  onglets[i].focus();
}

function activerOnglet(onglet) {
  onglets.forEach((o) => {
    const actif = o === onglet;
    o.setAttribute('aria-selected', String(actif));
    o.tabIndex = actif ? 0 : -1; // roving tabindex : un seul onglet dans l'ordre de tabulation
    document.getElementById(o.getAttribute('aria-controls')).hidden = !actif;
  });
}
```

Seul l'onglet actif a `tabindex="0"` : `Tab` entre et sort de la liste en une seule étape, la navigation *entre* onglets se fait aux flèches. C'est le **roving tabindex**, à la base de tous les motifs composites de l'APG (onglets, menu, grille).

### Exemple 3 — Accordéon (divulgation)

```html
<h3>
  <button aria-expanded="false" aria-controls="panneau-retours">
    Politique de retours
  </button>
</h3>
<div id="panneau-retours" hidden>
  <p>Retours gratuits sous 30 jours.</p>
</div>
```

```javascript
document.querySelectorAll('[aria-expanded]').forEach((bouton) => {
  bouton.addEventListener('click', () => {
    const ouvert = bouton.getAttribute('aria-expanded') === 'true';
    bouton.setAttribute('aria-expanded', String(!ouvert));
    document.getElementById(bouton.getAttribute('aria-controls')).hidden = ouvert;
  });
});
```

Un `<button>` natif gère déjà Entrée et Espace : il ne reste qu'à synchroniser `aria-expanded` avec l'attribut `hidden` du panneau à chaque clic ou activation clavier.

### Tableau récapitulatif

| Motif | Rôles clés | États clés | Touches attendues |
|---|---|---|---|
| Dialogue modal | `dialog` | `aria-modal="true"` | Tab/Shift+Tab piégés, Échap ferme |
| Onglets | `tablist`, `tab`, `tabpanel` | `aria-selected`, `aria-controls` | Flèches gauche/droite (ou haut/bas si vertical), Home, End ; Tab sort de la liste |
| Accordéon / divulgation | `button` (natif) | `aria-expanded`, `aria-controls` (optionnel) | Entrée, Espace |

### Motifs réputés difficiles

**Combobox**, **menu** et **grille** combinent plusieurs mécanismes à la fois : roving tabindex en deux dimensions pour une grille, gestion de la frappe au clavier pour filtrer une combobox, sous-menus et touches d'échappement multiples pour un menu. Les erreurs y sont fréquentes même chez des équipes expérimentées. Sur ces motifs, partir d'une librairie de composants déjà auditée (Radix, React Aria, Headless UI côté web components/frameworks, ou un design system interne déjà validé) est presque toujours préférable à une réimplémentation complète du motif APG depuis zéro.

### Pièges courants

> **Modale sans piège du focus.** Le dialogue s'ouvre visuellement, mais `Tab` continue de circuler dans le reste de la page, masquée derrière un overlay. Un utilisateur au clavier tabule dans du contenu invisible sans le savoir.

> **Onglets navigables uniquement à la souris.** Le clic fonctionne, mais aucune gestion des flèches n'est câblée : au clavier, `Tab` doit alors passer par chaque onglet un par un, ce qui n'est pas le comportement attendu du motif et ralentit fortement la navigation.

> **`aria-expanded` posé une fois puis jamais mis à jour.** Le bouton reste à `aria-expanded="false"` alors que le panneau est visible, parce que seul l'attribut `hidden` a été basculé côté JavaScript. Les deux doivent changer ensemble à chaque interaction.

### À retenir

- Un motif APG, c'est rôle **+** états **+** clavier : les trois ensemble, pas seulement le rôle.
- Modale : focus initial dans le dialogue, piège du focus, Échap ferme, retour du focus à l'ouvreur.
- Onglets : flèches pour naviguer entre onglets (roving tabindex), Tab pour sortir de la liste, `aria-selected` marque l'actif.
- Accordéon : un `<button aria-expanded>` suffit, en réutilisant Entrée/Espace natifs du bouton.
- Sur les motifs complexes (combobox, menu, grille), préférer une librairie éprouvée à une réimplémentation maison.
