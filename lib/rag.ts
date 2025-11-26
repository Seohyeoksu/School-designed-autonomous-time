import { searchSimilarDocuments, keywordSearch } from './embeddings';
import { generateResponse, generateCreativeResponse, classifyQuestion, rerankDocuments } from './gemini';

// 문서 내용에서 노이즈 제거 (URL, 타임스탬프, 페이지 번호 등)
function cleanDocumentContent(content: string): string {
  return content
    // URL 제거
    .replace(/https?:\/\/[^\s]+/g, '')
    // 페이지 번호 (17/104 형식) 제거
    .replace(/\d+\/\d+/g, '')
    // 타임스탬프 (25. 11. 18. 오후 6:46 형식) 제거
    .replace(/\d+\.\s*\d+\.\s*\d+\.\s*(오전|오후)\s*\d+:\d+/g, '')
    // 문서 제목 반복 제거
    .replace(/초등학교_?학교자율시간_?운영_?(톺아보기|돌아보기)\s*\(?최적화\)?/gi, '')
    .replace(/중학교_?학교자율시간_?운영_?(톺아보기|돌아보기)\s*\(?최적화\)?/gi, '')
    .replace(/초등학교\s+학교자율시간\s*(톺아보기|돌아보기)/gi, '')
    .replace(/중학교\s+학교자율시간\s*(톺아보기|돌아보기)/gi, '')
    // 2022 개정 교육과정 관련 반복 헤더 제거
    .replace(/2022\s*개정\s*교육과정\s*적용에\s*따른/g, '')
    // 경상북도교육청 관련 제거
    .replace(/경상북도교육청\s*(연구원)?/g, '')
    .replace(/따뜻한\s*경북교육/g, '')
    .replace(/세계교육을\s*이끌어갑니다!?/g, '')
    .replace(/Gyeongsangbuk-do Office of Education/gi, '')
    // 목차 관련 제거
    .replace(/^목차\s*$/gm, '')
    // 섹션 제목 반복 제거
    .replace(/^I+\s*$/gm, '')
    .replace(/^II+\s*$/gm, '')
    // 단독 숫자 줄 제거 (페이지 번호)
    .replace(/^\s*\d{1,3}\s*$/gm, '')
    // 연속 공백/줄바꿈 정리
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{3,}/g, ' ')
    .trim();
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata: Record<string, any>;
    similarity: number;
  }>;
  responseType: 'document' | 'creative';
}

export async function queryRAG(
  question: string,
  matchCount: number = 15
): Promise<RAGResponse> {
  try {
    console.log('RAG: Processing question:', question);

    // 1. 질문 유형 분류
    const questionType = await classifyQuestion(question);
    console.log('RAG: Question type:', questionType);

    // 2. 하이브리드 검색 (벡터 검색 + 키워드 검색)
    console.log('RAG: Starting hybrid search...');

    // 벡터 검색 (semantic search)
    const vectorResults = await searchSimilarDocuments(question, matchCount * 2);
    console.log('RAG: Vector search results:', vectorResults.length);

    // 키워드 검색 (BM25 스타일)
    const keywordResults = await keywordSearch(question, matchCount);
    console.log('RAG: Keyword search results:', keywordResults.length);

    // 3. 결과 병합 및 중복 제거
    const mergedResults = mergeSearchResults(vectorResults, keywordResults);
    console.log('RAG: Merged results:', mergedResults.length);

    // 4. 리랭킹 (질문과 관련성 재평가)
    const rerankedResults = await rerankDocuments(question, mergedResults);
    console.log('RAG: Reranked results:', rerankedResults.length);

    // 5. 상위 문서 선택 (더 많은 컨텍스트 활용 - Gemini의 큰 컨텍스트 윈도우 활용)
    const topDocs = rerankedResults.slice(0, 10);
    console.log('RAG: Using top', topDocs.length, 'documents');

    // 6. 컨텍스트 구성 (노이즈 제거된 깨끗한 문서 내용)
    const context = topDocs.length > 0
      ? topDocs.map((doc, index) =>
          `[문서 ${index + 1}]\n${cleanDocumentContent(doc.content)}`
        ).join('\n\n---\n\n')
      : '관련 문서를 찾을 수 없습니다.';

    // 7. 응답 생성
    let answer: string;

    if (questionType === 'creative') {
      console.log('RAG: Generating creative response');
      answer = await generateCreativeResponse(question, context);
    } else {
      console.log('RAG: Generating document-based response');
      answer = await generateResponse(question, context);
    }

    console.log('RAG: Response generated successfully');

    return {
      answer,
      sources: topDocs.map((doc) => ({
        content: doc.content,
        metadata: doc.metadata,
        similarity: doc.similarity
      })),
      responseType: questionType
    };
  } catch (error) {
    console.error('Error in queryRAG:', error);

    // 에러 시 기본 응답 반환
    return {
      answer: '죄송합니다. 질문을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      sources: [],
      responseType: 'document'
    };
  }
}

// 벡터 검색과 키워드 검색 결과 병합
function mergeSearchResults(
  vectorResults: Array<{ content: string; similarity: number; metadata: any }>,
  keywordResults: Array<{ content: string; similarity: number; metadata: any }>
): Array<{ content: string; similarity: number; metadata: any }> {
  const seen = new Set<string>();
  const merged: Array<{ content: string; similarity: number; metadata: any }> = [];

  // 벡터 검색 결과 (가중치 0.7)
  for (const doc of vectorResults) {
    const key = doc.content.substring(0, 100);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({
        ...doc,
        similarity: doc.similarity * 0.7
      });
    }
  }

  // 키워드 검색 결과 (가중치 0.3)
  for (const doc of keywordResults) {
    const key = doc.content.substring(0, 100);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({
        ...doc,
        similarity: doc.similarity * 0.3
      });
    } else {
      // 이미 있으면 점수 합산
      const existing = merged.find(m => m.content.substring(0, 100) === key);
      if (existing) {
        existing.similarity += doc.similarity * 0.3;
      }
    }
  }

  // 점수순 정렬
  merged.sort((a, b) => b.similarity - a.similarity);

  return merged;
}
