// src/editcomponents/editxor.jsx
import React, { useEffect, useState } from "react";

const EditXOR = ({ api }) => {
  const [vm, setVM] = useState(null);

  const pull = () => {
    const v = api?.getXorVM?.();
    if (v) setVM(v);
  };

  useEffect(() => {
    pull();
    const id = setInterval(pull, 300);
    return () => clearInterval(id);
  }, []);

  if (!vm) return <div className="text-gray-400">No selection</div>;

  const push = (patch) => { api?.setXorFromUI?.(patch); pull(); };
  const num  = (v) => (v === "" ? "" : String(v));
  const onN  = (k, min, max) => (e) => {
    const s = e.target.value.trim(); if (s === "") return setVM({ ...vm, [k]: "" });
    const n = Number(s); if (!Number.isFinite(n)) return;
    const v = Math.max(min, Math.min(max, n)); setVM({ ...vm, [k]: v }); push({ [k]: v });
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-gray-400 mb-1">Device Name</div>
        <input
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={vm.name}
          onChange={(e)=>{const name=e.target.value; setVM({...vm,name}); push({name});}}
          maxLength={12}
        />
      </div>

      <div>
        <div className="text-xs text-gray-400 mb-1"># of Inputs</div>
        <select
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={vm.inputs}
          onChange={(e)=>{const inputs=Number(e.target.value)===3?3:2; setVM({...vm,inputs}); push({inputs});}}
        >
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </div>

      <div>
        <div className="text-xs text-gray-400 mb-1">Width (NMOS) [µm]</div>
        <input type="number" step="0.01" min="0.05"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={num(vm.Wn)} onChange={onN("Wn", vm.ranges.W.min, vm.ranges.W.max)}
        />
      </div>

      <div>
        <div className="text-xs text-gray-400 mb-1">Width (PMOS) [µm]</div>
        <input type="number" step="0.01" min="0.05"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={num(vm.Wp)} onChange={onN("Wp", vm.ranges.W.min, vm.ranges.W.max)}
        />
      </div>

      <div>
        <div className="text-xs text-gray-400 mb-1">Length (l) [µm]</div>
        <input type="number" step="0.01" min="0.05"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={num(vm.L)} onChange={onN("L", vm.ranges.L.min, vm.ranges.L.max)}
        />
      </div>

      <div>
        <div className="text-xs text-gray-400 mb-1">Multiplier (m)</div>
        <input type="number" step="1" min="1"
          className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
          value={num(vm.m)} onChange={onN("m", vm.ranges.m.min, vm.ranges.m.max)}
        />
      </div>
    </div>
  );
};

export default EditXOR;
