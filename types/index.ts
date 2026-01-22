export interface SchoolContext {
  student_count?: number;        // 학교 규모 (학생수)
  region_type?: string[];        // 지역특성 (복수선택 가능: 도시, 농촌, 어촌)
  class_size?: number;           // 학급당 학생수
}

export interface BasicInfo {
  school_type: string;
  grades: string[];
  subjects: string[];
  activity_name: string;
  requirements: string;
  total_hours: number;
  weekly_hours?: number;
  semester: string[];
  necessity?: string;
  overview?: string;
  school_context?: SchoolContext;  // 선택적 학교 환경 정보
}

export interface ContentElement {
  knowledge_and_understanding: string[];
  process_and_skills: string[];
  values_and_attitudes: string[];
}

export interface ContentSet {
  domain: string;
  key_ideas: string[];
  content_elements: ContentElement;
}

export interface StandardLevel {
  level: 'A' | 'B' | 'C';
  description: string;
}

export interface Standard {
  code: string;
  description: string;
  levels: StandardLevel[];
}

export interface AssessmentPlan {
  code: string;
  description: string;
  element: string;
  method: string;
  criteria_high: string;
  criteria_mid: string;
  criteria_low: string;
}

export interface LessonPlan {
  lesson_number: string;
  topic: string;
  content: string;
  materials: string;
}

export interface ProjectData extends BasicInfo {
  content_sets?: ContentSet[];
  standards?: Standard[];
  teaching_methods_text?: string;
  assessment_plan?: AssessmentPlan[];
  lesson_plans?: LessonPlan[];
}

export interface StepProps {
  data: ProjectData;
  onNext: () => void;
  onPrev?: () => void;
  onUpdate: (data: Partial<ProjectData>) => void;
}
