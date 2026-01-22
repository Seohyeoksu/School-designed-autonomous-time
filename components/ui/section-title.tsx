"use client";

import { cn } from "@/lib/utils";

interface SectionTitleProps {
  number?: number;
  title: string;
  variant?: "default" | "accent";
  className?: string;
}

export function SectionTitle({ number, title, variant = "default", className }: SectionTitleProps) {
  if (variant === "accent") {
    // 평가계획, 교수학습방법 등 주요 섹션용
    return (
      <div className={cn("flex items-center gap-2 mb-4", className)}>
        <div className="w-1.5 h-6 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full" />
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
      </div>
    );
  }

  // 성취기준 1, 2, 3, 4 등 번호가 있는 항목용
  return (
    <div className={cn("flex items-center gap-3 mb-4", className)}>
      {number !== undefined && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-md shadow-sky-500/20">
            <span className="text-white font-bold text-sm">{number}</span>
          </div>
        </div>
      )}
      <div className="flex-1">
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 rounded-lg px-3 py-2">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      </div>
    </div>
  );
}
