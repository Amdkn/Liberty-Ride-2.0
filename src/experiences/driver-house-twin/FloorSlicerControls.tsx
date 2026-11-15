import React from 'react';
import {
  Layers,
  Eye,
  Box,
  Cpu,
  ShieldCheck,
  DollarSign,
  Car,
  LayoutGrid,
} from 'lucide-react';
import { CrossCuttingFilterId, FloorSlicerMode } from '../../world-model/types';

interface FloorSlicerControlsProps {
  slicerMode: FloorSlicerMode;
  selectedFloor: number; // 1 = Garage, 2 = Compliance, 3 = FinOps, 4 = Roof Dispatch/Academy
  activeFilter: CrossCuttingFilterId;
  use2DFallback: boolean;
  onChangeSlicerMode: (mode: FloorSlicerMode) => void;
  onChangeSelectedFloor: (floor: number) => void;
  onChangeFilter: (filter: CrossCuttingFilterId) => void;
  onToggle2DFallback: () => void;
}

export const FLOOR_METADATA = [
  {
    level: 1,
    code: 'NIVEAU 1 (RDC)',
    title: 'Garage 3 Baies SUV & Préparation Flotte',
    color: '#00E5FF',
    b2Owner: 'b2-01-operations (Marcus Vance)',
    summary: '3 SUV noirs exécutifs (Escalade, Suburban, Yukon XL), bornes de charge et checklist mécanique pré-départ.',
  },
  {
    level: 2,
    code: 'NIVEAU 2',
    title: 'Coffre-Fort Conformité KYTC, Permis CVG & Assurances',
    color: '#ECEFF1',
    b2Owner: 'b2-06-legal (Nadia Benali)',
    summary: 'Licences Kentucky Passenger Carrier (KYTC), badges AVI CVG Airport et police assurance $1M CSL.',
  },
  {
    level: 3,
    code: 'NIVEAU 3',
    title: 'Centre FinOps & Simulateur Corridor CVG (>= $45/h)',
    color: '#FFD600',
    b2Owner: 'b2-05-finance (Arthur Sterling)',
    summary: 'Pilotage en temps réel du revenu horaire net chauffeur (>= $45.00/h) et facturation B2B hôtels.',
  },
  {
    level: 4,
    code: 'TOIT PANORAMIQUE',
    title: 'Tour Dispatch Vapi/n8n & Driver Business Academy',
    color: '#FF4081',
    b2Owner: 'b2-08-people (Maya Lin) & b2-07-it (Viktor Kovács)',
    summary: 'Antenne radar CVG, réceptionniste vocale Vapi et académie de certification E-Myth chauffeurs.',
  },
];

export const FloorSlicerControls: React.FC<FloorSlicerControlsProps> = ({
  slicerMode,
  selectedFloor,
  activeFilter,
  use2DFallback,
  onChangeSlicerMode,
  onChangeSelectedFloor,
  onChangeFilter,
  onToggle2DFallback,
}) => {
  const modes: Array<{ id: FloorSlicerMode; label: string }> = [
    { id: 'FULL_BUILDING', label: '🏢 FULL_BUILDING' },
    { id: 'CUTAWAY_UP_TO', label: '🔪 CUTAWAY_UP_TO' },
    { id: 'FLOOR_ISOLATE', label: '🎯 FLOOR_ISOLATE' },
    { id: 'EXPLODED_STACK', label: '💥 EXPLODED_STACK' },
    { id: 'XRAY', label: '🩻 XRAY WIREFRAME' },
  ];

  const filters: Array<{ id: CrossCuttingFilterId; label: string; icon: React.ReactNode }> = [
    { id: 'ALL', label: 'Tous Systèmes', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'FLEET_OPS', label: 'Flotte SUV', icon: <Car className="w-3.5 h-3.5" /> },
    { id: 'COMPLIANCE_KYTC', label: 'KYTC / CVG', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'FINOPS_45HR', label: 'FinOps >= $45/h', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'AI_DISPATCH', label: 'Vapi / n8n SRE', icon: <Cpu className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-[#09141d] border border-emerald-500/25 rounded-2xl p-4 space-y-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Contrôleur de Coupe Architecturale 3D (Floor Slicer)
          </span>
        </div>

        <button
          id="toggle-2d-blueprint-btn"
          onClick={onToggle2DFallback}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition ${
            use2DFallback
              ? 'bg-amber-500 text-slate-950 border-amber-300'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          {use2DFallback ? 'Basculer en Vue 3D Three.js' : '📐 Mode Plan Architecte 2D (Fallback)'}
        </button>
      </div>

      {/* 5 Slicer Modes */}
      <div className="flex flex-wrap gap-1.5">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onChangeSlicerMode(m.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition ${
              slicerMode === m.id
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-sm'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Floor Selector Buttons (1 to 4) + Cross-Cutting Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400 mr-1">Étage Cible :</span>
          {FLOOR_METADATA.map((fl) => (
            <button
              key={fl.level}
              onClick={() => onChangeSelectedFloor(fl.level)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                selectedFloor === fl.level
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {fl.level === 4 ? 'Toit (4)' : `Étage ${fl.level}`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
            <Eye className="w-3 h-3" /> Filtre :
          </span>
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => onChangeFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 border transition ${
                activeFilter === f.id
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
