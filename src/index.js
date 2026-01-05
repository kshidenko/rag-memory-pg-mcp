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
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { RAGKnowledgeGraphManager } from './manager.js';
import { getToolDefinitions } from './tools.js';
import { filterToolsByMode } from './tool-modes.js';
import { getPromptDefinitions } from './prompts.js';
import { handleToolCall, createErrorResponse } from './handlers.js';

// ==================== CONFIGURATION ====================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TOOLS_MODE = (process.env.TOOLS_MODE || 'full').toLowerCase();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required');
  console.error('   Set them in your MCP configuration or .env file');
  process.exit(1);
}

// Log active tools mode
const modeDescriptions = {
  client: 'CLIENT mode (10 essential tools for daily use)',
  maintenance: 'MAINTENANCE mode (11 admin/cleanup tools)',
  full: 'FULL mode (all 21 tools)'
};
console.error(`🔧 Tools: ${modeDescriptions[TOOLS_MODE] || 'FULL mode (default)'}`);


// ==================== SERVER SETUP ====================

// Get tools based on mode
const allTools = getToolDefinitions();
const activeTools = filterToolsByMode(allTools, TOOLS_MODE);

console.error(`📊 Active tools: ${activeTools.length}/${allTools.length}`);

const server = new Server(
  {
    name: 'rag-memory-pg',
    version: '2.2.0',
    description: 'RAG-enabled memory with PostgreSQL/Supabase backend. Provides knowledge graph, document management, and semantic search. All content should be in English for optimal performance.',
    instructions: `This is a RAG (Retrieval-Augmented Generation) memory system with knowledge graph capabilities.

KEY PRINCIPLES:
1. ALL content (entities, documents, queries) must be in ENGLISH for optimal embedding and search
2. Use processDocument for storing documentation/code examples
3. Use createEntities + createRelations for structured knowledge
4. Use hybridSearch or getDetailedContext for finding information

RECOMMENDED WORKFLOW:
- Store knowledge: processDocument (documents) + createEntities (concepts) + createRelations (links)
- Search knowledge: hybridSearch (documents) or searchNodes (entities)
- Explore: readGraph (full overview) or getKnowledgeGraphStats (statistics)

TOOL MODES:
- client: 10 essential tools for daily use (recommended)
- maintenance: 11 admin/cleanup tools
- full: all 21 tools (default)

EMBEDDING MODES:
- local: Free, private, slower (default)
- openai: 10-100x faster, cloud-based (recommended)

Use English for all operations to ensure accurate semantic search and embedding quality.`,
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

const manager = new RAGKnowledgeGraphManager(SUPABASE_URL, SUPABASE_KEY);

// ==================== REQUEST HANDLERS ====================

/**
 * List available tools (filtered by TOOLS_MODE)
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: activeTools };
});

/**
 * List available prompts
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: getPromptDefinitions() };
});

/**
 * Get specific prompt
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const prompts = getPromptDefinitions();
  const prompt = prompts.find(p => p.name === request.params.name);
  
  if (!prompt) {
    throw new Error(`Prompt not found: ${request.params.name}`);
  }
  
  // Replace template variables
  let messages = [{
    role: 'user',
    content: {
      type: 'text',
      text: prompt.prompt,
    },
  }];
  
  // Replace {{variable}} in prompt with actual arguments
  if (request.params.arguments) {
    Object.entries(request.params.arguments).forEach(([key, value]) => {
      messages[0].content.text = messages[0].content.text.replace(
        new RegExp(`{{${key}}}`, 'g'),
        value
      );
    });
  }
  
  return { messages };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    return await handleToolCall(name, args, manager);
  } catch (error) {
    return createErrorResponse(error);
  }
});

// ==================== MAIN ====================

/**
 * Start the MCP server
 */
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
