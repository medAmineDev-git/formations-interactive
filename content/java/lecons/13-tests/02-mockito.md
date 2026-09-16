---
id: mockito
chapitre: tests-qualite
ordre: 2
titre: "Doubles de test avec Mockito"
termes:
  - terme: "Doublure de test (mock, stub, spy…)"
    definition: "Terme générique pour tout objet qui remplace une vraie dépendance en test. On distingue : **dummy** (objet passé pour satisfaire une signature, jamais utilisé), **fake** (implémentation simplifiée mais fonctionnelle, ex. une liste en mémoire à la place d'une base), **stub** (renvoie des réponses préprogrammées), **mock** (comme un stub, mais dont on vérifie aussi les appels reçus), **spy** (objet réel dont on surveille ou modifie certains appels)."
  - terme: mock()
    definition: "Crée une doublure à partir d'une interface ou d'une classe : `ProduitRepository repository = mock(ProduitRepository.class)`. Tant qu'une méthode n'est pas configurée, elle renvoie une valeur neutre (`null`, `0`, une collection vide…)."
  - terme: "when / thenReturn / thenThrow"
    definition: "Configurent la réponse d'un mock à un appel précis : `when(repository.findById(1L)).thenReturn(Optional.of(produit))`, ou `thenThrow(new ProduitIntrouvableException())` pour simuler une erreur."
  - terme: verify
    definition: "Vérifie qu'une méthode du mock a bien été appelée, avec éventuellement un nombre d'appels précis : `verify(repository).save(produit)`, `verify(repository, times(2)).save(any())`, `verify(repository, never()).delete(any())`."
  - terme: ArgumentCaptor
    definition: "Capture la valeur exacte d'un argument reçu par le mock lors d'un appel, pour l'inspecter ensuite en détail. Utile quand l'objet passé est construit à l'intérieur de la méthode testée et donc inconnu à l'avance."
  - terme: "Matcher (any, eq)"
    definition: "Remplace un argument précis par une condition plus large dans `when`/`verify` (`any()`, `anyString()`, `eq(valeur)`…). Règle stricte : dès qu'un matcher est utilisé pour un argument d'un appel, **tous** les autres arguments de ce même appel doivent aussi être des matchers."
  - terme: "@Mock / @InjectMocks"
    definition: "Avec `@ExtendWith(MockitoExtension.class)`, `@Mock` crée un mock pour le champ annoté et `@InjectMocks` instancie réellement la classe testée en lui injectant les champs `@Mock` correspondants, par le constructeur si possible."
quiz:
  - question: "Que se passe-t-il à l'exécution de ce stub ?"
    code: |
      when(repository.rechercher("clavier", eq(true)))
          .thenReturn(List.of(produit));
    choix:
      - "Le mock renvoie `List.of(produit)` uniquement quand `motCle` vaut exactement « clavier » et `actifsSeuls` vaut `true`"
      - "Mockito lève une `InvalidUseOfMatchersException` : un seul argument utilise un matcher (`eq(true)`) alors que `\"clavier\"` est une valeur brute"
      - "Le mock ignore silencieusement `eq(true)` et ne tient compte que de `motCle`"
      - "Le test compile mais `actifsSeuls` est toujours traité comme `false`"
    reponse: 1
    explication: "Mockito impose la règle « tout ou rien » : dès qu'un matcher (`eq`, `any`…) est utilisé pour un argument d'un appel, tous les autres arguments du même appel doivent aussi en être un. Ici, `\"clavier\"` est une valeur brute à côté de `eq(true)` : il faut écrire `eq(\"clavier\")` pour que l'appel soit valide."
  - question: "Quelle est la principale différence entre `spy(...)` et `mock(...)` ?"
    choix:
      - "`spy` interdit toute vérification via `verify`, contrairement à `mock`"
      - "`spy` enveloppe un vrai objet : les méthodes non explicitement stubbées exécutent le vrai code, alors que `mock` ne renvoie que des réponses préprogrammées"
      - "`spy` ne fonctionne qu'avec des interfaces, `mock` seulement avec des classes concrètes"
      - "`spy` et `mock` sont strictement équivalents, seul le nom de la méthode change"
    reponse: 1
    explication: "Un `spy` enveloppe une vraie instance : tant qu'on ne stub pas explicitement une méthode, l'appel exécute le vrai code (avec ses éventuels effets de bord). Un `mock` classique n'exécute jamais de vrai code, même non configuré. C'est pour cela que `spy` s'utilise avec parcimonie, sur des cas précis."
  - question: "Ce test échoue à l'exécution avec une erreur qui n'a rien à voir avec la logique testée. Pourquoi ?"
    code: |
      @ExtendWith(MockitoExtension.class)
      class ProduitServiceTest {

          @Mock private ProduitRepository repository;
          @InjectMocks private ProduitService service;

          @Test
          void supprimer_un_produit_existant() {
              when(repository.findById(1L)).thenReturn(Optional.of(produit));

              service.supprimer(2L);
          }
      }
    choix:
      - "`findById(1L)` n'est jamais appelé (le test appelle `supprimer(2L)`) : Mockito signale ce stubbing inutilisé"
      - "`@InjectMocks` ne peut pas être combiné avec `@Mock` dans la même classe"
      - "`supprimer` attend forcément un `Optional` en argument"
      - "`when` doit toujours être appelé après l'exécution du code testé, jamais avant"
    reponse: 0
    explication: "`MockitoExtension` active le mode strict par défaut : un stubbing configuré avec `when(...)` mais jamais réellement sollicité pendant le test déclenche une `UnnecessaryStubbingException`. Ici, `service.supprimer(2L)` n'appelle jamais `repository.findById(1L)` (l'identifiant ne correspond pas) : le stub est mort, souvent le signe d'un copier-coller oublié ou d'un test qui ne vérifie plus ce qu'il prétend vérifier."
---

## Essentiel

Un test unitaire vérifie **une classe isolée**, sans ses vraies dépendances (base de données, appel réseau, horloge…). Mockito crée des **doublures de test** qui les remplacent : on leur dit quoi répondre, puis on vérifie qu'elles ont été sollicitées comme prévu.

Grâce à l'injection par constructeur, créer un objet testé avec des doublures ne demande aucun framework :

```java
@ExtendWith(MockitoExtension.class)
class ProduitServiceTest {

    @Mock
    private ProduitRepository repository;

    @InjectMocks
    private ProduitService service;

    @Test
    void trouver_renvoie_le_produit_existant() {
        Produit produit = new Produit(1L, "Clavier", 49.90);
        when(repository.findById(1L)).thenReturn(Optional.of(produit));

        Produit resultat = service.trouver(1L);

        Assertions.assertEquals("Clavier", resultat.nom());
        verify(repository).findById(1L);
    }
}
```

`@Mock` crée un mock du dépôt, `@InjectMocks` instancie réellement `ProduitService` et lui passe ce mock via son constructeur. `when(...).thenReturn(...)` configure la réponse (étape *Given*), l'appel à `service.trouver(1L)` exécute le code testé (*When*), et `verify` contrôle l'interaction attendue (*Then*).

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.23.0</version>
    <scope>test</scope>
</dependency>
```

## Détail

### Le vocabulaire des doublures de test

| Terme | Comportement | Avec Mockito |
|---|---|---|
| Dummy | Passé pour satisfaire une signature, jamais réellement utilisé | Rarement nécessaire : `mock(...)` fait aussi bien |
| Fake | Implémentation simplifiée mais fonctionnelle (ex. une `Map` en mémoire) | Écrit à la main, sans Mockito |
| Stub | Renvoie des réponses préprogrammées, sans vérification d'appel | `when(...).thenReturn(...)` |
| Mock | Comme un stub, mais on vérifie aussi les appels reçus | `mock(...)` + `verify(...)` |
| Spy | Objet réel dont on surveille ou modifie certains appels | `spy(...)` |

### Exemple 1 — Un mock sans annotation

Utile pour comprendre ce que fait `@Mock` en coulisses, ou dans un test sans extension :

```java
@Test
void trouver_leve_une_exception_si_produit_absent() {
    ProduitRepository repository = mock(ProduitRepository.class);
    when(repository.findById(99L)).thenReturn(Optional.empty());
    ProduitService service = new ProduitService(repository);

    Assertions.assertThrows(ProduitIntrouvableException.class,
        () -> service.trouver(99L));
}
```

`mock(ProduitRepository.class)` fabrique l'objet, `new ProduitService(repository)` l'injecte directement par le constructeur — sans Spring, sans extension.

### Exemple 2 — ArgumentCaptor

Quand l'objet passé au mock est construit **à l'intérieur** de la méthode testée, on ne peut pas le comparer par égalité à l'avance : on le capture pour l'inspecter après coup.

```java
@Test
void enregistrer_sauvegarde_un_produit_actif_par_defaut() {
    service.enregistrer("Clavier", 49.90);

    ArgumentCaptor<Produit> capture = ArgumentCaptor.forClass(Produit.class);
    verify(repository).save(capture.capture());

    Produit sauvegarde = capture.getValue();
    Assertions.assertEquals("Clavier", sauvegarde.nom());
    Assertions.assertTrue(sauvegarde.actif());
}
```

### Exemple 3 — Matchers, et la règle « tout ou rien »

```java
when(repository.rechercher(eq("clavier"), anyBoolean())).thenReturn(List.of(produit));

verify(notificationService).envoyer(anyString());
```

`any()`, `anyString()`, `anyBoolean()`, `eq(valeur)` assouplissent la condition sur un argument. Dès qu'un argument d'un appel utilise un matcher, **tous** les arguments de cet appel doivent en être un — mélanger une valeur brute et un matcher lève `InvalidUseOfMatchersException` à l'exécution.

### Exemple 4 — spy, avec parcimonie

```java
@Test
void validerNom_utilise_la_vraie_normalisation_mais_stub_le_controle_liste_noire() {
    ProduitValidator validator = spy(new ProduitValidator());
    doReturn(false).when(validator).estDansListeNoire("clavier");

    boolean resultat = validator.estValide("  Clavier  ");

    Assertions.assertTrue(resultat); // la normalisation réelle a bien retiré les espaces
}
```

`spy` exécute le vrai code (`estValide`, la normalisation) et ne stub qu'un point précis (`estDansListeNoire`). Notez `doReturn(...).when(...)` plutôt que `when(...).thenReturn(...)` : avec un spy, `when(validator.estDansListeNoire(...))` exécuterait réellement la méthode avant de la stubber, ce qu'on veut justement éviter ici.

### Ce qu'il ne faut pas mocker

- **Les types qu'on ne possède pas** (classes du JDK, d'une librairie tierce) : leur vrai comportement est mal connu et peut changer d'une version à l'autre sans prévenir ; un mock mal calé se met à mentir silencieusement. Préférer une vraie instance, ou un adaptateur qu'on possède et qu'on peut, lui, mocker.
- **Les objets de valeur** (`Produit`, `Commande`…) : ce sont des données, pas des comportements à simuler. On les construit réellement avec leur constructeur, on ne les mocke jamais.

### Pièges courants

> **Mocker à outrance jusqu'à ne plus tester que l'implémentation.** Un test qui vérifie l'ordre exact de dix appels de mocks décrit le code, pas le comportement attendu : la moindre refonte interne (sans changement de résultat) le casse. Vérifier plutôt le résultat observable, et réserver `verify` aux interactions qui comptent vraiment (un envoi d'e-mail, une sauvegarde).

> **Oublier `@ExtendWith(MockitoExtension.class)`.** Sans elle, les champs `@Mock` et `@InjectMocks` restent `null` : `NullPointerException` dès le premier appel.

> **`when(...)` sur une méthode jamais appelée.** `MockitoExtension` signale un stubbing inutilisé (`UnnecessaryStubbingException`) en fin de test. C'est volontaire : un mock configuré pour rien cache souvent un test mal écrit ou obsolète.

### À retenir

- Mock, stub, spy, fake, dummy désignent des rôles différents ; Mockito couvre surtout mock/stub (`mock`, `when/thenReturn`) et spy (`spy`).
- `verify` contrôle les appels reçus par un mock ; `ArgumentCaptor` inspecte un argument construit à l'intérieur du code testé.
- Les matchers (`any`, `eq`…) suivent la règle « tout ou rien » au sein d'un même appel.
- L'injection par constructeur rend une classe testable avec de simples doublures, sans framework ni conteneur.
- Ne jamais mocker un type qu'on ne possède pas ni un objet de valeur ; ne pas mocker au point de ne plus tester que l'implémentation.
