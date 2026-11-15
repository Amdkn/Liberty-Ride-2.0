import React, { useState } from 'react';
import { DollarSign, CheckCircle2, AlertOctagon, FileCheck2 } from 'lucide-react';
import { agentFileBridge } from '../../world-model/agentFileBridge';
import { buildAntiOrphanTask, generateExecutionReceipt } from '../../world-model/capabilityEngine';

export const DriverEarningsSimulator: React.FC = () => {
  const [ridesPerHour, setRidesPerHour] = useState<number>(1.35);
  const [avgFareUsd, setAvgFareUsd] = useState<number>(54);
  const [driverSharePct, setDriverSharePct] = useState<number>(78);
  const [avgTipPerHourUsd, setAvgTipPerHourUsd] = useState<number>(6.5);
  const [fuelMaintPerHourUsd, setFuelMaintPerHourUsd] = useState<number>(7.8);
  const [certBanner, setCertBanner] = useState<string | null>(null);

  const grossHourlyUsd = ridesPerHour * avgFareUsd;
  const driverCommissionHourly = grossHourlyUsd * (driverSharePct / 100);
  const netDriverHourlyUsd = +(driverCommissionHourly + avgTipPerHourUsd - fuelMaintPerHourUsd).toFixed(2);
  const meetsTarget = netDriverHourlyUsd >= 45.0;

  const handleCertifyFinOpsReceipt = async () => {
    const { task } = buildAntiOrphanTask(
      `Certification FinOps Chauffeur : $${netDriverHourlyUsd}/h net sur corridor Erlanger-CVG`,
      'FINANCE',
      'Revenu net horaire chauffeur >= $45.00/h vérifié par Arthur Sterling (b2-05-finance).'
    );
    task.status = 'COMPLETED';
    const receipt = generateExecutionReceipt(
      task,
      'b3-fin-ledger',
      'b2-05-finance',
      `Audit Simulateur Driver House 3D : $${netDriverHourlyUsd}/h net chauffeur (${ridesPerHour} courses/h @ $${avgFareUsd}).`
    );
    receipt.metrics = {
      netDriverHourlyUsd,
      targetHourlyUsd: 45.0,
      status: meetsTarget ? 'CONFORME_CIBLE_A0' : 'SOUS_SEUIL_ALERTE',
    };

    await agentFileBridge.upsertTaskAndReceipt(
      'b2-05-finance',
      task,
      receipt,
      `Simulateur FinOps Driver House : **$${netDriverHourlyUsd}/h net chauffeur** archivé dans \`RECEIPTS.json\` (\`${receipt.id}\`).`
    );
    setCertBanner(`Reçu FinOps ${receipt.id} enregistré dans ./agents/b2-05-finance/RECEIPTS.json !`);
    setTimeout(() => setCertBanner(null), 4000);
  };

  return (
    <div className="bg-[#09141d] border border-amber-500/30 rounded-2xl p-4 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Simulateur FinOps Chauffeur — Corridor Erlanger ↔ CVG ↔ Cincinnati
            </h3>
            <p className="text-xs text-slate-400">
              Supervisé par <b>Arthur Sterling (`b2-05-finance`)</b> · Cible Souveraine A0 :{' '}
              <code className="text-emerald-300 font-mono">&gt;= $45.00 / h net</code>
            </p>
          </div>
        </div>

        <div
          className={`px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold flex items-center gap-1.5 border ${
            meetsTarget
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
              : 'bg-red-500/20 border-red-400 text-red-300'
          }`}
        >
          {meetsTarget ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertOctagon className="w-4 h-4 text-red-400" />
          )}
          <span>NET : ${netDriverHourlyUsd.toFixed(2)} / h</span>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex justify-between font-mono">
            <span className="text-slate-300">Courses / Heure (Corridor CVG)</span>
            <span className="text-cyan-300 font-bold">{ridesPerHour.toFixed(2)} / h</span>
          </div>
          <input
            type="range"
            min={0.8}
            max={2.0}
            step={0.05}
            value={ridesPerHour}
            onChange={(e) => setRidesPerHour(parseFloat(e.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex justify-between font-mono">
            <span className="text-slate-300">Tarif Moyen SUV ($48 Erlanger / $65 Cincy)</span>
            <span className="text-amber-300 font-bold">${avgFareUsd}</span>
          </div>
          <input
            type="range"
            min={38}
            max={85}
            step={1}
            value={avgFareUsd}
            onChange={(e) => setAvgFareUsd(parseFloat(e.target.value))}
            className="w-full accent-amber-400"
          />
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex justify-between font-mono">
            <span className="text-slate-300">Part Chauffeur (%)</span>
            <span className="text-emerald-300 font-bold">{driverSharePct}%</span>
          </div>
          <input
            type="range"
            min={65}
            max={85}
            step={1}
            value={driverSharePct}
            onChange={(e) => setDriverSharePct(parseFloat(e.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex justify-between font-mono">
            <span className="text-slate-300">Pourboires Moyens / h vs Carburant SUV</span>
            <span className="text-slate-200 font-bold">
              +${avgTipPerHourUsd.toFixed(1)} / -${fuelMaintPerHourUsd.toFixed(1)}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={avgTipPerHourUsd}
              onChange={(e) => setAvgTipPerHourUsd(parseFloat(e.target.value))}
              className="w-1/2 accent-cyan-400"
            />
            <input
              type="range"
              min={4}
              max={14}
              step={0.2}
              value={fuelMaintPerHourUsd}
              onChange={(e) => setFuelMaintPerHourUsd(parseFloat(e.target.value))}
              className="w-1/2 accent-red-400"
            />
          </div>
        </div>
      </div>

      {certBanner && (
        <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-xs font-mono text-emerald-200">
          ✓ {certBanner}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="text-xs font-mono text-slate-400">
          Projection Journalière (8h) :{' '}
          <b className="text-emerald-300">${(netDriverHourlyUsd * 8).toFixed(2)} net/jour</b> ·
          Hebdo (5j) : <b className="text-amber-300">${(netDriverHourlyUsd * 40).toFixed(0)}/sem</b>
        </div>

        <button
          id="certify-finops-receipt-btn"
          onClick={handleCertifyFinOpsReceipt}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-md"
        >
          <FileCheck2 className="w-4 h-4" />
          Certifier & Écrire dans b2-05-finance/RECEIPTS.json
        </button>
      </div>
    </div>
  );
};
