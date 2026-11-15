import { Direction4 } from '../../world-model/types';

export interface SlicedSpriteSheet {
  key: string;
  cols: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  canvas: HTMLCanvasElement;
  isCustomLoaded: boolean;
}

/**
 * Exact row order of the Google Drive 3x4 character sheets:
 * Row 0 = Bas (DOWN), Row 1 = Haut/Dos (UP), Row 2 = Gauche (LEFT), Row 3 = Droite (RIGHT)
 */
const DIRECTION_ROW_MAP: Record<Direction4, number> = {
  DOWN: 0,
  UP: 1,
  LEFT: 2,
  RIGHT: 3,
};

const spriteCache = new Map<string, SlicedSpriteSheet>();
let spritesPreloadStarted = false;

/**
 * Cell-Border Flood-Fill Auto-ChromaKey (used when hot-importing raw PNGs via Drag & Drop)
 */
export function applyAutoChromaKey(
  sourceCanvas: HTMLCanvasElement,
  cols = 3,
  rows = 4
): HTMLCanvasElement {
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  const isBgPixel = (idx: number): boolean => {
    const r = d[idx];
    const g = d[idx + 1];
    const b = d[idx + 2];
    const a = d[idx + 3];
    if (a < 16) return true;
    const isNearWhite =
      r >= 230 &&
      g >= 230 &&
      b >= 230 &&
      Math.abs(r - g) <= 16 &&
      Math.abs(g - b) <= 16;
    const isChromaGreen = g >= 210 && r <= 75 && b <= 75;
    return isNearWhite || isChromaGreen;
  };

  const visited = new Uint8Array(w * h);
  const cellW = Math.floor(w / cols);
  const cellH = Math.floor(h / rows);

  for (let cr = 0; cr < rows; cr++) {
    for (let cc = 0; cc < cols; cc++) {
      const x0 = cc * cellW;
      const y0 = cr * cellH;
      const x1 = cc === cols - 1 ? w - 1 : (cc + 1) * cellW - 1;
      const y1 = cr === rows - 1 ? h - 1 : (cr + 1) * cellH - 1;

      const queue: number[] = [];
      const enqueueIfBg = (px: number, py: number) => {
        const pos = py * w + px;
        if (visited[pos]) return;
        const byteIdx = pos * 4;
        if (isBgPixel(byteIdx)) {
          visited[pos] = 1;
          queue.push(pos);
        }
      };

      for (let x = x0; x <= x1; x++) {
        enqueueIfBg(x, y0);
        enqueueIfBg(x, y1);
      }
      for (let y = y0; y <= y1; y++) {
        enqueueIfBg(x0, y);
        enqueueIfBg(x1, y);
      }

      while (queue.length > 0) {
        const pos = queue.pop()!;
        const byteIdx = pos * 4;
        d[byteIdx + 3] = 0;

        const py = Math.floor(pos / w);
        const px = pos - py * w;

        if (px > x0) enqueueIfBg(px - 1, py);
        if (px < x1) enqueueIfBg(px + 1, py);
        if (py > y0) enqueueIfBg(px, py - 1);
        if (py < y1) enqueueIfBg(px, py + 1);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return sourceCanvas;
}

/**
 * Registers a pre-cut transparent RGBA WebP sprite sheet directly without main-thread flood-fill overhead
 */
function registerPreCutWebpSprite(
  key: string,
  img: HTMLImageElement,
  cols: number,
  rows: number
): SlicedSpriteSheet {
  const offscreen = document.createElement('canvas');
  offscreen.width = img.naturalWidth || img.width;
  offscreen.height = img.naturalHeight || img.height;
  const ctx = offscreen.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const sheet: SlicedSpriteSheet = {
    key,
    cols,
    rows,
    frameWidth: Math.floor(offscreen.width / cols),
    frameHeight: Math.floor(offscreen.height / rows),
    canvas: offscreen,
    isCustomLoaded: true,
  };
  spriteCache.set(key, sheet);
  return sheet;
}

/**
 * Preloads all pre-sliced & WebP-compressed RGBA character sprites from public/assets/sprites/
 */
export function ensureDriveSpritesPreloaded(): void {
  if (spritesPreloadStarted || typeof window === 'undefined') return;
  spritesPreloadStarted = true;

  // 1. Pre-cut 3x4 walking & action sheets (Explicit deterministic mapping)
  const walk3x4Sources: Array<{ key: string; url: string }> = [
    { key: 'a0_hoody', url: '/assets/sprites/a0/amadeus-hoody-walk-3x4.webp' },
    { key: 'a0_hulk', url: '/assets/sprites/a0/amadeus-hulk-unblock-3x4.webp' },
    { key: 'b1_walk', url: '/assets/sprites/b1/b1-ceo-walk-3x4.webp' },
    { key: 'b1_phone', url: '/assets/sprites/b1/b1-ceo-phone-dispatch.webp' },
    { key: 'b2_operations_standing', url: '/assets/sprites/b2-standing/b2-01-operations-3x4.webp' },
    { key: 'b2_growth_standing', url: '/assets/sprites/b2-standing/b2-02-growth-3x4.webp' },
    { key: 'b2_products_standing', url: '/assets/sprites/b2-standing/b2-03-products-3x4.webp' },
    { key: 'b2_sales_standing', url: '/assets/sprites/b2-standing/b2-04-sales-3x4.webp' },
    { key: 'b2_finance_standing', url: '/assets/sprites/b2-standing/b2-05-finance-3x4.webp' },
    { key: 'b2_legal_standing', url: '/assets/sprites/b2-standing/b2-06-legal-3x4.webp' },
    { key: 'b2_it_standing', url: '/assets/sprites/b2-standing/b2-07-it-3x4.webp' },
    { key: 'b2_people_standing', url: '/assets/sprites/b2-standing/b2-08-people-3x4.webp' },
    { key: 'b3_worker_yellow_vest', url: '/assets/sprites/b3-workers/b3-worker-yellow-vest-3x4.webp' },
  ];

  walk3x4Sources.forEach(({ key, url }) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0) {
        registerPreCutWebpSprite(key, img, 3, 4);
      }
    };
    img.src = url;
  });

  // 2. Pre-cut 1x1 normalized Seated Poses (A0 Seated, B1 CEO Seated, and B2 Directors Front & Profile)
  const singleSeatedSources: Array<{ key: string; url: string }> = [
    { key: 'a0_seated', url: '/assets/sprites/a0/amadeus-hoody-seated-front.webp' },
    { key: 'b1_seated', url: '/assets/sprites/b1/b1-ceo-seated-front.webp' },
    { key: 'b2_operations_seated', url: '/assets/sprites/b2-seated/b2-01-operations-seated.webp' },
    { key: 'b2_operations_seated_side', url: '/assets/sprites/b2-seated/b2-01-operations-seated-side.webp' },
    { key: 'b2_growth_seated', url: '/assets/sprites/b2-seated/b2-02-growth-seated.webp' },
    { key: 'b2_growth_seated_side', url: '/assets/sprites/b2-seated/b2-02-growth-seated-side.webp' },
    { key: 'b2_products_seated', url: '/assets/sprites/b2-seated/b2-03-products-seated.webp' },
    { key: 'b2_products_seated_side', url: '/assets/sprites/b2-seated/b2-03-products-seated-side.webp' },
    { key: 'b2_sales_seated', url: '/assets/sprites/b2-seated/b2-04-sales-seated.webp' },
    { key: 'b2_sales_seated_side', url: '/assets/sprites/b2-seated/b2-04-sales-seated-side.webp' },
    { key: 'b2_finance_seated', url: '/assets/sprites/b2-seated/b2-05-finance-seated.webp' },
    { key: 'b2_finance_seated_side', url: '/assets/sprites/b2-seated/b2-05-finance-seated-side.webp' },
    { key: 'b2_legal_seated', url: '/assets/sprites/b2-seated/b2-06-legal-seated.webp' },
    { key: 'b2_legal_seated_side', url: '/assets/sprites/b2-seated/b2-06-legal-seated-side.webp' },
    { key: 'b2_it_seated', url: '/assets/sprites/b2-seated/b2-07-it-seated.webp' },
    { key: 'b2_it_seated_side', url: '/assets/sprites/b2-seated/b2-07-it-seated-side.webp' },
    { key: 'b2_people_seated', url: '/assets/sprites/b2-seated/b2-08-people-seated.webp' },
    { key: 'b2_people_seated_side', url: '/assets/sprites/b2-seated/b2-08-people-seated-side.webp' },
  ];

  singleSeatedSources.forEach(({ key, url }) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0) {
        registerPreCutWebpSprite(key, img, 1, 1);
      }
    };
    img.src = url;
  });
}

/**
 * Hot-imports a custom PNG/WebP sprite sheet via Drag & Drop and applies Auto-ChromaKey
 */
export function registerCustomSpritePng(
  key: string,
  img: HTMLImageElement,
  cols = 3,
  rows = 4
): SlicedSpriteSheet {
  const offscreen = document.createElement('canvas');
  offscreen.width = img.naturalWidth || img.width;
  offscreen.height = img.naturalHeight || img.height;
  const ctx = offscreen.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  applyAutoChromaKey(offscreen, cols, rows);

  const sheet: SlicedSpriteSheet = {
    key,
    cols,
    rows,
    frameWidth: Math.floor(offscreen.width / cols),
    frameHeight: Math.floor(offscreen.height / rows),
    canvas: offscreen,
    isCustomLoaded: true,
  };
  spriteCache.set(key, sheet);
  return sheet;
}

/**
 * Draws a single sliced frame of a character onto the main 1280x720 Canvas.
 * Automatically selects profile seated pose (`_seated_side`) when a seated B2 director faces LEFT or RIGHT.
 */
export function drawAgentSpriteFrame(
  ctx: CanvasRenderingContext2D,
  spriteKey: string,
  direction: Direction4,
  animTick: number,
  isMoving: boolean,
  centerX: number,
  footY: number,
  targetHeightPx: number
): void {
  ensureDriveSpritesPreloaded();

  let resolvedKey = spriteKey;
  if (
    spriteKey.endsWith('_seated') &&
    (direction === 'LEFT' || direction === 'RIGHT') &&
    spriteCache.has(`${spriteKey}_side`)
  ) {
    resolvedKey = `${spriteKey}_side`;
  }

  const sheet = spriteCache.get(resolvedKey) || spriteCache.get(spriteKey);
  if (!sheet) return; // Wait for WebP preload (< 30ms) — never draw procedural stick-figure slop!

  const col = sheet.cols === 1 ? 0 : isMoving ? Math.floor(animTick / 8) % sheet.cols : 1;
  const row = sheet.rows === 1 ? 0 : DIRECTION_ROW_MAP[direction] % sheet.rows;

  const sx = col * sheet.frameWidth;
  const sy = row * sheet.frameHeight;
  const aspect = sheet.frameWidth / sheet.frameHeight;
  const destH = targetHeightPx;
  const destW = destH * aspect;

  ctx.save();
  // Soft ground contact shadow under character feet
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(centerX, footY - 2, destW * 0.28, destH * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(
    sheet.canvas,
    sx,
    sy,
    sheet.frameWidth,
    sheet.frameHeight,
    centerX - destW / 2,
    footY - destH,
    destW,
    destH
  );
  ctx.restore();
}
