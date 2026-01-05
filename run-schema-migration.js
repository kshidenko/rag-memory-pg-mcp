#!/usr/bin/env node

/**
 * Run schema migration using Supabase client
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qystmdysjemiqlqmhfbh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5c3RtZHlzamVtaXFscW1oZmJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMDcxNCwiZXhwIjoyMDY4NjA2NzE0fQ.prPn_vUbpSDMghlVodIfXXWFWfXT_GM0m4PX06YaSkU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🔧 Running Schema Migration via Supabase Client\n');
console.log('='.repeat(70) + '\n');

// Try to use the PostgreSQL REST API to run SQL
// Note: This requires the service role key and proper RLS policies

async function runSQL(sql, description) {
  console.log(`📝 ${description}...`);
  
  try {
    // Supabase client doesn't directly support ALTER TABLE
    // We need to use the REST API or create a stored procedure
    
    // Alternative: Use a stored procedure if available
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log(`  💡 This is expected - Supabase client can't run DDL directly`);
      return false;
    } else {
      console.log(`  ✅ Success`);
      return true;
    }
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`);
    return false;
  }
}

console.log('⚠️  Note: Supabase client cannot run ALTER TABLE commands directly.\n');
console.log('📋 You have 2 options:\n');

console.log('Option 1: Use Supabase Dashboard (Recommended)');
console.log('  1. Go to: https://supabase.com/dashboard/project/qystmdysjemiqlqmhfbh');
console.log('  2. Click: SQL Editor');
console.log('  3. Run this SQL:\n');

const sql = `-- Add missing columns
ALTER TABLE rag_chunks
ADD COLUMN IF NOT EXISTS start_pos INTEGER,
ADD COLUMN IF NOT EXISTS end_pos INTEGER;

ALTER TABLE rag_entity_embeddings
ADD COLUMN IF NOT EXISTS embedding_text TEXT;`;

console.log(sql);

console.log('\n\nOption 2: Use psql command line');
console.log('  (Requires direct PostgreSQL connection string)\n');

console.log('='.repeat(70));
console.log('\n💡 After running the SQL, execute:\n');
console.log('  node migrate-all-data.js\n');

// Try to verify current schema
console.log('🔍 Checking current schema...\n');

// Test what columns currently exist by trying inserts
console.log('📦 Testing rag_chunks columns:');
const chunkTests = [
  { document_id: 'test', chunk_index: 0, content: 'test' },
  { document_id: 'test', chunk_index: 0, content: 'test', start_pos: 0 },
  { document_id: 'test', chunk_index: 0, content: 'test', start_pos: 0, end_pos: 10 },
];

for (const test of chunkTests) {
  const cols = Object.keys(test).join(', ');
  const { error } = await supabase.from('rag_chunks').insert(test);
  
  if (error) {
    if (error.message.includes('Could not find')) {
      const missing = error.message.match(/'([^']+)' column/)?.[1];
      console.log(`  ❌ Missing column: ${missing}`);
      break;
    } else if (error.message.includes('duplicate')) {
      console.log(`  ✅ Columns work: ${cols}`);
      await supabase.from('rag_chunks').delete().eq('document_id', 'test');
      break;
    } else {
      console.log(`  ⚠️  ${error.message}`);
    }
  } else {
    console.log(`  ✅ All columns exist: ${cols}`);
    await supabase.from('rag_chunks').delete().eq('document_id', 'test');
    break;
  }
}

console.log('\n🔮 Testing rag_entity_embeddings columns:');
const embTests = [
  { entity_id: 'test', embedding: new Array(384).fill(0.1) },
  { entity_id: 'test', embedding: new Array(384).fill(0.1), embedding_text: 'test' },
];

for (const test of embTests) {
  const cols = Object.keys(test).join(', ');
  const { error } = await supabase.from('rag_entity_embeddings').insert(test);
  
  if (error) {
    if (error.message.includes('Could not find')) {
      const missing = error.message.match(/'([^']+)' column/)?.[1];
      console.log(`  ❌ Missing column: ${missing}`);
      break;
    } else if (error.message.includes('duplicate')) {
      console.log(`  ✅ Columns work: ${cols}`);
      await supabase.from('rag_entity_embeddings').delete().eq('entity_id', 'test');
      break;
    } else {
      console.log(`  ⚠️  ${error.message}`);
    }
  } else {
    console.log(`  ✅ All columns exist: ${cols}`);
    await supabase.from('rag_entity_embeddings').delete().eq('entity_id', 'test');
    break;
  }
}

console.log('\n' + '='.repeat(70));
console.log('\n📝 Summary:');
console.log('  - Schema migration SQL is ready');
console.log('  - Run it in Supabase SQL Editor');
console.log('  - Then run: node migrate-all-data.js\n');
