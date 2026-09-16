---
id: mises-a-jour
chapitre: pwa
ordre: 2
titre: "Gérer les mises à jour d'une PWA"
termes:
  - terme: SwUpdate
    definition: "Service injectable de `@angular/service-worker` qui expose l'état des mises à jour disponibles (`versionUpdates`, `unrecoverable`) et deux méthodes pour agir (`checkForUpdate()`, `activateUpdate()`)."
  - terme: versionUpdates
    definition: "Observable de `SwUpdate` qui émet un événement à chaque étape du cycle de mise à jour : détection d'une nouvelle version, absence de nouvelle version, version prête, échec d'installation, échec critique."
  - terme: VersionReadyEvent
    definition: "Événement émis par `versionUpdates` (`type: 'VERSION_READY'`) quand une nouvelle version a été téléchargée et validée : elle peut être activée. Expose `currentVersion` et `latestVersion`."
  - terme: checkForUpdate()
    definition: "Méthode de `SwUpdate` qui force une vérification immédiate auprès du serveur. Retourne une `Promise<boolean>` indiquant si une mise à jour a été trouvée."
  - terme: activateUpdate()
    definition: "Méthode de `SwUpdate` qui active la dernière version téléchargée, **sans recharger la page**. Retourne une `Promise<boolean>`. À utiliser avec précaution : sans rechargement explicite ensuite, l'app shell et des ressources chargées à la demande (lazy chunks) peuvent provenir de deux versions différentes."
  - terme: "unrecoverable"
    definition: "Observable de `SwUpdate` qui émet un `UnrecoverableStateEvent` (avec un champ `reason`) quand le service worker se trouve dans un état dont il ne peut pas se sortir seul — typiquement une ressource attendue (un chunk chargé à la demande) qui a disparu du cache du navigateur. Seule solution : recharger complètement la page."
quiz:
  - question: "Pourquoi une PWA reste-t-elle parfois affichée dans une ancienne version, alors que l'API backend a déjà été mise à jour ?"
    choix:
      - "C'est impossible : le service worker recharge toujours la page automatiquement dès qu'une nouvelle version est détectée"
      - "Le service worker sert l'app shell mis en cache tant que rien ne déclenche explicitement son activation puis un rechargement — sans code pour ça, l'utilisateur peut rester indéfiniment sur une ancienne version"
      - "Angular détecte automatiquement le changement de version de l'API et force un rechargement du navigateur"
      - "Ce comportement ne concerne que les `dataGroups`, jamais les fichiers statiques applicatifs"
    reponse: 1
    explication: "Le service worker télécharge une nouvelle version en tâche de fond dès qu'elle est disponible, mais ne l'active pas seul et ne recharge jamais la page tout seul : c'est le rôle explicite du code applicatif, via `SwUpdate`. Sans ce code, l'utilisateur continue à voir l'ancienne version tant qu'il ne ferme pas complètement tous les onglets de l'application."
  - question: "Que produit ce code, une fois qu'une nouvelle version est prête ?"
    code: |
      this.swUpdate.versionUpdates
        .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
        .subscribe(() => {
          this.swUpdate.activateUpdate();
        });
    choix:
      - "La nouvelle version est activée et la page se recharge automatiquement avec le nouveau contenu"
      - "La nouvelle version est activée côté service worker, mais la page affichée continue d'exécuter l'ancien code JavaScript en mémoire jusqu'à un rechargement explicite — risque de mélange de versions entre l'app shell et des chunks chargés ensuite"
      - "`activateUpdate()` échoue systématiquement si on ne l'appelle pas dans un `try/catch`"
      - "Rien ne se passe : `activateUpdate()` nécessite obligatoirement une confirmation de l'utilisateur au préalable"
    reponse: 1
    explication: "`activateUpdate()` fait basculer le service worker sur la nouvelle version, mais ne recharge pas la page tout seul. Sans un `document.location.reload()` explicite après l'activation, l'onglet ouvert continue d'exécuter le JavaScript déjà chargé en mémoire — et un chargement différé ultérieur (`@defer`, route lazy) risque de récupérer un chunk de la nouvelle version incompatible avec l'app shell de l'ancienne."
  - question: "Un `UnrecoverableStateEvent` est émis avec `reason` mentionnant un chunk JavaScript introuvable en cache. Quelle est la réponse appropriée ?"
    choix:
      - "Ignorer l'événement : le service worker se corrige toujours automatiquement au prochain cycle"
      - "Appeler `checkForUpdate()` en boucle jusqu'à ce que l'erreur disparaisse"
      - "Informer l'utilisateur qu'un rechargement complet est nécessaire, puis recharger la page : cet état signifie que le service worker ne peut plus servir l'application de façon cohérente depuis son cache actuel"
      - "Désinstaller le service worker en supprimant `ngsw-config.json` du serveur"
    reponse: 2
    explication: "`unrecoverable` signale une situation où le cache du service worker est devenu incohérent avec ce que l'application shell attend (souvent parce que le navigateur a lui-même évincé une ressource en cache). Il n'y a pas de retour en arrière possible en JavaScript : seule une page rechargée depuis zéro peut retrouver un état cohérent. Retirer `ngsw-config.json` du serveur ne corrige rien immédiatement pour l'utilisateur déjà bloqué."
---

## Essentiel

Un service worker télécharge une nouvelle version de l'application **en tâche de fond**, sans jamais l'imposer de lui-même : sans code applicatif dédié, un utilisateur peut rester sur une ancienne version indéfiniment, tant qu'il garde un onglet ouvert ou revient régulièrement avant que le cycle naturel ne rafraîchisse tout. Le service `SwUpdate` (de `@angular/service-worker`) donne accès à ce cycle.

```ts
import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MiseAJourService {
  private swUpdate = inject(SwUpdate);

  constructor() {
    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        if (confirm('Une nouvelle version du catalogue est disponible. Recharger maintenant ?')) {
          document.location.reload();
        }
      });
  }
}
```

`activateUpdate()` bascule le service worker sur la nouvelle version **sans recharger la page** — le code JavaScript déjà en mémoire dans l'onglet reste l'ancien. Sans rechargement explicite ensuite, un chargement différé ultérieur (route lazy, `@defer`) peut récupérer un fragment de la nouvelle version incompatible avec l'app shell encore ancienne. **Proposer** la mise à jour à l'utilisateur (une bannière, une confirmation) reste préférable à l'imposer brutalement en pleine saisie d'un formulaire de commande.

## Détail

### Le cycle des événements de `versionUpdates`

| Événement (`type`) | Signification |
|---|---|
| `VERSION_DETECTED` | Une nouvelle version a été repérée sur le serveur, téléchargement en cours |
| `NO_NEW_VERSION_DETECTED` | La vérification a eu lieu, aucune nouvelle version |
| `VERSION_READY` | La nouvelle version est téléchargée et prête à être activée |
| `VERSION_INSTALLATION_FAILED` | Le téléchargement/l'installation a échoué |
| `VERSION_FAILED` | Échec critique sur cette version |

Seul `VERSION_READY` justifie de proposer une activation à l'utilisateur ; les autres servent surtout au diagnostic (logs).

### Exemple 1 — Vérifier manuellement les mises à jour

```ts
async verifierMaintenant(): Promise<void> {
  try {
    const miseAJourTrouvee = await this.swUpdate.checkForUpdate();
    console.log(miseAJourTrouvee ? 'Nouvelle version en cours de téléchargement' : 'Déjà à jour');
  } catch (erreur) {
    console.error('Échec de la vérification de mise à jour', erreur);
  }
}
```

`checkForUpdate()` déclenche une requête vers le serveur pour comparer le manifeste courant à celui déployé. Il ne fait que **lancer** la vérification : le résultat (nouvelle version trouvée ou non) arrive ensuite via `versionUpdates`, pas dans la valeur retournée par la promesse elle-même au-delà d'un simple booléen de confirmation.

### Exemple 2 — Vérifier périodiquement, sans retarder le démarrage

```ts
import { ApplicationRef, Injectable, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { concat, first, interval } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VerificationPeriodiqueService {
  private appRef = inject(ApplicationRef);
  private swUpdate = inject(SwUpdate);

  demarrer(): void {
    const appStable$ = this.appRef.isStable.pipe(first((stable) => stable));
    const toutesLesSixHeures$ = interval(6 * 60 * 60 * 1000);

    concat(appStable$, toutesLesSixHeures$).subscribe(() => {
      this.swUpdate.checkForUpdate().catch((erreur) => console.error(erreur));
    });
  }
}
```

Il est important d'attendre que l'application soit **stable** (`ApplicationRef.isStable`) avant de démarrer un polling : vérifier trop tôt retarde l'enregistrement du service worker lui-même et la stabilisation initiale de l'application.

### Exemple 3 — Gérer un état irrécupérable

```ts
constructor() {
  this.swUpdate.unrecoverable.subscribe((evenement) => {
    alert(
      `Une erreur empêche de continuer sans recharger :\n${evenement.reason}\n` +
      'La page va se recharger.',
    );
    document.location.reload();
  });
}
```

Ce cas survient typiquement quand le navigateur a lui-même évincé du cache une ressource que l'app shell active attend encore (chunk chargé à la demande jamais redemandé depuis, cache HTTP saturé…). Aucune correction n'est possible en JavaScript : seul un rechargement complet permet de repartir sur une base cohérente.

### Désactiver proprement le service worker

Supprimer `provideServiceWorker(...)` du code et redéployer **ne désinstalle rien** chez les utilisateurs qui ont déjà un service worker actif dans leur navigateur : il continue de tourner et de servir l'ancienne application depuis son cache. La méthode documentée consiste à renommer ou supprimer le fichier `ngsw.json` généré : à sa prochaine vérification, le service worker reçoit un `404` sur ce fichier, comprend qu'il doit s'auto-détruire, vide tous ses caches et se désenregistre lui-même. En dernier recours (si l'URL du script du service worker doit changer complètement), Angular fournit un `safety-worker.js` à servir explicitement à l'ancienne URL, le temps que tous les clients l'aient récupéré.

### Pièges courants

> **API mise à jour, front toujours en cache.** Déployer une nouvelle version de l'API sans que le front vérifie/active une nouvelle version applicative peut casser des contrats (nouveaux champs attendus, endpoint renommé). La vérification de version front et le versionnement de l'API doivent être pensés ensemble, pas supposer que l'un suit l'autre.

> **`activateUpdate()` sans rechargement.** Basculer la version active sans recharger la page laisse cohabiter, dans le même onglet, l'app shell de l'ancienne version et des ressources chargées à la demande depuis la nouvelle — source de bugs difficiles à reproduire (« ça marche si je recharge »).

> **Forcer la mise à jour en pleine saisie utilisateur.** Recharger la page sans prévenir pendant qu'un client remplit un formulaire de commande fait perdre sa saisie. Proposer plutôt une notification discrète, et laisser l'utilisateur choisir le moment.

### À retenir

- `SwUpdate.versionUpdates` est un flux d'événements (`VERSION_DETECTED`, `VERSION_READY`, `VERSION_INSTALLATION_FAILED`…), à filtrer sur `VERSION_READY` pour agir.
- `checkForUpdate()` déclenche une vérification ; `activateUpdate()` bascule la version, **sans recharger** — le rechargement (`document.location.reload()`) reste à la charge du code applicatif.
- Proposer la mise à jour (bannière, confirmation) plutôt que l'imposer en pleine saisie.
- `unrecoverable` signale un cache incohérent : la seule réponse est un rechargement complet, après avoir prévenu l'utilisateur.
- Supprimer/renommer `ngsw.json` déclenche l'auto-désinstallation du service worker chez les clients existants ; `safety-worker.js` sert de filet en dernier recours.
