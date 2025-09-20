export function drawNOT(ctx, centerX, centerY, scale = 1, label = 'NOT', isSelected = false) {
  ctx.save();
   ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 2 / scale;
 

  // 🔷 Triangle points
  ctx.beginPath();
  ctx.moveTo(centerX - 25, centerY - 22); // top corner
  ctx.lineTo(centerX - 25, centerY + 22); // bottom corner
  ctx.lineTo(centerX + 15, centerY);      // tip
  ctx.closePath();
  ctx.stroke();
  

  // 🔵 Inverter bubble
  ctx.beginPath();
  ctx.arc(centerX + 20, centerY, 4, 0, Math.PI * 2);
  ctx.stroke();
  

  // 🔌 Input terminal line
  ctx.beginPath();
  ctx.moveTo(centerX - 60, centerY);
  ctx.lineTo(centerX - 25, centerY);
  ctx.stroke();

  // ⭕ Input terminal circle
  ctx.beginPath();
  ctx.arc(centerX - 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // 🔌 Output terminal line
  ctx.beginPath();
  ctx.moveTo(centerX + 24, centerY);
  ctx.lineTo(centerX + 59, centerY);
  ctx.stroke();
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  // ⭕ Output terminal circle
  ctx.beginPath();
  ctx.arc(centerX + 60, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // 🏷️ Label
  ctx.font = `${10}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, centerX + 2, centerY - 18);

  ctx.restore();
}


export function getNOTTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },
    { x: centerX + 60, y: centerY }
  ];
}

// bottom/top par add/merge:
export function getNotVMFor(comp) {
  if (!comp.not) {
    comp.not = { Wp: 2, Wn: 1, L: 1, m: 1 }; // µm, µm, µm, unitless
  }
  const { Wp, Wn, L, m } = comp.not;
  return {
    label: comp.label || 'NOT',
    Wp: Number(Wp) || 2,
    Wn: Number(Wn) || 1,
    L:  Number(L)  || 1,
    m:  Math.max(1, Math.min(64, Number(m) || 1)), // clamp 1..64
  };
}

export function setNotFromUIFor(comp, patch = {}) {
  if (!comp.not) comp.not = { Wp: 2, Wn: 1, L: 1, m: 1 };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v)));
  const clampInt = (v, lo, hi) => Math.round(clamp(v, lo, hi));

  if (patch.Wp != null) comp.not.Wp = clamp(patch.Wp, 0.01, 100);
  if (patch.Wn != null) comp.not.Wn = clamp(patch.Wn, 0.01, 100);
  if (patch.L  != null) comp.not.L  = clamp(patch.L,  0.01, 100);
  if (patch.m  != null) comp.not.m  = clampInt(patch.m, 1, 64);

  // terminals fixed: [0]=IN, [1]=OUT — count kabhi change nahi karna
  if (!Array.isArray(comp.terminals) || comp.terminals.length !== 2) {
    // engine create time pe set hoti hain; yaha safety ke liye enforce
    comp.terminals = [
      { x: -60, y: 0, netLabel: comp.terminals?.[0]?.netLabel || 'net1' },
      { x:  60, y: 0, netLabel: comp.terminals?.[1]?.netLabel || 'net2' },
    ];
  }
}
