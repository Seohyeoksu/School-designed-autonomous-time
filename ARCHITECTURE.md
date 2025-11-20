# 학교자율시간 계획서 만들기 - 프로젝트 아키텍처

## 📐 프로젝트 개요

학교에서 지역과 학교의 여건 및 학생의 필요에 따라 교과 및 창의적 체험활동의 일부 시수를 확보하여 국가 교육과정에 제시되지 않은 새로운 과목을 자유롭게 개발·운영하는 **학교자율시간 계획서**를 7단계로 쉽고 빠르게 AI 기반으로 자동 생성하는 웹 애플리케이션입니다.

## 1️⃣ 기술 스택

```
- Framework: Next.js 14.1.0 (App Router)
- Language: TypeScript
- UI Library: React 18.2.0
- Styling: Tailwind CSS + Radix UI
- Animation: Framer Motion
- State Management: Zustand
- AI: OpenAI GPT-4o
- Database: Supabase (선택적)
- File Generation: ExcelJS
```

## 2️⃣ 디렉토리 구조

```
schoolfree/
├── app/                          # Next.js App Router
│   ├── api/                      # API 라우트
│   │   ├── generate/route.ts     # AI 콘텐츠 생성 API
│   │   └── download/route.ts     # 엑셀 다운로드 API
│   ├── globals.css               # 전역 스타일
│   ├── layout.tsx                # 루트 레이아웃
│   └── page.tsx                  # 메인 페이지 (홈)
│
├── components/                   # React 컴포넌트
│   ├── ui/                       # 재사용 가능한 UI 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── progress.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
│   ├── ProgressSteps.tsx         # 진행 상태 표시
│   ├── Step1BasicInfo.tsx        # 1단계: 기본 정보
│   ├── Step2ApprovalDownload.tsx # 2단계: 승인 신청서
│   ├── Step3ContentSystem.tsx    # 3단계: 내용 체계
│   ├── Step4Standards.tsx        # 4단계: 성취 기준
│   ├── Step5Teaching.tsx         # 5단계: 교수학습 및 평가
│   ├── Step6LessonPlans.tsx      # 6단계: 차시별 계획
│   └── Step7Review.tsx           # 7단계: 최종 검토
│
├── lib/                          # 유틸리티 및 핵심 로직
│   ├── openai.ts                 # OpenAI API 통합 + 프롬프트
│   ├── store.ts                  # Zustand 상태 관리
│   ├── supabase.ts               # Supabase 클라이언트
│   └── utils.ts                  # 공통 유틸리티 함수
│
├── types/                        # TypeScript 타입 정의
│   └── index.ts                  # 모든 인터페이스 정의
│
├── supabase/                     # 데이터베이스 스키마
│   └── schema.sql
│
└── config files                  # 설정 파일
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    └── .env.local
```

## 3️⃣ 데이터 흐름 (Data Flow)

```
┌─────────────┐
│   사용자    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│   app/page.tsx (메인 컨테이너)      │
│   - 현재 단계 관리                  │
│   - 7개 Step 컴포넌트 렌더링        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   lib/store.ts (Zustand)            │
│   - currentStep: number             │
│   - data: ProjectData               │
│   - setStep(), updateData()         │
└──────┬──────────────────────────────┘
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌─────────────┐    ┌──────────────┐   ┌──────────────┐
│  Step1-7    │    │  API Route   │   │  Step7       │
│  컴포넌트   │───▶│  /generate   │   │  Review      │
│             │    │              │   │  & Edit      │
└─────────────┘    └──────┬───────┘   └──────┬───────┘
                          │                  │
                          ▼                  ▼
                   ┌──────────────┐   ┌──────────────┐
                   │ lib/openai.ts│   │  API Route   │
                   │ - AI 프롬프트│   │  /download   │
                   │ - GPT-4o 호출│   │ - ExcelJS    │
                   └──────────────┘   └──────────────┘
```

## 4️⃣ 주요 컴포넌트 역할

### app/page.tsx
- 메인 컨테이너 역할
- 현재 단계(currentStep)에 따라 적절한 Step 컴포넌트 렌더링
- 애니메이션 및 레이아웃 제공
- TooltipProvider로 전체 앱 감싸기

### lib/store.ts (Zustand)
- 전역 상태 관리
- `currentStep`: 현재 진행 단계 (1-7)
- `data`: 모든 단계의 데이터 저장
- `setStep()`: 단계 변경
- `updateData()`: 데이터 업데이트
- `resetData()`: 데이터 초기화

### types/index.ts
TypeScript 타입 정의:
- `ProjectData`: 전체 프로젝트 데이터 구조
- `StepProps`: Step 컴포넌트 공통 Props
- `BasicInfo`: 기본 정보
- `ContentSet`: 내용 체계
- `Standard`: 성취 기준
- `AssessmentPlan`: 평가 계획
- `LessonPlan`: 차시별 계획

### lib/openai.ts
- OpenAI API 통합
- 각 단계별 프롬프트 빌더:
  - `buildStep1()`: 필요성 및 개요 생성
  - `buildStep3()`: 내용 체계 생성 (IB 교육 개념 활용)
  - `buildStep4()`: 성취 기준 생성
  - `buildStep5()`: 교수학습 및 평가 생성
  - `buildStep6()`: 차시별 계획 생성
- `generateContent()`: AI 콘텐츠 생성 함수
- GPT-4o 모델 사용

### Step 컴포넌트들

#### Step1BasicInfo.tsx
- 기본 정보 입력 폼
- 학교급, 대상 학년, 연계 교과, 총 차시, 운영 학기, 활동명, 요구사항 입력

#### Step2ApprovalDownload.tsx
- AI 기반 필요성 및 개요 생성
- 승인 신청서 엑셀 다운로드 기능

#### Step3ContentSystem.tsx
- AI 기반 내용 체계 생성
- 영역명, 핵심 아이디어, 내용 요소 (지식·이해, 과정·기능, 가치·태도)

#### Step4Standards.tsx
- AI 기반 성취 기준 생성
- 성취 기준 코드, 설명, 수준별 설명 (상/중/하)

#### Step5Teaching.tsx
- AI 기반 교수학습방법 생성
- AI 기반 평가 계획 생성 (평가요소, 방법, 기준)

#### Step6LessonPlans.tsx
- AI 기반 차시별 계획 생성
- 차시번호, 학습주제, 학습내용, 교수학습자료

#### Step7Review.tsx
- 모든 생성된 내용 검토
- 탭별 내용 표시 (기본정보, 내용체계, 성취기준, 교수학습, 차시별계획)
- 수정 모드 제공 (Edit/Save 버튼)
- 선택적 시트 다운로드 (체크박스)
- 최종 엑셀 파일 다운로드
- 데이터 초기화 기능

### API Routes

#### /api/generate (POST)
- OpenAI를 통한 AI 콘텐츠 생성
- 입력: `{ step: number, data: ProjectData }`
- 출력: 생성된 JSON 데이터

#### /api/download (POST)
- ExcelJS를 통한 엑셀 파일 생성
- 입력: `{ type: 'approval' | 'final', data: ProjectData, selectedSheets?: object }`
- 출력: .xlsx 파일 (Buffer)

## 5️⃣ 핵심 기능 흐름

### AI 콘텐츠 생성 흐름
```
1. Step 컴포넌트에서 "생성" 버튼 클릭
2. /api/generate POST 요청 (step, data 전달)
3. lib/openai.ts의 generateContent() 호출
4. buildStep{n}()으로 프롬프트 생성
5. OpenAI GPT-4o API 호출
6. JSON 응답 파싱 및 검증
7. Zustand store에 데이터 업데이트
8. UI 자동 갱신
```

### 엑셀 다운로드 흐름
```
1. Step7에서 시트 선택 (체크박스)
2. "다운로드" 버튼 클릭
3. /api/download POST 요청 (type, data, selectedSheets)
4. ExcelJS로 워크북 생성
5. 선택된 시트만 추가:
   - 기본정보
   - 내용체계
   - 성취기준
   - 교수학습및평가
   - 차시별계획
6. Buffer로 변환
7. 브라우저에 파일 다운로드
```

## 6️⃣ 상태 관리 패턴

### Zustand Store 구조
```typescript
{
  currentStep: 1-7,           // 현재 단계
  data: {
    // Step 1 - 기본 정보
    school_type: string,      // 학교급
    grades: string[],         // 대상 학년
    subjects: string[],       // 연계 교과
    activity_name: string,    // 활동명
    requirements: string,     // 요구사항
    total_hours: number,      // 총 차시
    semester: string[],       // 운영 학기

    // Step 2 - AI 생성
    necessity: string,        // 필요성
    overview: string,         // 개요

    // Step 3 - 내용 체계
    content_sets: ContentSet[],

    // Step 4 - 성취 기준
    standards: Standard[],

    // Step 5 - 교수학습 및 평가
    teaching_methods_text: string,
    assessment_plan: AssessmentPlan[],

    // Step 6 - 차시별 계획
    lesson_plans: LessonPlan[]
  }
}
```

### 데이터 타입 구조

```typescript
// 내용 체계
interface ContentSet {
  domain: string;                     // 영역명
  key_ideas: string[];                // 핵심 아이디어
  content_elements: {
    knowledge_and_understanding: string[];  // 지식·이해
    process_and_skills: string[];           // 과정·기능
    values_and_attitudes: string[];         // 가치·태도
  };
}

// 성취 기준
interface Standard {
  code: string;                       // 성취기준 코드
  description: string;                // 성취기준 설명
  levels: StandardLevel[];            // 수준별 설명
}

interface StandardLevel {
  level: 'A' | 'B' | 'C';            // 상/중/하
  description: string;                // 수준별 설명
}

// 평가 계획
interface AssessmentPlan {
  code: string;                       // 성취기준 코드
  description: string;                // 성취기준 설명
  element: string;                    // 평가요소
  method: string;                     // 평가방법
  criteria_high: string;              // 상 기준
  criteria_mid: string;               // 중 기준
  criteria_low: string;               // 하 기준
}

// 차시별 계획
interface LessonPlan {
  lesson_number: string;              // 차시번호 ("1", "2", ...)
  topic: string;                      // 학습주제
  content: string;                    // 학습내용
  materials: string;                  // 교수학습자료
}
```

## 7️⃣ UI/UX 패턴

### 디자인 시스템
- **Radix UI**: 접근성을 고려한 기본 UI 컴포넌트
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Framer Motion**: 부드러운 페이지 전환 및 애니메이션
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 대응

### 애니메이션
- 페이지 전환: Spring 애니메이션
- 카드 호버: Scale & Shadow 효과
- 진행 상태: Progress Bar

### 인터랙션
- Tooltip: 제목 hover 시 학교자율시간 정의 표시
- 탭: 최종 검토 시 탭으로 내용 구분
- 수정 모드: Edit/Save 버튼으로 토글
- 체크박스: 다운로드 시트 선택

## 8️⃣ AI 프롬프트 전략

### 프롬프트 설계 원칙
1. **명확한 지시**: JSON 형식, 필드명, 개수 등 명확히 지정
2. **예시 제공**: 각 단계별 구체적인 예시 포함
3. **교육 맥락**: IB 교육, 2022 개정 교육과정 등 교육학적 개념 활용
4. **일관성**: 모든 단계에서 일관된 톤앤매너 유지

### 단계별 프롬프트 특징

#### Step 1: 필요성 및 개요
- 학교급, 학년, 교과, 요구사항 기반
- 교육적 의미와 기대효과 중심

#### Step 3: 내용 체계
- IB 교육의 "큰 아이디어(Big Ideas)" 개념 활용
- 영역별 핵심 아이디어 도출
- 지식·이해, 과정·기능, 가치·태도로 구조화

#### Step 4: 성취 기준
- 고유 코드 체계 (학교급+일련번호)
- 수준별(상/중/하) 세밀한 설명
- Bloom의 분류학 활용

#### Step 5: 교수학습 및 평가
- 성취 기준 기반 평가 계획
- 구체적인 평가 방법 및 기준 제시
- 역량 기반 평가

#### Step 6: 차시별 계획
- 총 차시에 맞춰 자동 생성
- 8가지 세부 지침:
  1. 도입-전개-정리 구조
  2. 학습목표 명확화
  3. 학습자 중심 활동
  4. 협력학습 및 프로젝트 학습
  5. 실생활 연계
  6. 창의적 문제해결
  7. 성찰 및 피드백
  8. 디지털 리터러시

## 9️⃣ 확장 가능성

### 현재 구현된 기능
- 7단계 계획서 생성
- AI 기반 콘텐츠 자동 생성
- 수정 및 편집 기능
- 선택적 엑셀 다운로드

### 확장 가능한 부분
1. **Supabase 통합**
   - 사용자 인증
   - 계획서 저장 및 불러오기
   - 버전 관리

2. **추가 Step**
   - 새로운 단계 쉽게 추가 가능
   - Step 컴포넌트 작성 및 등록

3. **프롬프트 커스터마이징**
   - lib/openai.ts에서 프롬프트 수정
   - 학교별, 지역별 맞춤 프롬프트

4. **다국어 지원**
   - 현재 한국어
   - i18n 라이브러리 추가로 다국어 확장 가능

5. **협업 기능**
   - 여러 교사가 함께 작성
   - 실시간 동기화

6. **템플릿 라이브러리**
   - 우수 사례 공유
   - 템플릿 선택 후 수정

## 🔟 환경 설정

### 필수 환경 변수 (.env.local)
```bash
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url (선택적)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key (선택적)
```

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 1️⃣1️⃣ 아키텍처 특징 및 장점

### 관심사의 분리 (Separation of Concerns)
- UI 컴포넌트 (`components/`)
- 비즈니스 로직 (`lib/`)
- API 엔드포인트 (`app/api/`)
- 타입 정의 (`types/`)

### 모듈화 및 재사용성
- UI 컴포넌트 재사용 (`components/ui/`)
- Step 컴포넌트 독립적 구성
- 공통 타입 및 인터페이스

### 타입 안정성
- TypeScript로 모든 코드 작성
- 명확한 인터페이스 정의
- 컴파일 타임 에러 검출

### 성능 최적화
- Next.js App Router (서버 컴포넌트)
- 클라이언트 상태 관리 (Zustand)
- 필요한 부분만 클라이언트 렌더링

### 사용자 경험
- 반응형 디자인
- 부드러운 애니메이션
- 직관적인 7단계 프로세스
- 실시간 수정 및 검토

---

**제작**: 경상북도교육청 인공지능연구소(GAI LAB) · 교사 서혁수
