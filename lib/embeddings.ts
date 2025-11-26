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
): Promise<Array<Record<string, any>>> {
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
      let fallbackData: Array<Record<string, any>> = [];

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

// 키워드 기반 검색 (BM25 스타일 - 하이브리드 검색용)
export async function keywordSearch(
  query: string,
  matchCount: number = 10
): Promise<Array<Record<string, any>>> {
  try {
    console.log('🔑 Keyword search for:', query);

    const supabaseAdmin = getSupabaseAdmin();

    // 질문에서 핵심 키워드 추출
    const keywords = extractKeywords(query);
    console.log('🔑 Extracted keywords:', keywords);

    if (keywords.length === 0) {
      return [];
    }

    let allResults: Array<Record<string, any>> = [];

    // 각 키워드로 검색
    for (const keyword of keywords.slice(0, 5)) {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .select('id, content, metadata')
        .ilike('content', `%${keyword}%`)
        .limit(10);

      if (!error && data) {
        allResults = [...allResults, ...data];
      }
    }

    // 중복 제거 및 출현 빈도 기반 점수 계산
    const docScores = new Map<string, { doc: any; score: number }>();

    for (const doc of allResults) {
      const docId = doc.id;
      if (docScores.has(docId)) {
        // 여러 키워드에 매칭되면 점수 증가
        const existing = docScores.get(docId)!;
        existing.score += 0.1;
      } else {
        // 문서 내 키워드 출현 횟수로 점수 계산
        let score = 0.5;
        for (const keyword of keywords) {
          const matches = (doc.content.match(new RegExp(keyword, 'gi')) || []).length;
          score += Math.min(matches * 0.05, 0.3); // 최대 0.3 추가
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

    console.log('🔑 Keyword search results:', sortedResults.length);
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

