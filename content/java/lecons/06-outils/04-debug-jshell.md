---
id: debug-jshell
chapitre: outils
ordre: 4
titre: "Déboguer et expérimenter"
termes:
  - terme: "Point d'arrêt (breakpoint)"
    definition: "Marqueur posé sur une ligne de code qui suspend l'exécution du programme dès qu'elle est atteinte, tant que le débogueur de l'IDE est attaché. Permet d'inspecter l'état exact du programme à cet instant."
  - terme: "Pas à pas (step over / step into / step out)"
    definition: "Trois façons d'avancer une fois suspendu sur un point d'arrêt : **step over** exécute la ligne sans entrer dans les méthodes appelées, **step into** entre dans la méthode appelée pour la suivre ligne à ligne, **step out** termine la méthode courante et remonte à l'appelant."
  - terme: "Point d'arrêt conditionnel"
    definition: "Point d'arrêt qui ne suspend l'exécution que si une expression booléenne donnée est vraie (ex. `produit.getPrix() > 1000`). Évite de s'arrêter manuellement des dizaines de fois dans une boucle avant d'atteindre le cas qui intéresse."
  - terme: "Pile d'appels (stack trace)"
    definition: "Liste ordonnée des appels de méthode en cours au moment d'une exception ou d'un arrêt sur point d'arrêt, du plus récent (en haut) à `main` (en bas). Lire une pile d'appels permet de remonter jusqu'à la ligne de code responsable."
  - terme: "Niveau de journalisation"
    definition: "Catégorie de gravité d'un message de log (par exemple `DEBUG`, `INFO`, `WARN`, `ERROR`), qui permet de filtrer ce qui s'affiche sans modifier le code, contrairement à `System.out.println`."
  - terme: jshell
    definition: "Outil en ligne de commande (« REPL », *Read-Eval-Print Loop*) livré avec le JDK depuis Java 9. Il évalue des expressions et instructions Java une par une, sans créer de projet ni compiler de classe complète — idéal pour tester rapidement une API."
quiz:
  - question: "Une méthode lève cette exception. D'après le message, que s'est-il passé ?"
    code: |
      Exception in thread "main" java.lang.NullPointerException:
          Cannot invoke "String.length()" because "nom" is null
              at com.boutique.ClientService.valider(ClientService.java:14)
              at com.boutique.Main.main(Main.java:7)
    choix:
      - "La méthode `length()` de la classe `String` contient un bug"
      - "La variable `nom` valait `null` au moment de l'appel à `.length()`, à la ligne 14 de `ClientService`"
      - "Le fichier `ClientService.java` ne compile pas"
      - "La méthode `main` a été appelée avec un argument manquant"
    reponse: 1
    explication: "Depuis Java 14 (activé par défaut à partir de Java 15), les messages de `NullPointerException` précisent quelle variable était nulle et quel appel a échoué : ici, `nom` valait `null` quand `ClientService.valider`, ligne 14, a tenté d'appeler `.length()` dessus. La pile d'appels indique aussi que cette méthode a été atteinte depuis `Main.main`, ligne 7."
  - question: "Dans jshell, que se passe-t-il quand on tape une expression sans point-virgule et sans l'affecter à une variable ?"
    code: |
      jshell> 2 + 2
    choix:
      - "jshell refuse la commande : un point-virgule est obligatoire"
      - "jshell évalue l'expression, l'affecte automatiquement à une variable implicite (`$1`) et affiche son type et sa valeur"
      - "jshell l'ignore silencieusement, seules les instructions avec point-virgule sont exécutées"
      - "jshell ouvre un éditeur pour compléter l'expression"
    reponse: 1
    explication: "jshell est justement conçu pour expérimenter vite : le point-virgule final est optionnel pour une expression simple, qui est évaluée immédiatement. Le résultat est stocké dans une variable générée automatiquement (`$1`, `$2`…), réutilisable dans les lignes suivantes, avec son type affiché."
  - question: "À quoi sert un point d'arrêt conditionnel plutôt qu'un point d'arrêt classique, dans une boucle qui traite des centaines de commandes ?"
    choix:
      - "Il s'exécute plus vite qu'un point d'arrêt classique"
      - "Il permet de ne suspendre l'exécution que lorsqu'une condition précise est vraie, sans reprendre manuellement l'exécution à chaque itération pour atteindre le cas recherché"
      - "Il remplace complètement le besoin d'inspecter les variables"
      - "Il modifie automatiquement le code pour corriger le bug détecté"
    reponse: 1
    explication: "Sans condition, un point d'arrêt posé dans une boucle suspend l'exécution à **chaque** itération : il faudrait relancer manuellement des centaines de fois pour atteindre le cas problématique. Une condition (ex. `commande.getId() == 42`) filtre directement les arrêts sur le seul cas qui intéresse."
---

## Essentiel

Le **débogueur** de l'IDE permet d'observer un programme en train de s'exécuter, au lieu de deviner ce qu'il fait à partir du code seul. On pose un **point d'arrêt** (clic dans la marge, à gauche du numéro de ligne) : l'exécution se suspend dès que cette ligne est atteinte, et le panneau de variables affiche l'état exact du programme à cet instant.

Une fois suspendu, trois actions permettent d'avancer :

- **step over** — exécute la ligne courante sans entrer dans les méthodes appelées ;
- **step into** — entre dans la méthode appelée, pour la suivre ligne à ligne ;
- **step out** — termine la méthode courante et remonte à l'appelant.

Un **point d'arrêt conditionnel** ne suspend l'exécution que si une expression est vraie — utile dans une boucle pour atteindre directement le cas qui pose problème. La plupart des IDE permettent aussi d'**évaluer une expression** arbitraire pendant la pause, sans modifier le code.

Quand une exception remonte jusqu'à la console, la **pile d'appels** (*stack trace*) indique où elle a été levée et par quelle chaîne d'appels. Enfin, **jshell**, livré avec le JDK, permet de tester une expression ou une API en quelques secondes, sans créer de projet :

```
$ jshell
jshell> List.of(1, 2, 3).stream().mapToInt(i -> i).sum()
$1 ==> 6
```

## Détail

### Comment ça marche

Le débogueur d'un IDE attache un agent à la JVM lancée (via le protocole JDWP) et communique avec elle pour suspendre les threads, lire les variables locales et le tas, et piloter l'exécution pas à pas. Les raccourcis clavier exacts varient d'un IDE à l'autre (IntelliJ, Eclipse, VS Code) : gardez en tête les quatre actions — arrêter, avancer d'une ligne, entrer dans une méthode, sortir — plutôt qu'une combinaison de touches précise.

### Exemple 1 — Inspecter l'état à un point d'arrêt

```java
public double calculerTotal(Commande commande) {
    double total = 0;
    for (LigneCommande ligne : commande.getLignes()) {   // ← point d'arrêt ici
        total += ligne.getPrixUnitaire() * ligne.getQuantite();
    }
    return total;
}
```

En posant le point d'arrêt sur la ligne du `for`, chaque passage dans la boucle permet d'inspecter `ligne`, `total` et `commande` dans le panneau de variables, sans ajouter le moindre `System.out.println` temporaire dans le code.

### Exemple 2 — Un point d'arrêt conditionnel

Sur la même ligne, une condition comme `ligne.getQuantite() > 100` ne suspend l'exécution que pour la ligne de commande qui dépasse ce seuil, au lieu de s'arrêter à chaque itération d'une boucle qui en compte des centaines.

### Exemple 3 — Lire une pile d'appels

```
Exception in thread "main" java.lang.ArithmeticException: / by zero
    at com.boutique.CalculPrix.appliquerRemise(CalculPrix.java:22)
    at com.boutique.CommandeService.calculerTotal(CommandeService.java:15)
    at com.boutique.Main.main(Main.java:9)
```

La pile se lit du haut vers le bas : le type et le message d'exception en première ligne, puis la méthode où elle a été levée (`CalculPrix.appliquerRemise`, ligne 22), suivie de la chaîne d'appels qui y a mené. Cherchez d'abord la première ligne qui pointe vers **votre propre code** (ici, tout est dans `com.boutique`) : c'est le point de départ le plus utile pour comprendre le bug. Quand la pile contient plusieurs sections `Caused by:`, la cause la plus profonde (la dernière) est en général la véritable origine du problème.

### Exemple 4 — jshell pour expérimenter une API

```
$ jshell
jshell> String texte = "Boutique en ligne"
texte ==> "Boutique en ligne"

jshell> texte.toUpperCase()
$2 ==> "BOUTIQUE EN LIGNE"

jshell> import java.time.LocalDate
jshell> LocalDate.now().plusDays(30)
$3 ==> 2026-10-16

jshell> /vars
|    String texte = "Boutique en ligne"
|    String $2 = "BOUTIQUE EN LIGNE"
|    LocalDate $3 = 2026-10-16

jshell> /exit
```

jshell importe déjà par défaut plusieurs packages usuels (`java.util.*`, `java.io.*`, `java.nio.file.*`, `java.util.stream.*`, `java.util.function.*`, entre autres), ce qui évite souvent d'écrire un `import` pour tester rapidement une classe courante.

### Quelques commandes jshell utiles

| Commande | Effet |
|---|---|
| `/vars` | Liste les variables définies dans la session |
| `/methods` | Liste les méthodes définies dans la session |
| `/imports` | Liste les imports actifs (y compris ceux par défaut) |
| `/list` | Affiche l'historique des instructions saisies |
| `/edit` | Ouvre un éditeur externe pour une saisie multi-lignes |
| `/open fichier.jsh` | Charge et exécute un script jshell |
| `/exit` | Quitte jshell |

### `System.out.println` ou une vraie API de journalisation ?

| | `System.out.println` | API de journalisation (`java.util.logging`, ou SLF4J + Logback en pratique) |
|---|---|---|
| Filtrage par gravité | Impossible : tout s'affiche ou rien | Oui, par niveau (ex. `DEBUG`, `INFO`, `WARN`, `ERROR`) |
| Désactiver sans recompiler | Non | Oui, via la configuration |
| Destination | Console uniquement | Console, fichier, système distant, selon la configuration |
| Contexte utile en prod | Aucun (pas d'horodatage, pas de classe d'origine) | Horodatage, nom de la classe/thread, niveau, inclus automatiquement |

`System.out.println` reste très utile pour un test rapide et local ; une vraie application utilise une API de journalisation dès qu'il faut distinguer un diagnostic de développement d'une alerte à surveiller en production.

### Pièges courants

> **Enchaîner les `System.out.println("ici1")`, `println("ici2")`… pour localiser un bug.** Ça marche, mais c'est lent et il faut penser à tout retirer ensuite (et on en oublie toujours un). Un point d'arrêt donne la même information, sans modifier le code et sans rien à nettoyer après coup.

> **Confondre step over et step into face à un appel de méthode suspect.** Rester en step over saute par-dessus la méthode qui contient peut-être le bug ; si l'erreur semble provenir d'un appel précis, il faut délibérément faire step into pour y entrer.

> **Lire une pile d'appels de bas en haut.** Le bas de la pile (souvent `main`) montre seulement le point d'entrée du programme, pas la cause du problème. Commencez toujours par le haut : le type d'exception, son message, puis la première ligne qui appartient à votre propre code.

### À retenir

- Point d'arrêt + step over/into/out permettent d'observer un programme sans y ajouter de code temporaire.
- Un point d'arrêt conditionnel cible directement le cas recherché dans une boucle, sans arrêts répétés inutiles.
- Une pile d'appels se lit du haut (l'exception) vers le bas, en cherchant la première ligne de son propre code.
- `System.out.println` dépanne vite en local ; une API de journalisation avec niveaux est nécessaire dès qu'il s'agit de code destiné à tourner en production.
- jshell permet de tester une API ou une expression Java en quelques secondes, sans créer de projet — un excellent outil d'apprentissage au quotidien.
