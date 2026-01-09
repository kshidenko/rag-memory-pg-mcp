/**
 * MCP Tool Handlers
 * 
 * Handles incoming tool calls and routes them to the appropriate manager methods.
 * 
 * @module handlers
 */

/**
 * Handle a tool call and return the result
 * 
 * @param {string} name - Tool name
 * @param {object} args - Tool arguments
 * @param {RAGKnowledgeGraphManager} manager - Manager instance
 * @returns {object} MCP response with content
 */
export async function handleToolCall(name, args, manager) {
  const result = await executeToolMethod(name, args, manager);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Execute the appropriate manager method for a tool
 * 
 * @param {string} name - Tool name
 * @param {object} args - Tool arguments
 * @param {RAGKnowledgeGraphManager} manager - Manager instance
 * @returns {any} Method result
 */
async function executeToolMethod(name, args, manager) {
  switch (name) {
    // ==================== ENTITY METHODS ====================
    case 'createEntities':
      return manager.createEntities(args.entities);

    case 'createRelations':
      return manager.createRelations(args.relations);

    case 'addObservations':
      return manager.addObservations(args.observations);

    case 'searchNodes':
      return manager.searchNodes(args.query, args.limit);

    case 'openNodes':
      return manager.openNodes(args.names);

    case 'deleteEntities':
      return manager.deleteEntities(args.entityNames);

    case 'deleteRelations':
      return manager.deleteRelations(args.relations);

    case 'deleteObservations':
      return manager.deleteObservations(args.deletions);

    // ==================== DOCUMENT METHODS ====================
    case 'processDocument':
      return manager.processDocument(args.id, args.content, {
        maxChunkSize: args.maxChunkSize,
        overlap: args.overlap,
        metadata: args.metadata || {},
      });

    case 'storeDocument':
      return manager.storeDocument(args.id, args.content, args.metadata || {});

    case 'listDocuments':
      return manager.listDocuments(args.includeMetadata !== false);

    case 'deleteDocuments':
      return manager.deleteDocuments(args.documentIds);

    // ==================== CHUNKING & EMBEDDING ====================
    case 'chunkDocument':
      return manager.chunkDocument(args.documentId, {
        maxChunkSize: args.maxChunkSize,
        overlap: args.overlap,
      });

    case 'embedChunks':
      return manager.embedChunks(args.documentId);

    case 'embedAllEntities':
      return manager.embedAllEntities();

    // ==================== SEARCH ====================
    case 'hybridSearch':
      return manager.hybridSearch(args.query, args.limit || 5);

    case 'getDetailedContext':
      return manager.getDetailedContext(args.query, {
        limit: args.limit,
        includeEntities: args.includeEntities,
      });

    case 'getGraph':
    case 'readGraph': // Backward compatibility
      return manager.readGraph();

    // ==================== UTILITIES ====================
    case 'getKnowledgeGraphStats':
      return manager.getKnowledgeGraphStats();

    case 'rebuildSearchIndex':
      return manager.rebuildSearchIndex();

    case 'extractTerms':
      return manager.extractTerms(args.documentId, {
        minLength: args.minLength,
        includeCapitalized: args.includeCapitalized,
      });

    case 'linkEntitiesToDocument':
      return manager.linkEntitiesToDocument(args.documentId, args.entityNames);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Create error response for MCP
 * 
 * @param {Error} error - Error object
 * @returns {object} MCP error response
 */
export function createErrorResponse(error) {
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
