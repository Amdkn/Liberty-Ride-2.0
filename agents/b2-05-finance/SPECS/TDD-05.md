# TDD-05 — Test-Driven Acceptance Spec (Finance & Unit Economics)

1. **Given** une mission assignée par `B1` dans `TASKS.json`
2. **When** `b3-fin-ledger` exécute la SOP dans `room-05-finance`
3. **Then** un reçu signé est écrit dans `RECEIPTS.json` et validé par `b2-05-finance` (ou escaladé en `BLOCKED_2X` -> `UNBLOCK_HULK`).
