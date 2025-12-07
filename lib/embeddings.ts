import { generateEmbedding } from './gemini';
import { getSupabaseAdmin } from './supabase';

// Define keyword mappings for 학교자율시간 related topics
const SCHOOL_AUTONOMY_KEYWORDS = {
  '학교자율시간': ['학교자율시간', '자율시간', '자율활동', '자율적 교육과정'],
  '시수': ['시수', '수업시간', '차시', '시간배당', '시간편성'],
  '교육과정': ['교육과정', '2022 개정', '개정 교육과정', '교과과정'],
  '편성': ['편성', '운영', '계획', '설계'],
  '성취기준': ['성취기준', '학습목표', '교육목표', '평가기준'],
  '창의적체험활동': ['창의적체험활동', '창체', '체험활동', '자율활동'],
  '융합': ['융합', '통합', '연계', '교과융합'],
  '프로젝트': ['프로젝트', '프로젝트학습', '프로젝트기반', 'PBL'],
  '평가': ['평가', '성취평가', '과정평가', '수행평가'],
  '초등학교': ['초등학교', '초등', '초등교육'],
  '중학교': ['중학교', '중등', '중학']
};

function expandQueryWithKeywords(query: string): string[] {
  const expandedQueries = [query]; // Original query first

  // Find matching keywords and add related terms
  for (const [mainKeyword, synonyms] of Object.entries(SCHOOL_AUTONOMY_KEYWORDS)) {
    if (query.includes(mainKeyword)) {
      // Add queries with synonyms
      synonyms.forEach(synonym => {
        if (synonym !== mainKeyword) {
          expandedQueries.push(query.replace(mainKeyword, synonym));
        }
      });
      break; // Only expand for first matching keyword
    }
  }

  return expandedQueries;
}

export async function searchSimilarDocuments(
  query: string,
  matchCount: number = 10
): Promise<Array<{ content: string; similarity: number; metadata: any }>> {
  try {
    console.log('🔍 Searching for query:', query);
    
    // Try hybrid search for better results
    const expandedQueries = expandQueryWithKeywords(query);
    console.log('🔄 Expanded queries:', expandedQueries.length > 1 ? expandedQueries : 'none');
    
    const queryEmbedding = await generateEmbedding(query);
    console.log('✅ Generated embedding, length:', queryEmbedding?.length);
    
    const supabaseAdmin = getSupabaseAdmin();
    
    // First check if documents exist at all
    const { data: countData } = await supabaseAdmin
      .from('documents')
      .select('id', { count: 'exact', head: true });
    console.log('📊 Total documents in DB:', countData);
    
    // Try RPC function for vector search with higher match_count to overcome similarity threshold
    // The pgvector search has an implicit similarity threshold that filters out results
    // when match_count is low. Use a higher count then limit results afterwards.
    const searchCount = Math.max(matchCount, 50); // Increased to 50 to get more results including low similarity
    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding, // Direct array works better than string format
      match_count: searchCount,
    });

    console.log('🎯 RPC function result:', { data: data?.length || 0, error });

    if (error || !data || data.length === 0) {
      console.log('❌ Vector search insufficient, using enhanced fallback:', error);
      
      // Enhanced fallback with school autonomy keywords
      let fallbackData: Array<{ id: string; content: string; metadata: any }> = [];

      // First try school autonomy specific keywords
      const autonomyKeywords = [];
      for (const [mainKeyword, synonyms] of Object.entries(SCHOOL_AUTONOMY_KEYWORDS)) {
        if (query.includes(mainKeyword)) {
          autonomyKeywords.push(...synonyms);
          break;
        }
      }

      if (autonomyKeywords.length > 0) {
        console.log('🔍 Searching for autonomy keywords:', autonomyKeywords.slice(0, 3));
        
        for (const keyword of autonomyKeywords.slice(0, 3)) {
          const { data: termData, error: termError } = await supabaseAdmin
            .from('documents')
            .select('id, content, metadata')
            .ilike('content', `%${keyword}%`)
            .limit(5);
          
          console.log(`🔍 Keyword "${keyword}" found:`, termData?.length || 0, 'results');
          if (termError) console.log('🔍 Keyword error:', termError);
          
          if (termData) {
            fallbackData = [...fallbackData, ...termData];
          }
        }
      }
      
      // If still no results, try general terms
      if (fallbackData.length === 0) {
        const keyTerms = query.split(' ').filter(term => term.length > 1);
        console.log('🔍 Searching for general terms:', keyTerms.slice(0, 3));
        
        for (const term of keyTerms.slice(0, 3)) {
          const { data: termData, error: termError } = await supabaseAdmin
            .from('documents')
            .select('id, content, metadata')
            .ilike('content', `%${term}%`)
            .limit(5);
          
          console.log(`🔍 Term "${term}" found:`, termData?.length || 0, 'results');
          if (termError) console.log('🔍 Term error:', termError);
          
          if (termData) {
            fallbackData = [...fallbackData, ...termData];
          }
        }
      }
      
      // Remove duplicates and limit results
      const uniqueData = fallbackData.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      ).slice(0, matchCount);
      
      console.log('📋 Final fallback search results:', uniqueData.length);
      
      if (uniqueData.length > 0) {
        const result = uniqueData.map(doc => ({
          ...doc,
          similarity: 0.7 // High score for keyword matches
        }));
        console.log('📋 Returning fallback results:', result.length);
        return result;
      }
      
      console.log('❌ No results from fallback search either');
      return [];
    }

    console.log('✅ Returning RPC results:', data?.length || 0);
    // Limit results to requested matchCount
    const limitedData = data.slice(0, matchCount);
    console.log('📋 Limited to requested count:', limitedData.length);
    return limitedData;
  } catch (error) {
    console.error('💥 Error in searchSimilarDocuments:', error);
    throw error;
  }
}

// Contextual BM25 검색 (Anthropic's Contextual Retrieval 적용)
// 컨텍스트화된 내용(metadata.contextualized_content)에서도 검색하여 정확도 향상
export async function keywordSearch(
  query: string,
  matchCount: number = 10
): Promise<Array<{ content: string; similarity: number; metadata: any }>> {
  try {
    console.log('🔑 Contextual BM25 search for:', query);

    const supabaseAdmin = getSupabaseAdmin();

    // 질문에서 핵심 키워드 추출
    const keywords = extractKeywords(query);
    console.log('🔑 Extracted keywords:', keywords);

    if (keywords.length === 0) {
      return [];
    }

    let allResults: Array<{ id: string; content: string; metadata: any }> = [];

    // 각 키워드로 검색 (원본 content + 컨텍스트화된 content 모두 검색)
    for (const keyword of keywords.slice(0, 5)) {
      // 1. 원본 content에서 검색
      const { data: contentData, error: contentError } = await supabaseAdmin
        .from('documents')
        .select('id, content, metadata')
        .ilike('content', `%${keyword}%`)
        .limit(10);

      if (!contentError && contentData) {
        allResults = [...allResults, ...contentData];
      }

      // 2. 컨텍스트화된 content에서도 검색 (metadata->contextualized_content)
      // Supabase에서 JSONB 필드 내부 검색
      const { data: contextData, error: contextError } = await supabaseAdmin
        .from('documents')
        .select('id, content, metadata')
        .filter('metadata->>contextualized_content', 'ilike', `%${keyword}%`)
        .limit(10);

      if (!contextError && contextData) {
        allResults = [...allResults, ...contextData];
      }

      // 3. 맥락(context)에서도 검색
      const { data: metaContextData, error: metaContextError } = await supabaseAdmin
        .from('documents')
        .select('id, content, metadata')
        .filter('metadata->>context', 'ilike', `%${keyword}%`)
        .limit(10);

      if (!metaContextError && metaContextData) {
        allResults = [...allResults, ...metaContextData];
      }
    }

    // 중복 제거 및 BM25 스타일 점수 계산
    const docScores = new Map<string, { doc: any; score: number }>();

    for (const doc of allResults) {
      const docId = doc.id;

      // 검색 대상 텍스트 (원본 + 컨텍스트)
      const searchableText = [
        doc.content,
        doc.metadata?.context || '',
        doc.metadata?.contextualized_content || ''
      ].join(' ').toLowerCase();

      if (docScores.has(docId)) {
        // 여러 키워드/소스에 매칭되면 점수 증가
        const existing = docScores.get(docId)!;
        existing.score += 0.1;
      } else {
        // BM25 스타일 점수 계산
        let score = 0.5;
        const docLength = searchableText.length;
        const avgDocLength = 1500; // 평균 문서 길이 추정

        for (const keyword of keywords) {
          const regex = new RegExp(keyword, 'gi');
          const matches = (searchableText.match(regex) || []).length;

          if (matches > 0) {
            // BM25 공식 간소화: TF * IDF 효과
            const tf = matches / (matches + 1.2 * (1 - 0.75 + 0.75 * (docLength / avgDocLength)));
            const idf = Math.log(1 + (127 - matches + 0.5) / (matches + 0.5)); // 127 = 총 문서 수
            score += tf * idf * 0.1;
          }
        }

        // 컨텍스트에서 매칭되면 추가 보너스
        if (doc.metadata?.context) {
          const contextMatches = keywords.filter(k =>
            doc.metadata.context.toLowerCase().includes(k.toLowerCase())
          ).length;
          score += contextMatches * 0.05;
        }

        docScores.set(docId, { doc, score: Math.min(score, 1) });
      }
    }

    // 점수순 정렬
    const sortedResults = Array.from(docScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, matchCount)
      .map(({ doc, score }) => ({
        ...doc,
        similarity: score
      }));

    console.log('🔑 Contextual BM25 results:', sortedResults.length);
    return sortedResults;
  } catch (error) {
    console.error('💥 Error in keywordSearch:', error);
    return [];
  }
}

// 질문에서 핵심 키워드 추출
function extractKeywords(query: string): string[] {
  // 불용어 (한국어)
  const stopwords = new Set([
    '은', '는', '이', '가', '을', '를', '의', '에', '에서', '로', '으로',
    '와', '과', '도', '만', '부터', '까지', '에게', '한테', '께',
    '이다', '하다', '있다', '되다', '없다', '않다',
    '그', '이', '저', '것', '수', '등', '및', '또는',
    '무엇', '어떻게', '왜', '언제', '어디', '누구',
    '합니다', '입니다', '습니다', '니다', '나요', '인가요', '할까요'
  ]);

  // 학교자율시간 관련 중요 키워드
  const importantTerms = [
    '학교자율시간', '자율시간', '시수', '편성', '운영',
    '교육과정', '성취기준', '평가', '차시', '창의적체험활동',
    '초등학교', '중학교', '2022', '개정'
  ];

  // 단어 분리
  const words = query
    .replace(/[?.,!]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 1);

  const keywords: string[] = [];

  // 중요 키워드 우선 추가
  for (const term of importantTerms) {
    if (query.includes(term)) {
      keywords.push(term);
    }
  }

  // 나머지 단어 추가 (불용어 제외)
  for (const word of words) {
    if (!stopwords.has(word) && !keywords.includes(word)) {
      keywords.push(word);
    }
  }

  return keywords.slice(0, 10);
}

