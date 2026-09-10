/** Shared with network-api/src/lib/learning-graph.ts. Keep the two copies identical. */
export type GraphLesson = { id: string; title: string; prerequisites: string[] };
export type GraphChapter = { id: string; title: string; nodes: string[] };
export type LearningGraphNode = { id: string; title: string; chapter: string; lesson: boolean; count: number; color: string; x: number; y: number };
export const GRAPH_NODE_HEIGHT = 120;
const colors = ["#4f8fea", "#22d3ee", "#a855f7", "#ec4899", "#818cf8", "#38bdf8", "#c084fc"];

/** The overview is a reading path, not an aggregate of every dependency.
 * A chapter has at most one incoming branch. Opening it shows only its
 * lessons; full prerequisite lists remain in lesson details. */
export function learningGraph(chapters: GraphChapter[], lessons: GraphLesson[], expanded: string, width: number) {
  const owner = new Map(chapters.flatMap(c => c.nodes.map(id => [id, c.id] as const)));
  const existing = new Set(lessons.map(n => n.id));
  const nodes = chapters.flatMap<LearningGraphNode>((c, i) => {
    if (expanded && c.id !== expanded) return [];
    const children = lessons.filter(n => owner.get(n.id) === c.id);
    const base = { chapter: c.id, color: colors[i % colors.length], x: 0, y: 0 };
    return c.id === expanded
      ? children.map(n => ({ ...base, id: n.id, title: n.title, lesson: true, count: 1 }))
      : children.length ? [{ ...base, id: `chapter:${c.id}`, title: c.title, lesson: false, count: children.length }] : [];
  });
  const represent = (id: string) => owner.get(id) === expanded ? id : `chapter:${owner.get(id)}`;
  const edgeCounts = new Map<string, { from: string; to: string; count: number }>();
  for (const n of lessons) for (const prerequisite of n.prerequisites) {
    if (!existing.has(prerequisite) || !owner.has(prerequisite) || !owner.has(n.id)) continue;
    if (expanded && (owner.get(n.id) !== expanded || owner.get(prerequisite) !== expanded)) continue;
    const from = represent(prerequisite), to = represent(n.id);
    if (from === to) continue;
    const key = JSON.stringify([from, to]);
    const edge = edgeCounts.get(key);
    if (edge) edge.count++; else edgeCounts.set(key, { from, to, count: 1 });
  }
  const chapterOrder = new Map(chapters.map((c, i) => [`chapter:${c.id}`, i]));
  const allEdges = [...edgeCounts.values()];
  // Choose the nearest earlier prerequisite chapter. Forward-only edges
  // keep the overview a forest even if a custom curriculum contains cycles.
  const edges = expanded ? allEdges : nodes.flatMap(n => {
    const candidates = allEdges.filter(e => e.to === n.id && chapterOrder.get(e.from)! < chapterOrder.get(e.to)!);
    candidates.sort((a, b) => chapterOrder.get(b.from)! - chapterOrder.get(a.from)! || b.count - a.count);
    return candidates.slice(0, 1);
  });
  // Strongly connected components make arbitrary chapter overlays safe: a
  // cycle across groups must not hang the layout or erase a relationship.
  const adjacent = new Map(nodes.map(n => [n.id, edges.filter(e => e.from === n.id).map(e => e.to)]));
  const index = new Map<string, number>(), low = new Map<string, number>(), stack: string[] = [], active = new Set<string>();
  const components: string[][] = [];
  function visit(id: string) {
    index.set(id, index.size); low.set(id, index.get(id)!); stack.push(id); active.add(id);
    for (const next of adjacent.get(id) ?? []) {
      if (!index.has(next)) { visit(next); low.set(id, Math.min(low.get(id)!, low.get(next)!)); }
      else if (active.has(next)) low.set(id, Math.min(low.get(id)!, index.get(next)!));
    }
    if (low.get(id) === index.get(id)) {
      const component: string[] = []; let next: string;
      do { next = stack.pop()!; active.delete(next); component.push(next); } while (next !== id);
      components.push(component);
    }
  }
  nodes.forEach(n => { if (!index.has(n.id)) visit(n.id); });
  const componentOf = new Map(components.flatMap((ids, i) => ids.map(id => [id, i] as const)));
  const ranks = new Map<number, number>();
  function rank(component: number): number {
    if (ranks.has(component)) return ranks.get(component)!;
    const parents = edges.filter(e => componentOf.get(e.to) === component && componentOf.get(e.from) !== component);
    const value = parents.length ? 1 + Math.max(...parents.map(e => rank(componentOf.get(e.from)!))) : 0;
    ranks.set(component, value); return value;
  }
  const columns = width < 600 ? 1 : width < 950 ? 2 : 3;
  const nodeWidth = Math.min(260, Math.max(180, (width - 72 - (columns - 1) * 52) / columns));
  let row = 0;
  const levels = [...new Set(nodes.map(n => rank(componentOf.get(n.id)!)))].sort((a, b) => a - b);
  for (const level of levels) {
    const atLevel = nodes.filter(n => rank(componentOf.get(n.id)!) === level);
    for (let start = 0; start < atLevel.length; start += columns) {
      const batch = atLevel.slice(start, start + columns);
      const span = batch.length * nodeWidth + (batch.length - 1) * 52;
      batch.forEach((n, i) => { n.x = (width - span) / 2 + i * (nodeWidth + 52); n.y = 40 + row * (GRAPH_NODE_HEIGHT + 64); });
      row++;
    }
  }
  const byId = new Map(nodes.map(n => [n.id, n]));
  return { nodes, nodeWidth, width, height: Math.max(260, row * (GRAPH_NODE_HEIGHT + 64) + 16), edges: edges.map((e, i) => {
    const a = byId.get(e.from)!, b = byId.get(e.to)!;
    const x1 = a.x + nodeWidth / 2, y1 = a.y + GRAPH_NODE_HEIGHT, x2 = b.x + nodeWidth / 2, y2 = b.y;
    // Long/cyclic edges travel outside node columns instead of through cards.
    const lane = 12 + (i % 4) * 6;
    const path = y2 - y1 > 90 || y2 < y1
      ? `M ${a.x} ${a.y + 60} C ${lane} ${a.y + 60}, ${lane} ${b.y + 60}, ${b.x} ${b.y + 60}`
      : `M ${x1} ${y1} C ${x1} ${(y1+y2)/2}, ${x2} ${(y1+y2)/2}, ${x2} ${y2}`;
    return { ...e, path, label: expanded ? `${a.title} → ${b.title} (prerequisite)` : `${a.title} → ${b.title} (main learning path)` };
  }) };
}
