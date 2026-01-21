// confirm.jsx
import React from "react";

export default function ClearConfirmModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      {/* Dim + blur backdrop with subtle vignette */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]" />

      {/* Center container */}
      <div className="relative h-full w-full flex items-center justify-center p-4">
        {/* Card */}
        <div
          role="dialog"
          aria-modal="true"
          className="
            relative w-[420px] max-w-[92vw]
            rounded-2xl border border-white/10
            bg-gradient-to-br from-[#1c1f26]/90 to-[#0f1216]/90
            shadow-[0_20px_80px_-10px_rgba(0,0,0,0.6)]
            ring-1 ring-white/10
            overflow-hidden
          "
        >
          {/* top glossy glint */}
          <div className="pointer-events-none absolute -top-10 left-0 right-0 h-16 bg-gradient-to-b from-white/15 to-transparent" />

          {/* inner border shine */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />

          {/* subtle corner highlights */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-cyan-400/5 blur-2xl" />

          {/* content */}
          <div className="relative p-6">
            <h2 className="text-[18px] font-semibold text-white tracking-wide">
              Confirm Clear All
            </h2>

            <p className="mt-3 text-[13px] leading-6 text-gray-300">
              Are you sure you want to clear the schematic?
              <br />
              This will delete <span className="font-semibold text-white">all components and wires</span>.
            </p>

            {/* divider */}
            <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* actions */}
            <div className="mt-4 flex justify-end gap-3">
              {/* Cancel (glass button) */}
              <button
                onClick={onCancel}
                className="
                  px-4 py-2 rounded-lg text-sm
                  bg-white/5 hover:bg-white/10
                  text-gray-200
                  border border-white/10
                  transition-colors
                "
              >
                No
              </button>

              {/* Confirm (premium danger) */}
              <button
                onClick={onConfirm}
                className="
                  px-4 py-2 rounded-lg text-sm text-white
                  bg-gradient-to-br from-rose-500 to-red-600
                  hover:from-rose-400 hover:to-red-500
                  border border-white/10
                  shadow-[0_8px_24px_-6px_rgba(244,63,94,0.5)]
                  transition-all
                "
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
