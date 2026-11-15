import React, { useEffect, useState } from 'react';
import {
  Compass,
  Building2,
  CarFront,
  ShieldCheck,
  Lock,
  Unlock,
  BookOpen,
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
        [gateId]: signHumanGateByA0(
          current,
          nextStatus === 'APPROVED_BY_A0' ? 'APPROVED_BY_A0' : 'REJECTED_BY_A0'
        ),
      };
    });
  };

  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-[#040a0f] text-slate-100 relative">
      {/* Primary Fullscreen Experience: Map-First Agent Village */}
      {activeExperience === 'ADMIN_VILLAGE' && (
        <AdminVillageView
          agents={agents}
          isDiskConnected={isDiskConnected}
          activeExperience={activeExperience}
          onSelectExperience={setActiveExperience}
          approvedGatesCount={approvedGatesCount}
          onOpenHumanGates={() => setGatesModalOpen(true)}
          onOpenMemory={() => setMemoryModalOpen(true)}
        />
      )}

      {/* Secondary Experiences (Driver House 3D Twin & Customer World) with compact floating switcher */}
      {activeExperience !== 'ADMIN_VILLAGE' && (
        <div className="w-full h-full overflow-y-auto pt-16 px-4 pb-8">
          <nav
            aria-label="Expériences Liberty Ride 2.0"
            className="fixed top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#071119]/85 backdrop-blur-xl border border-white/10 shadow-2xl"
          >
            <button
              id="nav-admin-village-btn"
              onClick={() => setActiveExperience('ADMIN_VILLAGE')}
              className="px-3 py-1 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 transition"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Village</span>
            </button>

            <button
              id="nav-driver-house-btn"
              onClick={() => setActiveExperience('DRIVER_HOUSE_3D')}
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
                activeExperience === 'DRIVER_HOUSE_3D'
                  ? 'bg-cyan-400 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Driver House 3D</span>
            </button>

            <button
              id="nav-customer-world-btn"
              onClick={() => setActiveExperience('CUSTOMER_WORLD')}
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
                activeExperience === 'CUSTOMER_WORLD'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <CarFront className="w-3.5 h-3.5" />
              <span>Customer World (CVG)</span>
            </button>
          </nav>

          <div className="max-w-[1600px] mx-auto">
            {activeExperience === 'DRIVER_HOUSE_3D' && <DriverHouseTwinView />}
            {activeExperience === 'CUSTOMER_WORLD' && <CustomerWorldView />}
          </div>
        </div>
      )}

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
