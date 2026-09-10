import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const blocks = file => [...readFileSync(file, 'utf8').matchAll(/```python\n([\s\S]*?)\n```/g)].map(match => match[1]).join('\n\n');
function run(code, args = []) {
  return spawnSync('python3', ['-', ...args], { input: code, encoding: 'utf8', timeout: 10000 });
}
const api = blocks('learning/intermediate/applied-ai/how-ai-apis-work/how-ai-apis-work.md');
const simulated = run(api);
assert.equal(simulated.status, 0, simulated.stderr);
assert.ok(simulated.stdout.includes('SIMULATED:'));
assert.ok(simulated.stdout.includes('Usage: None'));
assert.equal(run(api, ['']).status, 1, 'Empty questions must fail');
const first = run(blocks('learning/foundations/first-conversation-with-ai/first-conversation-with-ai.md'));
assert.equal(first.status, 0, first.stderr);
assert.ok(first.stdout.includes('Three tests passed'));
console.log('PASS: beginner function tests, simulated API example and empty-input failure; no paid API calls.');
