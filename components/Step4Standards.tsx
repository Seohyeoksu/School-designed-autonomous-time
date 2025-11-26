"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepProps, Standard } from "@/types";
import { Loader2 } from "lucide-react";
import { QnaSection } from "@/components/ui/qna-tooltip";

export function Step4Standards({ data, onNext, onUpdate }: StepProps) {
  const [standards, setStandards] = useState<Standard[]>(data.standards || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(!!data.standards);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 4, data }),
      });

      if (!response.ok) throw new Error("생성 실패");

      const result = await response.json();
      setStandards(result);
      setGenerated(true);
    } catch (error) {
      console.error("Error:", error);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    onUpdate({ standards });
    onNext();
  };

  if (!generated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>4단계: 성취기준 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            내용체계에 맞는 성취기준을 생성합니다.
          </p>
          <QnaSection
            quizzes={[
              {
                question: "성취기준이란 무엇인가요?",
                answer: "성취기준은 학생이 교과를 통해 배워야 할 내용과 이를 통해 수업 후 할 수 있거나 할 수 있기를 기대하는 능력을 결합하여 나타낸 기준입니다. 교수·학습 및 평가의 실질적인 근거가 됩니다."
              },
              {
                question: "성취기준 코드는 어떻게 작성하나요?",
                answer: "성취기준 코드는 [학년(3~6)+교과명 앞글자+활동/과목명 약어+영역번호-성취기준번호] 형식으로 작성합니다. 예: [3사미디어01-02]는 3학년, 사회 교과, 미디어 활동, 01영역의 02번 성취기준을 의미합니다."
              },
              {
                question: "성취기준 재구조화와 개발의 차이는 무엇인가요?",
                answer: "성취기준 재구조화는 기존 교과 성취기준을 통합하거나 내용 요소를 수정·변형하는 것입니다. 성취기준 개발은 교과 성취기준과 중복되지 않도록 새로운 성취기준을 만드는 것입니다. 학교자율시간은 교과 외 새로운 내용이므로 주로 개발 방식을 활용합니다."
              }
            ]}
          />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            성취기준 생성 및 다음 단계로
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>생성된 성취기준 수정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {standards.map((standard, idx) => (
          <div key={idx} className="border p-4 rounded-lg space-y-4">
            <h3 className="font-semibold">성취기준 {idx + 1}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>성취기준 코드</Label>
                <Input
                  value={standard.code}
                  onChange={(e) => {
                    const newStandards = [...standards];
                    newStandards[idx].code = e.target.value;
                    setStandards(newStandards);
                  }}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>성취기준 설명</Label>
                <Textarea
                  value={standard.description}
                  onChange={(e) => {
                    const newStandards = [...standards];
                    newStandards[idx].description = e.target.value;
                    setStandards(newStandards);
                  }}
                  rows={2}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {["A", "B", "C"].map((level) => {
                const levelData = standard.levels.find((l) => l.level === level);
                return (
                  <div key={level}>
                    <Label>{level === "A" ? "상" : level === "B" ? "중" : "하"} 수준</Label>
                    <Textarea
                      value={levelData?.description || ""}
                      onChange={(e) => {
                        const newStandards = [...standards];
                        const levelIdx = newStandards[idx].levels.findIndex(
                          (l) => l.level === level
                        );
                        if (levelIdx !== -1) {
                          newStandards[idx].levels[levelIdx].description =
                            e.target.value;
                        }
                        setStandards(newStandards);
                      }}
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <Button onClick={handleNext} className="w-full">
          성취기준 저장 및 다음 단계로
        </Button>
      </CardContent>
    </Card>
  );
}
