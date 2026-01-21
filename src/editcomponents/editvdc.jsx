import React, { useEffect, useState } from "react";

export default function EditVDC({ api }) {
  const [vm, setVm] = useState({ name: "V", volts: 1 });

  useEffect(() => {
    const v = api?.getVdcVM?.();
    if (v) setVm(v);
  }, [api]);

const onName = (e) => {
  const raw = e.target.value || "";
  let name = raw.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (!name.startsWith("V")) name = "V" + name; // enforce V
  name = name.slice(0, 6);                      // clamp ≤6
  setVm((p) => ({ ...p, name }));
  api?.setVdcFromUI?.({ name });
};


  const onVolts = (e) => {
    let v = parseFloat(e.target.value);
    if (!Number.isFinite(v)) v = 0;
    v = Math.min(5, Math.max(0, v));
    setVm((p) => ({ ...p, volts: v }));
    api?.setVdcFromUI?.({ volts: v });
  };

  return (
    <div className="space-y-2">
      

      <label className="block">
        <div className="mb-1 text-xs text-gray-300">Device Name (A–Z, ≤6)</div>
        <input
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={vm.name}
          onChange={onName}
          placeholder="e.g. VDDIN"
          maxLength={6}
        />
      </label>

      <label className="block">
        <div className="mb-1 text-xs text-gray-300">Value (Volts, 0–5)</div>
        <input
          type="number"
          min="0"
          max="5"
          step="0.01"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={vm.volts}
          onChange={onVolts}
        />
      </label>

      <div className="text-[11px] text-gray-400">
        Tip: Name is letters-only. Value is clamped to 0–5 V. <span className="text-gray-200">{vm.name} ({vm.volts} V)</span>.
      </div>
    </div>
  );
}
