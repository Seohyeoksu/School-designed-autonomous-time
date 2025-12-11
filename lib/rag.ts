import { hybridParallelSearch } from './embeddings';
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
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           RAG Pipeline - Hybrid Parallel Search            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('📝 Question:', question);

    // 1. 질문 유형 분류 (병렬 실행 가능하도록 분리)
    const classifyPromise = classifyQuestion(question);

    // 2. 하이브리드 병렬 검색 실행
    // Track A (벡터) + Track B (키워드)를 동시에 실행
    console.log('');
    console.log('🔄 Starting HYBRID PARALLEL SEARCH...');
    console.log('   ├─ Track A: Vector Search (semantic meaning)');
    console.log('   └─ Track B: Keyword Search (synonym expansion)');
    console.log('');

    const [questionType, hybridResults] = await Promise.all([
      classifyPromise,
      hybridParallelSearch(question, matchCount * 2)
    ]);

    console.log('');
    console.log('📊 Question type:', questionType);
    console.log('📊 Hybrid search results:', hybridResults.length);

    // 3. 리랭킹 (질문과 관련성 재평가)
    console.log('🔄 Re-ranking results...');
    const docsForRerank = hybridResults.map(doc => ({
      content: doc.content,
      similarity: doc.similarity,
      metadata: doc.metadata
    }));
    const rerankedResults = await rerankDocuments(question, docsForRerank);
    console.log('✅ Reranked results:', rerankedResults.length);

    // 4. 상위 문서 선택
    const topDocs = rerankedResults.slice(0, 15);
    console.log('📄 Using top', topDocs.length, 'documents');

    // 5. 컨텍스트 구성 (Contextual Retrieval 활용)
    const context = topDocs.length > 0
      ? topDocs.map((doc, index) => {
          const cleanedContent = cleanDocumentContent(doc.content);
          const pageInfo = doc.metadata?.page ? `(페이지 ${doc.metadata.page})` : '';

          // Contextual Retrieval: 메타데이터에 저장된 컨텍스트 활용
          const chunkContext = doc.metadata?.context
            ? `[맥락] ${doc.metadata.context}\n\n`
            : '';

          return `[문서 ${index + 1}] ${pageInfo}\n${chunkContext}${cleanedContent}`;
        }).join('\n\n---\n\n')
      : '관련 문서를 찾을 수 없습니다.';

    // 6. 응답 생성
    let answer: string;

    if (questionType === 'creative') {
      console.log('🎨 Generating creative response...');
      answer = await generateCreativeResponse(question, context);
    } else {
      console.log('📚 Generating document-based response...');
      answer = await generateResponse(question, context);
    }

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    RAG Pipeline Complete                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('✅ Answer length:', answer?.length || 0);
    console.log('✅ Sources:', topDocs.length);
    console.log('');

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
    console.error('');
    console.error('💥 Error in queryRAG:', error);
    console.error('');

    // 에러 시 기본 응답 반환
    return {
      answer: '죄송합니다. 질문을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      sources: [],
      responseType: 'document'
    };
  }
}
