# 학교자율시간 올인원 (Next.js)

AI 기반 학교자율시간 계획서 자동 생성 시스템

## 🚀 기술 스택

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Backend**: Supabase
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel

## 📦 설치 방법

### 1. 저장소 클론

```bash
cd /c/Users/User/schoolfree
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 필요한 값을 입력하세요:

```bash
cp .env.example .env.local
```

`.env.local` 파일:
```env
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Supabase 데이터베이스 설정

Supabase 대시보드에서 SQL 에디터를 열고 `supabase/schema.sql` 파일의 내용을 실행하세요.

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 🌐 Vercel 배포 방법

### 1. Vercel 계정 생성 및 프로젝트 연결

1. [Vercel](https://vercel.com)에 가입/로그인
2. "New Project" 클릭
3. Git 저장소 연결 (GitHub, GitLab, Bitbucket)
4. 저장소 선택 후 "Import" 클릭

### 2. 환경변수 설정

Vercel 프로젝트 대시보드에서:
1. "Settings" → "Environment Variables" 이동
2. 다음 환경변수 추가:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. 배포

```bash
npm run build
```

빌드가 성공하면 Vercel이 자동으로 배포합니다.

## 🔑 API 키 발급 방법

### OpenAI API Key

1. [OpenAI Platform](https://platform.openai.com/)에 로그인
2. API Keys 메뉴로 이동
3. "Create new secret key" 클릭
4. 생성된 키를 복사하여 `.env.local`에 저장

### Supabase

1. [Supabase](https://supabase.com/)에 가입/로그인
2. "New Project" 클릭하여 프로젝트 생성
3. Settings → API에서 다음 값 확인:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` → `SUPABASE_SERVICE_ROLE_KEY`
4. SQL Editor에서 `supabase/schema.sql` 실행

## 📁 프로젝트 구조

```
schoolfree-nextjs/
├── app/
│   ├── api/
│   │   ├── generate/        # AI 생성 API
│   │   └── download/        # Excel 다운로드 API
│   ├── page.tsx             # 메인 페이지
│   ├── layout.tsx           # 레이아웃
│   └── globals.css          # 글로벌 스타일
├── components/
│   ├── ui/                  # shadcn/ui 컴포넌트
│   ├── ProgressSteps.tsx    # 진행단계 표시
│   ├── Step1BasicInfo.tsx   # 1단계: 기본정보
│   ├── Step2ApprovalDownload.tsx  # 2단계: 승인신청서
│   ├── Step3ContentSystem.tsx     # 3단계: 내용체계
│   ├── Step4Standards.tsx         # 4단계: 성취기준
│   ├── Step5Teaching.tsx          # 5단계: 교수학습
│   ├── Step6LessonPlans.tsx       # 6단계: 차시별계획
│   └── Step7Review.tsx            # 7단계: 최종검토
├── lib/
│   ├── utils.ts             # 유틸리티 함수
│   ├── supabase.ts          # Supabase 클라이언트
│   ├── openai.ts            # OpenAI 통합
│   └── store.ts             # Zustand 상태관리
├── types/
│   └── index.ts             # TypeScript 타입 정의
├── supabase/
│   └── schema.sql           # 데이터베이스 스키마
└── package.json
```

## ✨ 주요 기능

- ✅ 7단계 프로세스로 학교자율시간 계획서 작성
- ✅ AI 기반 자동 콘텐츠 생성 (GPT-4)
- ✅ 실시간 수정 및 편집
- ✅ Excel 파일 다운로드
- ✅ Supabase 데이터 저장
- ✅ 반응형 디자인 (shadcn/ui)
- ✅ 타입 안정성 (TypeScript)

## 🛠️ 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 검사
npm run lint
```

## 📝 사용 방법

1. **1단계**: 학교급, 학년, 교과, 활동명 등 기본 정보 입력
2. **2단계**: 승인 신청서 Excel 파일 다운로드
3. **3단계**: AI가 생성한 내용체계 확인 및 수정
4. **4단계**: 성취기준 확인 및 수정
5. **5단계**: 교수학습방법 및 평가계획 확인 및 수정
6. **6단계**: 차시별 지도계획 확인 및 수정
7. **7단계**: 최종 검토 및 전체 계획서 Excel 다운로드

## 👤 제작자

**경상북도교육청 인공지능연구소(GAI LAB) 교사 서혁수**

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
