# TDD-06 — Test-Driven Acceptance Spec (Legal & KYTC Compliance)

1. **Given** une mission assignée par `B1` dans `TASKS.json`
2. **When** `b3-legal-compliance` exécute la SOP dans `room-06-legal`
3. **Then** un reçu signé est écrit dans `RECEIPTS.json` et validé par `b2-06-legal` (ou escaladé en `BLOCKED_2X` -> `UNBLOCK_HULK`).
