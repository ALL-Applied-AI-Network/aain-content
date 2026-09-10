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
for (const {file, node} of nodes) {
  const activity = curriculum.activities[node.id as keyof typeof curriculum.activities];
  assert.ok(activity.goal && activity.needs && activity.check, `${node.id}: missing exercise details`);
  assert.ok(activity.steps.length >= 2 && activity.steps.length <= 5, `${node.id}: exercise should have 2–5 steps`);
  assert.ok(JSON.stringify(activity).length < 2400, `${node.id}: exercise is too long`);
  // The article renderer resolves the article filename relative to node.yaml.
  const article = file.replace(/node\.yaml$/, node.content_file);
  assert.ok(existsSync(article), `${node.id}: missing article ${article}`);
  assert.ok(readFileSync(article, 'utf8').trim().length > 100, `${node.id}: empty article`);
}
for (const resource of curriculum.resources) assert.equal(new URL(resource.url).protocol, 'https:');
console.log(`PASS: ${curriculum.chapters.length} chapters, ${ids.length} unique lessons with readable articles and short exercises, ${curriculum.resources.length} HTTPS resources.`);
