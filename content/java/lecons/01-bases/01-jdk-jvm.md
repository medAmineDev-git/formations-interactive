---
id: jdk-jvm
chapitre: bases
ordre: 1
titre: "JDK, JRE, JVM et le premier programme"
termes:
  - terme: JVM
    definition: "*Java Virtual Machine* : la machine virtuelle qui exécute le **bytecode** Java. C'est elle qui rend Java portable : le même bytecode s'exécute sur Windows, Linux ou macOS, à condition qu'une JVM y soit installée."
  - terme: JDK
    definition: "*Java Development Kit* : l'ensemble d'outils pour **développer** en Java (compilateur `javac`, lanceur `java`, outils de diagnostic, jshell…). Inclut une JVM. C'est ce qu'on installe pour coder."
  - terme: JRE
    definition: "*Java Runtime Environment* : l'environnement pour **exécuter** des programmes Java déjà compilés (JVM + bibliothèques standard), sans les outils de développement. Depuis Java 11, Oracle ne distribue plus le JRE séparément : on installe un JDK, y compris pour seulement exécuter du code."
  - terme: Bytecode
    definition: "Code intermédiaire produit par `javac` à partir du code source (fichiers `.class`). Il n'est pas directement compris par le processeur : c'est la JVM qui l'interprète, ou le compile à la volée (JIT, *Just-In-Time*) pour de meilleures performances."
  - terme: "Write Once, Run Anywhere"
    definition: "Devise historique de Java : un même bytecode compilé s'exécute sur n'importe quelle plateforme disposant d'une JVM, sans recompilation."
  - terme: Distribution du JDK
    definition: "Un assemblage concret du JDK, construit à partir du code source ouvert d'OpenJDK par un fournisseur (Oracle, Eclipse Adoptium/Temurin, Amazon Corretto, Azul Zulu…). Toutes implémentent la même spécification ; elles diffèrent par le support commercial, la licence et le rythme de mise à jour."
  - terme: Version LTS
    definition: "*Long-Term Support* : version bénéficiant d'un support prolongé (correctifs de sécurité pendant plusieurs années), contrairement aux versions intermédiaires. Java 25 est la version LTS la plus récente."
  - terme: Cadence de publication
    definition: "Depuis Java 10, une nouvelle version majeure sort **tous les six mois** (mars et septembre), avec une version LTS tous les deux ans (JEP 322)."
quiz:
  - question: "Que doit-on installer pour développer et compiler du code Java ?"
    choix:
      - "Le JRE seul suffit"
      - "Le JDK, qui inclut le compilateur et une JVM"
      - "Uniquement la JVM"
      - "Un IDE, qui remplace le besoin d'installer quoi que ce soit"
    reponse: 1
    explication: "Le JDK contient le compilateur `javac`, le lanceur `java` et les outils de développement. Le JRE seul ne permet pas de compiler (pas de `javac`). Depuis Java 11, Oracle ne distribue d'ailleurs plus de JRE séparé : on installe un JDK dans tous les cas."
  - question: "Que se passe-t-il quand on exécute `java MonProgramme.java` sur un fichier source, sans compilation préalable ?"
    code: |
      // MonProgramme.java
      public class MonProgramme {
          public static void main(String[] args) {
              System.out.println("Bonjour");
          }
      }
    choix:
      - "Une erreur : `java` ne peut exécuter que des fichiers `.class`"
      - "Le lanceur `java` compile le fichier en mémoire puis exécute directement le programme"
      - "Le programme s'exécute, mais uniquement en mode interprété, jamais en bytecode"
      - "Il faut obligatoirement un fichier `.jar` pour utiliser `java` directement"
    reponse: 1
    explication: "Le lanceur `java` sait exécuter un fichier source directement depuis Java 11 (JEP 330) : il compile le fichier en mémoire, sans générer de `.class` sur disque, puis lance `main`. Pratique pour un script rapide ou un premier essai, mais un vrai projet reste compilé avec `javac` (ou un outil de build)."
  - question: "Pourquoi le bytecode Java est-il portable d'une plateforme à l'autre ?"
    choix:
      - "Parce que `javac` produit un exécutable natif différent pour chaque système d'exploitation"
      - "Parce que c'est la JVM, spécifique à chaque plateforme, qui exécute le même bytecode"
      - "Parce que Java ne compile jamais le code, il l'interprète ligne par ligne depuis le fichier source"
      - "Parce que le bytecode est en réalité du code natif x86"
    reponse: 1
    explication: "`javac` produit un bytecode unique, indépendant du système. C'est la JVM installée sur chaque machine qui l'exécute (l'interprète, ou le compile à la volée avec le JIT) — c'est elle qui est spécifique à la plateforme, pas le bytecode. D'où « écrire une fois, exécuter partout »."
---

## Essentiel

Trois sigles à ne pas confondre :

- **JVM** (*Java Virtual Machine*) : exécute le bytecode Java, indépendamment du système d'exploitation.
- **JRE** (*Java Runtime Environment*) : JVM + bibliothèques standard, pour **exécuter** un programme.
- **JDK** (*Java Development Kit*) : JRE + outils pour **développer** (`javac`, `java`, jshell…).

Aujourd'hui, on installe simplement **un JDK**, même pour exécuter du code : Oracle ne propose plus de JRE séparé depuis Java 11.

Le cycle classique : compiler puis exécuter.

```java
// Bonjour.java
public class Bonjour {
    public static void main(String[] args) {
        System.out.println("Bonjour le monde");
    }
}
```

```bash
javac Bonjour.java   # produit Bonjour.class (bytecode)
java Bonjour          # exécute le bytecode (sans l'extension .class)
```

Le bytecode généré par `javac` n'est pas du code natif : c'est la JVM qui l'interprète, ou le compile à la volée (JIT) pour de meilleures performances. C'est ce mécanisme qui permet à Java de fonctionner « écrit une fois, exécuté partout ».

Pour un fichier unique, on peut aussi sauter la compilation explicite : `java Bonjour.java` compile en mémoire et exécute directement.

## Détail

### Comment ça marche

1. Le code source (`.java`) est compilé par `javac` en **bytecode** (`.class`), un format intermédiaire indépendant du système d'exploitation.
2. La **JVM**, elle, est spécifique à chaque plateforme (Windows, Linux, macOS…) : c'est elle qui sait lire ce bytecode.
3. À l'exécution, la JVM interprète le bytecode instruction par instruction, et compile à la volée (JIT, *Just-In-Time*) les portions de code les plus exécutées en code machine natif, pour accélérer les traitements répétés.

Ce découpage (compilation vers un format neutre, puis exécution par une machine virtuelle spécifique à la plateforme) est ce qui permet de distribuer un `.jar` unique fonctionnant partout où une JVM compatible est installée.

### Exemple 1 — Compiler et exécuter un programme classique

```java
// CalculPrix.java
public class CalculPrix {
    public static void main(String[] args) {
        double prix = 19.90;
        double quantite = 3;
        System.out.println("Total : " + (prix * quantite));
    }
}
```

```bash
javac CalculPrix.java
java CalculPrix
# Total : 59.7
```

`javac` produit `CalculPrix.class` dans le même dossier ; `java` recherche et exécute la classe contenant la méthode `main`.

### Exemple 2 — Exécuter un fichier source directement

```bash
java CalculPrix.java
# Total : 59.7
```

Aucun fichier `.class` n'apparaît sur le disque : la compilation se fait en mémoire, pour ce seul lancement. Utile pour tester rapidement un script ou un petit outil, sans étape de build.

### Exemple 3 — Fichiers source compacts et méthode `main` d'instance (Java 25)

Finalisée en **Java 25** (JEP 512, *Compact Source Files and Instance Main Methods*), cette évolution simplifie l'apprentissage : plus besoin de `public class`, de `static`, ni même de paramètre `String[] args` pour un premier programme.

```java
// Bonjour.java — valide seulement à partir de Java 25
void main() {
    System.out.println("Bonjour le monde");
}
```

Le compilateur déduit une classe implicite. C'est une manière plus simple d'écrire un **premier** programme ; la forme classique (`public class` + `public static void main(String[] args)`) reste la norme pour du code de production et fonctionne sur toutes les versions.

> Cette syntaxe n'existe pas avant Java 25 : sur un JDK 17 ou 21, seule la forme classique avec `public static void main(String[] args)` compile.

### La méthode `main`, point d'entrée classique

```java
public class Application {
    public static void main(String[] args) {
        // point d'entrée : la JVM appelle cette méthode en premier
    }
}
```

- `public` : accessible depuis l'extérieur de la classe (la JVM doit pouvoir l'appeler).
- `static` : appelée sans créer d'instance de `Application`.
- `void` : ne renvoie rien.
- `String[] args` : les arguments passés en ligne de commande.

### Distributions du JDK et versions LTS

Java est un standard ouvert (le code d'OpenJDK est public) ; plusieurs fournisseurs en distribuent des **builds** :

| Distribution | Fournisseur |
|---|---|
| Oracle JDK | Oracle |
| Eclipse Temurin | Fondation Eclipse Adoptium |
| Amazon Corretto | Amazon |
| Azul Zulu | Azul |

Toutes implémentent la même spécification Java SE ; le choix dépend surtout du support commercial souhaité et de la licence.

Une nouvelle version majeure de Java sort tous les **six mois** (mars et septembre). Parmi elles, certaines sont désignées **LTS** (*Long-Term Support*) et bénéficient de correctifs pendant plusieurs années — c'est le choix par défaut pour un projet en production. **Java 25** (sortie en septembre 2025) est la version LTS la plus récente ; les précédentes sont Java 21, 17, 11 et 8.

### Pièges courants

> **Confondre JDK et JRE.** Un JRE seul ne contient pas `javac` : impossible de compiler. Retenez l'inclusion : JDK ⊃ JRE ⊃ JVM. Aujourd'hui, ce piège est surtout théorique puisqu'on installe un JDK dans tous les cas.

> **Croire que le bytecode est exécuté nativement par le processeur.** Le bytecode n'est compris que par la JVM. Sans JVM installée, un fichier `.class` ou `.jar` ne peut pas s'exécuter, quel que soit le système.

> **Utiliser la syntaxe des fichiers source compacts sur un JDK antérieur à 25.** `void main() { ... }` sans classe ne compile pas avant Java 25 : le compilateur exige alors `public class` et une méthode `main` `static`.

### À retenir

- JDK (développer) ⊃ JRE (exécuter) ⊃ JVM (exécute le bytecode) — et on installe un JDK dans tous les cas depuis Java 11.
- `javac` compile en bytecode portable ; la JVM, spécifique à chaque plateforme, l'exécute (interprétation + JIT).
- `java NomFichier.java` permet d'exécuter un fichier source sans compilation explicite.
- Les fichiers source compacts et méthodes `main` d'instance sont **finalisés depuis Java 25** seulement (JEP 512) — ne pas les présenter comme disponibles sur des versions antérieures.
- Une version majeure sort tous les six mois ; retenez les LTS pour la production, dont Java 25 est la plus récente.
