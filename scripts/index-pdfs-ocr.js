const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function generateEmbedding(text) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

async function extractTextFromPDF(filePath) {
  const pdfBuffer = fs.readFileSync(filePath);
  const base64PDF = pdfBuffer.toString('base64');

  const result = await visionModel.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64PDF
      }
    },
    '이 PDF 문서의 모든 텍스트를 추출해주세요. 표, 제목, 본문 등 모든 내용을 포함해주세요. 텍스트만 출력하고 다른 설명은 하지 마세요.'
  ]);

  return result.response.text();
}

function chunkText(text, chunkSize = 1500, overlap = 300) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length < chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      if (para.length > chunkSize) {
        const sentences = para.split(/(?<=[.!?])\s+/);
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

  const overlappedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i];
    if (i > 0 && chunks[i-1].length > overlap) {
      const prevOverlap = chunks[i-1].slice(-overlap);
      chunk = prevOverlap + '\n\n' + chunk;
    }
    overlappedChunks.push(chunk);
  }

  return overlappedChunks.length > 0 ? overlappedChunks : chunks;
}

async function indexPDF(filePath) {
  const fileName = path.basename(filePath);
  console.log('Processing: ' + fileName);

  console.log('Extracting text with Gemini Vision OCR...');
  const text = await extractTextFromPDF(filePath);
  console.log('Extracted ' + text.length + ' characters');

  const chunks = chunkText(text);
  console.log('Created ' + chunks.length + ' chunks');

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log('Embedding chunk ' + (i + 1) + '/' + chunks.length);

    const embedding = await generateEmbedding(chunk);

    const { error } = await supabase.from('documents').insert({
      content: chunk,
      metadata: {
        source: fileName,
        page: Math.floor(i / 3) + 1,
        chunk_index: i
      },
      embedding: embedding
    });

    if (error) {
      console.error('Error inserting chunk ' + i + ':', error);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('Completed: ' + fileName);
}

async function main() {
  const pdfsDir = path.join(__dirname, '..', 'pdfs');
  const files = fs.readdirSync(pdfsDir).filter(f => f.endsWith('.pdf'));

  console.log('Found ' + files.length + ' PDF files');

  console.log('Clearing existing documents...');
  await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  for (const file of files) {
    await indexPDF(path.join(pdfsDir, file));
  }

  console.log('Indexing complete!');
}

main().catch(console.error);
