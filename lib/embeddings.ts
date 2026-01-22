import { generateEmbedding } from './gemini';
import { getSupabaseAdmin } from './supabase';

// 동의어 사전 - 학교자율시간 관련 키워드 확장
const SYNONYM_DICTIONARY: Record<string, string[]> = {
  '학교자율시간': ['학교자율시간', '자율시간', '자율활동', '자율적 교육과정', '학교 자율 시간'],
  '시수': ['시수', '수업시간', '차시', '시간배당', '시간편성', '수업 시수'],
  '교육과정': ['교육과정', '2022 개정', '개정 교육과정', '교과과정', '커리큘럼'],
  '편성': ['편성', '운영', '계획', '설계', '구성'],
  '성취기준': ['성취기준', '학습목표', '교육목표', '평가기준', '평가수준', '학습 성취기준'],
  '창의적체험활동': ['창의적체험활동', '창체', '체험활동', '자율활동', '창의적 체험활동'],
  '융합': ['융합', '통합', '연계', '교과융합', '융합교육'],
  '프로젝트': ['프로젝트', '프로젝트학습', '프로젝트기반', 'PBL', '프로젝트 학습'],
  '평가': ['평가', '성취평가', '과정평가', '수행평가', '학습평가'],
  '초등학교': ['초등학교', '초등', '초등교육', '초등학생'],
  '중학교': ['중학교', '중등', '중학', '중학생'],
  '활동': ['활동', '학습활동', '교육활동', '수업활동'],
  '과목': ['과목', '교과', '교과목', '학과']
};

// 불용어 (한국어)
const STOPWORDS = new Set([
  '은', '는', '이', '가', '을', '를', '의', '에', '에서', '로', '으로',
  '와', '과', '도', '만', '부터', '까지', '에게', '한테', '께',
  '이다', '하다', '있다', '되다', '없다', '않다',
  '그', '이', '저', '것', '수', '등', '및', '또는',
  '무엇', '어떻게', '왜', '언제', '어디', '누구',
  '합니다', '입니다', '습니다', '니다', '나요', '인가요', '할까요',
  '대해서', '대해', '알려주세요', '알려줘', '뭐야', '뭔가요'
]);

// 질문에서 핵심 키워드 추출
export function extractKeywords(query: string): string[] {
  const words = query
    .replace(/[?.,!]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 1);

  const keywords: string[] = [];

  // 동의어 사전의 주요 키워드 우선 추가
  for (const mainKeyword of Object.keys(SYNONYM_DICTIONARY)) {
    if (query.includes(mainKeyword)) {
      keywords.push(mainKeyword);
    }
  }

  // 나머지 단어 추가 (불용어 제외)
  for (const word of words) {
    if (!STOPWORDS.has(word) && !keywords.includes(word)) {
      keywords.push(word);
    }
  }

  return keywords.slice(0, 10);
}

// 키워드를 동의어로 확장
export function expandKeywordsWithSynonyms(keywords: string[]): string[] {
  const expanded = new Set<string>();

  for (const keyword of keywords) {
    expanded.add(keyword);

    // 동의어 사전에서 확장
    for (const [mainWord, synonyms] of Object.entries(SYNONYM_DICTIONARY)) {
      if (keyword.includes(mainWord) || mainWord.includes(keyword)) {
        synonyms.forEach(syn => expanded.add(syn));
      }
      // 동의어 중에 매칭되는 것이 있으면 모든 동의어 추가
      if (synonyms.some(syn => keyword.includes(syn) || syn.includes(keyword))) {
        synonyms.forEach(syn => expanded.add(syn));
      }
    }
  }

  return Array.from(expanded);
}

// ============================================
// Track A: 벡터 검색 (Semantic Search)
// - 질문의 의미를 임베딩으로 변환하여 검색
// ============================================
export async function vectorSearch(
  query: string,
  matchCount: number = 30
): Promise<Array<{ content: string; similarity: number; metadata: any; source: 'vector' }>> {
  try {
    console.log('🔍 [Vector Search] Starting for:', query);

    const queryEmbedding = await generateEmbedding(query);
    console.log('✅ [Vector Search] Generated embedding, length:', queryEmbedding?.length);

    const supabaseAdmin = getSupabaseAdmin();

    // pgvector RPC 함수로 검색
    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
    });

    if (error) {
      console.error('❌ [Vector Search] RPC error:', error);
      return [];
    }

    console.log('✅ [Vector Search] Found:', data?.length || 0, 'results');

    return (data || []).map((doc: any) => ({
      ...doc,
      source: 'vector' as const
    }));
  } catch (error) {
    console.error('💥 [Vector Search] Error:', error);
    return [];
  }
}

// ============================================
// Track B: 키워드 검색 (BM25 Style + 동의어 확장)
// - 동의어 사전으로 확장된 키워드로 정확한 단어 매칭
// ============================================
export async function keywordSearchWithExpansion(
  query: string,
  matchCount: number = 30
): Promise<Array<{ content: string; similarity: number; metadata: any; source: 'keyword' }>> {
  try {
    console.log('🔑 [Keyword Search] Starting for:', query);

    const supabaseAdmin = getSupabaseAdmin();

    // 1. 키워드 추출
    const keywords = extractKeywords(query);
    console.log('🔑 [Keyword Search] Extracted keywords:', keywords);

    // 2. 동의어로 확장
    const expandedKeywords = expandKeywordsWithSynonyms(keywords);
    console.log('🔑 [Keyword Search] Expanded keywords:', expandedKeywords);

    if (expandedKeywords.length === 0) {
      return [];
    }

    // 3. 확장된 모든 키워드로 병렬 검색
    const searchPromises = expandedKeywords.slice(0, 15).map(async (keyword) => {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .select('id, content, metadata')
        .ilike('content', `%${keyword}%`)
        .limit(10);

      if (error) {
        console.log(`🔑 [Keyword Search] Error for "${keyword}":`, error.message);
        return [];
      }
      return data || [];
    });

    const searchResults = await Promise.all(searchPromises);
    const allResults = searchResults.flat();

    console.log('🔑 [Keyword Search] Raw results:', allResults.length);

    // 4. 중복 제거 및 BM25 스타일 점수 계산
    const docScores = new Map<string, { doc: any; score: number; matchedKeywords: Set<string> }>();

    for (const doc of allResults) {
      const docId = doc.id;
      const searchableText = [
        doc.content,
        doc.metadata?.context || '',
        doc.metadata?.contextualized_content || ''
      ].join(' ').toLowerCase();

      if (docScores.has(docId)) {
        // 이미 있으면 점수 증가
        const existing = docScores.get(docId)!;
        existing.score += 0.05;
      } else {
        // BM25 스타일 점수 계산
        let score = 0.3;
        const docLength = searchableText.length;
        const avgDocLength = 1500;
        const matchedKeywords = new Set<string>();

        for (const keyword of expandedKeywords) {
          const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const matches = (searchableText.match(regex) || []).length;

          if (matches > 0) {
            matchedKeywords.add(keyword);
            // BM25 공식 간소화
            const k1 = 1.2;
            const b = 0.75;
            const tf = matches / (matches + k1 * (1 - b + b * (docLength / avgDocLength)));
            const idf = Math.log(1 + (127 - matches + 0.5) / (matches + 0.5));
            score += tf * idf * 0.15;
          }
        }

        // 컨텍스트 메타데이터에서 매칭되면 보너스
        if (doc.metadata?.context) {
          const contextText = doc.metadata.context.toLowerCase();
          const contextMatches = expandedKeywords.filter(k => contextText.includes(k.toLowerCase())).length;
          score += contextMatches * 0.05;
        }

        // 여러 키워드 매칭 보너스
        score += matchedKeywords.size * 0.1;

        docScores.set(docId, {
          doc,
          score: Math.min(score, 1),
          matchedKeywords
        });
      }
    }

    // 5. 점수순 정렬 및 반환
    const sortedResults = Array.from(docScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, matchCount)
      .map(({ doc, score }) => ({
        content: doc.content,
        metadata: doc.metadata,
        similarity: score,
        source: 'keyword' as const
      }));

    console.log('🔑 [Keyword Search] Final results:', sortedResults.length);
    return sortedResults;
  } catch (error) {
    console.error('💥 [Keyword Search] Error:', error);
    return [];
  }
}

// ============================================
// 하이브리드 병렬 검색 (메인 함수)
// - Track A (벡터)와 Track B (키워드)를 동시 실행
// - 결과 병합 및 점수 합산
// ============================================
export async function hybridParallelSearch(
  query: string,
  matchCount: number = 30
): Promise<Array<{ content: string; similarity: number; metadata: any; sources: string[] }>> {
  console.log('🚀 [Hybrid Search] Starting parallel search for:', query);
  console.log('═'.repeat(60));

  // Track A와 Track B를 병렬로 실행
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(query, matchCount),
    keywordSearchWithExpansion(query, matchCount)
  ]);

  console.log('═'.repeat(60));
  console.log('📊 [Hybrid Search] Vector results:', vectorResults.length);
  console.log('📊 [Hybrid Search] Keyword results:', keywordResults.length);

  // 결과 병합 (RRF - Reciprocal Rank Fusion 스타일)
  const mergedScores = new Map<string, {
    content: string;
    metadata: any;
    vectorScore: number;
    keywordScore: number;
    sources: string[];
  }>();

  const k = 60; // RRF 상수

  // 벡터 검색 결과 추가 (가중치 0.5)
  vectorResults.forEach((doc, rank) => {
    const key = doc.content.substring(0, 150);
    const rrfScore = 1 / (k + rank + 1);

    if (mergedScores.has(key)) {
      const existing = mergedScores.get(key)!;
      existing.vectorScore = doc.similarity * 0.5 + rrfScore * 0.5;
      existing.sources.push('vector');
    } else {
      mergedScores.set(key, {
        content: doc.content,
        metadata: doc.metadata,
        vectorScore: doc.similarity * 0.5 + rrfScore * 0.5,
        keywordScore: 0,
        sources: ['vector']
      });
    }
  });

  // 키워드 검색 결과 추가 (가중치 0.5)
  keywordResults.forEach((doc, rank) => {
    const key = doc.content.substring(0, 150);
    const rrfScore = 1 / (k + rank + 1);

    if (mergedScores.has(key)) {
      const existing = mergedScores.get(key)!;
      existing.keywordScore = doc.similarity * 0.5 + rrfScore * 0.5;
      if (!existing.sources.includes('keyword')) {
        existing.sources.push('keyword');
      }
    } else {
      mergedScores.set(key, {
        content: doc.content,
        metadata: doc.metadata,
        vectorScore: 0,
        keywordScore: doc.similarity * 0.5 + rrfScore * 0.5,
        sources: ['keyword']
      });
    }
  });

  // 최종 점수 계산 및 정렬
  const finalResults = Array.from(mergedScores.values())
    .map(doc => ({
      content: doc.content,
      metadata: doc.metadata,
      similarity: doc.vectorScore + doc.keywordScore,
      sources: doc.sources,
      // 양쪽에서 모두 발견된 문서에 보너스
      bonus: doc.sources.length > 1 ? 0.2 : 0
    }))
    .map(doc => ({
      content: doc.content,
      metadata: doc.metadata,
      similarity: Math.min(doc.similarity + doc.bonus, 1),
      sources: doc.sources
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);

  console.log('✅ [Hybrid Search] Merged results:', finalResults.length);
  console.log('📊 [Hybrid Search] Dual-source docs:', finalResults.filter(d => d.sources.length > 1).length);

  return finalResults;
}

// 기존 함수들 (하위 호환성 유지)
export async function searchSimilarDocuments(
  query: string,
  matchCount: number = 10
): Promise<Array<{ content: string; similarity: number; metadata: any }>> {
  return vectorSearch(query, matchCount);
}

export async function keywordSearch(
  query: string,
  matchCount: number = 10
): Promise<Array<{ content: string; similarity: number; metadata: any }>> {
  const results = await keywordSearchWithExpansion(query, matchCount);
  return results.map(({ source, ...rest }) => rest);
}
