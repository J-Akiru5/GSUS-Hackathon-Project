// Inline a lightweight normalizeDocData here to avoid importing firebase config
import { toDate } from '../src/utils/dateHelpers.js';

function normalizeDocData(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const out = {};
  Object.entries(raw).forEach(([k, v]) => {
    if (v && typeof v.toDate === 'function') {
      try {
        out[k] = v.toDate();
        return;
      } catch (e) {
        out[k] = v;
        return;
      }
    }
    out[k] = v;
  });
  return out;
}

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 2;
  }
}

console.log('Running listener/normalization quick tests...');

const fakeTs = { toDate: () => new Date('2022-09-18T08:30:00Z') };
const raw = { id: 'abc123', createdAt: fakeTs, startDate: '2022-09-19T10:00:00Z', title: 'Test Event', status: 'pending' };
const out = normalizeDocData(raw);
assert(out.createdAt instanceof Date, 'createdAt should be Date');
assert(out.startDate === '2022-09-19T10:00:00Z' || typeof out.startDate === 'string', 'startDate should be preserved if string');

// verify toDate can parse both Date and firestore-like timestamp
assert(toDate(new Date()) instanceof Date, 'toDate Date input');
assert(toDate(fakeTs) instanceof Date, 'toDate Firestore-like input');
assert(toDate('2022-09-19T10:00:00Z') instanceof Date, 'toDate ISO string');

console.log('listener/normalization tests completed. If no FAIL lines, tests passed.');
