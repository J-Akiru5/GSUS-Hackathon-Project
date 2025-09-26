// small helpers to normalize Firestore timestamp / Date / ISO string
export function toDate(raw) {
  if (!raw && raw !== 0) return null;
  if (raw instanceof Date) return raw;
  if (raw && typeof raw.toDate === 'function') {
    try { return raw.toDate(); } catch { return null; }
  }
  // attempt parse
  const parsed = new Date(raw);
  return isNaN(parsed) ? null : parsed;
}

export function formatDateShort(raw) {
  const d = toDate(raw);
  return d ? d.toLocaleDateString() : '—';
}

export function formatDateTime(raw) {
  const d = toDate(raw);
  return d ? d.toLocaleString() : '—';
}
