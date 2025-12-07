# 학교자율시간 계획서 만들기

AI 기반 학교자율시간 계획서 자동 생성 시스템 (2022 개정 교육과정)

## 기술 스택

| 계층 | 기술 |
|------|------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **State Management** | Zustand |
| **AI/ML** | Google Gemini 2.5 Flash, text-embedding-004 |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **File Generation** | ExcelJS |
| **Deployment** | Vercel |

## 주요 기능

- 7단계 프로세스로 학교자율시간 계획서 작성
- AI 기반 자동 콘텐츠 생성 (Gemini 2.5 Flash)
- RAG 기반 챗봇 (하이브리드 검색 + 리랭킹)
- 학교 환경 맞춤형 계획서 생성 (학교 규모, 지역특성 반영)
- Excel 파일 다운로드 (승인신청서, 최종계획서)
- 반응형 디자인 (모바일/태블릿/데스크톱)

## 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/Seohyeoksu/School-designed-autonomous-time.git
cd School-designed-autonomous-time
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경변수 설정

`.env.local` 파일을 생성하고 다음 값을 입력하세요:

```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Upstage (PDF OCR용, 선택사항)
UPSTAGE_API_KEY=your_upstage_api_key
```

### 4. Supabase 데이터베이스 설정

Supabase 대시보드에서 SQL 에디터를 열고 `supabase/schema.sql` 파일의 내용을 실행하세요.

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                 프론트엔드 (Next.js)                      │
│  ┌─────────────────┐    ┌──────────────────┐            │
│  │ Step Components │    │  Chat Interface  │            │
│  │   (Step 1-7)    │    │   (RAG 기반)     │            │
│  └────────┬────────┘    └────────┬─────────┘            │
│           └──────────┬───────────┘                      │
│                      ▼                                  │
│           ┌──────────────────┐                          │
│           │  Zustand Store   │                          │
│           └────────┬─────────┘                          │
└────────────────────┼────────────────────────────────────┘
                     ▼
       ┌─────────────────────────────────┐
       │      Next.js API Routes         │
       │  /api/generate  (콘텐츠 생성)    │
       │  /api/download  (Excel 생성)    │
       │  /api/chat      (RAG 쿼리)      │
       └──────┬───────────────┬──────────┘
              ▼               ▼
       ┌────────────┐  ┌──────────────┐
       │  Gemini    │  │  Supabase    │
       │  API       │  │  (pgvector)  │
       └────────────┘  └──────────────┘
```

## 프로젝트 구조

```
school-autonomy-integrated/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── chat/route.ts         # RAG 쿼리 처리
│   │   ├── generate/route.ts     # AI 콘텐츠 생성
│   │   └── download/route.ts     # Excel 생성
│   ├── page.tsx                  # 메인 페이지
│   └── layout.tsx                # 레이아웃
│
├── components/                   # React 컴포넌트
│   ├── Step1BasicInfo.tsx        # 1단계: 기본정보
│   ├── Step2ApprovalDownload.tsx # 2단계: 필요성/개요 + Excel
│   ├── Step3ContentSystem.tsx    # 3단계: 내용체계
│   ├── Step4Standards.tsx        # 4단계: 성취기준
│   ├── Step5Teaching.tsx         # 5단계: 교수학습/평가
│   ├── Step6LessonPlans.tsx      # 6단계: 차시별 계획
│   ├── Step7Review.tsx           # 7단계: 최종검토
│   ├── chat-interface.tsx        # RAG 챗봇
│   ├── ProgressSteps.tsx         # 진행단계 표시
│   └── ui/                       # shadcn/ui 컴포넌트
│
├── lib/                          # 핵심 로직
│   ├── openai.ts                 # Gemini 프롬프트 생성
│   ├── gemini.ts                 # Gemini 클라이언트
│   ├── embeddings.ts             # 벡터/키워드 검색
│   ├── rag.ts                    # RAG 파이프라인
│   ├── store.ts                  # Zustand 상태관리
│   └── supabase.ts               # DB 클라이언트
│
├── scripts/                      # 유틸리티 스크립트
│   ├── reindex-with-upstage.ts   # Upstage OCR 재인덱싱
│   └── check-documents.ts        # 문서 확인
│
├── types/index.ts                # TypeScript 타입 정의
└── supabase/schema.sql           # 데이터베이스 스키마
```

## 7단계 프로세스

| 단계 | 기능 | AI 활용 |
|:----:|------|:------:|
| 1 | 기본정보 입력 (학교급, 학년, 교과, 차시, 학교환경) | - |
| 2 | 필요성/개요 AI 생성 + 승인신청서 Excel 다운로드 | O |
| 3 | 내용체계 생성 (IB 빅아이디어 기반) | O |
| 4 | 성취기준 + 수준별 설명 (A/B/C) | O |
| 5 | 교수학습방법 + 평가계획 | O |
| 6 | 차시별 지도계획 (1~34차시) | O |
| 7 | 최종 검토 + 선택적 Excel 다운로드 | - |

## RAG 챗봇

학교자율시간 관련 질문에 답변하는 AI 챗봇:

- 하이브리드 검색 (벡터 검색 + 키워드 검색)
- Gemini 기반 리랭킹
- 질문 유형별 응답 (정보기반 / 창의적)
- 출처 표시 (페이지, 유사도)

## API 키 발급 방법

### Google Gemini API Key

1. [Google AI Studio](https://aistudio.google.com/)에 로그인
2. API Keys 메뉴에서 "Create API Key" 클릭
3. 생성된 키를 `.env.local`에 저장

### Supabase

1. [Supabase](https://supabase.com/)에 가입/로그인
2. "New Project" 클릭하여 프로젝트 생성
3. Settings > API에서 다음 값 확인:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` → `SUPABASE_SERVICE_ROLE_KEY`
4. SQL Editor에서 `supabase/schema.sql` 실행

### Upstage API (선택사항)

1. [Upstage Console](https://console.upstage.ai/)에 가입/로그인
2. API Keys에서 키 생성
3. PDF 문서 재인덱싱에 사용

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 검사
npm run lint

# 문서 재인덱싱 (Upstage OCR)
npx ts-node --project tsconfig.scripts.json scripts/reindex-with-upstage.ts
```

## Vercel 배포

### 1. Vercel 프로젝트 연결

1. [Vercel](https://vercel.com)에 가입/로그인
2. "New Project" 클릭
3. Git 저장소 연결 후 Import

### 2. 환경변수 설정

Vercel 프로젝트 Settings > Environment Variables에서:
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. 배포

Git push 시 자동 배포됩니다.

## 제작

**경상북도교육청 유초등교육과**

## 라이선스

MIT License
