"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StepProps } from "@/types";
import { Download, RefreshCw, Edit2, Save } from "lucide-react";

export function Step7Review({ data, onUpdate }: StepProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [selectedSheets, setSelectedSheets] = useState({
    basic: true,
    content: true,
    standards: true,
    teaching: true,
    lessons: true,
  });

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editData);
    }
    setIsEditing(false);
  };

  const handleDownload = async (type: string) => {
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data: editData, selectedSheets }),
      });

      if (!response.ok) throw new Error("다운로드 실패");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${editData.activity_name || "학교자율시간계획서"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("다운로드 중 오류가 발생했습니다.");
    }
  };

  const handleReset = () => {
    if (confirm("모든 데이터가 초기화됩니다. 계속하시겠습니까?")) {
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>7단계: 최종 계획서 검토</CardTitle>
        <div className="flex gap-2">
          {isEditing ? (
            <Button onClick={handleSave} size="sm">
              <Save className="mr-2 h-4 w-4" />
              저장
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
              <Edit2 className="mr-2 h-4 w-4" />
              수정
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">기본정보</TabsTrigger>
            <TabsTrigger value="content">내용체계</TabsTrigger>
            <TabsTrigger value="standards">성취기준</TabsTrigger>
            <TabsTrigger value="teaching">교수학습</TabsTrigger>
            <TabsTrigger value="lessons">차시별계획</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label>활동명</Label>
                  <Input
                    value={editData.activity_name || ""}
                    onChange={(e) => setEditData({ ...editData, activity_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>요구사항</Label>
                  <Textarea
                    value={editData.requirements || ""}
                    onChange={(e) => setEditData({ ...editData, requirements: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>필요성</Label>
                  <Textarea
                    value={editData.necessity || ""}
                    onChange={(e) => setEditData({ ...editData, necessity: e.target.value })}
                    rows={5}
                  />
                </div>
                <div>
                  <Label>개요</Label>
                  <Textarea
                    value={editData.overview || ""}
                    onChange={(e) => setEditData({ ...editData, overview: e.target.value })}
                    rows={5}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>학교급:</strong> {editData.school_type}</p>
                <p><strong>대상 학년:</strong> {editData.grades?.join(", ")}</p>
                <p><strong>연계 교과:</strong> {editData.subjects?.join(", ")}</p>
                <p><strong>총 차시:</strong> {editData.total_hours}차시</p>
                <p><strong>운영 학기:</strong> {editData.semester?.join(", ")}</p>
                <p><strong>활동명:</strong> {editData.activity_name}</p>
                <p><strong>요구사항:</strong> {editData.requirements}</p>
                <p><strong>필요성:</strong> {editData.necessity}</p>
                <p><strong>개요:</strong> {editData.overview}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {editData.content_sets?.map((set, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">내용체계 세트 {idx + 1}</h4>
                {isEditing ? (
                  <>
                    <div>
                      <Label>영역명</Label>
                      <Input
                        value={set.domain}
                        onChange={(e) => {
                          const newSets = [...editData.content_sets];
                          newSets[idx].domain = e.target.value;
                          setEditData({ ...editData, content_sets: newSets });
                        }}
                      />
                    </div>
                    <div>
                      <Label>핵심 아이디어 (줄바꿈으로 구분)</Label>
                      <Textarea
                        value={set.key_ideas.join("\n")}
                        onChange={(e) => {
                          const newSets = [...editData.content_sets];
                          newSets[idx].key_ideas = e.target.value.split("\n");
                          setEditData({ ...editData, content_sets: newSets });
                        }}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p><strong>영역명:</strong> {set.domain}</p>
                    <p><strong>핵심 아이디어:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      {set.key_ideas.map((idea, i) => (
                        <li key={i}>{idea}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="standards" className="space-y-4">
            {editData.standards?.map((std, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg space-y-2">
                {isEditing ? (
                  <>
                    <div>
                      <Label>성취기준 ({std.code})</Label>
                      <Textarea
                        value={std.description}
                        onChange={(e) => {
                          const newStds = [...editData.standards];
                          newStds[idx].description = e.target.value;
                          setEditData({ ...editData, standards: newStds });
                        }}
                        rows={2}
                      />
                    </div>
                    {std.levels.map((level, levelIdx) => (
                      <div key={level.level}>
                        <Label>{level.level === "A" ? "상" : level.level === "B" ? "중" : "하"}</Label>
                        <Textarea
                          value={level.description}
                          onChange={(e) => {
                            const newStds = [...editData.standards];
                            newStds[idx].levels[levelIdx].description = e.target.value;
                            setEditData({ ...editData, standards: newStds });
                          }}
                          rows={2}
                        />
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <p><strong>{std.code}:</strong> {std.description}</p>
                    {std.levels.map((level) => (
                      <p key={level.level}>
                        <strong>{level.level === "A" ? "상" : level.level === "B" ? "중" : "하"}:</strong> {level.description}
                      </p>
                    ))}
                  </>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="teaching" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">교수학습방법</h4>
              {isEditing ? (
                <Textarea
                  value={editData.teaching_methods_text || ""}
                  onChange={(e) => setEditData({ ...editData, teaching_methods_text: e.target.value })}
                  rows={6}
                />
              ) : (
                <p className="whitespace-pre-wrap">{editData.teaching_methods_text}</p>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">평가계획</h4>
              {editData.assessment_plan?.map((plan, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>{plan.code}:</strong> {plan.description}</p>
                  {isEditing ? (
                    <>
                      <div>
                        <Label>평가요소</Label>
                        <Input
                          value={plan.element}
                          onChange={(e) => {
                            const newPlan = [...editData.assessment_plan];
                            newPlan[idx].element = e.target.value;
                            setEditData({ ...editData, assessment_plan: newPlan });
                          }}
                        />
                      </div>
                      <div>
                        <Label>방법</Label>
                        <Textarea
                          value={plan.method}
                          onChange={(e) => {
                            const newPlan = [...editData.assessment_plan];
                            newPlan[idx].method = e.target.value;
                            setEditData({ ...editData, assessment_plan: newPlan });
                          }}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>상 기준</Label>
                        <Textarea
                          value={plan.criteria_high}
                          onChange={(e) => {
                            const newPlan = [...editData.assessment_plan];
                            newPlan[idx].criteria_high = e.target.value;
                            setEditData({ ...editData, assessment_plan: newPlan });
                          }}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>중 기준</Label>
                        <Textarea
                          value={plan.criteria_mid}
                          onChange={(e) => {
                            const newPlan = [...editData.assessment_plan];
                            newPlan[idx].criteria_mid = e.target.value;
                            setEditData({ ...editData, assessment_plan: newPlan });
                          }}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>하 기준</Label>
                        <Textarea
                          value={plan.criteria_low}
                          onChange={(e) => {
                            const newPlan = [...editData.assessment_plan];
                            newPlan[idx].criteria_low = e.target.value;
                            setEditData({ ...editData, assessment_plan: newPlan });
                          }}
                          rows={2}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p><strong>평가요소:</strong> {plan.element}</p>
                      <p><strong>방법:</strong> {plan.method}</p>
                      <p><strong>상:</strong> {plan.criteria_high}</p>
                      <p><strong>중:</strong> {plan.criteria_mid}</p>
                      <p><strong>하:</strong> {plan.criteria_low}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4">
            <div className="max-h-[500px] overflow-y-auto space-y-3">
              {editData.lesson_plans?.map((lesson, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                  {isEditing ? (
                    <>
                      <div className="mb-2">
                        <Label>{lesson.lesson_number}차시 - 학습주제</Label>
                        <Input
                          value={lesson.topic}
                          onChange={(e) => {
                            const newLessons = [...editData.lesson_plans];
                            newLessons[idx].topic = e.target.value;
                            setEditData({ ...editData, lesson_plans: newLessons });
                          }}
                        />
                      </div>
                      <div className="mb-2">
                        <Label>학습내용</Label>
                        <Textarea
                          value={lesson.content}
                          onChange={(e) => {
                            const newLessons = [...editData.lesson_plans];
                            newLessons[idx].content = e.target.value;
                            setEditData({ ...editData, lesson_plans: newLessons });
                          }}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>교수학습자료</Label>
                        <Input
                          value={lesson.materials}
                          onChange={(e) => {
                            const newLessons = [...editData.lesson_plans];
                            newLessons[idx].materials = e.target.value;
                            setEditData({ ...editData, lesson_plans: newLessons });
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">{lesson.lesson_number}차시: {lesson.topic}</p>
                      <p className="text-sm mt-1">{lesson.content}</p>
                      <p className="text-sm text-gray-600 mt-1">자료: {lesson.materials}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 다운로드 옵션 선택 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-3">다운로드할 시트 선택</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="basic"
                checked={selectedSheets.basic}
                onCheckedChange={(checked) =>
                  setSelectedSheets({ ...selectedSheets, basic: !!checked })
                }
              />
              <label htmlFor="basic" className="text-sm cursor-pointer">기본정보</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="content"
                checked={selectedSheets.content}
                onCheckedChange={(checked) =>
                  setSelectedSheets({ ...selectedSheets, content: !!checked })
                }
              />
              <label htmlFor="content" className="text-sm cursor-pointer">내용체계</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="standards"
                checked={selectedSheets.standards}
                onCheckedChange={(checked) =>
                  setSelectedSheets({ ...selectedSheets, standards: !!checked })
                }
              />
              <label htmlFor="standards" className="text-sm cursor-pointer">성취기준</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="teaching"
                checked={selectedSheets.teaching}
                onCheckedChange={(checked) =>
                  setSelectedSheets({ ...selectedSheets, teaching: !!checked })
                }
              />
              <label htmlFor="teaching" className="text-sm cursor-pointer">교수학습</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lessons"
                checked={selectedSheets.lessons}
                onCheckedChange={(checked) =>
                  setSelectedSheets({ ...selectedSheets, lessons: !!checked })
                }
              />
              <label htmlFor="lessons" className="text-sm cursor-pointer">차시별계획</label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button onClick={() => handleDownload("final")} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            선택한 시트 다운로드
          </Button>

          <Button onClick={handleReset} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            새로 만들기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
