/**
 * Batch-generate isometric 3D thumbnails for all 32 learning tree nodes.
 * Uses OpenAI gpt-image-1 with topic-specific prompts in a consistent isometric style.
 */

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CONTENT_DIR = path.join(__dirname, "..");

// Base style applied to every prompt
const BASE_STYLE = `Isometric 3D illustration on a dark navy background (#0d0d1f). Clean geometric shapes, soft lighting, subtle shadows. Modern tech aesthetic. No text, no labels. Square format, suitable as a small thumbnail. Consistent isometric perspective at roughly 30-degree angle.`;

interface NodeThumbnail {
  id: string;
  title: string;
  outputPath: string;
  prompt: string;
}

const nodes: NodeThumbnail[] = [
  {
    id: "foundations/what-is-ai",
    title: "What Is AI? The Real Story",
    outputPath: "learning/foundations/what-is-ai/thumbnail.png",
    prompt: `${BASE_STYLE} A stylized isometric brain made of interconnected glowing nodes and circuits, sitting on a small platform. Warm gold (#e0a83a) and cool blue (#3dadcf) accent colors. Represents artificial intelligence as a concept.`,
  },
  {
    id: "foundations/setting-up-cursor",
    title: "Setting Up Cursor",
    outputPath: "learning/foundations/setting-up-cursor/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric laptop computer with a code editor on screen, surrounded by small floating tool icons (gear, wrench, sparkle). Purple and blue gradient accents. Represents setting up a development environment.`,
  },
  {
    id: "foundations/navigating-an-ide",
    title: "Navigating an IDE",
    outputPath: "learning/foundations/navigating-an-ide/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric code editor window with a visible file tree sidebar, tabs, and terminal panel at the bottom. Soft teal (#3dadcf) highlights on active elements. A small compass or map pin icon nearby. Represents navigating a code editor interface.`,
  },
  {
    id: "foundations/first-conversation-with-ai",
    title: "Your First Conversation with AI",
    outputPath: "learning/foundations/first-conversation-with-ai/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric chat bubble conversation — a human message bubble on one side and an AI response bubble with a sparkle icon on the other, connected by a small glowing line. Gold and purple accents. Represents having a conversation with AI.`,
  },
  {
    id: "foundations/what-is-programming",
    title: "What Is Programming?",
    outputPath: "learning/foundations/what-is-programming/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric stack of code blocks or building blocks with angle brackets (</>), arranged like puzzle pieces. A small Python logo snake shape integrated subtly. Teal and gold accents. Represents the concept of programming and code.`,
  },
  {
    id: "foundations/python-through-ai",
    title: "Python Through AI",
    outputPath: "learning/foundations/python-through-ai/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric Python snake symbol intertwined with glowing AI neural connections. The snake is stylized and geometric. Blue and gold gradient accents. Represents learning Python with AI assistance.`,
  },
  {
    id: "foundations/files-folders-terminal",
    title: "Files, Folders, and the Terminal",
    outputPath: "learning/foundations/files-folders-terminal/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric file system — stacked folders with documents peeking out, connected to a terminal/command-line window showing a blinking cursor. Green and teal accents. Represents filesystem and command line navigation.`,
  },
  {
    id: "foundations/reading-writing-data",
    title: "Reading and Writing Data",
    outputPath: "learning/foundations/reading-writing-data/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric data pipeline — a JSON document on one side flowing through a small transform gear into a structured table/spreadsheet on the other side. Orange and blue accents. Represents reading and writing data in different formats.`,
  },
  {
    id: "foundations/git-basics",
    title: "Git Basics",
    outputPath: "learning/foundations/git-basics/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric Git branch diagram — a main line with branches splitting off and merging back, shown as glowing connected nodes on small platforms. Purple and green accents. Represents version control and Git branching.`,
  },
  {
    id: "foundations/build-your-first-script",
    title: "Build Your First Script",
    outputPath: "learning/foundations/build-your-first-script/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric rocket ship on a small launchpad, with code symbols floating around it like exhaust particles. Gold and orange accents with a celebratory feel. Represents building and launching your first project.`,
  },
  {
    id: "tooling/ai-ides/cursor-deep-dive",
    title: "Cursor Deep Dive",
    outputPath: "learning/tooling/ai-ides/cursor-deep-dive/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric magnifying glass hovering over a code editor, revealing deeper layers of features underneath — like an X-ray view showing hidden panels and tools. Purple and teal accents. Represents going deep into Cursor's advanced features.`,
  },
  {
    id: "tooling/ai-ides/claude-code",
    title: "Claude Code",
    outputPath: "learning/tooling/ai-ides/claude-code/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric terminal window with a glowing command prompt, surrounded by small floating code snippets and tool icons. An orange/coral accent color (#e07a3a) with subtle sparkle effects. Represents a CLI-based AI coding agent.`,
  },
  {
    id: "intermediate/applied-ai/how-ai-apis-work",
    title: "How AI APIs Work",
    outputPath: "learning/intermediate/applied-ai/how-ai-apis-work/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric API request/response flow — a small client box sending a request arrow to a server box with a brain icon, and receiving a response arrow back. JSON brackets visible. Blue and gold accents. Represents understanding AI API architecture.`,
  },
  {
    id: "intermediate/applied-ai/prompt-engineering",
    title: "Prompt Engineering",
    outputPath: "learning/intermediate/applied-ai/prompt-engineering/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric crafting workbench with a text prompt being refined — showing drafts, arrows, and a polished final output glowing on one side. Gold and purple accents. Represents the craft of engineering reliable prompts.`,
  },
  {
    id: "intermediate/applied-ai/build-a-chatbot",
    title: "Build a Chatbot",
    outputPath: "learning/intermediate/applied-ai/build-a-chatbot/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric robot character with a friendly chat interface on its chest screen, surrounded by small speech bubbles. The robot sits on a platform. Teal and warm gold accents. Represents building a conversational AI chatbot.`,
  },
  {
    id: "intermediate/applied-ai/rag-fundamentals",
    title: "RAG Fundamentals",
    outputPath: "learning/intermediate/applied-ai/rag-fundamentals/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric scene showing documents being chunked into small pieces, flowing into a vector database (represented as a glowing cube with dot patterns), then connecting to a brain/AI icon. Blue and purple gradient accents. Represents retrieval-augmented generation.`,
  },
  {
    id: "intermediate/applied-ai/agents-and-tool-use",
    title: "Agents and Tool Use",
    outputPath: "learning/intermediate/applied-ai/agents-and-tool-use/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric AI agent (small robot or brain icon) surrounded by floating tool icons — a wrench, magnifying glass, globe, and code bracket — connected by glowing lines in a loop pattern. Gold and teal accents. Represents AI agents that use tools.`,
  },
  {
    id: "intermediate/applied-ai/build-an-agent",
    title: "Build an Agent",
    outputPath: "learning/intermediate/applied-ai/build-an-agent/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric assembly line or workbench where an AI agent robot is being constructed — body parts and circuit boards laid out, partially assembled. Orange and purple accents with a builder/maker aesthetic. Represents building an AI agent from scratch.`,
  },
  {
    id: "intermediate/applied-ai/evaluation-and-observability",
    title: "Evaluation and Observability",
    outputPath: "learning/intermediate/applied-ai/evaluation-and-observability/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric dashboard/monitoring screen showing charts, metrics, and a checklist with green checkmarks. A magnifying glass inspects one of the data points. Green and blue accents. Represents testing, evaluating, and monitoring AI systems.`,
  },

  // ── Layer 1 new nodes ──────────────────────────────────────────────────
  {
    id: "foundations/apis-and-web-basics",
    title: "APIs and Web Basics",
    outputPath: "learning/foundations/apis-and-web-basics/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric scene showing two small server/computer boxes connected by glowing HTTP request/response arrows. A floating JSON bracket symbol { } hovers above. Teal and blue accents. Represents web APIs and HTTP communication.`,
  },
  {
    id: "foundations/virtual-environments",
    title: "Virtual Environments and Dependencies",
    outputPath: "learning/foundations/virtual-environments/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric scene showing multiple translucent bubble/container domes, each containing a small Python snake icon and package boxes. The bubbles are separate, representing isolation. Green and teal accents. Represents Python virtual environments and package management.`,
  },
  {
    id: "foundations/debugging-with-ai",
    title: "Debugging with AI",
    outputPath: "learning/foundations/debugging-with-ai/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric magnifying glass hovering over a code block with a red bug icon, and an AI sparkle nearby pointing to the fix. Orange/red and gold accents. Represents using AI to find and fix bugs in code.`,
  },

  // ── Layer 2 new nodes ──────────────────────────────────────────────────
  {
    id: "intermediate/applied-ai/working-with-databases",
    title: "Working with Databases",
    outputPath: "learning/intermediate/applied-ai/working-with-databases/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric database cylinder with glowing data rows visible inside, connected by lines to a small query terminal. A table/grid of structured data floats nearby. Blue and orange accents. Represents SQL databases and data storage.`,
  },
  {
    id: "intermediate/applied-ai/web-scraping",
    title: "Web Scraping for AI",
    outputPath: "learning/intermediate/applied-ai/web-scraping/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric web browser window with HTML tags visible, and a small robotic arm or grabber extracting data elements from the page into a structured container. Teal and purple accents. Represents web scraping and data extraction.`,
  },
  {
    id: "intermediate/applied-ai/ai-data-analysis",
    title: "AI-Powered Data Analysis",
    outputPath: "learning/intermediate/applied-ai/ai-data-analysis/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric scene with a bar chart and line graph floating above a data table, with an AI brain/sparkle icon generating insights shown as small lightbulb icons. Gold and purple accents. Represents AI-assisted data analysis and visualization.`,
  },

  // ── Layer 3 new nodes ──────────────────────────────────────────────────
  {
    id: "advanced/applied-ai/structured-outputs",
    title: "Structured Outputs & Data Extraction",
    outputPath: "learning/advanced/applied-ai/structured-outputs/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric scene showing unstructured text on one side transforming through a glowing funnel/prism into a clean JSON object with a green checkmark on the other side. Purple and teal accents. Represents extracting structured data from LLM outputs.`,
  },
  {
    id: "advanced/applied-ai/advanced-rag",
    title: "Advanced RAG Patterns",
    outputPath: "learning/advanced/applied-ai/advanced-rag/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric multi-stage pipeline — documents flowing through chunk splitters, into a vector database cube, through a reranking filter, and into a glowing response. More complex than basic RAG with multiple processing stages. Blue and purple gradient accents. Represents advanced retrieval-augmented generation.`,
  },
  {
    id: "advanced/applied-ai/fine-tuning",
    title: "Fine-Tuning Fundamentals",
    outputPath: "learning/advanced/applied-ai/fine-tuning/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric neural network being adjusted — a brain/model icon with small tuning knobs and dials, training data arrows flowing in from one side, and an improved output glowing on the other. Orange and gold accents. Represents fine-tuning language models.`,
  },
  {
    id: "advanced/applied-ai/llm-security",
    title: "LLM Security & Safety",
    outputPath: "learning/advanced/applied-ai/llm-security/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric shield icon protecting an AI brain from incoming red threat arrows/darts. A lock symbol and firewall barrier visible. Red and blue accents with the shield in gold. Represents AI security and prompt injection defense.`,
  },
  {
    id: "advanced/applied-ai/ml-systems-design",
    title: "ML Systems Design",
    outputPath: "learning/advanced/applied-ai/ml-systems-design/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric architecture diagram — interconnected service boxes (API, model, cache, database, monitoring) arranged in a clean system layout with data flow arrows between them. Blue and green accents. Represents designing production ML system architectures.`,
  },
  {
    id: "advanced/applied-ai/multi-modal-ai",
    title: "Multi-Modal AI",
    outputPath: "learning/advanced/applied-ai/multi-modal-ai/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric scene showing three input types — an image/photo, an audio waveform, and a text document — all flowing into a central AI brain that produces a unified glowing output. Purple, teal, and gold accents. Represents multi-modal AI processing vision, audio, and text.`,
  },
  {
    id: "advanced/applied-ai/deploying-ai-apps",
    title: "Deploying AI Applications",
    outputPath: "learning/advanced/applied-ai/deploying-ai-apps/thumbnail.png",
    prompt: `${BASE_STYLE} An isometric Docker container/shipping container with a rocket launching from inside it, heading toward a cloud platform above. Small gear and server icons nearby. Orange and blue accents. Represents deploying AI applications to production.`,
  },
];

async function generateImage(node: NodeThumbnail): Promise<string | null> {
  console.log(`[${nodes.indexOf(node) + 1}/${nodes.length}] Generating "${node.title}"...`);

  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: node.prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
      console.error(`  No image data returned for ${node.title}`);
      return null;
    }

    const fullPath = path.join(CONTENT_DIR, node.outputPath);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, Buffer.from(imageData, "base64"));
    console.log(`  Saved: ${fullPath}`);
    return fullPath;
  } catch (err: any) {
    console.error(`  Error generating ${node.title}:`, err?.message || err);
    return null;
  }
}

async function main() {
  console.log(`\nGenerating ${nodes.length} isometric 3D thumbnails...\n`);

  const results: string[] = [];
  for (const node of nodes) {
    const result = await generateImage(node);
    if (result) results.push(result);
  }

  console.log(`\nDone! Generated ${results.length}/${nodes.length} thumbnails.`);

  if (results.length < nodes.length) {
    console.log(`\nFailed nodes:`);
    for (const node of nodes) {
      const fullPath = path.join(CONTENT_DIR, node.outputPath);
      if (!fs.existsSync(fullPath)) {
        console.log(`  - ${node.title}`);
      }
    }
  }
}

main().catch(console.error);
