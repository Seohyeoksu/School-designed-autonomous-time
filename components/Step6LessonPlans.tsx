"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StepProps, LessonPlan } from "@/types";
import { Loader2 } from "lucide-react";
import { QnaSection } from "@/components/ui/qna-tooltip";

export function Step6LessonPlans({ data, onNext, onUpdate }: StepProps) {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(
    data.lesson_plans || []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(!!data.lesson_plans);

  const totalHours = data.total_hours || 34;
  const tabGroups = Math.ceil(totalHours / 10);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 6, data }),
      });

      if (!response.ok) throw new Error("생성 실패");

      const result = await response.json();
      setLessonPlans(result.lesson_plans);
      setGenerated(true);
    } catch (error) {
      console.error("Error:", error);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    onUpdate({ lesson_plans: lessonPlans });
    onNext();
  };

  if (!generated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>6단계: 차시별 지도계획 (총 {totalHours}차시)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            총 {totalHours}차시를 한 번에 생성합니다.
          </p>
          <QnaSection
            quizzes={[
              {
                question: "학교자율시간 운영 방식에는 어떤 유형이 있나요?",
                answer: "지속형(매주 시수 활용), 집중형(학기 중 특정 기간 시수 집중 활용), 혼합형(지속형+집중형 혼합)이 있습니다. 학교 여건과 활동/과목 특성에 따라 적절한 방식을 선택할 수 있습니다."
              },
              {
                question: "차시별 교수·학습 계획 작성 시 어떤 점을 고려해야 하나요?",
                answer: "학습 내용을 실생활 맥락 속에서 이해하고 적용하는 기회를 제공해야 합니다. 학생이 핵심 내용을 내면화하여 역량을 함양할 수 있도록 구성하고, 학생의 삶에 의미 있는 학습 경험이 되도록 합니다."
              },
              {
                question: "2개 이상의 활동이나 과목을 개설할 때 최소 운영 차시는?",
                answer: "2개 이상의 활동이나 과목 개설 운영 시 '활동/과목'별 최소 14차시 이상 운영해야 합니다. 예를 들어 29시간을 운영할 경우 1활동(15시간)+1활동(14시간)으로 편성 가능하지만, 1과목(20시간)+1활동(9시간)은 활동이 14시간 미만이므로 불가합니다."
              }
            ]}
          />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            전체 차시 생성
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>생성된 차시별 계획 수정</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0">
          <TabsList className="w-full">
            {Array.from({ length: tabGroups }).map((_, idx) => {
              const start = idx * 10 + 1;
              const end = Math.min((idx + 1) * 10, totalHours);
              return (
                <TabsTrigger key={idx} value={idx.toString()}>
                  {start}~{end}차시
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Array.from({ length: tabGroups }).map((_, tabIdx) => {
            const start = tabIdx * 10;
            const end = Math.min(start + 10, totalHours);

            return (
              <TabsContent key={tabIdx} value={tabIdx.toString()} className="space-y-4">
                {lessonPlans.slice(start, end).map((lesson, idx) => {
                  const lessonIdx = start + idx;
                  return (
                    <div key={lessonIdx} className="border p-4 rounded-lg space-y-4">
                      <h3 className="font-semibold">{lessonIdx + 1}차시</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>학습주제</Label>
                          <Input
                            value={lesson.topic}
                            onChange={(e) => {
                              const newPlans = [...lessonPlans];
                              newPlans[lessonIdx].topic = e.target.value;
                              setLessonPlans(newPlans);
                            }}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>교수학습자료</Label>
                          <Input
                            value={lesson.materials}
                            onChange={(e) => {
                              const newPlans = [...lessonPlans];
                              newPlans[lessonIdx].materials = e.target.value;
                              setLessonPlans(newPlans);
                            }}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>학습내용</Label>
                        <Textarea
                          value={lesson.content}
                          onChange={(e) => {
                            const newPlans = [...lessonPlans];
                            newPlans[lessonIdx].content = e.target.value;
                            setLessonPlans(newPlans);
                          }}
                          rows={3}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            );
          })}
        </Tabs>

        <Button onClick={handleNext} className="w-full mt-6">
          차시별 계획 저장 및 다음 단계로
        </Button>
      </CardContent>
    </Card>
  );
}
