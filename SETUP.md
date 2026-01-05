# Quick Setup Guide

## ✅ OpenAI Embeddings Setup

Configure your `~/.cursor/mcp.json` to use **OpenAI embeddings** for maximum speed.

## Configuration Example:

```json
{
  "mcpServers": {
    "rag-memory-pg": {
      "command": "npx",
      "args": ["-y", "rag-memory-pg-mcp"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-role-key",
        "EMBEDDING_PROVIDER": "OPENAI",
        "OPENAI_API_KEY": "sk-your-openai-api-key"
      }
    }
  }
}
```

**Replace with your actual credentials:**
- Get Supabase credentials: https://app.supabase.com/project/_/settings/api
- Get OpenAI API key: https://platform.openai.com/api-keys

## Что дальше?

### 1️⃣ Перезапустите Cursor
Чтобы изменения вступили в силу:
- Закройте Cursor
- Откройте снова

### 2️⃣ При обновлении пакета
Когда выйдет новая версия (1.2.0), просто выполните:
```bash
# Cursor автоматически обновит при следующем запуске
# Или принудительно:
npx clear-npx-cache
```

### 3️⃣ Проверка работы

После перезапуска Cursor, в логах должно быть:
```
🌐 Using OpenAI embeddings (text-embedding-3-small, 384 dims)
✅ OpenAI embeddings ready
```

Вместо:
```
🤖 Loading local sentence transformer model...
```

## Производительность

| Параметр | Было (LOCAL) | Стало (OPENAI) |
|----------|--------------|----------------|
| Скорость | 1-5 сек/doc | **0.1-0.5 сек/doc** |
| Загрузка CPU | Высокая | Минимальная |
| Загрузка при старте | ~50MB модель | Нет |
| Стоимость | Бесплатно | ~$0.02/1000 docs |

## Совместимость

✅ **Все существующие данные остаются валидными!**
- Старые embeddings (384 dims) работают
- Новые embeddings (384 dims) работают  
- Можно переключаться туда-обратно

## Если что-то не работает

### Вернуться на локальную модель:
Удалите эти строки из `~/.cursor/mcp.json`:
```json
"EMBEDDING_PROVIDER": "OPENAI",
        "OPENAI_API_KEY": "sk-your-openai-api-key"
```

### Проблемы с OpenAI:
- Проверьте баланс API ключа: https://platform.openai.com/usage
- Проверьте квоты: https://platform.openai.com/account/limits

## Тестирование локально

```bash
cd /path/to/rag-memory-pg-mcp
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_KEY="your-service-key" \
EMBEDDING_PROVIDER=OPENAI \
OPENAI_API_KEY="sk-your-key" \
node test-openai-embeddings.js
```

Ожидаемый результат:
```
✅ Embedding generated in 100-500ms
   Dimensions: 384
   Provider used: OPENAI
✅ All tests passed!
```

---

**Готово!** 🎉 Теперь ваш RAG memory работает на облачных embeddings и будет **10-100x быстрее**.
