import { SceneLocationId } from '../../world-model/types';
import {
  CAMPUS_BUILDING_DOORWAYS,
  CITY_HALL_15_SEATS,
  DOMAIN_ROOM_ANCHORS,
} from './SeatedAnchorsRegistry';

const customSceneBackgrounds = new Map<SceneLocationId, HTMLImageElement>();
let preloadInitiated = false;

const SCENE_ASSET_PATHS: Record<SceneLocationId, string> = {
  CAMPUS: '/assets/maps/campus-overworld-hd.png',
  ROOM_00: '/assets/rooms/room-00-city-hall.png',
  ROOM_01: '/assets/rooms/room-01-operations.png',
  ROOM_02: '/assets/rooms/room-02-growth.png',
  ROOM_03: '/assets/rooms/room-03-products.png',
  ROOM_04: '/assets/rooms/room-04-sales.png',
  ROOM_05: '/assets/rooms/room-05-finance.png',
  ROOM_06: '/assets/rooms/room-06-legal.png',
  ROOM_07: '/assets/rooms/room-07-it.png',
  ROOM_08: '/assets/rooms/room-08-people.png',
};

/**
 * Automatically preloads all Google Drive PNG maps & rooms from public/assets/{maps,rooms}
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
}

export function registerCustomSceneBackground(scene: SceneLocationId, img: HTMLImageElement): void {
  customSceneBackgrounds.set(scene, img);
}

/**
 * Renders the 1280x720 High-Definition Solarpunk Overworld or Interior Rooms (00 to 08).
 * Uses the real Google Drive PNGs when loaded, with procedural HD fallback during initial ms.
 */
export function renderSceneBackground(
  ctx: CanvasRenderingContext2D,
  scene: SceneLocationId,
  frameCount: number
): void {
  ensureDriveScenesPreloaded();

  const customBg = customSceneBackgrounds.get(scene);
  if (customBg) {
    ctx.drawImage(customBg, 0, 0, 1280, 720);

    // Subtle interactive HUD labels for doorways on Campus or Exit Door in Rooms
    if (scene === 'CAMPUS') {
      ctx.save();
      for (const b of CAMPUS_BUILDING_DOORWAYS) {
        const labelW = 128;
        ctx.fillStyle = 'rgba(6, 13, 19, 0.82)';
        ctx.strokeStyle = b.roofColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(b.campusDoorX - labelW / 2, b.campusDoorY - 22, labelW, 16, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`🚪 ${b.label}`, b.campusDoorX, b.campusDoorY - 11);
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 13, 19, 0.82)';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(530, 686, 220, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a7f3d0';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🚪 SORTIE VERS LE CAMPUS (APPROCHER)', 640, 701);
      ctx.restore();
    }
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
  const bgGrad = ctx.createRadialGradient(640, 350, 80, 640, 350, 760);
  bgGrad.addColorStop(0, '#0e2920');
  bgGrad.addColorStop(0.55, '#091d17');
  bgGrad.addColorStop(1, '#05100d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1280, 720);

  const pulse = 0.75 + 0.25 * Math.sin(frameCount * 0.04);
  ctx.save();
  ctx.fillStyle = '#0d261e';
  ctx.strokeStyle = '#00E676';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(610, 365, 72, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const emblemGlow = ctx.createRadialGradient(610, 365, 5, 610, 365, 52);
  emblemGlow.addColorStop(0, `rgba(0, 230, 118, ${0.45 * pulse})`);
  emblemGlow.addColorStop(1, 'rgba(0, 230, 118, 0)');
  ctx.fillStyle = emblemGlow;
  ctx.beginPath();
  ctx.arc(610, 365, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (const b of CAMPUS_BUILDING_DOORWAYS) {
    const { x, y, w, h } = b.buildingBounds;
    ctx.save();
    ctx.fillStyle = '#0f221d';
    ctx.strokeStyle = b.roofColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function renderCityHallRoom00(ctx: CanvasRenderingContext2D, frameCount: number): void {
  ctx.fillStyle = '#1b1612';
  ctx.fillRect(0, 0, 1280, 720);

  for (const seat of CITY_HALL_15_SEATS) {
    ctx.save();
    ctx.fillStyle = '#2c1810';
    ctx.strokeStyle = seat.seatIndex === 1 ? '#FFD600' : '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(seat.x - 20, seat.y - 18, 40, 34, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = '#06281e';
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(380, 300, 520, 200, 18);
  ctx.fill();
  ctx.stroke();
  const glowR = 16 + 4 * Math.sin(frameCount * 0.06);
  ctx.fillStyle = 'rgba(0, 230, 118, 0.45)';
  ctx.beginPath();
  ctx.arc(640, 400, glowR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderDomainInteriorRoom(
  ctx: CanvasRenderingContext2D,
  scene: SceneLocationId,
  _frameCount: number
): void {
  const bInfo = CAMPUS_BUILDING_DOORWAYS.find((b) => b.roomId === scene);
  const accent = bInfo?.roofColor || '#00E5FF';
  ctx.fillStyle = '#1b1612';
  ctx.fillRect(0, 0, 1280, 720);

  const anchors = DOMAIN_ROOM_ANCHORS[scene as Exclude<SceneLocationId, 'CAMPUS' | 'ROOM_00'>];
  if (!anchors) return;

  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(540, 250, 200, 90);
}
