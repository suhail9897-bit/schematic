export function drawVDDI(ctx, x, y, scale = 1, label = 'VDDI', isSelected = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 1.5;
   ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  ctx.font = '14px sans-serif';

  // Left terminal dot
  ctx.beginPath();
  ctx.arc(0, 60, 4, 0, Math.PI * 2);
  ctx.fill();

  // Line from dot to label
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(40, 0);
  ctx.stroke();

   // vertical short horizontal line
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 60);
  ctx.stroke();

ctx.fillText('+', -12, 14);

  // Label
  ctx.fillText(label, -15, -5);

  ctx.restore();
}


// ✅ Terminals coordinates helper
export function getVDDITerminals(centerX, centerY) {
  return [
    { x: centerX , y: centerY + 60 }
  ];
}
