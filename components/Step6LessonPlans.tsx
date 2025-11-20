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
