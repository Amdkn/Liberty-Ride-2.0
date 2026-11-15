import { SceneLocationId } from '../../world-model/types';
import { CAMPUS_BUILDING_DOORWAYS } from './SeatedAnchorsRegistry';

export const GRID_CELL_SIZE = 20;
export const GRID_COLS = 64; // 64 * 20 = 1280
export const GRID_ROWS = 36; // 36 * 20 = 720

export interface ObstacleRect {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getObstaclesForScene(scene: SceneLocationId): ObstacleRect[] {
  if (scene === 'CAMPUS') {
    const buildingRects: ObstacleRect[] = CAMPUS_BUILDING_DOORWAYS.map((b) => ({
      label: b.label,
      // Leave a 24px walkable doorway lip at the bottom center of each building
      x: b.buildingBounds.x,
      y: b.buildingBounds.y,
      w: b.buildingBounds.w,
      h: b.buildingBounds.h - 14,
    }));

    return [
      ...buildingRects,
      // Central Solarpunk Emblem Fountain core
      { label: 'Fontaine Solaire Centrale', x: 590, y: 310, w: 100, h: 70 },
      // 3-Bay SUV Garage East structure
      { label: 'Garage 3 Baies SUV', x: 1140, y: 250, w: 120, h: 210 },
      // CVG Airport Terminal North-East
      { label: 'Terminal CVG Airport', x: 1070, y: 24, w: 190, h: 90 },
    ];
  }

  if (scene === 'ROOM_00') {
    return [
      // Top back wall
      { label: 'Mur Nord City Hall', x: 0, y: 0, w: 1280, h: 125 },
      // Side walls
      { label: 'Mur Ouest', x: 0, y: 0, w: 80, h: 720 },
      { label: 'Mur Est', x: 1200, y: 0, w: 80, h: 720 },
      // Central Boardroom Table with the Illuminated Miniature Village ("Village dans le Village")
      { label: 'Table-Maquette Village dans le Village', x: 400, y: 255, w: 480, h: 200 },
    ];
  }

  // ROOM_01 to ROOM_08 (Domain Interior Rooms)
  return [
    { label: 'Mur Nord Pavillon', x: 0, y: 0, w: 1280, h: 130 },
    { label: 'Mur Ouest', x: 0, y: 0, w: 85, h: 720 },
    { label: 'Mur Est', x: 1195, y: 0, w: 85, h: 720 },
    // B2 Director Desk (Left-Center)
    { label: 'Bureau Directeur B2', x: 260, y: 280, w: 190, h: 75 },
    // Domain Centerpiece / Hologram / Table
    { label: 'Module Central Domaine', x: 560, y: 270, w: 160, h: 120 },
    // B3 SOP Workbench (Right side)
    { label: 'Atelier SOP Technicien B3', x: 820, y: 280, w: 180, h: 85 },
    // Lounge Sofa Bottom-Left
    { label: 'Canapé Lounge', x: 150, y: 500, w: 170, h: 75 },
  ];
}

export function buildCollisionMatrix(scene: SceneLocationId): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => true)
  );
  const obstacles = getObstaclesForScene(scene);

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cx = c * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
      const cy = r * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

      // Screen margins
      if (cx < 24 || cx > 1256 || cy < 24 || cy > 696) {
        matrix[r][c] = false;
        continue;
      }

      for (const obs of obstacles) {
        if (cx >= obs.x && cx <= obs.x + obs.w && cy >= obs.y && cy <= obs.y + obs.h) {
          matrix[r][c] = false;
          break;
        }
      }
    }
  }
  return matrix;
}

export function isPointWalkable(scene: SceneLocationId, x: number, y: number): boolean {
  const obstacles = getObstaclesForScene(scene);
  if (x < 24 || x > 1256 || y < 24 || y > 696) return false;
  for (const obs of obstacles) {
    if (x >= obs.x && x <= obs.x + obs.w && y >= obs.y && y <= obs.y + obs.h) {
      return false;
    }
  }
  return true;
}

interface AStarNode {
  c: number;
  r: number;
  g: number;
  h: number;
  f: number;
  parent?: AStarNode;
}

/**
 * A* Pathfinding on the 64x36 Walkmap Grid
 */
export function computeAStarPath(
  scene: SceneLocationId,
  startX: number,
  startY: number,
  goalX: number,
  goalY: number
): Array<{ x: number; y: number }> {
  const matrix = buildCollisionMatrix(scene);
  const startC = Math.max(1, Math.min(GRID_COLS - 2, Math.floor(startX / GRID_CELL_SIZE)));
  const startR = Math.max(1, Math.min(GRID_ROWS - 2, Math.floor(startY / GRID_CELL_SIZE)));
  let goalC = Math.max(1, Math.min(GRID_COLS - 2, Math.floor(goalX / GRID_CELL_SIZE)));
  let goalR = Math.max(1, Math.min(GRID_ROWS - 2, Math.floor(goalY / GRID_CELL_SIZE)));

  // If goal cell is blocked, spiral-search nearest walkable cell
  if (!matrix[goalR][goalC]) {
    let found = false;
    for (let radius = 1; radius <= 8 && !found; radius++) {
      for (let dr = -radius; dr <= radius && !found; dr++) {
        for (let dc = -radius; dc <= radius && !found; dc++) {
          const nr = goalR + dr;
          const nc = goalC + dc;
          if (nr >= 1 && nr < GRID_ROWS - 1 && nc >= 1 && nc < GRID_COLS - 1 && matrix[nr][nc]) {
            goalR = nr;
            goalC = nc;
            found = true;
          }
        }
      }
    }
  }

  const openList: AStarNode[] = [];
  const closed = new Set<string>();
  const key = (c: number, r: number) => `${c},${r}`;

  openList.push({
    c: startC,
    r: startR,
    g: 0,
    h: Math.hypot(goalC - startC, goalR - startR),
    f: Math.hypot(goalC - startC, goalR - startR),
  });

  const dirs = [
    { dc: 0, dr: -1, cost: 1 },
    { dc: 0, dr: 1, cost: 1 },
    { dc: -1, dr: 0, cost: 1 },
    { dc: 1, dr: 0, cost: 1 },
    { dc: -1, dr: -1, cost: 1.414 },
    { dc: 1, dr: -1, cost: 1.414 },
    { dc: -1, dr: 1, cost: 1.414 },
    { dc: 1, dr: 1, cost: 1.414 },
  ];

  let iterations = 0;
  while (openList.length > 0 && iterations < 900) {
    iterations++;
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;

    if (current.c === goalC && current.r === goalR) {
      const waypoints: Array<{ x: number; y: number }> = [];
      let curr: AStarNode | undefined = current;
      while (curr) {
        waypoints.unshift({
          x: curr.c * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
          y: curr.r * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
        });
        curr = curr.parent;
      }
      if (waypoints.length > 1) waypoints.shift();
      return waypoints;
    }

    closed.add(key(current.c, current.r));

    for (const d of dirs) {
      const nc = current.c + d.dc;
      const nr = current.r + d.dr;
      if (nc < 1 || nc >= GRID_COLS - 1 || nr < 1 || nr >= GRID_ROWS - 1) continue;
      if (!matrix[nr][nc] && !(nc === goalC && nr === goalR)) continue;
      const nKey = key(nc, nr);
      if (closed.has(nKey)) continue;

      const g = current.g + d.cost;
      const h = Math.hypot(goalC - nc, goalR - nr);
      const existing = openList.find((n) => n.c === nc && n.r === nr);
      if (!existing) {
        openList.push({ c: nc, r: nr, g, h, f: g + h, parent: current });
      } else if (g < existing.g) {
        existing.g = g;
        existing.f = g + existing.h;
        existing.parent = current;
      }
    }
  }

  return [{ x: goalC * GRID_CELL_SIZE + 10, y: goalR * GRID_CELL_SIZE + 10 }];
}

/**
 * Renders the Debug Walkmap Overlay (Key M):
 * Translucent Emerald Green = Walkable, Translucent Crimson Red = Blocked Obstacles
 */
export function renderWalkmapDebugOverlay(
  ctx: CanvasRenderingContext2D,
  scene: SceneLocationId
): void {
  const matrix = buildCollisionMatrix(scene);
  const obstacles = getObstaclesForScene(scene);

  ctx.save();
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const walkable = matrix[r][c];
      ctx.fillStyle = walkable ? 'rgba(0, 230, 118, 0.14)' : 'rgba(255, 59, 92, 0.34)';
      ctx.fillRect(
        c * GRID_CELL_SIZE + 1,
        r * GRID_CELL_SIZE + 1,
        GRID_CELL_SIZE - 2,
        GRID_CELL_SIZE - 2
      );
    }
  }

  // Draw obstacle bounding labels
  ctx.strokeStyle = 'rgba(255, 82, 82, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.font = '600 10px "JetBrains Mono", monospace';
  for (const obs of obstacles) {
    ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fillRect(obs.x + 4, obs.y + 4, Math.min(obs.w - 8, 175), 16);
    ctx.fillStyle = '#fca5a5';
    ctx.fillText(`⛔ ${obs.label}`, obs.x + 8, obs.y + 15);
  }
  ctx.restore();
}
