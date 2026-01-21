export function drawPNP(ctx, centerX, centerY, scale = 1, label = 'PNP', isSelected = false) {
  ctx.save();
    ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 2 / scale;

  // Base terminal (left)
  ctx.beginPath();
  ctx.moveTo(centerX - 60, centerY);
  ctx.lineTo(centerX, centerY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX - 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Base vertical line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 30);
  ctx.lineTo(centerX, centerY + 30);
  ctx.stroke();

  // Collector line (top-right)
  ctx.beginPath();
  ctx.moveTo(centerX + 5, centerY - 15);
  ctx.lineTo(centerX + 30, centerY - 30);
  ctx.lineTo(centerX + 30, centerY - 60);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX + 30, centerY - 60, 4, 0, Math.PI * 2);
  ctx.fill();

  // Emitter line (bottom-right)
  ctx.beginPath();
  ctx.moveTo(centerX + 0, centerY + 15);
  ctx.lineTo(centerX + 30, centerY + 30);
  ctx.lineTo(centerX + 30, centerY + 60);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX + 30, centerY + 60, 4, 0, Math.PI * 2);
  ctx.fill();

  // Inward arrow on emitter
  ctx.beginPath();
  ctx.moveTo(centerX + 9, centerY - 25);
  ctx.lineTo(centerX + 14, centerY - 15);
  ctx.lineTo(centerX + 0.5, centerY - 15);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  // Label
  ctx.font = `${14 / scale}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, centerX - 20, centerY + 20);

  ctx.restore();
}


// ✅ Terminals coordinates helper
export function getPNPTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },         // Base terminal (left)
    { x: centerX + 30, y: centerY - 60 },    // Collector terminal (top-right)
    { x: centerX + 30, y: centerY + 60 }     // Emitter terminal (bottom-right)
  ];
}


// --- Add at end of pnp.js ---

const AREA_MIN = 0.1;
const AREA_MAX = 10.0;
const _clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const _fmt   = (v) => Number.isFinite(v) ? +Number(v).toFixed(3) : 1.0;

// UI VM (read)
export function getPNPAreaVMFor(comp) {
  if (!comp || comp.type !== 'pnp') return null;
  const area = (typeof comp.pnpArea === 'number' && comp.pnpArea > 0) ? comp.pnpArea : 1.0;
  return { label: comp.label || 'Q1', area: _fmt(_clamp(area, AREA_MIN, AREA_MAX)),
           min: AREA_MIN, max: AREA_MAX, step: 0.1 };
}

// UI setter (write)
export function setPNPAreaFromUIFor(comp, { area }) {
  if (!comp || comp.type !== 'pnp') return;
  let a = parseFloat(area);
  if (!Number.isFinite(a) || a <= 0) a = 1.0;
  comp.pnpArea = _fmt(_clamp(a, AREA_MIN, AREA_MAX));
}
