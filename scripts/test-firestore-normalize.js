// Lightweight test for the normalization logic without importing app modules.
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

console.log('Running firestore normalize tests (standalone)...');

const fakeTs = { toDate: () => new Date('2021-06-01T12:00:00Z') };
const raw = { createdAt: fakeTs, updatedAt: fakeTs, title: 'test' };
const out = normalizeDocData(raw);
assert(out.createdAt instanceof Date, 'createdAt should be Date');
assert(out.updatedAt instanceof Date, 'updatedAt should be Date');
assert(out.title === 'test', 'title should be preserved');

console.log('firestore normalize tests completed. If no FAIL lines, tests passed.');
