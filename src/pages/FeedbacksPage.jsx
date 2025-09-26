import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import './FeedbacksPage.css';
import { listenToFeedback } from '../services/firestoreService';
import { MessageSquare } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

// helper to compute average rating from a map-like object stored on feedback docs
const averageRatingFromMap = (mapObj) => {
  if (!mapObj || typeof mapObj !== 'object') return null;
  const vals = Object.values(mapObj).filter(v => typeof v === 'number');
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Number.isFinite(avg) ? avg : null;
};

export default function FeedbacksPage() {
  const { t } = useTranslation();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookings, setShowBookings] = useState(true);
  const [showRequests, setShowRequests] = useState(true);
  const [categories, setCategories] = useState({ Venue: true, Vehicle: true, Equipment: true });
  const printableRef = useRef(null);

  useEffect(() => {
    let unsub = null;
    try {
      unsub = listenToFeedback((data, err) => {
        if (err) {
          setLoading(false);
          return;
        }
        // Service orders by submittedAt desc already; be defensive and accept the payload as-is
        setFeedbacks(data || []);
        setLoading(false);
      });
    } catch (err) {
      void err;
      setLoading(false);
    }
    return () => { if (unsub) unsub(); };
  }, []);

  const onToggleBookings = () => setShowBookings(s => !s);
  const onToggleRequests = () => setShowRequests(s => !s);
  const onToggleCategory = (cat) => setCategories(c => ({ ...c, [cat]: !c[cat] }));

  const handlePrint = () => {
    // print only the feedbacks card area by opening a new window and writing the content
    try {
      const el = printableRef.current;
      if (!el) return window.print();
      const w = window.open('', '_blank');
      if (!w) return window.print();
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(n => n.outerHTML).join('\n');
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Feedbacks</title>${styles}</head><body>${el.innerHTML}</body></html>`);
      w.document.close();
      // allow styles to load
      setTimeout(() => { w.print(); w.close(); }, 300);
    } catch (err) {
      void err;
      window.print();
    }
  };

  return (
    <div className="page-content feedbacks-page">
      <SectionHeader
        title="Feedbacks"
        subtitle="User feedback and responses"
        actions={<div><button className="btn btn-sm btn-primary" onClick={handlePrint}>Print Feedback</button></div>}
      />

      <FilterBar
        showBookings={showBookings}
        showRequests={showRequests}
        onToggleBookings={onToggleBookings}
        onToggleRequests={onToggleRequests}
        categories={categories}
        onToggleCategory={onToggleCategory}
      />

      <div ref={printableRef}>
        <div className="card feedback-card">
          <div className="card-header">
            <MessageSquare className="icon" />
            {t('Recent Feedback')}
            <span className="feedback-count">({feedbacks.length} {t('messages')})</span>
          </div>
          <div className="card-content">
            <div className="feedback-summary">
              <div className="feedback-stat">
                <span className="stat-label">Average Rating</span>
                <span className="stat-value">{(() => {
                  const avg = averageRatingFromMap((feedbacks[0] && feedbacks[0].satisfactionRatings) ? feedbacks[0].satisfactionRatings : null);
                  return avg ? avg.toFixed(2) : 'N/A';
                })()}</span>
              </div>
              <div className="feedback-stat">
                <span className="stat-label">Total Ratings</span>
                <span className="stat-value">{feedbacks.length}</span>
              </div>
            </div>
            <div className="feedback-list">
              {loading ? (
                <p>{t('Loading feedback...')}</p>
              ) : feedbacks.length === 0 ? (
                <p>{t('No feedback available')}</p>
              ) : (
                feedbacks.map((fb, index) => {
                  const submitted = fb.submittedAt ? (fb.submittedAt instanceof Date ? fb.submittedAt : new Date(fb.submittedAt)) : null;
                  const avgRating = averageRatingFromMap(fb.satisfactionRatings) || fb.averageRating || fb.average_rating || null;
                  return (
                    <div key={fb.id || index} className="feedback-item">
                      <div className="feedback-header">
                        <div className="feedback-meta">
                          <span className="feedback-from">{fb.name || fb.subject || 'Anonymous'}</span>
                          <span className="feedback-time">{submitted ? submitted.toLocaleString() : (fb.date ? String(fb.date) : 'Unknown time')}</span>
                          <span className="feedback-from">{fb.contact ? `Contact: ${fb.contact}` : ''}</span>
                          <span className="feedback-from">{fb.region ? `Region: ${fb.region}` : ''}</span>
                        </div>
                        <div className="feedback-rating">{avgRating ? `Avg: ${Number(avgRating).toFixed(2)}` : 'No rating'}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{fb.itemTitle || fb.item_title || fb.itemId || ''}</div>
                          <div style={{ color: 'var(--color-text-light)', fontSize: 13 }}>{fb.feedbackType || fb.feedback_type || ''} • {fb.clientType || fb.client_type || ''}</div>
                          <p className="feedback-text" style={{ marginTop: 8 }}>{fb.suggestions || fb.suggestion || fb.comments || fb.message || ''}</p>
                        </div>
                        <div style={{ minWidth: 120, textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{t(fb.status || 'pending')}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 8 }}>{t('Submitted')}: {submitted ? submitted.toLocaleDateString() : (fb.submittedAt ? String(fb.submittedAt) : '—')}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
