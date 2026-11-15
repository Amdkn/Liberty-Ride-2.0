# DECISIONS_LOG.md — Registre des Décisions Architecturales (ADR)

## ADR-001 : Adoption du Monorepo Unifié « Agent-First » (Option 1 + Dual-Plane)
- **Date** : 2026-11-15
- **Décideur** : A0 Amadeus
- **Statut** : ACCEPTÉ & IMPLÉMENTÉ
- **Contexte** : Éviter la dispersion entre dépôts multiples et garantir que chaque agent visuel dans le village 2D corresponde exactement à un dossier réel sur le disque (`./agents/`).
- **Décision** : Héberger à la racine de `Liberty-Ride-2.0` l'arborescence `./agents/` (avec `AGENT.md`, `NOTES.md`, `STATE.json`, `TASKS.json`, `RECEIPTS.json`, `SPECS/` et `workers/b3-*/`) connectée en lecture/écriture directe au frontend via le middleware Vite `/api/agents`, avec repli automatique sur `localStorage` en hébergement statique.

## ADR-002 : Règle Zéro Coût Caché, Zéro Higgsfield & Éradication du « AI Slop »
- **Date** : 2026-11-15
- **Décideur** : A0 Amadeus
- **Statut** : ACCEPTÉ & VERROUILLÉ
- **Contexte** : Protéger la trésorerie (Zéro Higgsfield/API payante) tout en interdisant strictement les rendus procéduraux génériques (« AI Slop » : boîtes néon ou bonshommes bâtons).
- **Décision** : Utiliser exclusivement les illustrations isométriques HD du Google Drive compressées en **`.webp`** (`public/assets/maps/`, `public/assets/rooms/`, `public/assets/sprites/`) avec animations Canvas atmosphériques par-dessus (fontaine solaire vivante, radar CVG, SUV Dixie Highway, cartes des 8 façades pré-découpées au survol).

## ADR-003 : Escalade `BLOCKED_2X` et Intervention Souveraine A0 (Mode Hulk)
- **Date** : 2026-11-15
- **Décideur** : A0 Amadeus & Elena Rostova (B1)
- **Statut** : ACCEPTÉ & IMPLÉMENTÉ
- **Contexte** : Empêcher les boucles infinies d'agents lorsqu'un Worker B3 échoue deux fois à la validation TDD/SDD de son Directeur B2.
- **Décision** : Au 2e rejet consécutif, la tâche passe en `BLOCKED_2X`. A0 Amadeus peut activer le **Mode Hulk (`UNBLOCK_HULK`, Touche H)** pour doubler sa vitesse de déplacement et trancher/débloquer la tâche avec génération immédiate d'un reçu souverain.

## ADR-004 : Séparation des Postures `STANDING` / `SEATED` et Ancres Calibrées (`Room 00`–`Room 08`)
- **Date** : 2026-11-15
- **Décideur** : Liam Chen (`b2-03-products`)
- **Statut** : ACCEPTÉ & IMPLÉMENTÉ
- **Décision** :
  - **Série 2 (`Caracteres/`)** retenue comme source canonique pour les planches de marche `3×4` des Directeurs B2 (`public/assets/sprites/b2-standing/b2-01..08-3x4.webp`).
  - **`Futuristic Officer Phone-Call Sprite Sheet.png`** retenue pour la posture `PHONE_DISPATCH` (`public/assets/sprites/b1/ceo-women-phone-dispatch.webp`).
  - **16 sprites assis individuels `1×1` (`320×320` RGBA)** pré-extraits (`b2-01..08-seated.webp` face + `b2-01..08-seated-side.webp` profil) et ancrés sur le vrai bureau en bois courbé en haut à gauche de chaque salle (`x: 345, y: 248`) ainsi que sur les 15 fauteuils en cuir vert de `Room 00` City Hall.
