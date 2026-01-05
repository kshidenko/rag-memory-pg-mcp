# RAG Memory PostgreSQL MCP Server

A Model Context Protocol (MCP) server for RAG-enabled memory with PostgreSQL/Supabase backend. Provides knowledge graph, document management, and semantic search capabilities.

## Features

- **Knowledge Graph**: Entities, relationships, and observations
- **Document Processing**: Store → Chunk → Embed pipeline
- **Semantic Search**: Vector embeddings with local HuggingFace model (no API keys needed)
- **Hybrid Search**: Combines text and semantic search
- **Multi-Machine Sync**: PostgreSQL backend enables real-time sync across devices

## Quick Start

### Installation via npx

```bash
npx rag-memory-pg-mcp
```

### Installation from GitHub

```bash
npm install -g github:kshidenko/rag-memory-pg-mcp
```

### Cursor MCP Configuration

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "rag-memory": {
      "command": "npx",
      "args": ["-y", "rag-memory-pg-mcp"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-key"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `EMBEDDING_PROVIDER` | No | `LOCAL` (default) or `OPENAI` |
| `OPENAI_API_KEY` | No | Required if `EMBEDDING_PROVIDER=OPENAI` |

## Available Tools (21 total)

### Document Processing

#### `processDocument` ⭐ Recommended
Full pipeline: store → chunk → embed. Use this for adding documents.

```json
{
  "id": "my-document",
  "content": "Document content here...",
  "maxChunkSize": 500,
  "overlap": 50,
  "metadata": { "category": "tech" }
}
```

#### `storeDocument`
Store document only (without chunking/embedding).

#### `chunkDocument`
Split document into chunks.

#### `embedChunks`
Generate embeddings for document chunks.

### Knowledge Graph

#### `createEntities`
```json
{
  "entities": [{
    "name": "React",
    "entityType": "TECHNOLOGY",
    "observations": ["JavaScript library", "Used for UI"]
  }]
}
```

#### `createRelations`
```json
{
  "relations": [{
    "from": "React",
    "to": "JavaScript",
    "relationType": "BUILT_WITH"
  }]
}
```

#### `addObservations`
Add observations to existing entities.

#### `searchNodes`
Search entities by name or type.

#### `openNodes`
Get specific entities by name.

#### `deleteEntities`
Delete entities and their relationships.

#### `deleteRelations`
Delete specific relationships.

#### `deleteObservations`
Delete observations from entities.

### Search & Retrieval

#### `hybridSearch`
Semantic + text search across documents.

#### `getDetailedContext`
Combined semantic and graph search.

#### `readGraph`
Read entire knowledge graph.

### Utilities

#### `listDocuments`
List all stored documents.

#### `getKnowledgeGraphStats`
Get database statistics.

#### `extractTerms`
Extract key terms from document.

#### `linkEntitiesToDocument`
Link entities to documents.

#### `embedAllEntities`
Generate embeddings for all entities.

## Database Schema

Required PostgreSQL tables (with pgvector extension):

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Entities
CREATE TABLE rag_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL,
  observations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships
CREATE TABLE rag_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity UUID REFERENCES rag_entities(id),
  to_entity UUID REFERENCES rag_entities(id),
  relation_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE rag_documents (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks with embeddings
CREATE TABLE rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT REFERENCES rag_documents(id),
  chunk_index INTEGER,
  content TEXT NOT NULL,
  embedding VECTOR(384),
  start_pos INTEGER,
  end_pos INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entity embeddings
CREATE TABLE rag_entity_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES rag_entities(id),
  embedding VECTOR(384),
  embedding_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Embedding Models

### Local (Default) - Privacy-Focused
Uses **Xenova/all-MiniLM-L12-v2** via HuggingFace Transformers:
- ✅ Runs locally (no API keys needed)
- ✅ Complete privacy (data never leaves your machine)
- ✅ Free unlimited usage
- ⚠️ Slower performance (loads model ~50MB, CPU-based)
- 384-dimensional vectors

### OpenAI - Fast & Cloud-Based
Uses **text-embedding-3-small**:
- ✅ Much faster (10-100x vs local)
- ✅ No local resources needed
- ✅ Always up-to-date
- ⚠️ Requires API key and internet
- ⚠️ Costs ~$0.02 per 1M tokens
- 384-dimensional vectors (configured for backward compatibility)

### Configuration

**Local (default):**
```json
{
  "mcpServers": {
    "rag-memory": {
      "command": "npx",
      "args": ["-y", "rag-memory-pg-mcp"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-key"
      }
    }
  }
}
```

**OpenAI (faster):**
```json
{
  "mcpServers": {
    "rag-memory": {
      "command": "npx",
      "args": ["-y", "rag-memory-pg-mcp"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-key",
        "EMBEDDING_PROVIDER": "OPENAI",
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

**Backward Compatibility:**
Both providers generate 384-dimensional vectors and store them identically in PostgreSQL. You can switch between providers at any time - existing embeddings remain valid and searchable.

## Development

```bash
# Clone
git clone https://github.com/kshidenko/rag-memory-pg-mcp.git
cd rag-memory-pg-mcp

# Install
npm install

# Run
node src/index.js

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node src/index.js
```

## License

MIT
