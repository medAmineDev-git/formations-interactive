---
id: live-regions
chapitre: aria
ordre: 3
titre: "Contenus dynamiques et régions live"
termes:
  - terme: Région live
    definition: "Élément du DOM marqué (via `aria-live` ou un rôle qui l'implique, comme `status` ou `alert`) pour que les technologies d'assistance **surveillent** son contenu et annoncent automatiquement tout changement, sans que l'utilisateur ait à déplacer son focus dessus."
  - terme: aria-live
    definition: "Attribut qui définit le niveau d'urgence des annonces d'une région live. `polite` : attend une pause dans ce que le lecteur d'écran est en train de dire avant d'annoncer. `assertive` : interrompt immédiatement. `off` (valeur par défaut d'un élément quelconque) : aucune annonce."
  - terme: "role=\"status\""
    definition: "Rôle de région live pour une information non urgente. Valeurs **implicites** : `aria-live=\"polite\"` et `aria-atomic=\"true\"`. Cas d'usage typique : nombre de résultats après un filtre, confirmation d'ajout au panier."
  - terme: "role=\"alert\""
    definition: "Rôle de région live pour une information urgente. Valeurs **implicites** : `aria-live=\"assertive\"` et `aria-atomic=\"true\"`. Cas d'usage typique : erreur bloquante de formulaire, échec d'une action critique. À réserver à ce qui exige une interruption immédiate."
  - terme: aria-atomic
    definition: "Booléen qui indique si, lors d'un changement, la technologie d'assistance doit annoncer **tout le contenu** de la région live (`true`) ou seulement la portion modifiée (`false`, comportement par défaut). `true` évite des annonces fragmentées et incompréhensibles."
  - terme: aria-relevant
    definition: "Précise quels types de changements dans une région live déclenchent une annonce : ajouts (`additions`), suppressions (`removals`), changements de texte (`text`), ou une combinaison (`additions text`, valeur par défaut). Peu utilisé en pratique : les valeurs par défaut conviennent à la plupart des cas."
  - terme: aria-busy
    definition: "Signale qu'un élément est en cours de mise à jour et que les changements en cours ne doivent pas encore être annoncés. À poser à `true` pendant un chargement, puis remettre à `false` une fois le contenu final en place — évite une annonce prématurée ou fragmentée pendant que plusieurs éléments changent d'un coup."
quiz:
  - question: "Pourquoi ce code n'annonce-t-il rien au lecteur d'écran, alors que le message apparaît bien visuellement ?"
    code: |
      function afficherConfirmation(texte) {
        const conteneur = document.getElementById('zone-messages');
        const div = document.createElement('div');
        div.setAttribute('aria-live', 'polite');
        div.textContent = texte;
        conteneur.appendChild(div);
      }
    choix:
      - "aria-live=\"polite\" est mal orthographié"
      - "La région live (avec son aria-live) est créée et insérée au même moment que son contenu : elle n'était pas déjà présente dans le DOM avant la mise à jour, donc rien à surveiller n'existait encore"
      - "Il faudrait utiliser aria-live=\"assertive\" à la place"
      - "textContent ne déclenche jamais d'annonce, contrairement à innerHTML"
    reponse: 1
    explication: "Le piège classique des régions live : elles doivent exister dans le DOM avant que leur contenu change, pour que la technologie d'assistance les ait déjà repérées et les surveille. Ici, le `div` avec `aria-live` et son texte apparaissent d'un seul coup — rien ne garantit qu'il soit détecté à temps. La bonne pratique est de créer la région live vide au chargement de la page, et de ne modifier que son contenu texte ensuite."
  - question: "Un formulaire de recherche met à jour un compteur de résultats à chaque frappe dans le champ de filtre. Quel réglage est le plus adapté ?"
    choix:
      - "role=\"alert\" pour être sûr que le compteur soit toujours annoncé"
      - "role=\"status\" (aria-live=\"polite\" implicite), pour ne pas interrompre la frappe en cours"
      - "aria-live=\"assertive\" posé directement, sans rôle"
      - "aria-busy=\"true\" en permanence sur le compteur"
    reponse: 1
    explication: "Une mise à jour fréquente et non urgente (compteur de résultats pendant une frappe) doit rester polie : elle attend une pause avant d'annoncer, sans couper la parole à chaque caractère tapé. `role=\"alert\"` (assertive) doit être réservé à l'urgent — sinon on sur-annonce, et l'expérience devient pénible à l'usage d'un lecteur d'écran."
  - question: "Quelle est la différence de comportement implicite entre role=\"status\" et role=\"alert\" ?"
    choix:
      - "Aucune : les deux rôles sont strictement équivalents"
      - "status implique aria-live=\"polite\", alert implique aria-live=\"assertive\" ; les deux impliquent aria-atomic=\"true\""
      - "status implique aria-live=\"assertive\", alert implique aria-live=\"polite\""
      - "status ne fonctionne qu'avec JavaScript, alert fonctionne aussi en HTML statique"
    reponse: 1
    explication: "status est fait pour l'information non urgente (annonce polie, attend une pause), alert pour l'urgent (annonce assertive, interrompt immédiatement). Les deux rôles impliquent aria-atomic=\"true\" : le contenu entier de la région est annoncé, pas seulement la partie modifiée."
---

## Essentiel

Une page qui change **sans rechargement** (filtre de résultats, panier mis à jour, message d'erreur affiché en JavaScript) est invisible pour un lecteur d'écran tant que rien ne le prévient : l'utilisateur, dont le focus reste ailleurs, ne « voit » aucun changement. Les **régions live** résolvent ce problème : elles marquent une zone du DOM comme surveillée, pour que tout changement de son contenu soit annoncé automatiquement.

`aria-live` fixe le niveau d'urgence : `polite` (attend une pause avant d'annoncer) ou `assertive` (interrompt immédiatement). Deux rôles portent des valeurs implicites toutes prêtes :

```html
<!-- Information non urgente : nombre de résultats, confirmation d'ajout -->
<div role="status">3 produits trouvés</div>

<!-- Information urgente : erreur bloquante -->
<div role="alert">Le paiement a échoué. Réessayez.</div>
```

`role="status"` implique `aria-live="polite"` et `aria-atomic="true"` ; `role="alert"` implique `aria-live="assertive"` et `aria-atomic="true"`. `aria-atomic="true"` fait annoncer **tout** le contenu de la région à chaque changement, pas seulement le fragment modifié.

**Piège classique : la région live doit déjà être présente dans le DOM avant la mise à jour.** Créer un `div[aria-live]` et son texte en même temps, au même appel JavaScript, ne garantit aucune annonce fiable — la technologie d'assistance doit avoir eu le temps de repérer la région avant qu'elle change.

Ne pas sur-annoncer : `assertive` doit rester rare, réservé à l'urgent. Le comportement exact varie d'un lecteur d'écran à l'autre : tester avec au moins un lecteur réel avant de considérer une région live comme fiable.

## Détail

### Pourquoi c'est utile

Une application boutique classique multiplie les mises à jour silencieuses : ajout au panier sans rechargement, compteur d'articles filtrés, validation de formulaire en direct. Sans région live, tout ce feedback n'existe que visuellement — un utilisateur de lecteur d'écran doit deviner qu'un changement a eu lieu et aller le chercher manuellement.

### Exemple 1 — Région live correctement préparée à l'avance

```html
<!-- Présent dans le DOM dès le chargement de la page, vide -->
<div id="statut-panier" role="status" class="visually-hidden"></div>
```

```javascript
function ajouterAuPanier(produit) {
  // … logique d'ajout au panier …
  document.getElementById('statut-panier').textContent =
    `${produit.nom} ajouté au panier.`;
}
```

La région est créée vide au chargement, repérée par la technologie d'assistance, puis seul son **texte** change ensuite. C'est ce qui garantit l'annonce, contrairement à une région créée à la volée en même temps que son contenu.

### Exemple 2 — Nombre de résultats après filtrage

```html
<div id="resultats-filtre" role="status" aria-atomic="true"></div>
<ul id="liste-produits">…</ul>
```

```javascript
function appliquerFiltre(critere) {
  const produits = filtrerProduits(critere);
  afficherProduits(produits);
  document.getElementById('resultats-filtre').textContent =
    `${produits.length} produit${produits.length > 1 ? 's' : ''} trouvé${produits.length > 1 ? 's' : ''}.`;
}
```

`aria-atomic="true"` (déjà implicite avec `role="status"`, répété ici pour la clarté) garantit que la phrase entière est annoncée, même si seul le nombre change d'une frappe à l'autre.

### Exemple 3 — Erreur de formulaire, urgente et ciblée

```html
<form id="form-livraison">
  <label for="code-postal">Code postal</label>
  <input id="code-postal" name="codePostal">
  <div id="erreur-cp" role="alert"></div>
</form>
```

```javascript
document.getElementById('form-livraison').addEventListener('submit', (e) => {
  const champ = document.getElementById('code-postal');
  if (!/^\d{5}$/.test(champ.value)) {
    e.preventDefault();
    document.getElementById('erreur-cp').textContent =
      'Code postal invalide : 5 chiffres attendus.';
    champ.focus();
  }
});
```

`role="alert"` (assertive) est justifié ici : l'erreur bloque la soumission, l'utilisateur doit en être informé sans délai. On déplace en plus le focus sur le champ en erreur — les deux mécanismes se complètent, l'un n'excluant pas l'autre.

### Exemple 4 — Chargement en cours, avec aria-busy

```html
<div id="zone-resultats" aria-busy="false" aria-live="polite">
  <ul id="liste-produits">…</ul>
</div>
```

```javascript
async function rechargerResultats(requete) {
  const zone = document.getElementById('zone-resultats');
  zone.setAttribute('aria-busy', 'true'); // ne pas annoncer pendant la mise à jour
  const produits = await chargerProduits(requete);
  afficherProduits(produits);
  zone.setAttribute('aria-busy', 'false'); // mise à jour terminée, on peut annoncer
}
```

Sans `aria-busy`, plusieurs modifications successives du DOM (vidage de la liste, puis remplissage produit par produit) peuvent déclencher une série d'annonces fragmentées et incompréhensibles.

### Tableau récapitulatif

| Cas d'usage | Rôle / attribut | Urgence |
|---|---|---|
| Confirmation d'ajout au panier | `role="status"` | Polie |
| Nombre de résultats après filtre | `role="status"` + `aria-atomic="true"` | Polie |
| Chargement en cours | `aria-live="polite"` + `aria-busy` | Polie |
| Erreur bloquante de formulaire | `role="alert"` | Assertive |

### Pièges courants

> **Région live créée en même temps que son contenu.** `document.createElement('div')` avec `aria-live` posé puis `textContent` rempli dans la foulée, le tout inséré d'un coup dans le DOM : rien ne garantit l'annonce. La région doit exister, vide, **avant** que son contenu change.

> **Tout mettre en `assertive` « pour être sûr ».** Une région assertive qui s'active à chaque frappe ou à chaque défilement devient vite insupportable à l'usage et pousse certains utilisateurs à couper le son du lecteur d'écran sur la page. `assertive` doit rester l'exception, réservée à ce qui bloque réellement l'utilisateur.

> **Supposer un comportement identique entre lecteurs d'écran.** Le rythme et parfois le contenu exact des annonces varient entre NVDA, JAWS et VoiceOver, en particulier sur les régions live insérées dynamiquement. Une région live qui fonctionne dans un lecteur doit être revérifiée dans au moins un second avant d'être considérée comme fiable.

### À retenir

- Une région live doit être présente et vide dans le DOM **avant** que son contenu change — jamais créée et remplie en même temps.
- `role="status"` (implicite : `aria-live="polite"`, `aria-atomic="true"`) pour l'information non urgente ; `role="alert"` (implicite : `aria-live="assertive"`, `aria-atomic="true"`) pour l'urgent.
- `aria-atomic="true"` annonce tout le contenu de la région, évitant des fragments incompréhensibles.
- `aria-busy` évite d'annoncer un contenu en cours de reconstruction par étapes.
- Le comportement varie d'un lecteur d'écran à l'autre : toujours tester avec un lecteur réel avant de considérer une région live comme fiable.
