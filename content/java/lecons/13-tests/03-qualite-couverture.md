---
id: qualite-couverture
chapitre: tests-qualite
ordre: 3
titre: "Qualité du code"
termes:
  - terme: JaCoCo
    definition: "Outil de couverture de code pour Java : instrumente les classes pendant l'exécution des tests pour mesurer quelles lignes et quelles branches ont réellement été exécutées, puis produit un rapport (HTML, XML). S'intègre à Maven via le plugin `jacoco-maven-plugin`."
  - terme: Couverture de branches
    definition: "Mesure plus fine que la couverture de lignes : elle vérifie que **chaque issue possible** d'une condition (`if`/`else`, opérateur ternaire, `switch`) a été empruntée au moins une fois, et pas seulement que la ligne qui la contient a été exécutée une fois par un seul chemin."
  - terme: SpotBugs
    definition: "Analyse statique qui inspecte le bytecode compilé pour détecter des schémas d'erreurs classiques : `NullPointerException` probable, comparaison incorrecte (`==` sur des objets), ressource non fermée… Successeur du projet historique FindBugs."
  - terme: PMD
    definition: "Analyse statique du code source Java : détecte du code mort, des méthodes trop complexes, des variables inutilisées, des choix de conception discutables. Configurable par un jeu de règles (« ruleset »)."
  - terme: Checkstyle
    definition: "Vérifie le respect de conventions de formatage et de style (indentation, nommage, longueur de ligne, ordre des imports…), pas la logique du code. Souvent branché en intégration continue pour imposer un style homogène sans débat."
  - terme: SonarQube
    definition: "Plateforme qui centralise les résultats d'analyse statique (bugs, vulnérabilités, « code smells »), la couverture de tests et une estimation de dette technique, avec un historique dans le temps et un seuil de qualité (« quality gate ») qui peut bloquer une intégration."
  - terme: Dette technique
    definition: "Coût futur induit par un choix de conception rapide ou imparfait pris aujourd'hui : raccourci, duplication, absence de tests. Elle se rembourse par du refactoring, rendu sûr par une suite de tests qui détecte toute régression introduite en chemin."
  - terme: "Test instable (flaky test)"
    definition: "Test qui passe ou échoue de façon imprévisible sans qu'aucun changement du code testé ne l'explique, typiquement à cause d'une dépendance au temps réel, à l'ordre d'exécution des tests, ou à une concurrence mal maîtrisée. Mine la confiance dans toute la suite de tests."
quiz:
  - question: "Un seul test couvre cette méthode. Que va montrer un rapport JaCoCo ?"
    code: |
      double calculerReduction(boolean clientFidele) {
          double reduction = clientFidele ? 0.1 : 0.0;
          return reduction;
      }

      @Test
      void reduction_pour_client_fidele() {
          Assertions.assertEquals(0.1, service.calculerReduction(true));
      }
    choix:
      - "100% en couverture de lignes ET 100% en couverture de branches : les deux mesures sont équivalentes"
      - "100% en couverture de lignes (chaque ligne a été exécutée), mais une couverture de branches incomplète : le cas `clientFidele == false` de l'opérateur ternaire n'a jamais été emprunté"
      - "0% dans les deux cas, car un seul test ne suffit jamais à générer un rapport"
      - "Une erreur de compilation : JaCoCo exige un test par branche possible pour fonctionner"
    reponse: 1
    explication: "La couverture de lignes compte une ligne comme exécutée dès qu'un des chemins qui la traverse l'a atteinte — ici la ligne du `reduction ? ... : ...` s'exécute bien, donc 100%. La couverture de branches est plus fine : elle distingue les deux issues du ternaire, et signale que seule la branche `true` a été empruntée. C'est exactement pour cette nuance qu'un « 100% de couverture » affiché sans préciser lignes ou branches peut cacher des chemins jamais testés."
  - question: "Une revue signale une méthode qui compare deux `String` avec `==` plutôt qu'avec `.equals(...)`, un piège classique. Quel type d'outil a le plus de chances de l'avoir détecté avant la revue humaine ?"
    choix:
      - "Checkstyle, qui vérifie le formatage du code"
      - "Un analyseur statique comme SpotBugs ou PMD, qui reconnaît des schémas d'erreurs connus dans le code"
      - "JaCoCo, qui mesure la couverture des tests"
      - "Rien ne peut détecter ce genre d'erreur avant l'exécution"
    reponse: 1
    explication: "SpotBugs et PMD sont conçus pour reconnaître des schémas d'erreurs réputés (comparaison d'objets avec `==`, ressource non fermée, boucle infinie probable…) sans exécuter le code. Checkstyle ne regarde que le style et la mise en forme, pas la logique. JaCoCo mesure seulement si du code a été exécuté par les tests, pas s'il est correct."
  - question: "Un test échoue environ une fois sur dix en intégration continue, sans qu'aucun changement de code ne l'explique. Quelle est la cause la plus probable ?"
    choix:
      - "Une dépendance cachée à l'ordre d'exécution des tests, à l'heure système, ou à une opération concurrente mal synchronisée"
      - "Un bug du compilateur Java, qui génère un bytecode légèrement différent à chaque build"
      - "Une erreur de configuration Maven qui recompile une partie aléatoire du projet"
      - "Le matériel du serveur d'intégration continue, jamais le code du test lui-même"
    reponse: 0
    explication: "Un test instable (« flaky ») a presque toujours une cause précise et reproductible en creusant : un état partagé entre tests qui dépend de l'ordre d'exécution, une valeur dépendant de `LocalDateTime.now()` ou de l'horloge système, ou une assertion faite trop tôt sur un traitement asynchrone. Le relancer jusqu'à ce qu'il passe masque le problème au lieu de le corriger."
---

## Essentiel

Écrire des tests ne suffit pas à garantir la qualité d'un code : encore faut-il savoir ce que les tests couvrent vraiment, et détecter les problèmes qu'aucun test ne verra jamais (style incohérent, schémas d'erreurs connus, complexité excessive).

**JaCoCo** mesure la couverture de code : quelles lignes, et plus finement quelles branches conditionnelles, ont été exécutées par la suite de tests.

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.15</version>
    <executions>
        <execution><goals><goal>prepare-agent</goal></goals></execution>
        <execution><id>report</id><phase>test</phase><goals><goal>report</goal></goals></execution>
    </executions>
</plugin>
```

Un pourcentage de couverture élevé ne garantit pas des tests utiles : un test qui appelle une méthode sans la moindre assertion la couvre à 100% sans rien vérifier. La couverture indique ce qui n'est **pas** testé (un signal fiable), pas la qualité de ce qui l'est. **100% n'est pas un objectif en soi** — mieux vaut une couverture plus faible mais concentrée sur la logique métier et les cas limites qu'une couverture totale obtenue en testant des getters.

À côté des tests, l'**analyse statique** (SpotBugs, PMD, Checkstyle, SonarQube) détecte des problèmes sans exécuter le code : schémas d'erreurs connus, complexité excessive, style incohérent.

## Détail

### Exemple 1 — Un test qui ne teste rien

```java
@Test
void calculerReduction_ne_plante_pas() {
    service.calculerReduction(true); // aucune assertion
}
```

Ce test fait grimper la couverture de lignes de `calculerReduction` sans vérifier le moindre résultat : il passera toujours, même si la méthode renvoie n'importe quoi. La couverture mesure l'**exécution**, jamais la **vérification** — un rapport à 100% peut cacher des tests de ce genre.

### Exemple 2 — Quatre outils, quatre rôles

```java
// SpotBugs signale ce genre de piège au niveau du bytecode
if (statut == "CONFIRMEE") { ... }   // comparaison d'objets avec ==

// PMD signale des soucis de conception dans le code source
public void traiter() {
    if (a) { if (b) { if (c) { if (d) { /* méthode trop complexe */ } } } }
}

// Checkstyle signale un style incohérent, pas un bug
public void  traiter( Produit p ){    // espacement, accolade, etc.
```

| Outil | Analyse | Détecte typiquement |
|---|---|---|
| JaCoCo | Bytecode exécuté pendant les tests | Ce qui n'a jamais été exécuté |
| SpotBugs | Bytecode compilé | Schémas d'erreurs classiques (`NullPointerException` probable, ressource non fermée…) |
| PMD | Code source | Code mort, méthodes trop complexes, choix de conception discutables |
| Checkstyle | Code source | Formatage, nommage, conventions d'écriture |
| SonarQube | Agrège les analyses ci-dessus + la couverture | Vue d'ensemble dans le temps, seuil de qualité (« quality gate ») |

### Exemple 3 — Ce qu'un formateur automatique évite en revue

Un formateur (intégré à l'IDE ou lancé en intégration continue) applique une convention commune — indentation, imports, longueur de ligne — **avant** que le code arrive en revue. Cela évite des allers-retours sur des détails déjà tranchés par un outil, et recentre la revue humaine sur ce qu'un outil ne peut pas juger : la logique métier a-t-elle du sens, les cas limites sont-ils couverts, le nom des méthodes reflète-t-il vraiment leur rôle, les tests ajoutés vérifient-ils quelque chose d'utile.

### Dette technique et refactoring outillé par les tests

La dette technique s'accumule silencieusement : un raccourci pris pour livrer plus vite, une duplication qu'on se promet de factoriser « plus tard », une classe qui a grossi bien au-delà de sa responsabilité initiale. Elle ne casse rien dans l'immédiat, mais ralentit chaque modification suivante.

La rembourser suppose de **refactorer** — changer la structure du code sans changer son comportement. Sans tests, chaque refactoring est un pari : rien ne dit que le comportement observable est resté identique. Une suite de tests qui couvre la logique métier transforme ce pari en geste sûr : elle échoue immédiatement si le refactoring a changé un résultat, ce qui autorise à avancer avec confiance.

### Tests instables (flaky tests)

Un test instable échoue parfois, sans lien avec une régression réelle. Trois causes reviennent le plus souvent :

- **Dépendance au temps** : un test qui compare un résultat à `LocalDateTime.now()` obtenu à un instant légèrement différent, ou qui suppose qu'une opération dure toujours moins d'une milliseconde.
- **Dépendance à l'ordre d'exécution** : un test qui suppose qu'un état laissé par un test précédent (champ statique, fichier, ligne en base) est encore présent — fragile dès que l'ordre change ou que les tests s'exécutent en parallèle.
- **Concurrence mal maîtrisée** : une assertion faite avant qu'un traitement asynchrone ait réellement terminé, ou une ressource partagée entre threads sans synchronisation.

Dans les trois cas, la correction porte sur la cause réelle (isoler l'horloge, réinitialiser l'état à chaque test, attendre une condition plutôt qu'un délai fixe) — jamais sur le simple fait de relancer le test jusqu'à ce qu'il passe.

### Intégration continue : ce qu'on y lance, et dans quel ordre

Le principe : les vérifications les moins chères et les plus rapides d'abord, pour échouer vite en cas de problème simple.

| Ordre | Étape | Pourquoi à cet endroit |
|---|---|---|
| 1 | Compilation | Rien d'autre n'a de sens si le code ne compile pas |
| 2 | Tests unitaires | Rapides (millisecondes), ciblent la logique métier |
| 3 | Analyse statique (SpotBugs, PMD, Checkstyle) | Rapide, ne dépend pas de l'exécution |
| 4 | Couverture (JaCoCo) et seuil de qualité | Nécessite les résultats des tests de l'étape 2 |
| 5 | Tests d'intégration, packaging | Plus lents (base de données, réseau), lancés en dernier |

### Pièges courants

> **Viser 100% de couverture comme objectif en soi.** Le chiffre ne dit rien de la pertinence des assertions, et pousse à tester des getters triviaux au lieu de creuser les cas limites de la logique métier — là où se cachent réellement les bugs.

> **Confondre couverture de lignes et couverture de branches.** Une couverture de lignes élevée peut masquer des branches conditionnelles jamais empruntées (voir l'exemple du ternaire ci-dessus). Un rapport JaCoCo distingue les deux : toujours vérifier laquelle est citée.

> **Relancer un test instable jusqu'à ce qu'il passe.** Cela masque une cause réelle (dépendance au temps, à l'ordre, à la concurrence) au lieu de la corriger, et habitue l'équipe à ignorer les échecs — jusqu'à ignorer un vrai échec.

### À retenir

- JaCoCo mesure ce qui a réellement été exécuté ; la couverture de branches est plus exigeante que la couverture de lignes, et 100% n'est jamais un objectif en soi.
- SpotBugs et PMD analysent le code à la recherche de bugs et de choix de conception discutables ; Checkstyle vérifie le style ; SonarQube agrège tout cela avec un historique et un seuil de qualité.
- La revue de code doit se concentrer sur ce qu'un outil ne peut pas juger : la logique métier, les cas limites, l'utilité réelle des tests ajoutés.
- Une suite de tests solide est ce qui rend le refactoring — et donc le remboursement de la dette technique — sûr.
- Un test instable (temps, ordre, concurrence) se corrige à la racine ; l'intégration continue enchaîne les vérifications de la plus rapide à la plus lente.
