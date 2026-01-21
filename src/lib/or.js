export function drawOR(ctx, centerX, centerY, scale = 1, label = 'OR', isSelected = false) {
  ctx.save();
  
  ctx.lineWidth = 1 / scale;
    ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';


  // OR gate body
  ctx.beginPath();
  ctx.moveTo(centerX - 50 + 10, centerY - 40);
  ctx.quadraticCurveTo(centerX - 32, centerY, centerX - 50 + 10, centerY + 40);
  ctx.quadraticCurveTo(centerX + 10, centerY + 45, centerX + 40, centerY);
  ctx.quadraticCurveTo(centerX + 10, centerY - 45, centerX - 50 + 10, centerY - 40);
  ctx.stroke();

  // Input terminals (at x = centerX - 50 - 20)
  ctx.beginPath();
  ctx.moveTo(centerX - 60, centerY - 20);
  ctx.lineTo(centerX - 37, centerY - 20);
  ctx.moveTo(centerX - 60, centerY + 20);
  ctx.lineTo(centerX - 37, centerY + 20);
  ctx.stroke();

  // Input terminal dots
  ctx.beginPath();
  ctx.arc(centerX - 60, centerY - 20, 6, 0, Math.PI * 2);
  ctx.arc(centerX - 60, centerY + 20, 6, 0, Math.PI * 2);
  ctx.fill();

  // Output terminal (at x = centerX + 40 + 20)
  ctx.beginPath();
  ctx.moveTo(centerX + 40, centerY);
  ctx.lineTo(centerX + 60, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX + 60, centerY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.font = `${14 / scale}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, centerX - 9, centerY - 4);

  ctx.restore();
}


// ✅ Terminals coordinates helper
export function getORTerminals(centerX, centerY) {
  return [
    { x: centerX - 60, y: centerY - 20 }, // Input 1
    { x: centerX - 60, y: centerY + 20 }, // Input 2
    { x: centerX + 60, y: centerY }       // Output
  ];
}
