export function drawIN(ctx, x, y, scale = 1, label = 'IN', isSelected = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 2 / scale;

  const strokeColor = isSelected ? 'yellow' : 'white';
  const fillColor = isSelected ? 'yellow' : '#ccc';

  // Apply for all strokes
  ctx.strokeStyle = strokeColor;

  // Right Port Circle
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(60, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // right short horizontal line
  ctx.beginPath();
  ctx.moveTo(59, 0);
  ctx.lineTo(30, 0);
  ctx.stroke();

  // Trapezoid body (only stroke, no fill)
  ctx.beginPath();
  ctx.moveTo(-55, 10);
  ctx.lineTo(-55, -10);
  ctx.lineTo(10, -10);
  ctx.lineTo(30, 0);
  ctx.lineTo(10, 10);
  ctx.closePath();
  ctx.stroke();

  // Label
  ctx.fillStyle = fillColor;
  ctx.font = `${12 }px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);

  ctx.restore();
}


// ✅ Terminals coordinates helper
export function getINTerminals(centerX, centerY) {
  return [
    { x: centerX + 60, y: centerY }
  ];
}


//canvas.js ka purana recomputenets function yahan save h 
// agar future mein koi problem hui to isko paste kr lenge 
// and existing ko hata denge
// Recompute net labels from scratch using remaining wires 
// recomputeNets() { 
//  // DSU helpers
//   const parent = new Map();
//   const nodeId = (compId, ti) => `${compId}:${ti}`;
//   const find = (x) => {
//     let p = parent.get(x);
//     if (p !== x) {
//       p = find(p);
//       parent.set(x, p);
//     }
//     return p;
//   };
//   const union = (a, b) => {
//     const ra = find(a);
//     const rb = find(b);
//     if (ra !== rb) parent.set(ra, rb);
//   };

//   // 1) init each terminal as its own set
//   for (const comp of this.components) {
//     if (!comp.terminals) continue;
//     comp.terminals.forEach((_, i) => {
//       const id = nodeId(comp.id, i);
//       parent.set(id, id);
//     });
//   }

//   // 2) union by remaining wires
//   for (const w of this.wires) {
//     const a = nodeId(w.from.compId, w.from.terminalIndex);
//     const b = nodeId(w.to.compId,   w.to.terminalIndex);
//     if (parent.has(a) && parent.has(b)) union(a, b);
//   }
// // 3) assign fresh net labels per connected component 
// const rootToNet = new Map(); 
// let counter = 1; 
// for (const comp of this.components) { 
// if (!comp.terminals) continue; 
// comp.terminals.forEach((t, i) => { 
// const id = nodeId(comp.id, i); 
// if (!parent.has(id)) 
// return; 
// const r = find(id); 
// if (!rootToNet.has(r))rootToNet.set(r,
//    `net${counter++}`); 
// t.netLabel = rootToNet.get(r);
//  });
//  } 
// // keep counter moving forward for any future terminals
//    this.netCounter = counter; 
// }  