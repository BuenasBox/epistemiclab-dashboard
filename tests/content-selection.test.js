const test = require('node:test');
const assert = require('node:assert/strict');
const { pickNextItem } = require('../supabase/functions/_shared/content-selection.mjs');

const items = (...ids) => ids.map((item_id) => ({ item_id }));

test('Content Selection Engine v1: with no history, picks a never-seen item deterministically per user', () => {
  const input = { eligibleItems: items('A', 'B', 'C'), history: [], lastItemId: null, userId: 'user-1' };
  const first = pickNextItem(input);
  const again = pickNextItem(input);
  assert.equal(first, again, 'same inputs must always produce the same pick (no Math.random)');
  assert.ok(['A', 'B', 'C'].includes(first));
});

test('Content Selection Engine v1: different users can get different first items (spreads load, is not insertion order)', () => {
  const base = { eligibleItems: items('A', 'B', 'C', 'D', 'E', 'F'), history: [], lastItemId: null };
  const picks = new Set(['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'].map((userId) => pickNextItem({ ...base, userId })));
  assert.ok(picks.size > 1, 'across 8 distinct users, expected more than one distinct first pick from a 6-item bank');
});

test('Content Selection Engine v1: never-seen items are always preferred over seen ones', () => {
  const picked = pickNextItem({
    eligibleItems: items('A', 'B', 'C'),
    history: [
      { item_id: 'A', last_completed_at: '2026-08-01T00:00:00Z' },
      { item_id: 'B', last_completed_at: '2026-08-02T00:00:00Z' },
    ],
    lastItemId: 'B',
    userId: 'user-1',
  });
  assert.equal(picked, 'C');
});

test('Content Selection Engine v1: once everything is seen, the least-recently-completed item is picked', () => {
  const picked = pickNextItem({
    eligibleItems: items('A', 'B', 'C'),
    history: [
      { item_id: 'A', last_completed_at: '2026-08-03T00:00:00Z' },
      { item_id: 'B', last_completed_at: '2026-08-01T00:00:00Z' }, // oldest
      { item_id: 'C', last_completed_at: '2026-08-02T00:00:00Z' },
    ],
    lastItemId: 'A',
    userId: 'user-1',
  });
  assert.equal(picked, 'B');
});

test('Content Selection Engine v1: never repeats the immediately-preceding item when an alternative exists (never-seen branch)', () => {
  // lastItemId itself is never-seen (mid-session, abandoned before completion) -- must not be re-served
  // while an alternative never-seen item exists.
  const seenCount = {};
  for (let i = 0; i < 50; i++) {
    const picked = pickNextItem({
      eligibleItems: items('A', 'B'),
      history: [],
      lastItemId: 'A',
      userId: `user-${i}`,
    });
    seenCount[picked] = (seenCount[picked] || 0) + 1;
  }
  assert.equal(seenCount.A, undefined, 'A was the last-assigned item and B was available -- A must never be picked');
  assert.ok(seenCount.B > 0);
});

test('Content Selection Engine v1: never repeats the immediately-preceding item when an alternative exists (all-seen branch)', () => {
  const picked = pickNextItem({
    eligibleItems: items('A', 'B'),
    history: [
      { item_id: 'A', last_completed_at: '2026-08-01T00:00:00Z' }, // older, would normally win
      { item_id: 'B', last_completed_at: '2026-08-02T00:00:00Z' },
    ],
    lastItemId: 'A',
    userId: 'user-1',
  });
  assert.equal(picked, 'B', 'A is the least-recently-completed AND the immediately-preceding item -- must fall back to B');
});

test('Content Selection Engine v1: falls back to repeating the same item only when it is truly the sole eligible item', () => {
  const picked = pickNextItem({ eligibleItems: items('A'), history: [], lastItemId: 'A', userId: 'user-1' });
  assert.equal(picked, 'A');
});

test('Content Selection Engine v1: returns null when there are no eligible items at all', () => {
  assert.equal(pickNextItem({ eligibleItems: [], history: [], lastItemId: null, userId: 'user-1' }), null);
});

test('Content Selection Engine v1: is a pure function -- does not mutate its inputs', () => {
  const eligibleItems = items('A', 'B', 'C');
  const history = [{ item_id: 'A', last_completed_at: '2026-08-01T00:00:00Z' }];
  const eligibleSnapshot = JSON.stringify(eligibleItems);
  const historySnapshot = JSON.stringify(history);
  pickNextItem({ eligibleItems, history, lastItemId: null, userId: 'user-1' });
  assert.equal(JSON.stringify(eligibleItems), eligibleSnapshot);
  assert.equal(JSON.stringify(history), historySnapshot);
});
