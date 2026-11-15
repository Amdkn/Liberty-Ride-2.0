# PRD-B1-ANTI-ORPHAN — Product Requirements Document : Loi Anti-Orphan-Work

## 1. Problème Résolu
Dans les systèmes multi-agents classiques, les tâches créées sans responsable explicite ni preuve de sortie dérivent en « travail fantôme ».

## 2. Exigences Fonctionnelles
- **Règle 1 (Assignation B2/B3)** : Toute tâche doit obligatoirement référencer un Directeur B2 valide et son Worker B3 en gilet jaune.
- **Règle 2 (Double Rejet = Escalade Hulk)** : Si un Directeur B2 rejette 2 fois le livrable de son Worker B3 (`rejectionCount >= 2`), la tâche passe en `BLOCKED_2X` et allume l'alerte Mode Hulk sur le HUD d'A0 Amadeus.
- **Règle 3 (Traçabilité Disque)** : Chaque transition d'état écrit une entrée horodatée dans `NOTES.md` et `MEMORY.md`.
