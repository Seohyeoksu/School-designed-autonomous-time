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
import { StepProps, SchoolContext } from "@/types";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { QnaSection } from "@/components/ui/qna-tooltip";

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

const REGION_TYPES = ['도시', '농촌', '어촌'] as const;

export function Step1BasicInfo({ data, onNext, onUpdate }: StepProps) {
  const [formData, setFormData] = useState(data);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [showSchoolContext, setShowSchoolContext] = useState(
    !!(data.school_context?.student_count || data.school_context?.region_type || data.school_context?.class_size)
  );

  const updateSchoolContext = (field: keyof SchoolContext, value: any) => {
    setFormData({
      ...formData,
      school_context: {
        ...formData.school_context,
        [field]: value,
      },
    });
  };

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
            <Label>운영 학기</Label>
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
            <Label>총 차시</Label>
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

          {/* 학교 환경 정보 (선택사항) */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="showSchoolContext"
                checked={showSchoolContext}
                onCheckedChange={(checked) => {
                  setShowSchoolContext(!!checked);
                  if (!checked) {
                    setFormData({
                      ...formData,
                      school_context: {
                        student_count: undefined,
                        region_type: '',
                        class_size: undefined,
                      },
                    });
                  }
                }}
              />
              <Label htmlFor="showSchoolContext" className="cursor-pointer font-medium">
                학교 환경 정보 입력 (선택사항)
              </Label>
            </div>

            {showSchoolContext && (
              <div className="space-y-4 pl-6">
                {/* 학교 규모 (학생수) */}
                <div>
                  <Label className="text-sm">학교 규모 (전체 학생수)</Label>
                  <Input
                    type="number"
                    value={formData.school_context?.student_count || ''}
                    onChange={(e) =>
                      updateSchoolContext('student_count', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="예: 300"
                    min={1}
                    className="mt-1"
                  />
                </div>

                {/* 지역특성 */}
                <div>
                  <Label className="text-sm">지역특성</Label>
                  <div className="flex gap-2 mt-1">
                    {REGION_TYPES.map((region) => (
                      <Button
                        key={region}
                        type="button"
                        variant={formData.school_context?.region_type === region ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSchoolContext('region_type', region)}
                      >
                        {region}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 학급당 학생수 */}
                <div>
                  <Label className="text-sm">학급당 학생수</Label>
                  <Input
                    type="number"
                    value={formData.school_context?.class_size || ''}
                    onChange={(e) =>
                      updateSchoolContext('class_size', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="예: 25"
                    min={1}
                    max={50}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Q&A 섹션 */}
          <QnaSection
            quizzes={[
              {
                question: "학교자율시간이란 무엇인가요?",
                answer: "지역과 학교의 여건 및 학생의 필요에 따라 교과 및 창의적 체험활동의 일부 시수를 확보하여 국가 교육과정에 제시되어 있는 교과 외 새로운 활동이나 과목을 개설·운영하는 시간입니다."
              },
              {
                question: "학교자율시간 '활동'과 '과목'의 차이점은 무엇인가요?",
                answer: "활동은 학교장 승인으로 개설되며 교수·학습자료만 필요합니다. 과목은 교육감 승인이 필요하고, 성격·목표·내용 체계·성취기준 등이 체계화되어야 하며, 인정도서 개발이 가능합니다."
              },
              {
                question: "초등학교 3~4학년의 학기별 학교자율시간 운영 시수는 몇 차시인가요?",
                answer: "초등학교 3~4학년은 학기별 29차시 이상, 5~6학년은 학기별 32차시 이상 운영합니다. 이는 연간 34주를 기준으로 학기별 1주의 수업 시간을 편성한 것입니다."
              }
            ]}
          />

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
