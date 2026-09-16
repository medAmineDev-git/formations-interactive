---
id: path-files
chapitre: io-fichiers
ordre: 1
titre: "Path et Files"
termes:
  - terme: Path
    definition: "Représentation abstraite d'un chemin (fichier ou répertoire), fournie par `java.nio.file`. Se crée avec `Path.of(...)`, ne touche pas le système de fichiers tant qu'on n'appelle pas une méthode de `Files` dessus."
  - terme: Files
    definition: "Classe utilitaire de `java.nio.file` qui regroupe toutes les opérations sur le système de fichiers (existence, copie, déplacement, suppression, lecture, écriture...) à partir d'un `Path`."
  - terme: resolve
    definition: "Combine un `Path` avec un segment supplémentaire pour construire un chemin enfant (`base.resolve(\"catalogue.csv\")`). Si l'argument est déjà un chemin absolu, il est renvoyé tel quel, sans tenir compte de `base`."
  - terme: relativize
    definition: "Calcule le chemin relatif permettant d'aller d'un `Path` à un autre (`base.relativize(cible)`). L'inverse conceptuel de `resolve`."
  - terme: normalize
    definition: "Simplifie un chemin en supprimant les éléments redondants (`.` et `..`) de façon purement syntaxique, sans consulter le système de fichiers ni résoudre les liens symboliques."
  - terme: Files.walk
    definition: "Parcourt récursivement un répertoire et ses sous-répertoires en renvoyant un `Stream<Path>` paresseux, qui garde un descripteur de répertoire ouvert : il doit impérativement être fermé (try-with-resources)."
  - terme: java.io.File
    definition: "Ancienne API de représentation des chemins (depuis Java 1.0), toujours présente mais dépassée par `java.nio.file` : erreurs silencieuses (booléens au lieu d'exceptions), pas de support des liens symboliques, listage de répertoire non paresseux."
quiz:
  - question: "Que produit ce code si `base` vaut `/data/catalogue` ?"
    code: |
      Path base = Path.of("/data/catalogue");
      Path fichier = Path.of("/export/rapport.csv");
      Path resultat = base.resolve(fichier);
      System.out.println(resultat);
    choix:
      - "`/export/rapport.csv`"
      - "`/data/catalogue/export/rapport.csv`"
      - "Une exception `InvalidPathException` est levée"
      - "`/data/catalogue` (fichier ignoré)"
    reponse: 0
    explication: "`resolve` combine deux chemins, mais si l'argument passé est déjà un chemin **absolu**, il est renvoyé tel quel : `base` est alors ignoré. C'est un piège classique quand on construit dynamiquement des chemins à partir d'entrées utilisateur."
  - question: "Quelle est la principale différence entre `java.io.File` et `java.nio.file.Path`/`Files` ?"
    choix:
      - "`File` ne sert qu'aux fichiers texte, `Path` gère aussi le binaire"
      - "`File` signale la plupart des échecs par une valeur booléenne (`false`) sans détail, `Files` lève des exceptions précises (`NoSuchFileException`, `FileAlreadyExistsException`...)"
      - "`Path` ne peut représenter que des chemins relatifs"
      - "Il n'y a aucune différence fonctionnelle, seulement une différence de nom"
    reponse: 1
    explication: "C'est l'un des principaux reproches faits à `java.io.File` : `delete()` ou `mkdir()` renvoient simplement `false` en cas d'échec, sans dire pourquoi (droits, fichier absent, répertoire non vide...). `Files` lève des exceptions typées qui permettent de diagnostiquer le problème, et gère en plus les liens symboliques, ce que `File` fait mal."
  - question: "Pourquoi ce code peut-il épuiser les descripteurs de fichiers si on l'exécute souvent ?"
    code: |
      public long compterFichiers(Path repertoire) throws IOException {
          return Files.walk(repertoire)
              .filter(Files::isRegularFile)
              .count();
      }
    choix:
      - "`Files.walk` ouvre un flux lié à un descripteur de répertoire qui n'est jamais fermé ici"
      - "`Files.walk` charge tous les fichiers en mémoire, ce qui n'a rien à voir avec les descripteurs"
      - "Ce code est correct, `count()` ferme automatiquement le flux"
      - "`filter` empêche la fermeture automatique du flux"
    reponse: 0
    explication: "`Files.walk` (comme `Files.list` et `Files.find`) renvoie un `Stream<Path>` qui garde une ressource système ouverte tant qu'il n'est pas fermé. Un `Stream` n'est pas automatiquement fermé par une opération terminale comme `count()` : il faut l'utiliser dans un try-with-resources, sans quoi chaque appel fuit un descripteur."
---

## Essentiel

`java.nio.file.Path` représente un chemin, sans rien lire ni écrire tant qu'on ne le demande pas. On le crée avec `Path.of(...)` :

```java
Path catalogue = Path.of("data", "catalogue.csv");     // chemin relatif
Path export = Path.of("/var/exports/rapport.json");    // chemin absolu
```

Toutes les opérations sur le système de fichiers passent par la classe utilitaire `Files`, qui prend un `Path` en paramètre :

```java
if (Files.exists(catalogue)) {
    long taille = Files.size(catalogue);
    Files.copy(catalogue, export, StandardCopyOption.REPLACE_EXISTING);
}
```

Pour combiner ou simplifier des chemins, trois méthodes de `Path` reviennent constamment : `resolve` (ajouter un segment), `relativize` (calculer un chemin relatif entre deux chemins) et `normalize` (supprimer les `.`/`..` redondants) :

```java
Path racine = Path.of("/data/boutique");
Path fichier = racine.resolve("imports").resolve("catalogue.csv");
// /data/boutique/imports/catalogue.csv

Path relatif = racine.relativize(fichier);
// imports/catalogue.csv
```

`Files` propose aussi des opérations de parcours (`Files.list`, `Files.walk`) qui renvoient des `Stream<Path>` **paresseux** : ils gardent une ressource système ouverte et doivent toujours être fermés, avec un try-with-resources.

`java.nio.file` (depuis Java 7) est aujourd'hui la référence ; l'ancienne API `java.io.File` reste lisible dans du code existant mais n'a plus de raison d'être choisie pour du code neuf.

## Détail

### Comment ça marche

Un `Path` ne « touche » jamais le disque par lui-même : `Path.of("nimporte-quoi")` fonctionne même si le fichier n'existe pas. C'est seulement quand on appelle une méthode de `Files` (`exists`, `readString`, `size`...) que le système de fichiers est consulté. Cette séparation permet de manipuler des chemins (les construire, les comparer, les simplifier) indépendamment de leur existence réelle.

Un `Path` peut être **absolu** (commence par une racine : `/` sur Unix, `C:\` sur Windows) ou **relatif** (interprété par rapport à un répertoire de départ, en général le répertoire courant du processus). `path.isAbsolute()` le confirme, et `path.toAbsolutePath()` résout un chemin relatif par rapport au répertoire courant — sans forcément résoudre les liens symboliques ni vérifier que le fichier existe. Pour un chemin canonique garanti (liens résolus, existence vérifiée), utiliser `path.toRealPath()`, qui lève une exception si le fichier n'existe pas.

`Path.of(...)` gère nativement les séparateurs (`/` ou `\`) : construire un chemin segment par segment (`Path.of("data", "catalogue.csv")`) plutôt qu'en concaténant des chaînes évite les soucis de portabilité entre Windows et Unix.

### Exemple 1 — Opérations courantes de `Files`

```java
Path dossierImports = Path.of("imports");
Files.createDirectories(dossierImports); // crée aussi les parents manquants, sans erreur si déjà présent

Path catalogue = dossierImports.resolve("catalogue.csv");
if (Files.exists(catalogue) && Files.isRegularFile(catalogue)) {
    System.out.println("Taille : " + Files.size(catalogue) + " octets");
}

Files.copy(catalogue, dossierImports.resolve("catalogue.bak"), StandardCopyOption.REPLACE_EXISTING);
Files.deleteIfExists(dossierImports.resolve("catalogue.bak")); // renvoie false si absent, pas d'exception
```

`Files.createDirectories` (avec un « s ») crée toute l'arborescence manquante ; `Files.createDirectory` (sans « s ») échoue si le parent n'existe pas encore. `Files.delete` lève une exception si le fichier n'existe pas, `Files.deleteIfExists` renvoie simplement `false`.

### Exemple 2 — Parcourir un répertoire

```java
Path dossierProduits = Path.of("data", "produits");

try (Stream<Path> fichiers = Files.list(dossierProduits)) { // non récursif, un seul niveau
    long nbCsv = fichiers.filter(p -> p.toString().endsWith(".csv")).count();
    System.out.println(nbCsv + " fichiers CSV");
}

try (Stream<Path> tous = Files.walk(dossierProduits, 2)) { // récursif, profondeur max 2
    tous.filter(Files::isRegularFile).forEach(System.out::println);
}
```

`Files.list` liste un seul niveau, `Files.walk` descend récursivement (profondeur illimitée par défaut, ou limitée avec un second argument). Les deux renvoient des flux **paresseux** : les entrées sont lues au fur et à mesure de la consommation du `Stream`, pas toutes d'un coup — d'où l'obligation de les fermer pour libérer le descripteur de répertoire sous-jacent.

### Exemple 3 — `Files.newDirectoryStream`

```java
try (DirectoryStream<Path> flux = Files.newDirectoryStream(dossierProduits, "*.csv")) {
    for (Path fichier : flux) {
        System.out.println(fichier.getFileName());
    }
}
```

Alternative plus ancienne à `Files.list`, avec un filtre par motif glob intégré (`"*.csv"`). `DirectoryStream` implémente `Closeable` : il s'utilise aussi en try-with-resources, et s'itère avec un for-each classique plutôt qu'avec l'API `Stream`.

### Exemple 4 — Attributs de fichier

```java
BasicFileAttributes attributs = Files.readAttributes(catalogue, BasicFileAttributes.class);
System.out.println("Modifié le : " + attributs.lastModifiedTime());
System.out.println("Taille : " + attributs.size());
System.out.println("Répertoire ? " + attributs.isDirectory());
```

`Files.readAttributes` fait une seule requête système pour récupérer plusieurs informations d'un coup (taille, dates, type), plutôt que d'enchaîner `Files.size`, `Files.getLastModifiedTime`, etc. séparément — utile quand on inspecte beaucoup de fichiers.

### `java.io.File` vs `java.nio.file`

| | `java.io.File` (historique) | `java.nio.file.Path` / `Files` (depuis Java 7) |
|---|---|---|
| Échecs | Booléen (`false`), cause inconnue | Exceptions typées (`NoSuchFileException`...) |
| Liens symboliques | Mal supportés | Gérés explicitement (`Files.isSymbolicLink`, options `LinkOption`) |
| Parcours de répertoire | `listFiles()` charge tout en mémoire | `Files.list`/`Files.walk` en flux paresseux |
| Attributs | Quelques méthodes séparées | `Files.readAttributes` en un seul appel |
| Interopérabilité | — | Convertible via `file.toPath()` / `path.toFile()` |

### Pièges courants

> **Oublier de fermer le `Stream` de `Files.list`/`Files.walk`/`Files.find`.** Contrairement aux flux de `Collection.stream()`, ces `Stream<Path>` tiennent un descripteur de répertoire ouvert. Sans try-with-resources, chaque appel fuit une ressource — inoffensif isolément, mais l'application finit par manquer de descripteurs de fichiers si le code s'exécute souvent.

> **Confondre chemin relatif et absolu selon le répertoire de lancement.** `Path.of("data/catalogue.csv")` est résolu par rapport au répertoire **courant du processus** (souvent celui depuis lequel la commande a été lancée), pas par rapport à l'emplacement du fichier `.class`/`.jar`. Un code qui fonctionne depuis un IDE peut échouer une fois packagé si le répertoire courant change.

> **Passer un argument absolu à `resolve` en pensant l'ajouter au chemin de base.** `base.resolve(argument)` renvoie `argument` seul si celui-ci est déjà absolu, sans erreur ni avertissement — un bug silencieux fréquent quand `argument` vient d'une configuration ou d'une entrée utilisateur mal validée.

### À retenir

- `Path.of(...)` construit un chemin sans toucher le disque ; toutes les opérations réelles passent par `Files`.
- `resolve` combine, `relativize` calcule un chemin relatif, `normalize` nettoie les `.`/`..` — sans jamais consulter le système de fichiers pour ces trois-là.
- `Files.list`, `Files.walk` et `Files.find` renvoient des `Stream<Path>` paresseux à fermer obligatoirement (try-with-resources).
- `Files` lève des exceptions précises ; `java.io.File` renvoie des booléens peu informatifs — préférer `java.nio.file` pour tout code neuf.
- `toAbsolutePath()` résout par rapport au répertoire courant sans vérifier l'existence ; `toRealPath()` résout les liens et vérifie que le fichier existe.
