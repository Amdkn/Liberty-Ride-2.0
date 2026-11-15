# AGENTS.md — Annuaire & Gouvernance E-Myth d'A'Space OS (LD01)

Ce document définit la hiérarchie canonique des agents de **Liberty Ride 2.0 (LD01)** et leur correspondance stricte avec les dossiers physiques sous `./agents/`.

## 1. Hiérarchie Stratégique (`A0 → B1 → B2 → B3`)

- **A0 — Amadeus (`agents/a0-amadeus/`)**
  - **Rôle** : Fondateur, Actionnaire Unique & Arbitre Suprême.
  - **Sprites** : `NORMAL_HOODY` (`amadeus-hoody-walk-3x4.png`) & `UNBLOCK_HULK` (`amadeus-hulk-unblock-3x4.png`).
  - **Privilèges exclusifs** : Détenteur des **5 Human Gates cryptographiques** (Soumission KYTC, Polices d'Assurance Flotte, Grille Tarifaire Officielle CVG, Décaissements > $500, Contrats B2B) et du pouvoir **UNBLOCK (Mode Hulk)** après 2 rejets consécutifs (`BLOCKED_2X`).

- **B1 — Elena Rostova (`agents/b1-ceo-chief-of-staff/`)**
  - **Rôle** : Visionnaire CEO & Chief of Staff.
  - **Maison** : `Room 00` — City Hall Executive Boardroom.
  - **Sprites** : `WALK_FOLLOW` (suit A0 à 18 frames de délai) & `PHONE_DISPATCH` (téléphone en main lors du dispatch vers les Directeurs B2).
  - **Loi Anti-Orphan-Work** : Aucune tâche n'est créée sans propriétaire B2, exécutant B3, critère d'acceptation TDD et preuve attendue dans `RECEIPTS.json`.

---

## 2. Les 8 Directeurs de Domaines B2 (Managers E-Myth)

| ID Agent | Nom du Directeur | Salle | Couleur Toit | Worker B3 Rattaché | Domaine & Responsabilités Clés |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `b2-01-operations` | **Marcus Vance** | `Room 01` | `#00E5FF` (Cyan) | `b3-ops-dispatch` | Dispatch temps réel, SLA ponctualité Erlanger–CVG, flotte SUV, Service Recovery |
| `b2-02-growth` | **Clara Morel** | `Room 02` | `#00E676` (Émeraude) | `b3-growth-media` | Tunnel AARRR, SEO local Erlanger/CVG, Google Business Profile, attribution |
| `b2-03-products` | **Liam Chen** | `Room 03` | `#2979FF` (Bleu Royal) | `b3-product-builder` | UX/UI, Customer World, Driver House 3D Layered Twin, Admin Agent Village |
| `b2-04-sales` | **Sofia Alverez** | `Room 04` | `#FF6D00` (Terracotta) | `b3-sales-crm` | Offres B2B (`$100M Offers`), partenariats hôtels CVG, navettes entreprises, CRM |
| `b2-05-finance` | **Arthur Sterling** | `Room 05` | `#FFD600` (Or) | `b3-fin-ledger` | Unit economics (`>= $45/h` chauffeur), facturation, rapprochement, FinOps IA |
| `b2-06-legal` | **Nadia Benali** | `Room 06` | `#ECEFF1` (Ardoise) | `b3-legal-compliance` | Conformité KYTC, permis aéroport CVG, assurances commerciales, contrats |
| `b2-07-it` | **Viktor Kovács** | `Room 07` | `#D500F9` (Violet) | `b3-it-sre` | Supabase RLS, workflows n8n idempotents, téléphonie Vapi, continuité GitHub |
| `b2-08-people` | **Maya Lin** | `Room 08` | `#FF4081` (Corail) | `b3-people-onboarding` | Onboarding chauffeurs, Driver Business Academy, vérification permis, certification |

---

## 3. Protocole d'Exécution & Vérification (`B2 ↔ B3`)

1. **Dispatch B1 → B2** : Elena Rostova (`B1`) reçoit l'intention d'A0, vérifie la conformité Anti-Orphan-Work et inscrit la tâche dans `./agents/<b2-domain>/TASKS.json`.
2. **Délégation B2 → B3** : Le Directeur B2 s'assoit à son bureau (`SEATED`) et active son Technicien B3 en gilet de sécurité jaune haute visibilité (`EXECUTING_SOP`).
3. **Preuve & Reçu (`RECEIPTS.json`)** : Le Worker B3 exécute la SOP, produit un reçu vérifiable (`RECEIPTS.json`) et marche jusqu'au bureau de son Directeur B2 (`SUBMITTING_RECEIPT`).
4. **Validation ou Escalade Hulk** :
   - Si la preuve respecte la spec SDD/TDD, B2 passe la tâche en `COMPLETED` et consigne l'apprentissage dans `NOTES.md` et `MEMORY.md`.
   - En cas de 2 échecs consécutifs de validation, la tâche passe en `BLOCKED_2X` et déclenche l'alerte **Mode Hulk (`UNBLOCK_HULK`)** auprès d'A0 Amadeus.
