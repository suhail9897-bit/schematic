// E:\Tool\vite-project\src\lib\canvas2.js
import { drawResistor } from './resistor';
import { drawCapacitor } from './capacitor';
import { drawInductor } from './inductor';
import { drawDiode } from './diode';
import { drawNPN } from './npn';
import { drawPNP } from './pnp';
import { drawNMOS } from './nmos';
import { drawPMOS } from './pmos';
import { drawIN } from './in';
import { drawOUT } from './out';
import { drawInOut } from './in-out';
import { drawVDC } from './vdc';
import { drawVSSI } from './vssi';
import { drawVDDI } from './vdd';
import { drawNOT } from './not';
import { drawNAND } from './nand';
import { drawNOR } from './nor';
import { drawXOR } from './xor';
import { aStarOrthogonalPath, hitTestAllWires } from './wire.js';

// same utility logic used in original file
function areBoxesOverlapping(a, b, boxSize = 120) {
  const half = boxSize / 2;
  return !(
    a.x + half <= b.x - half ||
    a.x - half >= b.x + half ||
    a.y + half <= b.y - half ||
    a.y - half >= b.y + half
  );
}



// Install only the draw() method on the prototype (mixin style)
export function installDraw(proto) {
  proto.draw = function draw() {
    this.clear();
    this.drawGrid();

    this.ctx.save();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    // helper inside installDraw (add once near the top of the function scope)
const deviceNamesOn = () => (this.showDeviceLabels !== false);
const propsOn = () => (this.showPropertyLabels !== false);
// Unit-aware value label for R/C/L. Prefers comp.valueMeta from editors.
function valueLabelFor(comp) {
  const strip = (n) => String(+(+n).toFixed(2))
    .replace(/\.00$/, '')
    .replace(/(\.\d*[1-9])0$/, '$1');

  if (comp?.valueMeta?.unit) {
    return `${strip(comp.valueMeta.magnitude)}${comp.valueMeta.unit}`;
  }
  if (typeof comp?.value === "string") return comp.value;

  // fallback if valueMeta not set (still add a unit)
  const u = comp.type === 'resistor' ? 'Ω' :
            comp.type === 'capacitor' ? 'F' :
            comp.type === 'inductor' ? 'H' : '';
  if (typeof comp?.value === "number") return strip(comp.value) + u;
  return "";
}


// Device name shown by D-eye; W/L suffix only if P-eye is on
// Device name shown by D-eye; W/L line must stay even if D-eye is off (when P-eye is on)
const mosLabel = (comp, fallback) => {
  const base = (this.showDeviceLabels !== false) ? (comp?.label || fallback) : '';

  // read W/L from nmos/pmos bag
  const bag = comp?.nmos || comp?.pmos || {};
  const W = Number.isFinite(+bag.W) ? +bag.W : 1;
  const L = Number.isFinite(+bag.L) ? +bag.L : 1;

  // If properties eye is off → only name (or empty if name hidden)
  if (this.showPropertyLabels === false) return base;

  // Properties eye is ON:
  const wl = `w:${W} L:${L}`;
  // If name is visible, append; if name is hidden, show only W/L
  return base ? `${base} ${wl}` : wl;
};

const maybeName = (comp, fallback) =>
  deviceNamesOn() ? (comp?.label || fallback) : '';
  const propsText = (txt) => (propsOn() ? txt : '');




    for (const comp of this.components) {
      const isSelected = this.selected === comp;

      // 🔴 overlap highlight (selected vs targets)
      if (this.dragging && this.selected && comp !== this.selected) {
        if (areBoxesOverlapping(this.selected, comp)) {
          this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
          this.ctx.fillRect(comp.x - 60, comp.y - 60, 120, 120);
          this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
          this.ctx.fillRect(this.selected.x - 60, this.selected.y - 60, 120, 120);
        }
      }

      // 🟦 dragged component box
      if (isSelected && this.dragging) {
        const boxSize = 120;
        this.ctx.fillStyle = 'rgba(211, 211, 211, 0.2)';
        this.ctx.fillRect(comp.x - boxSize / 2, comp.y - boxSize / 2, boxSize, boxSize);
        this.ctx.strokeStyle = 'rgba(217, 240, 14, 1)';
        this.ctx.lineWidth = 1 / this.scale;
        this.ctx.strokeRect(comp.x - boxSize / 2, comp.y - boxSize / 2, boxSize, boxSize);
      }

      const drawWithRotation = (fn) => {
        if (comp.angle) {
          this.ctx.save();
          this.ctx.translate(comp.x, comp.y);
          this.ctx.rotate(comp.angle);
          fn(0, 0);
          this.ctx.restore();
        } else {
          fn(comp.x, comp.y);
        }
      };

      // type-wise drawing (body unchanged)
      if (comp.type === 'capacitor') {
const nameC = deviceNamesOn() ? (comp.label || 'C') : '';
const valC  = propsOn() ? ` (${valueLabelFor(comp)})` : '';
const text  = `${nameC}${valC}`;
drawWithRotation((cx, cy) => drawCapacitor(this.ctx, cx, cy, this.scale, text, isSelected));

      } else if (comp.type === 'inductor') {
 const nameL = deviceNamesOn() ? (comp.label || 'L') : '';
const valL  = propsOn() ? ` (${valueLabelFor(comp)})` : '';
const text  = `${nameL}${valL}`;
drawWithRotation((cx, cy) => drawInductor(this.ctx, cx, cy, this.scale, text, isSelected));

      } else if (comp.type === 'diode') {
        this._ensureDiodeFixed(comp);
        this._ensureDiodeSize(comp);
        drawWithRotation((cx, cy) =>
          drawDiode(this.ctx, cx, cy, this.scale, this.getDisplayLabel(comp), isSelected));
      } else if (comp.type === 'npn') {
        drawWithRotation((cx, cy) => drawNPN(this.ctx,  cx, cy, this.scale, maybeName(comp, 'NPN'),  isSelected));
      } else if (comp.type === 'pnp') {
        drawWithRotation((cx, cy) => drawPNP(this.ctx,  cx, cy, this.scale, maybeName(comp, 'PNP'),  isSelected));
      } else if (comp.type === 'nmos') {
        drawWithRotation((cx, cy) => drawNMOS(this.ctx, cx, cy, this.scale, mosLabel(comp, 'NMOS'), isSelected, { bodyText: (comp?.nmos?.bodyNet ?? 'VSS') }));
      } else if (comp.type === 'pmos') {
        drawWithRotation((cx, cy) => drawPMOS(this.ctx, cx, cy, this.scale, mosLabel(comp, 'PMOS'), isSelected,{ bodyText: (comp?.pmos?.bodyNet ?? 'VDD') }));
      } else if (comp.type === 'in') {
        drawWithRotation((cx, cy) => drawIN(this.ctx,  cx, cy, this.scale, maybeName(comp, 'IN'),     isSelected));
      } else if (comp.type === 'out') {
        drawWithRotation((cx, cy) => drawOUT(this.ctx, cx, cy, this.scale, maybeName(comp, 'OUT'),    isSelected));
      } else if (comp.type === 'in-out') {
        drawWithRotation((cx, cy) => drawInOut(this.ctx, cx, cy, this.scale, maybeName(comp, 'IN-OUT'), isSelected));
    } else if (comp.type === 'vdc') {
  const volts = Number.isFinite(Number(comp?.vdc?.V ?? comp?.vdc?.value ?? comp?.value))
    ? Number(comp?.vdc?.V ?? comp?.vdc?.value ?? comp?.value)
    : 1;
  const name = (comp?.label || 'V1').replace(/\s*\(.*?\)\s*$/, '');
  const showProps = (this.showPropertyLabels !== false);       // 👈 P-eye toggle
  const showNames = (this.showDeviceLabels   !== false);  

  drawWithRotation((cx, cy) => drawVDC(this.ctx, cx, cy, this.scale, name,isSelected,{
        valueText: showProps ? `${volts} V` : '',                // hide when properties are off
    showName: showNames, 
        showValue: propsOn()
      }));
      } else if (comp.type === 'vssi') {
        drawWithRotation((cx, cy) => drawVSSI(this.ctx, cx, cy, this.scale, maybeName(comp, 'VSSI'), isSelected));
      } else if (comp.type === 'vddi') {
        drawWithRotation((cx, cy) => drawVDDI(this.ctx, cx, cy, this.scale, maybeName(comp, 'VDDI'), isSelected));
      } else if (comp.type === 'not') {
        drawWithRotation((cx, cy) => drawNOT(this.ctx, cx, cy, this.scale, maybeName(comp, 'NOT'), isSelected));
     } else if (comp.type === 'nand') {
  drawWithRotation((cx, cy) => {
    // 1) NAND gate + name (as-is)
    drawNAND(this.ctx, cx, cy, this.scale, maybeName(comp, 'NAND'), isSelected, comp);

    // 2) Properties line (SEPARATE from the name)
    const n = comp.nand || {};
    const Wn = Number.isFinite(n.Wn) ? n.Wn : 1;
    const Wp = Number.isFinite(n.Wp) ? n.Wp : 2;
    const L  = Number.isFinite(n.L)  ? n.L  : 1;
    const m  = Number.isFinite(n.m)  ? n.m  : 1;

    const props = `wn:${Wn} wp:${Wp} L:${L} m:${m}`;
    const yOff  = 42; // gate ke niche; aap is value ko apni pasand se tweak kar sakte ho

    this.ctx.font = `${12}px sans-serif`;
    this.ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    if (propsOn()) {
  this.ctx.fillText(props, cx, cy + yOff);
}

  });

      } else if (comp.type === 'nor') {
  drawWithRotation((cx, cy) => {
    // 1) NAND gate + name (as-is)
    drawNOR(this.ctx, cx, cy, this.scale, maybeName(comp, 'NOR'), isSelected, comp);

    // 2) Properties line (SEPARATE from the name)
    const n = comp.nor || {};
    const Wn = Number.isFinite(n.Wn) ? n.Wn : 1;
    const Wp = Number.isFinite(n.Wp) ? n.Wp : 2;
    const L  = Number.isFinite(n.L)  ? n.L  : 1;
    const m  = Number.isFinite(n.m)  ? n.m  : 1;

    const props = `wn:${Wn} wp:${Wp} L:${L} m:${m}`;
    const yOff  = 42; // gate ke niche; aap is value ko apni pasand se tweak kar sakte ho

    this.ctx.font = `${12}px sans-serif`;
    this.ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    if (propsOn()) {
  this.ctx.fillText(props, cx, cy + yOff);
}

  });
      } else if (comp.type === 'xor') {
  drawWithRotation((cx, cy) => {
    // 1) NAND gate + name (as-is)
    drawXOR(this.ctx, cx, cy, this.scale, maybeName(comp, 'XOR'), isSelected, comp);

    // 2) Properties line (SEPARATE from the name)
    const n = comp.xor || {};
    const Wn = Number.isFinite(n.Wn) ? n.Wn : 1;
    const Wp = Number.isFinite(n.Wp) ? n.Wp : 2;
    const L  = Number.isFinite(n.L)  ? n.L  : 1;
    const m  = Number.isFinite(n.m)  ? n.m  : 1;

    const props = `wn:${Wn} wp:${Wp} L:${L} m:${m}`;
    const yOff  = 42; // gate ke niche; aap is value ko apni pasand se tweak kar sakte ho

    this.ctx.font = `${12}px sans-serif`;
    this.ctx.fillStyle = isSelected ? 'yellow' : '#ccc';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    if (propsOn()) {
  this.ctx.fillText(props, cx, cy + yOff);
}

  });
     } else {
  const nameR = deviceNamesOn() ? (comp.label || 'R') : '';
const valR  = propsOn() ? ` (${valueLabelFor(comp)})` : '';
const text  = `${nameR}${valR}`;
drawWithRotation((cx, cy) => drawResistor(this.ctx, cx, cy, this.scale, text, isSelected));

      }

      // terminal net labels + dots
      if (comp.terminals) {
        for (const [index, terminal] of comp.terminals.entries()) {
          if (!terminal.netLabel) terminal.netLabel = `net${this.netCounter++}`;
          const globalX = comp.x + terminal.x;
          const globalY = comp.y + terminal.y;

          this.ctx.font = `${12}px sans-serif`;
          this.ctx.fillStyle = 'transparent';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'bottom';
          this.ctx.fillText(terminal.netLabel, globalX, globalY - 8);
          if (this.showNetLabels) {
           this.ctx.font = `${12}px sans-serif`;
           this.ctx.fillStyle = 'cyan';
           this.ctx.textAlign = 'center';
           this.ctx.textBaseline = 'bottom';
           this.ctx.fillText(terminal.netLabel, globalX, globalY - 8);
         }
          this.ctx.beginPath();
          this.ctx.arc(globalX, globalY, 2 / this.scale, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // (transparent) inner box for “wire can’t cross component”
      for (const comp of this.components) {
        const boxSize = 120;
        const buffer = 10;
        this.ctx.strokeStyle = 'transparent';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
          comp.x - boxSize / 2 + buffer,
          comp.y - boxSize / 2 + buffer,
          boxSize - 2 * buffer,
          boxSize - 2 * buffer
        );
      }

      // snap dot
      this.ctx.fillStyle = 'rgb(153,153,153, 0.7)';
      this.ctx.beginPath();
      this.ctx.arc(comp.x, comp.y, 2 / this.scale, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // yellow ring for selected terminals
    for (const { comp, index } of this.selectedTerminals) {
      const term = comp.terminals[index];
      const globalX = comp.x + term.x;
      const globalY = comp.y + term.y;
      this.ctx.beginPath();
      this.ctx.arc(globalX, globalY, 6, 0, 2 * Math.PI);
      this.ctx.strokeStyle = 'yellow';
      this.ctx.lineWidth = 5 / this.scale;
      this.ctx.stroke();
    }

    // wires
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2 / this.scale;
    for (const wire of this.wires) {
      this.ctx.beginPath();
      const [first, ...rest] = wire.path;
      this.ctx.moveTo(first.x, first.y);
      for (const pt of rest) this.ctx.lineTo(pt.x, pt.y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  };
}


// Install only handleMouseDown on the prototype (mixin style)
export function installHandleMouseDown(proto) {
  proto.handleMouseDown = function handleMouseDown(e) {
    const { x, y } = this.toWorldCoords(e.offsetX, e.offsetY);
    // console.log(this.components);
   // ---- wire hit-test (before clearing selection / before terminal checks) ----
   const hit = hitTestAllWires(this.wires, x, y, 6);
if (hit && hit.wire) {
  this._wireHit = { x: hit.point.x, y: hit.point.y, wireId: hit.wire.id, segmentIndex: hit.segmentIndex };
  if (this.uiHooks?.onWireHit) this.uiHooks.onWireHit({ x: hit.point.x, y: hit.point.y });
  this.draw();
  return;
}
    let clickedOnTerminal = false;
    

    // 🟡 First check if clicked on any terminal
    for (const comp of this.components) {
      if (!comp.terminals) continue;

      for (let i = 0; i < comp.terminals.length; i++) {
        const term = comp.terminals[i];

        // Global terminal position (relative to canvas)
        const termX = comp.x + term.x;
        const termY = comp.y + term.y;

        const dx = x - termX;
        const dy = y - termY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 8) {
          this.selectedTerminals.push({ comp, index: i });
          // console.log('✅ Terminal selected:', comp.type, 'index:', i);
          clickedOnTerminal = true;

          // ✅ If two terminals are selected, connect them with wire
          // ✅ If two terminals are selected, connect them with wire
          if (this.selectedTerminals.length === 2) {
            const [t1, t2] = this.selectedTerminals;
            const start = {
              x: t1.comp.x + t1.comp.terminals[t1.index].x,
              y: t1.comp.y + t1.comp.terminals[t1.index].y,
            };
            const end = {
              x: t2.comp.x + t2.comp.terminals[t2.index].x,
              y: t2.comp.y + t2.comp.terminals[t2.index].y,
            };

            const path = aStarOrthogonalPath(start, end, this.components, this.gridSize);
            if (!path) {
              // console.warn("❌ No path found between terminals. Wire not created.");
              this.selectedTerminals = [];
              this.draw();
              return;
            }

            this.wires.push({
              id: `wire${this.wires.length + 1}`,
              from: {
                compId: t1.comp.id,
                terminalIndex: t1.index,
                netLabel: t1.comp.terminals[t1.index].netLabel,
              },
              to: {
                compId: t2.comp.id,
                terminalIndex: t2.index,
                netLabel: t2.comp.terminals[t2.index].netLabel,
              },
              path: path
            });

            // 🔁 Merge net labels
            const term1 = t1.comp.terminals[t1.index];
            const term2 = t2.comp.terminals[t2.index];
            const commonNet = term1.netLabel || term2.netLabel || `net${this.netCounter++}`;
            term1.netLabel = commonNet;
            term2.netLabel = commonNet;

            // 🧹 Clear selection after drawing wire
            this.selectedTerminals = [];
          }

          this.draw();
          return;
        }
      }
    }

    if (!clickedOnTerminal) {
      this.selectedTerminals = [];
    }

    // 🟥 If not a terminal, check for component selection
    for (const comp of this.components) {
      if (
        x >= comp.x - 40 && x <= comp.x + 40 &&
        y >= comp.y - 40 && y <= comp.y + 40
      ) {
        this.selected = comp;
        this.dragging = true;

        // ✅ Store last safe position
        this.lastSafeX = comp.x;
        this.lastSafeY = comp.y;

        this.draw();
        return;
      }
    }

    // 🧹 Clear component selection if clicked on empty area
    this.selected = null;
    this.draw();
  };
}


// Install handleMouseMove, handleMouseUp, handleZoom on the prototype (mixin style)
export function installMouseMoveUpZoom(proto) {
  proto.handleMouseMove = function handleMouseMove(e) {
    if (!this.dragging || !this.selected) return;

    const { x, y } = this.toWorldCoords(e.offsetX, e.offsetY);

    // Snap to grid
    const snappedX = Math.round(x / this.gridSize) * this.gridSize;
    const snappedY = Math.round(y / this.gridSize) * this.gridSize;

    this.selected.x = snappedX;
    this.selected.y = snappedY;
    //for live wire reRoute but it will hang the system
    // if (this.selected) {
    //   this.rerouteWiresFor(this.selected);
    // }

    this.draw();
  };

  proto.handleMouseUp = function handleMouseUp() {
    if (this.selected && this.isOverlapping(this.selected.x, this.selected.y, this.selected)) {
      // ⛔ overlapping — snap back
      this.selected.x = this.lastSafeX;
      this.selected.y = this.lastSafeY;
    }

    this.dragging = false;

    // ✅ Cleanly reroute wires of moved component
    if (this.selected) {
      this.rerouteWiresFor(this.selected);
    }

    this.draw();
  };

  proto.handleZoom = function handleZoom(e) {
    e.preventDefault();
    const zoomFactor = 1.1;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - this.offsetX) / this.scale;
    const worldY = (mouseY - this.offsetY) / this.scale;

    const zoomIn = e.deltaY < 0;
    const scaleChange = zoomIn ? zoomFactor : 1 / zoomFactor;
    const newScale = Math.max(0.1, Math.min(10, this.scale * scaleChange));

    this.offsetX = mouseX - worldX * newScale;
    this.offsetY = mouseY - worldY * newScale;
    this.scale = newScale;

    this.draw();
  };
}
