// src/component/netlist.jsx
// Pure utility: build SPICE netlist from CanvasEngine + trigger download.
// No React dependency.

function sanitizeCellName(s) {
  const v = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z]/.test(v)) return "";     // must start with a letter
  return v.slice(0, 12);                // max 12 chars
}

function buildNetlistString(engine, rawCellName) {
  if (!engine) return "";

  const CELL = sanitizeCellName(rawCellName);
  const NN = (s) => String(s || "").toUpperCase(); // net normalizer
  const lines = [];

  // ---- Prelude & gate libraries (copied 1:1 from Canvas.jsx) ----
  const hasN2  = engine.components.some(c => (c.type || '').toLowerCase()==='nand' && (c.nand?.inputs ?? 2) === 2);
  const hasN3  = engine.components.some(c => (c.type || '').toLowerCase()==='nand' && (c.nand?.inputs ?? 2) === 3);
  const hasR2  = engine.components.some(c => (c.type || '').toLowerCase()==='nor'  && (c.nor?.inputs  ?? 2) === 2);
  const hasR3  = engine.components.some(c => (c.type || '').toLowerCase()==='nor'  && (c.nor?.inputs  ?? 2) === 3);
  const hasX2  = engine.components.some(c => (c.type || '').toLowerCase()==='xor'  && (c.xor?.inputs  ?? 2) === 2);
  const hasX3  = engine.components.some(c => (c.type || '').toLowerCase()==='xor'  && (c.xor?.inputs  ?? 2) === 3);
  const hasNOT = engine.components.some(c => (c.type || '').toLowerCase()==='not');

  if (hasN2 || hasN3 || hasR2 || hasR3 || hasX2 || hasX3 || hasNOT) {
    lines.push('* Netlist Data', '');
    lines.push('.MODEL NMOS_GLOBEL NMOS LEVEL=6');
    lines.push('.MODEL PMOS_GLOBEL PMOS LEVEL=6', '');

    if (hasNOT) {
      lines.push('');
      lines.push('.SUBCKT NOT1 OUTPUT INPUT VDD VSS WP WN L M');
      lines.push('MP0 OUTPUT INPUT VDD VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MN0 OUTPUT INPUT VSS VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('.ENDS');
    }
    if (hasN2) {
      lines.push('');
      lines.push('.SUBCKT NAND2 OUTPUT INPUT1 INPUT2 VDD VSS WP WN L M');
      lines.push('MP0 OUTPUT INPUT1 VDD VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MP1 OUTPUT INPUT2 VDD VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MN0 OUTPUT INPUT1 NET1 VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('MN1 NET1   INPUT2 VSS VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('.ENDS');
    }
    if (hasN3) {
      lines.push('');
      lines.push('.SUBCKT NAND3 OUTPUT INPUT1 INPUT2 INPUT3 VDD VSS WP WN L M');
      lines.push('MP0 OUTPUT INPUT1 VDD VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MP1 OUTPUT INPUT2 VDD VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MP2 OUTPUT INPUT3 VDD VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MN0 OUTPUT INPUT1 NET1 VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('MN1 NET1   INPUT2 VSS VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('MN2 NET1   INPUT3 VSS VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('.ENDS');
    }
    if (hasR2) {
      lines.push('');
      lines.push('.SUBCKT NOR2 OUTPUT INPUT1 INPUT2 VDD VSS WP WN L M');
      lines.push('MP0 NET1   INPUT1 VDD VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MP1 OUTPUT INPUT2 NET1 VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MN0 OUTPUT INPUT1 VSS VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('MN1 OUTPUT INPUT2 VSS VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('.ENDS');
    }
    if (hasR3) {
      lines.push('');
      lines.push('.SUBCKT NOR3 OUTPUT INPUT1 INPUT2 INPUT3 VDD VSS WP WN L M');
      lines.push('MP0 NET1   INPUT1 VDD VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MP1 NET2   INPUT2 NET1 VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MP2 OUTPUT INPUT3 NET2 VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MN0 OUTPUT INPUT1 VSS VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('MN1 OUTPUT INPUT2 VSS VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('MN2 OUTPUT INPUT3 VSS VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('.ENDS');
    }
    if (hasX2 || hasX3) {
      lines.push('');
      lines.push('.SUBCKT NOT OUT IN VDD VSS WP WN L M');
      lines.push('MP0 OUT IN VDD VDD PMOS_GLOBEL W=WP L=L M=M');
      lines.push('MN0 OUT IN VSS VSS NMOS_GLOBEL W=WN L=L M=M');
      lines.push('.ENDS');
    }
    if (hasX2) {
      lines.push('');
      lines.push('.SUBCKT XOR2 OUT A B VDD VSS WP WN L M');
      lines.push('XNA NA A VDD VSS NOT WP=WP WN=WN L=L M=M');
      lines.push('XNB NB B VDD VSS NOT WP=WP WN=WN L=L M=M');
      lines.push('X1  N1 A  NB VDD VSS NAND2 WP=WP WN=WN L=L M=M');
      lines.push('X2  N2 NA B  VDD VSS NAND2 WP=WP WN=WN L=L M=M');
      lines.push('X3  OUT N1 N2 VDD VSS NAND2 WP=WP WN=WN L=L M=M');
      lines.push('.ENDS');
    }
    if (hasX3) {
      lines.push('');
      lines.push('.SUBCKT XOR3 OUT A B C VDD VSS WP WN L M');
      lines.push('XX1 T  A  B  VDD VSS XOR2  WP=WP WN=WN L=L M=M');
      lines.push('XX2 OUT T  C  VDD VSS XOR2  WP=WP WN=WN L=L M=M');
      lines.push('.ENDS');
    }
    lines.push('');
  }

  // ---- Top level pins from IO blocks ----
  const inPins  = [];
  const outPins = [];
  for (const c of engine.components) {
    const t = (c.type || '').toLowerCase();
    if (t === 'in') {
      const n = c.terminals?.[0]?.netLabel; if (n) inPins.push(NN(n));
    } else if (t === 'out') {
      const n = c.terminals?.[0]?.netLabel; if (n) outPins.push(NN(n));
    } else if (t === 'in-out') {
      const left  = c.terminals?.[0]?.netLabel; if (left)  inPins.push(NN(left));
      const right = c.terminals?.[1]?.netLabel; if (right) outPins.push(NN(right));
    }
  }
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  const IN  = uniq(inPins);
  const OUT = uniq(outPins);

  lines.push('', '');
  lines.push(`.SUBCKT ${CELL} ${[...IN, ...OUT].join(' ')}`);

  // ---- helpers used inside switch ----
  const vdcToSpice = (c, n1, n2) => {
    let n = String(c?.vdc?.name || c?.label || 'V')
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase()
      .slice(0, 6) || 'V';
    if (!n.startsWith('V')) n = 'V' + n; // SPICE rule
    const v = Math.max(0, Math.min(5, Number(c?.vdc?.value ?? c?.value ?? 1)));
    return `${n} ${n1} ${n2} DC ${v}`;
  };

  let addedNPNModel = false;
  let addedPNPModel = false;
  let qCount = 0;
  let addedNMOS_LVT = false;
  let addedNMOS_HVT = false;
  let addedPMOS_LVT = false;
  let addedPMOS_HVT = false;

  engine.components.forEach((comp) => {
    const t   = (comp.type || "").toLowerCase();
    const name = comp.label?.split(" ")[0] || t.toUpperCase();
    const n1 = NN(comp.terminals?.[0]?.netLabel) || "NETX";
    const n2 = NN(comp.terminals?.[1]?.netLabel) || "NETY";
    const val = comp.value || comp.label || "";

    switch (t) {
      case "resistor":
      case "capacitor":
      case "inductor":
        lines.push(`${name} ${n1} ${n2} ${val}`);
        break;

      case "diode": {
        const bp = (comp.diodeFixed && comp.diodeFixed.barrierPotential != null)
          ? comp.diodeFixed.barrierPotential : 0.7;
        const br = (comp.diodeFixed && comp.diodeFixed.breakdownVoltage != null)
          ? comp.diodeFixed.breakdownVoltage : 6;
        let Is, Rs, Cj;
        if (comp.diodeSize && Number.isFinite(comp.diodeSize.area)) {
          ({ Is, Rs, Cj } = comp.diodeSize);
        } else {
          Is = 2.5e-9; Rs = 0.60; Cj = 4e-12;
        }
        const modelName = `M_${name}`;
        lines.push(`${name} ${n1} ${n2} ${modelName}`);
        lines.push(`.MODEL ${modelName} D(IS=${Is} RS=${Rs} N=1.9 CJO=${Cj} BV=${br} VJ=${bp})`);
        break;
      }

      case "npn": {
        const raw = (comp.label?.split(" ")[0] || "").trim();
        const qn  = /^Q/i.test(raw) ? raw : `Q${++qCount}`;
        const nb = NN(comp.terminals?.[0]?.netLabel) || "NETB";
        const nc = NN(comp.terminals?.[1]?.netLabel) || "NETC";
        const ne = NN(comp.terminals?.[2]?.netLabel) || "NETE";
        const area = (typeof comp.npnArea === "number" && comp.npnArea > 0) ? comp.npnArea : 1.0;
        lines.push(`${qn} ${nc} ${nb} ${ne} NPNMOD AREA=${area}`);
        if (!addedNPNModel) {
          lines.push(`.MODEL NPNMOD NPN (IS=1e-14 BF=100 VAF=100 RB=100 RC=1 RE=1 CJE=4e-12 CJC=3e-12 TF=3e-10 TR=1e-8 BV=40)`);
          addedNPNModel = true;
        }
        break;
      }

      case "pnp": {
        const raw = (comp.label?.split(" ")[0] || "").trim();
        const qn  = /^Q/i.test(raw) ? raw : `Q${++qCount}`;
        const nb = NN(comp.terminals?.[0]?.netLabel) || "NETB";
        const nc = NN(comp.terminals?.[1]?.netLabel) || "NETC";
        const ne = NN(comp.terminals?.[2]?.netLabel) || "NETE";
        const area = (typeof comp.pnpArea === "number" && comp.pnpArea > 0) ? comp.pnpArea : 1.0;
        lines.push(`${qn} ${nc} ${nb} ${ne} PNPMOD AREA=${area}`);
        if (!addedPNPModel) {
          lines.push(`.MODEL PNPMOD PNP (IS=1e-14 BF=80 VAF=60 RB=150 RC=1 RE=1 CJE=5e-12 CJC=4e-12 TF=6e-10 TR=2e-8 BV=40)`);
          addedPNPModel = true;
        }
        break;
      }

      case "nmos": {
        const raw = (comp.label?.split(" ")[0] || "").trim();
        const mn  = raw || `MN${++qCount}`;
        const ng = NN(comp.terminals?.[0]?.netLabel) || "NETG";
        const nd = NN(comp.terminals?.[1]?.netLabel) || "NETD";
        const ns = NN(comp.terminals?.[2]?.netLabel) || "NETS";
        const nb = NN(comp.nmos?.bodyNet || "VSS");
        const L_um = comp.nmos?.L ?? 1;
        const W_um = comp.nmos?.W ?? 1;
        const type = comp.nmos?.type === 'HVT' ? 'HVT' : 'LVT';
        const model = type === 'HVT' ? 'NMOS_HVT' : 'NMOS_LVT';
        const L_m = L_um * 1e-6;
        const W_m = W_um * 1e-6;
        lines.push(`M${mn} ${nd} ${ng} ${ns} ${nb} ${model} W=${W_m} L=${L_m}`);
        if (type === 'LVT') {
          if (!addedNMOS_LVT) {
            lines.push(`.MODEL NMOS_LVT NMOS (LEVEL=1 VTO=0.40 KP=120e-6 GAMMA=0.4 LAMBDA=0.02)`);
            addedNMOS_LVT = true;
          }
        } else {
          if (!addedNMOS_HVT) {
            lines.push(`.MODEL NMOS_HVT NMOS (LEVEL=1 VTO=0.80 KP=100e-6 GAMMA=0.5 LAMBDA=0.02)`);
            addedNMOS_HVT = true;
          }
        }
        break;
      }

      case "pmos": {
        const raw = (comp.label?.split(" ")[0] || "").trim();
        const mp  = raw || `MP${++qCount}`;
        const ng = NN(comp.terminals?.[0]?.netLabel) || "NETG";
        const nd = NN(comp.terminals?.[1]?.netLabel) || "NETD";
        const ns = NN(comp.terminals?.[2]?.netLabel) || "NETS";
        const nb = NN(comp.pmos?.bodyNet || "VDD"); // NEW: BODY from UI, default VDD
        const L_um = comp.pmos?.L ?? 1;
        const W_um = comp.pmos?.W ?? 1;
        const type = comp.pmos?.type === 'HVT' ? 'HVT' : 'LVT';
        const model = type === 'HVT' ? 'PMOS_HVT' : 'PMOS_LVT';
        const L_m = L_um * 1e-6;
        const W_m = W_um * 1e-6;
        lines.push(`M${mp} ${nd} ${ng} ${ns} ${nb} ${model} W=${W_m} L=${L_m}`);
        if (type === 'LVT') {
          if (!addedPMOS_LVT) {
            lines.push(`.MODEL PMOS_LVT PMOS (LEVEL=1 VTO=-0.40 KP=60e-6 GAMMA=0.4 LAMBDA=0.02)`);
            addedPMOS_LVT = true;
          }
        } else {
          if (!addedPMOS_HVT) {
            lines.push(`.MODEL PMOS_HVT PMOS (LEVEL=1 VTO=-0.80 KP=50e-6 GAMMA=0.5 LAMBDA=0.02)`);
            addedPMOS_HVT = true;
          }
        }
        break;
      }

      case "in":
      case "out":
      case "in-out":
        // top-level pins only; no instance line
        break;

      case "vdc":
        lines.push(vdcToSpice(comp, n1, n2));
        break;

      case "vssi":
      case "vddi":
        lines.push(`${name} ${n1} ${n2}`);
        break;

      case "not": {
        const tt  = comp.terminals || [];
        const inN = NN(tt[0]?.netLabel) || "NET_IN";
        const out = NN(tt[1]?.netLabel) || "NET_OUT";
        const Wn = ((comp.not?.Wn ?? 1) * 1e-6).toFixed(6);
        const Wp = ((comp.not?.Wp ?? 2) * 1e-6).toFixed(6);
        const L  = ((comp.not?.L  ?? 1) * 1e-6).toFixed(6);
        const M  = Math.max(1, Math.min(64, comp.not?.m ?? 1));
        lines.push(`X${name} ${out} ${inN} VDD VSS NOT1 WP=${Wp} WN=${Wn} L=${L} M=${M}`);
        break;
      }

      case "nand": {
        const tt = comp.terminals || [];
        const out = NN(tt[2]?.netLabel) || "NET_OUT";
        const in1 = NN(tt[0]?.netLabel) || "NET_IN1";
        const in2 = NN(tt[1]?.netLabel) || "NET_IN2";
        const hasIn3 = (comp.nand?.inputs === 3) && !!tt[3];
        const in3 = hasIn3 ? (NN(tt[3]?.netLabel) || "NET_IN3") : null;
        const Wn = (comp.nand?.Wn ?? 1) * 1e-6;
        const Wp = (comp.nand?.Wp ?? 2) * 1e-6;
        const L  = (comp.nand?.L  ?? 1) * 1e-6;
        const M  = (comp.nand?.m  ?? 1);
        const vdd = NN(comp.nand?.vddNet || "VDD");
        const vss = NN(comp.nand?.vssNet || "VSS");

        const subckt = hasIn3 ? "NAND3" : "NAND2";
        const pins = hasIn3 ? [out, in1, in2, in3,vdd,vss]
                            : [out, in1, in2,vdd,vss];
        lines.push(`X${name} ${pins.join(' ')} ${subckt} WP=${Wp} WN=${Wn} L=${L} M=${M}`);
        break;
      }

      case "nor": {
        const tt = comp.terminals || [];
        const out = NN(tt[2]?.netLabel) || "NET_OUT";
        const in1 = NN(tt[0]?.netLabel) || "NET_IN1";
        const in2 = NN(tt[1]?.netLabel) || "NET_IN2";
        const hasIn3 = (comp.nor?.inputs === 3) && !!tt[3];
        const in3 = hasIn3 ? (NN(tt[3]?.netLabel) || "NET_IN3") : null;
        const Wn = (comp.nor?.Wn ?? 1) * 1e-6;
        const Wp = (comp.nor?.Wp ?? 2) * 1e-6;
        const L  = (comp.nor?.L  ?? 1) * 1e-6;
        const M  = (comp.nor?.m  ?? 1);
        const vdd = NN(comp.nor?.vddNet || "VDD");
        const vss = NN(comp.nor?.vssNet || "VSS");

        const subckt = hasIn3 ? "NOR3" : "NOR2";
        const pins = hasIn3 ? [out, in1, in2, in3,vdd,vss]
                            : [out, in1, in2,vdd,vss];
        lines.push(`X${name} ${pins.join(' ')} ${subckt} WP=${Wp} WN=${Wn} L=${L} M=${M}`);
        break;
      }

      case "xor": {
        const tt = comp.terminals || [];
        const out = NN(tt[2]?.netLabel) || "NET_OUT";
        const in1 = NN(tt[0]?.netLabel) || "NET_IN1";
        const in2 = NN(tt[1]?.netLabel) || "NET_IN2";
        const hasIn3 = (comp.xor?.inputs === 3) && !!tt[3];
        const in3 = hasIn3 ? (NN(tt[3]?.netLabel) || "NET_IN3") : null;
        const Wn = (comp.xor?.Wn ?? 1) * 1e-6;
        const Wp = (comp.xor?.Wp ?? 2) * 1e-6;
        const L  = (comp.xor?.L  ?? 1) * 1e-6;
        const M  = (comp.xor?.m  ?? 1);
        const subckt = hasIn3 ? "XOR3" : "XOR2";
        const pins = hasIn3 ? [out, in1, in2, in3, "VDD", "VSS"]
                            : [out, in1, in2,       "VDD", "VSS"];
        lines.push(`X${name} ${pins.join(' ')} ${subckt} WP=${Wp} WN=${Wn} L=${L} M=${M}`);
        break;
      }

      default:
        lines.push(`${name} ${n1} ${n2} ${val}`);
        break;
    }
  });

  lines.push('.ENDS', '', '');

  return lines.join('\n');
}

function downloadTextFile(content, filename = "circuit.cir") {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildAndDownloadNetlist(engine, cellName) {
  const text = buildNetlistString(engine, cellName);
  downloadTextFile(text, "circuit.cir");
}

// (optional) export raw builder if you ever need just the string
export { buildNetlistString };
