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

  const renderStep = () => {
    const stepProps = {
      data,
      onNext: handleNext,
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-sky-50 text-sky-700 rounded-full text-xs sm:text-sm font-semibold">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                AI 자동 생성
              </span>
            </motion.div>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.h1
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2 sm:mb-3 tracking-tight leading-tight cursor-help"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 20,
                    delay: 0.1
                  }}
                >
                  학교자율시간 계획서 만들기
                </motion.h1>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-md sm:max-w-lg md:max-w-2xl p-4 bg-white border-2 border-sky-200 shadow-lg"
              >
                <div className="space-y-2">
                  <h3 className="font-bold text-sky-700 text-sm sm:text-base">학교자율시간이란?</h3>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    학교에서 <strong className="text-sky-600">지역과 학교의 여건 및 학생의 필요</strong>에 따라
                    교과 및 창의적 체험활동의 일부 시수를 확보하여
                    <strong className="text-sky-600"> 국가 교육과정에 제시되지 않은 새로운 과목</strong>을
                    자유롭게 개발운영하는 시간입니다.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
            <motion.p
              className="text-base sm:text-lg md:text-xl text-gray-600 font-medium"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 20,
                delay: 0.2
              }}
            >
              7단계로 쉽고 빠르게 완성하세요
            </motion.p>
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
          <ProgressSteps currentStep={currentStep} />
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
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full"
            whileHover={{
              scale: 1.02,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span className="text-xs sm:text-sm text-gray-500">
              제작: 경상북도교육청 인공지능연구소(GAI LAB) · 교사 서혁수
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
