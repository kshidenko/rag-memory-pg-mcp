import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qystmdysjemiqlqmhfbh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5c3RtZHlzamVtaXFscW1oZmJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMDcxNCwiZXhwIjoyMDY4NjA2NzE0fQ.prPn_vUbpSDMghlVodIfXXWFWfXT_GM0m4PX06YaSkU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🔍 Checking actual table schemas in Supabase\n');

// Check rag_chunks
console.log('📦 rag_chunks table:');
const { data: chunks, error: chunksErr } = await supabase
  .from('rag_chunks')
  .select('*')
  .limit(1);

if (chunksErr) {
  console.log('  Error:', chunksErr.message);
} else if (chunks && chunks.length > 0) {
  console.log('  Columns:', Object.keys(chunks[0]));
} else {
  console.log('  Table exists but is empty');
  // Try to insert a test row to see what columns are accepted
  const { error: testErr } = await supabase
    .from('rag_chunks')
    .insert({ document_id: 'test', content: 'test' });
  console.log('  Insert test error:', testErr?.message || 'Success - basic columns work');
}

// Check rag_entity_embeddings
console.log('\n🔮 rag_entity_embeddings table:');
const { data: embeddings, error: embErr } = await supabase
  .from('rag_entity_embeddings')
  .select('*')
  .limit(1);

if (embErr) {
  console.log('  Error:', embErr.message);
} else if (embeddings && embeddings.length > 0) {
  console.log('  Columns:', Object.keys(embeddings[0]));
} else {
  console.log('  Table exists but is empty');
  // Try to insert a test row
  const { error: testErr } = await supabase
    .from('rag_entity_embeddings')
    .insert({ entity_id: 'test', embedding: [0.1, 0.2] });
  console.log('  Insert test error:', testErr?.message || 'Success - basic columns work');
}

console.log('\n✅ Schema check complete');
