import React from "react";
import Tooltip from "../extraFiles/tooltip";

export default function EditCapacitor({ selected, canvasRef, updateSelected, LABEL_MAX = 12 }) {
  if (!selected) return null;
  const cvm = canvasRef.current?.getCapValueVM?.();

  return (
    <>
      {/* Label (same rules) */}
      <label className="block text-xs text-gray-300 mb-1">
        Label (no spaces, max {LABEL_MAX})
      </label>
      <input
        className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
        placeholder="C1"
        value={selected.label || ""}
        maxLength={LABEL_MAX}
        onChange={(e) => {
          const clean = e.target.value.replace(/\s+/g, "").slice(0, LABEL_MAX);
          updateSelected({ label: clean });
        }}
      />

      {/* Value + Unit (engine-managed) */}
      {cvm && (
        <>
          <label className="block text-xs text-gray-300 mt-3 mb-1">
            Capacitance
          </label>
          <div className="flex gap-1">
            <input
              type="number"
              min={cvm.min}
              max={cvm.max}
              step={cvm.step}
              className="flex-1 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
              value={cvm.magnitude}
              onChange={(e) =>
                canvasRef.current?.setCapValueFromUI?.({
                  unit: cvm.selectedUnit,
                  magnitude: e.target.value,
                })
              }
            />
            <Tooltip text="unit">
              <select
                className="bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
                value={cvm.selectedUnit}
                onChange={(e) =>
                  canvasRef.current?.setCapValueFromUI?.({
                    unit: e.target.value,
                    magnitude: cvm.magnitude, // same number on unit change
                  })
                }
              >
                {cvm.units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Tooltip>
          </div>
          <p className="text-[11px] text-zinc-400">
            Range: {cvm.min} – {cvm.max} per selected unit
          </p>
        </>
      )}
    </>
  );
}
