# Liberty Ride 2.0 (LD01) — A'Space OS Monorepo Unifié « Agent-First »

Bienvenue dans le monorepo officiel de **Liberty Ride 2.0 (LD01)**, opéré sous la direction exclusive d'**A0 Amadeus** (Fondateur & Actionnaire) et orchestré par le système **A'Space OS**.

Ce dépôt implémente l'**Option 1 : Monorepo Unifié « Agent-First »**, fusionnant le pattern *Agent Village* (1 dossier dans `./agents/` = 1 bureau d'agent réel avec `AGENT.md`, `NOTES.md`, `SPECS/`, `TASKS.json` et `RECEIPTS.json`) avec la pyramide de gouvernance E-Myth (`A0 Actionnaire → B1 CEO Visionnaire → 8 Directeurs B2 → 8 Techniciens B3 en gilet jaune`) et les **3 Expériences Interactives** de Liberty Driver.

---

## 🏛 Les 3 Mondes Unifiés dans l'Application

1. **🌍 Admin Agent Village (Moteur 2D HD Solarpunk — `1280x720`)**
   - **Carte Overworld (`Campus Map`)** : Anneau Solarpunk avec place centrale, City Hall au nord, 8 pavillons de domaines B2, Garage 3 baies SUV à l'est, Aéroport CVG au nord-est et Dixie Highway au sud.
   - **9 Salles Intérieures HD (`Rooms 00 à 08`)** :
     - `Room 00` (**City Hall Executive Boardroom**) : Grande table de conseil contenant la **maquette miniature illuminée du village (« village dans le village »)** entourée de **15 fauteuils en cuir** où A0, B1 et les 8 Directeurs B2 s'assoient lors du Conseil 12WY.
     - `Rooms 01 à 08` : Bureaux spécialisés des 8 Directeurs B2 et de leurs Workers B3 en gilet jaune haute visibilité.
   - **Moteur Hybride PNG + Fallback Procédural HD + Drag & Drop** : Charge les planches PNG depuis `public/assets/` ou génère à la volée les sprites 3x4 haute définition et les décors Solarpunk + import direct à chaud via **`📂 Importer PNGs Drive`**.

2. **🏢 Driver House 3D Layered Twin (Three.js / `@react-three/fiber`)**
   - Jumeau numérique architectural 3D interactif à 3 étages + toit :
     - **Niveau 1 — Garage & Fleet Readiness** : 3 baies SUV noirs, télémétrie batterie/maintenance, checklist pré-départ.
     - **Niveau 2 — Legal, KYTC & Compliance Vault** : Licences KYTC, permis CVG Airport, assurances commerciales, Human Gates A0.
     - **Niveau 3 — FinOps & CVG Corridor Simulator** : Simulateur temps réel de rentabilité chauffeur (cible `>= $45/h net`), tarification Erlanger ↔ CVG ↔ Cincinnati.
     - **Toit — Dispatch Tower & Driver Business Academy** : Tour radar, antenne Vapi/n8n et certification E-Myth.
   - Contrôles de coupe : `FULL_BUILDING`, `CUTAWAY_UP_TO`, `FLOOR_ISOLATE`, `EXPLODED_STACK`, `XRAY` + Fallback Plan 2D Architecte.

3. **🚖 Customer World (Portail Erlanger – CVG Airport – Cincinnati)**
   - Tunnel de réservation 2D ultra-rapide sur le corridor **Erlanger KY ↔ CVG Airport ↔ Downtown Cincinnati**.
   - Calculateur de tarif garanti, suivi de vol CVG en direct, et **Simulateur Vocal Vapi** déclenchant automatiquement une vraie tâche de dispatch dans `./agents/b2-01-operations/TASKS.json`.

---

## ⌨️ Raccourcis Clavier & Contrôles (Admin Agent Village)

| Raccourci / Action | Fonction |
| :--- | :--- |
| **`ZQSD` / `WASD` / Flèches** ou **Clic Sol** | Déplacement d'A0 Amadeus avec pathfinding A* (`Shift` pour courir). Approcher d'une porte fait entrer/sortir automatiquement A0 et B1. |
| **`Touche M`** (ou bouton `🗺 Walkmap`) | Affiche/masque la grille de collision **Vert (Marchable) / Rouge (Obstacles)**. |
| **`Double-N`** (ou bouton `📲 Call B1 CEO`) | Ouvre le dispatch rapide : A0 ordonne → Elena B1 sort son téléphone (`PHONE_DISPATCH`) → faisceau vers B2 → B3 exécute → reçu `RECEIPTS.json` → mise à jour `NOTES.md`. |
| **`Touche C`** (ou bouton `🏛 Call Town Hall`) | Convoque A0, B1 et les 8 Directeurs B2 dans le **City Hall (`Room 00`)** autour de la table-maquette en posture **Assise (`SEATED`)**. |
| **`Touche H`** (ou bouton `⚡ Mode Hulk UNBLOCK`) | Transforme A0 Amadeus en **Hulk (`UNBLOCK_HULK`)**, double sa vitesse et débloque en 1 clic les tâches en statut `BLOCKED_2X`. |
| **`Touche T`** (ou clic sur un agent) | Ouvre le tiroir d'inspection lisant et sauvegardant sur disque `AGENT.md`, `NOTES.md`, `SPECS/`, `TASKS.json` et `RECEIPTS.json`. |

---

## 🚀 Démarrage Rapide

```bash
npm install
npm run typecheck
npm run build
npm run dev
```
