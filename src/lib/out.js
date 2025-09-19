export function drawOUT(ctx, x, y, scale = 1, label = 'OUT', isSelected = false) {
  ctx.save();
  ctx.translate(x, y);

  const strokeColor = isSelected ? 'yellow' : 'white';
  const fillColor = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 2;

  // Terminal Circle
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(-60, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // Left Line
  ctx.strokeStyle = strokeColor;
  ctx.beginPath();
  ctx.moveTo(-59, 0);
  ctx.lineTo(-25, 0);
  ctx.stroke();

  // Trapezoid Arrow
  ctx.strokeStyle = strokeColor; // 🟢 Re-apply here
  ctx.beginPath();
  ctx.moveTo(-25, 0);
  ctx.lineTo(-25, -10);
  ctx.lineTo(35, -10);
  ctx.lineTo(60, 0);
  ctx.lineTo(35, 10);
  ctx.lineTo(-25, 10);
  ctx.closePath();
  ctx.stroke();

  // Label
  ctx.fillStyle = fillColor;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, 0, 7);

  ctx.restore();
}


// ✅ Terminals coordinates helper
export function getOUTTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY }
  ];
}
