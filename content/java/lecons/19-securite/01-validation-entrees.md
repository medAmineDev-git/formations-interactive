---
id: validation-entrees
chapitre: securite-robustesse
ordre: 1
titre: "Valider et se méfier des entrées"
termes:
  - terme: "Liste d'autorisation (allowlist)"
    definition: "Stratégie de validation qui n'accepte qu'un ensemble explicite de valeurs, formats ou caractères connus comme valides, et rejette tout le reste par défaut. S'oppose à la liste d'interdiction (denylist), qui énumère ce qui est refusé et laisse passer tout ce qu'elle n'a pas anticipé — une approche structurellement incomplète face à un attaquant créatif."
  - terme: "Injection SQL"
    definition: "Faille où une donnée externe, concaténée directement dans une requête SQL, est interprétée comme du code SQL plutôt que comme une simple valeur. Permet à un attaquant de lire, modifier ou supprimer des données hors de ce que l'application prévoyait."
  - terme: PreparedStatement
    definition: "Requête SQL précompilée dont les paramètres sont liés séparément du texte de la requête (`?`, puis `setString`, `setInt`...). Le pilote JDBC transmet la valeur comme donnée, jamais comme fragment de SQL exécutable : la parade de référence contre l'injection SQL."
  - terme: "Traversée de répertoire (path traversal)"
    definition: "Faille où un nom de fichier ou chemin fourni par l'utilisateur (souvent via `../`) permet d'accéder à un fichier situé en dehors du répertoire prévu, en abusant de la résolution de chemins relatifs."
  - terme: "Désérialisation de données non fiables"
    definition: "Reconstruction d'objets Java à partir d'un flux dont l'origine n'est pas totalement maîtrisée. Avec la sérialisation native (`ObjectInputStream`), ce processus peut instancier des classes arbitraires du classpath, un risque documenté d'exécution de code non voulu."
  - terme: ObjectInputFilter
    definition: "Mécanisme du JDK (`JEP 290`, renforcé par les filtres par flux de la `JEP 415`, finalisée en JDK 17) qui restreint explicitement les classes qu'un `ObjectInputStream` accepte de reconstruire, sur la base d'une liste d'autorisation."
  - terme: "Injection de journal (log injection)"
    definition: "Insertion, par une donnée externe non filtrée, de sauts de ligne ou de faux enregistrements dans un fichier de log — de quoi fabriquer des entrées trompeuses ou masquer une action malveillante au milieu d'un journal falsifié."
quiz:
  - question: "Quel est le problème de ce code, qui recherche un client par son nom ?"
    code: |
      String nom = requete.getParameter("nom");
      String sql = "SELECT * FROM clients WHERE nom = '" + nom + "'";
      ResultSet rs = statement.executeQuery(sql);
    choix:
      - "La concaténation directe d'une entrée utilisateur dans le SQL permet une injection : une valeur comme `' OR '1'='1` change le sens de la requête"
      - "Rien, `Statement` est aussi sûr que `PreparedStatement` tant que la requête est en lecture seule"
      - "Le code ne compile pas, `executeQuery` attend un `PreparedStatement`"
      - "Le seul risque est une `NullPointerException` si `nom` est absent"
    reponse: 0
    explication: "Un attaquant qui saisit `' OR '1'='1` transforme la clause `WHERE` en condition toujours vraie et récupère tous les clients ; des variantes permettent d'aller bien plus loin (extraction, modification, suppression de données). La lecture seule ne protège de rien : `PreparedStatement` avec des paramètres liés (`?`) est la parade, quelle que soit l'opération."
  - question: "Un import de fichiers accepte un nom fourni par l'utilisateur et le résout ainsi : `Path cible = racineImport.resolve(nomFichier)`. Pourquoi est-ce insuffisant pour empêcher une traversée de répertoire ?"
    choix:
      - "`resolve` seul ne bloque pas les composants `..` : un nom comme `../../etc/config` peut faire sortir `cible` du répertoire `racineImport`, il faut normaliser puis vérifier que le résultat reste sous la racine attendue"
      - "`resolve` échoue automatiquement si le chemin obtenu sort du répertoire de base"
      - "Le problème ne se pose que sous Linux, jamais sous Windows"
      - "`Path.resolve` refuse tout nom de fichier contenant un point"
    reponse: 0
    explication: "`resolve` combine des chemins, il ne les valide pas. Il faut appeler `normalize()` sur le résultat puis vérifier explicitement (`startsWith`) qu'il reste sous la racine autorisée, avant toute lecture ou écriture — sinon un nom de fichier malveillant peut atteindre n'importe quel fichier accessible au processus."
  - question: "Pourquoi désérialiser un flux `ObjectInputStream` dont l'origine n'est pas fiable est-il risqué, même sans erreur ni exception visible ?"
    choix:
      - "Parce que le simple processus de reconstruction des objets peut instancier des classes arbitraires présentes sur le classpath, dans un ordre choisi par l'attaquant, avant même que le code métier ne s'exécute"
      - "Parce que `ObjectInputStream` a été supprimé du JDK et lève systématiquement une exception"
      - "Parce que la désérialisation est toujours plus lente que le parsing JSON, sans autre risque"
      - "Parce que `readObject` refuse tout flux de plus de 1 Mo"
    reponse: 0
    explication: "`ObjectInputStream` n'a pas été retirée du JDK. Le risque documenté est que la reconstruction d'un objet peut déclencher l'exécution de code (constructeurs, méthodes `readObject` personnalisées) sur des classes du classpath assemblées par l'attaquant (« chaînes de gadgets »), sans qu'aucune exception ne signale quoi que ce soit d'anormal. Un `ObjectInputFilter` restreignant les classes acceptées réduit ce risque ; pour du nouveau code, éviter ce mécanisme sur des données non fiables reste la meilleure protection."
---

## Essentiel

Toute donnée qui entre dans l'application depuis l'extérieur — paramètre de requête, en-tête HTTP, fichier importé, message d'une file d'attente, réponse d'un service tiers — doit être considérée **suspecte** jusqu'à preuve du contraire. La validation se fait **au plus tôt**, à la frontière de l'application, avant que la donnée ne circule dans le code métier.

Deux stratégies existent : la **liste d'interdiction** (denylist), qui énumère les caractères ou motifs refusés, et la **liste d'autorisation** (allowlist), qui énumère ce qui est accepté et rejette tout le reste. La denylist oublie toujours un cas ; l'allowlist est structurellement plus sûre :

```java
// Denylist fragile : un attaquant trouve toujours un caractère oublié.
if (reference.contains("'") || reference.contains(";")) { /* refuser */ }

// Allowlist : on décrit ce qui est valide, pas ce qui est interdit.
if (!reference.matches("[A-Z]{3}-[0-9]{6}")) {
    throw new IllegalArgumentException("Référence commande invalide : " + reference);
}
```

Les familles de risques classiques suivent toutes le même principe : ne jamais faire confiance à la structure ou au contenu d'une donnée externe. Une requête SQL construite par concaténation, un chemin de fichier assemblé à partir d'un nom fourni par l'utilisateur, ou un flux désérialisé sans filtre sont trois variantes du même problème : une donnée non fiable qui obtient un pouvoir qu'elle ne devrait pas avoir. La parade est systématiquement de séparer strictement la donnée du code ou de la structure qui l'entoure — requêtes préparées, chemins normalisés et vérifiés, filtres de désérialisation — plutôt que d'espérer nettoyer une chaîne au cas par cas.

## Détail

### Exemple 1 — Injection SQL et `PreparedStatement`

```java
// Vulnérable : la donnée devient du code SQL.
String sql = "SELECT * FROM commandes WHERE client_id = '" + clientId + "'";
ResultSet rs = statement.executeQuery(sql);

// Sûr : la valeur est liée séparément, jamais interprétée comme du SQL.
String requete = "SELECT * FROM commandes WHERE client_id = ?";
try (PreparedStatement ps = connexion.prepareStatement(requete)) {
    ps.setString(1, clientId);
    ResultSet rs = ps.executeQuery();
}
```

`PreparedStatement` reste la parade de référence, y compris quand la requête paraît anodine (recherche, filtre) : le pilote JDBC transmet `clientId` comme une donnée, jamais comme un fragment de requête à exécuter, quelle que soit la valeur reçue.

### Exemple 2 — Injection de commande système

```java
// Vulnérable si nomFichier vient de l'utilisateur : un shell interprète le texte.
Runtime.getRuntime().exec("convert " + nomFichier + " -resize 200x200 sortie.png");

// Plus sûr : arguments passés séparément, aucun shell n'interprète la chaîne.
new ProcessBuilder("convert", nomFichier, "-resize", "200x200", "sortie.png").start();
```

`ProcessBuilder` avec des arguments séparés évite qu'un shell interprète des métacaractères (`;`, `|`, `` ` ``...) glissés dans `nomFichier`. Le principe est le même qu'avec `PreparedStatement` : séparer la donnée de la commande, plutôt que reconstruire une chaîne exécutable.

### Exemple 3 — Traversée de répertoire lors d'un import de fichier

```java
Path racineImport = Path.of("/var/boutique/imports").toAbsolutePath().normalize();

public Path resoudreFichierImport(String nomFichier) {
    Path cible = racineImport.resolve(nomFichier).normalize();
    if (!cible.startsWith(racineImport)) {
        throw new SecurityException("Chemin en dehors du répertoire d'import : " + nomFichier);
    }
    return cible;
}
```

Un `nomFichier` comme `../../../etc/passwd` ou un chemin absolu sortirait du répertoire prévu si l'on se contentait de `resolve`. `normalize()` supprime les `..` et `.` redondants, et la vérification `startsWith` sur le chemin absolu confirme que le résultat reste bien sous la racine autorisée avant toute lecture ou écriture.

### Exemple 4 — Désérialisation non fiable et filtre

```java
try (ObjectInputStream entree = new ObjectInputStream(flux)) {
    entree.setObjectInputFilter(info ->
        info.serialClass() == CommandeImportee.class
            ? ObjectInputFilter.Status.ALLOWED
            : ObjectInputFilter.Status.REJECTED);
    CommandeImportee commande = (CommandeImportee) entree.readObject();
}
```

La sérialisation Java native (`Serializable`, `ObjectInputStream`) n'a pas été retirée du JDK, mais elle est déconseillée pour lire un flux dont la provenance n'est pas totalement maîtrisée : reconstruire un objet peut instancier des classes arbitraires du classpath. `ObjectInputFilter` (JEP 290, renforcée par la JEP 415 en JDK 17 pour les filtres par flux) limite explicitement, par liste d'autorisation, les classes qu'un flux a le droit de reconstruire. Pour du code nouveau, un format sans exécution de code au parsing (JSON, par exemple) reste le choix par défaut face à des données non fiables — voir le chapitre *Entrées/sorties et fichiers*.

### Où valider, et avec quelles limites

| Risque | Parade principale |
|---|---|
| Injection SQL | `PreparedStatement`, jamais de concaténation de valeurs dans le texte SQL |
| Injection de commande système | `ProcessBuilder` avec arguments séparés, éviter tout appel à un shell sur une entrée externe |
| Traversée de répertoire | Normaliser le chemin puis vérifier qu'il reste sous la racine attendue |
| Désérialisation non fiable | `ObjectInputFilter` en liste d'autorisation, ou éviter la sérialisation native sur ces flux |
| Taille excessive (fichier, chaîne, collection) | Limite explicite vérifiée avant traitement, pas seulement après épuisement de la mémoire |
| Motif regex sur une entrée non fiable | Éviter les quantificateurs imbriqués (backtracking catastrophique) — voir le chapitre *Dates, texte et formats* |

Une entrée peut être syntaxiquement valide et malgré tout dangereuse par sa **taille** : un fichier CSV de plusieurs gigaoctets envoyé comme pièce jointe, une chaîne de plusieurs millions de caractères, une collection JSON à un million d'éléments peuvent épuiser la mémoire ou le temps de traitement d'un simple appel, sans qu'aucune injection ne soit en cause. Fixer et vérifier une limite explicite (taille de fichier, longueur de chaîne, nombre d'éléments) avant de traiter la donnée fait partie de la validation, au même titre que la vérification du format.

### Pièges courants

> **Valider côté client (JavaScript) et considérer que c'est suffisant.** Une validation dans le navigateur améliore l'expérience utilisateur, mais un attaquant appelle l'API directement, sans jamais charger la page. La validation côté serveur, à la frontière de l'application, n'est jamais optionnelle.

> **Nettoyer une chaîne au lieu de la valider et la rejeter.** Retirer certains caractères jugés dangereux (`replace("'", "")`) est une variante fragile de la liste d'interdiction : elle oublie toujours un cas, et elle peut créer des surprises (un nom légitime contenant une apostrophe devient silencieusement autre chose). Préférer rejeter franchement une entrée qui ne correspond pas au format attendu.

> **Journaliser une donnée externe sans limite ni filtrage.** Écrire directement une entrée utilisateur dans un journal permet une injection de log (sauts de ligne fabriquant de faux enregistrements) et peut y faire fuiter des données sensibles (mot de passe, numéro de carte, jeton de session). Journaliser un identifiant technique plutôt que la donnée brute, et ne jamais loguer de secret ou de moyen de paiement, même partiellement.

### À retenir

- Toute donnée externe est suspecte : elle se valide au plus tôt, à la frontière de l'application, jamais seulement côté client.
- Une liste d'autorisation (n'accepter que ce qui est décrit comme valide) est structurellement plus sûre qu'une liste d'interdiction.
- Injection SQL, injection de commande et traversée de répertoire se règlent toutes par la même idée : séparer la donnée de la structure qu'elle ne doit pas pouvoir modifier (`PreparedStatement`, `ProcessBuilder`, chemin normalisé et vérifié).
- La sérialisation Java native reste disponible dans le JDK mais est déconseillée sur des flux non fiables ; `ObjectInputFilter` restreint les classes acceptées quand elle est incontournable.
- Les limites de taille (fichier, chaîne, collection) et une journalisation qui n'expose jamais de donnée sensible font partie intégrante de la validation des entrées.
