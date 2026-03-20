import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  sportTags: string[];
  image?: string;
  body: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  sportTags: string[];
  image?: string;
}

function parseMdFile(filePath: string): BlogPost | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const slug = path.basename(filePath, ".md");
    return {
      slug,
      title: data.title || slug,
      date: data.date || "2026-01-01",
      category: data.category || "tipy",
      excerpt: data.excerpt || "",
      sportTags: data.sportTags || [],
      image: data.image || undefined,
      body: content,
    };
  } catch {
    return null;
  }
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"));

  const posts: BlogPostMeta[] = [];
  for (const file of files) {
    const post = parseMdFile(path.join(CONTENT_DIR, file));
    if (post) {
      const { body: _, ...meta } = post;
      posts.push(meta);
    }
  }

  // Sort by date, newest first
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  return parseMdFile(filePath);
}

export function getPostsByCategory(category: string): BlogPostMeta[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getPostsBySport(sportSlug: string): BlogPostMeta[] {
  return getAllPosts().filter((p) => p.sportTags.includes(sportSlug));
}

export const CATEGORIES: Record<string, string> = {
  "pruvodce-sporty": "Průvodce sporty",
  "pruvodce-mesta": "Průvodce městy",
  tipy: "Tipy a rady",
  vybaveni: "Vybavení a recenze",
  novinky: "Novinky",
};
