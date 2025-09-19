export function drawResistor(ctx, centerX, centerY, scale = 1, text = '1Ω', isSelected = false) {
  ctx.save();

    ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 2 / scale;
  

  // Left terminal line
  ctx.beginPath();
  ctx.moveTo(centerX - 56, centerY);
  ctx.lineTo(centerX - 35, centerY);
  ctx.stroke();

  // Right terminal line
  ctx.beginPath();
  ctx.moveTo(centerX + 35, centerY);
  ctx.lineTo(centerX + 56, centerY);
  ctx.stroke();

  // Left terminal circle
  ctx.beginPath();
  ctx.arc(centerX - 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Right terminal circle
  ctx.beginPath();
  ctx.arc(centerX + 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Resistor zigzag
  ctx.beginPath();
  ctx.moveTo(centerX - 35, centerY);
  ctx.lineTo(centerX - 30, centerY - 10);
  ctx.lineTo(centerX - 20, centerY + 10);
  ctx.lineTo(centerX - 10, centerY - 10);
  ctx.lineTo(centerX, centerY + 10);
  ctx.lineTo(centerX + 10, centerY - 10);
  ctx.lineTo(centerX + 20, centerY + 10);
  ctx.lineTo(centerX + 30, centerY - 10);
  ctx.lineTo(centerX + 35, centerY);
  ctx.stroke();

  // Label text (now composed label + value)
  ctx.font = `${12 / scale}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, centerX, centerY - 15);

  ctx.restore();
}



// ✅ Terminals coordinates helper
export function getResistorTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },
    { x: centerX + 60, y: centerY }
  ];
}


// ===== Value/Properties logic (moved out of canvas.js) =====
export const RES_UNITS = [
  { u: "fΩ", f: 1e-15 }, { u: "pΩ", f: 1e-12 }, { u: "nΩ", f: 1e-9 },
  { u: "µΩ", f: 1e-6 },  { u: "mΩ", f: 1e-3 },  { u: "Ω",  f: 1 },
  { u: "kΩ", f: 1e3 },   { u: "MΩ", f: 1e6 },   { u: "GΩ", f: 1e9 },
  { u: "TΩ", f: 1e12 },
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const stripZeros = (n) =>
  String(+(+n).toFixed(2)).replace(/\.00$/,'').replace(/(\.\d*[1-9])0$/,'$1');
const _resUnitByName = (name) =>
  RES_UNITS.find(x => x.u === name) || RES_UNITS[5]; // "Ω"

export function getResValueVMFor(comp) {
  if (!comp || comp.type !== "resistor") return null;

  let unit = comp.valueMeta?.unit;
  if (!unit) {
    unit = RES_UNITS.reduce((best, u) => {
      const mag = Number(comp.value) / u.f;
      if (mag >= 1 && mag < 1000) return u.u;
      return best || "Ω";
    }, null);
  }
  const U = _resUnitByName(unit);

  let magnitude = comp.valueMeta?.magnitude;
  if (magnitude == null) {
    const base = Number(comp.value) / U.f;
    magnitude = Number.isFinite(base) ? base : 0;
  }

  return {
    units: RES_UNITS.map(x => x.u),
    selectedUnit: U.u,
    magnitude: +Number(magnitude).toFixed(2),
    min: 0, max: 999.99, step: 0.01,
  };
}

export function setResValueFromUIFor(comp, { unit, magnitude }) {
  if (!comp || comp.type !== "resistor") return;

  let mag = Number(magnitude);
  if (!Number.isFinite(mag)) return;
  mag = clamp(mag, 0, 999.99);

  const U = _resUnitByName(unit);
  comp.value = mag * U.f;                     // base ohms
  comp.valueMeta = { unit: U.u, magnitude: +mag }; // remember UI choice
}

export function resValueLabel(comp) {
  if (comp?.valueMeta?.unit) {
    return `${stripZeros(comp.valueMeta.magnitude)}${comp.valueMeta.unit}`;
  }
  if (typeof comp?.value === "string") return comp.value; // back-compat
  if (typeof comp?.value === "number") return stripZeros(comp.value) + "Ω";
  return "";
}
