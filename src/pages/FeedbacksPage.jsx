import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import './FeedbacksPage.css';
import { listenToFeedbacks } from '../services/firestoreService';

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = null;
    try {
      unsub = listenToFeedbacks((data, err) => {
        if (err) {
          setLoading(false);
          return;
        }
        setFeedbacks((data || []).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }
    return () => { if (unsub) unsub(); };
  }, []);

  return (
    <div className="page-content feedbacks-page">
      <SectionHeader
        title="Feedbacks"
        subtitle="User feedback and responses"
        actions={<div />}
      />

      <div className="card feedbacks-card">
        {loading && <div className="muted">Loading feedbacks…</div>}
        {!loading && feedbacks.length === 0 && <div className="muted">No feedback submitted yet.</div>}
        {!loading && feedbacks.length > 0 && (
          <ul className="feedback-list">
            {feedbacks.map(f => (
              <li key={f.id} className="feedback-item">
                <div className="feedback-header">
                  <strong className="feedback-subject">{f.subject || 'Feedback'}</strong>
                  <span className="feedback-meta">{f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}</span>
                </div>
                <div className="feedback-body">{f.message}</div>
                <div className="feedback-footer">From: {f.email || f.userEmail || 'Anonymous'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
