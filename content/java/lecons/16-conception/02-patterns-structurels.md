---
id: patterns-structurels
chapitre: conception
ordre: 2
titre: "Patrons de création et de structure"
termes:
  - terme: "Fabrique statique"
    definition: "Méthode `static` qui construit et renvoie une instance, à la place (ou en complément) d'un constructeur public — souvent nommée `of`, `valueOf` ou `from`. Elle peut choisir l'implémentation exacte, mettre en cache des instances, ou porter un nom explicite là où un constructeur surchargé serait ambigu."
  - terme: "Monteur (Builder)"
    definition: "Objet intermédiaire qui accumule des valeurs via des appels chaînés puis construit l'objet final avec `build()`. Utile quand un objet a beaucoup de paramètres optionnels, pour éviter les constructeurs à rallonge et valider l'ensemble juste avant la construction."
  - terme: Singleton
    definition: "Patron qui garantit qu'une classe n'a qu'une seule instance, accessible globalement. Généralement une source d'état global difficile à tester ; une énumération à une seule valeur, ou mieux, un bean géré par un conteneur d'injection de dépendances, remplit le même besoin sans ses inconvénients."
  - terme: Adaptateur
    definition: "Objet qui traduit l'interface d'une classe existante (souvent externe, non modifiable) vers l'interface attendue par le code appelant, sans toucher ni à l'une ni à l'autre."
  - terme: Décorateur
    definition: "Objet qui implémente la même interface que l'objet qu'il enveloppe, et lui ajoute un comportement avant ou après de lui déléguer l'appel. Permet de composer des comportements (plusieurs décorateurs empilés) sans multiplier les sous-classes."
  - terme: Façade
    definition: "Classe qui expose une interface simple au-dessus d'un sous-système composé de plusieurs classes qui collaborent, pour éviter que le code appelant ne connaisse tous leurs détails et leur ordre d'appel."
  - terme: Proxy
    definition: "Objet qui implémente la même interface qu'un objet réel et s'intercale devant lui pour contrôler l'accès (chargement différé, cache, contrôle de sécurité, journalisation) — souvent de façon transparente pour l'appelant. Mécanisme central des frameworks (Spring AOP, Hibernate)."
  - terme: Composite
    definition: "Structure arborescente où un objet composé (un nœud) et un objet simple (une feuille) implémentent la même interface, ce qui permet au code appelant de les traiter de façon uniforme, récursivement."
quiz:
  - question: "Cette classe utilitaire mélange plusieurs implémentations derrière une seule interface. Quel patron ce code illustre-t-il ?"
    code: |
      public interface CatalogueProduits {
          Optional<Produit> trouver(String reference);
      }

      public class CatalogueProduitsAvecCache implements CatalogueProduits {
          private final CatalogueProduits delegue;
          private final Map<String, Produit> cache = new HashMap<>();

          public CatalogueProduitsAvecCache(CatalogueProduits delegue) {
              this.delegue = delegue;
          }

          @Override
          public Optional<Produit> trouver(String reference) {
              if (cache.containsKey(reference)) return Optional.ofNullable(cache.get(reference));
              Optional<Produit> resultat = delegue.trouver(reference);
              resultat.ifPresent(p -> cache.put(reference, p));
              return resultat;
          }
      }
    choix:
      - "Un adaptateur, car il traduit une interface externe vers CatalogueProduits"
      - "Un proxy, car il contrôle l'accès à l'objet réel (mise en cache) de façon transparente, derrière la même interface"
      - "Un monteur, car il construit un CatalogueProduits étape par étape"
      - "Un singleton, car une seule instance de CatalogueProduits existe dans l'application"
    reponse: 1
    explication: "CatalogueProduitsAvecCache implémente la même interface que l'objet qu'il enveloppe et s'intercale devant lui pour contrôler l'accès — ici, éviter un appel coûteux en le servant depuis un cache. C'est la définition du proxy. Un décorateur ajouterait un comportement additionnel sans forcément contrôler l'accès à la ressource sous-jacente ; la frontière entre les deux est surtout une question d'intention."
  - question: "Pourquoi cette classe Commande est-elle un mauvais candidat au patron singleton, même si l'application ne traite qu'une commande à la fois en développement ?"
    code: |
      public class GestionnaireCommandeUnique {
          private static GestionnaireCommandeUnique instance;
          private Commande commandeCourante;

          public static GestionnaireCommandeUnique getInstance() {
              if (instance == null) instance = new GestionnaireCommandeUnique();
              return instance;
          }
      }
    choix:
      - "Parce qu'un singleton ne peut jamais contenir de champ mutable"
      - "Parce qu'il introduit un état global mutable et partagé, difficile à tester en isolation et incompatible avec plusieurs commandes traitées en parallèle"
      - "Parce que getInstance() ne compile pas en Java"
      - "Parce qu'un singleton doit obligatoirement être une énumération pour être valide"
    reponse: 1
    explication: "Le vrai problème du singleton n'est pas syntaxique : c'est l'état global mutable et partagé qu'il installe dans toute l'application, rendant les tests dépendants les uns des autres et le code incompatible avec un traitement concurrent de plusieurs commandes. Un bean Spring à portée singleton (une seule instance, mais gérée et injectable) ou, pour une vraie constante sans état, une énumération, évitent ce piège."
  - question: "Que fait ce code, et de quel patron s'agit-il ?"
    code: |
      Reader lecteur = new BufferedReader(
          new InputStreamReader(
              new FileInputStream("commandes.csv")));
    choix:
      - "Un adaptateur : BufferedReader adapte FileInputStream à l'interface Reader"
      - "Un décorateur : chaque classe enveloppe la précédente pour lui ajouter une capacité (conversion en caractères, puis mise en tampon), en respectant la même famille d'interfaces"
      - "Une façade : InputStreamReader masque la complexité de tout le sous-système d'entrées/sorties"
      - "Un composite : FileInputStream et BufferedReader forment une arborescence de flux"
      - "Un singleton, car un seul FileInputStream est ouvert à la fois"
    reponse: 1
    explication: "Les flux d'entrée/sortie du JDK sont l'exemple le plus connu de décorateur : InputStreamReader ajoute la conversion en caractères, BufferedReader ajoute la mise en tampon, chacun enveloppant le précédent derrière une interface compatible. On peut composer ou retirer un décorateur sans toucher aux autres classes de la chaîne."
---

## Essentiel

Les patrons de création et de structure répondent tous au même besoin : **construire ou assembler des objets sans coupler le code appelant aux détails concrets**.

```java
// Fabrique statique : nom explicite, contrôle sur la construction
Remise remise = Remise.pourcentage(10);

// Monteur : beaucoup de paramètres optionnels, lisible sans surcharge de constructeurs
Commande commande = Commande.builder()
        .client(client)
        .adresseLivraison(adresse)
        .codePromo("BIENVENUE10")
        .build();
```

Une **fabrique statique** (`of`, `valueOf`, `from`) remplace un constructeur ambigu par un nom explicite. Un **monteur** (builder) devient utile dès que plusieurs paramètres sont optionnels — au-delà de trois ou quatre, des constructeurs surchargés deviennent illisibles. Un **singleton** garantit une instance unique, mais installe un état global qui nuit aux tests ; une énumération ou un bean géré par un conteneur d'injection font mieux. Un **adaptateur** traduit une interface externe, un **décorateur** ajoute un comportement en s'empilant (illustré par les flux du JDK), une **façade** simplifie un sous-système complexe, un **proxy** contrôle l'accès à un objet réel de façon transparente (cache, sécurité, chargement différé), un **composite** traite uniformément un objet simple et un groupe d'objets.

Le signal de sur-ingénierie commun à tous ces patrons : les introduire *avant* d'avoir le problème qu'ils résolvent (paramètres optionnels réels, plusieurs implémentations concrètes, besoin avéré de contrôler l'accès) ajoute des couches sans bénéfice.

## Détail

### Exemple 1 — Fabrique statique (of, valueOf, from)

```java
public final class Remise {
    private final double valeur;
    private final boolean estPourcentage;

    private Remise(double valeur, boolean estPourcentage) {
        this.valeur = valeur;
        this.estPourcentage = estPourcentage;
    }

    public static Remise pourcentage(double pourcentage) {
        return new Remise(pourcentage, true);
    }

    public static Remise montantFixe(double montant) {
        return new Remise(montant, false);
    }
}
```

**Le problème d'origine** : `new Remise(10, true)` ne dit rien du sens du `true`. Des méthodes nommées (`pourcentage(...)`, `montantFixe(...)`) le rendent explicite au point d'appel, et le constructeur privé empêche de contourner ces fabriques. C'est exactement ce que fait le JDK avec `List.of(...)`, `Optional.of(...)` ou `LocalDate.of(...)`. **Variante moderne** : un `record` combine souvent bien avec des fabriques statiques nommées quand plusieurs façons de construire le même objet ont un sens métier.

### Exemple 2 — Monteur (Builder)

```java
public class Commande {
    private final Client client;
    private final Adresse adresseLivraison;
    private final String codePromo;      // optionnel
    private final String notesLivraison; // optionnel

    private Commande(Builder b) {
        this.client = Objects.requireNonNull(b.client);
        this.adresseLivraison = Objects.requireNonNull(b.adresseLivraison);
        this.codePromo = b.codePromo;
        this.notesLivraison = b.notesLivraison;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Client client;
        private Adresse adresseLivraison;
        private String codePromo;
        private String notesLivraison;

        public Builder client(Client client) { this.client = client; return this; }
        public Builder adresseLivraison(Adresse a) { this.adresseLivraison = a; return this; }
        public Builder codePromo(String c) { this.codePromo = c; return this; }
        public Builder notesLivraison(String n) { this.notesLivraison = n; return this; }

        public Commande build() { return new Commande(this); }
    }
}
```

**Quand il devient utile** : au-delà de trois ou quatre paramètres optionnels, un constructeur (ou une famille de constructeurs surchargés) devient illisible et source d'erreurs (« était-ce le troisième ou le quatrième `String` ? »). Le monteur nomme chaque valeur au point d'appel et centralise la validation dans `build()`. **Signal de sur-ingénierie** : un monteur pour un objet à deux ou trois champs obligatoires n'apporte rien qu'un constructeur classique ne fasse aussi bien, avec moins de code.

### Exemple 3 — Singleton (et pourquoi s'en méfier)

```java
// Version classique, à éviter : état global, difficile à tester
public class ConfigurationBoutique {
    private static ConfigurationBoutique instance;
    private double tauxTvaDefaut;

    public static synchronized ConfigurationBoutique getInstance() {
        if (instance == null) instance = new ConfigurationBoutique();
        return instance;
    }
}
```

```java
// Mieux si une vraie instance unique globale est nécessaire : une énumération
public enum ConfigurationBoutique {
    INSTANCE;
    private double tauxTvaDefaut = 0.20;
}
```

```java
// Encore mieux dans une application Spring : un bean à portée singleton, injecté
@Service
public class ServiceRemise {
    private final ConfigurationBoutique configuration; // injecté, pas récupéré via un accès statique

    public ServiceRemise(ConfigurationBoutique configuration) {
        this.configuration = configuration;
    }
}
```

Le singleton « fait main » cumule les défauts : initialisation paresseuse à sécuriser manuellement en environnement concurrent, impossible à remplacer par un double de test, dépendance cachée (rien dans la signature d'une méthode ne révèle qu'elle appelle `ConfigurationBoutique.getInstance()`). Une énumération à une seule valeur règle l'aspect « instance unique garantie par la JVM », mais reste un accès global. Dans une application avec un conteneur d'injection de dépendances (Spring), un bean à portée singleton (par défaut) offre l'instance unique **et** la testabilité, puisque la dépendance est déclarée et injectée plutôt qu'accédée globalement.

### Exemple 4 — Adaptateur

```java
public interface PasserellePaiement {
    void debiter(double montant, String reference);
}

// StripeClient est une classe tierce, avec sa propre interface, non modifiable
public class AdaptateurStripe implements PasserellePaiement {
    private final StripeClient client;

    public AdaptateurStripe(StripeClient client) { this.client = client; }

    @Override
    public void debiter(double montant, String reference) {
        client.createCharge(Math.round(montant * 100), "eur", reference); // Stripe attend des centimes
    }
}
```

**Le problème d'origine** : le SDK Stripe expose sa propre API (`createCharge`, montants en centimes), incompatible avec l'interface `PasserellePaiement` du reste de l'application. L'adaptateur absorbe cette différence à un seul endroit. **Signal de sur-ingénierie** : écrire un adaptateur pour une interface que vous possédez des deux côtés — dans ce cas, il est plus simple de faire correspondre directement les deux interfaces.

### Exemple 5 — Décorateur (illustré par les flux du JDK)

```java
Reader lecteur = new BufferedReader(
    new InputStreamReader(
        new FileInputStream("commandes.csv")));
```

Chaque classe implémente la même famille d'interfaces (`Reader`, `InputStream`) que celle qu'elle enveloppe, et lui ajoute une capacité : conversion en caractères, puis mise en tampon. C'est le patron décorateur, omniprésent dans `java.io`.

```java
public interface NotificateurCommande {
    void notifier(Commande commande);
}

public class NotificateurAvecReessai implements NotificateurCommande {
    private final NotificateurCommande delegue;

    public NotificateurAvecReessai(NotificateurCommande delegue) { this.delegue = delegue; }

    @Override
    public void notifier(Commande commande) {
        for (int tentative = 1; tentative <= 3; tentative++) {
            try { delegue.notifier(commande); return; }
            catch (NotificationException e) { /* réessaie */ }
        }
    }
}
```

**Variante moderne** : quand le comportement à ajouter est simple, une lambda qui enveloppe une `Function` ou un `Consumer` fait souvent le même travail sans nouvelle classe (`Function<Commande, String> avecJournalisation = base.andThen(resultat -> { log(resultat); return resultat; });`).

### Exemple 6 — Façade

```java
public class ServiceCommandeFacade {
    private final ValidateurCommande validateur;
    private final ServiceStock stock;
    private final ServicePaiement paiement;
    private final NotificateurCommande notificateur;

    public Commande passerCommande(Panier panier, Client client) {
        validateur.valider(panier);
        stock.reserver(panier);
        paiement.debiter(panier.total());
        Commande commande = new Commande(panier, client);
        notificateur.notifier(commande);
        return commande;
    }
}
```

**Le problème d'origine** : sans façade, le code appelant (un contrôleur web, par exemple) devrait connaître les quatre services, leur ordre d'appel et gérer lui-même les erreurs intermédiaires. La façade centralise cette orchestration à un seul endroit.

### Exemple 7 — Proxy (et son omniprésence dans les frameworks)

```java
public class CatalogueProduitsAvecCache implements CatalogueProduits {
    private final CatalogueProduits delegue;
    private final Map<String, Produit> cache = new HashMap<>();

    @Override
    public Optional<Produit> trouver(String reference) {
        return Optional.ofNullable(cache.computeIfAbsent(reference,
                ref -> delegue.trouver(ref).orElse(null)));
    }
}
```

Un proxy implémente la même interface que l'objet réel et s'intercale devant lui, souvent de façon transparente pour l'appelant. C'est le mécanisme derrière **Spring AOP** (un bean transactionnel ou sécurisé est en réalité un proxy autour du vrai bean), derrière le chargement différé d'**Hibernate** (une association `@ManyToOne` renvoie un proxy tant que les données ne sont pas lues), et derrière `java.lang.reflect.Proxy` pour créer des implémentations d'interface à la volée.

### Exemple 8 — Composite

```java
public interface ElementCatalogue {
    double prixTotal();
}

public class Produit implements ElementCatalogue {
    private final double prix;
    @Override public double prixTotal() { return prix; }
}

public class Categorie implements ElementCatalogue {
    private final List<ElementCatalogue> elements = new ArrayList<>();

    @Override
    public double prixTotal() {
        return elements.stream().mapToDouble(ElementCatalogue::prixTotal).sum();
    }
}
```

Une `Categorie` peut contenir des `Produit`, mais aussi d'autres `Categorie` (sous-catégories) : le code appelant manipule `ElementCatalogue` sans distinguer une feuille d'un nœud composite, et `prixTotal()` se calcule récursivement sur toute l'arborescence.

### Vue d'ensemble

| Patron | Problème résolu | Variante moderne | Signal de sur-ingénierie |
|---|---|---|---|
| Fabrique statique | Constructeur ambigu ou construction à contrôler | Combinée à un `record` | Nommer `of(...)` un simple constructeur sans réel besoin |
| Monteur | Beaucoup de paramètres optionnels | — | Builder pour 2-3 champs obligatoires |
| Singleton | Garantir une instance unique | Énumération, ou bean singleton injecté | État global mutable difficile à tester |
| Adaptateur | Interface externe incompatible | — | Adapter une interface que l'on possède des deux côtés |
| Décorateur | Ajouter un comportement sans sous-classer | Lambda enveloppant une fonction | Empiler des décorateurs pour un besoin ponctuel simple |
| Façade | Sous-système complexe à orchestrer | — | Façade qui ne fait que déléguer un seul appel |
| Proxy | Contrôler l'accès à un objet réel | Généré par un framework (Spring AOP, Hibernate) | Écrire un proxy manuel là où le framework en génère déjà un |
| Composite | Traiter uniformément un élément et un groupe | — | Arborescence forcée sur une structure qui n'est pas vraiment hiérarchique |

### Pièges courants

> **Introduire un patron avant d'avoir le problème.** Un monteur pour deux paramètres, un adaptateur pour une interface qu'on contrôle des deux côtés, une façade devant un seul service : ces patrons ajoutent des fichiers et des indirections sans réduire aucune complexité réelle.

> **Confondre décorateur et proxy.** Les deux enveloppent un objet derrière la même interface. La nuance est dans l'intention : le décorateur **ajoute** un comportement et se compose librement (plusieurs décorateurs empilables) ; le proxy **contrôle l'accès** à un objet précis (souvent un seul niveau, pas empilé). En pratique, la distinction compte moins que de savoir pourquoi l'indirection existe.

> **Écrire un singleton à la main dans une application qui a déjà un conteneur d'injection de dépendances.** Un bean Spring est déjà, par défaut, une instance unique partagée — recréer un singleton manuel à côté ajoute un second mécanisme d'état global, incompatible avec les tests qui recréent le contexte.

### À retenir

- Fabrique statique et monteur répondent à des problèmes de **construction** ; adaptateur, décorateur, façade, proxy et composite répondent à des problèmes de **structure** (faire collaborer des objets existants).
- Un singleton fait main installe un état global difficile à tester ; préférer une énumération pour une vraie constante, ou un bean à portée singleton dans une application avec injection de dépendances.
- Le décorateur des flux du JDK (`BufferedReader(InputStreamReader(FileInputStream(...)))`) reste le meilleur exemple pour expliquer le patron en entretien.
- Le proxy est partout dans les frameworks modernes (Spring AOP, Hibernate) sans que le code applicatif l'écrive lui-même.
- Le meilleur indicateur de sur-ingénierie : introduire une indirection avant d'avoir observé le problème qu'elle est censée résoudre.
