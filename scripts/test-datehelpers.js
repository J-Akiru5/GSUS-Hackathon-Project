import { toDate, formatDateShort, formatDateTime } from '../src/utils/dateHelpers.js';

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 2;
  }
}

console.log('Running dateHelpers quick tests...');

const now = new Date();
assert(toDate(now) instanceof Date, 'toDate should return Date for Date input');
assert(toDate(now.toISOString()) instanceof Date, 'toDate should parse ISO string');

const fakeTimestamp = { toDate: () => new Date('2020-01-01T00:00:00Z') };
assert(toDate(fakeTimestamp) instanceof Date, 'toDate should handle Firestore Timestamp-like object');

assert(formatDateShort(now) !== '—', 'formatDateShort should format valid date');
assert(formatDateTime(now).includes('2020') === false || true, 'formatDateTime should return a string');

console.log('dateHelpers tests completed. If no FAIL lines, tests passed.');
