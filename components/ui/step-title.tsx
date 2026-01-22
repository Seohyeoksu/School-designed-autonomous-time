"use client";

import { cn } from "@/lib/utils";

interface StepTitleProps {
  step: number;
  title: string;
  totalSteps?: number;
  className?: string;
}

export function StepTitle({ step, title, totalSteps = 7, className }: StepTitleProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* 단계 번호 뱃지 */}
      <div className="flex-shrink-0">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <span className="text-white font-bold text-lg">{step}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
            <span className="text-[10px] font-semibold text-gray-500">{totalSteps}</span>
          </div>
        </div>
      </div>

      {/* 제목 컨테이너 */}
      <div className="flex-1 min-w-0">
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-sky-600 mb-0.5">STEP {step}</p>
          <h2 className="text-lg font-bold text-gray-900 truncate">{title}</h2>
        </div>
      </div>
    </div>
  );
}
