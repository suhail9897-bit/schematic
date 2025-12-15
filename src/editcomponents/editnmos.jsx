import React, { useEffect, useState } from "react";

export default function EditNMOS({ api }) {
  const [vm, setVM] = useState(null);

  useEffect(() => {
    const v = api?.getNmosVM?.();
    setVM(v);
  }, [api]);

  if (!vm) return null;

  const push = (patch) => {
    const next = { ...vm, ...patch };
    setVM(next);
    api?.setNmosFromUI?.(next);
  };

  // ---- clamp helpers so user can't go beyond 1000 µm
  const clampMicron = (v) => {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return "";
    return Math.max(0.05, Math.min(1000, n));
  };
  const onLenChange = (e) => {
    const n = clampMicron(e.target.value);
    setVM((p) => ({ ...p, L: n }));
    api?.setNmosFromUI?.({ L: n });
  };
  const onWidChange = (e) => {
    const n = clampMicron(e.target.value);
    setVM((p) => ({ ...p, W: n }));
    api?.setNmosFromUI?.({ W: n });
  };

  return (
    <div className="p-2 space-y-2">
      

      {/* Name */}
      <label className="block text-xs text-gray-400">Name</label>
      <input
        className="w-full px-2 py-1 rounded bg-[#1e1e1e] text-gray-100 outline-none"
        value={vm.name}
        maxLength={12}
        onChange={(e) => push({ name: e.target.value })}
      />

      {/* Length (µm) */}
      <label className="block text-xs text-gray-400 mt-2">Length (µm)</label>
      <input
        type="number"
        step="0.01"
        min="0.05"
        max="1000"
        inputMode="decimal"
        className="w-full px-2 py-1 rounded bg-[#1e1e1e] text-gray-100 outline-none"
        value={vm.L}
        onChange={onLenChange}
        onBlur={onLenChange}
      />

      {/* Width (µm) */}
      <label className="block text-xs text-gray-400 mt-2">Width (µm)</label>
      <input
        type="number"
        step="0.01"
        min="0.05"
        max="1000"
        inputMode="decimal"
        className="w-full px-2 py-1 rounded bg-[#1e1e1e] text-gray-100 outline-none"
        value={vm.W}
        onChange={onWidChange}
        onBlur={onWidChange}
      />

      {/* Device type */}
      <label className="block text-xs text-gray-400 mt-2">Device Type</label>
      <div className="flex gap-2">
        <button
          className={`px-2 py-1 rounded ${
            vm.type === "LVT" ? "bg-green-600 text-white" : "bg-[#1e1e1e] text-gray-200"
          }`}
          onClick={() => push({ type: "LVT" })}
        >
          LVT
        </button>
        <button
          className={`px-2 py-1 rounded ${
            vm.type === "HVT" ? "bg-green-600 text-white" : "bg-[#1e1e1e] text-gray-200"
          }`}
          onClick={() => push({ type: "HVT" })}
        >
          HVT
        </button>
          {/* NEW: “NMOS” = SVT */}
  <button
    className={`px-2 py-1 rounded ${vm.type==='SVT'?'bg-green-600 text-white':'bg-[#1e1e1e] text-gray-200'}`}
    onClick={() => push({ type: 'SVT' })}
  >
    NMOS
  </button>
      </div>
    </div>
  );
}
