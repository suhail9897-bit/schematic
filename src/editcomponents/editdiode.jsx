import React from "react";

export default function EditDiode({ selected, canvasRef, LABEL_MAX, updateSelected }) {
  if (!selected || selected.type !== "diode") return null;

  const dvm = canvasRef.current?.getDiodeAreaVM?.();

  return (
    <>
      {/* Label */}
      <label className="block text-xs text-gray-300 mb-1">
        Label (no spaces, max {LABEL_MAX})
      </label>
      <input
        className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
        placeholder="D1"
        value={selected.label || ""}
        maxLength={LABEL_MAX}
        onChange={(e) => {
          const clean = e.target.value.replace(/\s+/g, "").slice(0, LABEL_MAX);
          updateSelected({ label: clean });
        }}
      />

      {/* Width (Area): unit + allowed magnitudes (engine-managed) */}
      {dvm && (
        <>
          <label className="block text-xs text-gray-300 mt-3 mb-1">Width (Area)</label>
          <div className="flex gap-1">
            {/* magnitude (snapped) */}
            <select
              className="flex-1 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
              value={dvm.magnitude}
              onChange={(e) =>
                canvasRef.current?.setDiodeAreaFromUI?.({
                  unit: dvm.selectedUnit,
                  magnitude: e.target.value,
                })
              }
            >
              {dvm.allowed.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* unit */}
            <select
              className="bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
              value={dvm.selectedUnit}
              onChange={(e) =>
                canvasRef.current?.setDiodeAreaFromUI?.({
                  unit: e.target.value,
                  magnitude: dvm.magnitude, // engine will snap in new unit
                })
              }
            >
              {dvm.units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-zinc-400">
            Pick from safe values (mm² / µm² / nm²). Is↑ with area, Cj↑ with area,
            Rs↓ with area. Vf=0.7 V, Vbr=6 V fixed.
          </p>
        </>
      )}
    </>
  );
}
