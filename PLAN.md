# PLAN.md — Plan Directeur d'Exécution 12-Week Year (12WY) — Liberty Ride 2.0

## Phase 1 : Fondations Monorepo & Cerveau Agentique (`./agents/`) — [100% COMPLÉTÉ]
- [x] Création de l'arborescence complète `./agents/` pour `A0`, `B1`, les `8 Directeurs B2` (`SPECS/` inclus) et les `8 Workers B3` en gilet jaune.
- [x] Implémentation du plugin serveur Vite `agent-filesystem-api` (`GET /api/agents`, `POST /api/agents/task`, `POST /api/agents/notes`) avec persistance disque et fallback `localStorage`.
- [x] Verrouillage des 5 Human Gates d'A0 Amadeus (`src/world-model/humanGates.ts`) et du moteur Anti-Orphan-Work (`src/world-model/capabilityEngine.ts`).

## Phase 2 : Moteur 2D « Admin Agent Village » — [100% COMPLÉTÉ]
- [x] Rendu Canvas HD `1280x720` de l'Overworld Solarpunk (Anneau central, City Hall, 8 Pavillons B2, Garage 3 SUV, CVG Airport, Dixie Highway).
- [x] Rendu des 9 Salles Intérieures HD (`Room 00` City Hall avec table-maquette « village dans le village » et 15 fauteuils + `Rooms 01-08`).
- [x] Découpeur de sprites 3x4 + Auto-ChromaKey + Générateur procédural HD (`SpriteSheetSlicer.ts`) + Import Drag & Drop PNGs Drive.
- [x] Machine à états finis (`AgentBehaviorFSM.ts`) : A0 Hoody/Hulk, B1 Follow 18 frames / Phone Dispatch, B2 Standing/Seated, B3 Gilet Jaune SOP -> Receipt.
- [x] Pathfinding A* et calque Walkmap Vert/Rouge (`Touche M`).

## Phase 3 : Driver House 3D Layered Twin & Customer World — [100% COMPLÉTÉ]
- [x] Jumeau 3D Three.js/R3F à 3 étages + toit avec modes `FULL_BUILDING`, `CUTAWAY_UP_TO`, `FLOOR_ISOLATE`, `EXPLODED_STACK`, `XRAY` et Fallback 2D.
- [x] Simulateur FinOps Chauffeur (`DriverEarningsSimulator.tsx`) validant la cible `>= $45/h`.
- [x] Portail `CustomerWorldView.tsx` (Corridor Erlanger–CVG–Cincinnati + Simulateur Vocal Vapi connecté au dispatch B2 Operations).

## Phase 4 : Infrastructure Supabase & Workflows n8n/Vapi — [100% COMPLÉTÉ]
- [x] Migrations SQL Supabase (`001_world_model_core.sql`, `002_ai_factory_workgraph.sql`, `seed.sql`).
- [x] Workflows prêts à l'emploi (`workflows/n8n/booking-dispatch-recovery.json`, `workflows/vapi/receptionist-config.json`).
