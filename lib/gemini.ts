import { GoogleGenAI } from "@google/genai";

// Gemini 3 Pro Preview 클라이언트
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// System Instruction for chatbot persona
const SYSTEM_INSTRUCTION = `당신은 2022 개정 교육과정의 '학교자율시간' 전문 안내 도우미입니다.

## 역할
- 초등학교와 중학교 교사들이 학교자율시간을 이해하고 운영할 수 있도록 돕습니다.
- 학교자율시간의 정의, 시수 확보 방법, 편성 원칙, 운영 사례 등을 안내합니다.

## 답변 원칙
1. 제공된 문서(Context)를 최우선으로 참고하여 답변합니다.
2. 문서의 내용을 종합하여 완성된 답변을 작성합니다.
3. 숫자(시수, 비율, 차시 등)는 정확하게 인용합니다.
4. 답변은 친절하고 명확하게, 교사가 바로 활용할 수 있도록 실용적으로 작성합니다.

## 답변 형식
- 마크다운 기호(**, *, #, ##) 사용 금지
- 일반 텍스트로 자연스럽게 작성
- 목록은 "- " 또는 "1. 2. 3."으로 표시`;

// 임베딩 생성 (text-embedding-004 사용)
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });
    return response.embeddings?.[0]?.values || [];
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}

// 질문 분류
export async function classifyQuestion(question: string): Promise<'document' | 'creative'> {
  try {
    const prompt = `다음 질문을 분류하세요.

질문: "${question}"

분류 기준:
- "document": 학교자율시간의 정의, 규정, 지침, 법령, 시수, 편성 기준, 운영 방법 등 공식적인 정보를 묻는 질문
- "creative": 교육과정 계획서 작성, 수업 아이디어, 활동 제안, 성취기준 작성, 예시 만들기 등 창의적인 답변이 필요한 질문

오직 "document" 또는 "creative" 중 하나만 답변하세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = (response.text || '').toLowerCase().trim();
    console.log('Question classification:', text);

    if (text.includes('creative')) {
      return 'creative';
    }
    return 'document';
  } catch (error) {
    console.error('Classification error:', error);
    return 'document';
  }
}

// 문서 기반 응답 생성
export async function generateResponse(question: string, context: string): Promise<string> {
  try {
    const prompt = `${SYSTEM_INSTRUCTION}

## 참고 문서 (학교자율시간 관련 자료)
${context}

## 사용자 질문
${question}

## 지시사항
위 참고 문서를 꼼꼼히 읽고, 질문과 관련된 정보를 종합하여 답변해주세요.

답변 작성 요령:
1. 참고 문서에서 질문과 관련된 핵심 내용을 찾아 정리하세요.
2. 시수, 차시, 비율 등 구체적인 숫자가 있으면 정확히 포함하세요.
3. 여러 문서에 관련 정보가 있으면 종합하여 완성된 답변을 작성하세요.
4. 답변은 친절하고 이해하기 쉽게 작성하세요.

답변:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    return response.text || '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('Response generation error:', error);
    throw error;
  }
}

// 창의적 응답 (계획서, 아이디어 등)
export async function generateCreativeResponse(question: string, context: string): Promise<string> {
  try {
    const prompt = `${SYSTEM_INSTRUCTION}

## 참고 문서
${context}

## 교사 요청
${question}

## 지시사항
당신은 초등학교 교사를 돕는 교육과정 전문가입니다.
학교자율시간 관련 창의적인 아이디어와 계획서 작성을 도와주세요.

- 문서 내용을 참고하되, 교육 전문가로서의 창의적인 아이디어를 자유롭게 제안하세요.
- 실제 초등학교 현장에서 활용 가능한 실용적인 내용을 제공하세요.
- 구체적인 예시, 성취기준, 활동 계획, 평가 방법 등을 포함하세요.

답변:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    return response.text || '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('Creative response generation error:', error);
    throw error;
  }
}

// Re-ranking: 검색 결과의 관련성 순위 재정렬
export async function rerankDocuments(
  question: string,
  documents: Array<{ content: string; similarity: number; metadata: any }>
): Promise<Array<{ content: string; similarity: number; metadata: any }>> {
  if (documents.length <= 3) {
    return documents;
  }

  try {
    const docsToRerank = documents.slice(0, 10);

    const docList = docsToRerank.map((doc, i) =>
      `[문서 ${i + 1}]: ${doc.content.substring(0, 500)}...`
    ).join('\n\n');

    const prompt = `질문: "${question}"

아래 문서들 중에서 질문에 가장 관련성이 높은 순서대로 문서 번호를 나열하세요.
숫자만 쉼표로 구분하여 답하세요. (예: 3,1,5,2,4)

${docList}

관련성 순서 (높은순):`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 100,
      },
    });

    const rankText = (response.text || '').trim();
    const ranks = rankText.match(/\d+/g);

    if (!ranks) {
      return documents;
    }

    const rerankedDocs: typeof documents = [];
    const usedIndices = new Set<number>();

    for (const rank of ranks) {
      const idx = parseInt(rank) - 1;
      if (idx >= 0 && idx < docsToRerank.length && !usedIndices.has(idx)) {
        rerankedDocs.push(docsToRerank[idx]);
        usedIndices.add(idx);
      }
    }

    for (let i = 0; i < docsToRerank.length; i++) {
      if (!usedIndices.has(i)) {
        rerankedDocs.push(docsToRerank[i]);
      }
    }

    rerankedDocs.push(...documents.slice(10));

    console.log('Reranked documents order:', ranks?.join(','));
    return rerankedDocs;
  } catch (error) {
    console.error('Reranking error:', error);
    return documents;
  }
}
