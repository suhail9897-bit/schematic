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
  const cirLines = all.map(String);           // NEW
  const lastSubckt = pickLastSubckt(cirLines); // NEW


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

  // ---- helper: parse appended HIER_META v1 comment block (NET PASS)
function parseHierMeta(lines = []) {
  const up = (s) => String(s || "").toUpperCase();
  const res = { unionP: [], unionG: [] };
  if (!Array.isArray(lines) || !lines.length) return res;

  // locate BEGIN/END
  let b = -1, e = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\*\s*====\s*HIER_META\s*v1\s*BEGIN\s*====\s*$/i.test(lines[i])) { b = i; break; }
  }
  if (b < 0) return res;
  for (let j = b + 1; j < lines.length; j++) {
    if (/^\s*\*\s*====\s*HIER_META\s*v1\s*END\s*====\s*$/i.test(lines[j])) { e = j; break; }
  }
  const blk = (e > b) ? lines.slice(b + 1, e) : [];

  const getList = (key) => {
    const re = new RegExp("^\\s*\\*\\s*" + key + "\\s*:\\s*(.*)$", "i");
    const ln = blk.find(s => re.test(s));
    if (!ln) return [];
    const body = ln.replace(re, "$1").trim();
    if (!body) return [];
    return body.split(",").map(s => up(s.trim())).filter(Boolean);
  };

  res.unionP = getList("union_powers");
  res.unionG = getList("union_grounds");
  return res;
}

// Prefer NET PASS meta if present
const meta = parseHierMeta(cirLines);  // 'cirLines' already built above
const preferredP = Array.isArray(meta.unionP) && meta.unionP.length ? meta.unionP : powers;
const preferredG = Array.isArray(meta.unionG) && meta.unionG.length ? meta.unionG : grounds;



  // --- add just above the return ---
const uniqOrder = (arr) => {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const key = String(v || "").toUpperCase();
    if (!seen.has(key)) { seen.add(key); out.push(key); }
  }
  return out;
};

// replace the old return with this:
return {
  name,
  inputs,
  output,
  powers: uniqOrder(preferredP),
  grounds: uniqOrder(preferredG),
  cirLines,         // NEW: full library as-is (stringified)
  lastSubckt        // NEW: { name, blockLines, blockText }
    // carry full library text for emission in netlist
  //  cirLines: Array.isArray(design.__NETLIST_CIR_LINES) ? design.__NETLIST_CIR_LINES.map(String) : []
};

}

// ---- helper: pick the last ".SUBCKT ... .ENDS" block from __NETLIST_CIR_LINES
export function pickLastSubckt(lines = []) {
  if (!Array.isArray(lines)) {
    return { name: "", blockLines: [], blockText: "" };
  }

  // last .SUBCKT ka start (peeche se)
  let start = -1, end = -1, subName = "";
  for (let i = lines.length - 1; i >= 0; i--) {
    const L = String(lines[i] || "").trim().toUpperCase();
    if (L.startsWith(".ENDS")) { end = i; break; }
  }
  if (end >= 0) {
    for (let j = end - 1; j >= 0; j--) {
      const m = String(lines[j] || "").match(/^\s*\.SUBCKT\s+(\S+)/i);
      if (m) { start = j; subName = m[1].toUpperCase(); break; }
    }
  }

  const blockLines = (start >= 0 && end > start) ? lines.slice(start, end + 1) : [];
  return {
    name: subName,
    blockLines,
    blockText: blockLines.join("\n")
  };
}

