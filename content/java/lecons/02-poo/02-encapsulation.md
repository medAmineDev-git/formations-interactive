---
id: encapsulation
chapitre: poo
ordre: 2
titre: "L'encapsulation"
termes:
  - terme: Encapsulation
    definition: "Principe qui consiste à **cacher** l'état interne d'un objet et à n'exposer que ce qui est nécessaire, via des méthodes. L'objet contrôle ainsi comment son état peut être lu ou modifié."
  - terme: "private / package-private / protected / public"
    definition: "Les quatre modificateurs d'accès de Java, du plus restrictif au plus ouvert. `package-private` (aucun mot-clé) est la visibilité par défaut : accessible depuis le même package uniquement."
  - terme: Accesseur (getter)
    definition: "Méthode qui **lit** un attribut sans permettre de le modifier directement, par exemple `getPrix()`. Peut aussi calculer une valeur dérivée plutôt que retourner un champ brut."
  - terme: Mutateur (setter)
    definition: "Méthode qui **modifie** un attribut, par exemple `setPrix(double prix)`. À écrire seulement si la modification a du sens après la création de l'objet — sinon, elle contourne l'encapsulation sans apporter de contrôle."
  - terme: Objet immuable
    definition: "Objet dont l'état ne change **jamais** après sa construction : champs `final`, aucun mutateur, copie défensive des objets mutables reçus ou retournés. Plus simple à raisonner, naturellement thread-safe."
  - terme: Copie défensive
    definition: "Copier un objet mutable (collection, `Date`) reçu en paramètre ou retourné par un accesseur, pour empêcher l'appelant de modifier l'état interne de l'objet par effet de bord."
  - terme: Invariant
    definition: "Règle que la classe garantit **toujours vraie** pour ses instances (par exemple : « le prix d'un `Produit` n'est jamais négatif »). L'encapsulation permet de la faire respecter, en la vérifiant à chaque point d'entrée (constructeur, mutateur)."
quiz:
  - question: "Pourquoi rendre les attributs d'une classe private plutôt que public ?"
    choix:
      - "Parce que private est plus rapide à l'exécution que public"
      - "Pour empêcher toute modification de l'objet après sa création"
      - "Pour garder le contrôle sur les accès et pouvoir faire respecter des règles (validation, invariants) même après modification du code"
      - "Parce que le compilateur Java l'exige pour tous les attributs"
    reponse: 2
    explication: "private n'a aucun effet sur la performance ni n'interdit toute modification (un setter peut très bien exister). L'intérêt est de garder la main sur l'accès : la classe peut valider, transformer ou faire évoluer sa représentation interne sans casser le code qui l'utilise."
  - question: "Cette classe est-elle réellement immuable ?"
    code: |
      public final class Commande {
          private final List<String> lignes;

          public Commande(List<String> lignes) {
              this.lignes = lignes;
          }

          public List<String> getLignes() {
              return lignes;
          }
      }
    choix:
      - "Oui, car lignes est final"
      - "Non : le constructeur et l'accesseur exposent directement la référence, l'appelant peut modifier la liste"
      - "Non, car la classe devrait aussi être abstract"
      - "Oui, car List est déjà une interface immuable"
    reponse: 1
    explication: "final sur lignes empêche de réaffecter le champ, mais pas de modifier la liste elle-même : list.add(...) depuis l'extérieur modifie l'état interne de Commande, que ce soit via la liste passée au constructeur ou via celle retournée par getLignes(). Il faut copier la liste à l'entrée et au retour (ou exposer une vue non modifiable)."
  - question: "Une classe Produit n'expose que des getters et des setters pour chaque champ, sans aucune autre méthode ; toute la logique de calcul (remise, disponibilité) vit dans une classe ProduitService séparée. Comment qualifie-t-on ce style de conception ?"
    choix:
      - "Un modèle anémique : la classe n'est qu'un sac de données, le comportement est ailleurs"
      - "Une bonne application du principe d'encapsulation"
      - "Un objet immuable"
      - "Un exemple d'héritage"
    reponse: 0
    explication: "Techniquement, les champs sont bien private : l'encapsulation au sens strict n'est pas violée. Mais le comportement qui devrait appartenir à Produit est déporté ailleurs, ce qui affaiblit l'intérêt de l'encapsulation (les invariants ne sont plus garantis par la classe elle-même) : c'est le piège du modèle anémique."
---

## Essentiel

L'**encapsulation** consiste à cacher l'état interne d'un objet et à n'exposer que ce qui est nécessaire, par des méthodes. Java offre quatre modificateurs d'accès :

| Modificateur | Même classe | Même package | Sous-classe (autre package) | Partout |
|---|---|---|---|---|
| `private` | ✅ | ❌ | ❌ | ❌ |
| *(aucun, package-private)* | ✅ | ✅ | ❌ | ❌ |
| `protected` | ✅ | ✅ | ✅ | ❌ |
| `public` | ✅ | ✅ | ✅ | ✅ |

```java
public class Produit {
    private String nom;       // caché : accessible seulement via les méthodes
    private double prix;

    public String getNom() { return nom; }              // accesseur
    public void setPrix(double prix) {                   // mutateur avec contrôle
        if (prix < 0) throw new IllegalArgumentException("Le prix ne peut pas être négatif");
        this.prix = prix;
    }
}
```

Les champs sont `private` par défaut : c'est la classe elle-même qui décide comment on peut lire ou modifier son état, et elle peut valider chaque changement. N'écrivez un mutateur que si la modification a réellement du sens après la création de l'objet — sinon, un champ `final` sans setter est plus sûr : c'est la base d'un **objet immuable**.

## Détail

### Pourquoi c'est utile

- **Contrôle des invariants** : un `setPrix` qui refuse les valeurs négatives garantit que `Produit` n'est jamais dans un état incohérent.
- **Liberté d'évolution** : la représentation interne peut changer (par exemple stocker un prix en centimes) sans casser le code appelant, tant que la signature publique reste la même.
- **Réduction du couplage** : le code extérieur dépend d'un contrat (les méthodes publiques), pas des détails d'implémentation.

### Exemple 1 — Getters et setters classiques

```java
public class Client {
    private String email;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Email invalide : " + email);
        }
        this.email = email;
    }
}
```

Le setter n'est pas un simple `this.email = email;` : il valide. C'est tout l'intérêt de passer par une méthode plutôt que par un champ public.

### Exemple 2 — Objet immuable avec copie défensive

```java
public final class Commande {
    private final String reference;
    private final List<String> lignes;
    private final LocalDate dateCreation;

    public Commande(String reference, List<String> lignes, LocalDate dateCreation) {
        this.reference = reference;
        this.lignes = new ArrayList<>(lignes);       // copie défensive en entrée
        this.dateCreation = dateCreation;             // LocalDate est déjà immuable
    }

    public List<String> getLignes() {
        return List.copyOf(lignes);                   // copie défensive en sortie (vue non modifiable)
    }

    public LocalDate getDateCreation() {
        return dateCreation;
    }
}
```

`LocalDate` est lui-même immuable (voir le chapitre temps et texte), il n'a donc pas besoin de copie. `List<String>` est mutable : sans copie à l'entrée et à la sortie, l'appelant pourrait modifier `lignes` après coup, en passant par la liste d'origine ou par la valeur retournée par `getLignes()`.

### Exemple 3 — Un invariant maintenu par le constructeur

```java
public class LignePanier {
    private final String produit;
    private final int quantite;

    public LignePanier(String produit, int quantite) {
        if (quantite <= 0) {
            throw new IllegalArgumentException("La quantité doit être positive");
        }
        this.produit = produit;
        this.quantite = quantite;
    }
    // pas de setQuantite : pour changer la quantité, on recrée une LignePanier
}
```

Sans mutateur, l'invariant « quantité toujours positive » est garanti pour toute la vie de l'objet, vérifié une seule fois, au seul endroit où l'état peut être fixé : le constructeur.

### Exemple 4 — Le piège du modèle anémique

```java
// Anémique : Commande n'est qu'un sac de données
public class Commande {
    private List<LignePanier> lignes;
    private String statut;
    // getters/setters pour tout, aucune autre méthode
}

public class CommandeService {
    public double calculerTotal(Commande commande) { /* logique ici */ }
    public boolean peutEtreAnnulee(Commande commande) { /* logique ici */ }
}
```

```java
// Mieux : le comportement vit avec les données qu'il manipule
public class Commande {
    private final List<LignePanier> lignes;
    private String statut;

    public double calculerTotal() {
        return lignes.stream().mapToDouble(LignePanier::sousTotal).sum();
    }

    public boolean peutEtreAnnulee() {
        return "EN_ATTENTE".equals(statut);
    }
}
```

Dans la première version, rien n'empêche un autre service d'ignorer les règles métier et de manipuler `Commande` de façon incohérente : les setters ouvrent l'état sans le protéger. Rapprocher les données et le comportement qui les fait respecter est l'objectif même de l'encapsulation.

### Pièges courants

> **Générer des getters/setters pour tous les champs sans réfléchir.** L'IDE le propose en un clic, mais chaque setter est une porte ouverte sur l'état interne. Demandez-vous, champ par champ, si la modification a du sens depuis l'extérieur.

> **Retourner directement une collection ou une `Date` mutable.** `return this.lignes;` (sans copie) expose la référence interne : l'appelant modifie l'objet en modifiant ce qu'il a reçu. Ce piège existe aussi en sens inverse, dans le constructeur, avec les paramètres reçus.

> **Confondre encapsulation et immuabilité.** Une classe peut être bien encapsulée (champs `private`, accès contrôlés) tout en restant mutable via des setters qui valident. L'immuabilité est un choix de conception supplémentaire, pas une conséquence automatique de l'encapsulation.

### À retenir

- Champs `private` par défaut ; n'élargissez la visibilité que si nécessaire.
- N'écrivez un mutateur que si la modification a du sens après construction — sinon `final` sans setter.
- Copiez les collections et objets mutables en entrée de constructeur et en sortie d'accesseur.
- Un invariant vérifié dans le constructeur (et, s'il existe, dans le mutateur) reste vrai pendant toute la vie de l'objet.
- Encapsuler, ce n'est pas seulement cacher des champs : c'est garder le comportement avec les données qu'il manipule, pour éviter le modèle anémique.
