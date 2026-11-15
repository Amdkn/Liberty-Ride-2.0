# PRD-VAPI-TELEPHONY-SRE — Product Requirements Document : Réceptionniste Vocale Vapi

## 1. Flux d'Appel Client CVG
- Réponse en `< 800 ms` avec détection automatique du numéro de vol CVG.
- Calcul immédiat du forfait SUV Erlanger/CVG/Cincinnati.
- Injection d'une tâche `DISPATCHED` dans `./agents/b2-01-operations/TASKS.json`.
