# SDD-SUPABASE-RLS-N8N — System Design Document : Persistance Hybride & Idempotence

## 1. Architecture de Persistance à 3 Niveaux
1. **Niveau 1 (Disque Git `./agents/`)** : Source de vérité locale via `/api/agents`.
2. **Niveau 2 (`localStorage` Browser)** : Continuité hors-ligne instantanée.
3. **Niveau 3 (Supabase PostgreSQL + RLS)** : Schémas `001_world_model_core.sql` et `002_ai_factory_workgraph.sql`.
