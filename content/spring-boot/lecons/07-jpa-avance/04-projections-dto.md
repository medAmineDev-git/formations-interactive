---
id: projections-dto
chapitre: jpa-avance
ordre: 4
titre: "Projections et DTO"
termes:
  - terme: Projection
    definition: "Une vue **partielle** d'une entité (un sous-ensemble de ses champs, parfois recomposés), renvoyée directement par le repository au lieu de l'entité complète. Spring Data JPA sait générer une projection sans code de mapping manuel, par interface ou par classe."
  - terme: Projection par interface
    definition: "Une interface avec des méthodes `getXxx()` qui reprennent les noms des propriétés de l'entité. Spring Data génère un proxy à l'exécution qui les implémente. **Fermée** (chaque méthode correspond exactement à une propriété) : Spring Data peut alors restreindre les colonnes sélectionnées en SQL."
  - terme: Projection ouverte
    definition: "Variante de la projection par interface où une méthode utilise `@Value(\"#{target.nom + ' ' + target.prenom}\")` pour combiner ou transformer des champs. L'objet entier doit alors être chargé : Spring Data ne peut plus restreindre les colonnes SQL comme pour une projection fermée."
  - terme: Projection par classe (DTO)
    definition: "Une classe ou un `record` dont le constructeur reprend, dans l'ordre, les noms des propriétés voulues. Spring Data l'instancie directement avec les valeurs issues de la requête, sans passer par un proxy."
  - terme: Projection dynamique
    definition: "Une méthode de repository générique (`<T> List<T> findByCategorie(String categorie, Class<T> type)`) où l'appelant choisit le type de projection au moment de l'appel, en passant sa classe cible."
  - terme: "Expression constructeur JPQL (new ...)"
    definition: "Dans une requête `@Query`, `SELECT new com.exemple.ProduitDto(p.nom, p.prix) FROM Produit p` construit directement des DTO depuis la requête, avec le **nom qualifié complet** de la classe. L'ordre et les types des expressions doivent correspondre exactement à un constructeur existant."
  - terme: Pourquoi éviter d'exposer les entités JPA
    definition: "Exposer une entité directement dans une API expose son cycle de chargement (relations LAZY, `LazyInitializationException`), risque des boucles de sérialisation sur des relations bidirectionnelles, peut fuiter des champs internes (mot de passe haché, champs d'audit) et couple étroitement le contrat de l'API au schéma de base de données."
  - terme: MapStruct
    definition: "Bibliothèque qui génère, **à la compilation**, le code de mapping entre entités et DTO à partir d'une interface annotée `@Mapper`. Évite d'écrire ce mapping à la main, sans le coût d'exécution de la réflexion (contrairement à certaines bibliothèques de mapping dynamique)."
quiz:
  - question: "Cette interface est utilisée comme type de retour d'une méthode de repository. Quel SQL Hibernate peut-il générer ?"
    code: |
      public interface ProduitResume {
          String getNom();
          double getPrix();
      }

      public interface ProduitRepository extends JpaRepository<Produit, Long> {
          List<ProduitResume> findByCategorie(String categorie);
      }
    choix:
      - "Hibernate charge toujours toutes les colonnes de `Produit`, la projection ne fait que filtrer après coup en mémoire"
      - "C'est une projection fermée : Spring Data peut restreindre la requête SQL aux seules colonnes `nom` et `prix`"
      - "Cette interface doit obligatoirement être annotée `@Entity` pour fonctionner"
      - "Cela ne compile pas : une interface ne peut pas être un type de retour de repository"
    reponse: 1
    explication: "Chaque méthode de `ProduitResume` correspond exactement à une propriété de `Produit` (projection **fermée**, sans `@Value`) : Spring Data peut alors générer une requête SQL qui ne sélectionne que `nom` et `prix`, sans charger les autres colonnes de la table ni le reste de l'entité."
  - question: "Que faut-il vérifier en priorité dans cette expression constructeur pour qu'elle fonctionne ?"
    code: |
      public record ProduitDto(String nom, double prix) { }

      @Query("SELECT new com.exemple.boutique.ProduitDto(p.prix, p.nom) FROM Produit p")
      List<ProduitDto> trouverDto();
    choix:
      - "Que `ProduitDto` implémente une interface spécifique de Spring Data"
      - "Que l'ordre et les types des expressions sélectionnées correspondent à un constructeur existant du DTO — ici, `p.prix` (double) puis `p.nom` (String) ne correspondent pas à `ProduitDto(String, double)`"
      - "Que `ProduitDto` soit annoté `@Entity`"
      - "Rien : Spring Data fait correspondre les champs par leur nom, l'ordre n'a pas d'importance"
    reponse: 1
    explication: "Une expression constructeur JPQL appelle un constructeur Java réel, dans l'**ordre exact** des arguments : ici `new ProduitDto(p.prix, p.nom)` tente d'appeler `ProduitDto(double, String)`, qui n'existe pas (le constructeur du record est `ProduitDto(String, double)`). Le nom des champs ne joue aucun rôle dans une expression constructeur JPQL, contrairement à une projection par interface."
  - question: "À quoi sert une projection dynamique comme `<T> List<T> findByCategorie(String categorie, Class<T> type)` ?"
    choix:
      - "Elle force Spring Data à toujours renvoyer l'entité complète, quel que soit `T`"
      - "Elle permet à l'appelant de choisir, au moment de l'appel, quelle forme de résultat il veut (entité complète ou une projection donnée), avec la même méthode de repository"
      - "Elle sert uniquement à la pagination"
      - "Elle remplace `@Query` pour toutes les requêtes"
    reponse: 1
    explication: "Le type `T` n'est pas fixé dans la signature de la méthode : c'est l'appelant qui le précise via le paramètre `Class<T>`, par exemple `findByCategorie(\"Jardin\", ProduitResume.class)` pour une projection légère ou `findByCategorie(\"Jardin\", Produit.class)` pour l'entité complète. Une seule méthode de repository sert donc plusieurs besoins différents selon le contexte d'appel."
---

## Essentiel

Une **projection** renvoie directement une forme réduite ou recomposée des données, sans passer par l'entité complète. Deux approches principales.

**Par interface** — une interface dont les méthodes reprennent les noms des propriétés :

```java
public interface ProduitResume {
    String getNom();
    double getPrix();
}

public interface ProduitRepository extends JpaRepository<Produit, Long> {
    List<ProduitResume> findByCategorie(String categorie);
}
```

**Par classe ou `record`** — Spring Data instancie directement le DTO avec les valeurs de la requête :

```java
public record ProduitDto(String nom, double prix) { }

@Query("SELECT new com.exemple.boutique.ProduitDto(p.nom, p.prix) FROM Produit p WHERE p.categorie = :categorie")
List<ProduitDto> trouverDto(@Param("categorie") String categorie);
```

Pourquoi s'en donner la peine plutôt que de renvoyer l'entité `Produit` directement dans l'API ? Parce qu'une entité JPA porte des relations LAZY (risque de `LazyInitializationException` à la sérialisation), peut boucler à l'infini sur une relation bidirectionnelle, expose parfois des champs internes qui ne devraient jamais quitter le service, et lie le contrat de l'API au schéma de base — un changement de colonne casserait alors l'API. Un DTO découple les deux : c'est un contrat propre à l'API, écrit et fait évoluer indépendamment du modèle de persistance. Pour des mappings plus complexes ou répétés à plusieurs endroits, MapStruct génère ce mapping automatiquement à la compilation.

## Détail

### Exemple 1 — Projection fermée par interface

```java
public interface CommandeResume {
    Long getId();
    LocalDate getDateCreation();
    StatutCommande getStatut();
}

public interface CommandeRepository extends JpaRepository<Commande, Long> {
    List<CommandeResume> findByClientId(Long clientId);
}
```

Chaque méthode correspond exactement à une propriété de `Commande` : c'est une projection **fermée**. Spring Data peut restreindre la requête SQL aux seules colonnes nécessaires (`id`, `date_creation`, `statut`), sans charger la commande entière ni ses relations.

### Exemple 2 — Projection ouverte avec `@Value`

```java
public interface CommandeAvecClient {
    Long getId();

    @Value("#{target.client.nom + ' (' + target.client.email + ')'}")
    String getClientAffiche();
}
```

`@Value` évalue une expression SpEL sur l'entité complète (`target`), ce qui permet de combiner plusieurs champs. Contrairement à une projection fermée, Spring Data doit alors charger l'entité entière : l'optimisation SQL de la projection fermée ne s'applique plus.

### Exemple 3 — Projection dynamique

```java
public interface ProduitRepository extends JpaRepository<Produit, Long> {
    <T> List<T> findByCategorie(String categorie, Class<T> type);
}
```

```java
List<ProduitResume> resumes = produitRepository.findByCategorie("Jardin", ProduitResume.class);
List<Produit> complets = produitRepository.findByCategorie("Jardin", Produit.class);
```

La même méthode de repository sert deux besoins : une vue allégée pour un écran de liste, l'entité complète pour un écran de détail — sans dupliquer la méthode.

### Exemple 4 — Mapping manuel vs MapStruct

Mapping manuel, pour un cas simple ou isolé :

```java
public ProduitDto versDto(Produit produit) {
    return new ProduitDto(produit.getNom(), produit.getPrix());
}
```

Avec MapStruct, pour un mapping plus riche ou répété dans plusieurs services :

```java
@Mapper(componentModel = "spring")
public interface ProduitMapper {
    ProduitDto versDto(Produit produit);
    List<ProduitDto> versDtoListe(List<Produit> produits);
}
```

MapStruct génère l'implémentation de `ProduitMapper` à la compilation (code Java classique, pas de réflexion à l'exécution), et l'expose comme bean Spring grâce à `componentModel = "spring"`.

### Comparatif des approches

| | Interface (fermée) | Interface (ouverte, `@Value`) | Classe/record (constructeur JPQL) |
|---|---|---|---|
| Optimise les colonnes SQL sélectionnées | ✅ | ❌ (charge l'entité complète) | ✅ |
| Peut combiner/transformer des champs | ❌ | ✅ (via SpEL) | ✅ (dans l'expression JPQL) |
| Vérifié à la compilation | ⚠️ noms de méthode seulement | ⚠️ expression SpEL non vérifiée | ✅ constructeur réel |
| Instance concrète (pas un proxy) | ❌ | ❌ | ✅ |

### Pièges courants

> **Se tromper dans l'ordre des arguments d'une expression constructeur JPQL.** `new ProduitDto(p.prix, p.nom)` compile très bien si les types correspondent par coïncidence à un autre constructeur, mais peut aussi échouer à l'exécution (« no constructor found ») si aucun constructeur ne correspond à cet ordre précis. Le nom des propriétés ne joue aucun rôle ici, contrairement à une projection par interface : seul l'ordre des types compte.

> **Oublier le nom qualifié complet du DTO dans l'expression `new`.** `SELECT new ProduitDto(...)` échoue si `ProduitDto` n'est pas dans le même package que l'entité ou importé implicitement par JPQL : il faut le nom complet, `com.exemple.boutique.ProduitDto`.

> **Exposer l'entité JPA directement « pour aller plus vite ».** Fonctionne au début, puis casse au premier accès à une relation LAZY en dehors de la transaction, ou fuite un champ qui n'aurait jamais dû apparaître dans l'API (un champ d'audit, une relation interne). Le DTO a un coût d'écriture initial, mais protège le contrat de l'API des détails internes du modèle de persistance.

### À retenir

- Projection par interface **fermée** : Spring Data restreint les colonnes SQL sélectionnées.
- Projection par interface **ouverte** (`@Value`) : plus flexible, mais charge l'entité complète.
- Projection par classe/record : instance concrète, via une expression constructeur JPQL (`new ...`) qui doit correspondre exactement à un constructeur, dans l'ordre.
- Projection dynamique (`Class<T>` en paramètre) : une méthode de repository, plusieurs formes de résultat selon l'appelant.
- Ne pas exposer les entités JPA directement dans une API : DTO à la main pour un cas simple, MapStruct pour un mapping plus riche ou répété.
