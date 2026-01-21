export function drawVDDI(ctx, x, y, scale = 1, label = 'VDDI', isSelected = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 1.5;
   ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  ctx.font = '14px sans-serif';

  // Left terminal dot
  ctx.beginPath();
  ctx.arc(-60, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // Line from dot to label
  ctx.beginPath();
  ctx.moveTo(-60, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();

   // vertical short horizontal line
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(-30, 30);
  ctx.stroke();

ctx.fillText('+', -42, 14);

  // Label
  ctx.fillText(label, -25, -5);

  ctx.restore();
}


// ✅ Terminals coordinates helper
export function getVDDITerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY }
  ];
}
