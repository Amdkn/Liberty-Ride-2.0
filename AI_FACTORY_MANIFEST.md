# AI_FACTORY_MANIFEST.md — Manifeste de l'Usine Agentique A'Space OS (LD01)

## 1. Loi Fondamentale : « 1 Dossier = 1 Bureau d'Agent Réel »
Dans **Liberty Ride 2.0**, un agent n'est jamais une simple boîte de dialogue abstraite. Chaque agent possède :
1. **Un corps spatialisé** dans le Village 2D (`AdminVillageView.tsx`) avec ses sprites dédiés et sa machine à états finis (`AgentBehaviorFSM.ts`).
2. **Un bureau physique** sur le disque dur dans `./agents/<agent-id>/` contenant :
   - `AGENT.md` (ou `PROFILE.md` pour A0) : Son contrat d'identité, ses responsabilités E-Myth et ses règles d'escalade.
   - `NOTES.md` : Sa mémoire d'apprentissage cumulée (*What they learned*).
   - `SPECS/` : Ses documents SDD (System Design Document) et PRD (Product Requirements Document).
   - `TASKS.json` : Sa file de travaux actuelle.
   - `RECEIPTS.json` : Ses preuves d'exécution cryptographiques et horodatées.

## 2. Cycle de Vie d'une Tâche (Workgraph Protocol)
```text
[A0 Amadeus : Intention / Double-N]
       │
       ▼
[B1 Elena Rostova : Sprite PHONE_DISPATCH + Check Anti-Orphan-Work]
       │  (Faisceau lumineux + Écriture dans ./agents/b2-XX/TASKS.json)
       ▼
[B2 Directeur de Domaine : S'assoit à son bureau (SEATED) & valide la Spec]
       │  (Délégation descendante au Worker B3 du pavillon)
       ▼
[B3 Technicien Gilet Jaune : S'anime dans l'atelier (EXECUTING_SOP)]
       │  (Génère la preuve dans RECEIPTS.json & marche vers B2 : SUBMITTING_RECEIPT)
       ▼
[B2 Directeur : Audit TDD/SDD du Reçu]
   ├── Succès ──► Statut COMPLETED + Apprentissage écrit dans NOTES.md & MEMORY.md
   └── 2 Échecs ► Statut BLOCKED_2X ──► Alerte A0 Mode Hulk (UNBLOCK_HULK / Touche H)
```

## 3. Souveraineté Zéro Coût Caché
- Aucun appel réseau facturé au token n'est requis pour faire tourner la simulation, inspecter les bureaux, éditer les specs ou tester les boucles de dispatch.
- Les connecteurs externes (`supabase/`, `workflows/n8n/`, `workflows/vapi/`) sont fournis clés en main et découplés derrière des variables d'environnement optionnelles.
