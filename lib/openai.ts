import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `한국의 초등학교 2022 개정 교육과정 전문가입니다.
학교자율시간 계획서를 다음 원칙에 따라 작성합니다:

1. 지도계획에 모든 차시에 학습내용과 학습 주제가 빈틈없이 내용이 꼭 들어가야 합니다.
2. 학습자 중심의 교육과정 초등학교 3,4학년 수준에 맞는 쉽게 내용을 만들어 주세요.
3. 실생활 연계 및 체험 중심 활동
4. 교과 간 연계 및 통합적 접근
5. 초등학교 3학년, 4학년 수준에 맞아야 한다.
6. 요구사항을 반영한 맞춤형 교육과정 구성
7. 교수학습 방법의 다양화
8. 객관적이고 공정한 평가계획 수립
9. 초등학교 수준에 맞는 내용 구성`;

export async function generateContent(step: number, data: any): Promise<any> {
  try {
    const prompt = buildPrompt(step, data);
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${prompt}\n\n추가 문장 없이 JSON만 반환`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    const rawText = (response.text || '')
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    if (!rawText) {
      throw new Error('Empty response from Gemini');
    }

    return JSON.parse(rawText);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

function makeCodePrefix(grades: string[], subjects: string[], activityName: string): string {
  let gradePart = "";
  if (grades && grades.length > 0) {
    gradePart = grades[0].replace("학년", "").replace("학년군", "").trim();
  }

  let subjectPart = "";
  if (subjects && subjects.length > 0 && subjects[0]) {
    subjectPart = subjects[0][0];
  }

  let actPart = "";
  if (activityName && activityName.length > 0) {
    actPart = activityName.slice(0, 2);
  }

  return `${gradePart}${subjectPart}${actPart}`;
}

function buildPrompt(step: number, data: any): string {
  switch (step) {
    case 1:
      return buildStep1Prompt(data);
    case 3:
      return buildStep3Prompt(data);
    case 4:
      return buildStep4Prompt(data);
    case 5:
      return buildStep5Prompt(data);
    case 6:
      return buildStep6Prompt(data);
    default:
      return '';
  }
}

function buildStep1Prompt(data: any): string {
  const grades = data.grades?.join(', ') || '';
  const subjects = data.subjects?.join(', ') || '';
  const semester = data.semester?.join(', ') || '';

  return `학교자율시간 활동의 기본 정보를 작성해주세요.

활동명: ${data.activity_name}
요구사항: ${data.requirements}
학교급: ${data.school_type}
대상 학년: ${grades}
연계 교과: ${subjects}
총 차시: ${data.total_hours}차시
운영 학기: ${semester}

아래 예시와 같이, 주어진 **활동명**에 종속되어 결과물이 도출되도록
'필요성(necessity)', '개요(overview)'만 작성해 주세요.

지침
1. 필요성은 예시의 2~3배 분량으로 작성해주세요.
2. 개요는 괄호( )로 목적·목표·주요 내용을 구분해 주세요

[예시]
필요성:
 - 불확실한 미래사회를 살아갈 학생들에게 필수적 요소인 디지털 기기의 바른 이해와 사용법에 대한 학습이 필요
 - 디지털 기기 활용뿐 아니라 디지털 윤리에 관한 학습을 통해 디지털 리터러시와 책임감 있는 디지털 시민으로서의 역량 함양 필요

개요:
 <목적>
 - 디지털 기기 사용 경험을 바탕으로, 디지털 기술의 원리와 활용, 윤리적 문제점을 탐구하며 안전하고 책임감 있는 디지털 시민으로 성장
 <목표>
 - 디지털 기기의 작동 원리와 활용 방법을 이해한다.
 - 디지털 기기를 안전하고 책임감 있게 사용하는 방법을 익힌다.
 <주요 내용>
 - 디지털 기기 작동 원리 및 간단한 프로그래밍
 - 디지털 기기를 활용한 다양한 창작 활동
 - 디지털 윤리에 대한 이해와 실천

다음 JSON 형식으로 작성 (성격은 제외):
{
  "necessity": "작성된 필요성 내용",
  "overview": "작성된 개요 내용"
}`;
}

function buildStep3Prompt(data: any): string {
  const grades = data.grades?.join(', ') || '';
  const subjects = data.subjects?.join(', ') || '';

  return `활동명: ${data.activity_name} 부합되도록 작성해주세요.
요구사항: ${data.requirements}을 가장 많이 반영해서 작성하면 좋겠어.
학교급: ${data.school_type}도 반영해야 한다.
대상 학년: ${grades}을 고려해서 작성해야 한다.
연계 교과: ${subjects}

이전 단계 결과를 참고하여 작성하기
핵심 아이디어는 IB교육에서 이야기 하는 빅아이디어와 같은 거야. 학생들이 도달 할 수 있는 일반화된 이론이야 예시처럼 문장으로 진술해주세요.
'영역명(domain)', '핵심 아이디어(key_ideas)', '내용 요소(content_elements)'(지식·이해 / 과정·기능 / 가치·태도) 4개 세트를 생성... 를 JSON 구조로 작성해주세요.
'content_elements'에는 **'knowledge_and_understanding'(지식·이해), 'process_and_skills'(과정·기능), 'values_and_attitudes'(가치·태도)**가 반드시 포함되어야 합니다.
예시를 참고하여 작성해주세요.
영역명도 창의적으로 다르게 구성하여 주세요

<예시>
영역명
 기후위기와 기후행동

핵심 아이디어
 - 인간은 여러 활동을 통해 기후변화를 초래하였고, 기후변화는 우리의 삶에 다방면으로 영향을 미친다.
 - 우리는 직면한 기후변화 문제를 완화하거나 적응함으로써 대처하며 생활 속에서 자신이 실천할 수 있는 방법을 탐색하고 행동해야 한다.

내용 요소
 -지식·이해
  • 기후변화와 우리 삶의 관계
  • 기후변화와 식생활
 -과정·기능
  • 의사소통 및 갈등해결
  • 창의적 문제해결
 -가치·태도
  • 환경 공동체의식
  • 환경 실천

JSON 형식으로만 작성하고, 불필요한 문장은 쓰지 마세요. 추가 문장 없이 JSON만 반환
총 4개의 객체가 있는 JSON 배열

JSON 예시:
[
  {
    "domain": "...",
    "key_ideas": [...],
    "content_elements": {
      "knowledge_and_understanding": [...],
      "process_and_skills": [...],
      "values_and_attitudes": [...]
    }
  },
  ...
]`;
}

function buildStep4Prompt(data: any): string {
  const contentSets = data.content_sets || [];
  const numSets = contentSets.length || 4;
  const grades = data.grades || [];
  const subjects = data.subjects || [];
  const activityName = data.activity_name || '';
  const codePrefix = makeCodePrefix(grades, subjects, activityName);

  const gradesStr = data.grades?.join(', ') || '';
  const subjectsStr = data.subjects?.join(', ') || '';

  return `이전 단계
활동명: ${data.activity_name}
요구사항: ${data.requirements}
학교급: ${data.school_type}
대상 학년: ${gradesStr}
연계 교과: ${subjectsStr}
내용 체계: ${JSON.stringify(contentSets)}

총 ${numSets}개 내용체계 세트가 생성되었으므로, 성취기준도 ${numSets}개 생성.

아래는 학년/교과/활동명에서 추출한 코드 접두사입니다:
code_prefix: "${codePrefix}"

지침:
1. 성취기준코드는 반드시 code_prefix에 -01, -02, ... 식으로 순서 붙여 생성.
2. 성취기준은 내용체계표와 내용이 비슷하고 문장의 형식은 아래 예시를 참고:
   [4사세계시민-01] 글을 읽고 지구촌의 여러 문제를 이해하고 생각한다.
3. 성취기준 levels는 A/B/C (상/중/하) 세 단계 작성.

JSON 예시:
[
  {
    "code": "${codePrefix}-01",
    "description": "성취기준 설명",
    "levels": [
      { "level": "A", "description": "상 수준 설명" },
      { "level": "B", "description": "중 수준 설명" },
      { "level": "C", "description": "하 수준 설명" }
    ]
  },
  ...
]`;
}

function buildStep5Prompt(data: any): string {
  const standards = data.standards || [];

  return `이전 단계(성취기준): ${JSON.stringify(standards)}

1.평가요소, 수업평가방법, 평가기준은 예시문을 참고해서 작성해주세요
2.평가기준은 상,중,하로 나누어서 작성하여 주세요.
3.평가요소는 ~하기 형식으로 만들어 주세요.
4.다시 강조하지만 예시문 아래 예시문 형식으로 작성하여 주세요

<예시>
평가요소
 - 국가유산의 의미와 유형 알아보고 가치 탐색하기
수업평가방법
 [개념학습/프로젝트]
 - 국가유산의 의미를 이해하게 한 후 기준을 세워 국가유산을 유형별로 알아보고 문화유산의 가치를 파악하는지 평가하기
평가기준
 - 상:국가유산의 의미와 유형을 정확하게 이해하고 지역의 국가유산 조사를 통해 국가유산의 가치를 설명할 수 있다.
 - 중:국가유산의 의미와 유형을 이해하고 지역의 국가유산 조사를 통해 국가유산의 가치를 설명할 수 있다.
 - 하:주변의 도움을 받아 국가유산의 의미와 유형을 설명할 수 있다.

"teaching_methods_text"교수학습도 예시문을 참고해서 작성하여 주세요
<예시>
- 인간 활동으로 발생한 환경 영향의 긍정적인 사례와 부정적인 사례를 균형적으로 탐구하여 인간과 환경에 대한 다양한 측면을 이해하도록 한다.
- 다양한 사례를 통하여 환경오염의 현상을 이해하도록 지도하고 지속가능한 발전으로 이어질 수 있도록 내면화에 노력한다.
- 학교나 지역의 다양한 체험활동 장소와 주제에 따른 계절을 고려하여 학습계획을 세워 학습을 진행한다.
- 탐구 및 활동 시에는 사전 준비와 안전교육 등을 통하여 탐구과정에서 발생할 수 있는 안전사고를 예방하도록 한다.

"teaching_methods_text": 문자열 (여러 줄 가능),
"assessment_plan": 리스트
아래 예시 형식으로 JSON을 작성해주세요.
- 평가기준은 '상', '중', '하' 각각을 별도 필드로 기재 (criteria_high, criteria_mid, criteria_low)

JSON 예시:
{
  "teaching_methods_text": "교수학습방법 여러 줄...",
  "assessment_plan": [
    {
      "code": "성취기준코드(예: code_prefix-01)",
      "description": "성취기준문장",
      "element": "평가요소",
      "method": "수업평가방법",
      "criteria_high": "상 수준 평가기준",
      "criteria_mid": "중 수준 평가기준",
      "criteria_low": "하 수준 평가기준"
    },
    ...
  ]
}`;
}

function buildStep6Prompt(data: any): string {
  const totalHours = data.total_hours || 30;
  const gradesStr = data.grades?.join(', ') || '';
  const domain = data.domain || '';
  const keyIdeas = data.key_ideas || [];
  const contentElements = data.content_elements || {};
  const standards = data.standards || [];
  const teachingMethods = data.teaching_methods || [];
  const assessmentPlan = data.assessment_plan || [];

  return `아래 정보를 참고하여 **1차시부터 ${totalHours}차시까지** 한 번에 모두 연결된 지도계획을 JSON으로 작성해주세요.

[이전 단계 결과]
대상 학년 ${gradesStr}에 맞는 수준으로 작성해야 한다.
- 영역명: ${domain}
- 핵심 아이디어: ${JSON.stringify(keyIdeas)}
- 내용체계: ${JSON.stringify(contentElements)}
- 성취기준: ${JSON.stringify(standards)}
- 교수학습 방법: ${JSON.stringify(teachingMethods)}
- 평가계획: ${JSON.stringify(assessmentPlan)}
- 활동명: ${data.activity_name}
- 요구사항: ${data.requirements}

각 차시는 다음 사항을 고려하여 작성:
1. 대상 학년: ${gradesStr}에 알맞은 수업계획 작성하기
2. 명확한 학습주제 재미있고 문학적 표현으로 학습주제 설정
3. 구체적이고 학생활동 중심으로 진술하세요. ~~하기 형식으로 해주세요.
4. 실제 수업에 필요한 교수학습자료 명시
5. 이전 차시와의 연계성 고려
6. 초등학교 3학년 4학년 수준에 맞는 내용으로 작성하여 주세요.

(예시)
학습주제: 질문에도 양심이 있다.
학습내용: 질문을 할 때 지켜야 할 약속 만들기
         수업 중 질문, 일상 속 질문 속에서 갖추어야 할 예절 알기

다음 JSON 형식으로 작성:
{
  "lesson_plans": [
    {
      "lesson_number": "차시번호",
      "topic": "학습주제",
      "content": "학습내용",
      "materials": "교수학습자료"
    }
  ]
}`;
}
