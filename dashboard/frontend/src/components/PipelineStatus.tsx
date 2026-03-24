"use client";

import { PipelineState, STEP_LABELS, STEP_ORDER, StepStatus } from "@/lib/types";

interface Props {
  state: PipelineState & {
    elapsed_seconds?: number;
    step_times?: Record<string, number>;
  };
}

function StepDot({ status }: { status: StepStatus }) {
  const base = "w-2 h-2 rounded-full flex-shrink-0";
  if (status === "done") return <div className={`${base} bg-[#0f7b6c]`} />;
  if (status === "active")
    return <div className={`${base} bg-[#2383e2] animate-pulse`} />;
  return <div className={`${base} bg-[#b4b4b0] opacity-40`} />;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export default function PipelineStatus({ state }: Props) {
  const stepTimes = state.step_times || {};
  const elapsed = state.elapsed_seconds;

  return (
    <div className="mb-5 shrink-0">
      <div className="flex items-center gap-0 px-5 py-3 bg-[#f7f7f5] rounded-lg overflow-x-auto">
        {STEP_ORDER.map((step, i) => {
          const status = state.steps[step];
          const label = STEP_LABELS[step];
          const stepTime = stepTimes[step];

          let textColor = "text-[#b4b4b0]";
          let bgClass = "";
          if (status === "done") textColor = "text-[#0f7b6c]";
          if (status === "active") {
            textColor = "text-[#2383e2]";
            bgClass = "bg-[#e8f0fe]";
          }

          return (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap cursor-pointer transition-all ${textColor} ${bgClass}`}
              >
                <StepDot status={status} />
                <span>{label}</span>
                {stepTime != null && status === "done" && (
                  <span className="text-[10px] opacity-60">
                    {formatTime(stepTime)}
                  </span>
                )}
              </div>
              {i < STEP_ORDER.length - 1 && (
                <span className="mx-0.5 text-[#b4b4b0] text-sm flex-shrink-0">
                  →
                </span>
              )}
            </div>
          );
        })}

        {/* Total elapsed time */}
        {elapsed != null && elapsed > 0 && (
          <div className="ml-auto pl-3 text-[11px] text-[#787774] whitespace-nowrap">
            {formatTime(elapsed)}
          </div>
        )}
      </div>
    </div>
  );
}
