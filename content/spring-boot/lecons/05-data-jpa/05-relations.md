---
id: relations
chapitre: data-jpa
ordre: 5
titre: Les relations entre entités
termes:
  - terme: "@ManyToOne"
    definition: "Relation où **plusieurs** instances de l'entité portant l'annotation pointent vers **une** instance de l'entité cible. Exemple : plusieurs `LigneCommande` pointent vers un `Produit`. C'est très souvent le **côté propriétaire** de la relation, avec `@JoinColumn` pour nommer la colonne de clé étrangère."
  - terme: "@OneToMany(mappedBy = ...)"
    definition: "Relation où **une** instance pointe vers **plusieurs** instances de l'autre entité. `mappedBy` indique que ce côté n'est **pas propriétaire** : la clé étrangère est gérée par l'autre côté (celui avec `@ManyToOne`)."
  - terme: "@OneToOne"
    definition: "Relation où une instance pointe vers exactement une autre instance, et réciproquement. Le côté propriétaire porte `@JoinColumn` ; l'autre côté utilise `mappedBy`."
  - terme: "@ManyToMany"
    definition: "Relation où plusieurs instances de chaque côté peuvent se correspondre. Implémentée via une **table d'association** intermédiaire, déclarée avec `@JoinTable` du côté propriétaire."
  - terme: "@JoinColumn"
    definition: "Précise le nom de la colonne de clé étrangère, côté propriétaire d'une relation (`@ManyToOne`, `@OneToOne` propriétaire)."
  - terme: Côté propriétaire
    definition: "Dans une relation bidirectionnelle, le côté qui possède la colonne de clé étrangère (ou la table d'association) et dont les modifications sont effectivement écrites en base. L'autre côté (`mappedBy`) n'est qu'une **vue en lecture** de la relation, tant qu'on ne synchronise pas les deux côtés manuellement."
  - terme: "cascade et orphanRemoval"
    definition: "`cascade` propage une opération (persist, remove…) de l'entité parente vers les entités liées. `orphanRemoval = true` supprime automatiquement une entité enfant retirée de la collection parente, même sans suppression explicite."
  - terme: LazyInitializationException
    definition: "Exception levée quand on accède à une relation chargée en mode paresseux (`LAZY`) **après** la fermeture de la session Hibernate (par exemple dans une vue, après le retour du service). Message typique : *« failed to lazily initialize a collection of role... could not initialize proxy - no Session »*."
quiz:
  - question: "Quel est le fetch type par défaut de `@OneToMany` et `@ManyToMany` ?"
    choix:
      - "EAGER pour les deux"
      - "LAZY pour les deux"
      - "EAGER pour `@OneToMany`, LAZY pour `@ManyToMany`"
      - "Cela dépend du SGBD utilisé"
    reponse: 1
    explication: "`@OneToMany` et `@ManyToMany` sont **LAZY** par défaut (chargement différé, à la demande) : charger toute une collection liée systématiquement serait coûteux. À l'inverse, `@ManyToOne` et `@OneToOne` sont **EAGER** par défaut (chargement immédiat), ce qui peut d'ailleurs poser des problèmes de performance si la relation n'est pas toujours utile — souvent corrigé en passant explicitement `fetch = FetchType.LAZY`."
  - question: "Pourquoi ce code lève-t-il une `LazyInitializationException` ?"
    code: |
      @Service
      public class CommandeService {
          public Commande trouver(Long id) {
              return repo.findById(id).orElseThrow(); // relation OneToMany en LAZY
          }
      }

      // dans le contrôleur, après l'appel au service :
      commande.getLignes().size(); // accès à la collection LAZY
    choix:
      - "`getLignes()` n'existe pas sur une entité JPA"
      - "La session Hibernate est déjà fermée quand le contrôleur accède à la collection LAZY"
      - "Les collections LAZY ne peuvent jamais être lues"
      - "Il manque `@Transactional` sur l'entité `Commande`"
    reponse: 1
    explication: "Une relation LAZY n'est chargée que si on y accède **pendant que la session Hibernate est ouverte**, typiquement dans une méthode `@Transactional`. Une fois le service revenu (et la transaction terminée), la session est fermée : accéder à la collection dans le contrôleur échoue. Solutions : charger la relation explicitement dans le service (ex. avec une requête `@Query` adaptée, ou `@Transactional` étendu), ou — mieux — renvoyer un DTO déjà construit avec les données nécessaires."
  - question: "Pourquoi sérialiser directement une entité avec une relation bidirectionnelle en JSON pose-t-il problème ?"
    choix:
      - "Ce n'est jamais un problème, Jackson gère cela nativement"
      - "Le mapping objet-relationnel ne fonctionne pas avec Jackson"
      - "Chaque entité référence l'autre : la sérialisation peut boucler indéfiniment (StackOverflowError)"
      - "JPA interdit la sérialisation des entités"
    reponse: 2
    explication: "Une `Commande` référence ses `LigneCommande`, et chaque `LigneCommande` référence sa `Commande` en retour : Jackson essaie de sérialiser l'une, puis l'autre, puis la première à nouveau, indéfiniment. La solution recommandée est de **ne jamais exposer les entités directement** dans une API, mais de passer par des DTO qui ne portent que les données nécessaires, sans la relation inverse complète."
---

## Essentiel

Les entités se relient entre elles avec des annotations qui reflètent la cardinalité :

```java
@Entity
public class Commande {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneCommande> lignes = new ArrayList<>();

    public void ajouterLigne(LigneCommande ligne) {
        lignes.add(ligne);
        ligne.setCommande(this); // synchronise les deux côtés
    }
}

@Entity
public class LigneCommande {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "commande_id") // côté propriétaire : porte la clé étrangère
    private Commande commande;

    @ManyToOne
    private Produit produit;
}
```

Points essentiels :

- Le **côté propriétaire** (celui qui porte `@JoinColumn`, généralement le `@ManyToOne`) est celui dont les modifications sont réellement écrites en base. L'autre côté (`mappedBy`) doit être synchronisé manuellement, d'où l'intérêt d'une méthode utilitaire comme `ajouterLigne(...)`.
- Fetch par défaut : **EAGER** pour `@ManyToOne`/`@OneToOne`, **LAZY** pour `@OneToMany`/`@ManyToMany`.
- `cascade` propage les opérations, `orphanRemoval` supprime les enfants retirés de la collection.
- **Ne jamais renvoyer une entité directement en JSON** dans une API : utiliser des DTO, pour éviter les boucles infinies de sérialisation et exposer trop de données.

## Détail

### Exemple 1 — `@ManyToOne` / `@OneToMany` (bidirectionnelle)

```java
@Entity
public class Produit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
}

@Entity
public class LigneCommande {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne // EAGER par défaut ; souvent forcé en LAZY : fetch = FetchType.LAZY
    @JoinColumn(name = "produit_id")
    private Produit produit;

    private int quantite;
}
```

Ici, `LigneCommande` est le côté propriétaire de sa relation avec `Produit` : elle porte la colonne `produit_id`.

### Exemple 2 — `@OneToOne`

```java
@Entity
public class Client {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(mappedBy = "client", cascade = CascadeType.ALL)
    private ProfilClient profil;
}

@Entity
public class ProfilClient {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "client_id")
    private Client client; // côté propriétaire
}
```

### Exemple 3 — `@ManyToMany`

```java
@Entity
public class Produit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToMany
    @JoinTable(
        name = "produit_categorie",
        joinColumns = @JoinColumn(name = "produit_id"),
        inverseJoinColumns = @JoinColumn(name = "categorie_id")
    )
    private Set<Categorie> categories = new HashSet<>();
}

@Entity
public class Categorie {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToMany(mappedBy = "categories")
    private Set<Produit> produits = new HashSet<>();
}
```

`@JoinTable` déclare la table d'association `produit_categorie`, gérée automatiquement, sans entité dédiée à écrire.

### Exemple 4 — DTO pour éviter la boucle infinie en JSON

```java
public record CommandeReponse(Long id, List<LigneReponse> lignes) { }
public record LigneReponse(String produit, int quantite) { }

@GetMapping("/{id}")
public CommandeReponse get(@PathVariable Long id) {
    Commande commande = service.trouver(id);
    List<LigneReponse> lignes = commande.getLignes().stream()
        .map(l -> new LigneReponse(l.getProduit().getNom(), l.getQuantite()))
        .toList();
    return new CommandeReponse(commande.getId(), lignes);
}
```

Le DTO `LigneReponse` ne référence pas `Commande` en retour : pas de boucle possible.

### Fetch type par défaut

| Relation | Fetch par défaut | Remarque |
|---|---|---|
| `@ManyToOne` | EAGER | Souvent forcé en `LAZY` pour éviter de charger des relations inutiles |
| `@OneToOne` | EAGER | Idem |
| `@OneToMany` | LAZY | Chargé seulement à l'accès, dans une session ouverte |
| `@ManyToMany` | LAZY | Idem |

### Pièges courants

> **`LazyInitializationException`.** Accéder à une collection ou une relation LAZY après la fermeture de la session Hibernate (typiquement, hors d'une méthode `@Transactional`, par exemple dans un contrôleur après le retour du service). Message typique : *« failed to lazily initialize a collection of role... no Session »*. Solution : charger ce qui est nécessaire pendant que la transaction est ouverte (dans le service), ou construire directement un DTO à cet endroit.

> **Boucle infinie en sérialisation JSON.** Une relation bidirectionnelle (`Commande` → `LigneCommande` → `Commande` → …) renvoyée telle quelle via `@RestController` peut provoquer un `StackOverflowError`. La bonne pratique reste de ne jamais exposer les entités JPA directement dans une API, et de passer par des DTO.

> **Oublier de synchroniser les deux côtés d'une relation bidirectionnelle.** `commande.getLignes().add(ligne)` sans faire `ligne.setCommande(commande)` : la collection Java contient bien la ligne en mémoire, mais comme `LigneCommande` est le côté propriétaire, **rien n'est écrit en base** pour cette ligne tant que son propre champ `commande` n'est pas renseigné. D'où l'intérêt d'une méthode utilitaire (`ajouterLigne`) qui fait les deux à la fois.

### À retenir

- `@ManyToOne`/`@OneToOne` propriétaire portent `@JoinColumn` ; `mappedBy` désigne le côté non propriétaire.
- Fetch par défaut : EAGER pour `*ToOne`, LAZY pour `*ToMany`.
- `cascade` propage les opérations, `orphanRemoval` supprime les enfants orphelins.
- Toujours synchroniser les deux côtés d'une relation bidirectionnelle (méthode utilitaire type `ajouterLigne`).
- Ne jamais exposer une entité directement en JSON : passer par des DTO. Le problème de performance N+1 lié aux relations est traité dans le chapitre JPA avancé.
