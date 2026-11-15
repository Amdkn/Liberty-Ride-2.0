# DECISIONS_LOG.md — Registre des Décisions Architecturales (ADR)

## ADR-001 : Adoption du Monorepo Unifié « Agent-First » (Option 1)
- **Date** : 2026-11-15
- **Décideur** : A0 Amadeus
- **Statut** : ACCEPTÉ & IMPLÉMENTÉ
- **Contexte** : Éviter la dispersion entre dépôts multiples et garantir que chaque agent visuel dans le village 2D corresponde exactement à un dossier réel sur le disque (`./agents/`).
- **Décision** : Héberger à la racine de `Liberty-Ride-2.0` l'arborescence `./agents/` connectée en lecture/écriture directe au frontend via le middleware Vite `/api/agents`, avec repli automatique sur `localStorage` en hébergement statique.

## ADR-002 : Règle Zéro Coût Caché & Zéro Dépendance Payante Externe
- **Date** : 2026-11-15
- **Décideur** : A0 Amadeus
- **Statut** : ACCEPTÉ & VERROUILLÉ
- **Contexte** : Protéger la trésorerie et garantir une autonomie d'exécution de 100 % sans clé API facturée à l'usage ni génération payante externe (Zéro Higgsfield).
- **Décision** : Implémenter un moteur hybride (`ProceduralSceneRenderer.ts` + `SpriteSheetSlicer.ts`) capable de charger les planches PNG de `public/assets/` ou de synthétiser en Canvas HD toutes les cartes, les 9 salles et les sprites 3x4 avec Auto-ChromaKey.

## ADR-003 : Escalade `BLOCKED_2X` et Intervention Souveraine A0 (Mode Hulk)
- **Date** : 2026-11-15
- **Décideur** : A0 Amadeus & Elena Rostova (B1)
- **Statut** : ACCEPTÉ & IMPLÉMENTÉ
- **Contexte** : Empêcher les boucles infinies d'agents lorsqu'un Worker B3 échoue deux fois à la validation TDD/SDD de son Directeur B2.
- **Décision** : Au 2e rejet consécutif, la tâche passe en `BLOCKED_2X`. A0 Amadeus peut activer le **Mode Hulk (`UNBLOCK_HULK`, Touche H)** pour doubler sa vitesse de déplacement et trancher/débloquer la tâche avec génération immédiate d'un reçu souverain.

## ADR-004 : Séparation des Postures `STANDING` / `SEATED` et Ancres du City Hall
- **Date** : 2026-11-15
- **Décideur** : Liam Chen (`b2-03-products`)
- **Statut** : ACCEPTÉ & IMPLÉMENTÉ
- **Décision** : Chaque Directeur B2 dispose d'une planche de marche `3x4` (`standing`) et d'un sprite dédié `seated`. Lors de l'appel **`🏛 Call Town Hall` (`Touche C`)**, les 8 Directeurs B2 rejoignent leurs coordonnées exactes autour de la table-maquette de `Room 00` (`SeatedAnchorsRegistry.ts`) et basculent automatiquement en posture assise.
