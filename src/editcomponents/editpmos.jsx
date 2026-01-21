import React, { useEffect, useState } from "react";

export default function EditPMOS({ api }) {
  const [vm, setVM] = useState(null);

  useEffect(() => {
    const v = api?.getPmosVM?.();
    setVM(v);
  }, [api]);

  if (!vm) return null;

  const push = (patch) => {
    const next = { ...vm, ...patch };
    setVM(next);
    api?.setPmosFromUI?.(next);
  };

  // hard clamps so user can’t exceed bounds
  const clampMicron = (v) => {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return "";
    return Math.max(0.05, Math.min(1000, n));
  };
  const onLen = (e) => push({ L: clampMicron(e.target.value) });
  const onWid = (e) => push({ W: clampMicron(e.target.value) });

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

      {/* Length */}
      <label className="block text-xs text-gray-400 mt-2">Length (µm)</label>
      <input
        type="number" step="0.01" min="0.05" max="1000" inputMode="decimal"
        className="w-full px-2 py-1 rounded bg-[#1e1e1e] text-gray-100 outline-none"
        value={vm.L}
        onChange={onLen}
        onBlur={onLen}
      />

      {/* Width */}
      <label className="block text-xs text-gray-400 mt-2">Width (µm)</label>
      <input
        type="number" step="0.01" min="0.05" max="1000" inputMode="decimal"
        className="w-full px-2 py-1 rounded bg-[#1e1e1e] text-gray-100 outline-none"
        value={vm.W}
        onChange={onWid}
        onBlur={onWid}
      />

      {/* Device type */}
      <label className="block text-xs text-gray-400 mt-2">Device Type</label>
      <div className="flex gap-2">
        <button
          className={`px-2 py-1 rounded ${vm.type==='LVT'?'bg-green-600 text-white':'bg-[#1e1e1e] text-gray-200'}`}
          onClick={() => push({ type: 'LVT' })}
        >
          LVT
        </button>
        <button
          className={`px-2 py-1 rounded ${vm.type==='HVT'?'bg-green-600 text-white':'bg-[#1e1e1e] text-gray-200'}`}
          onClick={() => push({ type: 'HVT' })}
        >
          HVT
        </button>
          {/* NEW: “PMOS” = SVT */}
  <button
    className={`px-2 py-1 rounded ${vm.type==='SVT'?'bg-green-600 text-white':'bg-[#1e1e1e] text-gray-200'}`}
    onClick={() => push({ type: 'SVT' })}
  >
    PMOS
  </button>
      </div>
    </div>
  );
}
