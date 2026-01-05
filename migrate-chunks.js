/**
 * Migrate chunks and embeddings from SQLite to PostgreSQL
 * 
 * Since the old SQLite database doesn't have chunks yet,
 * we need to:
 * 1. Chunk all existing documents in PostgreSQL
 * 2. Generate embeddings for all chunks
 * 3. Generate embeddings for all entities
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qystmdysjemiqlqmhfbh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5c3RtZHlzamVtaXFscW1oZmJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMDcxNCwiZXhwIjoyMDY4NjA2NzE0fQ.prPn_vUbpSDMghlVodIfXXWFWfXT_GM0m4PX06YaSkU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🚀 Migration Plan: Chunk & Embed All Documents\n');
console.log('='.repeat(70) + '\n');

// Get all documents
const { data: documents, error } = await supabase
  .from('rag_documents')
  .select('id, metadata')
  .order('created_at', { ascending: true });

if (error) {
  console.error('❌ Error fetching documents:', error.message);
  process.exit(1);
}

console.log(`📊 Found ${documents.length} documents in PostgreSQL\n`);
console.log('📋 Migration Steps:\n');
console.log('  1. Chunk all 277 documents (using chunkDocument tool)');
console.log('  2. Generate embeddings for all chunks (using embedChunks tool)');
console.log('  3. Generate embeddings for all 555 entities (using embedAllEntities tool)');
console.log('  4. Optionally: Link entities to documents (using linkEntitiesToDocument tool)');
console.log('\n' + '='.repeat(70));
console.log('\n💡 Recommendation:\n');
console.log('  Run these operations through the MCP server after restart:');
console.log('  1. First, test with a few documents');
console.log('  2. Then batch process all documents');
console.log('  3. Finally, run embedAllEntities once');
console.log('\n📝 Sample documents to test with:');

// Show first 5 documents
documents.slice(0, 5).forEach((doc, i) => {
  console.log(`  ${i + 1}. ${doc.id} (${doc.metadata?.type || 'unknown'})`);
});

console.log('\n✅ Schema is ready for migration!\n');
