// src/lib/xor.js

// === XOR draw (2 or 3 inputs) ===
export function drawXOR(ctx, cx, cy, scale = 1, label = 'XOR', isSelected = false, comp = null) {
  const inputs = Math.max(2, Math.min(3, comp?.xor?.inputs ?? 2));

  ctx.save();
  ctx.lineWidth   = 2 / scale;
  ctx.strokeStyle = isSelected ? 'yellow' : 'white';
  ctx.fillStyle   = isSelected ? 'yellow' : '#ccc';

  const w = 80, h = 70;
  const leftX = cx - w/2, rightX = cx + w/2, topY = cy - h/2, botY = cy + h/2;

  // back XOR arc
  ctx.beginPath();
  ctx.moveTo(leftX - 6, topY);
  ctx.quadraticCurveTo(cx - 32, cy, leftX - 6, botY);
  ctx.stroke();

  // front OR body
  ctx.beginPath();
  ctx.moveTo(leftX, topY);
  ctx.quadraticCurveTo(cx - 25, cy, leftX, botY);                // ← left boundary
  ctx.quadraticCurveTo(cx + 25, cy + 35, rightX, cy);
  ctx.quadraticCurveTo(cx + 25, cy - 35, leftX, topY);
  ctx.stroke();

  // inputs: lanes [-30, +30] or [-30, 0, +30]; stub must TOUCH the BACK (first) XOR arc
  const lanes = inputs === 3 ? [-30, 0, +30] : [-30, +30];
  for (const yoff of lanes) {
    
   // BACK arc bezier: P0=(leftX-6, topY), P1=(cx-32, cy), P2=(leftX-6, botY)
    const t = (yoff + (h/2)) / h; // t∈[0..1] for given lane y
    const xBack  = (leftX-6)*(1-t)*(1-t) + 2*(1-t)*t*(cx-32) + (leftX-6)*t*t;
    const xTouch = xBack - 1; // 1px inset to avoid overdraw on the arc
    // stub + pad
    ctx.beginPath();
    ctx.moveTo(leftX - 20, cy + yoff);
    ctx.lineTo(xTouch,     cy + yoff);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(leftX - 20, cy + yoff, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // output stub + pad
  ctx.beginPath();
  ctx.moveTo(rightX, cy);
  ctx.lineTo(rightX + 20, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rightX + 20, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  // label
  ctx.font = `${14}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, cx, cy - 6);
   // ▼ NEW: label ke niche VDD / VSS (default + live from Nets/Ports)
  const vddTxt = (comp?.xor?.vddNet ?? 'VDD');
  const vssTxt = (comp?.xor?.vssNet ?? 'VSS');

  ctx.font = `${8}px sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = isSelected ? 'yellow' : '#9aa4b2';
  ctx.fillText(`${vddTxt}   ${vssTxt}`, cx, cy + 2);

  ctx.restore();
}

// === terminals (RELATIVE). Output idx = 2 fixed.
export function getXORTerminals(inputs = 2) {
  const t = [
    { x: -60, y: -30 }, // in1 (0)
    { x: -60, y:  30 }, // in2 (1)
    { x:  60, y:   0 }, // out (2)
  ];
  if (inputs === 3) t.push({ x: -60, y: 0 }); // in3 (3)
  return t;
}

// ---- Properties VM + setter (same style as NAND/NOR) ----
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const toInt = (v, a, b) => clamp(Math.round(Number(v) || 0), a, b);
const toNum = (v, a, b) => clamp(Number(v) || 0, a, b);
const MAX_LABEL = 12;
const sanitize = s => String(s || '').replace(/\s+/g,'').slice(0, MAX_LABEL);

export function getXorVMFor(comp) {
  if (!comp) return null;
  const x = comp.xor || {};
  return {
    name: comp.label || 'XOR',
    inputs: (x.inputs === 3 ? 3 : 2),
    Wn: Number.isFinite(x.Wn) ? x.Wn : 1,    // µm
    Wp: Number.isFinite(x.Wp) ? x.Wp : 2,    // µm
    L:  Number.isFinite(x.L)  ? x.L  : 1,    // µm
    m:  Number.isFinite(x.m)  ? x.m  : 1,    // –
    vddNet: (x.vddNet || "VDD"),
    vssNet: (x.vssNet || "VSS"),

    ranges: {
      W: { min: 0.05, max: 10000, step: 0.01 },
      L: { min: 0.05, max: 1000,  step: 0.01 },
      m: { min: 1,    max: 64,    step: 1 }, // UI cap; engine can allow up to 256 if needed
      inputs: [2,3],
    }
  };
}

export function setXorFromUIFor(comp, patch = {}) {
  if (!comp) return;
  if (!comp.xor) comp.xor = { inputs: 2, Wn: 1, Wp: 2, L: 1, m: 1 };

  if (patch.name !== undefined) comp.label = sanitize(patch.name);
  if (patch.Wn   !== undefined) comp.xor.Wn = toNum(patch.Wn, 0.05, 10000);
  if (patch.Wp   !== undefined) comp.xor.Wp = toNum(patch.Wp, 0.05, 10000);
  if (patch.L    !== undefined) comp.xor.L  = toNum(patch.L,  0.05, 1000);
  if (patch.m    !== undefined) comp.xor.m  = toInt(patch.m,  1,    256); // engine cap

  if (typeof patch.vddNet === "string" || typeof patch.powerNet === "string") {
  comp.xor.vddNet = (patch.vddNet || patch.powerNet).trim(); // "" allowed
  }
  if (typeof patch.vssNet === "string" || typeof patch.groundNet === "string") {
  comp.xor.vssNet = (patch.vssNet || patch.groundNet).trim(); // "" allowed
  }


  if (patch.inputs !== undefined) {
    const newInputs = (Number(patch.inputs) === 3) ? 3 : 2;

    const old = comp.terminals || [];
    const in0  = old[0]?.netLabel, in1 = old[1]?.netLabel, out = old[2]?.netLabel, in3 = old[3]?.netLabel;

    comp.xor.inputs = newInputs;
    comp.terminals = getXORTerminals(newInputs);

    if (in0) comp.terminals[0].netLabel = in0;
    if (in1) comp.terminals[1].netLabel = in1;
    if (out) comp.terminals[2].netLabel = out;
    if (newInputs === 3 && in3) comp.terminals[3].netLabel = in3;
  }
  return comp;
}
