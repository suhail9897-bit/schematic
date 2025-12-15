export function drawPMOS(ctx, centerX, centerY, scale = 1, label = 'PMOS', isSelected = false,  opts = {} ) {
  ctx.save();
  ctx.strokeStyle = isSelected ? 'yellow' : 'white';
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.lineWidth = 2 / scale;

  // Gate Terminal (Left)
  ctx.beginPath();
  ctx.moveTo(centerX - 60, centerY);
  ctx.lineTo(centerX - 30, centerY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX - 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Gate Vertical Bars
  ctx.beginPath();
  ctx.moveTo(centerX - 30, centerY - 15);
  ctx.lineTo(centerX - 30, centerY + 15);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX - 24, centerY - 22);
  ctx.lineTo(centerX - 24, centerY + 22);
  ctx.stroke();

  // Drain (Top)
  ctx.beginPath();
  ctx.moveTo(centerX - 24, centerY - 15);
  ctx.lineTo(centerX, centerY - 15);
  ctx.lineTo(centerX, centerY - 59);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX, centerY - 60, 4, 0, Math.PI * 2);
  ctx.fill();

  // Source (Bottom)
  ctx.beginPath();
  ctx.moveTo(centerX - 24, centerY + 15);
  ctx.lineTo(centerX, centerY + 15);
  ctx.lineTo(centerX, centerY + 59);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX, centerY + 60, 4, 0, Math.PI * 2);
  ctx.fill();

  // Arrow (outward from source)
  ctx.beginPath();
  ctx.moveTo(centerX - 12, centerY - 11);
  ctx.lineTo(centerX - 12, centerY - 19);
  ctx.lineTo(centerX - 23.8, centerY - 15);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  // Label
  ctx.font = `${12}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, centerX + 2, centerY);
  
 // NEW: BODY/BULK net text just above the main label
 const bodyTxt = String((opts && opts.bodyText) ?? 'VDD').trim();
 if (bodyTxt) {
   ctx.font = `${10}px sans-serif`;
   ctx.fillStyle = isSelected ? 'cyan' : 'cyan';
   ctx.textAlign = 'start';
   ctx.textBaseline = 'bottom';
   // main label is at (centerY), place BODY slightly above it
   ctx.fillText(bodyTxt, centerX + 4, centerY - 6);
 }

  ctx.restore();
}


// ✅ Terminal coordinate exporter for canvas.js
export function getPMOSTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },     // Gate
    { x: centerX, y: centerY - 60 },     // Drain
    { x: centerX, y: centerY + 60 }      // Source
  ];
}


// ---- UI view-model (read)
export function getPmosVMFor(comp) {
  if (!comp || comp.type !== 'pmos') return null;
  const p = comp.pmos || {};
  const L = Number.isFinite(p.L) ? p.L : 1;   // µm
  const W = Number.isFinite(p.W) ? p.W : 1;   // µm
  const type = (p.type === 'HVT' || p.type === 'SVT') ? p.type : 'LVT';
  const name = (comp.label || 'PMOS').replace(/\s+/g, '').slice(0, 12);
  return { name, L, W, type };
}

// ---- UI -> component (write)
export function setPmosFromUIFor(comp, payload = {}) {
  if (!comp || comp.type !== 'pmos') return;
  if (!comp.pmos) comp.pmos = { L: 1, W: 1, type: 'LVT',  bodyNet: 'VDD' };

  // label
  if (typeof payload.name === 'string') {
    comp.label = payload.name.replace(/\s+/g, '').slice(0, 12);
  }

  // clamp L/W (µm)
  const clamp = (v, lo, hi, def) =>
    Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : def;

  comp.pmos.L = clamp(payload.L, 0.05, 1000, comp.pmos.L);
  comp.pmos.W = clamp(payload.W, 0.05, 1000, comp.pmos.W);

if (payload.type === 'HVT' || payload.type === 'LVT' || payload.type === 'SVT') {
  comp.pmos.type = payload.type;
}

 // NEW: optional BODY/BULK net name from Nets/Ports
 if (typeof payload.bodyNet === 'string') {
   comp.pmos.bodyNet = payload.bodyNet.trim(); // '' allowed
 }
}
