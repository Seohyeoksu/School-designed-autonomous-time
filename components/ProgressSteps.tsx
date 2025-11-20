"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressStepsProps {
  currentStep: number;
}

const steps = [
  "기본정보",
  "승인 신청서",
  "내용체계",
  "성취기준",
  "교수학습",
  "차시별계획",
  "최종 검토",
];

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 sm:p-6 md:p-8">
      {/* Progress Bar with Percentage */}
      <div className="mb-5 sm:mb-7">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-bold text-gray-700">
            진행 상황
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <motion.div
              className="text-lg sm:text-xl font-extrabold text-sky-600"
              key={currentStep}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              {Math.round(progressPercentage)}%
            </motion.div>
            <span className="text-xs sm:text-sm text-gray-400 font-medium">
              {currentStep}/{steps.length}
            </span>
          </div>
        </div>
        <div className="h-2 sm:h-2.5 bg-sky-100/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-sky-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{
              type: "spring",
              stiffness: 50,
              damping: 15
            }}
          />
        </div>
      </div>

      {/* Responsive Steps - Hide labels on mobile, show on larger screens */}
      <div className="hidden sm:flex items-start justify-between gap-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <motion.div
              key={step}
              className="flex flex-col items-center flex-1"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {/* Circle */}
              <motion.div
                className={cn(
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold mb-2 sm:mb-2.5",
                  isCompleted && "bg-sky-500 text-white shadow-sm",
                  isActive && "bg-sky-500 text-white shadow-md ring-3 ring-sky-100",
                  !isCompleted && !isActive && "bg-gray-100 text-gray-400"
                )}
                initial={false}
                animate={
                  isActive
                    ? { scale: 1.05 }
                    : isCompleted
                    ? { scale: 1 }
                    : { scale: 0.95 }
                }
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15
                    }}
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  </motion.div>
                ) : (
                  <span>{stepNumber}</span>
                )}
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] md:text-xs text-center font-semibold leading-tight",
                  isActive && "text-gray-900",
                  isCompleted && "text-gray-600",
                  !isCompleted && !isActive && "text-gray-400"
                )}
              >
                {step}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile: Compact step indicator */}
      <div className="flex sm:hidden items-center justify-center gap-1.5">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <motion.div
              key={step}
              className={cn(
                "h-2 rounded-full",
                isActive ? "w-8" : "w-2",
                isCompleted && "bg-sky-500",
                isActive && "bg-sky-500",
                !isCompleted && !isActive && "bg-gray-200"
              )}
              initial={false}
              animate={{
                width: isActive ? 32 : 8,
                backgroundColor: isCompleted || isActive ? "#0ea5e9" : "#e5e7eb"
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
            />
          );
        })}
      </div>

      {/* Mobile: Current step label */}
      <motion.div
        className="sm:hidden text-center mt-3"
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
      >
        <span className="text-sm font-bold text-gray-900">
          {currentStep}단계: {steps[currentStep - 1]}
        </span>
      </motion.div>
    </div>
  );
}
