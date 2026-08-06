const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'epistemic-profile', 'epistemic-profile-client.js'), 'utf8');

test('EP buffer flushes events emitted before transport configuration', async () => {
  const calls = [];
  let eventNo = 0;
  const context = { window: { addEventListener() {} }, crypto: { randomUUID: () => `evt-${++eventNo}` }, fetch: (...args) => { calls.push(args); return Promise.resolve({ ok: true, status: 200 }); }, setTimeout: () => 1, clearTimeout() {} };
  vm.runInNewContext(source, context);
  context.window.EpistemicProfile.startSession({ module: 'label-lab-pro' });
  context.window.EpistemicProfile.decisionMade({ response: 'supported', correctnessBand: 'supported', confidence: 'certain' });
  assert.equal(context.window.EpistemicProfile.pending().length, 2);
  await context.window.EpistemicProfile.configure({ endpoint: '/record', getToken: () => 'jwt' });
  for (let i = 0; i < 5 && calls.length < 2; i += 1) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 2);
  assert.equal(context.window.EpistemicProfile.pending().length, 0);
});

test('EP transfer remains false until explicitly completed', () => {
  const context = { window: { addEventListener() {} }, crypto: { randomUUID: () => 'evt-2' }, fetch: () => Promise.resolve({ ok: true, status: 200 }), setTimeout: () => 1, clearTimeout() {} };
  vm.runInNewContext(source, context);
  const ep = context.window.EpistemicProfile;
  ep.startSession({ module: 'label-lab-pro' });
  ep.decisionMade({ novel: true, response: 'supported', correctnessBand: 'supported' });
  assert.equal(ep.getSessionDelta().transferTouched, false);
  ep.transferCompleted({ itemId: 'session-1' });
  assert.equal(ep.getSessionDelta().transferTouched, true);
});
