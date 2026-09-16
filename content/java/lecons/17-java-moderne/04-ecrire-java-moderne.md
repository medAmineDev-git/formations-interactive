---
id: ecrire-java-moderne
chapitre: java-moderne
ordre: 4
titre: "Écrire du Java moderne"
termes:
  - terme: "var (inférence de type locale)"
    definition: "Mot-clé qui laisse le compilateur déduire le type d'une **variable locale** à partir de son initialisation, sans rien changer au typage statique (le type est fixé à la compilation, `var` n'est pas un type dynamique). Finalisé par le **JEP 286** en **Java 10**, directement sans passer par l'aperçu."
  - terme: Expression switch
    definition: "Forme de `switch` qui **retourne une valeur** (`variable = switch (x) { case A -> ...; }`), avec des branches `->` sans `break` ni chute (*fall-through*) implicite. À distinguer du switch sur motifs (chapitre précédent), qui teste des types en plus des valeurs, mais s'appuie sur la même syntaxe d'expression."
  - terme: Bloc de texte (text block)
    definition: "Littéral de chaîne multi-ligne délimité par `\"\"\"`, qui conserve la mise en forme sans concaténations ni `\\n` explicites — pratique pour du SQL, du JSON ou du HTML intégré au code. Finalisé par le **JEP 378** en **Java 15**."
  - terme: HttpClient (java.net.http)
    definition: "Client HTTP standard du JDK, avec support natif de HTTP/2 et une API asynchrone basée sur `CompletableFuture`. Finalisé par le **JEP 321** en **Java 11**, il remplace l'ancien `HttpURLConnection`, plus verbeux et limité à HTTP/1.1."
  - terme: "Option --release (javac)"
    definition: "Option du compilateur qui fixe à la fois la version de langage cible **et** l'ensemble des API disponibles pour cette version, contrairement à `-source`/`-target` qui ne bornaient que la syntaxe et pouvaient laisser compiler par erreur un appel à une API introduite dans une version plus récente que celle visée."
  - terme: jdeps
    definition: "Outil fourni avec le JDK qui analyse les dépendances d'un `.jar` ou d'un ensemble de classes : paquets utilisés, dépendances vers des API internes non garanties (`sun.*`, `com.sun.*`), ou compatibilité avec un futur système de modules. Utile avant une migration pour repérer les usages fragiles avant qu'ils ne cassent."
quiz:
  - question: "Dans quel de ces cas var nuit-il le plus à la lisibilité ?"
    code: |
      var quantite = 5;
      var client = new Client("Dupont", "d@mail.fr");
      var resultat = service.calculer(commande, options);
      var produits = new ArrayList<Produit>();
    choix:
      - "var quantite = 5;"
      - "var client = new Client(\"Dupont\", \"d@mail.fr\");"
      - "var resultat = service.calculer(commande, options);"
      - "var produits = new ArrayList<Produit>();"
    reponse: 2
    explication: "Pour quantite, client et produits, le type est évident à la lecture (littéral, constructeur nommé, ArrayList<Produit> explicite). Pour resultat, rien dans service.calculer(commande, options) ne dit ce que la méthode retourne : var oblige à aller chercher la signature pour comprendre le type. var aide quand le type est déjà visible à droite du signe égal, pas quand il faut le deviner."
  - question: "Pourquoi compiler avec --release 17 est-il plus sûr que de compiler avec un JDK 25 en utilisant seulement -source 17 -target 17 ?"
    choix:
      - "--release 17 active automatiquement toutes les fonctionnalités en aperçu de Java 17"
      - "--release 17 restreint aussi les API disponibles à celles qui existaient en Java 17, alors que -source/-target ne bornent que la syntaxe et laissent compiler un appel à une API introduite après Java 17"
      - "-source et -target ne fonctionnent plus du tout depuis Java 21"
      - "--release 17 compile plus rapidement que -source/-target"
    reponse: 1
    explication: "-source et -target contrôlent uniquement la syntaxe et le format des .class générés : ils n'empêchent pas d'appeler par erreur une méthode introduite après la version ciblée, ce qui casserait l'exécution sur un vrai JDK 17. --release combine les deux contrôles (syntaxe et API), ce qui le rend plus fiable pour une compilation croisée."
  - question: "Une équipe migre son projet de Java 17 à Java 25 « pour être à jour » et commence par activer --enable-preview afin d'utiliser la concurrence structurée en production dès la mise en ligne. Quel est le principal problème de cette approche ?"
    choix:
      - "Aucun problème : la concurrence structurée est stable en Java 25"
      - "Utiliser une fonctionnalité en aperçu en production expose le code à des changements de comportement ou de syntaxe dans une version future, avant même sa finalisation, ce qui est risqué en dehors d'un contexte d'expérimentation assumé"
      - "--enable-preview n'existe pas en Java 25"
      - "La concurrence structurée ne fonctionne qu'avec des threads de plateforme, pas des threads virtuels"
    reponse: 1
    explication: "La concurrence structurée reste en aperçu (JEP 533, 7ᵉ aperçu en Java 27, pas finalisée même en Java 25/27). Une fonctionnalité en aperçu peut encore changer avant finalisation : l'utiliser en production engage l'équipe dans une dette potentielle. Migrer vers une version plus récente est utile pour les fonctionnalités finalisées et le support à long terme, pas comme prétexte pour activer des aperçus en production."
---

## Essentiel

« Écrire du Java moderne » ne veut pas dire utiliser toutes les nouveautés disponibles : c'est choisir, pour chaque situation, l'outil qui rend le code le plus **clair**, parmi ceux réellement **finalisés** pour la version ciblée.

Avant (style « Java 8 ») :

```java
public String resumeCommande(Commande commande) {
    if (commande.getStatut() == Statut.EN_ATTENTE) {
        return "en attente";
    } else if (commande.getStatut() == Statut.EXPEDIEE) {
        return "expédiée le " + commande.getDateExpedition().toString();
    } else {
        return "statut inconnu";
    }
}
```

Après (Java 21+) :

```java
public String resumeCommande(Commande commande) {
    return switch (commande.statut()) {
        case EN_ATTENTE -> "en attente";
        case EXPEDIEE -> "expédiée le " + commande.dateExpedition();
        default -> "statut inconnu";
    };
}
```

L'expression `switch` remplace la cascade `if/else` : plus courte, exhaustive si `Statut` est un `enum` entièrement couvert, et chaque branche retourne directement une valeur. Ce n'est qu'un exemple parmi d'autres : records au lieu de classes de données, blocs de texte pour le SQL ou le JSON, `var` quand le type est déjà évident à la lecture.

## Détail

### Exemple 1 — Réécriture complète : d'un style Java 8 à un style moderne

Avant :

```java
public class RapportVentes {
    public String genererRapport(List<Ligne> lignes) {
        double total = 0;
        for (Ligne ligne : lignes) {
            total += ligne.getPrix() * ligne.getQuantite();
        }
        StringBuilder sb = new StringBuilder();
        sb.append("Rapport ventes\n");
        sb.append("Total: ").append(total).append("\n");
        return sb.toString();
    }
}
```

Après (records, streams, bloc de texte) :

```java
public record Ligne(double prix, int quantite) {}

public class RapportVentes {
    public String genererRapport(List<Ligne> lignes) {
        double total = lignes.stream()
                .mapToDouble(l -> l.prix() * l.quantite())
                .sum();

        return """
                Rapport ventes
                Total: %.2f
                """.formatted(total);
    }
}
```

Le record remplace une classe `Ligne` avec accesseurs manuels (déjà traitée dans le chapitre POO avancée), le stream remplace la boucle d'accumulation, et le bloc de texte remplace la concaténation `StringBuilder` pour un gabarit multi-ligne.

### Exemple 2 — Blocs de texte pour SQL et JSON

```java
String requete = """
        SELECT id, nom, prix
        FROM produit
        WHERE categorie = ?
        ORDER BY prix DESC
        """;

String jsonProduit = """
        {
          "nom": "%s",
          "prix": %.2f
        }
        """.formatted(produit.nom(), produit.prix());
```

Un bloc de texte conserve l'indentation et les retours à la ligne du gabarit source, sans `\n` ni concaténation — nettement plus lisible pour une requête SQL ou un gabarit JSON qu'une chaîne classique sur une seule ligne.

### Exemple 3 — API modernes à préférer

```java
// À éviter dans du code nouveau
Date maintenant = new Date();
File fichier = new File("catalogue.csv");
HttpURLConnection connexion = (HttpURLConnection) new URL(url).openConnection();
```

```java
// Préféré
Instant maintenant = Instant.now();
Path fichier = Path.of("catalogue.csv");
HttpClient client = HttpClient.newHttpClient();
HttpRequest requete = HttpRequest.newBuilder(URI.create(url)).GET().build();
HttpResponse<String> reponse = client.send(requete, HttpResponse.BodyHandlers.ofString());
```

`java.time` (depuis Java 8), `java.nio.file` (`Path`/`Files`) et `HttpClient` (finalisé en Java 11, JEP 321) ne sont pas de « nouvelles » API en 2026, mais restent souvent absentes d'un code base hérité de Java 8 ou plus ancien qui n'a jamais été mis à jour au fil des versions.

### Exemple 4 — var : quand ça aide, quand ça nuit

```java
// var aide : le type est déjà évident à droite
var produits = new ArrayList<Produit>();
var client = new Client("Dupont", "d@mail.fr");
for (var produit : produits) { ... }

// var nuit : le type n'est plus visible du tout
var resultat = service.calculer(commande, options); // Optional<BigDecimal> ? String ? Commande ?
public var traiter(Commande commande) { ... } // interdit : var est réservé aux variables locales
```

`var` est réservé aux variables locales (jamais aux champs, ni aux paramètres ou types de retour d'une méthode). Il aide quand le type est déjà écrit juste à côté (un constructeur, un littéral) ; il nuit quand il masque un type qui n'apparaît nulle part ailleurs dans la ligne, en particulier pour des retours de méthode au nom peu explicite.

### Ce qu'il ne faut PAS faire

| À éviter | Pourquoi |
|---|---|
| Utiliser une fonctionnalité en aperçu (`--enable-preview`) en production | Peut encore changer avant finalisation — voir concurrence structurée et motifs primitifs (leçon précédente) |
| Migrer « pour être à jour », sans objectif précis | Risque sans bénéfice mesurable ; migrer pour une raison concrète (LTS qui expire, fonctionnalité finalisée précise) |
| Mélanger les styles dans un même fichier (`if/instanceof` à côté de `switch` sur motifs pour la même hiérarchie) | Nuit à la cohérence de lecture d'un même type de logique |
| Remplacer un `enum` simple par une hiérarchie scellée sans données différentes par cas | Complexité inutile tant qu'aucune constante ne porte de données propres |

### Stratégie de migration d'un projet existant

1. **Compiler avec `--release`.** `--release 21` sur un JDK plus récent garantit qu'aucune API introduite après Java 21 n'est utilisée par erreur, en plus de restreindre la syntaxe acceptée.
2. **Vérifier les dépendances.** Certains outils imposent un plancher JDK propre : **JUnit 6** exige Java 17+ (rester sur la ligne LTS JUnit 5.14.x sinon), et **Maven 4** (à venir en GA) exigera lui aussi Java 17+ pour s'exécuter.
3. **Passer `jdeps` sur les artefacts existants.** Il révèle les dépendances vers des API internes non garanties (`sun.*`, `com.sun.*`), avant que la migration ne les révèle en production.
4. **Tester à chaque palier.** Migrer version par version (17 → 21 → 25, pas directement 17 → 25), suite de tests complète à chaque étape.
5. **Séparer migration et modernisation.** N'adopter records, switch sur motifs ou blocs de texte qu'une fois la compilation stabilisée — deux étapes distinctes, plus faciles à valider isolément.

### Pièges courants

> **Confondre migration technique et modernisation du style.** Faire compiler sur une version plus récente (compatibilité) est un projet différent de réécrire le code avec les nouveautés du langage (lisibilité). Les mener de front rend chaque régression difficile à attribuer à l'une ou l'autre cause.

> **Ignorer qu'un outil du projet a son propre plancher de version JDK.** Un projet peut viser Java 17 avec un outil de build qui exige une version plus récente pour s'exécuter — ou, à l'inverse, ne supporte pas encore la toute dernière version (Gradle 9.x ne s'exécute pas encore sur un JDK fraîchement sorti). Vérifier séparément la version qui **exécute** l'outil et celle que le **code compilé** cible.

> **Réécrire tout un fichier « au passage » pendant une revue non liée.** Mélanger un correctif fonctionnel et une modernisation de style (`var`, blocs de texte...) rend le diff illisible pour le relecteur.

### À retenir

- Moderniser le code, c'est choisir l'outil le plus clair **parmi les fonctionnalités finalisées** pour la version ciblée — pas cocher toutes les nouveautés disponibles.
- `var` aide quand le type est déjà visible à droite du `=` ; il nuit quand il masque un type qui n'apparaît nulle part ailleurs sur la ligne.
- Préférer les API modernes du JDK (`java.time`, `java.nio.file`, `HttpClient`) à leurs équivalents historiques dans tout code nouveau.
- Ne jamais utiliser une fonctionnalité en aperçu (`--enable-preview`) en production ; ne jamais migrer sans objectif précis.
- Une migration de version se fait par paliers, avec `--release`, une vérification des dépendances et `jdeps`, et une suite de tests complète à chaque étape — séparément de la modernisation du style.
