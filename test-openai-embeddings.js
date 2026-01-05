#!/usr/bin/env node
/**
 * Test script to verify OpenAI embeddings work correctly
 * 
 * Usage:
 *   EMBEDDING_PROVIDER=OPENAI OPENAI_API_KEY=sk-... node test-openai-embeddings.js
 */

import { RAGKnowledgeGraphManager } from './src/manager.js';

async function testOpenAIEmbeddings() {
  console.log('🧪 Testing OpenAI Embeddings Integration...\n');
  
  // Check env vars
  const provider = process.env.EMBEDDING_PROVIDER || 'LOCAL';
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  
  console.log(`📋 Configuration:`);
  console.log(`   EMBEDDING_PROVIDER: ${provider}`);
  console.log(`   OPENAI_API_KEY: ${hasOpenAIKey ? '✅ Set' : '❌ Not set'}`);
  console.log();
  
  // Initialize manager
  const manager = new RAGKnowledgeGraphManager(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  await manager.initialize();
  
  // Test embedding generation
  console.log('🔮 Generating test embedding...');
  const testText = 'This is a test for OpenAI embeddings with 384 dimensions';
  
  const startTime = Date.now();
  const embedding = await manager.generateEmbedding(testText);
  const duration = Date.now() - startTime;
  
  if (!embedding) {
    console.error('❌ Failed to generate embedding');
    process.exit(1);
  }
  
  console.log(`✅ Embedding generated in ${duration}ms`);
  console.log(`   Dimensions: ${embedding.length}`);
  console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
  console.log(`   Provider used: ${manager.embeddingProvider}`);
  
  // Verify dimensions
  if (embedding.length !== 384) {
    console.error(`❌ Expected 384 dimensions, got ${embedding.length}`);
    process.exit(1);
  }
  
  // Test multiple embeddings for performance
  console.log('\n⚡ Performance test (5 embeddings)...');
  const perfStart = Date.now();
  
  for (let i = 0; i < 5; i++) {
    await manager.generateEmbedding(`Test text ${i}`);
  }
  
  const avgTime = (Date.now() - perfStart) / 5;
  console.log(`   Average time: ${avgTime.toFixed(0)}ms per embedding`);
  
  if (provider === 'OPENAI') {
    console.log(`   Expected: 50-200ms (OpenAI is fast!)`);
  } else {
    console.log(`   Expected: 200-2000ms (Local model)`);
  }
  
  console.log('\n✅ All tests passed!');
}

testOpenAIEmbeddings().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
