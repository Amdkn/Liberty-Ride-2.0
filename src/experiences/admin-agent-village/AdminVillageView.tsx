import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Map,
  PhoneCall,
  Landmark,
  Zap,
  FolderUp,
  Terminal,
  DoorOpen,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  AgentNode,
  DomainId,
  SceneLocationId,
  TaskRecord,
} from '../../world-model/types';
import {
  buildAntiOrphanTask,
  countBlockedTasks,
  DOMAIN_ROUTING_MAP,
  generateExecutionReceipt,
  registerB2Rejection,
  unblockTaskWithHulkPower,
} from '../../world-model/capabilityEngine';
import { agentFileBridge } from '../../world-model/agentFileBridge';
import {
  CAMPUS_BUILDING_DOORWAYS,
  DOMAIN_ROOM_ANCHORS,
} from './SeatedAnchorsRegistry';
import { renderWalkmapDebugOverlay } from './WalkmapCollision';
import {
  drawAgentSpriteFrame,
  registerCustomSpritePng,
} from './SpriteSheetSlicer';
import {
  registerCustomSceneBackground,
  renderSceneBackground,
} from './ProceduralSceneRenderer';
import { AgentBehaviorFSMController } from './AgentBehaviorFSM';
import { AgentInspectorDrawer } from './AgentInspectorDrawer';

interface AdminVillageViewProps {
  agents: AgentNode[];
  isDiskConnected: boolean;
}

export const AdminVillageView: React.FC<AdminVillageViewProps> = ({
  agents,
  isDiskConnected,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fsmRef = useRef<AgentBehaviorFSMController>(new AgentBehaviorFSMController());
  const keysPressedRef = useRef<Set<string>>(new Set());
  const lastKeyNTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const movingMapRef = useRef<Record<string, boolean>>({});

  const [activeScene, setActiveScene] = useState<SceneLocationId>('CAMPUS');
  const [showWalkmap, setShowWalkmap] = useState<boolean>(false);
  const [isHulkMode, setIsHulkMode] = useState<boolean>(false);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('a0-amadeus');
  const [callB1ModalOpen, setCallB1ModalOpen] = useState<boolean>(false);
  const [missionTitle, setMissionTitle] = useState<string>(
    'Optimiser la rotation matinale des 3 SUV Erlanger -> CVG Terminal Bagages'
  );
  const [missionDomain, setMissionDomain] =
    useState<Exclude<DomainId, 'SOVEREIGN' | 'EXECUTIVE'>>('OPERATIONS');
  const [liveToast, setLiveToast] = useState<string | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setLiveToast(msg);
    setTimeout(() => {
      setLiveToast((prev) => (prev === msg ? null : prev));
    }, 4200);
  }, []);

  // Toggle A0 Amadeus Hulk Mode (Key H or Button)
  const toggleHulkMode = useCallback(() => {
    setIsHulkMode((prev) => {
      const next = !prev;
      agentFileBridge.updateAgentsInMemory((list) =>
        list.map((ag) => {
          if (ag.id !== 'a0-amadeus') return ag;
          return {
            ...ag,
            posture: next ? 'UNBLOCK_HULK' : 'NORMAL_HOODY',
            speedMultiplier: next ? 2.0 : 1.0,
            speechBubble: next
              ? '⚡ MODE HULK (UNBLOCK x2 VITESSE) !'
              : 'Mode Normal Hoody activé',
            speechBubbleUntil: Date.now() + 3800,
          };
        })
      );
      triggerToast(
        next
          ? '⚡ A0 Amadeus transformé en HULK (UNBLOCK_HULK) : vitesse x2 & pouvoir de déblocage souverain actif !'
          : 'A0 Amadeus revenu en posture NORMAL_HOODY.'
      );
      return next;
    });
  }, [triggerToast]);

  // Unblock a BLOCKED_2X task using Hulk Mode
  const handleUnblockTaskHulk = useCallback(
    async (agentId: string, task: TaskRecord) => {
      if (!isHulkMode) {
        setIsHulkMode(true);
      }
      const { updatedTask, receipt, learningNote } = unblockTaskWithHulkPower(task);
      const b2Target = task.ownerB2 || agentId;

      agentFileBridge.updateAgentsInMemory((list) =>
        list.map((ag) => {
          if (ag.id === 'a0-amadeus') {
            return {
              ...ag,
              posture: 'UNBLOCK_HULK',
              speedMultiplier: 2.0,
              speechBubble: `⚡ UNBLOCK ${task.id} !`,
              speechBubbleUntil: Date.now() + 4500,
            };
          }
          if (ag.id === b2Target) {
            return {
              ...ag,
              speechBubble: `✅ Débloqué par A0 Hulk (${receipt.id})`,
              speechBubbleUntil: Date.now() + 4500,
            };
          }
          return ag;
        })
      );

      await agentFileBridge.upsertTaskAndReceipt(b2Target, updatedTask, receipt, learningNote);
      triggerToast(`⚡ Tâche ${task.id} débloquée par A0 Hulk ! Reçu ${receipt.id} enregistré.`);
    },
    [isHulkMode, triggerToast]
  );

  // Execute B2 -> B3 SOP workflow with animated yellow-vest worker & receipt generation
  const handleExecuteTaskSop = useCallback(
    async (b2AgentId: string, task: TaskRecord) => {
      const b3Id = task.workerB3;
      const b2Node = agents.find((a) => a.id === b2AgentId);
      const roomKey = (b2Node?.homeRoom || 'ROOM_01') as Exclude<
        SceneLocationId,
        'CAMPUS' | 'ROOM_00'
      >;
      const anchors = DOMAIN_ROOM_ANCHORS[roomKey] || DOMAIN_ROOM_ANCHORS.ROOM_01;

      // Step 1: B2 sits at desk, B3 animates SOP at workbench
      agentFileBridge.updateAgentsInMemory((list) =>
        list.map((ag) => {
          if (ag.id === b2AgentId) {
            return {
              ...ag,
              posture: 'SEATED',
              targetX: anchors.b2DeskSeat.x,
              targetY: anchors.b2DeskSeat.y,
              speechBubble: `📋 Délégation SOP -> ${b3Id}`,
              speechBubbleUntil: Date.now() + 3000,
            };
          }
          if (ag.id === b3Id) {
            return {
              ...ag,
              posture: 'EXECUTING_SOP',
              targetX: anchors.b3ReceiptDeliveryPoint.x,
              targetY: anchors.b3ReceiptDeliveryPoint.y,
              speechBubble: `🦺 Exécution SOP ${task.id}...`,
              speechBubbleUntil: Date.now() + 3000,
            };
          }
          return ag;
        })
      );

      // Step 2: B3 walks to B2 desk to submit receipt, B2 verifies & completes task
      setTimeout(async () => {
        const completedTask: TaskRecord = {
          ...task,
          status: 'COMPLETED',
          updatedAt: new Date().toISOString(),
        };
        const receipt = generateExecutionReceipt(completedTask, b3Id, b2AgentId);
        const noteLine = `SOP exécutée par \`${b3Id}\` (Gilet Jaune) et vérifiée par \`${b2AgentId}\` : **${task.title}** -> Reçu \`${receipt.id}\` validé.`;

        agentFileBridge.updateAgentsInMemory((list) =>
          list.map((ag) => {
            if (ag.id === b3Id) {
              return {
                ...ag,
                posture: 'SUBMITTING_RECEIPT',
                targetX: anchors.b3Workbench.x,
                targetY: anchors.b3Workbench.y,
                speechBubble: `🧾 Reçu ${receipt.id} remis !`,
                speechBubbleUntil: Date.now() + 3500,
              };
            }
            if (ag.id === b2AgentId) {
              return {
                ...ag,
                posture: 'SEATED',
                speechBubble: `✅ Preuve vérifiée (${receipt.id})`,
                speechBubbleUntil: Date.now() + 3800,
              };
            }
            return ag;
          })
        );

        await agentFileBridge.upsertTaskAndReceipt(b2AgentId, completedTask, receipt, noteLine);
        await agentFileBridge.upsertTaskAndReceipt(b3Id, completedTask, receipt, noteLine);
        triggerToast(`✅ ${b3Id} a remis le reçu ${receipt.id} à ${b2AgentId} (NOTES.md mis à jour).`);
      }, 1400);
    },
    [agents, triggerToast]
  );

  // Simulate 2 consecutive rejections by B2 Director -> triggers BLOCKED_2X for Hulk mode
  const handleSimulateReject2x = useCallback(
    async (b2AgentId: string, task: TaskRecord) => {
      const r1 = registerB2Rejection(task);
      const r2 = registerB2Rejection(r1);
      const noteLine = `[ALERTE BLOCKED_2X] Tâche \`${task.id}\` rejetée 2 fois au contrôle TDD par \`${b2AgentId}\`. Escalade Mode Hulk A0 requise.`;
      await agentFileBridge.upsertTaskAndReceipt(b2AgentId, r2, undefined, noteLine);
      triggerToast(
        `🚨 Tâche ${task.id} en statut BLOCKED_2X (2 rejets) ! Appuyez sur H (Mode Hulk) pour la débloquer.`
      );
    },
    [triggerToast]
  );

  // Call Town Hall (Key C or Button): Convene A0, B1, and 8 B2 Directors in Room 00 Seated
  const handleCallTownHall = useCallback(() => {
    setActiveScene('ROOM_00');
    agentFileBridge.updateAgentsInMemory((list) =>
      fsmRef.current.assembleTownHallCouncil(list, Date.now())
    );
    triggerToast(
      '🏛 Conseil 12WY convoqué au City Hall (Room 00) ! Les 8 Directeurs B2 s’assoient autour de la maquette du village.'
    );
  }, [triggerToast]);

  // Dispatch Mission via B1 CEO Elena Rostova (Double-N or Button)
  const handleDispatchFromB1 = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!missionTitle.trim()) return;

      const { task, routing } = buildAntiOrphanTask(missionTitle, missionDomain);
      setCallB1ModalOpen(false);
      setSelectedAgentId(routing.b2AgentId);

      // 1. Switch B1 Elena to PHONE_DISPATCH sprite + beam to B2
      fsmRef.current.triggerDispatchBeam(
        'b1-ceo-chief-of-staff',
        routing.b2AgentId,
        '#00E5FF',
        `📲 ${task.id} -> ${routing.b2AgentId}`
      );

      agentFileBridge.updateAgentsInMemory((list) =>
        list.map((ag) => {
          if (ag.id === 'b1-ceo-chief-of-staff') {
            return {
              ...ag,
              posture: 'PHONE_DISPATCH',
              speechBubble: `📲 Dispatch ${task.id} vers ${routing.b2AgentId}`,
              speechBubbleUntil: Date.now() + 4200,
            };
          }
          if (ag.id === routing.b2AgentId) {
            return {
              ...ag,
              posture: 'SEATED',
              speechBubble: `📥 Mission reçue de B1 ! Activation ${routing.b3WorkerId}`,
              speechBubbleUntil: Date.now() + 4200,
            };
          }
          return ag;
        })
      );

      await agentFileBridge.upsertTaskAndReceipt(
        routing.b2AgentId,
        task,
        undefined,
        `Mission assignée par B1 CEO Elena Rostova : **${task.title}** (Déléguée à \`${routing.b3WorkerId}\`).`
      );

      triggerToast(
        `📲 Elena B1 (PHONE_DISPATCH) a envoyé ${task.id} à ${routing.b2AgentId} -> Exécution SOP B3 en cours...`
      );

      // Return B1 to WALK_FOLLOW after phone call and auto-run B3 SOP
      setTimeout(() => {
        agentFileBridge.updateAgentsInMemory((list) =>
          list.map((ag) =>
            ag.id === 'b1-ceo-chief-of-staff' ? { ...ag, posture: 'WALK_FOLLOW' } : ag
          )
        );
        void handleExecuteTaskSop(routing.b2AgentId, task);
      }, 2200);
    },
    [missionTitle, missionDomain, handleExecuteTaskSop, triggerToast]
  );

  // Keyboard Listeners (ZQSD/WASD/Arrows, M, Double-N, C, H, T)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      keysPressedRef.current.add(e.code);

      if (e.code === 'KeyM') {
        e.preventDefault();
        setShowWalkmap((prev) => !prev);
      } else if (e.code === 'KeyH') {
        e.preventDefault();
        toggleHulkMode();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        handleCallTownHall();
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        setInspectorOpen((prev) => !prev);
      } else if (e.code === 'KeyN') {
        const now = Date.now();
        if (now - lastKeyNTimeRef.current < 420) {
          e.preventDefault();
          setCallB1ModalOpen(true);
        }
        lastKeyNTimeRef.current = now;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [toggleHulkMode, handleCallTownHall]);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    let animId = 0;

    const renderLoop = () => {
      frameCountRef.current += 1;
      const nowMs = Date.now();

      // Advance FSM
      const snapshot = agentFileBridge.getAgentsSnapshot();
      const { nextAgents, nextScene, movingMap } = fsmRef.current.stepFrame(
        snapshot,
        activeScene,
        keysPressedRef.current,
        nowMs
      );
      movingMapRef.current = movingMap;

      if (nextScene !== activeScene) {
        setActiveScene(nextScene);
      }
      agentFileBridge.updateAgentsInMemory(() => nextAgents);

      // Draw Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 1280, 720);

          // 1. Scene Background
          renderSceneBackground(ctx, nextScene, frameCountRef.current);

          // 2. Walkmap Debug Overlay (Key M)
          if (showWalkmap) {
            renderWalkmapDebugOverlay(ctx, nextScene);
          }

          // 3. Filter visible agents in current scene
          const visibleAgents = nextAgents
            .filter((ag) => {
              if (nextScene === 'CAMPUS') {
                // On Campus: show A0, B1, and the 8 B2 Directors
                return ag.tier !== 'B3';
              }
              if (nextScene === 'ROOM_00') {
                return (
                  ag.currentLocation === 'ROOM_00' ||
                  ag.id === 'a0-amadeus' ||
                  ag.id === 'b1-ceo-chief-of-staff'
                );
              }
              // Inside ROOM_01..ROOM_08: show A0, B1, and the room's B2 Director + B3 Worker
              return (
                ag.id === 'a0-amadeus' ||
                ag.id === 'b1-ceo-chief-of-staff' ||
                ag.homeRoom === nextScene ||
                ag.currentLocation === nextScene
              );
            })
            .sort((a, b) => a.y - b.y);

          // 4. Draw Active Dispatch Beam from B1 to B2
          const beam = fsmRef.current.getActiveBeam();
          if (beam) {
            const fromAg = visibleAgents.find((a) => a.id === beam.fromAgentId);
            const toAg = visibleAgents.find((a) => a.id === beam.toAgentId);
            if (fromAg && toAg) {
              ctx.save();
              ctx.strokeStyle = beam.color;
              ctx.lineWidth = 3;
              ctx.setLineDash([8, 6]);
              ctx.beginPath();
              ctx.moveTo(fromAg.x, fromAg.y - 24);
              ctx.lineTo(toAg.x, toAg.y - 24);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.restore();
            }
          }

          // 5. Draw Agents with Canonical Scale (1/22 on Overworld = 32.7px, 1/12 in Rooms = 60px)
          const targetCharHeight = nextScene === 'CAMPUS' ? 720 / 22 : 720 / 12;

          for (const ag of visibleAgents) {
            const isSelected = ag.id === selectedAgentId;
            const hasBlockedTask = ag.tasks.some((t) => t.status === 'BLOCKED_2X');

            // Choose active sprite key based on posture
            let spriteKey = ag.standingSpriteKey;
            if (ag.id === 'a0-amadeus' && ag.posture === 'UNBLOCK_HULK') {
              spriteKey = ag.altSpriteKey; // a0_hulk
            } else if (ag.id === 'b1-ceo-chief-of-staff' && ag.posture === 'PHONE_DISPATCH') {
              spriteKey = ag.altSpriteKey; // b1_phone
            } else if (ag.tier === 'B2' && ag.posture === 'SEATED') {
              spriteKey = ag.altSpriteKey; // b2_*_seated
            }

            // Selection or Blocked Halo
            ctx.save();
            if (isSelected || hasBlockedTask) {
              ctx.strokeStyle = hasBlockedTask ? '#ef4444' : ag.roofColor;
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.ellipse(
                ag.x,
                ag.y - 2,
                nextScene === 'CAMPUS' ? 14 : 22,
                nextScene === 'CAMPUS' ? 6 : 9,
                0,
                0,
                Math.PI * 2
              );
              ctx.stroke();
            }

            drawAgentSpriteFrame(
              ctx,
              spriteKey,
              ag.direction,
              frameCountRef.current,
              Boolean(movingMapRef.current[ag.id]),
              ag.x,
              ag.y,
              targetCharHeight
            );

            // Agent Nameplate & Tier Badge
            const labelY = ag.y + (nextScene === 'CAMPUS' ? 11 : 14);
            ctx.font =
              nextScene === 'CAMPUS'
                ? '700 9px "JetBrains Mono", monospace'
                : '700 11px "JetBrains Mono", monospace';
            const badgeText = `${ag.tier}·${ag.name.split(' ')[0]}`;
            const textW = ctx.measureText(badgeText).width + 10;

            ctx.fillStyle = 'rgba(6, 13, 19, 0.85)';
            ctx.strokeStyle = hasBlockedTask ? '#ef4444' : ag.roofColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(ag.x - textW / 2, labelY - 9, textW, 13, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'center';
            ctx.fillText(badgeText, ag.x, labelY);

            // Speech Bubble if active
            if (ag.speechBubble) {
              const bubbleY = ag.y - targetCharHeight - 14;
              ctx.font = '600 10px "Inter", sans-serif';
              const bw = Math.min(260, ctx.measureText(ag.speechBubble).width + 16);
              ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
              ctx.strokeStyle = '#00E676';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.roundRect(ag.x - bw / 2, bubbleY - 16, bw, 20, 6);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#a7f3d0';
              ctx.fillText(ag.speechBubble, ag.x, bubbleY - 3);
            }
            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [activeScene, showWalkmap, selectedAgentId]);

  // Handle Mouse Click on 1280x720 Canvas (Select Agent OR Pathfind A0 Amadeus)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if user clicked on an agent
    const hitRadius = activeScene === 'CAMPUS' ? 24 : 36;
    const clickedAgent = agents.find((ag) => {
      const inScene =
        activeScene === 'CAMPUS'
          ? ag.tier !== 'B3'
          : ag.id === 'a0-amadeus' ||
            ag.id === 'b1-ceo-chief-of-staff' ||
            ag.homeRoom === activeScene ||
            ag.currentLocation === activeScene;
      if (!inScene) return false;
      return Math.hypot(ag.x - clickX, ag.y - 18 - clickY) <= hitRadius;
    });

    if (clickedAgent) {
      setSelectedAgentId(clickedAgent.id);
      setInspectorOpen(true);
      return;
    }

    // Otherwise move A0 Amadeus via A* Pathfinding
    const a0 = agents.find((a) => a.id === 'a0-amadeus');
    if (a0) {
      fsmRef.current.setA0PathTo(activeScene, a0.x, a0.y, clickX, clickY);
    }
  };

  // Hot-import PNG Sprite Sheets or Map/Room PNGs via File Picker or Drag & Drop
  const processImportedFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const lower = file.name.toLowerCase();
          if (lower.includes('campus') || lower.includes('map')) {
            registerCustomSceneBackground('CAMPUS', img);
            triggerToast(`🗺 Carte Overworld PNG "${file.name}" importée !`);
          } else if (lower.includes('room-00') || lower.includes('city-hall')) {
            registerCustomSceneBackground('ROOM_00', img);
            triggerToast(`🏛 Salle City Hall PNG "${file.name}" importée !`);
          } else if (lower.includes('hulk')) {
            registerCustomSpritePng('a0_hulk', img, 3, 4);
            triggerToast(`⚡ Sprite 3x4 Hulk "${file.name}" importé avec Auto-ChromaKey !`);
          } else if (lower.includes('amadeus') || lower.includes('hoody') || lower.includes('a0')) {
            registerCustomSpritePng('a0_hoody', img, 3, 4);
            triggerToast(`🧥 Sprite 3x4 A0 Amadeus "${file.name}" importé avec Auto-ChromaKey !`);
          } else if (lower.includes('phone')) {
            registerCustomSpritePng('b1_phone', img, 3, 4);
            triggerToast(`📲 Sprite B1 Phone Dispatch "${file.name}" importé !`);
          } else if (lower.includes('ceo') || lower.includes('b1')) {
            registerCustomSpritePng('b1_walk', img, 3, 4);
            triggerToast(`👩‍💼 Sprite 3x4 B1 CEO "${file.name}" importé !`);
          } else if (lower.includes('vest') || lower.includes('b3')) {
            registerCustomSpritePng('b3_worker_yellow_vest', img, 3, 4);
            triggerToast(`🦺 Sprite 3x4 Worker B3 Gilet Jaune "${file.name}" importé !`);
          } else {
            registerCustomSpritePng('a0_hoody', img, 3, 4);
            triggerToast(`✨ Planche PNG "${file.name}" découpée (3x4 + ChromaKey) !`);
          }
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  const blockedTasks = countBlockedTasks(agents);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Top Action Toolbar for Admin Agent Village */}
      <div className="bg-[#09141d] border border-emerald-500/25 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          {/* Scene / Room Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <DoorOpen className="w-4 h-4 text-emerald-400" />
            <select
              id="village-scene-select"
              value={activeScene}
              onChange={(e) => {
                const target = e.target.value as SceneLocationId;
                setActiveScene(target);
                fsmRef.current.clearA0Waypoints();
                if (target !== 'CAMPUS') {
                  agentFileBridge.updateAgentsInMemory((list) =>
                    list.map((ag) => {
                      if (ag.id === 'a0-amadeus') {
                        return { ...ag, currentLocation: target, x: 640, y: 580, direction: 'UP' };
                      }
                      if (ag.id === 'b1-ceo-chief-of-staff') {
                        return { ...ag, currentLocation: target, x: 590, y: 600, direction: 'UP' };
                      }
                      if (ag.tier === 'B2' && ag.homeRoom === target) {
                        const anchors =
                          DOMAIN_ROOM_ANCHORS[target as Exclude<SceneLocationId, 'CAMPUS' | 'ROOM_00'>];
                        return {
                          ...ag,
                          currentLocation: target,
                          x: anchors ? anchors.b2DeskSeat.x : ag.x,
                          y: anchors ? anchors.b2DeskSeat.y : ag.y,
                          targetX: anchors ? anchors.b2DeskSeat.x : ag.targetX,
                          targetY: anchors ? anchors.b2DeskSeat.y : ag.targetY,
                          posture: 'SEATED',
                        };
                      }
                      return ag;
                    })
                  );
                }
              }}
              className="bg-transparent text-xs font-mono text-slate-100 focus:outline-none"
            >
              <option value="CAMPUS" className="bg-slate-900">
                🌍 Overworld : Campus Solarpunk (Échelle 1/22)
              </option>
              {CAMPUS_BUILDING_DOORWAYS.map((b) => (
                <option key={b.roomId} value={b.roomId} className="bg-slate-900">
                  🏛 Intérieur HD : {b.label} (Échelle 1/12)
                </option>
              ))}
            </select>
          </div>

          {/* Walkmap Toggle (Key M) */}
          <button
            id="toggle-walkmap-btn"
            onClick={() => setShowWalkmap((p) => !p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition ${
              showWalkmap
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            🗺 Walkmap (M)
          </button>

          {/* Call B1 CEO (Double-N) */}
          <button
            id="call-b1-ceo-btn"
            onClick={() => setCallB1ModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 flex items-center gap-1.5 transition"
          >
            <PhoneCall className="w-3.5 h-3.5 text-cyan-300" />
            📲 Call B1 CEO (Double-N)
          </button>

          {/* Call Town Hall (Key C) */}
          <button
            id="call-town-hall-btn"
            onClick={handleCallTownHall}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 flex items-center gap-1.5 transition"
          >
            <Landmark className="w-3.5 h-3.5 text-amber-300" />
            🏛 Call Town Hall (C)
          </button>

          {/* Hulk Unblock Mode (Key H) */}
          <button
            id="toggle-hulk-mode-btn"
            onClick={toggleHulkMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition ${
              isHulkMode
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/30 animate-pulse'
                : 'bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-500/50 text-emerald-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            ⚡ Mode Hulk UNBLOCK (H)
          </button>
        </div>

        {/* Right Controls: Import PNGs Drive + Inspector Toggle */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => processImportedFiles(e.target.files)}
          />
          <button
            id="import-drive-pngs-btn"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5"
            title="Glisser-déposer ou sélectionner des planches PNG 3x4 / cartes depuis Google Drive"
          >
            <FolderUp className="w-3.5 h-3.5 text-emerald-400" />
            📂 Importer PNGs Drive
          </button>

          <button
            id="toggle-inspector-btn"
            onClick={() => setInspectorOpen((p) => !p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border ${
              inspectorOpen
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Inspecteur (T)
          </button>
        </div>
      </div>

      {/* Alert Banner when a task is in BLOCKED_2X */}
      {blockedTasks.length > 0 && (
        <div className="bg-red-950/60 border border-red-500/60 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-red-200">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
            <span>
              <b>ALERTE ESCALADE BLOCKED_2X ({blockedTasks.length}) :</b> La tâche{' '}
              <code className="font-mono text-red-300">{blockedTasks[0].id}</code> (
              {blockedTasks[0].title}) a subi 2 rejets B2 consécutifs.
            </span>
          </div>
          <button
            onClick={() => handleUnblockTaskHulk(blockedTasks[0].ownerB2, blockedTasks[0])}
            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Zap className="w-3.5 h-3.5" />⚡ Débloquer avec A0 Hulk (UNBLOCK)
          </button>
        </div>
      )}

      {liveToast && (
        <div className="bg-emerald-950/80 border border-emerald-400/50 rounded-xl px-4 py-2 text-xs font-mono text-emerald-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{liveToast}</span>
        </div>
      )}

      {/* Main Split View: 1280x720 Responsive Canvas + Agent Inspector Drawer */}
      <div
        className="flex flex-col lg:flex-row gap-3 items-start"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          processImportedFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex-1 w-full bg-[#050c11] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl relative">
          <canvas
            id="admin-village-canvas"
            ref={canvasRef}
            width={1280}
            height={720}
            onClick={handleCanvasClick}
            className="w-full h-auto aspect-video block cursor-crosshair select-none"
          />

          {/* Bottom-Left HUD Overlay on Canvas */}
          <div className="absolute bottom-3 left-3 bg-slate-950/85 border border-slate-800 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-300 pointer-events-none flex flex-wrap items-center gap-3">
            <span>
              🎮 <b>ZQSD/Flèches</b> ou <b>Clic Sol</b> : Déplacer A0
            </span>
            <span>•</span>
            <span>
              <b>B1 Elena</b> : Suit A0 (18 frames)
            </span>
            <span>•</span>
            <span>
              <b>Clic Agent</b> : Inspecter AGENT.md / NOTES.md / RECEIPTS.json
            </span>
          </div>
        </div>

        {inspectorOpen && (
          <AgentInspectorDrawer
            agent={selectedAgent}
            allAgents={agents}
            isDiskConnected={isDiskConnected}
            isHulkMode={isHulkMode}
            onClose={() => setInspectorOpen(false)}
            onSelectAgent={(id) => setSelectedAgentId(id)}
            onSaveMarkdown={(agentId, fileType, content, specName) =>
              agentFileBridge.saveAgentMarkdownFile(agentId, fileType, content, specName)
            }
            onUnblockTaskHulk={handleUnblockTaskHulk}
            onSimulateReject2x={handleSimulateReject2x}
            onExecuteTaskSop={handleExecuteTaskSop}
          />
        )}
      </div>

      {/* Call B1 CEO Quick Dispatch Modal (Double-N) */}
      {callB1ModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1824] border border-cyan-400/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    📲 Call B1 CEO — Elena Rostova (Dispatch Anti-Orphan-Work)
                  </h3>
                  <p className="text-xs text-slate-400">
                    B1 sort son téléphone (`PHONE_DISPATCH`), écrit dans `TASKS.json` et active le Worker B3 en gilet jaune.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCallB1ModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200 font-mono"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleDispatchFromB1} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Domaine Cible & Directeur B2
                </label>
                <select
                  value={missionDomain}
                  onChange={(e) =>
                    setMissionDomain(
                      e.target.value as Exclude<DomainId, 'SOVEREIGN' | 'EXECUTIVE'>
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                >
                  {Object.values(DOMAIN_ROUTING_MAP).map((cfg) => (
                    <option key={cfg.domain} value={cfg.domain}>
                      {cfg.domain} — Directeur: {cfg.b2AgentId} → Worker: {cfg.b3WorkerId} (
                      {cfg.roomId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Directive d’A0 Amadeus (Ordre de Mission)
                </label>
                <input
                  type="text"
                  value={missionTitle}
                  onChange={(e) => setMissionTitle(e.target.value)}
                  placeholder="Ex: Déployer la navette VIP Marriott CVG à $58 garanti..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCallB1ModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Dispatcher via Elena B1
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
