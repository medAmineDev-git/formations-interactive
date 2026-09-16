---
id: deploiement-ci
chapitre: build-deploiement
ordre: 3
titre: "Déployer et automatiser"
termes:
  - terme: "Réécriture d'URL vers index.html"
    definition: "Règle configurée sur le serveur ou le CDN qui répond avec `index.html` pour toute URL sans fichier correspondant sur le disque. Indispensable dès qu'une application utilise le routeur Angular : sans elle, rafraîchir la page sur `/produits/42` renvoie une 404, car ce chemin n'existe que côté client."
  - terme: "--base-href"
    definition: "Option de `ng build` qui fixe la valeur de la balise `<base href>` dans `index.html`. Le routeur et le chargement des ressources s'appuient sur cette base : elle doit correspondre exactement au chemin sous lequel l'application est réellement servie quand elle n'est pas à la racine du domaine (ex. `/boutique-admin/`)."
  - terme: "En-tête Cache-Control"
    definition: "En-tête HTTP qui indique au navigateur (et aux caches intermédiaires, CDN compris) combien de temps garder une ressource sans la revalider. Les fichiers empreints (`main-4F2K9X1A.js`) supportent un cache très long (`immutable`) ; `index.html`, jamais empreint, doit rester non caché ou revalidé à chaque requête."
  - terme: "Pipeline d'intégration continue (CI)"
    definition: "Suite d'étapes automatisées, déclenchées à chaque changement de code (ou à intervalles réguliers), qui installe les dépendances, vérifie le code, exécute les tests, construit l'application, puis la déploie — dans cet ordre, chaque étape ne s'exécutant que si la précédente réussit."
  - terme: "ng update"
    definition: "Commande du CLI Angular qui met à jour les paquets d'un workspace et exécute les migrations automatiques (schematics) associées à la nouvelle version. Une montée de version majeure se fait **une version à la fois** (jamais en sautant une version majeure), en suivant le guide de mise à jour officiel."
  - terme: "Déploiement SSR"
    definition: "Contrairement à une application purement statique, une application avec rendu côté serveur nécessite d'exécuter le code produit sous `server/` (ex. `server.mjs`) dans un **processus Node** actif en permanence — typiquement packagé dans un conteneur — plutôt que de simplement copier des fichiers sur un hébergeur statique."
  - terme: "Hébergement statique"
    definition: "Service qui sert des fichiers tels quels (HTML, JS, CSS, images) sans exécuter de code serveur — suffisant pour une application Angular sans SSR, dont tout le rendu se fait dans le navigateur. Un CDN place en plus des copies de ces fichiers géographiquement proches des utilisateurs."
quiz:
  - question: "Une application Angular avec routeur est déployée sur un hébergeur de fichiers statiques, sans configuration particulière. Que se passe-t-il quand un utilisateur rafraîchit la page sur `/produits/42` ?"
    choix:
      - "Le routeur Angular intercepte le rafraîchissement et affiche la bonne page, comme lors d'une navigation interne"
      - "Le serveur cherche un fichier ou dossier `produits/42` sur le disque, ne le trouve pas, et renvoie une erreur 404 — le routeur Angular n'a pas encore eu l'occasion de s'exécuter"
      - "Le navigateur redirige automatiquement vers `/`"
      - "Angular détecte l'absence de fichier et régénère `index.html` à la volée"
    reponse: 1
    explication: "`/produits/42` n'existe que dans le routeur côté client : côté serveur, aucun fichier ni dossier de ce nom n'existe réellement. Sans règle de réécriture qui renvoie `index.html` pour toute URL inconnue, le serveur répond par une 404 avant même que le JavaScript d'Angular (et donc son routeur) ait pu s'exécuter."
  - question: "Pourquoi peut-on mettre `main-4F2K9X1A.js` en cache très longtemps (`Cache-Control: max-age=31536000, immutable`), mais pas `index.html` ?"
    choix:
      - "Parce que index.html est toujours plus volumineux que main-4F2K9X1A.js"
      - "Parce que le nom du fichier empreint change dès que son contenu change (nouvelle empreinte à chaque build) ; index.html, lui, garde toujours le même nom mais référence les fichiers empreints du dernier build, donc doit être revalidé pour pointer vers la bonne version"
      - "Parce que les navigateurs interdisent la mise en cache des fichiers .html"
      - "Il n'y a en réalité aucune différence à faire, les deux peuvent être cachés de façon identique"
    reponse: 1
    explication: "Un fichier empreint est immuable par construction : si son contenu change, son nom change aussi, donc un cache long ne sert jamais une version périmée sous ce nom. `index.html` garde un nom fixe mais son contenu (les références aux fichiers empreints) change à chaque déploiement : le mettre en cache longtemps ferait charger d'anciens bundles, potentiellement supprimés du serveur."
  - question: "Dans un pipeline d'intégration continue, pourquoi place-t-on généralement la vérification du format/lint avant l'exécution des tests, elle-même avant le build ?"
    choix:
      - "Pour échouer le plus tôt possible sur les étapes les moins coûteuses, avant de lancer des étapes plus longues sur du code qui présente déjà un problème trivial"
      - "Parce que ng build a besoin des résultats des tests pour fonctionner techniquement"
      - "L'ordre des étapes n'a aucune importance, c'est une simple convention sans justification"
      - "Parce que le lint modifie le code source, et les tests doivent porter sur la version corrigée"
    reponse: 0
    explication: "Un pipeline ordonne ses étapes par coût croissant : un problème de format ou de lint se détecte en quelques secondes, alors qu'un build complet peut prendre plusieurs minutes. Échouer sur l'étape la moins chère en premier évite de gaspiller du temps de CI sur un problème qui aurait pu être détecté immédiatement, et garantit qu'un artefact n'est construit que si les vérifications de base sont déjà passées."
---

## Essentiel

Une application Angular **sans SSR** se déploie comme n'importe quel site statique : copier le contenu de `dist/<projet>/browser` sur un **hébergeur de fichiers** ou un **CDN**. Deux points spécifiques à une application avec routeur :

- si elle n'est pas servie à la racine du domaine, reconstruire avec `ng build --base-href /chemin/` pour que la balise `<base>` et les URL générées correspondent réellement à l'emplacement de déploiement ;
- configurer une **réécriture d'URL vers `index.html`** côté serveur (ou CDN) pour toute URL sans fichier correspondant : sans elle, rafraîchir la page sur une route profonde (`/produits/42`) renvoie une 404, le routeur Angular n'ayant pas encore eu l'occasion de s'exécuter côté client.

Pour le cache HTTP, les fichiers empreints (`main-4F2K9X1A.js`) supportent un `Cache-Control` très long (`immutable`) puisqu'un contenu modifié change de nom ; `index.html`, à nom fixe mais contenu changeant à chaque déploiement, doit rester non caché ou revalidé systématiquement.

Une application **SSR** ne se limite pas à des fichiers statiques : le dossier `server/` produit par le build (ex. `server.mjs`) doit tourner comme un **processus Node** actif en permanence, le plus souvent packagé dans un conteneur.

Un **pipeline d'intégration continue** type enchaîne : installer les dépendances, vérifier le format/lint, tester, construire, déployer — chaque étape ne se lançant que si la précédente réussit. Pour monter de version, `ng update @angular/cli@21 @angular/core@21` applique les migrations automatiques associées, une version majeure à la fois.

## Détail

### Exemple 1 — Réécriture d'URL avec nginx

```nginx
server {
  listen 80;
  root /var/www/boutique-admin/browser;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

`try_files` cherche d'abord un fichier réel (`$uri`), puis un dossier (`$uri/`), et retombe sur `index.html` si rien ne correspond — laissant le routeur Angular prendre le relais côté client pour interpréter `/produits/42`.

### Exemple 2 — En-têtes de cache différenciés

```nginx
location ~* \.(js|css)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}

location = /index.html {
  add_header Cache-Control "no-cache";
}
```

Les fichiers empreints obtiennent le cache le plus agressif possible ; `index.html` reste toujours revalidé, pour ne jamais servir une page qui référence des bundles supprimés d'un déploiement précédent.

### Exemple 3 — Dockerfile pour une application SSR

```dockerfile
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/dist/boutique-admin/server ./server
COPY --from=build /app/dist/boutique-admin/browser ./browser
EXPOSE 4000
CMD ["node", "server/server.mjs"]
```

Le build (étape `build`) produit `dist/boutique-admin/{browser,server}` ; l'image finale n'embarque que le résultat, exécuté par `node server/server.mjs` — un processus qui doit rester actif, contrairement au simple dépôt de fichiers d'un déploiement statique.

### Exemple 4 — Pipeline CI type

```yaml
# .gitlab-ci.yml (extrait)
stages: [installer, verifier, tester, construire, deployer]

installer:
  stage: installer
  script: npm ci

verifier:
  stage: verifier
  script: npx prettier --check . && npx eslint .

tester:
  stage: tester
  script: npm test -- --watch=false

construire:
  stage: construire
  script: ng build --configuration production

deployer:
  stage: deployer
  script: ./deploy.sh dist/boutique-admin/browser
  only: [main]
```

L'étape `deployer` est restreinte à la branche principale (`only: [main]`) : construire et tester se font sur toute branche, mais publier ne se fait que depuis une source de vérité unique.

### Exemple 5 — Monter de version avec `ng update`

```bash
ng update @angular/cli@21 @angular/core@21
```

`ng update` applique les migrations automatiques (schematics) associées à la version cible — par exemple, en v21, la migration vers le mode zoneless par défaut ou la conversion de `*ngIf`/`*ngFor` vers `@if`/`@for` si elle n'a pas déjà été faite. Un saut de plusieurs versions majeures (ex. v18 → v21 directement) n'est pas recommandé : mettre à jour une version majeure à la fois, en suivant le guide de mise à jour officiel entre chaque étape.

### Statique contre SSR : ce qui change au déploiement

| | Application statique | Application SSR |
|---|---|---|
| Artefact | `dist/<projet>/browser` (fichiers) | `dist/<projet>/{browser,server}` |
| Exécution | Aucun processus, fichiers servis tels quels | Processus Node actif en permanence |
| Hébergement typique | Hébergeur de fichiers, CDN | Conteneur, plateforme supportant Node |
| Repli routeur | Réécriture d'URL vers `index.html` | Géré par le serveur Node lui-même |

### Pièges courants

> **Oublier la réécriture d'URL et ne le remarquer qu'en production.** En développement, `ng serve` gère cette réécriture automatiquement : le problème n'apparaît qu'au premier déploiement, quand un utilisateur rafraîchit une page ou partage un lien profond. Toujours vérifier explicitement la configuration du serveur cible, elle n'est jamais automatique en dehors du CLI.

> **Mettre `index.html` en cache long comme les autres fichiers.** Un `Cache-Control` agressif appliqué par erreur à `index.html` (par une règle trop générale sur `*.html` ou par défaut d'un CDN) fait qu'un utilisateur peut continuer à charger une ancienne version de l'application, référençant des bundles empreints déjà supprimés du serveur — souvent visible en production sous forme d'erreurs 404 sur des fichiers JS après un déploiement.

> **Sauter des versions majeures avec `ng update`.** Passer directement d'Angular 18 à Angular 21 sans étapes intermédiaires prive des migrations automatiques prévues pour chaque version et peut casser silencieusement des fonctionnalités dépréciées entre-temps. Mettre à jour version majeure par version majeure, en lisant les notes de version à chaque étape.

### À retenir

- Une application avec routeur exige une **réécriture d'URL vers `index.html`** côté serveur — sinon, 404 au rafraîchissement d'une route profonde.
- `--base-href` doit correspondre exactement au chemin réel de déploiement quand l'application n'est pas à la racine du domaine.
- Cache long (`immutable`) pour les fichiers empreints, cache court ou absent pour `index.html` — inverser les deux casse le déploiement.
- Une application SSR se déploie comme un **processus Node** actif (souvent en conteneur), pas comme un simple dépôt de fichiers statiques.
- Un pipeline CI type : installer, vérifier, tester, construire, déployer — dans cet ordre, pour échouer vite et ne déployer qu'un artefact testé. `ng update` monte de version une version majeure à la fois.
