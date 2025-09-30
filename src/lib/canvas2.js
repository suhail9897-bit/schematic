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
import { drawSubcktBox } from './subcktbox';
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


function _componentsInRect(components, rect, boxSize = 120) {
  const half = boxSize / 2;
  const contains = (cx, cy) =>
    cx - half >= rect.x1 && cx + half <= rect.x2 &&
    cy - half >= rect.y1 && cy + half <= rect.y2;

  return components.filter(c => {
    const x1 = Math.min(rect.x1, rect.x2);
    const y1 = Math.min(rect.y1, rect.y2);
    const x2 = Math.max(rect.x1, rect.x2);
    const y2 = Math.max(rect.y1, rect.y2);
    return contains(c.x, c.y); // center based (same 120 box convention)
  });
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


// ⚠️ Labels ke world coords: terminals ko dobara rotate NAA karo
const labelWorld = (comp, t) => {
  const lx = t.x, ly = t.y;

  // old designs ya world-coord terminals
  if (t.terminalSpace === 'world' || Math.abs(lx) > 200 || Math.abs(ly) > 200) {
    return { x: lx, y: ly };
  }

  // ✅ Agar rotateSelected ne terminals ko already current orientation me set kiya hai
  // to bas translate karo (no extra rotation)
  if (comp.terminalsBase) {
    return { x: comp.x + lx, y: comp.y + ly };
  }

  // Warna (very old path) angle apply karo
  if (!comp.angle) return { x: comp.x + lx, y: comp.y + ly };
  const s = Math.sin(comp.angle), c = Math.cos(comp.angle);
  return { x: comp.x + lx * c - ly * s, y: comp.y + lx * s + ly * c };
};




    for (const comp of this.components) {
      const isSelected =
  this.selected === comp || (this.multiSelected?.includes(comp));


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

  }); } else if (comp.type === 'subcktbox') {
        drawWithRotation((cx, cy) =>
          drawSubcktBox(this.ctx, cx, cy, this.scale, comp, isSelected, this.gridSize)
        );
       } else {
  const nameR = deviceNamesOn() ? (comp.label || 'R') : '';
const valR  = propsOn() ? ` (${valueLabelFor(comp)})` : '';
const text  = `${nameR}${valR}`;
drawWithRotation((cx, cy) => drawResistor(this.ctx, cx, cy, this.scale, text, isSelected));

      }

     // ➜ Add this helper near top of draw() (helpers ke paas)
const termToWorld = (comp, t) => {
  if (!comp?.angle) return { x: comp.x + t.x, y: comp.y + t.y };
  const cos = Math.cos(comp.angle), sin = Math.sin(comp.angle);
  return {
    x: comp.x + t.x * cos - t.y * sin,
    y: comp.y + t.x * sin + t.y * cos,
  };
};

// ... then in the "terminal net labels + dots" loop:
if (comp.terminals) {
  for (const [index, terminal] of comp.terminals.entries()) {
    if (!terminal.netLabel) terminal.netLabel = `net${this.netCounter++}`;

    // Detect whether terminal is LOCAL or WORLD.
    const isLocal =
      terminal.terminalSpace === 'local' ||
      (Math.abs(terminal.x) <= 100 && Math.abs(terminal.y) <= 100);

        const { x: globalX, y: globalY } = labelWorld(comp, terminal);


    // (text + dot exactly as before)
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
      // this.ctx.fillStyle = 'rgb(153,153,153, 0.7)';
      this.ctx.fillStyle = 'red';
      this.ctx.beginPath();
      this.ctx.arc(comp.x, comp.y, 2 / this.scale, 0, Math.PI * 2);
      this.ctx.fill();
    }

// 🔵 Ghost preview (after real components)
if (this._ghost && this._ghost.type) {
  const g = this._ghost;
  const ctx = this.ctx;

  const drawGhost = (fn) => {
    ctx.save();
    ctx.globalAlpha = 0.75;
    if (g.angle) {
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);
      fn(0, 0);
    } else {
      fn(g.x, g.y);
    }
    ctx.restore();
  };

  // lightweight fallbacks for labels in ghost
  const maybe = (label, fb) => (label || fb);

  if (g.type === 'resistor')      drawGhost((cx,cy)=>drawResistor(ctx,cx,cy,this.scale, maybe('', 'R'),    false));
  else if (g.type === 'capacitor')drawGhost((cx,cy)=>drawCapacitor(ctx,cx,cy,this.scale, maybe('', 'C'),    false));
  else if (g.type === 'inductor') drawGhost((cx,cy)=>drawInductor(ctx,cx,cy,this.scale,  maybe('', 'L'),    false));
  else if (g.type === 'diode')    drawGhost((cx,cy)=>drawDiode(ctx,cx,cy,this.scale,     maybe('', 'D'),    false));
  else if (g.type === 'npn')      drawGhost((cx,cy)=>drawNPN(ctx,cx,cy,this.scale,       maybe('', 'NPN'),  false));
  else if (g.type === 'pnp')      drawGhost((cx,cy)=>drawPNP(ctx,cx,cy,this.scale,       maybe('', 'PNP'),  false));
  else if (g.type === 'nmos')     drawGhost((cx,cy)=>drawNMOS(ctx,cx,cy,this.scale,      maybe('', 'NMOS'), false));
  else if (g.type === 'pmos')     drawGhost((cx,cy)=>drawPMOS(ctx,cx,cy,this.scale,      maybe('', 'PMOS'), false));
  else if (g.type === 'in')       drawGhost((cx,cy)=>drawIN(ctx,cx,cy,this.scale,        maybe('', 'IN'),   false));
  else if (g.type === 'out')      drawGhost((cx,cy)=>drawOUT(ctx,cx,cy,this.scale,       maybe('', 'OUT'),  false));
  else if (g.type === 'in-out')   drawGhost((cx,cy)=>drawInOut(ctx,cx,cy,this.scale,     maybe('', 'IN-OUT'), false));
  else if (g.type === 'vdc')      drawGhost((cx,cy)=>drawVDC(ctx,cx,cy,this.scale,       'V', false, { valueText:'', showName:true, showValue:false }));
  else if (g.type === 'vssi')     drawGhost((cx,cy)=>drawVSSI(ctx,cx,cy,this.scale,      maybe('', 'VSSI'), false));
  else if (g.type === 'vddi')     drawGhost((cx,cy)=>drawVDDI(ctx,cx,cy,this.scale,      maybe('', 'VDDI'), false));
  else if (g.type === 'not')      drawGhost((cx,cy)=>drawNOT(ctx,cx,cy,this.scale,       maybe('', 'NOT'),  false));
  else if (g.type === 'nand')     drawGhost((cx,cy)=>drawNAND(ctx,cx,cy,this.scale,      maybe('', 'NAND'), false));
  else if (g.type === 'nor')      drawGhost((cx,cy)=>drawNOR(ctx,cx,cy,this.scale,       maybe('', 'NOR'),  false));
  else if (g.type === 'xor')      drawGhost((cx,cy)=>drawXOR(ctx,cx,cy,this.scale,       maybe('', 'XOR'),  false));

  // same overlap box used during drag (yellow)
  const boxSize = 120;
  for (const c of this.components) {
    // use same signature you use for dragging:
    // in your file it's called like: areBoxesOverlapping(this.selected, comp)
    if (areBoxesOverlapping({ x: g.x, y: g.y }, c)) {
      this.ctx.fillStyle = 'rgba(167, 13, 13, 0.54)';
      this.ctx.fillRect(g.x - boxSize/2, g.y - boxSize/2, boxSize, boxSize);
      this.ctx.strokeStyle = 'rgba(217, 240, 14, 1)';
      this.ctx.lineWidth = 1 / this.scale;
      this.ctx.strokeRect(g.x - boxSize/2, g.y - boxSize/2, boxSize, boxSize);
      break;
    }
  }
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
    this.ctx.lineWidth = 2 / this.scale;
    for (const wire of this.wires) {
   this.ctx.strokeStyle = wire?.color || 'white';
      this.ctx.beginPath();
      const [first, ...rest] = wire.path;
      this.ctx.moveTo(first.x, first.y);
      for (const pt of rest) this.ctx.lineTo(pt.x, pt.y);
      this.ctx.stroke();
    }

    // ⬛ Marquee overlay (active ya persist dono me)
if (this.marquee && (this.marquee.active || this.marquee.persist)) {
  const { x1, y1, x2, y2 } = this.marquee;
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);

  this.ctx.save();
  this.ctx.lineWidth = 1 / this.scale;
  this.ctx.setLineDash([4, 2]);
  this.ctx.strokeStyle = 'rgba(0,160,255,0.9)';
  this.ctx.fillStyle   = 'rgba(0,160,255,0.15)';
  this.ctx.strokeRect(x, y, w, h);
  this.ctx.fillRect(x, y, w, h);
  this.ctx.restore();
}


    this.ctx.restore();
     if (this.uiHooks?.onViewport) {
      this.uiHooks.onViewport(this.getViewport());
    }
  };
}


// Install only handleMouseDown on the prototype (mixin style)
export function installHandleMouseDown(proto) {
  proto.handleMouseDown = async function handleMouseDown(e) {
    const { x, y } = this.toWorldCoords(e.offsetX, e.offsetY);
    // console.log(this.components);
// 🔁 Only on DOUBLE click: wire par scissor dikhao
if (e.detail >= 2) { // 2nd click within system dblclick threshold
  try {
    const { hitTestAllWires } = await import("./wire.js");
    const hit = hitTestAllWires(this.wires, x, y, 6); // 6px tolerance
    if (hit && hit.wire) {
   this._wireHit = {
     x: hit.point.x, y: hit.point.y,
     wireId: hit.wire.id, segmentIndex: hit.segmentIndex
   };
   if (this.uiHooks?.onWireHit)
     this.uiHooks.onWireHit({ x: hit.point.x, y: hit.point.y, wireId: hit.wire.id });
      this.draw();
      return; // yahin ruk jao — scissor show ho gaya
    }
  } catch(_) {}
}

// ❌ Single click par kabhi scissor nahi—clear it
this._wireHit = null;
if (this.uiHooks?.onWireHit) this.uiHooks.onWireHit(null);


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
            // ⬇️ If a marquee exists and we clicked a terminal of a component
  // that is NOT in current multiSelect → collapse the marquee
  if (this.marquee && (!this.multiSelected || !this.multiSelected.includes(comp))) {
    this.marquee = null;
    this.multiSelected = [];
  }
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
         // ⬇️ Clicking a component while a marquee is visible:
    // if the component is NOT part of multiSelected → hide box + clear selection
    if (this.marquee && (!this.multiSelected || !this.multiSelected.includes(comp))) {
      this.marquee = null;
      this.multiSelected = [];
    }

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
   // 🧹 Empty area click
if (this.marqueeEnabled) {
  // 📦 Start marquee ONLY when enabled
  this._marqueeStart = { x, y };
  this.marquee = { x1: x, y1: y, x2: x, y2: y, active: true, persist: false };
  this.multiSelected = [];
} else {
  // marquee mode OFF → ensure no box is shown
  this.marquee = null;
  this.multiSelected = [];
}
this.selected = null;
    this.draw();
  };
}


// Install handleMouseMove, handleMouseUp, handleZoom on the prototype (mixin style)
export function installMouseMoveUpZoom(proto) {
   // helper so React side can map world->screen reliably
  proto.getViewport = function () {
    return {
      offsetX: this.offsetX || 0,
      offsetY: this.offsetY || 0,
      scale:   this.scale   || this.zoom || 1,
    };
  };

  proto.handleMouseMove = function handleMouseMove(e) {
    // 📦 Marquee live update
if (this.marquee && this.marquee.active) {
  const { x, y } = this.toWorldCoords(e.offsetX, e.offsetY);
  this.marquee.x2 = x;
  this.marquee.y2 = y;

  // live highlight: jo box me aaye unhe select dikhao
  const rect = this.marquee;
  this.multiSelected = _componentsInRect(this.components, rect);

  this.draw();
  return;   // marquee mode consumes the move
}

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
    // 📦 Finalize marquee selection (keep box until delete)
if (this.marquee && this.marquee.active) {
  this.marquee.active  = false;
  this.marquee.persist = true;      // box visible until user deletes / clears
  // final selection already in multiSelected (from move); safety recompute:
  const rect = this.marquee;
  this.multiSelected = _componentsInRect(this.components, rect);
  this.draw();
  return;
}

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
      if (this.uiHooks?.onViewport) {
      this.uiHooks.onViewport(this.getViewport());
    }
  };
}
