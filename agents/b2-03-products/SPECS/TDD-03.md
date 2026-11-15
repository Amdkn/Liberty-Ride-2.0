# TDD-03 — Test-Driven Acceptance Spec (Products & Twin UX)

1. **Given** une mission assignée par `B1` dans `TASKS.json`
2. **When** `b3-product-builder` exécute la SOP dans `room-03-products`
3. **Then** un reçu signé est écrit dans `RECEIPTS.json` et validé par `b2-03-products` (ou escaladé en `BLOCKED_2X` -> `UNBLOCK_HULK`).
