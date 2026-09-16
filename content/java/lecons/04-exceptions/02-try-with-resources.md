---
id: try-with-resources
chapitre: exceptions
ordre: 2
titre: "Libérer les ressources : try-with-resources"
termes:
  - terme: AutoCloseable
    definition: "Interface avec une seule méthode, `close() throws Exception`, implémentée par toute classe qui représente une ressource à libérer (flux, connexion, fichier). C'est elle qui rend une classe utilisable dans un `try (...)`."
  - terme: Closeable
    definition: "Sous-interface de `AutoCloseable` (héritée par les classes d'E/S comme `InputStream`), qui restreint `close()` à ne lever qu'une `IOException` et impose que fermer une ressource déjà fermée n'ait aucun effet."
  - terme: try-with-resources
    definition: "Syntaxe `try (Ressource r = ...) { ... }` qui garantit l'appel de `close()` sur `r` à la sortie du bloc, que le code se termine normalement ou par une exception, sans écrire de `finally` explicite."
  - terme: Exception supprimée (suppressed)
    definition: "Quand une exception est déjà en train de se propager depuis le corps du `try` et que `close()` en lève une autre, la seconde n'écrase pas la première : elle est ajoutée à sa liste d'exceptions supprimées, consultable avec `getSuppressed()`."
  - terme: Variable effectivement finale
    definition: "Variable jamais réassignée après son initialisation, même sans le mot-clé `final`. Depuis Java 9, une telle variable peut être utilisée directement dans un `try-with-resources` sans redéclaration."
  - terme: java.lang.ref.Cleaner
    definition: "Classe (depuis Java 9) qui enregistre une action de nettoyage exécutée quand un objet devient inaccessible et est ramassé par le GC — un filet de sécurité en complément du try-with-resources, jamais un remplacement fiable et immédiat."
  - terme: "Object.finalize()"
    definition: "Ancien mécanisme de nettoyage appelé par le GC avant destruction d'un objet. Dépréciée pour suppression depuis Java 18 (`@Deprecated(forRemoval=true)`), toujours présente mais à éviter : appel non garanti dans un délai prévisible, voire jamais."
quiz:
  - question: "Le corps du `try` lève une `RuntimeException`, et `close()` de la ressource lève ensuite une `IOException`. Que reçoit l'appelant ?"
    code: |
      try (LecteurCatalogue lecteur = new LecteurCatalogue(chemin)) {
          lecteur.lireLigne(); // lève une RuntimeException
      }
    choix:
      - "La `RuntimeException` du corps du `try`, avec l'`IOException` de `close()` ajoutée à ses exceptions supprimées"
      - "L'`IOException` de `close()`, la `RuntimeException` d'origine est perdue"
      - "Les deux exceptions sont levées séparément, l'une après l'autre"
      - "Aucune : `close()` n'est jamais appelé si le corps du `try` a déjà levé une exception"
    reponse: 0
    explication: "L'exception d'origine (celle du corps du `try`) est celle qui se propage. Si `close()` en lève une autre, elle n'est pas perdue : elle s'ajoute via `addSuppressed()` et est récupérable avec `getSuppressed()` sur l'exception principale."
  - question: "Dans quel ordre ces ressources sont-elles fermées ?"
    code: |
      try (ConnexionStock connexion = new ConnexionStock();
           JournalCommandes journal = new JournalCommandes()) {
          // ...
      }
    choix:
      - "Dans l'ordre de déclaration : `connexion` puis `journal`"
      - "Dans l'ordre inverse de déclaration : `journal` puis `connexion`"
      - "L'ordre n'est pas garanti"
      - "Seule la dernière ressource déclarée est fermée automatiquement"
    reponse: 1
    explication: "Le try-with-resources ferme les ressources dans l'ordre **inverse** de leur déclaration, comme une pile : la dernière ouverte est la première fermée. Logique quand une ressource dépend d'une autre déclarée avant elle."
  - question: "Que se passe-t-il si un `return` se trouve dans un bloc `finally` ?"
    code: |
      public int calculerRemise() {
          try {
              return 10;
          } finally {
              return 20;
          }
      }
    choix:
      - "La méthode renvoie 10"
      - "La méthode renvoie 20 : le `return` du `finally` écrase silencieusement celui du `try`"
      - "Erreur de compilation : deux `return` dans la même méthode"
      - "Comportement indéterminé à l'exécution"
    reponse: 1
    explication: "Un `return` (ou une exception levée) dans un `finally` supprime silencieusement tout `return` ou toute exception venant du `try` ou d'un `catch`. C'est une source de bugs difficiles à repérer : ne jamais mettre de `return` dans un `finally`."
---

## Essentiel

Libérer une ressource (fichier, connexion, flux) « à la main » avec `finally` est verbeux et facile à rater :

```java
FileReader lecteur = null;
try {
    lecteur = new FileReader("catalogue.csv");
    // lecture...
} finally {
    if (lecteur != null) {
        lecteur.close(); // peut elle-même lever une exception
    }
}
```

Le **try-with-resources** simplifie ce schéma. Toute classe qui implémente `AutoCloseable` peut se déclarer entre parenthèses après `try` : sa méthode `close()` est appelée automatiquement à la sortie du bloc, que tout se soit bien passé ou non.

```java
try (FileReader lecteur = new FileReader("catalogue.csv")) {
    // lecture...
} // close() appelé ici automatiquement, même si une exception est levée au-dessus
```

Avec **plusieurs ressources**, elles se ferment dans l'ordre **inverse** de leur déclaration. Si une exception vient du corps du `try` et qu'une autre survient pendant la fermeture, celle du corps l'emporte : celle de `close()` est ajoutée comme exception **supprimée**, récupérable avec `getSuppressed()`.

## Détail

### Pourquoi c'est utile

Le `finally` manuel a deux défauts : il oblige à initialiser la variable à `null` avant le `try` (pour le test de nullité dans le `finally`), et si `close()` lève une exception, elle **masque** l'exception d'origine, plus utile pour comprendre le vrai problème. Le try-with-resources règle les deux.

### Exemple 1 — Plusieurs ressources et ordre de fermeture

```java
try (ConnexionStock connexion = new ConnexionStock(url);
     JournalCommandes journal = new JournalCommandes(connexion)) {
    journal.enregistrer(commande);
} // fermeture : journal.close() d'abord, puis connexion.close()
```

`journal` dépend de `connexion` : la fermer avant `connexion` est cohérent, d'où l'ordre inverse de déclaration.

### Exemple 2 — Variable effectivement finale (Java 9+)

```java
LecteurCatalogue lecteur = new LecteurCatalogue(chemin); // jamais réassignée ensuite

try (lecteur) { // pas besoin de "LecteurCatalogue l2 = lecteur"
    lecteur.lireLigne();
}
```

Avant Java 9, il fallait redéclarer une variable dans les parenthèses même pour une ressource déjà existante. Ce n'est plus nécessaire tant que la variable est effectivement finale (jamais réassignée).

### Exemple 3 — Écrire sa propre ressource

```java
public class JournalCommandes implements AutoCloseable {

    private final BufferedWriter writer;

    public JournalCommandes(Path fichier) throws IOException {
        this.writer = Files.newBufferedWriter(fichier);
    }

    public void enregistrer(Commande commande) throws IOException {
        writer.write(commande.toString());
        writer.newLine();
    }

    @Override
    public void close() throws IOException {
        writer.close();
    }
}
```

Il suffit d'implémenter `AutoCloseable` et sa méthode `close()`. La classe devient alors utilisable dans un `try (...)`, y compris dans le code d'autres équipes qui ne connaissent pas ses détails internes.

### Exemple 4 — Exceptions supprimées

```java
try (JournalCommandes journal = new JournalCommandes(chemin)) {
    throw new IllegalStateException("Commande déjà enregistrée");
    // si journal.close() lève aussi une IOException, elle est supprimée
} catch (IllegalStateException e) {
    System.out.println("Erreur : " + e.getMessage());
    for (Throwable supprimee : e.getSuppressed()) {
        System.out.println("  (fermeture) " + supprimee.getMessage());
    }
}
```

`getSuppressed()` renvoie un tableau, vide si aucune exception supplémentaire n'a été levée pendant la fermeture.

### `finally` manuel vs try-with-resources

| | `finally` manuel | try-with-resources |
|---|---|---|
| Variable initialisée à `null` avant | Nécessaire | Non |
| Exception de fermeture qui masque l'exception d'origine | Oui, par défaut | Non, elle devient une exception supprimée |
| Fermeture de plusieurs ressources | Blocs `try/finally` imbriqués | Une seule syntaxe, ordre inverse automatique |
| Prérequis sur la classe | Aucun (juste appeler `close()`) | Implémenter `AutoCloseable` |

### Pièges courants

> **Un `return` (ou un `throw`) dans un `finally`.** Il écrase silencieusement tout `return` ou toute exception venant du `try` : le code semble correct mais renvoie la mauvaise valeur, ou avale une exception importante. Ce piège existe aussi bien avec un `finally` manuel qu'avec le bloc généré implicitement par un try-with-resources : ne jamais y placer de `return`.

> **Compter sur `finalize()` pour libérer une ressource.** `Object.finalize()` est dépréciée pour suppression depuis Java 18 et son appel par le GC n'est ni garanti ni rapide : un fichier peut rester ouvert bien après que l'objet n'est plus utilisé. Utiliser try-with-resources en premier lieu ; `java.lang.ref.Cleaner` peut servir de filet de sécurité complémentaire, jamais de mécanisme principal.

> **Oublier qu'une ressource fermée par erreur deux fois peut planter.** `AutoCloseable.close()` ne garantit **pas** d'être sans effet si on l'appelle deux fois (contrairement à `Closeable.close()`, qui l'impose). En écrivant sa propre ressource, il vaut mieux rendre `close()` idempotente (sans effet si déjà fermée).

### À retenir

- `try (Ressource r = ...) { ... }` appelle `r.close()` automatiquement, même en cas d'exception.
- Plusieurs ressources se ferment dans l'ordre **inverse** de leur déclaration.
- L'exception du corps du `try` l'emporte ; celle de `close()` devient une exception **supprimée** (`getSuppressed()`).
- Depuis Java 9, une variable effectivement finale s'utilise directement dans le `try (...)`, sans redéclaration.
- `finalize()` n'est pas une solution fiable ; try-with-resources (et `Cleaner` en filet de sécurité) le remplacent.
