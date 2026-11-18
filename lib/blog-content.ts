import fs from "node:fs";
import path from "node:path";

/**
 * ============================================================================
 * FILE-BASED ARTICLES
 * ============================================================================
 *
 * Every new article is one JSON file in content/articles/<slug>.json.
 * Drop the file in, push, and the article appears on its page, the blog hub,
 * the related-articles links and the sitemap. No other file needs editing.
 *
 * Read at build time only: the blog pages and the sitemap are static.
 * The original 12 articles still live in app/blog/[slug]/page.tsx and win
 * if a JSON file ever reuses one of their slugs.
 * ============================================================================
 */

export type HubAudience = "Employee" | "Founder" | "HR" | "CA" | "Tax";

/** Icons available to JSON articles (must exist on both blog pages). */
export const CONTENT_ARTICLE_ICONS = [
  "BriefcaseBusiness",
  "Calculator",
  "FileSearch",
  "Gauge",
  "Landmark",
  "Layers3",
  "LineChart",
  "Percent",
  "Scale",
  "ShieldCheck",
  "Target",
  "TrendingUp",
  "UsersRound",
  "WalletCards",
] as const;

export type ContentArticleIcon = (typeof CONTENT_ARTICLE_ICONS)[number];

export type ContentArticle = {
  slug: string;
  /** YYYY-MM-DD */
  publishedAt: string;
  /** YYYY-MM-DD */
  updatedAt: string;
  category: string;
  stage: string;
  audience: string[];
  readTime: string;
  videoTime: string;
  title: string;
  description: string;
  keywords: string[];
  icon: ContentArticleIcon;
  quickAnswer: string[];
  heroStats: { label: string; value: string }[];
  modelCards: { label: string; value: string }[];
  sections: {
    id: string;
    title: string;
    eyebrow?: string;
    body: string[];
    bullets?: string[];
    cards?: { label: string; value: string }[];
    warning?: string;
  }[];
  personaViews: { label: string; value: string }[];
  checklist: string[];
  mistakes: string[];
  faq: { question: string; answer: string }[];
  related: string[];
  sources: { title: string; url: string }[];
  hub: {
    summary: string;
    audience: HubAudience[];
    tags: string[];
    tools: string;
  };
};

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

let cache: ContentArticle[] | null = null;

/** All JSON articles, newest first. Malformed files fail the build loudly. */
export function getContentArticles(): ContentArticle[] {
  if (cache) return cache;

  if (!fs.existsSync(ARTICLES_DIR)) {
    cache = [];
    return cache;
  }

  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((file) => file.endsWith(".json"));

  const loaded = files.map((file) => {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8");
    const article = JSON.parse(raw) as ContentArticle;

    const problems: string[] = [];
    if (!SLUG_RE.test(article.slug ?? "")) problems.push("bad slug");
    if (`${article.slug}.json` !== file) problems.push("file name must be <slug>.json");
    if (!DATE_RE.test(article.publishedAt ?? "")) problems.push("bad publishedAt");
    if (!DATE_RE.test(article.updatedAt ?? "")) problems.push("bad updatedAt");
    if (!article.title || !article.description) problems.push("missing title/description");
    if (!Array.isArray(article.sections) || article.sections.length === 0) problems.push("no sections");
    if (!CONTENT_ARTICLE_ICONS.includes(article.icon)) problems.push(`unknown icon "${article.icon}"`);
    if (!article.hub?.summary) problems.push("missing hub.summary");

    if (problems.length > 0) {
      throw new Error(`content/articles/${file}: ${problems.join(", ")}`);
    }

    return article;
  });

  cache = loaded.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return cache;
}
