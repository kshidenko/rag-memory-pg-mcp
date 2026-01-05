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

import { RAGKnowledgeGraphManager } from './manager.js';
import { getToolDefinitions } from './tools.js';
import { filterToolsByMode } from './tool-modes.js';
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
  client: 'CLIENT mode (11 essential tools for daily use)',
  maintenance: 'MAINTENANCE mode (10 admin/cleanup tools)',
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
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
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
