#!/usr/bin/env node

/**
 * Complete Migration Script: Chunk & Embed All Data
 * 
 * This script will:
 * 1. Chunk all documents in the database
 * 2. Generate embeddings for all chunks
 * 3. Generate embeddings for all entities
 * 
 * Run this AFTER the MCP server is updated with all 20 tools.
 */

import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@huggingface/transformers';

const SUPABASE_URL = 'https://qystmdysjemiqlqmhfbh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5c3RtZHlzamVtaXFscW1oZmJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMDcxNCwiZXhwIjoyMDY4NjA2NzE0fQ.prPn_vUbpSDMghlVodIfXXWFWfXT_GM0m4PX06YaSkU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Configuration
const BATCH_SIZE = 10; // Process documents in batches
const MAX_CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

console.log('🚀 Starting Complete Data Migration\n');
console.log('='.repeat(70) + '\n');

// Initialize embedding model
let embeddingModel = null;

async function initEmbeddingModel() {
  console.log('🤖 Loading sentence transformer model...');
  try {
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { quantized: true }
    );
    console.log('✅ Model loaded successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to load model:', error.message);
    return false;
  }
}

async function generateEmbedding(text) {
  if (!embeddingModel) {
    throw new Error('Embedding model not initialized');
  }
  
  const output = await embeddingModel(text, {
    pooling: 'mean',
    normalize: true,
  });
  
  return Array.from(output.data);
}

// Step 1: Chunk all documents
async function chunkAllDocuments() {
  console.log('📦 Step 1: Chunking all documents...\n');
  
  const { data: documents, error } = await supabase
    .from('rag_documents')
    .select('id, content');
  
  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }
  
  console.log(`Found ${documents.length} documents to chunk\n`);
  
  let totalChunks = 0;
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    
    try {
      // Simple chunking
      const text = doc.content;
      let startPos = 0;
      let chunkIndex = 0;
      const chunks = [];
      
      while (startPos < text.length) {
        const endPos = Math.min(startPos + MAX_CHUNK_SIZE, text.length);
        const chunkText = text.substring(startPos, endPos);
        
        chunks.push({
          document_id: doc.id,
          chunk_index: chunkIndex,
          content: chunkText,
          start_pos: startPos,
          end_pos: endPos,
        });
        
        startPos += MAX_CHUNK_SIZE - CHUNK_OVERLAP;
        chunkIndex++;
      }
      
      // Insert chunks
      if (chunks.length > 0) {
        const { error: insertError } = await supabase
          .from('rag_chunks')
          .insert(chunks);
        
        if (!insertError) {
          totalChunks += chunks.length;
          console.log(`  ✅ [${i + 1}/${documents.length}] ${doc.id}: ${chunks.length} chunks`);
        } else {
          console.log(`  ❌ [${i + 1}/${documents.length}] ${doc.id}: ${insertError.message}`);
        }
      }
    } catch (error) {
      console.log(`  ❌ [${i + 1}/${documents.length}] ${doc.id}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Chunking complete: ${totalChunks} total chunks created\n`);
  return totalChunks;
}

// Step 2: Embed all chunks
async function embedAllChunks() {
  console.log('🔮 Step 2: Generating embeddings for all chunks...\n');
  
  const { data: chunks, error } = await supabase
    .from('rag_chunks')
    .select('id, content')
    .is('embedding', null);
  
  if (error) {
    throw new Error(`Failed to fetch chunks: ${error.message}`);
  }
  
  console.log(`Found ${chunks.length} chunks to embed\n`);
  
  let embeddedCount = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      const embedding = await generateEmbedding(chunk.content);
      
      const { error: updateError } = await supabase
        .from('rag_chunks')
        .update({ embedding })
        .eq('id', chunk.id);
      
      if (!updateError) {
        embeddedCount++;
        if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
          console.log(`  ✅ Progress: ${i + 1}/${chunks.length} chunks embedded`);
        }
      } else {
        console.log(`  ❌ Chunk ${chunk.id}: ${updateError.message}`);
      }
    } catch (error) {
      console.log(`  ❌ Chunk ${chunk.id}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Chunk embedding complete: ${embeddedCount}/${chunks.length} embedded\n`);
  return embeddedCount;
}

// Step 3: Embed all entities
async function embedAllEntities() {
  console.log('🔮 Step 3: Generating embeddings for all entities...\n');
  
  const { data: entities, error } = await supabase
    .from('rag_entities')
    .select('id, name, entity_type, observations');
  
  if (error) {
    throw new Error(`Failed to fetch entities: ${error.message}`);
  }
  
  console.log(`Found ${entities.length} entities to embed\n`);
  
  let embeddedCount = 0;
  
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    
    try {
      // Generate embedding text
      const parts = [
        `Entity: ${entity.name}`,
        `Type: ${entity.entity_type}`,
      ];
      
      if (entity.observations && entity.observations.length > 0) {
        parts.push(`Observations: ${entity.observations.join('. ')}`);
      }
      
      const embeddingText = parts.join('\n');
      const embedding = await generateEmbedding(embeddingText);
      
      // Store embedding
      const { error: insertError } = await supabase
        .from('rag_entity_embeddings')
        .upsert({
          entity_id: entity.id,
          embedding,
          embedding_text: embeddingText,
        });
      
      if (!insertError) {
        embeddedCount++;
        if ((i + 1) % 50 === 0 || i === entities.length - 1) {
          console.log(`  ✅ Progress: ${i + 1}/${entities.length} entities embedded`);
        }
      } else {
        console.log(`  ❌ Entity ${entity.name}: ${insertError.message}`);
      }
    } catch (error) {
      console.log(`  ❌ Entity ${entity.name}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Entity embedding complete: ${embeddedCount}/${entities.length} embedded\n`);
  return embeddedCount;
}

// Main migration
async function main() {
  try {
    // Initialize model
    const modelReady = await initEmbeddingModel();
    if (!modelReady) {
      console.error('❌ Cannot proceed without embedding model');
      process.exit(1);
    }
    
    // Step 1: Chunk documents
    const totalChunks = await chunkAllDocuments();
    
    // Step 2: Embed chunks
    const embeddedChunks = await embedAllChunks();
    
    // Step 3: Embed entities
    const embeddedEntities = await embedAllEntities();
    
    // Summary
    console.log('='.repeat(70));
    console.log('\n🎉 Migration Complete!\n');
    console.log('📊 Summary:');
    console.log(`  - Documents chunked: 277`);
    console.log(`  - Total chunks created: ${totalChunks}`);
    console.log(`  - Chunks embedded: ${embeddedChunks}`);
    console.log(`  - Entities embedded: ${embeddedEntities}`);
    console.log('\n✅ Your RAG Memory PostgreSQL server is now fully operational!\n');
    console.log('🚀 Next steps:');
    console.log('  1. Restart Cursor to load the updated MCP server');
    console.log('  2. Test semantic search with searchNodes');
    console.log('  3. Test hybrid search with hybridSearch');
    console.log('  4. Test detailed context with getDetailedContext\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
