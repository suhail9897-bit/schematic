// src/extraFiles/designpopup.jsx
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

 // Programmatic “Download Schematic” flow
 export function openDesignDownload(canvasRef, initialValue = "") {
   const host = document.createElement("div");
   document.body.appendChild(host);
   const root = createRoot(host);

   const close = () => { root.unmount(); host.remove(); };

   const doSave = (rawName) => {
     try {
      const safe = (rawName || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24);
      const snap = canvasRef?.current?.exportDesignFile?.();
      if (!snap) return close();

      // 🔹 same builder as ".cir" download, so text 1:1 match karega
      const cell = safe || "CIRCUIT";
      const netText = canvasRef?.current?.getNetlistString?.(cell) || "";

      // --- NET PASS v1: Build HIER_META comment block from current snapshot ---
const wires = Array.isArray(snap?.wires) ? snap.wires : [];
const comps  = Array.isArray(snap?.components) ? snap.components : [];
const boxes = comps.filter(c => c?.type === "subcktbox");

const getWireNet = (w) => (w?.netLabel || w?.from?.netLabel || w?.to?.netLabel || "");
const netFor = (compId, termIdx) => {
  for (const w of wires) {
    if (w?.from?.compId === compId && w?.from?.terminalIndex === termIdx) return getWireNet(w);
    if (w?.to?.compId   === compId && w?.to?.terminalIndex   === termIdx) return getWireNet(w);
  }
  return "";
};
const uniqPush = (arr, v) => {
  const k = String(v || "").toUpperCase();
  if (!k) return;
  if (!arr.some(x => String(x).toUpperCase() === k)) arr.push(v);
};

const metaLines = [];
const unionP = [], unionG = [];
const perBox = [];

for (const b of boxes) {
const s = b.subckt || {};
const subcktName = s.name || b.label || "BOX";

// Prefer reading directly from the component's terminals (snapshot-safe)
const terms = Array.isArray(b.terminals) ? b.terminals : [];
let p = [], g = [];

if (terms.length) {
  // top row = minY → powers, bottom row = maxY → grounds
  const ys = terms.map(t => Number(t?.y ?? 0));
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  p = terms.filter(t => Number(t?.y ?? 0) === minY)
           .map(t => String(t?.netLabel || "").toUpperCase())
           .filter(Boolean);
  g = terms.filter(t => Number(t?.y ?? 0) === maxY)
           .map(t => String(t?.netLabel || "").toUpperCase())
           .filter(Boolean);

  p.forEach(v => uniqPush(unionP, v));
  g.forEach(v => uniqPush(unionG, v));
} else {
  // Fallback (older snapshots): use counts from spec + wiring map
  const nIn  = Array.isArray(s.inputs)  ? s.inputs.length  : 0;
  const nTop = Array.isArray(s.powers)  ? s.powers.length  : 0;
  const nBot = Array.isArray(s.grounds) ? s.grounds.length : 0;

  for (let i = 0; i < nTop; i++) {
    const idx = nIn + 1 + i;
    const lab = (netFor(b.id, idx) || String(s.powers[i] || "")).toUpperCase();
    if (lab) { p.push(lab); uniqPush(unionP, lab); }
  }
  for (let i = 0; i < nBot; i++) {
    const idx = nIn + 1 + nTop + i;
    const lab = (netFor(b.id, idx) || String(s.grounds[i] || "")).toUpperCase();
    if (lab) { g.push(lab); uniqPush(unionG, lab); }
  }
}

perBox.push({
  label: b.label || subcktName || "BOX",
  subckt: subcktName,
  powers: p,
  grounds: g
});

}

metaLines.push("* ==== HIER_META v1 BEGIN ====");
metaLines.push(`* summary: boxes_used=${perBox.length}`);
metaLines.push(`* union_powers: ${unionP.join(",")}`);
metaLines.push(`* union_grounds: ${unionG.join(",")}`);
for (const e of perBox) {
  metaLines.push(`* box: label=${e.label} subckt=${e.subckt} powers=${e.powers.join(",")} grounds=${e.grounds.join(",")}`);
}
metaLines.push("* ==== HIER_META v1 END ====");

// final netlist lines + meta comments appended at the end
const cirLinesWithMeta = netText.split("\n").concat(["", ...metaLines]);


      // 🔹 JSON ke end me ek last property: exact netlist text
        const enriched = {
        ...snap,
       
        // human-readable view — har entry ek line, blank gaps = ""
         __NETLIST_CIR_LINES: cirLinesWithMeta

      };

      const blob = new Blob([JSON.stringify(enriched, null, 2)], {
        type: "application/json"
      });
       const a = document.createElement("a");
       const stamp = new Date().toISOString().replace(/[:.]/g, "-");
       const base = safe || `design-${stamp}`;
       a.href = URL.createObjectURL(blob);
       a.download = `${base}.json`;
       document.body.appendChild(a);
       a.click();
       URL.revokeObjectURL(a.href);
       a.remove();
     } finally {
       close();
     }
   };

   root.render(
     <DesignPopup
       open={true}
       initialValue={initialValue}
      onCancel={close}
       onSave={doSave}
     />
   );
 }

 // Programmatic “Upload Schematic” flow
 export function triggerDesignUpload(canvasRef) {
   const input = document.createElement("input");
   input.type = "file";
   input.accept = ".json,application/json";
   input.style.display = "none";
   const cleanup = () => { input.value = ""; document.body.removeChild(input); };
   input.onchange = (e) => {
     const f = e.target.files?.[0];
    if (!f) return cleanup();
     const reader = new FileReader();
    reader.onload = () => {
       try {
         const data = JSON.parse(reader.result);
         canvasRef?.current?.importDesignFile?.(data);
       } catch {
         alert("Invalid Design file.");
       } finally {
         cleanup();
       }
     };
     reader.readAsText(f);
   };
   document.body.appendChild(input);
   input.click();
 }


/**
 * Design filename modal — same look & feel as downloadpopup.jsx
 * Allows A–Z start, then letters/digits/underscore/dash (max 24)
 */
export default function DesignPopup({ open, initialValue = "", onCancel, onSave }) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  const isValid = /^[A-Za-z][A-Za-z0-9_-]{0,23}$/.test(value);

  useEffect(() => {
    if (!open) return;
    setValue(initialValue);
    setTimeout(() => inputRef.current?.focus(), 0);

    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") {
        const raw = inputRef.current?.value ?? "";
        if (/^[A-Za-z][A-Za-z0-9_-]{0,23}$/.test(raw)) onSave?.(raw);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, initialValue, onCancel, onSave]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Card */}
      <div className="relative w-[min(92vw,520px)] rounded-2xl border border-neutral-800 bg-neutral-900/95 text-neutral-100 shadow-2xl">
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-semibold tracking-wide">Download Schematic</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Enter a <span className="font-medium text-neutral-200">file name</span>.
          </p>

          <div className="mt-5">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) =>
                setValue(e.target.value.replace(/[^A-Za-z0-9_-]/g, ""))
              }
              maxLength={24}
              placeholder="e.g., MyCircuit"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-base outline-none transition focus:border-green-500 focus:ring-2 focus:ring-emerald-400/30"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Must start with a letter. Allowed: letters, digits, “_” and “-”. Max 24 chars.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-800 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-300 transition hover:bg-red-800 active:translate-y-[1px]"
          >
            Cancel
          </button>
          <button
            onClick={() => isValid && onSave?.(value)}
            disabled={!isValid}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition active:translate-y-[1px] ${
              isValid
                ? "bg-green-500 text-emerald-950 hover:bg-green-400"
                : "cursor-not-allowed bg-emerald-700/40 text-emerald-200/40"
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
