"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StepProps } from "@/types";
import { Download } from "lucide-react";

export function Step2ApprovalDownload({ data, onNext }: StepProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "approval", data }),
      });

      if (!response.ok) throw new Error("다운로드 실패");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.activity_name || "자율시간승인신청서"}.xlsx`;
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
        <CardTitle>2단계: 자율시간 승인 신청서 다운로드</CardTitle>
        <CardDescription>
          입력한 기본 정보를 바탕으로 승인 신청서 엑셀 파일을 생성합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">포함된 정보:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>학교급: {data.school_type}</li>
            <li>대상 학년: {data.grades?.join(", ")}</li>
            <li>연계 교과: {data.subjects?.join(", ")}</li>
            <li>총 차시: {data.total_hours}차시</li>
            <li>운영 학기: {data.semester?.join(", ")}</li>
            <li>활동명: {data.activity_name}</li>
          </ul>
        </div>

        <Button onClick={handleDownload} className="w-full" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          승인 신청서 다운로드
        </Button>

        <Button onClick={onNext} className="w-full">
          다음 단계로
        </Button>
      </CardContent>
    </Card>
  );
}
