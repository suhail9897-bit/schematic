export function drawNMOS(ctx, centerX, centerY, scale = 1, label = 'NMOS', isSelected = false, opts = {}) {
  ctx.save();
  ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 2 / scale;

  // Left gate terminal
  ctx.beginPath();
  ctx.moveTo(centerX - 60, centerY);
  ctx.lineTo(centerX - 30, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX - 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Gate vertical line
  ctx.beginPath();
  ctx.moveTo(centerX - 30, centerY - 15);
  ctx.lineTo(centerX - 30, centerY + 15);
  ctx.stroke();

  // Channel vertical bar
  ctx.beginPath();
  ctx.moveTo(centerX - 24, centerY - 22);
  ctx.lineTo(centerX - 24, centerY + 22);
  ctx.stroke();

  // Drain line (top-right)
  ctx.beginPath();
  ctx.moveTo(centerX - 24, centerY - 15);
  ctx.lineTo(centerX, centerY - 15);
  ctx.lineTo(centerX, centerY - 60);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, centerY - 60, 4, 0, Math.PI * 2);
  ctx.fill();

  // Source line (bottom-right)
  ctx.beginPath();
  ctx.moveTo(centerX - 24, centerY + 15);
  ctx.lineTo(centerX, centerY + 15);
  ctx.lineTo(centerX, centerY + 60);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, centerY + 60, 4, 0, Math.PI * 2);
  ctx.fill();

  // NMOS Arrow (towards channel)
  ctx.beginPath();
  ctx.moveTo(centerX - 12, centerY + 10);
  ctx.lineTo(centerX - 12, centerY + 20);
  ctx.lineTo(centerX - 0.8, centerY + 15);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  // Label
  ctx.font = `${12}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, centerX + 4, centerY );

  // NEW: BODY/BULK net text just above the main label
 const bodyTxt = String((opts && opts.bodyText) ?? 'VSS').trim();
 if (bodyTxt) {
   ctx.font = `${10}px sans-serif`;
   ctx.fillStyle = isSelected ? 'cyan' : 'cyan';
   ctx.textAlign = 'start';
   ctx.textBaseline = 'bottom';
   // main label is at (centerY), place BODY slightly above it
   ctx.fillText(bodyTxt, centerX + 2, centerY - 6);
 }

  ctx.restore();
}


// ✅ Terminal coordinate exporter for canvas.js
export function getNMOSTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },     // Gate
    { x: centerX, y: centerY - 60 },     // Drain
    { x: centerX, y: centerY + 60 }      // Source
  ];
}


// --- Add below existing exports in src/lib/nmos.js ---

// UI view-model (read)
export function getNmosVMFor(comp) {
  if (!comp || comp.type !== 'nmos') return null;
  const n = comp.nmos || {};
  const L = Number.isFinite(n.L) ? n.L : 1;     // µm
  const W = Number.isFinite(n.W) ? n.W : 1;     // µm
  const type = (n.type === 'HVT' || n.type === 'SVT') ? n.type : 'LVT';
  const name = (comp.label || 'NMOS').replace(/\s+/g, '').slice(0, 12);
  return { name, L, W, type };
}

// UI -> component (write)
export function setNmosFromUIFor(comp, payload = {}) {
  if (!comp || comp.type !== 'nmos') return;

  if (!comp.nmos) comp.nmos = { L: 1, W: 1, type: 'LVT', bodyNet: 'VSS' };

  // label
  if (typeof payload.name === 'string') {
    comp.label = payload.name.replace(/\s+/g, '').slice(0, 12);
  }

  // length/width (clamp, µm)
  const clamp = (v, lo, hi, def) =>
    Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : def;

  comp.nmos.L = clamp(payload.L, 0.05, 1000, comp.nmos.L); // 0.05–1000 µm
  comp.nmos.W = clamp(payload.W, 0.05, 1000, comp.nmos.W); // 0.05–1000 µm

if (payload.type === 'HVT' || payload.type === 'LVT' || payload.type === 'SVT') {
  comp.nmos.type = payload.type;
}

   // NEW: BODY/BULK net name from Nets/Ports tab (optional)
  // keep raw label; netlist will normalize and default to SOURCE if blank
  if (typeof payload.bodyNet === 'string') {
    if (!comp.nmos) comp.nmos = { L: 1, W: 1, type: 'LVT' };
    comp.nmos.bodyNet = payload.bodyNet.trim(); // '' is allowed
  }
}
