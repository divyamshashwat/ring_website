/**
 * Canvas drawing routines shared by the texture worker (OffscreenCanvas) and
 * the main-thread fallback.
 */
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Roughness map for polished gold: read through the G channel and multiplied
 * with material.roughness. Base ≈ 0.6 keeps the polish; fine circumferential
 * polishing lines and occasional random hairline scratches read slightly rougher.
 */
export function drawScratches(ctx: Ctx, size: number, seed = 11) {
  const rand = rng(seed);
  ctx.fillStyle = 'rgb(150,150,150)';
  ctx.fillRect(0, 0, size, size);
  // low-frequency unevenness from hand polishing
  for (let i = 0; i < 90; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = size * (0.04 + rand() * 0.12);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const v = 130 + rand() * 50;
    g.addColorStop(0, `rgba(${v},${v},${v},0.25)`);
    g.addColorStop(1, `rgba(${v},${v},${v},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // polishing lines along U (around the band)
  ctx.lineCap = 'round';
  for (let i = 0; i < 1400; i++) {
    const y = rand() * size;
    const x = rand() * size;
    const len = size * (0.05 + rand() * 0.35);
    const v = 175 + rand() * 80;
    ctx.strokeStyle = `rgba(${v},${v},${v},${0.05 + rand() * 0.12})`;
    ctx.lineWidth = 0.6 + rand() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (rand() - 0.5) * size * 0.01);
    ctx.stroke();
  }
  // hairline scratches in random directions (wear)
  for (let i = 0; i < 220; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const a = rand() * Math.PI * 2;
    const len = size * (0.01 + rand() * 0.08);
    const v = 200 + rand() * 55;
    ctx.strokeStyle = `rgba(${v},${v},${v},${0.15 + rand() * 0.3})`;
    ctx.lineWidth = 0.5 + rand() * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a + 0.2) * len * 0.5, y + Math.sin(a + 0.2) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
}

/**
 * Bump map for the hallmark engraved inside the band. The band's UVs run
 * u = around the finger (0 = top), v = around the cross-section (0.5 = inner face).
 */
export function drawHallmark(ctx: Ctx, width: number, height: number, text: string) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${Math.round(height * 0.11)}px Georgia, 'Times New Roman', serif`;
  const spaced = text.split('').join(String.fromCharCode(8202));
  ctx.filter = 'blur(0.6px)';
  ctx.fillText(spaced, 0, 0);
  ctx.restore();
}
