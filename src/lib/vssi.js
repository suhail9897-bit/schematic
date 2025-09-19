export function drawVSSI(ctx, x, y, scale = 1, label = 'VSSI', isSelected = false) {
  ctx.save();
  ctx.translate(x, y);

  const strokeColor = isSelected ? 'yellow' : 'white';
  const fillColor = isSelected ? 'yellow' : '#ccc';

  ctx.lineWidth = 1.5;

  // Terminal dot
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(0, -30, 4, 0, Math.PI * 2);
  ctx.fill();

  // Vertical line to terminal
  ctx.strokeStyle = strokeColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -29);
  ctx.stroke();

  // Top short line
  ctx.strokeStyle = strokeColor;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(30, 0);
  ctx.stroke();

  // Ground lines (3 decreasing lines)
  ctx.strokeStyle = strokeColor;
  ctx.beginPath();
  ctx.moveTo(-20, 5);
  ctx.lineTo(20, 5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-15, 10);
  ctx.lineTo(15, 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-10, 15);
  ctx.lineTo(10, 15);
  ctx.stroke();

  ctx.restore();
}


// ✅ Terminals coordinates helper
export function getVSSITerminals(centerX, centerY) {
  return [
    { x: centerX , y: centerY - 30}
  ];
}
