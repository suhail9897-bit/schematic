// Dynamic sized subcircuit "box" with grid-aligned stubs.

// ----- geometry helpers -----
function measureBox(comp, grid) {
  const g = grid || 30;
  const nIn  = (comp?.subckt?.inputs || []).length;
  const nTop = (comp?.subckt?.powers || []).length;
  const nBot = (comp?.subckt?.grounds || []).length;

  // Height driven primarily by inputs; width by max of supplies
  const pinStep = g;                             // vertical spacing between pins
  const minBodyH = 4 * g;                        // minimum box body height
  const minBodyW = 8 * g;                        // minimum body width

  const bodyH = Math.max(minBodyH, (nIn + 2) * pinStep);
  const bodyW = Math.max(minBodyW, (Math.max(nTop, nBot) + 6) * g);

  const halfW = Math.round(bodyW / 2 / g) * g;
  const halfH = Math.round(bodyH / 2 / g) * g;

  return { g, nIn, nTop, nBot, bodyW, bodyH, halfW, halfH, pinStep };
}

export function getSubcktBoxTerminals(comp, grid) {
  const { g, nIn, nTop, nBot, halfW, halfH, bodyW, pinStep } = measureBox(comp, grid);

  const terms = [];

  // LEFT inputs: terminals at the end of outer stub
  const y0 = -Math.floor(nIn / 2) * pinStep;
  for (let i = 0; i < nIn; i++) {
    const y = y0 + i * pinStep;
    terms.push({ x: -halfW - g, y, netLabel: "" , terminalSpace: 'local' });
  }

  // RIGHT single output
  terms.push({ x:  halfW + g, y: 0, netLabel: "" , terminalSpace: 'local' });

  // TOP powers (spread across width)
  const spreadTop = nTop + 1;
  for (let i = 0; i < nTop; i++) {
    const x = -halfW + ((i + 1) * bodyW) / spreadTop;
    const snapX = Math.round(x / g) * g;
    terms.push({ x: snapX, y: -halfH - g, netLabel: "" , terminalSpace: 'local' });
  }

  // BOTTOM grounds
  const spreadBot = nBot + 1;
  for (let i = 0; i < nBot; i++) {
    const x = -halfW + ((i + 1) * bodyW) / spreadBot;
    const snapX = Math.round(x / g) * g;
    terms.push({ x: snapX, y:  halfH + g, netLabel: "" , terminalSpace: 'local' });
  }

  return terms;
}

// ----- drawing -----
export function drawSubcktBox(ctx, cx, cy, scale, comp, isSelected, grid) {
  const { g, nIn, nTop, nBot, bodyW, bodyH, halfW, halfH, pinStep } =
    measureBox(comp, grid);

  const name    = String(comp?.subckt?.name || comp?.label || 'BLOCK');
  const inputs  = comp?.subckt?.inputs  || [];
  const outputN = String(comp?.subckt?.output || 'OUT');
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

  // RIGHT output stub (no outside text)
  ctx.beginPath();
  ctx.moveTo(halfW, 0);
  ctx.lineTo(halfW + g, 0);
  ctx.stroke();
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff';
  ctx.fillText(outputN, halfW - 6 / scale, 0);

  // TOP power names (stubs upward)
  ctx.textAlign = 'center';
  for (let i = 0; i < powers.length; i++) {
    const x = -halfW + ((i + 1) * bodyW) / (nTop + 1);
    const xs = Math.round(x / g) * g;

    ctx.beginPath();
    ctx.moveTo(xs, -halfH - g);
    ctx.lineTo(xs, -halfH);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.fillText(String(powers[i]), xs, -halfH + 15);
  }

  // BOTTOM grounds (stubs downward)
  for (let i = 0; i < grounds.length; i++) {
    const x = -halfW + ((i + 1) * bodyW) / (nBot + 1);
    const xs = Math.round(x / g) * g;

    ctx.beginPath();
    ctx.moveTo(xs, halfH);
    ctx.lineTo(xs, halfH + g);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.fillText(String(grounds[i]), xs, halfH + 0 );
  }

  // CENTER TITLE
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isSelected ? '#ffd54f' : '#ffffff';
  ctx.font = `${14}px sans-serif`;
  ctx.fillText(name, 0, 0);

  ctx.restore();
}
