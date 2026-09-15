---
id: junit-mockito
chapitre: tests
ordre: 1
titre: "Tests unitaires avec JUnit 5 et Mockito"
termes:
  - terme: spring-boot-starter-test
    definition: "Le starter qui apporte tout ce qu'il faut pour tester : **JUnit Jupiter** (JUnit 5), **AssertJ** (assertions fluides), **Mockito** (mocks), **Hamcrest**, **JSONassert** et **JsonPath**. Un seul `<dependency>` (scope `test`), généré par défaut par Spring Initializr."
  - terme: "@Test"
    definition: "Marque une méthode comme un test JUnit 5 (package `org.junit.jupiter.api`). La méthode doit être publique ou package-private, sans paramètre, et ne renvoie rien."
  - terme: "@BeforeEach"
    definition: "Exécute la méthode annotée avant **chaque** test de la classe. Sert à préparer un état commun (créer les mocks, instancier l'objet testé) pour éviter la duplication."
  - terme: "@ParameterizedTest"
    definition: "Exécute le même test avec plusieurs jeux de données, fournis par exemple avec `@ValueSource` ou `@CsvSource`. Évite de dupliquer un test presque identique."
  - terme: "AssertJ (assertThat)"
    definition: "Bibliothèque d'assertions fluides et chaînables : `assertThat(total).isEqualTo(42)`. Messages d'erreur plus lisibles que `Assertions.assertEquals` de JUnit, et beaucoup de méthodes dédiées (`isEmpty()`, `containsExactly()`, `hasSize()`…)."
  - terme: Mock (Mockito)
    definition: "Un objet **simulé** qui remplace une vraie dépendance : on lui dit quoi répondre (`when(...).thenReturn(...)`) et on vérifie ensuite qu'il a été appelé (`verify(...)`). Permet de tester une classe **isolément**, sans ses dépendances réelles (base de données, appel HTTP…)."
  - terme: "@ExtendWith(MockitoExtension.class)"
    definition: "Extension JUnit 5 qui active Mockito dans la classe de test : elle initialise les champs annotés `@Mock` et `@InjectMocks`, et vérifie que les mocks inutilisés (« unnecessary stubbing ») lèvent une erreur."
  - terme: "@Mock et @InjectMocks"
    definition: "`@Mock` crée un mock pour le champ annoté. `@InjectMocks` crée une **vraie** instance de la classe testée et y injecte les champs `@Mock` correspondants (par le constructeur si possible)."
quiz:
  - question: "Que fait cette ligne de test avec Mockito ?"
    code: |
      when(commandeRepository.findById(1L)).thenReturn(Optional.of(commande));
    choix:
      - "Elle vérifie que `findById(1L)` a été appelé une fois"
      - "Elle configure le mock : quand `findById(1L)` est appelé, il renverra `Optional.of(commande)`"
      - "Elle appelle réellement `findById` sur la base de données"
      - "Elle crée un nouveau mock nommé `commandeRepository`"
    reponse: 1
    explication: "`when(...).thenReturn(...)` définit le comportement du mock **avant** d'appeler le code testé (étape *Given*). La vérification d'appel se fait plutôt avec `verify(commandeRepository).findById(1L)`, généralement en fin de test (étape *Then*)."
  - question: "Pourquoi peut-on tester `CommandeService` avec un simple `new CommandeService(mockRepo)`, sans démarrer Spring ?"
    choix:
      - "Parce que `@Service` désactive le besoin du conteneur pendant les tests"
      - "Parce que la classe utilise l'injection par constructeur : ses dépendances sont de simples paramètres, remplaçables par des mocks"
      - "Parce que Mockito démarre automatiquement un mini contexte Spring"
      - "Ce n'est pas possible, il faut toujours `@SpringBootTest`"
    reponse: 1
    explication: "L'injection par constructeur rend la classe testable **sans Spring** : le constructeur attend une interface, on lui passe un mock. C'est justement l'intérêt de ce style d'injection, déjà vu au chapitre sur l'injection de dépendances. `@SpringBootTest` n'est nécessaire que pour vérifier l'intégration avec le vrai conteneur."
    lecon: injection-dependances
  - question: "Dans une classe annotée `@ExtendWith(MockitoExtension.class)`, à quoi sert `@InjectMocks` ?"
    choix:
      - "À créer un mock de la classe annotée"
      - "À instancier réellement la classe annotée et à lui injecter les champs `@Mock` correspondants"
      - "À ignorer la classe pendant l'exécution des tests"
      - "À remplacer la classe par un bean Spring réel"
    reponse: 1
    explication: "`@InjectMocks` crée un **vrai objet** (pas un mock) de la classe testée, par exemple `CommandeService`, et lui passe les mocks déclarés ailleurs dans la classe de test (`@Mock CommandeRepository repo`) via son constructeur. C'est la classe testée elle-même qui n'est jamais mockée."
---

## Essentiel

`spring-boot-starter-test` apporte tout ce qu'il faut pour écrire des tests : **JUnit 5** (le moteur de test), **AssertJ** (assertions lisibles), **Mockito** (mocks) et quelques utilitaires JSON.

Un test unitaire vérifie **une classe isolée**, sans démarrer Spring. Grâce à l'injection par constructeur, on peut créer l'objet testé avec un simple `new` et lui passer des **mocks** à la place de ses vraies dépendances :

```java
@ExtendWith(MockitoExtension.class)
class CommandeServiceTest {

    @Mock
    private CommandeRepository repository;

    @InjectMocks
    private CommandeService service;

    @Test
    void trouver_renvoie_la_commande_existante() {
        // Given
        Commande commande = new Commande(1L, "En cours");
        when(repository.findById(1L)).thenReturn(Optional.of(commande));

        // When
        Commande resultat = service.trouver(1L);

        // Then
        assertThat(resultat.getStatut()).isEqualTo("En cours");
        verify(repository).findById(1L);
    }
}
```

La structure **Given / When / Then** (ou *Arrange / Act / Assert*) organise chaque test : préparer les données et le comportement des mocks, appeler la méthode testée, puis vérifier le résultat. Ce type de test s'exécute en quelques millisecondes : aucun contexte Spring, aucune base de données.

## Détail

### Pourquoi c'est utile

Les tests unitaires sont la base de la pyramide de tests : nombreux, rapides, ciblés. Ils permettent de vérifier la logique métier (calculs, règles, cas limites) sans dépendre d'une base de données ou d'un serveur. Un projet qui ne teste qu'avec `@SpringBootTest` a une suite de tests lente ; les tests unitaires comblent ce manque.

### Exemple 1 — Un test simple, sans Mockito

Quand une classe n'a aucune dépendance, pas besoin de mock :

```java
class CalculPrixTest {

    @Test
    @DisplayName("Une remise de 10% réduit bien le total")
    void appliquerRemise() {
        CalculPrix calcul = new CalculPrix();

        double resultat = calcul.appliquerRemise(100.0, 10);

        assertThat(resultat).isEqualTo(90.0);
    }
}
```

`@DisplayName` donne un nom lisible au test, affiché dans les rapports.

### Exemple 2 — Vérifier une exception

```java
@Test
void trouver_leve_une_exception_si_commande_absente() {
    when(repository.findById(99L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.trouver(99L))
        .isInstanceOf(CommandeIntrouvableException.class)
        .hasMessage("Commande 99 introuvable");
}
```

`assertThatThrownBy` (AssertJ) est plus lisible que le `assertThrows` de JUnit quand on veut aussi vérifier le message. JUnit propose l'équivalent :

```java
CommandeIntrouvableException ex = assertThrows(
    CommandeIntrouvableException.class,
    () -> service.trouver(99L)
);
assertThat(ex.getMessage()).isEqualTo("Commande 99 introuvable");
```

### Exemple 3 — Un test paramétré

```java
@ParameterizedTest
@CsvSource({
    "100.0, 10, 90.0",
    "50.0, 0, 50.0",
    "200.0, 50, 100.0"
})
void appliquerRemise_plusieurs_cas(double prix, int pourcentage, double attendu) {
    CalculPrix calcul = new CalculPrix();

    assertThat(calcul.appliquerRemise(prix, pourcentage)).isEqualTo(attendu);
}
```

Trois jeux de données, un seul corps de test : évite de copier-coller trois méthodes quasi identiques.

### Exemple 4 — Vérifier les interactions avec un mock

```java
@Test
void confirmer_envoie_une_notification() {
    Commande commande = new Commande(1L, "En attente");
    when(repository.findById(1L)).thenReturn(Optional.of(commande));

    service.confirmer(1L);

    verify(repository).save(commande);
    verify(notificationService).envoyer(anyString());
    verifyNoMoreInteractions(notificationService);
}
```

`verify` contrôle qu'une méthode du mock a bien été appelée (avec `times(2)`, `never()`… pour préciser le nombre d'appels). `anyString()` est un *matcher* Mockito : n'importe quelle chaîne convient.

### Assertions JUnit ou AssertJ ?

| | JUnit (`Assertions`) | AssertJ (`assertThat`) |
|---|---|---|
| Style | `assertEquals(attendu, resultat)` | `assertThat(resultat).isEqualTo(attendu)` |
| Lisibilité | Ordre attendu/résultat à retenir | Fluide, se lit comme une phrase |
| Méthodes dédiées | Limitées | Nombreuses (`isEmpty()`, `containsExactly()`, `extracting()`…) |
| Usage courant | Encore présent dans du code existant | Recommandé pour les nouveaux tests |

### Pièges courants

> **Oublier `@ExtendWith(MockitoExtension.class)`.** Sans elle, les champs `@Mock` et `@InjectMocks` restent `null` : `NullPointerException` dès le premier appel. Avec `@SpringBootTest`, cette extension est activée automatiquement ; en test unitaire pur, il faut la déclarer soi-même.

> **`when(...)` sur une méthode jamais appelée.** Mockito signale un *stubbing* inutilisé (`UnnecessaryStubbingException`) en fin de test avec `MockitoExtension`. C'est volontaire : un mock configuré pour rien cache souvent un test mal écrit ou obsolète.

> **Vérifier l'ordre d'appel avec `assertEquals(attendu, resultat)`.** Les deux premiers arguments de `assertEquals` sont dans l'ordre *(attendu, résultat)* — l'inverse d'AssertJ. Une inversion ne casse pas la compilation, seulement le message d'erreur en cas d'échec.

### À retenir

- `spring-boot-starter-test` regroupe JUnit 5, AssertJ, Mockito, Hamcrest, JSONassert et JsonPath.
- L'injection par constructeur permet de tester une classe avec `new` et des mocks, sans Spring.
- `@Mock` crée un mock, `@InjectMocks` crée l'objet réel et lui injecte les mocks.
- `when(...).thenReturn(...)` configure un mock, `verify(...)` contrôle qu'il a été appelé.
- Structurez vos tests en Given / When / Then : plus lisibles, plus faciles à maintenir.
