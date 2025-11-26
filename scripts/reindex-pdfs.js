/**
 * PDF 재인덱싱 스크립트 (Gemini 3 Pro Preview + OCR)
 *
 * Gemini Vision으로 PDF에서 텍스트 추출 (스캔된 PDF 지원)
 * 큰 청크 사이즈 (1500-2000 토큰) 사용
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Gemini 클라이언트
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 텍스트 정리 함수
function cleanText(text) {
  return text
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/\d+\/\d+/g, '')
    .replace(/\d+\.\s*\d+\.\s*\d+\.\s*(오전|오후)\s*\d+:\d+/g, '')
    .replace(/초등학교_?학교자율시간_?운영_?(톺아보기|돌아보기)\s*\(?최적화\)?/gi, '')
    .replace(/중학교_?학교자율시간_?운영_?(톺아보기|돌아보기)\s*\(?최적화\)?/gi, '')
    .replace(/경상북도교육청\s*(연구원)?/g, '')
    .replace(/따뜻한\s*경북교육/g, '')
    .replace(/세계교육을\s*(품습니다|이끌어갑니다)!?/g, '')
    .replace(/Gyeongsangbuk-do Office of Education/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{3,}/g, ' ')
    .trim();
}

// Gemini Vision으로 PDF에서 텍스트 추출 (gemini-2.5-flash 사용)
async function extractTextFromPDF(filePath) {
  console.log('Extracting text with Gemini 2.5 Flash Vision...');

  const pdfBuffer = fs.readFileSync(filePath);
  const base64PDF = pdfBuffer.toString('base64');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `이 PDF 문서의 모든 텍스트를 추출해주세요. 표, 제목, 본문, 목록 등 모든 내용을 포함해주세요. 페이지 번호나 URL은 제외하고 텍스트만 출력하세요.

PDF Data: data:application/pdf;base64,${base64PDF}`,
  });

  return response.text || '';
}

// 큰 청크로 분할 (Gemini 최적화: 3000자 ≈ 1500-2000 토큰)
function chunkText(text, chunkSize = 3000, overlap = 500) {
  const cleanedText = cleanText(text);
  const chunks = [];
  const paragraphs = cleanedText.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length < chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      // 긴 문단 처리
      if (para.length > chunkSize) {
        const sentences = para.split(/(?<=[.!?。])\s+/);
        currentChunk = '';
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length < chunkSize) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
          }
        }
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // 오버랩 추가
  const overlappedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i];
    if (i > 0 && chunks[i - 1].length > overlap) {
      const prevOverlap = chunks[i - 1].slice(-overlap);
      chunk = prevOverlap + '\n\n' + chunk;
    }
    overlappedChunks.push(chunk);
  }

  return overlappedChunks.length > 0 ? overlappedChunks : chunks;
}

// 임베딩 생성
async function generateEmbedding(text) {
  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });
    return response.embeddings?.[0]?.values || [];
  } catch (error) {
    console.error('Embedding error:', error.message);
    throw error;
  }
}

// 기존 문서 삭제
async function clearAllDocuments() {
  console.log('Clearing all existing documents...');
  const { error } = await supabase
    .from('documents')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error clearing documents:', error);
  } else {
    console.log('All documents cleared');
  }
}

// PDF 인덱싱
async function indexPDF(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n========================================`);
  console.log(`Processing: ${fileName}`);
  console.log(`========================================`);

  // Gemini Vision으로 텍스트 추출
  const text = await extractTextFromPDF(filePath);
  console.log(`Extracted ${text.length} characters`);

  if (text.length < 100) {
    console.error('Text extraction failed or PDF is empty');
    return;
  }

  // 큰 청크로 분할
  const chunks = chunkText(text);
  console.log(`Created ${chunks.length} chunks (avg ${Math.round(text.length / chunks.length)} chars each)`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`\nProcessing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);

    try {
      const embedding = await generateEmbedding(chunk);

      if (embedding.length === 0) {
        console.error(`Empty embedding for chunk ${i + 1}`);
        errorCount++;
        continue;
      }

      const { error } = await supabase.from('documents').insert({
        content: chunk,
        metadata: {
          source: fileName,
          page: Math.floor(i / 3) + 1,
          chunk_index: i,
          chunk_size: chunk.length,
          total_chunks: chunks.length
        },
        embedding: embedding
      });

      if (error) {
        console.error(`Error inserting chunk ${i + 1}:`, error.message);
        errorCount++;
      } else {
        console.log(`✓ Chunk ${i + 1} saved`);
        successCount++;
      }

      // API 레이트 리밋 방지
      await new Promise(r => setTimeout(r, 500));

    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Completed: ${fileName}`);
  console.log(`Success: ${successCount}, Errors: ${errorCount}`);
  console.log(`========================================`);
}

// 메인 함수
async function main() {
  console.log('PDF Reindexing Script (Gemini 3 Pro Preview)');
  console.log('Using Vision API for OCR');
  console.log('Chunk size: 3000 chars (~1500-2000 tokens)');
  console.log('Overlap: 500 chars\n');

  const pdfsDir = path.join(__dirname, '..', 'pdfs');

  if (!fs.existsSync(pdfsDir)) {
    console.error(`PDFs directory not found: ${pdfsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(pdfsDir).filter(f => f.endsWith('.pdf'));
  console.log(`Found ${files.length} PDF file(s)\n`);

  if (files.length === 0) {
    console.log('No PDF files found');
    process.exit(0);
  }

  // 기존 문서 모두 삭제
  await clearAllDocuments();

  for (const file of files) {
    await indexPDF(path.join(pdfsDir, file));
  }

  console.log('\n========================================');
  console.log('All indexing complete!');
  console.log('========================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
