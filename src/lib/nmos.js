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

    // NEW: center red-dot line to the right (x + 60)
  ctx.save();
  ctx.lineWidth = 2 / scale; // same thickness scaling
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + 60, centerY);
  ctx.stroke();
  ctx.restore();
  ctx.fill();

    // NEW: Body/Bulk terminal (right stub from center to x=+60)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + 60, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX + 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();


  // Label (2-line): "NMOS1" then "W:1 L:1"
  const raw = String(label ?? '').trim();

  // Split like: "NMOS1 w:1 L:1" -> name="NMOS1", dims="w:1 L:1"
  // Works for W:/w: and L:/l:
  const m = raw.match(/^(\S+)\s+((?:[wW]\s*:\s*[^ ]+)\s*(?:[lL]\s*:\s*[^ ]+).*)$/);
  const nameText = (m && m[1]) ? m[1] : raw;
  const dimsText = (m && m[2]) ? m[2].replace(/\s+/g, ' ').trim() : '';



   // Name line
  ctx.font = `${12}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'top';
  ctx.fillText(nameText, centerX + 4, centerY + 4);

  // Dims line (just below name)
  if (dimsText) {
    ctx.font = `${11}px sans-serif`;
    ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';
    ctx.fillText(dimsText, centerX + 4, centerY + 18);
  }

  ctx.restore();
}


// ✅ Terminal coordinate exporter for canvas.js
export function getNMOSTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },     // Gate
    { x: centerX, y: centerY - 60 },     // Drain
    { x: centerX, y: centerY + 60 },     // Source
    { x: centerX + 60, y: centerY },     // Body/Bulk (NEW)
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
