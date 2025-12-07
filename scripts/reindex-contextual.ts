/**
 * Contextual Retrieval을 적용한 PDF 재인덱싱 스크립트
 *
 * Anthropic의 Contextual Retrieval 기법을 적용:
 * - 각 청크에 문서 전체 맥락을 설명하는 컨텍스트 추가
 * - 컨텍스트화된 청크로 임베딩 생성
 * - 원본 청크와 컨텍스트 모두 저장
 *
 * 사용법:
 *   npx ts-node --project tsconfig.scripts.json scripts/reindex-contextual.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
// @ts-ignore
import fetch from 'node-fetch';
import { PDFDocument } from 'pdf-lib';

// 환경변수 로드
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MAX_PAGES_PER_REQUEST = 100;

const UPSTAGE_API_KEY = process.env.UPSTAGE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// PDF 파일 경로
const PDF_DIR = path.join(process.cwd(), 'pdfs');

interface ParsedDocument {
  content: string;
  page: number;
  metadata: {
    source: string;
    page: number;
    total_pages: number;
  };
}

interface ContextualizedChunk {
  original_content: string;
  contextualized_content: string;
  context: string;
  page: number;
  metadata: {
    source: string;
    page: number;
    total_pages: number;
  };
}

interface UpstageResponse {
  content?: {
    markdown?: string;
    text?: string;
    html?: string;
  };
  elements?: Array<{
    text?: string;
    markdown?: string;
    html?: string;
  }>;
}

// PDF 분할 함수
async function splitPdf(filePath: string): Promise<Buffer[]> {
  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();

  console.log(`   Total pages in PDF: ${totalPages}`);

  if (totalPages <= MAX_PAGES_PER_REQUEST) {
    return [pdfBytes as unknown as Buffer];
  }

  const chunks: Buffer[] = [];
  let startPage = 0;

  while (startPage < totalPages) {
    const endPage = Math.min(startPage + MAX_PAGES_PER_REQUEST, totalPages);
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdfDoc, Array.from({ length: endPage - startPage }, (_, i) => startPage + i));
    pages.forEach(page => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();
    chunks.push(Buffer.from(newPdfBytes));

    console.log(`   Created chunk: pages ${startPage + 1}-${endPage}`);
    startPage = endPage;
  }

  return chunks;
}

// HTML에서 텍스트 추출
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' | ')
    .replace(/<\/th>/gi, ' | ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Upstage OCR로 PDF 파싱
async function parseWithUpstage(filePath: string): Promise<{ fullDocument: string; chunks: ParsedDocument[] }> {
  console.log(`\n📄 Parsing: ${path.basename(filePath)}`);

  const fileName = path.basename(filePath);
  const pdfChunks = await splitPdf(filePath);

  console.log(`   Processing ${pdfChunks.length} chunk(s)...`);

  let fullDocumentText = '';
  const allDocuments: ParsedDocument[] = [];
  let pageOffset = 0;

  for (let i = 0; i < pdfChunks.length; i++) {
    console.log(`   Processing PDF chunk ${i + 1}/${pdfChunks.length}...`);

    const formData = new FormData();
    formData.append('document', pdfChunks[i], {
      filename: 'document.pdf',
      contentType: 'application/pdf'
    });

    const response = await fetch('https://api.upstage.ai/v1/document-ai/document-parse', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTAGE_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData as any
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upstage API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as UpstageResponse;

    // 전체 문서 텍스트 추출
    let chunkText = '';
    if (result.content) {
      if (result.content.html) {
        chunkText = htmlToText(result.content.html);
      } else if (result.content.markdown) {
        chunkText = result.content.markdown;
      } else if (result.content.text) {
        chunkText = result.content.text;
      }
    }

    fullDocumentText += chunkText + '\n\n';

    // 청크로 분할
    const textChunks = splitIntoChunks(chunkText, 800); // 더 작은 청크 사이즈

    textChunks.forEach((chunk, index) => {
      allDocuments.push({
        content: chunk,
        page: index + 1 + pageOffset,
        metadata: {
          source: fileName,
          page: index + 1 + pageOffset,
          total_pages: 0
        }
      });
    });

    pageOffset += textChunks.length;

    // Rate limiting 방지
    if (i < pdfChunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // total_pages 업데이트
  allDocuments.forEach(doc => {
    doc.metadata.total_pages = allDocuments.length;
  });

  console.log(`✅ Extracted ${allDocuments.length} chunks`);

  return { fullDocument: fullDocumentText, chunks: allDocuments };
}

// 텍스트를 청크로 분할
function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += paragraph + '\n\n';
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Gemini를 사용하여 청크에 컨텍스트 생성
async function generateChunkContext(
  fullDocument: string,
  chunk: string,
  documentName: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  // 문서가 너무 길면 앞부분만 사용 (토큰 제한)
  const truncatedDoc = fullDocument.length > 50000
    ? fullDocument.substring(0, 50000) + '\n...(문서 일부 생략)...'
    : fullDocument;

  const prompt = `<document>
${truncatedDoc}
</document>

이 문서는 "${documentName}"이며, 2022 개정 교육과정의 학교자율시간 운영에 관한 공식 가이드입니다.

다음은 위 문서에서 추출한 청크입니다:
<chunk>
${chunk}
</chunk>

이 청크가 전체 문서에서 어떤 맥락을 가지는지 간결하게 설명해주세요.
검색 성능 향상을 위해, 이 청크가 다루는 주제, 관련 섹션, 핵심 개념을 포함해주세요.
오직 간결한 맥락 설명만 답변하세요 (50-100 단어).`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 200
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.warn(`⚠️ Context generation failed: ${error}`);
    return '';
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

// Gemini로 임베딩 생성
async function generateEmbedding(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini embedding error: ${error}`);
  }

  const data = await response.json() as { embedding: { values: number[] } };
  return data.embedding.values;
}

// Supabase에서 기존 문서 삭제
async function deleteExistingDocuments(): Promise<void> {
  console.log('\n🗑️  Deleting existing documents...');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase credentials not set');
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?id=neq.00000000-0000-0000-0000-000000000000`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.warn('⚠️  Delete warning:', error);
  } else {
    console.log('✅ Existing documents deleted');
  }
}

// Supabase에 컨텍스트화된 문서 저장
async function saveContextualDocument(
  chunk: ContextualizedChunk,
  embedding: number[]
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase credentials not set');
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/documents`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        content: chunk.original_content,
        metadata: {
          ...chunk.metadata,
          context: chunk.context,
          contextualized_content: chunk.contextualized_content
        },
        embedding: embedding
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to save document: ${error}`);
  }
}

// 청크 컨텍스트화
async function contextualizeChunks(
  fullDocument: string,
  chunks: ParsedDocument[],
  documentName: string
): Promise<ContextualizedChunk[]> {
  console.log(`\n🔄 Contextualizing ${chunks.length} chunks...`);

  const contextualizedChunks: ContextualizedChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`   Contextualizing chunk ${i + 1}/${chunks.length}...`);

    try {
      // Gemini로 컨텍스트 생성
      const context = await generateChunkContext(fullDocument, chunk.content, documentName);

      // 컨텍스트화된 청크 생성
      const contextualizedContent = context
        ? `${context}\n\n---\n\n${chunk.content}`
        : chunk.content;

      contextualizedChunks.push({
        original_content: chunk.content,
        contextualized_content: contextualizedContent,
        context: context,
        page: chunk.page,
        metadata: chunk.metadata
      });

      // Rate limiting (Gemini API)
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.warn(`   ⚠️ Failed to contextualize chunk ${i + 1}:`, error);
      // 컨텍스트 없이 저장
      contextualizedChunks.push({
        original_content: chunk.content,
        contextualized_content: chunk.content,
        context: '',
        page: chunk.page,
        metadata: chunk.metadata
      });
    }
  }

  console.log(`✅ Contextualized ${contextualizedChunks.length} chunks`);
  return contextualizedChunks;
}

// 메인 함수
async function main() {
  console.log('🚀 Starting Contextual Retrieval Indexing\n');
  console.log('This script implements Anthropic\'s Contextual Retrieval technique:');
  console.log('- Each chunk is enriched with document-level context');
  console.log('- Context is generated using Gemini');
  console.log('- Embeddings are created from contextualized chunks\n');

  console.log('Configuration:');
  console.log(`   PDF Directory: ${PDF_DIR}`);
  console.log(`   Upstage API: ${UPSTAGE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Gemini API: ${GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Supabase: ${SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);

  if (!UPSTAGE_API_KEY || !GEMINI_API_KEY || !SUPABASE_URL) {
    console.error('\n❌ Missing required API keys');
    return;
  }

  // PDF 파일 목록 가져오기
  if (!fs.existsSync(PDF_DIR)) {
    console.error(`❌ PDF directory not found: ${PDF_DIR}`);
    fs.mkdirSync(PDF_DIR, { recursive: true });
    console.log('   Created pdfs directory. Please add PDF files and run again.');
    return;
  }

  const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    console.log('❌ No PDF files found in pdfs directory');
    return;
  }

  console.log(`\n📚 Found ${pdfFiles.length} PDF file(s):`);
  pdfFiles.forEach(f => console.log(`   - ${f}`));

  // 기존 문서 삭제
  await deleteExistingDocuments();

  // 각 PDF 파일 처리
  let totalDocuments = 0;

  for (const pdfFile of pdfFiles) {
    const filePath = path.join(PDF_DIR, pdfFile);

    try {
      // 1. Upstage OCR로 PDF 파싱
      const { fullDocument, chunks } = await parseWithUpstage(filePath);

      // 2. 각 청크 컨텍스트화
      const contextualizedChunks = await contextualizeChunks(fullDocument, chunks, pdfFile);

      // 3. 임베딩 생성 및 저장
      console.log(`\n💾 Saving ${contextualizedChunks.length} contextualized chunks...`);

      for (let i = 0; i < contextualizedChunks.length; i++) {
        const chunk = contextualizedChunks[i];
        console.log(`   Embedding & saving chunk ${i + 1}/${contextualizedChunks.length}...`);

        // 컨텍스트화된 내용으로 임베딩 생성
        const embedding = await generateEmbedding(chunk.contextualized_content);

        // Supabase에 저장
        await saveContextualDocument(chunk, embedding);

        totalDocuments++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`✅ Completed: ${pdfFile}`);
    } catch (error) {
      console.error(`❌ Failed to process ${pdfFile}:`, error);
    }
  }

  console.log(`\n🎉 Contextual Retrieval Indexing Complete!`);
  console.log(`   Total documents indexed: ${totalDocuments}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. The chatbot will now use contextualized embeddings`);
  console.log(`   2. Each chunk includes document-level context for better retrieval`);
  console.log(`   3. Test with queries to see improved accuracy`);
}

// 실행
main().catch(console.error);
