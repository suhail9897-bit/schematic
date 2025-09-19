export function drawDiode(ctx, centerX, centerY, scale = 1, label = '1N4148', isSelected = false) {
  ctx.save();
    ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 2 / scale;

  // Left terminal wire
  ctx.beginPath();
  ctx.moveTo(centerX - 60, centerY);
  ctx.lineTo(centerX - 15, centerY);
  ctx.stroke();

  // Right terminal wire
  ctx.beginPath();
  ctx.moveTo(centerX + 21, centerY);
  ctx.lineTo(centerX + 60, centerY);
  ctx.stroke();

  // Left terminal circle
  ctx.beginPath();
  ctx.arc(centerX - 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Right terminal circle
  ctx.beginPath();
  ctx.arc(centerX + 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Diode triangle body
  ctx.beginPath();
  ctx.moveTo(centerX - 15, centerY - 17); // left-top
  ctx.lineTo(centerX - 15, centerY + 17); // left-bottom
  ctx.lineTo(centerX + 20, centerY);      // tip
  ctx.closePath();
  ctx.stroke();

  // Diode vertical bar
  ctx.beginPath();
  ctx.moveTo(centerX + 21, centerY - 17);
  ctx.lineTo(centerX + 21, centerY + 17);
  ctx.stroke();

  // Label
  ctx.font = `${14 / scale}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, centerX, centerY - 20);

  ctx.restore();
}


// ✅ Terminals coordinates helper
export function getDiodeTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },
    { x: centerX + 60, y: centerY }
  ];
}


// lib/diode.js
// (drawDiode, getDiodeTerminals already present – unko rehne dijiye)

// ==== Units, ranges, helpers ====
export const AREA_UNITS = [
  { u: "mm²", f: 1e-6 },
  { u: "µm²", f: 1e-12 },
  { u: "nm²", f: 1e-18 },
];

export const DIODE_AREA_OPTIONS = {
  "mm²": [1e-6, 2e-6, 5e-6, 8e-6, 1e-5],
  "µm²": [10, 20, 50, 80, 100, 200, 500, 800, 1000, 2000, 5000, 8000, 10000],
  "nm²": [1e6, 2e6, 5e6, 8e6, 1e7, 2e7, 5e7, 8e7, 1e8],
};

export const DIODE_AREA_MIN_M2 = 1e-12;   // clamp safety
export const DIODE_AREA_MAX_M2 = 1e-5;

const nearest = (arr, x) =>
  arr.reduce((p, c) => (Math.abs(c - x) < Math.abs(p - x) ? c : p), arr[0]);

const unitByName = (u) => AREA_UNITS.find((x) => x.u === u) || AREA_UNITS[1]; // µm² default

// ==== Fixed defaults (VJ ~ 0.7V, BV ~ 6V) ====
export function getDiodeFixedDefaults() {
  return { barrierPotential: 0.7, breakdownVoltage: 6 };
}

export function ensureDiodeFixedFor(comp) {
  if (!comp || comp.type !== "diode") return;
  if (!comp.diodeFixed) comp.diodeFixed = getDiodeFixedDefaults();
}

// ==== Size params derived from area ====
export function computeDiodeSizeParams(areaM2) {
  // Baseline at A0 = 1e-8 m^2
  const A0 = 1e-8;
  const scale = areaM2 / A0;

  // Baseline: Is = 2.5e-9 A, Rs = 0.60 Ω, Cj = 4e-12 F
  const Is0 = 2.5e-9, Rs0 = 0.60, Cj0 = 4e-12;

  // Simple proportional model:
  const Is = Is0 * scale;      // ↑ with area
  const Cj = Cj0 * scale;      // ↑ with area
  const Rs = Rs0 / scale;      // ↓ with area

  return { area: areaM2, Is, Rs, Cj };
}

export function getDefaultDiodeArea() {
  return 1e-8; // same baseline used above
}

export function ensureDiodeSizeFor(comp) {
  if (!comp || comp.type !== "diode") return;
  if (!comp.diodeSize || !Number.isFinite(comp.diodeSize.area)) {
    comp.diodeSize = computeDiodeSizeParams(getDefaultDiodeArea());
  }
}

// ==== VM for UI ====
export function getDiodeAreaVMFor(comp) {
  if (!comp || comp.type !== "diode") return null;
  ensureDiodeSizeFor(comp);

  // current unit (or auto-pick µm²)
  const curU = comp.diodeSize?.unit || "µm²";
  const U = unitByName(curU);
  const mag = (comp.diodeSize.area || getDefaultDiodeArea()) / U.f;

  const allowed = DIODE_AREA_OPTIONS[U.u] || [];
  const magnitude = nearest(allowed.length ? allowed : [mag], mag);

  return {
    units: AREA_UNITS.map((x) => x.u),
    selectedUnit: U.u,
    allowed,          // list of allowed magnitudes for the selected unit
    magnitude,        // snapped choice
    min: Math.min(...allowed),
    max: Math.max(...allowed),
    step: 1,          // UI step is irrelevant; we snap anyway
  };
}

// ==== Apply change from UI ====
export function setDiodeAreaFromUIFor(comp, { unit, magnitude }) {
  if (!comp || comp.type !== "diode") return;
  ensureDiodeSizeFor(comp);

  const U = unitByName(unit);
  let mag = Number(magnitude);
  if (!Number.isFinite(mag)) mag = 0;

  const allowed = DIODE_AREA_OPTIONS[U.u] || [];
  const snapped = allowed.length ? nearest(allowed, mag) : mag;

  let areaM2 = snapped * U.f;
  areaM2 = Math.min(DIODE_AREA_MAX_M2, Math.max(DIODE_AREA_MIN_M2, areaM2));

  comp.diodeSize = { ...computeDiodeSizeParams(areaM2), unit: U.u, snapped };
}
