// E:\schematic\vite-project\src\lib\canvas.js
import {
    getResistorTerminals,
  getResValueVMFor,
  setResValueFromUIFor,
  resValueLabel
} from './resistor';

import {
    getCapacitorTerminals,
  getCapValueVMFor,
  setCapValueFromUIFor,
  capValueLabel
} from './capacitor';

import {
    getInductorTerminals,
  getIndValueVMFor,
  setIndValueFromUIFor,
  indValueLabel
} from './inductor';

import {
  getDiodeTerminals,
  getDiodeAreaVMFor,
  setDiodeAreaFromUIFor,
  } from "./diode";

import { 
   getNPNTerminals,
   getNpnAreaVMFor,
   setNpnAreaFromUIFor 
  } from './npn';

import {
   getPNPTerminals, 
   getPNPAreaVMFor, 
   setPNPAreaFromUIFor
   } from './pnp';

import { 
   getNMOSTerminals,
   getNmosVMFor,
   setNmosFromUIFor 
  } from './nmos';


import { 
    getPMOSTerminals,
    getPmosVMFor,
    setPmosFromUIFor 
  } from './pmos';

import {  getINTerminals } from './in';
import {  getOUTTerminals } from './out';
import {  getINOUTTerminals } from './in-out';

import { 
   getVDCTerminals,
   getVdcVMFor, 
   setVdcFromUIFor  
  } from './vdc';

import {  getVSSITerminals } from './vssi';
import {  getVDDITerminals } from './vdd';
import {  getANDTerminals } from './and';
import {  getORTerminals } from './or';
import { 
   getNOTTerminals,
   getNotVMFor,
   setNotFromUIFor
  } from './not';
import { 
   getNANDTerminals,
   getNandVMFor,
   setNandFromUIFor 
  } from './nand';


import { 
  getNORTerminals,
  getNorVMFor,
  setNorFromUIFor
 } from './nor';

import { 
   getXORTerminals,
   getXorVMFor,
   setXorFromUIFor 
  } from './xor';

import { aStarOrthogonalPath,  deleteWireById, hitTestAllWires} from './wire.js';
import throttle from 'lodash/throttle';
import { getSubcktBoxTerminals } from './subcktbox';

import { installDraw,
   installHandleMouseDown,
    installMouseMoveUpZoom
 } from './canvas2';

import { getManualWireTerminals } from './manualWire';



class CanvasUtils {
  constructor(canvas, gridSize = 30) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridSize = gridSize;
    this.scale = 1;
    this.offsetX = canvas.width / 2;
    this.offsetY = canvas.height / 2;
    this.showNetLabels = true;
    this.showDeviceLabels = true;
    this.showPropertyLabels = true; 
    this.components = [];        // ✅ All resistors
    this.selected = null;        // ✅ Currently selected
    this.selectedTerminals = []; // store selected terminals
    this.wires = [];
    this._wireHit = null;
    this.uiHooks = null;
    this.dragging = false;       // ✅ Dragging flag
    this.resistorCount = 0;
    this.capacitorCount = 0; 
    this.inductorCount = 0; 
    this.diodeCount = 0;
    this.vdcCount = 0;
    this.npnCount  = 0;
    this.pnpCount  = 0; 
    this.nmosCount = 0;   // (not strictly needed for auto-label helper)
    this.pmosCount = 0; 
    this.netCounter = 1;
    this.scheduleReroute = throttle(() => this.rerouteWiresFor(this.selected), 50);
    this.lastReroutePositions = new Map();
    this._ghost = null; // { type, x,y, angle }
    // multi-select / marquee
    this.multiSelected = [];         // array of selected components
    this.marquee = null;             // { x1,y1,x2,y2, active:boolean, persist:boolean } | null
    this.marqueeEnabled = false;   // ← marquee (box select) OFF by default
    // --- clipboard state for copy/paste ---
    this.clipboard = null;     // { comps:[], wires:[], anchor:{x,y}, w,h }
    this._pasteBump = 20;      // repeated paste ke liye nudge
    this._pasteCount = 0;      // incremental bump


   // ✅ device pixel ratio
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.addEventListener("wheel", this.handleZoom.bind(this));
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));

    // ---- Right-drag pan state (NEW) ----
    this.panning = false;
    this._panStart = null;                     // { sx, sy }
    this._panStartOffset = { x: this.offsetX, y: this.offsetY };

    // Disable default context menu so right-drag feels native
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  }

 _commit(kind) {
  try {
    const snap = this.buildDesignSnapshot();
    this.uiHooks?.onCommittedChange?.(kind, snap);
  } catch {}
}


  // Add a subcircuit box component at origin (grid-snap), with safety checks
addSubcktBox(spec = {}) {
  const g = this.gridSize || 30;
  const snap = (n) => Math.round(n / g) * g;

  // origin center (red cross)
  const x = snap(0), y = snap(0);

  // if something is already at origin, politely ask to move
  if (this._overlapsAnyComponent(x, y)) {
    alert("Move the component near origin and try again (box needs the origin).");
    return null;
  }

  const comp = {
    id: `subcktbox${Date.now()}`,
    type: 'subcktbox',
    x, y,
    angle: 0,
    label: (spec.name || 'BLOCK').toUpperCase(),
    subckt: {
      name: (spec.name || 'BLOCK').toUpperCase(),
      inputs: Array.isArray(spec.inputs) ? spec.inputs : [],
      output: spec.output || 'OUT',
      powers: Array.isArray(spec.powers) ? spec.powers : [],
      grounds: Array.isArray(spec.grounds) ? spec.grounds : [],
       // ⬇️ netlist emit ke liye: sirf last .SUBCKT block ko carry karo
        cirLines:
          (spec?.lastSubckt?.blockLines?.length
            ? spec.lastSubckt.blockLines.slice()
            : (Array.isArray(spec.cirLines) ? spec.cirLines.slice() : [])),
        // (optional) reference ke liye alag field bhi rakh lo
        lastSubcktLines: (Array.isArray(spec?.lastSubckt?.blockLines)
            ? spec.lastSubckt.blockLines.slice() : []),
        lastSubcktName: String(spec?.lastSubckt?.name || spec?.name || '').toUpperCase()
    },
    terminals: []
  };

  // compute terminals (tips of stubs, all on-grid)
  comp.terminals = getSubcktBoxTerminals(comp, g);

  this.components.push(comp);
  this.selected = comp;
  this.draw();
   this._commit('box:add');
  return comp;
}


  getMarqueeEnabled() { 
  return !!this.marqueeEnabled; 
}

setMarqueeEnabled(on) {
  this.marqueeEnabled = !!on;
  // OFF hote hi running/persistent box clear + selection reset
  if (!this.marqueeEnabled) {
    this.marquee = null;
    this.multiSelected = [];
    this.draw();
  }
}


  // 🔵 set/clear ghost from React
setPlacementGhost(ghost) {
  this._ghost = ghost ? { ...ghost } : null;
  this.draw();
}
rotateGhostTo(rad) {
  if (!this._ghost) return;
  this._ghost.angle = rad;
  this.draw();
}

// internal: same box size you use for drag overlap
_overlapsAnyComponent(x, y, boxSize = 120) {
  for (const c of this.components) {
    if (c?.type === 'manualWire') continue; // manual wires never participate in overlap blocking
    if (Math.abs(c.x - x) < boxSize && Math.abs(c.y - y) < boxSize) {
      return true;
    }
  }
  return false;
}

// 🔵 place current ghost → real component (true=placed, false=blocked)
placeGhostNow() {
  const g = this._ghost;
  if (!g || !g.type) return false;
   if (g.type !== 'manualWire' && this._overlapsAnyComponent(g.x, g.y)) {
    alert("Can't place component here — overlaps another!");
    return false;
  }
  const t = g.type;
  const x = g.x, y = g.y, a = g.angle || 0;
  // reuse your existing per-type adders (origin APIs already exist)
  const call = {
    resistor:  (x,y)=>this.drawResistorAt(x,y),
    capacitor: (x,y)=>this.drawCapacitorAt(x,y),
    inductor:  (x,y)=>this.drawInductorAt(x,y),
    manualWire:(x,y)=>this.drawManualWireAt(x,y),
    diode:     (x,y)=>this.drawDiodeAt(x,y),
    npn:       (x,y)=>this.drawNPNAt(x,y),
    pnp:       (x,y)=>this.drawPNPAt(x,y),
    nmos:      (x,y)=>this.drawNMOSAt(x,y),
    pmos:      (x,y)=>this.drawPMOSAt(x,y),
    in:        (x,y)=>this.drawINAt(x,y),
    out:       (x,y)=>this.drawOUTAt(x,y),
    "in-out":  (x,y)=>this.drawInOutAt(x,y),
    vdc:       (x,y)=>this.drawVDCAt(x,y),
    vssi:      (x,y)=>this.drawVSSIAt(x,y),
    vddi:      (x,y)=>this.drawVDDIAt(x,y),
    not:       (x,y)=>this.drawNOTAt(x,y),
    nand:      (x,y)=>this.drawNANDAt(x,y),
    nor:       (x,y)=>this.drawNORAt(x,y),
    xor:       (x,y)=>this.drawXORAt(x,y),
  }[t];
  if (!call) return false;
  // apply rotation if your adders read comp.angle; otherwise set after push
  const before = this.components.length;
  call(x, y);
  const placed = this.components[this.components.length - 1];
  if (this.components.length > before && placed) {
    placed.angle = a || 0;
      // --- normalize terminals if ghost was rotated ---
  if (a) {
    const cos = Math.cos(a), sin = Math.sin(a);
    const rot = (x, y) => ({ x: x * cos - y * sin, y: x * sin + y * cos });

    placed.terminals = (placed.terminals || []).map(t => {
      // world-coord terminals ko chhedo mat
      const isWorld = t.terminalSpace === 'world' || Math.abs(t.x) > 200 || Math.abs(t.y) > 200;
      if (isWorld) return t;
      const r = rot(t.x, t.y);
      return { ...t, x: r.x, y: r.y, terminalSpace: 'local' };
    });

    // tell draw(): labels ko dobara angle se rotate mat karna
    placed.terminalsBase = placed.terminals.map(t => ({
      x: t.x, y: t.y, netLabel: t.netLabel
    }));
  }

    this.draw();
    this._commit('place');
    return true;
  }
  return false;
}

setWireColor(wireId, color) {
  const w = this.wires.find(w => w.id === wireId);
  if (!w) return false;

  const prev = w.color || '#ffffff';
  if (String(prev).toLowerCase() === String(color).toLowerCase()) {
    return false; // no-op → history na push karo
  }

  w.color = color;
  this.draw();
  this._commit('wire:color');
  return true;
}

cutSelectedWire() {
  const hit = this._wireHit;        // Canvas.jsx se set hota hai via uiHooks
  if (!hit || !hit.wireId) return false;

  // actually delete the wire
  deleteWireById(this, hit.wireId); // recomputeNets() + draw() yahi call karta hai

  // UI clean-up
  this._wireHit = null;
  if (this.uiHooks?.onWireHit) this.uiHooks.onWireHit(null);

  // history snapshot
  this._commit('wire:delete');
  return true;
}


getWireColor(wireId) {
  const w = this.wires.find(w => w.id === wireId);
  return w?.color || '#ffffff'; // default
}
// NEW: recolor the entire net for a given wire id
setNetColorByWireId(wireId, color) {
  const target = this.wires.find(w => w.id === wireId);
  if (!target) return;
  const label =
    target.netLabel ||
    target.from?.netLabel ||
    target.to?.netLabel || "";
  if (!label) { this.setWireColor(wireId, color); return; }

  for (const w of this.wires) {
    const L = w.netLabel || w.from?.netLabel || w.to?.netLabel || "";
    if (L === label) w.color = color;
  }
  this.draw();
}
  
 setPropertyLabelsVisible(v) {
    this.showPropertyLabels = !!v;
    this.draw();
  }
  getPropertyLabelsVisible() {
    return !!this.showPropertyLabels;
  }
// ======= LABELS HIDE/SHOW =======
setDeviceLabelsVisible(v) {
  this.showDeviceLabels = !!v;
  this.draw();
}
getDeviceLabelsVisible() {
  return !!this.showDeviceLabels;
}
toggleDeviceLabelsVisible() {
  this.setDeviceLabelsVisible(!this.getDeviceLabelsVisible());
}

// ======= NET NAMES VISIBLE/HIDE =======
   setNetLabelsVisible(v) {
    this.showNetLabels = !!v;
    this.draw();
  }
  getNetLabelsVisible() {
    return !!this.showNetLabels;
  }

  // ======= DESIGN FILE: EXPORT / IMPORT =======

// Build a complete, lossless snapshot of the current scene
buildDesignSnapshot() {
  const pick = (obj, keys) => {
    const out = {};
    for (const k of keys) if (obj && typeof obj[k] !== "undefined") out[k] = obj[k];
    return out;
  };

  const components = this.components.map(c => {
    // known per-type option bags we preserve if present
    const bags = pick(c, [
      "diodeFixed","diodeSize",
      "npn","pnp","nmos","pmos",
      "nand","nor","xor",
      "vdc",
      "subckt"
    ]);
    return {
      id: c.id,
      type: c.type,
      x: c.x, y: c.y,
      angle: c.angle || 0,
      label: c.label || "",
      value: c.value || "",
      terminals: (c.terminals || []).map(t => ({ x: t.x, y: t.y, netLabel: t.netLabel || "" })),
      ...bags
    };
  });

  const wires = this.wires.map(w => ({
    id: w.id,
    from: { ...w.from },
    to:   { ...w.to },
    netLabel: w.netLabel || w.from?.netLabel || w.to?.netLabel || "",
    path: (w.path || []).map(p => ({ x: p.x, y: p.y })),
    color: w.color || undefined
  }));

  const counters = {
    resistorCount: this.resistorCount || 0,
    capacitorCount: this.capacitorCount || 0,
    inductorCount: this.inductorCount || 0,
    diodeCount: this.diodeCount || 0,
    vdcCount: this.vdcCount || 0,
    npnCount: this.npnCount || 0,
    pnpCount: this.pnpCount || 0,
    nmosCount: this.nmosCount || 0,
    pmosCount: this.pmosCount || 0,
    inCount: this.inCount || 0,
    outCount: this.outCount || 0,
    inoutCount: this.inoutCount || 0,
    vssiCount: this.vssiCount || 0,
    vddiCount: this.vddiCount || 0,
    andCount: this.andCount || 0,
    orCount: this.orCount || 0,
    notCount: this.notCount || 0,
    nandCount: this.nandCount || 0,
    norCount: this.norCount || 0,
    xorCount: this.xorCount || 0
  };

  return {
    meta: { app: "LogicKnots", kind: "design", version: 1, createdAt: new Date().toISOString() },
    canvas: { gridSize: this.gridSize, scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY, netCounter: this.netCounter },
    counters,
    components,
    wires
  };
}

// Load a snapshot back into the engine (lossless redraw)
loadDesignSnapshot(snapshot) {
  if (!snapshot || snapshot.meta?.kind !== "design") {
    alert("Invalid Design file.");
    return;
  }

  // 1) clear
  // 1) clear  (SOFT CLEAR: no draw, no counters reset, no viewport touch)
this.components = [];
this.wires = [];
this.selected = null;
this.selectedTerminals = [];
this.multiSelected = [];
this.marquee = null;


  // 2) restore canvas/view
  if (snapshot.canvas) {
    if (typeof snapshot.canvas.gridSize === "number") this.gridSize = snapshot.canvas.gridSize;
    if (typeof snapshot.canvas.scale === "number")    this.scale    = snapshot.canvas.scale;
    if (typeof snapshot.canvas.offsetX === "number")  this.offsetX  = snapshot.canvas.offsetX;
    if (typeof snapshot.canvas.offsetY === "number")  this.offsetY  = snapshot.canvas.offsetY;
    if (typeof snapshot.canvas.netCounter === "number") this.netCounter = snapshot.canvas.netCounter;
  }

  // 2.5) notify React overlay about viewport restore
this.uiHooks?.onViewport?.({
  offsetX: this.offsetX,
  offsetY: this.offsetY,
  scale:   this.scale
});


  // 3) restore components
  const comps = Array.isArray(snapshot.components) ? snapshot.components : [];
  for (const c of comps) {
    // shallow copy, keep exact structure expected by draw()
    const restored = {
      id: c.id, type: c.type, x: c.x, y: c.y,
      angle: c.angle || 0, label: c.label || "", value: c.value || "",
      terminals: (c.terminals || []).map(t => ({ x: t.x, y: t.y, netLabel: t.netLabel || "" })),

      // per-type bags (preserve if present)
      diodeFixed: c.diodeFixed, diodeSize: c.diodeSize,
      npn: c.npn, pnp: c.pnp, nmos: c.nmos, pmos: c.pmos,
      nand: c.nand, nor: c.nor, xor: c.xor,
      vdc: c.vdc,
      subckt: c.subckt || null
    };
    this.components.push(restored);

    // ✅ Ensure base so draw() doesn't re-rotate labels after undo/redo
if (!restored.terminalsBase) {
  restored.terminalsBase = (restored.terminals || []).map(t => ({
    x: t.x, y: t.y, netLabel: t.netLabel || ""
  }));
}

    // ✅ Safety for very old snapshots: if it's a box but terminals missing, rebuild
if (restored.type === 'subcktbox') {
  if (!Array.isArray(restored.terminals) || !restored.terminals.length) {
    restored.terminals = getSubcktBoxTerminals(restored, this.gridSize);
  }
}
  }

  // 4) restore counters (for future numbering continuity)
  const ctr = snapshot.counters || {};
  Object.keys(ctr).forEach(k => { this[k] = ctr[k]; });

  // 5) restore wires
  const wires = Array.isArray(snapshot.wires) ? snapshot.wires : [];
  for (const w of wires) {
    // validate endpoints
    const fromComp = this.components.find(c => c.id === w.from?.compId);
    const toComp   = this.components.find(c => c.id === w.to?.compId);
    if (!fromComp || !toComp) continue;

    const wire = {
      id: w.id || `wire${this.wires.length + 1}`,
      from: { compId: w.from.compId, terminalIndex: w.from.terminalIndex, netLabel: w.from.netLabel || "" },
      to:   { compId: w.to.compId,   terminalIndex: w.to.terminalIndex,   netLabel: w.to.netLabel   || "" },
      path: Array.isArray(w.path) && w.path.length ? w.path.map(p => ({ x: p.x, y: p.y })) : null,
      netLabel: w.netLabel || "",
      color: w.color || undefined
    };

    // fallback route if path missing
    if (!wire.path) {
      const ft = fromComp.terminals[wire.from.terminalIndex];
      const tt = toComp.terminals[wire.to.terminalIndex];
      const start = { x: fromComp.x + ft.x, y: fromComp.y + ft.y };
      const end   = { x: toComp.x + tt.x,   y: toComp.y + tt.y };
      const alt = aStarOrthogonalPath(start, end, this.components, this.gridSize);
      if (alt) wire.path = alt;
    }
    if (wire.path) this.wires.push(wire);
  }

  // 6) draw
  this.draw();
}


    // --- auto label helpers (NAND/NOR/XOR) ---
  nextAutoLabel(base) {
    // base: 'NAND' | 'NOR' | 'XOR'
    const rx = new RegExp(`^${base}(\\d+)?$`, 'i');
    let next = 1;
    const typeKey = base.toLowerCase(); // 'nand' | 'nor' | 'xor'
    for (const c of this.components) {
      if (c.type === typeKey) {
        const m = String(c.label || '').match(rx);
        if (m) {
          const n = m[1] ? parseInt(m[1], 10) : 1;
          if (n >= next) next = n + 1;
        }
      }
    }
    return `${base}${next}`;
  }

  // Add inside CanvasUtils class (near other helpers)
_propagateNetLabel(compId, terminalIndex, newNet) {
  const node = (cid, ti) => `${cid}:${ti}`;

  // Build adjacency from current wires
  const adj = new Map();
  for (const w of this.wires) {
    const a = node(w.from.compId, w.from.terminalIndex);
    const b = node(w.to.compId,   w.to.terminalIndex);
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a).add(b);
    adj.get(b).add(a);
  }

  // BFS over connected component starting at the edited terminal
  const start = node(compId, terminalIndex);
  const q = [start];
  const seen = new Set();

  while (q.length) {
    const cur = q.pop();
    if (seen.has(cur)) continue;
    seen.add(cur);

    const [cid, idxStr] = cur.split(':');
    const idx = parseInt(idxStr, 10);

    const comp = this.components.find(c => c.id === cid);
    if (comp && comp.terminals && comp.terminals[idx]) {
      // update this terminal's label
      comp.terminals[idx].netLabel = newNet;
      // sync any wire endpoint metadata too
      this._updateWireLabelsFor(cid, idx, newNet);
    }

    for (const nb of (adj.get(cur) || [])) {
      if (!seen.has(nb)) q.push(nb);
    }
  }
}


  _coerceAutoLabel(label, base) {
    // Agar user ne label nahi diya ya sirf base (NAND/NOR/XOR) hi diya,
    // to numbered label de do (NAND1, NOR2, XOR3, ...)
    if (!label || String(label).trim().toUpperCase() === base) {
      return this.nextAutoLabel(base);
    }
    return label;
  }


  getVdcVM() {
  const c = this.selected;
  if (!c || c.type !== 'vdc') return null;
  return getVdcVMFor(c);
}
setVdcFromUI(patch) {
  const c = this.selected;
  if (!c || c.type !== 'vdc') return;
  setVdcFromUIFor(c, patch);
  this.draw();
}


  getNotVM() {
  const c = this.selected;
  if (!c || c.type !== 'not') return null;
  return getNotVMFor(c);
}
setNotFromUI(patch) {
  const c = this.selected;
  if (!c || c.type !== 'not') return;
  setNotFromUIFor(c, patch);
  this.draw();
}



  getXorVM() {
  const c = this.selected;
  if (!c || c.type !== 'xor') return null;
  return getXorVMFor(c);
}
setXorFromUI(patch) {
  const c = this.selected;
  if (!c || c.type !== 'xor') return;

  const prev = c.terminals?.length || 0;
  setXorFromUIFor(c, patch); // updates comp.xor + comp.terminals (keeps output at idx 2)

  const now = c.terminals.length;
  if (now < prev && Array.isArray(this.wires)) {
    this.wires = this.wires.filter(w => {
      if (w.from.compId === c.id && w.from.terminalIndex >= now) return false;
      if (w.to.compId   === c.id && w.to.terminalIndex   >= now) return false;
      return true;
    });
    this.recomputeNets?.();
  }
  this.rerouteWiresFor?.(c);
  this.draw();
}



  // === NOR: VM + setter (place near NAND helpers) ===
getNorVM() {
  const c = this.selected;
  if (!c || c.type !== 'nor') return null;
  return getNorVMFor(c);
}

setNorFromUI(patch) {
  const c = this.selected;
  if (!c || c.type !== 'nor') return;

  const prevLen = Array.isArray(c.terminals) ? c.terminals.length : 0;
  setNorFromUIFor(c, patch); // updates comp.nor + comp.terminals (output stays idx 2)

  const newLen = c.terminals.length;
  if (newLen < prevLen && Array.isArray(this.wires)) {
    this.wires = this.wires.filter(w => {
      if (w.from.compId === c.id && w.from.terminalIndex >= newLen) return false;
      if (w.to.compId   === c.id && w.to.terminalIndex   >= newLen) return false;
      return true;
    });
    this.recomputeNets?.();
  }
  this.rerouteWiresFor?.(c);
  this.draw();
}


  // === NAND: view-model (read)
getNandVM() {
  const c = this.selected;
  if (!c || c.type !== 'nand') return null;
  return getNandVMFor(c);
}

// === NAND: setter from UI
setNandFromUI(patch) {
  const c = this.selected;
  if (!c || c.type !== 'nand') return;

  const prevLen = Array.isArray(c.terminals) ? c.terminals.length : 0;
  setNandFromUIFor(c, patch); // updates comp.nand + comp.terminals (keeps output at idx 2)

  // if inputs decreased (3->2), drop any wires pointing to now-missing terminals
  const newLen = c.terminals.length;
  if (newLen < prevLen && Array.isArray(this.wires)) {
    this.wires = this.wires.filter(w => {
      if (w.from.compId === c.id && w.from.terminalIndex >= newLen) return false;
      if (w.to.compId   === c.id && w.to.terminalIndex   >= newLen) return false;
      return true;
    });
    this.recomputeNets?.();
  }

  this.rerouteWiresFor?.(c);
  this.draw();
}


getPmosVM() {
  const c = this.selected;
  if (!c || c.type !== 'pmos') return null;
  return getPmosVMFor(c);
}
setPmosFromUI(p) {
  const c = this.selected;
  if (!c || c.type !== 'pmos') return;
  setPmosFromUIFor(c, p);
  this.draw();
}


// class CanvasUtils me methods add:
getNmosVM() {
  const c = this.selected;
  if (!c || c.type !== 'nmos') return null;
  return getNmosVMFor(c);
}
setNmosFromUI(p) {
  const c = this.selected;
  if (!c || c.type !== 'nmos') return;
  setNmosFromUIFor(c, p);
  this.draw();
}


  // === PNP: view-model (read)
getPnpAreaVM() {
  const c = this.selected;
  if (!c || c.type !== 'pnp') return null;
  return getPNPAreaVMFor(c);
}

// === PNP: setter from UI (write)
setPnpAreaFromUI({ area }) {
  const c = this.selected;
  if (!c || c.type !== 'pnp') return;
  setPNPAreaFromUIFor(c, { area });
  this.draw();
}



 // === NPN: UI view-model (delegated)
 getNpnAreaVM() {
   const c = this.selected;
   if (!c || c.type !== "npn") return null;
   return getNpnAreaVMFor(c);
 }

 // === NPN: setter from UI (delegated)
 setNpnAreaFromUI({ area }) {
   const c = this.selected;
   if (!c || c.type !== "npn") return;
   setNpnAreaFromUIFor(c, { area });
   this.draw();
 }


// === Diode: fixed defaults (no UI) ===
_getDiodeFixedDefaults() {
  // store in SI units (Volts)
  return { barrierPotential: 0.7, breakdownVoltage: 6 };
}

_ensureDiodeFixed(comp) {
  if (!comp || comp.type !== 'diode') return;
  if (!comp.diodeFixed) comp.diodeFixed = this._getDiodeFixedDefaults();
}

// === Diode: area-driven electrical defaults (kept internal) ===
// Baseline at 25 °C: A0 = 100 µm × 100 µm = 1e-8 m^2
_getDiodeAreaBaseline() {
  return { A0: 1e-8, Is0: 2.5e-9, Rs0: 0.60, Cj0: 4e-12 };
}

// Default area for every new diode (you can change later if needed)
_getDefaultDiodeArea() {
  return this._getDiodeAreaBaseline().A0;
}

// Compute Is, Rs, Cj from area (material & doping fixed)
_computeDiodeSizeParams(area) {
  const { A0, Is0, Rs0, Cj0 } = this._getDiodeAreaBaseline();
  const s = Math.max(1e-12, area / A0); // numeric safety
  return {
    area,            // m^2
    Is: Is0 * s,     // A   (∝ area)
    Rs: Rs0 / s,     // Ω   (∝ 1/area)
    Cj: Cj0 * s,     // F   (∝ area)
  };
}

// Back-compat: attach size params if missing
_ensureDiodeSize(comp) {
  if (!comp || comp.type !== 'diode') return;
  if (!comp.diodeSize || typeof comp.diodeSize.area !== 'number') {
    comp.diodeSize = this._computeDiodeSizeParams(this._getDefaultDiodeArea());
  }
}



// === Diode: UI view-model for area (width) ===
getDiodeAreaVM() {
  return getDiodeAreaVMFor(this.selected);
}


// === Diode: setter from UI (area -> Is, Rs, Cj) ===
setDiodeAreaFromUI(payload) {
  setDiodeAreaFromUIFor(this.selected, payload);
  this.draw();
}
  // Render label text for any component
// find your existing getDisplayLabel(comp) and replace its body with:
getDisplayLabel(comp) {
  const type = String(comp?.type || '').toLowerCase();
  const namesOn = this.showDeviceLabels !== false;     // eye for device names
  const propsOn = this.showPropertyLabels !== false;   // eye for values

  // Normalized value text you already store on VM
  const valTxt =
    type === 'resistor'  ? (comp?.resistor?.valueLabel  || comp?.valueLabel || comp?.value || '') :
    type === 'capacitor' ? (comp?.capacitor?.valueLabel || comp?.valueLabel || comp?.value || '') :
    type === 'inductor'  ? (comp?.inductor?.valueLabel  || comp?.valueLabel || comp?.value || '') :
    '';

  // R / C / L: combine name + (value) depending on both toggles
  if (type === 'resistor' || type === 'capacitor' || type === 'inductor') {
    const base = String(comp?.label || '').trim(); // e.g. R1 / C1 / L1

    // both off -> show nothing
    if (!namesOn && !propsOn) return '';

    // only values on
    if (!namesOn && propsOn) return valTxt || '';

    // only names on
    if (namesOn && !propsOn) return base;

    // both on
    return valTxt ? `${base} (${valTxt})` : base;
  }

  // Others that use this helper: obey names toggle as before
  const base = String(comp?.label || '').trim();
  return namesOn ? base : '';
}


// "10", "10u", "10µ", "10uF", "10 µF" -> "10µF"
// decimals allowed; empty -> ""
_formatCapUF(str = "") {
  const s = String(str).trim();
  if (!s) return "";
  // pick number part
  const m = s.match(/^\s*([0-9]*\.?[0-9]+)\s*(µ|u|U)?\s*F?\s*$/);
  if (m) {
    const num = m[1];
    return `${num}µF`;
  }
  // if user already typed something like "3.3µF", keep it tidy
  return s.replace(/uF/gi, "µF").replace(/\s+/g, "");
}


// "10" / "10 mH" / "10mh" / "10M H" -> "10mH"
_formatInductMH(str = "") {
  const s = String(str).trim();
  if (!s) return "";
  const m = s.match(/^\s*([0-9]*\.?[0-9]+)\s*(m\s*h)?\s*$/i);
  if (m) return `${m[1]}mH`;
  return s.replace(/\s+/g, "").replace(/mh$/i, "mH");
}



  // Maximum label length for components
MAX_LABEL_LEN = 12;

// remove spaces and clamp length
_sanitizeLabel(str = "") {
  return String(str).replace(/\s+/g, "").slice(0, this.MAX_LABEL_LEN);
}

// === Resistor: UI view-model (delegated) ===
getResValueVM() {
  const c = this.selected;
  if (!c || c.type !== "resistor") return null;
  return getResValueVMFor(c);
}

// === Resistor: setter from UI (delegated) ===
setResValueFromUI({ unit, magnitude }) {
  const c = this.selected;
  if (!c || c.type !== "resistor") return;
  setResValueFromUIFor(c, { unit, magnitude });
  this.draw(); // behavior unchanged
}

// === Resistor: value text used while drawing (delegated) ===
_resValueLabel(comp) {
  return resValueLabel(comp);
}

// === Capacitor: UI view-model (delegated) ===
getCapValueVM() {
  const c = this.selected;
  if (!c || c.type !== "capacitor") return null;
  return getCapValueVMFor(c);
}

// === Capacitor: setter from UI (delegated) ===
setCapValueFromUI({ unit, magnitude }) {
  const c = this.selected;
  if (!c || c.type !== "capacitor") return;
  setCapValueFromUIFor(c, { unit, magnitude });
  this.draw(); // behavior unchanged
}

// === Capacitor: value text used while drawing (delegated) ===
_capValueLabel(comp) {
  return capValueLabel(comp);
}

// === Inductor: UI view-model (delegated) ===
getIndValueVM() {
  const c = this.selected;
  if (!c || c.type !== "inductor") return null;
  return getIndValueVMFor(c);
}

// === Inductor: setter from UI (delegated) ===
setIndValueFromUI({ unit, magnitude }) {
  const c = this.selected;
  if (!c || c.type !== "inductor") return;
  setIndValueFromUIFor(c, { unit, magnitude });
  this.draw(); // behavior unchanged
}

// === Inductor: value text used while drawing (delegated) ===
_indValueLabel(comp) {
  return indValueLabel(comp);
}

  // Return a lightweight snapshot of the currently selected component
getSelectedSnapshot() {
  const c = this.selected;
  if (!c) return null;

  const snap = {
    id: c.id,
    type: c.type,
    label: c.label || "",
    value: c.value || "",
    terminals: (c.terminals || []).map((t, i) => ({
      index: i,
      netLabel: t.netLabel || `net${i + 1}`,
    })),
  };

  // ✅ Include per-type option bags so UI sees BODY etc.
  if (c.type === 'nmos') snap.nmos = { ...(c.nmos || {}) }; // bodyNet, L, W, type...
  if (c.type === 'pmos') snap.pmos = { ...(c.pmos || {}) }; // bodyNet, L, W, type...
  if (c.type === 'nand') snap.nand = { ...(c.nand || {}) };
  if (c.type === 'nor') snap.nor = { ...(c.nor || {}) };
  if (c.type === 'xor') snap.xor = { ...(c.xor || {}) };


  return snap;
}

getWireCutAnchor() {
  return this._wireHit ? { ...this._wireHit } : null;
}

clearWireCut() {
  this._wireHit = null;
  if (this.uiHooks?.onWireHit) this.uiHooks.onWireHit(null);
  this.draw();
}

cutSelectedWire() {
  if (!this._wireHit) return;
  const id = this._wireHit.wireId;
  this._wireHit = null;
  if (this.uiHooks?.onWireHit) this.uiHooks.onWireHit(null);

  // delete + recompute nets + redraw
  const idx = this.wires.findIndex(w => w.id === id);
  if (idx >= 0) {
    // prefer helper
    try {
      deleteWireById(this, id);
      return;
    } catch (_) {
      // fallback: local delete
      this.wires.splice(idx, 1);
      this.recomputeNets?.();
      this.draw();
    }
  }
}



// Helper: when terminal net name changes, reflect on connected wires too
_updateWireLabelsFor(compId, terminalIndex, newNet) {
  for (const w of this.wires) {
    if (w.from.compId === compId && w.from.terminalIndex === terminalIndex) {
      w.from.netLabel = newNet;
    }
    if (w.to.compId === compId && w.to.terminalIndex === terminalIndex) {
      w.to.netLabel = newNet;
    }
  }
}

// Update selected component (start with resistor)
updateSelected(patch = {}) {
  const c = this.selected;
  if (!c) return;

  // value
   if (typeof patch.value !== "undefined") {
    if (c.type === "capacitor") {
      c.value = this._formatCapUF(patch.value);
    } else if (c.type === "inductor") {
      c.value = this._formatInductMH(patch.value); // ← NEW
    } else {
      c.value = patch.value;
    }
  }

  // label (no spaces, max len)
  if (typeof patch.label !== "undefined") {
    c.label = this._sanitizeLabel(patch.label);
  }

  // terminals (as you already have)
  if (patch.terminals) {
    for (const k of Object.keys(patch.terminals)) {
      const idx = Number(k);
      const tpatch = patch.terminals[k] || {};
      if (!c.terminals || !c.terminals[idx]) continue;
      if (typeof tpatch.netLabel !== "undefined") {
        c.terminals[idx].netLabel = tpatch.netLabel;
        this._updateWireLabelsFor(c.id, idx, tpatch.netLabel);
        this._propagateNetLabel(c.id, idx, tpatch.netLabel);
      }
    }
  }

  // canvas.js  — updateSelected(patch) ke andar, this.draw() se pehle:
if (patch.subckt && typeof patch.subckt.name !== "undefined") {
  const c = this.selected;
  if (c && c.type === "subcktbox") {
    c.subckt = c.subckt || {};
    c.subckt.name = String(patch.subckt.name);
    // optional: label ko sync rakhna (drawSubcktBox dono me se kisi ek ko padhta hai)
    c.label = c.subckt.name;
  }
}


  this.draw();
}



  // Grid ko screen par kitna chhota/ghana dikhna allow hai
MIN_GRID_PX = 18;   // zoom-out par grid gap isse chhota na ho
MAX_GRID_PX = 48;   // (optional) zoom-in par gap isse bada na ho

getEffectiveGridStep() {
  const base = this.gridSize;      // world units (e.g., 30)
  const px   = base * this.scale;  // current on-screen pixels per base step

  // Zoomed-out: spacing too small → step ko 2^n se bada do
  if (px < this.MIN_GRID_PX) {
    const n = Math.ceil(Math.log2(this.MIN_GRID_PX / px));
    return base * Math.pow(2, n);
  }

  // (Optional) Zoomed-in: spacing too large → step ko 2^n se chhota karo
  if (px > this.MAX_GRID_PX) {
    const n = Math.floor(Math.log2(px / this.MAX_GRID_PX));
    return base / Math.pow(2, n);
  }

  // within band
  return base;
}

//fit to screen icon k liye
resetView() {
  // zoom reset
  this.scale = 1;
  // center to current canvas size (CSS px you store in width/height)
  this.offsetX = this.width / 2;
  this.offsetY = this.height / 2;
  this.draw();
}

  rotateSelected(direction = "cw") {
  if (!this.selected) return;

  const comp = this.selected;
  if (comp.angle === undefined) comp.angle = 0;

  // ensure terminals are relative to component origin
  if (!comp.terminalsBase) {
    comp.terminalsBase = comp.terminals.map(t => ({
      x: (Math.abs(t.x) > 200 || Math.abs(t.y) > 200) ? (t.x - comp.x) : t.x,
      y: (Math.abs(t.x) > 200 || Math.abs(t.y) > 200) ? (t.y - comp.y) : t.y,
      netLabel: t.netLabel
    }));
  }

  const angleDelta = direction === "ccw" ? -Math.PI / 2 : Math.PI / 2;

  // rotate each terminal by ±90° around the component center
  comp.terminals = comp.terminals.map(t => {
    const rel = {
      x: (Math.abs(t.x) > 200 || Math.abs(t.y) > 200) ? (t.x - comp.x) : t.x,
      y: (Math.abs(t.x) > 200 || Math.abs(t.y) > 200) ? (t.y - comp.y) : t.y
    };
    // +90° (cw): (x,y) -> (-y, x)
    // -90° (ccw): (x,y) -> (y, -x)
    const r = direction === "ccw"
      ? { x: rel.y,  y: -rel.x }
      : { x: -rel.y, y:  rel.x };
    return { x: r.x, y: r.y, netLabel: t.netLabel };
  });

  comp.angle = ((comp.angle || 0) + angleDelta) % (2 * Math.PI);

  this.rerouteWiresFor(comp);
  this._commit('rotate');
  
  this.draw();
}



rotatePoint90(p) {
  return { x: -p.y, y: p.x };
}

deleteSelected() {
  // If multi selection present, delete all of them (and their wires)
if (this.multiSelected && this.multiSelected.length) {
  const ids = new Set(this.multiSelected.map(c => c.id));

  // remove components
  this.components = this.components.filter(c => !ids.has(c.id));

  // remove connected wires
  this.wires = this.wires.filter(w => {
    const fromId = w?.from?.compId;
    const toId   = w?.to?.compId;
    return !(ids.has(fromId) || ids.has(toId));
  });

  // clear selection + marquee
  this.multiSelected = [];
  this.marquee = null;

  this.draw();
  this._commit('delete');

  return;            // ✅ single-delete logic niche rehne do (unchanged)
}

  const comp = this.selected;
  if (!comp) return;

  // 1) remove all wires connected to this component
  this.wires = this.wires.filter(w =>
    w.from.compId !== comp.id && w.to.compId !== comp.id
  );

  // 2) remove component itself
  this.components = this.components.filter(c => c.id !== comp.id);

  // 3) clear selection state
  this.selected = null;
  this.selectedTerminals = [];

  // 4) recompute nets for remaining circuit
  this.recomputeNets();

  // 5) redraw
  this.draw();
  this._commit('delete');

}

// Copy current selection (components + fully-internal wires) into engine clipboard
copySelection() {
  const { ids, bbox } = this.getSelectionInfo();
  if (!ids.length) return false;

  const idSet = new Set(ids);
  const comps = this.components.filter(c => idSet.has(c.id));

  // Take only those wires whose both ends are inside selection
  const wires = this.wires.filter(w =>
    idSet.has(w?.from?.compId) && idSet.has(w?.to?.compId)
  );

  // Snapshot components (shallow clone is fine; we'll rebuild new ids on paste)
 const compsSnap = comps.map(c => ({
  ...c,
  // deep clone terminals so snapshot is independent
  terminals: (c.terminals || []).map(t => ({ ...t })),
}));


  this.clipboard = {
    comps: compsSnap,
    wires: wires.map(w => ({
      ...w,
      from: { ...w.from },
      to:   { ...w.to }
    })),
    anchor: { x: bbox?.minX ?? 0, y: bbox?.minY ?? 0 },
    w: (bbox?.maxX ?? 0) - (bbox?.minX ?? 0),
    h: (bbox?.maxY ?? 0) - (bbox?.minY ?? 0)
  };
  this._pasteCount = 0; // reset bump
  return true;
}


// Collect IDs of current selection (multiSelected > selected) and a rough bbox
getSelectionInfo() {
  let ids = [];
  if (this.multiSelected && this.multiSelected.length) {
    ids = this.multiSelected.map(c => c.id);
  } else if (this.selected) {
    ids = [this.selected.id];
  }
  if (!ids.length) return { ids: [], bbox: null };

  const comps = this.components.filter(c => ids.includes(c.id));
  // rough bbox from component origins; works well enough for anchor
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of comps) {
    minX = Math.max(Math.min(minX, c.x || 0), -1e9);
    minY = Math.max(Math.min(minY, c.y || 0), -1e9);
    maxX = Math.min(Math.max(maxX, c.x || 0),  1e9);
    maxY = Math.min(Math.max(maxY, c.y || 0),  1e9);
  }
  return { ids, bbox: { minX, minY, maxX, maxY } };
}

// ---- Make auto net names unique only for just-pasted components ----
// ---- Make pasted nets unique (auto + custom both) ----
// - Auto nets:   net<digits>[letters]  => root is "net<digits>"  (net1, net1a, net23ab)
// - Custom nets: anything else         => root is label minus trailing letters (e.g. "input1a" -> "input1")
//                                             if no trailing digits exist (e.g. "VDD") root stays same ("VDD")
uniquifyPastedNets(newComps = []) {
  if (!Array.isArray(newComps) || !newComps.length) return;

  const AUTO_RX = /^net(\d+)([a-z]*)$/i;

  // ids of newly pasted comps
  const newIds = new Set(newComps.map(c => c.id));

  // collect all labels already used by existing (non-pasted) components
  const used = new Set();
  for (const c of this.components) {
    if (newIds.has(c.id)) continue;
    (c.terminals || []).forEach(t => {
      if (t?.netLabel) used.add(t.netLabel);
    });
  }

  // group new terminals by their OLD label (auto + custom both)
  const byLabel = new Map(); // oldLabel -> [{compId, idx}]
  for (const c of newComps) {
    (c.terminals || []).forEach((t, idx) => {
      const lab = t?.netLabel;
      if (!lab) return;
      if (!byLabel.has(lab)) byLabel.set(lab, []);
      byLabel.get(lab).push({ compId: c.id, idx });
    });
  }

  // suffix generator: a, b, c, …, aa, ab, …
  const alpha = 'abcdefghijklmnopqrstuvwxyz';
  const bumpFrom = (root) => {
    let k = 0;
    for (;;) {
      let suf = '';
      let n = k;
      do {
        suf = alpha[n % alpha.length] + suf;
        n = Math.floor(n / alpha.length) - 1;
      } while (n >= 0);
      const cand = `${root}${suf}`;
      if (!used.has(cand)) return cand;
      k++;
    }
  };

  // for each old label, if it clashes with existing -> bump only the pasted ones
  for (const [oldLab, nodes] of byLabel.entries()) {
    if (!used.has(oldLab)) { 
      // old label is globally unique; reserve it so next paste can bump properly
      used.add(oldLab); 
      continue; 
    }

    // decide root
    let root;
    const m = AUTO_RX.exec(oldLab);
    if (m) {
      // auto net => root "net<digits>"
      root = `net${m[1]}`;
    } else {
      // custom => strip trailing letters to preserve numeric part (e.g., input1a -> input1)
      const stripped = oldLab.replace(/[a-z]+$/i, '');
      root = stripped || oldLab;  // if pure text like "VDD", keep as-is (-> "VDDA", "VDDB", …)
    }

    const newLab = bumpFrom(root);
    used.add(newLab);

    // apply on all terminals of the pasted group that had oldLab
    for (const { compId, idx } of nodes) {
      const comp = this.components.find(c => c.id === compId);
      if (!comp || !comp.terminals || !comp.terminals[idx]) continue;
      comp.terminals[idx].netLabel = newLab;
      // keep wire-end metadata consistent
      this._updateWireLabelsFor(compId, idx, newLab);
    }
  }
}



// Paste clipboard near (tx, ty) world position; returns new ids
pasteClipboardAt(tx, ty) {
  if (!this.clipboard) return [];

  // Prepare id map (old -> new)
  const idMap = new Map();
  const newComps = [];
  const bump = this._pasteBump * (this._pasteCount++); // slight offset for repeated Ctrl+V

  const dx = (tx || 0) - this.clipboard.anchor.x + bump;
  const dy = (ty || 0) - this.clipboard.anchor.y + bump;
  

  // Helper to make a fresh unique id
  const newId = () => `cp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

   // ⛔ preflight: block paste if any pasted component would overlap existing ones
  // (same 120px half-box convention as drag/overlap)
  for (const snap of this.clipboard.comps) {
    if (snap?.type === 'manualWire') continue; // manualWire can overlap anything
    const nx = Math.round((snap.x + dx) / this.gridSize) * this.gridSize;
    const ny = Math.round((snap.y + dy) / this.gridSize) * this.gridSize;
    if (this._overlapsAnyComponent(nx, ny , 70 )) {
      alert("Paste blocked: overlaps existing components. Paste somewhere else.");
      return [];
    }
  }


  // 1) spawn components
  for (const snap of this.clipboard.comps) {
    const c = {
  ...snap,
  // ensure pasted instance has its own terminals objects
  terminals: (snap.terminals || []).map(t => ({ ...t })),
};

    const oldId = c.id;
    c.id = newId();

    // shift position
    c.x = Math.round((c.x + dx) / this.gridSize) * this.gridSize;
    c.y = Math.round((c.y + dy) / this.gridSize) * this.gridSize;

    // clear any transient selection state
    c.isSelected = false;

    this.components.push(c);
    newComps.push(c);
    idMap.set(oldId, c.id);
  }

// 2) rebuild wires for the new components (and route them)
for (const w of this.clipboard.wires) {
  const nfrom = idMap.get(w.from.compId);
  const nto   = idMap.get(w.to.compId);
  if (!nfrom || !nto) continue;

  const nw = {
    id: newId(),
    from: { compId: nfrom, terminalIndex: w.from.terminalIndex },
    to:   { compId: nto,   terminalIndex: w.to.terminalIndex },
    color: w.color || null,
    path: null
  };

  // find newly pasted endpoints (world coords)
  const fc = this.components.find(c => c.id === nfrom);
  const tc = this.components.find(c => c.id === nto);
  const ft = fc?.terminals?.[w.from.terminalIndex];
  const tt = tc?.terminals?.[w.to.terminalIndex];

  if (fc && tc && ft && tt) {
    const start = { x: fc.x + (ft.x || 0), y: fc.y + (ft.y || 0) };
    const end   = { x: tc.x + (tt.x || 0), y: tc.y + (tt.y || 0) };

    // try autoroute; fallback to simple 'L' if it doesn't return anything
    let path = null;
    try {
      // aStarOrthogonalPath(start, end, components, gridSize) — jo aap wire.js me use karte ho
      path = aStarOrthogonalPath(start, end, this.components, this.gridSize);
    } catch {}

    if (!Array.isArray(path) || !path.length) {
      path = [ start, { x: end.x, y: start.y }, end ];
    }
    nw.path = path;
  }

  this.wires.push(nw);
}


  // ⬇️ NEW: give the pasted group unique auto-net names if they clash with existing ones
this.uniquifyPastedNets(newComps);

  // 3) select pasted parts
  this.selected = null;
  this.multiSelected = [...newComps];

  // 4) recompute nets only for consistent labels; (stable naming code keeps user labels)
  // if (typeof this.recomputeNets === 'function') this.recomputeNets();

  this.draw();
  return newComps.map(c => c.id);
}



// Recompute net labels from scratch using remaining wires
recomputeNets() {

  // --- helpers for stable net naming --- inko remove kiya ja skta h agr net mein problems aayi to
const isAuto = (s) => typeof s === 'string' && /^net\d+$/i.test(s);

// snapshot old labels (before we touch anything)
const oldLabelByNode = new Map();   // key: `${comp.id}:${ti}`
for (const comp of this.components) {
  const terms = comp.terminals || [];
  terms.forEach((t, ti) => {
    oldLabelByNode.set(`${comp.id}:${ti}`, t?.netLabel || '');
  });
}

// compute the highest auto net number already present (to keep increment monotonic)
let maxAuto = 0;
for (const s of oldLabelByNode.values()) {
  const m = (typeof s === 'string') && s.match(/^net(\d+)$/i);
  if (m) maxAuto = Math.max(maxAuto, parseInt(m[1], 10));
}
let nextAuto = maxAuto + 1;

//ye block yahan tk h jo net mein problem aane wali situation mein remove kiya ja skta h

  // DSU helpers
  const parent = new Map();
  const nodeId = (compId, ti) => `${compId}:${ti}`;
  const find = (x) => {
    let p = parent.get(x);
    if (p !== x) {
      p = find(p);
      parent.set(x, p);
    }
    return p;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  // 1) init each terminal as its own set
  for (const comp of this.components) {
    if (!comp.terminals) continue;
    comp.terminals.forEach((_, i) => {
      const id = nodeId(comp.id, i);
      parent.set(id, id);
    });
  }

  // 2) union by remaining wires
  for (const w of this.wires) {
    const a = nodeId(w.from.compId, w.from.terminalIndex);
    const b = nodeId(w.to.compId,   w.to.terminalIndex);
    if (parent.has(a) && parent.has(b)) union(a, b);
  }

// 2.5) manualWire behavior:
//  - its 2 terminals are a SHORT => always same net
//  - if a manualWire terminal lands exactly on any other terminal coordinate,
//    they become same net (and since manualWire is short, both ends follow).

const labelWorld = (comp, t) => {
  const lx = t.x, ly = t.y;

  // subcktbox terminals behave like simple local offsets
  if (comp?.type === 'subcktbox') {
    return { x: comp.x + lx, y: comp.y + ly };
  }

  // world-space terminals (or huge coords) are already absolute
  if (t?.terminalSpace === 'world' || Math.abs(lx) > 200 || Math.abs(ly) > 200) {
    return { x: lx, y: ly };
  }

  // some components use base terminals (no rotation)
  if (comp?.terminalsBase) {
    return { x: comp.x + lx, y: comp.y + ly };
  }

  // normal local terminal with optional rotation
  if (!comp?.angle) return { x: comp.x + lx, y: comp.y + ly };
  const s = Math.sin(comp.angle), c = Math.cos(comp.angle);
  return { x: comp.x + lx * c - ly * s, y: comp.y + lx * s + ly * c };
};

// (A) short endpoints of each manualWire
for (const comp of this.components) {
  if (comp?.type !== 'manualWire') continue;
  if (!Array.isArray(comp.terminals) || comp.terminals.length < 2) continue;

  const a = nodeId(comp.id, 0);
  const b = nodeId(comp.id, 1);
  if (parent.has(a) && parent.has(b)) union(a, b);
}

// (B) coordinate-connect: only when that coordinate has a manualWire terminal
const coordMap = new Map(); // key -> { nodes:[], hasMW:boolean }

for (const comp of this.components) {
  const terms = comp.terminals || [];
  for (let i = 0; i < terms.length; i++) {
    const id = nodeId(comp.id, i);
    if (!parent.has(id)) continue;

    const w = labelWorld(comp, terms[i]);
    const k = `${Math.round(w.x)}:${Math.round(w.y)}`;

    if (!coordMap.has(k)) coordMap.set(k, { nodes: [], hasMW: false });
    const entry = coordMap.get(k);
    entry.nodes.push(id);
    if (comp?.type === 'manualWire') entry.hasMW = true;
  }
}

for (const entry of coordMap.values()) {
  if (!entry.hasMW) continue;      // only auto-merge when manualWire is involved
  if (entry.nodes.length < 2) continue;

  const [first, ...rest] = entry.nodes;
  for (const n of rest) union(first, n);
}



  // 3) assign fresh net labels per connected component
  // 3) build connected groups from DSU  ye bhi remove kiya ja skta h in-case net labels mein problem hui
const rootMembers = new Map(); // root -> [{compId, termIndex}]
for (const comp of this.components) {
  const terms = comp.terminals || [];
  terms.forEach((_, i) => {
    const id = `${comp.id}:${i}`;
    if (!parent.has(id)) return;
    const r = find(id);
    if (!rootMembers.has(r)) rootMembers.set(r, []);
    rootMembers.get(r).push({ compId: comp.id, termIndex: i });
  });
}

// Convert to "groups" like your patch expects
const groups = Array.from(rootMembers.values()).map(members => ({ members }));

// --- candidate selection & stable assignment (pref: custom > old auto > new auto) ---
const bundle = groups.map(g => {
  const ids = g.members.map(m => `${m.compId}:${m.termIndex}`);
  const names = ids.map(id => oldLabelByNode.get(id)).filter(Boolean);

  const custom = names.find(n => n && !isAuto(n));  // user-named label?
  const oldAuto = names.find(n => isAuto(n));       // keep old auto if possible
  const cand = custom || oldAuto || null;

  return { g, ids, size: ids.length, cand };
});

// Largest groups first -> keeps old numbers on the “main” piece after a split
bundle.sort((a, b) => b.size - a.size);

const used = new Set();
for (const b of bundle) {
  let label = b.cand;
  if (!label) label = `net${nextAuto++}`;      // allocate fresh
  if (isAuto(label) && used.has(label)) {
    label = `net${nextAuto++}`;                // avoid dup auto label
  }
  used.add(label);

  // write label back
  for (const id of b.ids) {
    const [cid, tiStr] = id.split(':');
    const comp = this.components.find(c => String(c.id) === cid);
    const terms = comp?.terminals || [];
    const ti = parseInt(tiStr, 10);
    if (terms[ti]) terms[ti].netLabel = label;
  }
}

// keep counter moving forward for any future terminals
this.netCounter = nextAuto;

}




clearAll() {
  // wipe all stored components & wires
  this.components = [];
  this.wires = [];
  this.selected = null;
  this.selectedTerminals = [];

  // reset all component counters
  this.resistorCount = 0;
  this.capacitorCount = 0;
  this.inductorCount = 0;
  this.diodeCount = 0;
  this.npnCount = 0;
  this.pnpCount = 0;
  this.nmosCount = 0;
  this.pmosCount = 0;
  this.inCount = 0;
  this.outCount = 0;
  this.inoutCount = 0;
  this.vdcCount = 0;
  this.vssiCount = 0;
  this.vddiCount = 0;
  this.andCount = 0;
  this.orCount = 0;
  this.notCount = 0;
  this.nandCount = 0;
  this.norCount = 0;
  this.xorCount = 0;

  // reset global net counter
  this.netCounter = 1;

  // redraw clean grid
  this.draw();
  
}

 resize(width, height) {
  // recalc DPR (multi-monitor cases)
  this.dpr = window.devicePixelRatio || 1;

  // previous CSS size (not device pixels)
  const prevCssW = this.canvas.width / this.dpr || width;
  const prevCssH = this.canvas.height / this.dpr || height;

  // previous world center sitting at visual center
  const prevCenterWorld = this.toWorldCoords(prevCssW / 2, prevCssH / 2);

  // set CSS size (style) + backing store (device pixels)
  this.canvas.style.width = `${width}px`;
this.canvas.style.height = `${height}px`;

  this.canvas.width  = Math.floor(width  * this.dpr);
  this.canvas.height = Math.floor(height * this.dpr);

  // store css dims
  this.width = width;
  this.height = height;

  // reset transform to DPR (we'll translate/scale later)
  this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

  // keep same world center at new visual center
  this.offsetX = (width  / 2) - prevCenterWorld.x * this.scale;
  this.offsetY = (height / 2) - prevCenterWorld.y * this.scale;
}

 clear() {
  const { ctx, canvas } = this;
  ctx.save();
  // clear ALWAYS in identity space over full backing store
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}


  toWorldCoords(clientX, clientY) {
    return {
      x: (clientX - this.offsetX) / this.scale,
      y: (clientY - this.offsetY) / this.scale
    };
  }

snapToGrid(val) {
  const MIN_GRID_PX = 24;
  const gridPx = this.gridSize * this.scale;
  const skip = gridPx >= MIN_GRID_PX ? 1 : Math.ceil(MIN_GRID_PX / gridPx);
  const step = this.gridSize * skip;
  return Math.round(val / step) * step;
}
drawGrid() {
  const { ctx, width, height, gridSize, scale, offsetX, offsetY } = this;

  ctx.save();
  ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // --- skip logic: maintain minimum on-screen spacing ---
  const MIN_GRID_PX = 24; // try 24/28/32 until it looks right on your monitor
  const gridPx = gridSize * scale;
  const skip = gridPx >= MIN_GRID_PX ? 1 : Math.ceil(MIN_GRID_PX / gridPx);
  const step = gridSize * skip;    // effective world step to draw
  // ------------------------------------------------------

  const startX = -offsetX / scale;
  const startY = -offsetY / scale;
  const endX   = (width  - offsetX) / scale;
  const endY   = (height - offsetY) / scale;

  const firstX = Math.floor(startX / step) * step;
  const firstY = Math.floor(startY / step) * step;

  ctx.beginPath();
  ctx.strokeStyle = '#333';
  // line too thin at deep zoom-out looks dotted -> clamp a floor
  ctx.lineWidth = Math.max(0.7 / scale, 0.5 / this.dpr);

  for (let x = firstX; x <= endX; x += step) {
    ctx.moveTo(x, startY); ctx.lineTo(x, endY);
  }
  for (let y = firstY; y <= endY; y += step) {
    ctx.moveTo(startX, y); ctx.lineTo(endX, y);
  }
  ctx.stroke();
  ctx.closePath();

  // origin
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = Math.max(1.5 / scale, 0.8 / this.dpr);
  ctx.moveTo(0, startY); ctx.lineTo(0, endY);
  ctx.moveTo(startX, 0); ctx.lineTo(endX, 0);
  ctx.stroke();
  ctx.closePath();

  ctx.restore();
}



  rerouteWiresFor(component) {
  if (!component) return;

  for (const wire of this.wires) {
    const fromComp = this.components.find(c => c.id === wire.from.compId);
    const toComp = this.components.find(c => c.id === wire.to.compId);

    if (fromComp === component || toComp === component) {
      const fromTerm = fromComp.terminals[wire.from.terminalIndex];
      const toTerm = toComp.terminals[wire.to.terminalIndex];

      const from = {
        x: fromComp.x + fromTerm.x,
        y: fromComp.y + fromTerm.y
      };
      const to = {
        x: toComp.x + toTerm.x,
        y: toComp.y + toTerm.y
      };

      if (!this.hasTerminalMoved(wire, from, to)) {
        continue; // no reroute needed
      }

let newPath = null;

// try A* first
try {
  newPath = aStarOrthogonalPath(from, to, this.components, this.gridSize);
} catch (_) {}

// ✅ fallback so wire ALWAYS stays attached to terminals
if (!Array.isArray(newPath) || newPath.length < 2) {
  const elbow1 = { x: to.x,   y: from.y };
  const elbow2 = { x: from.x, y: to.y };

  // pick a non-degenerate elbow (avoid duplicate points)
  const isSame = (a, b) => a.x === b.x && a.y === b.y;

  if (!isSame(elbow1, from) && !isSame(elbow1, to)) {
    newPath = [from, elbow1, to];
  } else if (!isSame(elbow2, from) && !isSame(elbow2, to)) {
    newPath = [from, elbow2, to];
  } else {
    // worst-case: direct (still keeps endpoints correct)
    newPath = [from, to];
  }
}

wire.path = newPath;

// (optional safety) if your code ever uses pathPoints somewhere else
if (wire.pathPoints) wire.pathPoints = newPath;

this.lastReroutePositions.set(wire.id, { from, to });

    }
  }
}


drawXORAt(x, y, label = 'XOR') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);
    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }
  const finalLabel = this._coerceAutoLabel(label, 'XOR');
  const uniqueId = `xor_${Date.now()}_${Math.floor(Math.random() * 1000)}`; // ✅
  const xor = {
    id: uniqueId, 
    x: snappedX, 
    y: snappedY, 
    label: finalLabel,
    type: 'xor',
    xor: { inputs: 2, Wn: 1, Wp: 2, L: 1, m: 1 },
    terminals: getXORTerminals(2)
   };
  this.components.push(xor);
  this.selected = xor;
  // console.log(`🆔 New XOR component added with ID: ${uniqueId}`);

  this.draw();
}

drawNORAt(x, y, label = 'NOR') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);
    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }
  const finalLabel = this._coerceAutoLabel(label, 'NOR');

  const uniqueId = `nor_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const nor = { 
    id: uniqueId, 
    x: snappedX, 
    y: snappedY, 
    label: finalLabel, 
    type: 'nor',
    nor: { inputs: 2, Wn: 1, Wp: 2, L: 1, m: 1 },
    terminals: getNORTerminals(2)
  };
  this.components.push(nor);
  this.selected = nor;
  // console.log(`🟣 New NOR component added with ID: ${uniqueId}`);
  this.draw();
}


drawNANDAt(x, y, label = 'NAND') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);
    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }
  const finalLabel = this._coerceAutoLabel(label, 'NAND');
  const uniqueId = `nand_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const nand = { 
    id: uniqueId, 
    x: snappedX, 
    y: snappedY, 
    label: finalLabel,
    type: 'nand',
   nand: { inputs: 2, Wn: 1, Wp: 2, L: 1, m: 1 },
   terminals: getNANDTerminals(2)
  };
  this.components.push(nand);
  this.selected = nand;
  // console.log(`🟤 New NAND component added with ID: ${uniqueId}`);
  this.draw();
}


drawNOTAt(x, y, label = 'NOT') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);
    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }
  const finalLabel = this._coerceAutoLabel(label, 'NOT');
  const uniqueId = `not_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const notGate = {
     id: uniqueId,
     x: snappedX, 
     y: snappedY, 
     label: finalLabel,
     type: 'not',
     terminals: getNOTTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',
}))

    };
  this.components.push(notGate);
  this.selected = notGate;
  // console.log(`🟢 New NOT component added with ID: ${uniqueId}`);
  this.draw();
}


drawORAt(x, y, label = 'OR') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);
    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  const uniqueId = `or_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const or = {
     id: uniqueId,
     x: snappedX,
     y: snappedY,
     label, type: 'or',
     terminals: getORTerminals(snappedX, snappedY)

       };
  this.components.push(or);
  this.selected = or;
  // console.log(`🔵 New OR component added with ID: ${uniqueId}`);
  this.draw();
}



drawVDDIAt(x, y, label = 'VDDI') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);
    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  const uniqueId = `vddi_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const vddi = { 
    id: uniqueId, 
    x: snappedX, 
    y: snappedY,
    label, 
    type: 'vddi',
    terminals: getVDDITerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })) 
  };
  this.components.push(vddi);
  this.selected = vddi;
  // console.log(`⚡ New VDDI component added with ID: ${uniqueId}`);
  this.draw();
}



drawVSSIAt(x, y, label = 'VSSI') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);
    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  const uniqueId = `vssi_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const vssi = { 
    id: uniqueId, 
    x: snappedX, 
    y: snappedY, 
    label, 
    type: 'vssi',
    terminals: getVSSITerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })) 
  };
  this.components.push(vssi);
  this.selected = vssi;
  // console.log(`🔻 New VSSI component added with ID: ${uniqueId}`);
  this.draw();
}


drawResistorAt(x, y, value = '1Ω') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

   // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  this.resistorCount += 1;
  const label = `R${this.resistorCount}`;
  const uniqueId = `resistor_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const resistor = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    type: 'resistor',
    value,
    label,
   terminals: getResistorTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })) 
  };

  this.components.push(resistor);
  this.selected = resistor;
  // console.log(`🟠 New Resistor added with ID: ${uniqueId}`);
  this.draw();
}



drawCapacitorAt(x, y, value = '10µF') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

   // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  this.capacitorCount += 1;
  const label = `C${this.capacitorCount}`;
  const uniqueId = `capacitor_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
   const normalized = this._formatCapUF ? this._formatCapUF(value) : value;

  const cap = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    type: 'capacitor',
    value:  normalized,
    label,
    terminals: getCapacitorTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })) 

  };

  this.components.push(cap);
  this.selected = cap;
  // console.log(`🔵 Capacitor added with ID: ${uniqueId}`);
  this.draw();
}



drawInductorAt(x, y, value = '10 mH') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

  

   // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  this.inductorCount += 1;
  const label = `L${this.inductorCount}`;
  const uniqueId = `inductor_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const normalized = this._formatInductMH(value);
  const inductor = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    type: 'inductor',
    value: normalized,
    label,
     terminals: getInductorTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })) 

  };

  this.components.push(inductor);
  this.selected = inductor;
  // console.log(`🟣 Inductor added with ID: ${uniqueId}`);
  this.draw();
}

drawManualWireAt(x, y) {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

  // ✅ No overlap blocking for manualWire
  const uniqueId = `manualWire_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  // ✅ manualWire: both terminals must start with SAME net label
if (!this.netCounter) this.netCounter = 1;
const sharedNet = `net${this.netCounter++}`;


  const mw = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    type: 'manualWire',
    label: '',
    value: '',
    terminals: getManualWireTerminals(snappedX, snappedY, this.gridSize).map(t => ({
      ...t,
      x: t.x - snappedX,
      y: t.y - snappedY,
      terminalSpace: 'local',
      netLabel: sharedNet,
    })),
  };

  this.components.push(mw);
  this.selected = mw;
  this.draw();
}




drawDiodeAt(x, y, value = '1N4148') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }


  this.diodeCount += 1;
  const label = `D${this.diodeCount}`;
  const uniqueId = `diode_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const diode = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    type: 'diode',
    value,
    label,
    terminals: getDiodeTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })),
    diodeFixed: this._getDiodeFixedDefaults(),
    diodeSize: this._computeDiodeSizeParams(this._getDefaultDiodeArea()), // area+Is/Rs/Cj

  };

  this.components.push(diode);
  this.selected = diode;
  // console.log(`⚡ Diode added with ID: ${uniqueId}`);
  this.draw();
}


drawNPNAt(x, y, label = 'NPN') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  const uniqueId = `npn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  this.npnCount += 1;
  const finalLabel = /^Q/i.test(label) ? label : `Q${this.npnCount}`;


  const npn = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    label: finalLabel,
    type: 'npn',
     terminals: getNPNTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })),
    npnArea: 1.0, // ✅ default AREA

  };

  this.components.push(npn);
  this.selected = npn;
  // console.log(`📘 NPN added with ID: ${uniqueId}`);
  this.draw();
}


drawPNPAt(x, y, label = 'PNP') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  const uniqueId = `pnp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
   this.pnpCount += 1;
   const finalLabel = /^Q/i.test(label) ? label : `Q${this.pnpCount}`;


  const pnp = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    label: finalLabel, 
    type: 'pnp',
    terminals: getPNPTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })) ,
    pnpArea: 1.0,  
  };

  this.components.push(pnp);
  this.selected = pnp;
  // console.log(`📗 PNP added with ID: ${uniqueId}`);
  this.draw();
}


drawNMOSAt(x, y, label = 'NMOS') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }
  const finalLabel = this._coerceAutoLabel(label, 'NMOS');
  const uniqueId = `nmos_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const nmos = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    label: finalLabel,
    type: 'nmos',
    terminals: getNMOSTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })),
    nmos: { L: 1, W: 1, type: 'LVT' }
  };

  this.components.push(nmos);
  this.selected = nmos;
  // console.log(`📕 NMOS added with ID: ${uniqueId}`);
  this.draw();
}

drawPMOSAt(x, y, label = 'PMOS') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }
  const finalLabel = this._coerceAutoLabel(label, 'PMOS');
  const uniqueId = `pmos_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const pmos = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    label: finalLabel,
    type: 'pmos',
    terminals: getPMOSTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  }))  
  };

  this.components.push(pmos);
  this.selected = pmos;
  // console.log(`🟣 PMOS added with ID: ${uniqueId}`);
  this.draw();
}


drawINAt(x, y, label = 'IN') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  const uniqueId = `in_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const input = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    label,
    type: 'in',
    terminals: getINTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })) 
  };

  this.components.push(input);
  this.selected = input;
  // console.log(`🔵 IN added with ID: ${uniqueId}`);
  this.draw();
}


drawOUTAt(x, y, label = 'OUT') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  const uniqueId = `out_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const output = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    label,
    type: 'out',
    terminals: getOUTTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })) 
  };

  this.components.push(output);
  this.selected = output;
  // console.log(`🟠 OUT added with ID: ${uniqueId}`);
  this.draw();
}


drawInOutAt(x, y, label = 'IN-OUT') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  const uniqueId = `inout_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const inout = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    label,
    type: 'in-out',
    terminals: getINOUTTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })) 
  };

  this.components.push(inout);
  this.selected = inout;
  // console.log(`⚫ IN-OUT added with ID: ${uniqueId}`);
  this.draw();
}


drawVDCAt(x, y, value = '1 V') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }


  if (!this.vdcCount) this.vdcCount = 0;
  this.vdcCount += 1;

  const label = `V${this.vdcCount} (${value})`;
  const uniqueId = `vdc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const vdc = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    type: 'vdc',
    value,
    label,
    terminals: getVDCTerminals(snappedX, snappedY).map(t => ({
  ...t,
  x: t.x - snappedX,
  y: t.y - snappedY,
  terminalSpace: 'local',   // flag for draw loop
  })) 
  };

  this.components.push(vdc);
  this.selected = vdc;
  // console.log(`🔋 VDC added with ID: ${uniqueId}`);
  this.draw();
}


drawANDAt(x, y, label = 'AND') {
  const snappedX = this.snapToGrid(x);
  const snappedY = this.snapToGrid(y);

    // ⛔ don't allow overlapping
  if (this.isOverlapping(snappedX, snappedY)) {
    alert("Can't place component here — overlaps another!");
    return;
  }

  const uniqueId = `and_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const and = {
    id: uniqueId,
    x: snappedX,
    y: snappedY,
    label,
    type: 'and',
    terminals: getANDTerminals(snappedX, snappedY)
  };

  this.components.push(and);
  this.selected = and;
  // console.log(`🟢 AND added with ID: ${uniqueId}`);
  this.draw();
}

isOverlapping(x, y, ignoreComponent = null) {
  if (ignoreComponent?.type === 'manualWire') return false;
  const half = 60;

  for (const comp of this.components) {
    if (comp === ignoreComponent) continue;
    if (comp?.type === 'manualWire') continue;

    if (!(
      x + half <= comp.x - half ||
      x - half >= comp.x + half ||
      y + half <= comp.y - half ||
      y - half >= comp.y + half
    )) {
      return true;
    }
  }

  return false;
}


hasTerminalMoved(wire, from, to) {
  const key = wire.id;
  const last = this.lastReroutePositions.get(key);
  if (!last) return true;

  return (
    last.from.x !== from.x ||
    last.from.y !== from.y ||
    last.to.x !== to.x ||
    last.to.y !== to.y
  );
}
}

installDraw(CanvasUtils.prototype);
installHandleMouseDown(CanvasUtils.prototype);
installMouseMoveUpZoom(CanvasUtils.prototype);
export default CanvasUtils;
