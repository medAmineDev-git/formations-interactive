---
id: lecture-ecriture
chapitre: io-fichiers
ordre: 2
titre: "Lire et écrire des fichiers"
termes:
  - terme: "Files.readString / Files.writeString"
    definition: "Méthodes (depuis Java 11) qui lisent ou écrivent le contenu **entier** d'un fichier texte en une seule opération, sous forme de `String`. Pratiques pour des fichiers de taille raisonnable (configuration, petit export), pas pour de gros volumes."
  - terme: Files.lines
    definition: "Renvoie un `Stream<String>` **paresseux** : les lignes sont lues au fur et à mesure de la consommation du flux, sans tout charger en mémoire. Comme tout flux ouvert sur une ressource, il doit être fermé (try-with-resources)."
  - terme: StandardOpenOption
    definition: "Énumération d'options d'ouverture de fichier (`CREATE`, `CREATE_NEW`, `APPEND`, `TRUNCATE_EXISTING`, `WRITE`, `READ`...) passée aux méthodes de `Files` pour préciser comment un fichier doit être ouvert."
  - terme: Charset par défaut
    definition: "Jeu de caractères utilisé quand aucun n'est précisé explicitement. Depuis Java 18 (JEP 400), c'est **UTF-8** sur toutes les plateformes ; avant, il dépendait de la configuration du système d'exploitation, source de bugs difficiles à reproduire d'une machine à l'autre."
  - terme: Écriture atomique
    definition: "Technique consistant à écrire dans un fichier temporaire puis à le déplacer (`Files.move` avec `StandardCopyOption.ATOMIC_MOVE`) vers sa destination finale, pour éviter qu'un lecteur ne voie jamais un fichier à moitié écrit."
  - terme: BufferedReader / BufferedWriter
    definition: "Décorateurs de flux texte qui ajoutent un tampon en mémoire, réduisant le nombre d'accès physiques au disque. `Files.newBufferedReader`/`newBufferedWriter` en créent un directement à partir d'un `Path`."
quiz:
  - question: "Pourquoi ce code est-il risqué sur un fichier de plusieurs gigaoctets ?"
    code: |
      List<String> lignes = Files.readAllLines(chemin);
      lignes.stream()
          .filter(l -> l.contains("promo"))
          .forEach(System.out::println);
    choix:
      - "`Files.readAllLines` charge la totalité du fichier en mémoire sous forme de `List<String>` avant même de commencer le traitement"
      - "`readAllLines` ne fonctionne que sur des fichiers de moins de 1 Mo"
      - "Le code ne compile pas : `readAllLines` renvoie un `Stream`, pas une `List`"
      - "Aucun risque, `readAllLines` est toujours paresseux"
    reponse: 0
    explication: "`Files.readAllLines` (comme `readString` et `readAllBytes`) charge tout le contenu en mémoire d'un coup. Pour un gros fichier, cela peut provoquer une `OutOfMemoryError` ou simplement ralentir l'application. `Files.lines` (paresseux, à fermer) ou un `BufferedReader` ligne par ligne évitent le problème."
  - question: "Quelle option de `StandardOpenOption` faut-il utiliser pour ajouter des lignes à la fin d'un fichier de log existant, sans écraser son contenu ?"
    choix:
      - "`APPEND`"
      - "`CREATE_NEW`"
      - "`TRUNCATE_EXISTING`"
      - "`WRITE` seule, sans autre option"
    reponse: 0
    explication: "`APPEND` positionne l'écriture à la fin du fichier existant. `CREATE_NEW` échoue si le fichier existe déjà (`FileAlreadyExistsException`), `TRUNCATE_EXISTING` vide le fichier avant d'écrire, et `WRITE` seule (comportement par défaut de `Files.newOutputStream`) écrase depuis le début sans forcément tout tronquer selon la longueur écrite."
  - question: "Pourquoi préciser explicitement `StandardCharsets.UTF_8` en 2026 alors que c'est déjà le charset par défaut ?"
    choix:
      - "Pour que le code reste correct et explicite sur un JDK antérieur à 18, et pour documenter l'intention sans dépendre d'une configuration implicite"
      - "Ce n'est plus utile, la mention peut être supprimée sans aucun risque"
      - "Parce qu'UTF-8 n'est le défaut que sous Linux, pas sous Windows ni macOS"
      - "Parce que `Files.readString` refuse de compiler sans charset explicite"
    reponse: 0
    explication: "Depuis Java 18, UTF-8 est bien le défaut sur toutes les plateformes (JEP 400). Mais l'expliciter reste une bonne pratique : le code documente son intention, reste correct si porté vers un JDK plus ancien où le défaut dépendait de l'OS, et évite toute ambiguïté pour qui relit le code sans connaître ce détail de version."
---

## Essentiel

Pour du texte, les méthodes les plus directes chargent **tout le contenu d'un coup** :

```java
String contenu = Files.readString(chemin, StandardCharsets.UTF_8);
Files.writeString(export, contenu, StandardCharsets.UTF_8);

List<String> lignes = Files.readAllLines(chemin, StandardCharsets.UTF_8);
```

Simples et suffisantes pour un fichier de configuration ou un petit export. Pour un fichier volumineux, il faut éviter de tout charger en mémoire : `Files.lines` renvoie un flux **paresseux**, ligne par ligne, à fermer explicitement :

```java
try (Stream<String> lignes = Files.lines(catalogue, StandardCharsets.UTF_8)) {
    long nbPromos = lignes.filter(l -> l.contains(";PROMO;")).count();
}
```

Pour écrire, `Files.writeString` accepte des options d'ouverture (`StandardOpenOption`) :

```java
Files.writeString(journal, "commande #42 enregistrée\n",
    StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
```

Pour du **binaire**, `Files.readAllBytes` renvoie un `byte[]` complet ; pour du gros volume, on passe par des flux (`InputStream`/`OutputStream`), idéalement enveloppés dans un tampon (`BufferedInputStream`/`BufferedOutputStream`) pour limiter les accès disque.

Depuis Java 18, UTF-8 est le charset par défaut partout (avant, il dépendait de l'OS) — mais le préciser explicitement reste une bonne habitude pour documenter l'intention et rester portable vers du code plus ancien.

## Détail

### Exemple 1 — Fichier de configuration (lecture/écriture simples)

```java
Path config = Path.of("config", "boutique.properties");

String contenu = Files.readString(config, StandardCharsets.UTF_8);
System.out.println(contenu);

String misAJour = contenu.replace("devise=EUR", "devise=USD");
Files.writeString(config, misAJour, StandardCharsets.UTF_8,
    StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
```

`Files.writeString` crée le fichier s'il n'existe pas, l'écrase par défaut (sans autre option) s'il existe. `TRUNCATE_EXISTING` combiné à `WRITE` garantit que l'ancien contenu ne laisse pas de résidu si le nouveau contenu est plus court.

### Exemple 2 — Traiter un gros fichier CSV ligne par ligne

```java
public long compterLignesEnErreur(Path catalogue) throws IOException {
    try (BufferedReader lecteur = Files.newBufferedReader(catalogue, StandardCharsets.UTF_8)) {
        return lecteur.lines()
            .skip(1) // en-tête
            .filter(ligne -> ligne.split(";").length != 5)
            .count();
    }
}
```

`BufferedReader.lines()` (comme `Files.lines`) ne charge jamais tout le fichier en mémoire : seule la ligne en cours de traitement y réside vraiment. Indispensable pour un catalogue de plusieurs centaines de milliers de lignes.

### Exemple 3 — Lire du binaire par blocs, sans tout charger

```java
public void copierAvecTampon(Path source, Path destination) throws IOException {
    try (InputStream entree = new BufferedInputStream(Files.newInputStream(source));
         OutputStream sortie = new BufferedOutputStream(Files.newOutputStream(destination))) {
        byte[] tampon = new byte[8192];
        int lus;
        while ((lus = entree.read(tampon)) != -1) {
            sortie.write(tampon, 0, lus);
        }
    }
}
```

Pour un simple export d'image ou de PDF, `Files.copy(source, destination)` suffit en une ligne. Ce schéma manuel par tampon montre le principe utilisé en interne : lire un bloc, l'écrire, répéter — sans jamais garder tout le fichier en mémoire.

### Exemple 4 — Écriture atomique d'un fichier de configuration

```java
public void sauvegarderConfiguration(Path fichier, String contenu) throws IOException {
    Path temporaire = Files.createTempFile(fichier.getParent(), "config", ".tmp");
    Files.writeString(temporaire, contenu, StandardCharsets.UTF_8);
    Files.move(temporaire, fichier,
        StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
}
```

Écrire directement dans le fichier final expose à un contenu à moitié écrit si le processus s'arrête en cours d'écriture (panne, exception). Écrire dans un fichier temporaire du **même répertoire** puis le déplacer avec `ATOMIC_MOVE` élimine ce risque : le déplacement est une opération indivisible pour le système de fichiers, tant que source et destination sont sur le même volume. `Files.createTempFile` ne supprime pas le fichier automatiquement : c'est au code de le déplacer ou de le nettoyer.

### Options d'ouverture les plus utiles

| Option | Effet |
|---|---|
| `CREATE` | Crée le fichier s'il n'existe pas, sans erreur s'il existe déjà |
| `CREATE_NEW` | Crée le fichier, échoue (`FileAlreadyExistsException`) s'il existe déjà |
| `APPEND` | Écrit à la fin du fichier existant |
| `TRUNCATE_EXISTING` | Vide le fichier avant d'écrire (comportement par défaut avec `WRITE` seule) |
| `WRITE` / `READ` | Ouvre en écriture / lecture |

### Pièges courants

> **Charger un gros fichier entier avec `readString`, `readAllLines` ou `readAllBytes`.** Ces méthodes sont pratiques mais chargent tout en mémoire avant de rendre la main. Sur un fichier de plusieurs centaines de mégaoctets, cela peut ralentir l'application voire lever une `OutOfMemoryError`. Préférer `Files.lines`, un `BufferedReader`, ou un traitement par flux/tampon dès que la taille n'est pas garantie petite.

> **Oublier de fermer le `Stream` renvoyé par `Files.lines`.** Contrairement à `readAllLines`, `Files.lines` garde un fichier ouvert tant que le flux n'est pas consommé jusqu'au bout **ou** fermé explicitement. Un `Stream` interrompu avant la fin (`findFirst`, exception, `break` impossible sur un flux...) sans try-with-resources laisse le fichier ouvert.

> **Utiliser `Scanner` pour parser un gros fichier.** `Scanner` (y compris son constructeur `Scanner(Path)` depuis Java 10) est conçu pour du texte interactif ou de petits fichiers avec un tokenizing simple ; son analyse par expressions régulières est nettement plus lente que `BufferedReader.readLine()` ou `Files.lines()` sur un gros volume. Réserver `Scanner` aux cas où sa lecture typée (`nextInt()`, `nextDouble()`...) simplifie vraiment le code, pas au traitement de fichiers volumineux.

### À retenir

- Pour un petit fichier texte : `Files.readString`/`writeString` ou `readAllLines`. Pour un gros fichier : `Files.lines` ou `BufferedReader`, tous deux paresseux et à fermer.
- Pour du binaire volumineux : flux `InputStream`/`OutputStream` enveloppés dans un tampon (`Buffered...`), lus/écrits par blocs.
- Depuis Java 18, UTF-8 est le charset par défaut partout ; l'expliciter reste une bonne pratique de lisibilité et de portabilité.
- L'écriture atomique (fichier temporaire + `Files.move` avec `ATOMIC_MOVE`) évite qu'un lecteur voie un fichier à moitié écrit.
- `Scanner` convient à de petits volumes ou à un parsing typé simple, pas à du traitement de fichiers volumineux.
