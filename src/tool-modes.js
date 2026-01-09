/**
 * Tool Modes Configuration
 * 
 * Defines which tools are available in each mode:
 * - client: Essential tools for daily memory operations (default recommended)
 * - maintenance: Administrative and cleanup tools
 * - full: All tools (default if not specified)
 * 
 * @module tool-modes
 */

export const TOOL_MODES = {
  // CLIENT MODE - Essential tools for working with memory
  client: [
    // Knowledge Graph - Core Operations
    'createEntities',      // Create new entities
    'createRelations',     // Link entities together
    'addObservations',     // Add information to entities
    'searchNodes',         // Find entities
    'openNodes',           // Get entity details
    
    // Document Processing - Main workflow
    'processDocument',     // ⭐ RECOMMENDED: Full pipeline
    
    // Search - Find information
    'hybridSearch',        // Search documents
    'getDetailedContext',  // Get rich context with entities
    
    // Utilities - Basic info
    'getGraph',            // View knowledge graph (renamed from readGraph)
    'getKnowledgeGraphStats', // See statistics
  ],

  // MAINTENANCE MODE - Admin and cleanup tools
  maintenance: [
    // Cleanup - Remove data
    'deleteEntities',      // Remove entities
    'deleteRelations',     // Remove relationships
    'deleteObservations',  // Remove observations
    'deleteDocuments',     // Remove documents
    
    // Advanced Document Operations
    'storeDocument',       // Store without processing
    'chunkDocument',       // Manual chunking
    'embedChunks',         // Manual embedding
    'embedAllEntities',    // Regenerate all embeddings
    
    // Index & Search Maintenance
    'rebuildSearchIndex',  // Rebuild FTS index
    
    // Advanced Utilities
    'listDocuments',       // List all documents
    'extractTerms',        // Extract keywords
    'linkEntitiesToDocument', // Manual linking
  ],

  // FULL MODE - All tools (default)
  full: null, // null means all tools
};

/**
 * Get tool names for a specific mode
 * 
 * @param {string} mode - Mode name (client, maintenance, full)
 * @returns {string[]|null} Array of tool names or null for all tools
 */
export function getToolsForMode(mode = 'full') {
  const normalizedMode = mode.toLowerCase();
  
  if (!TOOL_MODES[normalizedMode]) {
    console.error(`⚠️  Unknown tool mode: ${mode}, falling back to 'full'`);
    return null;
  }
  
  return TOOL_MODES[normalizedMode];
}

/**
 * Filter tools based on mode
 * 
 * @param {object[]} allTools - All tool definitions
 * @param {string} mode - Mode name
 * @returns {object[]} Filtered tools for the mode
 */
export function filterToolsByMode(allTools, mode = 'full') {
  const allowedTools = getToolsForMode(mode);
  
  // null means all tools (full mode)
  if (allowedTools === null) {
    return allTools;
  }
  
  return allTools.filter(tool => allowedTools.includes(tool.name));
}
