// src/extraFiles/downloadpopup.jsx
import React, { useEffect, useRef, useState } from "react";

// Modal to capture a "Cell Name" before generating the netlist.
// Visual polish only — behavior is unchanged.
export default function DownloadPopup({
  open,
  initialValue = "",
  onCancel,
  onSave,
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  // letter first, then letters/digits (max 12)
  const isValid = /^[A-Za-z][A-Za-z0-9]{0,11}$/.test(value);

  useEffect(() => {
    if (!open) return;
    // seed on open, focus the field
    setValue(initialValue);
    setTimeout(() => inputRef.current?.focus(), 0);

    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") {
        const raw = inputRef.current?.value ?? "";
        const ok = /^[A-Za-z][A-Za-z0-9]{0,11}$/.test(raw);
        if (ok) onSave?.(raw);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, initialValue, onCancel, onSave]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Card */}
      <div className="relative w-[min(92vw,520px)] rounded-2xl border border-neutral-800 bg-neutral-900/95 text-neutral-100 shadow-2xl">
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-semibold tracking-wide">
            Download Netlist
          </h3>
          <p className="mt-1 text-sm text-neutral-400">
            Enter a <span className="font-medium text-neutral-200">Cell Name</span> (letters/digits).
          </p>

          <div className="mt-5">
            
            <input
              ref={inputRef}
              value={value}
              onChange={(e) =>
                // remove anything that isn't a letter/digit
                setValue(e.target.value.replace(/[^A-Za-z0-9]/g, ""))
              }
              maxLength={12}
              placeholder="Cell name (e.g., TOP1)"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Must start with a letter. Max 12 chars. Invalid chars will be removed.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-800 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-300 transition hover:bg-red-800 active:translate-y-[1px]"
          >
            Cancel
          </button>
          <button
            onClick={() => isValid && onSave?.(value)}
            disabled={!isValid}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition active:translate-y-[1px]
              ${
                isValid
                  ? "bg-green-500 text-emerald-950 hover:bg-green-400"
                  : "cursor-not-allowed bg-emerald-700/40 text-emerald-200/40"
              }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
