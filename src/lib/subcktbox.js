// Dynamic sized subcircuit "box" with grid-aligned stubs.

// ----- geometry helpers -----
function measureBox(comp, grid) {
  const g = grid || 30;
  const nIn  = (comp?.subckt?.inputs || []).length;
  const nTop = (comp?.subckt?.powers || []).length;
  const outs = Array.isArray(comp?.subckt?.outputs) ? comp.subckt.outputs : [];
  const out0 = String(comp?.subckt?.output || "").trim();
  const nOut = outs.length ? outs.length : (out0 ? 1 : 0);
  const nBot = (comp?.subckt?.grounds || []).length;

  // Height driven primarily by inputs; width by max of supplies
  const pinStep = g;                             // vertical spacing between pins
  const minBodyH = 4 * g;                        // minimum box body height
  const minBodyW = 8 * g;                        // minimum body width

  const nIO = Math.max(nIn, nOut);
  const bodyH = Math.max(minBodyH, (nIO + 2) * pinStep);

  // NEW: keep constant center-to-center spacing = 2*g for top/bottom stubs
const stubStep = 2 * g;                                // ← uniform horizontal step
const maxStubs = Math.max(nTop, nBot);
const neededSpan = maxStubs > 1 ? (maxStubs - 1) * stubStep : 0; // first→last center span
const innerPad = 4 * g;                                // left+right inner margin
const bodyW = Math.max(minBodyW, neededSpan + innerPad);

  const halfW = Math.round(bodyW / 2 / g) * g;
  const halfH = Math.round(bodyH / 2 / g) * g;

  return { g, nIn, nOut, nTop, nBot, bodyW, bodyH, halfW, halfH, pinStep, stubStep };
}



export function getSubcktBoxTerminals(comp, grid) {
  const { g, nIn, nOut, nTop, nBot, halfW, halfH, bodyW, pinStep, stubStep } = measureBox(comp, grid);


  const terms = [];

  // LEFT inputs: terminals at the end of outer stub
  const y0 = -Math.floor(nIn / 2) * pinStep;
  for (let i = 0; i < nIn; i++) {
    const y = y0 + i * pinStep;
    terms.push({ x: -halfW - g, y, netLabel: "" , terminalSpace: 'local' });
  }

  // RIGHT outputs
  const yOut0 = -Math.floor(nOut / 2) * pinStep;
  for (let i = 0; i < nOut; i++) {
    const y = yOut0 + i * pinStep;
    terms.push({ x: halfW + g, y, netLabel: "", terminalSpace: "local" });
  }


  // TOP powers (spread across width)
// NEW (uniform 2*g spacing, centered)
const startTop = -((nTop - 1) * stubStep) / 2;
for (let i = 0; i < nTop; i++) {
  const x = startTop + i * stubStep;
  const snapX = Math.round(x / g) * g;
  terms.push({ x: snapX, y: -halfH - g, netLabel: "", terminalSpace: "local" });
}

  // BOTTOM grounds
 const startBot = -((nBot - 1) * stubStep) / 2;
for (let i = 0; i < nBot; i++) {
  const x = startBot + i * stubStep;
  const snapX = Math.round(x / g) * g;
  terms.push({ x: snapX, y: halfH + g, netLabel: "", terminalSpace: "local" });
}

  return terms;
}

// ----- drawing -----
export function drawSubcktBox(ctx, cx, cy, scale, comp, isSelected, grid, showCellName = true) {
  const { g, nIn, nOut, nTop, nBot, bodyW, bodyH, halfW, halfH, pinStep, stubStep } =
  measureBox(comp, grid);


  const name    = String(comp?.subckt?.name || comp?.label || 'BLOCK');
  const inputs  = comp?.subckt?.inputs  || [];
let outputsArr = (Array.isArray(comp?.subckt?.outputs) ? comp.subckt.outputs : [])
  .map(s => String(s || "").trim())
  .filter(Boolean);

const out0 = String(comp?.subckt?.output || "").trim();
if (!outputsArr.length && out0) outputsArr = [out0];

  const powers  = comp?.subckt?.powers  || [];
  const grounds = comp?.subckt?.grounds || [];

  // MAIN BODY
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = 2 / scale;
  ctx.strokeStyle = isSelected ? '#ffd54f' : '#ffffff';
  ctx.fillStyle = 'rgba(0,0,0,0.0)';
  ctx.strokeRect(-halfW, -halfH, 2 * halfW, bodyH);

  // LEFT stub lines + inside labels
  ctx.font = `${12}px sans-serif`;
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';

  const y0 = -Math.floor(nIn / 2) * pinStep;
  for (let i = 0; i < nIn; i++) {
    const y = y0 + i * pinStep;

    // stub (grid sized)
    ctx.beginPath();
    ctx.moveTo(-halfW - g, y);
    ctx.lineTo(-halfW, y);
    ctx.stroke();



    // inside net name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(String(inputs[i] || ''), -halfW + 6 / scale, y);
  }

  // RIGHT outputs stubs + inside labels
  const yOut0 = -Math.floor(nOut / 2) * pinStep;
  for (let i = 0; i < nOut; i++) {
    const y = yOut0 + i * pinStep;

    ctx.beginPath();
    ctx.moveTo(halfW, y);
    ctx.lineTo(halfW + g, y);
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.fillText(String(outputsArr[i] || ''), halfW - 6 / scale, y);
  }


  // TOP power names (stubs upward)
  ctx.textAlign = 'center';
  const startTop = -((nTop - 1) * stubStep) / 2;
for (let i = 0; i < powers.length; i++) {
  const x = startTop + i * stubStep;
  const xs = Math.round(x / g) * g;

  ctx.beginPath();
  ctx.moveTo(xs, -halfH - g);
  ctx.lineTo(xs, -halfH);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.fillText(String(powers[i]), xs, -halfH + 15);
}

  // BOTTOM grounds (stubs downward)
 const startBot = -((nBot - 1) * stubStep) / 2;
for (let i = 0; i < grounds.length; i++) {
  const x = startBot + i * stubStep;
  const xs = Math.round(x / g) * g;

  ctx.beginPath();
  ctx.moveTo(xs, halfH);
  ctx.lineTo(xs, halfH + g);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.fillText(String(grounds[i]), xs, halfH + 0);
}

  // CENTER TITLE
  if (showCellName) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isSelected ? '#ffd54f' : '#ffffff';
  ctx.font = `${14}px sans-serif`;
  ctx.fillText(name, 0, 0);
  }

  ctx.restore();
}
