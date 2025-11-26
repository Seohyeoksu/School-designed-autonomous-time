"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StepProps, ContentSet } from "@/types";
import { Loader2 } from "lucide-react";
import { QnaSection } from "@/components/ui/qna-tooltip";

export function Step3ContentSystem({ data, onNext, onUpdate }: StepProps) {
  const [contentSets, setContentSets] = useState<ContentSet[]>(
    data.content_sets || []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(!!data.content_sets);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 3, data }),
      });

      if (!response.ok) throw new Error("생성 실패");

      const result = await response.json();
      setContentSets(result);
      setGenerated(true);
    } catch (error) {
      console.error("Error:", error);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    onUpdate({ content_sets: contentSets });
    onNext();
  };

  if (!generated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>3단계: 내용체계</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            영역명, 핵심 아이디어, 내용 요소를 4세트 생성합니다.
          </p>
          <QnaSection
            quizzes={[
              {
                question: "내용체계표는 어떤 요소로 구성되나요?",
                answer: "내용체계표는 영역, 핵심 아이디어, 내용 요소(지식·이해, 과정·기능, 가치·태도)로 구성됩니다. 영역은 활동/과목의 학습 내용을 구성하는 일차 조직자이고, 핵심 아이디어는 영역을 아우르면서 일반화할 수 있는 내용입니다."
              },
              {
                question: "핵심 아이디어란 무엇인가요?",
                answer: "핵심 아이디어는 영역을 아우르면서 해당 영역의 학습을 통해 일반화할 수 있는 내용을 핵심적으로 진술한 것입니다. 해당 영역 학습에 초점을 부여하여 깊이 있는 학습을 가능하게 하는 토대가 됩니다."
              },
              {
                question: "지식·이해, 과정·기능, 가치·태도는 각각 어떻게 진술하나요?",
                answer: "지식·이해는 활동/과목을 통해 알고 이해해야 할 내용을 명사형으로 제시합니다. 과정·기능은 사고 및 탐구 과정을 행동동사로 제시합니다. 가치·태도는 기를 수 있는 고유한 가치 및 태도를 학년(군)별 수준이 드러나도록 제시합니다."
              }
            ]}
          />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            4세트 생성 및 다음 단계로
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>생성된 내용체계 수정</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0">
          <TabsList className="grid w-full grid-cols-4">
            {contentSets.map((_, idx) => (
              <TabsTrigger key={idx} value={idx.toString()}>
                세트 {idx + 1}
              </TabsTrigger>
            ))}
          </TabsList>

          {contentSets.map((set, idx) => (
            <TabsContent key={idx} value={idx.toString()} className="space-y-4">
              <div>
                <Label>영역명</Label>
                <Input
                  value={set.domain}
                  onChange={(e) => {
                    const newSets = [...contentSets];
                    newSets[idx].domain = e.target.value;
                    setContentSets(newSets);
                  }}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>핵심 아이디어</Label>
                <Textarea
                  value={set.key_ideas.join("\n")}
                  onChange={(e) => {
                    const newSets = [...contentSets];
                    newSets[idx].key_ideas = e.target.value
                      .split("\n")
                      .filter((line) => line.trim());
                    setContentSets(newSets);
                  }}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>지식·이해</Label>
                  <Textarea
                    value={set.content_elements.knowledge_and_understanding.join(
                      "\n"
                    )}
                    onChange={(e) => {
                      const newSets = [...contentSets];
                      newSets[idx].content_elements.knowledge_and_understanding =
                        e.target.value.split("\n").filter((line) => line.trim());
                      setContentSets(newSets);
                    }}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>과정·기능</Label>
                  <Textarea
                    value={set.content_elements.process_and_skills.join("\n")}
                    onChange={(e) => {
                      const newSets = [...contentSets];
                      newSets[idx].content_elements.process_and_skills =
                        e.target.value.split("\n").filter((line) => line.trim());
                      setContentSets(newSets);
                    }}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>가치·태도</Label>
                  <Textarea
                    value={set.content_elements.values_and_attitudes.join("\n")}
                    onChange={(e) => {
                      const newSets = [...contentSets];
                      newSets[idx].content_elements.values_and_attitudes =
                        e.target.value.split("\n").filter((line) => line.trim());
                      setContentSets(newSets);
                    }}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Button onClick={handleNext} className="w-full mt-6">
          4세트 저장 및 다음 단계로
        </Button>
      </CardContent>
    </Card>
  );
}
