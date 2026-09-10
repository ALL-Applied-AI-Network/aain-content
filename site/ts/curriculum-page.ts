import curriculum from "../../learning/curriculum.json";
import { loadTreeData, loadChapterTree, adaptChapterTree, chapterParam, nodeArticleUrl, escapeHtml as esc, type TreeJson, type TreeNode } from "./main";
import { TreeVisualization, openNodePanel } from "./tree-visualization";

const root = document.getElementById("curriculum")!;
const params = new URLSearchParams(location.search);
let topic = params.get("topic") ?? "";
let query = "";
let mode = "lessons";
let viz: TreeVisualization | null = null;
let tree: TreeJson;
let chapter: { slug: string; name: string } | null = null;
const activities = curriculum.activities as Record<string, { goal: string }>;

async function init() {
  try {
    tree = await loadTreeData();
    const slug = chapterParam();
    if (slug) {
      const overlay = await loadChapterTree(slug);
      if (overlay) {
        tree = { ...tree, nodes: adaptChapterTree(overlay), edges: overlay.edges };
        chapter = { slug, name: overlay.chapter.name };
      } else {
        document.getElementById("curriculum-notice")!.textContent = "This chapter's custom lessons couldn't load. The ALL curriculum is available below.";
      }
    }
    const highlighted = params.get("node") ?? params.get("highlight");
    if (highlighted) topic = curriculum.chapters.find(c => c.nodes.includes(highlighted))?.id ?? "custom";
    render();
  } catch {
    root.innerHTML = '<div role="alert"><h2>The lessons couldn’t load.</h2><p>Check your connection and try again.</p><button id="retry">Try again</button></div>';
    document.getElementById("retry")!.onclick = () => void init();
  }
}

function groups() {
  const known = new Set(curriculum.chapters.flatMap(c => c.nodes));
  return [...curriculum.chapters, { id: "custom", title: chapter ? `${chapter.name} lessons` : "More lessons", description: "Additional lessons from your curriculum.", level: "Additional", nodes: tree.nodes.filter(n => !known.has(n.id)).map(n => n.id) }]
    .map(c => ({ ...c, lessons: c.nodes.map(id => tree.nodes.find(n => n.id === id)).filter((n): n is TreeNode => !!n) }))
    .filter(c => c.lessons.length);
}

function lessonRow(n: TreeNode, index: number) {
  const href = nodeArticleUrl(n, chapter?.slug);
  const content = `<span class="learn-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${esc(n.title)}</strong><span class="learn-description">${esc(activities[n.id]?.goal ?? n.description)}</span></span><span class="learn-duration">${href ? `${n.estimated_minutes || ""} ${n.estimated_minutes ? "min" : "Open"} →` : "Details →"}</span>`;
  return `<li>${href ? `<a href="${esc(href)}">${content}</a>` : `<button class="learn-lesson-details" data-lesson="${esc(n.id)}">${content}</button>`}</li>`;
}

function render() {
  const chapters = groups();
  const selected = chapters.find(c => c.id === topic);
  const q = query.trim().toLowerCase();
  const hits = tree.nodes.filter(n => [n.title, n.description, ...n.tags].join(" ").toLowerCase().includes(q));
  root.innerHTML = `<div class="learn-heading"><div><a class="learn-eyebrow" href="./tree.html${chapter ? `?chapter=${encodeURIComponent(chapter.slug)}` : ""}">ALL / LEARNING TREE</a><h1>${esc(selected?.title ?? "What will you build first?")}</h1><p>${esc(selected?.description ?? "Choose a chapter. Try the exercise. Keep something you can show.")}</p></div><a class="learn-account" href="https://dashboard.all-ai-network.org/me/learn">Save learning progress ↗</a></div>
  <div class="learn-toolbar"><button id="all-chapters" ${!selected && !q ? 'disabled' : ''}>← All chapters</button><label>Find a lesson<input id="lesson-search" type="search" placeholder="Python, chatbots, retrieval…" value="${esc(query)}"></label><div class="learn-switch" aria-label="Learning view"><button id="lessons-mode" aria-pressed="${mode === "lessons"}">Lessons</button><button id="map-mode" aria-pressed="${mode === "map"}">Map</button></div></div>
  <div id="lesson-results"></div><div id="curriculum-map" ${mode === "map" ? '' : 'hidden'}></div>`;
  const results = document.getElementById("lesson-results")!;
  if (mode === "lessons") {
    if (q || selected) {
      const lessons = q ? hits : selected!.lessons;
      results.innerHTML = `${q ? `<h2>${hits.length} matching lessons</h2>` : `<p class="learn-count">${lessons.length} lessons · Follow the order, or open the lesson you need.</p>`}<ol class="learn-lessons">${lessons.map(lessonRow).join("")}</ol>${lessons.length ? '' : '<p>No matching lessons. Try a different word.</p>'}`;
    } else {
      results.innerHTML = `<p class="learn-count">${chapters.length} curriculum chapters · ${tree.nodes.length} lessons · No chapter membership needed</p><div class="learn-chapters">${chapters.map((c, i) => `<button class="learn-chapter" data-topic="${esc(c.id)}"><span class="learn-chapter-top"><span>CHAPTER ${String(i+1).padStart(2,"0")}</span><span>${esc(c.level)}</span></span><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p><span class="learn-chapter-bottom">${c.lessons.length} lessons <span>Open chapter →</span></span></button>`).join("")}</div><aside class="learn-next"><div><h2>Have an idea already?</h2><p>Start a small project and find people to work on it with you.</p></div><a href="https://dashboard.all-ai-network.org/me/build">Find a project or start one →</a></aside>`;
    }
  } else {
    results.innerHTML = `<p class="learn-count">${selected ? esc(selected.title) : "All lessons"} · Lines show prerequisites. Select a lesson to open it.</p><div class="learn-map-controls" aria-label="Map controls"><button id="map-zoom-in" aria-label="Zoom in">+</button><button id="map-zoom-out" aria-label="Zoom out">−</button><button id="map-fit">Fit all lessons</button></div>`;
    document.getElementById("map-zoom-in")!.onclick = () => viz?.zoomBy(1.5);
    document.getElementById("map-zoom-out")!.onclick = () => viz?.zoomBy(1/1.5);
    document.getElementById("map-fit")!.onclick = () => viz?.fitView();
    void drawMap(selected?.lessons ?? (q ? hits : tree.nodes));
  }
  document.getElementById("all-chapters")!.onclick = () => { topic = ""; query = ""; mode="lessons"; updateUrl(); render(); };
  root.querySelectorAll<HTMLButtonElement>("[data-topic]").forEach(button => button.onclick = () => { topic = button.dataset.topic!; updateUrl(); render(); root.querySelector("h1")?.scrollIntoView({ block: "start" }); });
  root.querySelectorAll<HTMLButtonElement>("[data-lesson]").forEach(button => button.onclick = () => {
    const lesson = tree.nodes.find(n => n.id === button.dataset.lesson);
    if (lesson) openNodePanel(lesson, tree, chapter);
  });
  for (const next of ["lessons", "map"]) document.getElementById(`${next}-mode`)!.onclick = () => { mode = next; render(); };
  const input = document.getElementById("lesson-search") as HTMLInputElement;
  input.oninput = () => { const caret = input.selectionStart; query = input.value; mode="lessons"; render(); const replacement = document.getElementById("lesson-search") as HTMLInputElement; replacement.focus(); if (replacement.type !== "search") replacement.setSelectionRange(caret, caret); };
}

function updateUrl() {
  const url = new URL(location.href);
  if (topic) url.searchParams.set("topic", topic); else url.searchParams.delete("topic");
  url.searchParams.delete("node"); url.searchParams.delete("highlight");
  history.replaceState(null, "", url);
}

async function drawMap(nodes: TreeNode[]) {
  const container = document.getElementById("curriculum-map")!;
  const current = new TreeVisualization({ container, tree, chapter, onNodeClick: n => openNodePanel(n, tree, chapter) });
  viz = current;
  try { await current.init(); if (viz === current) current.setTopicFilter(nodes.map(n => n.id), false); }
  catch { container.textContent = "The map couldn't load. The lesson list is still available."; }
}

document.addEventListener("keydown", e => { if (e.key === "Escape") document.getElementById("node-panel")?.classList.remove("open"); });
void init();
