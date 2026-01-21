export function drawInOut(ctx, x, y, scale = 1, label = 'IN-OUT', isSelected = false) {
  ctx.save();
  ctx.translate(x, y);
   ctx.strokeStyle = isSelected ? 'yellow' : 'white';
    const fillColor = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 2;

  // Left terminal circle
  ctx.beginPath();
  ctx.arc(-60, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Left line
  ctx.beginPath();
  ctx.moveTo(-59, 0);
  ctx.lineTo(-40, 0);
  ctx.stroke();

  // Right line
  // ctx.beginPath();
  // ctx.moveTo(40, 0);
  // ctx.lineTo(59, 0);
  // ctx.stroke();

  // Right terminal circle
  // ctx.beginPath();
  // ctx.arc(60, 0, 4, 0, Math.PI * 2);
  // ctx.fillStyle = fillColor;
  // ctx.fill();

  // Trapezoid body
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(-30, -10);
  ctx.lineTo(30, -10);
  ctx.lineTo(40, 0);
  ctx.lineTo(30, 10);
  ctx.lineTo(-30, 10);
  ctx.closePath();
  ctx.fillStyle = 'transparent';
  ctx.fill();
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
export function getINOUTTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY },
    // { x: centerX + 60, y: centerY }
  ];
}