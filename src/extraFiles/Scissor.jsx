// src/extraFiles/Scissor.jsx
import React from "react";
import Tooltip from '../extraFiles/tooltip';

export default function Scissor({ left, top, onClick, onClose }) {
  if (left == null || top == null) return null;

  return (
    <div
      className="fixed z-[1000]"
      style={{ left, top, transform: "translate(-50%, -50%)" }}
    >
      {/* ✂ Cut button */}
      <Tooltip text="Cut Wire">
      <button
        type="button"
        onClick={onClick}
        className="
          pointer-events-auto flex items-center justify-center
          w-7 h-7 rounded-full shadow-lg
          border border-neutral-600
          bg-neutral-900/95 text-neutral-100
          hover:bg-red-600 hover:border-red-500 hover:text-white
          focus:outline-none focus:ring-2 focus:ring-red-400
          transition
        "
      >
        {/* tiny scissor icon (inline SVG, no deps) */}
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M8.6 7.5L19 18M19 6L8.6 16.5" />
        </svg>
      </button>
      </Tooltip>

      {/* × close button (optional) */}
      
      <button
        type="button"
        onClick={onClose}
        className="
          pointer-events-auto absolute -top-4 -right-3
          w-4 h-4 rounded-full
          flex items-center justify-center
          border border-green-600
          bg-neutral-800 text-neutral-200
          hover:bg-neutral-700
          text-sm leading-none
          focus:outline-none focus:ring-2 focus:ring-green-400
          transition
        "
        aria-label="Cancel"
        
      >
        ×
      </button>
    </div>
  );
}
