---
id: environnements
chapitre: build-deploiement
ordre: 2
titre: "Configurer selon l'environnement"
termes:
  - terme: "Configuration (angular.json)"
    definition: "Ensemble nommé d'options de build (`production`, `development`, ou une configuration personnalisée comme `staging`) déclaré sous `configurations` dans une cible de build, et activé avec `--configuration <nom>`."
  - terme: fileReplacements
    definition: "Option d'une configuration qui remplace un fichier TypeScript par un autre **à la compilation** — typiquement `environment.ts` par `environment.staging.ts`. Le fichier remplacé n'existe pas dans le bundle final."
  - terme: "ng generate environments"
    definition: "Schematic qui crée le dossier `src/environments/` (`environment.ts`, `environment.development.ts`) et configure automatiquement le `fileReplacements` correspondant dans `angular.json`. Les fichiers d'environnement ne sont plus générés par défaut par `ng new`."
  - terme: "Configuration chargée à l'exécution"
    definition: "Approche alternative aux `fileReplacements` : un fichier JSON (ex. `config.json`) déployé à côté du build et **chargé par une requête HTTP au démarrage**, avant que l'application ne s'affiche. Un seul build sert alors tous les environnements ; seul ce fichier change entre eux."
  - terme: "isDevMode()"
    definition: "Fonction de `@angular/core` qui indique si l'application tourne en mode développement. Sa valeur reflète automatiquement l'option `optimization` du build utilisé (`false` avec la configuration `production`) — aucun appel à `enableProdMode()` n'est nécessaire."
  - terme: "Secret d'application"
    definition: "Clé d'API privée, mot de passe, jeton d'accès backend… Un fichier `environment.ts` (ou un `config.json` chargé à l'exécution) est **livré au navigateur** et lisible par n'importe qui : il ne doit jamais contenir de secret, seulement des valeurs déjà publiques (URL d'API, indicateurs de fonctionnalité)."
quiz:
  - question: "Avec cette configuration, quelle valeur `apiUrl` se retrouve dans le bundle produit par `ng build --configuration staging` ?"
    code: |
      // angular.json
      "configurations": {
        "staging": {
          "fileReplacements": [
            { "replace": "src/environments/environment.ts", "with": "src/environments/environment.staging.ts" }
          ]
        }
      }

      // environment.ts
      export const environment = { apiUrl: 'https://api.prod.example.com' };

      // environment.staging.ts
      export const environment = { apiUrl: 'https://api.staging.example.com' };
    choix:
      - "https://api.staging.example.com — fileReplacements substitue le fichier entier à la compilation, avant même que le code ne soit empaqueté"
      - "https://api.prod.example.com — fileReplacements ne s'applique qu'au serveur de développement, jamais à ng build"
      - "Les deux valeurs sont incluses dans le bundle, et le choix se fait à l'exécution selon l'URL du navigateur"
      - "Une erreur de compilation, car les deux fichiers exportent la même constante `environment`"
    reponse: 0
    explication: "`fileReplacements` agit à la compilation : le fichier `environment.staging.ts` prend la place d'`environment.ts` avant qu'esbuild ne compile et empaquette le code. Le résultat ne contient que la valeur de staging — l'autre fichier n'est même pas inclus dans le bundle."
  - question: "La même image Docker doit être déployée telle quelle en recette puis en production, sans reconstruction. Quelle approche de configuration choisir ?"
    choix:
      - "fileReplacements, en déclarant une configuration `recette` et une configuration `production` distinctes dans angular.json"
      - "Une configuration chargée à l'exécution (fichier JSON récupéré au démarrage) : un seul build est produit et promu tel quel, seul ce fichier externe change entre les environnements"
      - "environment.ts seul, sans fileReplacements ni chargement à l'exécution, en changeant sa valeur directement dans le code avant chaque déploiement"
      - "Il n'existe aucune solution : Angular impose un build distinct par environnement"
    reponse: 1
    explication: "fileReplacements résout la valeur au moment du build, donc produit un artefact différent par environnement — incompatible avec une même image promue telle quelle. Une configuration chargée à l'exécution (fichier JSON servi à côté du build, lu au démarrage) permet au contraire de ne construire qu'une seule fois et de faire varier uniquement ce fichier externe entre la recette et la production."
  - question: "Que faut-il éviter d'écrire dans `src/environments/environment.ts`, et pourquoi ?"
    choix:
      - "Une URL d'API publique, car elle doit rester secrète à tout prix"
      - "Une clé d'API privée ou un secret backend, car ce fichier est compilé et livré tel quel dans le bundle JavaScript, lisible par n'importe qui ouvrant les outils de développement du navigateur"
      - "Un indicateur de fonctionnalité (feature flag) booléen, interdit dans ce type de fichier"
      - "Rien de particulier : ce fichier n'est jamais envoyé au navigateur"
    reponse: 1
    explication: "Un fichier d'environnement (ou un config.json chargé à l'exécution) fait partie du code livré au client : tout secret qui s'y trouve est visible par quiconque inspecte le bundle ou la requête réseau. Une URL d'API publique ou un feature flag n'ont rien de sensible et y ont parfaitement leur place ; un secret doit rester côté serveur, derrière un proxy ou un gestionnaire de secrets."
---

## Essentiel

Angular propose deux manières de faire varier le comportement d'une application selon l'environnement (développement, recette, production).

**Configurations `angular.json` + `fileReplacements`** — l'approche historique et la plus simple. Le schematic `ng generate environments` crée `src/environments/environment.ts` et `environment.development.ts`, et câble automatiquement le `fileReplacements` correspondant. On peut ajouter d'autres fichiers (`environment.staging.ts`) et déclarer une nouvelle configuration nommée dans `angular.json` :

```json
"configurations": {
  "staging": {
    "fileReplacements": [
      { "replace": "src/environments/environment.ts", "with": "src/environments/environment.staging.ts" }
    ]
  }
}
```

```bash
ng build --configuration staging
```

**Limite importante** : la valeur est figée **au moment du build**. Changer d'environnement veut dire reconstruire — donc un artefact (bundle) différent par environnement. Pour une application déployée telle quelle (même image Docker, même bundle) de la recette à la production, ce n'est pas toujours souhaitable.

**Configuration chargée à l'exécution** — un fichier JSON (`config.json`) déployé à côté du bundle et **récupéré par une requête HTTP au démarrage**, avant l'affichage de l'application. Un seul build sert alors tous les environnements ; seul ce fichier change, généralement injecté par la plateforme de déploiement. C'est l'approche à privilégier quand le même artefact doit être promu d'un environnement à l'autre sans reconstruction.

Dans les deux cas, **jamais de secret** (clé d'API, mot de passe) dans ces fichiers : ils sont livrés au navigateur et lisibles par n'importe qui. `isDevMode()` reste utile pour adapter un comportement au mode développement, sans dépendre d'un fichier d'environnement — sa valeur reflète automatiquement l'option `optimization` du build.

## Détail

### Exemple 1 — Générer et utiliser les fichiers d'environnement

```bash
ng generate environments
```

```ts
// src/environments/environment.ts (utilisé par défaut, y compris en production)
export const environment = {
  production: true,
  apiUrl: 'https://api.boutique.example.com',
};

// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
```

```ts
import { environment } from './environments/environment';

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private apiUrl = environment.apiUrl;
}
```

`ng serve` utilise par défaut la configuration `development` (donc `environment.development.ts`) ; `ng build` seul utilise `production`.

### Exemple 2 — Une configuration personnalisée pour la recette

```json
"configurations": {
  "recette": {
    "fileReplacements": [
      { "replace": "src/environments/environment.ts", "with": "src/environments/environment.recette.ts" }
    ],
    "optimization": true,
    "sourceMap": true
  }
}
```

Une configuration personnalisée peut combiner `fileReplacements` avec d'autres options de build (ici, garder les source maps activées en recette pour faciliter le débogage, contrairement à la production).

### Exemple 3 — Configuration chargée à l'exécution avec `provideAppInitializer`

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAppInitializer(() => {
      const http = inject(HttpClient);
      const config = inject(ConfigService);
      return firstValueFrom(http.get<AppConfig>('/config.json')).then((valeur) => {
        config.definir(valeur);
      });
    }),
  ],
};
```

`provideAppInitializer()` retarde le démarrage de l'application jusqu'à ce que la promesse se résolve : `config.json` est chargé et disponible avant que le premier composant ne s'affiche. Ce fichier est servi à côté du bundle (même dossier statique, ou monté séparément dans le conteneur) et peut différer d'un environnement à l'autre sans reconstruire l'application.

### Comparaison des deux approches

| | `fileReplacements` | Configuration à l'exécution |
|---|---|---|
| Moment de la résolution | À la compilation (`ng build`) | Au démarrage, dans le navigateur |
| Nombre d'artefacts | Un build par environnement | Un seul build pour tous les environnements |
| Simplicité | Très simple, rien à charger en plus | Nécessite une requête au démarrage à gérer |
| Adapté à | Projets avec peu d'environnements, déploiement = build | Même image/artefact promue de la recette à la production |

### Pièges courants

> **Mettre une clé d'API secrète ou un identifiant de connexion backend dans `environment.ts`.** Ce fichier est compilé et livré tel quel dans le bundle JavaScript : ouvrir les outils de développement du navigateur suffit à le lire. Un secret doit rester côté serveur (variable d'environnement du backend, gestionnaire de secrets), jamais dans du code livré au client.

> **Oublier qu'un `fileReplacements` mal renseigné est silencieux.** Une faute de frappe dans le chemin du fichier de remplacement ne provoque pas toujours une erreur explicite selon la configuration : le comportement observé (mauvaise URL d'API en production) peut sembler n'avoir aucune cause évidente. Vérifier le contenu réel du bundle (`--stats-json` ou une simple recherche dans les fichiers de sortie) en cas de doute.

> **Appeler `enableProdMode()` manuellement.** Cette fonction est un vestige des anciennes versions d'Angular : le mode production est désormais déterminé automatiquement par l'option `optimization` de la configuration de build utilisée. `isDevMode()` reflète ce choix sans intervention manuelle.

### À retenir

- `fileReplacements` (via des configurations `angular.json`, câblées par `ng generate environments`) résout la valeur **au moment du build** : un artefact par environnement.
- Une configuration **chargée à l'exécution** (fichier JSON récupéré au démarrage, ex. avec `provideAppInitializer()`) permet de déployer le **même artefact** partout ; seule la configuration externe change.
- Aucune des deux approches n'est un coffre-fort : ni `environment.ts` ni un `config.json` chargé à l'exécution ne doivent contenir de secret, tous deux étant livrés au navigateur.
- `isDevMode()` reflète automatiquement l'option `optimization` du build ; `enableProdMode()` n'a plus lieu d'être appelé manuellement.
- Le choix entre les deux dépend d'une question simple : le pipeline de déploiement reconstruit-il l'application à chaque environnement, ou promeut-il un artefact déjà construit ?
