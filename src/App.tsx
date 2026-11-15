import React, { useEffect, useState } from 'react';
import {
  Compass,
  Building2,
  CarFront,
  ShieldCheck,
  Lock,
  Unlock,
  BookOpen,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  AgentNode,
  ExperienceId,
  HumanGateId,
  HumanGateRecord,
} from './world-model/types';
import { INITIAL_AGENTS_DATA } from './world-model/initialAgentsData';
import { agentFileBridge } from './world-model/agentFileBridge';
import {
  INITIAL_HUMAN_GATES,
  signHumanGateByA0,
} from './world-model/humanGates';
import { countBlockedTasks } from './world-model/capabilityEngine';
import { AdminVillageView } from './experiences/admin-agent-village/AdminVillageView';
import { DriverHouseTwinView } from './experiences/driver-house-twin/DriverHouseTwinView';
import { CustomerWorldView } from './experiences/customer-world/CustomerWorldView';

export const App: React.FC = () => {
  const [activeExperience, setActiveExperience] =
    useState<ExperienceId>('ADMIN_VILLAGE');
  const [agents, setAgents] = useState<AgentNode[]>(INITIAL_AGENTS_DATA);
  const [memoryMd, setMemoryMd] = useState<string>('');
  const [isDiskConnected, setIsDiskConnected] = useState<boolean>(false);
  const [humanGates, setHumanGates] =
    useState<Record<HumanGateId, HumanGateRecord>>(INITIAL_HUMAN_GATES);
  const [gatesModalOpen, setGatesModalOpen] = useState<boolean>(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = agentFileBridge.subscribe((nextAgents, nextMem, diskOk) => {
      setAgents([...nextAgents]);
      setMemoryMd(nextMem);
      setIsDiskConnected(diskOk);
    });
    void agentFileBridge.syncFromDisk();
    return unsubscribe;
  }, []);

  const totalReceipts = agents.reduce((acc, ag) => acc + ag.receipts.length, 0);
  const blockedTasks = countBlockedTasks(agents);
  const approvedGatesCount = Object.values(humanGates).filter(
    (g) => g.status === 'APPROVED_BY_A0'
  ).length;

  const handleToggleHumanGate = (gateId: HumanGateId) => {
    setHumanGates((prev) => {
      const current = prev[gateId];
      const nextStatus =
        current.status === 'APPROVED_BY_A0' ? 'LOCKED' : 'APPROVED_BY_A0';
      return {
        ...prev,
        [gateId]: signHumanGateByA0(current, nextStatus === 'APPROVED_BY_A0' ? 'APPROVED_BY_A0' : 'REJECTED_BY_A0'),
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#060d13] text-slate-100 flex flex-col">
      {/* Unified Top Navigation Bar & Shareholder A0 HUD */}
      <header className="sticky top-0 z-40 bg-[#071119]/95 backdrop-blur-md border-b border-emerald-500/25 px-4 py-2.5">
        <div className="max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center font-mono font-extrabold text-emerald-300 text-sm shadow-inner">
              A0
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-extrabold tracking-tight text-white">
                  LIBERTY RIDE 2.0 <span className="text-emerald-400 font-mono text-xs">(LD01)</span>
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  A’Space OS · Monorepo Agent-First
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Gouvernance E-Myth : A0 Amadeus → B1 Elena CEO → 8 Directeurs B2 → 8 Workers B3 (Gilet Jaune)
              </p>
            </div>
          </div>

          {/* Center: 3 Unified Experiences Switcher */}
          <nav
            aria-label="Expériences Liberty Ride 2.0"
            className="flex items-center gap-1.5 bg-[#040a0f] p-1 rounded-xl border border-slate-800"
          >
            <button
              id="nav-admin-village-btn"
              onClick={() => setActiveExperience('ADMIN_VILLAGE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                activeExperience === 'ADMIN_VILLAGE'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>1. Admin Agent Village (2D)</span>
            </button>

            <button
              id="nav-driver-house-btn"
              onClick={() => setActiveExperience('DRIVER_HOUSE_3D')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                activeExperience === 'DRIVER_HOUSE_3D'
                  ? 'bg-cyan-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>2. Driver House 3D Twin</span>
            </button>

            <button
              id="nav-customer-world-btn"
              onClick={() => setActiveExperience('CUSTOMER_WORLD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                activeExperience === 'CUSTOMER_WORLD'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CarFront className="w-3.5 h-3.5" />
              <span>3. Customer World (CVG)</span>
            </button>
          </nav>

          {/* Right: Shareholder A0 HUD Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <button
              id="open-human-gates-btn"
              onClick={() => setGatesModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 flex items-center gap-1.5"
              title="Gérer les 5 Verrous Souverains A0 Amadeus"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Human Gates ({approvedGatesCount}/5)</span>
            </button>

            <button
              id="open-memory-md-btn"
              onClick={() => setMemoryModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>MEMORY.md ({totalReceipts} Reçus)</span>
            </button>

            <div
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                blockedTasks.length > 0
                  ? 'bg-red-950/60 border-red-500/60 text-red-300'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {blockedTasks.length > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>{blockedTasks.length} BLOCKED_2X</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>0 Blocage</span>
                </>
              )}
            </div>

            <div
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1.5"
              title="Statut du plugin Vite agent-filesystem-api (/api/agents)"
            >
              <HardDrive
                className={`w-3.5 h-3.5 ${
                  isDiskConnected ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <span>{isDiskConnected ? './agents/ Live' : 'Local Sync'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 py-4">
        {activeExperience === 'ADMIN_VILLAGE' && (
          <AdminVillageView agents={agents} isDiskConnected={isDiskConnected} />
        )}
        {activeExperience === 'DRIVER_HOUSE_3D' && <DriverHouseTwinView />}
        {activeExperience === 'CUSTOMER_WORLD' && <CustomerWorldView />}
      </main>

      {/* Sovereign A0 Human Gates Modal */}
      {gatesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#09141d] border border-amber-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Les 5 Verrous Cryptographiques Souverains (Human Gates — A0 Amadeus)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aucun agent B1, B2 ou B3 ne peut franchir ces portes sans la signature d’A0 Amadeus.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGatesModalOpen(false)}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                FERMER
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {Object.values(humanGates).map((gate) => {
                const isApproved = gate.status === 'APPROVED_BY_A0';
                return (
                  <div
                    key={gate.id}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-300">
                          {gate.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-100">
                          — {gate.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{gate.description}</p>
                      <p className="text-[11px] font-mono text-emerald-300">
                        Règle : {gate.thresholdRule}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleHumanGate(gate.id)}
                      className={`px-3 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 shrink-0 border transition ${
                        isApproved
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-amber-500/20 border-amber-400 text-amber-200'
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>SIGNÉ A0</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>VERROUILLÉ (Signer)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Consolidated MEMORY.md Modal */}
      {memoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#09141d] border border-cyan-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  ./MEMORY.md — Journal d’Apprentissage Consolidé d’A’Space OS (LD01)
                </h3>
              </div>
              <button
                onClick={() => setMemoryModalOpen(false)}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                FERMER
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
              {memoryMd}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
