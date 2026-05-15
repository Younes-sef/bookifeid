"use client";

/**
 * UploadProgressStepper
 *
 * WHAT IT IS:
 *   A full-screen overlay that replaces the generic spinner during book upload.
 *   It shows a vertical pipeline of 4 named steps, each with:
 *     - A status circle (pending / active / done / error)
 *     - A label and description
 *     - An optional progress bar (exact % when we know it, animated shimmer when we don't)
 *     - A detail line (e.g. "Saved 150 of 320 segments")
 *
 * WHY IT EXISTS:
 *   Uploading a book involves 4 sequential async operations that can take 30–120
 *   seconds depending on book size. Without feedback the user has no idea if the
 *   app is working or frozen. This component turns a stressful wait into a
 *   transparent, reassuring experience.
 *
 * HOW IT WORKS:
 *   The parent (UploadForm) maintains an array of UploadStep objects in state.
 *   As each operation completes it calls setStep() to update status/progress.
 *   This component is purely presentational — it just renders whatever state it
 *   receives as props.
 */

import { Check, X, Loader2, FileSearch, CloudUpload, Layers, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

export type StepStatus = "pending" | "active" | "done" | "error";

export interface UploadStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  /** 0 = indeterminate (animated shimmer), 1–100 = real percentage */
  progress: number;
  /** Human-readable detail, e.g. "Saved 150 of 320 segments" */
  detail: string;
}

// The four steps in the correct order — exported so UploadForm can import them
// and reset to this initial state each time a submission starts.
export const INITIAL_STEPS: UploadStep[] = [
  {
    id: "parse",
    label: "Extracting Text",
    description: "Reading your PDF and pulling out all text content",
    status: "pending",
    progress: 0,
    detail: "",
  },
  {
    id: "upload",
    label: "Uploading Files",
    description: "Storing your PDF and cover image securely to the cloud",
    status: "pending",
    progress: 0,
    detail: "",
  },
  {
    id: "segments",
    label: "Processing Content",
    description: "Chunking text into searchable segments for the AI",
    status: "pending",
    progress: 0,
    detail: "",
  },
  {
    id: "embed",
    label: "Building AI Brain",
    description: "Generating vector embeddings — the slowest step",
    status: "pending",
    progress: 0,
    detail: "",
  },
];

// Map each step id to a Lucide icon
const STEP_ICONS: Record<string, LucideIcon> = {
  parse:    FileSearch,
  upload:   CloudUpload,
  segments: Layers,
  embed:    Sparkles,
};

// ── Sub-components ─────────────────────────────────────────────────────────────

/**
 * The circle on the left of each step.
 * - pending  → grey ring with step number
 * - active   → warm walnut fill + pulsing ring + spinning loader
 * - done     → green fill + checkmark
 * - error    → red fill + X
 */
function StatusCircle({ step, index }: { step: UploadStep; index: number }) {
  const Icon = STEP_ICONS[step.id];

  const base = "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500";

  if (step.status === "done") {
    return (
      <div className={`${base} bg-green-500 border-2 border-green-400 text-white shadow-sm shadow-green-200`}>
        <Check className="w-5 h-5 stroke-[2.5]" />
      </div>
    );
  }

  if (step.status === "error") {
    return (
      <div className={`${base} bg-red-500 border-2 border-red-400 text-white`}>
        <X className="w-5 h-5" />
      </div>
    );
  }

  if (step.status === "active") {
    return (
      // Outer pulsing ring to draw the eye to the active step
      <div className="relative flex items-center justify-center">
        <div className="absolute w-14 h-14 rounded-full bg-[#6B4423]/20 animate-ping" />
        <div className={`${base} bg-[#6B4423] border-2 border-[#4A2F1D] text-[#FFFCF5] z-10 shadow-md`}>
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    );
  }

  // pending
  return (
    <div className={`${base} bg-[#F5F1E7] border-2 border-[#D4C3A3] text-[#C4B5A0]`}>
      {Icon ? <Icon className="w-4 h-4" /> : <span className="text-sm font-bold">{index + 1}</span>}
    </div>
  );
}

/**
 * The progress bar shown under the active step's description.
 * - progress === 0  → indeterminate animated shimmer (we don't know the %)
 * - progress 1–100  → filled bar (we know the exact %)
 */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="mt-3 h-1.5 bg-[#E2D8C3] rounded-full overflow-hidden">
      {progress > 0 ? (
        // Determinate — smooth transition as percentage increases
        <div
          className="h-full bg-[#6B4423] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      ) : (
        // Indeterminate — a sliding bar using CSS animation
        // We use a wrapper that hides overflow and a child that translates
        <div className="relative h-full w-full">
          <div
            className="absolute h-full w-1/3 bg-[#6B4423] rounded-full"
            style={{
              animation: "indeterminate-slide 1.4s ease-in-out infinite",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface UploadProgressStepperProps {
  isVisible: boolean;
  steps: UploadStep[];
}

export default function UploadProgressStepper({ isVisible, steps }: UploadProgressStepperProps) {
  if (!isVisible) return null;

  const activeStep = steps.find((s) => s.status === "active");

  return (
    <>
      {/* Inline keyframe for the indeterminate bar — avoids needing globals.css changes */}
      <style>{`
        @keyframes indeterminate-slide {
          0%   { left: -33%; }
          100% { left: 100%; }
        }
      `}</style>

      {/* Full-screen backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

        {/* Card */}
        <div className="w-full max-w-md bg-[#FFFCF5] border border-[#E2D8C3] rounded-sm shadow-[12px_12px_0px_0px_rgba(107,68,35,0.12)] p-8 relative overflow-hidden">

          {/* Decorative spine line (matches the book detail card) */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#6B4423]/70" />

          {/* Header */}
          <div className="mb-8 pl-2">
            <h2 className="text-2xl font-serif font-bold text-[#2C1810]">
              Synthesizing Your Book
            </h2>
            <p className="text-sm text-[#8C7A6B] mt-1 font-serif italic">
              {activeStep
                ? activeStep.description
                : "Preparing everything…"}
            </p>
          </div>

          {/* Steps list */}
          <div className="pl-2">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <div key={step.id} className="flex gap-4">

                  {/* Left column: circle + connecting line */}
                  <div className="flex flex-col items-center">
                    <StatusCircle step={step} index={index} />
                    {/* Connecting line between steps — coloured green once done */}
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-[28px] my-1 rounded-full transition-colors duration-500 ${
                          step.status === "done" ? "bg-green-300" : "bg-[#E2D8C3]"
                        }`}
                      />
                    )}
                  </div>

                  {/* Right column: text + progress */}
                  <div className={`flex-1 ${!isLast ? "pb-6" : "pb-2"}`}>
                    {/* Label row */}
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-semibold text-sm transition-colors duration-300 ${
                          step.status === "active"
                            ? "text-[#2C1810]"
                            : step.status === "done"
                            ? "text-green-700"
                            : step.status === "error"
                            ? "text-red-600"
                            : "text-[#B0A090]" // pending = faded
                        }`}
                      >
                        {step.label}
                      </p>
                      {/* Percentage badge — shown only on active steps with real progress */}
                      {step.status === "active" && step.progress > 0 && (
                        <span className="text-xs px-1.5 py-0.5 bg-[#6B4423]/10 text-[#6B4423] rounded font-mono font-semibold">
                          {step.progress}%
                        </span>
                      )}
                    </div>

                    {/* Detail text */}
                    {step.detail && (
                      <p className="text-xs text-[#8C7A6B] mt-0.5">{step.detail}</p>
                    )}

                    {/* Progress bar — only shown for the active step */}
                    {step.status === "active" && (
                      <ProgressBar progress={step.progress} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <p className="text-xs text-center text-[#C4B5A0] mt-6 font-serif italic pl-2">
            Please keep this tab open while processing
          </p>
        </div>
      </div>
    </>
  );
}
