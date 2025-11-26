const fs = require('fs');
const content = `import { GoogleGenerativeAI } from '@google/generative-ai';

function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

function getGeminiModel() {
  return getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });
}

const SYSTEM_PROMPT = \`한국의 초등학교 2022 개정 교육과정 전문가입니다.
학교자율시간 계획서를 다음 원칙에 따라 작성합니다:
1. 지도계획에 모든 차시에 학습내용과 학습 주제가 빈틈없이 내용이 꼭 들어가야 합니다.
2. 학습자 중심의 교육과정
3. 실생활 연계 및 체험 중심 활동
4. 교과 간 연계 및 통합적 접근
5. 요구사항을 반영한 맞춤형 교육과정 구성\`;

export async function generateContent(step: number, data: any): Promise<any> {
  try {
    const prompt = buildPrompt(step, data);
    const gemini = getGeminiModel();
    const fullPrompt = SYSTEM_PROMPT + '\n\n' + prompt + '\n\n추가 문장 없이 JSON만 반환';
    const result = await gemini.generateContent(fullPrompt);
    const rawText = result.response.text().replace(/\\`\\`\\`json/g, '').replace(/\\`\\`\\`/g, '').trim();
    if (!rawText) throw new Error('Empty response');
    return JSON.parse(rawText);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

function buildPrompt(step: number, data: any): string {
  switch (step) {
    case 1: return buildStep1Prompt(data);
    case 3: return buildStep3Prompt(data);
    case 4: return buildStep4Prompt(data);
    case 5: return buildStep5Prompt(data);
    case 6: return buildStep6Prompt(data);
    default: return '';
  }
}

function buildStep1Prompt(data: any): string {
  return \`학교자율시간 활동의 기본 정보를 작성해주세요.
활동명: \${data.activity_name}
요구사항: \${data.requirements}
학교급: \${data.school_type}
대상 학년: \${data.grades?.join(', ')}
연계 교과: \${data.subjects?.join(', ')}
총 차시: \${data.total_hours}차시

다음 JSON 형식으로 작성:
{ "necessity": "필요성 내용", "overview": "개요 내용" }\`;
}

function buildStep3Prompt(data: any): string {
  return \`활동명: \${data.activity_name}
요구사항: \${data.requirements}
학교급: \${data.school_type}
대상 학년: \${data.grades?.join(', ')}
연계 교과: \${data.subjects?.join(', ')}

4개의 내용체계 세트를 JSON 배열로 작성:
[{ "domain": "영역명", "key_ideas": [], "content_elements": { "knowledge_and_understanding": [], "process_and_skills": [], "values_and_attitudes": [] } }]\`;
}

function buildStep4Prompt(data: any): string {
  const contentSets = data.content_sets || [];
  const numSets = contentSets.length;
  const grades = data.grades || [];
  const subjects = data.subjects || [];
  const activityName = data.activity_name || '';
  let gradePart = grades.length > 0 ? grades[0].replace('학년', '').trim() : '';
  let subjectPart = subjects.length > 0 && subjects[0] ? subjects[0][0] : '';
  let actPart = activityName.length > 0 ? activityName.slice(0, 2) : '';
  const codePrefix = gradePart + subjectPart + actPart;
  return \`활동명: \${data.activity_name}
내용 체계: \${JSON.stringify(contentSets)}
\${numSets}개의 성취기준 생성. 코드 접두사: "\${codePrefix}"
[{ "code": "\${codePrefix}-01", "description": "성취기준", "levels": [{ "level": "A", "description": "상" }, { "level": "B", "description": "중" }, { "level": "C", "description": "하" }] }]\`;
}

function buildStep5Prompt(data: any): string {
  return \`성취기준: \${JSON.stringify(data.standards)}
교수학습 방법과 평가계획 작성:
{ "teaching_methods_text": "교수학습방법", "assessment_plan": [{ "code": "코드", "description": "설명", "element": "평가요소", "method": "방법", "criteria_high": "상", "criteria_mid": "중", "criteria_low": "하" }] }\`;
}

function buildStep6Prompt(data: any): string {
  const totalHours = data.total_hours || 30;
  return \`\${totalHours}차시 지도계획 작성.
활동명: \${data.activity_name}
요구사항: \${data.requirements}
대상 학년: \${data.grades?.join(', ')}
{ "lesson_plans": [{ "lesson_number": "1", "topic": "주제", "content": "내용", "materials": "자료" }] }\`;
}
`;
fs.writeFileSync('./lib/openai.ts', content);
console.log('File written');
