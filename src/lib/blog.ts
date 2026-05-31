// Blog removed — stub kept so callers compile without changes.

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  sport?: string;
  sportTags: string[];
  content: string;
  author?: string;
  image?: string;
}

export const CATEGORIES: Record<string, string> = {};

export function getAllPosts(): BlogPost[] {
  return [];
}

export function getPostsBySport(_sport: string): BlogPost[] {
  return [];
}

export function getPostBySlug(_slug: string): BlogPost | undefined {
  return undefined;
}
