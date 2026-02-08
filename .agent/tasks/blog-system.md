# Task: Implement Markdown-based Blog System

## 1. Analysis & Requirements
*   **Goal**: Create a high-performance, SEO-optimized blog system using Markdown (MDX).
*   **Tech Stack**: Next.js 16 (App Router), MDX, gray-matter (for frontmatter), Tailwind CSS 4.
*   **Structure**: 
    *   `content/blog/`: Store `.mdx` files.
    *   `lib/blog.ts`: API logic to read and parse MDX.
    *   `app/blog/`: Listing page and individual post pages.
*   **SEO Focus**: Static generation, metadata optimization, JSON-LD structured data.

## 2. Infrastructure
- [ ] Create `content/blog/` directory.
- [ ] Install `gray-matter` for parsing frontmatter.
- [ ] Install `next-mdx-remote` for rendering MDX in Server Components.
- [ ] Create `lib/blog.ts` for data fetching.

## 3. Implementation
- [ ] **Data Model**: Define `BlogPost` interface with title, date, excerpt, cover image, slug, etc.
- [ ] **Blog List Page (`app/blog/page.tsx`)**:
    *   Premium "Magazine" style layout.
    *   Featured post + Grid for other posts.
    *   Bilingual support (TR/EN).
- [ ] **Blog Post Page (`app/blog/[slug]/page.tsx`)**:
    *   Reading-focused typography.
    *   Dynamic metadata (Bilingual).
    *   Breadcrumbs and "Related Posts".
- [ ] **SEO Utility**: Update `lib/seo.ts` to include blog categories.

## 4. Sample Content
- [ ] Create `content/blog/nasıl-profesyonel-katalog-olusturulur.mdx` (TR).
- [ ] Create `content/blog/how-to-create-professional-catalog.mdx` (EN).

## 5. Polish
- [ ] Add smooth transitions between blog list and posts.
- [ ] Ensure mobile responsiveness.
- [ ] Verify SEO tags (Title, Meta, OG, Canonical).
- [ ] Add JSON-LD for and "Article" schema.
