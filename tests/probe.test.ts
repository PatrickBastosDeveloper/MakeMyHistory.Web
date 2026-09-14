import { test } from 'node:test';
import assert from 'node:assert/strict';

type Probe = { value: number };

test('node runs typescript tests natively', () => {
  const probe: Probe = { value: 42 };
  assert.equal(probe.value, 42);
});
