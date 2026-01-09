/**
 * RAG Knowledge Graph Manager
 * 
 * Core class for managing knowledge graph with PostgreSQL/Supabase backend.
 * Handles entities, relationships, documents, and embeddings.
 * 
 * @module manager
 */

import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@huggingface/transformers';
import OpenAI from 'openai';

/**
 * RAG Knowledge Graph Manager with PostgreSQL backend
 */
export class RAGKnowledgeGraphManager {
  constructor(supabaseUrl, supabaseKey) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.supabase = null;
    this.embeddingModel = null;
    this.modelInitialized = false;
    
    // Embedding mode configuration (local or openai)
    this.mode = (process.env.MODE || 'local').toLowerCase();
    this.openaiClient = null;
    
    // Initialize OpenAI if mode is openai
    if (this.mode === 'openai' && process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.error('🌐 Using OpenAI embeddings (text-embedding-3-small, 384 dims)');
    } else if (this.mode === 'openai') {
      console.error('⚠️  MODE=openai but OPENAI_API_KEY not set, falling back to local');
      this.mode = 'local';
    }
  }

  /**
   * Initialize Supabase client and embedding model
   */
  async initialize() {
    console.error('🚀 Initializing RAG Memory PostgreSQL MCP Server...');
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    console.error('✅ Supabase client initialized');
    
    await this.initializeEmbeddingModel();
    
    console.error('✅ RAG Memory server ready');
  }

  /**
   * Initialize the embedding model (HuggingFace Transformers for local mode)
   */
  async initializeEmbeddingModel() {
    // Skip local model initialization if using OpenAI
    if (this.mode === 'openai') {
      this.modelInitialized = true;
      console.error('✅ OpenAI embeddings ready');
      return;
    }
    
    // Load local HuggingFace model
    try {
      console.error('🤖 Loading local sentence transformer model...');
      this.embeddingModel = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L12-v2'
      );
      this.modelInitialized = true;
      console.error('✅ Local embedding model loaded (384 dims)');
    } catch (error) {
      console.error('⚠️  Embedding model failed to load:', error.message);
      this.modelInitialized = false;
    }
  }

  /**
   * Generate embedding vector for text
   * 
   * Uses either OpenAI (text-embedding-3-small) or local HuggingFace model.
   * Both produce 384-dimensional vectors for backward compatibility.
   * 
   * @param {string} text - Text to embed
   * @returns {number[]|null} 384-dimensional embedding vector or null if failed
   */
  async generateEmbedding(text) {
    if (!this.modelInitialized) {
      return null;
    }
    
    try {
      // OpenAI embeddings (faster, cloud-based)
      if (this.mode === 'openai' && this.openaiClient) {
        const response = await this.openaiClient.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
          dimensions: 384, // Match local model dimensions for compatibility
        });
        return response.data[0].embedding;
      }
      
      // Local HuggingFace embeddings (slower, privacy-focused)
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
   * 
   * @param {object} entity - Entity object
   * @returns {string} Combined text for embedding
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

  // ==================== ENTITY METHODS ====================

  /**
   * Create entities in the knowledge graph
   * 
   * @param {object[]} entities - Array of entity objects
   * @returns {object[]} Results array with success/error for each entity
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
        if (error.code === '23505') {
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
   * 
   * @param {object[]} relations - Array of relation objects {from, to, relationType}
   * @returns {object[]} Results array
   */
  async createRelations(relations) {
    const results = [];
    
    for (const relation of relations) {
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
      
      const { error } = await this.supabase
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
   * 
   * @param {object[]} observations - Array of {entityName, contents[]}
   * @returns {object[]} Results array
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
   * 
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {object[]} Matching entities
   */
  async searchNodes(query, limit = 10) {
    const { data, error } = await this.supabase
      .from('rag_entities')
      .select('*')
      .or(`name.ilike.%${query}%,entity_type.ilike.%${query}%`)
      .limit(limit);
    
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Get specific entities by name
   * 
   * @param {string[]} names - Entity names
   * @returns {object[]} Entities
   */
  async openNodes(names) {
    const { data, error } = await this.supabase
      .from('rag_entities')
      .select('*')
      .in('name', names);
    
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Delete entities by name
   * 
   * @param {string[]} entityNames - Names to delete
   * @returns {object} Results with deleted/notFound/errors
   */
  async deleteEntities(entityNames) {
    const results = { deleted: [], notFound: [], errors: [] };

    for (const name of entityNames) {
      try {
        const { data: entity, error: findError } = await this.supabase
          .from('rag_entities')
          .select('id')
          .eq('name', name)
          .single();

        if (findError || !entity) {
          results.notFound.push(name);
          continue;
        }

        await this.supabase
          .from('rag_relationships')
          .delete()
          .or(`source_entity.eq.${entity.id},target_entity.eq.${entity.id}`);

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
   * 
   * @param {object[]} relations - Relations to delete
   * @returns {object} Results
   */
  async deleteRelations(relations) {
    const results = { deleted: [], notFound: [], errors: [] };

    for (const rel of relations) {
      try {
        const { data: sourceEntity } = await this.supabase
          .from('rag_entities')
          .select('id')
          .eq('name', rel.from)
          .single();

        const { data: targetEntity } = await this.supabase
          .from('rag_entities')
          .select('id')
          .eq('name', rel.to)
          .single();

        if (!sourceEntity || !targetEntity) {
          results.notFound.push(rel);
          continue;
        }

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
   * 
   * @param {object[]} deletions - Deletions to perform
   * @returns {object} Results
   */
  async deleteObservations(deletions) {
    const results = { deleted: [], notFound: [], errors: [] };

    for (const deletion of deletions) {
      try {
        const { data: entity, error: findError } = await this.supabase
          .from('rag_entities')
          .select('id, observations')
          .eq('name', deletion.entityName)
          .single();

        if (findError || !entity) {
          results.notFound.push(deletion.entityName);
          continue;
        }

        const currentObs = entity.observations || [];
        const updatedObs = currentObs.filter(
          obs => !deletion.observations.includes(obs)
        );

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

  // ==================== DOCUMENT METHODS ====================

  /**
   * Store a document
   * 
   * @param {string} id - Document ID
   * @param {string} content - Document content
   * @param {object} metadata - Optional metadata
   * @returns {object} Stored document
   */
  async storeDocument(id, content, metadata = {}) {
    const { data, error } = await this.supabase
      .from('rag_documents')
      .upsert({ id, content, metadata })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Process document with full pipeline: store → chunk → embed
   * 
   * @param {string} id - Document ID
   * @param {string} content - Document content
   * @param {object} options - Processing options
   * @returns {object} Processing results
   */
  async processDocument(id, content, options = {}) {
    const { maxChunkSize = 500, overlap = 50, metadata = {} } = options;
    const results = { documentId: id, steps: [], success: true };

    try {
      console.error(`📄 Step 1/3: Storing document "${id}"...`);
      await this.storeDocument(id, content, metadata);
      results.steps.push({ step: 'store', status: 'success', documentId: id });

      console.error(`🔪 Step 2/3: Chunking document...`);
      const chunkResult = await this.chunkDocument(id, { maxChunkSize, overlap });
      results.steps.push({ step: 'chunk', status: 'success', chunksCreated: chunkResult.chunks.length });
      results.chunksCreated = chunkResult.chunks.length;

      console.error(`🔮 Step 3/3: Generating embeddings...`);
      if (this.modelInitialized) {
        const embedResult = await this.embedChunks(id);
        results.steps.push({ step: 'embed', status: 'success', embeddedChunks: embedResult.embeddedChunks });
        results.embeddedChunks = embedResult.embeddedChunks;
      } else {
        results.steps.push({ step: 'embed', status: 'skipped', reason: 'Embedding model not initialized' });
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
   * 
   * @param {boolean} includeMetadata - Include metadata in results
   * @returns {object[]} Documents
   */
  async listDocuments(includeMetadata = true) {
    const select = includeMetadata ? '*' : 'id, created_at';
    
    const { data, error } = await this.supabase
      .from('rag_documents')
      .select(select)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Delete documents and their chunks
   * 
   * @param {string[]} documentIds - IDs to delete
   * @returns {object} Results
   */
  async deleteDocuments(documentIds) {
    console.error(`🗑️  Deleting ${documentIds.length} documents...`);
    const results = { deleted: [], notFound: [], errors: [] };

    for (const docId of documentIds) {
      try {
        await this.supabase.from('rag_chunks').delete().eq('document_id', docId);
        
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

  // ==================== CHUNKING & EMBEDDING ====================

  /**
   * Chunk a document into smaller pieces
   * 
   * @param {string} documentId - Document ID
   * @param {object} options - Chunking options
   * @returns {object} Chunking results
   */
  async chunkDocument(documentId, options = {}) {
    const { maxChunkSize = 500, overlap = 50 } = options;

    const { data: doc, error: docError } = await this.supabase
      .from('rag_documents')
      .select('content')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    console.error(`🔪 Chunking document: ${documentId}`);

    const text = doc.content;
    const chunks = [];
    let startPos = 0;
    let chunkIndex = 0;

    while (startPos < text.length) {
      const endPos = Math.min(startPos + maxChunkSize, text.length);
      const chunkText = text.substring(startPos, endPos);

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
        chunks.push({ index: chunkIndex, text: chunkText, startPos, endPos });
      }

      startPos += maxChunkSize - overlap;
      chunkIndex++;
    }

    console.error(`✅ Created ${chunks.length} chunks`);
    return { documentId, chunks };
  }

  /**
   * Generate embeddings for document chunks
   * 
   * @param {string} documentId - Document ID
   * @returns {object} Embedding results
   */
  async embedChunks(documentId) {
    if (!this.modelInitialized) {
      throw new Error('Embedding model not initialized');
    }

    console.error(`🔮 Embedding chunks for document: ${documentId}`);

    const { data: chunks, error } = await this.supabase
      .from('rag_chunks')
      .select('id, content')
      .eq('document_id', documentId);

    if (error || !chunks || chunks.length === 0) {
      throw new Error(`No chunks found for document ${documentId}`);
    }

    let embeddedCount = 0;

    for (const chunk of chunks) {
      try {
        const embedding = await this.generateEmbedding(chunk.content);

        const { error: updateError } = await this.supabase
          .from('rag_chunks')
          .update({ embedding })
          .eq('id', chunk.id);

        if (!updateError) embeddedCount++;
      } catch (error) {
        console.error(`Failed to embed chunk ${chunk.id}:`, error.message);
      }
    }

    console.error(`✅ Embedded ${embeddedCount}/${chunks.length} chunks`);
    return { documentId, embeddedChunks: embeddedCount, totalChunks: chunks.length };
  }

  /**
   * Generate embeddings for all entities
   * 
   * @returns {object} Results
   */
  async embedAllEntities() {
    if (!this.modelInitialized) {
      throw new Error('Embedding model not initialized');
    }

    console.error('🔮 Generating embeddings for all entities...');

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

        const { error: insertError } = await this.supabase
          .from('rag_entity_embeddings')
          .upsert({
            entity_id: entity.id,
            embedding,
            embedding_text: embeddingText,
          });

        if (!insertError) embeddedCount++;
      } catch (error) {
        console.error(`Failed to embed entity ${entity.name}:`, error.message);
      }
    }

    console.error(`✅ Embedded ${embeddedCount}/${entities.length} entities`);
    return { totalEntities: entities.length, embeddedEntities: embeddedCount };
  }

  // ==================== SEARCH & RETRIEVAL ====================

  /**
   * Hybrid search (semantic + text)
   * 
   * Searches documents using case-insensitive pattern matching.
   * Splits query into keywords and finds documents containing ANY keyword.
   * 
   * @param {string} query - Search query (space-separated keywords)
   * @param {number} limit - Max results
   * @returns {object[]} Search results sorted by relevance
   * 
   * @example
   * hybridSearch('authentication jwt')
   * hybridSearch('Unity architecture patterns')
   */
  async hybridSearch(query, limit = 5) {
    // Extract meaningful keywords (3+ chars)
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length >= 3)
      .slice(0, 5); // Limit to 5 keywords for performance

    if (keywords.length === 0) {
      return [];
    }

    // Search for documents containing any keyword
    let queryBuilder = this.supabase
      .from('rag_documents')
      .select('id, content, metadata, created_at');

    // Build OR condition for keywords
    const orConditions = keywords.map(kw => `content.ilike.%${kw}%`).join(',');
    queryBuilder = queryBuilder.or(orConditions);

    const { data, error } = await queryBuilder.limit(limit * 2); // Get more for ranking

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];

    // Rank by keyword match count
    const ranked = data.map(doc => {
      const contentLower = doc.content.toLowerCase();
      const matchCount = keywords.filter(kw => contentLower.includes(kw)).length;
      return { ...doc, _matchCount: matchCount };
    });

    // Sort by match count and return top results
    ranked.sort((a, b) => b._matchCount - a._matchCount);
    return ranked.slice(0, limit).map(({ _matchCount, ...doc }) => doc);
  }

  /**
   * Get detailed context for a query
   * 
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {object} Context with documents, entities, relationships
   */
  async getDetailedContext(query, options = {}) {
    const { limit = 5, includeEntities = true } = options;

    console.error(`🔍 Getting detailed context for: "${query}"`);

    const results = { query, documents: [], entities: [], relationships: [] };

    // Extract keywords for search
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length >= 3)
      .slice(0, 5);

    if (keywords.length > 0) {
      let docQuery = this.supabase
        .from('rag_documents')
        .select('id, content, metadata');
      
      const orConditions = keywords.map(kw => `content.ilike.%${kw}%`).join(',');
      docQuery = docQuery.or(orConditions);

      const { data: docs } = await docQuery.limit(limit);
      if (docs) results.documents = docs;
    }

    if (includeEntities) {
      const { data: entities } = await this.supabase
        .from('rag_entities')
        .select('name, entity_type, observations')
        .ilike('name', `%${query}%`)
        .limit(limit);

      if (entities) {
        results.entities = entities;

        const entityIds = entities.map(e => e.id).filter(Boolean);
        if (entityIds.length > 0) {
          const { data: rels } = await this.supabase
            .from('rag_relationships')
            .select('*')
            .in('source_entity', entityIds)
            .limit(limit);

          if (rels) results.relationships = rels;
        }
      }
    }

    console.error(`✅ Found ${results.documents.length} docs, ${results.entities.length} entities`);
    return results;
  }

  /**
   * Read the entire knowledge graph
   * 
   * @returns {object} Graph with entities and relationships
   */
  async readGraph() {
    console.error('📖 Reading entire knowledge graph...');

    const { data: entities, error: entError } = await this.supabase
      .from('rag_entities')
      .select('*');

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

  // ==================== UTILITIES ====================

  /**
   * Get knowledge graph statistics
   * 
   * @returns {object} Statistics
   */
  async getKnowledgeGraphStats() {
    const { data, error } = await this.supabase
      .from('rag_stats')
      .select('*')
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Extract key terms from a document
   * 
   * @param {string} documentId - Document ID
   * @param {object} options - Extraction options
   * @returns {object} Extracted terms
   */
  async extractTerms(documentId, options = {}) {
    const { minLength = 3, includeCapitalized = true } = options;

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
   * 
   * @param {string} documentId - Document ID
   * @param {string[]} entityNames - Entity names to link
   * @returns {object} Link results
   */
  async linkEntitiesToDocument(documentId, entityNames) {
    console.error(`🔗 Linking entities to document: ${documentId}`);

    const { data: doc, error: docError } = await this.supabase
      .from('rag_documents')
      .select('id')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    const { data: chunks } = await this.supabase
      .from('rag_chunks')
      .select('id')
      .eq('document_id', documentId);

    let linkedCount = 0;

    for (const entityName of entityNames) {
      const { data: entity } = await this.supabase
        .from('rag_entities')
        .select('id')
        .eq('name', entityName)
        .single();

      if (!entity) {
        console.warn(`Entity ${entityName} not found, skipping`);
        continue;
      }

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
}
