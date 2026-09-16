import assert from 'node:assert/strict';
import test from 'node:test';
import { ACCOUNT_APPS, readAccountMessage, orderAccounts } from '../site/ts/site-account-contract';
const payload = (accounts: unknown[]) => ({ type: 'all-ai:account-status', accounts });
const member = { kind: 'member', name: 'Brett Storoe', imageUrl: null };

test('rejects unrelated origins and wrong message shapes', () => {
  assert.equal(readAccountMessage('https://chapter.all-ai-network.org', payload([member])), null);
  assert.equal(readAccountMessage(ACCOUNT_APPS[0], { accounts: [member] }), null);
  assert.equal(readAccountMessage(ACCOUNT_APPS[0], payload([{ ...member, kind: 'sponsor' }])), null);
  assert.equal(readAccountMessage(ACCOUNT_APPS[1], payload([member])), null);
  assert.equal(readAccountMessage(ACCOUNT_APPS[0], payload([member, member])), null);
});

test('never accepts message-provided redirects or executable image URLs', () => {
  const accounts = readAccountMessage(ACCOUNT_APPS[0], payload([{ ...member, href: 'https://evil.example', imageUrl: 'javascript:alert(1)' }]));
  assert.equal(accounts?.[0].href, 'https://dashboard.all-ai-network.org/me');
  assert.equal(accounts?.[0].imageUrl, null);
});

test('keeps all valid personas and uses a deterministic primary destination', () => {
  const chapter = readAccountMessage(ACCOUNT_APPS[0], payload([{ ...member, kind: 'chapter', name: 'MSOE AI-Club' }, member]))!;
  const sponsor = readAccountMessage(ACCOUNT_APPS[1], payload([{ ...member, kind: 'sponsor' }]))!;
  const accounts = orderAccounts([...sponsor, ...chapter]);
  assert.deepEqual(accounts.map(x => x.kind), ['chapter', 'sponsor', 'member']);
  assert.deepEqual(accounts.map(x => x.href), [`${ACCOUNT_APPS[0]}/your-chapter`, `${ACCOUNT_APPS[1]}/app`, `${ACCOUNT_APPS[0]}/me`]);
});

test('an empty account array is an explicit signed-out update', () => {
  assert.deepEqual(readAccountMessage(ACCOUNT_APPS[0], payload([])), []);
});
