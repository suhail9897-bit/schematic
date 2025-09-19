export function drawAND(ctx, centerX, centerY, scale = 1, label = 'AND', isSelected=false) {
  const width = 80; // reduced from 100 to 80
  const height = 80;
  const terminalLength = 20;
  const terminalRadius = 6;

  ctx.save();
   ctx.lineWidth = 1 / scale;
  ctx.strokeStyle = isSelected ? 'yellow' : 'white';
ctx.fillStyle = isSelected ? 'yellow' : '#ccc';

  const leftX = centerX - width / 2;
  const rightX = centerX + width / 2;
  const topY = centerY - height / 2;
  const bottomY = centerY + height / 2;

  // body rectangle + semicircle
  ctx.beginPath();
  ctx.moveTo(leftX, topY);
  ctx.lineTo(centerX, topY);
  ctx.arc(centerX, centerY, height / 2, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(leftX, bottomY);
  ctx.lineTo(leftX, topY);
  ctx.stroke();

  // Left input terminals
  const input1Y = centerY - 20;
  const input2Y = centerY + 20;

  ctx.beginPath();
  ctx.moveTo(leftX - terminalLength, input1Y);
  ctx.lineTo(leftX, input1Y);
  ctx.moveTo(leftX - terminalLength, input2Y);
  ctx.lineTo(leftX, input2Y);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(leftX - terminalLength, input1Y, terminalRadius, 0, Math.PI * 2);
  ctx.arc(leftX - terminalLength, input2Y, terminalRadius, 0, Math.PI * 2);
  ctx.fill();

  // Right output terminal
  ctx.beginPath();
  ctx.moveTo(rightX, centerY);
  ctx.lineTo(rightX + terminalLength, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(rightX + terminalLength, centerY, terminalRadius, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.font = `${14 / scale}px sans-serif`;
  ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, centerX, topY + 30);

  ctx.restore();
}


// ✅ Terminals coordinates helper for AND gate
export function getANDTerminals(centerX, centerY) {
  return [
    { x: centerX - 40 - 20, y: centerY - 20 }, // Input 1
    { x: centerX - 40 - 20, y: centerY + 20 }, // Input 2
    { x: centerX + 40 + 20, y: centerY }       // Output
  ];
}
