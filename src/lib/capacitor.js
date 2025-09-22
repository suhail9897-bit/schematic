export function drawCapacitor(
  ctx,
  centerX,
  centerY,
  scale = 1,
  text = '10µF',
  isSelected = false
) {
  ctx.save();
    ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 1 / scale;
  

  // Left terminal wire
  ctx.beginPath();
  ctx.moveTo(centerX - 56, centerY);
  ctx.lineTo(centerX - 9, centerY);
  ctx.stroke();

  // Right terminal wire
  ctx.beginPath();
  ctx.moveTo(centerX + 9, centerY);
  ctx.lineTo(centerX + 56, centerY);
  ctx.stroke();

  // Terminal circles
  ctx.beginPath();
  ctx.arc(centerX - 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX + 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Capacitor plates
  ctx.beginPath();
  ctx.moveTo(centerX - 8, centerY - 20);
  ctx.lineTo(centerX - 8, centerY + 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + 8, centerY - 20);
  ctx.lineTo(centerX + 8, centerY + 20);
  ctx.stroke();

  // Label text (composed label + value)
  ctx.font = `${14 / scale}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, centerX, centerY - 24);

  ctx.restore();
}


// ✅ Terminals coordinates helper for capacitor
export function getCapacitorTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },  // Left terminal
    { x: centerX + 60, y: centerY }   // Right terminal
  ];
}


// ===== Value/Properties (moved from canvas.js) =====
export const CAP_UNITS = [
  { u: "fF", f: 1e-15 }, { u: "pF", f: 1e-12 }, { u: "nF", f: 1e-9 },
  { u: "µF", f: 1e-6 },  { u: "mF", f: 1e-3 },  { u: "F",  f: 1 },
  { u: "kF", f: 1e3 },   { u: "MF", f: 1e6 },   { u: "GF", f: 1e9 },
  { u: "TF", f: 1e12 },
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const stripZeros = (n) =>
  String(+(+n).toFixed(2)).replace(/\.00$/, "").replace(/(\.\d*[1-9])0$/, "$1");
const _capUnitByName = (name) =>
  CAP_UNITS.find((x) => x.u === name) || CAP_UNITS[5]; // "F"

// VM for UI (pure)
export function getCapValueVMFor(comp) {
  if (!comp || comp.type !== "capacitor") return null;

  let unit = comp.valueMeta?.unit;
  if (!unit) {
    unit = CAP_UNITS.reduce((best, u) => {
      const mag = Number(comp.value) / u.f;
      if (mag >= 1 && mag < 1000) return u.u;
      return best || "F";
    }, null);
  }
  const U = _capUnitByName(unit);

  let magnitude = comp.valueMeta?.magnitude;
  if (magnitude == null) {
    const base = Number(comp.value) / U.f;
    magnitude = Number.isFinite(base) ? base : 0;
  }

  return {
    units: CAP_UNITS.map((x) => x.u),
    selectedUnit: U.u,
    magnitude: +Number(magnitude).toFixed(2),
    min: 0,
    max: 999.99,
    step: 0.01,
  };
}

// Setter from UI (pure mutator)
export function setCapValueFromUIFor(comp, { unit, magnitude }) {
  if (!comp || comp.type !== "capacitor") return;

  let mag = Number(magnitude);
  if (!Number.isFinite(mag)) return;
  mag = clamp(mag, 0, 999.99);

  const U = _capUnitByName(unit);
  comp.value = mag * U.f;                          // base Farads
  comp.valueMeta = { unit: U.u, magnitude: +mag }; // remember UI choice
}

// Label formatter used by engine draw/labels
export function capValueLabel(comp) {
  const strip = (n) => String(+(+n).toFixed(2)).replace(/\.00$/,'').replace(/(\.\d*[1-9])0$/,'$1');
  if (comp?.valueMeta?.unit) return `${strip(comp.valueMeta.magnitude)}${comp.valueMeta.unit}`;
  if (typeof comp?.value === "string") return comp.value;  // back-compat
  if (typeof comp?.value === "number") return strip(comp.value) + "F";
  return "";
}
