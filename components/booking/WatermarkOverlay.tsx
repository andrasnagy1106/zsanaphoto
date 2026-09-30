import React from "react";

interface WatermarkOverlayProps {
  text?: string;
  className?: string;
}

/**
 * Visual client-side watermark protection overlay for photo order cards and preview dialogs.
 * Prevents simple right-click save and screenshots by rendering repeated diagonal watermark stamps
 * and disabling drag/context menu interactions.
 */
export function WatermarkOverlay({ text = "ZsaNa Photo · MINTA", className = "" }: WatermarkOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-10 flex select-none items-center justify-center overflow-hidden ${className}`}
    >
      {/* Repeating Diagonal Watermark Grid */}
      <div className="absolute inset-0 flex flex-wrap items-center justify-around gap-x-8 gap-y-12 p-4 opacity-40 mix-blend-overlay rotate-[-25deg] scale-125">
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={index}
            className="whitespace-nowrap font-mono text-sm sm:text-base font-extrabold tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          >
            {text}
          </span>
        ))}
      </div>

      {/* Central semi-transparent brand badge watermark */}
      <div className="relative flex flex-col items-center justify-center rounded-lg border border-white/30 bg-black/35 px-4 py-2 text-center text-white backdrop-blur-[2px] shadow-lg">
        <span className="font-display text-base sm:text-lg font-bold tracking-wider drop-shadow-md">
          {text}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-white/80">
          Védett előnézeti minta
        </span>
      </div>
    </div>
  );
}
