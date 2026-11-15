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
 * Cell-Border Flood-Fill Auto-ChromaKey:
 * Removes the connected white/near-white background from the borders of each cell
 * while preserving white clothing/sleeves/eyes inside the character outline!
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
    // Near-white neutral background or bright chroma green
    const isNearWhite =
      r >= 232 &&
      g >= 232 &&
      b >= 232 &&
      Math.abs(r - g) <= 14 &&
      Math.abs(g - b) <= 14;
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

      // Seed flood-fill along the 4 edges of this sprite frame cell
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
        d[byteIdx + 3] = 0; // Make background transparent

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
 * Preloads all real Google Drive sprite sheets from public/assets/sprites/
 */
export function ensureDriveSpritesPreloaded(): void {
  if (spritesPreloadStarted || typeof window === 'undefined') return;
  spritesPreloadStarted = true;

  const walk3x4Sources: Array<{ key: string; url: string }> = [
    { key: 'a0_hoody', url: '/assets/sprites/a0/amadeus-ceo-suit-3x4.png' },
    { key: 'a0_hulk', url: '/assets/sprites/a0/amadeus-hulk-unblock-3x4.png' },
    { key: 'b1_walk', url: '/assets/sprites/b1/ceo-women-walk-3x4.png' },
    { key: 'b1_phone', url: '/assets/sprites/b1/ceo-women-phone-dispatch.png' },
    { key: 'b2_operations_standing', url: '/assets/sprites/b2-standing/b2-01-operations-3x4.png' },
    { key: 'b2_growth_standing', url: '/assets/sprites/b2-standing/b2-02-growth-3x4.png' },
    { key: 'b2_products_standing', url: '/assets/sprites/b2-standing/b2-03-products-3x4.png' },
    { key: 'b2_sales_standing', url: '/assets/sprites/b2-standing/b2-04-sales-3x4.png' },
    { key: 'b2_finance_standing', url: '/assets/sprites/b2-standing/b2-05-finance-3x4.png' },
    { key: 'b2_legal_standing', url: '/assets/sprites/b2-standing/b2-06-legal-3x4.png' },
    { key: 'b2_it_standing', url: '/assets/sprites/b2-standing/b2-07-it-3x4.png' },
    { key: 'b2_people_standing', url: '/assets/sprites/b2-standing/b2-08-people-3x4.png' },
    { key: 'b3_worker_yellow_vest', url: '/assets/sprites/b3-workers/b3-worker-yellow-vest-3x4.png' },
  ];

  walk3x4Sources.forEach(({ key, url }) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0) {
        registerCustomSpritePng(key, img, 3, 4);
      }
    };
    img.src = url;
  });

  // Preload & slice the 2 Seated B2 Director packs (each is 4 columns x 2 rows)
  const preloadSeatedPack = (url: string, keys: [string, string, string, string]) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth <= 0) return;
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = img.naturalWidth;
      fullCanvas.height = img.naturalHeight;
      const ctx = fullCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      applyAutoChromaKey(fullCanvas, 4, 2);

      const colW = Math.floor(fullCanvas.width / 4);
      const rowH = Math.floor(fullCanvas.height / 2);

      keys.forEach((k, colIdx) => {
        const single = document.createElement('canvas');
        single.width = colW;
        single.height = rowH;
        const sCtx = single.getContext('2d')!;
        // Row 0 = Front seated pose
        sCtx.drawImage(fullCanvas, colIdx * colW, 0, colW, rowH, 0, 0, colW, rowH);
        spriteCache.set(k, {
          key: k,
          cols: 1,
          rows: 1,
          frameWidth: colW,
          frameHeight: rowH,
          canvas: single,
          isCustomLoaded: true,
        });
      });
    };
    img.src = url;
  };

  preloadSeatedPack('/assets/sprites/b2-seated/b2-directors-seated-01-04.png', [
    'b2_operations_seated',
    'b2_growth_seated',
    'b2_products_seated',
    'b2_sales_seated',
  ]);

  preloadSeatedPack('/assets/sprites/b2-seated/b2-directors-seated-05-08.png', [
    'b2_finance_seated',
    'b2_legal_seated',
    'b2_it_seated',
    'b2_people_seated',
  ]);
}

/**
 * Generates a procedural 3x4 or 1x1 character sheet in memory before PNG finishes loading
 */
function buildProceduralSpriteSheet(key: string): SlicedSpriteSheet {
  const isSeated = key.endsWith('_seated');
  const cols = isSeated ? 1 : 3;
  const rows = isSeated ? 1 : 4;
  const frameWidth = 64;
  const frameHeight = 96;

  const canvas = document.createElement('canvas');
  canvas.width = frameWidth * cols;
  canvas.height = frameHeight * rows;
  const ctx = canvas.getContext('2d')!;

  const primaryCoat = key === 'a0_hulk' ? '#15803d' : key === 'b3_worker_yellow_vest' ? '#eab308' : '#1e293b';
  const accentTrim = '#00E676';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = c * frameWidth;
      const oy = r * frameHeight;
      const cx = ox + frameWidth / 2;

      ctx.fillStyle = primaryCoat;
      ctx.beginPath();
      ctx.roundRect(cx - 12, oy + 32, 24, 34, 6);
      ctx.fill();
      ctx.strokeStyle = accentTrim;
      ctx.strokeRect(cx - 12, oy + 32, 24, 34);

      ctx.fillStyle = '#f1c27d';
      ctx.beginPath();
      ctx.arc(cx, oy + 20, 11, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return {
    key,
    cols,
    rows,
    frameWidth,
    frameHeight,
    canvas,
    isCustomLoaded: false,
  };
}

export function getOrCreateSpriteSheet(key: string): SlicedSpriteSheet {
  ensureDriveSpritesPreloaded();
  const existing = spriteCache.get(key);
  if (existing) return existing;
  const generated = buildProceduralSpriteSheet(key);
  spriteCache.set(key, generated);
  return generated;
}

/**
 * Hot-imports a PNG sprite sheet and applies Cell-Border Flood-Fill Auto-ChromaKey
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
 * Draws a single sliced frame of a character onto the main 1280x720 Canvas
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
  const sheet = getOrCreateSpriteSheet(spriteKey);
  const col = sheet.cols === 1 ? 0 : isMoving ? Math.floor(animTick / 8) % sheet.cols : 1;
  const row = sheet.rows === 1 ? 0 : DIRECTION_ROW_MAP[direction] % sheet.rows;

  const sx = col * sheet.frameWidth;
  const sy = row * sheet.frameHeight;
  const aspect = sheet.frameWidth / sheet.frameHeight;
  const destH = targetHeightPx;
  const destW = destH * aspect;

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
}
