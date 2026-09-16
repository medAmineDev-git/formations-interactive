---
id: service-worker
chapitre: pwa
ordre: 1
titre: "Le service worker Angular"
termes:
  - terme: Service worker
    definition: "Script exécuté par le navigateur **en dehors** de la page, capable d'intercepter toutes les requêtes réseau qu'elle émet. Il a son propre cycle de vie (`install`, `activate`, `fetch`) et survit à la fermeture d'un onglet — c'est lui qui rend le cache hors-ligne possible. Nécessite HTTPS, sauf sur `localhost`."
  - terme: "ngsw-worker.js"
    definition: "Service worker générique fourni par `@angular/service-worker` et généré au build. Il lit `ngsw.json` (le manifeste compilé à partir de `ngsw-config.json`) pour savoir quoi mettre en cache et comment."
  - terme: "ngsw-config.json"
    definition: "Fichier de configuration, écrit à la main, qui décrit la stratégie de cache de l'application : `assetGroups` pour les fichiers statiques, `dataGroups` pour les appels réseau (API)."
  - terme: assetGroups
    definition: "Groupes de ressources statiques (JS, CSS, images, polices…) dans `ngsw-config.json`, chacun avec un `installMode` (`prefetch` ou `lazy`) et un `updateMode`."
  - terme: dataGroups
    definition: "Groupes d'URLs d'API dans `ngsw-config.json`, avec une stratégie de cache (`freshness` ou `performance`) distincte de celle des fichiers statiques, car une réponse d'API change plus souvent qu'un bundle JS versionné."
  - terme: "provideServiceWorker()"
    definition: "Fonction de `@angular/service-worker` à ajouter aux providers de l'application pour enregistrer `ngsw-worker.js`. Accepte une option `enabled` (à mettre à `!isDevMode()`, jamais actif en développement) et `registrationStrategy` (moment d'enregistrement du service worker)."
quiz:
  - question: "Une équipe développe en local avec `ng serve` et ne comprend pas pourquoi le service worker ne s'active jamais, malgré `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() })`. Quelle est la cause la plus probable ?"
    choix:
      - "`ng serve` sert l'application en mode développement : `isDevMode()` vaut `true`, donc `enabled` vaut `false` — c'est le comportement voulu"
      - "Le service worker Angular ne fonctionne que sur `ng build --configuration=production`, jamais avec un serveur HTTP quelconque"
      - "`ngsw-config.json` est manquant"
      - "`provideServiceWorker` doit être appelé dans `main.ts` et non dans la configuration de l'application"
    reponse: 0
    explication: "`enabled: !isDevMode()` désactive volontairement le service worker en développement : c'est la configuration recommandée, pour éviter de déboguer une application à travers un cache agressif. Pour le tester, il faut construire l'application (`ng build`) puis la servir avec un serveur HTTP statique — `ng serve` seul ne suffit pas, mais ce n'est pas non plus l'unique méthode de test."
  - question: "Dans ce extrait de `ngsw-config.json`, que signifie `installMode: \"lazy\"` pour ce groupe de ressources ?"
    code: |
      {
        "assetGroups": [
          {
            "name": "images-catalogue",
            "installMode": "lazy",
            "resources": { "files": ["/assets/produits/**"] }
          }
        ]
      }
    choix:
      - "Ces images sont téléchargées et mises en cache dès l'installation du service worker, avant même la première visite d'une page produit"
      - "Ces images ne sont mises en cache qu'au moment où elles sont effectivement demandées par la page, pas à l'installation"
      - "Ces images ne sont jamais mises en cache, quoi qu'il arrive"
      - "`lazy` retarde l'installation du service worker lui-même de 30 secondes"
    reponse: 1
    explication: "`installMode: \"prefetch\"` (utilisé pour le cœur de l'application, l'app shell) télécharge tout dès l'installation. `installMode: \"lazy\"` attend la première requête réelle vers la ressource pour la mettre en cache — adapté à des images de catalogue nombreuses et coûteuses à précharger en bloc."
  - question: "Quelle stratégie choisir pour un `dataGroup` qui interroge `/api/stock/:produitId`, une donnée qui change plusieurs fois par jour ?"
    choix:
      - "`strategy: \"performance\"` (réponse du cache servie en priorité, réseau en secours)"
      - "`strategy: \"freshness\"` (réseau interrogé en priorité, avec un `timeout` avant repli sur le cache)"
      - "Ne pas déclarer de `dataGroup` : le service worker met automatiquement en cache toutes les requêtes vers `/api/**`"
      - "`installMode: \"prefetch\"`, comme pour les fichiers statiques"
    reponse: 1
    explication: "`freshness` interroge d'abord le réseau et ne retombe sur la réponse en cache qu'en cas d'échec ou de dépassement du `timeout` configuré — adapté à une donnée volatile comme un stock. `performance` (le défaut) sert d'abord le cache, ce qui convient à une donnée stable mais afficherait un stock périmé ici. `installMode`/`updateMode` n'existent que pour les `assetGroups`, pas les `dataGroups`."
---

## Essentiel

Un **service worker** est un script que le navigateur exécute à part de la page, capable d'intercepter chaque requête réseau qu'elle émet. Contrairement au code de l'application, il continue de tourner même onglet fermé, et sert de **proxy** entre l'application et le réseau : c'est ce qui permet de répondre depuis un cache quand le réseau est absent. Il a un cycle de vie propre (`install` → `activate` → `fetch`) et exige **HTTPS**, sauf en local (`localhost` est une exception explicite du navigateur).

`ng add @angular/pwa` installe et configure tout le nécessaire : ajout de la dépendance `@angular/service-worker`, enregistrement via `provideServiceWorker('ngsw-worker.js', ...)` dans les providers, modification de `index.html` (lien vers `manifest.webmanifest`, balise `theme-color`), icônes par défaut, et création d'un `ngsw-config.json` de base.

```ts
// app.config.ts
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
```

`enabled: !isDevMode()` est essentiel : un service worker actif en développement complique le débogage (cache masquant les changements de code). `ngsw-config.json` décrit ensuite **quoi** mettre en cache : `assetGroups` pour les fichiers statiques du build, `dataGroups` pour les appels d'API.

## Détail

### Comment ça marche

Le fichier `ngsw-config.json`, écrit à la main, est compilé au build en `ngsw.json` : un manifeste listant chaque fichier avec un hash de son contenu. C'est ce manifeste que `ngsw-worker.js` (le service worker générique fourni par Angular) télécharge et compare à ce qu'il a déjà en cache, pour savoir ce qui a changé.

### Exemple 1 — `assetGroups` : l'app shell et le reste

```json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"]
      }
    },
    {
      "name": "images-catalogue",
      "installMode": "lazy",
      "updateMode": "lazy",
      "resources": {
        "files": ["/assets/produits/**"]
      }
    }
  ]
}
```

Le groupe `app` (le cœur applicatif : JS, CSS, `index.html`) utilise `prefetch` : tout est téléchargé dès l'installation du service worker, pour que l'application démarre hors-ligne dès la deuxième visite. Le groupe `images-catalogue` utilise `lazy` : chaque image n'est mise en cache qu'à sa première demande réelle — inutile de précharger des milliers de photos produit jamais consultées. `updateMode` suit la même logique pour les mises à jour : `prefetch` retélécharge tout le groupe dès qu'une nouvelle version est détectée, `lazy` attend la prochaine demande.

### Exemple 2 — `dataGroups` : mettre en cache une API

```json
{
  "dataGroups": [
    {
      "name": "api-catalogue",
      "urls": ["/api/produits/**"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 100,
        "maxAge": "1d"
      }
    },
    {
      "name": "api-stock",
      "urls": ["/api/stock/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 50,
        "maxAge": "1h",
        "timeout": "3s"
      }
    }
  ]
}
```

`api-catalogue` (fiches produit, peu volatiles) utilise `performance` : la réponse en cache est servie en priorité, le réseau ne sert qu'à rafraîchir en arrière-plan — l'affichage est instantané, y compris hors-ligne. `api-stock` (donnée qui change souvent) utilise `freshness` : le réseau est interrogé en premier, et le service worker ne retombe sur le cache qu'après un échec ou un dépassement du `timeout` — pour ne jamais afficher un stock trop périmé sans raison.

### `assetGroups` contre `dataGroups`

| | `assetGroups` | `dataGroups` |
|---|---|---|
| Cible | Fichiers du build (JS, CSS, images, polices) | Requêtes vers une API |
| Options clés | `installMode`, `updateMode` | `strategy`, `maxAge`, `maxSize`, `timeout` |
| Fraîcheur | Basée sur le hash de contenu (fichier versionné) | Basée sur une durée (`maxAge`) et une stratégie explicite |
| Stratégie par défaut | — | `performance` (cache d'abord) |

### Ce qu'il ne faut pas mettre en cache

- Les réponses contenant des **données personnelles ou sensibles** d'un autre utilisateur que celui déjà connecté (le cache du service worker est local au navigateur, mais rien ne garantit qu'un autre code de la page n'y accède pas).
- Les endpoints d'**authentification** ou tout ce qui doit refléter un état serveur strictement à jour (solde, disponibilité de paiement).
- Des URLs paramétrées par un jeton ou un identifiant de session dans le chemin, qui rendraient le cache inutile (chaque URL est une clé de cache différente) tout en gonflant sa taille.
- Des ressources déjà très volumineuses et rarement réutilisées (vidéos, exports) : mieux vaut les laisser au réseau ou au cache HTTP classique plutôt qu'alourdir le cache applicatif.

### Déboguer un service worker

Chrome DevTools, onglet **Application** → **Service Workers**, affiche l'état d'enregistrement, permet d'arrêter/relancer le worker et de forcer une vérification de mise à jour ; l'onglet **Cache Storage** montre le contenu exact des caches (un clic droit → actualiser est parfois nécessaire pour voir l'état courant). Le service worker Angular expose aussi une page de diagnostic à l'URL `/ngsw/state` : version du driver, état (`NORMAL`, `EXISTING_CLIENTS_ONLY`, `SAFE_MODE`), hash du manifeste actif, date de la dernière vérification de mise à jour, clients actifs, et logs de debug.

### Pièges courants

> **Garder DevTools ouvert en pensant observer un comportement réaliste.** L'onglet Application maintient le service worker actif en continu, ce qui peut masquer des comportements que verrait un utilisateur normal (arrêt du worker entre deux visites, par exemple). Tester aussi DevTools fermé.

> **Oublier que `ng serve` seul ne teste rien.** Le service worker est désactivé par défaut hors production (`enabled: !isDevMode()`). Pour le tester réellement, construire l'application (`ng build`) et la servir avec un serveur HTTP statique.

> **Confondre `dataGroups` et `assetGroups`.** `installMode`/`updateMode` n'ont de sens que pour des fichiers statiques versionnés au build ; une API se configure avec `strategy`, `maxAge`, `maxSize`, `timeout` dans un `dataGroup`.

### À retenir

- Un service worker intercepte le réseau, en dehors de la page, et exige HTTPS (sauf `localhost`).
- `ng add @angular/pwa` génère `provideServiceWorker(...)`, `ngsw-config.json` et le manifest de base.
- `enabled: !isDevMode()` : le service worker ne doit jamais gêner le développement.
- `assetGroups` (fichiers, `installMode`/`updateMode` `prefetch`/`lazy`) et `dataGroups` (API, `strategy` `performance`/`freshness`, `maxAge`, `maxSize`, `timeout`) répondent à deux besoins différents.
- `/ngsw/state` et l'onglet DevTools Application → Service Workers sont les deux outils de diagnostic de base.
