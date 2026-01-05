# RAG Memory PostgreSQL MCP Server

[![npm version](https://img.shields.io/npm/v/rag-memory-pg-mcp.svg)](https://www.npmjs.com/package/rag-memory-pg-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for RAG-enabled memory with PostgreSQL/Supabase backend. Provides knowledge graph, document management, and semantic search capabilities.

---

## 🚀 Quick Install

**One-click installation for your IDE:**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://cursor.com/deeplink/mcp-install-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://cursor.com/deeplink/mcp-install-light.svg">
  <a href="https://cursor.com/en/install-mcp?name=rag-memory-pg&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsInJhZy1tZW1vcnktcGctbWNwIl0sImVudiI6eyJTVVBBQkFTRV9VUkwiOiJodHRwczovL3lvdXItcHJvamVjdC5zdXBhYmFzZS5jbyIsIlNVUEFCQVNFX1NFUlZJQ0VfS0VZIjoieW91ci1zZXJ2aWNlLWtleSJ9fQ%3D%3D">
    <img src="https://cursor.com/deeplink/mcp-install-dark.svg" alt="Install in Cursor">
  </a>
</picture>
&nbsp;&nbsp;
<a href="https://files.lmstudio.ai/install-mcp?name=rag-memory-pg&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsInJhZy1tZW1vcnktcGctbWNwIl0sImVudiI6eyJTVVBBQkFTRV9VUkwiOiJodHRwczovL3lvdXItcHJvamVjdC5zdXBhYmFzZS5jbyIsIlNVUEFCQVNFX1NFUlZJQ0VfS0VZIjoieW91ci1zZXJ2aWNlLWtleSJ9fQ%3D%3D">
  <img src="https://files.lmstudio.ai/deeplink/mcp-install-light.svg" alt="Install in LM Studio">
</a>
&nbsp;&nbsp;
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=rag-memory-pg&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22rag-memory-pg-mcp%22%5D%2C%22type%22%3A%22stdio%22%7D)

> **Note:** Click buttons above for automatic installation. Cursor & LM Studio have official SVG buttons!

---

### 🔑 Get Your Credentials First

Before installation, get your credentials:
- **Supabase:** https://app.supabase.com/project/_/settings/api
- **OpenAI** (optional, 10-100x faster embeddings): https://platform.openai.com/api-keys

---

## Manual Installation

### Cursor

Add to `~/.cursor/mcp.json`:

<details>
<summary><b>🐌 Local Embeddings (Free, Private, Slower)</b></summary>

```json
{
  "mcpServers": {
    "rag-memory-pg": {
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

</details>

<details>
<summary><b>⚡ OpenAI Embeddings (Fast, Cloud, Recommended)</b></summary>

```json
{
  "mcpServers": {
    "rag-memory-pg": {
      "command": "npx",
      "args": ["-y", "rag-memory-pg-mcp"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-key",
        "EMBEDDING_PROVIDER": "OPENAI",
        "OPENAI_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```

</details>

Then restart Cursor.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

<details>
<summary><b>🐌 Local Embeddings (Free, Private, Slower)</b></summary>

```json
{
  "mcpServers": {
    "rag-memory-pg": {
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

</details>

<details>
<summary><b>⚡ OpenAI Embeddings (Fast, Cloud, Recommended)</b></summary>

```json
{
  "mcpServers": {
    "rag-memory-pg": {
      "command": "npx",
      "args": ["-y", "rag-memory-pg-mcp"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-key",
        "EMBEDDING_PROVIDER": "OPENAI",
        "OPENAI_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```

</details>

Then restart Claude Desktop.

### VS Code

Add to `.vscode/mcp.json` in your workspace:

<details>
<summary><b>🐌 Local Embeddings (Free, Private, Slower)</b></summary>

```json
{
  "servers": {
    "rag-memory-pg": {
      "type": "stdio",
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

</details>

<details>
<summary><b>⚡ OpenAI Embeddings (Fast, Cloud, Recommended)</b></summary>

```json
{
  "servers": {
    "rag-memory-pg": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "rag-memory-pg-mcp"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-key",
        "EMBEDDING_PROVIDER": "OPENAI",
        "OPENAI_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```

</details>

Then reload VS Code window.

### Windsurf

Add to `~/.windsurf/mcp.json`:

<details>
<summary><b>🐌 Local Embeddings (Free, Private, Slower)</b></summary>

```json
{
  "mcpServers": {
    "rag-memory-pg": {
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

</details>

<details>
<summary><b>⚡ OpenAI Embeddings (Fast, Cloud, Recommended)</b></summary>

```json
{
  "mcpServers": {
    "rag-memory-pg": {
      "command": "npx",
      "args": ["-y", "rag-memory-pg-mcp"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-key",
        "EMBEDDING_PROVIDER": "OPENAI",
        "OPENAI_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```

</details>

Then restart Windsurf.

---

## Features

- **Knowledge Graph**: Entities, relationships, and observations
- **Document Processing**: Store → Chunk → Embed pipeline
- **Semantic Search**: Vector embeddings with local HuggingFace model (no API keys needed)
- **Hybrid Search**: Combines text and semantic search
- **Multi-Machine Sync**: PostgreSQL backend enables real-time sync across devices

## 📦 Installation Options

### Option 1: Direct via npx (Recommended)
Already configured in [Fast Start](#-fast-start---install-to-cursor) above!

### Option 2: Global Installation
```bash
npm install -g rag-memory-pg-mcp
```

### Option 3: From GitHub
```bash
npm install -g github:kshidenko/rag-memory-pg-mcp
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

## 📚 Documentation

- **[CHANGELOG.md](CHANGELOG.md)** - Version history and migration notes
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute to this project
- **[SECURITY.md](SECURITY.md)** - Security policy and best practices
- **[MIGRATION.md](MIGRATION.md)** - Migration guide for version upgrades

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- How to submit pull requests
- Code style guidelines
- Development workflow
- Testing requirements

## 🔒 Security

Found a security issue? Please see [SECURITY.md](SECURITY.md) for:
- How to report vulnerabilities
- Security best practices
- Credential management

## 📋 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and breaking changes.

## License

MIT
