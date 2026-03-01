import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
    slug: string
    title: string
    date: string
    lastModified?: string  // For SEO freshness signals
    excerpt: string
    coverImage: string
    author: string
    category: string
    tags: string[]
    language: 'tr' | 'en'
    content: string
    readingTime?: string
}

export function getBlogSlugs() {
    if (!fs.existsSync(BLOG_DIR)) return []
    return fs.readdirSync(BLOG_DIR).filter(file => file.endsWith('.mdx'))
}

export function getPostBySlug(slug: string): BlogPost | null {
    try {
        // SECURITY: Sanitize slug to prevent path traversal (e.g., ../../etc/passwd)
        const sanitizedSlug = slug.replace(/\.mdx$/, '').replace(/[^a-z0-9-]/gi, '')
        if (!sanitizedSlug) return null

        const fullPath = path.join(BLOG_DIR, `${sanitizedSlug}.mdx`)

        // Additional guard: ensure resolved path stays within BLOG_DIR
        const resolvedPath = path.resolve(fullPath)
        if (!resolvedPath.startsWith(path.resolve(BLOG_DIR))) return null

        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContents)

        const wordsPerMinute = 200
        const noOfWords = content.split(/\s/g).length
        const minutes = noOfWords / wordsPerMinute
        const readingTime = Math.ceil(minutes)

        return {
            slug: sanitizedSlug,
            title: data.title,
            date: data.date,
            lastModified: data.lastModified || data.date,  // Fallback to publish date
            excerpt: data.excerpt,
            coverImage: data.coverImage || '/placeholder.svg',
            author: data.author || 'FogCatalog Team',
            category: data.category || 'General',
            tags: data.tags || [],
            language: data.language || 'tr',
            content,
            readingTime: `${readingTime} min read`,
        }
    } catch {
        return null
    }
}

export function getAllPosts(language?: 'tr' | 'en'): BlogPost[] {
    const slugs = getBlogSlugs()
    const posts = slugs
        .map(slug => getPostBySlug(slug))
        .filter((post): post is BlogPost => post !== null)

    const filteredPosts = language
        ? posts.filter(post => post.language === language)
        : posts

    // Sort posts by date in descending order
    return filteredPosts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
}
