---
id: architecture-jvm
chapitre: jvm-memoire
ordre: 1
titre: "Architecture de la JVM"
termes:
  - terme: Fichier .class
    definition: "Résultat de la compilation par `javac` : bytecode indépendant de la plateforme, précédé du nombre magique `0xCAFEBABE`, suivi des numéros de version, d'un **pool de constantes**, des indicateurs d'accès, des références de classe/superclasse/interfaces, puis des champs, méthodes (avec leur bytecode) et attributs."
  - terme: Chargeur bootstrap
    definition: "Le premier chargeur, écrit en code natif (pas en Java) et intégré à la JVM. Il charge les classes fondamentales du JDK (`java.lang.*`, `java.util.*`…) depuis le module `java.base`. `getClassLoader()` sur une classe qu'il a chargée renvoie `null`."
  - terme: Délégation parent-first
    definition: "Modèle de chargement où un chargeur de classes délègue **d'abord** la demande à son parent avant d'essayer lui-même. Une classe n'est donc chargée par un chargeur enfant que si aucun de ses ancêtres ne l'a trouvée — ce qui empêche une application de redéfinir accidentellement `java.lang.String`."
  - terme: Chargement paresseux (lazy loading)
    definition: "Une classe n'est chargée par la JVM que lorsqu'elle est réellement référencée pour la première fois, pas au démarrage du programme ni à la compilation. Chargement (lecture du `.class`, création de l'objet `Class`) et **initialisation** (exécution des blocs `static` et des initialiseurs de champs statiques) sont deux étapes distinctes."
  - terme: "ClassNotFoundException vs NoClassDefFoundError"
    definition: "`ClassNotFoundException` (checked) est levée quand un chargement **explicite** échoue (`Class.forName(\"...\")`, `loadClass(...)`) parce que la classe est introuvable. `NoClassDefFoundError` (unchecked, sous-classe d'`Error`) est levée quand la JVM ne trouve pas, **au runtime**, une classe qui existait pourtant à la compilation — typiquement un `.jar` manquant en exécution, ou l'échec d'un précédent chargement de la même classe (par exemple un bloc `static` qui a levé une exception)."
  - terme: Chargeur de classes personnalisé
    definition: "Sous-classe de `ClassLoader` qui redéfinit `findClass()` pour charger du bytecode depuis une source non standard (réseau, base de données, plugin chiffré). Utilisé pour des architectures à plugins, l'isolation de versions concurrentes d'une même bibliothèque, ou le rechargement à chaud (hot reload)."
quiz:
  - question: "Une classe Config contient un bloc static qui affiche \"Init Config\". Que produit ce code ?"
    code: |
      class Config {
          static { System.out.println("Init Config"); }
          static final int MAX = 100; // constante compile-time
      }

      public class App {
          public static void main(String[] args) {
              System.out.println("Debut");
              System.out.println(Config.MAX);
              System.out.println("Fin");
          }
      }
    choix:
      - "Debut / Init Config / 100 / Fin — Config est initialisée dès que main() commence"
      - "Debut / 100 / Fin — le bloc static ne s'exécute jamais car Config.MAX est une constante compile-time inlinée par le compilateur, donc aucune initialisation de Config n'est déclenchée"
      - "Init Config / Debut / 100 / Fin — Config est initialisée avant App au chargement de la JVM"
      - "Une erreur de compilation, car un bloc static ne peut pas contenir d'instruction System.out.println"
    reponse: 1
    explication: "Une constante static final dont la valeur est connue à la compilation (littéral) est inlinée directement dans le bytecode appelant : le compilateur remplace Config.MAX par 100 partout où c'est utilisé, sans générer de référence réelle à la classe Config. Aucun accès actif à Config n'a donc lieu, et sa classe n'est jamais initialisée — le bloc static ne s'exécute pas. Si MAX n'était pas final, ou calculée dynamiquement, l'accès déclencherait bien l'initialisation."
  - question: "Quelle est la différence essentielle entre ClassNotFoundException et NoClassDefFoundError ?"
    choix:
      - "Ce sont deux noms pour la même exception, l'un utilisé en Java 8 et l'autre depuis Java 11"
      - "ClassNotFoundException est une exception vérifiée levée par un chargement explicite (Class.forName) qui échoue ; NoClassDefFoundError est une erreur non vérifiée levée quand la JVM ne retrouve pas au runtime une classe présente à la compilation, par exemple un .jar absent du classpath d'exécution"
      - "NoClassDefFoundError ne peut survenir qu'avec un chargeur de classes personnalisé"
      - "ClassNotFoundException survient uniquement pour les classes du JDK, NoClassDefFoundError uniquement pour les classes applicatives"
    reponse: 1
    explication: "C'est une distinction classique en entretien : l'une est une exception checked liée à une tentative explicite de chargement (réflexion, chargeur personnalisé), l'autre une Error liée à une référence implicite du bytecode (new, appel de méthode statique...) qui ne trouve plus sa cible au moment de l'exécution, alors que la compilation s'était bien passée."
  - question: "Pourquoi le modèle de délégation parent-first des chargeurs de classes est-il important pour la sécurité ?"
    choix:
      - "Il chiffre le bytecode pendant le transfert entre chargeurs"
      - "Il garantit qu'une classe du JDK comme java.lang.String est toujours chargée par le chargeur bootstrap en premier, empêchant une classe applicative portant le même nom de la remplacer silencieusement"
      - "Il empêche toute classe applicative d'hériter d'une classe du JDK"
      - "Il vérifie automatiquement la signature numérique de chaque fichier .class"
    reponse: 1
    explication: "Sans délégation parent-first, une application pourrait fournir son propre java.lang.String dans son classpath et l'imposer à la JVM avant que le bootstrap ne charge le vrai. La délégation vers le parent avant toute tentative locale garantit que les classes cœur du JDK ne peuvent pas être usurpées de cette façon (protection dite du « sandbox de type »)."
---

## Essentiel

Un programme Java suit trois étapes : `javac` compile le code source en **bytecode** (fichiers `.class`), la JVM **charge** ces classes à la demande, puis les **exécute** — d'abord interprétées instruction par instruction, puis compilées à la volée (JIT) pour les méthodes fréquemment exécutées (voir le chapitre Performance pour le détail du JIT).

Le chargement des classes suit une hiérarchie à trois niveaux avec **délégation parent-first** : le chargeur **bootstrap** (natif, charge `java.base`), le chargeur **platform** (modules standard du JDK hors `java.base`) et le chargeur **application** (le classpath ou module-path de l'application). Chaque chargeur demande d'abord à son parent avant d'essayer lui-même — ce qui empêche une classe applicative de usurper une classe du JDK.

```java
public class Demo {
    public static void main(String[] args) {
        System.out.println(String.class.getClassLoader()); // null : chargée par le bootstrap
        System.out.println(Demo.class.getClassLoader());   // chargeur application
    }
}
```

Une classe est **chargée** paresseusement, à sa première référence réelle — mais chargement et **initialisation** (exécution des blocs `static` et des initialiseurs de champs statiques) sont deux étapes distinctes : une classe peut être chargée sans être encore initialisée.

Deux erreurs à distinguer en entretien : `ClassNotFoundException` (chargement explicite raté, ex. `Class.forName`) et `NoClassDefFoundError` (une classe présente à la compilation devient introuvable à l'exécution).

## Détail

### Comment ça marche

Le pipeline complet : fichier source `.java` → compilation `javac` → bytecode portable `.class` → chargement par un `ClassLoader` (lecture binaire, vérification, création de l'objet `Class` en mémoire) → liaison (résolution des références, préparation des champs statiques à leur valeur par défaut) → **initialisation** (exécution du bloc `static` et des initialiseurs de champs statiques, dans l'ordre du code source) → exécution du bytecode, d'abord interprété puis compilé à la volée pour les points chauds.

### Exemple 1 — Structure d'un fichier .class

```text
CA FE BA BE              // nombre magique : identifie un fichier .class valide
00 00 00 45               // version majeure/mineure (ex. 69 = Java 25)
[constant_pool]           // littéraux, noms de classes/méthodes/champs référencés
[access_flags]             // public, final, abstract, interface...
[this_class / super_class] // cette classe et sa superclasse, par référence au pool
[interfaces]                // interfaces implémentées
[fields]                    // champs : nom, type, modificateurs, attributs
[methods]                   // méthodes : signature + bytecode de leur corps
[attributes]                 // métadonnées : SourceFile, LineNumberTable, annotations...
```

Le pool de constantes centralise tous les littéraux et symboles référencés (noms de classes, de méthodes, de champs, chaînes) : le bytecode des méthodes n'y fait que des renvois par index, ce qui rend le format compact et vérifiable avant exécution.

### Exemple 2 — Les trois chargeurs et leur délégation

```java
ClassLoader appLoader = Demo.class.getClassLoader();
System.out.println(appLoader);                 // jdk.internal.loader.ClassLoaders$AppClassLoader
System.out.println(appLoader.getParent());      // PlatformClassLoader
System.out.println(appLoader.getParent().getParent()); // null : le bootstrap n'a pas de représentation Java
```

Quand l'application demande `Demo`, l'`AppClassLoader` délègue d'abord au `PlatformClassLoader`, qui délègue au bootstrap ; seul l'échec en cascade de tous les ancêtres fait redescendre la responsabilité jusqu'à l'`AppClassLoader`, qui finit par la trouver sur le classpath.

### Exemple 3 — Chargement vs initialisation

```java
class Ressource {
    static { System.out.println("Ressource initialisée"); }
}

public class App {
    public static void main(String[] args) {
        Class<?> c = Ressource.class;        // référence de type : pas d'initialisation
        System.out.println("Avant new");
        new Ressource();                      // déclenche l'initialisation ici
    }
}
// Affiche : Avant new / Ressource initialisée
```

L'initialisation est déclenchée par un **usage actif** : instanciation (`new`), appel d'une méthode statique, lecture/écriture d'un champ statique non constant, réflexion (`Class.forName` avec `initialize=true`, le défaut), ou l'initialisation d'une sous-classe qui force celle de sa superclasse. Une simple mention du type (`Ressource.class`, un paramètre déclaré `Ressource`) ne suffit pas.

### Exemple 4 — Chargeur de classes personnalisé

```java
class ChargeurPlugin extends ClassLoader {
    private final byte[] bytecode;
    ChargeurPlugin(byte[] bytecode, ClassLoader parent) {
        super(parent); // respecte la délégation parent-first
        this.bytecode = bytecode;
    }
    @Override
    protected Class<?> findClass(String name) {
        return defineClass(name, bytecode, 0, bytecode.length);
    }
}
```

Cas d'usage réels : serveurs d'applications isolant chaque webapp dans son propre chargeur (deux versions différentes d'une même bibliothèque peuvent alors coexister), systèmes de plugins qui chargent du bytecode déposé à chaud, ou frameworks de rechargement de code en développement.

### Observer le chargement des classes

| Méthode | Ce qu'elle montre |
|---|---|
| `java -verbose:class` (ou `-Xlog:class+load=info`) | Chaque classe chargée, avec son chargeur et l'origine (module, `.jar`) |
| `jcmd <pid> VM.class_hierarchy` | Hiérarchie des classes chargées dans une JVM en cours d'exécution |
| `ClassLoader.getClassLoader()` | Le chargeur qui a effectivement chargé une classe donnée, en code |

### Pièges courants

> **Confondre chargement et initialisation.** `MaClasse.class` ou une déclaration de variable ne déclenchent pas forcément l'initialisation. Seul un usage actif (instanciation, appel statique, écriture d'un champ statique non constant) la déclenche.

> **Lire NoClassDefFoundError comme un simple "classe absente".** Ce n'est pas toujours un `.jar` manquant : si le chargement initial d'une classe a levé une exception (par exemple dans son bloc `static`), la JVM marque la classe en échec et lève `NoClassDefFoundError` à **chaque** tentative ultérieure de la référencer, même si le vrai problème (l'exception d'origine) est ailleurs dans les logs.

> **Oublier la délégation en écrivant un chargeur personnalisé.** Ne pas appeler `super(parent)` ou ignorer `findClass()` au profit d'un `loadClass()` mal réécrit peut casser la délégation parent-first et charger deux fois la même classe dans des chargeurs différents — la JVM les traite alors comme des types **incompatibles**, même s'ils partagent le même nom et le même bytecode.

### À retenir

- Le pipeline est : source → bytecode (`.class`) → chargement/liaison → **initialisation** (usage actif) → exécution (interprétée puis compilée à la volée).
- Trois chargeurs standard : bootstrap (natif, `java.base`), platform (reste du JDK), application (classpath/module-path) — avec délégation **parent-first**.
- `ClassNotFoundException` = échec d'un chargement explicite (checked) ; `NoClassDefFoundError` = classe introuvable au runtime alors qu'elle existait à la compilation (unchecked).
- Un chargeur personnalisé sert à isoler des versions de bibliothèques, charger des plugins, ou recharger du code à chaud — en respectant la délégation vers son parent.
- `-verbose:class` (ou `-Xlog:class+load=info`) et `jcmd VM.class_hierarchy` permettent d'observer concrètement le chargement.
