# RAG Memory PostgreSQL MCP Server

A Model Context Protocol (MCP) server for RAG-enabled memory with PostgreSQL/Supabase backend.

## Features

- ✅ **Knowledge Graph**: Entities, relationships, and observations
- ✅ **Document Management**: Store, search, and retrieve documents
- ✅ **Semantic Search**: Vector embeddings with pgvector
- ✅ **Hybrid Search**: Combines text and semantic search
- ✅ **Multi-Machine Sync**: PostgreSQL backend enables real-time sync
- ✅ **Cloud-Hosted**: Supabase provides automatic backups and scaling

## Installation

```bash
cd /Users/kirillshidenko/cursor-workspace/rag-memory-pg-mcp
npm install
```

## Configuration

Add to your `mcp.json`:

```json
{
  "rag-memory-pg": {
    "command": "node",
    "args": ["/Users/kirillshidenko/cursor-workspace/rag-memory-pg-mcp/src/index.js"],
    "env": {
      "SUPABASE_URL": "https://qystmdysjemiqlqmhfbh.supabase.co",
      "SUPABASE_SERVICE_KEY": "your_service_key_here"
    }
  }
}
```

## Available Tools

**Total: 20 tools** (Complete parity with SQLite version)

- **9 Knowledge Graph Tools** - Entity and relationship management
- **8 RAG & Embedding Tools** - Document processing and semantic search
- **3 Utility Tools** - Graph export and cleanup

### Knowledge Graph

#### `createEntities`
Create new entities in the knowledge graph.

```json
{
  "entities": [
    {
      "name": "Machine Learning",
      "entityType": "CONCEPT",
      "observations": ["Subset of AI", "Uses data to learn"]
    }
  ]
}
```

#### `createRelations`
Create relationships between entities.

```json
{
  "relations": [
    {
      "from": "React",
      "to": "JavaScript",
      "relationType": "BUILT_WITH"
    }
  ]
}
```

#### `addObservations`
Add observations to existing entities.

```json
{
  "observations": [
    {
      "entityName": "Machine Learning",
      "contents": ["Popular in 2024", "Used in many applications"]
    }
  ]
}
```

#### `searchNodes`
Search for entities by name or type.

```json
{
  "query": "machine learning",
  "limit": 10
}
```

#### `openNodes`
Get specific entities by name.

```json
{
  "names": ["Machine Learning", "Deep Learning"]
}
```

#### `deleteEntities`
Delete entities and their relationships.

```json
{
  "entityNames": ["Obsolete Entity", "Old Concept"]
}
```

#### `deleteRelations`
Delete specific relationships between entities.

```json
{
  "relations": [
    {
      "from": "Entity A",
      "to": "Entity B",
      "relationType": "OLD_RELATION"
    }
  ]
}
```

#### `deleteObservations`
Delete specific observations from entities.

```json
{
  "deletions": [
    {
      "entityName": "Machine Learning",
      "observations": ["Outdated observation", "Incorrect fact"]
    }
  ]
}
```

### Document Management

#### `storeDocument`
Store a document in the RAG system.

```json
{
  "id": "doc_123",
  "content": "This is the document content...",
  "metadata": {
    "type": "technical",
    "author": "AI"
  }
}
```

#### `listDocuments`
List all documents.

```json
{
  "includeMetadata": true
}
```

#### `hybridSearch`
Search documents using hybrid search.

```json
{
  "query": "machine learning applications",
  "limit": 5
}
```

### Statistics

#### `getKnowledgeGraphStats`
Get statistics about the knowledge graph.

```json
{}
```

Returns:
```json
{
  "entity_count": 555,
  "relationship_count": 765,
  "document_count": 277,
  "entity_types_count": 220,
  "relation_types_count": 258
}
```

## Database Schema

The server uses the following PostgreSQL tables:

- `rag_entities` - Knowledge graph nodes
- `rag_relationships` - Knowledge graph edges
- `rag_documents` - RAG documents
- `rag_chunks` - Document chunks with embeddings
- `rag_entity_embeddings` - Entity embeddings for semantic search
- `rag_chunk_entities` - Chunk-entity associations
- `rag_stats` - Statistics view

## Multi-Machine Sync

Since the backend is PostgreSQL on Supabase:

1. **Same configuration on all machines** - Use the same `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
2. **Automatic sync** - Changes propagate immediately
3. **Concurrent writes** - PostgreSQL handles conflicts
4. **No file locking** - Multiple machines can write simultaneously

## Development

### Run locally:
```bash
node src/index.js
```

### Test with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector node src/index.js
```

## Comparison with SQLite Version

| Feature | SQLite (rag-memory-mcp) | PostgreSQL (this) |
|---------|-------------------------|-------------------|
| Multi-machine sync | ❌ No | ✅ Yes |
| Concurrent writes | ❌ Limited | ✅ Full support |
| Cloud-hosted | ❌ No | ✅ Yes |
| Automatic backups | ❌ Manual | ✅ Automatic |
| Vector search | ✅ sqlite-vec | ✅ pgvector |
| Performance | ✅ Fast (local) | ✅ Fast (network) |

## License

MIT

