import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { cpSync, existsSync, readFileSync, statSync } from "fs";
import { fileURLToPath } from "url";
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
        toolkit: resolve(__dirname, "toolkit.html"),
        playbook: resolve(__dirname, "playbook.html"),
      },
    },
  },
  plugins: [
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

        // Copy CNAME for GitHub Pages custom domain
        const cname = resolve(contentRoot, "public", "CNAME");
        if (existsSync(cname)) {
          cpSync(cname, resolve(dist, "CNAME"));
        }
      },
    },
  ],
});
