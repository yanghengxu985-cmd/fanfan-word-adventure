import assert from 'node:assert/strict';
import test from 'node:test';
import { createImageDeliveryCache, getAtlasImageDelivery, getImageDelivery } from './imageDelivery';

function deferred() {
  let resolve!: () => void;
  let reject!: () => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = () => no(new Error('offline')); });
  return { promise, resolve, reject };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('one shared download serves all crops and later subscribers use the ready image', async () => {
  const download = deferred(); let count = 0; const observed: string[] = [];
  const cache = createImageDeliveryCache(() => { count++; return download.promise; });
  const unsubscribe = cache.subscribe('/atlas.webp', () => observed.push(cache.getSnapshot('/atlas.webp').status));
  const other = cache.subscribe('/atlas.webp', () => {});
  assert.equal(count, 1); assert.equal(cache.getSnapshot('/atlas.webp').status, 'loading');
  download.resolve(); await flush();
  assert.equal(cache.getSnapshot('/atlas.webp').status, 'ready');
  unsubscribe(); other();
  cache.subscribe('/atlas.webp', () => {})();
  assert.equal(count, 1); assert.deepEqual(observed, ['loading', 'ready']);
});

test('failed downloads can retry immediately and bypass a cached failure', async () => {
  const first = deferred(), second = deferred(); const requested: string[] = [];
  const cache = createImageDeliveryCache(url => { requested.push(url); return requested.length === 1 ? first.promise : second.promise; });
  cache.subscribe('/atlas.webp?version=3', () => {});
  first.reject(); await flush(); assert.equal(cache.getSnapshot('/atlas.webp?version=3').status, 'error');
  cache.retry('/atlas.webp?version=3');
  assert.equal(cache.getSnapshot('/atlas.webp?version=3').status, 'loading');
  assert.match(requested[1], /^\/atlas\.webp\?version=3&retry=/);
  second.resolve(); await flush(); assert.equal(cache.getSnapshot('/atlas.webp?version=3').status, 'ready');
  assert.equal(cache.getSnapshot('/atlas.webp?version=3').url, requested[1]);
});

test('a late result from an old attempt cannot replace the successful retry', async () => {
  const first = deferred(), second = deferred(); let count = 0;
  const cache = createImageDeliveryCache(() => ++count === 1 ? first.promise : second.promise);
  cache.subscribe('/atlas.webp', () => {}); cache.retry('/atlas.webp');
  second.resolve(); await flush(); const snapshot = cache.getSnapshot('/atlas.webp');
  first.reject(); await flush(); assert.strictEqual(cache.getSnapshot('/atlas.webp'), snapshot);
  assert.equal(snapshot.status, 'ready');
});

test('delivery URLs respect the deployed base and retain unmapped image URLs', () => {
  const key = 'images/chinese-polished/cn-01-atlas-v3.webp';
  const raw = getImageDelivery(key, '/fanfan-word-adventure/');
  const absolute = getImageDelivery(`https://example.com/fanfan-word-adventure/${key}`, '/fanfan-word-adventure/');
  assert.deepEqual(absolute, raw);
  assert.match(raw.full, /^\/fanfan-word-adventure\/images\/chinese-delivery\//);
  assert.match(raw.preview!, /^\/fanfan-word-adventure\/images\/chinese-delivery\//);
  assert.equal(getImageDelivery('images/unmapped.webp', '/classroom/').full, '/classroom/images/unmapped.webp');
  assert.equal(getImageDelivery('/classroom/images/unmapped.webp', '/classroom/').full, '/classroom/images/unmapped.webp');
});

test('an atlas frame uses its own delivery asset while an unmapped source retains its full-sheet geometry', () => {
  const frame = getAtlasImageDelivery('images/chinese-polished/cn-01-atlas-v3.webp', 1);
  assert.equal(frame.split, true); assert.equal(frame.source, 'images/chinese-polished/cn-01-atlas-v3.webp#frame=1');
  const delivery = getImageDelivery(frame.source, '/classroom/');
  assert.notEqual(delivery.full, getImageDelivery('images/chinese-polished/cn-01-atlas-v3.webp', '/classroom/').full);
  assert.ok(!delivery.full.includes('#frame='));
  assert.deepEqual(getAtlasImageDelivery('images/unmapped.webp', 1), { source: 'images/unmapped.webp', split: false });
});
