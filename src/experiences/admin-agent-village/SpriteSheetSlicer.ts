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

const DIRECTION_ROW_MAP: Record<Direction4, number> = {
  DOWN: 0,
  LEFT: 1,
  RIGHT: 2,
  UP: 3,
};

const spriteCache = new Map<string, SlicedSpriteSheet>();

/**
 * Auto-ChromaKey: strips pure white (#FFFFFF) or bright green (#00FF00) background pixels -> transparent
 */
export function applyAutoChromaKey(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;
  const imgData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const d = imgData.data;

  // Sample corner pixel to detect background color
  const r0 = d[0];
  const g0 = d[1];
  const b0 = d[2];
  const a0 = d[3];

  const isWhiteBg = a0 > 200 && r0 > 240 && g0 > 240 && b0 > 240;
  const isGreenBg = a0 > 200 && g0 > 220 && r0 < 60 && b0 < 60;

  if (!isWhiteBg && !isGreenBg) return sourceCanvas;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    if (isWhiteBg && r > 242 && g > 242 && b > 242) {
      d[i + 3] = 0;
    } else if (isGreenBg && g > 210 && r < 75 && b < 75) {
      d[i + 3] = 0;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return sourceCanvas;
}

/**
 * Generates a high-definition procedural 3x4 or 1x1 character sheet when PNG is not yet on disk
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

  // Determine character palette by key
  let primaryCoat = '#1e293b';
  let accentTrim = '#00E676';
  let skinTone = '#f1c27d';
  let hairColor = '#0f172a';
  let isHulk = false;
  let isPhoneB1 = false;
  let isYellowVestB3 = false;

  if (key === 'a0_hoody') {
    primaryCoat = '#111827';
    accentTrim = '#10B981';
    skinTone = '#e0ac69';
    hairColor = '#090d16';
  } else if (key === 'a0_hulk') {
    isHulk = true;
    primaryCoat = '#15803d';
    accentTrim = '#00E676';
    skinTone = '#22c55e';
    hairColor = '#052e16';
  } else if (key.startsWith('b1_')) {
    primaryCoat = '#172554'; // Midnight Blue Executive Suit
    accentTrim = '#ef4444'; // Crimson Lapel
    skinTone = '#f8d5b8';
    hairColor = '#451a03';
    isPhoneB1 = key === 'b1_phone';
  } else if (key === 'b3_worker_yellow_vest') {
    isYellowVestB3 = true;
    primaryCoat = '#eab308'; // High-vis safety yellow
    accentTrim = '#e2e8f0'; // Reflective silver strips
    skinTone = '#e5b887';
    hairColor = '#1e293b';
  } else {
    // B2 Domain Directors
    const domainColorMap: Record<string, { coat: string; trim: string; hair: string }> = {
      operations: { coat: '#083344', trim: '#00E5FF', hair: '#1e293b' },
      growth: { coat: '#064e3b', trim: '#00E676', hair: '#78350f' },
      products: { coat: '#1e3a8a', trim: '#2979FF', hair: '#0f172a' },
      sales: { coat: '#7c2d12', trim: '#FF6D00', hair: '#451a03' },
      finance: { coat: '#422006', trim: '#FFD600', hair: '#94a3b8' },
      legal: { coat: '#334155', trim: '#ECEFF1', hair: '#1e1b4b' },
      it: { coat: '#4a044e', trim: '#D500F9', hair: '#27272a' },
      people: { coat: '#831843', trim: '#FF4081', hair: '#18181b' },
    };
    for (const [domainKey, style] of Object.entries(domainColorMap)) {
      if (key.includes(domainKey)) {
        primaryCoat = style.coat;
        accentTrim = style.trim;
        hairColor = style.hair;
        break;
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = c * frameWidth;
      const oy = r * frameHeight;
      const cx = ox + frameWidth / 2;
      const stepPhase = c === 0 ? -1 : c === 2 ? 1 : 0;

      ctx.save();

      // Ground drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.ellipse(cx, oy + 86, isHulk ? 22 : 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hulk Energy Aura
      if (isHulk) {
        const grad = ctx.createRadialGradient(cx, oy + 48, 6, cx, oy + 48, 30);
        grad.addColorStop(0, 'rgba(0, 230, 118, 0.55)');
        grad.addColorStop(1, 'rgba(0, 230, 118, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, oy + 48, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isSeated) {
        // Draw Executive Leather Chair backrest
        ctx.fillStyle = '#291d16';
        ctx.strokeStyle = accentTrim;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx - 18, oy + 26, 36, 44, 6);
        ctx.fill();
        ctx.stroke();

        // Seated legs
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 11, oy + 62, 9, 18);
        ctx.fillRect(cx + 2, oy + 62, 9, 18);
      } else {
        // Walking legs
        const leftLegY = oy + 62 + stepPhase * 4;
        const rightLegY = oy + 62 - stepPhase * 4;
        ctx.fillStyle = isHulk ? '#3b0764' : '#0f172a'; // Hulk purple shorts or dark trousers
        ctx.beginPath();
        ctx.roundRect(cx - (isHulk ? 13 : 10), leftLegY, isHulk ? 11 : 8, 22, 3);
        ctx.roundRect(cx + 2, rightLegY, isHulk ? 11 : 8, 22, 3);
        ctx.fill();

        // Boots/Shoes
        ctx.fillStyle = accentTrim;
        ctx.fillRect(cx - (isHulk ? 13 : 10), leftLegY + 18, isHulk ? 11 : 8, 4);
        ctx.fillRect(cx + 2, rightLegY + 18, isHulk ? 11 : 8, 4);
      }

      // Torso / Jacket / Hoody / Yellow Vest
      const torsoW = isHulk ? 34 : 24;
      const torsoH = isHulk ? 32 : 28;
      const torsoX = cx - torsoW / 2;
      const torsoY = oy + 36;

      ctx.fillStyle = primaryCoat;
      ctx.beginPath();
      ctx.roundRect(torsoX, torsoY, torsoW, torsoH, 6);
      ctx.fill();

      // Trim / Reflective Vest Strips
      if (isYellowVestB3) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(torsoX + 2, torsoY + 8, torsoW - 4, 4);
        ctx.fillRect(torsoX + 2, torsoY + 18, torsoW - 4, 4);
        ctx.fillRect(torsoX + 4, torsoY, 4, torsoH);
        ctx.fillRect(torsoX + torsoW - 8, torsoY, 4, torsoH);
      } else {
        ctx.strokeStyle = accentTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(torsoX + 1, torsoY + 1, torsoW - 2, torsoH - 2);
      }

      // Arms
      const armSwing = isSeated ? 0 : stepPhase * 3;
      ctx.fillStyle = isHulk ? skinTone : primaryCoat;
      ctx.beginPath();
      ctx.roundRect(torsoX - (isHulk ? 8 : 6), torsoY + 2 - armSwing, isHulk ? 8 : 6, 20, 3);
      ctx.roundRect(
        torsoX + torsoW,
        isPhoneB1 ? torsoY - 4 : torsoY + 2 + armSwing,
        isHulk ? 8 : 6,
        20,
        3
      );
      ctx.fill();

      // Head
      ctx.fillStyle = skinTone;
      ctx.beginPath();
      ctx.arc(cx, oy + 23, isHulk ? 13 : 11, 0, Math.PI * 2);
      ctx.fill();

      // Hair / Hood / Hardhat
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.arc(cx, oy + 19, isHulk ? 13.5 : 11.5, Math.PI, Math.PI * 2);
      ctx.fill();

      // Eyes (if not facing UP)
      if (r !== 3) {
        const eyeOffsetX = r === 1 ? -3 : r === 2 ? 3 : 0;
        ctx.fillStyle = isHulk ? '#00E676' : '#0f172a';
        ctx.fillRect(cx - 4 + eyeOffsetX, oy + 22, 2.5, 2.5);
        ctx.fillRect(cx + 2 + eyeOffsetX, oy + 22, 2.5, 2.5);
      }

      // B1 Phone Dispatch glowing smartphone + signal wave
      if (isPhoneB1) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx + 12, oy + 18, 7, 11);
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx + 16, oy + 16, 7 + (c % 2) * 4, -Math.PI / 2, 0);
        ctx.stroke();
      }

      ctx.restore();
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
  const existing = spriteCache.get(key);
  if (existing) return existing;
  const generated = buildProceduralSpriteSheet(key);
  spriteCache.set(key, generated);
  return generated;
}

/**
 * Allows hot-importing a PNG sprite sheet (via Drag & Drop or File Input) and auto-chroma-keying it
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
  applyAutoChromaKey(offscreen);

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
