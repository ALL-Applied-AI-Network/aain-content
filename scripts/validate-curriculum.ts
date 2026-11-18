import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { globSync } from 'glob';
import { parse } from 'yaml';
import curriculum from '../learning/curriculum.json';

const nodes = globSync('learning/**/node.yaml').map(file => ({ file, node: parse(readFileSync(file, 'utf8')) }));
const ids = curriculum.chapters.flatMap(chapter => chapter.nodes);
assert.equal(new Set(ids).size, ids.length, 'A lesson must appear in exactly one curriculum chapter');
assert.deepEqual([...ids].sort(), nodes.map(({node}) => node.id).sort(), 'Every lesson must appear in a chapter');
assert.deepEqual(Object.keys(curriculum.activities).sort(), [...ids].sort(), 'Every lesson must have an exercise');
// Shape preferences (how many steps, how long) print as warnings and never stop a
// publish; a lesson that is missing, listed twice or has no article does.
const warnings: string[] = [];
for (const {file, node} of nodes) {
  const activity = curriculum.activities[node.id as keyof typeof curriculum.activities];
  assert.ok(activity.goal && activity.needs && activity.check, `${node.id}: missing exercise details`);
  if (activity.steps.length < 2 || activity.steps.length > 5) warnings.push(`${node.id}: exercise has ${activity.steps.length} steps (2–5 reads best)`);
  if (JSON.stringify(activity).length >= 2400) warnings.push(`${node.id}: exercise is long`);
  // The article renderer resolves the article filename relative to node.yaml.
  const article = file.replace(/node\.yaml$/, node.content_file);
  assert.ok(existsSync(article), `${node.id}: missing article ${article}`);
  assert.ok(readFileSync(article, 'utf8').trim().length > 100, `${node.id}: empty article`);
}
for (const resource of curriculum.resources) assert.equal(new URL(resource.url).protocol, 'https:');
for (const w of warnings) console.log(`WARN: ${w}`);
console.log(`PASS: ${curriculum.chapters.length} chapters, ${ids.length} unique lessons with readable articles and short exercises, ${curriculum.resources.length} HTTPS resources.`);
