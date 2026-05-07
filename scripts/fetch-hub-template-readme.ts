/**
 * Fetches the latest README + hub.config.json schema from the
 * aain-hub-template repo and writes parsed sections to
 * site/public/hub-template-data.json. The Hub Toolkit page reads
 * this JSON at runtime so the toolkit always reflects the current
 * state of the template repo without manual sync.
 *
 * Run by: npm run build (chained from site:build) and from CI.
 *
 * No auth needed — public repo, raw.githubusercontent.com endpoints.
 */

import fs from "node:fs";
import path from "node:path";

const RAW_BASE =
    "https://raw.githubusercontent.com/ALL-Applied-AI-Network/aain-hub-template/main";

const README_URL = `${RAW_BASE}/README.md`;
const CONFIG_URL = `${RAW_BASE}/hub.config.json`;

const OUT_PATH = path.resolve(
    import.meta.dirname,
    "../site/public/hub-template-data.json",
);

interface HubTemplateData {
    fetchedAt: string;
    quickStart: string;        // markdown of the Quick Start section
    whatYouGet: string[];      // bullet points from "What you get"
    customizationFields: Array<{ field: string; description: string }>;
    demoUrl: string;
    repoUrl: string;
    error?: string;            // populated if fetch fails
}

async function fetchText(url: string): Promise<string> {
    const res = await fetch(url, { headers: { Accept: "text/plain" } });
    if (!res.ok) throw new Error(`${url} returned ${res.status}`);
    return await res.text();
}

/**
 * Pulls the section headed by `## What you get` and extracts the bullet
 * list as plain text (no markdown emphasis). Returns [] if the section
 * isn't found.
 */
function parseWhatYouGet(readme: string): string[] {
    const sectionMatch = readme.match(/##\s+What you get([\s\S]*?)(?:\n##\s|\n#\s|$)/);
    if (!sectionMatch) return [];
    const section = sectionMatch[1];
    const bullets: string[] = [];
    for (const line of section.split("\n")) {
        const m = line.match(/^\s*-\s+\*\*(.+?)\*\*\s+[—-]\s+(.+)$/);
        if (m) bullets.push(`${m[1]} — ${m[2]}`);
    }
    return bullets;
}

function parseQuickStart(readme: string): string {
    const m = readme.match(/##\s+Quick Start([\s\S]*?)(?:\n##\s|$)/);
    return m ? m[1].trim() : "";
}

function parseCustomization(
    readme: string,
): Array<{ field: string; description: string }> {
    // Matches `- **field_name`** — description` rows under the
    // Customization section.
    const m = readme.match(/##\s+Customization([\s\S]*?)(?:\n##\s|$)/);
    if (!m) return [];
    const section = m[1];
    const rows: Array<{ field: string; description: string }> = [];
    for (const line of section.split("\n")) {
        const fieldMatch = line.match(/^\s*-\s+`([\w.]+)`\s+[—-]\s+(.+)$/);
        if (fieldMatch) {
            rows.push({ field: fieldMatch[1], description: fieldMatch[2] });
        }
    }
    return rows;
}

async function main(): Promise<void> {
    console.log(`Fetching hub-template README from ${README_URL}...`);

    const fetchedAt = new Date().toISOString();
    let data: HubTemplateData;

    try {
        const readme = await fetchText(README_URL);
        data = {
            fetchedAt,
            quickStart: parseQuickStart(readme),
            whatYouGet: parseWhatYouGet(readme),
            customizationFields: parseCustomization(readme),
            demoUrl: "https://all-applied-ai-network.github.io/aain-hub-template/",
            repoUrl: "https://github.com/ALL-Applied-AI-Network/aain-hub-template",
        };
        console.log(
            `  ok — ${data.whatYouGet.length} feature bullets, ${data.customizationFields.length} config fields`,
        );
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  WARN: ${msg}. Writing empty placeholder.`);
        data = {
            fetchedAt,
            quickStart: "",
            whatYouGet: [],
            customizationFields: [],
            demoUrl: "https://all-applied-ai-network.github.io/aain-hub-template/",
            repoUrl: "https://github.com/ALL-Applied-AI-Network/aain-hub-template",
            error: msg,
        };
    }

    // Touch hub.config.json existence as a sanity check; doesn't fail
    // the build if absent.
    try {
        await fetchText(CONFIG_URL);
    } catch (err) {
        console.warn(
            `  note: couldn't fetch hub.config.json (${err instanceof Error ? err.message : err})`,
        );
    }

    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2) + "\n");
    console.log(`  wrote ${OUT_PATH}`);
}

main().catch((err) => {
    console.error("fetch-hub-template-readme failed:", err);
    process.exit(1);
});
