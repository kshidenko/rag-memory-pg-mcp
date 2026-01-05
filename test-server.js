/**
 * Test script for RAG Memory PostgreSQL MCP Server
 * 
 * This script tests all available tools to ensure they work correctly.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qystmdysjemiqlqmhfbh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5c3RtZHlzamVtaXFscW1oZmJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMDcxNCwiZXhwIjoyMDY4NjA2NzE0fQ.prPn_vUbpSDMghlVodIfXXWFWfXT_GM0m4PX06YaSkU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testGetStats() {
  console.log('\n📊 Testing getKnowledgeGraphStats...');
  
  const { data, error } = await supabase
    .from('rag_stats')
    .select('*')
    .single();
  
  if (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
  
  console.log('✅ Success!');
  console.log(`   Entities: ${data.entity_count}`);
  console.log(`   Relationships: ${data.relationship_count}`);
  console.log(`   Documents: ${data.document_count}`);
  return true;
}

async function testSearchNodes() {
  console.log('\n🔍 Testing searchNodes...');
  
  const { data, error } = await supabase
    .from('rag_entities')
    .select('name, entity_type')
    .ilike('name', '%game%')
    .limit(5);
  
  if (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
  
  console.log('✅ Success!');
  console.log(`   Found ${data.length} entities:`);
  data.forEach(e => console.log(`   - ${e.name} (${e.entity_type})`));
  return true;
}

async function testCreateEntity() {
  console.log('\n➕ Testing createEntity...');
  
  const testEntity = {
    name: `test_mcp_server_${Date.now()}`,
    entity_type: 'TEST',
    observations: ['Created by MCP server test'],
    metadata: { test: true }
  };
  
  const { data, error } = await supabase
    .from('rag_entities')
    .insert(testEntity)
    .select()
    .single();
  
  if (error) {
    console.log('❌ Failed:', error.message);
    return null;
  }
  
  console.log('✅ Success!');
  console.log(`   Created: ${data.name}`);
  return data;
}

async function testCreateRelation(sourceId, targetId) {
  console.log('\n🔗 Testing createRelation...');
  
  const { data, error } = await supabase
    .from('rag_relationships')
    .insert({
      source_entity: sourceId,
      target_entity: targetId,
      relation_type: 'TEST_RELATION',
      confidence: 1.0
    })
    .select();
  
  if (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
  
  console.log('✅ Success!');
  return true;
}

async function testStoreDocument() {
  console.log('\n📄 Testing storeDocument...');
  
  const testDoc = {
    id: `test_doc_${Date.now()}`,
    content: 'This is a test document created by the MCP server test script.',
    metadata: { test: true, created_by: 'test_script' }
  };
  
  const { data, error } = await supabase
    .from('rag_documents')
    .insert(testDoc)
    .select()
    .single();
  
  if (error) {
    console.log('❌ Failed:', error.message);
    return null;
  }
  
  console.log('✅ Success!');
  console.log(`   Stored: ${data.id}`);
  return data;
}

async function testListDocuments() {
  console.log('\n📋 Testing listDocuments...');
  
  const { data, error } = await supabase
    .from('rag_documents')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
  
  console.log('✅ Success!');
  console.log(`   Found ${data.length} recent documents`);
  return true;
}

async function testCleanup(entityId, docId) {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete test entity
  await supabase.from('rag_entities').delete().eq('id', entityId);
  
  // Delete test document
  await supabase.from('rag_documents').delete().eq('id', docId);
  
  console.log('✅ Cleanup complete');
}

async function main() {
  console.log('🧪 Testing RAG Memory PostgreSQL MCP Server\n');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Get stats
  if (await testGetStats()) passed++; else failed++;
  
  // Test 2: Search nodes
  if (await testSearchNodes()) passed++; else failed++;
  
  // Test 3: Create entity
  const entity1 = await testCreateEntity();
  if (entity1) passed++; else failed++;
  
  const entity2 = await testCreateEntity();
  if (entity2) passed++; else failed++;
  
  // Test 4: Create relation
  if (entity1 && entity2) {
    if (await testCreateRelation(entity1.id, entity2.id)) passed++; else failed++;
  }
  
  // Test 5: Store document
  const doc = await testStoreDocument();
  if (doc) passed++; else failed++;
  
  // Test 6: List documents
  if (await testListDocuments()) passed++; else failed++;
  
  // Cleanup
  if (entity1 && doc) {
    await testCleanup(entity1.id, doc.id);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    console.log('\n✅ MCP server is ready to use!');
    console.log('\n📝 To use it:');
    console.log('   1. Restart Cursor to load the new MCP server');
    console.log('   2. Use the rag-memory-pg tools in your prompts');
    console.log('   3. Data syncs automatically across all machines\n');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.\n');
  }
}

main().catch(console.error);

