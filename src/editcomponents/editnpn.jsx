import React, { useEffect, useState } from "react";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt = (v) => Number.isFinite(v) ? Number(v.toFixed(3)) : 1.0;

export default function EditNPN({ selected, canvasRef, updateSelected, LABEL_MAX = 12 }) {
  const [label, setLabel] = useState("");
  const [area, setArea]   = useState(1.0);

  // load VM from engine (single source of truth)
  useEffect(() => {
    if (!selected || selected.type !== "npn") return;
    const vm = canvasRef?.current?.getNpnAreaVM?.();
    setLabel((vm?.label ?? selected.label ?? "Q1").slice(0, LABEL_MAX));
    setArea(Number(vm?.area ?? 1.0));
  }, [selected, canvasRef, LABEL_MAX]);

  const onLabelChange = (e) => {
    const v = e.target.value.replace(/\s+/g, "").slice(0, LABEL_MAX);
    setLabel(v);
    // engine already sanitizes label in updateSelected
    updateSelected?.({ label: v });
  };

  const onAreaChange = (e) => {
    const raw = e.target.value;
    let val = parseFloat(raw);
    if (!Number.isFinite(val) || val <= 0) val = 1.0;
    val = fmt(clamp(val, 0.1, 10.0));
    setArea(val);
    canvasRef?.current?.setNpnAreaFromUI?.({ area: val });
  };

  const setPreset = (v) => {
    const val = fmt(clamp(v, 0.1, 10.0));
    setArea(val);
    canvasRef?.current?.setNpnAreaFromUI?.({ area: val });
  };

  if (!selected || selected.type !== "npn") return null;

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <div className="w-28 text-gray-400 text-xs">Name</div>
        <input
          className="flex-1 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={label}
          onChange={onLabelChange}
          placeholder="Q1"
        />
      </div>

      {/* Area (unitless) */}
      <div className="flex items-center gap-2">
        <div className="w-28 text-gray-400 text-xs">Device Area</div>
        <input
          type="number"
          className="flex-1 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          step="0.1"
          min="0.1"
          max="10"
          value={area}
          onChange={onAreaChange}
        />
        <div className="text-xs text-gray-400">× (unitless)</div>
      </div>

      {/* Quick presets (optional) */}
      <div className="flex gap-2">
        {[0.5, 1.0, 2.0, 5.0, 10.0].map(p => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className="px-2 py-1 bg-[#1e1e1e] border border-white/10 rounded text-xs hover:bg-[#333]"
          >
            {p}×
          </button>
        ))}
      </div>
    </div>
  );
}
