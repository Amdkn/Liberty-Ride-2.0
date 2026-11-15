import { SceneLocationId } from '../../world-model/types';
import { CAMPUS_BUILDING_DOORWAYS } from './SeatedAnchorsRegistry';

export const GRID_CELL_SIZE = 20;
export const GRID_COLS = 64; // 64 * 20 = 1280
export const GRID_ROWS = 36; // 36 * 20 = 720

export type SpatialZoneCategory =
  | 'BUILDING_FOOTPRINT'
  | 'RESTRICTED_OPERATIONAL'
  | 'FURNITURE_COLLISION'
  | 'PERIMETER_BOUNDARY';

export interface Point2D {
  x: number;
  y: number;
}

export interface SpatialRedZone {
  id: string;
  label: string;
  category: SpatialZoneCategory;
  polygon: Point2D[];
  bounds: { x: number; y: number; w: number; h: number };
}

export interface WalkableCorridorZone {
  id: string;
  label: string;
  polygon: Point2D[];
}

export interface ObstacleRect {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Helper to create a clean chamfered isometric-style octagon polygon from a bounding box
 * so building footprints & furniture align cleanly with the campus artwork without boxy corners.
 */
function makeChamferedRectPolygon(
  x: number,
  y: number,
  w: number,
  h: number,
  chamfer = 14
): Point2D[] {
  const c = Math.min(chamfer, Math.floor(w / 4), Math.floor(h / 4));
  return [
    { x: x + c, y },
    { x: x + w - c, y },
    { x: x + w, y: y + c },
    { x: x + w, y: y + h - c },
    { x: x + w - c, y: y + h },
    { x: x + c, y: y + h },
    { x, y: y + h - c },
    { x, y: y + c },
  ];
}

/**
 * Separate Registry 1: Structured Red Zones (Building Footprints, Restricted Operational Sectors, Furniture)
 */
export function getSpatialRedZones(scene: SceneLocationId): SpatialRedZone[] {
  if (scene === 'CAMPUS') {
    const buildingZones: SpatialRedZone[] = CAMPUS_BUILDING_DOORWAYS.map((b) => {
      // Leave the bottom doorway threshold walkable while enclosing the building architecture cleanly
      const bx = b.buildingBounds.x + 6;
      const by = b.buildingBounds.y + 4;
      const bw = b.buildingBounds.w - 12;
      const bh = b.buildingBounds.h - 18;
      return {
        id: `ZONE-${b.roomId}`,
        label: b.label.split('—')[0].trim(),
        category: 'BUILDING_FOOTPRINT',
        polygon: makeChamferedRectPolygon(bx, by, bw, bh, 18),
        bounds: { x: bx, y: by, w: bw, h: bh },
      };
    });

    const restrictedZones: SpatialRedZone[] = [
      {
        id: 'ZONE-FOUNTAIN-CORE',
        label: 'Fontaine Centrale',
        category: 'RESTRICTED_OPERATIONAL',
        polygon: makeChamferedRectPolygon(588, 308, 104, 74, 24),
        bounds: { x: 588, y: 308, w: 104, h: 74 },
      },
      {
        id: 'ZONE-SUV-3BAY',
        label: 'Garage 3 Baies SUV',
        category: 'RESTRICTED_OPERATIONAL',
        polygon: makeChamferedRectPolygon(1136, 248, 122, 212, 16),
        bounds: { x: 1136, y: 248, w: 122, h: 212 },
      },
      {
        id: 'ZONE-CVG-AIRPORT',
        label: 'Terminal CVG Airport',
        category: 'RESTRICTED_OPERATIONAL',
        polygon: makeChamferedRectPolygon(1068, 22, 190, 96, 18),
        bounds: { x: 1068, y: 22, w: 190, h: 96 },
      },
    ];

    return [...buildingZones, ...restrictedZones];
  }

  if (scene === 'ROOM_00') {
    return [
      {
        id: 'WALL-NORTH-00',
        label: 'Mur Nord City Hall',
        category: 'PERIMETER_BOUNDARY',
        polygon: makeChamferedRectPolygon(0, 0, 1280, 125, 0),
        bounds: { x: 0, y: 0, w: 1280, h: 125 },
      },
      {
        id: 'WALL-WEST-00',
        label: 'Mur Ouest',
        category: 'PERIMETER_BOUNDARY',
        polygon: makeChamferedRectPolygon(0, 125, 80, 595, 0),
        bounds: { x: 0, y: 125, w: 80, h: 595 },
      },
      {
        id: 'WALL-EAST-00',
        label: 'Mur Est',
        category: 'PERIMETER_BOUNDARY',
        polygon: makeChamferedRectPolygon(1200, 125, 80, 595, 0),
        bounds: { x: 1200, y: 125, w: 80, h: 595 },
      },
      {
        id: 'FURN-BOARD-TABLE',
        label: 'Table-Maquette Village',
        category: 'FURNITURE_COLLISION',
        polygon: makeChamferedRectPolygon(420, 275, 440, 165, 28),
        bounds: { x: 420, y: 275, w: 440, h: 165 },
      },
    ];
  }

  // ROOM_01 to ROOM_08 (Domain Interior Rooms)
  return [
    {
      id: `WALL-NORTH-${scene}`,
      label: 'Mur Nord Pavillon',
      category: 'PERIMETER_BOUNDARY',
      polygon: makeChamferedRectPolygon(0, 0, 1280, 130, 0),
      bounds: { x: 0, y: 0, w: 1280, h: 130 },
    },
    {
      id: `WALL-WEST-${scene}`,
      label: 'Mur Ouest',
      category: 'PERIMETER_BOUNDARY',
      polygon: makeChamferedRectPolygon(0, 130, 85, 590, 0),
      bounds: { x: 0, y: 130, w: 85, h: 590 },
    },
    {
      id: `WALL-EAST-${scene}`,
      label: 'Mur Est',
      category: 'PERIMETER_BOUNDARY',
      polygon: makeChamferedRectPolygon(1195, 130, 85, 590, 0),
      bounds: { x: 1195, y: 130, w: 85, h: 590 },
    },
    {
      id: `FURN-B2-DESK-${scene}`,
      label: 'Bureau Directeur B2',
      category: 'FURNITURE_COLLISION',
      polygon: makeChamferedRectPolygon(245, 185, 195, 70, 14),
      bounds: { x: 245, y: 185, w: 195, h: 70 },
    },
    {
      id: `FURN-CENTER-${scene}`,
      label: 'Module Central Domaine',
      category: 'FURNITURE_COLLISION',
      polygon: makeChamferedRectPolygon(555, 280, 170, 125, 22),
      bounds: { x: 555, y: 280, w: 170, h: 125 },
    },
    {
      id: `FURN-B3-BENCH-${scene}`,
      label: 'Atelier SOP B3',
      category: 'FURNITURE_COLLISION',
      polygon: makeChamferedRectPolygon(840, 235, 185, 90, 14),
      bounds: { x: 840, y: 235, w: 185, h: 90 },
    },
    {
      id: `FURN-LOUNGE-${scene}`,
      label: 'Canapé Lounge',
      category: 'FURNITURE_COLLISION',
      polygon: makeChamferedRectPolygon(140, 500, 185, 80, 16),
      bounds: { x: 140, y: 500, w: 185, h: 80 },
    },
  ];
}

/**
 * Separate Registry 2: Walkable Pedestrian Corridors (Green Zones)
 */
export function getWalkableCorridors(scene: SceneLocationId): WalkableCorridorZone[] {
  if (scene === 'CAMPUS') {
    return [
      {
        id: 'WALK-PLAZA-RING',
        label: 'Anneau Central Solarpunk',
        polygon: makeChamferedRectPolygon(440, 220, 400, 260, 64),
      },
      {
        id: 'WALK-SOUTH-AVENUE',
        label: 'Promenade Dixie Highway',
        polygon: makeChamferedRectPolygon(150, 628, 960, 56, 12),
      },
    ];
  }
  return [
    {
      id: `WALK-FLOOR-${scene}`,
      label: 'Parquet Marchable',
      polygon: makeChamferedRectPolygon(92, 138, 1096, 552, 12),
    },
  ];
}

export function getObstaclesForScene(scene: SceneLocationId): ObstacleRect[] {
  return getSpatialRedZones(scene).map((z) => ({
    label: z.label,
    x: z.bounds.x,
    y: z.bounds.y,
    w: z.bounds.w,
    h: z.bounds.h,
  }));
}

export function pointInPolygon(px: number, py: number, poly: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function buildCollisionMatrix(scene: SceneLocationId): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => true)
  );
  const redZones = getSpatialRedZones(scene);

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cx = c * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
      const cy = r * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

      if (cx < 24 || cx > 1256 || cy < 24 || cy > 696) {
        matrix[r][c] = false;
        continue;
      }

      for (const zone of redZones) {
        if (pointInPolygon(cx, cy, zone.polygon)) {
          matrix[r][c] = false;
          break;
        }
      }
    }
  }
  return matrix;
}

export function isPointWalkable(scene: SceneLocationId, x: number, y: number): boolean {
  if (x < 24 || x > 1256 || y < 24 || y > 696) return false;
  const redZones = getSpatialRedZones(scene);
  for (const zone of redZones) {
    if (pointInPolygon(x, y, zone.polygon)) {
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

function drawPolygonPath(ctx: CanvasRenderingContext2D, poly: Point2D[]): void {
  if (poly.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) {
    ctx.lineTo(poly[i].x, poly[i].y);
  }
  ctx.closePath();
}

/**
 * Renders clean polygonal Walkmap Spatial Zones (Key M):
 * - Green Corridors: Walkable pedestrian avenues & plazas
 * - Red Polygonal Zones: Building footprints, restricted sectors & furniture with thin crisp perimeters
 */
export function renderWalkmapDebugOverlay(
  ctx: CanvasRenderingContext2D,
  scene: SceneLocationId,
  hoveredZoneId?: string | null
): void {
  const walkableZones = getWalkableCorridors(scene);
  const redZones = getSpatialRedZones(scene);

  ctx.save();

  // 1. Walkable Pedestrian Corridors (Subtle Emerald Green)
  for (const wz of walkableZones) {
    drawPolygonPath(ctx, wz.polygon);
    ctx.fillStyle = 'rgba(0, 230, 118, 0.11)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.45)';
    ctx.lineWidth = 1.25;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // On Campus, also draw clean emerald pedestrian lines radiating from the Plaza to each Doorway
  if (scene === 'CAMPUS') {
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.38)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    for (const b of CAMPUS_BUILDING_DOORWAYS) {
      ctx.beginPath();
      ctx.moveTo(640, 345);
      ctx.lineTo(b.campusDoorX, b.campusDoorY);
      ctx.stroke();
    }
  }

  // 2. Non-Walkable Spatial Red Zones (Clean Polygonal Perimeters, Subtle Translucent Fill)
  ctx.font = '600 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';

  for (const zone of redZones) {
    const isHovered = hoveredZoneId === zone.id;
    drawPolygonPath(ctx, zone.polygon);
    ctx.fillStyle = isHovered ? 'rgba(239, 68, 68, 0.24)' : 'rgba(239, 68, 68, 0.11)';
    ctx.fill();

    ctx.strokeStyle = isHovered ? '#fca5a5' : 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = isHovered ? 2.2 : 1.4;
    ctx.stroke();

    // Small discreet contextual label along top edge (never obscuring interior characters/architecture)
    if (zone.category !== 'PERIMETER_BOUNDARY') {
      const labelX = zone.bounds.x + zone.bounds.w / 2;
      const labelY = Math.max(14, zone.bounds.y - 4);
      const text = zone.label;
      const tw = ctx.measureText(text).width + 10;

      ctx.fillStyle = 'rgba(9, 15, 24, 0.82)';
      ctx.beginPath();
      ctx.roundRect(labelX - tw / 2, labelY - 10, tw, 13, 4);
      ctx.fill();

      ctx.fillStyle = isHovered ? '#fecaca' : '#fca5a5';
      ctx.fillText(text, labelX, labelY);
    }
  }

  ctx.restore();
}
