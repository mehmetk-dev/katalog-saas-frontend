# 🤖 AI Panel — Faz 2

Bu klasör, Excel düzenleyicisine yapay zeka entegrasyonu için ayrılmıştır.

## Planlanan Dosyalar
- `ai-panel.tsx` — Collapsible sağ panel UI
- `ai-chat.tsx` — Chat mesaj arayüzü
- `ai-preview.tsx` — AI önerilerini preview tablosu
- `use-ai-assistant.ts` — AI provider çağrıları + suggestion state

## Entegrasyon Noktaları (Hazır)
- `useSpreadsheet.applyBulkChanges()` → AI önerilerini editedCells'e yazar
- `ExcelToolbar.onOpenAI` prop → AI panelini açar (şu an disabled)
- `types.ts` → `AISuggestion`, `AIAction` tipleri tanımlı
- `excel-page-client.tsx` → Sağ panel alanı yorum satırı ile ayrılmış

## Provider Seçenekleri
- Groq (hızlı, ucuz, Llama tabanlı)
- OpenAI (güçlü, GPT-4)
- Anthropic (Claude)
- Hybrid (basit işler Groq, karmaşık işler OpenAI)
