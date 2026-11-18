// Checks every content/articles/*.json before you push.
// Run: node scripts/check-articles.mjs
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "content", "articles");
const ICONS = new Set(["BriefcaseBusiness", "Calculator", "FileSearch", "Gauge", "Landmark", "Layers3", "LineChart", "Percent", "Scale", "ShieldCheck", "Target", "TrendingUp", "UsersRound", "WalletCards"]);
const HUB_AUDIENCE = new Set(["Employee", "Founder", "HR", "CA", "Tax"]);

// The original articles, listed in app/sitemap.ts.
const sitemap = fs.readFileSync(path.join(process.cwd(), "app", "sitemap.ts"), "utf8");
const listBlock = sitemap.match(/const articles = \[([\s\S]*?)\];/);
const original = new Set(listBlock ? [...listBlock[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]) : []);

const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json")) : [];
const articles = files.map((f) => ({ file: f, data: JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) }));
const allSlugs = new Set([...original, ...articles.map((a) => a.data.slug)]);

let failed = 0;
for (const { file, data: a } of articles) {
  const p = [];
  const req = ["slug", "publishedAt", "updatedAt", "category", "stage", "readTime", "videoTime", "title", "description", "icon"];
  for (const k of req) if (typeof a[k] !== "string" || !a[k].trim()) p.push(`missing ${k}`);
  const arrays = ["audience", "keywords", "quickAnswer", "heroStats", "modelCards", "sections", "personaViews", "checklist", "mistakes", "faq", "related", "sources"];
  for (const k of arrays) if (!Array.isArray(a[k]) || a[k].length === 0) p.push(`empty ${k}`);
  if (`${a.slug}.json` !== file) p.push("file name must be <slug>.json");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug ?? "")) p.push("bad slug");
  if (original.has(a.slug)) p.push("slug already used by an original article");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.publishedAt ?? "")) p.push("publishedAt must be YYYY-MM-DD");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.updatedAt ?? "")) p.push("updatedAt must be YYYY-MM-DD");
  if (!ICONS.has(a.icon)) p.push(`icon must be one of ${[...ICONS].join(", ")}`);
  if ((a.title ?? "").length > 70) p.push(`title is ${a.title.length} chars (keep it under 70)`);
  if ((a.description ?? "").length > 160) p.push(`description is ${a.description.length} chars (keep it under 160)`);
  for (const r of a.related ?? []) if (!allSlugs.has(r)) p.push(`related slug "${r}" does not exist`);
  for (const s of a.sources ?? []) if (!/^https:\/\//.test(s.url ?? "") || !s.title) p.push("each source needs a title and an https url");
  for (const s of a.sections ?? []) if (!s.id || !s.title || !Array.isArray(s.body) || s.body.length === 0) p.push(`section "${s.id}" needs id, title and body`);
  if (!a.hub?.summary || !a.hub?.tools || !Array.isArray(a.hub?.tags)) p.push("hub needs summary, tags and tools");
  for (const x of a.hub?.audience ?? []) if (!HUB_AUDIENCE.has(x)) p.push(`hub.audience "${x}" must be one of Employee, Founder, HR, CA, Tax`);
  const words = JSON.stringify([a.quickAnswer, a.sections, a.faq]).split(/\s+/).length;
  if (p.length) { failed++; console.log(`✗ ${file}\n  - ${p.join("\n  - ")}`); }
  else console.log(`✓ ${file} (~${words} words)`);
}
if (!files.length) console.log("No articles in content/articles yet.");
process.exit(failed ? 1 : 0);
