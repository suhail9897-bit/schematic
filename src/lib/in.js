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
