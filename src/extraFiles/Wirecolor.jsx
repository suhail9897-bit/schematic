// src/extraFiles/Wirecolor.jsx
import React from "react";
import Tooltip from "./tooltip"; // same folder

const SWATCHES = [
  "white","cyan","deepskyblue","lime","limegreen","yellow",
  "orange","gold","red","crimson","magenta","violet"
];

// Browser CSS color validator
function normalizeCssColor(input) {
  const s = new Option().style;
  s.color = "";
  const val = String(input || "").trim();
  s.color = val;
  return s.color ? val : null;
}

export default function WireActions({ left, top, onCut, onPick, onClose }) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("#ffffff");
  const [bad, setBad] = React.useState("");

  if (left == null || top == null) return null;

  const applyText = () => {
    const ok = normalizeCssColor(text);
    if (!ok) { setBad("Invalid color. Try #RRGGBB, rgb(), or hsl()."); return; }
    onPick?.(ok);
    setOpen(false);
    setBad("");
  };

  return (
    <div
      className="fixed z-[1000] pointer-events-none"
      style={{ left, top, transform: "translate(-50%, -50%)" }}
    >
      {/* Anchor wrapper keeps icons fixed; popover is absolutely positioned inside */}
      <div className="relative inline-flex items-center gap-2 pointer-events-auto">

        {/* ✂ Cut */}
        <Tooltip text="Cut wire">
          <button
            type="button"
            onClick={onCut}
            className="w-7 h-7 rounded-full grid place-items-center shadow-lg
                       border border-neutral-600 bg-neutral-900/95 text-neutral-100
                       hover:bg-red-600 hover:border-red-500 hover:text-white
                       focus:outline-none focus:ring-2 focus:ring-red-400 transition"
            aria-label="Cut wire"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M8.6 7.5L19 18M19 6L8.6 16.5" />
            </svg>
          </button>
        </Tooltip>

        {/* 🎯 Color (droplet) */}
        <Tooltip text="Wire color">
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="w-7 h-7 rounded-full grid place-items-center shadow-lg
                       border border-neutral-600 bg-neutral-900/95 text-neutral-100
                       hover:bg-neutral-700 focus:outline-none focus:ring-2
                       focus:ring-cyan-400 transition"
            aria-label="Pick wire color"
            title="Pick wire color"
          >
            <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="currentColor" aria-hidden="true">
              <path d="M12 2s-6 6-6 10a6 6 0 1 0 12 0c0-4-6-10-6-10z"/>
            </svg>
          </button>
        </Tooltip>

        {/* × Close — truly absolute to the icon bar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-4 -right-3 w-4 h-4 rounded-full grid place-items-center
                     border border-green-600 bg-neutral-800 text-neutral-200
                     hover:bg-neutral-700 focus:outline-none focus:ring-2
                     focus:ring-green-400"
          aria-label="Close"
          title="Close"
        >
          <svg viewBox="0 0 24 24" className="w-[11px] h-[11px]" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6L18 18M18 6L6 18" />
          </svg>
        </button>

        {/* ===== Premium Popover (absolute; does NOT move the icons) ===== */}
        {open && (
          <div
            className="
              absolute left-1/2 -translate-x-1/2 top-[44px] z-[1001]
              min-w-[420px] rounded-2xl px-3 py-3
              bg-gradient-to-br from-neutral-900/95 via-neutral-900/85 to-neutral-800/80
              border border-white/10 ring-1 ring-cyan-400/30
              shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-md
            "
          >
            {/* Glint line */}
            <div className="pointer-events-none absolute -top-px left-2 right-2 h-px
                            bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Swatches */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {SWATCHES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onPick?.(c); setOpen(false); }}
                  className="w-5 h-5 rounded-full border border-white/15 shadow
                             ring-0 hover:ring-2 hover:ring-cyan-400/60 hover:scale-110
                             transition"
                  title={c}
                  style={{ background: c }}
                />
              ))}
            </div>

            {/* Advanced */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick any color"
                className="w-9 h-9 p-0 rounded border border-white/15 bg-transparent"
                onChange={(e) => { setText(e.target.value); setBad(""); onPick?.(e.target.value); }}
                value={/^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(text) ? text : "#ffffff"}
              />
              <input
                type="text"
                value={text}
                onChange={(e) => { setText(e.target.value); setBad(""); }}
                onKeyDown={(e) => e.key === "Enter" && applyText()}
                placeholder="#ff5678  |  rgb(255,80,90)  |  hsl(210 100% 50%)"
                className="w-80 text-sm px-2 py-1.5 rounded-md
                           border border-white/15 bg-neutral-900/70 text-neutral-100
                           focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={applyText}
                className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-500
                           text-white text-sm shadow transition"
              >
                Apply
              </button>
            </div>

            {bad && <div className="text-red-400 text-xs mt-2">{bad}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
