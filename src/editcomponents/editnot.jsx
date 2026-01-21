import React, { useEffect, useState } from "react";

export default function EditNOT({ api }) {
  const [vm, setVm] = useState(null);

  useEffect(() => {
    const pull = () => setVm(api?.getNotVM?.() || null);
    pull();
    const id = setInterval(pull, 200);
    return () => clearInterval(id);
  }, [api]);

  const upd = (patch) => api?.setNotFromUI?.(patch);

  if (!vm) return <div className="text-gray-400">Select a NOT</div>;

  return (
    <div className="space-y-3">
    

      {/* Device Name */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400">Device Name</div>
        <input
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={vm.label || "NOT"}
          onChange={(e) => api?.updateSelected?.({ label: e.target.value })}
        />
      </div>

      {/* Widths / Length / Multiplier */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400">Width (NMOS) [µm]</div>
        <input
          type="number" min="0.01" max="100" step="0.01"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={vm.Wn} onChange={(e) => upd({ Wn: +e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <div className="text-xs text-gray-400">Width (PMOS) [µm]</div>
        <input
          type="number" min="0.01" max="100" step="0.01"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={vm.Wp} onChange={(e) => upd({ Wp: +e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <div className="text-xs text-gray-400">Length (l) [µm]</div>
        <input
          type="number" min="0.01" max="100" step="0.01"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={vm.L} onChange={(e) => upd({ L: +e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <div className="text-xs text-gray-400">Multiplier (m)</div>
        <input
          type="number" min="1" max="64" step="1"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={vm.m} onChange={(e) => upd({ m: +e.target.value })}
        />
      </div>

      <div className="text-[10px] text-gray-500">
        Inputs fixed: 1 input, 1 output. Net names Nets/Ports tab se badal sakte ho.
      </div>
    </div>
  );
}
