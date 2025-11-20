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
  onUpdate: (data: Partial<ProjectData>) => void;
}
