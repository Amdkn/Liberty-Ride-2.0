import { SceneLocationId } from '../../world-model/types';
import {
  CAMPUS_BUILDING_DOORWAYS,
  CITY_HALL_15_SEATS,
  DOMAIN_ROOM_ANCHORS,
} from './SeatedAnchorsRegistry';

const customSceneBackgrounds = new Map<SceneLocationId, HTMLImageElement>();

export function registerCustomSceneBackground(scene: SceneLocationId, img: HTMLImageElement): void {
  customSceneBackgrounds.set(scene, img);
}

/**
 * Renders the 1280x720 High-Definition Solarpunk Overworld or Interior Rooms (00 to 08)
 */
export function renderSceneBackground(
  ctx: CanvasRenderingContext2D,
  scene: SceneLocationId,
  frameCount: number
): void {
  const customBg = customSceneBackgrounds.get(scene);
  if (customBg) {
    ctx.drawImage(customBg, 0, 0, 1280, 720);
    return;
  }

  if (scene === 'CAMPUS') {
    renderSolarpunkCampusOverworld(ctx, frameCount);
  } else if (scene === 'ROOM_00') {
    renderCityHallRoom00(ctx, frameCount);
  } else {
    renderDomainInteriorRoom(ctx, scene, frameCount);
  }
}

function renderSolarpunkCampusOverworld(ctx: CanvasRenderingContext2D, frameCount: number): void {
  // 1. Lush Solarpunk Botanical Ground Gradient
  const bgGrad = ctx.createRadialGradient(640, 350, 80, 640, 350, 760);
  bgGrad.addColorStop(0, '#0e2920');
  bgGrad.addColorStop(0.55, '#091d17');
  bgGrad.addColorStop(1, '#05100d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1280, 720);

  // Subtle botanical turf stone tiles
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1280; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 720);
    ctx.stroke();
  }
  for (let y = 0; y < 720; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }

  // 2. Outer Solarpunk Golden-Stone Ring Path & Radial Spokes
  ctx.save();
  ctx.strokeStyle = '#1e3a2f';
  ctx.lineWidth = 44;
  ctx.beginPath();
  ctx.ellipse(640, 355, 390, 215, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 230, 118, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(640, 355, 412, 237, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Radial walkways from Central Plaza to each Pavilion
  for (const b of CAMPUS_BUILDING_DOORWAYS) {
    ctx.strokeStyle = 'rgba(30, 58, 47, 0.85)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(640, 345);
    ctx.lineTo(b.campusDoorX, b.campusDoorY);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Central Plaza with Luminous Emerald Emblem
  const pulse = 0.75 + 0.25 * Math.sin(frameCount * 0.04);
  ctx.save();
  ctx.fillStyle = '#0d261e';
  ctx.strokeStyle = '#00E676';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(640, 345, 72, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const emblemGlow = ctx.createRadialGradient(640, 345, 5, 640, 345, 52);
  emblemGlow.addColorStop(0, `rgba(0, 230, 118, ${0.45 * pulse})`);
  emblemGlow.addColorStop(1, 'rgba(0, 230, 118, 0)');
  ctx.fillStyle = emblemGlow;
  ctx.beginPath();
  ctx.arc(640, 345, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('A’SPACE OS · LD01', 640, 343);
  ctx.font = '500 9px "Inter", sans-serif';
  ctx.fillStyle = '#34d399';
  ctx.fillText('SOLARPUNK NEXUS', 640, 356);
  ctx.restore();

  // 4. CVG International Airport (North-East Zone)
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1065, 22, 195, 92, 10);
  ctx.fill();
  ctx.stroke();

  // Runway strip
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(1080, 82, 165, 18);
  ctx.strokeStyle = '#f8fafc';
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(1088, 91);
  ctx.lineTo(1238, 91);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillText('✈️ CVG AIRPORT HUB', 1082, 44);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 10px "Inter", sans-serif';
  ctx.fillText('Terminal Bagages & Staging', 1082, 62);
  ctx.restore();

  // 5. 3-Bay Executive SUV Garage (East Zone)
  ctx.save();
  ctx.fillStyle = '#0f1d26';
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1140, 250, 122, 210, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#00E5FF';
  ctx.font = '700 10px "JetBrains Mono", monospace';
  ctx.fillText('GARAGE 3 BAIES', 1152, 270);

  const bayLabels = ['SUV-01 READY', 'SUV-02 CVG', 'SUV-03 READY'];
  for (let i = 0; i < 3; i++) {
    const by = 284 + i * 54;
    ctx.fillStyle = '#091016';
    ctx.fillRect(1150, by, 102, 42);
    // Black SUV top-down silhouette
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(1162, by + 6, 76, 22, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#a5f3fc';
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillText(bayLabels[i], 1160, by + 38);
  }
  ctx.restore();

  // 6. Dixie Highway (South Corridor with 4 Static Executive Black SUVs)
  ctx.save();
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 642, 1280, 62);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.moveTo(0, 673);
  ctx.lineTo(1280, 673);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillText('🛣 DIXIE HIGHWAY CORRIDOR (ERLANGER KY ↔ CVG AIRPORT ↔ CINCINNATI)', 28, 660);

  const staticSuvX = [180, 480, 790, 1060];
  staticSuvX.forEach((sx, idx) => {
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(sx, 678, 66, 22, 5);
    ctx.fill();
    ctx.stroke();
    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(sx + 62, 681, 4, 5);
    ctx.fillRect(sx + 62, 692, 4, 5);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 8px "JetBrains Mono", monospace';
    ctx.fillText(`LD-SUV-0${idx + 1}`, sx + 8, 692);
  });
  ctx.restore();

  // 7. Render the 9 Buildings (City Hall Room 00 + 8 Domain Pavilions Rooms 01-08)
  for (const b of CAMPUS_BUILDING_DOORWAYS) {
    const { x, y, w, h } = b.buildingBounds;
    ctx.save();

    // Building elevation shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 8, w, h, 10);
    ctx.fill();

    // Building walls
    ctx.fillStyle = '#0f221d';
    ctx.strokeStyle = b.roofColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    // Pitched Solarpunk Roof with solar glass shingles
    ctx.fillStyle = b.roofColor;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w - 8, 28, 7);
    ctx.fill();

    // Title Banner
    ctx.fillStyle = '#040b09';
    ctx.font = '800 10px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.label.toUpperCase(), x + w / 2, y + 22);

    // Glowing Double Doorway at bottom center
    const doorW = 30;
    const doorH = 24;
    const doorX = b.campusDoorX - doorW / 2;
    const doorY = y + h - doorH;
    ctx.fillStyle = '#022c22';
    ctx.strokeStyle = b.roofColor;
    ctx.lineWidth = 1.8;
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.strokeRect(doorX, doorY, doorW, doorH);

    // Door threshold mat
    ctx.fillStyle = 'rgba(0, 230, 118, 0.25)';
    ctx.fillRect(doorX - 4, y + h, doorW + 8, 8);

    ctx.restore();
  }
}

/**
 * Renders Room 00: City Hall Executive Boardroom with the Central Council Table
 * containing the Illuminated Miniature Village Model ("Village dans le Village") + 15 Leather Seats
 */
function renderCityHallRoom00(ctx: CanvasRenderingContext2D, frameCount: number): void {
  renderInteriorShell(ctx, 'ROOM 00 — CITY HALL EXECUTIVE BOARDROOM (CONSEIL 12WY)', '#10B981');

  // Draw the 15 Executive Leather Armchairs around the table
  for (const seat of CITY_HALL_15_SEATS) {
    ctx.save();
    ctx.fillStyle = '#2c1810';
    ctx.strokeStyle = seat.seatIndex === 1 ? '#FFD600' : '#10B981';
    ctx.lineWidth = seat.seatIndex === 1 ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(seat.x - 20, seat.y - 18, 40, 34, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`#${seat.seatIndex}`, seat.x, seat.y - 23);
    ctx.restore();
  }

  // Central Mahogany & Emerald Glass Council Table (x: 400..880, y: 255..455)
  ctx.save();
  ctx.fillStyle = '#1a120b';
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(400, 255, 480, 200, 28);
  ctx.fill();
  ctx.stroke();

  // Recessed Illuminated Miniature Solarpunk Village ("Village dans le Village")
  ctx.fillStyle = '#06281e';
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(438, 280, 404, 150, 16);
  ctx.fill();
  ctx.stroke();

  // Miniature ring path inside the table
  ctx.strokeStyle = 'rgba(0, 230, 118, 0.55)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(640, 355, 130, 52, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Miniature glowing buildings inside the hologram table
  const miniColors = ['#10B981', '#00E5FF', '#00E676', '#2979FF', '#FF6D00', '#FFD600', '#ECEFF1', '#D500F9', '#FF4081'];
  miniColors.forEach((col, i) => {
    const angle = (i / miniColors.length) * Math.PI * 2 - Math.PI / 2;
    const mx = 640 + Math.cos(angle) * 130;
    const my = 355 + Math.sin(angle) * 52;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(mx - 9, my - 7, 18, 14, 3);
    ctx.fill();
  });

  // Pulsing hologram core in the center of the miniature village
  const glowR = 16 + 4 * Math.sin(frameCount * 0.06);
  ctx.fillStyle = 'rgba(0, 230, 118, 0.45)';
  ctx.beginPath();
  ctx.arc(640, 355, glowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '700 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MAQUETTE HOLOGRAPHIQUE « VILLAGE DANS LE VILLAGE »', 640, 272);
  ctx.restore();
}

/**
 * Renders Rooms 01 to 08: Domain Interior Rooms with B2 Desk, Centerpiece, and B3 SOP Station
 */
function renderDomainInteriorRoom(
  ctx: CanvasRenderingContext2D,
  scene: SceneLocationId,
  frameCount: number
): void {
  const bInfo = CAMPUS_BUILDING_DOORWAYS.find((b) => b.roomId === scene);
  const accent = bInfo?.roofColor || '#00E5FF';
  const title = bInfo ? `PAVILLON ${bInfo.label.toUpperCase()}` : scene;

  renderInteriorShell(ctx, title, accent);

  const anchors = DOMAIN_ROOM_ANCHORS[scene as Exclude<SceneLocationId, 'CAMPUS' | 'ROOM_00'>];
  if (!anchors) return;

  ctx.save();
  // 1. B2 Director Executive Desk (Left-Center)
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(260, 280, 190, 75, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 10px "JetBrains Mono", monospace';
  ctx.fillText('BUREAU DIRECTEUR B2 (SDD/PRD/TDD)', 272, 315);
  ctx.fillStyle = accent;
  ctx.fillText('POSTE VALIDATION RECEIPTS.JSON', 272, 335);

  // 2. Domain-Specific Centerpiece (x: 560, y: 270, w: 160, h: 120)
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(560, 270, 160, 120, 14);
  ctx.fill();
  ctx.stroke();

  const pulse = 0.6 + 0.4 * Math.sin(frameCount * 0.05);
  ctx.fillStyle = accent;
  ctx.globalAlpha = pulse;
  ctx.beginPath();
  ctx.arc(640, 322, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HOLOGRAMME DOMAINE', 640, 372);

  // 3. B3 Yellow-Vest Technician SOP Workbench (Right side)
  ctx.fillStyle = '#1c1917';
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(820, 280, 180, 85, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.font = '700 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('🦺 ATELIER SOP WORKER B3', 834, 312);
  ctx.fillStyle = '#fde047';
  ctx.font = '500 9px "Inter", sans-serif';
  ctx.fillText('Génération Preuves RECEIPTS.json', 834, 334);

  // 4. Partner / Audit Lounge Sofa (Bottom-Left)
  ctx.fillStyle = '#1e1b4b';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(150, 500, 170, 75, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 10px "Inter", sans-serif';
  ctx.fillText('Salon Réception & Specs', 175, 542);

  ctx.restore();
}

function renderInteriorShell(
  ctx: CanvasRenderingContext2D,
  roomTitle: string,
  accentColor: string
): void {
  // Warm Chevron Parquet Floor
  ctx.fillStyle = '#1b1612';
  ctx.fillRect(0, 0, 1280, 720);

  ctx.strokeStyle = 'rgba(217, 119, 6, 0.11)';
  ctx.lineWidth = 1.5;
  for (let y = 125; y < 700; y += 36) {
    for (let x = 80; x < 1200; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 24, y + 14);
      ctx.lineTo(x + 48, y);
      ctx.stroke();
    }
  }

  // Top Back Wall (High 3/4 view)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1280, 125);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 125);
  ctx.lineTo(1280, 125);
  ctx.stroke();

  // Side Walls
  ctx.fillStyle = '#090f1a';
  ctx.fillRect(0, 0, 80, 720);
  ctx.fillRect(1200, 0, 80, 720);

  // Header Plaque on Back Wall
  ctx.fillStyle = '#020617';
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(350, 32, 580, 54, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 15px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(roomTitle, 640, 64);

  // Centered Double Exit Door at Bottom (x: 580..700, y: 668..718)
  ctx.fillStyle = '#042f2e';
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(580, 668, 120, 48, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillText('🚪 SORTIE VERS LE CAMPUS (APPROCHER)', 640, 696);
}
