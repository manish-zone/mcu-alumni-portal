import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Slim Horizontal Step Indicator — minimal pill style with connecting lines
 * Matches reference: ①Personal ──── ②Academic ──── ③Career  Step 1 of 3
 */
export function FormProgressBar({
  percentage = 0,
  completedCount,
  totalCount,
  completedFields,
  totalFields,
  label,
  title,
  lang = 'en',
  steps = null,
  currentStep = 1,
  onStepClick = null,
  compact = false,
}) {
  const safePct = Math.max(0, Math.min(100, Math.round(percentage)));
  const isComplete = safePct >= 100;

  const resolvedCompleted = typeof completedCount === 'number' ? completedCount : completedFields;
  const resolvedTotal = typeof totalCount === 'number' ? totalCount : totalFields;

  // ── If steps array is provided render animated slim horizontal stepper ──
  if (Array.isArray(steps) && steps.length > 0) {
    return (
      <div className="w-full bg-gradient-to-b from-slate-50/90 to-white px-3.5 py-2.5 rounded-2xl border border-slate-200/80 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_-2px_rgba(2,132,199,0.06)]">
        {/* Slim stepper row */}
        <div className="flex items-center w-full">
          {steps.map((s, idx) => {
            const stepId = s.id || idx + 1;
            const isDone = currentStep > stepId || isComplete;
            const isActive = currentStep === stepId;
            const isLast = idx === steps.length - 1;
            const clickable = typeof onStepClick === 'function' && stepId <= currentStep;

            return (
              <React.Fragment key={stepId}>
                {/* Step node */}
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick(stepId)}
                  className={`flex items-center gap-1.5 shrink-0 group transition-transform duration-200 ${
                    clickable ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'
                  }`}
                >
                  {/* Circle */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-300 border ${
                      isActive
                        ? 'bg-gradient-to-b from-[#0284c7] to-[#002244] text-white border-sky-400/80 mcu-step-node-active scale-105'
                        : isDone
                        ? 'bg-emerald-600 text-white border-emerald-500 mcu-step-node-done shadow-xs'
                        : 'bg-white text-slate-400 border-slate-300'
                    }`}
                  >
                    {isDone && !isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : stepId}
                  </span>
                  {/* Label */}
                  <span
                    className={`text-[12px] sm:text-[13px] font-bold transition-colors duration-200 ${
                      isActive
                        ? 'text-[#002244]'
                        : isDone
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>

                {/* Connector line between steps */}
                {!isLast && (
                  <div className="flex-1 mx-2 sm:mx-3 h-[2px] rounded-full bg-slate-200/90 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#002244] via-[#0284c7] to-emerald-500 transition-all duration-500 ease-out rounded-full"
                      style={{ width: isDone ? '100%' : isActive ? '35%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Step counter + Percentage badge on far right */}
          <div className="ml-3 flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-[#003366] bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-full whitespace-nowrap">
              {lang === 'hi'
                ? `चरण ${currentStep}/${steps.length}`
                : `Step ${currentStep}/${steps.length}`}
            </span>
            <span className="hidden sm:inline-block text-[11px] font-extrabold text-[#fc4a00] tabular-nums">
              {safePct}%
            </span>
          </div>
        </div>

        {/* Thin progress underline with live shimmer */}
        <div className="h-[3px] w-full bg-slate-100 rounded-full overflow-hidden mt-2 relative">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full relative overflow-hidden"
            style={{
              width: `${Math.max(6, safePct)}%`,
              background: isComplete
                ? '#10b981'
                : 'linear-gradient(90deg, #002244 0%, #0284c7 55%, #fc4a00 100%)',
            }}
          >
            <div className="absolute inset-0 mcu-form-progress-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  // ── Compact progress bar (used in login / forgot flows) ──
  return (
    <div className={`w-full ${compact ? '' : 'mb-1'}`}>
      {/* Label row */}
      {(label || title || (typeof resolvedCompleted === 'number')) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-500">
            {label || title || ''}
            {typeof resolvedCompleted === 'number' && typeof resolvedTotal === 'number' && (
              <span className="ml-1 text-[#0369a1]">
                ({resolvedCompleted}/{resolvedTotal})
              </span>
            )}
          </span>
          <span className="text-[11px] font-bold text-[#002244] tabular-nums">{safePct}%</span>
        </div>
      )}
      {/* Progress bar */}
      <div className="h-[3px] w-full bg-slate-100 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
          style={{
            width: `${Math.max(4, safePct)}%`,
            background: isComplete
              ? '#10b981'
              : 'linear-gradient(90deg, #002244 0%, #0369a1 60%, #fc4a00 100%)',
          }}
        >
          <div className="absolute inset-0 mcu-form-progress-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default FormProgressBar;
