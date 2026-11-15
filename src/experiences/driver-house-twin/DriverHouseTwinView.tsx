import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { CrossCuttingFilterId, FloorSlicerMode } from '../../world-model/types';
import {
  FloorSlicerControls,
  FLOOR_METADATA,
} from './FloorSlicerControls';
import { DriverEarningsSimulator } from './DriverEarningsSimulator';

interface FloorMeshProps {
  level: number;
  baseY: number;
  slicerMode: FloorSlicerMode;
  selectedFloor: number;
  activeFilter: CrossCuttingFilterId;
  onSelectFloor: (level: number) => void;
}

const ArchitecturalFloorGroup: React.FC<FloorMeshProps> = ({
  level,
  baseY,
  slicerMode,
  selectedFloor,
  activeFilter,
  onSelectFloor,
}) => {
  const radarRef = useRef<THREE.Mesh | null>(null);

  useFrame((_, delta) => {
    if (radarRef.current) {
      radarRef.current.rotation.y += delta * 1.6;
    }
  });

  // Visibility & Vertical Offset rules based on Slicer Mode
  let visible = true;
  if (slicerMode === 'CUTAWAY_UP_TO' && level > selectedFloor) {
    visible = false;
  } else if (slicerMode === 'FLOOR_ISOLATE' && level !== selectedFloor) {
    visible = false;
  }

  if (!visible) return null;

  const explodedMultiplier = slicerMode === 'EXPLODED_STACK' ? 1.85 : 1.0;
  const yPos = baseY * explodedMultiplier;
  const isWireframe = slicerMode === 'XRAY';
  const isSelected = selectedFloor === level;

  const floorColors: Record<number, string> = {
    1: '#00E5FF', // Garage & Fleet
    2: '#ECEFF1', // Compliance KYTC
    3: '#FFD600', // FinOps >= $45/h
    4: '#FF4081', // Roof Dispatch & Academy
  };
  const accentColor = floorColors[level] || '#10B981';

  // Filter highlight check
  const matchesFilter =
    activeFilter === 'ALL' ||
    (activeFilter === 'FLEET_OPS' && level === 1) ||
    (activeFilter === 'COMPLIANCE_KYTC' && level === 2) ||
    (activeFilter === 'FINOPS_45HR' && level === 3) ||
    (activeFilter === 'AI_DISPATCH' && level === 4);

  const slabOpacity = matchesFilter ? 0.92 : 0.25;

  return (
    <group position={[0, yPos, 0]} onClick={(e) => { e.stopPropagation(); onSelectFloor(level); }}>
      {/* Floor Slab */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8.4, 0.28, 6.2]} />
        <meshStandardMaterial
          color={isSelected ? '#0f2922' : '#0f172a'}
          emissive={accentColor}
          emissiveIntensity={isSelected ? 0.28 : 0.08}
          wireframe={isWireframe}
          transparent
          opacity={slabOpacity}
        />
      </mesh>

      {/* Perimeter Glass Walls */}
      <mesh position={[0, 1.05, -2.95]}>
        <boxGeometry args={[8.2, 1.9, 0.12]} />
        <meshStandardMaterial
          color={accentColor}
          wireframe={isWireframe}
          transparent
          opacity={isWireframe ? 0.6 : 0.22}
        />
      </mesh>

      {/* LEVEL 1: 3-Bay Executive Black SUV Garage */}
      {level === 1 && (
        <group position={[0, 0.45, 0]}>
          {[-2.4, 0, 2.4].map((xOffset, idx) => (
            <group key={idx} position={[xOffset, 0, 0.3]}>
              {/* Black SUV Body */}
              <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[1.55, 0.65, 3.2]} />
                <meshStandardMaterial
                  color="#050811"
                  metalness={0.8}
                  roughness={0.2}
                  wireframe={isWireframe}
                />
              </mesh>
              {/* SUV Cabin Roof */}
              <mesh position={[0, 0.72, -0.2]}>
                <boxGeometry args={[1.35, 0.45, 1.95]} />
                <meshStandardMaterial
                  color="#0f172a"
                  emissive="#00E5FF"
                  emissiveIntensity={0.18}
                  wireframe={isWireframe}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* LEVEL 2: Compliance Vault (KYTC & CVG Permits + $1M CSL Insurance Safe) */}
      {level === 2 && (
        <group position={[0, 0.55, 0]}>
          <mesh position={[-2.2, 0.3, 0]}>
            <boxGeometry args={[2.1, 1.1, 1.4]} />
            <meshStandardMaterial
              color="#334155"
              emissive="#ECEFF1"
              emissiveIntensity={0.22}
              wireframe={isWireframe}
            />
          </mesh>
          <mesh position={[2.0, 0.3, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 1.1, 24]} />
            <meshStandardMaterial
              color="#1e293b"
              emissive="#10B981"
              emissiveIntensity={0.35}
              wireframe={isWireframe}
            />
          </mesh>
        </group>
      )}

      {/* LEVEL 3: FinOps & CVG Corridor Simulation Table (>= $45/h) */}
      {level === 3 && (
        <group position={[0, 0.5, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[4.2, 0.55, 2.2]} />
            <meshStandardMaterial
              color="#422006"
              emissive="#FFD600"
              emissiveIntensity={0.35}
              wireframe={isWireframe}
            />
          </mesh>
          {/* Rising Profit Bars */}
          {[-1.2, -0.4, 0.4, 1.2].map((bx, i) => (
            <mesh key={i} position={[bx, 0.65 + i * 0.15, 0]}>
              <boxGeometry args={[0.42, 0.5 + i * 0.3, 0.42]} />
              <meshStandardMaterial
                color="#00E676"
                emissive="#00E676"
                emissiveIntensity={0.45}
                wireframe={isWireframe}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* LEVEL 4 (ROOF): Dispatch Radar Tower & Driver Business Academy */}
      {level === 4 && (
        <group position={[0, 0.5, 0]}>
          {/* Academy Pergola */}
          <mesh position={[-1.8, 0.45, 0]}>
            <boxGeometry args={[3.2, 1.1, 3.2]} />
            <meshStandardMaterial
              color="#831843"
              emissive="#FF4081"
              emissiveIntensity={0.28}
              wireframe={isWireframe}
              transparent
              opacity={0.75}
            />
          </mesh>
          {/* Rotating CVG Radar & Vapi Dispatch Dish */}
          <mesh ref={radarRef} position={[2.2, 1.1, 0]}>
            <octahedronGeometry args={[0.85, 0]} />
            <meshStandardMaterial
              color="#00E5FF"
              emissive="#00E5FF"
              emissiveIntensity={0.6}
              wireframe={isWireframe}
            />
          </mesh>
        </group>
      )}

      {/* 3D Floating Label Tag */}
      <Html position={[-4.3, 0.9, 0]} distanceFactor={14}>
        <div
          onClick={() => onSelectFloor(level)}
          className={`px-2.5 py-1 rounded-lg font-mono text-[10px] whitespace-nowrap cursor-pointer border shadow-md ${
            isSelected
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 font-bold'
              : 'bg-slate-950/85 border-slate-700 text-slate-300'
          }`}
        >
          {level === 4 ? 'TOIT · DISPATCH & ACADEMY' : `NIVEAU ${level}`}
        </div>
      </Html>
    </group>
  );
};

export const DriverHouseTwinView: React.FC = () => {
  const [slicerMode, setSlicerMode] = useState<FloorSlicerMode>('EXPLODED_STACK');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<CrossCuttingFilterId>('ALL');
  const [use2DFallback, setUse2DFallback] = useState<boolean>(false);

  const selectedMeta =
    FLOOR_METADATA.find((f) => f.level === selectedFloor) || FLOOR_METADATA[0];

  return (
    <div className="space-y-4">
      <FloorSlicerControls
        slicerMode={slicerMode}
        selectedFloor={selectedFloor}
        activeFilter={activeFilter}
        use2DFallback={use2DFallback}
        onChangeSlicerMode={setSlicerMode}
        onChangeSelectedFloor={setSelectedFloor}
        onChangeFilter={setActiveFilter}
        onToggle2DFallback={() => setUse2DFallback((p) => !p)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 7 Columns: 3D Three.js/R3F Viewport OR 2D Architectural Fallback */}
        <div className="lg:col-span-7 bg-[#060e16] border border-emerald-500/30 rounded-2xl overflow-hidden h-[540px] relative shadow-2xl">
          {!use2DFallback ? (
            <Canvas camera={{ position: [10.5, 9.2, 11.5], fov: 42 }}>
              <color attach="background" args={['#050c12']} />
              <ambientLight intensity={0.75} />
              <directionalLight position={[12, 18, 10]} intensity={1.35} />
              <pointLight position={[-8, 6, -8]} intensity={0.6} color="#00E5FF" />

              <group position={[0, -2.8, 0]}>
                <ArchitecturalFloorGroup
                  level={1}
                  baseY={0}
                  slicerMode={slicerMode}
                  selectedFloor={selectedFloor}
                  activeFilter={activeFilter}
                  onSelectFloor={setSelectedFloor}
                />
                <ArchitecturalFloorGroup
                  level={2}
                  baseY={2.2}
                  slicerMode={slicerMode}
                  selectedFloor={selectedFloor}
                  activeFilter={activeFilter}
                  onSelectFloor={setSelectedFloor}
                />
                <ArchitecturalFloorGroup
                  level={3}
                  baseY={4.4}
                  slicerMode={slicerMode}
                  selectedFloor={selectedFloor}
                  activeFilter={activeFilter}
                  onSelectFloor={setSelectedFloor}
                />
                <ArchitecturalFloorGroup
                  level={4}
                  baseY={6.6}
                  slicerMode={slicerMode}
                  selectedFloor={selectedFloor}
                  activeFilter={activeFilter}
                  onSelectFloor={setSelectedFloor}
                />
              </group>

              <gridHelper args={[22, 22, '#10b981', '#0f2922']} position={[0, -3.1, 0]} />
              <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
            </Canvas>
          ) : (
            /* 2D Architectural Blueprint Fallback */
            <div className="p-6 h-full flex flex-col justify-between bg-[#07131c]">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
                <span className="font-mono text-xs text-cyan-300 font-bold">
                  📐 PLAN ARCHITECTE 2D — DRIVER HOUSE LAYERED TWIN (MODE: {slicerMode})
                </span>
                <span className="font-mono text-xs text-emerald-300">
                  Filtre: {activeFilter}
                </span>
              </div>

              <div className="space-y-2.5 my-auto">
                {[...FLOOR_METADATA].reverse().map((fl) => {
                  const isHidden =
                    (slicerMode === 'CUTAWAY_UP_TO' && fl.level > selectedFloor) ||
                    (slicerMode === 'FLOOR_ISOLATE' && fl.level !== selectedFloor);
                  if (isHidden) return null;

                  return (
                    <div
                      key={fl.level}
                      onClick={() => setSelectedFloor(fl.level)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        selectedFloor === fl.level
                          ? 'bg-emerald-950/60 border-emerald-400 shadow-lg'
                          : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold" style={{ color: fl.color }}>
                          {fl.code} — {fl.title}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">{fl.b2Owner}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{fl.summary}</p>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] font-mono text-slate-400 text-center">
                Cliquez sur un étage pour inspecter ses systèmes ou repassez en vue 3D Three.js.
              </div>
            </div>
          )}

          {/* Overlay Floor Inspector Card inside 3D Viewport */}
          <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: selectedMeta.color }}
                />
                <span className="text-xs font-mono font-bold text-slate-100">
                  {selectedMeta.code} : {selectedMeta.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedMeta.summary}</p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-300">
              Superviseur : {selectedMeta.b2Owner}
            </span>
          </div>
        </div>

        {/* Right 5 Columns: Driver Earnings Simulator + Fleet & Compliance Telemetry */}
        <div className="lg:col-span-5 space-y-4">
          <DriverEarningsSimulator />

          <div className="bg-[#09141d] border border-cyan-500/30 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-cyan-300">
              État Temps Réel des 3 Baies SUV (Niveau 1) & Conformité KYTC (Niveau 2)
            </h4>
            <div className="space-y-2 text-xs">
              {[
                {
                  id: 'SUV-01 Liberty One',
                  model: 'Cadillac Escalade ESV Black',
                  status: 'READY (Baie #1)',
                  kytc: 'KYTC-PASS · AVI CVG Actif',
                },
                {
                  id: 'SUV-02 Bluegrass Exec',
                  model: 'Chevrolet Suburban High Country',
                  status: 'EN_ROUTE CVG (Terminal B)',
                  kytc: 'KYTC-PASS · Assurance $1M CSL',
                },
                {
                  id: 'SUV-03 Queen City Black',
                  model: 'GMC Yukon XL Denali',
                  status: 'READY (Baie #3 Reserve)',
                  kytc: 'KYTC-PASS · Service Recovery < 90s',
                },
              ].map((suv) => (
                <div
                  key={suv.id}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-100">{suv.id}</div>
                    <div className="text-[11px] text-slate-400">{suv.model}</div>
                  </div>
                  <div className="text-right font-mono text-[10px]">
                    <div className="text-emerald-300 font-bold">{suv.status}</div>
                    <div className="text-slate-400">{suv.kytc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
