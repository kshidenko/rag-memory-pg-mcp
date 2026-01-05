/**
 * MCP Tool Definitions
 * 
 * Defines all available tools for the RAG Memory MCP Server.
 * Each tool has a name, description, and JSON schema for input validation.
 * 
 * @module tools
 */

/**
 * Get all tool definitions for the MCP server
 * 
 * @returns {object[]} Array of tool definitions
 */
export function getToolDefinitions() {
  return [
    // ==================== ENTITY TOOLS ====================
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
                observations: { type: 'array', items: { type: 'string' } },
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
                contents: { type: 'array', items: { type: 'string' } },
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
          names: { type: 'array', items: { type: 'string' } },
        },
        required: ['names'],
      },
    },
    {
      name: 'deleteEntities',
      description: 'Delete multiple entities and their associated relationships',
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
      description: 'Delete specific relationships from the knowledge graph',
      inputSchema: {
        type: 'object',
        properties: {
          relations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                from: { type: 'string', description: 'Source entity name' },
                to: { type: 'string', description: 'Target entity name' },
                relationType: { type: 'string', description: 'Relationship type' },
              },
              required: ['from', 'to', 'relationType'],
            },
          },
        },
        required: ['relations'],
      },
    },
    {
      name: 'deleteObservations',
      description: 'Delete specific observations from entities',
      inputSchema: {
        type: 'object',
        properties: {
          deletions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                entityName: { type: 'string', description: 'Entity name' },
                observations: { type: 'array', items: { type: 'string' }, description: 'Observations to remove' },
              },
              required: ['entityName', 'observations'],
            },
          },
        },
        required: ['deletions'],
      },
    },

    // ==================== DOCUMENT TOOLS ====================
    {
      name: 'processDocument',
      description: 'RECOMMENDED: Store document with full pipeline (store → chunk → embed)',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique document identifier' },
          content: { type: 'string', description: 'Document content' },
          maxChunkSize: { type: 'number', default: 500, description: 'Max chunk size' },
          overlap: { type: 'number', default: 50, description: 'Chunk overlap' },
          metadata: { type: 'object', description: 'Optional metadata' },
        },
        required: ['id', 'content'],
      },
    },
    {
      name: 'storeDocument',
      description: 'Store a document (without chunking/embedding)',
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
      name: 'deleteDocuments',
      description: 'Delete documents and their chunks',
      inputSchema: {
        type: 'object',
        properties: {
          documentIds: { type: 'array', items: { type: 'string' }, description: 'Document IDs to delete' },
        },
        required: ['documentIds'],
      },
    },

    // ==================== CHUNKING & EMBEDDING TOOLS ====================
    {
      name: 'chunkDocument',
      description: 'Split a document into chunks',
      inputSchema: {
        type: 'object',
        properties: {
          documentId: { type: 'string', description: 'Document ID' },
          maxChunkSize: { type: 'number', default: 500 },
          overlap: { type: 'number', default: 50 },
        },
        required: ['documentId'],
      },
    },
    {
      name: 'embedChunks',
      description: 'Generate embeddings for document chunks',
      inputSchema: {
        type: 'object',
        properties: {
          documentId: { type: 'string', description: 'Document ID' },
        },
        required: ['documentId'],
      },
    },
    {
      name: 'embedAllEntities',
      description: 'Generate embeddings for all entities',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },

    // ==================== SEARCH TOOLS ====================
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
      name: 'getDetailedContext',
      description: 'Get detailed context (semantic + graph search)',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', default: 5 },
          includeEntities: { type: 'boolean', default: true },
        },
        required: ['query'],
      },
    },
    {
      name: 'readGraph',
      description: 'Read the entire knowledge graph',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },

    // ==================== UTILITY TOOLS ====================
    {
      name: 'getKnowledgeGraphStats',
      description: 'Get statistics about the knowledge graph',
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
          documentId: { type: 'string', description: 'Document ID' },
          minLength: { type: 'number', default: 3 },
          includeCapitalized: { type: 'boolean', default: true },
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
          documentId: { type: 'string', description: 'Document ID' },
          entityNames: { type: 'array', items: { type: 'string' }, description: 'Entity names' },
        },
        required: ['documentId', 'entityNames'],
      },
    },
  ];
}
