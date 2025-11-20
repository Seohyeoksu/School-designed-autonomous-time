"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StepProps } from "@/types";
import { Loader2 } from "lucide-react";

const ELEMENTARY_GRADES = ["3학년", "4학년", "5학년", "6학년"];
const ELEMENTARY_SUBJECTS = [
  "국어",
  "수학",
  "사회",
  "과학",
  "영어",
  "음악",
  "미술",
  "체육",
  "실과",
  "도덕",
];

const MIDDLE_GRADES = ["1학년", "2학년", "3학년"];
const MIDDLE_SUBJECTS = [
  "국어",
  "수학",
  "사회/역사",
  "과학/기술",
  "영어",
  "음악",
  "미술",
  "체육",
  "정보",
  "도덕",
  "보건",
  "진로와 직업",
  "한문",
  "환경과 녹생성장",
];

export function Step1BasicInfo({ data, onNext, onUpdate }: StepProps) {
  const [formData, setFormData] = useState(data);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const grades =
    formData.school_type === "초등학교"
      ? ELEMENTARY_GRADES
      : MIDDLE_GRADES;
  const subjects =
    formData.school_type === "초등학교"
      ? ELEMENTARY_SUBJECTS
      : MIDDLE_SUBJECTS;

  const toggleGrade = (grade: string) => {
    const newGrades = formData.grades.includes(grade)
      ? formData.grades.filter((g) => g !== grade)
      : [...formData.grades, grade];
    setFormData({ ...formData, grades: newGrades });
  };

  const toggleSubject = (subject: string) => {
    const newSubjects = formData.subjects.includes(subject)
      ? formData.subjects.filter((s) => s !== subject)
      : [...formData.subjects, subject];
    setFormData({ ...formData, subjects: newSubjects });
  };

  const toggleSemester = (semester: string) => {
    const newSemester = formData.semester.includes(semester)
      ? formData.semester.filter((s) => s !== semester)
      : [...formData.semester, semester];
    setFormData({ ...formData, semester: newSemester });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 1, data: formData }),
      });

      if (!response.ok) throw new Error("생성 실패");

      const result = await response.json();
      setFormData({ ...formData, ...result });
      setGenerated(true);
    } catch (error) {
      console.error("Error:", error);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    onUpdate(formData);
    onNext();
  };

  if (!generated) {
    return (
      <TooltipProvider>
        <Card>
          <CardHeader>
            <CardTitle>1단계: 기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
          {/* 학교급 */}
          <div>
            <Label>학교급</Label>
            <div className="flex gap-4 mt-2">
              {["초등학교", "중학교"].map((type) => (
                <Button
                  key={type}
                  variant={formData.school_type === type ? "default" : "outline"}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      school_type: type,
                      grades: [],
                      subjects: [],
                    })
                  }
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* 학년 */}
          <div>
            <Label>대상 학년</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {grades.map((grade) => (
                <Button
                  key={grade}
                  variant={formData.grades.includes(grade) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleGrade(grade)}
                >
                  {grade}
                </Button>
              ))}
            </div>
          </div>

          {/* 교과 */}
          <div>
            <Label>연계 교과</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {subjects.map((subject) => (
                <Button
                  key={subject}
                  variant={
                    formData.subjects.includes(subject) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleSubject(subject)}
                >
                  {subject}
                </Button>
              ))}
            </div>
          </div>

          {/* 운영 학기 */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label className="cursor-help inline-block">운영 학기</Label>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-md sm:max-w-lg md:max-w-2xl p-4 bg-white border-2 border-sky-200 shadow-lg"
              >
                <div className="space-y-2">
                  <h3 className="font-bold text-sky-700 text-sm sm:text-base">⚠️ 학기 단위 운영 원칙 (분산 운영 불가)</h3>
                  <ul className="text-xs sm:text-sm text-gray-700 leading-relaxed space-y-1.5 list-disc list-inside">
                    <li>
                      <strong className="text-red-600">학교자율시간은 학기 단위 운영을 원칙</strong>으로 하므로 학기 내 1주의 수업 시간을 확보하여 운영해야 함
                    </li>
                    <li>
                      운영 시수(예: 29시간)는 <strong className="text-red-600">1개 학기에 편성하여 운영</strong>해야 함
                    </li>
                    <li>
                      <strong className="text-red-600">1학기와 2학기로 분산 운영 불가</strong>
                    </li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
            <div className="flex gap-4 mt-2">
              {["1학기", "2학기"].map((sem) => (
                <Button
                  key={sem}
                  variant={formData.semester.includes(sem) ? "default" : "outline"}
                  onClick={() => toggleSemester(sem)}
                >
                  {sem}
                </Button>
              ))}
            </div>
          </div>

          {/* 총 차시 */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label className="cursor-help inline-block">총 차시</Label>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-md sm:max-w-lg md:max-w-2xl p-4 bg-white border-2 border-sky-200 shadow-lg"
              >
                <div className="space-y-2">
                  <h3 className="font-bold text-sky-700 text-sm sm:text-base">📋 학교자율시간 시수 확보 기준</h3>
                  <ul className="text-xs sm:text-sm text-gray-700 leading-relaxed space-y-1.5 list-disc list-inside">
                    <li>
                      <strong className="text-sky-600">연간 34주 기준</strong>으로 교과별 및 창의적 체험활동 수업 시간 수의 학기별 1주의 수업 시간을 확보하여 학기 단위로 운영
                    </li>
                    <li>
                      실제 교육과정을 운영하는 시간을 기준으로 각 학년에서 편성한 <strong className="text-sky-600">'총 수업 시간 수'</strong>에 따라 편성
                    </li>
                    <li>
                      운영 시수의 순증도 가능하며, 시수 확보 과정에서 <strong className="text-sky-600">특정 과목이나 영역의 시수가 지나치게 줄지 않도록 유의</strong>
                    </li>
                    <li>
                      학교의 여건과 교과 특성을 고려하여 시수 감축 운영이 가능한 교과(군) 및 창의적 체험활동에서 확보
                    </li>
                    <li>
                      교육과정 편성 운영 기준에 따라 <strong className="text-sky-600">교과(군)별 및 창의적 체험활동의 20% 범위 내</strong> 시수 증감 기준 준수
                    </li>
                    <li>
                      교과(군)에서 일부 시수를 감축하여 학교자율시간으로 편성할 때 감축된 수업 시수로 <strong className="text-sky-600">해당 교과의 교육과정 성취기준을 모두 이수하는 것이 가능한지 점검</strong>
                    </li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
            <Input
              type="number"
              value={formData.total_hours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  total_hours: parseInt(e.target.value) || 0,
                })
              }
              min={1}
              max={68}
              className="mt-2"
            />
          </div>

          {/* 활동명 */}
          <div>
            <Label>활동명</Label>
            <Input
              value={formData.activity_name}
              onChange={(e) =>
                setFormData({ ...formData, activity_name: e.target.value })
              }
              placeholder="예: 인공지능 놀이터"
              className="mt-2"
            />
          </div>

          {/* 요구사항 */}
          <div>
            <Label>요구사항</Label>
            <Textarea
              value={formData.requirements}
              onChange={(e) =>
                setFormData({ ...formData, requirements: e.target.value })
              }
              placeholder="예) 디지털 리터러시 강화 필요&#10;예) 학생들의 주도적 학습활동 및 안전교육 병행"
              rows={4}
              className="mt-2"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={
              !formData.activity_name ||
              !formData.requirements ||
              formData.grades.length === 0 ||
              formData.subjects.length === 0 ||
              formData.semester.length === 0 ||
              isGenerating
            }
            className="w-full"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            정보 생성 및 다음 단계로
          </Button>
        </CardContent>
      </Card>
      </TooltipProvider>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>생성된 내용 확인 및 수정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>활동의 필요성</Label>
          <Textarea
            value={formData.necessity || ""}
            onChange={(e) =>
              setFormData({ ...formData, necessity: e.target.value })
            }
            rows={6}
            className="mt-2"
          />
        </div>

        <div>
          <Label>활동 개요</Label>
          <Textarea
            value={formData.overview || ""}
            onChange={(e) =>
              setFormData({ ...formData, overview: e.target.value })
            }
            rows={6}
            className="mt-2"
          />
        </div>

        <Button onClick={handleNext} className="w-full">
          수정사항 저장 및 다음 단계로
        </Button>
      </CardContent>
    </Card>
  );
}
