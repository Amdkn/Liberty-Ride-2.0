import React, { useState, useEffect } from 'react';
import {
  FileText,
  BookOpen,
  Layers,
  CheckSquare,
  ShieldCheck,
  Save,
  Zap,
  AlertTriangle,
  Play,
  X,
  FolderGit2,
} from 'lucide-react';
import { AgentNode, TaskRecord } from '../../world-model/types';

interface AgentInspectorDrawerProps {
  agent: AgentNode | null;
  allAgents: AgentNode[];
  isDiskConnected: boolean;
  isHulkMode: boolean;
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
  onSaveMarkdown: (
    agentId: string,
    fileType: 'NOTES.md' | 'AGENT.md' | 'SPEC',
    content: string,
    specName?: string
  ) => Promise<void>;
  onUnblockTaskHulk: (agentId: string, task: TaskRecord) => Promise<void>;
  onSimulateReject2x: (agentId: string, task: TaskRecord) => Promise<void>;
  onExecuteTaskSop: (agentId: string, task: TaskRecord) => Promise<void>;
}

type InspectorTab = 'AGENT_MD' | 'NOTES_MD' | 'SPECS' | 'TASKS' | 'RECEIPTS';

export const AgentInspectorDrawer: React.FC<AgentInspectorDrawerProps> = ({
  agent,
  allAgents,
  isDiskConnected,
  isHulkMode,
  onClose,
  onSelectAgent,
  onSaveMarkdown,
  onUnblockTaskHulk,
  onSimulateReject2x,
  onExecuteTaskSop,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('TASKS');
  const [editableNotes, setEditableNotes] = useState('');
  const [editableAgentMd, setEditableAgentMd] = useState('');
  const [selectedSpecName, setSelectedSpecName] = useState<string>('');
  const [editableSpecContent, setEditableSpecContent] = useState('');
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!agent) return;
    setEditableNotes(agent.notesMd);
    setEditableAgentMd(agent.agentMd);
    const specKeys = Object.keys(agent.specs || {});
    if (specKeys.length > 0) {
      setSelectedSpecName(specKeys[0]);
      setEditableSpecContent(agent.specs[specKeys[0]]);
    } else {
      setSelectedSpecName('');
      setEditableSpecContent('');
    }
  }, [agent]);

  if (!agent) return null;

  const handleSave = async (type: 'NOTES.md' | 'AGENT.md' | 'SPEC') => {
    if (type === 'NOTES.md') {
      await onSaveMarkdown(agent.id, 'NOTES.md', editableNotes);
    } else if (type === 'AGENT.md') {
      await onSaveMarkdown(agent.id, 'AGENT.md', editableAgentMd);
    } else if (type === 'SPEC' && selectedSpecName) {
      await onSaveMarkdown(agent.id, 'SPEC', editableSpecContent, selectedSpecName);
    }
    setSaveBanner(`Sauvegardé dans ./agents/${agent.folderPath}/`);
    setTimeout(() => setSaveBanner(null), 2800);
  };

  return (
    <aside
      id="agent-inspector-drawer"
      className="w-full lg:w-[450px] bg-[#09141d]/95 border-l border-emerald-500/30 flex flex-col h-[720px] shrink-0 shadow-2xl backdrop-blur-md"
    >
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#060e15]">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white/20"
            style={{ backgroundColor: agent.roofColor }}
          />
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {agent.tier}
              </span>
              <h2 className="font-bold text-slate-100 text-sm truncate">{agent.name}</h2>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">{agent.roleTitle}</p>
          </div>
        </div>
        <button
          id="close-inspector-btn"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300"
          title="Fermer l'inspecteur (Touche T)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Agent Switcher & Disk Path Badge */}
      <div className="px-4 py-2.5 bg-[#071119] border-b border-slate-800/80 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-mono text-slate-300 truncate">
            <FolderGit2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ./agents/{agent.folderPath}/
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              isDiskConnected
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            {isDiskConnected ? 'DISK API /api/agents SYNC' : 'LOCALSTORAGE SYNC'}
          </span>
        </div>

        <select
          id="inspector-agent-select"
          value={agent.id}
          onChange={(e) => onSelectAgent(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-400"
        >
          {allAgents.map((ag) => (
            <option key={ag.id} value={ag.id}>
              [{ag.tier}] {ag.name} — ({ag.homeRoom}) · Posture: {ag.posture}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-5 border-b border-slate-800 bg-[#08121b] text-[11px] font-medium">
        <button
          onClick={() => setActiveTab('TASKS')}
          className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition ${
            activeTab === 'TASKS'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>TASKS ({agent.tasks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('RECEIPTS')}
          className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition ${
            activeTab === 'RECEIPTS'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RECEIPTS ({agent.receipts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('NOTES_MD')}
          className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition ${
            activeTab === 'NOTES_MD'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>NOTES.md</span>
        </button>
        <button
          onClick={() => setActiveTab('AGENT_MD')}
          className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition ${
            activeTab === 'AGENT_MD'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{agent.tier === 'A0' ? 'PROFILE' : 'AGENT.md'}</span>
        </button>
        <button
          onClick={() => setActiveTab('SPECS')}
          className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition ${
            activeTab === 'SPECS'
              ? 'border-purple-400 text-purple-300 bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>SPECS</span>
        </button>
      </div>

      {saveBanner && (
        <div className="px-4 py-2 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-200 text-xs font-mono">
          ✓ {saveBanner}
        </div>
      )}

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'TASKS' && (
          <div className="space-y-3">
            {agent.tasks.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 text-center">
                Aucune tâche dans TASKS.json pour cet agent. Utilisez <b>📲 Call B1 CEO (Double-N)</b> pour lui assigner une mission.
              </div>
            ) : (
              agent.tasks.map((task) => {
                const isBlocked = task.status === 'BLOCKED_2X';
                const isCompleted = task.status === 'COMPLETED';
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition ${
                      isBlocked
                        ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/30'
                        : isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-900/80 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] text-slate-300 font-semibold">
                        {task.id}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isBlocked
                            ? 'bg-red-500/25 text-red-300 border border-red-500/50 animate-pulse'
                            : isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {task.status} (Rejets: {task.rejectionCount})
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-100 mb-1.5">{task.title}</p>
                    <p className="text-[11px] text-slate-400 mb-2">
                      <b>TDD Critère :</b> {task.acceptanceCriteria}
                    </p>
                    <div className="text-[10px] font-mono text-slate-400 flex flex-wrap gap-2 mb-3">
                      <span>B2: {task.ownerB2}</span>
                      <span>•</span>
                      <span>B3: {task.workerB3}</span>
                      {task.humanGateId && (
                        <span className="text-amber-300">🔒 Gate: {task.humanGateId}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isBlocked && (
                        <button
                          onClick={() => onUnblockTaskHulk(agent.id, task)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          {isHulkMode
                            ? '⚡ UNBLOCK IMMÉDIAT (HULK ACTIF)'
                            : '⚡ Activer Hulk & Débloquer (UNBLOCK)'}
                        </button>
                      )}

                      {!isCompleted && !isBlocked && (
                        <>
                          <button
                            onClick={() => onExecuteTaskSop(agent.id, task)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-medium flex items-center justify-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Exécuter SOP B3 & Reçu
                          </button>
                          <button
                            onClick={() => onSimulateReject2x(agent.id, task)}
                            className="py-1.5 px-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-medium flex items-center justify-center gap-1"
                            title="Simuler 2 rejets consécutifs B2 pour tester l'escalade Mode Hulk"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            2x Rejet
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'RECEIPTS' && (
          <div className="space-y-3">
            {agent.receipts.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 text-center">
                Aucun reçu dans RECEIPTS.json pour le moment.
              </div>
            ) : (
              agent.receipts.map((rcpt) => (
                <div
                  key={rcpt.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-cyan-300 font-bold">{rcpt.id}</span>
                    <span className="text-slate-400">Task: {rcpt.taskId}</span>
                  </div>
                  <p className="text-xs text-slate-200">{rcpt.summary}</p>
                  <div className="p-2 rounded bg-slate-950/90 border border-slate-800 font-mono text-[10px] text-emerald-300">
                    {Object.entries(rcpt.metrics || {}).map(([k, v]) => (
                      <div key={k}>
                        {k}: <span className="text-slate-100">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    Hash: {rcpt.hash} · Vérifié par {rcpt.verifiedBy}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'NOTES_MD' && (
          <div className="space-y-2.5 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-300">
                ./agents/{agent.folderPath}/NOTES.md (What they learned)
              </span>
              <button
                onClick={() => handleSave('NOTES.md')}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Sauvegarder
              </button>
            </div>
            <textarea
              value={editableNotes}
              onChange={(e) => setEditableNotes(e.target.value)}
              rows={18}
              className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        {activeTab === 'AGENT_MD' && (
          <div className="space-y-2.5 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-300">
                ./agents/{agent.folderPath}/{agent.tier === 'A0' ? 'PROFILE.md' : 'AGENT.md'}
              </span>
              <button
                onClick={() => handleSave('AGENT.md')}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Sauvegarder
              </button>
            </div>
            <textarea
              value={editableAgentMd}
              onChange={(e) => setEditableAgentMd(e.target.value)}
              rows={18}
              className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
            />
          </div>
        )}

        {activeTab === 'SPECS' && (
          <div className="space-y-3">
            {Object.keys(agent.specs || {}).length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 text-center">
                Ce dossier utilise les SPECS de son Directeur B2 superviseur ({agent.supervisorId || 'A0'}).
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={selectedSpecName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setSelectedSpecName(name);
                      setEditableSpecContent(agent.specs[name] || '');
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-purple-200"
                  >
                    {Object.keys(agent.specs).map((specKey) => (
                      <option key={specKey} value={specKey}>
                        SPECS/{specKey}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleSave('SPEC')}
                    className="px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Sauver Spec
                  </button>
                </div>
                <textarea
                  value={editableSpecContent}
                  onChange={(e) => setEditableSpecContent(e.target.value)}
                  rows={16}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-purple-400"
                />
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
