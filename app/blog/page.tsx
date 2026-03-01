import type { Metadata } from "next"
import BlogPageClient from "./blog-page-client"
import { getAllPosts } from "@/lib/services/blog"

export const metadata: Metadata = {
    title: "Blog | FogCatalog",
    description: "Dijital katalog dünyasındaki son trendler, başarı hikayeleri ve uzman rehberler. FogCatalog Blog.",
    openGraph: {
        title: "Blog | FogCatalog",
        description: "Katalog dünyasındaki son trendler, başarı hikayeleri ve uzman rehberlerimizle işinizi büyütün.",
    },
}

export default function BlogPage() {
    const allPosts = getAllPosts()
    const posts = allPosts.map(({ slug, title, excerpt, date, author, category, readingTime, coverImage, language }) => ({
        slug, title, excerpt, date, author, category,
        readingTime: readingTime ?? "",
        coverImage, language,
    }))
    return <BlogPageClient posts={posts} />
}
