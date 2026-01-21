import React from "react";
import Tooltip from "../extraFiles/tooltip";

export default function EditInductor({ selected, canvasRef, updateSelected, LABEL_MAX = 12 }) {
  if (!selected) return null;
  const lvm = canvasRef.current?.getIndValueVM?.();

  return (
    <>
      {/* Label (no spaces, max 12) */}
      <label className="block text-xs text-gray-300 mb-1">
        Label (no spaces, max {LABEL_MAX})
      </label>
      <input
        className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
        placeholder="L1"
        value={selected.label || ""}
        maxLength={LABEL_MAX}
        onChange={(e) => {
          const clean = e.target.value.replace(/\s+/g, "").slice(0, LABEL_MAX);
          updateSelected({ label: clean });
        }}
      />

      {/* Inductance (unit + magnitude via engine) */}
      {lvm && (
        <>
          <label className="block text-xs text-gray-300 mt-3 mb-1">
            Inductance
          </label>
          <div className="flex gap-1">
            <input
              type="number"
              min={lvm.min}
              max={lvm.max}
              step={lvm.step}
              className="flex-1 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
              value={lvm.magnitude}
              onChange={(e) =>
                canvasRef.current?.setIndValueFromUI?.({
                  unit: lvm.selectedUnit,
                  magnitude: e.target.value,
                })
              }
            />
            <Tooltip text="unit">
              <select
                className="bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
                value={lvm.selectedUnit}
                onChange={(e) =>
                  canvasRef.current?.setIndValueFromUI?.({
                    unit: e.target.value,
                    magnitude: lvm.magnitude,
                  })
                }
              >
                {lvm.units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Tooltip>
          </div>
          <p className="text-[11px] text-zinc-400">
            Range: {lvm.min} – {lvm.max} per selected unit
          </p>
        </>
      )}
    </>
  );
}
