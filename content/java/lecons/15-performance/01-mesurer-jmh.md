---
id: mesurer-jmh
chapitre: performance
ordre: 1
titre: "Mesurer avant d'optimiser"
termes:
  - terme: JMH (Java Microbenchmark Harness)
    definition: "Outil officiel du projet OpenJDK pour écrire des micro-benchmarks fiables sur la JVM. Il gère le préchauffage, l'isolement entre exécutions et la production de résultats statistiquement exploitables — des problèmes qu'un chronométrage artisanal avec `System.nanoTime()` ne résout pas correctement. Version stable actuelle : `1.37` (publiée en août 2023, aucune nouvelle version depuis)."
  - terme: "@Benchmark"
    definition: "Annotation posée sur une méthode pour indiquer à JMH qu'il doit la mesurer. JMH génère du code autour de cette méthode pour l'exécuter un grand nombre de fois et collecter des statistiques."
  - terme: "@State"
    definition: "Annotation posée sur une classe qui contient les données d'entrée du benchmark. Sa **portée** (`Scope.Benchmark`, `Scope.Thread`, `Scope.Group`) définit si l'état est partagé entre threads ou propre à chacun — indispensable dès que le benchmark manipule des champs plutôt que des constantes locales, pour éviter que le JIT ne les traite comme des constantes."
  - terme: "@Warmup / @Measurement"
    definition: "Annotations qui fixent le nombre d'itérations de **préchauffage** (ignorées dans les résultats, le temps que le JIT compile et optimise le code) et le nombre d'itérations de **mesure** (celles qui comptent réellement dans le résultat final)."
  - terme: "@Fork"
    definition: "Nombre de fois où JMH relance un **nouveau processus JVM** complet pour exécuter un benchmark. Chaque fork repart d'un état JIT vierge, ce qui évite qu'un benchmark pollue les résultats d'un autre exécuté dans le même processus."
  - terme: Blackhole
    definition: "Objet fourni par JMH auquel on passe le résultat d'un calcul (`blackhole.consume(resultat)`) pour empêcher le JIT de supprimer ce calcul par élimination de code mort, sous prétexte que sa valeur n'est jamais utilisée."
  - terme: "@CompilerControl"
    definition: "Annotation qui donne des instructions explicites au compilateur JIT sur une méthode (par exemple `CompilerControl.Mode.DONT_INLINE` pour empêcher son inlining), utile pour isoler précisément ce qu'on mesure sans que l'optimiseur ne réorganise le code autour."
  - terme: Mode de mesure
    definition: "JMH peut mesurer le **débit** (`Mode.Throughput`, opérations par unité de temps) ou le **temps moyen par opération** (`Mode.AverageTime`), entre autres modes (échantillonnage, exécution unique). Le choix du mode dépend de la question posée : « combien d'opérations par seconde ? » ou « combien de temps prend une opération ? »."
quiz:
  - question: "Pourquoi ce micro-benchmark artisanal donne-t-il un résultat trompeur ?"
    code: |
      long debut = System.nanoTime();
      for (int i = 0; i < 1000; i++) {
          calculerHash(donnee);
      }
      long duree = System.nanoTime() - debut;
      System.out.println(duree / 1000);
    choix:
      - "System.nanoTime() n'est pas assez précis pour mesurer du code Java"
      - "Aucune phase de préchauffage n'est isolée : les premières itérations sont interprétées ou compilées par un JIT peu optimisé (C1), ce qui mélange dans la moyenne un régime de performance très différent du régime stabilisé"
      - "La boucle for est plus lente qu'un stream, ce qui fausse la mesure"
      - "Le résultat est correct : diviser par le nombre d'itérations suffit à obtenir un temps par opération fiable"
    reponse: 1
    explication: "Le code confond la phase de préchauffage (interprétation, puis compilation progressive par le JIT) et la phase stabilisée qui suit. Sans les séparer, la moyenne mélange des itérations lentes (JIT pas encore optimisé) et rapides (code compilé), et rien n'empêche le JIT d'éliminer l'appel si le résultat n'est jamais utilisé. JMH sépare explicitement préchauffage et mesure avec @Warmup et @Measurement, et empêche l'élimination du résultat avec Blackhole."
  - question: "À quoi sert Blackhole.consume() dans un benchmark JMH ?"
    choix:
      - "À vider le cache JIT entre deux itérations de mesure"
      - "À empêcher le compilateur JIT d'éliminer le calcul mesuré par élimination de code mort, sous prétexte que son résultat n'est jamais lu"
      - "À forcer un garbage collector complet avant chaque mesure"
      - "À exécuter le benchmark sur un thread séparé du reste de l'application"
    reponse: 1
    explication: "Le JIT optimise agressivement : si le résultat d'un calcul n'est jamais utilisé, il peut supprimer purement et simplement ce calcul (élimination de code mort), rendant la mesure inutile puisqu'elle mesurerait un code qui ne s'exécute plus vraiment. Passer le résultat à un Blackhole force le JIT à considérer qu'il est utilisé, donc à conserver le calcul."
  - question: "Un micro-benchmark JMH montre qu'une méthode est deux fois plus rapide qu'une autre. Que peut-on en conclure sur l'application complète qui l'utilise ?"
    choix:
      - "Que l'application complète sera nécessairement deux fois plus rapide en remplaçant l'ancienne méthode"
      - "Rien d'automatique : un micro-benchmark isolé ne reproduit pas la contention, les motifs d'accès mémoire réels, l'état du GC ni la charge d'une application en conditions réelles — il faut confirmer le gain par du profilage (échantillonnage, JFR) sur l'application elle-même"
      - "Que le résultat n'a aucune valeur et qu'il ne faut jamais utiliser JMH"
      - "Que le gain sera automatiquement supérieur en production, où le matériel est plus puissant"
    reponse: 1
    explication: "Un micro-benchmark isole volontairement un fragment de code pour le mesurer précisément, mais il ne reproduit pas le comportement d'une application réelle : contexte JIT différent, pression GC différente, contention réseau ou disque absente. Il reste un outil précieux pour comparer deux implémentations d'un même fragment, mais un gain mesuré en isolation doit être confirmé par du profilage de l'application réelle avant d'en tirer une conclusion sur le système complet."
---

## Essentiel

Chronométrer une boucle avec `System.nanoTime()` semble simple, mais c'est presque toujours faux sur la JVM. Plusieurs effets se mélangent dans le résultat : le **préchauffage** (les premières exécutions sont interprétées, puis compilées progressivement par le JIT — voir la leçon suivante), l'**élimination de code mort** (le JIT peut supprimer un calcul dont le résultat n'est jamais utilisé), le **repliement de constantes** (une valeur d'entrée constante permet au JIT de précalculer le résultat une fois pour toutes) et le passage du **ramasse-miettes** pendant la mesure, qui peut ajouter une pause arbitraire à une itération.

**JMH** (Java Microbenchmark Harness), l'outil officiel d'OpenJDK, gère ces effets pour produire des mesures fiables :

```java
@State(Scope.Thread)
public class MonBenchmark {
    private final String donnee = "valeur-a-traiter";

    @Benchmark
    public int calculerHash() {
        return donnee.hashCode();
    }
}
```

Les annotations `@Warmup` et `@Measurement` séparent préchauffage et mesure ; `@Fork` relance un processus JVM neuf pour éviter qu'un benchmark en pollue un autre ; un `Blackhole` (ou une valeur de retour, comme ci-dessus) empêche l'élimination de code mort.

Un micro-benchmark isolé ne remplace pas le **profilage** d'une application réelle (échantillonnage, Java Flight Recorder) : il compare des fragments de code entre eux, en conditions artificielles. Le message central : **mesurer avant d'optimiser**, avec le bon outil pour la bonne question.

## Détail

### Pourquoi un chronométrage naïf est presque toujours faux

Sur la JVM, le code démarre **interprété**, puis le compilateur JIT le compile progressivement à mesure qu'une méthode s'exécute souvent (voir la leçon suivante sur la compilation à la volée). Une boucle qui chronomètre 1 000 itérations mélange donc des itérations lentes (interprétées ou compilées par un compilateur peu optimisé) et des itérations rapides (code pleinement optimisé) : la moyenne obtenue ne représente ni l'un ni l'autre régime. À cela s'ajoutent deux pièges spécifiques aux optimiseurs :

- **Élimination de code mort** : si le résultat d'un calcul n'est jamais lu, le JIT peut légalement le supprimer — la boucle « mesure » alors un code qui ne s'exécute plus.
- **Repliement de constantes** : si l'entrée d'un calcul est connue à la compilation (une constante, ou une valeur que le JIT peut prouver invariante), le résultat peut être précalculé une seule fois — le benchmark mesure alors une lecture de constante, pas le calcul visé.

Un passage du ramasse-miettes pendant la fenêtre de mesure peut aussi ajouter un pic isolé qui fausse une moyenne calculée sur peu d'itérations.

### Exemple 1 — Mise en place de JMH

JMH s'ajoute comme dépendance Maven ; le générateur d'annotations produit le code de mesure au moment de la compilation.

```xml
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-core</artifactId>
    <version>1.37</version>
</dependency>
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-generator-annprocess</artifactId>
    <version>1.37</version>
    <scope>provided</scope>
</dependency>
```

Un benchmark s'exécute ensuite depuis un `main` qui appelle le `Runner` de JMH (ou via le plugin Maven `jmh:benchmark` selon la configuration du projet), jamais depuis un simple `main()` qui appellerait la méthode annotée directement — cela contournerait tout le mécanisme de mesure de JMH.

### Exemple 2 — @State, @Warmup, @Measurement, @Fork

```java
@State(Scope.Thread)
@Warmup(iterations = 5, time = 1, timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 5, time = 1, timeUnit = TimeUnit.SECONDS)
@Fork(2)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
public class ConcatenationBenchmark {

    private String prefixe = "commande-";
    private int identifiant = 42;

    @Benchmark
    public String avecPlus() {
        return prefixe + identifiant;
    }

    @Benchmark
    public String avecStringBuilder() {
        return new StringBuilder(prefixe).append(identifiant).toString();
    }
}
```

`@State(Scope.Thread)` place `prefixe` et `identifiant` comme des champs d'instance plutôt que des constantes locales : le JIT ne peut plus les replier en constantes, ce qui garantit que le calcul mesuré est bien exécuté à chaque itération. `@Fork(2)` relance deux processus JVM séparés pour vérifier que le résultat est stable d'un processus à l'autre, pas un artefact d'un seul état JIT.

### Exemple 3 — Blackhole et @CompilerControl

```java
@Benchmark
public void calculerSansRetour(Blackhole blackhole) {
    int resultat = calculIntensif();
    blackhole.consume(resultat); // empêche l'élimination de code mort
}

@CompilerControl(CompilerControl.Mode.DONT_INLINE)
private int calculIntensif() {
    // ...
    return 0;
}
```

Quand une méthode ne renvoie rien d'exploitable directement (effet de bord, boucle interne), passer le résultat intermédiaire à un `Blackhole` est indispensable : sans lui, rien n'empêche le JIT de constater que la valeur ne sert jamais et de supprimer le calcul entier.

### Lire un résultat JMH

```
Benchmark                              Mode  Cnt   Score   Error  Units
ConcatenationBenchmark.avecPlus        avgt   10   45,231 ± 1,204  ns/op
ConcatenationBenchmark.avecStringBuilder avgt 10  22,876 ± 0,891  ns/op
```

*(exemple illustratif de format de sortie, pas une mesure réelle à retenir comme référence)*

- **Score** : la moyenne mesurée, dans l'unité indiquée par `Units` (ici, nanosecondes par opération, `avgt` = `AverageTime`).
- **Error** : la demi-largeur de l'intervalle de confiance (généralement à 99,9 %) autour du score — deux scores dont les intervalles se chevauchent ne sont pas mesurablement différents, il ne faut pas conclure trop vite qu'une implémentation « gagne ».
- **Cnt** : le nombre d'itérations de mesure agrégées dans ce score.

### Micro-benchmark vs profilage d'une application réelle

| | Micro-benchmark (JMH) | Profilage (échantillonnage, JFR) |
|---|---|---|
| Objet mesuré | Un fragment de code isolé | L'application entière, en conditions réelles |
| Environnement | Artificiel, contrôlé, JIT dédié au fragment | Réel : charge, contention, GC, E/S concurrentes |
| Question typique | « Cette méthode est-elle plus rapide que celle-ci ? » | « Où l'application passe-t-elle réellement son temps ? » |
| Risque principal | Conclusions non transposables à l'application complète | Trop de bruit sans hypothèse préalable à vérifier |
| Outils | JMH | Java Flight Recorder (JFR), profileurs à échantillonnage |

### Pièges courants

> **Oublier le Blackhole ou une valeur de retour.** Sans consommer le résultat d'un calcul, le JIT peut l'éliminer entièrement par élimination de code mort — le benchmark mesure alors un no-op, avec un score anormalement bas et trompeur.

> **Préchauffage insuffisant.** Trop peu d'itérations de `@Warmup` laissent le code dans un état de compilation instable au moment où la mesure commence, produisant un score qui mélange encore deux régimes de performance.

> **Généraliser un résultat de micro-benchmark à toute une application.** Un gain mesuré en isolation (sans contention, sans pression mémoire réelle) ne se traduit pas mécaniquement par le même gain en production. Confirmer par du profilage sur l'application réelle avant de changer une décision de conception sur cette seule base.

### À retenir

- Un chronométrage artisanal avec `System.nanoTime()` autour d'une boucle mélange préchauffage et régime stabilisé, et ne protège ni de l'élimination de code mort ni du repliement de constantes.
- JMH sépare `@Warmup` et `@Measurement`, isole chaque exécution avec `@Fork`, et fournit `Blackhole` pour éviter que le JIT ne supprime le calcul mesuré.
- `@State` définit les données d'entrée du benchmark comme des champs, pas des constantes, pour empêcher leur repliement par le JIT.
- Un micro-benchmark compare des fragments de code en isolation : il ne remplace pas le profilage (échantillonnage, JFR) d'une application réelle avant de conclure sur un gain en production.
- jmh-core est actuellement en version `1.37` (août 2023, sans nouvelle version depuis) ; aucun plafond de version JDK n'est officiellement documenté pour son utilisation.
