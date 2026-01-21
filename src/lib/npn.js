export function drawNPN(ctx, centerX, centerY, scale = 1, label = 'NPN', isSelected = false) {
  ctx.save();
    ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 2 / scale;

  // Left base terminal
  ctx.beginPath();
  ctx.moveTo(centerX - 60, centerY);
  ctx.lineTo(centerX , centerY);
  ctx.stroke();

  // Base vertical line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 30);
  ctx.lineTo(centerX, centerY + 30);
  ctx.stroke();

  // Collector path
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + 15);
  ctx.lineTo(centerX + 30, centerY + 30);
  ctx.lineTo(centerX + 30, centerY + 60);
  ctx.stroke();

  // Collector circle
  ctx.beginPath();
  ctx.arc(centerX + 30, centerY + 60, 4, 0, Math.PI * 2);
  ctx.fill();

  // Emitter path
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 15);
  ctx.lineTo(centerX + 30, centerY - 30);
  ctx.lineTo(centerX + 30, centerY - 60);
  ctx.stroke();

  // Emitter circle
  ctx.beginPath();
  ctx.arc(centerX + 30, centerY - 60, 4, 0, Math.PI * 2);
  ctx.fill();

  // Emitter arrow
  ctx.beginPath();
  ctx.moveTo(centerX + 14, centerY + 29.7);
  ctx.lineTo(centerX + 20, centerY + 17);
  ctx.lineTo(centerX + 29.5, centerY + 29.9);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  // Base circle
  ctx.beginPath();
  ctx.arc(centerX - 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.font = `${14 / scale}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, centerX - 20, centerY + 20);

  ctx.restore();
}


// ✅ Terminals coordinates helper for NPN
export function getNPNTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },       // Base
    { x: centerX + 30, y: centerY + 60 },  // Collector
    { x: centerX + 30, y: centerY - 60 }   // Emitter
  ];
}


// ⬇️ add at bottom of npn.js

const AREA_MIN = 0.1;
const AREA_MAX = 10.0;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt   = (v) => Number.isFinite(v) ? +Number(v).toFixed(3) : 1.0;

// UI VM (read)
export function getNpnAreaVMFor(comp) {
  if (!comp || comp.type !== 'npn') return null;
  const area = (typeof comp.npnArea === 'number' && comp.npnArea > 0) ? comp.npnArea : 1.0;
  return { label: comp.label || 'Q1', area: fmt(clamp(area, AREA_MIN, AREA_MAX)),
           min: AREA_MIN, max: AREA_MAX, step: 0.1 };
}

// UI setter (write)
export function setNpnAreaFromUIFor(comp, { area }) {
  if (!comp || comp.type !== 'npn') return;
  let a = parseFloat(area);
  if (!Number.isFinite(a) || a <= 0) a = 1.0;
  comp.npnArea = fmt(clamp(a, AREA_MIN, AREA_MAX));
}
