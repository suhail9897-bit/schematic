import React from "react";
import Tooltip from "../extraFiles/tooltip";

export default function EditResistor({ selected, canvasRef, updateSelected, LABEL_MAX = 12 }) {
  if (!selected) return null;

  const rvm = canvasRef.current?.getResValueVM?.();

  return (
    <>
      {/* Label (same logic as before) */}
      <label className="block text-xs text-gray-300 mb-1">
        Label (max {LABEL_MAX} characters)
      </label>
      <input
        className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
        placeholder="R1"
        value={selected.label || ""}
        maxLength={LABEL_MAX}
        onChange={(e) => {
          const clean = e.target.value.replace(/\s+/g, "").slice(0, LABEL_MAX);
          updateSelected({ label: clean });
        }}
      />

      {/* Value + Unit (engine-managed; unchanged calls) */}
      {rvm && (
        <>
          <label className="block text-xs text-gray-300 mt-3 mb-1">Resistance</label>
          <div className="flex gap-1">
            <input
              type="number"
              min={rvm.min}
              max={rvm.max}
              step={rvm.step}
              className="flex-1 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
              value={rvm.magnitude}
              onChange={(e) =>
                canvasRef.current?.setResValueFromUI?.({
                  unit: rvm.selectedUnit,
                  magnitude: e.target.value,
                })
              }
            />
            <Tooltip text="unit">
              <select
                className="bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
                value={rvm.selectedUnit}
                onChange={(e) =>
                  canvasRef.current?.setResValueFromUI?.({
                    unit: e.target.value,
                    magnitude: rvm.magnitude, // keep same number on unit change
                  })
                }
              >
                {rvm.units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Tooltip>
          </div>
          <p className="text-[11px] text-zinc-400">
            Range: {rvm.min} – {rvm.max} per selected unit
          </p>
        </>
      )}
    </>
  );
}
