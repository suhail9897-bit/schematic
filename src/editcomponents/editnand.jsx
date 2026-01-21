// src/editcomponents/editnand.jsx
import React, { useEffect, useState } from "react";

const EditNAND = ({ api }) => {
  const [vm, setVM] = useState(null);

  const pull = () => {
    const v = api?.getNandVM?.();
    if (v) setVM(v);
  };

  useEffect(() => {
    pull();
    const id = setInterval(pull, 300);
    return () => clearInterval(id);
    // polling chosen for parity with existing panels
  }, []);

  if (!vm) return <div className="text-gray-400">No selection</div>;

  const push = (patch) => {
    api?.setNandFromUI?.(patch);
    pull();
  };

  const num = (v) => (v === "" ? "" : String(v));
  const onNum = (key, min, max, step = 0.01) => (e) => {
    const raw = e.target.value.trim();
    if (raw === "") {
      setVM({ ...vm, [key]: "" });
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(min, Math.min(max, n));
    setVM({ ...vm, [key]: clamped });
    push({ [key]: clamped });
  };

  return (
    <div className="space-y-3">
      {/* Device Name */}
      <div>
        <div className="text-xs text-gray-400 mb-1">Device Name</div>
        <input
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={vm.name}
          onChange={(e) => {
            const name = e.target.value;
            setVM({ ...vm, name });
            push({ name });
          }}
          maxLength={12}
        />
      </div>

      {/* # of Inputs */}
      <div>
        <div className="text-xs text-gray-400 mb-1"># of Inputs</div>
        <select
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={vm.inputs}
          onChange={(e) => {
            const inputs = Number(e.target.value) === 3 ? 3 : 2;
            setVM({ ...vm, inputs });
            push({ inputs });
          }}
        >
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </div>

      {/* Width (NMOS) */}
      <div>
        <div className="text-xs text-gray-400 mb-1">Width (NMOS) [µm]</div>
        <input
          type="number"
          step="0.01"
          min="0.05"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={num(vm.Wn)}
          onChange={onNum("Wn", vm.ranges.W.min, vm.ranges.W.max, vm.ranges.W.step)}
        />
      </div>

      {/* Width (PMOS) */}
      <div>
        <div className="text-xs text-gray-400 mb-1">Width (PMOS) [µm]</div>
        <input
          type="number"
          step="0.01"
          min="0.05"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={num(vm.Wp)}
          onChange={onNum("Wp", vm.ranges.W.min, vm.ranges.W.max, vm.ranges.W.step)}
        />
      </div>

      {/* Length */}
      <div>
        <div className="text-xs text-gray-400 mb-1">Length (l) [µm]</div>
        <input
          type="number"
          step="0.01"
          min="0.05"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={num(vm.L)}
          onChange={onNum("L", vm.ranges.L.min, vm.ranges.L.max, vm.ranges.L.step)}
        />
      </div>

      {/* Multiplier */}
      <div>
        <div className="text-xs text-gray-400 mb-1">Multiplier (m)</div>
        <input
          type="number"
          step="1"
          min="1"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={num(vm.m)}
          onChange={onNum("m", vm.ranges.m.min, vm.ranges.m.max, vm.ranges.m.step)}
        />
      </div>
    </div>
  );
};

export default EditNAND;
