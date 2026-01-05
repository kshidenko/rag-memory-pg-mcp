import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qystmdysjemiqlqmhfbh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5c3RtZHlzamVtaXFscW1oZmJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMDcxNCwiZXhwIjoyMDY4NjA2NzE0fQ.prPn_vUbpSDMghlVodIfXXWFWfXT_GM0m4PX06YaSkU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🔍 Getting table schemas from PostgreSQL\n');

// Query information_schema to get actual columns
const tables = ['rag_chunks', 'rag_entity_embeddings'];

for (const table of tables) {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = '${table}'
      ORDER BY ordinal_position;
    `
  });
  
  if (error) {
    // Try alternative method - direct query
    console.log(`\n📋 ${table}:`);
    console.log('  Cannot query schema directly, trying insert test...\n');
  }
}

// Alternative: Try inserting with all possible columns
console.log('📦 Testing rag_chunks columns:\n');
const chunkTest = {
  document_id: 'test_doc',
  chunk_index: 0,
  content: 'test content',
  start_pos: 0,
  end_pos: 10,
  embedding: null
};

const { error: chunkErr } = await supabase
  .from('rag_chunks')
  .insert(chunkTest);

console.log('  Result:', chunkErr ? chunkErr.message : '✅ All columns accepted');

// Clean up test
if (!chunkErr) {
  await supabase.from('rag_chunks').delete().eq('document_id', 'test_doc');
}

console.log('\n🔮 Testing rag_entity_embeddings columns:\n');
const embeddingTest = {
  entity_id: 'test_entity',
  embedding: new Array(384).fill(0.1),
  embedding_text: 'test text'
};

const { error: embErr } = await supabase
  .from('rag_entity_embeddings')
  .insert(embeddingTest);

console.log('  Result:', embErr ? embErr.message : '✅ All columns accepted');

// Clean up test
if (!embErr) {
  await supabase.from('rag_entity_embeddings').delete().eq('entity_id', 'test_entity');
}

console.log('\n✅ Schema test complete');
