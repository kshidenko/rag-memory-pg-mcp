/**
 * Check Supabase schema and data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qystmdysjemiqlqmhfbh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5c3RtZHlzamVtaXFscW1oZmJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMDcxNCwiZXhwIjoyMDY4NjA2NzE0fQ.prPn_vUbpSDMghlVodIfXXWFWfXT_GM0m4PX06YaSkU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🔍 Checking Supabase Database Schema\n');
console.log('='.repeat(70) + '\n');

// Check each table
const tables = [
  'rag_entities',
  'rag_relationships',
  'rag_documents',
  'rag_chunks',
  'rag_entity_embeddings',
  'rag_chunk_entities',
  'rag_stats'
];

for (const table of tables) {
  try {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Table "${table}": ERROR - ${error.message}`);
    } else {
      console.log(`✅ Table "${table}": ${count || 0} rows`);
    }
  } catch (err) {
    console.log(`❌ Table "${table}": DOES NOT EXIST or ACCESS DENIED`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('\n📊 Checking table structures...\n');

// Check rag_chunks structure
try {
  const { data: chunks } = await supabase
    .from('rag_chunks')
    .select('*')
    .limit(1);
  
  if (chunks && chunks.length > 0) {
    console.log('rag_chunks columns:', Object.keys(chunks[0]));
  } else {
    console.log('rag_chunks: Empty table');
  }
} catch (err) {
  console.log('❌ Cannot access rag_chunks:', err.message);
}

// Check rag_entity_embeddings structure
try {
  const { data: embeddings } = await supabase
    .from('rag_entity_embeddings')
    .select('*')
    .limit(1);
  
  if (embeddings && embeddings.length > 0) {
    console.log('rag_entity_embeddings columns:', Object.keys(embeddings[0]));
  } else {
    console.log('rag_entity_embeddings: Empty table');
  }
} catch (err) {
  console.log('❌ Cannot access rag_entity_embeddings:', err.message);
}

console.log('\n' + '='.repeat(70));
console.log('\n✅ Schema check complete\n');
