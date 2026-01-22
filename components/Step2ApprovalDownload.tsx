"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { StepTitle } from "@/components/ui/step-title";
import { SectionTitle } from "@/components/ui/section-title";
import { StepProps } from "@/types";
import { Download, ChevronLeft, FileSpreadsheet, FileText } from "lucide-react";

export function Step2ApprovalDownload({ data, onNext, onPrev }: StepProps) {
  const handleDownload = async (format: 'xlsx' | 'docx') => {
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "approval", data, format }),
      });

      if (!response.ok) throw new Error("다운로드 실패");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.activity_name || "자율시간승인신청서"}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("다운로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <StepTitle step={2} title="승인 신청서 다운로드" />
        <CardDescription className="mt-3 ml-16">
          입력한 기본 정보를 바탕으로 승인 신청서 엑셀 파일을 생성합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 p-4 rounded-xl">
          <SectionTitle title="포함된 정보" variant="accent" className="mb-3" />
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-1">
            <li>학교급: {data.school_type}</li>
            <li>대상 학년: {data.grades?.join(", ")}</li>
            <li>연계 교과: {data.subjects?.join(", ")}</li>
            <li>총 차시: {data.total_hours}차시</li>
            <li>운영 학기: {data.semester?.join(", ")}</li>
            <li>활동명: {data.activity_name}</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => handleDownload('xlsx')} variant="outline" className="w-full">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel 다운로드
          </Button>
          <Button onClick={() => handleDownload('docx')} variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Word 다운로드
          </Button>
        </div>

        <div className="flex gap-3">
          <Button onClick={onPrev} variant="outline" className="flex-1">
            <ChevronLeft className="mr-1 h-4 w-4" />
            이전 단계
          </Button>
          <Button onClick={onNext} className="flex-1">
            다음 단계로
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
