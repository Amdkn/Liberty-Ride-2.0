import { AgentNode, ReceiptRecord, TaskRecord } from './types';
import { INITIAL_AGENTS_DATA } from './initialAgentsData';

const STORAGE_KEY_AGENTS = 'liberty_ride_2_0_agents_state_v1';
const STORAGE_KEY_MEMORY = 'liberty_ride_2_0_memory_md_v1';

interface ApiAgentBundle {
  agentId: string;
  folderPath: string;
  agentMd: string;
  notesMd: string;
  tasks: TaskRecord[];
  receipts: ReceiptRecord[];
  specs: Record<string, string>;
}

type BridgeListener = (agents: AgentNode[], memoryMd: string, diskConnected: boolean) => void;

class AgentFileBridge {
  private agents: AgentNode[] = structuredClone(INITIAL_AGENTS_DATA);
  private memoryMd: string = `# MEMORY.md — Mémoire Vivante Consolidée (LD01)\n- **[2026-11-15T08:00:00.000Z]** Initialisation du Monorepo Unifié Agent-First.`;
  private diskConnected: boolean = false;
  private listeners: Set<BridgeListener> = new Set();

  constructor() {
    this.loadFromLocalStorageFallback();
  }

  public subscribe(listener: BridgeListener): () => void {
    this.listeners.add(listener);
    listener(this.agents, this.memoryMd, this.diskConnected);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.saveToLocalStorageFallback();
    for (const listener of this.listeners) {
      listener(this.agents, this.memoryMd, this.diskConnected);
    }
  }

  public getAgentsSnapshot(): AgentNode[] {
    return this.agents;
  }

  public isDiskApiConnected(): boolean {
    return this.diskConnected;
  }

  private loadFromLocalStorageFallback(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AGENTS);
      if (raw) {
        const parsed = JSON.parse(raw) as AgentNode[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.agents = parsed;
        }
      }
      const rawMem = localStorage.getItem(STORAGE_KEY_MEMORY);
      if (rawMem) {
        this.memoryMd = rawMem;
      }
    } catch {
      // Ignore storage access errors
    }
  }

  private saveToLocalStorageFallback(): void {
    try {
      localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(this.agents));
      localStorage.setItem(STORAGE_KEY_MEMORY, this.memoryMd);
    } catch {
      // Ignore storage quota errors
    }
  }

  /**
   * Fetches real ./agents/ files via Vite server middleware GET /api/agents
   */
  public async syncFromDisk(): Promise<void> {
    try {
      const response = await fetch('/api/agents', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        this.diskConnected = false;
        this.notify();
        return;
      }
      const data = (await response.json()) as {
        ok: boolean;
        agents: ApiAgentBundle[];
        memoryMd?: string;
      };
      if (!data.ok || !Array.isArray(data.agents)) {
        this.diskConnected = false;
        this.notify();
        return;
      }

      const bundleMap = new Map<string, ApiAgentBundle>();
      for (const b of data.agents) {
        bundleMap.set(b.agentId, b);
      }

      this.agents = this.agents.map((node) => {
        const disk = bundleMap.get(node.id);
        if (!disk) return node;
        return {
          ...node,
          agentMd: disk.agentMd || node.agentMd,
          notesMd: disk.notesMd || node.notesMd,
          tasks: Array.isArray(disk.tasks) && disk.tasks.length > 0 ? disk.tasks : node.tasks,
          receipts: Array.isArray(disk.receipts) && disk.receipts.length > 0 ? disk.receipts : node.receipts,
          specs: Object.keys(disk.specs || {}).length > 0 ? disk.specs : node.specs,
        };
      });

      if (data.memoryMd) {
        this.memoryMd = data.memoryMd;
      }
      this.diskConnected = true;
      this.notify();
    } catch {
      this.diskConnected = false;
      this.notify();
    }
  }

  /**
   * Persists a task + optional receipt + timestamped learning line to ./agents/<agentId>/ via POST /api/agents/task
   */
  public async upsertTaskAndReceipt(
    agentId: string,
    task: TaskRecord,
    receipt?: ReceiptRecord,
    noteLine?: string
  ): Promise<void> {
    const ts = new Date().toISOString();
    const formattedLine = noteLine
      ? `- **[${ts}]** ${noteLine}`
      : `- **[${ts}]** Task \`${task.id}\` (${task.title}) -> **${task.status}**`;

    // Optimistic in-memory update
    this.agents = this.agents.map((ag) => {
      if (ag.id !== agentId) return ag;
      const existingIdx = ag.tasks.findIndex((t) => t.id === task.id);
      const nextTasks = [...ag.tasks];
      if (existingIdx >= 0) {
        nextTasks[existingIdx] = task;
      } else {
        nextTasks.unshift(task);
      }

      const nextReceipts = [...ag.receipts];
      if (receipt) {
        const rIdx = nextReceipts.findIndex((r) => r.id === receipt.id);
        if (rIdx >= 0) {
          nextReceipts[rIdx] = receipt;
        } else {
          nextReceipts.unshift(receipt);
        }
      }

      return {
        ...ag,
        tasks: nextTasks,
        receipts: nextReceipts,
        notesMd: `${ag.notesMd.trimEnd()}\n${formattedLine}\n`,
      };
    });

    this.memoryMd = `${this.memoryMd.trimEnd()}\n- **[${ts}] [${agentId}]** ${noteLine || `${task.id} -> ${task.status}`}\n`;
    this.notify();

    try {
      const res = await fetch('/api/agents/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, task, receipt, noteLine }),
      });
      if (res.ok) {
        this.diskConnected = true;
      }
    } catch {
      // Fallback already saved in localStorage
    }
  }

  /**
   * Saves direct markdown edits (NOTES.md, AGENT.md, or SPECS/*.md) from the Inspector Drawer to disk
   */
  public async saveAgentMarkdownFile(
    agentId: string,
    fileType: 'NOTES.md' | 'AGENT.md' | 'SPEC',
    content: string,
    specName?: string
  ): Promise<void> {
    this.agents = this.agents.map((ag) => {
      if (ag.id !== agentId) return ag;
      if (fileType === 'NOTES.md') {
        return { ...ag, notesMd: content };
      }
      if (fileType === 'AGENT.md') {
        return { ...ag, agentMd: content };
      }
      if (fileType === 'SPEC' && specName) {
        return { ...ag, specs: { ...ag.specs, [specName]: content } };
      }
      return ag;
    });
    this.notify();

    try {
      const res = await fetch('/api/agents/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, fileType, content, specName }),
      });
      if (res.ok) {
        this.diskConnected = true;
      }
    } catch {
      // Fallback already persisted in localStorage
    }
  }

  public updateAgentsInMemory(updater: (prev: AgentNode[]) => AgentNode[]): void {
    this.agents = updater(this.agents);
    this.notify();
  }
}

export const agentFileBridge = new AgentFileBridge();
