/**
 * MCP Prompts
 * 
 * Pre-defined prompts that help users and AI models understand how to use the RAG Memory system effectively.
 * 
 * @module prompts
 */

export function getPromptDefinitions() {
  return [
    {
      name: 'store-knowledge',
      description: 'Store new knowledge (documentation, code examples, or concepts) in RAG memory',
      arguments: [
        {
          name: 'topic',
          description: 'Topic or subject of the knowledge (e.g., "Next.js routing", "PostgreSQL optimization")',
          required: true,
        },
        {
          name: 'content',
          description: 'The actual content/documentation to store',
          required: true,
        },
      ],
      prompt: `I'll help you store knowledge about {{topic}} in the RAG memory system.

**Best Practices:**
1. All content must be in English for optimal search performance
2. Use clear, descriptive entity names
3. Add comprehensive observations with specific details
4. Create relationships between related concepts

**Steps:**
1. Create entities for main concepts
2. Add detailed observations
3. Create relationships to connect knowledge
4. Store full documentation using processDocument

Let me process "{{content}}" and create a comprehensive knowledge graph entry.`,
    },
    {
      name: 'search-knowledge',
      description: 'Search for information in the RAG memory using hybrid semantic search',
      arguments: [
        {
          name: 'query',
          description: 'What are you looking for? (in English)',
          required: true,
        },
      ],
      prompt: `I'll search the RAG memory for information about "{{query}}".

**Search Strategy:**
1. Using hybridSearch for semantic + text matching
2. Query in English for best embedding results
3. Retrieving top relevant document chunks
4. Including related entities from knowledge graph

Searching now...`,
    },
    {
      name: 'explore-graph',
      description: 'Explore the knowledge graph to see what information is stored',
      arguments: [],
      prompt: `I'll show you the complete knowledge graph structure.

**What you'll see:**
- All entities (people, projects, technologies, concepts)
- Relationships between entities
- Total counts and statistics

This gives you a bird's-eye view of all stored knowledge.

Reading graph now...`,
    },
  ];
}
