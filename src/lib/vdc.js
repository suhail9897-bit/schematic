export function drawVDC(ctx, x, y, scale = 1, label = 'VDC', isSelected = false, opts = {}) {
  ctx.save();
  ctx.translate(x, y);

  const strokeColor = isSelected ? 'yellow' : 'white';
  const fillColor = isSelected ? 'yellow' : '#ccc';
  const textColor = isSelected ? 'yellow' : 'white';
  const labelColor = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 2;

  // Left terminal dot
  ctx.beginPath();
  ctx.arc(-60, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Left wire
  ctx.strokeStyle = strokeColor;
  ctx.beginPath();
  ctx.moveTo(-59, 0);
  ctx.lineTo(-20, 0);
  ctx.stroke();

  // Circle body
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.strokeStyle = strokeColor;
  ctx.stroke();

  // + symbol
  ctx.fillStyle = textColor;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('+', -12, 6);

  // - symbol
  ctx.fillText('-', 12, 4);

 // --- Label compose (single line):
 // Names ON  -> "V1 (1 V)"
 // Names OFF -> "1 V"
 const showName  = opts?.showName !== false;                 // default: true
 const nameText  = showName ? (label || 'V1') : '';
 const valueText = (typeof opts?.valueText === 'string' && opts.valueText.trim())
                   ? opts.valueText.trim() : '';
 const finalText = nameText
   ? (valueText ? `${nameText} (${valueText})` : nameText)
   : valueText;

 ctx.font = '12px sans-serif';
 ctx.fillStyle = nameText ? labelColor : textColor;
 if (finalText) ctx.fillText(finalText, 0, 34);

  // Right wire
  ctx.strokeStyle = strokeColor;
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(59, 0);
  ctx.stroke();

  // Right terminal dot
  ctx.beginPath();
  ctx.arc(60, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.restore();
}


// ✅ Terminals coordinates helper
export function getVDCTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },
    { x: centerX + 60, y: centerY }
  ];
}


// --- VDC: view-model for UI ---
export function getVdcVMFor(comp) {
  if (!comp || comp.type !== 'vdc') return null;

  // Initialize once with safe defaults
  if (!comp.vdc) {
    // try to derive; fallbacks are fine
    let volts = 1.0;
    if (comp.value != null) {
      const m = String(comp.value).match(/[0-9]+(\.[0-9]+)?/);
      if (m) volts = Math.min(5, Math.max(0, parseFloat(m[0])));
    }
// getVdcVMFor(...)
let name = (comp.label || 'V1').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6) || 'V';
if (!name.startsWith('V')) name = 'V' + name;   // NEW
   comp.vdc   = { name, V: volts, value: volts }; // keep both V & value
   comp.value = String(volts);
   comp.label = name;  

  }

  return { name: comp.vdc.name, volts: comp.vdc.V };
}

// --- VDC: apply UI changes -> normalize, clamp, reflect on drawing/netlist ---
export function setVdcFromUIFor(comp, patch = {}) {
  if (!comp || comp.type !== 'vdc') return;
  const vm = getVdcVMFor(comp); // ensure defaults

  let name = vm.name;
  let volts = vm.volts;

 // setVdcFromUIFor(...)
if (typeof patch.name === 'string') {
  let n = patch.name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6);
  if (n) name = n.startsWith('V') ? n : 'V' + n;  // NEW
}
if (patch.volts != null) {
  let v = parseFloat(patch.volts);
  if (!Number.isFinite(v)) v = vm.volts;
  volts = Math.max(0, Math.min(5, v));           // already present
  volts = Math.round(volts * 1000) / 1000;       // tidy
}
  comp.vdc   = { name, V: volts, value: volts };   // keep both for netlist
  comp.value = String(volts);
  comp.label = name;  

}
