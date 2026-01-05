#!/usr/bin/env node

/**
 * RAG Memory PostgreSQL MCP Server
 * 
 * A Model Context Protocol server for RAG-enabled memory with PostgreSQL/Supabase backend.
 * Provides knowledge graph, document management, and semantic search capabilities.
 * 
 * Features:
 * - Knowledge graph (entities, relationships, observations)
 * - Document processing (chunking, embedding, search)
 * - Hybrid search (vector + graph)
 * - Multi-machine sync via PostgreSQL
 * 
 * @module rag-memory-pg-mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@huggingface/transformers';

// Supabase configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qystmdysjemiqlqmhfbh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required');
  process.exit(1);
}

/**
 * RAG Knowledge Graph Manager with PostgreSQL backend
 */
class RAGKnowledgeGraphManager {
  constructor() {
    this.supabase = null;
    this.embeddingModel = null;
    this.modelInitialized = false;
  }

  async initialize() {
    console.error('🚀 Initializing RAG Memory PostgreSQL MCP Server...');
    
    // Initialize Supabase client
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.error('✅ Supabase client initialized');
    
    // Initialize embedding model
    await this.initializeEmbeddingModel();
    
    console.error('✅ RAG Memory server ready');
  }

  async initializeEmbeddingModel() {
    try {
      console.error('🤖 Loading sentence transformer model...');
      this.embeddingModel = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L12-v2'
      );
      this.modelInitialized = true;
      console.error('✅ Embedding model loaded');
    } catch (error) {
      console.error('⚠️  Embedding model failed to load:', error.message);
      this.modelInitialized = false;
    }
  }

  /**
   * Generate embedding vector for text
   */
  async generateEmbedding(text) {
    if (!this.modelInitialized) {
      return null;
    }
    
    try {
      const output = await this.embeddingModel(text, {
        pooling: 'mean',
        normalize: true,
      });
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error.message);
      return null;
    }
  }

  /**
   * Generate embedding text for an entity
   * Combines name, type, and observations into a single text
   */
  generateEntityEmbeddingText(entity) {
    const parts = [
      entity.name,
      entity.entityType || entity.entity_type || 'CONCEPT',
    ];
    
    if (entity.observations && entity.observations.length > 0) {
      parts.push(...entity.observations);
    }
    
    return parts.join(' ');
  }

  /**
   * Create entities in the knowledge graph
   */
  async createEntities(entities) {
    const results = [];
    
    for (const entity of entities) {
      const { data, error } = await this.supabase
        .from('rag_entities')
        .insert({
          name: entity.name,
          entity_type: entity.entityType || 'CONCEPT',
          observations: entity.observations || [],
          metadata: {},
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') { // Unique violation
          results.push({ success: false, entity: entity.name, error: 'Entity already exists' });
        } else {
          results.push({ success: false, entity: entity.name, error: error.message });
        }
      } else {
        results.push({ success: true, entity: data.name, id: data.id });
        
        // Generate and store embedding
        if (this.modelInitialized) {
          const embeddingText = `${data.name} ${data.entity_type} ${data.observations.join(' ')}`;
          const embedding = await this.generateEmbedding(embeddingText);
          
          if (embedding) {
            await this.supabase
              .from('rag_entity_embeddings')
              .upsert({
                entity_id: data.id,
                embedding: JSON.stringify(embedding),
              });
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Create relationships between entities
   */
  async createRelations(relations) {
    const results = [];
    
    for (const relation of relations) {
      // Get entity IDs by name
      const { data: sourceEntity } = await this.supabase
        .from('rag_entities')
        .select('id')
        .eq('name', relation.from)
        .single();
      
      const { data: targetEntity } = await this.supabase
        .from('rag_entities')
        .select('id')
        .eq('name', relation.to)
        .single();
      
      if (!sourceEntity || !targetEntity) {
        results.push({
          success: false,
          relation: `${relation.from} -> ${relation.to}`,
          error: 'Source or target entity not found',
        });
        continue;
      }
      
      const { data, error } = await this.supabase
        .from('rag_relationships')
        .insert({
          source_entity: sourceEntity.id,
          target_entity: targetEntity.id,
          relation_type: relation.relationType,
          confidence: 1.0,
          metadata: {},
        })
        .select();
      
      if (error) {
        results.push({
          success: false,
          relation: `${relation.from} -> ${relation.to}`,
          error: error.message,
        });
      } else {
        results.push({
          success: true,
          relation: `${relation.from} -[${relation.relationType}]-> ${relation.to}`,
        });
      }
    }
    
    return results;
  }

  /**
   * Add observations to existing entities
   */
  async addObservations(observations) {
    const results = [];
    
    for (const obs of observations) {
      const { data: entity } = await this.supabase
        .from('rag_entities')
        .select('id, observations')
        .eq('name', obs.entityName)
        .single();
      
      if (!entity) {
        results.push({
          success: false,
          entity: obs.entityName,
          error: 'Entity not found',
        });
        continue;
      }
      
      const updatedObservations = [...entity.observations, ...obs.contents];
      
      const { error } = await this.supabase
        .from('rag_entities')
        .update({ observations: updatedObservations })
        .eq('id', entity.id);
      
      if (error) {
        results.push({
          success: false,
          entity: obs.entityName,
          error: error.message,
        });
      } else {
        results.push({
          success: true,
          entity: obs.entityName,
          added: obs.contents.length,
        });
      }
    }
    
    return results;
  }

  /**
   * Search entities by name or type
   */
  async searchNodes(query, limit = 10) {
    const { data, error } = await this.supabase
      .from('rag_entities')
      .select('*')
      .or(`name.ilike.%${query}%,entity_type.ilike.%${query}%`)
      .limit(limit);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  /**
   * Get specific entities by name
   */
  async openNodes(names) {
    const { data, error } = await this.supabase
      .from('rag_entities')
      .select('*')
      .in('name', names);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  /**
   * Store a document
   */
  async storeDocument(id, content, metadata = {}) {
    const { data, error } = await this.supabase
      .from('rag_documents')
      .upsert({
        id,
        content,
        metadata,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  /**
   * Process document with full pipeline: store → chunk → embed
   * 
   * This is the recommended way to add documents - it performs all steps automatically.
   * 
   * @param {string} id - Unique document identifier
   * @param {string} content - Document content
   * @param {object} options - Processing options
   * @param {number} options.maxChunkSize - Max chunk size (default: 500)
   * @param {number} options.overlap - Chunk overlap (default: 50)
   * @param {object} options.metadata - Document metadata
   * @returns {object} Processing results with document, chunks, and embedding stats
   */
  async processDocument(id, content, options = {}) {
    const { maxChunkSize = 500, overlap = 50, metadata = {} } = options;
    const results = {
      documentId: id,
      steps: [],
      success: true,
    };

    try {
      // Step 1: Store document
      console.error(`📄 Step 1/3: Storing document "${id}"...`);
      const doc = await this.storeDocument(id, content, metadata);
      results.steps.push({ step: 'store', status: 'success', documentId: id });

      // Step 2: Chunk document
      console.error(`🔪 Step 2/3: Chunking document...`);
      const chunkResult = await this.chunkDocument(id, { maxChunkSize, overlap });
      results.steps.push({ 
        step: 'chunk', 
        status: 'success', 
        chunksCreated: chunkResult.chunks.length 
      });
      results.chunksCreated = chunkResult.chunks.length;

      // Step 3: Embed chunks
      console.error(`🔮 Step 3/3: Generating embeddings...`);
      if (this.modelInitialized) {
        const embedResult = await this.embedChunks(id);
        results.steps.push({ 
          step: 'embed', 
          status: 'success', 
          embeddedChunks: embedResult.embeddedChunks 
        });
        results.embeddedChunks = embedResult.embeddedChunks;
      } else {
        results.steps.push({ 
          step: 'embed', 
          status: 'skipped', 
          reason: 'Embedding model not initialized' 
        });
        results.embeddedChunks = 0;
      }

      console.error(`✅ Document "${id}" fully processed!`);
      return results;

    } catch (error) {
      results.success = false;
      results.error = error.message;
      console.error(`❌ Error processing document "${id}":`, error.message);
      return results;
    }
  }

  /**
   * List all documents
   */
  async listDocuments(includeMetadata = true) {
    const select = includeMetadata ? '*' : 'id, created_at';
    
    const { data, error } = await this.supabase
      .from('rag_documents')
      .select(select)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  /**
   * Get knowledge graph statistics
   */
  async getKnowledgeGraphStats() {
    const { data, error } = await this.supabase
      .from('rag_stats')
      .select('*')
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  /**
   * Hybrid search (semantic + graph)
   */
  async hybridSearch(query, limit = 5) {
    // For now, do text search on documents
    const { data, error } = await this.supabase
      .from('rag_documents')
      .select('id, content, metadata, created_at')
      .textSearch('content', query)
      .limit(limit);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  /**
   * Delete entities by name
   */
  async deleteEntities(entityNames) {
    const results = {
      deleted: [],
      notFound: [],
      errors: [],
    };

    for (const name of entityNames) {
      try {
        // First, get the entity ID
        const { data: entity, error: findError } = await this.supabase
          .from('rag_entities')
          .select('id')
          .eq('name', name)
          .single();

        if (findError || !entity) {
          results.notFound.push(name);
          continue;
        }

        // Delete relationships where this entity is source or target
        await this.supabase
          .from('rag_relationships')
          .delete()
          .or(`source_entity.eq.${entity.id},target_entity.eq.${entity.id}`);

        // Delete the entity itself
        const { error: deleteError } = await this.supabase
          .from('rag_entities')
          .delete()
          .eq('id', entity.id);

        if (deleteError) {
          results.errors.push({ entity: name, error: deleteError.message });
        } else {
          results.deleted.push(name);
        }
      } catch (error) {
        results.errors.push({ entity: name, error: error.message });
      }
    }

    return results;
  }

  /**
   * Delete specific relationships
   */
  async deleteRelations(relations) {
    const results = {
      deleted: [],
      notFound: [],
      errors: [],
    };

    for (const rel of relations) {
      try {
        // Get source entity ID
        const { data: sourceEntity } = await this.supabase
          .from('rag_entities')
          .select('id')
          .eq('name', rel.from)
          .single();

        // Get target entity ID
        const { data: targetEntity } = await this.supabase
          .from('rag_entities')
          .select('id')
          .eq('name', rel.to)
          .single();

        if (!sourceEntity || !targetEntity) {
          results.notFound.push(rel);
          continue;
        }

        // Delete the relationship
        const { error: deleteError } = await this.supabase
          .from('rag_relationships')
          .delete()
          .eq('source_entity', sourceEntity.id)
          .eq('target_entity', targetEntity.id)
          .eq('relation_type', rel.relationType);

        if (deleteError) {
          results.errors.push({ relation: rel, error: deleteError.message });
        } else {
          results.deleted.push(rel);
        }
      } catch (error) {
        results.errors.push({ relation: rel, error: error.message });
      }
    }

    return results;
  }

  /**
   * Delete specific observations from entities
   */
  async deleteObservations(deletions) {
    const results = {
      deleted: [],
      notFound: [],
      errors: [],
    };

    for (const deletion of deletions) {
      try {
        // Get the entity
        const { data: entity, error: findError } = await this.supabase
          .from('rag_entities')
          .select('id, observations')
          .eq('name', deletion.entityName)
          .single();

        if (findError || !entity) {
          results.notFound.push(deletion.entityName);
          continue;
        }

        // Filter out the observations to delete
        const currentObs = entity.observations || [];
        const updatedObs = currentObs.filter(
          obs => !deletion.observations.includes(obs)
        );

        // Update the entity with filtered observations
        const { error: updateError } = await this.supabase
          .from('rag_entities')
          .update({ observations: updatedObs })
          .eq('id', entity.id);

        if (updateError) {
          results.errors.push({ entity: deletion.entityName, error: updateError.message });
        } else {
          results.deleted.push({
            entity: deletion.entityName,
            removedCount: currentObs.length - updatedObs.length,
          });
        }
      } catch (error) {
        results.errors.push({ entity: deletion.entityName, error: error.message });
      }
    }

    return results;
  }

  /**
   * Chunk a document into smaller pieces
   */
  async chunkDocument(documentId, options = {}) {
    const { maxChunkSize = 500, overlap = 50 } = options;

    // Get the document
    const { data: doc, error: docError } = await this.supabase
      .from('rag_documents')
      .select('content')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    console.error(`🔪 Chunking document: ${documentId}`);

    // Simple chunking by character count with overlap
    const text = doc.content;
    const chunks = [];
    let startPos = 0;
    let chunkIndex = 0;

    while (startPos < text.length) {
      const endPos = Math.min(startPos + maxChunkSize, text.length);
      const chunkText = text.substring(startPos, endPos);

      // Store chunk in database
      const { error: insertError } = await this.supabase
        .from('rag_chunks')
        .insert({
          document_id: documentId,
          chunk_index: chunkIndex,
          content: chunkText,
          start_pos: startPos,
          end_pos: endPos,
        });

      if (!insertError) {
        chunks.push({
          index: chunkIndex,
          text: chunkText,
          startPos,
          endPos,
        });
      }

      startPos += maxChunkSize - overlap;
      chunkIndex++;
    }

    console.error(`✅ Created ${chunks.length} chunks`);
    return { documentId, chunks };
  }

  /**
   * Generate embeddings for document chunks
   */
  async embedChunks(documentId) {
    if (!this.modelInitialized) {
      throw new Error('Embedding model not initialized');
    }

    console.error(`🔮 Embedding chunks for document: ${documentId}`);

    // Get all chunks for the document
    const { data: chunks, error } = await this.supabase
      .from('rag_chunks')
      .select('id, content')
      .eq('document_id', documentId);

    if (error || !chunks || chunks.length === 0) {
      throw new Error(`No chunks found for document ${documentId}. Run chunkDocument first.`);
    }

    let embeddedCount = 0;

    for (const chunk of chunks) {
      try {
        const embedding = await this.generateEmbedding(chunk.content);

        // Update chunk with embedding
        const { error: updateError } = await this.supabase
          .from('rag_chunks')
          .update({ embedding })
          .eq('id', chunk.id);

        if (!updateError) {
          embeddedCount++;
        }
      } catch (error) {
        console.error(`Failed to embed chunk ${chunk.id}:`, error.message);
      }
    }

    console.error(`✅ Embedded ${embeddedCount}/${chunks.length} chunks`);
    return { documentId, embeddedChunks: embeddedCount, totalChunks: chunks.length };
  }

  /**
   * Generate embeddings for all entities
   */
  async embedAllEntities() {
    if (!this.modelInitialized) {
      throw new Error('Embedding model not initialized');
    }

    console.error('🔮 Generating embeddings for all entities...');

    // Get all entities
    const { data: entities, error } = await this.supabase
      .from('rag_entities')
      .select('id, name, entity_type, observations');

    if (error || !entities) {
      throw new Error('Failed to fetch entities');
    }

    let embeddedCount = 0;

    for (const entity of entities) {
      try {
        const embeddingText = this.generateEntityEmbeddingText({
          name: entity.name,
          entityType: entity.entity_type,
          observations: entity.observations || [],
        });

        const embedding = await this.generateEmbedding(embeddingText);

        // Store embedding in entity_embeddings table
        const { error: insertError } = await this.supabase
          .from('rag_entity_embeddings')
          .upsert({
            entity_id: entity.id,
            embedding,
            embedding_text: embeddingText,
          });

        if (!insertError) {
          embeddedCount++;
        }
      } catch (error) {
        console.error(`Failed to embed entity ${entity.name}:`, error.message);
      }
    }

    console.error(`✅ Embedded ${embeddedCount}/${entities.length} entities`);
    return { totalEntities: entities.length, embeddedEntities: embeddedCount };
  }

  /**
   * Extract key terms from a document
   */
  async extractTerms(documentId, options = {}) {
    const { minLength = 3, includeCapitalized = true } = options;

    // Get document
    const { data: doc, error } = await this.supabase
      .from('rag_documents')
      .select('content')
      .eq('id', documentId)
      .single();

    if (error || !doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    console.error(`🔍 Extracting terms from document: ${documentId}`);

    const terms = new Set();
    const text = doc.content;

    // Extract capitalized words (potential entities)
    if (includeCapitalized) {
      const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
      capitalizedWords.forEach(term => {
        if (term.length >= minLength) {
          terms.add(term.trim());
        }
      });
    }

    const termArray = Array.from(terms);
    console.error(`✅ Extracted ${termArray.length} terms`);

    return { documentId, terms: termArray };
  }

  /**
   * Link entities to a document
   */
  async linkEntitiesToDocument(documentId, entityNames) {
    console.error(`🔗 Linking entities to document: ${documentId}`);

    // Verify document exists
    const { data: doc, error: docError } = await this.supabase
      .from('rag_documents')
      .select('id')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Get chunks for this document
    const { data: chunks } = await this.supabase
      .from('rag_chunks')
      .select('id')
      .eq('document_id', documentId);

    let linkedCount = 0;

    for (const entityName of entityNames) {
      // Find entity
      const { data: entity } = await this.supabase
        .from('rag_entities')
        .select('id')
        .eq('name', entityName)
        .single();

      if (!entity) {
        console.warn(`Entity ${entityName} not found, skipping`);
        continue;
      }

      // Link entity to all chunks of the document
      if (chunks && chunks.length > 0) {
        for (const chunk of chunks) {
          await this.supabase
            .from('rag_chunk_entities')
            .upsert({
              chunk_id: chunk.id,
              entity_id: entity.id,
            }, {
              onConflict: 'chunk_id,entity_id'
            });
        }
        linkedCount++;
      }
    }

    console.error(`✅ Linked ${linkedCount} entities to document`);
    return { documentId, linkedEntities: linkedCount };
  }

  /**
   * Get detailed context for a query (combines semantic + graph search)
   */
  async getDetailedContext(query, options = {}) {
    const { limit = 5, includeEntities = true } = options;

    console.error(`🔍 Getting detailed context for: "${query}"`);

    const results = {
      query,
      documents: [],
      entities: [],
      relationships: [],
    };

    // 1. Semantic search on documents
    const { data: docs } = await this.supabase
      .from('rag_documents')
      .select('id, content, metadata')
      .textSearch('content', query)
      .limit(limit);

    if (docs) {
      results.documents = docs;
    }

    // 2. Search entities if requested
    if (includeEntities) {
      const { data: entities } = await this.supabase
        .from('rag_entities')
        .select('name, entity_type, observations')
        .ilike('name', `%${query}%`)
        .limit(limit);

      if (entities) {
        results.entities = entities;

        // 3. Get relationships for found entities
        const entityIds = entities.map(e => e.id).filter(Boolean);
        if (entityIds.length > 0) {
          const { data: rels } = await this.supabase
            .from('rag_relationships')
            .select('*')
            .in('source_entity', entityIds)
            .limit(limit);

          if (rels) {
            results.relationships = rels;
          }
        }
      }
    }

    console.error(`✅ Found ${results.documents.length} docs, ${results.entities.length} entities`);
    return results;
  }

  /**
   * Read the entire knowledge graph
   */
  async readGraph() {
    console.error('📖 Reading entire knowledge graph...');

    // Get all entities
    const { data: entities, error: entError } = await this.supabase
      .from('rag_entities')
      .select('*');

    // Get all relationships
    const { data: relationships, error: relError } = await this.supabase
      .from('rag_relationships')
      .select('*');

    if (entError || relError) {
      throw new Error('Failed to read graph');
    }

    console.error(`✅ Read ${entities?.length || 0} entities, ${relationships?.length || 0} relationships`);

    return {
      entities: entities || [],
      relationships: relationships || [],
    };
  }

  /**
   * Delete documents and their chunks
   */
  async deleteDocuments(documentIds) {
    console.error(`🗑️  Deleting ${documentIds.length} documents...`);

    const results = {
      deleted: [],
      notFound: [],
      errors: [],
    };

    for (const docId of documentIds) {
      try {
        // Delete chunks first
        await this.supabase
          .from('rag_chunks')
          .delete()
          .eq('document_id', docId);

        // Delete document
        const { error } = await this.supabase
          .from('rag_documents')
          .delete()
          .eq('id', docId);

        if (error) {
          results.errors.push({ document: docId, error: error.message });
        } else {
          results.deleted.push(docId);
        }
      } catch (error) {
        results.errors.push({ document: docId, error: error.message });
      }
    }

    console.error(`✅ Deleted ${results.deleted.length} documents`);
    return results;
  }
}

// Initialize server
const server = new Server(
  {
    name: 'rag-memory-pg',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const manager = new RAGKnowledgeGraphManager();

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'createEntities',
        description: 'Create new entities in the knowledge graph',
        inputSchema: {
          type: 'object',
          properties: {
            entities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  entityType: { type: 'string' },
                  observations: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['name', 'entityType', 'observations'],
              },
            },
          },
          required: ['entities'],
        },
      },
      {
        name: 'createRelations',
        description: 'Create relationships between entities',
        inputSchema: {
          type: 'object',
          properties: {
            relations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string' },
                  to: { type: 'string' },
                  relationType: { type: 'string' },
                },
                required: ['from', 'to', 'relationType'],
              },
            },
          },
          required: ['relations'],
        },
      },
      {
        name: 'addObservations',
        description: 'Add observations to existing entities',
        inputSchema: {
          type: 'object',
          properties: {
            observations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entityName: { type: 'string' },
                  contents: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['entityName', 'contents'],
              },
            },
          },
          required: ['observations'],
        },
      },
      {
        name: 'searchNodes',
        description: 'Search for entities by name or type',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            limit: { type: 'number', default: 10 },
          },
          required: ['query'],
        },
      },
      {
        name: 'openNodes',
        description: 'Get specific entities by name',
        inputSchema: {
          type: 'object',
          properties: {
            names: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['names'],
        },
      },
      {
        name: 'storeDocument',
        description: 'Store a document in the RAG system (without chunking/embedding - use processDocument for full pipeline)',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            metadata: { type: 'object' },
          },
          required: ['id', 'content'],
        },
      },
      {
        name: 'processDocument',
        description: 'RECOMMENDED: Store document with full processing pipeline (store → chunk → embed). Use this instead of separate storeDocument/chunkDocument/embedChunks calls.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique document identifier' },
            content: { type: 'string', description: 'Document content to process' },
            maxChunkSize: { type: 'number', default: 500, description: 'Maximum chunk size in characters' },
            overlap: { type: 'number', default: 50, description: 'Overlap between chunks in characters' },
            metadata: { type: 'object', description: 'Optional metadata for the document' },
          },
          required: ['id', 'content'],
        },
      },
      {
        name: 'listDocuments',
        description: 'List all documents',
        inputSchema: {
          type: 'object',
          properties: {
            includeMetadata: { type: 'boolean', default: true },
          },
        },
      },
      {
        name: 'hybridSearch',
        description: 'Search documents using hybrid search',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            limit: { type: 'number', default: 5 },
          },
          required: ['query'],
        },
      },
      {
        name: 'getKnowledgeGraphStats',
        description: 'Get statistics about the knowledge graph',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'deleteEntities',
        description: 'Delete multiple entities and their associated relationships from the knowledge graph',
        inputSchema: {
          type: 'object',
          properties: {
            entityNames: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of exact entity names to permanently delete',
            },
          },
          required: ['entityNames'],
        },
      },
      {
        name: 'deleteRelations',
        description: 'Delete specific relationships from the knowledge graph while preserving the entities themselves',
        inputSchema: {
          type: 'object',
          properties: {
            relations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string', description: 'Name of the source entity in the relationship to delete' },
                  to: { type: 'string', description: 'Name of the target entity in the relationship to delete' },
                  relationType: { type: 'string', description: 'Type of relationship to delete' },
                },
                required: ['from', 'to', 'relationType'],
              },
              description: 'Array of specific relationships to delete',
            },
          },
          required: ['relations'],
        },
      },
      {
        name: 'deleteObservations',
        description: 'Delete specific observations from entities while preserving the entities and other observations',
        inputSchema: {
          type: 'object',
          properties: {
            deletions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entityName: { type: 'string', description: 'Name of the entity containing observations to delete' },
                  observations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of exact observation texts to remove',
                  },
                },
                required: ['entityName', 'observations'],
              },
              description: 'Array of observation deletion specifications',
            },
          },
          required: ['deletions'],
        },
      },
      {
        name: 'chunkDocument',
        description: 'Split a document into chunks for processing',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'ID of the document to chunk' },
            maxChunkSize: { type: 'number', default: 500, description: 'Maximum size of each chunk in characters' },
            overlap: { type: 'number', default: 50, description: 'Overlap between chunks in characters' },
          },
          required: ['documentId'],
        },
      },
      {
        name: 'embedChunks',
        description: 'Generate embeddings for document chunks (run chunkDocument first)',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'ID of the document whose chunks to embed' },
          },
          required: ['documentId'],
        },
      },
      {
        name: 'embedAllEntities',
        description: 'Generate embeddings for all entities in the knowledge graph',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'extractTerms',
        description: 'Extract key terms from a document',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'ID of the document to extract terms from' },
            minLength: { type: 'number', default: 3, description: 'Minimum term length' },
            includeCapitalized: { type: 'boolean', default: true, description: 'Include capitalized words' },
          },
          required: ['documentId'],
        },
      },
      {
        name: 'linkEntitiesToDocument',
        description: 'Link entities to a document',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'ID of the document' },
            entityNames: {
              type: 'array',
              items: { type: 'string' },
              description: 'Names of entities to link',
            },
          },
          required: ['documentId', 'entityNames'],
        },
      },
      {
        name: 'getDetailedContext',
        description: 'Get detailed context for a query (combines semantic + graph search)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', default: 5, description: 'Maximum results per category' },
            includeEntities: { type: 'boolean', default: true, description: 'Include entity search' },
          },
          required: ['query'],
        },
      },
      {
        name: 'readGraph',
        description: 'Read the entire knowledge graph (all entities and relationships)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'deleteDocuments',
        description: 'Delete documents and their chunks',
        inputSchema: {
          type: 'object',
          properties: {
            documentIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of document IDs to delete',
            },
          },
          required: ['documentIds'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'createEntities':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.createEntities(args.entities), null, 2),
            },
          ],
        };

      case 'createRelations':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.createRelations(args.relations), null, 2),
            },
          ],
        };

      case 'addObservations':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.addObservations(args.observations), null, 2),
            },
          ],
        };

      case 'searchNodes':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.searchNodes(args.query, args.limit), null, 2),
            },
          ],
        };

      case 'openNodes':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.openNodes(args.names), null, 2),
            },
          ],
        };

      case 'storeDocument':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await manager.storeDocument(args.id, args.content, args.metadata || {}),
                null,
                2
              ),
            },
          ],
        };

      case 'processDocument':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await manager.processDocument(args.id, args.content, {
                  maxChunkSize: args.maxChunkSize,
                  overlap: args.overlap,
                  metadata: args.metadata || {},
                }),
                null,
                2
              ),
            },
          ],
        };

      case 'listDocuments':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await manager.listDocuments(args.includeMetadata !== false),
                null,
                2
              ),
            },
          ],
        };

      case 'hybridSearch':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.hybridSearch(args.query, args.limit || 5), null, 2),
            },
          ],
        };

      case 'getKnowledgeGraphStats':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.getKnowledgeGraphStats(), null, 2),
            },
          ],
        };

      case 'deleteEntities':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.deleteEntities(args.entityNames), null, 2),
            },
          ],
        };

      case 'deleteRelations':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.deleteRelations(args.relations), null, 2),
            },
          ],
        };

      case 'deleteObservations':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.deleteObservations(args.deletions), null, 2),
            },
          ],
        };

      case 'chunkDocument':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await manager.chunkDocument(args.documentId, {
                  maxChunkSize: args.maxChunkSize,
                  overlap: args.overlap,
                }),
                null,
                2
              ),
            },
          ],
        };

      case 'embedChunks':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.embedChunks(args.documentId), null, 2),
            },
          ],
        };

      case 'embedAllEntities':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.embedAllEntities(), null, 2),
            },
          ],
        };

      case 'extractTerms':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await manager.extractTerms(args.documentId, {
                  minLength: args.minLength,
                  includeCapitalized: args.includeCapitalized,
                }),
                null,
                2
              ),
            },
          ],
        };

      case 'linkEntitiesToDocument':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await manager.linkEntitiesToDocument(args.documentId, args.entityNames),
                null,
                2
              ),
            },
          ],
        };

      case 'getDetailedContext':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await manager.getDetailedContext(args.query, {
                  limit: args.limit,
                  includeEntities: args.includeEntities,
                }),
                null,
                2
              ),
            },
          ],
        };

      case 'readGraph':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.readGraph(), null, 2),
            },
          ],
        };

      case 'deleteDocuments':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await manager.deleteDocuments(args.documentIds), null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  await manager.initialize();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('🎉 RAG Memory PostgreSQL MCP Server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

