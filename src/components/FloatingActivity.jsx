import React, { useEffect, useState, useRef } from 'react';
import './FloatingActivity.css';
import { Activity, X } from 'lucide-react';
import { listenToRequests } from '../services/firestoreService';
import { toDate } from '../utils/dateHelpers';

const STORAGE_KEY = 'gsus:floatingActivity:open';

const timeAgo = (date) => {
  if (!date) return '';
  const d = toDate(date) || (date instanceof Date ? date : new Date(date));
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const FloatingActivity = () => {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'false'; } catch (e) { return true; }
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, open ? 'true' : 'false'); } catch (e) { }
  }, [open]);

  useEffect(() => {
    setLoading(true);
    const unsub = listenToRequests((data, err) => {
      if (err) { setItems([]); setLoading(false); return; }
      const sorted = (data || [])
        .map(r => ({
          id: r.id,
          actor: r.approvedBy || r.modifiedBy || r.requesterName || r.requester || 'System',
          action: r.status || 'Updated',
          target: r.id,
          timestamp: toDate(r.updatedAt || r.submittedAt || r.dateSubmitted || r.details?.submittedAt) || new Date()
        }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 6);
      setItems(sorted);
      setLoading(false);
    });
    return () => { if (unsub) unsub(); };
  }, []);

  if (!open) {
    return (
      <div className="floating-activity floating-activity--closed" ref={containerRef}>
        <button className="floating-open-btn" aria-label="Open recent activity" onClick={() => setOpen(true)}>
          <Activity size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="floating-activity" ref={containerRef} aria-live="polite">
      <div className="floating-header">
        <div className="floating-title"><Activity size={16} /> Recent Activity</div>
        <div className="floating-actions">
          <button className="btn btn-ghost" onClick={() => setOpen(false)} aria-label="Close recent activity"><X size={14} /></button>
        </div>
      </div>

      <div className="floating-list">
        {loading && <div className="floating-empty">Loading…</div>}
        {!loading && items.length === 0 && <div className="floating-empty">No recent activity.</div>}
        {items.map((it, idx) => (
          <div className="floating-card" key={it.id} style={{ top: idx * 8 + 'px' }}>
            <div className="floating-card-content">
              <div className="floating-card-title">{it.actor}</div>
              <div className="floating-card-body"><strong>{String(it.action)}</strong> request <strong>{it.target}</strong></div>
              <div className="floating-card-ts">{timeAgo(new Date(it.timestamp))}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloatingActivity;
