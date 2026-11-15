import { AgentNode, DomainId, ReceiptRecord, TaskRecord } from './types';
import { detectRequiredHumanGate } from './humanGates';

export interface DomainRoutingConfig {
  domain: DomainId;
  b2AgentId: string;
  b3WorkerId: string;
  roomId: string;
}

export const DOMAIN_ROUTING_MAP: Record<Exclude<DomainId, 'SOVEREIGN' | 'EXECUTIVE'>, DomainRoutingConfig> = {
  OPERATIONS: {
    domain: 'OPERATIONS',
    b2AgentId: 'b2-01-operations',
    b3WorkerId: 'b3-ops-dispatch',
    roomId: 'ROOM_01',
  },
  GROWTH: {
    domain: 'GROWTH',
    b2AgentId: 'b2-02-growth',
    b3WorkerId: 'b3-growth-media',
    roomId: 'ROOM_02',
  },
  PRODUCTS: {
    domain: 'PRODUCTS',
    b2AgentId: 'b2-03-products',
    b3WorkerId: 'b3-product-builder',
    roomId: 'ROOM_03',
  },
  SALES: {
    domain: 'SALES',
    b2AgentId: 'b2-04-sales',
    b3WorkerId: 'b3-sales-crm',
    roomId: 'ROOM_04',
  },
  FINANCE: {
    domain: 'FINANCE',
    b2AgentId: 'b2-05-finance',
    b3WorkerId: 'b3-fin-ledger',
    roomId: 'ROOM_05',
  },
  LEGAL: {
    domain: 'LEGAL',
    b2AgentId: 'b2-06-legal',
    b3WorkerId: 'b3-legal-compliance',
    roomId: 'ROOM_06',
  },
  IT: {
    domain: 'IT',
    b2AgentId: 'b2-07-it',
    b3WorkerId: 'b3-it-sre',
    roomId: 'ROOM_07',
  },
  PEOPLE: {
    domain: 'PEOPLE',
    b2AgentId: 'b2-08-people',
    b3WorkerId: 'b3-people-onboarding',
    roomId: 'ROOM_08',
  },
};

export function inferDomainFromMissionText(text: string): Exclude<DomainId, 'SOVEREIGN' | 'EXECUTIVE'> {
  const lower = text.toLowerCase();
  if (lower.includes('seo') || lower.includes('growth') || lower.includes('marketing') || lower.includes('google')) {
    return 'GROWTH';
  }
  if (lower.includes('3d') || lower.includes('ui') || lower.includes('ux') || lower.includes('sprite') || lower.includes('produit')) {
    return 'PRODUCTS';
  }
  if (lower.includes('b2b') || lower.includes('hôtel') || lower.includes('hotel') || lower.includes('vente') || lower.includes('crm')) {
    return 'SALES';
  }
  if (lower.includes('finance') || lower.includes('$45') || lower.includes('tarif') || lower.includes('factur') || lower.includes('budget')) {
    return 'FINANCE';
  }
  if (lower.includes('kytc') || lower.includes('légal') || lower.includes('legal') || lower.includes('assurance') || lower.includes('permis')) {
    return 'LEGAL';
  }
  if (lower.includes('supabase') || lower.includes('n8n') || lower.includes('vapi') || lower.includes('it') || lower.includes('serveur')) {
    return 'IT';
  }
  if (lower.includes('academy') || lower.includes('onboarding') || lower.includes('formation') || lower.includes('people')) {
    return 'PEOPLE';
  }
  return 'OPERATIONS';
}

/**
 * B1 CEO Anti-Orphan-Work Engine:
 * Guarantees every task has a valid B2 owner, B3 yellow-vest executor, TDD acceptance criteria,
 * and checks for A0 Human Gate requirements.
 */
export function buildAntiOrphanTask(
  title: string,
  explicitDomain?: Exclude<DomainId, 'SOVEREIGN' | 'EXECUTIVE'>,
  acceptanceCriteria?: string
): { task: TaskRecord; routing: DomainRoutingConfig } {
  const domain = explicitDomain || inferDomainFromMissionText(title);
  const routing = DOMAIN_ROUTING_MAP[domain];
  const now = new Date().toISOString();
  const shortId = Math.floor(100 + Math.random() * 900);
  const gateId = detectRequiredHumanGate(title);

  const task: TaskRecord = {
    id: `TASK-${domain.slice(0, 3)}-${shortId}`,
    title: title.trim(),
    domain,
    ownerB2: routing.b2AgentId,
    workerB3: routing.b3WorkerId,
    status: 'DISPATCHED',
    rejectionCount: 0,
    requiresHumanGate: Boolean(gateId),
    humanGateId: gateId,
    acceptanceCriteria:
      acceptanceCriteria ||
      `Exécution SOP vérifiée par ${routing.b2AgentId} avec preuve horodatée dans RECEIPTS.json et respect du seuil >= $45/h.`,
    createdAt: now,
    updatedAt: now,
  };

  return { task, routing };
}

/**
 * Generates a cryptographic-style receipt from a B3 Worker execution or A0 Hulk Unblock.
 */
export function generateExecutionReceipt(
  task: TaskRecord,
  executorId: string,
  verifierId: string,
  summaryOverride?: string
): ReceiptRecord {
  const now = new Date().toISOString();
  const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return {
    id: `RCPT-${task.id.replace('TASK-', '')}`,
    taskId: task.id,
    agentId: executorId,
    verifiedBy: verifierId,
    timestamp: now,
    summary:
      summaryOverride ||
      `SOP exécutée par ${executorId} et auditée conforme par ${verifierId} pour "${task.title}".`,
    metrics: {
      slaVerified: 'PASS',
      driverNetHourlyTargetUsd: 48.6,
      rejectionCountAtClose: task.rejectionCount,
    },
    hash: `sha256:${randomHex}`,
  };
}

/**
 * Simulates B2 verification rejection (up to 2 times -> BLOCKED_2X) to trigger A0 Hulk Mode.
 */
export function registerB2Rejection(task: TaskRecord): TaskRecord {
  const nextCount = task.rejectionCount + 1;
  return {
    ...task,
    rejectionCount: nextCount,
    status: nextCount >= 2 ? 'BLOCKED_2X' : 'REJECTED_ONCE',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Unblocks a BLOCKED_2X task via A0 Amadeus Hulk Mode (UNBLOCK_HULK).
 */
export function unblockTaskWithHulkPower(
  task: TaskRecord
): { updatedTask: TaskRecord; receipt: ReceiptRecord; learningNote: string } {
  const now = new Date().toISOString();
  const updatedTask: TaskRecord = {
    ...task,
    status: 'COMPLETED',
    updatedAt: now,
  };
  const receipt = generateExecutionReceipt(
    updatedTask,
    'a0-amadeus',
    task.ownerB2,
    `[MODE HULK UNBLOCK A0] Déblocage souverain par A0 Amadeus après ${task.rejectionCount} rejets sur "${task.title}".`
  );
  const learningNote = `[MODE HULK UNBLOCK] Tâche \`${task.id}\` (${task.title}) débloquée souverainement par A0 Amadeus. Reçu \`${receipt.id}\` archivé.`;
  return { updatedTask, receipt, learningNote };
}

export function countBlockedTasks(agents: AgentNode[]): TaskRecord[] {
  const list: TaskRecord[] = [];
  for (const agent of agents) {
    for (const t of agent.tasks) {
      if (t.status === 'BLOCKED_2X') {
        list.push(t);
      }
    }
  }
  return list;
}
