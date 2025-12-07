/**
 * Upstage OCR을 이용한 PDF 파싱 및 임베딩 재생성 스크립트
 *
 * 사용법:
 *   npx ts-node scripts/reindex-with-upstage.ts
 *
 * 또는 package.json에 스크립트 추가 후:
 *   npm run reindex
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

const UPSTAGE_API_KEY = process.env.UPSTAGE_API_KEY || 'up_XKWTBePseoO7GGT5DI8TGLhKFhhZx';
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

interface UpstageElement {
  id: number;
  type: string;
  content?: {
    text?: string;
    markdown?: string;
    html?: string;
  };
  page?: number;
  text?: string;
  markdown?: string;
  html?: string;
}

interface UpstageResponse {
  api?: string;
  model?: string;
  content?: {
    markdown?: string;
    text?: string;
    html?: string;
  };
  elements?: UpstageElement[];
  pages?: Array<{
    id: number;
    text?: string;
    markdown?: string;
  }>;
  text?: string;
}

// PDF 분할 함수 (100페이지 이상인 경우)
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

// Upstage OCR로 단일 PDF 버퍼 파싱
async function parseBufferWithUpstage(pdfBuffer: Buffer, fileName: string, pageOffset: number = 0): Promise<ParsedDocument[]> {
  const formData = new FormData();
  formData.append('document', pdfBuffer, {
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
  console.log('   API Response keys:', Object.keys(result));
  const documents: ParsedDocument[] = [];

  // HTML에서 텍스트 추출하는 함수
  const htmlToText = (html: string): string => {
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
  };

  // content.html에서 텍스트 추출
  if (result.content) {
    const htmlContent = result.content.html || '';
    const markdownContent = result.content.markdown || '';
    const textContent = result.content.text || '';

    // HTML > Markdown > Text 순서로 시도
    let content = '';
    if (htmlContent) {
      content = htmlToText(htmlContent);
    } else if (markdownContent) {
      content = markdownContent;
    } else if (textContent) {
      content = textContent;
    }

    if (content.trim()) {
      // 큰 문서는 청크로 분할
      const chunks = splitIntoChunks(content, 1500);
      console.log(`   Splitting into ${chunks.length} chunks`);

      chunks.forEach((chunk, index) => {
        documents.push({
          content: chunk,
          page: index + 1 + pageOffset,
          metadata: {
            source: fileName,
            page: index + 1 + pageOffset,
            total_pages: 0
          }
        });
      });
    }
  }

  // elements가 있는 경우 추가 처리
  if (result.elements && result.elements.length > 0 && documents.length === 0) {
    console.log(`   Processing ${result.elements.length} elements`);

    let currentPage = pageOffset;
    let currentContent = '';

    for (const element of result.elements) {
      const text = element.text || element.markdown || (element.html ? htmlToText(element.html) : '');

      if (text.trim()) {
        currentContent += text + '\n\n';
      }

      // 페이지가 바뀌거나 내용이 너무 길면 청크로 분리
      if (currentContent.length > 1500) {
        documents.push({
          content: currentContent.trim(),
          page: currentPage + 1,
          metadata: {
            source: fileName,
            page: currentPage + 1,
            total_pages: 0
          }
        });
        currentContent = '';
        currentPage++;
      }
    }

    // 남은 내용 저장
    if (currentContent.trim()) {
      documents.push({
        content: currentContent.trim(),
        page: currentPage + 1,
        metadata: {
          source: fileName,
          page: currentPage + 1,
          total_pages: 0
        }
      });
    }
  }

  return documents;
}

// Upstage OCR로 PDF 파싱 (분할 처리 지원)
async function parseWithUpstage(filePath: string): Promise<ParsedDocument[]> {
  console.log(`\n📄 Parsing: ${path.basename(filePath)}`);

  try {
    const fileName = path.basename(filePath);
    const pdfChunks = await splitPdf(filePath);

    console.log(`   Processing ${pdfChunks.length} chunk(s)...`);

    const allDocuments: ParsedDocument[] = [];
    let pageOffset = 0;

    for (let i = 0; i < pdfChunks.length; i++) {
      console.log(`   Processing chunk ${i + 1}/${pdfChunks.length}...`);

      const docs = await parseBufferWithUpstage(pdfChunks[i], fileName, pageOffset);
      allDocuments.push(...docs);

      // 다음 청크의 페이지 오프셋 계산
      if (docs.length > 0) {
        pageOffset = Math.max(...docs.map(d => d.page));
      }

      // Rate limiting 방지
      if (i < pdfChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // total_pages 업데이트
    const totalPages = allDocuments.length > 0 ? Math.max(...allDocuments.map(d => d.page)) : 0;
    allDocuments.forEach(doc => {
      doc.metadata.total_pages = totalPages;
    });

    console.log(`✅ Upstage API response received`);
    console.log(`   Extracted ${allDocuments.length} document chunks`);

    return allDocuments;
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error);
    throw error;
  }
}

// 텍스트를 적절한 크기의 청크로 분할
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

  // 모든 문서 삭제 (neq로 빈 문자열이 아닌 모든 id 삭제)
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

// Supabase에 문서 저장
async function saveDocument(doc: ParsedDocument, embedding: number[]): Promise<void> {
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
        content: doc.content,
        metadata: doc.metadata,
        embedding: embedding
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to save document: ${error}`);
  }
}

// 메인 함수
async function main() {
  console.log('🚀 Starting PDF reindexing with Upstage OCR\n');
  console.log('Configuration:');
  console.log(`   PDF Directory: ${PDF_DIR}`);
  console.log(`   Upstage API: ${UPSTAGE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Gemini API: ${GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Supabase: ${SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);

  // PDF 파일 목록 가져오기
  if (!fs.existsSync(PDF_DIR)) {
    console.error(`❌ PDF directory not found: ${PDF_DIR}`);
    console.log('   Creating pdfs directory...');
    fs.mkdirSync(PDF_DIR, { recursive: true });
    console.log('   Please add PDF files to the pdfs directory and run again.');
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
      // Upstage OCR로 파싱
      const documents = await parseWithUpstage(filePath);

      // 각 문서에 대해 임베딩 생성 및 저장
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        console.log(`   Processing chunk ${i + 1}/${documents.length}...`);

        // 임베딩 생성
        const embedding = await generateEmbedding(doc.content);

        // Supabase에 저장
        await saveDocument(doc, embedding);

        totalDocuments++;

        // Rate limiting 방지
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`✅ Completed: ${pdfFile}`);
    } catch (error) {
      console.error(`❌ Failed to process ${pdfFile}:`, error);
    }
  }

  console.log(`\n🎉 Reindexing complete!`);
  console.log(`   Total documents indexed: ${totalDocuments}`);
}

// 실행
main().catch(console.error);
