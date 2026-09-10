import curriculum from "../../learning/curriculum.json";
import { loadTreeData, loadChapterTree, adaptChapterTree, chapterParam, escapeHtml as esc, type TreeJson } from "./main";
import { openNodePanel } from "./tree-visualization";
import { learningGraph } from "./learning-graph";
import "../learning-graph.css";

const root = document.getElementById("curriculum")!;
let topic = new URLSearchParams(location.search).get("topic") ?? "";
let query = "";
let selected = "";
let tree: TreeJson;
let chapter: { slug: string; name: string } | null = null;
let observer: ResizeObserver | undefined;
const panel = document.getElementById("node-panel")!;
panel.inert = true;
new MutationObserver(() => {
  const open = panel.classList.contains("open");
  if (!open && panel.contains(document.activeElement)) root.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus({ preventScroll:true });
  panel.inert = !open;
}).observe(panel, { attributes:true, attributeFilter:["class"] });

async function init() {
  try {
    tree = await loadTreeData();
    const slug = chapterParam();
    if (slug) {
      const overlay = await loadChapterTree(slug);
      if (overlay) { tree = { ...tree, nodes: adaptChapterTree(overlay), edges: overlay.edges }; chapter = { slug, name: overlay.chapter.name }; }
      else document.getElementById("curriculum-notice")!.textContent = "This chapter's custom lessons couldn't load. The ALL curriculum is available below.";
    }
    const params = new URLSearchParams(location.search);
    selected = params.get("node") ?? params.get("highlight") ?? "";
    if (selected) topic = groups().find(c => c.nodes.includes(selected))?.id ?? "";
    render();
    if (selected) openLesson(selected);
  } catch {
    root.innerHTML = '<div role="alert"><h2>The tree couldn’t load.</h2><button id="retry">Try Again</button></div>';
    document.getElementById("retry")!.onclick = () => void init();
  }
}
function groups() {
  const known = new Set(curriculum.chapters.flatMap(c => c.nodes));
  return [...curriculum.chapters, { id: "custom", title: chapter ? chapter.name + " lessons" : "More lessons", description: "Lessons added by your chapter.", level: "Additional", nodes: tree.nodes.filter(n => !known.has(n.id)).map(n => n.id) }]
    .map(c => ({ ...c, nodes: c.nodes.filter(id => tree.nodes.some(n => n.id === id)) })).filter(c => c.nodes.length);
}
function render() {
  observer?.disconnect();
  const group = groups().find(c => c.id === topic);
  if (!group) topic = "";
  root.innerHTML = '<div class="learn-heading"><div><span class="learn-eyebrow">ALL / LEARN</span><h1>Your Learning <span class="text-grad">Tree</span></h1><p>Explore a branch. Open a chapter to see the lessons and how they connect.</p></div><a class="learn-account" href="https://dashboard.all-ai-network.org/me/learn">Save Your Progress ↗</a></div>'
    + '<div class="learn-toolbar"><button id="all-chapters" ' + (!topic ? 'disabled' : '') + '>← Collapse Chapters</button><label>Find a lesson<input id="lesson-search" type="search" placeholder="Python, chatbots, retrieval…" value="' + esc(query) + '"></label></div>'
    + '<div class="learning-graph__legend"><b>' + esc(group?.title ?? "All Curriculum Chapters") + '</b><span>Arrows connect prerequisites to what comes next. Scroll to explore.</span></div>'
    + '<div id="search-results" aria-live="polite"></div><div id="chapter-graph" class="learning-graph" role="region" tabindex="0" aria-label="Learning tree: chapters and prerequisite relationships"></div>'
    + '<aside class="learn-next"><div><h2>Put It Into Practice</h2><p>Start a project or find people to build with.</p></div><a href="https://dashboard.all-ai-network.org/me/build">Explore Projects →</a></aside>';
  document.getElementById("all-chapters")!.onclick = () => { topic = ""; selected = ""; updateUrl(); render(); };
  const input = document.getElementById("lesson-search") as HTMLInputElement;
  input.oninput = () => { query = input.value; drawSearch(); drawGraph(); };
  observer = new ResizeObserver(() => drawGraph()); observer.observe(document.getElementById("chapter-graph")!);
  drawGraph(); drawSearch();
  if (topic) requestAnimationFrame(() => {
    const element = document.querySelector<HTMLElement>('[data-expanded="true"]');
    if (element) document.getElementById("chapter-graph")!.scrollTop = Math.max(0, element.offsetTop - 32);
  });
}
function drawSearch() {
  const results = document.getElementById("search-results")!;
  const hits = query.trim() ? tree.nodes.filter(n => (n.title + " " + n.description + " " + n.tags.join(" ")).toLowerCase().includes(query.trim().toLowerCase())) : [];
  results.innerHTML = !query.trim() ? '' : '<p class="learn-count">' + hits.length + ' matching lessons</p><div class="learn-search-results">' + hits.map(n => '<button data-result="' + esc(n.id) + '">' + esc(n.title) + ' →</button>').join('') + '</div>';
  results.querySelectorAll<HTMLButtonElement>('[data-result]').forEach(b => b.onclick = () => {
    topic = groups().find(c => c.nodes.includes(b.dataset.result!))?.id ?? "";
    selected = b.dataset.result!; updateUrl(); render(); openLesson(selected);
  });
}
function drawGraph() {
  const container = document.getElementById("chapter-graph")!;
  const chapters = groups();
  // Overlay edges are authoritative, including cross-chapter prerequisites.
  const lessons = tree.nodes.map(n => ({ ...n, prerequisites: tree.edges.filter(e => e.to === n.id).map(e => e.from) }));
  const graph = learningGraph(chapters, lessons, topic, Math.max(280, container.clientWidth));
  container.innerHTML = '<div class="learning-graph__canvas" style="height:' + graph.height + 'px"><svg aria-hidden="true"><defs><marker id="tree-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10" style="fill:#687694;stroke:none"/></marker></defs>'
    + graph.edges.map(e => '<path d="' + e.path + '" marker-end="url(#tree-arrow)"><title>' + esc(e.label) + '</title></path>').join('') + '</svg>'
    + graph.nodes.map(n => {
      const parents = graph.edges.filter(e => e.to === n.id).map(e => graph.nodes.find(p => p.id === e.from)!.title);
      const match = query.trim() && tree.nodes.some(l => (n.lesson ? l.id === n.id : chapters.find(c => c.id === n.chapter)!.nodes.includes(l.id)) && l.title.toLowerCase().includes(query.trim().toLowerCase()));
      return '<button class="learning-graph__node ' + (topic && !n.lesson ? 'learning-graph__context ' : '') + (match ? 'learning-graph__node--match' : '') + '" style="left:' + n.x + 'px;top:' + n.y + 'px;width:' + graph.nodeWidth + 'px;--branch:' + n.color + '" data-id="' + esc(n.id) + '" data-chapter="' + esc(n.chapter) + '" data-expanded="' + n.lesson + '" aria-current="' + (selected === n.id) + '" aria-label="' + esc(n.title) + '. ' + (n.lesson ? 'Open lesson' : 'Expand chapter, ' + n.count + ' lessons') + '.' + (parents.length ? ' Prerequisites: ' + esc(parents.join(', ')) + '.' : '') + '"><small>' + (n.lesson ? esc(chapters.find(c => c.id === n.chapter)!.title) : 'Curriculum Chapter') + '</small><strong>' + esc(n.title) + '</strong><span>' + (n.lesson ? 'Open Lesson →' : n.count + ' lessons · Expand +') + '</span></button>';
    }).join('') + '</div>';
  container.querySelectorAll<HTMLButtonElement>('[data-id]').forEach(b => b.onclick = () => {
    if (b.dataset.expanded === 'true') openLesson(b.dataset.id!);
    else { topic = b.dataset.chapter!; selected = ""; updateUrl(); render(); }
  });
}
function openLesson(id: string) {
  const node = tree.nodes.find(n => n.id === id);
  if (!node) return;
  const activity = (curriculum.activities as Record<string, { goal: string }>)[id];
  selected = id; updateUrl(); drawGraph(); openNodePanel({ ...node, description: activity?.goal ?? node.description }, tree, chapter);
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", node.title);
  panel.scrollTop = 0;
  requestAnimationFrame(() => panel.querySelector<HTMLButtonElement>(".node-panel__close")?.focus({ preventScroll:true }));
}
function updateUrl() {
  const url = new URL(location.href);
  if (topic) url.searchParams.set("topic", topic); else url.searchParams.delete("topic");
  if (selected) url.searchParams.set("node", selected); else url.searchParams.delete("node");
  url.searchParams.delete("highlight"); history.replaceState(null, "", url);
}
document.addEventListener("keydown", e => { if (e.key === "Escape") document.getElementById("node-panel")?.classList.remove("open"); });
void init();
