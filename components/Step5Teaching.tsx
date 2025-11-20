"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepProps, AssessmentPlan } from "@/types";
import { Loader2 } from "lucide-react";

export function Step5Teaching({ data, onNext, onUpdate }: StepProps) {
  const [teachingMethods, setTeachingMethods] = useState(
    data.teaching_methods_text || ""
  );
  const [assessmentPlan, setAssessmentPlan] = useState<AssessmentPlan[]>(
    data.assessment_plan || []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(!!data.teaching_methods_text);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 5, data }),
      });

      if (!response.ok) throw new Error("생성 실패");

      const result = await response.json();
      setTeachingMethods(result.teaching_methods_text);
      setAssessmentPlan(result.assessment_plan);
      setGenerated(true);
    } catch (error) {
      console.error("Error:", error);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    onUpdate({
      teaching_methods_text: teachingMethods,
      assessment_plan: assessmentPlan,
    });
    onNext();
  };

  if (!generated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>5단계: 교수학습 및 평가</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            교수학습방법 및 평가계획을 자동으로 생성합니다.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            생성 및 다음 단계로
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>교수학습방법 및 평가 수정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>교수학습방법</Label>
          <Textarea
            value={teachingMethods}
            onChange={(e) => setTeachingMethods(e.target.value)}
            rows={6}
            className="mt-2"
          />
        </div>

        <div>
          <h3 className="font-semibold mb-4">평가계획</h3>
          <div className="space-y-6">
            {assessmentPlan.map((plan, idx) => (
              <div key={idx} className="border p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>코드</Label>
                    <p className="text-sm mt-1 font-mono">{plan.code}</p>
                  </div>
                  <div>
                    <Label>성취기준</Label>
                    <p className="text-sm mt-1">{plan.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>평가요소</Label>
                    <Textarea
                      value={plan.element}
                      onChange={(e) => {
                        const newPlan = [...assessmentPlan];
                        newPlan[idx].element = e.target.value;
                        setAssessmentPlan(newPlan);
                      }}
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>수업평가방법</Label>
                    <Textarea
                      value={plan.method}
                      onChange={(e) => {
                        const newPlan = [...assessmentPlan];
                        newPlan[idx].method = e.target.value;
                        setAssessmentPlan(newPlan);
                      }}
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>평가기준 - 상</Label>
                  <Textarea
                    value={plan.criteria_high}
                    onChange={(e) => {
                      const newPlan = [...assessmentPlan];
                      newPlan[idx].criteria_high = e.target.value;
                      setAssessmentPlan(newPlan);
                    }}
                    rows={2}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>평가기준 - 중</Label>
                  <Textarea
                    value={plan.criteria_mid}
                    onChange={(e) => {
                      const newPlan = [...assessmentPlan];
                      newPlan[idx].criteria_mid = e.target.value;
                      setAssessmentPlan(newPlan);
                    }}
                    rows={2}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>평가기준 - 하</Label>
                  <Textarea
                    value={plan.criteria_low}
                    onChange={(e) => {
                      const newPlan = [...assessmentPlan];
                      newPlan[idx].criteria_low = e.target.value;
                      setAssessmentPlan(newPlan);
                    }}
                    rows={2}
                    className="mt-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleNext} className="w-full">
          저장 및 다음 단계로
        </Button>
      </CardContent>
    </Card>
  );
}
