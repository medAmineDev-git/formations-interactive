---
id: junit-avance
chapitre: tests-qualite
ordre: 1
titre: "JUnit en profondeur"
termes:
  - terme: "@TestInstance"
    definition: "Configure la façon dont JUnit instancie la classe de test : `PER_METHOD` (défaut) crée une nouvelle instance avant chaque méthode `@Test` ; `PER_CLASS` crée une seule instance partagée pour toute la classe. En mode `PER_CLASS`, `@BeforeAll`/`@AfterAll` n'ont plus besoin d'être `static`."
  - terme: assertAll
    definition: "Regroupe plusieurs assertions indépendantes. Contrairement à des assertions successives où la première échouée interrompt le test, `assertAll` exécute toutes les vérifications et rapporte **tous** les échecs ensemble."
  - terme: "@ParameterizedTest"
    definition: "Exécute la même méthode de test plusieurs fois, avec un jeu de données différent à chaque fois. La source des données est précisée par une annotation complémentaire : `@ValueSource`, `@CsvSource`, `@MethodSource` ou `@EnumSource`."
  - terme: "@Nested"
    definition: "Marque une classe interne (non statique) comme un groupe de tests imbriqué. Elle hérite du contexte de la classe englobante (`@BeforeEach`, champs) et sert à organiser des tests par scénario ou par état de l'objet testé."
  - terme: "@Tag"
    definition: "Étiquette un test ou une classe de test avec un nom libre (`\"lent\"`, `\"integration\"`…), afin de pouvoir sélectionner ou exclure un sous-ensemble de tests à l'exécution, par exemple depuis Maven Surefire."
  - terme: "@ExtendWith"
    definition: "Point d'entrée du mécanisme d'extensions de JUnit Jupiter : enregistre une classe qui peut intervenir dans le cycle de vie du test (injecter des paramètres, gérer des ressources…). C'est ce qui active Mockito (`MockitoExtension`) dans une classe de test."
  - terme: "@TempDir"
    definition: "Injecte un dossier temporaire (`Path` ou `File`) créé avant le test et supprimé automatiquement après, pour tester du code qui manipule des fichiers sans polluer le disque ni gérer soi-même le nettoyage."
  - terme: "AssertJ (assertThat)"
    definition: "Bibliothèque d'assertions fluides et chaînables (`assertThat(resultat).isEqualTo(...)`), qui se lit comme une phrase et propose de nombreuses méthodes dédiées (`hasSize`, `containsExactly`, `isEmpty`…). Nécessite la dépendance `assertj-core`."
quiz:
  - question: "Ce test échoue parce que le produit a un prix négatif ET un nom vide. Que rapporte le résultat du test ?"
    code: |
      @Test
      void champsDuProduit() {
          Produit produit = new Produit("", -5.0);

          Assertions.assertAll(
              () -> Assertions.assertTrue(produit.prix() >= 0, "prix négatif"),
              () -> Assertions.assertFalse(produit.nom().isBlank(), "nom vide")
          );
      }
    choix:
      - "Seul le premier échec (« prix négatif ») est rapporté, la seconde assertion n'est jamais évaluée"
      - "Les deux assertions sont évaluées, et le rapport d'échec liste les deux messages (« prix négatif » et « nom vide »)"
      - "Une erreur de compilation, car `assertAll` n'accepte pas plusieurs lambdas"
      - "Le test passe : `assertAll` ignore les échecs tant qu'au moins une assertion réussit"
    reponse: 1
    explication: "`assertAll` exécute toutes les assertions qu'on lui passe, même si l'une d'elles échoue, puis regroupe tous les échecs dans un seul rapport. C'est tout l'intérêt par rapport à des `assertTrue`/`assertFalse` écrits à la suite : sans `assertAll`, le premier échec interromprait le test et masquerait le second problème."
  - question: "Un test doit vérifier le comportement d'un service avec plusieurs `Produit` complets à construire (nom, prix, catégorie), pas de simples valeurs primitives. Quelle source de données choisir avec `@ParameterizedTest` ?"
    choix:
      - "`@ValueSource`, qui accepte des tableaux d'objets quelconques"
      - "`@CsvSource`, en encodant chaque champ de l'objet dans une colonne du CSV"
      - "`@MethodSource`, qui pointe vers une méthode statique renvoyant les objets déjà construits"
      - "`@EnumSource`, en déclarant chaque produit comme une constante d'énumération"
    reponse: 2
    explication: "`@ValueSource` se limite aux types primitifs, `String` et `Class`. `@CsvSource` fournit du texte, converti automatiquement vers des types simples, mais devient vite illisible pour un objet complexe. `@MethodSource` pointe vers une méthode statique qui renvoie directement les objets voulus (souvent un `Stream<Arguments>`) : c'est le seul mécanisme adapté à des objets construits par code. `@EnumSource` est réservé aux constantes d'une énumération existante."
  - question: "Pourquoi cette méthode `@BeforeAll` compile-t-elle sans être déclarée `static` ?"
    code: |
      @TestInstance(TestInstance.Lifecycle.PER_CLASS)
      class PanierServiceTest {

          private int appelsInitialisation = 0;

          @BeforeAll
          void initialiser() {
              appelsInitialisation++;
          }
      }
    choix:
      - "`@BeforeAll` n'a jamais besoin d'être statique en JUnit, quel que soit le mode"
      - "`@TestInstance(PER_CLASS)` fait qu'une seule instance de la classe de test est partagée entre toutes les méthodes, donc `@BeforeAll` peut être une méthode d'instance ordinaire"
      - "C'est une erreur qui ne sera détectée qu'à l'exécution du test"
      - "Le champ `appelsInitialisation` rend automatiquement la méthode valide sans `static`"
    reponse: 1
    explication: "Par défaut (`PER_METHOD`), JUnit crée une nouvelle instance de la classe de test avant chaque méthode `@Test` : `@BeforeAll`/`@AfterAll` doivent alors être `static`, car aucune instance commune n'existe pour les porter. `@TestInstance(PER_CLASS)` inverse ce choix et partage une seule instance entre tous les tests, ce qui autorise des méthodes non statiques — au prix d'une vigilance accrue sur l'état partagé entre les tests."
---

## Essentiel

La leçon précédente a posé les bases : `@Test`, `@BeforeEach`/`@AfterEach`, `assertThrows`. JUnit Jupiter va plus loin pour organiser et enrichir les tests.

Le cycle de vie complet ajoute `@BeforeAll` et `@AfterAll`, exécutés **une seule fois** pour toute la classe (pas avant/après chaque test) :

```java
@BeforeAll
static void connecterDepotDeTest() { /* une fois, avant tous les tests */ }

@BeforeEach
void reinitialiser() { /* avant chaque test */ }

@AfterAll
static void fermerDepotDeTest() { /* une fois, après tous les tests */ }
```

Par défaut, JUnit crée une **nouvelle instance de la classe pour chaque méthode de test** : `@BeforeAll`/`@AfterAll` doivent donc être `static`, puisqu'aucune instance commune n'existe pour les porter. `@TestInstance(Lifecycle.PER_CLASS)` inverse ce choix — une seule instance partagée — ce qui autorise des méthodes non statiques, mais impose de la vigilance sur l'état partagé entre tests.

Pour éviter de dupliquer des tests presque identiques, `@ParameterizedTest` exécute le même corps avec plusieurs jeux de données :

```java
@ParameterizedTest
@CsvSource({"100.0, 10, 90.0", "50.0, 0, 50.0"})
void appliquerRemise(double prix, int pourcentage, double attendu) {
    Assertions.assertEquals(attendu, new CalculPrix().appliquerRemise(prix, pourcentage));
}
```

`assertAll` regroupe plusieurs vérifications indépendantes et rapporte tous les échecs, pas seulement le premier. `@Nested` organise les tests par scénario, et **AssertJ** (`assertThat(...)`) apporte des assertions plus lisibles que celles de JUnit.

## Détail

### Exemple 1 — Cycle de vie complet et `@TestInstance`

```java
class ProduitServiceTest {

    static DepotTest depot;       // partagé, coûteux à créer

    @BeforeAll
    static void ouvrirDepot() {
        depot = new DepotTest();
    }

    @BeforeEach
    void viderDepot() {
        depot.vider();
    }

    @Test
    void enregistrer_ajoute_un_produit() {
        new ProduitService(depot).enregistrer(new Produit("Clavier", 49.90));

        Assertions.assertEquals(1, depot.compter());
    }

    @AfterAll
    static void fermerDepot() {
        depot.fermer();
    }
}
```

`@BeforeAll ouvrirDepot()` ne s'exécute qu'une fois, avant tous les tests de la classe — utile pour une ressource coûteuse à initialiser (ici simulée). `@BeforeEach viderDepot()` garantit malgré tout que chaque test reparte d'un dépôt vide.

### Exemple 2 — Assertions groupées et délai d'exécution

```java
@Test
void champsDuProduit() {
    Produit produit = service.trouver(1L);

    Assertions.assertAll(
        () -> Assertions.assertTrue(produit.prix() >= 0, "le prix ne peut pas être négatif"),
        () -> Assertions.assertFalse(produit.nom().isBlank(), "le nom ne peut pas être vide")
    );
}

@Test
void recherche_repond_rapidement() {
    Assertions.assertTimeout(Duration.ofSeconds(1), () -> service.rechercher("clavier"));
}
```

`assertTimeout` fait échouer le test si l'appel dépasse la durée donnée, mais **laisse le code s'exécuter jusqu'au bout** avant de rapporter l'échec — il ne l'interrompt pas. Pour couper réellement un appel bloqué, `assertTimeoutPreemptively` exécute le code dans un thread séparé et l'abandonne au dépassement du délai.

### Exemple 3 — Tests paramétrés : quatre sources de données

```java
@ParameterizedTest
@ValueSource(strings = {"", " ", "   "})
void enregistrer_refuse_un_nom_vide(String nom) {
    Assertions.assertThrows(IllegalArgumentException.class,
        () -> service.enregistrer(new Produit(nom, 10.0)));
}

@ParameterizedTest
@MethodSource("produitsValides")
void enregistrer_accepte_un_produit_valide(Produit produit) {
    Assertions.assertDoesNotThrow(() -> service.enregistrer(produit));
}

static Stream<Produit> produitsValides() {
    return Stream.of(new Produit("Clavier", 49.90), new Produit("Souris", 19.90));
}

@ParameterizedTest
@EnumSource(StatutCommande.class)
void toutStatut_a_un_libelle(StatutCommande statut) {
    Assertions.assertNotNull(statut.libelle());
}
```

| Source | Fournit | Bien adaptée à |
|---|---|---|
| `@ValueSource` | Un tableau de littéraux (`int`, `String`…) | Une seule valeur simple par cas |
| `@CsvSource` | Des lignes texte séparées par des virgules | Plusieurs valeurs simples par cas |
| `@MethodSource` | Le retour d'une méthode statique (`Stream`, `List`…) | Des objets construits par code, des cas complexes |
| `@EnumSource` | Les constantes d'une énumération | Parcourir tous les cas (ou un sous-ensemble) d'un `enum` |

### Exemple 4 — Organiser, nommer, sélectionner

```java
class PanierServiceTest {

    @Nested
    @DisplayName("Quand le panier est vide")
    class PanierVide {

        @Test
        void total_vaut_zero() {
            Assertions.assertEquals(0.0, new Panier().total());
        }
    }

    @Nested
    @DisplayName("Quand le panier contient des articles")
    class PanierAvecArticles {

        @Test
        @Tag("lent")
        void total_additionne_chaque_ligne() { /* ... */ }

        @Test
        @Disabled("en attente de la règle de remise multi-produits — JIRA-482")
        void applique_la_remise_par_palier() { /* ... */ }
    }
}
```

`@Nested` regroupe les tests par scénario (« panier vide » vs « panier avec articles »), chacun avec son propre `@DisplayName` lisible. `@Tag("lent")` permet d'exclure ces tests d'une exécution rapide (`mvn test -DexcludedGroups=lent`). `@Disabled` désactive un test ponctuellement — toujours avec une raison et, idéalement, un ticket de suivi.

### Extensions, dossier temporaire et AssertJ

`@ExtendWith(UneExtension.class)` enregistre une extension qui s'insère dans le cycle de vie du test : c'est le mécanisme générique derrière `MockitoExtension` (prochaine leçon). `@TempDir`, lui, est intégré à JUnit sans extension à déclarer — il injecte un dossier créé avant le test et supprimé après, même en cas d'échec :

```java
@Test
void exporter_ecrit_le_fichier(@TempDir Path dossier) throws IOException {
    Path fichier = dossier.resolve("export.csv");

    new ExportService().exporter(List.of(new Produit("Clavier", 49.90)), fichier);

    Assertions.assertTrue(Files.readString(fichier).contains("Clavier"));
}
```

AssertJ (dépendance `assertj-core`, version 3.27.7) enchaîne des assertions plus lisibles sur un même objet :

```java
assertThat(resultat).isEqualTo(90.0);
assertThat(produits).hasSize(3).extracting(Produit::nom).contains("Clavier");
```

### Pièges courants

> **Oublier `static` sur `@BeforeAll`/`@AfterAll`.** En mode par défaut (`PER_METHOD`), ces méthodes doivent être statiques ; sans `static`, JUnit refuse de démarrer les tests de la classe. Soit on ajoute `static`, soit on passe en `@TestInstance(PER_CLASS)`.

> **Confondre `assertTimeout` et `assertTimeoutPreemptively`.** `assertTimeout` laisse le code aller à son terme avant de signaler le dépassement de délai : un appel réellement bloqué (boucle infinie, attente réseau sans fin) ne sera jamais interrompu. Seul `assertTimeoutPreemptively` coupe l'exécution dans un thread séparé.

> **Traiter `@Disabled` comme une solution durable.** Un test désactivé « en attendant » et jamais réactivé ne teste plus rien, silencieusement. Toujours préciser la raison (`@Disabled("motif")`) et garder un ticket pour y revenir.

### À retenir

- Cycle de vie complet : `@BeforeAll`/`@AfterAll` (une fois) autour de `@BeforeEach`/`@Test`/`@AfterEach` (à chaque test) ; `@TestInstance` choisit entre instance par méthode (défaut) ou partagée pour la classe.
- `assertAll` regroupe des vérifications indépendantes et rapporte tous les échecs ; `assertTimeout`/`assertTimeoutPreemptively` contrôlent un délai, avec ou sans interruption réelle.
- `@ParameterizedTest` associé à `@ValueSource`, `@CsvSource`, `@MethodSource` ou `@EnumSource` évite de dupliquer des tests presque identiques.
- `@Nested`, `@DisplayName`, `@Tag` et `@Disabled` organisent et sélectionnent les tests ; `@ExtendWith` branche des extensions (Mockito, par exemple), `@TempDir` gère un dossier temporaire.
- AssertJ (`assertThat`) rend les assertions plus lisibles que celles de JUnit ; la prochaine leçon aborde Mockito pour isoler une classe de ses dépendances.
