const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function generateEmbedding(text) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

async function indexPDF(filePath) {
  const fileName = path.basename(filePath);
  console.log(`Processing: ${fileName}`);

  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);

  const chunks = chunkText(pdfData.text);
  console.log(`Found ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Embedding chunk ${i + 1}/${chunks.length}`);

    const embedding = await generateEmbedding(chunk);

    const { error } = await supabase.from('documents').insert({
      content: chunk,
      metadata: {
        source: fileName,
        page: Math.floor(i / 3) + 1,
        total_pages: pdfData.numpages,
        chunk_index: i
      },
      embedding: embedding
    });

    if (error) {
      console.error(`Error inserting chunk ${i}:`, error);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`Completed: ${fileName}`);
}

async function main() {
  const pdfsDir = path.join(__dirname, '..', 'pdfs');
  const files = fs.readdirSync(pdfsDir).filter(f => f.endsWith('.pdf'));

  console.log(`Found ${files.length} PDF files`);

  for (const file of files) {
    await indexPDF(path.join(pdfsDir, file));
  }

  console.log('Indexing complete!');
}

main().catch(console.error);
