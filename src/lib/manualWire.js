// src/lib/manualWire.js

// Short manual-wire segment:
// - geometry: a single line
// - length: 2 grid boxes => endpoints at +/- gridSize from center
// - 2 terminals at endpoints

export function getManualWireTerminals(centerX, centerY, gridSize = 30) {
  // ✅ single terminal at center
  return [{ x: centerX, y: centerY }];
}


export function drawManualWire(ctx, centerX, centerY, scale = 1, isSelected = false, gridSize = 30) {
  // ✅ no geometry, only the terminal (dot/ring) will be drawn by canvas2 terminal loop
  return;
}

