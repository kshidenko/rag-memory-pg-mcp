#!/usr/bin/env node

/**
 * Add missing columns using Supabase REST API
 */

const SUPABASE_URL = 'https://qystmdysjemiqlqmhfbh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5c3RtZHlzamVtaXFscW1oZmJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMDcxNCwiZXhwIjoyMDY4NjA2NzE0fQ.prPn_vUbpSDMghlVodIfXXWFWfXT_GM0m4PX06YaSkU';

console.log('🔧 Attempting to add columns via Supabase REST API\n');
console.log('='.repeat(70) + '\n');

// Try using the database REST API endpoint
const sql = `
ALTER TABLE rag_chunks
ADD COLUMN IF NOT EXISTS start_pos INTEGER,
ADD COLUMN IF NOT EXISTS end_pos INTEGER;

ALTER TABLE rag_entity_embeddings
ADD COLUMN IF NOT EXISTS embedding_text TEXT;
`;

console.log('📝 SQL to execute:');
console.log(sql);
console.log('\n' + '='.repeat(70) + '\n');

// Try POST to /rest/v1/rpc endpoint
async function tryRPC() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('Result:', data);
      return true;
    } else {
      console.log('❌ RPC endpoint not available or insufficient permissions');
      console.log('Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

const success = await tryRPC();

if (!success) {
  console.log('\n' + '='.repeat(70));
  console.log('\n⚠️  Cannot run DDL via API. Manual SQL execution required.\n');
  console.log('📋 Please copy and paste this SQL into Supabase SQL Editor:\n');
  console.log('🔗 URL: https://supabase.com/dashboard/project/qystmdysjemiqlqmhfbh/sql\n');
  console.log('```sql');
  console.log(sql.trim());
  console.log('```\n');
  console.log('Then run: node migrate-all-data.js\n');
} else {
  console.log('\n✅ Schema migration complete!');
  console.log('\n🚀 Next step: node migrate-all-data.js\n');
}
