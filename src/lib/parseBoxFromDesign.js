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

  // 3) POWER/GROUND occurrences from the **last .SUBCKT ... .ENDS** block,
  //    counting duplicates exactly as they appear on instance ("X...") lines.
  const all = Array.isArray(design.__NETLIST_CIR_LINES)
    ? design.__NETLIST_CIR_LINES
    : [];

  const POWER_RX = /^(VDD|VCC|VPP|VDDA|VDDD|AVDD|DVDD)$/i;
  const GND_RX   = /^(VSS|GND|VEE|AGND|DGND)$/i;

  // find last .SUBCKT block
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
    if (!/^\s*X/i.test(raw)) continue; // only instance lines
    const toks = String(raw || "").trim().split(/\s+/);
    for (const tok of toks) {
      if (POWER_RX.test(tok)) powers.push(upper(tok));
      if (GND_RX.test(tok))   grounds.push(upper(tok));
    }
  }

  return { name, inputs, output, powers, grounds };
}
