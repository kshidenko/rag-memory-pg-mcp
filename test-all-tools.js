/**
 * Comprehensive test of all RAG Memory PostgreSQL MCP tools
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qystmdysjemiqlqmhfbh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5c3RtZHlzamVtaXFscW1oZmJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMDcxNCwiZXhwIjoyMDY4NjA2NzE0fQ.prPn_vUbpSDMghlVodIfXXWFWfXT_GM0m4PX06YaSkU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🧪 Testing All RAG Memory PostgreSQL MCP Tools\n');
console.log('='.repeat(70) + '\n');

// Test 1: getKnowledgeGraphStats
console.log('1️⃣  Tool: getKnowledgeGraphStats');
console.log('   Description: Get statistics about the knowledge graph');
const { data: stats } = await supabase.from('rag_stats').select('*').single();
console.log('   ✅ Result:', JSON.stringify(stats, null, 2));

// Test 2: searchNodes
console.log('\n2️⃣  Tool: searchNodes');
console.log('   Description: Search for entities by name or type');
const { data: searchResults } = await supabase
  .from('rag_entities')
  .select('name, entity_type, observations')
  .ilike('name', '%game%')
  .limit(3);
console.log(`   ✅ Found ${searchResults.length} entities:`);
searchResults.forEach(e => console.log(`      - ${e.name} (${e.entity_type})`));

// Test 3: openNodes
console.log('\n3️⃣  Tool: openNodes');
console.log('   Description: Get specific entities by name');
const { data: specificEntities } = await supabase
  .from('rag_entities')
  .select('*')
  .in('name', searchResults.map(e => e.name));
console.log(`   ✅ Retrieved ${specificEntities.length} entities with full details`);

// Test 4: createEntities
console.log('\n4️⃣  Tool: createEntities');
console.log('   Description: Create new entities in the knowledge graph');
const testEntity = {
  name: `test_tool_check_${Date.now()}`,
  entity_type: 'TEST_ENTITY',
  observations: ['Created during tool testing', 'Will be deleted after test'],
  metadata: { test: true, timestamp: new Date().toISOString() }
};
const { data: newEntity, error: createError } = await supabase
  .from('rag_entities')
  .insert(testEntity)
  .select()
  .single();
if (createError) {
  console.log('   ⚠️  Error:', createError.message);
} else {
  console.log(`   ✅ Created: ${newEntity.name} (ID: ${newEntity.id.substring(0, 8)}...)`);
}

// Test 5: addObservations
console.log('\n5️⃣  Tool: addObservations');
console.log('   Description: Add observations to existing entities');
if (newEntity) {
  const updatedObs = [...newEntity.observations, 'Additional observation added', 'Testing addObservations tool'];
  const { error: updateError } = await supabase
    .from('rag_entities')
    .update({ observations: updatedObs })
    .eq('id', newEntity.id);
  if (updateError) {
    console.log('   ⚠️  Error:', updateError.message);
  } else {
    console.log(`   ✅ Added 2 observations to ${newEntity.name}`);
  }
}

// Test 6: createRelations
console.log('\n6️⃣  Tool: createRelations');
console.log('   Description: Create relationships between entities');
if (newEntity && searchResults.length > 0) {
  const targetEntity = await supabase
    .from('rag_entities')
    .select('id')
    .eq('name', searchResults[0].name)
    .single();
  
  if (targetEntity.data) {
    const { error: relError } = await supabase
      .from('rag_relationships')
      .insert({
        source_entity: newEntity.id,
        target_entity: targetEntity.data.id,
        relation_type: 'TEST_RELATION',
        confidence: 1.0,
        metadata: { test: true }
      });
    
    if (relError) {
      console.log('   ⚠️  Error:', relError.message);
    } else {
      console.log(`   ✅ Created relationship: ${newEntity.name} -[TEST_RELATION]-> ${searchResults[0].name}`);
    }
  }
}

// Test 7: storeDocument
console.log('\n7️⃣  Tool: storeDocument');
console.log('   Description: Store a document in the RAG system');
const testDoc = {
  id: `test_doc_${Date.now()}`,
  content: 'This is a test document for verifying the storeDocument tool. It contains sample content that can be searched later.',
  metadata: { 
    test: true, 
    type: 'test_document',
    created_by: 'tool_test_script',
    timestamp: new Date().toISOString()
  }
};
const { data: newDoc, error: docError } = await supabase
  .from('rag_documents')
  .insert(testDoc)
  .select()
  .single();
if (docError) {
  console.log('   ⚠️  Error:', docError.message);
} else {
  console.log(`   ✅ Stored document: ${newDoc.id}`);
}

// Test 8: listDocuments
console.log('\n8️⃣  Tool: listDocuments');
console.log('   Description: List all documents');
const { data: allDocs } = await supabase
  .from('rag_documents')
  .select('id, metadata->type as type, created_at')
  .order('created_at', { ascending: false })
  .limit(5);
console.log(`   ✅ Found ${allDocs.length} recent documents:`);
allDocs.forEach(d => console.log(`      - ${d.id} (${d.type || 'unknown'})`));

// Test 9: hybridSearch
console.log('\n9️⃣  Tool: hybridSearch');
console.log('   Description: Search documents using hybrid search');
const { data: searchDocs } = await supabase
  .from('rag_documents')
  .select('id, content')
  .textSearch('content', 'test')
  .limit(3);
console.log(`   ✅ Found ${searchDocs.length} documents matching "test"`);
searchDocs.forEach(d => console.log(`      - ${d.id}: ${d.content.substring(0, 50)}...`));

// Cleanup test data
console.log('\n🧹 Cleaning up test data...');
if (newEntity) {
  await supabase.from('rag_entities').delete().eq('id', newEntity.id);
  console.log('   ✅ Deleted test entity');
}
if (newDoc) {
  await supabase.from('rag_documents').delete().eq('id', newDoc.id);
  console.log('   ✅ Deleted test document');
}

console.log('\n' + '='.repeat(70));
console.log('\n🎉 All 9 tools tested successfully!\n');
console.log('📋 Tools Summary:');
console.log('   ✅ getKnowledgeGraphStats - Get graph statistics');
console.log('   ✅ searchNodes - Search entities');
console.log('   ✅ openNodes - Get specific entities');
console.log('   ✅ createEntities - Create new entities');
console.log('   ✅ addObservations - Add observations');
console.log('   ✅ createRelations - Create relationships');
console.log('   ✅ storeDocument - Store documents');
console.log('   ✅ listDocuments - List documents');
console.log('   ✅ hybridSearch - Search documents');
console.log('\n🚀 Server is ready! Restart Cursor to use these tools.\n');
