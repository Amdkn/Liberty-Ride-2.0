import {
  AgentNode,
  Direction4,
  SceneLocationId,
} from '../../world-model/types';
import {
  CAMPUS_BUILDING_DOORWAYS,
  DOMAIN_ROOM_ANCHORS,
  findCityHallSeatForAgent,
} from './SeatedAnchorsRegistry';
import { computeAStarPath, isPointWalkable } from './WalkmapCollision';

export interface FollowHistoryPoint {
  x: number;
  y: number;
  direction: Direction4;
  location: SceneLocationId;
}

export interface ActiveBeamEffect {
  fromAgentId: string;
  toAgentId: string;
  color: string;
  label: string;
  expiresAt: number;
}

export class AgentBehaviorFSMController {
  private a0Waypoints: Array<{ x: number; y: number }> = [];
  private a0History: FollowHistoryPoint[] = [];
  private readonly FOLLOW_LAG_FRAMES = 18;
  private activeBeam: ActiveBeamEffect | null = null;
  private lastDoorTransitionAt = 0;

  public setA0PathTo(scene: SceneLocationId, startX: number, startY: number, destX: number, destY: number): void {
    this.a0Waypoints = computeAStarPath(scene, startX, startY, destX, destY);
  }

  public clearA0Waypoints(): void {
    this.a0Waypoints = [];
  }

  public triggerDispatchBeam(fromAgentId: string, toAgentId: string, color: string, label: string): void {
    this.activeBeam = {
      fromAgentId,
      toAgentId,
      color,
      label,
      expiresAt: Date.now() + 4500,
    };
  }

  public getActiveBeam(): ActiveBeamEffect | null {
    if (this.activeBeam && Date.now() > this.activeBeam.expiresAt) {
      this.activeBeam = null;
    }
    return this.activeBeam;
  }

  /**
   * Advances all agents by 1 tick (60 FPS) and returns updated agents + optional scene transition
   */
  public stepFrame(
    agents: AgentNode[],
    activeScene: SceneLocationId,
    keysPressed: Set<string>,
    nowMs: number
  ): { nextAgents: AgentNode[]; nextScene: SceneLocationId;movingMap: Record<string, boolean> } {
    let nextScene = activeScene;
    const movingMap: Record<string, boolean> = {};

    const a0Index = agents.findIndex((a) => a.id === 'a0-amadeus');
    if (a0Index < 0) {
      return { nextAgents: agents, nextScene, movingMap };
    }

    const nextAgents = agents.map((a) => ({ ...a }));
    const a0 = nextAgents[a0Index];

    // 1. Update A0 Amadeus movement (Keyboard ZQSD / WASD / Arrows or A* Waypoints)
    let dx = 0;
    let dy = 0;
    if (keysPressed.has('KeyW') || keysPressed.has('KeyZ') || keysPressed.has('ArrowUp')) dy -= 1;
    if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) dy += 1;
    if (keysPressed.has('KeyA') || keysPressed.has('KeyQ') || keysPressed.has('ArrowLeft')) dx -= 1;
    if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) dx += 1;

    const isShift = keysPressed.has('ShiftLeft') || keysPressed.has('ShiftRight');
    const baseSpeed = 3.2 * a0.speedMultiplier * (isShift ? 1.45 : 1.0);

    if (dx !== 0 || dy !== 0) {
      this.a0Waypoints = [];
      const len = Math.hypot(dx, dy);
      const vx = (dx / len) * baseSpeed;
      const vy = (dy / len) * baseSpeed;

      const candX = a0.x + vx;
      const candY = a0.y + vy;
      if (isPointWalkable(activeScene, candX, candY)) {
        a0.x = candX;
        a0.y = candY;
      } else if (isPointWalkable(activeScene, candX, a0.y)) {
        a0.x = candX;
      } else if (isPointWalkable(activeScene, a0.x, candY)) {
        a0.y = candY;
      }

      a0.targetX = a0.x;
      a0.targetY = a0.y;
      a0.direction = this.resolveDirection(vx, vy, a0.direction);
      movingMap[a0.id] = true;
    } else if (this.a0Waypoints.length > 0) {
      const wp = this.a0Waypoints[0];
      const dist = Math.hypot(wp.x - a0.x, wp.y - a0.y);
      if (dist <= baseSpeed + 1.5) {
        a0.x = wp.x;
        a0.y = wp.y;
        this.a0Waypoints.shift();
      } else {
        const vx = ((wp.x - a0.x) / dist) * baseSpeed;
        const vy = ((wp.y - a0.y) / dist) * baseSpeed;
        a0.x += vx;
        a0.y += vy;
        a0.direction = this.resolveDirection(vx, vy, a0.direction);
      }
      movingMap[a0.id] = true;
    } else {
      movingMap[a0.id] = false;
    }

    // Record A0 trajectory for B1 Elena Rostova's 18-frame follow delay
    if (
      movingMap[a0.id] ||
      this.a0History.length === 0 ||
      this.a0History[this.a0History.length - 1].location !== activeScene
    ) {
      this.a0History.push({
        x: a0.x,
        y: a0.y,
        direction: a0.direction,
        location: activeScene,
      });
      if (this.a0History.length > this.FOLLOW_LAG_FRAMES * 3) {
        this.a0History.shift();
      }
    }

    // 2. Check automatic doorway transitions for A0 & B1
    if (nowMs - this.lastDoorTransitionAt > 900) {
      if (activeScene === 'CAMPUS') {
        for (const door of CAMPUS_BUILDING_DOORWAYS) {
          const d = Math.hypot(a0.x - door.campusDoorX, a0.y - door.campusDoorY);
          if (d < 24) {
            nextScene = door.roomId;
            this.lastDoorTransitionAt = nowMs;
            this.a0Waypoints = [];
            a0.currentLocation = nextScene;
            a0.x = 640;
            a0.y = 605;
            a0.direction = 'UP';
            this.a0History = [];

            // Bring B1 and the room's B2 Director inside
            for (const ag of nextAgents) {
              if (ag.id === 'b1-ceo-chief-of-staff') {
                ag.currentLocation = nextScene;
                ag.x = 590;
                ag.y = 620;
                ag.direction = 'UP';
              } else if (ag.tier === 'B2' && ag.homeRoom === nextScene) {
                ag.currentLocation = nextScene;
                const anchors = DOMAIN_ROOM_ANCHORS[nextScene as Exclude<SceneLocationId, 'CAMPUS' | 'ROOM_00'>];
                if (anchors) {
                  ag.x = anchors.b2DeskSeat.x;
                  ag.y = anchors.b2DeskSeat.y;
                  ag.targetX = anchors.b2DeskSeat.x;
                  ag.targetY = anchors.b2DeskSeat.y;
                  ag.posture = 'SEATED';
                  ag.direction = anchors.b2DeskSeat.facing;
                }
              }
            }
            break;
          }
        }
      } else {
        // Inside ROOM_00..ROOM_08 -> check southern double door exit (x: 565..715, y >= 648)
        if (a0.y >= 646 && a0.x >= 565 && a0.x <= 715) {
          const exitedDoor = CAMPUS_BUILDING_DOORWAYS.find((b) => b.roomId === activeScene);
          nextScene = 'CAMPUS';
          this.lastDoorTransitionAt = nowMs;
          this.a0Waypoints = [];
          a0.currentLocation = 'CAMPUS';
          a0.x = exitedDoor ? exitedDoor.campusDoorX : 640;
          a0.y = exitedDoor ? exitedDoor.campusDoorY + 30 : 360;
          a0.direction = 'DOWN';
          this.a0History = [];

          for (const ag of nextAgents) {
            if (ag.id === 'b1-ceo-chief-of-staff') {
              ag.currentLocation = 'CAMPUS';
              ag.x = a0.x - 36;
              ag.y = a0.y - 14;
              ag.direction = 'DOWN';
            }
          }
        }
      }
    }

    // 3. Update B1 Elena Rostova (18-frame delayed follow without overlapping A0)
    const b1 = nextAgents.find((a) => a.id === 'b1-ceo-chief-of-staff');
    if (b1) {
      b1.currentLocation = a0.currentLocation;
      if (b1.posture !== 'PHONE_DISPATCH') {
        const sampleIndex = Math.max(0, this.a0History.length - this.FOLLOW_LAG_FRAMES);
        const delayedPoint = this.a0History[sampleIndex];
        const desiredX = delayedPoint ? delayedPoint.x - 34 : a0.x - 38;
        const desiredY = delayedPoint ? delayedPoint.y - 12 : a0.y - 16;

        const distToDesired = Math.hypot(desiredX - b1.x, desiredY - b1.y);
        const distToA0 = Math.hypot(a0.x - b1.x, a0.y - b1.y);

        if (distToDesired > 6 && distToA0 > 34) {
          const step = Math.min(3.1 * a0.speedMultiplier, distToDesired);
          const vx = ((desiredX - b1.x) / distToDesired) * step;
          const vy = ((desiredY - b1.y) / distToDesired) * step;
          b1.x += vx;
          b1.y += vy;
          b1.direction = this.resolveDirection(vx, vy, b1.direction);
          movingMap[b1.id] = true;
        } else {
          movingMap[b1.id] = false;
        }
      } else {
        movingMap[b1.id] = false;
      }
    }

    // 4. Update B2 Directors and B3 Workers moving toward their targetX / targetY anchors
    for (const ag of nextAgents) {
      if (ag.id === 'a0-amadeus' || ag.id === 'b1-ceo-chief-of-staff') continue;

      const dist = Math.hypot(ag.targetX - ag.x, ag.targetY - ag.y);
      if (dist > 3) {
        const speed = 2.6 * ag.speedMultiplier;
        const vx = ((ag.targetX - ag.x) / dist) * Math.min(speed, dist);
        const vy = ((ag.targetY - ag.y) / dist) * Math.min(speed, dist);
        ag.x += vx;
        ag.y += vy;
        ag.direction = this.resolveDirection(vx, vy, ag.direction);
        movingMap[ag.id] = true;
      } else {
        ag.x = ag.targetX;
        ag.y = ag.targetY;
        movingMap[ag.id] = false;
      }

      // Clear expired speech bubbles
      if (ag.speechBubbleUntil && nowMs > ag.speechBubbleUntil) {
        ag.speechBubble = undefined;
        ag.speechBubbleUntil = undefined;
      }
    }

    if (a0.speechBubbleUntil && nowMs > a0.speechBubbleUntil) {
      a0.speechBubble = undefined;
      a0.speechBubbleUntil = undefined;
    }
    if (b1 && b1.speechBubbleUntil && nowMs > b1.speechBubbleUntil) {
      b1.speechBubble = undefined;
      b1.speechBubbleUntil = undefined;
    }

    return { nextAgents, nextScene, movingMap };
  }

  /**
   * Call Town Hall (Key C): Teleports/Converges A0, B1, and the 8 B2 Directors into Room 00
   * around the central miniature village table in SEATED posture.
   */
  public assembleTownHallCouncil(agents: AgentNode[], nowMs: number): AgentNode[] {
    this.a0Waypoints = [];
    this.a0History = [];
    return agents.map((ag) => {
      if (ag.tier === 'B3') return ag;
      const seat = findCityHallSeatForAgent(ag.id);
      const startOffset = ag.tier === 'B2' ? 95 : 20;
      return {
        ...ag,
        currentLocation: 'ROOM_00',
        x: seat.x,
        y: seat.y + startOffset,
        targetX: seat.x,
        targetY: seat.y,
        direction: seat.facing,
        posture: ag.tier === 'B2' ? 'SEATED' : ag.posture,
        speechBubble:
          ag.id === 'a0-amadeus'
            ? '🏛 Conseil 12WY ouvert !'
            : ag.id === 'b1-ceo-chief-of-staff'
            ? '📊 Audit Workgraph des 8 Domaines'
            : `Assis Fauteuil #${seat.seatIndex}`,
        speechBubbleUntil: nowMs + 5500,
      };
    });
  }

  private resolveDirection(vx: number, vy: number, fallback: Direction4): Direction4 {
    if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) return fallback;
    if (Math.abs(vx) > Math.abs(vy)) {
      return vx > 0 ? 'RIGHT' : 'LEFT';
    }
    return vy > 0 ? 'DOWN' : 'UP';
  }
}
