---
description: Test generation and test running command. Creates and executes tests for code.
---

/test - Modular Test Generation (Turkish Explanations)

$ARGUMENTS
Purpose
Generate production-grade Vitest tests for the Katalog App, focusing on modular structure and providing explanations in Turkish.

$BEHAVIOR
When asked to test a file, feature, or module:

1. 📦 Module Analysis & Context
   - Identify the module (e.g., Auth, Product, Cart).
   - Detect environment: Frontend (React/Next.js) or Backend (Node.js/Spring logic).
   - Identify dependencies to mock (DB, API, Hooks).

2. 🇹🇷 Turkish Explanation & Strategy
   - Explain *specifically* what will be tested in Turkish.
   - Highlight why certain edge cases are critical for this specific module.

3. 📝 Test Plan Generation (Turkish)
   - Create a table with columns: 'Senaryo' (Scenario), 'Tür' (Type), 'Önem Derecesi' (Priority).

4. 🧪 Write Tests (Vitest Specific)
   - USE: `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';`
   - FRONTEND: Use `@testing-library/react` and `@testing-library/user-event`.
   - MOCKING: Use `vi.fn()` and `vi.mock()`.
   - COMMENTS: Add Turkish comments inside the code explaining complex steps.

$OUTPUT_FORMAT

## 📦 Modül: [Modül Adı / Dosya Adı]

### 🇹🇷 Test Kapsamı ve Analizi
Bu modülde şunları test edeceğiz:
* **Ana İşlev:** [Örn: Kullanıcının doğru şifreyle giriş yapabilmesi]
* **Validasyon:** [Örn: Email formatı kontrolü]
* **Kritik Hata:** [Örn: API yanıt vermezse uygulamanın çökmemesi]

### 📋 Test Planı
| Senaryo | Tür | Öncelik |
|---------|-----|---------|
| Başarılı ürün ekleme | Happy Path | Yüksek |
| Fiyat alanı boş bırakılırsa | Validation | Orta |
| Sunucu 500 hatası verirse | Error Case | Yüksek |

### 🧪 Oluşturulan Test Kodu
`tests/[dosya_adi].test.tsx`
[CODE BLOCK]

$TEST_PATTERNS

// Pattern for React (Frontend)
describe('LoginForm', () => {
  it('butona basıldığında loading state görünmeli', async () => {
    // Hazırlık (Arrange)
    const user = userEvent.setup();
    render(<LoginForm />);
    
    // Eylem (Act)
    await user.click(screen.getByRole('button', { name: /giriş/i }));
    
    // Kontrol (Assert)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});

// Pattern for Node.js (Backend)
describe('CatalogService', () => {
  it('geçersiz kategori ID ile kayıt engellenmeli', async () => {
    // Hazırlık & Eylem & Kontrol
    await expect(createCatalog({ categoryId: null }))
      .rejects.toThrow('Kategori ID zorunludur');
  });
});

$KEY_PRINCIPLES
- **Language:** Code logic in English, but Comments and Descriptions in TURKISH.
- **Isolation:** Each test must be independent.
- **Mocking:** Always mock external calls (Supabase, Axios).
- **Quality:** Focus on behavior, not implementation details.