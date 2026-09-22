import React from "react"
import { Clock } from "@/components/icons"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * High-precision 12-point scalloped verified badge seal with checkmark.
 */
function ScallopedVerifiedSeal({ className = "size-3.5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 12-point scalloped seal */}
      <path
        d="M9.68 2.26a1.75 1.75 0 0 1 2.64 0l.73.81a1.75 1.75 0 0 0 1.54.55l1.08-.15a1.75 1.75 0 0 1 1.95 1.42l.22 1.07a1.75 1.75 0 0 0 1.05 1.28l1 .44a1.75 1.75 0 0 1 .95 2.22l-.4 1.02a1.75 1.75 0 0 0 .34 1.62l.74.8a1.75 1.75 0 0 1 0 2.48l-.74.8a1.75 1.75 0 0 0-.34 1.62l.4 1.02a1.75 1.75 0 0 1-.95 2.22l-1 .44a1.75 1.75 0 0 0-1.05 1.28l-.22 1.07a1.75 1.75 0 0 1-1.95 1.42l-1.08-.15a1.75 1.75 0 0 0-1.54.55l-.73.81a1.75 1.75 0 0 1-2.64 0l-.73-.81a1.75 1.75 0 0 0-1.54-.55l-1.08.15a1.75 1.75 0 0 1-1.95-1.42l-.22-1.07a1.75 1.75 0 0 0-1.05-1.28l-1-.44a1.75 1.75 0 0 1-.95-2.22l.4-1.02a1.75 1.75 0 0 0-.34-1.62l-.74-.8a1.75 1.75 0 0 1 0-2.48l.74-.8a1.75 1.75 0 0 0 .34-1.62l-.4-1.02a1.75 1.75 0 0 1 .95-2.22l1-.44a1.75 1.75 0 0 0 1.05-1.28l.22-1.07a1.75 1.75 0 0 1 1.95-1.42l1.08.15a1.75 1.75 0 0 0 1.54-.55l.73-.81z"
        fill="#ffffff"
      />
      {/* Precision inner checkmark */}
      <path
        d="M8.5 12.2l2.3 2.3 4.7-4.7"
        stroke="#064e3b"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * World-class Verified Indicator with layered expanding bubble effect
 * in green shades (emerald-950, emerald-900, emerald-800, emerald-700 over emerald-300).
 */
export function InstitutionVerifiedBadge({
  verified = true,
  className = "",
}) {
  if (!verified) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 shadow-2xs select-none cursor-help transition-colors hover:bg-amber-500/15 ${className}`}
          >
            <Clock className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>Verification pending</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          Verification in progress
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Verified Institution"
          className={`border border-emerald-500/40 hover:scale-95 duration-300 relative group cursor-pointer text-emerald-50 overflow-hidden h-8 px-3.5 rounded-full bg-emerald-300 dark:bg-emerald-950/60 flex justify-center items-center font-bold text-xs select-none shadow-xs transition-transform ${className}`}
        >
          {/* Animated concentric bubbles in shades of green */}
          <div className="absolute right-16 -top-2 group-hover:top-0.5 group-hover:right-1 z-0 w-24 h-24 rounded-full group-hover:scale-150 transition-all duration-500 bg-emerald-950" />
          <div className="absolute right-1 -top-2 group-hover:top-0.5 group-hover:right-1 z-0 w-20 h-20 rounded-full group-hover:scale-150 transition-all duration-500 bg-emerald-900" />
          <div className="absolute -right-6 top-2 group-hover:top-0.5 group-hover:right-1 z-0 w-16 h-16 rounded-full group-hover:scale-150 transition-all duration-500 bg-emerald-800" />
          <div className="absolute right-10 -top-2 group-hover:top-0.5 group-hover:right-1 z-0 w-12 h-12 rounded-full group-hover:scale-150 transition-all duration-500 bg-emerald-700" />

          {/* Badge Content */}
          <div className="relative z-10 flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            <span className="flex items-center justify-center shrink-0">
              <ScallopedVerifiedSeal className="size-3.5" />
            </span>
            <span className="tracking-wide">Verified</span>
            <span className="relative ml-0.5 flex size-1.5 items-center justify-center" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-70" />
              <span className="relative inline-flex size-1 rounded-full bg-white" />
            </span>
          </div>
        </button>
      </TooltipTrigger>

      <TooltipContent side="bottom" align="end">
        Verified Institution
      </TooltipContent>
    </Tooltip>
  )
}
