// src/lib/nor.js

// === NOR: draw ===
export function drawNOR(ctx, centerX, centerY, scale = 1, label = 'NOR', isSelected = false, comp = null) {
  const inputs = Math.max(2, Math.min(3, comp?.nor?.inputs ?? 2));

  ctx.save();
  ctx.strokeStyle = isSelected ? 'yellow' : 'white';
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.lineWidth = 2 / scale;

  // Body
  ctx.beginPath();
  ctx.moveTo(centerX - 40, centerY - 40);
  ctx.quadraticCurveTo(centerX - 25, centerY, centerX - 40, centerY + 40);
  ctx.quadraticCurveTo(centerX + 5, centerY + 40, centerX + 25, centerY);
  ctx.quadraticCurveTo(centerX + 5, centerY - 40, centerX - 40, centerY - 40);
  ctx.stroke();

  // Bubble (inversion)
  ctx.beginPath();
  ctx.arc(centerX + 30, centerY, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fill();

  // Output stub
  ctx.beginPath();
  ctx.moveTo(centerX + 35, centerY);
  ctx.lineTo(centerX + 59, centerY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX + 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Inputs: lanes (-30, +30) or (-30, 0, +30)
  // Line end must touch the left Bézier boundary of NOR body.
  // Left boundary is quadratic Bezier:
  // P0 = (-40, -40), P1 = (-25, 0), P2 = (-40, +40)  (relative to center)
  // For a given yoff, t = (yoff + 40) / 80, and x = -40 + 30 * t * (1 - t)
  const lanes = inputs === 3 ? [-30, 0, +30] : [-30, +30];
  for (const yoff of lanes) {
    const t = (yoff + 40) / 80;
    const xRelOnCurve = -40 + 30 * t * (1 - t);   // relative X where the curve sits at yoff
    const xTouch = centerX + xRelOnCurve - 1;     // tiny inset (-1) to avoid overdraw

    ctx.beginPath();
    ctx.moveTo(centerX - 60, centerY + yoff);
    ctx.lineTo(xTouch,       centerY + yoff);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX - 60, centerY + yoff, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label
  ctx.font = `${12}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, centerX - 10, centerY - 8);
  // ▼ NEW: NOR ke label ke niche VDD / VSS show (default + live)
  const vddTxt = (comp?.nor?.vddNet ?? 'VDD');
  const vssTxt = (comp?.nor?.vssNet ?? 'VSS');

  ctx.font = `${8}px sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = isSelected ? 'yellow' : '#9aa4b2';
  ctx.fillText(`${vddTxt}   ${vssTxt}`, centerX - 10, centerY + 2);
  ctx.restore();
}

// === NOR: relative terminals; output at idx 2 ===
export function getNORTerminals(inputs = 2) {
  const list = [
    { x: -60, y: -30 }, // in1  (0)
    { x: -60, y:  30 }, // in2  (1)
    { x:  60, y:   0 }, // out  (2)
  ];
  if (inputs === 3) list.push({ x: -60, y: 0 }); // in3 (3)
  return list;
}

// ---------- Properties VM / Setter ----------
const CLAMP = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toInt = (v, lo, hi) => CLAMP(Math.round(Number(v) || 0), lo, hi);
const toNum = (v, lo, hi) => CLAMP(Number(v) || 0, lo, hi);
const MAX_LABEL_LEN = 12;
const sanitizeLabel = (s = "") => String(s).replace(/\s+/g, "").slice(0, MAX_LABEL_LEN);

export function getNorVMFor(comp) {
  if (!comp) return null;
  const n = comp.nor || {};
  return {
    name: comp.label || "NOR",
    inputs: (n.inputs === 3 ? 3 : 2),
    Wn: Number.isFinite(n.Wn) ? n.Wn : 1,   // µm
    Wp: Number.isFinite(n.Wp) ? n.Wp : 2,   // µm
    L:  Number.isFinite(n.L)  ? n.L  : 1,   // µm
    m:  Number.isFinite(n.m)  ? n.m  : 1,   // unitless
    vddNet: (n.vddNet || "VDD"),
    vssNet: (n.vssNet || "VSS"),

    ranges: {
      L:  { min: 0.05, max: 1000,  step: 0.01 },
      W:  { min: 0.05, max: 10000, step: 0.01 },
      m:  { min: 1,    max: 64,    step: 1 },   // UI cap
      inputs: [2, 3],
    },
  };
}

export function setNorFromUIFor(comp, patch = {}) {
  if (!comp) return;
  if (!comp.nor) comp.nor = { inputs: 2, Wn: 1, Wp: 2, L: 1, m: 1, vddNet: "VDD", vssNet: "VSS" };

  if (typeof patch.name !== "undefined") comp.label = sanitizeLabel(patch.name);
  if (typeof patch.Wn  !== "undefined") comp.nor.Wn = toNum(patch.Wn, 0.05, 10000);
  if (typeof patch.Wp  !== "undefined") comp.nor.Wp = toNum(patch.Wp, 0.05, 10000);
  if (typeof patch.L   !== "undefined") comp.nor.L  = toNum(patch.L,  0.05, 1000);
  if (typeof patch.m   !== "undefined") comp.nor.m  = toInt(patch.m,  1,    256); // engine cap
  
// NEW: power/ground from Nets/Ports tab
if (typeof patch.vddNet === "string" || typeof patch.powerNet === "string") {
  comp.nor.vddNet = (patch.vddNet || patch.powerNet).trim();
}
if (typeof patch.vssNet === "string" || typeof patch.groundNet === "string") {
  comp.nor.vssNet = (patch.vssNet || patch.groundNet).trim();
}



  if (typeof patch.inputs !== "undefined") {
    const newInputs = (Number(patch.inputs) === 3) ? 3 : 2;

    const oldTerms = comp.terminals || [];
    const old0 = oldTerms[0]?.netLabel;
    const old1 = oldTerms[1]?.netLabel;
    const oldOut = oldTerms[2]?.netLabel;
    const old3 = oldTerms[3]?.netLabel;

    comp.nor.inputs = newInputs;
    comp.terminals = getNORTerminals(newInputs);

    if (old0)   comp.terminals[0].netLabel = old0;
    if (old1)   comp.terminals[1].netLabel = old1;
    if (oldOut) comp.terminals[2].netLabel = oldOut;
    if (newInputs === 3 && old3) comp.terminals[3].netLabel = old3;
  }
  return comp;
}
