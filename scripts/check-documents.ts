import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkDocuments() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?select=id,content,metadata&limit=5`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    }
  );

  const docs = await response.json() as Array<{id: string; content: string; metadata: any}>;
  console.log('Total docs fetched:', docs.length);
  console.log('\n--- Sample Documents ---\n');

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    console.log(`\n[Document ${i + 1}]`);
    console.log('Metadata:', JSON.stringify(doc.metadata));
    console.log('Content (first 800 chars):');
    console.log(doc.content?.substring(0, 800));
    console.log('\n---');
  }
}

checkDocuments();
