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
      description: 'Create new entities in the knowledge graph. Use this to store structured information about people, projects, technologies, concepts, or any important items. Entity names and observations should be in English for consistency.',
      inputSchema: {
        type: 'object',
        properties: {
          entities: {
            type: 'array',
            description: 'Array of entities to create',
            items: {
              type: 'object',
              properties: {
                name: { 
                  type: 'string',
                  description: 'Unique entity name in English. Examples: "React", "John Doe", "NextJS Project"'
                },
                entityType: { 
                  type: 'string',
                  description: 'Entity category in English. Examples: "TECHNOLOGY", "PERSON", "PROJECT", "CONCEPT"'
                },
                observations: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Facts and observations about this entity in English. Examples: ["JavaScript library", "Created by Facebook", "Used for UI development"]'
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
      description: 'Search for entities in the knowledge graph by name or type. Use English keywords for best results. Returns matching entities with their types and observations.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { 
            type: 'string',
            description: 'Search query in English. Can search by entity name or type. Examples: "React", "PERSON", "database"'
          },
          limit: { 
            type: 'number', 
            default: 10,
            description: 'Maximum number of entities to return (default: 10)'
          },
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
      description: '⭐ RECOMMENDED: Store document with full pipeline (store → chunk → embed). Use this for adding any documentation, code examples, or knowledge. Content should be in English for optimal search performance. Automatically chunks text and generates embeddings.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            description: 'Unique document identifier. Use descriptive names like "nextjs-routing-docs" or "postgres-optimization-guide"'
          },
          content: { 
            type: 'string', 
            description: 'Document content in English. Can be markdown, code examples, documentation, or any text knowledge'
          },
          maxChunkSize: { 
            type: 'number', 
            default: 500, 
            description: 'Maximum characters per chunk (default: 500). Smaller chunks = more precise search'
          },
          overlap: { 
            type: 'number', 
            default: 50, 
            description: 'Character overlap between chunks (default: 50). Ensures context continuity'
          },
          metadata: { 
            type: 'object', 
            description: 'Optional metadata like {type: "documentation", source: "official", version: "1.0"}'
          },
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
      description: 'Search documents using hybrid semantic + text search. Query must be in English for best results. Returns relevant document chunks with similarity scores.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { 
            type: 'string',
            description: 'Search query in English. Examples: "React hooks usage", "authentication patterns", "database optimization"'
          },
          limit: { 
            type: 'number', 
            default: 5,
            description: 'Maximum number of results to return (default: 5)'
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'getDetailedContext',
      description: 'Get detailed context combining semantic document search with related entities from knowledge graph. Query must be in English. Returns document chunks + connected entities for comprehensive understanding.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { 
            type: 'string', 
            description: 'Search query in English. Examples: "Next.js routing", "PostgreSQL optimization", "React state management"'
          },
          limit: { 
            type: 'number', 
            default: 5,
            description: 'Maximum number of document results (default: 5)'
          },
          includeEntities: { 
            type: 'boolean', 
            default: true,
            description: 'Include related entities from knowledge graph (default: true)'
          },
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
