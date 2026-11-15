-- =============================================================================
-- 002_ai_factory_workgraph.sql
-- Liberty Ride 2.0 (LD01) — E-Myth Agent Village Workgraph (A0 -> B1 -> B2 -> B3)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agent_nodes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('A0', 'B1', 'B2', 'B3')),
  domain TEXT NOT NULL,
  room_id TEXT NOT NULL,
  roof_color TEXT NOT NULL,
  supervisor_id TEXT REFERENCES public.agent_nodes(id),
  posture_state TEXT NOT NULL,
  folder_path TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  owner_b2 TEXT NOT NULL REFERENCES public.agent_nodes(id),
  worker_b3 TEXT NOT NULL REFERENCES public.agent_nodes(id),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'DISPATCHED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'REJECTED_ONCE', 'BLOCKED_2X')),
  rejection_count INTEGER NOT NULL DEFAULT 0,
  requires_human_gate BOOLEAN NOT NULL DEFAULT FALSE,
  human_gate_id TEXT REFERENCES public.human_gates(gate_id),
  acceptance_criteria TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agent_receipts (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES public.agent_nodes(id),
  verified_by TEXT NOT NULL REFERENCES public.agent_nodes(id),
  summary TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_receipts ENABLE ROW LEVEL SECURITY;
