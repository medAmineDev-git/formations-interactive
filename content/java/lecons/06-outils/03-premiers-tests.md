---
id: premiers-tests
chapitre: outils
ordre: 3
titre: "Écrire ses premiers tests"
termes:
  - terme: "JUnit Jupiter"
    definition: "Le moteur de test le plus utilisé en Java (`org.junit.jupiter.api`), toujours désigné dans l'usage courant par son ancien nom de version, « JUnit 5 ». Depuis septembre 2025, il est distribué sous une version unifiée avec le reste du projet : **JUnit 6** (actuellement 6.1.3, nécessite Java 17+)."
  - terme: "@Test"
    definition: "Annotation qui marque une méthode comme un test exécutable. La méthode doit être publique ou package-private, sans paramètre, et ne rien renvoyer (`void`)."
  - terme: Assertion
    definition: "Instruction qui vérifie qu'une valeur correspond à ce qui est attendu, et fait échouer le test sinon. `Assertions.assertEquals(attendu, resultat)` est la plus courante ; toute la classe `Assertions` s'importe statiquement en pratique."
  - terme: "Arrange / Act / Assert"
    definition: "Structure en trois temps d'un test : préparer les données et objets nécessaires, appeler le code testé, puis vérifier le résultat. Rend chaque test lisible même sans commentaire."
  - terme: "@BeforeEach / @AfterEach"
    definition: "Méthodes exécutées automatiquement avant (ou après) **chaque** test de la classe. Utile pour préparer un état commun et éviter de dupliquer la même initialisation dans chaque test."
  - terme: assertThrows
    definition: "Vérifie qu'un bloc de code lève bien une exception d'un type donné, et renvoie cette exception pour en inspecter le message. `assertThrows(TypeException.class, () -> code())`."
quiz:
  - question: "Que se passe-t-il si cette assertion échoue ?"
    code: |
      @Test
      void calculerRemise() {
          double resultat = new CalculPrix().appliquerRemise(100.0, 10);

          Assertions.assertEquals(90.0, resultat);
      }
    choix:
      - "Le test s'arrête avec succès, l'échec est seulement journalisé"
      - "Le test échoue, et le rapport affiche l'attendu (`90.0`) et le résultat obtenu"
      - "Une `NullPointerException` est levée car `assertEquals` ne gère pas les `double`"
      - "Le programme entier s'arrête immédiatement, y compris les autres classes de test"
    reponse: 1
    explication: "Une assertion qui échoue lève une `AssertionError` interceptée par le framework de test : ce test précis est marqué en échec, avec l'attendu et le résultat obtenu dans le rapport, mais les autres tests continuent de s'exécuter normalement. Notez l'ordre des arguments : `assertEquals(attendu, resultat)`, l'inverse ne casse rien à la compilation mais inverse le message d'erreur."
  - question: "Pourquoi teste-t-on ce comportement avec `assertThrows` plutôt qu'en entourant l'appel d'un `try/catch` manuel ?"
    code: |
      @Test
      void trouver_leve_une_exception_si_produit_absent() {
          ProduitService service = new ProduitService(depot);

          assertThrows(ProduitIntrouvableException.class,
              () -> service.trouver(99L));
      }
    choix:
      - "`assertThrows` est plus rapide à l'exécution qu'un `try/catch`"
      - "Un `try/catch` manuel ne peut pas contenir d'appel de méthode"
      - "`assertThrows` fait échouer le test si aucune exception n'est levée ; un `try/catch` vide laisserait ce cas passer silencieusement en succès"
      - "`assertThrows` ne fonctionne qu'avec des exceptions non vérifiées"
    reponse: 2
    explication: "Avec un `try/catch` écrit à la main, si le code ne lève finalement plus d'exception (par exemple après une régression), le `catch` ne s'exécute simplement pas et le test passe alors qu'il devrait échouer. `assertThrows` échoue explicitement si aucune exception du type attendu n'est levée : c'est le cas qu'on veut vraiment couvrir."
  - question: "À quoi sert `@BeforeEach` dans une classe de test comportant plusieurs méthodes `@Test` ?"
    choix:
      - "À exécuter une seule fois, avant le premier test de la classe"
      - "À exécuter avant chaque test, pour repartir d'un état initial commun et éviter la duplication"
      - "À définir l'ordre d'exécution des tests"
      - "À ignorer certains tests pendant le développement"
    reponse: 1
    explication: "`@BeforeEach` s'exécute avant **chaque** méthode `@Test` de la classe : c'est l'endroit idéal pour recréer l'objet testé ou réinitialiser des données, afin qu'un test ne dépende jamais de l'état laissé par un précédent. Pour une exécution unique avant tous les tests, JUnit propose `@BeforeAll` (méthode statique)."
---

## Essentiel

Un test unitaire vérifie automatiquement qu'un bout de code se comporte comme prévu, sans repasser à la main par l'application entière. **JUnit Jupiter** (ce qu'on appelle encore « JUnit 5 » par habitude, aujourd'hui distribué sous la version unifiée **JUnit 6**) est le moteur de test standard en Java :

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>6.1.3</version>
    <scope>test</scope>
</dependency>
```

Un test se structure en trois temps : **Arrange** (préparer), **Act** (appeler), **Assert** (vérifier) :

```java
class CalculPrixTest {

    @Test
    @DisplayName("Une remise de 10% réduit bien le total")
    void appliquerRemise() {
        CalculPrix calcul = new CalculPrix();              // Arrange

        double resultat = calcul.appliquerRemise(100.0, 10); // Act

        Assertions.assertEquals(90.0, resultat);            // Assert
    }
}
```

`@Test` marque la méthode comme exécutable par le moteur de test. `@DisplayName` donne un nom lisible affiché dans les rapports. `@BeforeEach`/`@AfterEach` préparent ou nettoient un état commun avant/après chaque test. Pour vérifier qu'une exception est bien levée, on utilise `assertThrows` plutôt qu'un `try/catch` manuel, qui laisserait passer silencieusement l'absence d'exception.

## Détail

### Pourquoi c'est utile

Un test automatisé se relance en quelques millisecondes, autant de fois que nécessaire, sans intervention humaine : il détecte immédiatement une régression introduite par une modification ultérieure. Sans tests, la seule façon de vérifier qu'un changement n'a rien cassé est de tout reparcourir manuellement — ce qui devient vite impraticable à mesure que le projet grossit.

### Exemple 1 — Un premier test complet

```java
class CalculPrixTest {

    private CalculPrix calcul;

    @BeforeEach
    void initialiser() {
        calcul = new CalculPrix();
    }

    @Test
    void appliquerRemise_reduit_le_total() {
        double resultat = calcul.appliquerRemise(100.0, 10);

        Assertions.assertEquals(90.0, resultat);
    }

    @Test
    void appliquerRemise_sans_remise_ne_change_rien() {
        double resultat = calcul.appliquerRemise(50.0, 0);

        Assertions.assertEquals(50.0, resultat);
    }
}
```

`@BeforeEach` recrée `calcul` avant chaque test : les deux tests ne partagent jamais un état modifié par l'un d'eux.

### Exemple 2 — Tester une exception

```java
@Test
void appliquerRemise_refuse_un_pourcentage_negatif() {
    CalculPrix calcul = new CalculPrix();

    IllegalArgumentException ex = assertThrows(
        IllegalArgumentException.class,
        () -> calcul.appliquerRemise(100.0, -5)
    );

    Assertions.assertEquals("Le pourcentage ne peut pas être négatif", ex.getMessage());
}
```

`assertThrows` renvoie l'exception capturée, ce qui permet d'aller plus loin et de vérifier aussi son message.

### Exemple 3 — Nettoyer une ressource après chaque test

```java
class ExportServiceTest {

    private Path fichierTemporaire;

    @BeforeEach
    void creerFichier() throws IOException {
        fichierTemporaire = Files.createTempFile("export", ".csv");
    }

    @AfterEach
    void supprimerFichier() throws IOException {
        Files.deleteIfExists(fichierTemporaire);
    }

    @Test
    void exporter_ecrit_une_ligne_par_produit() throws IOException {
        new ExportService().exporter(List.of(new Produit("Clavier", 49.90)), fichierTemporaire);

        Assertions.assertTrue(Files.readString(fichierTemporaire).contains("Clavier"));
    }
}
```

`@AfterEach` garantit que le fichier temporaire est supprimé même si le test échoue en cours de route.

### Lancer les tests

| Où | Commande / action |
|---|---|
| En ligne de commande (Maven) | `mvn test` — exécute automatiquement tous les tests du projet à la phase `test` |
| Dans l'IDE | Bouton ▶ dans la marge, à côté de la méthode ou de la classe de test |
| Un seul test en Maven | `mvn test -Dtest=CalculPrixTest#appliquerRemise_reduit_le_total` |

### Nommer ses tests et choisir quoi tester

- Classe de test : nom de la classe testée + `Test` (`CalculPrix` → `CalculPrixTest`).
- Méthode de test : un nom qui décrit le scénario et le résultat attendu, par exemple `appliquerRemise_refuse_un_pourcentage_negatif`, plutôt que `test1`.
- Priorité : la **logique métier** (calculs, règles, cas limites, gestion d'erreur) — c'est elle qui casse silencieusement lors d'une modification. Inutile de tester un simple getter/setter généré, ou le fonctionnement du JDK lui-même.

### Pièges courants

> **Inverser l'ordre des arguments de `assertEquals`.** La signature est `assertEquals(attendu, resultat)`. L'inverser ne casse pas la compilation, mais rend le message d'erreur trompeur en cas d'échec (« expected X but was Y » affichera l'inverse de la réalité).

> **Un test qui dépend de l'ordre d'exécution des autres.** Par défaut, JUnit ne garantit pas d'ordre entre les méthodes de test. Un test qui suppose qu'un précédent a déjà modifié un état partagé est fragile ; `@BeforeEach` doit toujours ramener un état neuf et indépendant.

> **Oublier de tester le cas d'erreur.** Un test qui ne couvre que le chemin « tout se passe bien » laisse passer les régressions sur la validation, les cas limites (liste vide, valeur nulle) ou la gestion d'exception — souvent l'endroit où se cachent les vrais bugs.

### À retenir

- JUnit Jupiter (« JUnit 5 », désormais versionné sous JUnit 6) est le moteur de test standard en Java, dépendance en `scope test`.
- Un test suit la structure Arrange / Act / Assert : préparer, appeler, vérifier.
- `@BeforeEach`/`@AfterEach` évitent de dupliquer l'initialisation et le nettoyage entre tests.
- `assertThrows` vérifie qu'une exception est bien levée, et permet d'inspecter son message.
- Ce chapitre couvre les bases ; pour les tests paramétrés, les doublons de test avec Mockito et la couverture de code, direction le chapitre « Tests et qualité ».
