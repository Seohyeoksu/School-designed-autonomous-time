"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepProps, Standard } from "@/types";
import { Loader2 } from "lucide-react";

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
