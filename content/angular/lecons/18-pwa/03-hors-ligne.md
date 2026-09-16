---
id: hors-ligne
chapitre: pwa
ordre: 3
titre: "Fonctionner hors-ligne"
termes:
  - terme: "navigator.onLine"
    definition: "Propriété du navigateur qui indique si une interface réseau est active. Elle ne garantit pas qu'un serveur précis est réellement joignable (faux positif classique : connecté à un Wi-Fi sans accès Internet réel, portail captif). À compléter par la détection des échecs de requêtes réelles."
  - terme: IndexedDB
    definition: "Base de données du navigateur, asynchrone, orientée objets, avec une capacité largement supérieure à `localStorage`. Adaptée pour stocker un volume de données structurées à consulter hors-ligne, comme un catalogue produits."
  - terme: "File d'actions en attente"
    definition: "Liste d'actions effectuées hors-ligne (ajout au panier, modification), stockée localement et **rejouée** vers le serveur au retour du réseau. Nécessite de gérer les conflits (la donnée a changé côté serveur entre-temps)."
  - terme: "manifest.webmanifest"
    definition: "Fichier JSON décrivant l'application installable : nom, icônes, couleur de thème, et surtout `display` (`standalone`, `fullscreen`, `minimal-ui`, `browser`), qui détermine si l'app s'ouvre comme une application autonome ou dans un onglet de navigateur classique."
  - terme: "beforeinstallprompt"
    definition: "Événement du navigateur (non standardisé sur toutes les plateformes) permettant de proposer un bouton d'installation personnalisé au lieu de la bannière automatique. Absent sur Safari/iOS, qui n'offre que l'installation manuelle via le menu de partage."
quiz:
  - question: "Une page produit n'a jamais été visitée par l'utilisateur, et le réseau est coupé. Que se passe-t-il en ouvrant son URL directement ?"
    choix:
      - "La page s'affiche normalement : le service worker devine son contenu à partir des autres fiches produit déjà en cache"
      - "La page échoue : ni l'app shell (si le fichier de route n'a jamais été chargé), ni la réponse d'API associée ne sont en cache, faute d'avoir déjà été demandées au moins une fois en ligne"
      - "Angular génère automatiquement une version hors-ligne de toutes les routes au premier build"
      - "Le navigateur redirige systématiquement vers la page d'accueil"
    reponse: 1
    explication: "Le hors-ligne d'une PWA n'est pas magique : seules les ressources déjà demandées au moins une fois (et couvertes par un `assetGroup`/`dataGroup`) sont disponibles sans réseau. Une fiche produit jamais consultée, dont la réponse d'API n'a jamais été mise en cache, ne peut pas s'afficher hors-ligne — au mieux un message d'erreur clair vaut mieux qu'un écran vide."
  - question: "Pourquoi ne pas se fier uniquement à `navigator.onLine` pour décider d'envoyer une requête ?"
    choix:
      - "Elle n'existe pas dans les navigateurs modernes"
      - "Elle ne reflète que l'état de l'interface réseau du système, pas la joignabilité réelle du serveur : un Wi-Fi connecté mais sans accès Internet (portail captif, panne du fournisseur) la laisse à `true`"
      - "Elle nécessite une autorisation explicite de l'utilisateur, comme la géolocalisation"
      - "Elle ne fonctionne que dans un service worker, jamais dans le code d'un composant"
    reponse: 1
    explication: "`navigator.onLine` indique seulement qu'une interface réseau est active, pas que le serveur cible répond. Une application robuste combine cette information avec la gestion réelle des échecs de requêtes (timeout, erreur réseau) plutôt que de s'y fier aveuglément pour décider d'agir."
  - question: "Un utilisateur ajoute un produit au panier hors-ligne, stocké dans une file d'actions en attente. Au retour du réseau, la synchronisation échoue car le produit a été retiré du catalogue entre-temps. Quelle est la bonne approche ?"
    choix:
      - "Ignorer silencieusement l'échec : l'utilisateur ne doit jamais être interrompu par un problème technique"
      - "Réessayer indéfiniment la même requête jusqu'à ce qu'elle réussisse"
      - "Détecter l'échec de synchronisation, informer l'utilisateur du conflit (produit indisponible) et lui proposer une action (retirer l'article, en choisir un autre) plutôt que de faire comme si la synchronisation avait réussi"
      - "Annuler automatiquement toute la commande sans explication"
    reponse: 2
    explication: "Une file d'actions différées introduit nécessairement des conflits possibles : l'état a pu changer côté serveur pendant la coupure. La bonne pratique est de détecter l'échec, l'expliquer clairement à l'utilisateur et lui laisser une décision, plutôt que d'ignorer le problème ou d'agir à sa place sans prévenir."
---

## Essentiel

Le hors-ligne d'une PWA n'est jamais « tout ou rien » : seules les ressources **déjà demandées au moins une fois** en ligne — et couvertes par un `assetGroup` ou un `dataGroup` du service worker — restent disponibles sans réseau. Une fiche produit jamais consultée ne peut pas apparaître par magie. Il faut donc distinguer ce que l'utilisateur peut raisonnablement faire hors-ligne (consulter un catalogue déjà chargé, revoir son panier) de ce qui reste impossible (une recherche jamais faite, un paiement).

`navigator.onLine` donne un premier signal, mais imparfait : il reflète l'état de l'interface réseau du système, pas la joignabilité réelle d'un serveur (un Wi-Fi connecté à un portail captif reste `true`).

```ts
import { signal } from '@angular/core';

const enLigne = signal(navigator.onLine);

window.addEventListener('online', () => enLigne.set(true));
window.addEventListener('offline', () => enLigne.set(false));
```

Pour stocker des données consultables hors-ligne, `localStorage` convient à de petites préférences (synchrone, quelques Ko, chaînes uniquement), tandis qu'**IndexedDB** convient à un volume plus important de données structurées — comme un catalogue produits entier. Une **file d'actions en attente** permet d'enregistrer localement ce que l'utilisateur fait hors-ligne (ajout au panier) pour le rejouer au retour du réseau, en acceptant qu'un **conflit** soit possible (le produit n'existe plus).

## Détail

### Ce qui est réellement possible hors-ligne, et ce qui ne l'est pas

| Possible hors-ligne | Pas possible hors-ligne |
|---|---|
| Consulter une page déjà visitée (app shell en cache) | Visiter une page/route jamais chargée auparavant |
| Afficher des données d'API déjà mises en cache (`dataGroup`) | Obtenir une donnée réellement à jour (stock, prix) |
| Ajouter un produit au panier localement | Confirmer une commande (nécessite le serveur) |
| Consulter le contenu d'IndexedDB | Un paiement, une authentification initiale |

### Exemple 1 — Persister le catalogue dans IndexedDB pour la consultation hors-ligne

```ts
@Injectable({ providedIn: 'root' })
export class CatalogueHorsLigneService {
  private nomBase = 'boutique-catalogue';

  async enregistrerProduits(produits: Produit[]): Promise<void> {
    const bd = await this.ouvrirBase();
    const transaction = bd.transaction('produits', 'readwrite');
    const magasin = transaction.objectStore('produits');
    for (const produit of produits) {
      magasin.put(produit);
    }
  }

  async lireProduitsEnCache(): Promise<Produit[]> {
    const bd = await this.ouvrirBase();
    return new Promise((resoudre, rejeter) => {
      const requete = bd.transaction('produits', 'readonly').objectStore('produits').getAll();
      requete.onsuccess = () => resoudre(requete.result);
      requete.onerror = () => rejeter(requete.error);
    });
  }

  private ouvrirBase(): Promise<IDBDatabase> {
    return new Promise((resoudre, rejeter) => {
      const requete = indexedDB.open(this.nomBase, 1);
      requete.onupgradeneeded = () => {
        requete.result.createObjectStore('produits', { keyPath: 'id' });
      };
      requete.onsuccess = () => resoudre(requete.result);
      requete.onerror = () => rejeter(requete.error);
    });
  }
}
```

IndexedDB est une API bas niveau et verbeuse ; ce service isole cette complexité derrière deux méthodes simples, utilisables par le reste de l'application indépendamment de l'implémentation. `localStorage` aurait pu suffire pour une poignée de préférences, mais pas pour un catalogue de plusieurs centaines de fiches produit.

### Exemple 2 — File d'actions différées

```ts
interface ActionEnAttente {
  id: string;
  type: 'ajouter-panier';
  produitId: string;
  quantite: number;
  horodatage: number;
}

@Injectable({ providedIn: 'root' })
export class FileActionsService {
  private enAttente = signal<ActionEnAttente[]>(this.lireDepuisStockage());

  ajouter(action: ActionEnAttente): void {
    this.enAttente.update((liste) => [...liste, action]);
    this.sauvegarder();
  }

  async synchroniser(http: HttpClient): Promise<void> {
    for (const action of this.enAttente()) {
      try {
        await firstValueFrom(http.post('/api/panier', action));
        this.retirer(action.id);
      } catch (erreur) {
        // Conflit possible (produit retiré, stock épuisé...) : ne pas retirer
        // l'action et laisser l'interface informer l'utilisateur.
        console.error(`Échec de synchronisation pour ${action.produitId}`, erreur);
      }
    }
  }

  private retirer(id: string): void {
    this.enAttente.update((liste) => liste.filter((a) => a.id !== id));
    this.sauvegarder();
  }

  private sauvegarder(): void {
    localStorage.setItem('actions-en-attente', JSON.stringify(this.enAttente()));
  }

  private lireDepuisStockage(): ActionEnAttente[] {
    const brut = localStorage.getItem('actions-en-attente');
    return brut ? JSON.parse(brut) : [];
  }
}
```

Une action qui échoue reste dans la file plutôt que d'être perdue silencieusement : à l'interface de traduire cet échec en message compréhensible pour l'utilisateur (« ce produit n'est plus disponible, le retirer du panier ? »), sans jamais faire disparaître un article sans explication.

### Exemple 3 — `manifest.webmanifest` et installation

```json
{
  "name": "Boutique — Catalogue",
  "short_name": "Boutique",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1a1a2e",
  "background_color": "#ffffff",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

`display: "standalone"` fait apparaître l'application sans la barre d'adresse du navigateur, comme une application native. Sur Chrome/Edge (desktop et Android), le navigateur propose une bannière d'installation automatique quand certains critères sont réunis (manifest valide, icônes, service worker enregistré, HTTPS) ; l'événement `beforeinstallprompt` permet de remplacer cette bannière par un bouton « Installer » personnalisé, affiché au moment choisi par l'application.

### Pièges courants

> **Traiter `navigator.onLine` comme une vérité absolue.** Un appareil connecté à un réseau local sans accès Internet réel (portail captif, coupure côté fournisseur) reste `onLine === true`. Combiner cette information avec la détection réelle d'échecs de requêtes plutôt que de s'y fier seule.

> **Stocker des données sensibles dans `localStorage` sans réflexion.** `localStorage` n'est pas chiffré et reste accessible à n'importe quel script exécuté dans la page (y compris via une faille XSS). Ne jamais y stocker un jeton d'authentification sensible sans en mesurer le risque, et préférer des mécanismes prévus pour ça.

> **Oublier les particularités d'iOS/Safari.** Pas d'événement `beforeinstallprompt` : l'installation ne se fait que manuellement via le menu de partage (« Sur l'écran d'accueil »). Le stockage (IndexedDB, `localStorage`) peut être évincé après une période d'inactivité sous les politiques de limitation de suivi de Safari — ne pas considérer les données hors-ligne comme définitivement acquises sur cette plateforme.

### À retenir

- Le hors-ligne ne couvre que ce qui a **déjà** été chargé en ligne au moins une fois ; il ne devine rien.
- `navigator.onLine` est un indice, pas une preuve de joignabilité réelle du serveur.
- `localStorage` pour de petites préférences non sensibles ; **IndexedDB** pour un volume de données structurées comme un catalogue.
- Une file d'actions en attente doit prévoir l'échec et le **conflit** (donnée changée côté serveur), jamais supposer que la synchronisation réussira toujours.
- `manifest.webmanifest` (icônes, `display`) rend l'application installable, mais son comportement diffère nettement entre plateformes — en particulier iOS, qui ignore `beforeinstallprompt` et limite la persistance du stockage. Les **notifications push** ajoutent une couche de complexité supplémentaire (Push API, clés VAPID, infrastructure serveur dédiée) qui dépasse le seul service worker Angular.
