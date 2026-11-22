#!/usr/bin/env node
/**
 * Push new/updated URLs to Bing (and the other IndexNow engines) the moment you deploy.
 *
 * Why: ChatGPT Search leans on Bing's index (OpenAI has confirmed Bing is "an
 * important" service behind it), and Copilot runs on Bing. Google ignores
 * IndexNow, so keep using Search Console's "Request indexing" for Google.
 *
 * One-time setup:
 *   1. Generate a key:  node -e "console.log(crypto.randomUUID().replace(/-/g,''))"
 *   2. Create public/<KEY>.txt whose only content is <KEY>
 *   3. Deploy, confirm https://esopvalueclarity.com/<KEY>.txt loads.
 *   4. Add INDEXNOW_KEY=<KEY> to your env (Vercel → Project → Settings → Environment Variables).
 *
 * Use after each deploy:
 *   INDEXNOW_KEY=xxxx node scripts/indexnow.mjs                 # every URL in sitemap.xml
 *   INDEXNOW_KEY=xxxx node scripts/indexnow.mjs /blog/new-post  # just these paths
 */

const HOST = "esopvalueclarity.com";
const KEY = process.env.INDEXNOW_KEY;
if (!KEY) {
  console.error("Set INDEXNOW_KEY first (see header of this file).");
  process.exit(1);
}

async function urlsFromSitemap() {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

const args = process.argv.slice(2);
const urlList = args.length
  ? args.map((p) => (p.startsWith("http") ? p : `https://${HOST}${p.startsWith("/") ? p : "/" + p}`))
  : await urlsFromSitemap();

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});

// 200 = accepted, 202 = accepted (key check pending). 403 = key file not found / mismatch.
console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URL(s)`);
if (res.status >= 400) console.log(await res.text());
