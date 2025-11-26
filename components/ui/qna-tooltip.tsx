"use client";

import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";

interface QnaTooltipProps {
  question: string;
  answer: string;
}

export function QnaTooltip({ question, answer }: QnaTooltipProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div
      className="relative inline-block w-full"
      onMouseEnter={() => setShowAnswer(true)}
      onMouseLeave={() => setShowAnswer(false)}
    >
      <div className="flex items-start gap-2 p-3 bg-sky-50 border border-sky-200 rounded-lg cursor-help hover:bg-sky-100 transition-colors">
        <MessageCircleQuestion className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-sky-800">{question}</p>
      </div>

      {showAnswer && (
        <div className="absolute z-50 left-0 right-0 mt-2 p-4 bg-white border-2 border-sky-300 rounded-lg shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{answer}</p>
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
      {quizzes.map((quiz, index) => (
        <QnaTooltip key={index} {...quiz} />
      ))}
    </div>
  );
}
