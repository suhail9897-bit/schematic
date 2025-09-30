// Parse uploaded design JSON (+ embedded netlist lines) to a clean spec
export function extractBoxSpecFromDesign(design = {}, filename = "DESIGN") {
  const upper = (s) => String(s || "").toUpperCase();

  // 1) NAME from filename (strip extension)
  const name = upper(filename.replace(/\.[^.]+$/, "") || "DESIGN");

  // 2) INPUT & OUTPUT nets from components[]
  const inputs = [];
  let output = "OUT";
  if (Array.isArray(design.components)) {
    for (const c of design.components) {
      if (c?.type === "in") {
        const t = (c.terminals || [])[0];
        const n = upper(t?.netLabel || c.label || "");
        if (n) inputs.push(n);
      } else if (c?.type === "out") {
        const t = (c.terminals || [])[0];
        const n = upper(t?.netLabel || c.label || "");
        if (n) output = n;
      }
    }
  }

  //    lekin ab subckt pin order ke base par actual net-names pick karenge
  const all = Array.isArray(design.__NETLIST_CIR_LINES) ? design.__NETLIST_CIR_LINES : [];

  // aliases jin pin-names ko "supply" maana jaa sakta hai (SUBCKT header me)
  const POWER_ALIAS = /^(VDD|VCC|VPP|VDDA|VDDD|AVDD|DVDD)$/i;
  const GND_ALIAS   = /^(VSS|GND|VEE|AGND|DGND)$/i;

  // 3a) sab SUBCKT definitions padho → pin order map banao
  const defs = new Map(); // NAME -> { pins:[], pIdx:[], gIdx:[] }
  for (const raw of all) {
    const m = String(raw||'').match(/^\s*\.SUBCKT\s+(\S+)\s+(.+)$/i);
    if (!m) continue;
    const subName = upper(m[1]);
    const rest = m[2].trim();
    const toks = rest.split(/\s+/).filter(Boolean);
    const pins = [];
    for (const t of toks) {
      if (/=/.test(t)) break;               // params start (WP=…, etc.)
      if (/^(WP|WN|L|M)$/i.test(t)) break;  // param names listed in header
      pins.push(upper(t));
    }
    const pIdx = [], gIdx = [];
    pins.forEach((p, i) => {
      if (POWER_ALIAS.test(p)) pIdx.push(i);
      if (GND_ALIAS.test(p))   gIdx.push(i);
    });
    defs.set(subName, { pins, pIdx, gIdx });
  }

  // 3b) last .SUBCKT block locate karo (usi ke instances scan karenge)
  let start = -1, end = -1;
  for (let i = 0; i < all.length; i++) {
    if (/^\s*\.SUBCKT\s+/i.test(all[i])) start = i;
  }
  if (start >= 0) {
    for (let j = start + 1; j < all.length; j++) {
      if (/^\s*\.ENDS\b/i.test(all[j])) { end = j; break; }
    }
  }
  const scan = (start >= 0 && end > start) ? all.slice(start + 1, end) : all;

  const powers = [];
  const grounds = [];

  for (const raw of scan) {
    if (!/^\s*X/i.test(raw)) continue; // sirf instance lines
    const toks = String(raw || "").trim().split(/\s+/);
    // instance me kaun sa subckt call hua?
    let subUsed = null, subIdx = -1;
    for (let i = toks.length - 1; i >= 0; i--) {
      const tU = upper(toks[i]);
      if (defs.has(tU)) { subUsed = defs.get(tU); subIdx = i; break; }
    }
    const nets = (subIdx > 1) ? toks.slice(1, subIdx).map(upper) : [];
    if (subUsed) {
      for (const i of subUsed.pIdx) if (i < nets.length) powers.push(nets[i]);
      for (const i of subUsed.gIdx) if (i < nets.length) grounds.push(nets[i]);
    } else {
      // fallback: agar definition na mile to rough regex se pick kar lo
      for (const tok of toks) {
        if (POWER_ALIAS.test(tok)) powers.push(upper(tok));
        if (GND_ALIAS.test(tok))   grounds.push(upper(tok));
      }
    }
  }

  return { name, inputs, output, powers, grounds };
}
