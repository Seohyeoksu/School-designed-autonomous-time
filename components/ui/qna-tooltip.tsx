"use client";

import { useState } from "react";
import { MessageCircleQuestion, ChevronDown, ChevronUp } from "lucide-react";

interface QnaTooltipProps {
  question: string;
  answer: string;
}

export function QnaTooltip({ question, answer }: QnaTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full border border-sky-200 rounded-lg overflow-hidden">
      {/* 질문 영역 - 클릭하면 펼침/접힘 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 p-3 bg-sky-50 hover:bg-sky-100 transition-colors text-left"
      >
        <div className="flex items-start gap-2 flex-1">
          <MessageCircleQuestion className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-sky-800">{question}</p>
        </div>
        <div className="flex-shrink-0">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-sky-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-sky-600" />
          )}
        </div>
      </button>

      {/* 답변 영역 - 펼쳐졌을 때만 표시 */}
      {isOpen && (
        <div className="p-4 bg-white border-t border-sky-200 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{answer}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface QnaSectionProps {
  quizzes: QnaTooltipProps[];
}

export function QnaSection({ quizzes }: QnaSectionProps) {
  return (
    <div className="my-4 space-y-2">
      <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
        <MessageCircleQuestion className="w-4 h-4" />
        자주 묻는 질문
      </h4>
      {quizzes.map((quiz, index) => (
        <QnaTooltip key={index} {...quiz} />
      ))}
    </div>
  );
}
