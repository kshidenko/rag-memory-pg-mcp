# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.1] - 2026-01-08

### Added ✨
- **rebuildSearchIndex** tool for FTS index maintenance
- Added to maintenance mode for admin operations
- Use after enabling FTS or if search results seem stale

## [2.3.0] - 2026-01-08

### Added ✨
- **Full-Text Search (FTS) support** with automatic detection
- New `supabase-fts-setup.sql` migration for enabling tsvector + GIN index
- Auto-detects FTS availability and uses optimal search method

### Changed
- hybridSearch now auto-selects search strategy:
  - **With FTS**: Uses tsvector for fast search with stemming, stop words, ranking
  - **Without FTS**: Falls back to ilike keyword search (works out of the box)
- getDetailedContext now reuses hybridSearch for consistency
- FTS detection result is cached for performance

### Benefits of FTS (run supabase-fts-setup.sql)
- 10-100x faster on large document sets (GIN index)
- Stemming: "running" matches "run"
- Stop words: ignores "the", "a", "is"
- Better relevance ranking with ts_rank
- Phrase search support

## [2.2.2] - 2026-01-08

### Fixed 🐛
- **hybridSearch returning empty results** - completely rewrote search logic
- **getDetailedContext document search** - same fix applied
- Root cause: `textSearch()` requires tsvector index which most users don't have
- Solution: Replaced with `ilike` pattern matching that works out of the box

### Changed
- hybridSearch now uses keyword-based search with relevance ranking:
  - Extracts meaningful keywords (3+ chars) from query
  - Searches documents containing ANY keyword
  - Ranks results by number of keyword matches
  - No database configuration required

## [2.2.0] - 2026-01-05

### Breaking Changes 🔴
- **Renamed `readGraph` → `getGraph`** due to Cursor API conflict
- The `readGraph` name was causing the tool to be ignored/blocked by Cursor
- Handler supports both names for backward compatibility

### Fixed 🐛
- **Tool loading in CLIENT mode** - now correctly shows 10 tools (was showing 9)
- Root cause: `readGraph` conflicted with Cursor internal API
- Solution: Renamed to `getGraph` - all tools now load properly

### Technical Details
- Debug analysis showed server was sending 10 tools correctly
- Cursor was blocking/ignoring the `readGraph` tool during registration
- Tool name conflict resolved by renaming

## [2.1.1] - 2026-01-05

### Added ✨
- **Server instructions** for AI models with key principles and workflows
- **Pre-defined prompts** (store-knowledge, search-knowledge, explore-graph)
- **Enhanced tool descriptions** following MCP best practices
- Prominent **English language requirement** warnings throughout

### Changed
- All tool descriptions now include examples and use cases
- Parameter descriptions are more detailed and actionable
- Better guidance for AI models on tool selection

### Documentation
- Added language requirement warnings in README
- Server metadata includes comprehensive instructions
- Prompts provide guided workflows for common tasks

## [2.1.0] - 2026-01-05

### Added ✨
- **TOOLS_MODE environment variable** for flexible tool sets
- `TOOLS_MODE=client` - 10 essential tools for daily memory operations (recommended)
- `TOOLS_MODE=maintenance` - 11 admin/cleanup tools for database management
- `TOOLS_MODE=full` - All 21 tools (default)
- Automatic updates via `@latest` in all npx commands
- UPDATE_GUIDE.md with update instructions

### Changed
- All configuration examples use `rag-memory-pg-mcp@latest` for auto-updates
- Deep links updated to include `@latest` 
- Better tool organization by mode
- Clearer documentation on tool modes

### Benefits
- **Faster agent decisions** with fewer tools in client mode
- **Focused workflows** - use only what you need
- **Easier maintenance** - separate admin tools
- **Always up-to-date** - automatic updates every 24h

## [2.0.0] - 2026-01-05

### Breaking Changes 🔴
- **BREAKING**: Renamed `EMBEDDING_PROVIDER` to `MODE` for simplicity
- **BREAKING**: MODE values are now lowercase: `local` or `openai` (was `LOCAL`/`OPENAI`)
- Migration: Simply rename env var and lowercase the value

### Added ✨
- Official install buttons for Cursor, LM Studio, and VS Code
- One-click installation with deep links
- Unified configuration format - all 4 fields in every config
- MODE=local ignores OPENAI_API_KEY (can use placeholder)
- Clearer documentation with single config example

### Changed
- Simplified configuration - one format for all IDEs
- Deep links include full config with MODE=local by default
- Improved README structure with vertical-aligned buttons
- Updated .env.example with MODE
- Better user experience - less confusing, more straightforward

### Fixed
- Button vertical alignment in README
- Configuration examples now consistent across all IDEs

## [1.2.1] - 2026-01-05

### Security 🔒
- **BREAKING**: Removed hardcoded Supabase URL from `src/index.js`
- **BREAKING**: `SUPABASE_URL` is now required as environment variable
- Removed all real credentials from documentation
- Added GitHub Actions security check workflow
- Added comprehensive `SECURITY.md`
- Added `CONTRIBUTING.md` with PR workflow
- Added `GITHUB_SETUP.md` for repository protection

### Changed
- Updated error messages when environment variables are missing
- Improved documentation with placeholder credentials only

### Added
- Automated secret scanning in CI/CD
- Branch protection setup guide
- Security best practices documentation

## [1.2.0] - 2026-01-05

### Added ✨
- **OpenAI embeddings support** (opt-in via `EMBEDDING_PROVIDER=OPENAI`)
- Dual provider architecture: LOCAL (HuggingFace) or OPENAI
- 10-100x faster embeddings with OpenAI
- Full backward compatibility (both use 384-dimensional vectors)
- `.env.example` for configuration reference
- `test-openai-embeddings.js` for testing both providers
- `MIGRATION.md` guide
- `SETUP.md` for quick configuration

### Changed
- Embedding generation now supports multiple providers
- OpenAI uses `text-embedding-3-small` with 384 dimensions
- Automatic fallback to LOCAL if OpenAI not configured

### Dependencies
- Added `openai@^4.77.0`

## [1.1.0] - 2026-01-05

### Changed
- Refactored codebase into modular architecture:
  - `src/index.js` (93 lines) - Server entry point
  - `src/manager.js` (909 lines) - RAGKnowledgeGraphManager
  - `src/tools.js` (320 lines) - Tool definitions
  - `src/handlers.js` (142 lines) - Request handlers
- Improved code organization and maintainability
- Better separation of concerns

### Added
- Comprehensive README
- Documentation improvements
- `processDocument` tool for full pipeline (store → chunk → embed)

## [1.0.0] - 2025-12-20

### Added
- Initial release
- Knowledge graph with entities, relationships, observations
- Document processing: store, chunk, embed
- Semantic search with local HuggingFace model (Xenova/all-MiniLM-L12-v2)
- Hybrid search (text + semantic)
- PostgreSQL/Supabase backend with pgvector
- 21 MCP tools for RAG operations
- Multi-machine sync via shared database

---

## Migration Guides

### 1.1.0 → 1.2.1

**Required changes:**
```json
{
  "env": {
    "SUPABASE_URL": "https://your-project.supabase.co",  // Now REQUIRED
    "SUPABASE_SERVICE_KEY": "your-key"
  }
}
```

**Optional (for OpenAI):**
```json
{
  "env": {
    "EMBEDDING_PROVIDER": "OPENAI",
    "OPENAI_API_KEY": "sk-your-key"
  }
}
```

### Security Note
- All credentials must now come from environment variables
- Never commit `.env` files or real credentials
- Use placeholders in documentation

---

**For detailed upgrade instructions, see [MIGRATION.md](MIGRATION.md)**
