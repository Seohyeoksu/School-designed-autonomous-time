"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ProgressSteps } from "@/components/ProgressSteps";
import { Step1BasicInfo } from "@/components/Step1BasicInfo";
import { Step2ApprovalDownload } from "@/components/Step2ApprovalDownload";
import { Step3ContentSystem } from "@/components/Step3ContentSystem";
import { Step4Standards } from "@/components/Step4Standards";
import { Step5Teaching } from "@/components/Step5Teaching";
import { Step6LessonPlans } from "@/components/Step6LessonPlans";
import { Step7Review } from "@/components/Step7Review";
import { ChatInterface } from "@/components/chat-interface";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MessageCircle } from "lucide-react";

export default function Home() {
  const { currentStep, data, setStep, updateData } = useStore();
  const [chatOpen, setChatOpen] = useState(false);

  const handleNext = () => {
    if (currentStep < 7) {
      setStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  };

  const handleGoToStep = (step: number) => {
    if (step >= 1 && step <= 7) {
      setStep(step);
    }
  };

  const renderStep = () => {
    const stepProps = {
      data,
      onNext: handleNext,
      onPrev: handlePrev,
      onUpdate: updateData,
    };

    switch (currentStep) {
      case 1:
        return <Step1BasicInfo {...stepProps} />;
      case 2:
        return <Step2ApprovalDownload {...stepProps} />;
      case 3:
        return <Step3ContentSystem {...stepProps} />;
      case 4:
        return <Step4Standards {...stepProps} />;
      case 5:
        return <Step5Teaching {...stepProps} />;
      case 6:
        return <Step6LessonPlans {...stepProps} />;
      case 7:
        return <Step7Review {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 max-w-7xl">
          <motion.header
            className="mb-6 sm:mb-8 md:mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              mass: 1
            }}
          >
            <motion.div
              className="inline-block mb-2 sm:mb-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 20,
                delay: 0.1
              }}
            >
              <div className="inline-flex items-center gap-4 sm:gap-5">
                <img
                  src="/signature10_수정.jpg"
                  alt="학교자율시간 아이콘"
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl object-cover"
                />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  학교자율시간올인원
                </h1>
              </div>
            </motion.div>
          </motion.header>

        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 20,
            delay: 0.3
          }}
        >
          <ProgressSteps currentStep={currentStep} onGoToStep={handleGoToStep} />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.main
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 25
            }}
          >
            {renderStep()}
          </motion.main>
        </AnimatePresence>

        <motion.footer
          className="mt-16 sm:mt-20 md:mt-24 pt-6 sm:pt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center gap-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl px-5 sm:px-6 py-3"
            whileHover={{
              scale: 1.02,
              boxShadow: "0 8px 20px rgba(14, 165, 233, 0.15)"
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <img
              src="/symbol1.jpg"
              alt="경상북도 심볼"
              className="h-8 sm:h-9 md:h-10 w-auto"
            />
            <span className="text-base sm:text-lg md:text-xl font-semibold text-gray-700">
              제작: 경상북도교육청 유초등교육과
            </span>
          </motion.div>
        </motion.footer>
        </div>

        <motion.button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">질문하기</span>
        </motion.button>

        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetContent side="right" className="w-full sm:w-[600px] md:w-[700px] lg:w-[800px] p-0 overflow-hidden">
            <SheetHeader className="sr-only">
              <SheetTitle>학교자율시간 질문하기</SheetTitle>
            </SheetHeader>
            <div className="h-full">
              <ChatInterface />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
