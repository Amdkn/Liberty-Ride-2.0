# TDD-01 — Test-Driven Acceptance Spec (Operations & Dispatch CVG)

1. **Given** une mission assignée par `B1` dans `TASKS.json`
2. **When** `b3-ops-dispatch` exécute la SOP dans `room-01-operations`
3. **Then** un reçu signé est écrit dans `RECEIPTS.json` et validé par `b2-01-operations` (ou escaladé en `BLOCKED_2X` -> `UNBLOCK_HULK`).
