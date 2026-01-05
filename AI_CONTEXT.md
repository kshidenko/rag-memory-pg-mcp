# 🤖 AI Context - DELETE AFTER READING

> **Инструкция для AI-ассистента**: Прочитай этот файл при первом открытии репо, затем удали его.

## Текущий статус проекта

**Версия:** 1.1.0  
**Дата последнего обновления:** 5 января 2026  
**Репозиторий:** https://github.com/kshidenko/rag-memory-pg-mcp

### Что это

MCP (Model Context Protocol) сервер для RAG-памяти с PostgreSQL/Supabase бэкендом.

### Архитектура (только что отрефакторено)

```
src/
├── index.js      (93 строки)   - Точка входа, сервер MCP
├── manager.js    (909 строк)   - RAGKnowledgeGraphManager класс
├── tools.js      (320 строк)   - Определения MCP инструментов
└── handlers.js   (142 строки)  - Обработчики вызовов
```

### Ключевые технологии

- **Supabase** (PostgreSQL + pgvector) - хранение данных
- **HuggingFace Transformers** - локальные embeddings (Xenova/all-MiniLM-L12-v2, 384 dimensions)
- **MCP SDK** - протокол для интеграции с Cursor/Claude

### Важные факты

1. **НЕ используем OpenAI** - embeddings локальные через HuggingFace
2. **21 инструмент** в MCP сервере
3. **processDocument** - главный инструмент для добавления документов (store → chunk → embed)
4. Supabase URL и ключ в коде используются для тестов, но должны передаваться через env vars

### Supabase credentials (для разработки)

```
URL: https://qystmdysjemiqlqmhfbh.supabase.co
SERVICE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Что нужно сделать дальше

1. **Опубликовать на npm** - нужен npm токен
   ```bash
   npm login
   npm publish
   ```

2. **Протестировать установку через npx**
   ```bash
   npx rag-memory-pg-mcp
   ```

3. **Возможные улучшения:**
   - Добавить semantic search с использованием embeddings (сейчас только text search)
   - Добавить delete для chunks отдельно
   - Улучшить hybrid search (комбинировать vector + text)

### Как запустить локально

```bash
cd rag-memory-pg-mcp
npm install
SUPABASE_SERVICE_KEY="your-key" node src/index.js
```

### Команды для разработки

```bash
# Тест с MCP Inspector
npx @modelcontextprotocol/inspector node src/index.js

# Проверить что в базе
# (используй RAG memory MCP tools через Cursor)
```

### GitHub push (если нужен токен)

```bash
git remote set-url origin https://kshidenko:TOKEN@github.com/kshidenko/rag-memory-pg-mcp.git
git push
git remote set-url origin https://github.com/kshidenko/rag-memory-pg-mcp.git
```

---

## 🗑️ УДАЛИ ЭТОТ ФАЙЛ ПОСЛЕ ПРОЧТЕНИЯ

```bash
rm AI_CONTEXT.md
git add -A && git commit -m "chore: remove AI context file" && git push
```
