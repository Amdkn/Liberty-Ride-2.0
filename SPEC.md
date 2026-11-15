# SPEC.md — Spécification Technique Globale (SDD / PRD / TDD / DDD)

## 1. Domaine Driven Design (DDD) — Le World Model Unifié
Le cœur de l'application (`src/world-model/`) partage un état unique et typé entre les 3 expériences :
- **`AgentNode`** : Identité, niveau hiérarchique (`A0`, `B1`, `B2`, `B3`), domaine (`OPERATIONS`, `GROWTH`, `PRODUCTS`, `SALES`, `FINANCE`, `LEGAL`, `IT`, `PEOPLE`), posture (`NORMAL_HOODY`, `UNBLOCK_HULK`, `WALK_FOLLOW`, `PHONE_DISPATCH`, `STANDING`, `SEATED`, `EXECUTING_SOP`, `SUBMITTING_RECEIPT`), salle courante (`CAMPUS` ou `ROOM_00`..`ROOM_08`) et coordonnées `(x, y)`.
- **`TaskRecord`** : Tâche gouvernée par le moteur Anti-Orphan-Work (`capabilityEngine.ts`), incluant `ownerB2`, `workerB3`, `status` (`PENDING`, `DISPATCHED`, `IN_PROGRESS`, `SUBMITTED`, `COMPLETED`, `REJECTED_ONCE`, `BLOCKED_2X`), `rejectionCount` et `requiresHumanGate`.
- **`ReceiptRecord`** : Preuve d'exécution horodatée avec hash de vérification, métriques mesurées et signature du Worker B3 et du Directeur B2.

## 2. Spécification du Moteur 2D « Admin Agent Village »
- **Résolution interne** : Canvas HD `1280x720` avec mise à l'échelle fluide.
- **Échelles réglementaires** :
  - `CAMPUS` (Overworld) : Hauteur des personnages = `720 / 22 ≈ 32.7 px` (rendu net avec halo d'identification et badge).
  - `ROOM_00` à `ROOM_08` (Intérieurs HD) : Hauteur des personnages = `720 / 12 = 60 px`.
- **Grille de Collision & Pathfinding A*** :
  - Grille logique `64x36` cellules (`20x20 px` par cellule).
  - Superposition visuelle activable via **`Touche M`** : cellules marchables en vert émeraude translucide, obstacles (bâtiments, fontaine centrale, table-maquette du City Hall, bureaux B2, baies SUV) en rouge translucide.
- **Salles Intérieures (`Rooms 00 à 08`)** :
  - `Room 00` : City Hall avec table de conseil contenant la maquette miniature illuminée du village et 15 fauteuils en cuir (`SeatedAnchorsRegistry.ts`).
  - `Rooms 01-08` : 8 intérieurs distincts avec toit/accent de couleur domaine, bureau directeur B2, zone d'atelier SOP pour le Worker B3 en gilet jaune et double porte de sortie au sud.

## 3. Spécification du Jumeau 3D « Driver House Layered Twin »
- **Scène Three.js / `@react-three/fiber`** :
  - `Floor 1 (Y=0)` : Garage 3 baies SUV noirs + bornes de charge + inspection mécanique.
  - `Floor 2 (Y=2.6)` : Compliance & Legal Vault (dossiers KYTC, badge CVG, assurance).
  - `Floor 3 (Y=5.2)` : FinOps Center & Simulateur CVG (`>= $45/h`).
  - `Roof (Y=7.8)` : Dispatch Radar Tower & Driver Business Academy.
- **5 Modes d'Inspection (`FloorSlicerControls.tsx`)** :
  - `FULL_BUILDING`, `CUTAWAY_UP_TO`, `FLOOR_ISOLATE`, `EXPLODED_STACK`, `XRAY` + bascule instantanée vers le **Plan Architecte 2D**.

## 4. Spécification du Portail « Customer World »
- Sélecteur de trajet sur le corridor **Erlanger ↔ CVG Airport ↔ Cincinnati**.
- Calculateur transparent (Tarif client, part nette chauffeur `>= $45/h`, marge Liberty Ride).
- Simulateur d'appel vocal **Vapi AI Receptionist** créant en direct une tâche de dispatch dans `./agents/b2-01-operations/TASKS.json`.
