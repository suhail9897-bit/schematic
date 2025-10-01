// src/lib/nand.js

// === NAND Gate: draw + terminals + properties VM/Setter ===

/**
 * Draw a 2-input or 3-input NAND gate.
 * inputs count is taken from comp.nand?.inputs if 'comp' is passed; else defaults to 2.
 */
export function drawNAND(ctx, centerX, centerY, scale = 1, label = 'NAND', isSelected = false, comp = null) {
  const inputs = Math.max(2, Math.min(3, comp?.nand?.inputs ?? 2));

  ctx.save();
  ctx.strokeStyle = isSelected ? 'yellow' : 'white';
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.lineWidth = 1 / scale;

  // gate body (same as before, just using 36 radius)
  ctx.beginPath();
  ctx.moveTo(centerX - 40, centerY - 36);
  ctx.lineTo(centerX, centerY - 36);
  ctx.arc(centerX, centerY, 36, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(centerX - 40, centerY + 36);
  ctx.closePath();
  ctx.stroke();

  // output bubble
  ctx.beginPath();
  ctx.arc(centerX + 41.7, centerY, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fill();

  // input stubs (2 mandatory, 1 optional in middle)
  const lanes = inputs === 3 ? [-30, 0, +30] : [-30, +30];
  for (const yoff of lanes) {
    ctx.beginPath();
    ctx.moveTo(centerX - 60, centerY + yoff);
    ctx.lineTo(centerX - 40, centerY + yoff);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX - 60, centerY + yoff, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // output stub
  ctx.beginPath();
  ctx.moveTo(centerX + 45, centerY);
  ctx.lineTo(centerX + 60, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX + 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // label
  ctx.font = `${14}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, centerX, centerY - 10);
   // ▼ NEW: label के नीचे छोटा VDD/VSS टेक्स्ट (default + live)
  const vddTxt = (comp?.nand?.vddNet ?? 'VDD');
  const vssTxt = (comp?.nand?.vssNet ?? 'VSS');

  ctx.font = `${8}px sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = isSelected ? 'yellow' : '#9aa4b2';  // हल्का सा contrast
  // label के ठीक नीचे, गेट के अंदर
  ctx.fillText(`${vddTxt}   ${vssTxt}`, centerX, centerY + 2);

  ctx.restore();
}

/**
 * Terminals layout.
 * IMPORTANT: output is ALWAYS index 2 (stable for wiring).
 * For 2-input:  [in1, in2, out]
 * For 3-input:  [in1, in2, out, in3]  // output stays at index 2 to preserve wires
 */
// nand.js
// IMPORTANT: output index 2 remains stable.
// ✅ relative-form; output always at idx 2
export function getNANDTerminals(inputs = 2) {
  const terms = [
    { x: -60, y: -30 }, // in1  (0)
    { x: -60, y:  30 }, // in2  (1)
    { x:  60, y:   0 }, // out  (2)  <-- fixed index
  ];
  if (inputs === 3) terms.push({ x: -60, y: 0 }); // in3 (3)
  return terms;
}



// ---------- Properties VM / Setter ----------

const CLAMP = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toInt = (v, lo, hi) => CLAMP(Math.round(Number(v) || 0), lo, hi);
const toNum = (v, lo, hi) => CLAMP(Number(v) || 0, lo, hi);

const MAX_LABEL_LEN = 12;
const sanitizeLabel = (s = "") =>
  String(s).replace(/\s+/g, "").slice(0, MAX_LABEL_LEN);

/**
 * View-Model for properties panel
 * Units: L, Wn, Wp in µm; m is unitless; inputs ∈ {2,3}
 */
export function getNandVMFor(comp) {
  if (!comp) return null;
  const n = comp.nand || {};
  return {
    name: comp.label || "NAND",
    inputs: (n.inputs === 3 ? 3 : 2),
    Wn: Number.isFinite(n.Wn) ? n.Wn : 1,   // µm
    Wp: Number.isFinite(n.Wp) ? n.Wp : 2,   // µm
    L:  Number.isFinite(n.L)  ? n.L  : 1,   // µm
    m:  Number.isFinite(n.m)  ? n.m  : 1,   // parallel fingers
    vddNet: n.vddNet || "VDD",
    vssNet: n.vssNet || "VSS",
    // ranges for UI
    ranges: {
      L:  { min: 0.05, max: 1000, step: 0.01 },
      W:  { min: 0.05, max: 10000, step: 0.01 },
      m:  { min: 1,    max: 64,   step: 1 },
      inputs: [2, 3],
    },
  };
}

/**
 * Apply UI patch to component.
 * patch: { name?, inputs?, Wn?, Wp?, L?, m? }
 * Keeps output terminal index = 2 fixed when changing input count.
 */
export function setNandFromUIFor(comp, patch = {}) {
  if (!comp) return;

  // ensure nand bag
  if (!comp.nand) {
   comp.nand = { inputs: 2, Wn: 1, Wp: 2, L: 1, m: 1, vddNet: "VDD", vssNet: "VSS" };
  }

  if (typeof patch.name !== "undefined") {
    comp.label = sanitizeLabel(patch.name);
  }

    // NEW: power/ground from Nets/Ports tab
  if (typeof patch.vddNet !== "undefined") {
    const s = String(patch.vddNet || '').trim();
    comp.nand.vddNet = s || "VDD";
  }
  if (typeof patch.vssNet !== "undefined") {
    const s = String(patch.vssNet || '').trim();
    comp.nand.vssNet = s || "VSS";
  }


  // numeric fields (µm for L/W; unitless m)
  if (typeof patch.Wn !== "undefined") comp.nand.Wn = toNum(patch.Wn, 0.05, 10000);
  if (typeof patch.Wp !== "undefined") comp.nand.Wp = toNum(patch.Wp, 0.05, 10000);
  if (typeof patch.L  !== "undefined") comp.nand.L  = toNum(patch.L,  0.05, 1000);
  if (typeof patch.m  !== "undefined") comp.nand.m  = toInt(patch.m,  1,    256);
   // NEW: power/ground from Nets/Ports tab
 if (typeof patch.vddNet === "string" || typeof patch.powerNet === "string") {
   comp.nand.vddNet = (patch.vddNet ?? patch.powerNet).trim();
 }
 if (typeof patch.vssNet === "string" || typeof patch.groundNet === "string") {
   comp.nand.vssNet = (patch.vssNet ?? patch.groundNet).trim();
 }

  // inputs (2 or 3) — keep output at index 2, preserve existing net labels on 0,1,2
  if (typeof patch.inputs !== "undefined") {
    const newInputs = (Number(patch.inputs) === 3) ? 3 : 2;
    const oldTerms = comp.terminals || [];
    const old0 = oldTerms[0]?.netLabel;
    const old1 = oldTerms[1]?.netLabel;
    const oldOut = oldTerms[2]?.netLabel;
    const old3 = oldTerms[3]?.netLabel;

    comp.nand.inputs = newInputs;
    comp.terminals = getNANDTerminals(newInputs);

    // restore net labels for stable indices
    if (old0) comp.terminals[0].netLabel = old0;
    if (old1) comp.terminals[1].netLabel = old1;
    if (oldOut) comp.terminals[2].netLabel = oldOut;

    // if we now have in3, try to keep previous if existed
    if (newInputs === 3 && old3) {
      comp.terminals[3].netLabel = old3;
    }
  }

  return comp;
}
