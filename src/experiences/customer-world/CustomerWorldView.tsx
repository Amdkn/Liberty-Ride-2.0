import React, { useState } from 'react';
import {
  Plane,
  PhoneIncoming,
  Navigation,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles,
  Car,
} from 'lucide-react';
import { RideBooking } from '../../world-model/types';
import { INITIAL_RIDE_BOOKINGS } from '../../world-model/initialAgentsData';
import { agentFileBridge } from '../../world-model/agentFileBridge';
import { buildAntiOrphanTask, generateExecutionReceipt } from '../../world-model/capabilityEngine';

const ZONE_LABELS: Record<RideBooking['pickupZone'], string> = {
  ERLANGER_HUB: 'Erlanger KY (Dixie Hwy Executive Hub)',
  CVG_TERMINAL: 'CVG International Airport (Terminal Bagages)',
  COVINGTON_RIVERFRONT: 'Covington KY (Riverfront Hotels)',
  CINCINNATI_DOWNTOWN: 'Downtown Cincinnati OH (Business District)',
};

const CORRIDOR_FARES: Record<string, { fare: number; mins: number }> = {
  'ERLANGER_HUB->CVG_TERMINAL': { fare: 48, mins: 14 },
  'CVG_TERMINAL->ERLANGER_HUB': { fare: 48, mins: 14 },
  'CVG_TERMINAL->CINCINNATI_DOWNTOWN': { fare: 65, mins: 22 },
  'CINCINNATI_DOWNTOWN->CVG_TERMINAL': { fare: 65, mins: 22 },
  'CVG_TERMINAL->COVINGTON_RIVERFRONT': { fare: 55, mins: 18 },
  'COVINGTON_RIVERFRONT->CVG_TERMINAL': { fare: 55, mins: 18 },
};

export const CustomerWorldView: React.FC = () => {
  const [bookings, setBookings] = useState<RideBooking[]>(INITIAL_RIDE_BOOKINGS);
  const [passengerName, setPassengerName] = useState('Claire Sterling (Executive Guest)');
  const [passengerPhone, setPassengerPhone] = useState('+1 (859) 555-0199');
  const [pickupZone, setPickupZone] = useState<RideBooking['pickupZone']>('CVG_TERMINAL');
  const [dropoffZone, setDropoffZone] = useState<RideBooking['dropoffZone']>('CINCINNATI_DOWNTOWN');
  const [flightNumber, setFlightNumber] = useState('DL 1844 (Delta Air Lines — Arrivée Porte B12)');
  const [assignedSuv, setAssignedSuv] =
    useState<RideBooking['assignedSuv']>('SUV-01 Liberty One');
  const [vapiCallActive, setVapiCallActive] = useState(false);
  const [vapiTranscript, setVapiTranscript] = useState<string[]>([
    '🤖 [Vapi AI Concierge]: "Welcome to Liberty Ride Executive SUV Service for CVG Airport and Greater Cincinnati. How can I assist your transfer today?"',
  ]);
  const [dispatchConfirmation, setDispatchConfirmation] = useState<string | null>(null);

  const routeKey = `${pickupZone}->${dropoffZone}`;
  const pricing = CORRIDOR_FARES[routeKey] || { fare: 58, mins: 20 };
  const driverNetUsd = +(pricing.fare * 0.78).toFixed(2);
  const impliedHourlyUsd = +((driverNetUsd / pricing.mins) * 60).toFixed(2);

  const dispatchBookingToB2Operations = async (
    channel: RideBooking['channel'],
    customName?: string,
    customFlight?: string
  ) => {
    const newBooking: RideBooking = {
      id: `RIDE-CVG-${Math.floor(100 + Math.random() * 899)}`,
      passengerName: customName || passengerName,
      passengerPhone,
      pickupZone,
      dropoffZone,
      flightNumber: customFlight || flightNumber,
      channel,
      fareUsd: pricing.fare,
      driverNetUsd,
      estimatedMinutes: pricing.mins,
      assignedSuv,
      status: 'DISPATCHED',
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Write real task + receipt into ./agents/b2-01-operations/TASKS.json & RECEIPTS.json
    const { task } = buildAntiOrphanTask(
      `[${newBooking.channel}] Dispatch ${newBooking.id} : ${ZONE_LABELS[pickupZone]} -> ${ZONE_LABELS[dropoffZone]} ($${newBooking.fareUsd})`,
      'OPERATIONS',
      `Pickup < 8 min par ${newBooking.assignedSuv}, vol ${newBooking.flightNumber}, net chauffeur $${newBooking.driverNetUsd}.`
    );
    task.status = 'COMPLETED';

    const receipt = generateExecutionReceipt(
      task,
      'b3-ops-dispatch',
      'b2-01-operations',
      `Course ${newBooking.id} (${newBooking.passengerName}) assignée à ${newBooking.assignedSuv} via ${channel}.`
    );
    receipt.metrics = {
      bookingId: newBooking.id,
      fareUsd: newBooking.fareUsd,
      driverNetUsd: newBooking.driverNetUsd,
      impliedHourlyUsd,
    };

    await agentFileBridge.upsertTaskAndReceipt(
      'b2-01-operations',
      task,
      receipt,
      `Réservation \`${newBooking.id}\` (${channel}) dispatchée par \`b3-ops-dispatch\` sur **${newBooking.assignedSuv}** -> Reçu \`${receipt.id}\`.`
    );

    setDispatchConfirmation(
      `Course ${newBooking.id} créée ! Tâche ${task.id} et Reçu ${receipt.id} écrits dans ./agents/b2-01-operations/.`
    );
    setTimeout(() => setDispatchConfirmation(null), 5000);
  };

  const handleSimulateVapiVoiceBooking = async () => {
    setVapiCallActive(true);
    setVapiTranscript([
      '🤖 [Vapi AI Concierge]: "Welcome to Liberty Ride 2.0 CVG Executive Desk. May I have your flight number and destination?"',
      '🗣 [Voyageur CVG]: "Hi! I just landed at CVG on flight DL 2045. I need a black SUV from CVG Baggage Claim to the Hilton Downtown Cincinnati."',
      '🤖 [Vapi AI Concierge]: "Perfect. Your guaranteed flat rate is $65.00 in SUV-01 Liberty One (Cadillac Escalade ESV). ETA at CVG Terminal Curbside is 5 minutes. Dispatching Marcus Vance (B2-01 Operations) now!"',
    ]);
    await dispatchBookingToB2Operations(
      'VAPI_VOICE',
      'Marcus Sterling (Appel Vocal Vapi CVG)',
      'DL 2045 (Atterri — Terminal B)'
    );
    setTimeout(() => setVapiCallActive(false), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Corridor Visual Header Map (Erlanger <-> CVG Airport <-> Downtown Cincinnati) */}
      <div className="bg-[#09141d] border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Corridor Prioritaire LD01
            </span>
            <h2 className="text-lg font-extrabold text-slate-100 mt-1">
              Erlanger Hub (KY) ↔ Aéroport International CVG ↔ Downtown Cincinnati (OH)
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300">
              ⏱ SLA Pickup CVG : &lt; 7 min
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300">
              💵 Chauffeur Net : ${impliedHourlyUsd}/h (&gt;= $45/h)
            </span>
          </div>
        </div>

        {/* Interactive 4-Node Corridor Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {(
            [
              {
                id: 'ERLANGER_HUB',
                title: '1. Erlanger KY Hub',
                sub: 'Dixie Hwy · Garage 3 Baies SUV',
                badge: 'Base Flotte',
              },
              {
                id: 'CVG_TERMINAL',
                title: '2. CVG Airport (Hebron)',
                sub: 'Sortie Bagages & Ground Staging',
                badge: 'Forfait $48',
              },
              {
                id: 'COVINGTON_RIVERFRONT',
                title: '3. Covington Riverfront',
                sub: 'Hôtels Partenaires B2B Kentucky',
                badge: 'Forfait $55',
              },
              {
                id: 'CINCINNATI_DOWNTOWN',
                title: '4. Downtown Cincinnati',
                sub: 'Sièges Fortune 500 & Congrès',
                badge: 'Forfait $65',
              },
            ] as const
          ).map((node) => {
            const isPickup = pickupZone === node.id;
            const isDropoff = dropoffZone === node.id;
            return (
              <div
                key={node.id}
                onClick={() => {
                  if (pickupZone !== node.id) {
                    setDropoffZone(node.id);
                  }
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  isPickup
                    ? 'bg-emerald-950/60 border-emerald-400 shadow-lg'
                    : isDropoff
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-slate-300 font-bold">{node.badge}</span>
                  {isPickup && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold">
                      DÉPART
                    </span>
                  )}
                  {isDropoff && (
                    <span className="px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-extrabold">
                      ARRIVÉE
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs text-slate-100">{node.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{node.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {dispatchConfirmation && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-mono flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{dispatchConfirmation}</span>
        </div>
      )}

      {/* Main Split: 2-Click Booking Tunnel + Vapi Voice Receptionist Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Fast 2D Booking Tunnel */}
        <div className="lg:col-span-7 bg-[#09141d] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Tunnel de Réservation Rapide SUV Exécutif (Connecté à `b2-01-operations`)
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-300 font-bold">
              Tarif Garanti : ${pricing.fare}.00
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-mono text-slate-400 mb-1">Nom du Passager / VIP</label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block font-mono text-slate-400 mb-1">Téléphone Mobile (SMS ETA)</label>
              <input
                type="text"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">Point de Prise en Charge</label>
              <select
                value={pickupZone}
                onChange={(e) => setPickupZone(e.target.value as RideBooking['pickupZone'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              >
                {Object.entries(ZONE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">Destination</label>
              <select
                value={dropoffZone}
                onChange={(e) => setDropoffZone(e.target.value as RideBooking['dropoffZone'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              >
                {Object.entries(ZONE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">
                Numéro de Vol CVG (Suivi Automatique)
              </label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">Véhicule SUV Noir Assigné</label>
              <select
                value={assignedSuv}
                onChange={(e) => setAssignedSuv(e.target.value as RideBooking['assignedSuv'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-mono"
              >
                <option value="SUV-01 Liberty One">SUV-01 Liberty One (Cadillac Escalade ESV)</option>
                <option value="SUV-02 Bluegrass Exec">SUV-02 Bluegrass Exec (Chevy Suburban)</option>
                <option value="SUV-03 Queen City Black">SUV-03 Queen City Black (GMC Yukon XL)</option>
              </select>
            </div>
          </div>

          {/* Transparent Unit Economics Bar */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-300">
              Forfait Client : <b className="text-white">${pricing.fare}.00</b> ({pricing.mins} min)
            </span>
            <span className="text-emerald-300">
              Part Chauffeur (78%) : <b>${driverNetUsd}</b> (${impliedHourlyUsd}/h)
            </span>
            <span className="text-cyan-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> KYTC &amp; CVG AVI Validés
            </span>
          </div>

          <button
            id="confirm-web-booking-btn"
            onClick={() => dispatchBookingToB2Operations('WEB_PORTAL')}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirmer la Réservation &amp; Dispatcher b3-ops-dispatch (RECEIPTS.json)
          </button>
        </div>

        {/* Right 5 Cols: Vapi AI Voice Receptionist Simulator + Live Bookings Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#09141d] border border-cyan-500/30 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneIncoming className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Simulateur Vocal Vapi (`workflows/vapi/receptionist-config.json`)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                Latence &lt; 800ms
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-h-44 overflow-y-auto font-mono text-[11px]">
              {vapiTranscript.map((line, i) => (
                <p
                  key={i}
                  className={
                    line.startsWith('🤖') ? 'text-cyan-300' : 'text-emerald-300 font-semibold'
                  }
                >
                  {line}
                </p>
              ))}
            </div>

            <button
              id="simulate-vapi-call-btn"
              onClick={handleSimulateVapiVoiceBooking}
              disabled={vapiCallActive}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <PhoneIncoming className="w-4 h-4" />
              {vapiCallActive
                ? 'Appel Vocal Vapi en cours...'
                : '🎙 Simuler un Appel Voyageur CVG -> Dispatch Automatique B2-01'}
            </button>
          </div>

          {/* Active Corridor Bookings List */}
          <div className="bg-[#09141d] border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              Courses Actives sur le Corridor Erlanger – CVG ({bookings.length})
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {bookings.map((bk) => (
                <div
                  key={bk.id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-emerald-300 font-bold">
                      {bk.id} · {bk.channel}
                    </span>
                    <span className="text-amber-300 font-bold">
                      ${bk.fareUsd} (Net Chauffeur: ${bk.driverNetUsd})
                    </span>
                  </div>
                  <div className="font-semibold text-slate-100">{bk.passengerName}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Plane className="w-3 h-3 text-cyan-400" />
                    <span>{bk.flightNumber}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>{bk.assignedSuv}</span>
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
