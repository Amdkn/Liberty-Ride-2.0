import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Map,
  PhoneCall,
  Landmark,
  Zap,
  FolderUp,
  DoorOpen,
  ShieldAlert,
  Sparkles,
  Users,
  CheckSquare,
  BookOpen,
  Building2,
  CarFront,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
  HardDrive,
  X,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  AgentNode,
  DomainId,
  ExperienceId,
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
  activeExperience: ExperienceId;
  onSelectExperience: (exp: ExperienceId) => void;
  approvedGatesCount: number;
  onOpenHumanGates: () => void;
  onOpenMemory: () => void;
}

/**
 * Maps client mouse coordinates to the 1280x720 virtual canvas space,
 * accurately accounting for object-contain letterboxing and zoom/pan.
 */
function clientToCanvasCoords(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / 1280, rect.height / 720);
  const renderedW = 1280 * scale;
  const renderedH = 720 * scale;
  const offsetX = rect.left + (rect.width - renderedW) / 2;
  const offsetY = rect.top + (rect.height - renderedH) / 2;
  return {
    x: (clientX - offsetX) / scale,
    y: (clientY - offsetY) / scale,
  };
}

export const AdminVillageView: React.FC<AdminVillageViewProps> = ({
  agents,
  isDiskConnected,
  activeExperience,
  onSelectExperience,
  approvedGatesCount,
  onOpenHumanGates,
  onOpenMemory,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fsmRef = useRef<AgentBehaviorFSMController>(new AgentBehaviorFSMController());
  const keysPressedRef = useRef<Set<string>>(new Set());
  const lastKeyNTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const movingMapRef = useRef<Record<string, boolean>>({});

  const [activeScene, setActiveScene] = useState<SceneLocationId>('CAMPUS');
  const [hoveredRoomId, setHoveredRoomId] = useState<SceneLocationId | null>(null);
  const [showWalkmap, setShowWalkmap] = useState<boolean>(false);
  const [isHulkMode, setIsHulkMode] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [locationMenuOpen, setLocationMenuOpen] = useState<boolean>(false);

  // Contextual overlays (all closed by default so 95% of viewport is the Village)
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('a0-amadeus');
  const [agentQuickCardOpen, setAgentQuickCardOpen] = useState<boolean>(false);
  const [callB1ModalOpen, setCallB1ModalOpen] = useState<boolean>(false);
  const [escalationDrawerOpen, setEscalationDrawerOpen] = useState<boolean>(false);

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

  // Enter a Building Room or Return to Campus Overworld
  const handleEnterScene = useCallback(
    (target: SceneLocationId) => {
      const prevScene = activeScene;
      setActiveScene(target);
      setHoveredRoomId(null);
      setLocationMenuOpen(false);
      agentFileBridge.updateAgentsInMemory((list) =>
        fsmRef.current.transitionToScene(list, target, prevScene)
      );
      if (target === 'CAMPUS') {
        triggerToast('🌍 Campus Solarpunk Overworld (Échelle 1/22)');
      } else {
        const bInfo = CAMPUS_BUILDING_DOORWAYS.find((b) => b.roomId === target);
        triggerToast(`🏛 ${bInfo?.label || target} (Échelle 1/12)`);
      }
    },
    [activeScene, triggerToast]
  );

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
          ? '⚡ Mode Hulk (UNBLOCK_HULK) activé : vitesse x2'
          : 'A0 Amadeus revenu en posture NORMAL_HOODY'
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
              posture: 'SUBMITTING_RECEIPT',
              targetX: anchors.b3ReceiptDeliveryPoint.x,
              targetY: anchors.b3ReceiptDeliveryPoint.y,
              speechBubble: `🦺 Exécution SOP ${task.id}...`,
              speechBubbleUntil: Date.now() + 3000,
            };
          }
          return ag;
        })
      );

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
                posture: 'EXECUTING_SOP',
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
        triggerToast(`✅ ${b3Id} a remis le reçu ${receipt.id} à ${b2AgentId}.`);
      }, 1600);
    },
    [agents, triggerToast]
  );

  // Simulate 2 consecutive rejections by B2 Director -> triggers BLOCKED_2X
  const handleSimulateReject2x = useCallback(
    async (b2AgentId: string, task: TaskRecord) => {
      const r1 = registerB2Rejection(task);
      const r2 = registerB2Rejection(r1);
      const noteLine = `[ALERTE BLOCKED_2X] Tâche \`${task.id}\` rejetée 2 fois au contrôle TDD par \`${b2AgentId}\`. Escalade Mode Hulk A0 requise.`;
      await agentFileBridge.upsertTaskAndReceipt(b2AgentId, r2, undefined, noteLine);
      triggerToast(`🚨 Tâche ${task.id} en BLOCKED_2X — Ouvrez la notification en bas.`);
    },
    [triggerToast]
  );

  // Call Town Hall (Key C or CALL MEETING): Convene A0, B1, and 8 B2 Directors in Room 00 Seated
  const handleCallTownHall = useCallback(() => {
    setActiveScene('ROOM_00');
    setHoveredRoomId(null);
    setLocationMenuOpen(false);
    agentFileBridge.updateAgentsInMemory((list) =>
      fsmRef.current.assembleTownHallCouncil(list, Date.now())
    );
    triggerToast('🏛 Conseil 12WY convoqué au City Hall (Room 00)');
  }, [triggerToast]);

  // Dispatch Mission via B1 CEO Elena Rostova (Double-N or To-do)
  const handleDispatchFromB1 = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!missionTitle.trim()) return;

      const { task, routing } = buildAntiOrphanTask(missionTitle, missionDomain);
      setCallB1ModalOpen(false);
      setSelectedAgentId(routing.b2AgentId);

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
              posture: activeScene === 'CAMPUS' ? 'STANDING' : 'SEATED',
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

      triggerToast(`📲 Elena B1 (PHONE_DISPATCH) → ${routing.b2AgentId} (${task.id})`);

      setTimeout(() => {
        agentFileBridge.updateAgentsInMemory((list) =>
          list.map((ag) =>
            ag.id === 'b1-ceo-chief-of-staff' ? { ...ag, posture: 'WALK_FOLLOW' } : ag
          )
        );
        void handleExecuteTaskSop(routing.b2AgentId, task);
      }, 2200);
    },
    [missionTitle, missionDomain, activeScene, handleExecuteTaskSop, triggerToast]
  );

  // Keyboard Listeners (ZQSD/WASD/Arrows, M, Double-N, C, H, T, ESC)
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
      } else if (e.code === 'Escape') {
        setInspectorOpen(false);
        setAgentQuickCardOpen(false);
        setLocationMenuOpen(false);
        setEscalationDrawerOpen(false);
        setCallB1ModalOpen(false);
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

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 1280, 720);

          // 1. Living WebP Map or HD Interior Room 00..08
          renderSceneBackground(ctx, nextScene, frameCountRef.current, hoveredRoomId);

          // 2. Walkmap Debug Overlay (Key M)
          if (showWalkmap) {
            renderWalkmapDebugOverlay(ctx, nextScene);
          }

          // 3. Visible agents in current scene
          const visibleAgents = nextAgents
            .filter((ag) => {
              if (nextScene === 'CAMPUS') return ag.tier !== 'B3';
              if (nextScene === 'ROOM_00') {
                return (
                  ag.currentLocation === 'ROOM_00' ||
                  ag.id === 'a0-amadeus' ||
                  ag.id === 'b1-ceo-chief-of-staff'
                );
              }
              return (
                ag.id === 'a0-amadeus' ||
                ag.id === 'b1-ceo-chief-of-staff' ||
                ag.homeRoom === nextScene ||
                ag.currentLocation === nextScene
              );
            })
            .sort((a, b) => a.y - b.y);

          // 4. Active Dispatch Beam from B1 to B2
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

          // 5. Agents (Overworld = 42px, Rooms = 68px)
          const targetCharHeight = nextScene === 'CAMPUS' ? 42 : 68;

          for (const ag of visibleAgents) {
            const isSelected = ag.id === selectedAgentId && (agentQuickCardOpen || inspectorOpen);
            const hasBlockedTask = ag.tasks.some((t) => t.status === 'BLOCKED_2X');

            let spriteKey = ag.standingSpriteKey;
            if (ag.id === 'a0-amadeus') {
              if (ag.posture === 'UNBLOCK_HULK') spriteKey = 'a0_hulk';
              else if (ag.posture === 'SEATED') spriteKey = 'a0_seated';
              else spriteKey = 'a0_hoody';
            } else if (ag.id === 'b1-ceo-chief-of-staff' && ag.posture === 'PHONE_DISPATCH') {
              spriteKey = ag.altSpriteKey;
            } else if (ag.tier === 'B2' && ag.posture === 'SEATED' && nextScene !== 'CAMPUS') {
              spriteKey = ag.altSpriteKey;
            }

            ctx.save();
            if (isSelected || hasBlockedTask) {
              ctx.strokeStyle = hasBlockedTask ? '#ef4444' : ag.roofColor;
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.ellipse(
                ag.x,
                ag.y - 2,
                nextScene === 'CAMPUS' ? 16 : 23,
                nextScene === 'CAMPUS' ? 6.5 : 9.5,
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

            // Contextual Nameplate
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

            if (ag.speechBubble) {
              const bubbleY = ag.y - targetCharHeight - 10;
              ctx.font = '600 10px "Inter", sans-serif';
              const bw = Math.min(280, ctx.measureText(ag.speechBubble).width + 16);
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
  }, [activeScene, showWalkmap, selectedAgentId, hoveredRoomId, agentQuickCardOpen, inspectorOpen]);

  // Hover on Canvas -> Building Doorways & Facade Preview Cards
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeScene !== 'CAMPUS') {
      if (hoveredRoomId) setHoveredRoomId(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x: mx, y: my } = clientToCanvasCoords(canvas, e.clientX, e.clientY);

    const hitBuilding = CAMPUS_BUILDING_DOORWAYS.find((b) => {
      const nearDoor = Math.hypot(mx - b.campusDoorX, my - b.campusDoorY) <= 34;
      const inBounds =
        mx >= b.buildingBounds.x &&
        mx <= b.buildingBounds.x + b.buildingBounds.w &&
        my >= b.buildingBounds.y &&
        my <= b.buildingBounds.y + b.buildingBounds.h;
      return nearDoor || inBounds;
    });

    setHoveredRoomId(hitBuilding ? hitBuilding.roomId : null);
  };

  // Click on Canvas -> Select Agent, Enter Building, Exit Room, or Pathfind A0
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x: clickX, y: clickY } = clientToCanvasCoords(canvas, e.clientX, e.clientY);

    // 1. Check Agent Hit
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
      return Math.hypot(ag.x - clickX, ag.y - 22 - clickY) <= hitRadius;
    });

    if (clickedAgent) {
      setSelectedAgentId(clickedAgent.id);
      setAgentQuickCardOpen(true);
      return;
    }

    // 2. Building Doorway Hit on Campus
    if (activeScene === 'CAMPUS') {
      const clickedBuilding = CAMPUS_BUILDING_DOORWAYS.find((b) => {
        const nearDoor = Math.hypot(clickX - b.campusDoorX, clickY - b.campusDoorY) <= 32;
        const inBounds =
          clickX >= b.buildingBounds.x &&
          clickX <= b.buildingBounds.x + b.buildingBounds.w &&
          clickY >= b.buildingBounds.y &&
          clickY <= b.buildingBounds.y + b.buildingBounds.h;
        return nearDoor || inBounds;
      });

      if (clickedBuilding) {
        handleEnterScene(clickedBuilding.roomId);
        return;
      }
    } else {
      // 3. Southern Exit Doorway inside Room
      if (clickY >= 648 && clickX >= 510 && clickX <= 770) {
        handleEnterScene('CAMPUS');
        return;
      }
    }

    // 4. Move A0 Amadeus via A* Pathfinding
    setAgentQuickCardOpen(false);
    const a0 = agents.find((a) => a.id === 'a0-amadeus');
    if (a0) {
      fsmRef.current.setA0PathTo(activeScene, a0.x, a0.y, clickX, clickY);
    }
  };

  // Hot-import Sprite Sheets or Map/Room assets
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
            triggerToast(`🗺 Carte Overworld "${file.name}" importée`);
          } else if (lower.includes('room-00') || lower.includes('city-hall')) {
            registerCustomSceneBackground('ROOM_00', img);
            triggerToast(`🏛 Salle City Hall "${file.name}" importée`);
          } else if (lower.includes('hulk')) {
            registerCustomSpritePng('a0_hulk', img, 3, 4);
            triggerToast(`⚡ Sprite Hulk "${file.name}" importé`);
          } else if (lower.includes('amadeus') || lower.includes('hoody') || lower.includes('a0')) {
            registerCustomSpritePng('a0_hoody', img, 3, 4);
            triggerToast(`🧥 Sprite A0 "${file.name}" importé`);
          } else if (lower.includes('phone')) {
            registerCustomSpritePng('b1_phone', img, 3, 4);
            triggerToast(`📲 Sprite Phone Dispatch "${file.name}" importé`);
          } else if (lower.includes('ceo') || lower.includes('b1')) {
            registerCustomSpritePng('b1_walk', img, 3, 4);
            triggerToast(`👩‍💼 Sprite B1 CEO "${file.name}" importé`);
          } else if (lower.includes('vest') || lower.includes('b3')) {
            registerCustomSpritePng('b3_worker_yellow_vest', img, 3, 4);
            triggerToast(`🦺 Sprite B3 "${file.name}" importé`);
          } else {
            registerCustomSpritePng('a0_hoody', img, 3, 4);
            triggerToast(`✨ Planche "${file.name}" découpée`);
          }
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  const blockedTasks = countBlockedTasks(agents);
  const totalTasks = agents.reduce((acc, ag) => acc + ag.tasks.length, 0);
  const pendingTasks = agents.reduce(
    (acc, ag) => acc + ag.tasks.filter((t) => t.status !== 'COMPLETED').length,
    0
  );
  const totalReceipts = agents.reduce((acc, ag) => acc + ag.receipts.length, 0);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const selectedCurrentTask =
    selectedAgent.tasks.find((t) => t.status !== 'COMPLETED') || selectedAgent.tasks[0];

  return (
    <div
      className="relative w-screen h-[100dvh] overflow-hidden bg-[#040a0f]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        processImportedFiles(e.dataTransfer.files);
      }}
    >
      {/* 1. FULLSCREEN INTERACTIVE VILLAGE MAP CANVAS (100vw x 100dvh, object-contain preserves full campus) */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <canvas
          id="admin-village-canvas"
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredRoomId(null)}
          className="w-full h-full object-contain block cursor-crosshair select-none"
        />
      </div>

      {/* 2. FLOATING TOP-CENTER NAVIGATION BAR (Inspired by Reference Screenshot #2) */}
      <nav
        aria-label="Navigation Village"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#071119]/80 backdrop-blur-xl border border-white/10 shadow-2xl max-w-[96vw] overflow-x-auto"
      >
        <button
          id="nav-village-map-btn"
          onClick={() => handleEnterScene('CAMPUS')}
          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition ${
            activeScene === 'CAMPUS' && activeExperience === 'ADMIN_VILLAGE'
              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Village</span>
        </button>

        <button
          id="nav-town-hall-btn"
          onClick={() => handleEnterScene('ROOM_00')}
          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition ${
            activeScene === 'ROOM_00'
              ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Town Hall</span>
        </button>

        <button
          id="nav-agents-btn"
          onClick={() => setInspectorOpen((p) => !p)}
          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition ${
            inspectorOpen
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Agents</span>
        </button>

        <button
          id="call-b1-ceo-btn"
          onClick={() => setCallB1ModalOpen(true)}
          className="px-3 py-1 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 whitespace-nowrap transition"
          title="Assigner une tâche via B1 CEO (Double-N)"
        >
          <CheckSquare className="w-3.5 h-3.5 text-cyan-300" />
          <span>Tasks</span>
        </button>

        <button
          id="open-memory-md-btn"
          onClick={onOpenMemory}
          className="px-3 py-1 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 whitespace-nowrap transition"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
          <span>Memory</span>
        </button>

        <div className="w-px h-4 bg-white/15 mx-0.5 shrink-0" />

        {/* Experience Switcher Pills (Driver House 3D + Customer World) */}
        <button
          id="nav-driver-house-btn"
          onClick={() => onSelectExperience('DRIVER_HOUSE_3D')}
          className="px-2.5 py-1 rounded-full text-xs font-medium text-slate-300 hover:text-cyan-200 hover:bg-white/10 flex items-center gap-1 whitespace-nowrap transition"
          title="Basculer vers Driver House 3D Twin"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Driver 3D</span>
        </button>

        <button
          id="nav-customer-world-btn"
          onClick={() => onSelectExperience('CUSTOMER_WORLD')}
          className="px-2.5 py-1 rounded-full text-xs font-medium text-slate-300 hover:text-amber-200 hover:bg-white/10 flex items-center gap-1 whitespace-nowrap transition"
          title="Basculer vers Customer World (CVG)"
        >
          <CarFront className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Customer</span>
        </button>

        {/* Highlighted Warm Golden Primary Action: CALL MEETING */}
        <button
          id="call-town-hall-btn"
          onClick={handleCallTownHall}
          className="ml-1 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 whitespace-nowrap shadow-md transition"
          title="Convoquer tous les Directeurs B2 au Town Hall (Touche C)"
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>CALL MEETING</span>
        </button>
      </nav>

      {/* 3. LEFT-SIDE ICON-ONLY FLOATING CONTEXTUAL TOOLBAR */}
      <div className="fixed left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 p-1.5 rounded-2xl bg-[#071119]/80 backdrop-blur-xl border border-white/10 shadow-xl">
        <button
          onClick={() => handleEnterScene('CAMPUS')}
          title="Campus Overworld (Vue Village)"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
            activeScene === 'CAMPUS'
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>

        <button
          onClick={() => setZoomLevel((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
          title="Zoom Avant (+)"
          className="w-9 h-9 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setZoomLevel((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))))}
          title="Zoom Arrière (-)"
          className="w-9 h-9 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {zoomLevel !== 1 && (
          <button
            onClick={() => setZoomLevel(1)}
            title="Réinitialiser Zoom (1:1)"
            className="w-9 h-9 rounded-xl text-amber-300 hover:bg-white/10 flex items-center justify-center transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <div className="h-px bg-white/10 my-0.5" />

        <button
          id="toggle-walkmap-btn"
          onClick={() => setShowWalkmap((p) => !p)}
          title="Afficher / Masquer Walkmap (M)"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
            showWalkmap
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Map className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            id="location-selector-btn"
            onClick={() => setLocationMenuOpen((p) => !p)}
            title="Sélecteur de Bâtiment / Salle"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
              locationMenuOpen
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
          </button>

          {locationMenuOpen && (
            <div className="absolute left-12 top-0 w-60 bg-[#071119]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2 shadow-2xl space-y-1 z-30">
              <button
                onClick={() => handleEnterScene('CAMPUS')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between ${
                  activeScene === 'CAMPUS'
                    ? 'bg-emerald-500/25 text-emerald-200'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <span>🌍 Overworld Campus</span>
                <span className="text-[10px] opacity-70">1/22</span>
              </button>
              {CAMPUS_BUILDING_DOORWAYS.map((b) => (
                <button
                  key={b.roomId}
                  onClick={() => handleEnterScene(b.roomId)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between ${
                    activeScene === b.roomId
                      ? 'bg-cyan-500/25 text-cyan-200'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{b.label}</span>
                  <span className="text-[10px] opacity-70">{b.roomId}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleCallTownHall}
          title="Accès Town Hall — Room 00 (C)"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
            activeScene === 'ROOM_00'
              ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Landmark className="w-4 h-4" />
        </button>

        <button
          id="toggle-hulk-mode-btn"
          onClick={toggleHulkMode}
          title="Mode Hulk UNBLOCK x2 (H)"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
            isHulkMode
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 animate-pulse'
              : 'text-emerald-300 hover:bg-white/10'
          }`}
        >
          <Zap className="w-4 h-4" />
        </button>

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
          title="Importer planches Drive (PNG/WebP)"
          className="w-9 h-9 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
        >
          <FolderUp className="w-4 h-4" />
        </button>
      </div>

      {/* 4. DISCREET FLOATING TOAST (Top-Right, Auto-Dismisses) */}
      {liveToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-[#071119]/90 backdrop-blur-xl border border-emerald-400/40 text-xs font-mono text-emerald-200 flex items-center gap-2 shadow-xl pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{liveToast}</span>
        </div>
      )}

      {/* 5. COMPACT FLOATING CONTEXTUAL AGENT CARD (Opens on Click, Bottom-Right above Dock) */}
      {agentQuickCardOpen && !inspectorOpen && (
        <div
          id="agent-quick-card"
          className="fixed bottom-14 right-4 z-30 w-80 bg-[#07111a]/92 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white/20"
                style={{ backgroundColor: selectedAgent.roofColor }}
              />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {selectedAgent.tier}
                  </span>
                  <h4 className="text-xs font-bold text-white truncate">{selectedAgent.name}</h4>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{selectedAgent.roleTitle}</p>
              </div>
            </div>
            <button
              onClick={() => setAgentQuickCardOpen(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono bg-white/5 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400">Posture: {selectedAgent.posture}</span>
            <span className="text-cyan-300">{selectedAgent.currentLocation}</span>
          </div>

          {selectedCurrentTask && (
            <div className="text-xs bg-white/5 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">{selectedCurrentTask.id}</span>
                <span
                  className={
                    selectedCurrentTask.status === 'BLOCKED_2X'
                      ? 'text-red-400 font-bold'
                      : 'text-emerald-300'
                  }
                >
                  {selectedCurrentTask.status}
                </span>
              </div>
              <p className="text-slate-200 text-[11px] line-clamp-2">{selectedCurrentTask.title}</p>
            </div>
          )}

          <button
            onClick={() => setInspectorOpen(true)}
            className="w-full py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <span>Tasks · Receipts · Notes · Specs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 6. FLOATING AGENT INSPECTOR OVERLAY DRAWER (On-Demand Only) */}
      {inspectorOpen && (
        <div className="fixed top-16 right-3 bottom-14 w-[420px] max-w-[calc(100vw-24px)] z-30">
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
        </div>
      )}

      {/* 7. DISCREET BOTTOM FLOATING STATUS DOCK */}
      <footer className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#071119]/80 backdrop-blur-xl border border-white/10 shadow-2xl text-[11px] font-mono text-slate-300 max-w-[96vw] overflow-x-auto whitespace-nowrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{agents.length} Agents</span>
        </span>

        <span className="text-white/20">·</span>

        <span>
          {pendingTasks}/{totalTasks} Tasks · {totalReceipts} Reçus
        </span>

        <span className="text-white/20">·</span>

        {/* Discreet BLOCKED_2X Notification Indicator */}
        <button
          id="escalation-indicator-btn"
          onClick={() => setEscalationDrawerOpen((p) => !p)}
          className={`px-2 py-0.5 rounded-full flex items-center gap-1 transition ${
            blockedTasks.length > 0
              ? 'bg-red-500/25 border border-red-400/60 text-red-200 animate-pulse'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Ouvrir le tiroir d'escalade BLOCKED_2X"
        >
          <ShieldAlert className="w-3 h-3" />
          <span>{blockedTasks.length} Blocked</span>
        </button>

        <span className="text-white/20">·</span>

        <button
          id="open-human-gates-btn"
          onClick={onOpenHumanGates}
          className="flex items-center gap-1 text-amber-300 hover:text-amber-200 transition"
          title="Gérer les 5 Human Gates Souverains A0"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Gates {approvedGatesCount}/5</span>
        </button>

        <span className="text-white/20">·</span>

        <span className="flex items-center gap-1 text-slate-400">
          <HardDrive
            className={`w-3 h-3 ${isDiskConnected ? 'text-emerald-400' : 'text-amber-400'}`}
          />
          <span>{isDiskConnected ? './agents/ Live' : 'Local Sync'}</span>
        </span>
      </footer>

      {/* 8. COMPACT ESCALATION DRAWER FOR BLOCKED_2X TASKS */}
      {escalationDrawerOpen && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-30 w-[520px] max-w-[calc(100vw-24px)] bg-[#09141d]/95 backdrop-blur-xl border border-red-500/50 rounded-2xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Escalades Gouvernance BLOCKED_2X ({blockedTasks.length})</span>
            </div>
            <button
              onClick={() => setEscalationDrawerOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {blockedTasks.length === 0 ? (
            <p className="text-xs text-slate-400 font-mono py-2">
              Aucune tâche bloquée actuellement. Toutes les SOP respectent les critères TDD.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {blockedTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-red-950/40 border border-red-500/35 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-red-200">{t.id}</span>
                    <span className="text-red-300">Rejets: {t.rejectionCount}/2</span>
                  </div>
                  <p className="text-xs text-slate-100">{t.title}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                    <span>
                      B2: {t.ownerB2} → B3: {t.workerB3}
                    </span>
                    {t.humanGateId && (
                      <span className="text-amber-300">Gate: {t.humanGateId}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      void handleUnblockTaskHulk(t.ownerB2, t);
                      setEscalationDrawerOpen(false);
                    }}
                    className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ Débloquer avec A0 Hulk (UNBLOCK)</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 9. CALL B1 CEO QUICK DISPATCH MODAL (Double-N or Tasks) */}
      {callB1ModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1824] border border-cyan-400/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    📲 Call B1 CEO — Elena Rostova (Dispatch Anti-Orphan-Work)
                  </h3>
                  <p className="text-xs text-slate-400">
                    B1 sort son téléphone (PHONE_DISPATCH), écrit dans TASKS.json et active le Worker B3.
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
                      {cfg.domain} — {cfg.b2AgentId} → {cfg.b3WorkerId} ({cfg.roomId})
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
