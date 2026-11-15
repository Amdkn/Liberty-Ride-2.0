# TDD-04 — Test-Driven Acceptance Spec (Sales & B2B Offers)

1. **Given** une mission assignée par `B1` dans `TASKS.json`
2. **When** `b3-sales-crm` exécute la SOP dans `room-04-sales`
3. **Then** un reçu signé est écrit dans `RECEIPTS.json` et validé par `b2-04-sales` (ou escaladé en `BLOCKED_2X` -> `UNBLOCK_HULK`).
