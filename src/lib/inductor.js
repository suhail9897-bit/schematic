export function drawInductor(ctx, centerX, centerY, scale = 1, text = '10mH', isSelected = false) {
  ctx.save();
    ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 1 / scale;
  

  // Left terminal wire
  ctx.beginPath();
  ctx.moveTo(centerX - 56, centerY);
  ctx.lineTo(centerX - 33, centerY);
  ctx.stroke();

  // Right terminal wire
  ctx.beginPath();
  ctx.moveTo(centerX + 33, centerY);
  ctx.lineTo(centerX + 56, centerY);
  ctx.stroke();

  // Terminal circles
  ctx.beginPath();
  ctx.arc(centerX - 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX + 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Inductor arcs (3 loops exactly as in JSX)
  const arcCenters = [-22, 0, 22];
  for (let xOffset of arcCenters) {
    ctx.beginPath();
    ctx.arc(centerX + xOffset, centerY, 11, Math.PI, 0, false);
    ctx.stroke();
  }

  // Label above (same place you already had)
  ctx.font = `${14 / scale}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, centerX, centerY - 18);

  ctx.restore();
}


// ✅ Terminals coordinates helper for inductor
export function getInductorTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },
    { x: centerX + 60, y: centerY }
  ];
}


// ===== Value/Properties logic (moved out of canvas.js) =====
export const IND_UNITS = [
  { u: "fH", f: 1e-15 }, { u: "pH", f: 1e-12 }, { u: "nH", f: 1e-9 },
  { u: "µH", f: 1e-6 },  { u: "mH", f: 1e-3 },  { u: "H",  f: 1 },
  { u: "kH", f: 1e3 },   { u: "MH", f: 1e6 },   { u: "GH", f: 1e9 },
  { u: "TH", f: 1e12 },
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const stripZeros = (n) =>
  String(+(+n).toFixed(2)).replace(/\.00$/,'').replace(/(\.\d*[1-9])0$/,'$1');

const _indUnitByName = (name) =>
  IND_UNITS.find(x => x.u === name) || IND_UNITS[5]; // "H"

export function getIndValueVMFor(comp) {
  if (!comp || comp.type !== "inductor") return null;

  let unit = comp.valueMeta?.unit;
  if (!unit) {
    unit = IND_UNITS.reduce((best, u) => {
      const mag = Number(comp.value) / u.f;
      if (mag >= 1 && mag < 1000) return u.u;
      return best || "H";
    }, null);
  }
  const U = _indUnitByName(unit);

  let magnitude = comp.valueMeta?.magnitude;
  if (magnitude == null) {
    const base = Number(comp.value) / U.f;
    magnitude = Number.isFinite(base) ? base : 0;
  }

  return {
    units: IND_UNITS.map(x => x.u),
    selectedUnit: U.u,
    magnitude: +Number(magnitude).toFixed(2),
    min: 0, max: 999.99, step: 0.01,
  };
}

export function setIndValueFromUIFor(comp, { unit, magnitude }) {
  if (!comp || comp.type !== "inductor") return;

  let mag = Number(magnitude);
  if (!Number.isFinite(mag)) return;
  mag = clamp(mag, 0, 999.99);

  const U = _indUnitByName(unit);
  comp.value = mag * U.f;                           // base Henry
  comp.valueMeta = { unit: U.u, magnitude: +mag };  // remember UI choice
}

export function indValueLabel(comp) {
  const strip = (n) => String(+(+n).toFixed(2)).replace(/\.00$/,'').replace(/(\.\d*[1-9])0$/,'$1');
  if (comp?.valueMeta?.unit) return `${strip(comp.valueMeta.magnitude)}${comp.valueMeta.unit}`;
  if (typeof comp?.value === "string") return comp.value;
  if (typeof comp?.value === "number") return strip(comp.value) + "H";
  return "";
}
