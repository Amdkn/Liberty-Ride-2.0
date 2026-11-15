# SDD-B1-GOVERNANCE — System Design Document : Gouvernance Exécutive B1

## 1. Architecture du Dispatch Téléphonique (`PHONE_DISPATCH`)
Lorsqu'A0 Amadeus émet une directive via `Double-N` ou le bouton `📲 Call B1 CEO` :
1. `b1-ceo-chief-of-staff` interrompt temporairement son état `WALK_FOLLOW` et passe en `PHONE_DISPATCH`.
2. Le moteur `capabilityEngine.ts` analyse le domaine cible (`OPERATIONS`, `GROWTH`, `PRODUCTS`, `SALES`, `FINANCE`, `LEGAL`, `IT`, `PEOPLE`).
3. Si la tâche touche l'un des 5 périmètres souverains, le drapeau `requiresHumanGate` est activé et soumis à A0.
4. La tâche est persistée dans `./agents/<b2-id>/TASKS.json` via `POST /api/agents/task`.
