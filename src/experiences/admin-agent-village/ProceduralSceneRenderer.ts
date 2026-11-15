import { SceneLocationId } from '../../world-model/types';
import {
  CAMPUS_BUILDING_DOORWAYS,
  DOMAIN_ROOM_ANCHORS,
} from './SeatedAnchorsRegistry';

const customSceneBackgrounds = new Map<SceneLocationId, HTMLImageElement>();
const buildingFacadeCards = new Map<SceneLocationId, HTMLImageElement>();
let preloadInitiated = false;

const SCENE_ASSET_PATHS: Record<SceneLocationId, string> = {
  CAMPUS: '/assets/maps/campus-overworld-hd.webp',
  ROOM_00: '/assets/rooms/room-00-city-hall.webp',
  ROOM_01: '/assets/rooms/room-01-operations.webp',
  ROOM_02: '/assets/rooms/room-02-growth.webp',
  ROOM_03: '/assets/rooms/room-03-products.webp',
  ROOM_04: '/assets/rooms/room-04-sales.webp',
  ROOM_05: '/assets/rooms/room-05-finance.webp',
  ROOM_06: '/assets/rooms/room-06-legal.webp',
  ROOM_07: '/assets/rooms/room-07-it.webp',
  ROOM_08: '/assets/rooms/room-08-people.webp',
};

/**
 * Automatically preloads all WebP-compressed maps, 9 interior rooms (00-08),
 * and 8 architectural building facade cards from public/assets/
 */
export function ensureDriveScenesPreloaded(): void {
  if (preloadInitiated || typeof window === 'undefined') return;
  preloadInitiated = true;

  (Object.entries(SCENE_ASSET_PATHS) as Array<[SceneLocationId, string]>).forEach(
    ([sceneId, url]) => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 0) {
          customSceneBackgrounds.set(sceneId, img);
        }
      };
      img.src = url;
    }
  );

  CAMPUS_BUILDING_DOORWAYS.forEach((b) => {
    if (!b.facadeAssetUrl) return;
    const fImg = new Image();
    fImg.onload = () => {
      if (fImg.naturalWidth > 0) {
        buildingFacadeCards.set(b.roomId, fImg);
      }
    };
    fImg.src = b.facadeAssetUrl;
  });
}

export function registerCustomSceneBackground(scene: SceneLocationId, img: HTMLImageElement): void {
  customSceneBackgrounds.set(scene, img);
}

/**
 * Renders the 1280x720 High-Definition Solarpunk Overworld or Interior Rooms (00 to 08)
 * with subtle living ambient animations ("Bring the Map to Life" — Step 2 of Tristen O'Brien's video).
 */
export function renderSceneBackground(
  ctx: CanvasRenderingContext2D,
  scene: SceneLocationId,
  frameCount: number,
  hoveredRoomId?: SceneLocationId | null
): void {
  ensureDriveScenesPreloaded();

  const bgImg = customSceneBackgrounds.get(scene);
  if (!bgImg) {
    // Clean loading backdrop while WebP finishes decoding (< 30ms)
    ctx.fillStyle = '#071118';
    ctx.fillRect(0, 0, 1280, 720);
    return;
  }

  // 1. Draw the authentic HD artwork (1672x941 -> 1280x720 16:9)
  ctx.drawImage(bgImg, 0, 0, 1280, 720);

  if (scene === 'CAMPUS') {
    renderLivingCampusAnimations(ctx, frameCount, hoveredRoomId);
  } else {
    renderLivingInteriorRoomAnimations(ctx, scene, frameCount);
  }
}

/**
 * Living Ambient Animations on the Campus Overworld Map:
 * - Shimmering Solarpunk Central Star Fountain & floating solar motes
 * - Rotating CVG Airport Control Tower radar beam & runway strobe lights
 * - 3-Bay SUV Garage readiness pulse & Dixie Highway autonomous SUV telemetry glints
 * - Interactive Building Doorway thresholds + Hovered Building Facade Preview Card
 */
function renderLivingCampusAnimations(
  ctx: CanvasRenderingContext2D,
  frameCount: number,
  hoveredRoomId?: SceneLocationId | null
): void {
  const pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.05);

  ctx.save();

  // A. Central Solarpunk Star Fountain Shimmer (x: 612, y: 365)
  const fountainGrad = ctx.createRadialGradient(612, 365, 4, 612, 365, 58);
  fountainGrad.addColorStop(0, `rgba(0, 230, 118, ${0.28 * pulse})`);
  fountainGrad.addColorStop(0.6, `rgba(16, 185, 129, ${0.12 * pulse})`);
  fountainGrad.addColorStop(1, 'rgba(0, 230, 118, 0)');
  ctx.fillStyle = fountainGrad;
  ctx.beginPath();
  ctx.arc(612, 365, 58, 0, Math.PI * 2);
  ctx.fill();

  // Floating solar motes around the central plaza ring
  for (let i = 0; i < 8; i++) {
    const angle = (frameCount * 0.012 + (i * Math.PI) / 4) % (Math.PI * 2);
    const radius = 42 + 12 * Math.sin(frameCount * 0.03 + i);
    const mx = 612 + Math.cos(angle) * radius;
    const my = 365 + Math.sin(angle) * (radius * 0.62);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(167, 243, 208, 0.75)' : 'rgba(253, 224, 71, 0.75)';
    ctx.beginPath();
    ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // B. CVG Airport Control Tower Radar Sweep & Runway Approach Strobe (Top-Right: x: 1138, y: 82)
  const radarAngle = (frameCount * 0.04) % (Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1138, 72);
  ctx.lineTo(1138 + Math.cos(radarAngle) * 32, 72 + Math.sin(radarAngle) * 18);
  ctx.stroke();

  // Runway strobe sequence
  const strobeIdx = Math.floor(frameCount / 6) % 5;
  for (let s = 0; s < 5; s++) {
    const sx = 1140 + s * 24;
    const sy = 104 - s * 7;
    ctx.fillStyle = s === strobeIdx ? 'rgba(0, 229, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(sx, sy, s === strobeIdx ? 3 : 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // C. Dixie Highway Moving Black SUV Telemetry Glints (Bottom Highway: y = 655..685)
  const suvX1 = ((frameCount * 1.4) % 1100) + 90;
  const suvX2 = 1190 - ((frameCount * 1.1 + 400) % 1100);
  ctx.fillStyle = 'rgba(0, 229, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(suvX1, 666, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(251, 191, 36, 0.55)';
  ctx.beginPath();
  ctx.ellipse(suvX2, 684, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // D. Subtle Doorway Threshold Rings & Compact Roof Badges on the 9 Buildings
  for (const b of CAMPUS_BUILDING_DOORWAYS) {
    const isHovered = hoveredRoomId === b.roomId;

    // Glowing doorway mat on the ground
    ctx.strokeStyle = b.roofColor;
    ctx.lineWidth = isHovered ? 2.5 : 1.4;
    ctx.fillStyle = isHovered ? 'rgba(16, 185, 129, 0.28)' : 'rgba(6, 13, 19, 0.45)';
    ctx.beginPath();
    ctx.ellipse(
      b.campusDoorX,
      b.campusDoorY,
      isHovered ? 20 : 15,
      isHovered ? 9 : 6,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    if (isHovered) {
      // Highlight building roof frame and show "Cliquer pour entrer" pill
      const pillText = `🚪 Entrer : ${b.shortLabel}`;
      ctx.font = '700 10px "JetBrains Mono", monospace';
      const pw = ctx.measureText(pillText).width + 16;
      ctx.fillStyle = 'rgba(6, 13, 19, 0.92)';
      ctx.strokeStyle = b.roofColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(b.campusDoorX - pw / 2, b.campusDoorY - 28, pw, 19, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(pillText, b.campusDoorX, b.campusDoorY - 15);
    }
  }

  // E. If hovering a B2 Building on Campus, render its pre-sliced Architectural Facade Card in top-left HUD
  if (hoveredRoomId && hoveredRoomId !== 'CAMPUS') {
    const bInfo = CAMPUS_BUILDING_DOORWAYS.find((b) => b.roomId === hoveredRoomId);
    const facadeImg = buildingFacadeCards.get(hoveredRoomId);
    if (bInfo && facadeImg) {
      const cardX = 16;
      const cardY = 16;
      const cardW = 220;
      const cardH = 148;

      ctx.fillStyle = 'rgba(6, 13, 19, 0.94)';
      ctx.strokeStyle = bInfo.roofColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX + 4, cardY + 4, cardW - 8, cardH - 36, 7);
      ctx.clip();
      ctx.drawImage(facadeImg, cardX + 4, cardY + 4, cardW - 8, cardH - 36);
      ctx.restore();

      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(bInfo.shortLabel, cardX + 10, cardY + cardH - 18);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9px "Inter", sans-serif';
      ctx.fillText(`Directeur : ${bInfo.directorName} (Cliquer = Entrer)`, cardX + 10, cardY + cardH - 6);
    }
  }

  ctx.restore();
}

/**
 * Living Ambient Animations inside Rooms 00 to 08:
 * - Subtle holographic glow on the domain centerpiece
 * - Interactive Southern Arched Exit Door indicator
 */
function renderLivingInteriorRoomAnimations(
  ctx: CanvasRenderingContext2D,
  scene: SceneLocationId,
  frameCount: number
): void {
  const pulse = 0.55 + 0.45 * Math.sin(frameCount * 0.05);
  const bInfo = CAMPUS_BUILDING_DOORWAYS.find((b) => b.roomId === scene);
  const accent = bInfo?.roofColor || '#10B981';

  ctx.save();

  if (scene === 'ROOM_00') {
    // Glowing miniature Campus diorama at the center of the City Hall table (x: 640, y: 425)
    const dioramaGlow = ctx.createRadialGradient(640, 425, 6, 640, 425, 95);
    dioramaGlow.addColorStop(0, `rgba(0, 230, 118, ${0.32 * pulse})`);
    dioramaGlow.addColorStop(1, 'rgba(0, 230, 118, 0)');
    ctx.fillStyle = dioramaGlow;
    ctx.beginPath();
    ctx.ellipse(640, 425, 95, 52, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const anchors = DOMAIN_ROOM_ANCHORS[scene as Exclude<SceneLocationId, 'CAMPUS' | 'ROOM_00'>];
    if (anchors) {
      // Subtle ambient halo on B2 Executive Desk (top-left) and B3 Workbench
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(
        anchors.b3Workbench.x,
        anchors.b3Workbench.y - 12,
        28 + 4 * pulse,
        14 + 2 * pulse,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }

  // Southern Arched Exit Doorway Badge (x: 640, y: 690)
  ctx.fillStyle = 'rgba(6, 13, 19, 0.86)';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(525, 684, 230, 24, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🚪 SORTIE VERS LE CAMPUS (CLIQUER OU MARCHER)', 640, 699);

  ctx.restore();
}
