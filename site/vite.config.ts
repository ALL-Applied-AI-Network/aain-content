import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { cpSync, existsSync, readFileSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { marked } from "marked";
import { extname } from "path";

const MIME_TYPES: Record<string, string> = {
  ".json": "application/json",
  ".md": "text/markdown",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".txt": "text/plain",
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = resolve(__dirname, "..");

export default defineConfig({
  root: resolve(__dirname),
  base: "./",
  build: {
    outDir: resolve(contentRoot, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        tree: resolve(__dirname, "tree.html"),
        article: resolve(__dirname, "article.html"),
        startAChapter: resolve(__dirname, "start-a-chapter.html"),
        // Redirect stub — keeps decks, QR codes and inbound links alive.
        toolkit: resolve(__dirname, "toolkit.html"),
        about: resolve(__dirname, "about.html"),
        playbooks: resolve(__dirname, "playbooks.html"),
        playbook: resolve(__dirname, "playbook.html"),
        impact: resolve(__dirname, "impact.html"),
        getStarted: resolve(__dirname, "get-started.html"),
        signIn: resolve(__dirname, "sign-in.html"),
        // Required by Google and LinkedIn before either will issue OAuth
        // credentials — both demand a reachable privacy policy URL.
        privacy: resolve(__dirname, "privacy.html"),
        // /product.html was consolidated into the home page (May 2026).
        // The product.css stylesheet stays — it carries the feature-row
        // visual-mock styles now used inline on index.html.
      },
    },
  },
  plugins: [
    // Inline the Getting Started guide into /start-a-chapter at build
    // time. The markdown in content/playbooks/getting-started/index.md is
    // the single source of truth for how to run a chapter — the public
    // page renders it, the dashboard fetches the same file, and nothing
    // restates it. Build-time, not runtime: the page must be static HTML
    // so it is indexable, previewable, and has nothing to fail at load.
    {
      name: "inline-getting-started",
      transformIndexHtml: {
        order: "pre" as const,
        handler(html: string, ctx: { filename?: string }) {
          if (!html.includes("<!-- GS_BODY -->")) return html;
          const md = readFileSync(
            resolve(contentRoot, "playbooks/getting-started/index.md"),
            "utf-8",
          );
          let out = marked.parse(md, { async: false }) as string;
          // marked v12 stopped emitting heading ids, and the guide's own
          // anchors plus the nav's #the-guide depend on them.
          const seen = new Map<string, number>();
          out = out.replace(
            /<(h[23])>([\s\S]*?)<\/\1>/g,
            (_m: string, tag: string, inner: string) => {
              const text = inner.replace(/<[^>]+>/g, "");
              let slug = text
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .trim()
                .replace(/\s+/g, "-");
              const n = seen.get(slug) ?? 0;
              seen.set(slug, n + 1);
              if (n) slug = `${slug}-${n}`;
              return `<${tag} id="${slug}">${inner}</${tag}>`;
            },
          );
          // The rendered markdown carries its own H1; the page already has
          // a hero, so drop it rather than shipping two titles.
          out = out.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, "");
          if (ctx.filename && !ctx.filename.includes("start-a-chapter")) {
            return html;
          }
          return html.replace("<!-- GS_BODY -->", out);
        },
      },
    },
    // In dev: serve content files (tree.json, manifest.json, learning/, etc.) from the repo root
    {
      name: "serve-content-dev",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();

          // Clean the URL (strip query params)
          const cleanUrl = req.url.split("?")[0];

          // Try to serve from content root (parent directory)
          const filePath = resolve(contentRoot, cleanUrl.replace(/^\//, ""));

          try {
            if (existsSync(filePath) && statSync(filePath).isFile()) {
              const content = readFileSync(filePath);
              const mimeType = MIME_TYPES[extname(filePath)] || "application/octet-stream";
              res.setHeader("Content-Type", mimeType);
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.end(content);
              return;
            }
          } catch {
            // Fall through to next middleware
          }

          next();
        });
      },
    },
    // At build: copy content files into dist/
    {
      name: "copy-content-build",
      closeBundle() {
        const dist = resolve(contentRoot, "dist");

        // Copy content directories
        const dirs = ["learning", "playbooks", "workshops"];
        for (const dir of dirs) {
          const src = resolve(contentRoot, dir);
          if (existsSync(src)) {
            cpSync(src, resolve(dist, dir), { recursive: true });
          }
        }

        // Copy public/ directory (logo, images, etc.)
        const publicDir = resolve(contentRoot, "public");
        if (existsSync(publicDir)) {
          cpSync(publicDir, resolve(dist, "public"), { recursive: true });
        }

        // Copy generated JSON files
        for (const file of ["tree.json", "manifest.json"]) {
          const src = resolve(contentRoot, file);
          if (existsSync(src)) {
            cpSync(src, resolve(dist, file));
          }
        }

        // Copy CNAME for GitHub Pages custom domain, plus the crawl files.
        // robots.txt / sitemap.xml must sit at the domain root to count —
        // Ad Grants ads need their landing pages crawlable.
        for (const file of ["CNAME", "robots.txt", "sitemap.xml"]) {
          const src = resolve(contentRoot, "public", file);
          if (existsSync(src)) {
            cpSync(src, resolve(dist, file));
          }
        }
      },
    },
  ],
});
